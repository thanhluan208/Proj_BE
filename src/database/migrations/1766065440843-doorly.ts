import { MigrationInterface, QueryRunner } from 'typeorm';

export class Doorly1766065440843 implements MigrationInterface {
  name = 'Doorly1766065440843';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "room" ADD "maxTenant" integer NOT NULL DEFAULT '2'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4526dcd5e5bfabdf2d3e1a3d65" ON "room" ("maxTenant") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4526dcd5e5bfabdf2d3e1a3d65"`,
    );
    await queryRunner.query(`ALTER TABLE "room" DROP COLUMN "maxTenant"`);
  }
}
