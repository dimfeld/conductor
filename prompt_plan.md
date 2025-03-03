Below is a detailed, step-by-step blueprint for building the Git Repository Management and Task Automation Tool as outlined in the provided specification. The blueprint is designed to ensure incremental progress, best practices, and early testing, with no large jumps in complexity. Following the blueprint, I’ve broken it into small, iterative prompts suitable for a code-generation LLM to implement in a test-driven manner. Each prompt builds on the previous ones, ensuring integration and avoiding orphaned code.

---

## Step-by-Step Blueprint

### Step 1: Project Setup and Foundation
- **Objective**: Establish the base SvelteKit project with essential dependencies and a basic UI layout.
- **Tasks**:
  - Initialize a SvelteKit project with TypeScript support.
  - Install UI and validation libraries (shadcn-svelte, Zod, js-yaml).
  - Create a basic layout with a sidebar and main panel.
- **Why First**: Provides the foundation for all subsequent features.

### Step 2: Global Configuration Management
- **Objective**: Implement configuration loading and repository selection.
- **Tasks**:
  - Create a sample `config.json` with default settings.
  - Implement a configuration loader module.
  - Load repositories into the sidebar and enable selection via a URL parameter.
- **Dependencies**: Relies on the SvelteKit project setup.

### Step 3: Spec File Listing and Creation
- **Objective**: Allow users to view and create spec files for a selected repository.
- **Tasks**:
  - Implement a route to list spec files in a repository.
  - Define a Zod schema for spec validation.
  - Create a form to input spec details and save them as YAML files.
- **Dependencies**: Requires repository selection from Step 2.

### Step 4: Project Notes Management
- **Objective**: Enable editing and saving of project notes.
- **Tasks**:
  - Implement a route with a textarea for `notes.md`.
  - Handle loading and saving notes content.
- **Dependencies**: Builds on repository selection from Step 2.

### Step 5: Task Execution with Real-Time Output
- **Objective**: Execute tasks from spec files with real-time output streaming.
- **Tasks**:
  - Add execution links to the spec list.
  - Create an execution route and SSE endpoint to run tasks.
  - Display streamed output in the UI.
- **Dependencies**: Requires spec files from Step 3.

### Step 6: Repomix Integration
- **Objective**: Integrate Repomix to generate file context.
- **Tasks**:
  - Implement a route to run Repomix with configurable options.
  - Display the output in the UI.
- **Dependencies**: Uses repository selection from Step 2 and config from Step 1.

### Step 7: UI Enhancements and Final Integration
- **Objective**: Enhance the UI and wire all features together.
- **Tasks**:
  - Add tabs or navigation for multiple task executions (optional enhancement).
  - Ensure all routes are accessible from the sidebar or main panel.
- **Dependencies**: Integrates all previous steps.


## Iterative Prompts for Implementation

Below are the small, iterative prompts, each designed to be implemented safely with strong testing, building incrementally on previous steps. Each prompt includes context, a clear task, and integration instructions to ensure cohesion.

### Prompt 1: Initialize SvelteKit Project
```
**Context**: We are building a Git Repository Management and Task Automation Tool using SvelteKit and Node.js. This is the first step to set up the project foundation.

**Task**: Initialize a new SvelteKit project named "git-task-tool" using the SvelteKit CLI. Use the skeleton project template and enable TypeScript support. After initialization, navigate into the project directory and install dependencies with `pnpm install`. Create a `.gitignore` file including `node_modules` and `.env`.

**Integration**: This sets up the base project structure. Future steps will add files and features within this structure.

**Testing**: Verify the project runs with `pnpm run dev` and opens a blank page at `http://localhost:5173`.
```

### Prompt 2: Install Dependencies
```
**Context**: With the SvelteKit project initialized, we need to install libraries for UI components, validation, and YAML handling as per the specification.

**Task**: In the "git-task-tool" project, install the following dependencies via npm:
- `shadcn-svelte` for UI components (follow its installation guide for SvelteKit).
- `zod` for schema validation.
- `js-yaml` for YAML parsing and serialization.
Update `package.json` with these dependencies.

**Integration**: These libraries will be imported in subsequent steps for UI, validation, and spec file handling.

**Testing**: Ensure `pnpm install` completes without errors and verify that imports like `import { z } from 'zod'` work in a test file (e.g., `src/lib/test.ts`).
```

### Prompt 3: Create Basic Application Layout
```
**Context**: The tool requires a UI with a sidebar for repository selection and a main panel for content, built on the initialized SvelteKit project.

**Task**: In `src/routes/+layout.svelte`, define a layout using shadcn-svelte components:
- A sidebar on the left (20% width) with placeholder text "Repository List".
- A main area (remaining width) that renders the `children` snippet for route content.
Ensure the layout is responsive. Use TypeScript in the script tag.

**Integration**: This layout will host the repository list (next step) and route content (later steps).

