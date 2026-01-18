"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { ChevronDown, MoreHorizontal, Video, Camera, Star, SquareStack, Menu } from 'lucide-react';

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
  {
    name: "Videos",
    icon: <Video size={20} />,
    path: "/video/list"
  },
  {
    name: "Studios",
    icon: <Camera size={20} />,
    path: "/studios"
  },
  {
    name: "Pornstars",
    icon: <Star size={20} />,
    path: "/pornstars"
  },
  {
    name: "Categories",
    icon: <SquareStack size={20} />,
    path: "/category"
  }
];

const othersItems: NavItem[] = [];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (navItems: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-2">
      {navItems.map((nav, index) => {
        const isMenuOpen = openSubmenu?.type === menuType && openSubmenu?.index === index;
        const isLinkActive = nav.path && isActive(nav.path);

        return (
          <li key={nav.name}>
            {nav.subItems ? (
              <button
                onClick={() => handleSubmenuToggle(index, menuType)}
                className={`w-full group flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 outline-none
                  ${isMenuOpen
                    ? "bg-brand-50/80 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/80 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800/80"
                  }
                  ${!isExpanded && !isHovered ? "justify-center" : ""}`}
              >
                <span className={`transition-colors duration-200 ${isMenuOpen ? "text-brand-600 dark:text-brand-400" : "text-current"}`}>
                  {nav.icon}
                </span>

                {(isExpanded || isHovered || isMobileOpen) && (
                  <>
                    <span className="ml-3 font-medium text-sm whitespace-nowrap">{nav.name}</span>
                    <ChevronDown
                      className={`ml-auto w-4 h-4 transition-transform duration-300 ${isMenuOpen ? "rotate-180" : ""}`}
                    />
                  </>
                )}
              </button>
            ) : (
              nav.path && (
                <Link
                  href={nav.path}
                  className={`w-full group flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 outline-none
                    ${isLinkActive
                      ? "bg-brand-600 text-white shadow-md shadow-brand-500/20 dark:shadow-none"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/80 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800/80"
                    }
                    ${!isExpanded && !isHovered ? "justify-center" : ""}`}
                >
                  <span className={`transition-colors duration-200 ${isLinkActive ? "text-white" : "text-current group-hover:text-current"}`}>
                    {nav.icon}
                  </span>

                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="ml-3 font-medium text-sm whitespace-nowrap">{nav.name}</span>
                  )}
                </Link>
              )
            )}

            {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
              <div
                ref={(el) => {
                  subMenuRefs.current[`${menuType}-${index}`] = el;
                }}
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{
                  height: isMenuOpen ? `${subMenuHeight[`${menuType}-${index}`]}px` : "0px",
                }}
              >
                <ul className="mt-1 ml-4 pl-4 border-l border-gray-100 dark:border-gray-800 space-y-1">
                  {nav.subItems.map((subItem) => (
                    <li key={subItem.name}>
                      <Link
                        href={subItem.path}
                        className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors duration-200
						${isActive(subItem.path)
                            ? "text-brand-600 bg-brand-50 font-medium dark:text-brand-400 dark:bg-brand-900/10"
                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800/50"
                          }`}
                      >
                        <span className="truncate">{subItem.name}</span>
                        {subItem.new && (
                          <span className="ml-auto text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            New
                          </span>
                        )}
                        {subItem.pro && (
                          <span className="ml-auto text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                            Pro
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 lg:mt-0 top-0 left-0 bg-white/95 backdrop-blur-sm dark:bg-gray-900/95 dark:border-gray-800 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-100 shadow-sm
        ${isExpanded || isMobileOpen || isHovered
          ? "w-[280px]"
          : "w-[80px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header / Logo */}
      <div className={`h-20 flex items-center px-6 ${!isExpanded && !isHovered ? "justify-center" : "justify-between"}`}>
        <Link href="/" className="flex items-center gap-3 overflow-hidden">
          {isExpanded || isHovered || isMobileOpen ? (
            <div className="flex flex-col">
              <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white leading-none">
                Ptape
              </h1>
              <span className="text-[10px] font-medium text-brand-600 dark:text-brand-400 uppercase tracking-widest ml-0.5">Admin Panel</span>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/20">
              <span className="text-white font-bold text-xl">Ptape</span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex flex-col h-[calc(100vh-80px)] overflow-y-auto px-4 pb-6 scrollbar-hide">
        <nav className="flex-1 space-y-6">
          <div>
            <div className={`mb-3 px-3 flex items-center text-xs font-semibold uppercase tracking-wider text-gray-400 transition-opacity duration-200
              ${!isExpanded && !isHovered ? "justify-center" : "justify-between"}`}>
              {(isExpanded || isHovered || isMobileOpen) ? (
                <span>Main Menu</span>
              ) : (
                <MoreHorizontal size={16} />
              )}
            </div>
            {renderMenuItems(navItems, "main")}
          </div>

          {othersItems.length > 0 && (
            <div>
              <div className={`mb-3 px-3 flex items-center text-xs font-semibold uppercase tracking-wider text-gray-400 transition-opacity duration-200
                ${!isExpanded && !isHovered ? "justify-center" : "justify-between"}`}>
                {(isExpanded || isHovered || isMobileOpen) && <span>Others</span>}
              </div>
              {renderMenuItems(othersItems, "others")}
            </div>
          )}
        </nav>

        {/* Optional Footer or User Info could go here */}
      </div>
    </aside>
  );
};

export default AppSidebar;
