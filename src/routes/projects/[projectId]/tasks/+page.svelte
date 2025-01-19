<script lang="ts">
  import type { PageData } from './$types';
  import { enhance } from '$app/forms';
  import { Checkbox } from '$lib/components/ui/checkbox';

  let { data }: { data: PageData } = $props();

  $inspect(data);
</script>

<div class="space-y-8">
  {#each data.plan.plan as epic, epicIndex}
    <div class="rounded-lg border p-4">
      <div class="mb-4 flex items-center gap-2">
        <h2 class="text-xl font-semibold">{epic.title}</h2>
        <span class="text-sm text-muted-foreground">({epic.focus})</span>
      </div>

      <div class="ml-4 space-y-4">
        {#each epic.stories as story, storyIndex}
          <div class="border-l-2 pl-4">
            <form
              method="POST"
              action="?/toggleStory"
              use:enhance
              class="mb-2 flex items-center gap-2"
            >
              <input type="hidden" name="epicIndex" value={epicIndex} />
              <input type="hidden" name="storyIndex" value={storyIndex} />
              <Checkbox name="completed" checked={story.completed} type="submit" />
              <h3 class="font-medium {story.completed ? 'text-muted-foreground line-through' : ''}">
                {story.title}
              </h3>
            </form>

            {#if story.description}
              <p class="mb-2 text-sm text-muted-foreground">{story.description}</p>
            {/if}

            {#if story.subtasks}
              <div class="ml-4 mt-2 space-y-2">
                {#each story.subtasks as subtask, subtaskIndex}
                  <form
                    method="POST"
                    action="?/toggleSubtask"
                    use:enhance
                    class="flex items-center gap-2"
                  >
                    <input type="hidden" name="epicIndex" value={epicIndex} />
                    <input type="hidden" name="storyIndex" value={storyIndex} />
                    <input type="hidden" name="subtaskIndex" value={subtaskIndex} />
                    <Checkbox name="completed" checked={subtask.completed} type="submit" />
                    <span class={subtask.completed ? 'text-muted-foreground line-through' : ''}
                      >{subtask.title}</span
                    >
                  </form>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/each}
</div>
