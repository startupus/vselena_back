import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOrganizationRoles1761340259371 implements MigrationInterface {
    name = 'CreateOrganizationRoles1761340259371'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "referrals" DROP CONSTRAINT IF EXISTS "FK_a398d03f3cf515627a7f5360bab"`);
        await queryRunner.query(`ALTER TABLE "referrals" DROP CONSTRAINT IF EXISTS "FK_ad6772c3fcb57375f43114b5cb5"`);
        await queryRunner.query(`ALTER TABLE "user_organizations" DROP CONSTRAINT IF EXISTS "FK_6881b23cd1a8924e4bf61515fbb"`);
        await queryRunner.query(`ALTER TABLE "user_organizations" DROP CONSTRAINT IF EXISTS "FK_9dae16cdea66aeba1eb6f6ddf29"`);
        await queryRunner.query(`ALTER TABLE "user_teams" DROP CONSTRAINT IF EXISTS "FK_ee838ec2b13ac600a162c20ce33"`);
        await queryRunner.query(`ALTER TABLE "user_teams" DROP CONSTRAINT IF EXISTS "FK_006715ef1e1b40852f379efe567"`);
        await queryRunner.query(`CREATE TABLE "organization_roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "description" text, "organizationId" uuid NOT NULL, "permissions" jsonb NOT NULL DEFAULT '[]', "isSystem" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c259f80f8cdc0877e9eabe3e632" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "organization_memberships" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "organizationId" uuid NOT NULL, "roleId" uuid NOT NULL, "joinedAt" TIMESTAMP NOT NULL DEFAULT NOW(), "invitedBy" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "inviterId" uuid, CONSTRAINT "PK_cd7be805730a4c778a5f45364af" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "team_memberships" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "teamId" uuid NOT NULL, "roleId" uuid NOT NULL, "joinedAt" TIMESTAMP NOT NULL DEFAULT NOW(), "invitedBy" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "inviterId" uuid, CONSTRAINT "PK_053171f713ec8a2f09ed58f08f7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "team_roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "description" text, "teamId" uuid NOT NULL, "permissions" jsonb NOT NULL DEFAULT '[]', "isSystem" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4d682873a391d93b0e5fe2f082f" PRIMARY KEY ("id"))`);
        
        // Check if system_settings table exists before modifying it
        const systemSettingsExistsCheck = await queryRunner.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'system_settings'
          )
        `);
        
        if (systemSettingsExistsCheck[0].exists) {
          await queryRunner.query(`ALTER TABLE "system_settings" DROP COLUMN IF EXISTS "isSystem"`);
          await queryRunner.query(`ALTER TABLE "system_settings" DROP COLUMN IF EXISTS "isEditable"`);
          await queryRunner.query(`ALTER TABLE "system_settings" DROP COLUMN IF EXISTS "type"`);
        }
        
        await queryRunner.query(`ALTER TABLE "referrals" DROP COLUMN IF EXISTS "referredUserId"`);
        await queryRunner.query(`ALTER TABLE "referrals" DROP COLUMN IF EXISTS "status"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."referrals_status_enum"`);
        await queryRunner.query(`ALTER TABLE "referrals" DROP COLUMN IF EXISTS "convertedAt"`);
        await queryRunner.query(`ALTER TABLE "referrals" DROP CONSTRAINT IF EXISTS "UQ_13a1bad9eef9e5cfa4b61765261"`);
        await queryRunner.query(`ALTER TABLE "referrals" DROP COLUMN IF EXISTS "referralCode"`);
        await queryRunner.query(`ALTER TABLE "referrals" DROP COLUMN IF EXISTS "ipAddress"`);
        await queryRunner.query(`ALTER TABLE "referrals" DROP COLUMN IF EXISTS "userAgent"`);
        await queryRunner.query(`ALTER TABLE "referrals" DROP COLUMN IF EXISTS "referredId"`);
        await queryRunner.query(`ALTER TABLE "referrals" DROP COLUMN IF EXISTS "isUsed"`);
        await queryRunner.query(`ALTER TABLE "referrals" DROP COLUMN IF EXISTS "usedAt"`);
        await queryRunner.query(`ALTER TABLE "referrals" DROP CONSTRAINT IF EXISTS "UQ_a53a83849f95cbcf3fbcf32fd0a"`);
        await queryRunner.query(`ALTER TABLE "referrals" DROP COLUMN IF EXISTS "code"`);
        await queryRunner.query(`ALTER TABLE "referrals" ADD "code" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "referrals" ADD CONSTRAINT "UQ_a53a83849f95cbcf3fbcf32fd0a" UNIQUE ("code")`);
        await queryRunner.query(`ALTER TABLE "referrals" ADD "referredId" uuid`);
        await queryRunner.query(`ALTER TABLE "referrals" ADD "isUsed" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "referrals" ADD "usedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "referrals" ADD "referredUserId" uuid`);
        await queryRunner.query(`ALTER TABLE "referrals" ADD "referralCode" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "referrals" ADD CONSTRAINT "UQ_13a1bad9eef9e5cfa4b61765261" UNIQUE ("referralCode")`);
        
        // Create enum type if it doesn't exist
        const typeExists = await queryRunner.query(`
          SELECT EXISTS (
            SELECT 1 FROM pg_type WHERE typname = 'referrals_status_enum'
          )
        `);
        
        if (!typeExists[0].exists) {
          await queryRunner.query(`CREATE TYPE "public"."referrals_status_enum" AS ENUM('pending', 'accepted', 'rejected')`);
        }
        
        await queryRunner.query(`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'referrals' AND column_name = 'status'
            ) THEN
              ALTER TABLE "referrals" ADD "status" "public"."referrals_status_enum" DEFAULT 'pending';
            END IF;
            
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'referrals' AND column_name = 'convertedAt'
            ) THEN
              ALTER TABLE "referrals" ADD "convertedAt" TIMESTAMP;
            END IF;
            
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'referrals' AND column_name = 'ipAddress'
            ) THEN
              ALTER TABLE "referrals" ADD "ipAddress" character varying;
            END IF;
            
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'referrals' AND column_name = 'userAgent'
            ) THEN
              ALTER TABLE "referrals" ADD "userAgent" character varying;
            END IF;
          END $$;
        `);
        
        // Check if system_settings table exists before modifying it
        if (systemSettingsExistsCheck[0].exists) {
          await queryRunner.query(`ALTER TABLE "system_settings" DROP CONSTRAINT IF EXISTS "UQ_b1b5bc664526d375c94ce9ad43d"`);
          await queryRunner.query(`ALTER TABLE "system_settings" DROP COLUMN IF EXISTS "key"`);
          await queryRunner.query(`ALTER TABLE "system_settings" ADD IF NOT EXISTS "key" character varying`);
          await queryRunner.query(`UPDATE "system_settings" SET "key" = 'default_key' WHERE "key" IS NULL`);
          await queryRunner.query(`ALTER TABLE "system_settings" ALTER COLUMN "key" SET NOT NULL`);
          await queryRunner.query(`ALTER TABLE "system_settings" ADD CONSTRAINT "UQ_b1b5bc664526d375c94ce9ad43d" UNIQUE ("key")`);
          await queryRunner.query(`ALTER TABLE "system_settings" DROP COLUMN IF EXISTS "description"`);
          await queryRunner.query(`ALTER TABLE "system_settings" ADD IF NOT EXISTS "description" character varying`);
          await queryRunner.query(`ALTER TABLE "system_settings" ADD IF NOT EXISTS "type" character varying(50) DEFAULT 'string'`);
          await queryRunner.query(`ALTER TABLE "system_settings" ADD IF NOT EXISTS "isSystem" boolean DEFAULT false`);
          await queryRunner.query(`ALTER TABLE "system_settings" ADD IF NOT EXISTS "isEditable" boolean DEFAULT true`);
        }
        await queryRunner.query(`ALTER TABLE "organization_roles" ADD CONSTRAINT "FK_c593237ad2c7ae8e05a71fba9a2" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "organization_memberships" ADD CONSTRAINT "FK_03b536604ff6c6676b51b74b1c9" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "organization_memberships" ADD CONSTRAINT "FK_1813e7f46b5a18529482f519640" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "organization_memberships" ADD CONSTRAINT "FK_d82cafefe7e053004827891fd12" FOREIGN KEY ("roleId") REFERENCES "organization_roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "organization_memberships" ADD CONSTRAINT "FK_52d9cfa848b4898f290f2d5f368" FOREIGN KEY ("inviterId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "team_memberships" ADD CONSTRAINT "FK_877c10e3c9b8f08221792692af6" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "team_memberships" ADD CONSTRAINT "FK_82f21cea02fbb7f7a8451359673" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "team_memberships" ADD CONSTRAINT "FK_24fb44d379d01fac50ca6229074" FOREIGN KEY ("roleId") REFERENCES "team_roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "team_memberships" ADD CONSTRAINT "FK_fd1174943250617a0c5d3752103" FOREIGN KEY ("inviterId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "team_roles" ADD CONSTRAINT "FK_6fcd658c29d67d82492e351294b" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "referrals" ADD CONSTRAINT "FK_ad6772c3fcb57375f43114b5cb5" FOREIGN KEY ("referredId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "referrals" ADD CONSTRAINT "FK_a398d03f3cf515627a7f5360bab" FOREIGN KEY ("referredUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_organizations" ADD CONSTRAINT "FK_6881b23cd1a8924e4bf61515fbb" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_organizations" ADD CONSTRAINT "FK_9dae16cdea66aeba1eb6f6ddf29" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_teams" ADD CONSTRAINT "FK_ee838ec2b13ac600a162c20ce33" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_teams" ADD CONSTRAINT "FK_006715ef1e1b40852f379efe567" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_teams" DROP CONSTRAINT "FK_006715ef1e1b40852f379efe567"`);
        await queryRunner.query(`ALTER TABLE "user_teams" DROP CONSTRAINT "FK_ee838ec2b13ac600a162c20ce33"`);
        await queryRunner.query(`ALTER TABLE "user_organizations" DROP CONSTRAINT "FK_9dae16cdea66aeba1eb6f6ddf29"`);
        await queryRunner.query(`ALTER TABLE "user_organizations" DROP CONSTRAINT "FK_6881b23cd1a8924e4bf61515fbb"`);
        await queryRunner.query(`ALTER TABLE "referrals" DROP CONSTRAINT "FK_a398d03f3cf515627a7f5360bab"`);
        await queryRunner.query(`ALTER TABLE "referrals" DROP CONSTRAINT "FK_ad6772c3fcb57375f43114b5cb5"`);
        await queryRunner.query(`ALTER TABLE "team_roles" DROP CONSTRAINT "FK_6fcd658c29d67d82492e351294b"`);
        await queryRunner.query(`ALTER TABLE "team_memberships" DROP CONSTRAINT "FK_fd1174943250617a0c5d3752103"`);
        await queryRunner.query(`ALTER TABLE "team_memberships" DROP CONSTRAINT "FK_24fb44d379d01fac50ca6229074"`);
        await queryRunner.query(`ALTER TABLE "team_memberships" DROP CONSTRAINT "FK_82f21cea02fbb7f7a8451359673"`);
        await queryRunner.query(`ALTER TABLE "team_memberships" DROP CONSTRAINT "FK_877c10e3c9b8f08221792692af6"`);
        await queryRunner.query(`ALTER TABLE "organization_memberships" DROP CONSTRAINT "FK_52d9cfa848b4898f290f2d5f368"`);
        await queryRunner.query(`ALTER TABLE "organization_memberships" DROP CONSTRAINT "FK_d82cafefe7e053004827891fd12"`);
        await queryRunner.query(`ALTER TABLE "organization_memberships" DROP CONSTRAINT "FK_1813e7f46b5a18529482f519640"`);
        await queryRunner.query(`ALTER TABLE "organization_memberships" DROP CONSTRAINT "FK_03b536604ff6c6676b51b74b1c9"`);
        await queryRunner.query(`ALTER TABLE "organization_roles" DROP CONSTRAINT "FK_c593237ad2c7ae8e05a71fba9a2"`);
        await queryRunner.query(`ALTER TABLE "system_settings" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "system_settings" ADD "description" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "system_settings" DROP CONSTRAINT "UQ_b1b5bc664526d375c94ce9ad43d"`);
        await queryRunner.query(`ALTER TABLE "system_settings" DROP COLUMN "key"`);
        await queryRunner.query(`ALTER TABLE "system_settings" ADD "key" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "system_settings" ADD CONSTRAINT "UQ_b1b5bc664526d375c94ce9ad43d" UNIQUE ("key")`);
        await queryRunner.query(`ALTER TABLE "referrals" DROP COLUMN "userAgent"`);
        await queryRunner.query(`ALTER TABLE "referrals" DROP COLUMN "ipAddress"`);
        await queryRunner.query(`ALTER TABLE "referrals" DROP COLUMN "convertedAt"`);
        await queryRunner.query(`ALTER TABLE "referrals" DROP COLUMN "status"`);
        await queryRunner.query(`ALTER TABLE "referrals" DROP CONSTRAINT "UQ_13a1bad9eef9e5cfa4b61765261"`);
        await queryRunner.query(`ALTER TABLE "referrals" DROP COLUMN "referralCode"`);
        await queryRunner.query(`ALTER TABLE "referrals" DROP COLUMN "referredUserId"`);
        await queryRunner.query(`ALTER TABLE "referrals" DROP COLUMN "usedAt"`);
        await queryRunner.query(`ALTER TABLE "referrals" DROP COLUMN "isUsed"`);
        await queryRunner.query(`ALTER TABLE "referrals" DROP COLUMN "referredId"`);
        await queryRunner.query(`ALTER TABLE "referrals" DROP CONSTRAINT "UQ_a53a83849f95cbcf3fbcf32fd0a"`);
        await queryRunner.query(`ALTER TABLE "referrals" DROP COLUMN "code"`);
        await queryRunner.query(`ALTER TABLE "system_settings" DROP COLUMN "isEditable"`);
        await queryRunner.query(`ALTER TABLE "system_settings" DROP COLUMN "isSystem"`);
        await queryRunner.query(`ALTER TABLE "system_settings" DROP COLUMN "type"`);
        await queryRunner.query(`ALTER TABLE "referrals" ADD "code" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "referrals" ADD CONSTRAINT "UQ_a53a83849f95cbcf3fbcf32fd0a" UNIQUE ("code")`);
        await queryRunner.query(`ALTER TABLE "referrals" ADD "usedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "referrals" ADD "isUsed" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "referrals" ADD "referredId" uuid`);
        await queryRunner.query(`ALTER TABLE "referrals" ADD "userAgent" character varying`);
        await queryRunner.query(`ALTER TABLE "referrals" ADD "ipAddress" character varying`);
        await queryRunner.query(`ALTER TABLE "referrals" ADD "referralCode" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "referrals" ADD CONSTRAINT "UQ_13a1bad9eef9e5cfa4b61765261" UNIQUE ("referralCode")`);
        await queryRunner.query(`ALTER TABLE "referrals" ADD "convertedAt" TIMESTAMP`);
        await queryRunner.query(`CREATE TYPE "public"."referrals_status_enum" AS ENUM('pending', 'converted', 'expired')`);
        await queryRunner.query(`ALTER TABLE "referrals" ADD "status" "public"."referrals_status_enum" NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`ALTER TABLE "referrals" ADD "referredUserId" uuid`);
        await queryRunner.query(`ALTER TABLE "system_settings" ADD "type" character varying(50) NOT NULL DEFAULT 'string'`);
        await queryRunner.query(`ALTER TABLE "system_settings" ADD "isEditable" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "system_settings" ADD "isSystem" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`DROP TABLE "team_roles"`);
        await queryRunner.query(`DROP TABLE "team_memberships"`);
        await queryRunner.query(`DROP TABLE "organization_memberships"`);
        await queryRunner.query(`DROP TABLE "organization_roles"`);
        await queryRunner.query(`ALTER TABLE "user_teams" ADD CONSTRAINT "FK_006715ef1e1b40852f379efe567" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_teams" ADD CONSTRAINT "FK_ee838ec2b13ac600a162c20ce33" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_organizations" ADD CONSTRAINT "FK_9dae16cdea66aeba1eb6f6ddf29" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_organizations" ADD CONSTRAINT "FK_6881b23cd1a8924e4bf61515fbb" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "referrals" ADD CONSTRAINT "FK_ad6772c3fcb57375f43114b5cb5" FOREIGN KEY ("referredId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "referrals" ADD CONSTRAINT "FK_a398d03f3cf515627a7f5360bab" FOREIGN KEY ("referredUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
