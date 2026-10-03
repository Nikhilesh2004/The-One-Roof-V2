import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * The shop quotes no delivery charge on the site any more: no flat fee and
 * no "free delivery over ₹999". The two settings go, and the strip across
 * the top is cleared if it still carries the old free-delivery line, so
 * nobody has to remember to blank it by hand after the deploy.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   UPDATE "payload"."settings" SET "announcement" = NULL WHERE "announcement" ILIKE '%free delivery%';
  ALTER TABLE "payload"."settings" ALTER COLUMN "announcement" DROP DEFAULT;
  ALTER TABLE "payload"."settings" DROP COLUMN IF EXISTS "delivery_fee";
  ALTER TABLE "payload"."settings" DROP COLUMN IF EXISTS "free_delivery_over";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."settings" ALTER COLUMN "announcement" SET DEFAULT 'Free delivery over ₹999';
  ALTER TABLE "payload"."settings" ADD COLUMN IF NOT EXISTS "delivery_fee" numeric DEFAULT 59;
  ALTER TABLE "payload"."settings" ADD COLUMN IF NOT EXISTS "free_delivery_over" numeric DEFAULT 999;`)
}
