import { PlusIcon, TrashIcon } from 'lucide-react';
import { useController, Control, FieldValues, Path } from 'react-hook-form';

type VideoSource = {
  id: string | null;
  file_size: number | null;
  file_type: string | null;
  quality: string | null;
  url: string;
};

interface VideoSourceManagerProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
}

function VideoSourceManager<T extends FieldValues>({ control, name }: VideoSourceManagerProps<T>) {
  const {
    field: { value, onChange },
  } = useController({ name, control });
  const sources: VideoSource[] = value || [];

  const updateSource = (id: string | null, changes: Partial<VideoSource>) => {
    onChange(sources.map((source) => (source.id === id ? { ...source, ...changes } : source)));
  };

  const moveSource = (fromIndex: number, toIndex: number) => {
    const reordered = [...sources];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    onChange(reordered);
  };

  const addSource = () => {
    onChange([
      ...sources,
      { id: Date.now().toString(), file_size: null, file_type: 'mp4', quality: '720p', url: '' },
    ]);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {sources.map((source, index) => (
          <div
            key={source.id}
            className="flex items-center space-x-2 rounded bg-gray-100 p-2 shadow"
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/plain', index.toString())}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => moveSource(parseInt(e.dataTransfer.getData('text/plain'), 10), index)}
          >
            <div className="cursor-grab">
              <span className="text-gray-500">☰</span>
            </div>
            <input
              type="number"
              value={source.file_size || ''}
              onChange={(e) =>
                updateSource(source.id, {
                  file_size: e.target.value ? parseFloat(e.target.value) : null,
                })
              }
              placeholder="File Size (MB)"
              className="w-[150px] rounded border p-2"
            />
            <select
              value={source.file_type ?? ''}
              onChange={(e) => updateSource(source.id, { file_type: e.target.value })}
              className="w-[150px] rounded border bg-white p-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="mp4">MP4</option>
              <option value="hls">HLS</option>
            </select>
            <select
              value={source.quality || '720p'}
              onChange={(e) => updateSource(source.id, { quality: e.target.value })}
              className="w-[150px] rounded border bg-white p-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="" disabled>
                Select Quality
              </option>
              <option value="480p">480p</option>
              <option value="720p">720p</option>
              <option value="1080p">1080p</option>
            </select>
            <input
              type="text"
              value={source.url}
              onChange={(e) => updateSource(source.id, { url: e.target.value })}
              placeholder="Video Source URL"
              className="flex-1 rounded border p-2"
            />
            <button
              type="button"
              onClick={() => onChange(sources.filter((item) => item.id !== source.id))}
              className="text-red-500 hover:text-red-700"
            >
              <TrashIcon />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addSource}
        className="flex items-center space-x-2 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
      >
        <PlusIcon />
        <span>Add Row</span>
      </button>
    </div>
  );
}

export default VideoSourceManager;
