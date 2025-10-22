import React, { useState } from 'react';
import { DeliveryAddress } from '@/services/addressService';
import { MapPin, Plus, Edit2, CheckCircle } from 'lucide-react';
import { AddressManagementModal } from './AddressManagementModal';

interface AddressSelectorProps {
  selectedAddress: DeliveryAddress | null;
  addresses: DeliveryAddress[];
  isLoading: boolean;
  onAddressSelect: (address: DeliveryAddress) => void;
  onAddressesChange: (addresses: DeliveryAddress[]) => void;
  onAddAddress: () => void;
  deliveryInstructions: string;
  onDeliveryInstructionsChange: (instructions: string) => void;
}

export const AddressSelector: React.FC<AddressSelectorProps> = ({
  selectedAddress,
  addresses,
  isLoading,
  onAddressSelect,
  onAddressesChange,
  onAddAddress,
  deliveryInstructions,
  onDeliveryInstructionsChange,
}) => {
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showAllAddresses, setShowAllAddresses] = useState(false);
  const [editingAddress, setEditingAddress] = useState<DeliveryAddress | null>(null);

  const handleAddNewAddress = () => {
    setEditingAddress(null);
    setShowAddressModal(true);
  };

  const handleEditAddress = (address: DeliveryAddress) => {
    setEditingAddress(address);
    setShowAddressModal(true);
  };

  const handleAddressSaved = (newAddress: DeliveryAddress) => {
    if (editingAddress) {
      // Update existing address
      const updatedAddresses = addresses.map(addr =>
        addr.id === newAddress.id ? newAddress : addr
      );
      onAddressesChange(updatedAddresses);
      if (selectedAddress?.id === newAddress.id) {
        onAddressSelect(newAddress);
      }
    } else {
      // Add new address
      onAddressesChange([...addresses, newAddress]);
      onAddressSelect(newAddress);
    }
    setShowAddressModal(false);
    setEditingAddress(null);
  };

  const handleAddressDeleted = (deletedId: number) => {
    const updatedAddresses = addresses.filter(addr => addr.id !== deletedId);
    onAddressesChange(updatedAddresses);
    
    // If deleted address was selected, select another one
    if (selectedAddress?.id === deletedId) {
      if (updatedAddresses.length > 0) {
        onAddressSelect(updatedAddresses[0]);
      } else {
        onAddressSelect(null);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            <MapPin className="w-5 h-5 inline-block mr-2 text-green-600" />
            Delivery Address
          </h3>
          <button
            onClick={onAddAddress}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New
          </button>
        </div>

        {addresses.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No addresses saved yet</p>
            <button
              onClick={handleAddNewAddress}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Add Your First Address
            </button>
          </div>
        ) : (
          <>
            {/* Selected Address Card */}
            {selectedAddress && (
              <div className="border-2 border-green-600 rounded-lg p-4 mb-4 bg-green-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 bg-green-600 text-white text-sm font-medium rounded">
                        {selectedAddress.label}
                      </span>
                      {selectedAddress.is_default && (
                        <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-gray-900 font-medium">
                      {selectedAddress.address_line1}
                    </p>
                    {selectedAddress.address_line2 && (
                      <p className="text-gray-600">{selectedAddress.address_line2}</p>
                    )}
                    <p className="text-gray-600">
                      {selectedAddress.city}, {selectedAddress.pincode}
                    </p>
                  </div>
                  <button
                    onClick={() => handleEditAddress(selectedAddress)}
                    className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Change Address Button */}
            {addresses.length > 1 && (
              <button
                onClick={() => setShowAllAddresses(!showAllAddresses)}
                className="w-full py-2 text-green-600 font-medium hover:bg-green-50 rounded-lg transition-colors"
              >
                {showAllAddresses ? 'Hide Other Addresses' : 'Change Address'}
              </button>
            )}

            {/* All Addresses List */}
            {showAllAddresses && (
              <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
                {addresses
                  .filter(addr => addr.id !== selectedAddress?.id)
                  .map(address => (
                    <div
                      key={address.id}
                      onClick={() => {
                        onAddressSelect(address);
                        setShowAllAddresses(false);
                      }}
                      className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-green-600 hover:bg-green-50 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded">
                              {address.label}
                            </span>
                            {address.is_default && (
                              <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-gray-900 font-medium">
                            {address.address_line1}
                          </p>
                          {address.address_line2 && (
                            <p className="text-gray-600 text-sm">{address.address_line2}</p>
                          )}
                          <p className="text-gray-600 text-sm">
                            {address.city}, {address.pincode}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditAddress(address);
                          }}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Address Management Modal */}
      {showAddressModal && (
        <AddressManagementModal
          address={editingAddress}
          onClose={() => {
            setShowAddressModal(false);
            setEditingAddress(null);
          }}
          onSave={handleAddressSaved}
          onDelete={handleAddressDeleted}
        />
      )}
    </>
  );
};


