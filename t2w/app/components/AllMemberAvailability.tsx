"use client";

export default function AllMemberAvailability() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#34A853] to-[#34A853]/70 flex items-center justify-center">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Team Availability</h2>
          <p className="text-sm text-gray-500">View all members&apos; schedules</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Placeholder content */}
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-[#34A853]/10 flex items-center justify-center mb-4">
            <svg
              className="w-10 h-10 text-[#34A853]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Team Schedule Overview
          </h3>
          <p className="text-gray-500 max-w-sm">
            Here you can view all team members&apos; availability and find the best time for meetings.
          </p>
          <button className="mt-6 px-6 py-2.5 bg-[#34A853] text-white rounded-xl font-medium hover:bg-[#34A853]/90 transition-colors shadow-md shadow-[#34A853]/25">
            View Team Calendar
          </button>
        </div>
      </div>
    </div>
  );
}

