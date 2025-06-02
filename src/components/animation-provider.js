// Create this file as components/animation-provider.js
'use client';

import { useEffect } from 'react';

export function AnimationProvider() {
  useEffect(() => {
    // Function to handle intersection observations
    const handleIntersection = (entries, observer) => {
      entries.forEach(entry => {
        // If the element is in view
        if (entry.isIntersecting) {
          // Add the visible class to trigger the animation
          entry.target.classList.add('is-visible');
          // Unobserve the element after it's been animated
          observer.unobserve(entry.target);
        }
      });
    };

    // Create an intersection observer
    const observer = new IntersectionObserver(handleIntersection, {
      root: null, // Use the viewport as root
      rootMargin: '0px', // No margin
      threshold: 0.1 // Trigger when 10% of the element is visible
    });

    // Select all elements with the animate-on-scroll class
    const elements = document.querySelectorAll('.animate-on-scroll');
    
    // Observe each element
    elements.forEach(el => {
      observer.observe(el);
    });

    // Clean up
    return () => {
      elements.forEach(el => {
        observer.unobserve(el);
      });
    };
  }, []);

  return null;
}