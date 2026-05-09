# webCV Backend — Claude Code Instructions

## Project Overview
NestJS REST API backend for "webCV", a portfolio website generator for IT professionals.
Built as a university "Data Engineering" course deliverable and reused as the backend for an engineering thesis.

Core philosophy: **user independence** — no vendor lock-in, users own their generated static sites.

---

## Tech Stack
| Layer | Technology |
|---|---|
| Framework | NestJS (Node.js) |
| Language | TypeScript (strict mode) |
| Database | PostgreSQL via Supabase |
| Storage | Supabase Storage |
| Authentication | Supabase Auth / JWT |
| AI Integration | Google Gemini API |
| API Docs | `@nestjs/swagger` |
| Validation | `class-validator` + `class-transformer` |
| File export | `archiver` (in-memory ZIP streaming) |
| GitHub export | `octokit` (optional) |

---

## Folder Structure
```
src/
  auth/
    auth.module.ts
    auth.controller.ts
    auth.service.ts
    dto/
  users/
    users.module.ts
    users.controller.ts
    users.service.ts
    dto/
  sites/
    sites.module.ts
    sites.controller.ts
    sites.service.ts
    dto/
  storage/
    storage.module.ts
    storage.controller.ts
    storage.service.ts
  ai/
    ai.module.ts
    ai.controller.ts
    ai.service.ts
  generator/
    generator.module.ts
    generator.controller.ts
    generator.service.ts
  common/
    decorators/
      public.decorator.ts     ← @Public() decorator
    guards/
      jwt-auth.guard.ts       ← global JWT guard
      ownership.guard.ts      ← reusable ownership check
    filters/
      http-exception.filter.ts
    interceptors/
  supabase/
    supabase.module.ts
    supabase.service.ts       ← three clients: supabase (anon), supabaseAdmin (service role), clientForUser(jwt)
```

---

## Architectural Rules (Strict)

### 1. Swagger First
Every controller, endpoint, and DTO must be fully decorated:
- Controllers: `@ApiTags`
- Endpoints: `@ApiOperation`, `@ApiResponse` (cover all possible response codes)
- DTOs: `@ApiProperty` on every field (include `example` values)

### 2. Stateless File Handling
- **Images** (avatars, portfolio screenshots) → Supabase Storage only.
- **PDF files** for AI analysis → handle in memory via `file.buffer`, discard immediately after sending to Gemini. Never write to disk.
- **ZIP export** → generate HTML/CSS/JS in memory, stream directly to HTTP response via `archiver`. Never write to disk.

### 3. Validation
- Use `class-validator` and `class-transformer` for all incoming DTOs.
- Enable `ValidationPipe` globally with `whitelist: true` and `forbidNonWhitelisted: true`.

### 4. Ownership Guards
- Every endpoint operating on a resource by ID must verify the authenticated user owns that resource before proceeding.
- Return `403 Forbidden` on ownership mismatch — never `404` (avoids leaking resource existence).
- Implement as a reusable guard or shared service method in `common/guards/ownership.guard.ts`.

### 5. Global Auth Guard
- Apply JWT auth guard globally at the app module level.
- All endpoints are protected by default.
- Endpoints that must be public (`POST /auth/register`, `POST /auth/login`) must be explicitly marked with the `@Public()` decorator from `common/decorators/public.decorator.ts`.
- Opting out of auth must always be intentional and visible in code.

### 6. Gemini Rate Limiting
- Reject files exceeding 5MB with `400 Bad Request` before the buffer is passed to the Gemini SDK.
- Enforce a per-user minimum 30s cooldown between `/ai/analyze-cv` calls, using `ThrottlerGuard` or an in-memory timestamp map.
- These checks must happen in this order: size check → cooldown check → Gemini call.

---

## Response Shape Convention
All endpoints must return a consistent response envelope:

**Success:**
```json
{
  "data": { },
  "message": "Human readable success message"
}
```

**Error:**
```json
{
  "statusCode": 400,
  "message": "Human readable error message",
  "error": "Bad Request"
}
```

Use a global `HttpExceptionFilter` to ensure all errors follow this shape.

---

## Supabase Client
`SupabaseService` exposes three clients — never instantiate Supabase directly in controllers or services, always import `SupabaseModule`:

| Client | Key | Use for |
|---|---|---|
| `supabase` | anon key | Auth operations only (`signUp`, `signInWithPassword`, `resetPasswordForEmail`) |
| `supabaseAdmin` | service role key | All DB queries — bypasses RLS, ownership enforced in application code |
| `clientForUser(jwt)` | anon key + user JWT header | Supabase Storage calls — RLS enforced by bucket policies |

**Why this separation matters:** calling `auth.signInWithPassword` on a client mutates its internal session. If the same client is used for DB queries, subsequent queries run under the last logged-in user's RLS context — causing cross-user data leaks. Keeping auth and DB clients separate eliminates this entirely.

- `auth.admin.*` methods require service role → always use `supabaseAdmin`
- Storage controllers must extract the JWT from `Authorization` header and pass it to the service for `clientForUser(jwt)`

### Storage RLS Policies
Bucket-level RLS policies are defined in `supabase/migrations/storage_rls_policies.sql` and must be applied manually in the Supabase SQL Editor when setting up a new environment. They enforce:
- `avatars` bucket — authenticated users can upload/update/delete only under their own `userId/` folder; public read
- `screenshots` bucket — authenticated users can upload/delete only under their own `userId/` folder; public read

These policies are the **second layer** of ownership enforcement for storage. The first layer is application-level code in `StorageService`. Both layers must remain in sync.

---

## Implementation Workflow
When asked to implement a module, always follow this order:
1. DTOs — with full Swagger and `class-validator` decorators.
2. Controller — with Swagger operation decorators and routing.
3. Service — with business logic.
4. **Stop and ask for review before proceeding to the next module.**

---

## General Conventions
- Use `async/await` throughout — no raw Promise chains.
- Never use `any` type — use proper TypeScript types or generics.
- Use NestJS built-in `Logger` for logging, never `console.log`.
- Environment variables must be accessed via a `ConfigService` — never `process.env` directly in business logic.
- All database queries must be scoped to the authenticated user's ID to prevent cross-user data access.
- ALWAYS use `pnpm` for package management.
- Prefer `curl` testing as it's easier than Swagger via browser MCP.
- Before starting dev server, check if it's already running and kill it if necessary.
