import React, { useState } from 'react';
import { isAxiosError } from 'axios';
import axios from '@/utils/axios';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';

// What /scrap-video returns (only the requested fields are present).
export interface ScrapedVideo {
  title?: string;
  description?: string;
  thumbnail?: string | null;
  duration?: string;
  studios?: string[] | string; // freshporno.net returns one concatenated string
  pornstars?: string[];
  categories?: string[];
}

interface ScrapDetailsProps {
  onDataReceived?: (data: ScrapedVideo | undefined) => void;
}

const AVAILABLE_FIELDS = [
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'studios', label: 'Studios' },
  { key: 'pornstars', label: 'Pornstars' },
  { key: 'categories', label: 'Categories' },
  { key: 'thumbnail', label: 'Thumbnail' },
];

const ScrapDetails: React.FC<ScrapDetailsProps> = ({ onDataReceived }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  const isAllSelected = selectedFields.length === AVAILABLE_FIELDS.length;

  const toggleField = (field: string) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const handleSubmit = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // An empty field list asks the API for every field.
      const response = await axios.post<{ data?: ScrapedVideo }>('/scrap-video', {
        url: url.trim(),
        fields: isAllSelected ? [] : selectedFields,
      });
      onDataReceived?.(response.data.data);
    } catch (error) {
      setError(
        (isAxiosError(error) && error.response?.data?.message) || 'Failed to fetch video details'
      );
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

      <div style={{ marginBottom: '16px' }}>
        <Label>Select Fields to Fetch</Label>
        <div style={{ marginTop: '8px' }}>
          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={() =>
                  setSelectedFields(isAllSelected ? [] : AVAILABLE_FIELDS.map((f) => f.key))
                }
                disabled={loading}
                style={{ marginRight: '8px' }}
              />
              <strong>All</strong>
            </label>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px',
              paddingLeft: '20px',
            }}
          >
            {AVAILABLE_FIELDS.map((field) => (
              <label
                key={field.key}
                style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  checked={selectedFields.includes(field.key)}
                  onChange={() => toggleField(field.key)}
                  disabled={loading}
                  style={{ marginRight: '8px' }}
                />
                {field.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div
          style={{
            color: 'red',
            fontSize: '14px',
            marginBottom: '16px',
            padding: '8px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '4px',
          }}
        >
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading || !url.trim() || selectedFields.length === 0}
        style={{
          backgroundColor: loading || selectedFields.length === 0 ? '#9ca3af' : '#2563eb',
          color: 'white',
          padding: '8px 16px',
          border: 'none',
          borderRadius: '4px',
          cursor: loading || selectedFields.length === 0 ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s',
        }}
      >
        {loading ? 'Processing...' : 'Fetch Details'}
      </button>
    </div>
  );
};

export default ScrapDetails;
