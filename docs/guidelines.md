# Coder Guidelines

## Code Quality

1. Write **comprehensive unit tests** for functions and modules to ensure robust functionality.
2. Follow **TypeScript best practices** and adhere to **ESLint rules** for maintaining code quality.
3. Use **descriptive variable and function names** to enhance clarity and readability.
4. Provide **JSDoc comments** for all functions, detailing parameters, return types, and functionality.

## Architecture and Modularity

5. All web code should use web best practices, such as <a> tags for navigation and <form> tags for form handling.
6. Make sure to maintain proper separation between backend and frontend code. Frontend code can not call any functions that require Node and this must go through calls to the backend. In general, prefer using SvelteKit's load function and form actions instead of dedicated API routes, except for the SSE streaming endpoint.
7. Ensure **all code is modular**, reusable, and adheres to SOLID principles.
8. Follow **SvelteKit best practices** to organize related functionality logically.
9. Use **Drizzle** for defining entities and managing database operations. After making changes to the database, run `bun run db:migrate` to generate migrations.
10. The database should only be used for storing logs of agent runs, and minimal administrative data related to the project. Everything else should be stored in the filesystem within the project folder, in formats easily parsed by LLMs such as YAML.

## Error Handling and Security

11. Implement **error handling** to account for edge cases and unexpected inputs.
12. Validate form uploads using **sveltekit-superforms** and **zod** to prevent malicious uploads.

## Documentation and Testing

13. Write tests using the `vitest` library.
14. Write **automated tests** for Svelte components with **Svelte Testing Library**.
15. Mock real services in tests to ensure independence and faster execution.
16. Enable **parallel test execution** for backend and frontend tests to reduce runtime.

## Best Practices

17. Maintain a clear separation of concerns in modules and codebase.
18. Avoid hardcoding configurations; use environment variables for flexibility.
19. Always consider scalability and future maintainability when designing components or architecture.
