'use client';
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ToggleSwitch from "@/components/form/switch/Switch";
import React, { useEffect, useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import { redirect } from "next/navigation";
import { formatDuration, convertNumberToSuffix, timeAgo } from "@/utils/commonFunc";
import {
  Pencil,
  Trash,
  Eye,
  Clock,
  Plus,
  Flag,
  FlagOff,
  CheckSquare,
  Square,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search
} from 'lucide-react';
import axios from "@/utils/axios";
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

export default function VideoListPage() {
  const [videoList, setVideoList] = useState<Video[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedVideos, setSelectedVideos] = useState<number[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load currentPage from localStorage on client side only
  useEffect(() => {
    const savedPage = localStorage.getItem("currentPage");
    if (savedPage) {
      setCurrentPage(Number(savedPage));
    }
    setIsInitialized(true); // Mark as initialized after checking localStorage
  }, []);

  // Fetch video list from API
  const fetchVideos = async (page = 1, query = "") => {
    // Prevent concurrent requests
    if (isLoading) return;

    setIsLoading(true);
    try {
      // If search query is provided, append it to the API request
      let addSearchQuery = "";
      if (query) {
        addSearchQuery = `&search=${encodeURIComponent(query)}`;
      }

      const response = await axios.get(`/videos?page=${page}${addSearchQuery}`);

      if (response.data.success) {
        if (response.data.message === "No data") {
          setVideoList([]);
          setTotalPages(1);
        } else {
          setVideoList(response.data.data.videos || []);
          setTotalPages(response.data.data.pagination.totalPages || 1);
          localStorage.setItem("currentPage", response.data.data.pagination.currentPage.toString());
          setCurrentPage(response.data.data.pagination.currentPage || 1);
        }
      } else {
        setVideoList([]);
        setTotalPages(1);
      }
    } catch (error) {
      setVideoList([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 800);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedSearch !== "") {
      setCurrentPage(1);
    }
  }, [debouncedSearch]);


  useEffect(() => {
    // Only fetch after initialization to ensure localStorage page is loaded first
    if (!isInitialized) return;

    fetchVideos(currentPage, debouncedSearch);
    setSelectedVideos([]);
  }, [currentPage, debouncedSearch, isInitialized]);

  const toggleSelectVideo = (videoId: number) => {
    setSelectedVideos(prev =>
      prev.includes(videoId)
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedVideos.length === videoList.length) {
      setSelectedVideos([]);
    } else {
      setSelectedVideos(videoList.map(v => v.video_id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedVideos.length === 0) return;

    Swal.fire({
      title: `Delete ${selectedVideos.length} videos?`,
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete them!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        setIsDeleting(true);
        try {
          // Process deletions in parallel
          await Promise.all(selectedVideos.map(id =>
            axios.post(`/delete`, { id, type: "video" })
          ));

          setVideoList(prevVideos =>
            prevVideos.filter(video => !selectedVideos.includes(video.video_id))
          );
          setSelectedVideos([]);

          Swal.fire(
            'Deleted!',
            `${selectedVideos.length} videos have been deleted.`,
            'success'
          );
        } catch (error) {
          Swal.fire(
            'Error',
            'Some videos could not be deleted.',
            'error'
          );
        } finally {
          setIsDeleting(false);
        }
      }
    });
  };

  const handleDelete = async (video_id: number) => {
    try {

      Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
      }).then(async (result) => {
        if (result.isConfirmed) {

          await axios.post(`/delete`, {
            id: video_id,
            type: "video"
          });

          // state update
          setVideoList(prevVideos =>
            prevVideos.filter(video => video.video_id !== video_id)
          );
          Swal.fire(
            'Deleted!',
            'Your video has been deleted.',
            'success'
          );
        }
      });

      return true;
    }
    catch (error) {
      return false;
    }
  };

  const handleDmca = async (video_id: number, isDmca: number) => {
    try {
      isDmca = isDmca == 1 ? 0 : 1; // Toggle DMCA status

      Swal.fire({
        title: 'Are you sure?',
        text: isDmca === 1
          ? "This will remove the DMCA takedown from the video!"
          : "restoring the video will mark it as DMCA takedown!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: isDmca === 1 ? 'Remove DMCA' : 'Restore Video'
      }).then(async (result) => {
        if (result.isConfirmed) {

          await axios.post(`/video-dmca`, {
            video_id: video_id,
            action: isDmca === 1 ? "remove" : "restore"
          });

          // state update
          setVideoList(prevVideos =>
            prevVideos.map(video =>
              video.video_id === video_id ? { ...video, is_dmca: isDmca === 1 ? 1 : 0 } : video
            )
          );
          Swal.fire(
            'Success!',
            isDmca === 1 ? 'DMCA takedown removed from video.' : 'Video marked as DMCA takedown.',
            'success'
          );
        }
      });

      return true;
    }
    catch (error) {
      return false;
    }
  }

  const handleToggle = async (video_id: number, isActive: boolean) => {
    try {
      await axios.post(`/active-inactive`, {
        id: video_id,
        type: "video",
        action: isActive
      });

      // state update
      setVideoList(prevVideos =>
        prevVideos.map(video =>
          video.video_id === video_id ? { ...video, is_active: isActive ? 1 : 0 } : video
        )
      );

      return true;
    }
    catch (error) {
      return false;
    }
  };

  const handlePageChange = (newPage: number) => {
    if (isLoading) return; // Prevent page change while loading
    if (newPage > 0 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
    }
  };

  const getPaginationRange = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots: (number | string)[] = [];
    let l;

    range.push(1);

    if (totalPages <= 1) return [1];

    for (let i = currentPage - delta; i <= currentPage + delta; i++) {
      if (i < totalPages && i > 1) {
        range.push(i);
      }
    }

    range.push(totalPages);

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  return (
    <div className="transition-colors duration-200 dark:bg-gray-900 min-h-screen p-4 md:p-6">
      <PageBreadcrumb pageTitle="Video Management" />

      {/* Batch Action Bar */}
      <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${selectedVideos.length > 0 ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
        <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-full px-6 py-3 border border-gray-200 dark:border-gray-700 flex items-center gap-6">
          <span className="text-gray-700 dark:text-gray-200 font-medium whitespace-nowrap">
            {selectedVideos.length} selected
          </span>
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
          <button
            onClick={() => setSelectedVideos([])}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleBulkDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full font-medium transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash className="w-4 h-4" />}
            Delete Selected
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="border border-gray-300 dark:border-gray-700 rounded-lg pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-gray-200"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {videoList.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${selectedVideos.length === videoList.length && videoList.length > 0
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
            >
              {selectedVideos.length === videoList.length && videoList.length > 0 ? (
                <CheckSquare className="w-5 h-5" />
              ) : (
                <Square className="w-5 h-5" />
              )}
              <span>{selectedVideos.length === videoList.length ? 'Deselect All' : 'Select All'}</span>
            </button>
          )}

          <button
            onClick={() => redirect("/video/add")}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow whitespace-nowrap"
          >
            <Plus className="h-5 w-5" />
            <span>Add Video</span>
          </button>

          <button
            onClick={() => redirect("/video/drafts")}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm hover:shadow whitespace-nowrap"
          >
            <span>View Drafts</span>
          </button>
        </div>
      </div>



      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {videoList.map((video) => (
          <div
            key={video.video_id}
            onClick={(e) => {
              // Allow selecting by clicking card background, but avoid conflicting with buttons
              if (!(e.target as HTMLElement).closest('button') && !(e.target as HTMLElement).closest('.clickable-area')) {
                toggleSelectVideo(video.video_id);
              }
            }}
            className={`relative rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 border cursor-pointer group ${selectedVideos.includes(video.video_id)
              ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/10'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
          >
            {/* Selection Checkbox Overlay */}
            <div className="absolute top-3 left-3 z-20">
              <div
                onClick={(e) => { e.stopPropagation(); toggleSelectVideo(video.video_id); }}
                className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all shadow-sm ${selectedVideos.includes(video.video_id)
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white/90 border-gray-300 hover:border-blue-400 text-transparent dark:bg-gray-800/90 dark:border-gray-600'
                  }`}>
                <CheckSquare className="w-4 h-4 pointer-events-none" />
              </div>
            </div>

            <div className="relative aspect-video bg-gray-100 dark:bg-gray-900 overflow-hidden">
              <img
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                src={video.thumbnail}
                alt={video.title}
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded font-medium">
                {formatDuration(video.duration)}
              </span>
            </div>

            {/* Content Area - Mark buttons as clickable-area to prevent row selection */}
            <div className="p-4 clickable-area">
              <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2 leading-tight" title={video.title}>
                {video.title}
              </h3>

              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-3 space-x-2">
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {convertNumberToSuffix(video.views)}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {timeAgo(video.upload_date)}</span>
              </div>

              <div className="flex flex-wrap gap-1 mb-2 h-6 overflow-hidden">
                {video.studios.slice(0, 2).map((studio, i) => (
                  <Badge key={i} variant="solid" color="primary" className="text-[10px] px-1.5 py-0.5">{studio}</Badge>
                ))}
              </div>

              <div className="flex flex-wrap gap-1 mb-4 h-6 overflow-hidden">
                {video.pstars?.slice(0, 2).map((pstar, i) => (
                  <Badge key={i} variant="solid" color="dark" className="text-[10px] px-1.5 py-0.5">{pstar}</Badge>
                ))}
              </div>

              {/* Actions Toolbar */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center -space-x-1">
                  <button onClick={(e) => { e.stopPropagation(); redirect(`/video/details/${video.slug}`); }}
                    className="p-2 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 dark:hover:text-blue-400 transition-colors" title="View Details">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); redirect(`/video/edit/${video.slug}`); }}
                    className="p-2 rounded-full text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-gray-700 dark:hover:text-yellow-400 transition-colors" title="Edit Video">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(video.video_id); }}
                    className="p-2 rounded-full text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 dark:hover:text-red-400 transition-colors" title="Delete Video">
                    <Trash className="w-4 h-4" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDmca(video.video_id, video.is_dmca); }}
                    className={`p-2 rounded-full transition-colors ${video.is_dmca ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-gray-700'}`}
                    title={video.is_dmca ? "Remove DMCA" : "Mark DMCA"}>
                    {video.is_dmca ? <FlagOff className="w-4 h-4" /> : <Flag className="w-4 h-4" />}
                  </button>
                </div>

                <div onClick={(e) => e.stopPropagation()}>
                  <ToggleSwitch
                    label=""
                    size="sm"
                    checked={video.is_active === 1}
                    onChange={(checked) => handleToggle(video.video_id, checked)}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Skeleton Loading View */}
      {isLoading && videoList.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <div
              key={index}
              className="relative rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 animate-pulse"
            >
              {/* Thumbnail Skeleton */}
              <div className="aspect-video bg-gray-200 dark:bg-gray-700" />

              {/* Content Skeleton */}
              <div className="p-4">
                {/* Title */}
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />

                {/* Meta info */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                </div>

                {/* Badges */}
                <div className="flex gap-1 mb-2">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-14" />
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                </div>
                <div className="flex gap-1 mb-4">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-12" />
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-14" />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex gap-2">
                    <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  </div>
                  <div className="h-6 w-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* {videoList.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 mt-6">
          <div className="bg-white dark:bg-gray-700 p-4 rounded-full shadow-sm mb-4">
            <Eye className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-gray-900 dark:text-white font-medium text-lg">No videos found</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Try adjusting your search criteria</p>
          <button
            onClick={() => { setSearchQuery(""); setCurrentPage(1); }}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm hover:underline"
          >
            Clear Filters
          </button>
        </div>
      )} */}

      {/* Pagination */}
      {videoList.length > 0 && totalPages > 1 && (
        <div className="flex flex-col items-center justify-center mt-10 gap-4">
          {/* Mobile: Simple Prev/Next */}
          <div className="md:hidden flex items-center bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-1">
            <button
              disabled={currentPage === 1 || isLoading}
              onClick={() => handlePageChange(currentPage - 1)}
              className="p-2 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 text-sm font-medium text-gray-900 dark:text-white">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages || isLoading}
              onClick={() => handlePageChange(currentPage + 1)}
              className="p-2 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Desktop: Full Pagination */}
          <div className="hidden md:flex items-center bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-1.5 gap-1">
            <button
              disabled={currentPage === 1 || isLoading}
              onClick={() => handlePageChange(1)}
              className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700/50 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              disabled={currentPage === 1 || isLoading}
              onClick={() => handlePageChange(currentPage - 1)}
              className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700/50 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all mr-2"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1">
              {getPaginationRange().map((page, index) => (
                <React.Fragment key={index}>
                  {page === '...' ? (
                    <span className="px-2 text-gray-400 dark:text-gray-500 text-sm">...</span>
                  ) : (
                    <button
                      disabled={isLoading}
                      onClick={() => handlePageChange(page as number)}
                      className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${currentPage === page
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
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
              className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700/50 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all ml-2"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              disabled={currentPage === totalPages || isLoading}
              onClick={() => handlePageChange(totalPages)}
              className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700/50 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs text-gray-400 dark:text-gray-500 font-medium">
            Showing page {currentPage} of {totalPages}
          </div>
        </div>
      )}
    </div>
  );
}
