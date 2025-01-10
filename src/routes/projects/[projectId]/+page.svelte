<script lang="ts">
  import { Button } from '$lib/components/ui/button';

  let { data } = $props();
</script>

<div>
  <h1>{data.project.name}</h1>
  <p>{data.project.path}</p>
</div>

<Button>Scan TODO</Button>

<ul>
  {#each data.projectFiles as file}
    <li>{file.path}</li>
  {/each}
</ul>
