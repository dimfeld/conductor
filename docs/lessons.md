# Lessons Learned while Writing Code

## Svelte

- Use `$props` instead of `export let` in Svelte components.
- Make sure to separate backend and frontend concerns, using SvelteKit load functions and form actions to send data between the two.
- Place `// @vitest-environment jsdom` at the top of each test file that tests Svelte components.

## Project Data Structure

1. **Summary**: Implemented project storage and relationships in SQLite using Drizzle ORM.

2. **Key Insights**:

   - Drizzle's transaction API ensures atomic operations for related tables
   - Using `with` in queries simplifies relationship fetching
   - Timestamp defaults in schema prevent manual date handling
   - Composite primary keys work well for many-to-many relationships
   - Type inference from schema reduces duplicate type definitions

3. **References**:

   - `src/lib/server/db/schema.ts` (schema design)
   - `src/lib/server/db/projects.ts` (CRUD operations)
   - `src/lib/server/db/projects.test.ts` (test patterns)

4. **Testing**:
   - Transaction rollback in tests ensures clean state
   - Relationship tests revealed need for cascade deletes
   - Type-safe test assertions catch schema mismatches early
   - Parallel test execution requires careful DB cleanup
