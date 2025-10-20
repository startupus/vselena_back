SELECT id, email, "firstName", "lastName", status, "invitedById", "createdAt" FROM invitations WHERE "invitedById" = '00000000-0000-0000-0000-000000000001' ORDER BY "createdAt" DESC LIMIT 10;
