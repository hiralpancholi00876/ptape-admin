import React, { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  size?: 'sm' | 'md';
  variant?: 'primary' | 'outline';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

const sizeClasses = {
  sm: 'px-4 py-3 text-sm',
  md: 'px-5 py-3.5 text-sm',
};

const variantClasses = {
  primary: 'bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300',
  outline:
    'bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300',
};

const Button: React.FC<ButtonProps> = ({
  children,
  size = 'md',
  variant = 'primary',
  onClick,
  className = '',
  disabled = false,
  type = 'button',
}) => {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 ease-in-out active:scale-95 ${className} ${
        sizeClasses[size]
      } ${variantClasses[variant]} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
