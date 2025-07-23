import React from "react";

// Performance optimization utilities

// Preload critical components
export const preloadComponent = (importFn: () => Promise<any>) => {
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = importFn.toString();
  document.head.appendChild(link);
};

// Intersection Observer for lazy loading
export const createIntersectionObserver = (
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit = {},
) => {
  return new IntersectionObserver(callback, {
    rootMargin: "50px",
    threshold: 0.1,
    ...options,
  });
};

// Debounce utility for performance
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle utility for performance
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Bundle size monitoring
export const getBundleSize = () => {
  if (typeof window !== "undefined" && "performance" in window) {
    const navigation = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming;
    return {
      loadTime: navigation.loadEventEnd - navigation.loadEventStart,
      domContentLoaded:
        navigation.domContentLoadedEventEnd -
        navigation.domContentLoadedEventStart,
      firstPaint: performance.getEntriesByName("first-paint")[0]?.startTime,
      firstContentfulPaint: performance.getEntriesByName(
        "first-contentful-paint",
      )[0]?.startTime,
    };
  }
  return null;
};

// Memory usage monitoring
export const getMemoryUsage = () => {
  if ("memory" in performance) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    };
  }
  return null;
};

// Component loading optimization
export const withLoadingOptimization = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode,
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const [isLoaded, setIsLoaded] = React.useState(false);

    React.useEffect(() => {
      const timer = setTimeout(() => setIsLoaded(true), 100);
      return () => clearTimeout(timer);
    }, []);

    if (!isLoaded && fallback) {
      return React.createElement(React.Fragment, null, fallback);
    }

    return React.createElement(Component, { ...props, ref } as any);
  });
};

// Image optimization
export const optimizeImage = (src: string, width?: number, quality = 80) => {
  if (!src) return src;

  // Add image optimization parameters
  const url = new URL(src, window.location.origin);
  if (width) url.searchParams.set("w", width.toString());
  url.searchParams.set("q", quality.toString());
  url.searchParams.set("auto", "format");

  return url.toString();
};

// Critical CSS injection
export const injectCriticalCSS = (css: string) => {
  const style = document.createElement("style");
  style.textContent = css;
  style.setAttribute("data-critical", "true");
  document.head.appendChild(style);
};

// Resource hints
export const addResourceHints = (urls: string[]) => {
  urls.forEach((url) => {
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = url;
    document.head.appendChild(link);
  });
};
