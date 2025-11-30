# Testing & QA

## Integration (in `__tests__/e2e/`)
- Import route handlers directly (no server needed), create mock `Request`, call handler, assert on `Response`.
- Use MongoDB Memory Server for isolation when DB involved.

## Unit (in `lib/**/*.test.ts`)
- Test services for business logic; controllers for validation and error mapping; utilities in isolation.
- Mock external dependencies; keep scope focused.

## Commands
- `npm test` (all), `npm run test:unit`, `npm run test:integration`, `npm run test:watch`, `npm run test:coverage`.

## Principles
- Prefer pure functions and minimal side effects.
- Separate concerns: validation in controllers, business logic in services, persistence in DB helpers.
- Add tests when behavior risk is meaningful; avoid silent failures.
