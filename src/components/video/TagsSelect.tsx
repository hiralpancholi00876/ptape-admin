import React, { useEffect, useState } from "react";
import { Controller, Control, FieldErrors } from "react-hook-form";
import Select from "react-select/creatable";
import axios from "@/utils/axios";

interface TagsDetailsProps {
    control: Control<any>;
    errors: FieldErrors<any>;
}

const TagsDetails: React.FC<TagsDetailsProps> = ({
    control,
    errors,
}) => {

    const [tags, setTags] = useState<{ value: string; label: string }[]>([]);

    // Fetch tags from API
    const fetchData = async () => {
        try {
            let response = await axios.get(`/tags`);
            if (response.data.success) {
                setTags(
                    response.data.data
                        .map((tag: { name: string }) => ({ value: tag.name, label: tag.name }))
                );
            } else {
                setTags([]);
            }
        } catch (error) {
            setTags([]);
        }
    };

    // Fetch tags when component mounts
    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div>
            <Controller
                name="tags"
                control={control}
                rules={{ required: "Tags is required" }}
                render={({ field }) => (
                    <>
                        <Select
                            isMulti
                            instanceId={'tags-select'}
                            id="tags-select"
                            name="tags"
                            inputId="tags-select-input"
                            options={tags}
                            value={field.value}
                            onChange={(selectedOptions) => {
                                field.onChange(selectedOptions || []);
                            }}
                            onKeyDown={(e) => {
                                // Prevent event propagation that could affect other components
                                e.stopPropagation();
                            }}
                        />
                        {errors.tags?.message && (
                            <p className="text-red-500 text-sm mt-1">
                                {String(errors.tags.message)}
                            </p>
                        )}
                    </>
                )
                }
            />
            <button
                type="button"
                onClick={fetchData}
                className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
                Reload
            </button>
        </div>
    );
};

export default TagsDetails;
