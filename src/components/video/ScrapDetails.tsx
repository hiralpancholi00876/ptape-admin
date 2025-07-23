import React, { useState } from "react";
import axios from "@/utils/axios";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";

interface ScrapDetailsProps {
    onDataReceived?: (data: any) => void;
}

const ScrapDetails: React.FC<ScrapDetailsProps> = ({ onDataReceived }) => {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!url.trim()) {
            setError('Please enter a URL');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            const response = await axios.post('/scrap-video', {
                url: url.trim()
            });

            if (response.data && onDataReceived) {
                onDataReceived(response.data.data);
            }
            
            console.log("Video details fetched successfully:", response.data);
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to fetch video details';
            setError(errorMessage);
            console.error("Error fetching video details:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div style={{ marginBottom: '16px' }}>
                <Label>Video URL</Label>
                <Input
                    type="text"
                    placeholder="Enter video URL"
                    defaultValue={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={loading}
                />
            </div>

            {error && (
                <div style={{ 
                    color: 'red', 
                    fontSize: '14px', 
                    marginBottom: '16px',
                    padding: '8px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '4px'
                }}>
                    {error}
                </div>
            )}

            <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !url.trim()}
                style={{
                    backgroundColor: loading ? '#9ca3af' : '#2563eb',
                    color: 'white',
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s'
                }}
            >
                {loading ? 'Processing...' : 'Fetch Details'}
            </button>
        </div>
    );
};

export default ScrapDetails;