import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixInvitationsCascade1731840012004 implements MigrationInterface {
  name = 'FixInvitationsCascade1731840012004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Удаляем старые foreign key constraints
    await queryRunner.query(`ALTER TABLE invitations DROP CONSTRAINT IF EXISTS "FK_b60325e5302be0dad38b423314c"`);
    await queryRunner.query(`ALTER TABLE invitations DROP CONSTRAINT IF EXISTS "FK_2c2b945d55160f5ddccea8b6467"`);
    await queryRunner.query(`ALTER TABLE invitations DROP CONSTRAINT IF EXISTS "FK_113cb1411bac0e764b922699d4b"`);
    await queryRunner.query(`ALTER TABLE invitations DROP CONSTRAINT IF EXISTS "FK_b9139f00cebfadced76bca3084f"`);

    // Добавляем новые с ON DELETE CASCADE
    await queryRunner.query(`ALTER TABLE invitations ADD CONSTRAINT "FK_invitations_invited_by" FOREIGN KEY ("invitedById") REFERENCES users(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE invitations ADD CONSTRAINT "FK_invitations_accepted_by" FOREIGN KEY ("acceptedById") REFERENCES users(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE invitations ADD CONSTRAINT "FK_invitations_team" FOREIGN KEY ("teamId") REFERENCES teams(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE invitations ADD CONSTRAINT "FK_invitations_organization" FOREIGN KEY ("organizationId") REFERENCES organizations(id) ON DELETE CASCADE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Удаляем новые constraints
    await queryRunner.query(`ALTER TABLE invitations DROP CONSTRAINT IF EXISTS "FK_invitations_invited_by"`);
    await queryRunner.query(`ALTER TABLE invitations DROP CONSTRAINT IF EXISTS "FK_invitations_accepted_by"`);
    await queryRunner.query(`ALTER TABLE invitations DROP CONSTRAINT IF EXISTS "FK_invitations_team"`);
    await queryRunner.query(`ALTER TABLE invitations DROP CONSTRAINT IF EXISTS "FK_invitations_organization"`);

    // Восстанавливаем старые constraints без CASCADE
    await queryRunner.query(`ALTER TABLE invitations ADD CONSTRAINT "FK_b60325e5302be0dad38b423314c" FOREIGN KEY ("invitedById") REFERENCES users(id)`);
    await queryRunner.query(`ALTER TABLE invitations ADD CONSTRAINT "FK_2c2b945d55160f5ddccea8b6467" FOREIGN KEY ("acceptedById") REFERENCES users(id)`);
    await queryRunner.query(`ALTER TABLE invitations ADD CONSTRAINT "FK_113cb1411bac0e764b922699d4b" FOREIGN KEY ("teamId") REFERENCES teams(id)`);
    await queryRunner.query(`ALTER TABLE invitations ADD CONSTRAINT "FK_b9139f00cebfadced76bca3084f" FOREIGN KEY ("organizationId") REFERENCES organizations(id)`);
  }
}


