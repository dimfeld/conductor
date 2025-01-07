# Project Plan

## Project Overview

Automated coding assistant that manages tasks, writes code, and integrates with version control systems while maintaining separation between frontend and backend concerns.

## Epics and Stories

### - [ ] Epic: Project Selection

_Focus: Create a robust project selection system_

#### Stories:

- [ ] Create Project Data Structure

       - Description: Implement project storage and relationships in SQLite using Drizzle ORM. Include fields for project path, required technologies, frameworks, and current state.
       - Testing: Confirm project relationships are properly maintained and data integrity is preserved

- [ ] Create Project Configuration File Format

       - Description: Create a format for project configuration files that can be stored in the root directory of the project and read as needed. This format should contain common commands to be run for testing, buliding, linting, etc. and whatever else is useful.

- [ ] Add Project Management Logic

       - Description: Allow selecting a project from the filesystem and store information about it in the database. Support both git and jujutsu workspaces, with ability to manage multiple simultaneous instances using worktrees.
       - Testing: Verify project management follows defined rules and workspace isolation is maintained

### - [ ] Epic: Version Control System Integration

_Focus: Implement VCS functionality for both Git and Jujutsu_

#### Stories:

- [ ] Implement Basic Git Operations

  - Description: Create functions for basic Git operations (clone, branch, commit)
  - Testing: Verify Git operations execute successfully

- [ ] Add Jujutsu Support

  - Description: Implement parallel Jujutsu operations
  - Testing: Ensure Jujutsu commands execute correctly

- [ ] Create Branch Management

  - Description: Implement branch creation and switching logic
  - Testing: Verify branch operations maintain correct state

- [ ] Implement Worktree Management

  - Description: Add support for multiple worktrees/workspaces
  - Testing: Confirm multiple worktrees can be managed simultaneously

- [ ] Create Commit Tracking System
  - Description: Implement commit history and state tracking
  - Testing: Verify commit history is accurately maintained

### - [ ] Epic: Task Management System

_Focus: Create robust task tracking and management functionality_

#### Stories:

- [ ] Implement TODO Parser

  - Description: Create parser for markdown TODO files that can handle epics and stories.
  - Testing: Verify parser correctly interprets various TODO formats and task selection methods

- [ ] Create Task Data Structure

  - Description: Implement task storage and relationships
  - Testing: Confirm task relationships are properly maintained

- [ ] Add Task Selection Logic

  - Description: Implement algorithms for choosing next tasks
  - Testing: Verify task selection follows priority rules

- [ ] Create Progress Tracking

  - Description: Implement task progress monitoring system
  - Testing: Ensure progress updates are accurate and timely

- [ ] Add Task State Management
  - Description: Implement task state transitions and validation
  - Testing: Verify state transitions follow defined rules

### - [ ] Epic: Agent Core Logic

_Focus: Implement the AI agent's core decision-making and execution capabilities_

#### Stories:

- [ ] Create Planning Phase Logic

  - Description: Implement task analysis and planning system that can parse requirements, determine frontend/backend needs and contracts between them, generate technical specifications, and create dependency graphs. Use Aider's architect mode to perform planning.
  - Testing: Verify planning output meets required format and correctly identifies component requirements

- [ ] Implement Code Generation Frontend and Backend Phases

  - Description: Create code generation and modification system using Aider and the Vercel AI SDK. Ensure proper separation between frontend and backend code, using SvelteKit load functions and form actions for communication.
  - Testing: Ensure generated code follows project standards and maintains proper separation of concerns

- [ ] Add Test Generation

  - Description: Implement automatic test generation
  - Testing: Verify generated tests are valid and useful

- [ ] Implement Testing Loop

  - Description: Create test execution loop that includes test execution, issue fixing, and reporting.
  - Testing: Verify test execution is accurate and report generation is complete

- [ ] Create Code Review Logic

  - Description: Implement self-review and validation system
  - Testing: Confirm review process catches common issues

- [ ] Implement Progress Detection
  - Description: Add system to detect and handle lack of progress
  - Testing: Verify stall detection works accurately

### - [ ] Epic: Additional Project Management Features

_Focus: Implement additional project management features_

- [ ] Track required technologies and frameworks

       - Description: Create and store a list of technologies and frameworks required for each project. This will inform which documentation sources are needed.
       - Testing: Ensure the list can be created and updated correctly

- [ ] Implement Documentation Management

       - Description: Create and maintain documentation about the codebase for both humans and the agent. Set up system to update documentation as features are added.
       - Testing: Verify documentation is properly organized and stays in sync with codebase changes

### - [ ] Epic: Frontend Implementation

_Focus: Create user interface for interacting with the AI agent_

#### Stories:

- [ ] Create Dashboard Layout

  - Description: Implement main dashboard interface
  - Testing: Verify responsive design works across devices

- [ ] Add Task Management UI

  - Description: Create interface for task viewing and management
  - Testing: Ensure all task operations work through UI

- [ ] Implement Progress Visualization

  - Description: Create progress and status displays
  - Testing: Verify real-time updates display correctly

- [ ] Add Agent Interaction Interface

  - Description: Create interface for direct agent interaction
  - Testing: Confirm all agent commands work through UI

- [ ] Implement Notification System
  - Description: Add user notification components
  - Testing: Verify notifications appear appropriately

### - [ ] Epic: Integration and Communication

_Focus: Implement systems for component communication and external service integration_

#### Stories:

- [ ] Implement SSE System

  - Description: Create Server-Sent Events infrastructure
  - Testing: Verify real-time updates are received

- [ ] Add Discord Integration

  - Description: Implement Discord webhook notifications
  - Testing: Confirm notifications reach Discord

- [ ] Create Session Recording

  - Description: Implement session history tracking
  - Testing: Verify session history is complete

- [ ] Add External Tool Integration

  - Description: Implement Aider and AI SDK integration
  - Testing: Ensure external tools work as expected

- [ ] Implement Error Handling
  - Description: Create comprehensive error handling system
  - Testing: Verify errors are properly caught and reported

### - [ ] Epic: Documentation and Testing

_Focus: Create comprehensive documentation and testing infrastructure_

#### Stories:

- [ ] Create API Documentation

  - Description: Document all API endpoints and usage
  - Testing: Verify documentation accuracy

- [ ] Add Code Documentation

  - Description: Create inline code documentation and guides
  - Testing: Ensure documentation follows standards

- [ ] Implement Integration Tests

  - Description: Create end-to-end integration test suite
  - Testing: Verify all components work together

- [ ] Create User Documentation

  - Description: Write user guides and documentation
  - Testing: Confirm documentation clarity

- [ ] Add Performance Testing
  - Description: Implement performance monitoring and testing
  - Testing: Verify system meets performance requirements

## Dependencies and Notes

- Frontend development requires basic API functionality
- Integration testing requires both frontend and backend implementation
- Version control integration should be completed before agent implementation
- Task management system should be implemented before agent core logic

---

## Notes on Testing & Guidelines

- Every story will have its own unit tests using the `vitest` framework with Svelte Testing Library where applicable.
- Code must follow TypeScript best practices, with ESLint rules enforced.
- Use descriptive variable/function names and JSDoc comments in each module.
- Implement error handling and form validation with sveltekit-superforms and zod.
- Ensure modular design (SOLID) and use dependency injection.
- Parallelize backend and frontend tests to reduce runtime.
- Create SQLite tables and use Drizzle ORM as needed to persist data.
