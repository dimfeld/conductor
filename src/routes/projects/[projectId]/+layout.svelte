<script lang="ts">
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import ProjectSidebar from './ProjectSidebar.svelte';

  let { data, children } = $props();
</script>

<Sidebar.Provider>
  <ProjectSidebar docs={data.documents} />
  <main>
    <Sidebar.Trigger />
    {@render children()}
  </main>
</Sidebar.Provider>
