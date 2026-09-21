'use client';

import { useState } from 'react';
import { useEffect, useRef } from 'react';
import {
  Plus,
  RefreshCw,
  Trash2,
  Search,
  Upload,
  Video as VideoIcon,
  Cloud,
  CheckCircle,
  X,
  Star,
} from 'lucide-react';
import { VideoSelectModal } from './VideoSelectModal';
import axios from '@/utils/axios';
import Swal from 'sweetalert2';
import { timeAgo } from '@/utils/commonFunc';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Video {
  id: number;
  title: string;
  thumbnail: string;
  link: string;
  datetime?: string;
  status: string | undefined;
  scrap_data: any;
  upload_status:
    | 'not_started'
    | 'queued'
    | 'downloading'
    | 'ffmpeg'
    | 'uploading'
    | 'completed'
    | 'failed'
    | 'stopped';
  upload_progress?: number;
  webhook_data: any;
  job_id: string | undefined;
  s3_key: string | null;
  s3_file_size: number | null;
}

interface VideoStatus {
  id: number;
  status: string;
  upload_status: Video['upload_status'];
  upload_progress: number;
}

const STATUS_FILTER_KEY = 'draftVideosStatusFilter';
const BEST_LINKS_KEY = 'draftVideosBestLinks';

const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'not_started', label: 'Not Started' },
  { value: 'queued', label: 'Queued' },
  { value: 'downloading', label: 'Downloading' },
  { value: 'ffmpeg', label: 'FFmpeg' },
  { value: 'uploading', label: 'Uploading' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'stopped', label: 'Stopped' },
  { value: 'best', label: 'Best Video' },
];

