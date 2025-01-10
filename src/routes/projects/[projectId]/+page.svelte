<script lang="ts">
  let { data } = $props();
</script>

<div>
  <h1>{data.project.name}</h1>
  <p>{data.project.path}</p>
</div>
