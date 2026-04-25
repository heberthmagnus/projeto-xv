import type { ReactNode } from "react";

const maxWidthClasses = {
  default: "max-w-5xl",
  wide: "max-w-6xl",
  narrow: "max-w-4xl",
} as const;

type PageContainerProps = {
  children: ReactNode;
  className?: string;
  size?: keyof typeof maxWidthClasses;
};

export function PageContainer({
  children,
  className = "",
  size = "default",
}: PageContainerProps) {
  return (
    <div
      className={[
        "mx-auto w-full min-w-0 max-w-full overflow-x-hidden px-4 md:px-6 lg:px-8",
        maxWidthClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
