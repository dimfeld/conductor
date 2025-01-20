1. Epic Overview:
The Agent Core Loop MVP epic focuses on implementing the fundamental workflow engine that powers the AI coding assistant. This system will handle task input, planning, code generation, testing, and documentation in a structured, repeatable way. The core loop must maintain state, handle errors gracefully, and provide clear feedback throughout the development process.

2. Key Components and Features:
   - Task Management System: Console-based input and database storage
   - Planning Engine: Integration with aider for implementation planning
   - Code Generation Pipeline: Separate frontend and backend generation
   - Testing Framework: Automated test generation and execution
   - Documentation System: Automated updates and lessons learned
   - State Machine: LangGraph-based workflow control
   - Version Control Integration: Git/Jujutsu support with atomic commits
   - Progress Tracking: Database-driven state and progress monitoring

3. Relation to Existing Files:
   - Extends src/lib/agent/index.ts with core loop functionality
   - Integrates with src/lib/llm.ts for AI interactions
   - Utilizes src/lib/server/db/schema.ts for state storage
   - Enhances src/lib/project/file_map.ts for codebase analysis
   - Leverages src/lib/aider/index.ts for code generation
   - Works with src/lib/server/tracing/* for monitoring
   - Utilizes src/lib/project/server/vcs.ts for version control

4. Stories and Tasks:
   - Core Infrastructure Setup (Completed)
   - Project Configuration File (Completed)
   - Task Input System
   - Task Planning System
   - Interface Definition Step
   - Code Generation (Frontend/Backend)
   - Type Checking System
   - Test Generation System
   - Test Running Loop
   - Code Formatting System
   - Documentation Update System
   - State Machine Integration
   - File Map System

5. Implementation Considerations:
   5.1 Challenges and Risks:
       - Managing complex state transitions
       - Handling AI service rate limits
       - Ensuring deterministic behavior
       - Preventing infinite loops
       - Maintaining data consistency

   5.2 Dependencies:
       - OpenAI/AI service availability
       - Aider integration
       - Database schema migrations
       - Version control system access

   5.3 Architectural Decisions:
       - Event-driven architecture using LangGraph
       - Database-backed state management
       - Atomic commits for each state transition
       - Clear separation of frontend/backend concerns
       - Modular design for extensibility

   5.4 Performance and Scalability:
       - Efficient state storage and retrieval
       - Rate limit handling for AI services
       - Parallel execution where possible
       - Resource usage monitoring
       - Performance metrics collection

   5.5 Security and Compliance:
       - Secure handling of API keys
       - Safe execution of generated code
       - Audit trail of all operations
       - Input validation and sanitization
       - Error handling and logging

6. Timeline and Impact:
   - Core infrastructure and task input should be prioritized
   - Code generation and testing can be implemented iteratively
   - Documentation and formatting systems can be implemented last
   - Expected timeline: 2-3 months for full implementation
   - Critical path for overall project success

7. Success Criteria:
   - All stories implemented and tested
   - Core loop successfully processes tasks end-to-end
   - Error handling demonstrates robustness
   - State machine properly manages workflow
   - Documentation is automatically generated
   - Tests pass consistently
   - Performance meets target metrics
   - Version control integration works reliably

8. Additional Notes:
   - Consider implementing feature flags for gradual rollout
   - Plan for monitoring and debugging tools
   - Create comprehensive logging strategy
   - Document failure recovery procedures
   - Consider future extensibility requirements
   - Plan for integration testing infrastructure
   - Consider implementing dry-run mode for testing