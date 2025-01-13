<script lang="ts">
  import { page } from '$app/state';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import * as Collapsible from '$lib/components/ui/collapsible/index.js';
  import type { Document } from '$lib/server/db/schema.js';
  import { Minus, MinusSquare, Plus, PlusSquare } from 'lucide-svelte';
  import { enhance } from '$app/forms';

  let { docs, untrackedDocs }: { docs: Document[]; untrackedDocs: string[] } = $props();

  let untrackedDocsOpen = $state(false);
</script>

<Sidebar.Root>
  <Sidebar.Header />
  <Sidebar.Content>
    <Sidebar.Group>
      <Sidebar.GroupLabel>Tasks</Sidebar.GroupLabel>
      <Sidebar.GroupContent>
        <Sidebar.Menu>
          <Sidebar.MenuItem>
            <Sidebar.MenuButton>TODO</Sidebar.MenuButton>
          </Sidebar.MenuItem>
        </Sidebar.Menu>
      </Sidebar.GroupContent>
    </Sidebar.Group>

    <Sidebar.Group>
      <Sidebar.GroupLabel>Documents</Sidebar.GroupLabel>
      <Sidebar.GroupContent>
        <Sidebar.Menu>
          {#each docs as doc}
            <Sidebar.MenuItem>
              <Sidebar.MenuButton>
                {#snippet child({ props })}
                  <a href="/projects/{page.params.projectId}/documents/{doc.id}" {...props}>
                    {doc.path}
                  </a>
                {/snippet}
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          {:else}
            No documents yet
          {/each}
        </Sidebar.Menu>
      </Sidebar.GroupContent>
    </Sidebar.Group>

    {#if untrackedDocs.length > 0}
      <Collapsible.Root class="group/collapsible" bind:open={untrackedDocsOpen}>
        <Sidebar.Group>
          <Sidebar.GroupLabel>
            {#snippet child({ props })}
              <Collapsible.Trigger {...props}>
                {#if untrackedDocsOpen}
                  <MinusSquare />
                {:else}
                  <PlusSquare />
                {/if}
                <span class="ml-2">Untracked Documents</span>
              </Collapsible.Trigger>
            {/snippet}
          </Sidebar.GroupLabel>
          <Collapsible.Content>
            <Sidebar.GroupContent>
              <Sidebar.Menu>
                {#each untrackedDocs as doc}
                  <Sidebar.MenuItem>
                    <form
                      action="/projects/{page.params.projectId}?/trackDocument"
                      method="post"
                      use:enhance
                    >
                      <input type="hidden" name="doc" value={doc} />
                      <Sidebar.MenuButton class="group/untracked-doc">
                        {doc}
                        <span class="invisible ml-auto group-hover/untracked-doc:visible">ADD</span>
                      </Sidebar.MenuButton>
                    </form>
                  </Sidebar.MenuItem>
                {:else}
                  No untracked documents
                {/each}
              </Sidebar.Menu>
            </Sidebar.GroupContent>
          </Collapsible.Content>
        </Sidebar.Group>
      </Collapsible.Root>
    {/if}
  </Sidebar.Content>
  <Sidebar.Footer />
</Sidebar.Root>
