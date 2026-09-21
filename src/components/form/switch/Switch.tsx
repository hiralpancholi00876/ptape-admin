'use client';
import React, { useState } from 'react';

interface SwitchProps {
  label: string;
  checked?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onChange?: (checked: boolean) => void;
  color?: 'blue' | 'gray'; // Added prop to toggle color theme
}

const Switch: React.FC<SwitchProps> = ({
  label,
  checked = false,
  disabled = false,
  onChange,
  size = 'md',
  color = 'blue', // Default to blue color
}) => {
  const handleToggle = () => {
    if (disabled) return;
    if (onChange) {
      onChange(!checked);
    }
  };

  const switchColors =
    color === 'blue'
      ? {
          background: checked ? 'bg-brand-500 ' : 'bg-gray-200 dark:bg-white/10', // Blue version
          knob: checked ? 'translate-x-full bg-white' : 'translate-x-0 bg-white',
        }
      : {
          background: checked ? 'bg-gray-800 dark:bg-white/10' : 'bg-gray-200 dark:bg-white/10', // Gray version
          knob: checked ? 'translate-x-full bg-white' : 'translate-x-0 bg-white',
        };

  return (
    <label
      className={`flex cursor-pointer items-center gap-3 text-sm font-medium select-none ${
        disabled ? 'text-gray-400' : 'text-gray-700 dark:text-gray-400'
      }`}
      onClick={handleToggle} // Toggle when the label itself is clicked
    >
      <div className="relative">
        <div
          className={`block h-6 w-11 rounded-full transition duration-150 ease-linear ${
            disabled ? 'pointer-events-none bg-gray-100 dark:bg-gray-800' : switchColors.background
          }`}
        ></div>
        <div
          className={`shadow-theme-sm absolute top-0.5 left-0.5 h-5 w-5 transform rounded-full duration-150 ease-linear ${switchColors.knob}`}
        ></div>
      </div>
      {label}
    </label>
  );
};

export default Switch;
