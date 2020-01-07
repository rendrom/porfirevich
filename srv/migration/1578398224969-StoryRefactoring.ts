import {MigrationInterface, QueryRunner} from "typeorm";

export class StoryRefactoring1578398224969 implements MigrationInterface {
    name = 'StoryRefactoring1578398224969'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "uid" varchar, "username" varchar NOT NULL, "password" varchar NOT NULL, "email" varchar, "isSuperuser" boolean NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "provider" varchar NOT NULL DEFAULT ('porfirevich'), "photoUrl" varchar)`, undefined);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_9e3516cf97a57b6f6199fa95a8" ON "user" ("email") WHERE email IS NOT NULL`, undefined);
        await queryRunner.query(`CREATE TABLE "temporary_story" ("id" varchar PRIMARY KEY NOT NULL, "editId" varchar NOT NULL, "content" varchar NOT NULL, "description" varchar(300), "postcard" varchar, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "viewsCount" integer NOT NULL DEFAULT (0), "isPublic" boolean NOT NULL DEFAULT (0), "userId" integer, "isDeleted" boolean NOT NULL DEFAULT (0), CONSTRAINT "UQ_3c13ed4c9bdc15e0c950536ab99" UNIQUE ("id", "editId"))`, undefined);
        await queryRunner.query(`INSERT INTO "temporary_story"("id", "editId", "content", "description", "postcard", "createdAt", "updatedAt", "viewsCount", "isPublic") SELECT "id", "editId", "content", "description", "postcard", "createdAt", "updatedAt", "viewsCount", "isPublic" FROM "story"`, undefined);
        await queryRunner.query(`DROP TABLE "story"`, undefined);
        await queryRunner.query(`ALTER TABLE "temporary_story" RENAME TO "story"`, undefined);
        await queryRunner.query(`CREATE TABLE "temporary_story" ("id" varchar PRIMARY KEY NOT NULL, "editId" varchar NOT NULL, "content" varchar NOT NULL, "description" varchar(300), "postcard" varchar, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "viewsCount" integer NOT NULL DEFAULT (0), "isPublic" boolean NOT NULL DEFAULT (0), "userId" integer, "isDeleted" boolean NOT NULL DEFAULT (0), CONSTRAINT "UQ_3c13ed4c9bdc15e0c950536ab99" UNIQUE ("id", "editId"), CONSTRAINT "FK_2f8345c3a6d1057ccf612e65a09" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`, undefined);
        await queryRunner.query(`INSERT INTO "temporary_story"("id", "editId", "content", "description", "postcard", "createdAt", "updatedAt", "viewsCount", "isPublic", "userId", "isDeleted") SELECT "id", "editId", "content", "description", "postcard", "createdAt", "updatedAt", "viewsCount", "isPublic", "userId", "isDeleted" FROM "story"`, undefined);
        await queryRunner.query(`DROP TABLE "story"`, undefined);
        await queryRunner.query(`ALTER TABLE "temporary_story" RENAME TO "story"`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "story" RENAME TO "temporary_story"`, undefined);
        await queryRunner.query(`CREATE TABLE "story" ("id" varchar PRIMARY KEY NOT NULL, "editId" varchar NOT NULL, "content" varchar NOT NULL, "description" varchar(300), "postcard" varchar, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "viewsCount" integer NOT NULL DEFAULT (0), "isPublic" boolean NOT NULL DEFAULT (0), "userId" integer, "isDeleted" boolean NOT NULL DEFAULT (0), CONSTRAINT "UQ_3c13ed4c9bdc15e0c950536ab99" UNIQUE ("id", "editId"))`, undefined);
        await queryRunner.query(`INSERT INTO "story"("id", "editId", "content", "description", "postcard", "createdAt", "updatedAt", "viewsCount", "isPublic", "userId", "isDeleted") SELECT "id", "editId", "content", "description", "postcard", "createdAt", "updatedAt", "viewsCount", "isPublic", "userId", "isDeleted" FROM "temporary_story"`, undefined);
        await queryRunner.query(`DROP TABLE "temporary_story"`, undefined);
        await queryRunner.query(`ALTER TABLE "story" RENAME TO "temporary_story"`, undefined);
        await queryRunner.query(`CREATE TABLE "story" ("id" varchar PRIMARY KEY NOT NULL, "editId" varchar NOT NULL, "content" varchar NOT NULL, "description" varchar(300), "postcard" varchar, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "viewsCount" integer NOT NULL DEFAULT (0), "isPublic" boolean NOT NULL DEFAULT (0), CONSTRAINT "UQ_3c13ed4c9bdc15e0c950536ab99" UNIQUE ("id", "editId"))`, undefined);
        await queryRunner.query(`INSERT INTO "story"("id", "editId", "content", "description", "postcard", "createdAt", "updatedAt", "viewsCount", "isPublic") SELECT "id", "editId", "content", "description", "postcard", "createdAt", "updatedAt", "viewsCount", "isPublic" FROM "temporary_story"`, undefined);
        await queryRunner.query(`DROP TABLE "temporary_story"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_9e3516cf97a57b6f6199fa95a8"`, undefined);
        await queryRunner.query(`DROP TABLE "user"`, undefined);
    }

}
