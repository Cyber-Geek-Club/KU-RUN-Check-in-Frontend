<script lang="ts">
  import { onMount } from 'svelte';
  
  export let src: string;
  export let alt: string = '';
  export let className: string = '';
  export let style: string = '';
  export let placeholder: string = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%231e293b" width="400" height="300"/%3E%3C/svg%3E';
  
  let imgElement: HTMLImageElement;
  let loaded = false;
  let error = false;
  let currentSrc = placeholder;

  onMount(() => {
    if (!imgElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !loaded) {
            loadImage();
            observer.unobserve(imgElement);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before image enters viewport
        threshold: 0.01
      }
    );

    observer.observe(imgElement);

    return () => {
      if (imgElement) observer.unobserve(imgElement);
    };
  });

  function loadImage() {
    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      currentSrc = src;
      loaded = true;
    };
    
    img.onerror = () => {
      error = true;
      loaded = true;
    };
  }
</script>

<img
  bind:this={imgElement}
  src={currentSrc}
  {alt}
  class="{className} {loaded ? 'loaded' : 'loading'}"
  {style}
  on:click
  on:load
  on:error
/>

<style>
  img {
    transition: opacity 0.3s ease;
  }
  
  img.loading {
    opacity: 0.5;
  }
  
  img.loaded {
    opacity: 1;
  }
</style>
