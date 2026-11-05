'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSidebar } from '@/context/SidebarContext';
import { clearAuthToken } from '@/utils/commonFunc';
import { LogOut, Menu, X } from 'lucide-react';

const AppHeader: React.FC = () => {
  const router = useRouter();
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();

  const handleLogout = () => {
    clearAuthToken();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white/90 px-4 backdrop-blur-md lg:px-6 dark:border-gray-800 dark:bg-gray-900/90">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMobileSidebar}
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

      <button
        onClick={handleLogout}
        className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
        title="Sign Out"
      >
        <LogOut size={18} />
      </button>
    </header>
  );
};

export default AppHeader;
