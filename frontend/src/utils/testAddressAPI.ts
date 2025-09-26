import { addressService } from '@/services/addressService';

export const testAddressAPI = async () => {
  console.log('Testing Address API...');
  
  try {
    // Test getting addresses
    console.log('1. Testing getAddresses...');
    const addresses = await addressService.getAddresses();
    console.log('✅ getAddresses success:', addresses);
    
    // Test creating a new address
    console.log('2. Testing createAddress...');
    const newAddress = await addressService.createAddress({
      label: 'Test Address',
      address_line1: '123 Test Street',
      city: 'Colombo',
      pincode: '00100',
      latitude: 6.9271,
      longitude: 79.8612,
      is_default: false
    });
    console.log('✅ createAddress success:', newAddress);
    
    // Test updating the address
    console.log('3. Testing updateAddress...');
    const updatedAddress = await addressService.updateAddress({
      id: newAddress.id,
      label: 'Updated Test Address',
      address_line1: '123 Updated Test Street',
      city: 'Colombo',
      pincode: '00100',
      latitude: 6.9271,
      longitude: 79.8612,
      is_default: false
    });
    console.log('✅ updateAddress success:', updatedAddress);
    
    // Test setting as default
    console.log('4. Testing setDefaultAddress...');
    await addressService.setDefaultAddress(newAddress.id);
    console.log('✅ setDefaultAddress success');
    
    // Test deleting the address
    console.log('5. Testing deleteAddress...');
    await addressService.deleteAddress(newAddress.id);
    console.log('✅ deleteAddress success');
    
    console.log('🎉 All Address API tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Address API test failed:', error);
    return false;
  }
};

// Export for use in browser console
(window as any).testAddressAPI = testAddressAPI;
