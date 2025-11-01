# Repository Guidelines

## Project Structure & Module Organization
Runtime code lives under `lambdas/`. Each Lambda keeps the hexagonal folders (`src/domain`, `src/application`, `src/infrastructure`, `src/interfaces`, `src/handler.ts`). Place shared ports/adapters in `lambdas/shared/`, including the DynamoDB client provider/factory. Import them via the `@shared/*` path alias configured in each Lambda’s `tsconfig.json`. Start new functions by copying `lambdas/_template/`. Terraform code stays in `infrastructure/` with modules, environment files, and service wiring split across their respective folders.

## Architecture & Design Principles
Keep business logic in `domain` and expose it through ports. Application use cases orchestrate ports and return DTOs for the interface layer. Handlers only parse events, construct domain value objects (e.g., `RegisterUserRequest`), invoke the use case, and translate domain errors to HTTP responses. Instantiate adapters through factories so they are swappable in tests. Always reuse the shared DynamoDB provider (`DynamoDbClientProvider` + `AwsDocumentClientFactory`) so `DocumentClient` instances are cached per process and cold starts stay low.

## Build, Test, and Development Commands
Run commands from the target Lambda folder.
- `npm install` installs dependencies.
- `npm run build` bundles `src/handler.ts` into `dist/index.js`.
- `npm run build:tests` compiles specs into `dist-tests/`.
- `npm test` executes the compiled specs with Node’s test runner.
- `npm run zip` creates `function.zip` for `${name}/${env}/function.zip`.
Infrastructure steps:
- `terraform init` prepares providers.
- `terraform plan -var-file=infrastructure/environments/stage.tfvars` previews changes (swap in `production.tfvars` for prod).
- `terraform apply -var-file=...` deploys after review.

## Coding Style & Naming Conventions
Use 4-space indentation, `const` by default, and TypeScript `strict` mode. Expose a single `handler` per Lambda (`index.handler`). Prefer `camelCase` for variables/functions, `PascalCase` for types, and structured JSON logging. Follow the `${var.name}-${var.env}` pattern in Terraform and keep shared adapters generic for cross-Lambda reuse.

## Testing Guidelines
Adopt TDD: start with a failing spec, make it pass, then refactor. Store tests alongside the layer they cover (`src/domain/__tests__`, `src/application/__tests__`, etc.) using the `*.test.ts` suffix. Cover happy paths, error cases, and adapter boundaries (e.g., DynamoDB uniqueness). Add or update contract tests whenever Terraform resources or AWS integrations change.

## Commit & Pull Request Guidelines
Use short, imperative commit titles (e.g., `Add register use case`). Rebase before opening a PR, describe intent and key changes, and link issues or tickets. Attach `terraform plan` output for infra updates and call out new env vars or S3 artifacts. Mention which environments you tested (`stage`, `production`) and include reproduction steps for behavioral changes.
