import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."photo_drafts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."photo_drafts" CASCADE;
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_photo_drafts_fk";
  
  DROP INDEX "payload"."payload_locked_documents_rels_photo_drafts_id_idx";
  ALTER TABLE "payload"."products" ADD COLUMN "thumbnail_id" integer;
  ALTER TABLE "payload"."products" ADD CONSTRAINT "products_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "products_thumbnail_idx" ON "payload"."products" USING btree ("thumbnail_id");
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "photo_drafts_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "payload"."photo_drafts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"suggested_name" varchar,
  	"suggested_product_id" integer,
  	"note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_preview_url" varchar,
  	"sizes_preview_width" numeric,
  	"sizes_preview_height" numeric,
  	"sizes_preview_mime_type" varchar,
  	"sizes_preview_filesize" numeric,
  	"sizes_preview_filename" varchar
  );
  
  ALTER TABLE "payload"."products" DROP CONSTRAINT "products_thumbnail_id_media_id_fk";
  
  DROP INDEX "payload"."products_thumbnail_idx";
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "photo_drafts_id" integer;
  ALTER TABLE "payload"."photo_drafts" ADD CONSTRAINT "photo_drafts_suggested_product_id_products_id_fk" FOREIGN KEY ("suggested_product_id") REFERENCES "payload"."products"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "photo_drafts_suggested_product_idx" ON "payload"."photo_drafts" USING btree ("suggested_product_id");
  CREATE INDEX "photo_drafts_updated_at_idx" ON "payload"."photo_drafts" USING btree ("updated_at");
  CREATE INDEX "photo_drafts_created_at_idx" ON "payload"."photo_drafts" USING btree ("created_at");
  CREATE UNIQUE INDEX "photo_drafts_filename_idx" ON "payload"."photo_drafts" USING btree ("filename");
  CREATE INDEX "photo_drafts_sizes_preview_sizes_preview_filename_idx" ON "payload"."photo_drafts" USING btree ("sizes_preview_filename");
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_photo_drafts_fk" FOREIGN KEY ("photo_drafts_id") REFERENCES "payload"."photo_drafts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_photo_drafts_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("photo_drafts_id");
  ALTER TABLE "payload"."products" DROP COLUMN "thumbnail_id";`)
}
