import { useEffect, useState } from 'react';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import Select from 'react-select/creatable';
import axios from '@/utils/axios';

interface StudioSelectProps<T extends FieldValues> {
  control: Control<T>;
}

function StudioSelect<T extends FieldValues>({ control }: StudioSelectProps<T>) {
  const [isMounted, setIsMounted] = useState(false);
  const [studios, setStudios] = useState<{ value: string; label: string }[]>([]);

  // Fetch channels from API
  const fetchData = async () => {
    try {
      let response = await axios.get(`/studios`);
      if (response.data.success) {
        setStudios(
          response.data.data.map((studio: { name: string }) => ({
            value: studio.name,
            label: studio.name,
          }))
        );
      } else {
        setStudios([]);
      }
    } catch (error) {
      setStudios([]);
    }
  };

  // Fetch studio when component mounts
  useEffect(() => {
    setIsMounted(true);
    fetchData();
  }, []);

  if (!isMounted) {
    return <div className="h-[38px] animate-pulse rounded bg-gray-100" />;
  }

  return (
    <div>
      <Controller
        name={'studios' as Path<T>}
        control={control}
        render={({ field }) => (
          <Select
            instanceId={'studio-select'}
            id="studio-select"
            name="studios"
            inputId="studio-select-input"
            isMulti
            options={studios}
            value={(field.value || []) as { value: string; label: string }[]}
            onChange={(selectedOptions) => {
              field.onChange(selectedOptions || []);
            }}
          />
        )}
      />
      <button
        type="button"
        className="mt-3 rounded bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
      >
        Reload
      </button>
    </div>
  );
}

export default StudioSelect;
