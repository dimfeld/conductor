<script lang="ts">
  import '../app.css';
  import { page } from '$app/state';

  let { children, data } = $props();
</script>

<div class="flex h-screen w-full overflow-hidden">
  <main class="flex-1 overflow-auto p-4">
    {@render children()}
  </main>
</div>
