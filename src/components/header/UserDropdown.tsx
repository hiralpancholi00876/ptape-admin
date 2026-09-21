'use client';
import { useRouter } from 'next/navigation';
import React from 'react';
import { LogOut, User } from 'lucide-react';

export default function UserDropdown() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    document.cookie =
      'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict; Secure';
    router.push('/login');
  };

  return (
    <div className="flex items-center gap-2">
      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
        title="Sign Out"
      >
        <LogOut size={18} />
      </button>
    </div>
  );
}
