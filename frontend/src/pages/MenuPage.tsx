import React, { useState } from 'react';
import MenuItem from '@/components/customer/MenuItem';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';

// Expanded mock data with ratings and categories
const sampleMenuItems = [
  {
    id: '1',
    name: 'Spicy Chicken Kottu',
    description: 'Shredded roti, chicken, and spices.',
    price: 12.99,
    imageUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80',
    rating: 4.7,
    category: 'Sri Lankan',
    chef: { id: 'chef1', name: 'Chef Nimal', avatarUrl: 'https://i.pravatar.cc/40?u=chef1' },
  },
  {
    id: '2',
    name: 'Seafood Fried Rice',
    description: 'Fragrant rice with prawns and calamari.',
    price: 15.50,
    imageUrl: 'https://images.unsplash.com/photo-1512058564366-185109023977?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80',
    rating: 4.9,
    category: 'Asian',
    chef: { id: 'chef2', name: 'Chef Priya', avatarUrl: 'https://i.pravatar.cc/40?u=chef2' },
  },
  {
    id: '3',
    name: 'Lamprais',
    description: 'Rice boiled in stock, wrapped in banana leaf.',
    price: 18.00,
    imageUrl: 'https://images.unsplash.com/photo-1606851094655-b25931af2931?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80',
    rating: 4.8,
    category: 'Sri Lankan',
    chef: { id: 'chef1', name: 'Chef Nimal', avatarUrl: 'https://i.pravatar.cc/40?u=chef1' },
  },
  {
    id: '4',
    name: 'Hoppers with Dhal',
    description: 'Crispy, bowl-shaped fermented pancakes.',
    price: 9.99,
    imageUrl: 'https://images.unsplash.com/photo-1626202379222-a77a727cb992?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80',
    rating: 4.6,
    category: 'Breakfast',
    chef: { id: 'chef3', name: 'Chef Kumar', avatarUrl: 'https://i.pravatar.cc/40?u=chef3' },
  },
  {
    id: '5',
    name: 'Watalappan',
    description: 'Rich coconut custard with jaggery.',
    price: 7.50,
    imageUrl: 'https://images.unsplash.com/photo-1542826438-c2e24de4a79d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80',
    rating: 4.9,
    category: 'Dessert',
    chef: { id: 'chef2', name: 'Chef Priya', avatarUrl: 'https://i.pravatar.cc/40?u=chef2' },
  },
  {
    id: '6',
    name: 'Fish Ambul Thiyal',
    description: 'Sour and spicy slow-cooked fish curry.',
    price: 16.75,
    imageUrl: 'https://images.unsplash.com/photo-1598515214211-89d3c72732b2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80',
    rating: 4.8,
    category: 'Sri Lankan',
    chef: { id: 'chef3', name: 'Chef Kumar', avatarUrl: 'https://i.pravatar.cc/40?u=chef3' },
  },
  {
    id: '7',
    name: 'Pol Sambol',
    description: 'Zesty coconut relish with chili and lime.',
    price: 4.99,
    imageUrl: 'https://images.unsplash.com/photo-1604147706283-d7119b5b822c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80',
    rating: 4.5,
    category: 'Sides',
    chef: { id: 'chef1', name: 'Chef Nimal', avatarUrl: 'https://i.pravatar.cc/40?u=chef1' },
  },
  {
    id: '8',
    name: 'String Hoppers',
    description: 'Steamed rice flour noodle nests.',
    price: 10.50,
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-7e4293c023df?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80',
    rating: 4.7,
    category: 'Breakfast',
    chef: { id: 'chef2', name: 'Chef Priya', avatarUrl: 'https://i.pravatar.cc/40?u=chef2' },
  },
];

const categories = ['All', 'Sri Lankan', 'Asian', 'Breakfast', 'Dessert', 'Sides'];

const MenuPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = sampleMenuItems.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-28">
        <header className="text-center mb-12">
          <motion.h1 
            className="text-5xl md:text-7xl font-extrabold text-foreground tracking-tighter mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Find Your <span className="text-primary">Craving</span>
          </motion.h1>
          <motion.p 
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            From local classics to global flavors, curated by the best home chefs.
          </motion.p>
        </header>
        
        <div className="sticky top-[80px] z-40 bg-background/80 backdrop-blur-lg py-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-grow w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search for dishes..." 
                className="pl-10 h-12 text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="lg" className="h-12 w-full sm:w-auto">
              <SlidersHorizontal className="h-5 w-5 mr-2" />
              Filters
            </Button>
          </div>
          
          <div className="mt-6 overflow-x-auto pb-2 -mx-4 px-4">
            <div className="flex space-x-2">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={activeCategory === category ? 'default' : 'outline'}
                  className="rounded-full px-6 py-2 whitespace-nowrap"
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10"
          layout
        >
          {filteredItems.map((item) => (
            <MenuItem key={item.id} {...item} />
          ))}
        </motion.div>
        {filteredItems.length === 0 && (
          <div className="text-center col-span-full py-20">
            <h3 className="text-2xl font-bold">No Dishes Found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuPage;
