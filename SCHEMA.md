# webCV Backend — Schema & Endpoint Reference
# ⚠️ This is a living document. Update freely as the project evolves.

---

## Module 1 — Auth

### Endpoints
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | 🔓 Public | Create a new user |
| POST | `/auth/login` | 🔓 Public | Authenticate, return JWT |
| POST | `/auth/reset-password` | 🔓 Public | Initiate password reset (delegates to Supabase built-in email link flow) |
| PUT | `/auth/confirm-reset` | 🔓 Public | Complete password reset using token from reset email |
| PUT | `/auth/change-password` | 🔒 JWT | Update password (requires current password) |

### DTOs

**RegisterDto**
```ts
email: string        // valid email
password: string     // min 8 chars
```

**LoginDto**
```ts
email: string
password: string
```

**ChangePasswordDto**
```ts
currentPassword: string
newPassword: string  // min 8 chars
```

---

## Module 2 — Users

### Endpoints
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/users/me` | 🔒 JWT | Get current user profile |
| PUT | `/users/me` | 🔒 JWT | Update account details |
| DELETE | `/users/delete-account` | 🔒 JWT | Delete account |

### DTOs

**RegisterDto**
```ts
email: string        // valid email
password: string     // min 8 chars
```

**LoginDto**
```ts
email: string
password: string
```

**ChangePasswordDto**
```ts
currentPassword: string
newPassword: string  // min 8 chars
```

**UpdateUserDto**
```ts
email?: string       // optional
```

---

## Module 3 — Sites (Portfolio CRUD)

### Endpoints
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/sites` | 🔒 JWT | Create a new portfolio |
| GET | `/sites` | 🔒 JWT | Get all portfolios for current user (returns metadata summary only) |
| GET | `/sites/:id` | 🔒 JWT | Get a specific portfolio |
| PUT | `/sites/:id` | 🔒 JWT | Update portfolio data |
| DELETE | `/sites/:id` | 🔒 JWT | Delete a portfolio |

### Site Schema (Database Entity)
```ts
id: uuid
userId: uuid         // FK → auth user, always scoped
fullName: string
jobTitle: string
location: string
bio: string
// avatarUrl column has been dropped — URL is derived at read time from avatarStoragePath
avatarStoragePath: string    // Supabase Storage path, used for deletion + signed URL generation
contacts: json       // { email?, phone?, linkedin?, github?, website? }
skills: string[]
experience: json[]   // [{ company, role, startDate, endDate, description }]
education: json[]    // [{ institution, degree, startDate, endDate }]
projects: json[]     // [{ name, description, url, imageStoragePath }]
achievements: json[] // [{ title, description }]
createdAt: timestamp
updatedAt: timestamp
```

### DTOs

**SiteSummaryResponseDto** (Returned by `GET /sites` to reduce payload size for dashboard tables)
```ts
id: string
fullName: string
jobTitle?: string
avatarUrl?: string   // signed URL (1 hr TTL), computed from avatarStoragePath at read time
createdAt: string
updatedAt: string
```

**CreateSiteDto** — `fullName` required, all other fields optional. **UpdateSiteDto** = `PartialType(CreateSiteDto)` (all fields optional).
```ts
fullName: string          // required
jobTitle?: string
location?: string
bio?: string
// avatarUrl is NOT an input field — it is computed at read time from avatarStoragePath
avatarStoragePath?: string    // returned by POST /storage/upload
contacts?: ContactDto     // { email?, phone?, linkedin?, github?, website? }
skills?: string[]
experience?: ExperienceDto[]  // { company, role, startDate, endDate?, description? }
education?: EducationDto[]    // { institution, degree, startDate, endDate? }
projects?: ProjectDto[]       // { name, description?, url?, imageStoragePath? }
achievements?: AchievementDto[] // { title, description? }
```

**Response**: all read endpoints (`GET /sites`, `GET /sites/:id`, `POST /sites`, `PUT /sites/:id`) return `avatarUrl` (signed, 1 hr TTL) computed from `avatarStoragePath`, and `projects[].imageUrl` (signed) computed from `projects[].imageStoragePath`.

---

## Module 4 — Storage

