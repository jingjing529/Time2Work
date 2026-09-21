export interface TimeSlot {
  day: number;
  startHour: number;
  endHour: number;
}

/** Add a range without losing existing hours, or subtract only the covered hours. */
export function updateAvailability(slots: TimeSlot[], range: TimeSlot, mode: "add" | "remove"): TimeSlot[] {
  if (mode === "remove") {
    return slots.flatMap((slot) => {
      if (slot.day !== range.day || slot.endHour <= range.startHour || slot.startHour >= range.endHour) return [slot];
      const remaining: TimeSlot[] = [];
      if (slot.startHour < range.startHour) remaining.push({ ...slot, endHour: range.startHour });
      if (slot.endHour > range.endHour) remaining.push({ ...slot, startHour: range.endHour });
      return remaining;
    });
  }
  const sorted = [...slots, range].map((slot) => ({ ...slot })).sort((a, b) => a.day - b.day || a.startHour - b.startHour);
  const merged: TimeSlot[] = [];
  for (const slot of sorted) {
    const last = merged.at(-1);
    if (last && last.day === slot.day && last.endHour >= slot.startHour) last.endHour = Math.max(last.endHour, slot.endHour);
    else merged.push(slot);
  }
  return merged;
}
