'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { X, Loader2, Trash2, RefreshCw, AlertCircle, CheckCircle2, Clock, Upload } from 'lucide-react';

const REMOTE_UPLOAD_BASE_URL = 'http://localhost:3001';

interface RemoteJob {
    id: number;
    filename: string;
    draft_video_id: number;
    download_url: string;
    r2_data: Record<string, unknown> | null;
    status: 'pending' | 'downloading' | 'uploading' | 'completed' | 'failed';
    error_message: string | null;
    created_at: string;
    updated_at: string;
}

interface QueueStatus {
    download: { queued: number; active: number };
    upload: { queued: number; active: number };
}

interface RemoteUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function RemoteUploadModal({ isOpen, onClose }: RemoteUploadModalProps) {
    const [jobs, setJobs] = useState<RemoteJob[]>([]);
    const [isLoadingJobs, setIsLoadingJobs] = useState(false);
    const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);

    // --- Remote Upload API Functions ---
    const fetchJobs = useCallback(async () => {
        setIsLoadingJobs(true);
        try {
            const response = await fetch(`${REMOTE_UPLOAD_BASE_URL}/list-jobs`);
            const data = await response.json();
            if (data.successCode === 200) {
                setJobs(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching jobs:', error);
        } finally {
            setIsLoadingJobs(false);
        }
    }, []);

    const fetchQueueStatus = useCallback(async () => {
        try {
            const response = await fetch(`${REMOTE_UPLOAD_BASE_URL}/queue-status`);
            const data = await response.json();
            if (data.successCode === 200) {
                setQueueStatus(data.data);
            }
        } catch (error) {
            console.error('Error fetching queue status:', error);
        }
    }, []);

    const deleteJob = async (jobId: number) => {
        try {
            const response = await fetch(`${REMOTE_UPLOAD_BASE_URL}/delete-job/${jobId}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (data.successCode === 200) {
                fetchJobs();
                fetchQueueStatus();
            }
        } catch (error) {
            console.error('Error deleting job:', error);
        }
    };

    const deleteAllJobs = async () => {
        if (!confirm('Are you sure you want to delete all jobs?')) return;
        try {
            const response = await fetch(`${REMOTE_UPLOAD_BASE_URL}/delete-jobs`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (data.successCode === 200) {
                setJobs([]);
                fetchQueueStatus();
            }
        } catch (error) {
            console.error('Error deleting all jobs:', error);
        }
    };

    const getStatusIcon = (status: RemoteJob['status']) => {
        switch (status) {
            case 'completed':
                return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case 'failed':
                return <AlertCircle className="w-4 h-4 text-red-500" />;
            case 'downloading':
            case 'uploading':
                return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
            case 'pending':
            default:
                return <Clock className="w-4 h-4 text-yellow-500" />;
        }
    };

    const getStatusColor = (status: RemoteJob['status']) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'failed':
                return 'bg-red-100 text-red-800';
            case 'downloading':
                return 'bg-blue-100 text-blue-800';
            case 'uploading':
                return 'bg-purple-100 text-purple-800';
            case 'pending':
            default:
                return 'bg-yellow-100 text-yellow-800';
        }
    };

    // Load jobs and queue status when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchJobs();
            fetchQueueStatus();
            // Poll for updates every 5 seconds
            const interval = setInterval(() => {
                fetchJobs();
                fetchQueueStatus();
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [isOpen, fetchJobs, fetchQueueStatus]);

    const handleClose = () => {
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            className="max-w-3xl p-0"
        >
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Upload className="w-6 h-6 text-blue-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Remote Upload Jobs</h2>
                </div>
                <button
                    onClick={handleClose}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <X className="w-6 h-6 text-gray-600" />
                </button>
            </div>

            {/* Modal Body */}
            <div className="max-h-[60vh] overflow-y-auto p-6 space-y-6">
                {/* Queue Status */}
                {queueStatus && (
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-gray-700">Queue Status</h3>
                            <button
                                onClick={() => { fetchJobs(); fetchQueueStatus(); }}
                                className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                                title="Refresh"
                            >
                                <RefreshCw className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                                <div className="text-xs text-gray-500 mb-1">Downloads</div>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-semibold text-blue-600">{queueStatus.download.active}</span>
                                    <span className="text-xs text-gray-400">active</span>
                                    <span className="text-gray-300">|</span>
                                    <span className="text-lg font-semibold text-gray-600">{queueStatus.download.queued}</span>
                                    <span className="text-xs text-gray-400">queued</span>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                                <div className="text-xs text-gray-500 mb-1">Uploads</div>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-semibold text-purple-600">{queueStatus.upload.active}</span>
                                    <span className="text-xs text-gray-400">active</span>
                                    <span className="text-gray-300">|</span>
                                    <span className="text-lg font-semibold text-gray-600">{queueStatus.upload.queued}</span>
                                    <span className="text-xs text-gray-400">queued</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Jobs List */}
                <div className="bg-white rounded-lg border border-gray-200">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-700">Jobs ({jobs.length})</h3>
                        {jobs.length > 0 && (
                            <button
                                onClick={deleteAllJobs}
                                className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                            >
                                <Trash2 className="w-3 h-3" />
                                Delete All
                            </button>
                        )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {isLoadingJobs ? (
                            <div className="flex justify-center items-center h-32">
                                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                            </div>
                        ) : jobs.length === 0 ? (
                            <div className="flex flex-col justify-center items-center h-32 text-gray-500 text-sm">
                                <Upload className="w-8 h-8 text-gray-300 mb-2" />
                                <p>No jobs found</p>
                                <p className="text-xs text-gray-400 mt-1">Jobs are added via server API</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {jobs.map((job) => (
                                    <div key={job.id} className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {getStatusIcon(job.status)}
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(job.status)}`}>
                                                        {job.status}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        ID: {job.id}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-700 truncate font-mono">
                                                    {job.filename || 'Processing...'}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate mt-1">
                                                    {job.download_url}
                                                </p>
                                                {job.error_message && (
                                                    <p className="text-xs text-red-600 mt-1">
                                                        Error: {job.error_message}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Draft ID: {job.draft_video_id} • Created: {new Date(job.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => deleteJob(job.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                title="Delete Job"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex items-center justify-end">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClose}
                >
                    Close
                </Button>
            </div>
        </Modal>
    );
}
