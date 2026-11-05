'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/context/SidebarContext';
import { Video, Camera, Star, SquareStack } from 'lucide-react';

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
};

const navItems: NavItem[] = [
  { name: 'Videos', icon: <Video size={20} />, path: '/video/list' },
  { name: 'Studios', icon: <Camera size={20} />, path: '/studios' },
  { name: 'Pornstars', icon: <Star size={20} />, path: '/pornstars' },
  { name: 'Categories', icon: <SquareStack size={20} />, path: '/category' },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, toggleMobileSidebar } = useSidebar();
  const pathname = usePathname();

  const showLabels = isExpanded || isMobileOpen;

  return (
    <>
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={toggleMobileSidebar} />
      )}

      <aside
        className={`fixed top-16 left-0 z-50 h-[calc(100vh-64px)] border-r border-gray-200 bg-white transition-all duration-300 ease-in-out lg:top-0 lg:h-screen dark:border-gray-800 dark:bg-gray-900 ${showLabels ? 'w-64' : 'w-20'} ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="hidden h-16 items-center border-b border-gray-200 px-4 lg:flex dark:border-gray-800">
          <Link href="/" className="flex items-center gap-3">
            <div className="bg-brand-600 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg">
              <span className="text-lg font-bold text-white">P</span>
            </div>
            {showLabels && (
              <span className="text-lg font-semibold text-gray-900 dark:text-white">Ptape</span>
            )}
          </Link>
        </div>

        <nav className="space-y-1 p-3">
          {navItems.map((item) => {
            const active = pathname === item.path;
            return (
              <Link
                key={item.name}
                href={item.path}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                  active
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                } ${!showLabels ? 'justify-center' : ''}`}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {showLabels && <span className="text-sm font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default AppSidebar;