function readBestLinks(): string[] {
  try {
    const raw = localStorage.getItem(BEST_LINKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((l): l is string => typeof l === 'string') : [];
  } catch {
    return [];
  }
}

export default function DirectUploadPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLinks, setSelectedLinks] = useState<string[]>([]);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [bestLinks, setBestLinks] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Restore status filter and best links from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STATUS_FILTER_KEY);
    if (saved && STATUS_FILTER_OPTIONS.some((o) => o.value === saved)) {
      setStatusFilter(saved);
    }
    setBestLinks(readBestLinks());
  }, []);

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    localStorage.setItem(STATUS_FILTER_KEY, value);
  };

  const persistBestLinks = (links: string[]) => {
    setBestLinks(links);
    localStorage.setItem(BEST_LINKS_KEY, JSON.stringify(links));
  };

  const isBest = (link: string) => bestLinks.includes(link);

  const toggleBest = (links: string[]) => {
    const allAlreadyBest = links.length > 0 && links.every((l) => bestLinks.includes(l));
    const next = allAlreadyBest
      ? bestLinks.filter((l) => !links.includes(l))
      : Array.from(new Set([...bestLinks, ...links]));
    persistBestLinks(next);
    setSelectedLinks([]);
  };

  // Scroll to bottom button logic
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const bodyHeight = document.body.offsetHeight;
      // Show button if not at the bottom (with a small threshold)
      setShowScrollButton(scrollY + windowHeight < bodyHeight - 100);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch videos
  const {
    data: mainVideos = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['draft-videos'],
    queryFn: async () => (await axios.get<{ data: Video[] }>('/draft-videos')).data.data,
  });

  // Poll status updates
  const { data: statusUpdates } = useQuery({
    queryKey: ['draft-videos-status'],
    queryFn: async () =>
      (await axios.get<{ data: VideoStatus[] }>('/draft-videos-status')).data.data,
    refetchInterval: 2000,
    refetchIntervalInBackground: true,
    staleTime: 0,
  });

  // Merge status with videos
  const videos = mainVideos.map((video) => {
    const update = statusUpdates?.find((s) => s.id === video.id);
    return update ? { ...video, ...update } : video;
  });

  const nonBest = videos.filter((v) => !bestLinks.includes(v.link));
  const filteredVideos =
    statusFilter === 'best'
      ? videos.filter((v) => bestLinks.includes(v.link))
      : statusFilter === 'all'
        ? nonBest
        : nonBest.filter((v) => v.upload_status === statusFilter);

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (link: string) => axios.post('/delete-draft-video', { link }),
  });

  const uploadMutation = useMutation({
    mutationFn: (params: { link: string; id: number }) =>
      axios.post('/add-to-remote-upload', params),
  });

  // Selection helpers
  const isUploadable = (v: Video) =>
    (v.status === 'done' && v.upload_status === 'not_started') ||
    v.upload_status === 'stopped' ||
    v.upload_status === 'failed';

  const toggleSelect = (link: string) =>
    setSelectedLinks((prev) =>
      prev.includes(link) ? prev.filter((l) => l !== link) : [...prev, link]
    );

  const selectAll = () =>
    setSelectedLinks(
      selectedLinks.length === filteredVideos.length ? [] : filteredVideos.map((v) => v.link)
    );

  const uploadableSelected = videos.filter(
    (v) => selectedLinks.includes(v.link) && isUploadable(v)
  );

  // Actions
  const confirmAction = async (title: string, action: () => Promise<void>, successMsg: string) => {
    const result = await Swal.fire({
      title,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
    });
    if (result.isConfirmed) {
      Swal.fire({
        title: 'Processing...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });
      try {
        await action();
        queryClient.invalidateQueries({ queryKey: ['draft-videos'] });
        Swal.fire({ title: 'Success!', text: successMsg, icon: 'success', timer: 2000 });
      } catch {
        Swal.fire({ title: 'Error', icon: 'error' });
      }
    }
  };

  const handleDelete = (link: string) =>
    confirmAction(
      'Delete this video?',
      async () => void (await deleteMutation.mutateAsync(link)),
      'Deleted!'
    );

  const handleBulkDelete = () =>
    confirmAction(
      `Delete ${selectedLinks.length} videos?`,
      async () => {
        await Promise.all(selectedLinks.map((link) => deleteMutation.mutateAsync(link)));
        setSelectedLinks([]);
      },
      'Videos deleted!'
    );

  const handleUpload = (video: Video) =>
    confirmAction(
      'Start upload?',
      async () => void (await uploadMutation.mutateAsync({ link: video.link, id: video.id })),
      'Upload queued!'
    );

  const handleBulkUpload = () => {
    if (!uploadableSelected.length) {
      Swal.fire({ title: 'No eligible videos', icon: 'info' });
      return;
    }
    confirmAction(
      `Upload ${uploadableSelected.length} videos?`,
      async () => {
        await Promise.all(
          uploadableSelected.map((v) => uploadMutation.mutateAsync({ link: v.link, id: v.id }))
        );
        setSelectedLinks([]);
      },
      'Uploads queued!'
    );
  };

  const handleAddVideo = async (video: Video) => {
    Swal.fire({ title: 'Loading...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try {
      const res = await axios.get<{ data: Video }>(`/draft-videos/${video.id}`);
      const data = res.data.data;

      localStorage.setItem(
        'selectedVideo',
        JSON.stringify({
          ...data?.scrap_data,
          video_sources: [
            {
              url: data?.s3_key,
              file_size: data?.s3_file_size,
              file_type: data.webhook_data?.type || 'mp4',
              server: data.webhook_data?.server,
            },
          ],
        })
      );
      Swal.close();
      router.push('/video/add');
    } catch {
      Swal.fire({ title: 'Error', icon: 'error' });
    }
  };

  const hasSelection = selectedLinks.length > 0;
  const allSelectedAreBest =
    selectedLinks.length > 0 && selectedLinks.every((l) => bestLinks.includes(l));

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 dark:bg-gray-900">
      <div className="mx-auto space-y-6">
        {/* Header */}
        <div className="sticky top-4 z-20 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {hasSelection && (
                <button
                  onClick={() => setSelectedLinks([])}
                  className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              )}
              <h1 className="text-xl font-bold text-gray-900 md:text-2xl dark:text-white">
                {hasSelection ? `${selectedLinks.length} Selected` : 'Draft Videos'}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="h-10 cursor-pointer appearance-none rounded-xl border border-gray-200 bg-gray-100 px-3 pr-8 text-sm text-gray-700 hover:bg-gray-200 focus:ring-2 focus:ring-blue-500/30 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                {STATUS_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {hasSelection ? (
                <>
                  <button
                    onClick={() => toggleBest(selectedLinks)}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-white ${allSelectedAreBest ? 'bg-amber-500 hover:bg-amber-600' : 'bg-amber-600 hover:bg-amber-700'}`}
                  >
                    <Star className={`h-4 w-4 ${allSelectedAreBest ? 'fill-current' : ''}`} />
                    {allSelectedAreBest ? 'Unmark Best' : 'Best Video'} ({selectedLinks.length})
                  </button>
                  {uploadableSelected.length > 0 && (
                    <button
                      onClick={handleBulkUpload}
                      className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700"
                    >
                      <Cloud className="h-4 w-4" />
                      Upload ({uploadableSelected.length})
                    </button>
                  )}
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  <Plus className="h-5 w-5" />
                  <span className="hidden sm:inline">Add Video</span>
                </button>
              )}

              <button
                onClick={selectAll}
                className="rounded-xl bg-gray-100 p-2 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                <CheckCircle
                  className={`h-5 w-5 ${selectedLinks.length === filteredVideos.length && filteredVideos.length > 0 ? 'text-blue-600' : 'text-gray-500'}`}
                />
              </button>

              <button
                onClick={() => refetch()}
                className={`rounded-xl bg-gray-100 p-2 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 ${isRefetching ? 'animate-spin' : ''}`}
              >
                <RefreshCw className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-white p-4 dark:bg-gray-800">
                <div className="mb-4 aspect-video rounded-xl bg-gray-200 dark:bg-gray-700" />
                <div className="mb-2 h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            ))}
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-20 dark:border-gray-700 dark:bg-gray-800">
            <VideoIcon className="mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              {videos.length === 0
                ? 'No Draft Videos'
                : statusFilter === 'best'
                  ? 'No Best Videos'
                  : 'No Matching Videos'}
            </h3>
            <p className="max-w-sm text-center text-gray-500">
              {videos.length === 0
                ? 'Click "Add Video" to get started.'
                : statusFilter === 'best'
                  ? 'No best videos marked yet. Select drafts and click Best Video to mark them.'
                  : 'Try a different status filter.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredVideos.map((video) => {
              const isSelected = selectedLinks.includes(video.link);
              const showUpload = isUploadable(video);
              const videoIsBest = isBest(video.link);

              return (
                <div
                  key={video.id}
                  onClick={(e) => {
                    if (!(e.target as HTMLElement).closest('button')) toggleSelect(video.link);
                  }}
                  className={`group cursor-pointer overflow-hidden rounded-2xl border-2 bg-white transition-all dark:bg-gray-800 ${isSelected ? 'border-blue-500 shadow-lg' : 'border-transparent hover:border-blue-300 hover:shadow-md'}`}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-gray-100 dark:bg-gray-700">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />

                    {/* Progress bar */}
                    {['uploading', 'downloading'].includes(video.upload_status) && (
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-gray-800/50">
                        <div
                          className={`h-full ${video.upload_status === 'uploading' ? 'bg-blue-500' : 'bg-red-500'}`}
                          style={{ width: `${video.upload_progress || 0}%` }}
                        />
                      </div>
                    )}

                    {/* Selection indicator */}
                    <div
                      className={`absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-full border-2 transition ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-white/70 bg-black/30'}`}
                    >
                      {isSelected && <CheckCircle className="h-4 w-4 text-white" />}
                    </div>

                    {/* Best video badge */}
                    {videoIsBest && (
                      <span className="absolute right-2 bottom-2 flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                        <Star className="h-3 w-3 fill-current" />
                        Best
                      </span>
                    )}

                    {/* Status badge */}
                    <span
                      className={`absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs font-medium ${video.status === 'done' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'}`}
                    >
                      {video.status}
                    </span>

                    {/* Time */}
                    <span className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-0.5 text-xs text-white opacity-0 transition group-hover:opacity-100">
                      {timeAgo(video.datetime)}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="mb-2 line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white">
                      {video.title}
                    </h3>

                    {video.upload_status && (
                      <span
                        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${
                          video.upload_status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : video.upload_status === 'failed'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        <Cloud className="h-3 w-3" />
                        {video.upload_status === 'not_started'
                          ? 'Not Started'
                          : video.upload_status}
                      </span>
                    )}

                    {/* Actions */}
                    <div className="mt-4 flex gap-2 border-t border-gray-100 pt-3 dark:border-gray-700">
                      {video.status === 'done' && (
                        <button
                          onClick={() => handleAddVideo(video)}
                          className="flex-1 rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400"
                          title="Add"
                        >
                          <Plus className="mx-auto h-4 w-4" />
                        </button>
                      )}
                      {showUpload && (
                        <button
                          onClick={() => handleUpload(video)}
                          className="flex-1 rounded-lg bg-purple-50 p-2 text-purple-600 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400"
                          title="Upload"
                        >
                          <Upload className="mx-auto h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() =>
                          window.open(
                            `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(video.title)}`,
                            '_blank'
                          )
                        }
                        className="flex-1 rounded-lg bg-emerald-50 p-2 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400"
                        title="Search"
                      >
                        <Search className="mx-auto h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(video.link)}
                        className="flex-1 rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="mx-auto h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <VideoSelectModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTimeout(() => refetch(), 500);
        }}
      />
      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={handleScrollToBottom}
          className="fixed right-8 bottom-8 z-50 flex items-center justify-center rounded-full bg-blue-600 p-3 text-white shadow-lg transition-all hover:bg-blue-700"
          aria-label="Scroll to bottom"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
      {/* Bottom anchor for scroll */}
      <div ref={bottomRef} />
    </div>
  );
}
