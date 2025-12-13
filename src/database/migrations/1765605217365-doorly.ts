import { MigrationInterface, QueryRunner } from 'typeorm';

export class Doorly1765605217365 implements MigrationInterface {
  name = 'Doorly1765605217365';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "billing" DROP CONSTRAINT "FK_2eed07a51efdd8ea99d442bcf2c"`,
    );
    await queryRunner.query(`ALTER TABLE "billing" DROP COLUMN "month"`);
    await queryRunner.query(
      `ALTER TABLE "billing" DROP COLUMN "total_electricity_cost"`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing" DROP COLUMN "total_water_cost"`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing" DROP COLUMN "total_living_cost"`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing" DROP COLUMN "total_parking_cost"`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing" DROP COLUMN "total_cleaning_cost"`,
    );
    await queryRunner.query(`ALTER TABLE "billing" DROP COLUMN "base_rent"`);
    await queryRunner.query(`ALTER TABLE "billing" DROP COLUMN "tenantId"`);
    await queryRunner.query(`ALTER TABLE "billing" ADD "from" date NOT NULL`);
    await queryRunner.query(`ALTER TABLE "billing" ADD "to" date NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "billing" ADD "tenantContractId" uuid`,
    );
    await queryRunner.query(`ALTER TABLE "billing" ADD "fileId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "billing" ADD CONSTRAINT "UQ_61f9b941403146db9aab5907dce" UNIQUE ("fileId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing" ADD CONSTRAINT "FK_2e7816412ec6440e4455133ad12" FOREIGN KEY ("tenantContractId") REFERENCES "tenant_contract"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing" ADD CONSTRAINT "FK_61f9b941403146db9aab5907dce" FOREIGN KEY ("fileId") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "billing" DROP CONSTRAINT "FK_61f9b941403146db9aab5907dce"`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing" DROP CONSTRAINT "FK_2e7816412ec6440e4455133ad12"`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing" DROP CONSTRAINT "UQ_61f9b941403146db9aab5907dce"`,
    );
    await queryRunner.query(`ALTER TABLE "billing" DROP COLUMN "fileId"`);
    await queryRunner.query(
      `ALTER TABLE "billing" DROP COLUMN "tenantContractId"`,
    );
    await queryRunner.query(`ALTER TABLE "billing" DROP COLUMN "to"`);
    await queryRunner.query(`ALTER TABLE "billing" DROP COLUMN "from"`);
    await queryRunner.query(`ALTER TABLE "billing" ADD "tenantId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "billing" ADD "base_rent" numeric(15,2) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing" ADD "total_cleaning_cost" numeric(15,2) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing" ADD "total_parking_cost" numeric(15,2) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing" ADD "total_living_cost" numeric(15,2) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing" ADD "total_water_cost" numeric(15,2) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing" ADD "total_electricity_cost" numeric(15,2) NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "billing" ADD "month" date NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "billing" ADD CONSTRAINT "FK_2eed07a51efdd8ea99d442bcf2c" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
