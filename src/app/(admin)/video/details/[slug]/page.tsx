'use client';

import React, { useState } from "react";
import axios from "@/utils/axios";
import { useRouter } from "next/navigation";
import {
    Video as VideoIcon,
    Eye,
    Clock,
    Folder,
    Link as LinkIcon,
    Server,
    Tags,
    Star,
    CheckCircle,
    XCircle,
    FileVideo,
    HardDrive,
    Calendar,
    ArrowLeft,
    Share2,
    MonitorPlay,
    Edit3,
    ExternalLink
} from 'lucide-react';
import { formatDuration, convertNumberToSuffix, timeAgo } from "@/utils/commonFunc";

export default function ViewVideoPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const router = useRouter();
    const [videoDetails, setVideoDetails] = useState<any>({});
    const [loading, setLoading] = useState<boolean>(true);

    async function fetchVideoDetails(slug: string) {
        try {
            setLoading(true);
            const response = await axios.get(`/getvideo?slug=${slug}`);

            if (response.data.success) {
                setVideoDetails(response.data.data);
            } else {
                router.push('/video/list');
            }
        } catch (error) {
            router.push('/video/list');
        } finally {
            setLoading(false);
        }
    }

    React.useEffect(() => {
        params.then((resolvedParams) => {
            fetchVideoDetails(resolvedParams.slug);
        });
    }, [params]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <VideoIcon className="w-6 h-6 text-blue-600" />
                    </div>
                </div>
                <p className="mt-4 text-gray-500 font-medium animate-pulse">Loading video details...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50 p-6 pb-20">
            <div className="max-w-[1920px] mx-auto space-y-8">

                {/* Header Navigation */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => router.push('/video/list')}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-white dark:bg-gray-800 px-4 py-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="font-medium">Back to List</span>
                    </button>

                    <div className="flex gap-3">
                        <a
                            href={`https://porntape.net/video/${videoDetails.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <ExternalLink className="w-4 h-4" />
                            <span>Public Page</span>
                        </a>
                        <button
                            onClick={() => router.push(`/video/edit/${videoDetails.slug}`)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                        >
                            <Edit3 className="w-4 h-4" />
                            <span>Edit Video</span>
                        </button>
                    </div>
                </div>

                {/* Hero / Cover Section */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* Left Column: Player Placeholder & Main Info */}
                    <div className="xl:col-span-8 space-y-8">

                        {/* Thumbnail/Player Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-1.5 shadow-xl shadow-gray-200/50 dark:shadow-black/20 border border-gray-100 dark:border-gray-700">
                            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black group">
                                <img
                                    src={videoDetails.thumbnail}
                                    alt={videoDetails.title}
                                    className="w-full h-full object-cover opacity-90 group-hover:opacity-60 transition-opacity duration-300"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 cursor-pointer">
                                        <MonitorPlay className="w-8 h-8 text-white fill-white" />
                                    </div>
                                </div>
                                <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm font-medium backdrop-blur-sm">
                                    {formatDuration(videoDetails.duration)}
                                </div>
                            </div>
                        </div>

                        {/* Title & Description */}
                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-start justify-between gap-4">
                                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                                        {videoDetails.title}
                                    </h1>
                                    <div className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${videoDetails.is_active
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                        {videoDetails.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                        {videoDetails.is_active ? 'Active' : 'Inactive'}
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-6 text-gray-500 dark:text-gray-400 text-sm border-y border-gray-100 dark:border-gray-700 py-4 my-2">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-blue-500" />
                                        <span>{timeAgo(videoDetails.upload_date)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Eye className="w-4 h-4 text-purple-500" />
                                        <span>{convertNumberToSuffix(videoDetails.views)} views</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-orange-500" />
                                        <span>{new Date(videoDetails.upload_date).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 leading-relaxed">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                        Description
                                    </h3>
                                    <p>{videoDetails.description || "No description provided."}</p>
                                </div>
                            </div>
                        </div>

                        {/* Sources List */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Server className="w-6 h-6 text-blue-600" />
                                Video Sources ({videoDetails.videoSources?.length || 0})
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                                {videoDetails?.videoSources?.length ? (
                                    videoDetails.videoSources.map((source: any, index: number) => (
                                        <div key={index} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow group">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                                        <Server className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 dark:text-white text-sm">{source.server_name || 'Generic Server'}</p>
                                                        <p className="text-xs text-gray-500">{source.quality || 'N/A'} • {source.file_type || 'N/A'}</p>
                                                    </div>
                                                </div>
                                                <div className={`w-2 h-2 rounded-full ${source.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                                            </div>

                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between py-1 border-b border-gray-50 dark:border-gray-700/50">
                                                    <span className="text-gray-500">Size</span>
                                                    <span className="font-medium dark:text-gray-300">{source.file_size ? `${source.file_size} MB` : 'Unknown'}</span>
                                                </div>
                                                <div className="flex justify-between py-1 border-b border-gray-50 dark:border-gray-700/50">
                                                    <span className="text-gray-500">Created</span>
                                                    <span className="font-medium dark:text-gray-300 text-xs">{source.created_at ? new Date(source.created_at).toLocaleDateString() : 'N/A'}</span>
                                                </div>
                                                <div className="pt-2">
                                                    <a
                                                        href={source.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:underline text-xs break-all line-clamp-1 flex items-center gap-1"
                                                        title={source.url}
                                                    >
                                                        <LinkIcon className="w-3 h-3 shrink-0" />
                                                        {source.url}
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full p-8 text-center bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-500">
                                        No sources available for this video
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Metadata & Sidebars */}
                    <div className="xl:col-span-4 space-y-8">

                        {/* Categories Box */}
                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Tags className="w-5 h-5 text-indigo-500" /> Categories
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {videoDetails?.categories?.length > 0 ? videoDetails.categories.map((category: string, index: number) => (
                                    <span key={index} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium transition-colors cursor-default border border-transparent dark:border-gray-600">
                                        {category}
                                    </span>
                                )) : <span className="text-gray-500 text-sm italic">No categories</span>}
                            </div>
                        </div>

                        {/* Pornstars Box */}
                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Star className="w-5 h-5 text-amber-500" /> Cast
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {videoDetails?.pornstars?.length > 0 ? videoDetails.pornstars.map((star: string, index: number) => (
                                    <span key={index} className="px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-300 rounded-lg text-xs font-medium border border-amber-100 dark:border-amber-900/30">
                                        {star}
                                    </span>
                                )) : <span className="text-gray-500 text-sm italic">No cast listed</span>}
                            </div>
                        </div>

                        {/* Studios Box */}
                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Folder className="w-5 h-5 text-emerald-500" /> Studios
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {videoDetails?.studios?.length > 0 ? videoDetails.studios.map((studio: string, index: number) => (
                                    <span key={index} className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs font-medium border border-emerald-100 dark:border-emerald-900/30">
                                        {studio}
                                    </span>
                                )) : <span className="text-gray-500 text-sm italic">No studio listed</span>}
                            </div>
                        </div>

                        {/* Technical Info */}
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl p-5 border border-gray-200 dark:border-gray-700">
                            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Technical Details</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Slug</span>
                                    <div className="max-w-[200px] truncate font-mono text-xs bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">
                                        {videoDetails.slug}
                                    </div>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">External ID</span>
                                    <span className="font-mono text-xs dark:text-gray-300">{videoDetails.external_id || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
