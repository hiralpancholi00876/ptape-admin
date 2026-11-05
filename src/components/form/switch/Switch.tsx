'use client';
import React from 'react';

interface SwitchProps {
  label?: string;
  checked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}

const Switch: React.FC<SwitchProps> = ({ label, checked = false, disabled = false, onChange }) => {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 text-sm font-medium select-none ${
        disabled ? 'text-gray-400' : 'text-gray-700 dark:text-gray-400'
      }`}
      onClick={() => !disabled && onChange?.(!checked)}
    >
      <div className="relative">
        <div
          className={`block h-6 w-11 rounded-full transition duration-150 ease-linear ${
            disabled
              ? 'pointer-events-none bg-gray-100 dark:bg-gray-800'
              : checked
                ? 'bg-brand-500'
                : 'bg-gray-200 dark:bg-white/10'
          }`}
        />
        <div
          className={`shadow-theme-sm absolute top-0.5 left-0.5 h-5 w-5 transform rounded-full bg-white duration-150 ease-linear ${
            checked ? 'translate-x-full' : 'translate-x-0'
          }`}
        />
      </div>
      {label}
    </label>
  );
};

export default Switch;
