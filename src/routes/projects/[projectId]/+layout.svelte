<script lang="ts">
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import ProjectSidebar from './ProjectSidebar.svelte';
  import { page } from '$app/state';

  let { data, children } = $props();
</script>

<Sidebar.Provider>
  <ProjectSidebar {data} />
  <div class="grid h-screen w-full grid-rows-[auto_1fr]">
    <header class="flex w-full items-center bg-teal-500 py-1">
      <Sidebar.Trigger class="hover:bg-teal-400" />
      {page.data.heading ?? ''}
    </header>
    <main>
      {@render children()}
    </main>
  </div>
</Sidebar.Provider>
