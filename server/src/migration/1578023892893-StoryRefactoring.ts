import type { MigrationInterface, QueryRunner } from 'typeorm';

export class StoryRefactoring1578023892893 implements MigrationInterface {
  name = 'StoryRefactoring1578023892893';

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TABLE "temporary_story" ("id" varchar PRIMARY KEY NOT NULL, "editId" varchar NOT NULL, "content" varchar NOT NULL, "description" varchar(300), "postcard" varchar, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "viewsCount" integer NOT NULL DEFAULT (0), "isPublic" boolean NOT NULL DEFAULT (0), CONSTRAINT "UQ_3c13ed4c9bdc15e0c950536ab99" UNIQUE ("id", "editId"))`,
      undefined,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_story"("id", "editId", "content", "description", "postcard", "createdAt", "updatedAt", "viewsCount") SELECT "id", "editId", "content", "description", "postcard", "createdAt", "updatedAt", "viewsCount" FROM "story"`,
      undefined,
    );
    await queryRunner.query(`DROP TABLE "story"`, undefined);
    await queryRunner.query(
      `ALTER TABLE "temporary_story" RENAME TO "story"`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "story" RENAME TO "temporary_story"`,
      undefined,
    );
    await queryRunner.query(
      `CREATE TABLE "story" ("id" varchar PRIMARY KEY NOT NULL, "editId" varchar NOT NULL, "content" varchar NOT NULL, "description" varchar(300), "postcard" varchar, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "viewsCount" integer NOT NULL DEFAULT (0), CONSTRAINT "UQ_3c13ed4c9bdc15e0c950536ab99" UNIQUE ("id", "editId"))`,
      undefined,
    );
    await queryRunner.query(
      `INSERT INTO "story"("id", "editId", "content", "description", "postcard", "createdAt", "updatedAt", "viewsCount") SELECT "id", "editId", "content", "description", "postcard", "createdAt", "updatedAt", "viewsCount" FROM "temporary_story"`,
      undefined,
    );
    await queryRunner.query(`DROP TABLE "temporary_story"`, undefined);
  }
}