### Endpoints
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/storage/upload` | 🔒 JWT | Upload an image to a bucket (`avatars` or `screenshots`) — no siteId required |
| DELETE | `/storage/file` | 🔒 JWT | Delete a file by `{ bucket, path }` |

### Request — `POST /storage/upload`
`multipart/form-data` with fields:
- `file` — image binary
- `bucket` — `"avatars"` or `"screenshots"`

### Notes
- Accepted MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- Max file size: **50 MB** (enforced in code)
- Buckets: `avatars` (avatar images), `screenshots` (project screenshots) — both **private** (no public CDN access)
- Upload response returns `{ url, storagePath }` — `url` is a **signed URL (1 hr TTL)** for immediate preview; `storagePath` is permanent. Pass `storagePath` into `POST /sites` or `PUT /sites/:id`
- **Do not persist the `url` from the upload response** — it expires after 1 hour. Always rely on `GET /sites/:id` for display, which re-signs on every read
- Storage path format: `{userId}/{timestamp}.{ext}` — scoped to the authenticated user, no siteId dependency
- This enables the **upload-first flow**: upload images → receive paths → create site in a single `POST /sites` call

### Supabase Client Usage
Storage calls use a **per-request client** scoped to the user's JWT (`clientForUser(jwt)`) so that Supabase Storage RLS bucket policies are enforced natively. Signed URL generation uses `supabaseAdmin.storage.createSignedUrl()` (service role, no user JWT needed for signing). There are no DB queries in `StorageService`.

### RLS Setup
Bucket policies live in `supabase/migrations/storage_rls_policies.sql` — **must be applied manually in the Supabase SQL Editor** when setting up a new environment. Without them, storage bucket access is unrestricted.

Both buckets are **private** (`public = false`).

**INSERT / UPDATE / DELETE** — use `clientForUser(jwt)`, so Supabase evaluates RLS with the user's identity. These policies are a **genuine second layer**: even if the application-level path check (`path.startsWith(`${userId}/`)`) were somehow bypassed, Supabase would still reject the operation if the path folder doesn't match `auth.uid()`.

**SELECT** — reads never go through `clientForUser`. Signed URL generation uses `supabaseAdmin` (service role), which bypasses RLS entirely. The SELECT RLS policy is therefore **defense-in-depth only** for this architecture:
- Signed URL security is enforced solely at the application layer (`getSignedUrl()` is only called after an ownership-verified DB lookup or a server-computed path).
- The frontend exposes no Supabase credentials (`VITE_API_URL` only), so direct client-side storage reads are not possible in practice.
- The SELECT policy guards against out-of-band access (someone using the Supabase URL + anon key manually, or a future frontend change that introduces a Supabase client).

---

## Module 5 — AI Analyzer

### Endpoints
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/ai/analyze-cv` | 🔒 JWT | Parse PDF CV, return prefilled site data |

### Input
- `multipart/form-data`
- Field name: `file`
- Accepted type: `application/pdf`
- Max size: **5MB**

### Processing Order
1. File size check → `400` if exceeded
2. Per-user cooldown check (30s) → `429` if too soon
3. Send buffer to Azure AI (GPT-4.1-mini)
4. Return structured JSON

### Output
Returns a partial `CreateSiteDto` — only fields the AI model could extract from the CV:
```json
{
  "data": {
    "fullName": "Kamil Pawlak",
    "jobTitle": "Software Engineer",
    "location": "Rzeszów, Poland",
    "bio": "...",
    "contacts": {
      "email": "kontakt@example.com",
      "linkedin": "https://linkedin.com/in/kamilpawlak-com",
      "github": "https://github.com/kamilpawlak-com"
    },
    "skills": ["React", "NestJS", "TypeScript"],
    "experience": [
      {
        "company": "Example Corp",
        "role": "Frontend Developer",
        "startDate": "2022-01",
        "endDate": "2024-06",
        "description": "..."
      }
    ],
    "education": [
      {
        "institution": "WSIiZ Rzeszów",
        "degree": "Bachelor of Computer Science",
        "startDate": "2023-10",
        "endDate": "2027-06"
      }
    ]
  },
  "message": "CV analyzed successfully"
}
```

---

## Module 6 — Generator

