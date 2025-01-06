<script lang="ts">
  import type { ComponentProps, Snippet } from 'svelte';
  import ArrowUpDown from 'lucide-svelte/icons/arrow-up-down';
  import { Button } from '$lib/components/ui/button/index.js';

  type Props = ComponentProps<typeof Button> & {
    label: string;
    render?: Snippet<[string]>;
  };

  let { variant = 'ghost', label, render, ...restProps }: Props = $props();
</script>

<Button {variant} class="justify-start" {...restProps}>
  {#if render}
    {@render render?.(label)}
  {:else}
    {label}
  {/if}
  <ArrowUpDown class="ml-2 size-4" />
</Button>
