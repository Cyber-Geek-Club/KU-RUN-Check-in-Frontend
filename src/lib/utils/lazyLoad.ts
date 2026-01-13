// Lazy load utility for background images and elements
import { onMount } from 'svelte';

export interface LazyLoadOptions {
  rootMargin?: string;
  threshold?: number;
}

/**
 * Svelte action for lazy loading background images
 * Usage: <div use:lazyLoadBg={imageUrl} />
 */
export function lazyLoadBg(node: HTMLElement, imageUrl: string) {
  let observer: IntersectionObserver;
  
  const setBackground = () => {
    if (imageUrl) {
      // Preload image
      const img = new Image();
      img.src = imageUrl;
      
      img.onload = () => {
        node.style.backgroundImage = `url('${imageUrl}')`;
        node.classList.add('lazy-loaded');
      };
      
      img.onerror = () => {
        node.classList.add('lazy-error');
      };
    }
  };

  const handleIntersection = (entries: IntersectionObserverEntry[]) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setBackground();
        observer.unobserve(node);
      }
    });
  };

  observer = new IntersectionObserver(handleIntersection, {
    rootMargin: '50px',
    threshold: 0.01
  });

  observer.observe(node);

  return {
    update(newImageUrl: string) {
      imageUrl = newImageUrl;
      if (node.style.backgroundImage) {
        // Already loaded, update immediately
        setBackground();
      }
    },
    destroy() {
      if (observer) {
        observer.disconnect();
      }
    }
  };
}

/**
 * Svelte action for lazy loading images
 * Usage: <img use:lazyLoad={imageUrl} alt="..." />
 */
export function lazyLoad(node: HTMLImageElement, imageUrl: string) {
  let observer: IntersectionObserver;
  const placeholder = node.getAttribute('data-placeholder') || 
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%231e293b" width="400" height="300"/%3E%3C/svg%3E';

  node.src = placeholder;

  const loadImage = () => {
    const img = new Image();
    img.src = imageUrl;

    img.onload = () => {
      node.src = imageUrl;
      node.classList.add('lazy-loaded');
    };

    img.onerror = () => {
      node.classList.add('lazy-error');
    };
  };

  const handleIntersection = (entries: IntersectionObserverEntry[]) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        loadImage();
        observer.unobserve(node);
      }
    });
  };

  observer = new IntersectionObserver(handleIntersection, {
    rootMargin: '50px',
    threshold: 0.01
  });

  observer.observe(node);

  return {
    update(newImageUrl: string) {
      imageUrl = newImageUrl;
      if (node.src !== placeholder) {
        // Already loaded, update immediately
        loadImage();
      }
    },
    destroy() {
      if (observer) {
        observer.disconnect();
      }
    }
  };
}

/**
 * Create a lazy load store for managing multiple images
 */
export function createLazyLoadManager() {
  const loaded = new Set<string>();
  
  return {
    isLoaded: (url: string) => loaded.has(url),
    markLoaded: (url: string) => loaded.add(url),
    reset: () => loaded.clear()
  };
}
