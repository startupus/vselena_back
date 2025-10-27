INSERT INTO roles (id, name, description, "isSystem", "isGlobal", "createdAt", "updatedAt") 
VALUES (gen_random_uuid(), 'viewer', 'Default user role with read-only access', true, true, NOW(), NOW()) 
ON CONFLICT (name) DO NOTHING;
