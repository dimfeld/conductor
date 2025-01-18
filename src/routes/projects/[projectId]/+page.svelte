<script lang="ts">
  import { enhance } from '$app/forms';
  import { Button } from '$lib/components/ui/button';

  let { data } = $props();

  type ProjectFile = (typeof data)['fullFiles'][number];

  interface Folder {
    path: string;
    subfolders: Folder[];
    files: ProjectFile[];
  }

  function addToFolderOrSubfolder(folder: Folder, file: ProjectFile) {
    const folderPath = file.path.split('/').slice(0, -1).join('/');
    if (folder.path === folderPath) {
      folder.files.push(file);
    } else {
      let subfolder = folder.subfolders.find((f) => folderPath.startsWith(f.path));
      if (!subfolder) {
        const nextSlash = folderPath.indexOf('/', folder.path.length + 1);
        const subfolderPath = nextSlash === -1 ? folderPath : folderPath.slice(0, nextSlash);

        subfolder = {
          path: subfolderPath,
          subfolders: [],
          files: [],
        };
        folder.subfolders.push(subfolder);
      }

      addToFolderOrSubfolder(subfolder, file);
    }
  }

  function sortFolder(folder: Folder) {
    folder.files.sort((a, b) => a.path.localeCompare(b.path));
    folder.subfolders.sort((a, b) => a.path.localeCompare(b.path));

    for (const subfolder of folder.subfolders) {
      sortFolder(subfolder);
    }
  }

  let fileTree = $derived.by(() => {
    let files = data.fullFiles;
    let rootFolder: Folder = {
      path: '',
      subfolders: [],
      files: [],
    };

    for (const file of files) {
      addToFolderOrSubfolder(rootFolder, file);
    }

    sortFolder(rootFolder);
    return rootFolder;
  });

  let subfolderOpen: Record<string, boolean> = $state({});
  let selectedFile: ProjectFile | undefined = $state(undefined);

  export const snapshot = {
    capture() {
      return { subfolderOpen, selectedPath: selectedFile?.path };
    },
    restore(newState) {
      subfolderOpen = newState.subfolderOpen;
      selectedFile = newState.selectedPath
        ? data.fullFiles.find((f) => f.path === newState.selectedPath)
        : undefined;
    },
  };

  function defaultOpen(path: string) {
    if (path.startsWith('src/lib/components/ui')) {
      return false;
    }

    return true;
  }
</script>

<div>
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

{#snippet folderFiles(folder: Folder, depth: number)}
  <ul style="margin-left: {depth / 4}rem">
    {#each folder.subfolders as subfolder}
      <li>
        <details
          bind:open={
            () => subfolderOpen[subfolder.path] ?? defaultOpen(subfolder.path),
            (newOpen) => (subfolderOpen[subfolder.path] = newOpen)
          }
        >
          <summary>
            {subfolder.path.split('/').pop()}
          </summary>
          {@render folderFiles(subfolder, depth + 1)}
        </details>
      </li>
    {/each}
    {#each folder.files as file}
      <li onmousemove={() => (selectedFile = file)}>{file.path.split('/').pop()}</li>
    {/each}
  </ul>
{/snippet}

<div class="flex w-full gap-2">
  <nav>
    {@render folderFiles(fileTree, 0)}
  </nav>
  <main class="flex-1">
    {#if selectedFile}
      <div class="space-y-4 rounded-lg bg-white p-6 shadow-md">
        <h1 class="text-2xl font-bold text-gray-900">{selectedFile.path}</h1>
        {#if selectedFile.area}
          <div class="border-l-4 border-blue-500 bg-blue-50 p-3">
            <h2 class="text-lg font-semibold text-blue-800">Area</h2>
            <p class="text-blue-700">{selectedFile.area}</p>
          </div>
        {/if}
        {#if selectedFile.short_description}
          <div class="border-l-4 border-gray-500 bg-gray-50 p-3">
            <h2 class="text-lg font-semibold text-gray-800">Description</h2>
            <p class="text-gray-700">{selectedFile.short_description}</p>
          </div>
        {/if}
        {#if selectedFile.long_description}
          <div class="rounded-md bg-gray-100 p-4">
            <h2 class="mb-2 text-lg font-semibold text-gray-900">Detailed Analysis</h2>
            <p class="leading-relaxed text-gray-600">{selectedFile.long_description}</p>
          </div>
        {/if}
      </div>
    {/if}
  </main>
</div>
