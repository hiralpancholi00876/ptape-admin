import React from 'react';

interface TextareaProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

const TextArea: React.FC<TextareaProps> = ({
  placeholder = 'Enter your message',
  value = '',
  onChange,
}) => {
  return (
    <textarea
      placeholder={placeholder}
      rows={3}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className="shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
    />
  );
};

export default TextArea;
