<script lang="ts">
  import { Textarea } from '$lib/components/ui/textarea';
  import { Input } from '$lib/components/ui/input';
  import * as Form from '$lib/components/ui/form';
  import { formSchema } from './formSchema';
  import { superForm } from 'sveltekit-superforms';
  import { zodClient } from 'sveltekit-superforms/adapters';

  const { data } = $props();

  const form = superForm(data.form, {
    validators: zodClient(formSchema),
  });
  const { form: formData, enhance } = form;
</script>

<form method="POST" action="?/update" use:enhance class="flex flex-col gap-2">
  <div class="grid grid-cols-[1fr_auto] gap-2">
    <Form.Field name="description" {form}>
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Description</Form.Label>
          <Input {...props} bind:value={$formData.description} placeholder="File Description" />
        {/snippet}
      </Form.Control>
    </Form.Field>
    <Form.Button>Save</Form.Button>
  </div>

  <Form.Field name="contents" {form}>
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Contents</Form.Label>
        <Textarea
          {...props}
          bind:value={$formData.contents}
          placeholder="Enter file contents"
          class="flex-1 font-mono"
        />
      {/snippet}
    </Form.Control>
  </Form.Field>
</form>