**Testing**: Run `pnpm run dev`, visit `http://localhost:5173`, and confirm the sidebar and main area display correctly on various screen sizes.
```

### Prompt 4: Create Sample Configuration File
```
**Context**: The tool uses a global `config.json` file for settings, building on the project setup.

**Task**: In the project root, create `config.json` with:
```json
{
  "repositories": [
    { id: 'repo1', path: '/path/to/repo1' },
    { id: 'repo2', path: '/path/to/repo2' }
  ],
  "aider": {
    "model": "gpt-3.5-turbo",
    "apiKey": "your-api-key-here"
  },
  "repomix": {
    "options": {
      "filter": "*.ts",
      "outputFormat": "json"
    }
  }
}
```
Add a comment above noting that users must replace placeholders with actual values.

**Integration**: This file will be loaded in the next step to populate the UI.

**Testing**: Manually verify the file exists and is valid JSON using a JSON linter.
```

### Prompt 5: Implement Configuration Loader
```
**Context**: With `config.json` created, we need a module to load it, building on the project setup and dependencies.

**Task**: Create `src/lib/config.ts` with a `loadConfig` function that:
- Checks `process.env.GIT_TOOL_CONFIG_PATH` for a custom path; otherwise, uses `./config.json`.
- Uses `fs.readFileSync` to read the file and `JSON.parse` to parse it.
- Throws an error if the file doesn’t exist or is invalid JSON.
Export the function with a TypeScript type for the config object.

**Integration**: This function will be used to load repository paths in the next step.

**Testing**: Write unit tests in `src/lib/config.test.ts` using Vitest:
- Test loading a valid `config.json`.
- Test error handling for a missing file.
Run `pnpm run test` to verify.
```

### Prompt 6: Set Up Server-Side Layout for Repositories
```
**Context**: The layout needs to display repositories from `config.json`, building on the layout and config loader.

**Task**: Create `src/routes/+layout.server.ts`:
- Import `loadConfig` from `$lib/config`.
- Define an async `load` function that calls `loadConfig` and returns `{ repositories: config.repositories }`.
- Handle errors by throwing a 404 if config loading fails.

**Integration**: The returned `repositories` will be used in the layout to render the sidebar (next step).

**Testing**: Test `pnpm run dev`, visit the root, and use the browser’s dev tools to confirm `repositories` is in the page props (via `__sveltekit` data).
```

### Prompt 8: Render Repository List in Sidebar
```
**Context**: With repositories loaded and a store ready, render them in the sidebar, enhancing the layout.

**Task**: Update `src/routes/+layout.svelte`:
- Use `export let data` to access `repositories` from `+layout.server.ts`.
- In the sidebar, render a clickable list of `repositories` using shadcn-svelte `List` component.
- Each item should be a `<a href="/projects/{repoId}">` link
- In the main area, display “Selected Repository: {page.params.repoId || 'None'}”.

**Integration**: Connects the config’s repositories to the UI and sets the stage for repository-specific routes.

**Testing**: Run `pnpm run dev`, click a repository, and verify the main area updates. Write a test in `src/routes/__tests__/layout.test.ts` to simulate clicks via Svelte Testing Library.
```

### Prompt 9: Implement Spec File Listing Route
```
**Context**: Users need to see spec files for a selected repository, building on repository selection.

**Task**: Create `src/routes/projects/[repoId]/specs/+page.server.ts`:
- Decode `params.repoId`.
- Verify it’s in `loadConfig().repositories`; else, throw a 404.
- Read `${repoPath}/specs/` with `fs.readdirSync`, filter for `.yaml` files, return `{ specFiles }`.
Create `+page.svelte`:
- Display `data.specFiles` in a shadcn-svelte `List`.
- Show “No spec files found” if empty.
- Add a `<a href="./new">Create New Spec</a>` link.

**Integration**: Links to spec creation (next steps) and uses the selected repository.

**Testing**: Mock `fs` in a test to verify spec listing and error handling.
```

### Prompt 10: Define Spec Schema
```
**Context**: Spec files need validation before creation, building on the Zod dependency.

**Task**: Create `src/lib/specSchema.ts`:
```typescript
import { z } from 'zod';
export const specSchema = z.object({
  specName: z.string().min(1, "Spec name is required"),
  objective: z.string().min(1, "Objective is required"),
  implementation: z.array(z.string()),
  tasks: z.array(z.object({
    name: z.string().min(1, "Task name is required"),
    prompt: z.string().min(1, "Task prompt is required"),
    evaluation: z.string().optional(),
  })).min(1, "At least one task is required"),
  aider: z.object({
    model: z.string().optional(),
    architect: z.boolean().optional(),
    editable_files: z.array(z.string()).optional(),
    readonly_files: z.array(z.string()).optional(),
  }).optional(),
});
```

**Integration**: Used in spec creation to validate form data (next steps).

