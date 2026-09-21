'use client';
import React from 'react';
import Link from 'next/link';
import { useSidebar } from '@/context/SidebarContext';
import UserDropdown from '@/components/header/UserDropdown';
import { Menu, X } from 'lucide-react';

const AppHeader: React.FC = () => {
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

  const handleToggle = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white/90 px-4 backdrop-blur-md lg:px-6 dark:border-gray-800 dark:bg-gray-900/90">
      {/* Left: Toggle + Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleToggle}
          className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 lg:hidden dark:text-gray-400 dark:hover:bg-gray-800"
          aria-label="Toggle Sidebar"
        >
          {isMobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link href="/" className="flex items-center gap-2 lg:hidden">
          <div className="bg-brand-600 flex h-8 w-8 items-center justify-center rounded-lg">
            <span className="text-lg font-bold text-white">P</span>
          </div>
          <span className="text-lg font-semibold text-gray-900 dark:text-white">Ptape</span>
        </Link>
      </div>

      {/* Right: User Dropdown */}
      <UserDropdown />
    </header>
  );
};

export default AppHeader;
