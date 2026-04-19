# webCV Backend — Implementation Tasks

## Foundation (pre-module)
- [x] Install dependencies
- [x] Configure `main.ts` (ValidationPipe, Swagger, global filter)
- [x] `supabase/` module + service
- [x] `common/decorators/public.decorator.ts`
- [x] `common/guards/jwt-auth.guard.ts`
- [x] `common/filters/http-exception.filter.ts`
- [x] Wire global guard + filter in `AppModule`

## Module 1/2 — Auth & Users
- [x] DTOs: `RegisterDto`, `LoginDto`, `ChangePasswordDto`, `ResetPasswordDto`, `UpdateUserDto`
- [x] `AuthController` + `AuthService`
- [x] `UsersController` + `UsersService`
- [x] Review checkpoint

## Module 3 — Sites
- [x] DTOs: `CreateSiteDto`, `UpdateSiteDto`
- [x] `SitesController` + `SitesService`
- [x] Supabase table SQL migration
- [x] Review checkpoint

## Module 4 — Storage
- [x] `StorageController` + `StorageService`
- [x] Review checkpoint

## Module 5 — AI Analyzer
- [x] `AiController` + `AiService`
- [x] Rate limiting / cooldown logic
- [x] Review checkpoint

## Module 6 — Generator
- [x] `GeneratorController` + `GeneratorService` (ZIP streaming)
- [x] Live preview endpoint (`GET /generator/preview/:siteId`) — single self-contained HTML file, inline CSS/JS, served directly
- [x] Review checkpoint

## Module 6 Extension — GitHub Integration (Optional)
- [ ] `POST /generator/github/:siteId` — push generated site to GitHub Pages via `octokit`

## Finalization
- [x] Dockerization (`Dockerfile` + `docker-compose.yml`)
- [x] `.env.example` with all required keys listed
- [x] Environment validation on startup (Zod schema via `@nestjs/config`)
- [x] `README.md` — tech stack, local dev setup, Docker setup, initial Supabase setup (buckets, SQL migrations), Resend SMTP configuration
- [x] Render Deployment — configure connected GitHub repository for automatic deployment
- [x] Appropriate licensing (incl. Inter font mention, the Magic-UI template inspiration)
