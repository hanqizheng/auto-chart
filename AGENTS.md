# Repository Guidelines

## Project Structure & Module Organization
The app follows the Next.js App Router layout under `src/app`, with route groups such as `dashboard` and API handlers in `src/app/api`. Shared UI resides in `src/components` (split into feature folders like `chat/`, `charts/`, and low-level primitives in `components/ui/`). Domain data, constants, and context providers live in `src/data`, `src/constants`, and `src/contexts` respectively, while cross-cutting helpers are in `src/lib` and `src/services`. Static assets and email fixtures are kept in `public/` and `test-emails/`.

## Build, Test, and Development Commands
- `pnpm dev` (or `npm run dev`) starts the Turbopack dev server on port 3456.
- `pnpm build` compiles the production bundle; use before verifying deploy artifacts.
- `pnpm start` serves the compiled app locally.
- `pnpm lint`, `pnpm lint:fix`, and `pnpm format` enforce linting and formatting.
- `pnpm type-check` validates TypeScript types; `pnpm check` runs the full quality gate.

## Coding Style & Naming Conventions
TypeScript + React with functional components is standard. Prettier (3.x) controls formatting: two-space indentation, double quotes, and trailing commas. Keep components in PascalCase (`ThemeToggle`) and hooks/utilities in camelCase (`useSecurityValidation`, `fileToBase64`). Prefer named exports for shared modules, colocate component styles in the same file, and use Tailwind utility classes sparingly—extract repeated patterns into `components/ui`. Run `pnpm format && pnpm lint` before committing.

## Testing Guidelines
`pnpm test` is a stub today; add meaningful tests alongside new features. For React logic, colocate component specs as `*.test.tsx` near the source, and cover data helpers in `src/lib/**/*.test.ts`. When adding a framework (Vitest or Jest), wire it into the `test` script and document fixtures or mocks. Every PR should include manual verification notes for user flows touched until automated coverage is in place.

## Commit & Pull Request Guidelines
Follow the Conventional Commit style already in history (`feat: ...`, `fix: ...`, `chore: ...`). Keep subject lines under 72 characters and include concise context—English or bilingual summaries are acceptable. PRs should link the relevant issue, describe the user impact, list test evidence (`pnpm check`, screenshots of dashboard states), and call out configuration changes. Request review from a teammate familiar with the affected module.

## Security & Configuration Tips
Store API credentials for AI providers in `.env.local` (`DEFAULT_AI_PROVIDER`, `OPENAI_API_KEY`, `DEEPSEEK_*`, `ANTHROPIC_*`). Never commit secrets; use the `src/app/api/test-env/` endpoint to verify environment wiring locally. When contributing new services under `src/lib/ai`, validate input and reuse the shared security helpers (`useSecurityValidation`) before invoking remote APIs.
