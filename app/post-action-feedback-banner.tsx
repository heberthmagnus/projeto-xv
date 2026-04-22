import { resolvePostActionFeedback } from "@/lib/post-action-feedback";

export function PostActionFeedbackBanner({
  pathname,
  searchParams,
  subtle = true,
}: {
  pathname: string;
  searchParams: {
    success?: string;
    error?: string;
    warning?: string;
  };
  subtle?: boolean;
}) {
  const entries = resolvePostActionFeedback(pathname, searchParams);

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="xv-feedback-stack">
      {entries.map((entry) => (
        <div
          key={entry.key}
          className={[
            "xv-feedback-banner",
            entry.tone === "success" ? "xv-feedback-banner-success" : "",
            entry.tone === "error" ? "xv-feedback-banner-error" : "",
            entry.tone === "warning" ? "xv-feedback-banner-warning" : "",
            subtle ? "xv-feedback-banner-fallback" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          role={entry.tone === "error" ? "alert" : "status"}
          aria-live={entry.tone === "error" ? "assertive" : "polite"}
        >
          {entry.message}
        </div>
      ))}
    </div>
  );
}
