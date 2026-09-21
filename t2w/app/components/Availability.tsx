"use client";

import { useState, useRef, useCallback } from "react";

import { updateAvailability, type TimeSlot } from "../lib/availability";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Availability({slots, onChange,days=DAYS,startHour:rangeStart=8,endHour:rangeEnd=19}: {startHour?:number;endHour?:number;days?:string[];slots?: TimeSlot[]; onChange?: (slots: TimeSlot[]) => void} = {}) {
  const HOURS=Array.from({length:rangeEnd-rangeStart},(_,i)=>i+rangeStart);
  const [localSlots, setLocalSlots] = useState<TimeSlot[]>([]);
  const selectedSlots = slots ?? localSlots;
  const setSelectedSlots = (value: TimeSlot[] | ((prev: TimeSlot[]) => TimeSlot[])) => {
    const next = typeof value === "function" ? value(selectedSlots) : value;
    if (onChange) onChange(next); else setLocalSlots(next);
  };
  const [dragMode, setDragMode] = useState<"add" | "remove">("add");
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ day: number; hour: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ day: number; hour: number } | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualDay, setManualDay] = useState(0);
  const [manualStartTime, setManualStartTime] = useState(`${String(rangeStart).padStart(2,"0")}:00`);
  const [manualEndTime, setManualEndTime] = useState(`${String(rangeEnd).padStart(2,"0")}:00`);
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
    setDragMode(isSlotSelected(day, hour) ? "remove" : "add");
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

      setSelectedSlots((prev) => updateAvailability(prev, {
        day: dragStart.day,
        startHour: minHour,
        endHour: maxHour,
      }, dragMode));
    }

    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  // Handle manual time input
  const handleAddManualSlot = () => {
    const startHour = parseInt(manualStartTime.split(":")[0]);
    const endHour = parseInt(manualEndTime.split(":")[0]);

    if (startHour >= endHour || startHour < rangeStart || endHour > rangeEnd) {
      alert(`Please enter valid times between ${rangeStart}:00 and ${rangeEnd}:00`);
      return;
    }

    const newSlot: TimeSlot = {
      day: manualDay,
      startHour,
      endHour,
    };

    setSelectedSlots((prev) => updateAvailability(prev, newSlot, "add"));

    setShowManualInput(false);
  };

  // Clear all selections
  const handleClearAll = () => {
    setSelectedSlots([]);
  };

  // Format hour for display
  const formatHour = (hour: number) => {
    if (hour === 0 || hour === 24) return "12 AM";
    if (hour === 12) return "12 PM";
    if (hour > 12) return `${hour - 12} PM`;
    return `${hour} AM`;
  };

  return (
    <div className="text-[var(--ink,#17243c)] bg-[var(--surface,#fff)] rounded-2xl shadow-sm border border-[var(--line,#e3e8ef)] p-6">
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
            <h2 className="text-xl font-semibold text-[var(--ink,#17243c)]">My Availability</h2>
            <p className="text-sm text-[var(--muted,#667085)]">Click or drag empty slots to add; green slots to remove</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowManualInput(!showManualInput)}
            className="px-4 py-2 text-sm font-medium text-[var(--accent,#4285f4)] bg-[#4285F4]/10 rounded-lg hover:bg-[#4285F4]/20 transition-colors"
          >
            {showManualInput ? "Hide Input" : "Manual Input"}
          </button>
          {selectedSlots.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-4 py-2 text-sm font-medium text-[#e36b75] bg-[#e36b75]/10 rounded-lg hover:bg-[#e36b75]/20 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Manual Input Panel */}
      {showManualInput && (
        <div className="mb-6 p-4 bg-[var(--canvas,#f7f9fc)] rounded-xl border border-[var(--line,#e3e8ef)]">
          <h3 className="text-sm font-medium text-[var(--ink,#17243c)] mb-3">Add Time Slot Manually</h3>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs text-[var(--muted,#667085)] mb-1">Day</label>
              <select
                value={manualDay}
                onChange={(e) => setManualDay(parseInt(e.target.value))}
                className="px-3 py-2 bg-[var(--surface,#fff)] border border-[var(--line,#e3e8ef)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/50 focus:border-[#4285F4]"
              >
                {days.map((day, i) => (
                  <option key={day} value={i}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--muted,#667085)] mb-1">Start Time</label>
              <select
                value={manualStartTime}
                onChange={(e) => setManualStartTime(e.target.value)}
                className="px-3 py-2 bg-[var(--surface,#fff)] border border-[var(--line,#e3e8ef)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/50 focus:border-[#4285F4]"
              >
                {HOURS.map((hour) => (
                  <option key={hour} value={`${hour.toString().padStart(2, "0")}:00`}>
                    {formatHour(hour)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--muted,#667085)] mb-1">End Time</label>
              <select
                value={manualEndTime}
                onChange={(e) => setManualEndTime(e.target.value)}
                className="px-3 py-2 bg-[var(--surface,#fff)] border border-[var(--line,#e3e8ef)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/50 focus:border-[#4285F4]"
              >
                {HOURS.map(hour=>hour+1).map((hour) => (
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
            <div className="grid gap-1 mb-1" style={{gridTemplateColumns:`64px repeat(${days.length}, minmax(64px,1fr))`}}>
              <div className="h-10"></div>
              {days.map((day) => (
                <div
                  key={day}
                  className="h-10 flex items-center justify-center text-sm font-semibold text-[var(--ink,#17243c)] bg-[var(--canvas,#f7f9fc)] rounded-lg"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Time Rows */}
            {HOURS.map((hour) => (
              <div key={hour} className="grid gap-1 mb-1" style={{gridTemplateColumns:`64px repeat(${days.length}, minmax(64px,1fr))`}}>
                {/* Time Label */}
                <div className="h-12 flex items-center justify-end pr-3 text-xs text-[var(--muted,#667085)]">
                  {formatHour(hour)}
                </div>

                {/* Day Cells */}
                {days.map((_, dayIndex) => {
                  const isSelected = isSlotSelected(dayIndex, hour);
                  const isDragSelected = isInDragSelection(dayIndex, hour);

                  return (
                    <button
                      type="button"
                      aria-label={`${days[dayIndex]} ${formatHour(hour)} - ${formatHour(hour + 1)}`}
                      aria-pressed={isDragSelected ? dragMode === "add" : isSelected}
                      key={`${dayIndex}-${hour}`}
                      className={`h-12 rounded-lg border-2 cursor-pointer transition-all duration-100 ${
                        isDragSelected
                          ? dragMode === "remove"
                            ? "bg-[color-mix(in_srgb,var(--ink,#17243c)_8%,var(--surface,#fff))] border-[var(--line,#e3e8ef)] border-dashed"
                            : "bg-[#34A853]/50 border-[#34A853]/70"
                          : isSelected
                          ? "bg-[#34A853] border-[#34A853] shadow-sm"

                          : "bg-[var(--canvas,#f7f9fc)] border-transparent hover:bg-[color-mix(in_srgb,var(--ink,#17243c)_8%,var(--surface,#fff))] hover:border-[var(--line,#e3e8ef)]"
                      }`}
                      onMouseDown={(event) => { if (event.button === 0) handleMouseDown(dayIndex, hour); }}
                      onClick={(event) => {
                        if (event.detail === 0) setSelectedSlots((prev) => updateAvailability(prev, {day: dayIndex, startHour: hour, endHour: hour + 1}, isSelected ? "remove" : "add"));
                      }}
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
      <div className="mt-6 pt-4 border-t border-[var(--line,#e3e8ef)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#34A853]"></div>
              <span className="text-sm text-[var(--muted,#667085)]">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[color-mix(in_srgb,var(--ink,#17243c)_8%,var(--surface,#fff))] border border-[var(--line,#e3e8ef)]"></div>
              <span className="text-sm text-[var(--muted,#667085)]">Unavailable</span>
            </div>
          </div>

          {selectedSlots.length > 0 && (
            <div className="text-sm text-[var(--muted,#667085)]">
              {selectedSlots.length} time slot{selectedSlots.length > 1 ? "s" : ""} selected
            </div>
          )}
        </div>

        {/* Selected Slots Summary */}
        {selectedSlots.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {[...selectedSlots]
              .sort((a, b) => a.day - b.day || a.startHour - b.startHour)
              .map((slot, i) => (
                <div
                  key={i}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#34A853]/10 text-[var(--available-ink,#279747)] rounded-full text-sm font-medium"
                >
                  <span>
                    {days[slot.day]} {formatHour(slot.startHour)} - {formatHour(slot.endHour)}
                  </span>
                  <button
                    aria-label={`Remove ${days[slot.day]} ${formatHour(slot.startHour)} - ${formatHour(slot.endHour)}`}
                    onClick={() => setSelectedSlots((prev) => prev.filter((item) => item !== slot))}
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
