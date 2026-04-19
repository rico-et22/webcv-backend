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
avatarUrl: string            // Supabase Storage public URL
avatarStoragePath: string    // Supabase Storage path, used for deletion
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
avatarUrl?: string
createdAt: string
updatedAt: string
```

**CreateSiteDto** — `fullName` required, all other fields optional. **UpdateSiteDto** = `PartialType(CreateSiteDto)` (all fields optional).
```ts
fullName: string          // required
jobTitle?: string
location?: string
bio?: string
avatarUrl?: string            // @IsUrl
avatarStoragePath?: string    // returned by POST /storage/avatar/:siteId
contacts?: ContactDto     // { email?, phone?, linkedin?, github?, website? }
skills?: string[]
experience?: ExperienceDto[]  // { company, role, startDate, endDate?, description? }
education?: EducationDto[]    // { institution, degree, startDate, endDate? }
projects?: ProjectDto[]       // { name, description?, url?, imageUrl?, imageStoragePath? }
achievements?: AchievementDto[] // { title, description? }
```

---

## Module 4 — Storage

### Endpoints
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/storage/avatar/:siteId` | 🔒 JWT | Upload or replace the avatar for a portfolio site (ownership verified) |
| POST | `/storage/screenshot/:siteId` | 🔒 JWT | Upload a screenshot for a portfolio site (ownership verified) |
| DELETE | `/storage/file` | 🔒 JWT | Delete a file by `{ bucket, path }` |

### Notes
- Accepted MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- Max file size: **50 MB** (enforced in code)
- Buckets: `avatars` (avatar per site), `screenshots` (project images per site)
- Upload responses return `{ url, storagePath }` — store `storagePath` on the resource (e.g. `projects[].imageStoragePath`) to enable future deletion
- Avatar path is deterministic: `{userId}/{siteId}/avatar.{ext}` (upsert)
- Screenshot path includes timestamp: `{userId}/{siteId}/{timestamp}.{ext}`

### Supabase Client Usage
Storage calls use a **per-request client** scoped to the user's JWT (`clientForUser(jwt)`) so that Supabase Storage RLS bucket policies are enforced natively. DB queries within StorageService (e.g. ownership check on `sites`) use `supabaseAdmin`.

### RLS Setup
Bucket policies live in `supabase/migrations/storage_rls_policies.sql` — **must be applied manually in the Supabase SQL Editor** when setting up a new environment. Without them, storage bucket access is unrestricted.

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
3. Send buffer to Gemini API
4. Return structured JSON

### Output
Returns a partial `CreateSiteDto` — only fields Gemini could extract from the CV:
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

## Module 6 Extension — GitHub Integration (Optional)

> Extends the Generator module. Requires `octokit` dependency. Not part of the core Generator implementation.

### Endpoint
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/generator/github/:siteId` | 🔒 JWT | Push generated static site to GitHub Pages |

### Notes
- Input body: `{ repoName, githubToken }`
  - `repoName`: just the repo name (e.g. `my-portfolio`), not `username/repo`
  - `githubToken`: used in-request only, **never stored or logged**
- Uses `octokit` to push generated files to a GitHub repo
- Enables GitHub Pages hosting
