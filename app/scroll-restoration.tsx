"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const STORAGE_KEY = "xv-scroll-restore";
const SCROLL_CONTAINER_SELECTOR =
  "[data-scroll-preserve], .xv-table-scroll, .xv-inline-scroll";

type StoredScrollState = {
  pathname: string;
  createdAt: number;
  windowX: number;
  windowY: number;
  containers: Array<{
    key: string;
    left: number;
    top: number;
  }>;
};

function getTrackedScrollContainers() {
  const elements = Array.from(
    document.querySelectorAll<HTMLElement>(SCROLL_CONTAINER_SELECTOR),
  );

  return elements.map((element, index) => ({
    element,
    key: getScrollContainerKey(element, index),
  }));
}

function getScrollContainerKey(element: HTMLElement, index: number) {
  const explicitKey = element.dataset.scrollPreserve;

  if (explicitKey) {
    return explicitKey;
  }

  return `${element.tagName}:${element.className}:${index}`;
}

function persistCurrentScroll(pathname: string) {
  const state: StoredScrollState = {
    pathname,
    createdAt: Date.now(),
    windowX: window.scrollX,
    windowY: window.scrollY,
    containers: getTrackedScrollContainers().map(({ element, key }) => ({
      key,
      left: element.scrollLeft,
      top: element.scrollTop,
    })),
  };

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function readStoredScroll() {
  const rawValue = sessionStorage.getItem(STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as StoredScrollState;
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function restoreScroll(state: StoredScrollState) {
  window.scrollTo({
    left: state.windowX,
    top: state.windowY,
    behavior: "auto",
  });

  const currentContainers = getTrackedScrollContainers();

  for (const savedContainer of state.containers) {
    const match = currentContainers.find((container) => container.key === savedContainer.key);

    if (!match) {
      continue;
    }

    match.element.scrollLeft = savedContainer.left;
    match.element.scrollTop = savedContainer.top;
  }
}

export function ScrollRestoration() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamKey = searchParams.toString();

  useEffect(() => {
    const handleSubmit = () => {
      persistCurrentScroll(pathname);
    };

    document.addEventListener("submit", handleSubmit, true);

    return () => {
      document.removeEventListener("submit", handleSubmit, true);
    };
  }, [pathname]);

  useEffect(() => {
    const state = readStoredScroll();

    if (!state) {
      return;
    }

    if (state.pathname !== pathname || Date.now() - state.createdAt > 2 * 60 * 1000) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }

    const firstFrame = window.requestAnimationFrame(() => {
      restoreScroll(state);

      window.setTimeout(() => {
        restoreScroll(state);
        sessionStorage.removeItem(STORAGE_KEY);
      }, 80);
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
    };
  }, [pathname, searchParamKey]);

  return null;
}
