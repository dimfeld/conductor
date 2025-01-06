# AI Coder Guidelines

## Code Quality

1. Write **comprehensive unit tests** for functions and modules to ensure robust functionality.
2. Follow **TypeScript best practices** and adhere to **ESLint rules** for maintaining code quality.
3. Use **descriptive variable and function names** to enhance clarity and readability.
4. Provide **JSDoc comments** for all functions, detailing parameters, return types, and functionality.

## Architecture and Modularity

5. All web code should use web best practices, such as <a> tags for navigation and <form> tags for form handling.
6. Ensure **all code is modular**, reusable, and adheres to SOLID principles.
7. Use **dependency injection** for better code organization, scalability, and testability.
8. Follow **SvelteKit best practices** to organize related functionality logically.
9. Use **Drizzle** for defining entities and managing database operations.

## Error Handling and Security

10. Implement **error handling** to account for edge cases and unexpected inputs.
11. Validate form uploads using **sveltekit-superforms** and **zod** to prevent malicious uploads.

## Documentation and Testing

12. Write tests using the `vitest` library.
13. Write **automated tests** for Svelte components with **Svelte Testing Library**.
14. Mock real services in tests to ensure independence and faster execution.
15. Enable **parallel test execution** for backend and frontend tests to reduce runtime.

## Best Practices

16. Maintain a clear separation of concerns in modules and codebase.
17. Avoid hardcoding configurations; use environment variables for flexibility.
18. Always consider scalability and future maintainability when designing components or architecture.
