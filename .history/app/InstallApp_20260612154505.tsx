"use client";

import { useEffect, useState } from "react";

export default function InstallApp() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const result = await deferredPrompt.userChoice;

    if (result.outcome === "accepted") {
      setShow(false);
    }
  };

  if (!show) return null;

  return (
    <button
      onClick={install}
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        padding: 12,
        background: "black",
        color: "white",
        borderRadius: 8,
        zIndex: 9999,
      }}
    >
      تثبيت التطبيق
    </button>
  );
}