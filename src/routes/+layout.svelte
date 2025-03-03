<script lang="ts">
  import '../app.css';
  import * as Sidebar from '$lib/components/ui/sidebar';

  let { children } = $props();
</script>

<Sidebar.Provider>
  <Sidebar.Root>
    <Sidebar.Header class="p-4 text-lg font-semibold">Conductor</Sidebar.Header>
    <Sidebar.Content class="p-4">Repository List</Sidebar.Content>
  </Sidebar.Root>

  <div class="flex h-screen w-full overflow-hidden">
    <main class="flex-1 overflow-auto p-4">
      <Sidebar.Trigger />
      {@render children()}
    </main>
  </div>
</Sidebar.Provider>
