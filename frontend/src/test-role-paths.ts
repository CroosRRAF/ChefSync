// Test file to check role-based path function
import { getRoleBasedPath } from './context/AuthContext';

console.log('Testing role-based paths:');
console.log('admin (lowercase):', getRoleBasedPath('admin'));
console.log('Admin (capitalized):', getRoleBasedPath('Admin'));
console.log('customer:', getRoleBasedPath('customer'));
console.log('cook:', getRoleBasedPath('cook'));
console.log('delivery_agent:', getRoleBasedPath('delivery_agent'));
console.log('DeliveryAgent:', getRoleBasedPath('DeliveryAgent'));

export {};