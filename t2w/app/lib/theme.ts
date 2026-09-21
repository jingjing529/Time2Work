"use client";
import { useSyncExternalStore } from "react";
function readTheme() {
  try {
    const saved = localStorage.getItem("time2work-theme");
    if (saved === "dark" || saved === "light") return saved === "dark";
  } catch { /* Fall back to the system preference. */ }
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

let temporaryTheme: boolean | undefined;
function themeSnapshot() { return temporaryTheme ?? readTheme(); }
function serverTheme() { return false; }
function subscribeTheme(callback: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  window.addEventListener("time2work-theme-change", callback);
  window.addEventListener("storage", callback);
  media.addEventListener("change", callback);
  return () => {
    window.removeEventListener("time2work-theme-change", callback);
    window.removeEventListener("storage", callback);
    media.removeEventListener("change", callback);
  };
}

export function useTheme() {
  const dark = useSyncExternalStore(subscribeTheme, themeSnapshot, serverTheme);
  function toggleTheme() {
    try { localStorage.setItem("time2work-theme", dark ? "light" : "dark"); temporaryTheme = undefined; }
    catch { temporaryTheme = !dark; }
    window.dispatchEvent(new Event("time2work-theme-change"));
  }
  return {dark, toggleTheme};
}
