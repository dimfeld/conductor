<!-- Display an epic and its plan -->
<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { page } from '$app/state';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { superForm } from 'sveltekit-superforms/client';
  import { enhance as kitEnhance } from '$app/forms';
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import * as Tabs from '$lib/components/ui/tabs';
  import { Plus } from 'lucide-svelte';
  import { tick } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { queryParameters } from 'sveltekit-search-params';

  let { data } = $props();
  const form = superForm(data.form, {
    resetForm: false,
  });

  const { form: formData, enhance, delayed } = form;

  let generatingPlan = $state(false);
  let showDeleteConfirm = $state(false);
  let showAddSubtask = $state(false);

  function confirmDelete() {
    showDeleteConfirm = true;
  }

  async function toggleAddSubtask() {
    showAddSubtask = !showAddSubtask;
    if (showAddSubtask) {
      await tick();
      const input = document.getElementById('new-subtask-title') as HTMLInputElement;
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

<form method="POST" id="deleteTask" action="?/delete"></form>

<form
  method="POST"
  action="?/save"
  class="flex h-full flex-col gap-4 overflow-y-auto px-4 py-4"
  use:enhance
>
  <div class="flex items-center justify-between gap-4">
    <Input
      name="title"
      class="text-2xl font-bold"
      bind:value={$formData.title}
      placeholder="Task Title"
    />
    <div class="flex gap-2">
      <Button type="submit" form="generatePlan" disabled={generatingPlan} variant="outline">
        {generatingPlan ? 'Generating...' : 'Generate Plan'}
      </Button>
      <Button type="submit" disabled={$delayed}>
        {$delayed ? 'Saving...' : 'Save'}
      </Button>
      <Button type="button" variant="destructive" onclick={confirmDelete}>Delete Task</Button>
    </div>
  </div>

  <Textarea name="description" bind:value={$formData.description} placeholder="Task description" />

  <Tabs.Root bind:value={() => params.tab ?? 'subtasks', (tab) => (params.tab = tab)}>
    <Tabs.List class="flex w-full justify-start">
      <Tabs.Trigger value="subtasks">Subtasks ({data.task.subtasks?.length ?? 0})</Tabs.Trigger>
      <Tabs.Trigger value="plan">Plan</Tabs.Trigger>
    </Tabs.List>

    <Tabs.Content value="subtasks">
      {#if data.task.subtasks?.length}
        <div class="space-y-4">
          <ul class="flex flex-col gap-2">
            {#each data.task.subtasks as subtask (subtask.id)}
              <li class="flex items-center gap-2">
                <Checkbox
                  name="toggle-subtask-{subtask.id}"
                  checked={subtask.completed}
                  form="toggleSubtask"
                  formaction="/projects/{data.project.id}/tasks/{page.params.epicId}/{page.params
                    .taskId}/{subtask.id}?/toggle"
                  type="submit"
                />
                <h3
                  class="font-medium {subtask.completed
                    ? 'text-muted-foreground line-through'
                    : ''}"
                >
                  <a
                    href="/projects/{data.project.id}/tasks/{page.params.epicId}/{page.params
                      .taskId}/{subtask.id}"
                    class="hover:underline"
                  >
                    {subtask.title}
                  </a>
                </h3>
              </li>
            {/each}
          </ul>
        </div>
      {:else}
        <div class="py-4 text-center text-muted-foreground">No subtasks created yet</div>
      {/if}

      {#if showAddSubtask}
        <form
          method="POST"
          action="?/addSubtask"
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
            id="new-subtask-title"
            placeholder="New subtask title"
            class="w-full"
            required
            onkeydown={(e) => {
              if (e.key === 'Escape') {
                e.currentTarget.value = '';
                showAddSubtask = false;
              }
            }}
          />
          <Button type="submit" size="sm">Add</Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onclick={() => (showAddSubtask = false)}
          >
            Cancel
          </Button>
        </form>
      {:else}
        <Button
          variant="ghost"
          size="sm"
          onclick={toggleAddSubtask}
          title="Add Subtask"
          class="mt-4 flex items-center gap-1"
        >
          <Plus class="size-4" />
          <span>Add Subtask</span>
        </Button>
      {/if}
    </Tabs.Content>
    <Tabs.Content value="plan" class="flex-1">
      <Textarea
        name="content"
        class="min-h-96 flex-1"
        bind:value={$formData.content}
        placeholder="Task plan content"
      />
    </Tabs.Content>
  </Tabs.Root>
</form>

<form method="POST" id="toggleSubtask" use:kitEnhance class="hidden"></form>

<AlertDialog.Root bind:open={showDeleteConfirm}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Delete Task</AlertDialog.Title>
      <AlertDialog.Description>
        Are you sure you want to delete this task and all its subtasks? This cannot be undone.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel onclick={() => (showDeleteConfirm = false)}>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action type="submit" form="deleteTask">Delete</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
