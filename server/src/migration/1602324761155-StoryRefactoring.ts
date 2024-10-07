import type { MigrationInterface, QueryRunner } from 'typeorm';

export class StoryRefactoring1602324761155 implements MigrationInterface {
  name = 'StoryRefactoring1602324761155';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "temporary_violation" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "userId" integer, "storyId" varchar, "comment" varchar, CONSTRAINT "FK_5821d7dcc3157f031a2beb00f64" FOREIGN KEY ("storyId") REFERENCES "story" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_d1203c933fe7956ba747055be68" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_violation"("id", "userId", "storyId", "comment") SELECT "id", "userId", "storyId", "comment" FROM "violation"`,
    );
    await queryRunner.query(`DROP TABLE "violation"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_violation" RENAME TO "violation"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "violation" RENAME TO "temporary_violation"`,
    );
    await queryRunner.query(
      `CREATE TABLE "violation" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "userId" integer, "storyId" varchar, "comment" varchar(300), CONSTRAINT "FK_5821d7dcc3157f031a2beb00f64" FOREIGN KEY ("storyId") REFERENCES "story" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_d1203c933fe7956ba747055be68" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "violation"("id", "userId", "storyId", "comment") SELECT "id", "userId", "storyId", "comment" FROM "temporary_violation"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_violation"`);
  }
}
