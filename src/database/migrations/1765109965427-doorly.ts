import { MigrationInterface, QueryRunner } from 'typeorm';

export class Doorly1765109965427 implements MigrationInterface {
  name = 'Doorly1765109965427';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "contract" DROP CONSTRAINT "FK_a45df5a99d61f11c78719bd6129"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract" DROP CONSTRAINT "FK_55192eaad5af3ea323029bba042"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f581d5b78b4e344a1a75f2ceb4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract" DROP CONSTRAINT "UQ_30ae67018fd524a066a222351d4"`,
    );
    await queryRunner.query(`ALTER TABLE "contract" DROP COLUMN "ownerId"`);
    await queryRunner.query(
      `ALTER TABLE "contract" DROP CONSTRAINT "REL_55192eaad5af3ea323029bba04"`,
    );
    await queryRunner.query(`ALTER TABLE "contract" DROP COLUMN "tenantId"`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "phoneNumber" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "bankAccountName" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "bankAccountNumber" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "bankName" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "house" ADD "address" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "house" ADD "overRentalFee" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "room" ADD "internet_fee" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract" ADD CONSTRAINT "UQ_3ecc2f6a8fd288af6a120e72239" UNIQUE ("fileId", "roomId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "contract" DROP CONSTRAINT "UQ_3ecc2f6a8fd288af6a120e72239"`,
    );
    await queryRunner.query(`ALTER TABLE "room" DROP COLUMN "internet_fee"`);
    await queryRunner.query(`ALTER TABLE "house" DROP COLUMN "overRentalFee"`);
    await queryRunner.query(`ALTER TABLE "house" DROP COLUMN "address"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "bankName"`);
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "bankAccountNumber"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "bankAccountName"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "phoneNumber"`);
    await queryRunner.query(`ALTER TABLE "contract" ADD "tenantId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "contract" ADD CONSTRAINT "REL_55192eaad5af3ea323029bba04" UNIQUE ("tenantId")`,
    );
    await queryRunner.query(`ALTER TABLE "contract" ADD "ownerId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "contract" ADD CONSTRAINT "UQ_30ae67018fd524a066a222351d4" UNIQUE ("fileId", "ownerId", "roomId", "tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f581d5b78b4e344a1a75f2ceb4" ON "house" ("name") `,
    );
    await queryRunner.query(
      `ALTER TABLE "contract" ADD CONSTRAINT "FK_55192eaad5af3ea323029bba042" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract" ADD CONSTRAINT "FK_a45df5a99d61f11c78719bd6129" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
