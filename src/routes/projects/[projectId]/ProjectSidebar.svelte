<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/state';
  import * as Collapsible from '$lib/components/ui/collapsible/index.js';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import { getNextIncompleteSubtask } from '$lib/project/plan.js';
  import { MinusSquare, PlusSquare } from 'lucide-svelte';
  import type { LayoutData } from './$types.js';
  import { cn } from '$lib/utils.js';

  let { data }: { data: LayoutData } = $props();

  let { plan, project, documents, untrackedDocs } = $derived(data);

  let untrackedDocsOpen = $state(false);
  let openEpic = $state<Record<string, boolean>>({});

  let nextIncompleteSubtaskRef = $derived(getNextIncompleteSubtask(plan));
  let nextIncompleteSubtask = $derived(
    nextIncompleteSubtaskRef && 'subtask' in nextIncompleteSubtaskRef
      ? nextIncompleteSubtaskRef?.subtask
      : null
  );
</script>

<Sidebar.Root>
  <Sidebar.Header>
    {project.name}
  </Sidebar.Header>
  <Sidebar.Content>
    <Sidebar.Group>
      <Sidebar.GroupLabel>
        <a href="/projects/{page.params.projectId}/tasks">Tasks</a>
      </Sidebar.GroupLabel>
      <Sidebar.GroupContent>
        {#if nextIncompleteSubtaskRef}
          <Sidebar.Menu>
            <Sidebar.MenuItem>
              <Sidebar.MenuButton>
                <span class="truncate">
                  Next Up: <a
                    class="hover:underline"
                    href="/projects/{page.params.projectId}/tasks/{nextIncompleteSubtaskRef.epic
                      .id}/{nextIncompleteSubtaskRef.task.id}"
                    >{nextIncompleteSubtaskRef.task.title}</a
                  ></span
                >
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
            {#if nextIncompleteSubtask}
              <Sidebar.MenuItem class="ml-2">
                <Sidebar.MenuButton>
                  <a
                    href="/projects/{page.params.projectId}/tasks/{nextIncompleteSubtaskRef.epic
                      .id}/{nextIncompleteSubtaskRef.task.id}/{nextIncompleteSubtask.id}"
                    >{nextIncompleteSubtask.title}</a
                  >
                </Sidebar.MenuButton>
              </Sidebar.MenuItem>
            {/if}
          </Sidebar.Menu>
        {/if}
        <Sidebar.Menu>
          {#each plan?.plan ?? [] as epic}
            {@const epicComplete = epic.tasks?.every((task) => task.completed)}
            <Collapsible.Root
              class="group/collapsible"
              bind:open={
                () => openEpic[epic.title] ?? false, (value) => (openEpic[epic.title] = value)
              }
            >
              <Sidebar.MenuItem class="mt-2">
                <Sidebar.MenuButton>
                  {#snippet child({ props })}
                    <div class="flex items-center gap-2">
                      <Collapsible.Trigger {...props} class="flex items-center gap-2">
                        {#if openEpic[epic.title]}
                          <MinusSquare class="size-4 text-gray-500" />
                        {:else}
                          <PlusSquare class="size-4 text-gray-500" />
                        {/if}
                      </Collapsible.Trigger>
                      <span class:text-gray-300={epicComplete}>
                        <a
                          class="truncate hover:underline"
                          href="/projects/{page.params.projectId}/tasks/{epic.id}">{epic.title}</a
                        >
                      </span>
                    </div>
                  {/snippet}
                </Sidebar.MenuButton>
              </Sidebar.MenuItem>

              <Collapsible.Content>
                <div class="ml-4">
                  {#if epic.tasks?.length}
                    <Sidebar.MenuSub class="mr-0">
                      {#each epic.tasks as task}
                        <Sidebar.MenuSubItem>
                          <Sidebar.MenuSubButton
                            href="/projects/{page.params.projectId}/tasks/{epic.id}/{task.id}"
                            class={cn('flex items-center gap-2', task.completed && 'text-gray-300')}
                          >
                            <span class="truncate">{task.title}</span>
                          </Sidebar.MenuSubButton>
                          {#if task.subtasks?.length}
                            <Sidebar.MenuSub class="mr-0">
                              {#each task.subtasks as subtask}
                                <Sidebar.MenuSubItem>
                                  <Sidebar.MenuSubButton
                                    href="/projects/{page.params
                                      .projectId}/tasks/{epic.id}/{task.id}/{subtask.id}"
                                    class={cn(
                                      'flex items-center gap-2',
                                      subtask.completed && 'text-gray-300'
                                    )}
                                  >
                                    <span class="truncate" title={subtask.title}
                                      >{subtask.title}</span
                                    >
                                  </Sidebar.MenuSubButton>
                                </Sidebar.MenuSubItem>
                              {/each}
                            </Sidebar.MenuSub>
                          {/if}
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
      <Sidebar.GroupLabel>
        <a href="/projects/{page.params.projectId}/documents">Documents</a>
      </Sidebar.GroupLabel>
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
