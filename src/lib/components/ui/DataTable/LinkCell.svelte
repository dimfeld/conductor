<script lang="ts">
  interface Props {
    href: string;
    label: string;
  }

  let { href, label }: Props = $props();
</script>

<a {href} class="hover:underline">{label}</a>
