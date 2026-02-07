// components/animation-provider.js
'use client';

import { useEffect } from 'react';

export function AnimationProvider() {
  useEffect(() => {
    // On mobile (≤768px), skip IntersectionObserver entirely.
    // CSS already forces all animate-on-scroll elements to be visible,
    // but we still add the class for any JS that checks it.
    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    if (isMobile) {
      // Immediately reveal all scroll-animated elements — no observer overhead
      const elements = document.querySelectorAll('.animate-on-scroll');
      elements.forEach(el => el.classList.add('is-visible'));
      return; // No cleanup needed
    }

    // Desktop: full IntersectionObserver experience
    const handleIntersection = (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    });

    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach(el => observer.observe(el));

    return () => {
      elements.forEach(el => observer.unobserve(el));
    };
  }, []);

  return null;
}
