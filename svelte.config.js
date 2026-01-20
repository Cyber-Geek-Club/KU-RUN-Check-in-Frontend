import adapter from '@sveltejs/adapter-auto';

// Try to load svelte-preprocess but don't crash if it's missing (useful for CI/tooling)
let preprocess;
try {
  const mod = await import('svelte-preprocess');
  preprocess = mod.default ? mod.default() : mod();
} catch (err) {
  // eslint-disable-next-line no-console
  console.warn('svelte-preprocess not installed — continuing without it.');
  preprocess = undefined;
}

const config = {
  preprocess,
  kit: {
    adapter: adapter()
  }
};

export default config;