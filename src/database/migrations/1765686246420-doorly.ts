import { MigrationInterface, QueryRunner } from 'typeorm';

export class Doorly1765686246420 implements MigrationInterface {
  name = 'Doorly1765686246420';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "room_expense" ADD "notes" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "room_expense" DROP COLUMN "notes"`);
  }
}
