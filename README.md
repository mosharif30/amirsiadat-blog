# Amir Siadat — blog

Personal site of film critic Amir Siadat: articles, reviews and "Brief Encounter" notes.

A self-contained Next.js app with its own SQLite database, image storage and admin dashboard,
deployed on [Fly.io](https://fly.io). The site's posts, categories and images ship with the repo as
seed data (`prisma/seed-data/`), so a fresh install starts with the full site.

| | |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Components, Server Actions), React 19, TypeScript |
| Styling | Tailwind CSS 3.4 + Sass |
| Database | Prisma 7 + SQLite (switchable to PostgreSQL) |
| Content | Markdown (GFM) with sanitized inline HTML |
| Auth | Email/password, scrypt hashes, signed `httpOnly` JWT session cookie |
| Media | Local disk storage behind a pluggable `StorageAdapter` |

## Quick start

Requires Node.js 22.12 or newer.

```bash
npm install                # also generates the Prisma client
cp .env.example .env       # then set AUTH_SECRET (command in the file)
npm run setup              # create the SQLite database and load the site content
npm run dev
```

- Site: http://localhost:3000
- Dashboard: http://localhost:3000/admin

### Default admin credentials

The seed creates the admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`:

| Email | Password |
| --- | --- |
| `admin@example.com` | `change-me-now` |

**Change the password immediately** (Dashboard → Account). In production (`NODE_ENV=production`) the
seed won't create an admin unless `ADMIN_PASSWORD` is set explicitly. You can also create an admin
or reset a password at any time:

```bash
npm run admin:create -- --email you@example.com            # prompts for the password
npm run admin:create -- --email you@example.com --password "…" --name "Amir"
```

Resetting a password signs that user out everywhere.

## Environment variables

See [`.env.example`](.env.example).

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `file:./data/blog.db` | SQLite file (relative to the project root) or a PostgreSQL URL |
| `AUTH_SECRET` | — (required) | ≥ 32 random characters used to sign session cookies |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | see above | Initial admin created by the seed |
| `SITE_URL` | `http://localhost:3000` | Public URL for canonical links, OpenGraph, sitemap and RSS |
| `SITE_TIMEZONE` | `UTC` | Time zone used to print post dates |
| `STORAGE_DRIVER` | `local` | Upload storage backend |
| `UPLOAD_DIR` | `./storage/uploads` | Where the local driver keeps files (served at `/uploads/*`) |
| `MAX_UPLOAD_MB` | `10` | Upload size limit |
| `INSECURE_COOKIES` | — | Set to `true` only to test a production build over plain `http://` |

## Scripts

