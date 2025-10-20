// Test script for invitation system
const API_BASE = 'http://localhost:3001';

async function testInvitationSystem() {
    console.log('🧪 Testing Invitation System...\n');

    try {
        // Test 1: Get sent invitations
        console.log('1. Testing GET /api/invitations/sent');
        const sentResponse = await fetch(`${API_BASE}/api/invitations/sent`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer YOUR_TOKEN_HERE'
            }
        });
        
        if (sentResponse.ok) {
            const sentData = await sentResponse.json();
            console.log('✅ Sent invitations endpoint working');
            console.log('Response:', JSON.stringify(sentData, null, 2));
        } else {
            console.log('❌ Sent invitations endpoint failed:', sentResponse.status);
        }

        // Test 2: Get received invitations
        console.log('\n2. Testing GET /api/invitations/my');
        const myResponse = await fetch(`${API_BASE}/api/invitations/my`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer YOUR_TOKEN_HERE'
            }
        });
        
        if (myResponse.ok) {
            const myData = await myResponse.json();
            console.log('✅ My invitations endpoint working');
            console.log('Response:', JSON.stringify(myData, null, 2));
        } else {
            console.log('❌ My invitations endpoint failed:', myResponse.status);
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testInvitationSystem();
