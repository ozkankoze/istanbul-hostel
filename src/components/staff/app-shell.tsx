"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, EllipsisVertical, Share, WifiOff, X } from "lucide-react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const DISMISS_KEY = "hk-install-dismissed";
const REFRESH_MS = 45_000;

/** Phone-app behaviour for /staff: service worker, install prompt, live refresh, offline notice. */
export function StaffAppShell() {
  const router = useRouter();
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [offline, setOffline] = useState(false);
  // Fallback when the browser gives no install prompt (iPhone, Samsung Internet, in-app browsers, slow Chrome heuristics).
  const [manual, setManual] = useState<null | "ios" | "android">(null);
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/hk-sw.js", { scope: "/" }).catch(() => {});
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      let dismissed = false;
      try {
        dismissed = localStorage.getItem(DISMISS_KEY) === "1";
      } catch {}
      if (!dismissed) setInstallEvent(e as InstallEvent);
    };
    const onInstalled = () => setInstallEvent(null);
    const onOnline = () => {
      setOffline(false);
      router.refresh();
    };
    const onOffline = () => setOffline(true);
    const onVisible = () => {
      if (document.visibilityState === "visible" && navigator.onLine) router.refresh();
    };

    let gotPrompt = false;
    const markPrompt = () => {
      gotPrompt = true;
      setManual(null);
    };
    window.addEventListener("beforeinstallprompt", markPrompt);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const fallback = window.setTimeout(() => {
      let dismissed = false;
      try {
        dismissed = localStorage.getItem(DISMISS_KEY) === "1";
      } catch {}
      if (gotPrompt || standalone || dismissed) return;
      const ua = navigator.userAgent;
      const ios = /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
      setManual(ios ? "ios" : "android");
    }, 2500);

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", onVisible);

    // Keep the board live while the app is open, so a room cleaned by a colleague shows up.
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible" && navigator.onLine) router.refresh();
    }, REFRESH_MS);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("beforeinstallprompt", markPrompt);
      window.clearTimeout(fallback);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(timer);
    };
  }, [router]);

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice.catch(() => null);
    setInstallEvent(null);
  }

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
    setInstallEvent(null);
    setManual(null);
  }

  return (
    <>
      {offline ? (
        <div role="status" className="sticky top-14 z-20 flex items-center justify-center gap-2 bg-tulip px-4 py-2 text-[13px] font-medium text-paper">
          <WifiOff className="size-4" aria-hidden /> No connection. Changes will not save until you are back online.
        </div>
      ) : null}
      {installEvent ? (
        <div className="fixed inset-x-3 bottom-[calc(76px+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-ink p-3 pl-4 text-paper shadow-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hk/icon-192.png" alt="" className="size-10 rounded-xl" />
          <div className="min-w-0 flex-1 text-[13.5px] leading-snug">
            <p className="font-semibold">Install the staff app</p>
            <p className="text-paper/70">Opens full screen from your home screen.</p>
          </div>
          <button onClick={install} className="flex items-center gap-1.5 rounded-lg bg-tile-bright px-3 py-2 text-[13px] font-semibold text-ink">
            <Download className="size-4" aria-hidden /> Install
          </button>
          <button onClick={dismiss} aria-label="Not now" className="rounded-md p-1 text-paper/60 hover:text-paper">
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ) : null}
      {!installEvent && manual ? (
        <div className="fixed inset-x-3 bottom-[calc(76px+env(safe-area-inset-bottom))] z-40 mx-auto max-w-md rounded-2xl bg-ink p-3 pl-4 text-paper shadow-xl">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/hk/icon-192.png" alt="" className="size-10 rounded-xl" />
            <div className="min-w-0 flex-1 text-[13.5px] leading-snug">
              <p className="font-semibold">Add the staff app to your home screen</p>
              <p className="text-paper/70">Two taps, no app store.</p>
            </div>
            <button
              onClick={() => setShowSteps((v) => !v)}
              className="rounded-lg bg-tile-bright px-3 py-2 text-[13px] font-semibold text-ink"
              aria-expanded={showSteps}
            >
              {showSteps ? "Hide" : "How?"}
            </button>
            <button onClick={dismiss} aria-label="Not now" className="rounded-md p-1 text-paper/60 hover:text-paper">
              <X className="size-4" aria-hidden />
            </button>
          </div>
          {showSteps ? (
            <ol className="mt-3 list-decimal space-y-1.5 border-t border-white/10 pl-5 pt-3 text-[13.5px]">
              {manual === "ios" ? (
                <>
                  <li>Open this page in <strong>Safari</strong>.</li>
                  <li>
                    Tap <Share className="inline size-4 align-[-2px]" aria-label="Share" /> <strong>Share</strong> at the bottom.
                  </li>
                  <li>
                    Choose <strong>Add to Home Screen</strong>, then <strong>Add</strong>.
                  </li>
                </>
              ) : (
                <>
                  <li>Open this page in <strong>Chrome</strong> (not inside WhatsApp or Instagram).</li>
                  <li>
                    Tap the menu <EllipsisVertical className="inline size-4 align-[-2px]" aria-label="menu" /> at the top right.
                  </li>
                  <li>
                    Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                  </li>
                </>
              )}
            </ol>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
