import { useEffect, useState } from 'react';
import { Controller, Control, FieldErrors, FieldValues, Path } from 'react-hook-form';
import Select from 'react-select/creatable';
import axios from '@/utils/axios';

interface CategoryDetailsProps<T extends FieldValues> {
  control: Control<T>;
  errors: FieldErrors<any>;
}

function CategoryDetails<T extends FieldValues>({ control, errors }: CategoryDetailsProps<T>) {
  const [isMounted, setIsMounted] = useState(false);
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);

  // Fetch categories from API
  const fetchData = async () => {
    try {
      let response = await axios.get(`/categories`);
      if (response.data.success) {
        setCategories(
          response.data.data.map((category: { name: string }) => ({
            value: category.name,
            label: category.name,
          }))
        );
      } else {
        setCategories([]);
      }
    } catch (error) {
      setCategories([]);
    }
  };

  // Fetch categories when component mounts
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
        name={'categories' as Path<T>}
        control={control}
        rules={{ required: 'Category is required' }}
        render={({ field }) => (
          <>
            <Select
              isMulti
              instanceId={'categories-select'}
              id="categories-select"
              name="categories"
              inputId="categories-select-input"
              options={categories}
              value={(field.value || []) as { value: string; label: string }[]}
              onChange={(selectedOptions) => {
                field.onChange(selectedOptions || []);
              }}
            />
            {errors.categories?.message && (
              <p className="mt-1 text-sm text-red-500">{String(errors.categories.message)}</p>
            )}
          </>
        )}
      />
      <button
        type="button"
        onClick={fetchData}
        className="mt-3 rounded bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
      >
        Reload
      </button>
    </div>
  );
}

export default CategoryDetails;
