<script lang="ts">
  const { data } = $props();
</script>

<div class="px-2">
  {#each data.documents as document}
    <ul>
      <li>
        <a
          href="/projects/{data.project.id}/documents/{document.id}"
          class="text-sm text-gray-500 hover:text-gray-900"
        >
          {document.path}
        </a>
      </li>
    </ul>
  {/each}
</div>
