import { MigrationInterface, QueryRunner } from 'typeorm';

export class Doorly1764490066926 implements MigrationInterface {
  name = 'Doorly1764490066926';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenant" ADD "phoneNumber" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tenant" DROP COLUMN "phoneNumber"`);
  }
}
