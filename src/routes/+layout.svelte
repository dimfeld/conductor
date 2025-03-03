<script lang="ts">
  import '../app.css';
  import * as Sidebar from '$lib/components/ui/sidebar';
  import { page } from '$app/state';

  let { children, data } = $props();
  let repositories = $derived(data.repositories);
</script>

<Sidebar.Provider>
  <Sidebar.Root>
    <Sidebar.Header>Conductor</Sidebar.Header>
    <Sidebar.Content>
      <Sidebar.Group>
        <Sidebar.GroupLabel>Repositories</Sidebar.GroupLabel>
        <Sidebar.GroupContent>
          {#if repositories?.length}
            <Sidebar.Menu>
              {#each repositories as repo (repo.id)}
                <Sidebar.MenuItem>
                  <Sidebar.MenuButton>
                    {#snippet child({ props })}
                      <a href="/projects/{repo.id}" {...props}>{repo.id}</a>
                    {/snippet}
                  </Sidebar.MenuButton>
                </Sidebar.MenuItem>
              {/each}
            </Sidebar.Menu>
          {:else}
            <p class="text-sm text-muted-foreground">No repositories found</p>
          {/if}
        </Sidebar.GroupContent>
      </Sidebar.Group>
    </Sidebar.Content>
  </Sidebar.Root>

  <div class="flex h-screen w-full overflow-hidden">
    <main class="flex-1 overflow-auto p-4">
      <Sidebar.Trigger />
      <div class="mb-4 text-lg font-medium">
        Selected Repository: {page.params.repoId || 'None'}
      </div>
      {@render children()}
    </main>
  </div>
</Sidebar.Provider>
