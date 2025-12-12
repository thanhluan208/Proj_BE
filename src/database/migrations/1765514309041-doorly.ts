import { MigrationInterface, QueryRunner } from 'typeorm';

export class Doorly1765514309041 implements MigrationInterface {
  name = 'Doorly1765514309041';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenant_contract" ADD "isMainTenant" boolean`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenant_contract" DROP COLUMN "isMainTenant"`,
    );
  }
}
