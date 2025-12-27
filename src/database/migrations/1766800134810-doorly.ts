import { MigrationInterface, QueryRunner } from 'typeorm';

export class Doorly1766800134810 implements MigrationInterface {
  name = 'Doorly1766800134810';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "scheduler" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "cronExpression" character varying NOT NULL, "description" character varying, "isActive" boolean NOT NULL DEFAULT true, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_c11a0f76186d81647aeefd54c72" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "scheduler"`);
  }
}
