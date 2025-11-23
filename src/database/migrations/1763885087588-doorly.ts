import { MigrationInterface, QueryRunner } from 'typeorm';

export class Doorly1763885087588 implements MigrationInterface {
  name = 'Doorly1763885087588';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenant" ADD "citizenId" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "tenant" ADD "sex" character varying`);
    await queryRunner.query(
      `ALTER TABLE "tenant" ADD "nationality" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant" ADD "home" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "tenant" ADD "issueDate" TIMESTAMP`);
    await queryRunner.query(
      `ALTER TABLE "tenant" ADD "issueLoc" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant" ADD "frontIdCardImagePath" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant" ADD "backIdCardImagePath" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant" ADD "tenantJob" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant" ADD "tenantWorkAt" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tenant" DROP COLUMN "tenantWorkAt"`);
    await queryRunner.query(`ALTER TABLE "tenant" DROP COLUMN "tenantJob"`);
    await queryRunner.query(
      `ALTER TABLE "tenant" DROP COLUMN "backIdCardImagePath"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant" DROP COLUMN "frontIdCardImagePath"`,
    );
    await queryRunner.query(`ALTER TABLE "tenant" DROP COLUMN "issueLoc"`);
    await queryRunner.query(`ALTER TABLE "tenant" DROP COLUMN "issueDate"`);
    await queryRunner.query(`ALTER TABLE "tenant" DROP COLUMN "home"`);
    await queryRunner.query(`ALTER TABLE "tenant" DROP COLUMN "nationality"`);
    await queryRunner.query(`ALTER TABLE "tenant" DROP COLUMN "sex"`);
    await queryRunner.query(`ALTER TABLE "tenant" DROP COLUMN "citizenId"`);
  }
}
