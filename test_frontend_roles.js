// Test function for displaying roles with context
function testDisplayUserRoles() {
    const testUser = {
        id: "1f7d40b2-92c8-4e25-b946-5bc9b029755f",
        email: "saschkaproshka100@mail.ru",
        firstName: "Владислав",
        lastName: "казаков",
        rolesByContext: {
            organizations: [
                {
                    role: "editor",
                    roleId: "131200fd-9efb-4a7b-aa87-361fe9bfad4f",
                    assignedAt: "2025-10-21T15:12:57.902Z",
                    organization: "1",
                    organizationId: "fb9c97bf-3002-4bc1-8c28-7e6c0796213f"
                }
            ],
            teams: [
                {
                    role: "super_admin",
                    roleId: "4a6777c0-a132-403f-97cd-82a69b5674fa",
                    assignedAt: "2025-10-21T14:29:48.466Z",
                    team: "Поддержка",
                    teamId: "f631effb-c3ef-45d8-b342-6c667a161665"
                },
                {
                    role: "admin",
                    roleId: "1fce1148-aee7-4681-8297-41a423b58499",
                    assignedAt: "2025-10-21T15:12:17.473Z",
                    team: "1",
                    teamId: "0b712b6b-5f63-4681-81ca-692e4433b5c8"
                },
                {
                    role: "viewer",
                    roleId: "63adfb0a-6c57-4294-94bd-feb6a3ac9976",
                    assignedAt: "2025-10-21T15:12:40.899Z",
                    team: "2",
                    teamId: "c0d70d9c-c65a-463e-9fb0-4259f0df170f"
                }
            ]
        }
    };

    // Test the role display logic from dashboard.html
    const rolesHtml = testUser.rolesByContext ? 
        [
            ...(testUser.rolesByContext.organizations || []).map(roleInfo => 
                `<span class="role-badge org-role" title="Роль в организации">
                    ${roleInfo.role} (${roleInfo.organization})
                </span>`
            ),
            ...(testUser.rolesByContext.teams || []).map(roleInfo => 
                `<span class="role-badge team-role" title="Роль в команде">
                    ${roleInfo.role} (${roleInfo.team})
                </span>`
            )
        ].join('') :
        `<span class="status-badge active">${testUser.role || 'viewer'}</span>`;

    console.log('Generated HTML for roles:');
    console.log(rolesHtml);
    
    return rolesHtml;
}

// Run the test
testDisplayUserRoles();
