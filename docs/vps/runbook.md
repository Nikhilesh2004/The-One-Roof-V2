# Moving The One Roof onto the VPS

Target: Hostinger KVM 4 running Coolify. Leaving behind: Vercel and Supabase.

The shop is **re-imported, not copied**. The live catalogue was exported into
the bulk-upload spreadsheet (`npm run export:catalogue`), and it goes back in
through the CMS's own Bulk upload page — the same one the photo team will use.
So there is no database dump, no restore, and no photo sync.

**Setup and cutover are separate.** Everything before step 8 happens while the
live site keeps running on Vercel, untouched. Only step 8 moves customers.

---

## Already done

- Coolify installed and claimed, server type "This machine"
- PostgreSQL 17 running as `theoneroof-db`, database `theoneroof`, SSL off,
  access Private

## 1. Create the app

Coolify → The One Roof project → **+ New** → **Public Repository**

- Repository: `https://github.com/Nikhilesh2004/The-One-Roof-V2`
- Branch: `main`
- Build pack: **Dockerfile** (not Nixpacks, not Docker Compose)
- Port: **3000**

## 2. Two settings

Environment Variables, both as normal (runtime) variables:

    DATABASE_URL=<the database's "Postgres URL (internal)", copied from its page>
    PAYLOAD_SECRET=<a long random string>

**Do not add any `S3_*` variable.** Their absence is what makes uploads go to
the server's own disk instead of Supabase.

Not needed:

- `NEXT_PUBLIC_SITE_URL` — every use defaults to `https://theoneroof.co`
- `MEDIA_DIR` — already set to `/app/media` in the Dockerfile
- `DATABASE_SESSION_MODE`, `DATABASE_POOL_MAX` — Supabase workarounds; the code
  ignores them for any other database

## 3. Photo storage

App → **Persistent Storage** → add a volume mounted at **`/app/media`**.

Without this, every redeploy deletes every photo.

## 4. Deploy

First build takes several minutes. It does **not** need the database — pages
render when visited, not at build time. When the container starts it runs
`payload migrate`, which creates every table in the empty database.

## 5. First login

Open the app's temporary Coolify URL, then `/admin`. On an empty database
Payload shows **Create first user** — that becomes the admin account.

## 6. Sections, policies, settings

Coolify → Terminal → the **app** container (not the database):

    npm run seed:site-content

Loads the 8 sections, 5 policy pages and the shop settings from
`scripts/data/site-content.json`. **Must run before step 7** — the bulk upload
checks every row's section against the sections that exist.

## 7. Products

`/admin/bulk-upload`:

1. The spreadsheet: `theoneroof-products.xlsx` from the export folder
2. The images: the export's `photos` folder, all 79
3. Check: expect **34 ready, 0 with problems, 34 new, 79 images to upload**
4. Import

Then check the site on the temporary URL: grid, a product page, the Shorts
rail. Restart the app container and check a photo still loads — that proves
the volume from step 3 works.

## 8. Cutover — a separate sitting

Change only the **A record** for `theoneroof.co` to the VPS IP, in Vercel's DNS
panel. Do not move nameservers: an A record can be switched back in minutes, a
nameserver change takes hours in both directions.

Then add `theoneroof.co` (and `www.theoneroof.co`) as the app's domains in
Coolify; it gets the Let's Encrypt certificate itself once DNS resolves.

## 9. After cutover

- Remove `unoptimized: true` from `next.config.ts` and redeploy. It was only
  there because Vercel's image quota ran out; the VPS runs `sharp` with no
  quota, so photos go back to being resized and served as WebP.
- Hostinger's daily backups cover the whole machine. Add a Coolify scheduled
  backup of the database too, so a single table can be restored without
  rolling back the entire server.
- Leave Vercel and Supabase running, untouched, for a week. Then delete them.
