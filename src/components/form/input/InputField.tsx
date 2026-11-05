import React, { FC } from 'react';
import { Clipboard } from 'lucide-react';

interface InputProps {
  type?: string;
  placeholder?: string;
  defaultValue?: string | number;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
  enablePaste?: boolean;
}

const Input: FC<InputProps> = ({
  type = 'text',
  placeholder,
  defaultValue,
  value,
  onChange,
  disabled = false,
  required = false,
  enablePaste = false,
}) => {
  const stateClasses = disabled
    ? 'text-gray-500 border-gray-300 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
    : 'bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800';

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && onChange) {
        onChange({ target: { value: text } } as React.ChangeEvent<HTMLInputElement>);
      }
    } catch (err) {
      console.error('Failed to read clipboard', err);
    }
  };

  return (
    <div className="relative">
      <input
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`shadow-theme-xs dark:focus:border-brand-800 h-11 w-full appearance-none rounded-lg border px-4 py-2.5 text-sm placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${enablePaste ? 'pr-10' : ''} ${stateClasses}`}
      />

      {enablePaste && !disabled && (
        <button
          type="button"
          onClick={pasteFromClipboard}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-gray-400 transition-all hover:bg-gray-100 hover:text-blue-500 dark:hover:bg-gray-700"
          title="Paste from clipboard"
        >
          <Clipboard className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default Input;
