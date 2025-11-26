const API_URL = `${process.env.BACKEND_URL}/api`;

async function testEndpoints() {
    console.log('🔍 Testing Admin Dashboard API Endpoints\n');
    console.log('='.repeat(50));

    // Test 1: Categories
    try {
        console.log('\n1️⃣  Testing /api/categories...');
        const catRes = await fetch(`${API_URL}/categories`);
        console.log(`   Status: ${catRes.status} ${catRes.statusText}`);

        if (catRes.ok) {
            const data = await catRes.json();
            console.log(`   ✅ SUCCESS - Found ${data.categories?.length || 0} categories`);
            if (data.categories?.length > 0) {
                console.log(`   Sample: ${data.categories[0].name} ${data.categories[0].emoji} (${data.categories[0].productCount} products)`);
            }
        } else {
            const errorText = await catRes.text();
            console.log(`   ❌ FAILED - ${errorText.substring(0, 100)}`);
        }
    } catch (error) {
        console.log(`   ❌ ERROR - ${error.message}`);
    }

    // Test 2: Product Slot Availability
    try {
        console.log('\n2️⃣  Testing /api/product-slot-availability...');
        const slotRes = await fetch(`${API_URL}/product-slot-availability`);
        console.log(`   Status: ${slotRes.status} ${slotRes.statusText}`);

        if (slotRes.ok) {
            const data = await slotRes.json();
            console.log(`   ✅ SUCCESS - Found ${data.restrictions?.length || 0} slot restrictions`);
            if (data.restrictions?.length > 0) {
                const r = data.restrictions[0];
                console.log(`   Sample: Product ${r.productId} - ${r.dayOfWeek} (${r.unavailableSlots?.length || 0} unavailable slots)`);
            }
        } else {
            const errorText = await slotRes.text();
            console.log(`   ❌ FAILED - ${errorText.substring(0, 100)}`);
        }
    } catch (error) {
        console.log(`   ❌ ERROR - ${error.message}`);
    }

    // Test 3: Products (quick test)
    try {
        console.log('\n3️⃣  Testing /api/products...');
        const prodRes = await fetch(`${API_URL}/products?limit=1`);
        console.log(`   Status: ${prodRes.status} ${prodRes.statusText}`);

        if (prodRes.ok) {
            const data = await prodRes.json();
            console.log(`   ✅ SUCCESS - Products endpoint working`);
        } else {
            console.log(`   ❌ FAILED`);
        }
    } catch (error) {
        console.log(`   ❌ ERROR - ${error.message}`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('\n✨ Test Complete!\n');
}

testEndpoints();
