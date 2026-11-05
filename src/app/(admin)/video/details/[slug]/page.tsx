'use client';

import React, { use, useState, useEffect } from 'react';
import axios from '@/utils/axios';
import { useRouter } from 'next/navigation';
import {
  Video as VideoIcon,
  Eye,
  Clock,
  Folder,
  Link as LinkIcon,
  Server,
  Tags,
  Star,
  CircleCheckBig,
  CircleX,
  Calendar,
  ArrowLeft,
  MonitorPlay,
  PenLine,
  ExternalLink,
} from 'lucide-react';
import { formatDuration, convertNumberToSuffix, timeAgo } from '@/utils/commonFunc';

interface VideoSource {
  id: number;
  url: string;
  quality: string | null;
  file_size: number | null;
  file_type: string | null;
  // Optional extras the UI shows when the API provides them.
  is_active?: number;
  server_name?: string;
}

interface VideoDetails {
  video_id: number;
  title: string;
  description: string | null;
  upload_date: string;
  duration: number;
  thumbnail: string;
  slug: string;
  is_active: number;
  views: number;
  external_id: string | null;
  studios: string[];
  pornstars: string[];
  categories: string[];
  videoSources: VideoSource[];
}

const TAG_PANELS = [
  {
    key: 'categories',
    title: 'Categories',
    icon: <Tags className="h-4 w-4 text-indigo-500" />,
    tagClass: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    emptyText: 'No categories',
  },
  {
    key: 'pornstars',
    title: 'Cast',
    icon: <Star className="h-4 w-4 text-amber-500" />,
    tagClass: 'bg-amber-50 text-amber-900 dark:bg-amber-900/20 dark:text-amber-300',
    emptyText: 'No cast listed',
  },
  {
    key: 'studios',
    title: 'Studios',
    icon: <Folder className="h-4 w-4 text-emerald-500" />,
    tagClass: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300',
    emptyText: 'No studio listed',
  },
] as const;

