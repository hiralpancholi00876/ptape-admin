import React, { useState } from 'react';
import axios from '@/utils/axios';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';

interface ScrapDetailsProps {
  onDataReceived?: (data: any) => void;
}

const ScrapDetails: React.FC<ScrapDetailsProps> = ({ onDataReceived }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  const availableFields = [
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Description' },
    { key: 'studios', label: 'Studios' },
    { key: 'pornstars', label: 'Pornstars' },
    { key: 'categories', label: 'Categories' },
    { key: 'thumbnail', label: 'Thumbnail' },
  ];

  const handleFieldChange = (field: string) => {
    setSelectedFields((prev) => {
      if (prev.includes(field)) {
        return prev.filter((f) => f !== field);
      } else {
        return [...prev, field];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedFields.length === availableFields.length) {
      setSelectedFields([]);
    } else {
      setSelectedFields(availableFields.map((f) => f.key));
    }
  };

  const isAllSelected = selectedFields.length === availableFields.length;

  const handleSubmit = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // If all fields are selected, send empty array, otherwise send selected fields
      const fieldsToSend = isAllSelected ? [] : selectedFields;

      const response = await axios.post('/scrap-video', {
        url: url.trim(),
        fields: fieldsToSend,
      });

      if (response.data && onDataReceived) {
        onDataReceived(response.data.data);
      }

      console.log('Video details fetched successfully:', response.data);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch video details';
      setError(errorMessage);
      console.error('Error fetching video details:', error);
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
                onChange={handleSelectAll}
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
            {availableFields.map((field) => (
              <label
                key={field.key}
                style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  checked={selectedFields.includes(field.key)}
                  onChange={() => handleFieldChange(field.key)}
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
