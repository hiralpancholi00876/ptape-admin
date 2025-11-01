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
  FlagOff
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
  const [hasLoadedPreferences, setHasLoadedPreferences] = useState(false);

  // Fetch video list from API
  const fetchVideos = async (page = 1, query = "") => {
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
          setCurrentPage(response.data.data.pagination.currentPage || 1);
        }
      } else {
        setVideoList([]);
        setTotalPages(1);
      }
    } catch (error) {
      setVideoList([]);
      setTotalPages(1);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedPage = window.localStorage.getItem("currentPage");
    const savedQuery = window.localStorage.getItem("videoSearchQuery");
    if (savedPage) {
      const parsedPage = parseInt(savedPage, 10);
      if (!Number.isNaN(parsedPage)) setCurrentPage(parsedPage);
    }
    if (savedQuery) setSearchQuery(savedQuery);
    setHasLoadedPreferences(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedPreferences) return;
    fetchVideos(currentPage, searchQuery);
  }, [currentPage, searchQuery, hasLoadedPreferences]);

  useEffect(() => {
    if (!hasLoadedPreferences || typeof window === "undefined") return;
    window.localStorage.setItem("currentPage", currentPage.toString());
    window.localStorage.setItem("videoSearchQuery", searchQuery);
  }, [currentPage, searchQuery, hasLoadedPreferences]);

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
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="transition-colors duration-200 dark:bg-gray-900 min-h-screen">
      <PageBreadcrumb pageTitle="Video Management" />
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => {
              setSearchQuery("");
              setCurrentPage(1);
            }}
            className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <span><Trash /></span>
          </button>
          <button
            onClick={() => redirect("/video/add")}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Add Video</span>
          </button>
          <button
            onClick={() => redirect("/video/drafts")}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <span>View Drafts</span>
          </button>
        </div>
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {videoList.map((video) => (
          <div
            key={video.video_id}
            className="rounded-lg overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow bg-white dark:bg-gray-800"
          >
            <div className="relative group">
              <img
                className="w-full h-48 object-cover"
                src={video.thumbnail}
                alt={video.title}
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                {formatDuration(video.duration)}
              </span>
            </div>
            <div className="flex items-center justify-center mt-2 space-x-2 bg-gray-100 dark:bg-gray-700 py-2">
              <button onClick={() => {
                redirect(`/video/details/${video.slug}`);
              }} className="p-2 rounded-full bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-gray-700">
                <Eye className="h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  redirect(`/video/edit/${video.slug}`);
                }}
                className="p-2 rounded-full bg-white dark:bg-gray-800 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-gray-700"
              >
                <Pencil className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleDelete(video.video_id)}
                className="p-2 rounded-full bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-gray-700"
              >
                <Trash className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleDmca(video.video_id, video.is_dmca)}
                className={`p-2 rounded-full ${video.is_dmca === 1
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-red-600 text-white hover:bg-red-700"
                  } dark:bg-gray-800 dark:text-red-400 dark:hover:bg-gray-700`}
              >
                {video.is_dmca === 1 ? (
                  <FlagOff className="h-5 w-5 text-white dark:text-red-400" />
                ) : (
                  <Flag className="h-5 w-5 text-white dark:text-red-400" />
                )}
              </button>
            </div>

            <div className="px-4 py-1">
              <div className="font-bold text-lg mb-1 truncate dark:text-white">{video.title}</div>
              <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mb-1">
                <span className="flex gap-1"><Eye className="h-5 w-5" /> {convertNumberToSuffix(video.views)} views</span>
                <span className="mx-1">•</span>
                <span className="flex gap-1"><Clock className="h-4 w-4" /> {timeAgo(video.upload_date)}</span>
              </div>

              <div className="mt-3">
                {video.studios.map((studio, index) => (
                  <span key={index} className="text-sm mr-1">
                    <Badge variant="solid" color="primary">
                      {studio}
                    </Badge>
                  </span>
                ))}
              </div>
            </div>

            <div className="px-4 pb-3">
              <div className="flex flex-wrap mb-4 mt-2">
                {video.pstars?.map((pstar, index) => (
                  <span
                    key={index}
                    className="inline-block bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 mr-1 mb-1"
                  >
                    {pstar}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <ToggleSwitch
                  label="Active"
                  checked={video.is_active === 1}
                  onChange={(checked) => handleToggle(video.video_id, checked)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {videoList.length === 0 && (
        <div className="text-center py-10 dark:text-gray-300">
          <p className="text-gray-500 dark:text-gray-400">No videos available</p>
        </div>
      )}
      <div className="flex justify-center mt-6">
        <button
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-l hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Previous
        </button>
        <span className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          Page {currentPage} of {totalPages}
        </span>
        <button
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-r hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Next
        </button>
      </div>
    </div>
  );
}
