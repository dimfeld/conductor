<!-- Display an epic and its plan -->
<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Card } from '$lib/components/ui/card';
  import { page } from '$app/state';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { superForm } from 'sveltekit-superforms/client';
  import { enhance as kitEnhance } from '$app/forms';
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import * as Tabs from '$lib/components/ui/tabs';
  import { queryParameters } from 'sveltekit-search-params';
  import { Plus } from 'lucide-svelte';
  import { tick } from 'svelte';
  import { invalidateAll } from '$app/navigation';

  let { data } = $props();
  const form = superForm(data.form, {
    resetForm: false,
  });

  const { form: formData, enhance, delayed } = form;

  let generatingPlan = $state(false);
  let showDeleteConfirm = $state(false);
  let showAddTask = $state(false);

  function confirmDelete() {
    showDeleteConfirm = true;
  }

  async function toggleAddTask() {
    showAddTask = !showAddTask;
    if (showAddTask) {
      await tick();
      const input = document.getElementById('new-task-title') as HTMLInputElement;
      input.focus();
    }
  }

  const params = queryParameters();
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === 'Enter' && e.metaKey) {
      e.preventDefault();
      form.submit();
    }
  }}
/>

<form
  method="POST"
  id="generatePlan"
  action="?/generatePlan"
  use:kitEnhance={() => {
    generatingPlan = true;
    return ({ update }) => {
      generatingPlan = false;
      void update({
        invalidateAll: true,
      });
    };
  }}
></form>

<form method="POST" id="deleteEpic" action="?/delete"></form>

<form
  method="POST"
  class="flex h-full flex-col gap-4 overflow-y-auto px-4 py-4"
  action="?/save"
  use:enhance
>
  <div class="flex items-center justify-between gap-4">
    <Input
      name="title"
      class="text-2xl font-bold"
      bind:value={$formData.title}
      placeholder="Epic Title"
    />
    <div class="flex gap-2">
      <Button type="submit" form="generatePlan" disabled={generatingPlan} variant="outline">
        {generatingPlan ? 'Generating Plan...' : 'Generate Plan'}
      </Button>
      <Button type="submit" disabled={$delayed}>
        {$delayed ? 'Saving...' : 'Save'}
      </Button>
      <Button type="button" variant="destructive" onclick={confirmDelete}>Delete Epic</Button>
    </div>
  </div>

  <Textarea name="description" bind:value={$formData.description} placeholder="Epic description" />

  <Tabs.Root bind:value={() => params.tab ?? 'tasks', (tab) => (params.tab = tab)}>
    <Tabs.List class="flex w-full justify-start">
      <Tabs.Trigger value="tasks">Tasks ({data.epic.tasks?.length ?? 0})</Tabs.Trigger>
      <Tabs.Trigger value="plan">Plan</Tabs.Trigger>
    </Tabs.List>

    <Tabs.Content value="tasks">
      {#if data.epic.tasks?.length}
        <div class="space-y-4">
          <ul class="flex flex-col gap-2">
            {#each data.epic.tasks as task (task.id)}
              <li class="flex items-center gap-2">
                <Checkbox
                  name="toggle-task-{task.id}"
                  checked={task.completed}
                  form="toggleTask"
                  formaction="/projects/{page.params.projectId}/tasks/{page.params
                    .epicId}/{task.id}?/toggle"
                  type="submit"
                />
                <h3
                  class="font-medium {task.completed ? 'text-muted-foreground line-through' : ''}"
                >
                  <a
                    href="/projects/{page.params.projectId}/tasks/{page.params.epicId}/{task.id}"
                    class="hover:underline"
                  >
                    {task.title}
                  </a>
                </h3>
              </li>
            {/each}
          </ul>
        </div>
      {:else}
        <div class="py-4 text-center text-muted-foreground">No tasks created yet</div>
      {/if}

      {#if showAddTask}
        <form
          method="POST"
          action="?/addTask"
          use:kitEnhance={({ formElement }) => {
            return async ({ update }) => {
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
          class="mt-4 flex items-center gap-2"
        >
          <Input
            type="text"
            name="title"
            id="new-task-title"
            placeholder="New task title"
            class="w-full"
            required
            onkeydown={(e) => {
              if (e.key === 'Escape') {
                e.currentTarget.value = '';
                showAddTask = false;
              }
            }}
          />
          <Button type="submit" size="sm">Add</Button>
          <Button type="button" variant="outline" size="sm" onclick={() => (showAddTask = false)}>
            Cancel
          </Button>
        </form>
      {:else}
        <Button
          variant="ghost"
          size="sm"
          onclick={toggleAddTask}
          title="Add Task"
          class="mt-4 flex items-center gap-1"
        >
          <Plus class="size-4" />
          <span>Add Task</span>
        </Button>
      {/if}
    </Tabs.Content>
    <Tabs.Content value="plan" class="flex-1">
      <Textarea
        name="content"
        class="min-h-96 flex-1"
        bind:value={$formData.content}
        placeholder="Epic plan content"
      />
    </Tabs.Content>
  </Tabs.Root>
</form>

<form method="POST" id="toggleTask" use:kitEnhance class="hidden"></form>

<AlertDialog.Root bind:open={showDeleteConfirm}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Delete Epic</AlertDialog.Title>
      <AlertDialog.Description>
        Are you sure you want to delete this epic and all its tasks? This cannot be undone.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel onclick={() => (showDeleteConfirm = false)}>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action type="submit" form="deleteEpic">Delete</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
