import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentDateToRoom1764464630944 implements MigrationInterface {
  name = 'AddPaymentDateToRoom1764464630944';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "room" ADD "paymentDate" date`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "room" DROP COLUMN "paymentDate"`);
  }
}
