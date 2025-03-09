Below is a comprehensive, developer-ready specification for the locally-hosted web-based tool based on the requirements gathered during the brainstorming process. This specification includes all relevant requirements, architecture choices, data handling details, error handling strategies, and a testing plan, ensuring that a developer can immediately begin implementation.

---

# Developer Specification: Local LLM Context Builder with Jujutsu Integration

## 1. Overview

This tool is a locally-hosted, web-based application designed to help users build context for a Large Language Model (LLM) by selecting files, directories, package dependencies, and applying grep filters. The context is constructed using the `repomix` utility, combined with rules from `.mdc` files, a task description, and an optional formatting prompt. The final context is copied to the clipboard for use in an LLM service. Additionally, the tool integrates with `jujutsu (jj)` for version control, allowing users to manage workspaces, view diffs, and commit changes.

### Key Features
- Context selection using a tree view, manually typed globs, `pnpm` workspace packages, and grep expressions.
- Inclusion of rules from `.mdc` files (automatic and manual selection).
- Task description input and optional formatting prompt.
- Integration with `jujutsu (jj)` for workspace management, diffs, and commits.
- Real-time file system watching to update the UI.
- Data persistence per workspace in a local YAML file.

## 2. Technology Stack

- **Frontend**: Svelte 5, SvelteKit, shadcn-svelte, Tailwind CSS
- **Backend**: SvelteKit server routes
- **Data Storage**: 
  - Local YAML file in each project (`.conductor.yaml`)
  - Global JSON file listing all projects and other global settings (`config.json`)
- **External Tools**: `repomix`, `ripgrep`, `jujutsu (jj)`
- **File Watching**: Node.js `fs.watch` or `chokidar` library
- **Real-time Updates**: Server-Sent Events (SSE)

## 3. Core Functionality

### 3.1 Context Building
The context is built by combining file contents, rules, task instructions, and an optional formatting prompt.

#### Steps to Generate Context
1. **File Selection**:
   - **Tree View**: Users select specific files and directories via a collapsible tree view with checkboxes.
   - **Globs**: Users manually type subdirectories or globs in a separate input field.
   - **Package Dependencies**: Users select `pnpm` workspace packages from a list, and the tool includes the directories of the selected packages.
   - **Grep Expressions**:
     - **Independent Grep**: Comma-separated grep expressions applied to the entire project directory.
     - **Tree View Grep**: Comma-separated grep expressions applied only to the files selected in the tree view.
   - Use `ripgrep` to process both sets of grep expressions and generate a combined list of matching files.

2. **Run `repomix`**:
   - Pass the combined list of files (from tree view, globs, packages, and grep results) to `repomix` to concatenate their contents.

3. **Include Rules**:
   - Automatically include rules from `.mdc` files based on their conditions.
   - Allow manual selection of additional `.mdc` rules via checkboxes.
   - Wrap each included rule in `<rule>` tags.

4. **Task Instructions**:
   - Include the contents of the "task" textarea wrapped in `<instructions>` tags.

5. **Formatting Prompt**:
   - Optionally append a fixed formatting prompt wrapped in `<formatting>` tags, controlled by a checkbox.

6. **Copy to Clipboard**:
   - Concatenate the `repomix` output, rules, task instructions, and formatting prompt (if selected).
   - Copy the final context to the clipboard.

### 3.2 Version Control Integration (Jujutsu)
- **Workspace Management**:
  - List available workspaces.
  - Switch between workspaces.
  - Create new workspaces (automatically create a bookmark with each new workspace).
- **View Diffs**:
  - Display a side-by-side diff view using the output of `jj diff`.
- **Commit Changes**:
  - Provide a text field for the commit message and a button to run `jj commit`.

### 3.3 File System Watching
- Monitor the entire project directory for file changes (add, modify, delete).
- Use Server-Sent Events (SSE) to push updates to the frontend and update the tree view in real-time.

## 4. User Interface

### 4.1 Top Navigation
- **Workspace Dropdown**:
  - List available `jj` workspaces.
  - Allow switching between workspaces.
  - Option to create a new workspace (prompt for name).
