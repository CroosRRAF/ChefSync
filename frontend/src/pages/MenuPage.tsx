import React, { useState } from 'react';
import EnhancedMenuPage from '@/components/menu/EnhancedMenuPage';
import CustomerBulkOrderDashboard from '@/components/customer/CustomerBulkOrderDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UtensilsCrossed, Package } from 'lucide-react';

const MenuPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('regular');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Menu Type Tabs - Positioned below navbar */}
      <div className="fixed top-16 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full sm:w-auto grid grid-cols-2 h-14 bg-gray-100 dark:bg-gray-700">
              <TabsTrigger 
                value="regular" 
                className="flex items-center justify-center gap-2 text-base font-semibold data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all"
              >
                <UtensilsCrossed className="h-5 w-5" />
                <span>Regular Menu</span>
              </TabsTrigger>
              <TabsTrigger 
                value="bulk" 
                className="flex items-center justify-center gap-2 text-base font-semibold data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all"
              >
                <Package className="h-5 w-5" />
                <span>Bulk Orders</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content Area - Add top padding to account for fixed tabs */}
      <div className="pt-28">
        {activeTab === 'regular' ? (
          <EnhancedMenuPage />
        ) : (
          <div className="max-w-7xl mx-auto px-4">
            <CustomerBulkOrderDashboard />
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuPage;
