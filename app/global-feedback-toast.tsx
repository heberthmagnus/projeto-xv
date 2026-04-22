"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { GLOBAL_FEEDBACK_EVENT, type GlobalFeedbackDetail } from "./global-feedback-events";
import {
  resolvePostActionFeedback,
  type FeedbackEntry,
} from "@/lib/post-action-feedback";

type ActiveToast = FeedbackEntry & {
  id: string;
};

const TOAST_TIMEOUT_MS: Record<FeedbackEntry["tone"], number> = {
  success: 4200,
  warning: 5600,
  error: 7000,
};

export function GlobalFeedbackToast() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [toasts, setToasts] = useState<ActiveToast[]>([]);
  const handledLocationRef = useRef("");
  const timeoutsRef = useRef(new Map<string, number>());

  const dismissToast = (id: string) => {
    const timeoutId = timeoutsRef.current.get(id);

    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timeoutsRef.current.delete(id);
    }

    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
  };

  const enqueueFeedback = (entries: FeedbackEntry[]) => {
    if (entries.length === 0) {
      return;
    }

    setToasts((currentToasts) => {
      const nextToasts = [...currentToasts];

      for (const entry of entries) {
        const id = `${entry.key}:${Date.now()}`;

        nextToasts.push({
          ...entry,
          id,
        });

        const timeoutId = window.setTimeout(() => {
          dismissToast(id);
        }, TOAST_TIMEOUT_MS[entry.tone]);

        timeoutsRef.current.set(id, timeoutId);
      }

      const trimmedToasts = nextToasts.slice(-4);
      const visibleToastIds = new Set(trimmedToasts.map((toast) => toast.id));

      for (const [toastId, timeoutId] of timeoutsRef.current.entries()) {
        if (visibleToastIds.has(toastId)) {
          continue;
        }

        window.clearTimeout(timeoutId);
        timeoutsRef.current.delete(toastId);
      }

      return trimmedToasts;
    });
  };

  useEffect(() => {
    const handleFeedbackEvent = (event: Event) => {
      const customEvent = event as CustomEvent<GlobalFeedbackDetail>;
      const entries = Array.isArray(customEvent.detail)
        ? customEvent.detail
        : [customEvent.detail];

      enqueueFeedback(entries);
    };

    window.addEventListener(GLOBAL_FEEDBACK_EVENT, handleFeedbackEvent);

    return () => {
      window.removeEventListener(GLOBAL_FEEDBACK_EVENT, handleFeedbackEvent);
    };
  }, []);

  useEffect(() => {
    const search = searchParams.toString();
    const locationKey = `${pathname}?${search}`;

    if (!search) {
      handledLocationRef.current = locationKey;
      return;
    }

    if (handledLocationRef.current === locationKey) {
      return;
    }

    const entries = resolvePostActionFeedback(pathname, searchParams);

    if (entries.length === 0) {
      handledLocationRef.current = locationKey;
      return;
    }

    handledLocationRef.current = locationKey;
    enqueueFeedback(entries);

    const nextParams = new URLSearchParams(search);
    nextParams.delete("success");
    nextParams.delete("error");
    nextParams.delete("warning");

    const nextUrl =
      nextParams.size > 0
        ? `${pathname}?${nextParams.toString()}`
        : pathname;

    window.history.replaceState(window.history.state, "", nextUrl);
  }, [pathname, searchParams]);

  useEffect(() => {
    return () => {
      for (const timeoutId of timeoutsRef.current.values()) {
        window.clearTimeout(timeoutId);
      }

      timeoutsRef.current.clear();
    };
  }, []);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="xv-toast-viewport" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={[
            "xv-toast",
            toast.tone === "success" ? "xv-toast-success" : "",
            toast.tone === "error" ? "xv-toast-error" : "",
            toast.tone === "warning" ? "xv-toast-warning" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          role={toast.tone === "error" ? "alert" : "status"}
        >
          <div className="xv-toast-copy">
            <strong className="xv-toast-title">
              {toast.tone === "success"
                ? "Sucesso"
                : toast.tone === "error"
                  ? "Erro"
                  : "Aviso"}
            </strong>
            <p className="xv-toast-message">{toast.message}</p>
          </div>

          <button
            type="button"
            className="xv-toast-close"
            onClick={() => dismissToast(toast.id)}
            aria-label="Fechar aviso"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