| Command | |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` (after generating route types) |
| `npm test` | Vitest unit tests |
| `npm run setup` | Apply migrations and seed |
| `npm run db:migrate` | Create/apply a migration after editing `prisma/schema.prisma` |
| `npm run db:seed` | Load the site content into an **empty** database (skipped once the site has content) and create the admin if missing. Safe to re-run |
| `npm run db:reset` | Drop the database and re-seed (destroys data) |
| `npm run admin:create` | Create an admin / reset a password |

## Admin dashboard (`/admin`)

- **Posts**: list with instant search and Draft/Published filter; one-click publish/unpublish and delete.
- **Editor**: a Word-like visual editor (TipTap). Text appears formatted as it will on the site, with
  no Markdown symbols. A sticky toolbar offers undo/redo, H2/H3, bold, italic, strikethrough,
  bulleted and numbered lists, quote, divider, link and image, plus alt text for a selected image.
  Shortcuts: Ctrl/Cmd+B, Ctrl+I, Ctrl+Shift+S (strikethrough), Ctrl+K (insert or edit a link),
  Ctrl+Z / Ctrl+Shift+Z, Ctrl+S (save). Images can be inserted from the media library or uploaded
  by button, paste or drag-and-drop. A **Markdown** tab shows the underlying source for advanced
  edits. Also: slug generated from the title (editable, with "From title" to regenerate),
  excerpt, categories, cover image, featured flag, publish date
  (a future date schedules the post), SEO title and description, live word count and reading time,
  and an unsaved-changes warning. Publishing requires an excerpt, a cover image and a category,
  because the public cards always show them.
- **Media**: upload (multiple, drag-and-drop), browse, filter, edit alt text, copy URL or Markdown,
  delete. Images still used by a post can't be deleted.
- **Categories**: create, rename, change slug, reorder the sidebar, delete empty categories.
- **Account**: change password (signs out other sessions).

### How content is stored

Posts are stored as [GitHub-flavoured Markdown](https://github.github.com/gfm/); the visual editor
converts on the fly, and the database schema didn't change:

- **Loading:** Markdown goes through the same parse and sanitize steps as the public renderer
  (`lib/markdown/to-editor-html.ts`), then into TipTap.
- **Saving:** the editor's document is serialized back to Markdown (`lib/markdown/prosemirror.ts`
  → `lib/markdown/serialize.ts`).

Opening a post and saving without changes leaves its Markdown byte-for-byte identical. The tests
check this for every post in the seed data (`tests/editor-roundtrip.test.ts`).

An image on its own line is a full-width block image. Footnotes use the
`endrefN` / `endrefNp` link convention: a link to `endref1` in the text and one to `endref1p` in
the notes link to each other. You can create them from the link dialog too.

Inline HTML is allowed and sanitized. The serializer emits it only where Markdown can't express
the formatting exactly: `<p></p>` (spacing after images, shown as an empty line in the editor),
`<br>` at the start or end of a paragraph, and `<i>`/`<strong>`/`<del>` around formatted text that
starts or ends with a space.

Post styles live in `components/post-styles.ts` and are shared by the public renderer and the
editor, so the editor looks like the published page.

## Public features

Beyond the pages themselves:

- Per-page metadata: titles, descriptions, canonical URLs, OpenGraph and Twitter cards (with the
  cover image and reading time), and `BlogPosting` JSON-LD on posts.
- `/sitemap.xml`, `/robots.txt` and an RSS feed at `/feed.xml` (advertised in `<head>`).
- Reading time and word count, computed on save (used in metadata, feed and dashboard).
- Search (`/searchResult?searched=…`) runs in the database over title, excerpt, category and the
  full post text. Every word must match; title matches rank first.
- Content is rendered on the server (no client-side fetching or loading flashes), unknown posts or
  categories return 404, and future-dated posts stay hidden until their date.

## Project layout

```
app/
  (site)/            public pages: /, /post/[slug], /category/[slug], /searchResult, /about, /curriculum-vitae
  admin/             dashboard (login, posts, editor, media, categories, account) + server actions in _actions/
  api/admin/media/   image upload endpoint
  api/health/        health check (used by Fly.io)
  uploads/[...path]/ serves uploaded files
  feed.xml/, sitemap.ts, robots.ts
