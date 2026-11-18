import { useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";

/**
 * After a client-side navigation to a different path: moves focus to the page
 * h1 (or <main>) and announces the new document title in a polite live region.
 * Does nothing on the initial load.
 */
export function RouteAnnouncer() {
  const router = useRouter();
  const [message, setMessage] = useState("");

  useEffect(() => {
    let frame = 0;
    const unsubscribe = router.subscribe("onResolved", (event) => {
      if (!event.pathChanged) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const main = document.getElementById("main");
        const target = main?.querySelector<HTMLElement>("h1") ?? main;
        if (target) {
          if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
          target.focus({ preventScroll: true });
        }
        setMessage(document.title);
      });
    });
    return () => {
      cancelAnimationFrame(frame);
      unsubscribe();
    };
  }, [router]);

  return (
    <div className="u-visually-hidden" role="status" aria-live="polite" aria-atomic="true">
      {message}
    </div>
  );
}
