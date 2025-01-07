# Lessons Learned while Writing Code

## Svelte

- Use `$props` instead of `export let` in Svelte components.
- Make sure to separate backend and frontend concerns, using SvelteKit load functions and form actions to send data between the two.
- Place `// @vitest-environment jsdom` at the top of each test file that tests Svelte components.
