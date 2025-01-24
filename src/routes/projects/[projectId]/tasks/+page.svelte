<script lang="ts">
  import type { PageData } from './$types';
  import { enhance } from '$app/forms';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Plus } from 'lucide-svelte';
  import { tick } from 'svelte';
  import { invalidate, invalidateAll } from '$app/navigation';

  let { data }: { data: PageData } = $props();

  let showAddEpic = $state(false);
  let showAddTask = $state<Record<number, boolean>>({});
  let showAddSubtask = $state<Record<string, boolean>>({});

  async function toggleAddTask(epicId: number) {
    showAddTask[epicId] = !showAddTask[epicId];
    if (showAddTask[epicId]) {
      await tick();
      const input = document.getElementById(`new-task-title-${epicId}`) as HTMLInputElement;
      input.focus();
    }
  }

  async function toggleAddSubtask(epicId: number, taskId: number) {
    const key = `${epicId}-${taskId}`;
    showAddSubtask[key] = !showAddSubtask[key];
    if (showAddSubtask[key]) {
      await tick();
      const input = document.getElementById(
        `new-subtask-title-${epicId}-${taskId}`
      ) as HTMLInputElement;
      input.focus();
    }
  }
</script>

<div class="space-y-8">
  {#each data.plan.plan as epic (epic.id)}
    <div class="p-4">
      <div class="mb-4 flex items-center gap-2">
        <h2 class="text-xl font-semibold">
          <a href="/projects/{data.project.id}/tasks/{epic.id}" class="hover:underline"
            >{epic.title}</a
          >
        </h2>
        <span class="text-sm text-muted-foreground">({epic.description})</span>
      </div>

      <div class="ml-4">
        {#each epic.tasks as task (task.id)}
          <div class="border-l-2 py-2 pl-4">
            <div class="mb-2 flex items-center gap-2">
              <form method="POST" action="?/toggleTask" use:enhance class="flex items-center gap-2">
                <input type="hidden" name="epicId" value={epic.id} />
                <input type="hidden" name="taskId" value={task.id} />
                <Checkbox name="completed" checked={task.completed} type="submit" />
                <h3
                  class="font-medium {task.completed ? 'text-muted-foreground line-through' : ''}"
                >
                  <a
                    href="/projects/{data.project.id}/tasks/{epic.id}/{task.id}"
                    class="hover:underline">{task.title}</a
                  >
                </h3>
              </form>
            </div>
            {#if task.description}
              <p class="mb-2 text-sm text-muted-foreground">{task.description}</p>
            {/if}

            {#if task.subtasks}
              <div class="ml-4 mt-2 space-y-2">
                {#each task.subtasks as subtask (subtask.id)}
                  <form
                    method="POST"
                    action="?/toggleSubtask"
                    use:enhance
                    class="flex items-center gap-2"
                  >
                    <input type="hidden" name="epicId" value={epic.id} />
                    <input type="hidden" name="taskId" value={task.id} />
                    <input type="hidden" name="subtaskId" value={subtask.id} />
                    <Checkbox name="completed" checked={subtask.completed} type="submit" />
                    <span class={subtask.completed ? 'text-muted-foreground line-through' : ''}
                      ><a
                        href="/projects/{data.project.id}/tasks/{epic.id}/{task.id}/{subtask.id}"
                        class="hover:underline">{subtask.title}</a
                      ></span
                    >
                  </form>
                {/each}
              </div>
            {/if}

            <div class="ml-4 mt-2">
              {#if showAddSubtask[`${epic.id}-${task.id}`]}
                <form
                  method="POST"
                  action="/projects/{data.project.id}/tasks/{epic.id}/{task.id}?/addSubtask"
                  use:enhance={({ formElement }) => {
                    return async ({ update }) => {
                      // We do it this way to properly wait for everything to settle and then
                      // set focus back into the input again.
                      await update({
                        reset: false,
                        invalidateAll: false,
                      });
                      await invalidateAll();
                      const input = formElement.querySelector(
                        'input[name="title"]'
                      ) as HTMLInputElement;
                      input.value = '';
                      input.focus();
                    };
                  }}
                  class="mb-2 flex items-center gap-2"
                >
                  <input type="hidden" name="epicId" value={epic.id} />
                  <input type="hidden" name="taskId" value={task.id} />
                  <Input
                    type="text"
                    name="title"
                    id="new-subtask-title-{epic.id}-{task.id}"
                    placeholder="New subtask title"
                    class="w-full"
                    required
                    onkeydown={(e) => {
                      if (e.key === 'Escape') {
                        e.currentTarget.value = '';
                        showAddSubtask[`${epic.id}-${task.id}`] = false;
                      }
                    }}
                  />
                  <Button type="submit" size="sm">Add</Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onclick={() => (showAddSubtask[`${epic.id}-${task.id}`] = false)}
                  >
                    Cancel
                  </Button>
                </form>
              {:else}
                <Button
                  variant="ghost"
                  size="sm"
                  onclick={() => toggleAddSubtask(epic.id!, task.id!)}
                  title="Add Subtask"
                  class="flex items-center gap-1"
                >
                  <Plus class="size-4" />
                  <span>Add Subtask</span>
                </Button>
              {/if}
            </div>
          </div>
        {/each}

        {#if showAddTask[epic.id!]}
          <form
            method="POST"
            action="/projects/{data.project.id}/tasks/{epic.id}?/addTask"
            use:enhance={({ formElement }) => {
              return async ({ update }) => {
                // We do it this way to properly wait for everything to settle and then
                // set focus back into the input again.
                await update({
                  reset: false,
                  invalidateAll: false,
                });
                await invalidateAll();
                const input = formElement.querySelector('input[name="title"]') as HTMLInputElement;
                input.value = '';
                input.focus();
              };
            }}
            class="mb-4 flex items-center gap-2 border-l-2 py-2 pl-4"
          >
            <input type="hidden" name="epicId" value={epic.id} />
            <Input
              type="text"
              name="title"
              id="new-task-title-{epic.id}"
              placeholder="New task title"
              class="w-full"
              required
              onkeydown={(e) => {
                if (e.key === 'Escape') {
                  e.currentTarget.value = '';
                  showAddTask[epic.id!] = false;
                }
              }}
            />
            <Button type="submit" size="sm">Add</Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onclick={() => (showAddTask[epic.id!] = false)}
            >
              Cancel
            </Button>
          </form>
        {:else}
          <Button
            variant="ghost"
            size="sm"
            onclick={() => toggleAddTask(epic.id!)}
            title="Add Task"
            class="flex items-center gap-1 border-l-2 py-2 pl-4"
          >
            <Plus class="size-4" />
            <span>Add Task</span>
          </Button>
        {/if}
      </div>
    </div>
  {/each}
</div>

{#if showAddEpic}
  <form
    method="POST"
    action="?/addEpic"
    use:enhance={() => {
      return ({ update }) => {
        void update();
        showAddEpic = false;
      };
    }}
    class="fixed bottom-4 right-4 flex items-center gap-2 rounded-lg bg-card p-4 shadow-lg"
  >
    <Input type="text" name="title" placeholder="New epic title" required />
    <Button type="submit">Add Epic</Button>
  </form>
{/if}

<Button
  variant="default"
  size="icon"
  class="fixed bottom-4 right-4"
  onclick={() => (showAddEpic = !showAddEpic)}
  title="Add Epic"
>
  <Plus class="size-4" />
</Button>
