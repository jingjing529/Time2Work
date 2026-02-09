"use client";

import { useState, useRef, useCallback } from "react";

interface TimeSlot {
  day: number; // 0-6 (Mon-Sun)
  startHour: number;
  endHour: number;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 8am to 6pm

export default function Availability() {
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ day: number; hour: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ day: number; hour: number } | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualDay, setManualDay] = useState(0);
  const [manualStartTime, setManualStartTime] = useState("09:00");
  const [manualEndTime, setManualEndTime] = useState("17:00");
  const calendarRef = useRef<HTMLDivElement>(null);

  // Check if a specific hour slot is selected
  const isSlotSelected = useCallback(
    (day: number, hour: number) => {
      return selectedSlots.some(
        (slot) =>
          slot.day === day && hour >= slot.startHour && hour < slot.endHour
      );
    },
    [selectedSlots]
  );

  // Check if a slot is in the current drag selection
  const isInDragSelection = useCallback(
    (day: number, hour: number) => {
      if (!isDragging || !dragStart || !dragEnd) return false;
      if (day !== dragStart.day) return false;

      const minHour = Math.min(dragStart.hour, dragEnd.hour);
      const maxHour = Math.max(dragStart.hour, dragEnd.hour);
      return hour >= minHour && hour <= maxHour;
    },
    [isDragging, dragStart, dragEnd]
  );

  // Handle mouse down on a cell
  const handleMouseDown = (day: number, hour: number) => {
    setIsDragging(true);
    setDragStart({ day, hour });
    setDragEnd({ day, hour });
  };

  // Handle mouse enter on a cell (during drag)
  const handleMouseEnter = (day: number, hour: number) => {
    if (isDragging && dragStart && dragStart.day === day) {
      setDragEnd({ day, hour });
    }
  };

  // Handle mouse up - finalize selection
  const handleMouseUp = () => {
    if (isDragging && dragStart && dragEnd && dragStart.day === dragEnd.day) {
      const minHour = Math.min(dragStart.hour, dragEnd.hour);
      const maxHour = Math.max(dragStart.hour, dragEnd.hour) + 1;

      // Check if we're clicking on an already selected slot
      const existingSlotIndex = selectedSlots.findIndex(
        (slot) =>
          slot.day === dragStart.day &&
          dragStart.hour >= slot.startHour &&
          dragStart.hour < slot.endHour
      );

      if (existingSlotIndex !== -1 && dragStart.hour === dragEnd.hour) {
        // Remove the slot if clicking on it
        setSelectedSlots((prev) => prev.filter((_, i) => i !== existingSlotIndex));
      } else {
        // Add or merge new slot
        const newSlot: TimeSlot = {
          day: dragStart.day,
          startHour: minHour,
          endHour: maxHour,
        };

        setSelectedSlots((prev) => {
          // Remove overlapping slots on the same day
          const filtered = prev.filter(
            (slot) =>
              slot.day !== newSlot.day ||
              slot.endHour <= newSlot.startHour ||
              slot.startHour >= newSlot.endHour
          );

          // Merge with adjacent slots
          const sameDaySlots = [...filtered.filter((s) => s.day === newSlot.day), newSlot].sort(
            (a, b) => a.startHour - b.startHour
          );

          const merged: TimeSlot[] = [];
          for (const slot of sameDaySlots) {
            if (merged.length === 0) {
              merged.push(slot);
            } else {
              const last = merged[merged.length - 1];
              if (last.endHour >= slot.startHour) {
                last.endHour = Math.max(last.endHour, slot.endHour);
              } else {
                merged.push(slot);
              }
            }
          }

          return [...filtered.filter((s) => s.day !== newSlot.day), ...merged];
        });
      }
    }

    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  // Handle manual time input
  const handleAddManualSlot = () => {
    const startHour = parseInt(manualStartTime.split(":")[0]);
    const endHour = parseInt(manualEndTime.split(":")[0]);

    if (startHour >= endHour || startHour < 8 || endHour > 18) {
      alert("Please enter valid times between 8:00 and 18:00");
      return;
    }

    const newSlot: TimeSlot = {
      day: manualDay,
      startHour,
      endHour,
    };

    setSelectedSlots((prev) => {
      const filtered = prev.filter(
        (slot) =>
          slot.day !== newSlot.day ||
          slot.endHour <= newSlot.startHour ||
          slot.startHour >= newSlot.endHour
      );

      const sameDaySlots = [...filtered.filter((s) => s.day === newSlot.day), newSlot].sort(
        (a, b) => a.startHour - b.startHour
      );

      const merged: TimeSlot[] = [];
      for (const slot of sameDaySlots) {
        if (merged.length === 0) {
          merged.push(slot);
        } else {
          const last = merged[merged.length - 1];
          if (last.endHour >= slot.startHour) {
            last.endHour = Math.max(last.endHour, slot.endHour);
          } else {
            merged.push(slot);
          }
        }
      }

      return [...filtered.filter((s) => s.day !== newSlot.day), ...merged];
    });

    setShowManualInput(false);
  };

  // Clear all selections
  const handleClearAll = () => {
    setSelectedSlots([]);
  };

  // Format hour for display
  const formatHour = (hour: number) => {
    if (hour === 12) return "12 PM";
    if (hour > 12) return `${hour - 12} PM`;
    return `${hour} AM`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4285F4] to-[#4285F4]/70 flex items-center justify-center">
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">My Availability</h2>
            <p className="text-sm text-gray-500">Drag to select your available time slots</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowManualInput(!showManualInput)}
            className="px-4 py-2 text-sm font-medium text-[#4285F4] bg-[#4285F4]/10 rounded-lg hover:bg-[#4285F4]/20 transition-colors"
          >
            {showManualInput ? "Hide Input" : "Manual Input"}
          </button>
          {selectedSlots.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Manual Input Panel */}
      {showManualInput && (
        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Add Time Slot Manually</h3>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Day</label>
              <select
                value={manualDay}
                onChange={(e) => setManualDay(parseInt(e.target.value))}
                className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/50 focus:border-[#4285F4]"
              >
                {DAYS.map((day, i) => (
                  <option key={day} value={i}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Start Time</label>
              <select
                value={manualStartTime}
                onChange={(e) => setManualStartTime(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/50 focus:border-[#4285F4]"
              >
                {HOURS.slice(0, -1).map((hour) => (
                  <option key={hour} value={`${hour.toString().padStart(2, "0")}:00`}>
                    {formatHour(hour)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">End Time</label>
              <select
                value={manualEndTime}
                onChange={(e) => setManualEndTime(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/50 focus:border-[#4285F4]"
              >
                {HOURS.slice(1).map((hour) => (
                  <option key={hour} value={`${hour.toString().padStart(2, "0")}:00`}>
                    {formatHour(hour)}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAddManualSlot}
              className="px-5 py-2 bg-[#34A853] text-white text-sm font-medium rounded-lg hover:bg-[#34A853]/90 transition-colors shadow-sm"
            >
              Add Slot
            </button>
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <div
        ref={calendarRef}
        className="select-none"
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Day Headers */}
            <div className="grid grid-cols-8 gap-1 mb-1">
              <div className="h-10"></div>
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="h-10 flex items-center justify-center text-sm font-semibold text-gray-700 bg-gray-50 rounded-lg"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Time Rows */}
            {HOURS.map((hour) => (
              <div key={hour} className="grid grid-cols-8 gap-1 mb-1">
                {/* Time Label */}
                <div className="h-12 flex items-center justify-end pr-3 text-xs text-gray-500">
                  {formatHour(hour)}
                </div>

                {/* Day Cells */}
                {DAYS.map((_, dayIndex) => {
                  const isSelected = isSlotSelected(dayIndex, hour);
                  const isDragSelected = isInDragSelection(dayIndex, hour);

                  return (
                    <div
                      key={`${dayIndex}-${hour}`}
                      className={`h-12 rounded-lg border-2 cursor-pointer transition-all duration-100 ${
                        isSelected
                          ? "bg-[#34A853] border-[#34A853] shadow-sm"
                          : isDragSelected
                          ? "bg-[#34A853]/50 border-[#34A853]/70"
                          : "bg-gray-50 border-transparent hover:bg-gray-100 hover:border-gray-200"
                      }`}
                      onMouseDown={() => handleMouseDown(dayIndex, hour)}
                      onMouseEnter={() => handleMouseEnter(dayIndex, hour)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend & Summary */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#34A853]"></div>
              <span className="text-sm text-gray-600">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-100 border border-gray-200"></div>
              <span className="text-sm text-gray-600">Unavailable</span>
            </div>
          </div>

          {selectedSlots.length > 0 && (
            <div className="text-sm text-gray-500">
              {selectedSlots.length} time slot{selectedSlots.length > 1 ? "s" : ""} selected
            </div>
          )}
        </div>

        {/* Selected Slots Summary */}
        {selectedSlots.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {selectedSlots
              .sort((a, b) => a.day - b.day || a.startHour - b.startHour)
              .map((slot, i) => (
                <div
                  key={i}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#34A853]/10 text-[#34A853] rounded-full text-sm font-medium"
                >
                  <span>
                    {DAYS[slot.day]} {formatHour(slot.startHour)} - {formatHour(slot.endHour)}
                  </span>
                  <button
                    onClick={() => setSelectedSlots((prev) => prev.filter((_, idx) => idx !== i))}
                    className="hover:bg-[#34A853]/20 rounded-full p-0.5 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
