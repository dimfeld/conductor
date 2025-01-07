# Epic: Agent Core Loop MVP

_Focus: Implement basic agent functionality with console interface and state management_

## Stories

### - [ ] Core Infrastructure Setup

- Description: Set up basic project structure with langgraph and necessary dependencies
- Testing: Verify project builds and dependencies are correctly configured
- Subtasks:
  - Initialize TypeScript project with Bun
  - Configure langgraph for state machine
  - Set up AI SDK integration
  - Add inquirer/prompts dependency
  - Create initial database schema

### - [ ] Task Input System

- Description: Implement console-based task input using inquirer
- Testing: Verify task input is correctly captured and stored
- Subtasks:
  - Create task input prompt interface
  - Implement task storage in database
  - Add input validation
  - Create commit after task creation

### - [ ] Task Planning System

- Description: Integrate with aider to generate implementation plans
- Testing: Verify plan generation and storage works correctly
- Subtasks:
  - Set up aider integration
  - Implement plan generation logic
  - Create plan storage in markdown
  - Add commit step for plan creation
  - Store planning step in database

### - [ ] Interface Definition Step

- Description: Create system to define and store interface types
- Testing: Verify type definitions are generated correctly
- Subtasks:
  - Create interface generation logic
  - Implement type definition storage
  - Add validation for generated types
  - Create commit step for interface definitions
  - Store interface step in database

### - [ ] Code Generation - Frontend

- Description: Implement frontend code generation based on interface
- Testing: Verify generated frontend code matches interface
- Subtasks:
  - Create frontend code generation logic
  - Implement template system
  - Add type validation
  - Create commit step for frontend code
  - Store frontend generation step in database

### - [ ] Code Generation - Backend

- Description: Implement backend code generation based on interface
- Testing: Verify generated backend code matches interface
- Subtasks:
  - Create backend code generation logic
  - Implement API endpoint generation
  - Add type validation
  - Create commit step for backend code
  - Store backend generation step in database

### - [ ] Type Checking System

- Description: Implement automatic type checking and fixing
- Testing: Verify type issues are detected and resolved
- Subtasks:
  - Create type checking automation
  - Implement error detection
  - Add automatic fix generation
  - Create commit step for type fixes
  - Store type checking step in database

### - [ ] Test Generation System

- Description: Create test generation and execution pipeline
- Testing: Verify tests are generated and run correctly
- Subtasks:
  - Implement test generation logic
  - Create test execution system
  - Add test result tracking
  - Create commit step for tests
  - Store test generation step in database

### - [ ] Test Running Loop

- Description: Implement test execution and fix cycle
- Testing: Verify test failures are addressed and fixed
- Subtasks:
  - Create test execution loop
  - Implement fix generation
  - Add progress tracking
  - Create commit step for fixes
  - Store test running step in database

### - [ ] Code Formatting System

- Description: Implement code formatting step
- Testing: Verify code meets style guidelines
- Subtasks:
  - Set up code formatter
  - Implement formatting automation
  - Add format verification
  - Create commit step for formatting
  - Store formatting step in database

### - [ ] Documentation Update System

- Description: Implement documentation and lessons learned updates
- Testing: Verify documentation is correctly updated
- Subtasks:
  - Create documentation update logic
  - Implement lessons learned storage
  - Add documentation validation
  - Create commit step for documentation
  - Store documentation step in database

### - [ ] State Machine Integration

- Description: Implement langgraph state machine for core loop
- Testing: Verify state transitions work correctly
- Subtasks:
  - Define state machine states
  - Implement state transitions
  - Add error handling
  - Create progress tracking
  - Store state machine logs in database

## Dependencies and Flow

1. Core Infrastructure must be completed first
2. Task Input System must be completed before Planning System
3. Interface Definition must be completed before any code generation
4. Code Generation (both frontend and backend) must be completed before Type Checking
5. Test Generation must be completed before Test Running Loop
6. Formatting and Documentation systems can be implemented last
7. State Machine Integration should be implemented incrementally with each story

## Notes

- Each story should include database schema updates if needed
- Every step must include proper error handling and logging
- All commits should follow conventional commit format
- Progress tracking should be detailed enough for debugging
- Each story should include CLI output formatting
