// hooks/useScrollAnimation.js
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

export function useScrollAnimation() {
  const [elements, setElements] = useState([]);
  const observer = useRef(null);

  useEffect(() => {
    // On mobile, skip IntersectionObserver — CSS handles instant visibility
    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    if (isMobile) {
      // Immediately mark all tracked elements as visible
      elements.forEach(el => {
        if (el) el.classList.add('is-visible');
      });
      return;
    }

    // Desktop: full IntersectionObserver
    observer.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.current.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    });

    elements.forEach(element => {
      if (element) {
        observer.current.observe(element);
      }
    });

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [elements]);

  // Add an element to be observed
  const ref = useCallback((element) => {
    if (element && !elements.includes(element)) {
      setElements(prev => [...prev, element]);
    }
  }, [elements]);

  return { ref };
}
