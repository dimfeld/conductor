<script lang="ts">
  import { Textarea } from '$lib/components/ui/textarea';
  import { Input } from '$lib/components/ui/input';
  import * as Form from '$lib/components/ui/form';
  import { formSchema } from './formSchema';
  import { superForm } from 'sveltekit-superforms';
  import { zodClient } from 'sveltekit-superforms/adapters';

  const { data } = $props();
  $inspect(data);

  const form = superForm(data.form, {
    validators: zodClient(formSchema),
    resetForm: false,
    applyAction: false,
  });
  const { form: formData, enhance } = form;
</script>

<svelte:window
  onkeydown={(e) => {
    console.log(e);
    if (e.key === 'Enter' && e.metaKey) {
      e.preventDefault();
      form.submit();
    }
  }}
/>

<form method="POST" action="?/update" use:enhance class="mt-2 flex h-full w-full flex-col gap-2">
  <div class="grid grid-cols-[1fr_auto] gap-2 px-2">
    <Form.Field name="description" {form}>
      <Form.Control>
        {#snippet children({ props })}
          <Input {...props} bind:value={$formData.description} placeholder="File Description" />
        {/snippet}
      </Form.Control>
    </Form.Field>
    <Form.Button>Save</Form.Button>
  </div>

  <Form.Field name="contents" class="flex-1" {form}>
    <Form.Control>
      {#snippet children({ props })}
        <Textarea
          {...props}
          bind:value={$formData.contents}
          placeholder="Enter file contents"
          class="h-full border-0 font-mono focus-visible:ring-0"
        />
      {/snippet}
    </Form.Control>
  </Form.Field>
</form>
