import { MigrationInterface, QueryRunner } from 'typeorm';

export class RentedHouse1751186874681 implements MigrationInterface {
  name = 'RentedHouse1751186874681';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "file" ADD "mimeType" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "file" ADD "size" integer`);
    await queryRunner.query(
      `ALTER TABLE "file" ADD "originalName" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "file" ADD "ownerId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "file" ADD CONSTRAINT "FK_34c5a7443f6f1ab14d73c5d0549" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "file" DROP CONSTRAINT "FK_34c5a7443f6f1ab14d73c5d0549"`,
    );
    await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "ownerId"`);
    await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "createdAt"`);
    await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "originalName"`);
    await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "size"`);
    await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "mimeType"`);
  }
}
