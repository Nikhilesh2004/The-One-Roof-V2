import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."settings" ALTER COLUMN "agency_credit" SET DEFAULT 'Made by';
  ALTER TABLE "payload"."settings" ADD COLUMN "maintainer_credit" varchar DEFAULT 'Maintained by';
  ALTER TABLE "payload"."settings" ADD COLUMN "maintainer_name" varchar DEFAULT 'AALI CONSSULTANCY';
  ALTER TABLE "payload"."settings" ADD COLUMN "maintainer_url" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."settings" ALTER COLUMN "agency_credit" SET DEFAULT 'Designed & maintained by';
  ALTER TABLE "payload"."settings" DROP COLUMN "maintainer_credit";
  ALTER TABLE "payload"."settings" DROP COLUMN "maintainer_name";
  ALTER TABLE "payload"."settings" DROP COLUMN "maintainer_url";`)
}