### Endpoints
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/generator/zip/:siteId` | 🔒 JWT | Download portfolio as static ZIP |
| GET | `/generator/preview/:siteId` | 🔒 JWT | Return single self-contained HTML preview |

### ZIP Endpoint
- Verifies ownership → `403` on mismatch
- Generates `index.html`, `style.css`, `script.js` in memory
- Streams ZIP directly to response
- Response headers:
```
Content-Type: application/zip
Content-Disposition: attachment; filename="portfolio-{siteId}.zip"
```

### Generated Static Site Structure
```
portfolio.zip
  index.html    ← full portfolio page, SEO meta tags included
  style.css     ← responsive styles (RWD)
  script.js     ← minimal JS (interactions)
  assets/       ← placeholder, images referenced via Supabase URLs
```

### Live Preview Endpoint
- Verifies ownership → `403` on mismatch
- Generates a **single, self-contained `index.html`** — CSS and JS inlined with `<style>` / `<script>` tags, images referenced via Supabase public URLs
- Served directly in the browser (no download, no ZIP)
- Response headers:
```
Content-Type: text/html; charset=utf-8
```

### Template Design Constraints
- Language: Polish (for now)
- Based on Magic UI Pro portfolio template structure — converted to vanilla HTML/CSS/JS (no React)
- Sections limited to those reflected in the site schema
- No external dependencies (no CDN links, no npm packages)
- Templating engine: Handlebars
- No fade-in/out animations on the page itself
- No collapsible content
- Dark mode via `prefers-color-scheme` media query
- Basic RWD (font sizes, layout)
- Accessibility: WCAG 2.1 AA
- Font: Inter (self-hosted, embedded as base64 data URI in inline/preview mode)

---

---

## Module 7 — GitHub Integration (Optional)

> Dedicated `github/` module. Requires `octokit` dependency and `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` env vars. All endpoints return `501 Not Implemented` if env vars are absent.

### Endpoints
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/github/exchange` | 🔒 JWT | Exchange GitHub OAuth code for access token |
| POST | `/github/deploy/:siteId` | 🔒 JWT | Push generated site to GitHub Pages |

### `POST /github/exchange`
- **Input body:** `{ code: string }` — OAuth authorization code from GitHub redirect
- **Flow:** `POST github.com/login/oauth/access_token` → returns `access_token` → fetch `/user` for username
- **Response:**
  ```json
  {
    "data": {
      "githubToken": "gho_xxxxxxxxxxxxxxxxxxxx",
      "githubUsername": "kamilpawlak"
    },
    "message": "GitHub account connected successfully"
  }
  ```
- **Token handling:** returned to frontend only, **never stored or logged server-side**
- **Errors:** `400` — invalid/expired code; `501` — GitHub not configured

### `POST /github/deploy/:siteId`
- **Input body:** `{ githubToken: string }` — token from `/github/exchange`
- **Repo name:** auto-computed as `<username>.github.io` — not configurable
- **Flow:**
  1. Authenticate with token → fetch GitHub username
  2. Create public repo `<username>.github.io` (or use existing)
  3. Generate all site files in memory via `GeneratorService.generateFiles()`
  4. Push all files via Git Data API (createBlob → createTree → createCommit → updateRef, force)
  5. Enable GitHub Pages (`source: main, path: /`) — skip if already active
- **Response:**
  ```json
  {
    "data": {
      "repoUrl": "https://github.com/kamilpawlak/kamilpawlak.github.io",
      "pagesUrl": "https://kamilpawlak.github.io"
    },
    "message": "Portfolio deployed to GitHub Pages successfully"
  }
  ```
- **Errors:** `401` — invalid token; `403` — wrong owner or missing repo scope; `404` — portfolio not found; `501` — GitHub not configured

### OAuth App Setup
1. Go to [github.com/settings/developers](https://github.com/settings/developers) → **New OAuth App**
2. Set **Authorization callback URL** to `{FRONTEND_URL}/github/callback`
3. Add to `.env`: `GITHUB_CLIENT_ID=...` and `GITHUB_CLIENT_SECRET=...`

### Frontend OAuth Flow
```
1. Redirect user to: https://github.com/login/oauth/authorize?client_id=X&scope=repo&state=<encoded-context>
2. GitHub redirects to: {FRONTEND_URL}/github/callback?code=ABC&state=<encoded-context>
3. Frontend calls POST /github/exchange { code: "ABC" }
4. Frontend stores { githubToken, githubUsername } in memory / sessionStorage
5. On deploy: POST /github/deploy/:siteId { githubToken }
```
