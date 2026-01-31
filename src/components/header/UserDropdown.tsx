"use client";
import { useRouter } from 'next/navigation';
import React from "react";
import { LogOut, User } from "lucide-react";

export default function UserDropdown() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict; Secure';
    router.push('/login');
  };

  return (
    <div className="flex items-center gap-2">
      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-500/10 rounded-lg transition-colors"
        title="Sign Out"
      >
        <LogOut size={18} />
      </button>
    </div>
  );
}
