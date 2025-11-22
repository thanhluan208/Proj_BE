import { MigrationInterface, QueryRunner } from 'typeorm';

export class Doorly1763816823774 implements MigrationInterface {
  name = 'Doorly1763816823774';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "room_expense" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "amount" numeric(15,2) NOT NULL, "date" date NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "roomId" uuid, CONSTRAINT "PK_fe5c84abf1099cfa443d691899f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cf43d5a615087cd71dce98ebb6" ON "room_expense" ("roomId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "contract" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "ownerId" uuid, "tenantId" uuid, "roomId" uuid, "fileId" uuid, "statusId" integer, CONSTRAINT "UQ_30ae67018fd524a066a222351d4" UNIQUE ("tenantId", "fileId", "roomId", "ownerId"), CONSTRAINT "REL_55192eaad5af3ea323029bba04" UNIQUE ("tenantId"), CONSTRAINT "REL_05926ec1b15bfe32fcc9a81c30" UNIQUE ("fileId"), CONSTRAINT "PK_17c3a89f58a2997276084e706e8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."billing_status_enum" AS ENUM('PENDING_OWNER_REVIEW', 'PENDING_TENANT_PAYMENT', 'PAID')`,
    );
    await queryRunner.query(
      `CREATE TABLE "billing" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "month" date NOT NULL, "electricity_start_index" numeric(10,2) NOT NULL, "electricity_end_index" numeric(10,2) NOT NULL, "water_start_index" numeric(10,2) NOT NULL, "water_end_index" numeric(10,2) NOT NULL, "total_electricity_cost" numeric(15,2) NOT NULL, "total_water_cost" numeric(15,2) NOT NULL, "total_living_cost" numeric(15,2) NOT NULL, "total_parking_cost" numeric(15,2) NOT NULL, "total_cleaning_cost" numeric(15,2) NOT NULL, "base_rent" numeric(15,2) NOT NULL, "total_amount" numeric(15,2) NOT NULL, "status" "public"."billing_status_enum" NOT NULL DEFAULT 'PENDING_OWNER_REVIEW', "payment_date" date, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "tenantId" uuid, "roomId" uuid, CONSTRAINT "PK_d9043caf3033c11ed3d1b29f73c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "room" ADD "price_per_electricity_unit" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "room" ADD "price_per_water_unit" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "room" ADD "fixed_water_fee" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "room" ADD "fixed_electricity_fee" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "room" ADD "living_fee" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "room" ADD "parking_fee" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "room" ADD "cleaning_fee" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_expense" ADD CONSTRAINT "FK_cf43d5a615087cd71dce98ebb66" FOREIGN KEY ("roomId") REFERENCES "room"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract" ADD CONSTRAINT "FK_a45df5a99d61f11c78719bd6129" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract" ADD CONSTRAINT "FK_55192eaad5af3ea323029bba042" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract" ADD CONSTRAINT "FK_cf9839a50efcca56cff91d68852" FOREIGN KEY ("roomId") REFERENCES "room"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract" ADD CONSTRAINT "FK_05926ec1b15bfe32fcc9a81c308" FOREIGN KEY ("fileId") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract" ADD CONSTRAINT "FK_5b733087ae1876c5ba9297849d3" FOREIGN KEY ("statusId") REFERENCES "status"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing" ADD CONSTRAINT "FK_2eed07a51efdd8ea99d442bcf2c" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing" ADD CONSTRAINT "FK_027e79be640f29f631e29961b49" FOREIGN KEY ("roomId") REFERENCES "room"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "billing" DROP CONSTRAINT "FK_027e79be640f29f631e29961b49"`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing" DROP CONSTRAINT "FK_2eed07a51efdd8ea99d442bcf2c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract" DROP CONSTRAINT "FK_5b733087ae1876c5ba9297849d3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract" DROP CONSTRAINT "FK_05926ec1b15bfe32fcc9a81c308"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract" DROP CONSTRAINT "FK_cf9839a50efcca56cff91d68852"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract" DROP CONSTRAINT "FK_55192eaad5af3ea323029bba042"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract" DROP CONSTRAINT "FK_a45df5a99d61f11c78719bd6129"`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_expense" DROP CONSTRAINT "FK_cf43d5a615087cd71dce98ebb66"`,
    );
    await queryRunner.query(`ALTER TABLE "room" DROP COLUMN "cleaning_fee"`);
    await queryRunner.query(`ALTER TABLE "room" DROP COLUMN "parking_fee"`);
    await queryRunner.query(`ALTER TABLE "room" DROP COLUMN "living_fee"`);
    await queryRunner.query(
      `ALTER TABLE "room" DROP COLUMN "fixed_electricity_fee"`,
    );
    await queryRunner.query(`ALTER TABLE "room" DROP COLUMN "fixed_water_fee"`);
    await queryRunner.query(
      `ALTER TABLE "room" DROP COLUMN "price_per_water_unit"`,
    );
    await queryRunner.query(
      `ALTER TABLE "room" DROP COLUMN "price_per_electricity_unit"`,
    );
    await queryRunner.query(`DROP TABLE "billing"`);
    await queryRunner.query(`DROP TYPE "public"."billing_status_enum"`);
    await queryRunner.query(`DROP TABLE "contract"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cf43d5a615087cd71dce98ebb6"`,
    );
    await queryRunner.query(`DROP TABLE "room_expense"`);
  }
}
