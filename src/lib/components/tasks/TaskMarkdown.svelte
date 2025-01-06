<script lang="ts">
  import { MarkdownService } from '$lib/services/markdown';
  import { onMount } from 'svelte';

  export let repoPath: string;

  let content = $state('');
  let error = $state('');

  const markdownService = new MarkdownService(repoPath);

  onMount(async () => {
    try {
      content = await markdownService.readTasks();
    } catch (err) {
      error = err.message;
    }
  });
</script>

<div class="markdown-container">
  {#if error}
    <p class="error">{error}</p>
  {:else}
    <pre>{content}</pre>
  {/if}
</div>

<style>
  .markdown-container {
    padding: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.375rem;
  }
  
  .error {
    color: #ef4444;
  }
</style>
