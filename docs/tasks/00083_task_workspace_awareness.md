1. Story Overview:
The Workspace Awareness story focuses on implementing functionality to detect and track workspace configurations across different version control systems (Git and Jujutsu). This system will scan project directories to identify workspace configuration files, parse their contents to determine package locations, and maintain this information in the project's state. This capability is fundamental to the Repo Scanner epic as it provides the foundation for package-level documentation and analysis.

2. Technical Requirements:
- TypeScript for implementation
- File system access capabilities (Node.js fs module)
- YAML parsing library for workspace configurations
- Integration with existing Project class
- Database schema updates using Drizzle ORM
- Support for both Git and Jujutsu VCS
- Glob pattern matching capability
- Error handling and logging system

3. Implementation Details:
a. Database Schema Updates:
- Do not update the database schema. We want to rely on the filesystem as the source of truth.

b. Workspace Detection:
- Create new file src/lib/project/workspace_scanner.ts:
  - Implement WorkspaceScanner class
  - Add methods for detecting workspace files (pnpm-workspace.yaml, etc.)
  - Create workspace configuration parser
  - Implement glob pattern matching for package discovery

c. Project Class Integration:
- Update src/lib/project/project.ts:
  - Add workspace tracking capabilities
  - Implement methods to refresh workspace state
  - Add workspace information to project configuration

d. VCS Integration:
- Enhance src/lib/project/server/vcs.ts:
  - Add workspace-aware branch management
  - Implement workspace state tracking per branch

e. File Mapping Integration:
- Update src/lib/project/file_map.ts:
  - Add workspace context to file mapping
  - Implement package-aware file organization

4. Potential Challenges:
- Complex glob pattern matching in workspace configs
  Solution: Use established glob libraries with thorough testing
- Handling workspace changes during runtime
  Solution: Implement file watching and state refresh mechanism
- Cross-platform path handling
  Solution: Use path normalization and platform-aware path handling
- Performance with large workspaces
  Solution: Implement caching and incremental scanning

5. Dependencies:
Technical Dependencies:
- Core Infrastructure epic completion
- Database schema migration system
- File system access capabilities
- VCS integration functionality

File Dependencies:
- src/lib/project/project.ts
- src/lib/project/file_map.ts
- src/lib/project/server/vcs.ts
- src/lib/server/db/schema.ts
- src/lib/project/infer_project_settings.ts

6. Acceptance Criteria:
- Successfully detects and parses pnpm-workspace.yaml files
- Correctly identifies all packages matching workspace glob patterns
- Stores workspace configuration and package information in database
- Updates workspace state when configuration changes
- Handles multiple workspace configurations in different branches
- Provides API to query workspace and package information
- Maintains consistency between workspace state and VCS branches
- Implements proper error handling for invalid configurations
- Includes comprehensive test coverage for workspace detection and parsing
- Documentation updated to reflect workspace awareness capabilities
- Performance meets requirements (scanning completes within 30 seconds for typical projects)