**Testing**: Write unit tests for valid/invalid inputs in `src/lib/specSchema.test.ts`.
```

### Prompt 11: Implement Spec Creation Form
```
**Context**: Users need a form to create spec files, building on the spec listing and schema.

**Task**: Create `src/routes/projects/[repoId]/specs/new/+page.svelte`:
- Use shadcn-svelte components for:
  - Input for `specName`.
  - Textarea for `objective`.
  - Textarea for `implementation` (split by lines).
  - Dynamic task list (array of `{ name, prompt, evaluation }`), each with inputs.
  - “Add Task” button to append a new task.
  - “Create Spec” button.
- On submit, prevent default, send JSON via `fetch` to the current URL with `{ specName, objective, implementation, tasks }`.
- Redirect to `/projects/${page.params.repoId}/specs` on success; log errors otherwise.

**Integration**: Submits to the action (next step) and links from the spec list.

**Testing**: Test form rendering and submission with Svelte Testing Library.
```

### Prompt 12: Implement Spec Creation Action
```
**Context**: Handle spec form submission to save as YAML, building on the form and schema.

**Task**: Create `src/routes/projects/[repoId]/specs/new/+page.server.ts`:
- Import `fs`, `path`, `js-yaml`, `specSchema`, and `{ redirect }` from `@sveltejs/kit`.
- Define `actions.default`:
  - Decode `params.repoId`, verify it’s managed.
  - Parse `request.json()`.
  - Validate with `specSchema.safeParse`.
  - Sanitize `specName` (spaces to hyphens, alphanumeric + hyphens only).
  - Create `${repoPath}/specs/` if needed.
  - Find next prefix from existing `.yaml` files (e.g., `000001`).
  - Save `{ objective, implementation, tasks }` as YAML with `js-yaml.dump`.
  - Return `{ success: true, redirect: "/projects/[repoId]/specs" }`.

**Integration**: Saves specs for listing and execution.

**Testing**: Test validation, file writing, and prefix logic with mocked `fs`.
```

### Prompt 13: Implement Project Notes
```
**Context**: Add a notes editor for repositories, building on repository selection.

**Task**: Create `src/routes/projects/[repoId]/notes/+page.server.ts`:
- `load`: Decode `repoPath`, read `${repoPath}/notes.md` or return `''`.
- `actions.default`: Write `request.json().notes` to `${repoPath}/notes.md`.
Create `+page.svelte`:
- Textarea bound to `data.notes`.
- “Save” button sends JSON POST.
- Log success/error.

**Integration**: Accessible via a new sidebar link (added later).

**Testing**: Test loading and saving with mocked `fs`.
```

### Prompt 14: Implement Task Execution Route
```
**Context**: Execute spec tasks with real-time output, building on spec listing.

**Task**: Update `src/routes/projects/[repoId]/specs/+page.svelte`:
- Add `<a href="./[specName]/execute">Execute</a>` per spec.
Create `src/routes/repositories/[repoId]/specs/[specName]/execute/stream/+server.ts`:
- Parse spec, merge Aider config.
- For each task:
  - Run `jj bookmark create`, `jj workspace add`.
  - Spawn `aider` with merged config, stream stdout/stderr via SSE.
  - Commit and push with `jj`.
Create `+page.svelte`:
- Use `EventSource` to stream from `/stream`, display in `<pre>`.

**Integration**: Links from spec list; output shown in UI.

**Testing**: Mock child processes and test SSE streaming.
```

### Prompt 15: Implement Repomix Integration
```
**Context**: Run Repomix for file context, building on repository selection.

**Task**: Create `src/routes/repositories/[repoId]/repomix/+page.server.ts`:
- `load`: Return `loadConfig().repomix.options`.
- `actions.default`: Run `repomix` with options, return `{ output, stderr }`.
Create `+page.svelte`:
- Show options, “Run Repomix” button sends POST.
- Display output in `<pre>` with loading state.

**Integration**: Accessible via sidebar link (added next).

**Testing**: Mock `exec` and test output display.
```

### Prompt 16: Enhance UI and Wire Features Together
```
**Context**: Finalize the UI by linking all features, building on all previous steps.

**Task**: Update `src/routes/+layout.svelte`:
- Add sidebar links to `/repositories/[repoId]/specs`, `/notes`, `/repomix`
- Style with shadcn-svelte for consistency.

**Integration**: Connects all routes via the sidebar.

**Testing**: Test navigation and responsiveness manually and with UI tests.
```

---

## Review and Adjustments
The prompts are small enough for safe, testable implementation yet substantial enough to advance the project. Each builds on prior steps, ensuring integration (e.g., sidebar links added last connect all features). Testing is included per prompt, focusing on unit (logic), integration (file ops), and UI (rendering/navigation) tests. Complexity grows gradually: setup → config → UI → features → integration.

These prompts are ready for a code-generation LLM, prioritizing best practices (TypeScript, error handling, modular code) and incremental progress, culminating in a fully wired application.

---
