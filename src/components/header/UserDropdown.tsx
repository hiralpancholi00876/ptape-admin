import { useRouter } from 'next/navigation';
import React, { useState, useRef, useEffect } from "react";
import { LogOut, ChevronDown, User, ShieldCheck } from "lucide-react";
import Link from 'next/link';

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const toggleDropdown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    // Clear tokens
    localStorage.removeItem('token');
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict; Secure';
    router.push('/login');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className={`flex items-center gap-3 p-1.5 rounded-full transition-all duration-200 ${isOpen ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
      >
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold border border-blue-200 dark:border-blue-800/50">
            <User size={20} />
          </div>
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
        </div>

        <div className="hidden md:flex flex-col items-start">
          <span className="text-sm font-semibold text-gray-800 dark:text-white leading-none mb-1">Administrator</span>
          <span className="text-xs text-gray-500 dark:text-gray-400 leading-none">Super Admin</span>
        </div>

        <ChevronDown
          size={16}
          className={`hidden md:block text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      <div
        className={`absolute right-0 mt-3 w-60 rounded-xl border border-gray-100 bg-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] dark:border-gray-700 dark:bg-gray-800 dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] transition-all duration-200 origin-top-right z-50 ${isOpen
          ? "transform opacity-100 scale-100 translate-y-0"
          : "transform opacity-0 scale-95 -translate-y-2 pointer-events-none"
          }`}
      >
        <div className="border-t border-gray-100 dark:border-gray-700/50 p-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/10 transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
