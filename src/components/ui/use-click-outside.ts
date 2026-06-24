import { useEffect } from "react";

/** Dismisses popover when click lands outside the anchored ref. */
export function useClickOutside(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [ref, onClose]);
}

/** Global Escape handler — enable only while overlay is open to avoid leaks. */
export function useEscapeKey(onClose: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose, enabled]);
}
