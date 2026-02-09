"use client";

import { useState, useEffect } from "react";
import Header from "../components/Header";
import Availability from "../components/Availability";
import AllMemberAvailability from "../components/AllMemberAvailability";

interface UserInfo {
  email: string;
  name: string;
  avatar: string;
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"availability" | "all-member">(
    "availability"
  );
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    // Fetch user info
    fetch("/api/user")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setUserInfo(data);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#4285F4]/8 rounded-full mix-blend-multiply filter blur-3xl -translate-y-1/3 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#34A853]/8 rounded-full mix-blend-multiply filter blur-3xl translate-y-1/3 -translate-x-1/3"></div>
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-[#FBBC05]/5 rounded-full mix-blend-multiply filter blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {/* Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userEmail={userInfo?.email}
        userAvatar={userInfo?.avatar}
      />

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="transition-all duration-300 ease-in-out">
          {activeTab === "availability" ? (
            <Availability />
          ) : (
            <AllMemberAvailability />
          )}
        </div>
      </div>
    </main>
  );
}