export default function ViewVideoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: routeSlug } = use(params);
  const router = useRouter();
  const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSource, setActiveSource] = useState<VideoSource | null>(null);

  useEffect(() => {
    axios
      .get<{ success: boolean; data: VideoDetails }>('/getvideo', { params: { slug: routeSlug } })
      .then((res) => {
        if (!res.data.success) {
          router.push('/video/list');
          return;
        }
        setVideoDetails(res.data.data);
        const sources = res.data.data.videoSources;
        if (sources.length) {
          setActiveSource(sources.find((source) => source.is_active) || sources[0]);
        }
      })
      .catch(() => router.push('/video/list'))
      .finally(() => setLoading(false));
  }, [routeSlug, router]);

  const handlePlay = (source?: VideoSource) => {
    if (source) setActiveSource(source);
    else if (!activeSource && videoDetails?.videoSources.length) {
      setActiveSource(videoDetails.videoSources[0]);
    }
    setIsPlaying(true);
  };

  // Also covers the moment between a failed load and the redirect back to the list.
  if (loading || !videoDetails) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <VideoIcon className="absolute inset-0 m-auto h-6 w-6 text-blue-600" />
        </div>
        <p className="mt-4 animate-pulse text-gray-500">Loading video details...</p>
      </div>
    );
  }

  const {
    title,
    thumbnail,
    slug,
    is_active,
    video_id,
    upload_date,
    views,
    description,
    duration,
    videoSources,
    external_id,
  } = videoDetails;

  return (
    <div className="min-h-screen p-4 pb-20 md:p-6">
      <div className="mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => router.push('/video/list')}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-600 shadow-sm hover:text-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to List</span>
          </button>

          <div className="flex gap-2">
            <a
              href={`https://porntape.net/video/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">View</span>
            </a>
            <button
              onClick={() => router.push(`/video/edit/${slug}`)}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
            >
              <PenLine className="h-4 w-4" />
              <span className="hidden sm:inline">Edit</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: Video Player & Info */}
          <div className="space-y-6 lg:col-span-2">
            {/* Player */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-1 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              {isPlaying && activeSource ? (
                <div className="aspect-video overflow-hidden rounded-xl bg-black">
                  {activeSource.file_type === 'embed' || activeSource.url?.includes('iframe') ? (
                    <iframe src={activeSource.url} className="h-full w-full" allowFullScreen />
                  ) : (
                    <video
                      className="h-full w-full"
                      controls
                      autoPlay
                      src={activeSource.url}
                      poster={thumbnail}
                    />
                  )}
                </div>
              ) : (
                <div
                  className="group relative aspect-video cursor-pointer overflow-hidden rounded-xl bg-black"
                  onClick={() => handlePlay()}
                >
                  <img
                    src={thumbnail}
                    alt={title}
                    className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-70"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur transition-transform group-hover:scale-110">
                      <MonitorPlay className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <span className="absolute right-3 bottom-3 rounded bg-black/70 px-2 py-1 text-sm text-white">
                    {formatDuration(duration)}
                  </span>
                </div>
              )}
            </div>

            {/* Title & Meta */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <h1 className="text-xl font-bold text-gray-900 md:text-2xl dark:text-white">
                  {title}
                </h1>
                <span
                  className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}
                >
                  {is_active ? (
                    <CircleCheckBig className="h-3 w-3" />
                  ) : (
                    <CircleX className="h-3 w-3" />
                  )}
                  {is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mb-4 flex flex-wrap gap-4 border-b border-gray-100 pb-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" /> {timeAgo(upload_date)}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" /> {convertNumberToSuffix(views)} views
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> {new Date(upload_date).toLocaleDateString()}
                </span>
              </div>

              <div>
                <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">Description</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {description || 'No description provided.'}
                </p>
              </div>
            </div>

            {/* Sources */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                <Server className="h-5 w-5 text-blue-600" />
                Sources ({videoSources.length})
              </h3>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {videoSources.length ? (
                  videoSources.map((source, i) => (
                    <div
                      key={i}
                      className={`rounded-xl border bg-white p-4 shadow-sm dark:bg-gray-800 ${activeSource?.id === source.id && isPlaying ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200 dark:border-gray-700'}`}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Server className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {source.server_name || 'Server'}
                          </span>
                        </div>
                        <span
                          className={`h-2 w-2 rounded-full ${source.is_active ? 'bg-green-500' : 'bg-red-500'}`}
                        />
                      </div>

                      <div className="mb-3 space-y-1 text-xs text-gray-500">
                        <div className="flex justify-between">
                          <span>Quality</span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {source.quality || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Size</span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {source.file_size ? `${source.file_size} MB` : 'N/A'}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePlay(source)}
                          className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium ${activeSource?.id === source.id && isPlaying ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200'}`}
                        >
                          <MonitorPlay className="h-3 w-3" />
                          {activeSource?.id === source.id && isPlaying ? 'Playing' : 'Play'}
                        </button>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-gray-400 hover:text-blue-600"
                        >
                          <LinkIcon className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800">
                    No sources available
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            {TAG_PANELS.map((panel) => {
              const tags = videoDetails[panel.key];
              return (
                <div
                  key={panel.key}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                >
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                    {panel.icon} {panel.title}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.length ? (
                      tags.map((tag, i) => (
                        <span key={i} className={`rounded px-2 py-1 text-xs ${panel.tagClass}`}>
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500 italic">{panel.emptyText}</span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Technical */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
              <h4 className="mb-3 text-xs font-semibold text-gray-500 uppercase">
                Technical Details
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">ID</span>
                  <span className="font-mono text-gray-700 dark:text-gray-300">{video_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">External ID</span>
                  <span className="font-mono text-gray-700 dark:text-gray-300">
                    {external_id || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Slug</span>
                  <span className="max-w-[150px] truncate font-mono text-gray-700 dark:text-gray-300">
                    {slug}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
