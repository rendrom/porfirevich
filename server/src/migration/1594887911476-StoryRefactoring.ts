import type { MigrationInterface, QueryRunner } from 'typeorm';

export class StoryRefactoring1594887911476 implements MigrationInterface {
  name = 'StoryRefactoring1594887911476';

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "isBanned" boolean NOT NULL DEFAULT (0)`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `DROP INDEX "IDX_9e3516cf97a57b6f6199fa95a8"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "user" RENAME TO "temporary_user"`,
      undefined,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "uid" varchar, "username" varchar NOT NULL, "password" varchar NOT NULL, "email" varchar, "isSuperuser" boolean NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "provider" varchar NOT NULL DEFAULT ('porfirevich'), "photoUrl" varchar)`,
      undefined,
    );
    await queryRunner.query(
      `INSERT INTO "user"("id", "uid", "username", "password", "email", "isSuperuser", "createdAt", "updatedAt", "provider", "photoUrl") SELECT "id", "uid", "username", "password", "email", "isSuperuser", "createdAt", "updatedAt", "provider", "photoUrl" FROM "temporary_user"`,
      undefined,
    );
    await queryRunner.query(`DROP TABLE "temporary_user"`, undefined);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_9e3516cf97a57b6f6199fa95a8" ON "user" ("email") WHERE email IS NOT NULL`,
      undefined,
    );
  }
}
