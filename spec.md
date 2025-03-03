# Project Specification: Git Repository Management and Task Automation Tool

## Overview

This document outlines the requirements and technical specifications for a web-based tool designed to manage Git repositories, create and execute task specifications (spec files), and automate development workflows using tools like Aider and Repomix. The tool will be built using SvelteKit and Node.js, prioritizing simplicity, flexibility, and developer productivity.

## Functional Requirements

### 1. Repository Management
- **Feature**: Manage a list of Git repositories on the local file system.
- **Details**: 
  - Each repository is identified by its local file system path.
  - No additional metadata is required beyond the path.
- **UI**: 
  - A sidebar or similar UI element for selecting and switching between repositories.

### 2. Spec File Creation
- **Feature**: Enable users to create spec files from prompts.
- **Details**:
  - **Storage**: Spec files are saved in a `specs/` directory within the project root.
  - **Naming**: `<6-digit-incrementing-prefix>-<task-name>.yaml` (e.g., `000001-update-readme.yaml`).
  - **Format**: YAML with the following structure:
    ```yaml
    aider:
      model: <model-name>           # Optional, merges with project-level config
      architect: <true/false>       # Optional
      editable_files: [<file1>, ...] # Optional
      readonly_files: [<file1>, ...] # Optional
    objective: <high-level-objective>
    implementation:
      - <detail1>
      - <detail2>
    tasks:
      - name: <task-name>
        prompt: <task-prompt>
        evaluation: <optional-evaluation-info>
      - ...
    ```
  - **Config Merging**: If a project-level Aider config exists, merge it with the spec file’s Aider config, with spec-level settings taking precedence.

### 3. Task Execution
- **Feature**: Execute tasks defined in spec files.
- **Details**:
  - **Order**: Execute tasks sequentially as listed in the spec file.
  - **Execution Process**:
    - For each task:
      - Create a new Jujutsu bookmark or Git branch and a work tree.
      - Name the branch/work tree: `<spec-file-name>-task` (e.g., `000001-update-readme-task`).
      - Run Aider in the work tree to execute the task based on its prompt.
      - Stream Aider’s output to the client in real-time.
      - Provide UI controls to pause or stop Aider execution.
    - On completion:
      - Commit changes with a message like `Implement spec <specName>`.
      - Push the branch to the Git remote.
      - Retain branches/work trees post-execution; offer a manual cleanup option.
- **UI**: 
  - Display task outputs in real-time with status indicators (e.g., running, paused, completed).

### 4. Project Notes
- **Feature**: Manage a file for high-level and technical notes.
- **Details**:
  - Stored as `notes.md` in the project directory.
  - No advanced editing features required; a standard text editor is sufficient.

### 5. Repomix Integration
- **Feature**: Run Repomix to generate file context.
- **Details**:
  - Execute Repomix with configurable options from the global config.
  - Capture and display `stderr` in the response.
  - Output text to a textarea for easy copying.

### 6. User Interface
- **Layout**:
  - **Sidebar**: Repository selection.
  - **Main Panel**: Spec file creation, task execution, and output viewing.
  - **Tabs**: Switch between multiple task executions within a repository, displaying task name and status icon.
- **Additional Features**:
  - Input field to append Aider commands to the current spec file.
  - Button to create a new spec file from a single prompt.

---

## Technical Architecture

### 1. Technologies
- **Frontend**: SvelteKit for a responsive, reactive UI.
- **Backend**: Node.js for file system operations and tool integration.
- **Data Storage**:
  - **Global Configuration**: JSON file (`config.json`) in the current directory or a path set via an environment variable.
  - **Persistent Data**: Text files (spec files, notes) within the project directory.
  - **Global State**: SQLite (optional) for execution logs, task statuses, and managed projects.

### 2. Configuration
- **Global Configuration File**:
  - **Contents**:
    - Repomix options (e.g., filters, output format).
    - Paths to managed Git repositories.
    - Aider defaults (e.g., model, API keys).
    - API keys for external services.
  - **Location**: Current directory or specified via environment variable (e.g., `GIT_TOOL_CONFIG_PATH`).

### 3. Data Handling
- **Spec Files**:
  - Validate using a Zod schema to ensure structural integrity before execution.
- **Task Execution**:
  - Use separate work trees for each task to prevent conflicts.
  - Stream task output in real-time using WebSockets or similar.

### 4. Error Handling
- **Task Execution**:
  - Retry failed tasks up to 3 times before marking as errored.
  - Display errors in the UI with clear messaging (e.g., “Task failed: <error>”).
- **Validation**:
  - Validate spec files pre-execution; reject invalid files with user-friendly error messages.

---

## Development Considerations

### 1. Security
- **API Keys**: Store securely in the global configuration file; avoid hardcoding.
- **File System Access**: Verify permissions to read/write in repository directories.

### 2. Performance
- **Concurrency**: Leverage work trees to isolate task executions, avoiding repository conflicts.
- **Real-time Output**: Optimize streaming to handle large outputs efficiently.

### 3. Usability
- **Intuitive UI**: Use clear labels, status icons, and tooltips for better navigation.
- **Manual Cleanup**: Provide a dedicated UI section for safely deleting branches/work trees.

---

## Testing Plan

### 1. Unit Tests
- **Spec File Validation**: Test Zod schema with valid and invalid inputs.
- **Configuration Merging**: Verify Aider config merging logic (project-level vs. spec-level).

### 2. Integration Tests
- **Task Execution Flow**: Test the full lifecycle: spec creation, task execution, commit, and push.
- **Error Handling**: Simulate failures (e.g., Aider crashes, Git push errors) to validate retries and notifications.

### 3. UI Tests
- **Navigation**: Confirm repository selection and task tab switching are seamless.
- **Real-time Output**: Ensure output streaming is accurate and responsive under load.

### 4. Manual Tests
- **Usability**: Conduct user testing for spec creation, task execution, and UI feedback.
- **Edge Cases**: Test with large repositories, concurrent tasks, and invalid inputs.

