# Conductor2 Development Guidelines

## Build Commands
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm check` - Type checking
- `pnpm format` - Format code with Prettier
- `pnpm lint` - Run Prettier and ESLint
- `pnpm test` - Run all tests
- `pnpm test:unit` - Run Vitest unit tests
- `pnpm test:e2e` - Run Playwright e2e tests
- `pnpm test:unit path/to/file.test.ts` - Run specific test file

## Code Style
- TypeScript: Strict mode with explicit types
- Formatting: 2-space indent, 100 char width, single quotes
- Components: Follow shadcn-svelte component patterns
- Imports: Use path aliases ($lib, etc.)
- Naming: PascalCase for components, camelCase for variables/functions
- Error handling: Use typed errors and proper error boundaries
- State management: Use Svelte state classes and context for shared state
