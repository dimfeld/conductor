<script lang="ts">
  import { enhance } from '$app/forms';
  import { Button } from '$lib/components/ui/button';

  let { data } = $props();
</script>

<div>
  <h1>{data.project.name}</h1>
  <p>{data.project.path}</p>
</div>

<form
  method="post"
  action="?/forceScan"
  use:enhance={() => {
    return ({ update }) => {
      update({
        invalidateAll: false,
      });
    };
  }}
>
  <Button type="submit">Scan</Button>
</form>

<ul>
  {#each data.projectFiles as file}
    <li>{file.path}</li>
  {/each}
</ul>
