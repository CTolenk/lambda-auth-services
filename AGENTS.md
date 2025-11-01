# Repository Guidelines

## Project Structure & Module Organization
The service is split between runtime Lambdas and infrastructure-as-code assets. The `lambdas/` folder contains `auth-login` and `auth-register`, each with TypeScript sources in `src/handler.ts` that bundle to `dist/index.js`. Keep runtime-specific helpers inside the corresponding Lambda directory; add a `lambdas/shared/` folder only when code truly needs to be reused. The `infrastructure/` directory holds Terraform configuration: reusable modules live under `infrastructure/modules/`, environment values under `infrastructure/environments/*.tfvars`, and service wiring in `infrastructure/main.tf` and `services/`.

## Architecture & Design Principles
Implement Lambda logic using hexagonal architecture. Organize code under `src/` into `domain/` (entities and core rules), `application/` (use cases orchestrating domain services), and `infrastructure/` adapters (AWS clients, persistence, external systems). Keep handlers thin: parse the event, delegate to an application service, and map responses back to API Gateway. Inject dependencies via factory functions so ports/adapters stay replaceable, and document any new adapters in the README of the corresponding Lambda.

## Build, Test, and Development Commands
Run commands from inside the relevant Lambda folder.
- `npm install` installs Lambda dependencies.
- `npm run build` bundles `src/handler.ts` with esbuild into `dist/index.js`.
- `npm run zip` zips the built artifact as `function.zip` for the `${name}/${env}/function.zip` S3 key expected by Terraform.
- `npm start` executes the built handler locally for ad-hoc checks.
Infrastructure lifecycle:
- `terraform init` (once per machine) bootstraps providers.
- `terraform plan -var-file=infrastructure/environments/stage.tfvars` previews the stage rollout; swap in `production.tfvars` for prod.
- `terraform apply -var-file=...` deploys changes after review.

## Coding Style & Naming Conventions
TypeScript compilation runs with `strict` checks; keep 4-space indents and prefer `const` for immutable values. Export a single `handler` per Lambda so `index.handler` stays valid. Use `camelCase` for variables/functions, `PascalCase` for types/interfaces, and log structured JSON via `console.log` for CloudWatch readability. Align Terraform names with the `${var.name}-${var.env}` pattern used across modules.

## Testing Guidelines
Practice TDD: write a failing unit spec before implementing behavior, then iterate red-green-refactor. Automated tests are not yet wired up—the default `npm test` exits non-zero—so add or extend a lightweight runner (e.g., Jest) and ensure `npm test` passes locally before pushing. Store tests alongside the layer they cover (`src/domain/__tests__/`, `src/application/__tests__/`, etc.) using the `*.test.ts` suffix. Cover both happy-path responses and error scenarios, and update Terraform mocks or contract tests when adapters change.

## Commit & Pull Request Guidelines
Recent history favors short, imperative commit titles (e.g., “Fix response Lambda”); follow that style and keep scope focused. Rebase before opening a PR, describe intent and impact, and link tracking issues when available. Include screenshots or console excerpts when behavior changes. For infrastructure updates, attach the relevant `terraform plan` output and note any required AWS secrets or S3 object refreshes. PRs should also mention which environments were exercised (`stage`, `production`) and how reviewers can reproduce the build locally.
