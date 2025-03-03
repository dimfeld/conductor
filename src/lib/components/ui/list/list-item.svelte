<script lang="ts">
  let { class: className, children, ...restProps } = $props();
</script>

<li
  class="border-b border-border py-2 last:border-0 {className}"
  {...restProps}
>
  {@render children()}
</li>