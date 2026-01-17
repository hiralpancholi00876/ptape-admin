import React from "react";
import { Controller, Control, FieldErrors } from "react-hook-form";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";

interface PosterDetailsProps {
  control: Control<any>;
  errors: FieldErrors<any>;
  watch: (field: string) => string;
}

const PosterDetails: React.FC<PosterDetailsProps> = ({ control, errors, watch }) => {
  return (
    <div>
      <img className="w-full" src={watch("thumbnail")} alt="Poster preview" referrerPolicy="no-referrer" />
      <Label className="mt-3">Change Image Url</Label>
      <Controller
        name="thumbnail"
        control={control}
        rules={{ required: "Image URL is required" }}
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
              <p className="text-red-500 text-sm mt-1">{String(errors.thumbnail.message)}</p>
            )}
          </>
        )}
      />
    </div>
  );
};

export default PosterDetails;
