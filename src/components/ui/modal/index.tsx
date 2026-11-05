'use client';
import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, className = '' }) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal fixed inset-0 z-99999 flex items-center justify-center overflow-y-auto">
      <div
        className="fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[10px]"
        onClick={onClose}
      />
      <div className={`relative w-full rounded-3xl bg-white dark:bg-gray-900 ${className}`}>
        {children}
      </div>
    </div>
  );
};
