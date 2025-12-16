import { MigrationInterface, QueryRunner } from 'typeorm';

export class Doorly1765871773879 implements MigrationInterface {
  name = 'Doorly1765871773879';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenant" DROP COLUMN "frontIdCardImagePath"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant" DROP COLUMN "backIdCardImagePath"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant" ADD "frontIdCardImageId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant" ADD CONSTRAINT "UQ_7651ca433d37a3be42bed5dc351" UNIQUE ("frontIdCardImageId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant" ADD "backIdCardImageId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant" ADD CONSTRAINT "UQ_a4fcbeec652f552f4c649dd3373" UNIQUE ("backIdCardImageId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant" ADD CONSTRAINT "FK_7651ca433d37a3be42bed5dc351" FOREIGN KEY ("frontIdCardImageId") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant" ADD CONSTRAINT "FK_a4fcbeec652f552f4c649dd3373" FOREIGN KEY ("backIdCardImageId") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenant" DROP CONSTRAINT "FK_a4fcbeec652f552f4c649dd3373"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant" DROP CONSTRAINT "FK_7651ca433d37a3be42bed5dc351"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant" DROP CONSTRAINT "UQ_a4fcbeec652f552f4c649dd3373"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant" DROP COLUMN "backIdCardImageId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant" DROP CONSTRAINT "UQ_7651ca433d37a3be42bed5dc351"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant" DROP COLUMN "frontIdCardImageId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant" ADD "backIdCardImagePath" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant" ADD "frontIdCardImagePath" character varying`,
    );
  }
}
