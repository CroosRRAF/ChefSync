import axios from 'axios';

const testAPI = async () => {
  try {
    console.log('Testing API endpoint...');
    const response = await axios.get('http://127.0.0.1:8000/api/admin/orders/list_orders/', {
      timeout: 5000
    });
    console.log('✅ Success:', response.status, response.data);
  } catch (error) {
    console.error('❌ Error:', {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
  }
};

testAPI();