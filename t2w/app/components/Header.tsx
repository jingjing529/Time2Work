"use client";

import { useState } from "react";
import ProfileDropdown from "./ProfileDropdown";

interface HeaderProps {
  activeTab: "availability" | "all-member";
  onTabChange: (tab: "availability" | "all-member") => void;
  userEmail?: string;
  userAvatar?: string;
}

export default function Header({
  activeTab,
  onTabChange,
  userEmail,
  userAvatar,
}: HeaderProps) {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <span className="text-xl font-bold bg-gradient-to-r from-[#4285F4] to-[#34A853] bg-clip-text text-transparent">
              Time2Work
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex space-x-1">
            <button
              onClick={() => onTabChange("availability")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === "availability"
                  ? "bg-[#4285F4] text-white shadow-md shadow-[#4285F4]/25"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              Availability
            </button>
            <button
              onClick={() => onTabChange("all-member")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === "all-member"
                  ? "bg-[#4285F4] text-white shadow-md shadow-[#4285F4]/25"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              All Member Availability
            </button>
          </nav>

          {/* Profile */}
          <ProfileDropdown email={userEmail} avatar={userAvatar} />
        </div>
      </div>
    </header>
  );
}

