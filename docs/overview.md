# Project Overview

## System Architecture Overview

The agent should operate in a loop with the following high-level components:

- Task Queue Manager
- Planning Module
- Execution Engine
- Testing Framework
- Frontend Interface
- Backend Service

## Task Processing Loop Structure

1. Task Definition Phase:

- Accept task description from user interface
- Parse requirements into structured format
- Determine if task requires frontend, backend, or both

2. Planning Phase:

- Generate technical specifications
- Break down task into subtasks
- Create dependency graph
- Identify required technologies and frameworks
- Separate frontend and backend concerns. Not all tasks require both.
- Create contracts for communication between frontend and backend, usually using SvelteKit load functions and form actions

3. Execution Phase:

- Backend Development:

  - Generate API specifications
  - Create database schemas if needed
  - Implement server-side logic
  - Generate documentation

- Frontend Development:
  - Create UI components
  - Implement client-side logic
  - Handle state management
  - Ensure responsive design

4. Testing Phase:

- Backend Testing:

  - Unit tests for API endpoints
  - Integration tests
  - Performance tests

- Frontend Testing:

  - Component tests
  - End-to-end tests
  - Visual regression tests
  - Accessibility tests

## Key Considerations

1. Separation of Concerns:

- Keep frontend and backend code separate
- Use API contracts for communication
- Never attempt filesystem operations in browser code

2. Error Handling:

- Implement robust error detection
- Provide clear error messages
- Detect when the agent is not making progress on a task, and stop and notify the user.

3. Code Quality:

- Enforce consistent coding standards
- Generate comprehensive documentation

## Key Features

1. Task Management

- Manage a TODO list of epics and stories in a markdown file in the repository
- Different methods of choosing work to do:
  - User requests a specific task from the TODO list
  - User types in a task not present in the TODO list
  - Agent automatically grabs the next task from the TODO list
  - Invoke aider to perform specific coding tasks

2. Writing Code

- Given a task and what we know about the project
- Create documentation about the codebase for humans, and also markdown files for the agent to reference. Update these files as features are added and new information about the codebase is learned.
- Bring in external documentation as needed. This documentation should be referenced in a markdown file.
- Automatic feature acceptance work, including writing tests and running those tests until thing work

3. User Interaction

- A notification system that can send Server-Sent Events to a connected web client and also send events to a Discord webhook
- Detect when the agent is not making progress, and stop and notify the user.
- Save the entire session history with all agent input and output, so that it can be reviewed.

4. Version Control

- Be compatible with both git and jujutsu (jj) version control systems.
- Each instance should create a new branch from the specified base commit/branch.
- Create a new commit after every change, and record which commit was linked to a particular step.

5. Project Management

- Support tracking work on multiple projects at once.
- Allow multiple simultaneous instances of work on the same project, using git worktrees and branches, or the jujutsu equivalent workspaces.

6. User Management

- Multiple users is NOT a priority for this project.
- No need for any auth or multi-tenancy, but don't make any choices that will preclude adding them later.
  Technical choices:
- Write the code in Typescript
- Bun for package management and executing the code
- SvelteKit for the web application, using Tailwind CSS, shadcn-svelte, and sveltekit-superforms
- SQLite database to track and save progress of each agent instance.
- Use Drizzle ORM for managing database schemas and running queries
- Use the Vercel AI SDK (ai on npm) for making any calls to LLMs that are not done through Aider

## Summary

This AI coder tool design emphasizes:

- Clear separation between planning, execution, and testing phases
- Strict separation of frontend and backend concerns
- Comprehensive testing at each stage
- Modular architecture for easy maintenance and updates

The system can be extended with additional features like:

- Version control integration
- Code review automation
- Performance optimization suggestions
- Security vulnerability scanning
