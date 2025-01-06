# AI Coder Guidelines

## Code Quality

1. Write **comprehensive unit tests** for functions and modules to ensure robust functionality.
2. Follow **TypeScript best practices** and adhere to **ESLint rules** for maintaining code quality.
3. Use **descriptive variable and function names** to enhance clarity and readability.
4. Provide **JSDoc comments** for all functions, detailing parameters, return types, and functionality.

## Architecture and Modularity

5. Ensure **all code is modular**, reusable, and adheres to SOLID principles.
6. Use **dependency injection** for better code organization, scalability, and testability.
7. Follow **SvelteKit module structure** to organize related functionality logically.
8. Use **Drizzle** for defining entities and managing database operations.

## Error Handling and Security

9. Implement **error handling** to account for edge cases and unexpected inputs.
10. Validate form uploads using **sveltekit-superforms** and **zod** to prevent malicious uploads.

## Documentation and Testing

11. Write tests using the `bun:test` library.
12. Write **automated tests** for Svelte components with **Svelte Testing Library**.
13. Mock real services in tests to ensure independence and faster execution.
14. Enable **parallel test execution** for backend and frontend tests to reduce runtime.

## Best Practices

15. Maintain a clear separation of concerns in modules and codebase.
16. Avoid hardcoding configurations; use environment variables for flexibility.
17. Always consider scalability and future maintainability when designing components or architecture.
