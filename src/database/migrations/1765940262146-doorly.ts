import { MigrationInterface, QueryRunner } from 'typeorm';

export class Doorly1765940262146 implements MigrationInterface {
  name = 'Doorly1765940262146';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."billing_type_enum" AS ENUM('RECURRING', 'USAGE_BASED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing" ADD "type" "public"."billing_type_enum" NOT NULL DEFAULT 'RECURRING'`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_expense" ALTER COLUMN "isAssetHandedOver" DROP DEFAULT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "room_expense" ALTER COLUMN "isAssetHandedOver" SET DEFAULT false`,
    );
    await queryRunner.query(`ALTER TABLE "billing" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "public"."billing_type_enum"`);
  }
}
