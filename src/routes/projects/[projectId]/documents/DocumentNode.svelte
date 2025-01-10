<script lang="ts">
  import type { Document } from '$lib/server/db/schema';
  import Textarea from '$lib/components/ui/textarea/textarea.svelte';
  import type { DocumentWithContents } from './types';
  import { Handle, Position } from '@xyflow/svelte';

  export interface Props {
    data: DocumentWithContents;
  }

  const { data }: Props = $props();
</script>

<div class="rounded-md border border-stone-400 bg-white p-2 shadow-md">
  <div>
    <h1>{data.path}</h1>
  </div>
  <Textarea class="nodrag" bind:value={data.contents} />

  <Handle type="target" position={Position.Top} />
  <Handle type="source" position={Position.Bottom} />
</div>
