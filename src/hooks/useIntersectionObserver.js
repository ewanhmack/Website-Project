import { useEffect, useRef } from "react";

export function useIntersectionObserver(callback, options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        callback();
      }
    }, options);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [callback, options]);

  return ref;
}
