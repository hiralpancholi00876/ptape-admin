'use client';

import { useSidebar } from '@/context/SidebarContext';
import AppHeader from '@/layout/AppHeader';
import AppSidebar from '@/layout/AppSidebar';
import React from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isExpanded } = useSidebar();

  return (
    <div className="min-h-screen">
      <AppSidebar />

      <div
        className={`flex min-h-screen flex-col transition-all duration-300 ${isExpanded ? 'lg:ml-64' : 'lg:ml-2'}`}
      >
        <AppHeader />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:pt-6">
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
