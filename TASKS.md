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
- [ ] `AiController` + `AiService`
- [ ] Rate limiting / cooldown logic
- [ ] Review checkpoint

## Module 6 — Generator
- [ ] `GeneratorController` + `GeneratorService` (ZIP streaming)
- [ ] GitHub push (optional)
- [ ] Review checkpoint

## Finalization
- [ ] Dockerization (`Dockerfile` + `docker-compose.yml`)
- [ ] `.env.example` with all required keys listed
- [ ] Environment validation on startup (Zod schema via `@nestjs/config`)
- [ ] `README.md` — tech stack, local dev setup, Docker setup, initial Supabase setup (buckets, SQL migrations), Resend SMTP configuration
- [ ] GitHub Actions CI — install, lint, build
