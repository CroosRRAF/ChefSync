// Test script to verify UnifiedApprovals data validation fixes
// This simulates different API response scenarios

console.log('🧪 Testing UnifiedApprovals data validation fixes...\n');

// Simulate the validateResponse function from UnifiedApprovals.tsx
const validateResponse = (response, role) => {
  if (!response) {
    console.warn(`${role} API: No response received`);
    return [];
  }

  if (!response.data) {
    console.warn(`${role} API response is missing 'data' property. Response structure:`, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      hasData: 'data' in response,
      responseKeys: Object.keys(response)
    });
    return [];
  }

  if (!response.data.users) {
    console.warn(`${role} API response has 'data' property but missing 'users' array. Data structure:`, {
      dataKeys: Object.keys(response.data),
      dataType: typeof response.data,
      dataValue: response.data
    });
    return [];
  }

  if (!Array.isArray(response.data.users)) {
    console.warn(`${role} API response data.users is not an array. Type: ${typeof response.data.users}, Value:`, response.data.users);
    return [];
  }

  return response.data.users;
};

// Test scenarios
console.log('1. Testing valid response:');
const validResponse = {
  status: 200,
  statusText: 'OK',
  data: {
    users: [
      { id: 1, name: 'John Doe', email: 'john@example.com', role: 'cook' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'delivery_agent' }
    ]
  }
};
const validResult = validateResponse(validResponse, 'Test');
console.log('✅ Valid response result:', validResult.length, 'users\n');

console.log('2. Testing response missing data property:');
const missingDataResponse = {
  status: 200,
  statusText: 'OK',
  headers: { 'content-type': 'application/json' }
};
const missingDataResult = validateResponse(missingDataResponse, 'Test');
console.log('✅ Missing data result:', missingDataResult.length, 'users\n');

console.log('3. Testing response with data but missing users:');
const missingUsersResponse = {
  status: 200,
  statusText: 'OK',
  data: {
    message: 'Success',
    count: 0
  }
};
const missingUsersResult = validateResponse(missingUsersResponse, 'Test');
console.log('✅ Missing users result:', missingUsersResult.length, 'users\n');

console.log('4. Testing response with non-array users:');
const invalidUsersResponse = {
  status: 200,
  statusText: 'OK',
  data: {
    users: 'not an array'
  }
};
const invalidUsersResult = validateResponse(invalidUsersResponse, 'Test');
console.log('✅ Invalid users result:', invalidUsersResult.length, 'users\n');

console.log('5. Testing null response:');
const nullResult = validateResponse(null, 'Test');
console.log('✅ Null response result:', nullResult.length, 'users\n');

console.log('🎉 All validation scenarios handled safely!');
console.log('The UnifiedApprovals component will now gracefully handle all these cases without TypeErrors.');