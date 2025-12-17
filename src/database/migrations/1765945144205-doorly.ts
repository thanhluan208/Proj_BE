import { MigrationInterface, QueryRunner } from 'typeorm';

export class Doorly1765945144205 implements MigrationInterface {
  name = 'Doorly1765945144205';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "billing" ALTER COLUMN "electricity_start_index" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing" ALTER COLUMN "electricity_end_index" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing" ALTER COLUMN "water_start_index" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing" ALTER COLUMN "water_end_index" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "billing" ALTER COLUMN "water_end_index" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing" ALTER COLUMN "water_start_index" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing" ALTER COLUMN "electricity_end_index" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing" ALTER COLUMN "electricity_start_index" SET NOT NULL`,
    );
  }
}
