# webCV Backend

## Purpose
webCV is a REST API backend for a portfolio website generator designed for IT professionals. It is being built as a university "Data Engineering" course deliverable and to be reused in the future as the backend for an engineering thesis.

The core philosophy behind webCV is **user independence** — there is no vendor lock-in, meaning users fully own and control their generated static sites.

## Tech Stack
This application is built with a focus on strict typing, stateless file handling, and solid architecture:

- **Framework:** NestJS (Node.js)
- **Language:** TypeScript (strict mode)
- **Database:** PostgreSQL via Supabase
- **Storage:** Supabase Storage
- **Authentication:** Supabase Auth / JWT
- **AI Integration:** Google Gemini API
- **API Documentation:** `@nestjs/swagger`
- **Validation:** `class-validator` + `class-transformer`
- **File Export:** `archiver` (in-memory ZIP streaming)
- **GitHub Export:** `octokit` (optional)

## Supabase Setup
To run this application properly, you must configure a Supabase project:
1. **Database:** Run the SQL migrations (e.g. from `supabase/migrations/`) via the Supabase CLI or SQL Editor to create the necessary tables (`users`, `sites`).
2. **Storage:** Create two public buckets named `avatars` and `screenshots`. 
3. **RLS Policies:** Apply the storage RLS policies located in `supabase/migrations/storage_rls_policies.sql` in the SQL Editor to ensure proper access control (enforcing user ownership of uploads).

## SMTP Configuration (Resend)
By default, Supabase's built-in email service is heavily rate-limited and shouldn't be used for production. You should configure a custom SMTP provider (e.g., Resend):
1. Create an account on [Resend](https://resend.com) and verify your sending domain.
2. Generate an SMTP API Key.
3. In your Supabase Dashboard, go to **Authentication > Emails > Custom SMTP**.
4. Enable Custom SMTP and fill in your Resend details:
   - **Host:** `smtp.resend.com`
   - **Port:** `465`
   - **Username:** `resend`
   - **Password:** `<your-resend-api-key>`
   - **Sender email:** e.g., `noreply@yourdomain.com`

## Docker Setup
This application is fully containerized using a multi-stage `Dockerfile`. 
To run the application via Docker:
1. Ensure your `.env` file is fully configured.
2. Run the application using Docker Compose:
   ```bash
   docker-compose up --build -d
   ```
This will build the production image and spin up the stateless NestJS API on port `3000`.

## Installation Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd webcv-backend
   ```

2. **Install dependencies**
   This project STRICTLY uses `pnpm` for package management.
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables**
   Copy `.env.example` to `.env` and fill in the required keys:
   ```bash
   cp .env.example .env
   ```
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
   - `JWT_SECRET` (from Supabase dashboard)
   - `PORT` (defaults to 3000)

4. **Run the application**
   ```bash
   # watch mode (development)
   pnpm run start:dev

   # production mode
   pnpm run start:prod
   ```

5. **Access API Documentation**
   Once the application is running, the Swagger API documentation will be available (typically at `/api` or `/swagger`, depending on your bootstrap configuration).

## AI Co-Development
This application was actively co-developed using advanced Agentic AI coding assistants. 
- **AI Models:** Gemini 3.1 Pro, Claude Sonnet/Opus 4.6
- **AI Agents/Environments:** Google Antigravity, Claude Code

## Acknowledgments & Licensing
This project is licensed under the MIT License.

Special thanks to the following open-source resources that inspired or are included in this project:
- **[Inter Font](https://rsms.me/inter/):** Used within the generated web portfolios. Inter is licensed under the SIL Open Font License (OFL).
- **[Magic UI](https://magicui.design/):** The design and aesthetic of the generated portfolios take heavy inspiration from Magic UI's stunning modern templates.
