<script lang="ts">
  let { class: className, children, ...restProps } = $props();
</script>

<ul
  class="divide-y divide-border rounded-md border {className}"
  {...restProps}
>
  {@render children()}
</ul>