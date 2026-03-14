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
| PUT | `/auth/change-password` | 🔒 JWT | Update password |

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
| GET | `/sites` | 🔒 JWT | Get all portfolios for current user |
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
avatarUrl: string    // Supabase Storage public URL
contacts: json       // { email?, phone?, linkedin?, github?, website? }
skills: string[]
experience: json[]   // [{ company, role, startDate, endDate, description }]
education: json[]    // [{ institution, degree, startDate, endDate }]
projects: json[]     // [{ name, description, url, imageUrl }]
achievements: json[] // [{ title, description }]
createdAt: timestamp
updatedAt: timestamp
```

### DTOs

**CreateSiteDto / UpdateSiteDto**
```ts
fullName?: string
jobTitle?: string
location?: string
bio?: string
avatarUrl?: string
contacts?: object      // needs @ValidateNested() in implementation
skills?: string[]
experience?: object[]  // needs @ValidateNested() in implementation
education?: object[]   // needs @ValidateNested() in implementation
projects?: object[]    // needs @ValidateNested() in implementation
achievements?: object[]// needs @ValidateNested() in implementation
```

---

## Module 4 — Storage

### Endpoints
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/storage/upload` | 🔒 JWT | Upload image, return `{ url, fileId }` |
| DELETE | `/storage/:fileId` | 🔒 JWT | Delete image from Supabase Storage |

### Notes
- Accepted MIME types: `image/jpeg`, `image/png`, `image/webp`
- Max file size: **5MB**
- Files stored under `userId/filename` path in Supabase Storage bucket
- `fileId` = the Supabase Storage path (`userId/filename`), returned by the upload endpoint

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
| POST | `/generator/github/:siteId` | 🔒 JWT | Push static site to GitHub Pages (optional) |

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
  script.js     ← minimal JS (smooth scroll, interactions)
  assets/       ← placeholder, images referenced via Supabase URLs
```

### GitHub Endpoint (Optional)
- Input: `{ repoName, githubToken }` in request body
  - `repoName`: just the repo name (e.g. `my-portfolio`), not `username/repo`
  - `githubToken`: used in-request only, **never stored or logged**
- Uses `octokit` to push generated files to a GitHub repo
- Enables GitHub Pages hosting
