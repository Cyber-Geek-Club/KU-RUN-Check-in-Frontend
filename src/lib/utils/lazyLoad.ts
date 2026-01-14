// Lazy load utility for background images and elements
import { resolveImageUrl, PLACEHOLDER_GRADIENT } from './imageUtils';

export interface LazyLoadOptions {
  rootMargin?: string;
  threshold?: number;
}

/**
 * Svelte action for lazy loading background images
 * Usage: <div use:lazyLoadBg={imageUrl} />
 * 
 * Automatically resolves relative paths to full URLs using the API base URL.
 * Shows a placeholder gradient if image fails to load.
 */
export function lazyLoadBg(node: HTMLElement, imageUrl: string) {
  let observer: IntersectionObserver;
  
  const setBackground = () => {
    // Resolve the image URL (handles relative paths from API)
    const resolvedUrl = resolveImageUrl(imageUrl);
    
    if (resolvedUrl) {
      // Preload image
      const img = new Image();
      img.src = resolvedUrl;
      
      img.onload = () => {
        node.style.backgroundImage = `url('${resolvedUrl}')`;
        node.classList.add('lazy-loaded');
        node.classList.remove('lazy-error');
      };
      
      img.onerror = () => {
        node.classList.add('lazy-error');
        node.classList.remove('lazy-loaded');
        // Set a nice placeholder gradient when image fails
        node.style.backgroundImage = PLACEHOLDER_GRADIENT;
      };
    } else {
      // No URL provided, show placeholder
      node.classList.add('lazy-error');
      node.style.backgroundImage = PLACEHOLDER_GRADIENT;
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
 * 
 * Automatically resolves relative paths to full URLs using the API base URL.
 */
export function lazyLoad(node: HTMLImageElement, imageUrl: string) {
  let observer: IntersectionObserver;
  const placeholder = node.getAttribute('data-placeholder') || 
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%231e293b" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23475569" font-size="48"%3E📷%3C/text%3E%3C/svg%3E';

  node.src = placeholder;

  const loadImage = () => {
    // Resolve the image URL (handles relative paths from API)
    const resolvedUrl = resolveImageUrl(imageUrl);
    
    if (!resolvedUrl) {
      node.classList.add('lazy-error');
      return;
    }
    
    const img = new Image();
    img.src = resolvedUrl;

    img.onload = () => {
      node.src = resolvedUrl;
      node.classList.add('lazy-loaded');
      node.classList.remove('lazy-error');
    };

    img.onerror = () => {
      node.classList.add('lazy-error');
      node.classList.remove('lazy-loaded');
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
