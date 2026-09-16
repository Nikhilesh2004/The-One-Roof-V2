# Moving The One Roof onto the VPS

Target: Hostinger KVM 4 (4 vCPU / 16 GB / 200 GB / 16 TB) running Coolify.
Leaving behind: Vercel (hosting, image optimisation) and Supabase (Postgres,
storage). After this the shop depends on one box and its backups.

**Setup and cutover are different jobs.** Everything up to step 7 can be done
while the live site carries on serving from Vercel, untouched. Only step 8
moves customers. Do not run step 8 tired.

---

## 1. Coolify

    curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

Dashboard on `:8000`. Create the admin account immediately — an unclaimed
Coolify is an open door. Then firewall: allow 22, 80, 443, and 8000 only from
your own IP.

## 2. Postgres

Add a PostgreSQL service in Coolify. Note the internal hostname it gives the
container (usually the service name) — the app reaches it over Coolify's
internal network, so it never needs a public port.

## 3. Bring the database across

Run this **on the VPS**, not on a laptop: it is datacenter to datacenter, and
the dump never touches a home connection.

Supabase's session pooler is port **5432** (6543 is transaction mode and is
wrong for a dump). Take only the `payload` schema — the v1 site's tables live
in `public` and are not wanted.

    docker exec -i <postgres-container> pg_dump \
      "postgresql://postgres.<ref>:<password>@aws-0-ap-south-1.pooler.supabase.com:5432/postgres" \
      --schema=payload --no-owner --no-acl -Fc > /tmp/payload.dump

    docker exec -i <postgres-container> pg_restore \
      -d "postgresql://<user>:<pass>@localhost:5432/<db>" \
      --no-owner --no-acl /tmp/payload.dump

Check it landed:

    select count(*) from payload.products;

34 products at the time of writing.

## 4. Bring the photos across

176 MB, flat filenames, same bucket. Again from the VPS:

    apt install -y awscli
    aws configure set aws_access_key_id <S3_ACCESS_KEY_ID>
    aws configure set aws_secret_access_key <S3_SECRET_ACCESS_KEY>
    aws --endpoint-url https://<ref>.storage.supabase.co/storage/v1/s3 \
        --region ap-south-1 \
        s3 sync s3://media /var/lib/theoneroof/media

**Filenames must survive exactly.** Every product row references its photo by
name; rename anything and the shop loses its photography.

The old `photo-drafts` files may be in there too. Harmless clutter — that
feature is gone. Delete them later, not during a migration.

## 5. Deploy the app

New Coolify application, source = `github.com/Nikhilesh2004/The-One-Roof-V2`,
build pack = **Dockerfile**, port **3000**.

Persistent volume: host `/var/lib/theoneroof/media` -> container `/app/media`.

Environment:

    DATABASE_URL=postgresql://<user>:<pass>@<postgres-container>:5432/<db>
    PAYLOAD_SECRET=<the same value as now — changing it invalidates sessions>
    NEXT_PUBLIC_SITE_URL=https://theoneroof.co
    MEDIA_DIR=/app/media

**Do not set any `S3_*` variable.** Their absence is what makes Payload fall
back to local disk (`hasObjectStore` in payload.config.ts). Set one by accident
and uploads go back to Supabase.

`DATABASE_SESSION_MODE` and `DATABASE_POOL_MAX` are Supabase pooler
workarounds. `connectionString()` leaves non-Supabase hosts untouched, so they
do nothing here and can be dropped.

Migrations run at container start, not during the build — see the Dockerfile.

## 6. Turn the image optimiser back on

`next.config.ts` carries `images: { unoptimized: true }`, added on 2026-09-17
when Vercel's 5,000/month transformation cap blanked every photo. The VPS runs
`sharp` itself with no quota, so **remove that line once the site serves from
here** and the photos go back to being resized and served as WebP per device.

## 7. Verify on Coolify's temporary URL

Before any DNS changes:

- Product grid renders, photos load
- A product page gallery works, thumbnails included
- `/admin` logs in, and an upload writes to the volume
- Restart the container and confirm the upload survived — this is the one that
  catches a misconfigured volume, and it is the one people skip

## 8. Cutover — a separate sitting

1. Lower the DNS TTL to 300s and wait for the old TTL to expire first.
2. Point the A record at the VPS. DNS currently lives in **Vercel's**
   nameservers, not at the registrar.
3. Coolify requests the Let's Encrypt certificate automatically once the domain
   resolves.
4. Leave Vercel and Supabase running, untouched, for a week.

## 9. Backups — before you call this done

Coolify schedules Postgres backups; send them **off the box**. Back up the
media volume too, it is the bulk of the data.

Then restore one, into a scratch database, and look at it. An untested backup
is not a backup, and this is now a single machine with no managed failover.

**Do not delete the Supabase project until the VPS has run clean for seven days
and a restore has actually been performed.**
