import { MigrationInterface, QueryRunner } from 'typeorm';

export class Doorly1765635128022 implements MigrationInterface {
  name = 'Doorly1765635128022';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "billing" ADD "proofId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "billing" ADD CONSTRAINT "UQ_f8a1e1b58d37f9f079839786fd9" UNIQUE ("proofId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing" ADD CONSTRAINT "FK_f8a1e1b58d37f9f079839786fd9" FOREIGN KEY ("proofId") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "billing" DROP CONSTRAINT "FK_f8a1e1b58d37f9f079839786fd9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing" DROP CONSTRAINT "UQ_f8a1e1b58d37f9f079839786fd9"`,
    );
    await queryRunner.query(`ALTER TABLE "billing" DROP COLUMN "proofId"`);
  }
}
