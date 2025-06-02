// Create this file as hooks/useScrollAnimation.js
'use client';

import { useEffect, useState, useRef } from 'react';

export function useScrollAnimation() {
  const [elements, setElements] = useState([]);
  const observer = useRef(null);

  useEffect(() => {
    // Create a new IntersectionObserver
    observer.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Add the visible class when the element is in view
          entry.target.classList.add('is-visible');
          // Stop observing the element
          observer.current.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1, // Trigger when 10% of the element is visible
      rootMargin: '0px 0px -100px 0px' // Adjust this to control when animations trigger
    });

    // Observe all elements
    elements.forEach(element => {
      if (element) {
        observer.current.observe(element);
      }
    });

    // Clean up
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [elements]);

  // Add an element to be observed
  const ref = (element) => {
    if (element && !elements.includes(element)) {
      setElements(prev => [...prev, element]);
    }
  };

  return { ref };
}