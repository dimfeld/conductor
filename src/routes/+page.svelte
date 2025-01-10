<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Card } from '$lib/components/ui/card';
  import * as Form from '$lib/components/ui/form';
  import { superForm } from 'sveltekit-superforms';
  import { newProjectSchema } from './formSchema.js';
  import { zodClient } from 'sveltekit-superforms/adapters';

  let { data } = $props();
  let form = superForm(data.form, {
    validators: zodClient(newProjectSchema),
  });
  const { form: formData, enhance } = form;
</script>

<div class="container mx-auto p-4">
  <h1 class="mb-8 text-3xl font-bold">Projects</h1>

  <div class="grid gap-8 md:grid-cols-[2fr_1fr]">
    <div>
      <h2 class="mb-4 text-2xl font-semibold">Project List</h2>
      <div class="grid gap-4">
        {#each data.projects as project}
          <Card class="p-4">
            <a href="/projects/{project.id}" class="block transition-colors hover:bg-muted">
              <h3 class="text-xl font-semibold">{project.name}</h3>
              <p class="text-muted-foreground">{project.path}</p>
            </a>
          </Card>
        {/each}

        {#if data.projects.length === 0}
          <p class="text-muted-foreground">No projects yet. Create one to get started!</p>
        {/if}
      </div>
    </div>

    <div>
      <Card class="p-6">
        <h2 class="mb-4 text-2xl font-semibold">New Project</h2>
        <form method="POST" action="?/create" use:enhance class="grid gap-4">
          <Form.Field {form} name="name">
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>Name</Form.Label>
                <Input {...props} bind:value={$formData.name} />
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>

          <Form.Field {form} name="path">
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>Path</Form.Label>
                <Input {...props} bind:value={$formData.path} />
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>

          <Form.Button>Create Project</Form.Button>
        </form>
      </Card>
    </div>
  </div>
</div>
