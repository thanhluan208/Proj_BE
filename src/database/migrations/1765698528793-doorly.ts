import { MigrationInterface, QueryRunner } from 'typeorm';

export class Doorly1765698528793 implements MigrationInterface {
  name = 'Doorly1765698528793';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "room_expense" ADD "receiptId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "room_expense" ADD CONSTRAINT "UQ_c3643f71f568cf14a9d1e7814ab" UNIQUE ("receiptId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_expense" ADD CONSTRAINT "FK_c3643f71f568cf14a9d1e7814ab" FOREIGN KEY ("receiptId") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "room_expense" DROP CONSTRAINT "FK_c3643f71f568cf14a9d1e7814ab"`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_expense" DROP CONSTRAINT "UQ_c3643f71f568cf14a9d1e7814ab"`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_expense" DROP COLUMN "receiptId"`,
    );
  }
}
