import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInvitations1731840012000 implements MigrationInterface {
  name = 'CreateInvitations1731840012000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Проверяем, существует ли таблица
    const tableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'invitations'
      )
    `);
    
    if (tableExists[0].exists) {
      console.log('Table invitations already exists, skipping creation');
      return;
    }

    await queryRunner.query(`
      CREATE TABLE invitations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('organization', 'team')),
        "organizationId" UUID REFERENCES organizations(id) ON DELETE CASCADE,
        "teamId" UUID REFERENCES teams(id) ON DELETE CASCADE,
        "invitedById" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "acceptedById" UUID REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
        role VARCHAR(100),
        message TEXT,
        expires_at TIMESTAMP NOT NULL,
        accepted_at TIMESTAMP,
        declined_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Индексы для оптимизации запросов
    await queryRunner.query(`CREATE INDEX idx_invitations_email ON invitations(email)`);
    await queryRunner.query(`CREATE INDEX idx_invitations_token ON invitations(token)`);
    await queryRunner.query(`CREATE INDEX idx_invitations_status ON invitations(status)`);
    await queryRunner.query(`CREATE INDEX idx_invitations_expires_at ON invitations(expires_at)`);
    await queryRunner.query(`CREATE INDEX idx_invitations_invited_by ON invitations("invitedById")`);
    await queryRunner.query(`CREATE INDEX idx_invitations_accepted_by ON invitations("acceptedById")`);
    await queryRunner.query(`CREATE INDEX idx_invitations_organization_id ON invitations("organizationId")`);
    await queryRunner.query(`CREATE INDEX idx_invitations_team_id ON invitations("teamId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE invitations`);
  }
}


