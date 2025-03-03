<script lang="ts">
  import { page } from '$app/stores';
  import * as Card from '$lib/components/ui/card';
  import * as List from '$lib/components/ui/list';
  import { Button } from '$lib/components/ui/button';

  let { data } = $props();
  let specFiles = $derived(data.specFiles);
</script>

<div class="container mx-auto my-8 space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold">Spec Files - {$page.params.repoId}</h1>
    <Button href="./new" variant="default">Create New Spec</Button>
  </div>

  <Card.Root>
    <Card.Header>
      <Card.Title>Available Specs</Card.Title>
      <Card.Description>
        YAML specification files for workflows and tasks
      </Card.Description>
    </Card.Header>
    <Card.Content>
      {#if specFiles.length > 0}
        <List.Root class="">
          {#each specFiles as file}
            <List.Item class="">
              <a href="./{typeof file === 'string' ? file.replace('.yaml', '') : file}" class="block py-2 hover:underline">
                {file}
              </a>
            </List.Item>
          {/each}
        </List.Root>
      {:else}
        <div class="py-4 text-center text-muted-foreground">
          <p>No spec files found</p>
          <p class="mt-2 text-sm">Click 'Create New Spec' to add your first specification</p>
        </div>
      {/if}
    </Card.Content>
  </Card.Root>
</div>