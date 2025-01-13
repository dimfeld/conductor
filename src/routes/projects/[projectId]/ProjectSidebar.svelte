<script lang="ts">
  import { page } from '$app/state';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import * as Collapsible from '$lib/components/ui/collapsible/index.js';
  import type { Document } from '$lib/server/db/schema.js';
  import {
    Minus,
    MinusSquare,
    Plus,
    PlusSquare,
    CheckSquare,
    Square,
    Check,
    Circle,
  } from 'lucide-svelte';
  import { enhance } from '$app/forms';
  import { getNextIncompleteSubtask, type ProjectPlan } from '$lib/project/plan.js';
  import type { Project } from '$lib/project/project.js';
  import type { LayoutData } from './$types.js';

  let { data }: { data: LayoutData } = $props();

  let { plan, project, documents, untrackedDocs } = $derived(data);

  let untrackedDocsOpen = $state(false);
  let openEpic = $state<Record<string, boolean>>({});

  let nextIncompleteSubtaskIndex = $derived(getNextIncompleteSubtask(plan));
  let nextIncompleteStory = $derived(
    nextIncompleteSubtaskIndex
      ? plan.plan[nextIncompleteSubtaskIndex.epic]?.stories[nextIncompleteSubtaskIndex.story]
      : null
  );

  let nextIncompleteSubtask = $derived(
    nextIncompleteStory && nextIncompleteSubtaskIndex?.subtask
      ? nextIncompleteStory.subtasks?.[nextIncompleteSubtaskIndex.subtask]
      : null
  );
</script>

<Sidebar.Root>
  <Sidebar.Header>
    {project.name}
  </Sidebar.Header>
  <Sidebar.Content>
    <Sidebar.Group>
      <Sidebar.GroupLabel>Tasks</Sidebar.GroupLabel>
      <Sidebar.GroupContent>
        {#if nextIncompleteStory}
          <Sidebar.Menu>
            <Sidebar.MenuItem>
              <Sidebar.MenuButton>
                Next Up: {nextIncompleteStory.title}
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
            {#if nextIncompleteSubtask}
              <Sidebar.MenuItem class="ml-2">
                <Sidebar.MenuButton>
                  {nextIncompleteSubtask?.title}
                </Sidebar.MenuButton>
              </Sidebar.MenuItem>
            {/if}
          </Sidebar.Menu>
        {/if}
        <Sidebar.Menu>
          {#each plan?.plan ?? [] as epic}
            {@const epicComplete = epic.stories?.every((story) => story.completed)}
            <Collapsible.Root
              class="group/collapsible"
              bind:open={() => openEpic[epic.title] ?? false,
              (value) => (openEpic[epic.title] = value)}
            >
              <Sidebar.MenuItem>
                <Sidebar.MenuButton>
                  {#snippet child({ props })}
                    <Collapsible.Trigger {...props} class="flex items-center gap-2">
                      {#if openEpic[epic.title]}
                        <MinusSquare class="size-4 text-gray-500" />
                      {:else}
                        <PlusSquare class="size-4 text-gray-500" />
                      {/if}
                      <span class:text-gray-300={epicComplete}>{epic.title}</span>
                    </Collapsible.Trigger>
                  {/snippet}
                </Sidebar.MenuButton>
              </Sidebar.MenuItem>

              <Collapsible.Content>
                <div class="ml-4">
                  {#if epic.stories?.length}
                    <Sidebar.MenuSub>
                      {#each epic.stories as story}
                        <Sidebar.MenuSubItem>
                          <Sidebar.MenuSubButton class="flex items-center gap-2">
                            <span class="truncate text-xs" class:text-gray-300={story.completed}>
                              {story.title}
                            </span>
                          </Sidebar.MenuSubButton>
                        </Sidebar.MenuSubItem>
                      {/each}
                    </Sidebar.MenuSub>
                  {/if}
                </div>
              </Collapsible.Content>
            </Collapsible.Root>
          {/each}
        </Sidebar.Menu>
      </Sidebar.GroupContent>
    </Sidebar.Group>

    <Sidebar.Group>
      <Sidebar.GroupLabel>Documents</Sidebar.GroupLabel>
      <Sidebar.GroupContent>
        <Sidebar.Menu>
          {#each documents as doc}
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
