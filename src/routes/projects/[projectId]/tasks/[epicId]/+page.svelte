<!-- Display an epic and its plan -->
<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Card } from '$lib/components/ui/card';
  import { page } from '$app/state';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { superForm } from 'sveltekit-superforms/client';
  import { enhance as kitEnhance } from '$app/forms';

  let { data } = $props();
  const form = superForm(data.form, {
    resetForm: false,
  });

  const { form: formData, enhance, delayed } = form;

  let generatingPlan = $state(false);
</script>

<form
  method="POST"
  id="generatePlan"
  action="?/generatePlan"
  use:kitEnhance={() => {
    console.log('generating plan');
    generatingPlan = true;
    return ({ update }) => {
      generatingPlan = false;
      void update({
        invalidateAll: true,
      });
    };
  }}
></form>

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
    </div>
  </div>

  <Textarea name="description" bind:value={$formData.description} placeholder="Epic description" />

  <Textarea
    name="content"
    class="min-h-96 flex-1"
    bind:value={$formData.content}
    placeholder="Epic plan content"
  />
</form>
