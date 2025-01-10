<script lang="ts">
  import { Background, Controls, SvelteFlow, type Node, type Edge } from '@xyflow/svelte';
  import { writable } from 'svelte/store';
  import DocumentNode from './DocumentNode.svelte';

  const { data } = $props();

  const nodeTypes = {
    document: DocumentNode,
  };

  // Convert documents to nodes
  const nodes = data.documents.map((doc) => ({
    id: doc.id.toString(),
    position: {
      x: doc.canvas_location_x ?? Math.random() * 500,
      y: doc.canvas_location_y ?? Math.random() * 500,
    },
    data: doc,
    type: 'document',
  }));

  // Convert document parents to edges
  const edges = data.edges.map((edge) => ({
    id: `${edge.parentDocumentId}-${edge.childDocumentId}`,
    source: edge.parentDocumentId.toString(),
    target: edge.childDocumentId.toString(),
    type: 'document',
  }));

  const nodesStore = writable<Node[]>(nodes);
  const edgesStore = writable<Edge[]>(edges);
</script>

<div class="h-[calc(100vh-4rem)] w-full">
  <SvelteFlow {nodeTypes} nodes={nodesStore} edges={edgesStore} fitView>
    <Background />
    <Controls />
  </SvelteFlow>
</div>
