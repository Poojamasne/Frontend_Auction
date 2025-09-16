// Test script for participants endpoint
// Run this in browser console to test the endpoint

async function testParticipantsEndpoint(auctionId = '345') {
    try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        if (!token) {
            console.error('No auth token found. Please log in first.');
            return;
        }

        console.log(`Testing participants endpoint for auction ${auctionId}...`);
        
        // Test original endpoint
        console.log('1. Testing original endpoint:', `https://auction-development.onrender.com/api/auction/${auctionId}`);
        const originalResponse = await fetch(`https://auction-development.onrender.com/api/auction/${auctionId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });
        console.log('Original endpoint status:', originalResponse.status);
        
        // Test participants endpoint
        console.log('2. Testing participants endpoint:', `https://auction-development.onrender.com/api/auction/${auctionId}/participants`);
        const participantsResponse = await fetch(`https://auction-development.onrender.com/api/auction/${auctionId}/participants`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });
        console.log('Participants endpoint status:', participantsResponse.status);
        
        if (participantsResponse.ok) {
            const data = await participantsResponse.json();
            console.log('Participants endpoint data:', data);
            return { success: true, data };
        } else {
            const errorText = await participantsResponse.text();
            console.log('Participants endpoint error:', errorText);
            return { success: false, status: participantsResponse.status, error: errorText };
        }
        
    } catch (error) {
        console.error('Test failed:', error);
        return { success: false, error: error.message };
    }
}

// Run the test
console.log('Participants endpoint test loaded. Run: testParticipantsEndpoint("345")');