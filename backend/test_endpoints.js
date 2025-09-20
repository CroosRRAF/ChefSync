// Test script to check API endpoints directly
const axios = require('axios');

async function testAPIEndpoints() {
  const baseURL = 'http://localhost:8000/api';

  // Test without authentication first
  console.log('🧪 Testing API endpoints...\n');

  try {
    console.log('1. Testing cooks endpoint:');
    const cooksResponse = await axios.get(`${baseURL}/auth/admin/pending-approvals/?role=cook`);
    console.log('✅ Cooks response:', JSON.stringify(cooksResponse.data, null, 2));
  } catch (error) {
    console.log('❌ Cooks error:', error.response?.status, error.response?.data);
  }

  try {
    console.log('\n2. Testing delivery agents endpoint:');
    const deliveryResponse = await axios.get(`${baseURL}/auth/admin/pending-approvals/?role=delivery_agent`);
    console.log('✅ Delivery response:', JSON.stringify(deliveryResponse.data, null, 2));
  } catch (error) {
    console.log('❌ Delivery error:', error.response?.status, error.response?.data);
  }

  // Test with authentication if token exists
  const token = localStorage?.getItem?.('access_token') || process.env.ACCESS_TOKEN;
  if (token) {
    console.log('\n🔐 Testing with authentication...\n');

    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };

    try {
      console.log('3. Testing cooks endpoint (authenticated):');
      const cooksResponse = await axios.get(`${baseURL}/auth/admin/pending-approvals/?role=cook`, config);
      console.log('✅ Cooks response:', JSON.stringify(cooksResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Cooks error:', error.response?.status, error.response?.data);
    }

    try {
      console.log('\n4. Testing delivery agents endpoint (authenticated):');
      const deliveryResponse = await axios.get(`${baseURL}/auth/admin/pending-approvals/?role=delivery_agent`, config);
      console.log('✅ Delivery response:', JSON.stringify(deliveryResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Delivery error:', error.response?.status, error.response?.data);
    }
  } else {
    console.log('\n⚠️  No authentication token found');
  }
}

testAPIEndpoints().catch(console.error);