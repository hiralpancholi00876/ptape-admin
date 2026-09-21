'use client';

import { useSidebar } from '@/context/SidebarContext';
import AppHeader from '@/layout/AppHeader';
import AppSidebar from '@/layout/AppSidebar';
import Backdrop from '@/layout/Backdrop';
import React from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  // Dynamic margin based on sidebar state (w-64 = 256px, w-20 = 80px)
  const sidebarMargin = isExpanded || isHovered ? 'lg:ml-64' : 'lg:ml-2';

  return (
    <div className="min-h-screen">
      <AppSidebar />
      <Backdrop />

      {/* Main Content Area */}
      <div className={`flex min-h-screen flex-col transition-all duration-300 ${sidebarMargin}`}>
        <AppHeader />

        {/* Page Content - pt-16 accounts for fixed header height */}
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:pt-6">
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