components/          public components, post-styles.ts, admin/* (admin/editor: visual editor)
lib/                 db client, queries, auth, storage, markdown/ (editor ↔ Markdown conversion), helpers
prisma/              schema, migrations, seed.ts, seed-data/ (site content + images)
proxy.ts             early redirect for unauthenticated /admin requests
scripts/             create-admin, container entrypoint (docker-start.sh)
tests/               Vitest
```

Every admin page, server action and API route checks the session against the database. `proxy.ts`
is only a first line of defence. Sessions are revoked by bumping `User.sessionVersion`. Logins are
rate limited per IP and email.

## Uploads and storage

The `local` driver writes to `UPLOAD_DIR` and `app/uploads/[...path]/route.ts` serves the files with
long-lived cache headers. Files are not put in `public/`, because Next.js only serves files that
existed at build time. Uploads are validated by their content: only JPEG, PNG, GIF, WebP and AVIF
are accepted, and SVG is rejected. Width and height are recorded and used in `<img>` tags to
avoid layout shift.

To use S3, R2, Cloudinary or Supabase Storage, implement `StorageAdapter` (`put`, `delete`, `url`)
in `lib/storage/` and return it from `getStorage()` for a new `STORAGE_DRIVER` value. Stored URLs
are absolute in that case, and the rest of the app doesn't change.

## Switching to PostgreSQL

1. `npm install @prisma/adapter-pg`
2. In `prisma/schema.prisma` set `provider = "postgresql"`.
3. In `lib/db.ts` replace `PrismaBetterSqlite3` with `new PrismaPg({ connectionString: process.env.DATABASE_URL })`.
4. Set `DATABASE_URL=postgresql://…`, delete `prisma/migrations/` (SQLite-specific) and run
   `npm run db:migrate -- --name init` and `npm run db:seed`.
5. Optional: on PostgreSQL, add `mode: "insensitive"` to the `contains` filters in
   `lib/posts.ts` → `searchPosts` for case-insensitive search beyond ASCII.

## Deploying to Fly.io

The app runs as a single Fly Machine with a Fly Volume mounted at `/app/data`, which holds the
SQLite database and uploaded images. `fly.toml` sets the non-secret environment, the volume mount,
port routing (the app listens on 3000; Fly serves HTTP/HTTPS on 80/443 with HTTPS forced) and a
health check on `/api/health`.

On every start the container (`Dockerfile` → `scripts/docker-start.sh`):

1. takes ownership of the volume and drops root privileges,
2. applies pending migrations (`prisma migrate deploy`),
3. runs the seed. It loads the site content only if the database is empty and creates the admin
   from `ADMIN_EMAIL` / `ADMIN_PASSWORD` only if that account doesn't exist. Existing data is
   never overwritten, and deleted posts or images are not restored,
4. starts Next.js.

Migrations run at startup rather than as a Fly `release_command`, because release machines don't
have access to volumes.

> **Run exactly one machine.** A volume attaches to a single machine and SQLite has a single
> writer, so always deploy with `--ha=false` and never scale above 1.

### First launch

```bash
# 1. Install flyctl and sign in
curl -L https://fly.io/install.sh | sh
fly auth login

# 2. Create the app. The name must be globally unique: if "amirsiadat-blog" is taken, pick another
#    and update `app` and `SITE_URL` in fly.toml.
fly apps create amirsiadat-blog

# 3. Create the volume (same name and region as in fly.toml)
fly volumes create blog_data --app amirsiadat-blog --region fra --size 1 --yes

# 4. Set the secrets
fly secrets set --app amirsiadat-blog --stage \
  AUTH_SECRET="$(openssl rand -base64 48)" \
  ADMIN_EMAIL="you@example.com" \
  ADMIN_PASSWORD="a-long-unique-password"

# 5. Build and deploy (single machine)
fly deploy --ha=false

# 6. Check it
fly status
fly logs
fly apps open
```

Then sign in at `/admin`, change the password under **Account**, and remove the bootstrap password
from the secrets: `fly secrets unset ADMIN_PASSWORD` (the account stays).

### Later deploys

```bash
fly deploy --ha=false
```

### Custom domain

```bash
fly certs add example.com          # then create the DNS records it prints
```

Set `SITE_URL = "https://example.com"` in `fly.toml` and redeploy: canonical URLs, the sitemap
and the RSS feed use it.

### Operations

```bash
fly ssh console                                   # shell in the running machine (/app)
#   su-exec nextjs npm run admin:create -- --email you@example.com   # create admin / reset password
fly volumes list                                  # volume and daily snapshots
fly volumes snapshots list <volume-id>
fly ssh sftp get /app/data/blog.db ./blog-backup.db   # download the database
fly scale memory 1024                             # more memory if needed
```

Run commands that write to `/app/data` as `nextjs` (`su-exec nextjs …`), so the files keep the
right owner.

### Other hosts

The same image runs anywhere Docker does. Mount a volume at `/app/data`:

```bash
docker build -t amirsiadat-blog .
docker run -p 3000:3000 -v blog-data:/app/data \
  -e AUTH_SECRET=… -e SITE_URL=http://localhost:3000 -e ADMIN_EMAIL=… -e ADMIN_PASSWORD=… amirsiadat-blog
```

Without Docker: `npm ci && npm run build && npm run setup && npm start`, with the environment
variables above.
