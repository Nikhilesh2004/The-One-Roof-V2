import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."settings" ADD COLUMN "gstin" varchar;
  ALTER TABLE "payload"."settings" ADD COLUMN "grievance_name" varchar;
  ALTER TABLE "payload"."settings" ADD COLUMN "grievance_email" varchar;
  ALTER TABLE "payload"."settings" ADD COLUMN "grievance_phone" varchar;
  ALTER TABLE "payload"."settings" ADD COLUMN "grievance_note" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."settings" DROP COLUMN "gstin";
  ALTER TABLE "payload"."settings" DROP COLUMN "grievance_name";
  ALTER TABLE "payload"."settings" DROP COLUMN "grievance_email";
  ALTER TABLE "payload"."settings" DROP COLUMN "grievance_phone";
  ALTER TABLE "payload"."settings" DROP COLUMN "grievance_note";`)
}
