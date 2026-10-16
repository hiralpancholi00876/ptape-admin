import { Controller, Control, FieldErrors, FieldValues, Path } from 'react-hook-form';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';

interface PosterDetailsProps<T extends FieldValues> {
  control: Control<T>;
  errors: FieldErrors<any>;
  watch: (field: string) => string;
}

function PosterDetails<T extends FieldValues>({ control, errors, watch }: PosterDetailsProps<T>) {
  return (
    <div>
      <img
        className="w-full"
        src={watch('thumbnail')}
        alt="Poster preview"
        referrerPolicy="no-referrer"
      />
      <Label className="mt-3">Change Image Url</Label>
      <Controller
        name={'thumbnail' as Path<T>}
        control={control}
        rules={{ required: 'Image URL is required' }}
        render={({ field }) => (
          <>
            <Input
              type="text"
              placeholder="Url"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              enablePaste={true}
            />
            {errors.thumbnail?.message && (
              <p className="mt-1 text-sm text-red-500">{String(errors.thumbnail.message)}</p>
            )}
          </>
        )}
      />
    </div>
  );
}

export default PosterDetails;
