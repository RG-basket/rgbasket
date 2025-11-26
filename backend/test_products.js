const API_URL = `${process.env.BACKEND_URL}/api`;

async function testProductsEndpoint() {
    console.log('🔍 Testing Products API for Admin Component\n');

    try {
        const response = await fetch(`${API_URL}/products`);
        console.log(`Status: ${response.status} ${response.statusText}`);

        if (response.ok) {
            const data = await response.json();
            console.log('\n✅ Response Structure:');
            console.log(`   - success: ${data.success}`);
            console.log(`   - products: ${Array.isArray(data.products) ? 'Array' : typeof data.products}`);
            console.log(`   - products.length: ${data.products?.length || 0}`);
            console.log(`   - pagination: ${data.pagination ? 'Present' : 'Missing'}`);

            if (data.products && data.products.length > 0) {
                console.log('\n📦 Sample Product:');
                const sample = data.products[0];
                console.log(`   - _id: ${sample._id}`);
                console.log(`   - name: ${sample.name}`);
                console.log(`   - category: ${sample.category}`);
                console.log(`   - images: ${Array.isArray(sample.images) ? sample.images.length + ' images' : 'No images'}`);
                console.log(`   - active: ${sample.active}`);
                console.log(`   - inStock: ${sample.inStock}`);
            }

            console.log('\n✅ Products endpoint is working correctly!');
            console.log(`   Total products returned: ${data.products?.length || 0}`);

        } else {
            const errorText = await response.text();
            console.log(`\n❌ FAILED: ${errorText}`);
        }
    } catch (error) {
        console.log(`\n❌ ERROR: ${error.message}`);
    }
}

testProductsEndpoint();
