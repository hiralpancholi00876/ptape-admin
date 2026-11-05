import dynamic from 'next/dynamic';
import { Controller, Control, FieldErrors, FieldValues, Path } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import axios from '@/utils/axios';
import { toOptions } from '@/utils/commonFunc';

type Option = { value: string; label: string };

// react-select renders differently on the server, so it is only rendered in the browser.
const CreatableSelect = dynamic(() => import('react-select/creatable'), {
  ssr: false,
  loading: () => <div className="h-[38px] animate-pulse rounded bg-gray-100" />,
});

interface TaxonomySelectProps<T extends FieldValues> {
  // Form field name; also the API endpoint the options are loaded from.
  name: 'studios' | 'pornstars' | 'categories';
  control: Control<T>;
  errors?: FieldErrors;
  requiredMessage?: string;
}

function TaxonomySelect<T extends FieldValues>({
  name,
  control,
  errors,
  requiredMessage,
}: TaxonomySelectProps<T>) {
  const { data: options = [], refetch } = useQuery({
    queryKey: ['select-options', name],
    queryFn: async (): Promise<Option[]> => {
      const response = await axios.get(`/${name}`);
      if (!response.data.success) return [];
      return toOptions(response.data.data.map((item: { name: string }) => item.name));
    },
    // Refresh on every mount so newly created entries show up.
    staleTime: 0,
  });

  const error = errors?.[name]?.message;

  return (
    <div>
      <Controller
        name={name as Path<T>}
        control={control}
        rules={requiredMessage ? { required: requiredMessage } : undefined}
        render={({ field }) => (
          <CreatableSelect
            isMulti
            instanceId={`${name}-select`}
            inputId={`${name}-select-input`}
            name={name}
            options={options}
            value={(field.value || []) as Option[]}
            onChange={(selected) => field.onChange(selected || [])}
          />
        )}
      />
      {error && <p className="mt-1 text-sm text-red-500">{String(error)}</p>}
      <button
        type="button"
        onClick={() => refetch()}
        className="mt-3 rounded bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
      >
        Reload
      </button>
    </div>
  );
}

export default TaxonomySelect;
