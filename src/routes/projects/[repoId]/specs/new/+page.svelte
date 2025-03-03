<script lang="ts">
  import { page } from '$app/state';
  import { enhance } from '$app/forms';
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Textarea } from '$lib/components/ui/textarea';
  import { specSchema, type SpecSchema } from '$lib/specSchema';

  let formData: SpecSchema = {
    specName: '',
    objective: '',
    implementation: [],
    tasks: [{ name: '', prompt: '', evaluation: '' }],
  };

  let errors: Record<string, string> = {};
  let submitting = false;

  function addTask() {
    formData.tasks = [...formData.tasks, { name: '', prompt: '', evaluation: '' }];
  }

  function removeTask(index: number) {
    formData.tasks = formData.tasks.filter((_, i) => i !== index);
  }

  function handleImplementationChange(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    const lines = target.value.split('\n').filter((line) => line.trim().length > 0);
    formData.implementation = lines;
  }
</script>

<div class="container mx-auto my-8 space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold">Create New Spec - {page.params.repoId}</h1>
    <Button href="../specs" variant="outline">Cancel</Button>
  </div>

  <Card.Root>
    <Card.Header>
      <Card.Title>New Specification</Card.Title>
      <Card.Description>Create a new task specification for your project</Card.Description>
    </Card.Header>
    <Card.Content>
      <form class="space-y-6" method="POST" use:enhance>
        {#if errors.form}
          <div class="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {errors.form}
          </div>
        {/if}

        <!-- Spec Name -->
        <div class="space-y-2">
          <label for="specName" class="text-sm font-medium">Spec Name</label>
          <p class="text-xs text-muted-foreground">A unique name for this specification</p>
          {#if errors.specName}
            <p class="text-sm text-destructive">{errors.specName}</p>
          {/if}
          <Input
            id="specName"
            name="specName"
            bind:value={formData.specName}
            placeholder="Enter spec name"
            class={errors.specName ? 'border-destructive' : ''}
          />
        </div>

        <!-- Objective -->
        <div class="space-y-2">
          <label for="objective" class="text-sm font-medium">Objective</label>
          <p class="text-xs text-muted-foreground">The main goal of this specification</p>
          {#if errors.objective}
            <p class="text-sm text-destructive">{errors.objective}</p>
          {/if}
          <Textarea
            id="objective"
            name="objective"
            bind:value={formData.objective}
            placeholder="Enter the objective"
            rows={3}
            class={errors.objective ? 'border-destructive' : ''}
          />
        </div>

        <!-- Implementation Steps -->
        <div class="space-y-2">
          <label for="implementation" class="text-sm font-medium">Implementation Steps</label>
          <p class="text-xs text-muted-foreground">Enter the implementation steps (one per line)</p>
          {#if errors.implementation}
            <p class="text-sm text-destructive">{errors.implementation}</p>
          {/if}
          <Textarea
            id="implementation"
            name="implementation"
            value={formData.implementation.join('\n')}
            oninput={handleImplementationChange}
            placeholder="Step 1 to implement the objective&#10;Step 2 to implement the objective&#10;..."
            rows={5}
            class={errors.implementation ? 'border-destructive' : ''}
          />
        </div>

        <!-- Tasks -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium">Tasks</h3>
            <Button type="button" variant="outline" size="sm" onclick={addTask}>Add Task</Button>
          </div>

          {#if errors.tasks}
            <div class="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {errors.tasks}
            </div>
          {/if}

          {#each formData.tasks as task, i}
            <div class="rounded-md border p-4">
              <div class="mb-4 flex items-center justify-between">
                <h4 class="font-medium">Task {i + 1}</h4>
                {#if formData.tasks.length > 1}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onclick={() => removeTask(i)}
                  >
                    Remove
                  </Button>
                {/if}
              </div>

              <!-- Task Name -->
              <div class="mb-4 space-y-2">
                <label for={`task-${i}-name`} class="text-sm font-medium">Task Name</label>
                {#if errors[`tasks.${i}.name`]}
                  <p class="text-sm text-destructive">{errors[`tasks.${i}.name`]}</p>
                {/if}
                <Input
                  id={`task-${i}-name`}
                  name="tasks.name"
                  bind:value={task.name}
                  placeholder="Enter task name"
                  class={errors[`tasks.${i}.name`] ? 'border-destructive' : ''}
                />
              </div>

              <!-- Task Prompt -->
              <div class="mb-4 space-y-2">
                <label for={`task-${i}-prompt`} class="text-sm font-medium">Task Prompt</label>
                {#if errors[`tasks.${i}.prompt`]}
                  <p class="text-sm text-destructive">{errors[`tasks.${i}.prompt`]}</p>
                {/if}
                <Textarea
                  id={`task-${i}-prompt`}
                  name="tasks.prompt"
                  bind:value={task.prompt}
                  placeholder="Enter task prompt"
                  rows={3}
                  class={errors[`tasks.${i}.prompt`] ? 'border-destructive' : ''}
                />
              </div>

              <!-- Task Evaluation (Optional) -->
              <div class="space-y-2">
                <label for={`task-${i}-evaluation`} class="text-sm font-medium"
                  >Evaluation (Optional)</label
                >
                <p class="text-xs text-muted-foreground">Criteria for evaluating task completion</p>
                <Textarea
                  id={`task-${i}-evaluation`}
                  name="tasks.evaluation"
                  bind:value={task.evaluation}
                  placeholder="Enter evaluation criteria (optional)"
                  rows={2}
                />
              </div>
            </div>
          {/each}
        </div>

        <div class="flex justify-end space-x-2 pt-4">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Spec'}
          </Button>
        </div>
      </form>
    </Card.Content>
  </Card.Root>
</div>
