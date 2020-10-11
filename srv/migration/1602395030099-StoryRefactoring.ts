import { MigrationInterface, QueryRunner } from 'typeorm';

export class StoryRefactoring1602395030099 implements MigrationInterface {
  name = 'StoryRefactoring1602395030099';

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "story" ADD "isBanned" boolean NOT NULL DEFAULT (0)`,
      undefined
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "story" RENAME TO "temporary_story"`);
    await queryRunner.query(
      `CREATE TABLE "story" ("id" varchar PRIMARY KEY NOT NULL, "editId" varchar NOT NULL, "content" varchar NOT NULL, "description" varchar(300), "postcard" varchar, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "viewsCount" integer NOT NULL DEFAULT (0), "isPublic" boolean NOT NULL DEFAULT (0), "userId" integer, "likesCount" integer NOT NULL DEFAULT (0), "isDeleted" boolean NOT NULL DEFAULT (0), CONSTRAINT "UQ_3c13ed4c9bdc15e0c950536ab99" UNIQUE ("id", "editId"), CONSTRAINT "FK_2f8345c3a6d1057ccf612e65a09" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "story"("id", "editId", "content", "description", "postcard", "createdAt", "updatedAt", "viewsCount", "isPublic", "userId", "likesCount", "isDeleted") SELECT "id", "editId", "content", "description", "postcard", "createdAt", "updatedAt", "viewsCount", "isPublic", "userId", "likesCount", "isDeleted" FROM "temporary_story"`
    );
    await queryRunner.query(`DROP TABLE "temporary_story"`);
  }
}
