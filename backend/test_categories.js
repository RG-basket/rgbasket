const API_URL = `${process.env.BACKEND_URL}/api`;

async function testCategoriesEndpoints() {
    console.log('🔍 Testing Categories API Endpoints\n');
    console.log('='.repeat(50));

    // Test 1: GET Categories
    try {
        console.log('\n1️⃣  GET /api/categories');
        const response = await fetch(`${API_URL}/categories`);
        console.log(`   Status: ${response.status} ${response.statusText}`);

        if (response.ok) {
            const data = await response.json();
            console.log(`   ✅ SUCCESS - ${data.categories?.length || 0} categories found`);
        } else {
            const error = await response.text();
            console.log(`   ❌ FAILED - ${error.substring(0, 100)}`);
        }
    } catch (error) {
        console.log(`   ❌ ERROR - ${error.message}`);
    }

    // Test 2: POST Create Category (without auth - should fail)
    try {
        console.log('\n2️⃣  POST /api/categories (without auth)');
        const response = await fetch(`${API_URL}/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Test Category', emoji: '🧪' })
        });
        console.log(`   Status: ${response.status} ${response.statusText}`);

        if (response.status === 401 || response.status === 403) {
            console.log(`   ✅ EXPECTED - Auth required (${response.status})`);
        } else if (response.ok) {
            console.log(`   ⚠️  UNEXPECTED - Created without auth!`);
        } else {
            const error = await response.text();
            console.log(`   Response: ${error.substring(0, 150)}`);
        }
    } catch (error) {
        console.log(`   ❌ ERROR - ${error.message}`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('\n💡 Note: Create/Edit requires admin authentication');
    console.log('   Check browser console for actual error messages\n');
}

testCategoriesEndpoints();
