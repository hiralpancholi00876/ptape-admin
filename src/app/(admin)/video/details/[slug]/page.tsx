'use client';
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import React from "react";
import axios from "@/utils/axios";
import { useRouter } from "next/navigation";
import { Video, Eye, Clock, Folder, Link, Server, Tags, Star, CheckCircle, XCircle, FileVideo, HardDrive, Calendar, ArrowLeft } from 'lucide-react';
import { formatDuration, convertNumberToSuffix, timeAgo } from "@/utils/commonFunc";

export default function ViewVideoPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const router = useRouter();
    const [videoDetails, setVideoDetails] = React.useState<any>({});
    const [loading, setLoading] = React.useState<boolean>(true);

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

    return (
        <div>
            {loading ? (
                <div className="flex justify-center items-center h-screen">
                    <div className="loader border-t-4 border-blue-500 rounded-full w-12 h-12 animate-spin"></div>
                </div>
            ) : (
                <>
                    <PageBreadcrumb pageTitle="Video Details" />
                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                        <div className="space-y-6">
                            <ComponentCard title="Video Details">
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="flex items-center">
                                        <Video className="inline-block w-6 h-6 mr-2 text-blue-500" />
                                        <p className="text-base font-medium text-gray-700 dark:text-gray-300">
                                            <strong>Title:</strong> {videoDetails.title}
                                        </p>
                                    </div>
                                    <div className="flex items-center">
                                        <p className="text-base font-medium text-gray-700 dark:text-gray-300">
                                            <strong><Eye className="inline-block w-6 h-6 mr-2 text-green-500" /> Description:</strong> {videoDetails.description}
                                        </p>
                                    </div>
                                    <div className="flex items-center">
                                        <Clock className="inline-block w-6 h-6 mr-2 text-yellow-500" />
                                        <p className="text-base font-medium text-gray-700 dark:text-gray-300">
                                            <strong>Date:</strong> {new Date(videoDetails.upload_date).toLocaleString()} - ( {timeAgo(videoDetails.upload_date)} )
                                        </p>
                                    </div>
                                    <div className="flex items-center">
                                        <Clock className="inline-block w-6 h-6 mr-2 text-yellow-500" />
                                        <p className="text-base font-medium text-gray-700 dark:text-gray-300">
                                            <strong>Duration:</strong> {formatDuration(videoDetails.duration)}
                                        </p>
                                    </div>
                                    <div className="flex items-center">
                                        <Eye className="inline-block w-6 h-6 mr-2 text-purple-500" />
                                        <p className="text-base font-medium text-gray-700 dark:text-gray-300">
                                            <strong>Views:</strong> {convertNumberToSuffix(videoDetails.views)} - {videoDetails.views}
                                        </p>
                                    </div>
                                    <div className="flex items-center">
                                        <Folder className="inline-block w-6 h-6 mr-2 text-gray-500" />
                                        <p className="text-base font-medium text-gray-700 dark:text-gray-300">
                                            <strong>Slug:</strong> {videoDetails.slug}
                                        </p>
                                    </div>
                                    <div className="flex items-center">
                                        <Link className="inline-block w-6 h-6 mr-2 text-blue-500" />
                                        <p className="text-base font-medium text-gray-700 dark:text-gray-300">
                                            <strong>URL:</strong> <a href={"https://porntape.net/video/" + videoDetails.slug} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Click Here</a>
                                        </p>
                                    </div>
                                    <div className="flex items-center">
                                        {videoDetails.is_active ? (
                                            <CheckCircle className="inline-block w-6 h-6 mr-2 text-green-500" />
                                        ) : (
                                            <XCircle className="inline-block w-6 h-6 mr-2 text-red-500" />
                                        )}
                                        <p className="text-base font-medium text-gray-700 dark:text-gray-300">
                                            <strong>Is Active:</strong> {videoDetails.is_active ? "Yes" : "No"}
                                        </p>
                                    </div>
                                </div>
                            </ComponentCard>

                            <ComponentCard title="Studio Details">
                                <div className="flex flex-wrap gap-2">
                                    {videoDetails?.studios?.map((studio: string, index: number) => (
                                        <span key={index} className="inline-block bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                                            <Folder className="inline-block w-4 h-4 mr-1" /> {studio}
                                        </span>
                                    ))}
                                </div>
                            </ComponentCard>

                            <ComponentCard title="Pornstar Details">
                                <div className="flex flex-wrap gap-2">
                                    {videoDetails?.pornstars?.map((pornstar: string, index: number) => (
                                        <span key={index} className="inline-block bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                                            <Star className="inline-block w-4 h-4 mr-1" /> {pornstar}
                                        </span>
                                    ))}
                                </div>
                            </ComponentCard>

                            <ComponentCard title="Tags Details">
                                <div className="flex flex-wrap gap-2">
                                    {videoDetails?.tags?.map((tag: string, index: number) => (
                                        <span key={index} className="inline-block bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                                            <Tags className="inline-block w-4 h-4 mr-1" /> {tag}
                                        </span>
                                    ))}
                                </div>
                            </ComponentCard>
                        </div>

                        <div className="space-y-6">
                            <ComponentCard title="Poster Details">
                                <img src={videoDetails.thumbnail} alt="Poster" className="w-full" />
                            </ComponentCard>

                            <ComponentCard title="Video Sources">
                                <div className="grid grid-cols-1 gap-4">
                                    {videoDetails?.videoSources?.length ? (
                                        videoDetails.videoSources.map((source: any, index: number) => (
                                            <div key={index} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 flex flex-col gap-2">
                                                <div className="flex items-center gap-2">
                                                    <Server className="w-5 h-5 text-blue-600" />
                                                    <span className="font-semibold text-gray-800 dark:text-gray-200">Server Name:</span>
                                                    <span className="text-gray-700 dark:text-gray-300">{source.server_name || 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Link className="w-5 h-5 text-green-600" />
                                                    <span className="font-semibold text-gray-800 dark:text-gray-200">URL:</span>
                                                    <a
                                                        href={source.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:underline dark:text-blue-400 break-all"
                                                    >
                                                        {source.url}
                                                    </a>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Eye className="w-5 h-5 text-purple-600" />
                                                    <span className="font-semibold text-gray-800 dark:text-gray-200">Quality:</span>
                                                    <span className="text-gray-700 dark:text-gray-300">{source.quality || 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <FileVideo className="w-5 h-5 text-orange-600" />
                                                    <span className="font-semibold text-gray-800 dark:text-gray-200">File Type:</span>
                                                    <span className="text-gray-700 dark:text-gray-300">{source.file_type || 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <HardDrive className="w-5 h-5 text-indigo-600" />
                                                    <span className="font-semibold text-gray-800 dark:text-gray-200">File Size:</span>
                                                    <span className="text-gray-700 dark:text-gray-300">
                                                        {source.file_size ? `${source.file_size} MB` : 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {source.is_active ? (
                                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                                    ) : (
                                                        <XCircle className="w-5 h-5 text-red-500" />
                                                    )}
                                                    <span className="font-semibold text-gray-800 dark:text-gray-200">Active:</span>
                                                    <span className="text-gray-700 dark:text-gray-300">{source.is_active ? 'Yes' : 'No'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-5 h-5 text-gray-600" />
                                                    <span className="font-semibold text-gray-800 dark:text-gray-200">Created:</span>
                                                    <span className="text-gray-700 dark:text-gray-300">{source.created_at ? new Date(source.created_at).toLocaleString() : 'N/A'}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-gray-500 dark:text-gray-400">No video sources available.</div>
                                    )}
                                </div>
                            </ComponentCard>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
