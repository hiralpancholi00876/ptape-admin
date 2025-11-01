import React from "react";
import { PlusIcon, TrashIcon } from "lucide-react";
import { useController, Control } from "react-hook-form";

interface VideoSourceManagerProps {
  control: Control<any>;
  name: string;
  defaultSources?: { id: string; file_size: number | null; file_type: string; quality: string; url: string }[];
}

const VideoSourceManager: React.FC<VideoSourceManagerProps> = ({ control, name, defaultSources = [] }) => {
  const {
    field: { value: sources = [], onChange }
  } = useController({
    name,
    control,
    defaultValue: defaultSources.map((source) => ({
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      file_size: source.file_size || null,
      file_type: source.file_type || 'mp4',
      quality: source?.quality || '720p',
      url: source.url,
    }))
  });

  // Remove the server-related state and API call since we no longer need it

  const handleAddRow = () => {
    const newRow = { id: Date.now().toString(), file_size: null, file_type: 'mp4', quality: '720p', url: "" };
    const updatedSources = [...sources, newRow];
    onChange(updatedSources);
  };

  const handleDeleteRow = (id: string) => {
    const updatedSources = sources.filter((source: { id: string }) => source.id !== id);
    onChange(updatedSources);
  };

  const handleInputChange = (id: string, field: string, value: any) => {
    const updatedSources = sources.map((source: {
      id: string;
      file_size: number | null;
      file_type: string;
      quality: string;
      url: string;
    }) => {
      if (source.id === id) {
        return { ...source, [field]: value };
      }
      return source;
    });
    onChange(updatedSources);
  };

  const handleReorder = (startIndex: number, endIndex: number) => {
    const reorderedSources = Array.from(sources);
    const [removed] = reorderedSources.splice(startIndex, 1);
    reorderedSources.splice(endIndex, 0, removed);
    onChange(reorderedSources);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {sources.map((source: {
          id: string;
          file_size: number | null;
          file_type: string;
          quality: string;
          url: string;
        }, index: number) => (
          <div
            key={source.id}
            className="flex items-center space-x-2 bg-gray-100 p-2 rounded shadow"
            draggable
            onDragStart={(e) => e.dataTransfer.setData("text/plain", index.toString())}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const startIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
              handleReorder(startIndex, index);
            }}
          >
            <div className="cursor-grab">
              <span className="text-gray-500">☰</span>
            </div>
            <input
              type="number"
              id={`file-size-input-${source.id}`}
              name={`file-size-input-${source.id}`}
              value={source.file_size || ''}
              onChange={(e) => {
                e.stopPropagation();
                handleInputChange(source.id, "file_size", e.target.value ? parseFloat(e.target.value) : null);
              }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="File Size (MB)"
              className="flex-1 border rounded p-2"
            />
            <select
              id={`file-type-select-${source.id}`}
              name={`file-type-select-${source.id}`}
              value={source.file_type}
              onChange={(e) => {
                e.stopPropagation();
                handleInputChange(source.id, "file_type", e.target.value);
              }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              className="flex-1 border rounded p-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="mp4">MP4</option>
              <option value="hls">HLS</option>
            </select>
            <select
              id={`quality-select-${source.id}`}
              name={`quality-select-${source.id}`}
              value={source.quality || "720p"}
              onChange={(e) => {
                e.stopPropagation();
                handleInputChange(source.id, "quality", e.target.value);
              }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              className="flex-1 border rounded p-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="" disabled>Select Quality</option>
              <option value="480p">480p</option>
              <option value="720p">720p</option>
              <option value="1080p">1080p</option>
            </select>
            <input
              type="text"
              id={`url-input-${source.id}`}
              name={`url-input-${source.id}`}
              value={source.url}
              onChange={(e) => {
                e.stopPropagation();
                handleInputChange(source.id, "url", e.target.value);
              }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Video Source URL"
              className="flex-1 border rounded p-2"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteRow(source.id);
              }}
              className="text-red-500 hover:text-red-700"
            >
              <TrashIcon />
            </button>
          </div>
        ))}
      </div>
      <button
        id="add-row-button"
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleAddRow();
        }}
        className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        <PlusIcon />
        <span>Add Row</span>
      </button>
    </div>
  );
};

export default VideoSourceManager;
