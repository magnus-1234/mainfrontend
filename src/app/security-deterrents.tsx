"use client";

import { useEffect } from "react";

const blockedKeyCombos = (event: KeyboardEvent) => {
  const key = event.key.toLowerCase();

  return (
    event.key === "F12" ||
    (event.ctrlKey && event.shiftKey && ["c", "i", "j"].includes(key)) ||
    (event.metaKey && event.altKey && ["c", "i", "j"].includes(key)) ||
    (event.ctrlKey && ["s", "u"].includes(key)) ||
    (event.metaKey && ["s", "u"].includes(key))
  );
};

export function SecurityDeterrents() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SECURITY_DETERRENTS === "off") {
      return;
    }

    const preventDefault = (event: Event) => {
      event.preventDefault();
    };
    const preventBlockedKeys = (event: KeyboardEvent) => {
      if (blockedKeyCombos(event)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener("contextmenu", preventDefault);
    document.addEventListener("dragstart", preventDefault);
    document.addEventListener("keydown", preventBlockedKeys, true);

    return () => {
      document.removeEventListener("contextmenu", preventDefault);
      document.removeEventListener("dragstart", preventDefault);
      document.removeEventListener("keydown", preventBlockedKeys, true);
    };
  }, []);

  return null;
}
