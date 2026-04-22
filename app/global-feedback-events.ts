import type { FeedbackEntry } from "@/lib/post-action-feedback";

export const GLOBAL_FEEDBACK_EVENT = "xv:global-feedback";

export type GlobalFeedbackDetail = FeedbackEntry | FeedbackEntry[];

export function dispatchGlobalFeedback(detail: GlobalFeedbackDetail) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<GlobalFeedbackDetail>(GLOBAL_FEEDBACK_EVENT, {
      detail,
    }),
  );
}
