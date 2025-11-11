import { MigrationInterface, QueryRunner } from 'typeorm';

export class Doorly1762841839571 implements MigrationInterface {
  name = 'Doorly1762841839571';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "role" ("id" integer NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_b36bcfe02fc8de3c57a8b2391c2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "status" ("id" integer NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_e12743a7086ec826733f54e1d95" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying, "password" character varying, "provider" character varying NOT NULL DEFAULT 'email', "firstName" character varying, "lastName" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "roleId" integer, "statusId" integer, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_58e4dbff0e1a32a9bdc861bb29" ON "user" ("firstName") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f0e1b4ecdca13b177e2e3a0613" ON "user" ("lastName") `,
    );
    await queryRunner.query(
      `CREATE TABLE "house" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "ownerId" uuid, "statusId" integer, CONSTRAINT "PK_8c9220195fd0a289745855fe908" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_351e5f043bb28867ca16bb3245" ON "house" ("ownerId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f581d5b78b4e344a1a75f2ceb4" ON "house" ("name") `,
    );
    await queryRunner.query(
      `CREATE TABLE "room" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "size_sq_m" numeric(10,2) NOT NULL, "base_rent" numeric(15,2) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "houseId" uuid, "statusId" integer, CONSTRAINT "PK_c6d46db005d623e691b2fbcba23" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_25e48b17d2c5c3a2ed9e738183" ON "room" ("houseId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_535c742a3606d2e3122f441b26" ON "room" ("name") `,
    );
    await queryRunner.query(
      `CREATE TABLE "tenant" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "dob" TIMESTAMP, "address" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "roomId" uuid, "statusId" integer, CONSTRAINT "PK_da8c6efd67bb301e810e56ac139" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_56211336b5ff35fd944f225917" ON "tenant" ("name") `,
    );
    await queryRunner.query(
      `CREATE TABLE "session" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "hash" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "userId" uuid, CONSTRAINT "PK_f55da76ac1c3ac420f444d2ff11" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3d2f174ef04fb312fdebd0ddc5" ON "session" ("userId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "house_expense" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "amount" numeric NOT NULL, "date" date NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "houseId" uuid, CONSTRAINT "PK_35c7c968962be07cc4bb3361296" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8c980007038914cddcd5103611" ON "house_expense" ("houseId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "file" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "path" character varying NOT NULL, "mimeType" character varying, "size" integer, "originalName" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "ownerId" uuid, CONSTRAINT "PK_36b46d232307066b3a2c9ea3a1d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_c28e52f758e7bbc53828db92194" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_dc18daa696860586ba4667a9d31" FOREIGN KEY ("statusId") REFERENCES "status"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "house" ADD CONSTRAINT "FK_351e5f043bb28867ca16bb32451" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "house" ADD CONSTRAINT "FK_1e9b7e57d782737b4c5904cd415" FOREIGN KEY ("statusId") REFERENCES "status"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "room" ADD CONSTRAINT "FK_25e48b17d2c5c3a2ed9e7381830" FOREIGN KEY ("houseId") REFERENCES "house"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "room" ADD CONSTRAINT "FK_8abbf6c015ad87fe1eeba2d8668" FOREIGN KEY ("statusId") REFERENCES "status"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant" ADD CONSTRAINT "FK_ec779f5d49ed3e203226dc32036" FOREIGN KEY ("roomId") REFERENCES "room"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant" ADD CONSTRAINT "FK_8acdee37d3411d3d8c0cea3bb4e" FOREIGN KEY ("statusId") REFERENCES "status"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "session" ADD CONSTRAINT "FK_3d2f174ef04fb312fdebd0ddc53" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "house_expense" ADD CONSTRAINT "FK_8c980007038914cddcd5103611c" FOREIGN KEY ("houseId") REFERENCES "house"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD CONSTRAINT "FK_34c5a7443f6f1ab14d73c5d0549" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "file" DROP CONSTRAINT "FK_34c5a7443f6f1ab14d73c5d0549"`,
    );
    await queryRunner.query(
      `ALTER TABLE "house_expense" DROP CONSTRAINT "FK_8c980007038914cddcd5103611c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "session" DROP CONSTRAINT "FK_3d2f174ef04fb312fdebd0ddc53"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant" DROP CONSTRAINT "FK_8acdee37d3411d3d8c0cea3bb4e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant" DROP CONSTRAINT "FK_ec779f5d49ed3e203226dc32036"`,
    );
    await queryRunner.query(
      `ALTER TABLE "room" DROP CONSTRAINT "FK_8abbf6c015ad87fe1eeba2d8668"`,
    );
    await queryRunner.query(
      `ALTER TABLE "room" DROP CONSTRAINT "FK_25e48b17d2c5c3a2ed9e7381830"`,
    );
    await queryRunner.query(
      `ALTER TABLE "house" DROP CONSTRAINT "FK_1e9b7e57d782737b4c5904cd415"`,
    );
    await queryRunner.query(
      `ALTER TABLE "house" DROP CONSTRAINT "FK_351e5f043bb28867ca16bb32451"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_dc18daa696860586ba4667a9d31"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_c28e52f758e7bbc53828db92194"`,
    );
    await queryRunner.query(`DROP TABLE "file"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8c980007038914cddcd5103611"`,
    );
    await queryRunner.query(`DROP TABLE "house_expense"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3d2f174ef04fb312fdebd0ddc5"`,
    );
    await queryRunner.query(`DROP TABLE "session"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_56211336b5ff35fd944f225917"`,
    );
    await queryRunner.query(`DROP TABLE "tenant"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_535c742a3606d2e3122f441b26"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_25e48b17d2c5c3a2ed9e738183"`,
    );
    await queryRunner.query(`DROP TABLE "room"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f581d5b78b4e344a1a75f2ceb4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_351e5f043bb28867ca16bb3245"`,
    );
    await queryRunner.query(`DROP TABLE "house"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f0e1b4ecdca13b177e2e3a0613"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_58e4dbff0e1a32a9bdc861bb29"`,
    );
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TABLE "status"`);
    await queryRunner.query(`DROP TABLE "role"`);
  }
}
