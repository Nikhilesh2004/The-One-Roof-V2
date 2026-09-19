import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "payload"."videos" (
  	"id" serial PRIMARY KEY NOT NULL,
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
  	"focal_y" numeric
  );
  
  ALTER TABLE "payload"."products" ADD COLUMN "video_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "videos_id" integer;
  CREATE INDEX "videos_updated_at_idx" ON "payload"."videos" USING btree ("updated_at");
  CREATE INDEX "videos_created_at_idx" ON "payload"."videos" USING btree ("created_at");
  CREATE UNIQUE INDEX "videos_filename_idx" ON "payload"."videos" USING btree ("filename");
  ALTER TABLE "payload"."products" ADD CONSTRAINT "products_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "payload"."videos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_videos_fk" FOREIGN KEY ("videos_id") REFERENCES "payload"."videos"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_video_idx" ON "payload"."products" USING btree ("video_id");
  CREATE INDEX "payload_locked_documents_rels_videos_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("videos_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."products" DROP CONSTRAINT IF EXISTS "products_video_id_videos_id_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_videos_fk";
  
  DROP INDEX IF EXISTS "payload"."products_video_idx";
  DROP INDEX IF EXISTS "payload"."payload_locked_documents_rels_videos_id_idx";
  ALTER TABLE "payload"."products" DROP COLUMN "video_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "videos_id";
  DROP TABLE "payload"."videos" CASCADE;`)
}
