"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSidebar } from "@/context/SidebarContext";
import UserDropdown from "@/components/header/UserDropdown";
import { Menu, X, MoreHorizontal } from 'lucide-react';

const AppHeader: React.FC = () => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const toggleApplicationMenu = () => {
    setApplicationMenuOpen(!isApplicationMenuOpen);
  };

  // Keyboard shortcut listener (keeping existing functionality)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        // search logic would go here
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-40 flex w-full bg-white/80 backdrop-blur-md border-b border-gray-100 dark:bg-gray-900/80 dark:border-gray-800 transition-all duration-300">
      <div className="flex flex-col items-center justify-between flex-grow lg:flex-row lg:px-6">

        {/* Mobile Header Bar */}
        <div className="flex items-center justify-between w-full px-4 py-3 lg:w-auto lg:p-0 border-b lg:border-none border-gray-100 dark:border-gray-800">

          {/* Sidebar Toggle */}
          <button
            onClick={handleToggle}
            className="p-2 text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors focus:outline-none"
            aria-label="Toggle Sidebar"
          >
            {isMobileOpen ? (
              <X size={24} />
            ) : (
              <Menu size={24} />
            )}
          </button>

          {/* Mobile Logo */}
          <Link href="/" className="lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/20">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">PTape</span>
          </Link>

          {/* Mobile Menu Toggle (Right Side) */}
          <button
            onClick={toggleApplicationMenu}
            className="lg:hidden p-2 text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors focus:outline-none"
          >
            <MoreHorizontal size={24} />
          </button>
        </div>

        {/* Desktop/Expanded Menu Area */}
        <div className={`${isApplicationMenuOpen ? "flex" : "hidden"} 
            lg:flex flex-col lg:flex-row items-center w-full lg:w-auto gap-4 px-4 py-4 lg:p-0 
            bg-white lg:bg-transparent dark:bg-gray-900 lg:dark:bg-transparent 
            border-b lg:border-none border-gray-100 dark:border-gray-800 
            lg:ml-auto transition-all duration-300 ease-in-out`}>

          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
