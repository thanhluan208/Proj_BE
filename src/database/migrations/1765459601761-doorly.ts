import { MigrationInterface, QueryRunner } from 'typeorm';

export class Doorly1765459601761 implements MigrationInterface {
  name = 'Doorly1765459601761';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "tenant_contract" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "contractId" uuid, "tenantId" uuid, "statusId" integer, CONSTRAINT "PK_300cee0bb8e7f388a5c31ba1c1e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f78cfe358de0587a782521b86b" ON "tenant_contract" ("contractId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a52a9be84e0621f5d796f67959" ON "tenant_contract" ("tenantId") `,
    );
    await queryRunner.query(`ALTER TABLE "contract" DROP COLUMN "paymentDate"`);
    await queryRunner.query(
      `ALTER TABLE "tenant_contract" ADD CONSTRAINT "FK_f78cfe358de0587a782521b86be" FOREIGN KEY ("contractId") REFERENCES "contract"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_contract" ADD CONSTRAINT "FK_a52a9be84e0621f5d796f679597" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_contract" ADD CONSTRAINT "FK_c02e89c07155aa1ecc65d5f3a15" FOREIGN KEY ("statusId") REFERENCES "status"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenant_contract" DROP CONSTRAINT "FK_c02e89c07155aa1ecc65d5f3a15"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_contract" DROP CONSTRAINT "FK_a52a9be84e0621f5d796f679597"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_contract" DROP CONSTRAINT "FK_f78cfe358de0587a782521b86be"`,
    );
    await queryRunner.query(`ALTER TABLE "contract" ADD "paymentDate" date`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a52a9be84e0621f5d796f67959"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f78cfe358de0587a782521b86b"`,
    );
    await queryRunner.query(`DROP TABLE "tenant_contract"`);
  }
}