- **Tabs**:
  - "Context Builder": Main tab for context generation.
  - "Diff": Tab for viewing diffs and committing changes.

### 4.2 Context Builder Tab
- **Tree View**:
  - Collapsible folder structure with checkboxes for file and directory selection.
- **Globs Input**:
  - Text input for manually typing subdirectories or globs.
- **Package Dependencies**:
  - List of `pnpm` workspace packages with checkboxes for selection.
- **Grep Inputs**:
  - "Independent Grep": Text input for comma-separated grep expressions (applied to the entire project).
  - "Tree View Grep": Text input for comma-separated grep expressions (applied only to tree view selections).
- **Task Textarea**:
  - Textarea for entering the task description.
- **Formatting Prompt Checkbox**:
  - Checkbox labeled "Include Formatting Prompt" (resets to checked on each load).
- **Generate Context Button**:
  - Button to trigger context generation and copy to clipboard.

### 4.3 Diff Tab
- **Commit Controls**:
  - Text field with placeholder "Enter commit message".
  - "Commit" button to run `jj commit`.
- **Diff View**:
  - Side-by-side comparison of changes using the output of `jj diff`.

### 4.4 Real-time Updates
- The tree view updates in real-time based on file system changes (add, modify, delete) via SSE.

## 5. Data Storage

### 5.1 `.conductor.yaml`
- **Location**: Project root directory.
- **Structure**: Flat mapping of workspace names to their settings.
- **Settings Saved Per Workspace**:
  - Selected tree view files.
  - Manually typed globs.
  - Selected `pnpm` workspace packages.
  - Independent and tree view grep expressions.
  - Task description.
  - State of the "Include Formatting Prompt" checkbox.
- **Update Mechanism**: Overwrite the file immediately after generating context.

## 6. Technical Implementation

### 6.1 Backend (SvelteKit Server Routes)
- **Context Generation**:
  - Run `ripgrep` to process grep expressions and generate file lists.
  - Run `repomix` with the combined file list to concatenate file contents.
  - Read and parse `.mdc` files for rules (automatic and manual inclusion).
  - Concatenate all components (file contents, rules, task, formatting prompt).
- **Jujutsu Integration**:
  - Run `jj` commands as child processes for workspace management, diffs, and commits.
- **File Watching**:
  - Use Node.js `fs.watch` or `chokidar` to monitor the project directory.
  - Push file change events (add, change, delete) via SSE.
- **SSE Server Route**:
  - Establish an SSE connection to send file change events to the frontend.

### 6.2 Frontend (Svelte 5)
- **Components**:
  - Tree view with checkboxes.
  - Inputs for globs, grep expressions, task description.
  - Checkbox for formatting prompt.
  - Buttons for generating context and committing changes.
  - Side-by-side diff view.
- **Real-time Updates**:
  - Use a reactive store to handle SSE events and update the tree view accordingly.

## 7. Error Handling
- **Child Process Errors**: Catch and display user-friendly error messages for failures in `repomix`, `ripgrep`, or `jj`.
- **Input Validation**: Validate globs and grep expressions where possible (e.g., syntax errors).
- **Data File Handling**: Gracefully handle cases where `.conductor.yaml` is missing or corrupted (e.g., create a new file or use default settings).

## 8. Testing Plan
- **Unit Tests**:
  - Test individual components (e.g., tree view, inputs).
  - Test server routes for context generation and `jj` commands.
- **Integration Tests**:
  - Test the full context building flow.
  - Test `jj` workspace management, diffs, and commits.
- **End-to-End Tests**:
  - Test UI interactions (e.g., selecting files, entering inputs, generating context).
  - Test real-time updates via SSE.
- **Manual Testing**:
  - Verify file watcher reliability and SSE performance.
  - Test edge cases for file system changes and workspace switching.

---

This specification provides a clear and detailed blueprint for the development of the tool. It ensures that all functional requirements are met, the architecture is well-defined, and the necessary integrations are in place. A developer can use this document to begin implementation immediately, with a solid understanding of the expected behavior, UI layout, data handling, and technical choices.
