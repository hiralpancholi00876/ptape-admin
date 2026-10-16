import { useEffect, useState } from 'react';
import { Controller, Control, FieldErrors, FieldValues, Path } from 'react-hook-form';
import Select from 'react-select/creatable';
import axios from '@/utils/axios';

interface PornstarDetailsProps<T extends FieldValues> {
  control: Control<T>;
  errors: FieldErrors<any>;
}

function PornstarDetails<T extends FieldValues>({ control, errors }: PornstarDetailsProps<T>) {
  const [isMounted, setIsMounted] = useState(false);
  const [pornstars, setPornstars] = useState<{ value: string; label: string }[]>([]);

  // Fetch pstar from API
  const fetchData = async () => {
    try {
      let response = await axios.get(`/pornstars`);
      if (response.data.success) {
        setPornstars(
          response.data.data.map((studio: { name: string }) => ({
            value: studio.name,
            label: studio.name,
          }))
        );
      } else {
        setPornstars([]);
      }
    } catch (error) {
      setPornstars([]);
    }
  };

  // Fetch pstar when component mounts
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
        name={'pornstars' as Path<T>}
        control={control}
        rules={{ required: 'Pornstars is required' }}
        render={({ field }) => (
          <>
            <Select
              instanceId={'pornstar-select'}
              id="pornstar-select"
              name="pornstars"
              inputId="pornstar-select-input"
              isMulti
              options={pornstars}
              value={(field.value || []) as { value: string; label: string }[]}
              onChange={(selectedOptions) => {
                field.onChange(selectedOptions || []);
              }}
            />
            {errors.pornstars?.message && (
              <p className="mt-1 text-sm text-red-500">{String(errors.pornstars.message)}</p>
            )}
          </>
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

export default PornstarDetails;
