import { MigrationInterface, QueryRunner } from 'typeorm';

export class Doorly1765286943296 implements MigrationInterface {
  name = 'Doorly1765286943296';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "house" DROP COLUMN "overRentalFee"`);
    await queryRunner.query(`ALTER TABLE "room" DROP COLUMN "base_rent"`);
    await queryRunner.query(
      `ALTER TABLE "room" DROP COLUMN "price_per_electricity_unit"`,
    );
    await queryRunner.query(
      `ALTER TABLE "room" DROP COLUMN "price_per_water_unit"`,
    );
    await queryRunner.query(`ALTER TABLE "room" DROP COLUMN "fixed_water_fee"`);
    await queryRunner.query(
      `ALTER TABLE "room" DROP COLUMN "fixed_electricity_fee"`,
    );
    await queryRunner.query(`ALTER TABLE "room" DROP COLUMN "living_fee"`);
    await queryRunner.query(`ALTER TABLE "room" DROP COLUMN "parking_fee"`);
    await queryRunner.query(`ALTER TABLE "room" DROP COLUMN "cleaning_fee"`);
    await queryRunner.query(`ALTER TABLE "room" DROP COLUMN "paymentDate"`);
    await queryRunner.query(`ALTER TABLE "room" DROP COLUMN "internet_fee"`);
    await queryRunner.query(
      `ALTER TABLE "contract" ADD "createdDate" TIMESTAMP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract" ADD "startDate" TIMESTAMP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract" ADD "endDate" TIMESTAMP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract" ADD "base_rent" numeric(15,2) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract" ADD "internet_fee" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract" ADD "price_per_electricity_unit" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract" ADD "price_per_water_unit" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract" ADD "fixed_water_fee" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract" ADD "fixed_electricity_fee" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract" ADD "living_fee" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract" ADD "parking_fee" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract" ADD "cleaning_fee" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract" ADD "overRentalFee" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "contract" ADD "paymentDate" date`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "contract" DROP COLUMN "paymentDate"`);
    await queryRunner.query(
      `ALTER TABLE "contract" DROP COLUMN "overRentalFee"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract" DROP COLUMN "cleaning_fee"`,
    );
    await queryRunner.query(`ALTER TABLE "contract" DROP COLUMN "parking_fee"`);
    await queryRunner.query(`ALTER TABLE "contract" DROP COLUMN "living_fee"`);
    await queryRunner.query(
      `ALTER TABLE "contract" DROP COLUMN "fixed_electricity_fee"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract" DROP COLUMN "fixed_water_fee"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract" DROP COLUMN "price_per_water_unit"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract" DROP COLUMN "price_per_electricity_unit"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract" DROP COLUMN "internet_fee"`,
    );
    await queryRunner.query(`ALTER TABLE "contract" DROP COLUMN "base_rent"`);
    await queryRunner.query(`ALTER TABLE "contract" DROP COLUMN "endDate"`);
    await queryRunner.query(`ALTER TABLE "contract" DROP COLUMN "startDate"`);
    await queryRunner.query(`ALTER TABLE "contract" DROP COLUMN "createdDate"`);
    await queryRunner.query(
      `ALTER TABLE "room" ADD "internet_fee" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(`ALTER TABLE "room" ADD "paymentDate" date`);
    await queryRunner.query(
      `ALTER TABLE "room" ADD "cleaning_fee" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "room" ADD "parking_fee" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "room" ADD "living_fee" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "room" ADD "fixed_electricity_fee" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "room" ADD "fixed_water_fee" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "room" ADD "price_per_water_unit" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "room" ADD "price_per_electricity_unit" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "room" ADD "base_rent" numeric(15,2) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "house" ADD "overRentalFee" character varying`,
    );
  }
}
