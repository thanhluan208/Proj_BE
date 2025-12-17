import { MigrationInterface, QueryRunner } from 'typeorm';

export class Doorly1765933543900 implements MigrationInterface {
  name = 'Doorly1765933543900';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "room_expense" ADD "isAssetHandedOver" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "room_expense" DROP COLUMN "isAssetHandedOver"`,
    );
  }
}
