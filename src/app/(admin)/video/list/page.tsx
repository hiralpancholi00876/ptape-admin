'use client';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import ToggleSwitch from '@/components/form/switch/Switch';
import React, { useEffect, useState } from 'react';
import Badge from '@/components/ui/badge/Badge';
import { useRouter } from 'next/navigation';
import { formatDuration, convertNumberToSuffix, timeAgo } from '@/utils/commonFunc';
import {
  Pencil,
  Trash,
  Eye,
  Clock,
  Plus,
  Flag,
  FlagOff,
  SquareCheckBig,
  Square,
  LoaderCircle,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Cloud,
} from 'lucide-react';
import axios from '@/utils/axios';
import Swal from 'sweetalert2';

interface Video {
  video_id: number;
  title: string;
  thumbnail: string;
  slug: string;
  duration: string;
  views: number;
  upload_date: string;
  studios: string[];
  pstars: string[];
  is_active: number;
  is_dmca: number;
}

function ActionButton({
  onClick,
  title,
  icon: Icon,
  hoverColor,
}: {
  onClick: (e: React.MouseEvent) => void;
  title: string;
  icon: React.ElementType;
  hoverColor: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full p-1.5 text-gray-500 sm:p-2 ${hoverColor} transition-colors`}
      title={title}
    >
      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
    </button>
  );
}

export default function VideoListPage() {
  const router = useRouter();
  const [videoList, setVideoList] = useState<Video[]>([]);
  // Resume on the last viewed page. Nothing rendered before the first fetch depends on it,
  // so reading localStorage here can't cause a hydration mismatch.
  const [currentPage, setCurrentPage] = useState(() =>
    typeof window === 'undefined' ? 1 : Number(localStorage.getItem('currentPage')) || 1
  );
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedVideos, setSelectedVideos] = useState<number[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  // Loading until the response for the current page + search has arrived.
  const requestKey = `${currentPage}:${debouncedSearch}`;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const isLoading = loadedKey !== requestKey;

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 800);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    // Ignore responses that arrive after the page or search has changed again.
    let stale = false;
    const showEmpty = () => {
      setVideoList([]);
      setTotalPages(1);
    };

    axios
      .get('/videos', { params: { page: currentPage, search: debouncedSearch || undefined } })
      .then(({ data }) => {
        if (stale) return;
        const pagination = data.data?.pagination;
        if (!data.success || !pagination) return showEmpty();

        setVideoList(data.data.videos);
        setTotalPages(pagination.totalPages || 1);
        localStorage.setItem('currentPage', String(pagination.currentPage));
      })
      .catch(() => !stale && showEmpty())
      .finally(() => !stale && setLoadedKey(requestKey));

    return () => {
      stale = true;
    };
  }, [requestKey, currentPage, debouncedSearch]);

  const changeSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
    setSelectedVideos([]);
  };

  const toggleSelectVideo = (videoId: number) => {
    setSelectedVideos((prev) =>
      prev.includes(videoId) ? prev.filter((id) => id !== videoId) : [...prev, videoId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedVideos(
      selectedVideos.length === videoList.length ? [] : videoList.map((v) => v.video_id)
    );
  };

  const handleBulkDelete = async () => {
    if (selectedVideos.length === 0) return;
    const result = await Swal.fire({
      title: `Delete ${selectedVideos.length} videos?`,
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete them!',
    });

    if (result.isConfirmed) {
      setIsDeleting(true);
      try {
        await Promise.all(selectedVideos.map((id) => axios.post(`/delete`, { id, type: 'video' })));
        setVideoList((prev) => prev.filter((video) => !selectedVideos.includes(video.video_id)));
        setSelectedVideos([]);
        Swal.fire('Deleted!', `${selectedVideos.length} videos have been deleted.`, 'success');
      } catch {
        Swal.fire('Error', 'Some videos could not be deleted.', 'error');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleDelete = async (video_id: number) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      await axios.post(`/delete`, { id: video_id, type: 'video' });
      setVideoList((prev) => prev.filter((video) => video.video_id !== video_id));
      Swal.fire('Deleted!', 'Your video has been deleted.', 'success');
    }
  };

  const handleDmca = async (video_id: number, isDmca: number) => {
    const newDmcaStatus = isDmca === 1 ? 0 : 1;
    const result = await Swal.fire({
      title: 'Are you sure?',
      text:
        newDmcaStatus === 1
          ? 'This will mark the video as DMCA takedown!'
          : 'This will remove the DMCA flag!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: newDmcaStatus === 1 ? 'Mark DMCA' : 'Remove DMCA',
    });

    if (result.isConfirmed) {
      await axios.post(`/video-dmca`, {
        video_id,
        action: newDmcaStatus === 1 ? 'remove' : 'restore',
      });
      setVideoList((prev) =>
        prev.map((video) =>
          video.video_id === video_id ? { ...video, is_dmca: newDmcaStatus } : video
        )
      );
      Swal.fire(
        'Success!',
        newDmcaStatus === 1 ? 'Video marked as DMCA.' : 'DMCA removed from video.',
        'success'
      );
    }
  };

  const handleToggle = async (video_id: number, isActive: boolean) => {
    try {
      await axios.post(`/active-inactive`, { id: video_id, type: 'video', action: isActive });
      setVideoList((prev) =>
        prev.map((video) =>
          video.video_id === video_id ? { ...video, is_active: isActive ? 1 : 0 } : video
        )
      );
    } catch {
      /* silently fail */
    }
  };

  const handlePageChange = (newPage: number) => {
    if (!isLoading && newPage > 0 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      setSelectedVideos([]);
    }
  };

  const getPaginationRange = () => {
    const delta = 2;
    const range: number[] = [1];
    const rangeWithDots: (number | string)[] = [];

    if (totalPages <= 1) return [1];

    for (let i = currentPage - delta; i <= currentPage + delta; i++) {
      if (i < totalPages && i > 1) range.push(i);
    }
    range.push(totalPages);

    let last = 0;
    for (const i of range) {
      if (last) {
        if (i - last === 2) rangeWithDots.push(last + 1);
        else if (i - last !== 1) rangeWithDots.push('...');
      }
      rangeWithDots.push(i);
      last = i;
    }
    return rangeWithDots;
  };

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-6 dark:bg-gray-900">
      <PageBreadcrumb pageTitle="Video Management" />

      {/* Batch Action Bar */}
      <div
        className={`fixed bottom-4 left-1/2 z-50 -translate-x-1/2 transition-all duration-300 sm:bottom-6 ${selectedVideos.length > 0 ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-20 opacity-0'}`}
      >
        <div className="flex items-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-2xl sm:gap-6 sm:px-6 sm:py-3 dark:border-gray-700 dark:bg-gray-800">
          <span className="text-sm font-medium whitespace-nowrap text-gray-700 sm:text-base dark:text-gray-200">
            {selectedVideos.length} selected
          </span>
          <div className="h-5 w-px bg-gray-300 sm:h-6 dark:bg-gray-600" />
          <button
            onClick={() => setSelectedVideos([])}
            className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleBulkDelete}
            disabled={isDeleting}
            className="flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-70 sm:gap-2 sm:px-4 sm:py-2"
          >
            {isDeleting ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Trash className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Delete Selected</span>
            <span className="sm:hidden">Delete</span>
          </button>
        </div>
      </div>

      {/* Header Actions */}
      <div className="mb-4 flex flex-col gap-3 sm:mb-6">
        {/* Search */}
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => changeSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pr-10 pl-10 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none sm:text-base dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          />
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          {searchQuery && (
            <button
              onClick={() => changeSearch('')}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => router.push('/video/add')}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium whitespace-nowrap text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Video</span>
          </button>

          <button
            onClick={() => router.push('/video/drafts')}
            className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium whitespace-nowrap text-white hover:bg-green-700"
          >
            <Cloud className="h-4 w-4" />
            <span>Drafts</span>
          </button>
          {videoList.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap ${
                selectedVideos.length === videoList.length
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              {selectedVideos.length === videoList.length ? (
                <SquareCheckBig className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {selectedVideos.length === videoList.length ? 'Deselect All' : 'Select All'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
        {videoList.map((video) => (
          <div
            key={video.video_id}
            onClick={(e) => {
              if (!(e.target as HTMLElement).closest('button, .clickable-area')) {
                toggleSelectVideo(video.video_id);
              }
            }}
            className={`group relative cursor-pointer overflow-hidden rounded-xl border shadow-sm transition-all hover:shadow-lg ${
              selectedVideos.includes(video.video_id)
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/50 dark:bg-blue-900/10'
                : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
            }`}
          >
            {/* Selection Checkbox */}
            <div className="absolute top-2 left-2 z-20">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSelectVideo(video.video_id);
                }}
                className={`flex h-5 w-5 items-center justify-center rounded-md border shadow-sm sm:h-6 sm:w-6 ${
                  selectedVideos.includes(video.video_id)
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-300 bg-white/90 text-transparent dark:bg-gray-800/90'
                }`}
              >
                <SquareCheckBig className="h-3 w-3 sm:h-4 sm:w-4" />
              </div>
            </div>

            {/* Thumbnail */}
            <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-gray-900">
              <img
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                src={video.thumbnail}
                alt={video.title}
                referrerPolicy="no-referrer"
              />
              <span className="absolute right-1.5 bottom-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-white sm:right-2 sm:bottom-2 sm:text-xs">
                {formatDuration(video.duration)}
              </span>
            </div>

            {/* Content */}
            <div className="clickable-area p-3 sm:p-4">
              <h3
                className="mb-2 line-clamp-2 text-sm leading-tight font-semibold text-gray-900 sm:text-base dark:text-white"
                title={video.title}
              >
                {video.title}
              </h3>

              <div className="mb-2 flex items-center gap-1.5 text-[10px] text-gray-500 sm:mb-3 dark:text-gray-400">
                <span className="flex items-center gap-0.5 text-sm">
                  <Eye className="h-4 w-4" /> {convertNumberToSuffix(video.views)}
                </span>
                <span>•</span>
                <span className="flex items-center gap-0.5 text-sm">
                  <Clock className="h-4 w-4" /> {timeAgo(video.upload_date)}
                </span>
              </div>

              <div className="mb-1.5 flex h-5 flex-wrap gap-1 sm:mb-2 sm:h-6">
                {video.studios.slice(0, 2).map((studio, i) => (
                  <Badge key={i} variant="solid" color="primary">
                    {studio}
                  </Badge>
                ))}
              </div>

              <div className="mb-3 flex h-5 flex-wrap gap-1 sm:mb-4 sm:h-6">
                {video.pstars?.slice(0, 2).map((pstar, i) => (
                  <Badge key={i} variant="solid" color="dark">
                    {pstar}
                  </Badge>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-2 sm:pt-3 dark:border-gray-700">
                <div className="flex items-center -space-x-0.5">
                  <ActionButton
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/video/details/${video.slug}`);
                    }}
                    title="View"
                    icon={Eye}
                    hoverColor="hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700"
                  />
                  <ActionButton
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/video/edit/${video.slug}`);
                    }}
                    title="Edit"
                    icon={Pencil}
                    hoverColor="hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-gray-700"
                  />
                  <ActionButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(video.video_id);
                    }}
                    title="Delete"
                    icon={Trash}
                    hoverColor="hover:text-red-600 hover:bg-red-50 dark:hover:bg-gray-700"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDmca(video.video_id, video.is_dmca);
                    }}
                    className={`rounded-full p-1.5 transition-colors sm:p-2 ${video.is_dmca ? 'bg-green-50 text-green-600 dark:bg-green-900/20' : 'text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-gray-700'}`}
                    title={video.is_dmca ? 'Remove DMCA' : 'Mark DMCA'}
                  >
                    {video.is_dmca ? (
                      <FlagOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    ) : (
                      <Flag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    )}
                  </button>
                </div>

                <div onClick={(e) => e.stopPropagation()}>
                  <ToggleSwitch
                    checked={video.is_active === 1}
                    onChange={(checked) => handleToggle(video.video_id, checked)}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Loading Skeleton */}
      {isLoading && videoList.length === 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
          {[...Array(8)].map((_, index) => (
            <div
              key={index}
              className="animate-pulse overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="aspect-video bg-gray-200 dark:bg-gray-700" />
              <div className="p-3 sm:p-4">
                <div className="mb-2 h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
                <div className="mb-3 h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="mb-3 flex gap-2">
                  <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-700" />
                </div>
                <div className="mb-2 flex gap-1">
                  <div className="h-5 w-14 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-5 w-16 rounded bg-gray-200 dark:bg-gray-700" />
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-700">
                  <div className="flex gap-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-7 w-7 rounded-full bg-gray-200 dark:bg-gray-700" />
                    ))}
                  </div>
                  <div className="h-5 w-9 rounded-full bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {videoList.length === 0 && !isLoading && (
        <div className="mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-16 sm:mt-6 sm:py-20 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="mb-3 rounded-full bg-white p-3 shadow-sm sm:mb-4 sm:p-4 dark:bg-gray-700">
            <Eye className="h-6 w-6 text-gray-400 sm:h-8 sm:w-8" />
          </div>
          <p className="text-base font-medium text-gray-900 sm:text-lg dark:text-white">
            No videos found
          </p>
          <p className="mt-1 text-xs text-gray-500 sm:text-sm dark:text-gray-400">
            Try adjusting your search
          </p>
          {searchQuery && (
            <button
              onClick={() => changeSearch('')}
              className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline sm:mt-4"
            >
              Clear Search
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {videoList.length > 0 && totalPages > 1 && (
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:gap-4">
          {/* Mobile Pagination */}
          <div className="flex items-center rounded-lg border border-gray-200 bg-white p-1 shadow-sm md:hidden dark:border-gray-700 dark:bg-gray-800">
            <button
              disabled={currentPage === 1 || isLoading}
              onClick={() => handlePageChange(currentPage - 1)}
              className="rounded-md p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="px-4 text-sm font-medium text-gray-900 dark:text-white">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages || isLoading}
              onClick={() => handlePageChange(currentPage + 1)}
              className="rounded-md p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Desktop Pagination */}
          <div className="hidden items-center gap-1 rounded-xl border border-gray-200 bg-white p-1.5 shadow-sm md:flex dark:border-gray-700 dark:bg-gray-800">
            <button
              disabled={currentPage === 1 || isLoading}
              onClick={() => handlePageChange(1)}
              className="rounded-lg p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-30 dark:hover:bg-gray-700"
              title="First"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              disabled={currentPage === 1 || isLoading}
              onClick={() => handlePageChange(currentPage - 1)}
              className="mr-2 rounded-lg p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-30 dark:hover:bg-gray-700"
              title="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1">
              {getPaginationRange().map((page, index) => (
                <React.Fragment key={index}>
                  {page === '...' ? (
                    <span className="px-2 text-sm text-gray-400">...</span>
                  ) : (
                    <button
                      disabled={isLoading}
                      onClick={() => handlePageChange(page as number)}
                      className={`h-9 min-w-[36px] rounded-lg px-3 text-sm font-medium disabled:opacity-50 ${
                        currentPage === page
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  )}
                </React.Fragment>
              ))}
            </div>

            <button
              disabled={currentPage === totalPages || isLoading}
              onClick={() => handlePageChange(currentPage + 1)}
              className="ml-2 rounded-lg p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-30 dark:hover:bg-gray-700"
              title="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              disabled={currentPage === totalPages || isLoading}
              onClick={() => handlePageChange(totalPages)}
              className="rounded-lg p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-30 dark:hover:bg-gray-700"
              title="Last"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>

          <div className="text-xs font-medium text-gray-400">
            Page {currentPage} of {totalPages}
          </div>
        </div>
      )}
    </div>
  );
}
