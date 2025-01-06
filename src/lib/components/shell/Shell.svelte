<script lang="ts">
  import Header from './Header.svelte';
  import Sidebar from './Sidebar.svelte';
  import { cn } from '$lib/utils';

  let { children } = $props();
</script>

<div class="relative flex min-h-screen flex-col">
  <Header />
  <div class="flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
    <Sidebar className="hidden md:block" />
    <main class="relative py-6 px-6 lg:gap-10 lg:px-8 xl:px-12">
      {@render children()}
    </main>
  </div>
</div>
