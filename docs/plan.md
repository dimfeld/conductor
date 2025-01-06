# AI Coding Agent - Project Plan

Below is a structured plan broken into epics and small, actionable stories. Each epic and story is represented with an unchecked checkbox so you can track progress. Every story has a one-line description and a one-line testing focus, with the requirement for unit tests baked in. All items adhere to the guidelines outlined in the “AI Coder Guidelines” section.

---

## [ ] Epic 1: Task Management

**Summary**: Provide functionality to manage a TODO list of epics and stories in a markdown file, and allow different methods of choosing tasks.

- [ ] **Story 1.1: Add Task Markdown File**  
       **Description**: Create a repository markdown file where epics and stories are listed.  
       **Test Focus**: Verify file creation and correct loading of initial tasks.

- [ ] **Story 1.2: Parse Tasks from Markdown**  
       **Description**: Implement logic to read and parse tasks from the markdown file.  
       **Test Focus**: Check correct parsing of task titles and statuses through unit tests.

- [ ] **Story 1.3: Implement Task Selection Methods**  
       **Description**: Support user-requested tasks, user-typed tasks, and automatic selection of the next task.  
       **Test Focus**: Confirm correct selection flow in different scenarios using mock user inputs.

- [ ] **Story 1.4: Connect with Aider for Coding Tasks**  
       **Description**: Integrate the system to invoke `aider` for performing coding tasks automatically.  
       **Test Focus**: Mock `aider` calls and validate the request flow within the system.

---

## [ ] Epic 2: Writing Code

**Summary**: Empower the agent to generate and maintain documentation, code files, and tests autonomously, referencing external documentation as necessary.

- [ ] **Story 2.1: Setup Documentation Files**  
       **Description**: Create structured Markdown documentation to describe the evolving codebase and external references.  
       **Test Focus**: Verify that documentation files are created and updated using a file system mock.

- [ ] **Story 2.2: Automatic Feature Acceptance Workflow**  
       **Description**: Implement logic to write and run tests automatically until the feature is validated.  
       **Test Focus**: Ensure tests run automatically on code changes and produce success/failure reports.

- [ ] **Story 2.3: Codebase Overview Generation**  
       **Description**: Generate a “codebase overview” markdown file summarizing architecture, modules, and dependencies.  
       **Test Focus**: Check that file generation accurately reflects project modules using fixture data.

- [ ] **Story 2.4: External Documentation Referencing**  
       **Description**: Support linking to external docs (e.g., tool references), updated in a dedicated references markdown file.  
       **Test Focus**: Validate correct linking and updating of references with minimal user input.

- [ ] **Story 2.5: Dockerized Development Environment**  
       **Description**: Provide a Docker configuration for a local SvelteKit + Bun development environment to facilitate code generation.  
       **Test Focus**: Verify container builds and runs SvelteKit successfully, ensuring no environment conflicts.

---

## [ ] Epic 3: User Interaction

**Summary**: Establish mechanisms for user notification, progress tracking, and intervention when the agent is stuck.

- [ ] **Story 3.1: Setup SSE Notifications**  
       **Description**: Implement Server-Sent Events to stream updates to web clients.  
       **Test Focus**: Confirm events reach connected clients with real-time updates.

- [ ] **Story 3.2: Discord Webhook Integration**  
       **Description**: Add webhook notifications to a specified Discord channel.  
       **Test Focus**: Mock webhook calls and check correct message payload format.

- [ ] **Story 3.3: Stalled Agent Detection**  
       **Description**: Detect when the agent is not making progress and trigger a user notification.  
       **Test Focus**: Simulate agent inactivity and verify correct alert behavior via SSE and Discord.

- [ ] **Story 3.4: Session History Logging**  
       **Description**: Maintain a complete log of all user and agent interactions for review.  
       **Test Focus**: Ensure logs are properly stored and retrievable for each session.

---

## [ ] Epic 4: Version Control

**Summary**: Provide compatibility with both Git and Jujutsu (jj), including branching/logging for each coding step.

- [ ] **Story 4.1: Dual VCS Support Setup**  
       **Description**: Configure the application to handle both Git and Jujutsu operations.  
       **Test Focus**: Mock Git/JJ commands and verify correct branching and commit flows.

- [ ] **Story 4.2: Branch Creation per Instance**  
       **Description**: Automatically create a new branch/workspace from a specified base for each agent instance.  
       **Test Focus**: Validate branch name generation and successful checkout with mocked VCS tools.

- [ ] **Story 4.3: Commit Tracking**  
       **Description**: Record commits and link each commit to the corresponding step in the agent’s execution.  
       **Test Focus**: Confirm correct commit messages and detail logging through unit tests.

- [ ] **Story 4.4: Dockerize Version Control Integration**  
       **Description**: Provide a Docker image that includes relevant Git and Jujutsu tools to standardize the environment.  
       **Test Focus**: Build and run the container ensuring both tools function as expected inside Docker.

---

## [ ] Epic 5: Project Management

**Summary**: Support handling multiple parallel projects and multiple agent instances for each project.

- [ ] **Story 5.1: Multi-Project Support**  
       **Description**: Add the ability to track tasks, commits, and logs for more than one project simultaneously.  
       **Test Focus**: Check segregation of data and tasks between multiple projects with unit tests.

- [ ] **Story 5.2: Parallel Work Instances**  
       **Description**: Allow multiple agent instances working on the same project using separate branches or worktrees.  
       **Test Focus**: Verify concurrency handling and that each agent instance references the correct branch.

- [ ] **Story 5.3: Database Setup with Drizzle**  
       **Description**: Configure a SQLite database with Drizzle ORM to store agent progress, enabling future expansions.  
       **Test Focus**: Ensure migrations run correctly, and Drizzle queries function as expected.

- [ ] **Story 5.4: Dockerized Database**  
       **Description**: Provide a Docker container (if needed) to facilitate standardized SQLite usage for testing or local dev.  
       **Test Focus**: Validate container usage in a CI/CD pipeline or local dev environment.

---

## [ ] Epic 6: User Management

**Summary**: Though multi-user features are low priority, keep the design flexible for potential upgrades.

- [ ] **Story 6.1: Basic User Model**  
       **Description**: Implement a simple user model (e.g., admin) in Drizzle for future expansion, without full auth.  
       **Test Focus**: Check that the user model can be created and retrieved, ensuring schema correctness.

- [ ] **Story 6.2: Flexible Auth Placeholder**  
       **Description**: Reserve scaffolding in SvelteKit for future Keycloak or other auth integration without implementing it yet.  
       **Test Focus**: Confirm that placeholder routes and components exist without breaking existing flows.

---

### Notes on Testing & Guidelines

- Every story will have its own unit tests using the `bun:test` framework with Svelte Testing Library where applicable.
- Code must follow TypeScript best practices, with ESLint rules enforced.
- Use descriptive variable/function names and JSDoc comments in each module.
- Implement error handling and form validation with sveltekit-superforms and zod.
- Ensure modular design (SOLID) and use dependency injection.
- Parallelize backend and frontend tests to reduce runtime.
