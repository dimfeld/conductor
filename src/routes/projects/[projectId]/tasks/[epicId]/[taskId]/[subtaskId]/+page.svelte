<!-- Display a subtask and its plan -->
<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Card } from '$lib/components/ui/card';
  import { page } from '$app/state';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { superForm } from 'sveltekit-superforms/client';

  let { data } = $props();
  const form = superForm(data.form, {
    resetForm: false,
  });

  const { form: formData, enhance, delayed } = form;
</script>

<form method="POST" class="flex h-full flex-col gap-4 overflow-y-auto px-4 py-4" use:enhance>
  <div class="flex items-center justify-between gap-4">
    <Input
      name="title"
      class="text-2xl font-bold"
      bind:value={$formData.title}
      placeholder="Subtask Title"
    />
    <Button type="submit" disabled={$delayed}>
      {$delayed ? 'Saving...' : 'Save'}
    </Button>
  </div>

  <Textarea
    name="description"
    bind:value={$formData.description}
    placeholder="Subtask description"
  />

  <Textarea
    name="content"
    class="min-h-96 flex-1"
    bind:value={$formData.content}
    placeholder="Subtask plan content"
  />
</form>
