# Repository Guidelines

## Project Structure & Module Organization
The app uses the Next.js App Router under `src/app`, with route groups like `dashboard` and API handlers in `src/app/api`. Shared UI components live in `src/components`, grouped by feature (`chat/`, `charts/`) and primitives in `components/ui`. Domain data, config, and context live in `src/data`, `src/constants`, and `src/contexts`. Cross-cutting logic is in `src/lib` and `src/services`; static assets sit in `public/` and email fixtures in `test-emails/`.

## Build, Test, and Development Commands
- `pnpm dev` (or `npm run dev`) launches the Turbopack dev server on port 3456.
- `pnpm build` creates the production bundle; run before verifying deploy artifacts.
- `pnpm start` serves the compiled app locally for smoke tests.
- `pnpm lint`, `pnpm lint:fix`, and `pnpm format` enforce ESLint and Prettier rules.
- `pnpm type-check` validates TypeScript types; `pnpm check` runs the full quality gate.

## Coding Style & Naming Conventions
Use TypeScript with functional React components. Prettier 3.x controls formatting: two-space indentation, double quotes, trailing commas. Keep components in PascalCase (`ThemeToggle`), hooks/utilities in camelCase (`useSecurityValidation`, `fileToBase64`), and prefer named exports. Tailwind is acceptable, but factor repeated patterns into `components/ui`.

## Testing Guidelines
`pnpm test` is currently a stub. Add colocated specs as `*.test.tsx` for components and `src/lib/**/*.test.ts` for helpers when introducing logic. Document new fixtures or mocks, and include manual verification notes for the user flows you change until automated coverage is in place.

## Commit & Pull Request Guidelines
Follow Conventional Commits (`feat:`, `fix:`, `chore:`); keep subjects under 72 characters with concise context. PRs should link relevant issues, describe user impact, attach screenshots of dashboard states when visuals change, list validation evidence (`pnpm check`, manual steps), and flag configuration updates.

## Security & Configuration Tips
Store provider credentials in `.env.local` (e.g. `DEFAULT_AI_PROVIDER`, `OPENAI_API_KEY`, `DEEPSEEK_*`, `ANTHROPIC_*`). Never commit secrets. Use `src/app/api/test-env/` to confirm environment wiring, and reuse `useSecurityValidation` when adding services under `src/lib/ai`.
