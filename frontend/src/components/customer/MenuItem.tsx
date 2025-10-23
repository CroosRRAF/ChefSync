import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { Plus, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MenuItemProps {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  rating: number;
  chef: {
    id: string;
    name: string;
    avatarUrl: string;
  };
}

const MenuItem: React.FC<MenuItemProps> = ({ id, name, description, price, imageUrl, rating, chef }) => {
  const navigate = useNavigate();

  const handleChefClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Ensure chef.id is valid before navigating
    const chefId = typeof chef.id === 'object' ? (chef.id as any).id || (chef.id as any).chef_id : chef.id;
    
    if (!chefId) {
      console.error('MenuItem: Invalid chef ID', chef);
      return;
    }
    
    console.log('MenuItem: Navigating to chef', { chefId, type: typeof chefId });
    navigate(`/chef/${chefId}`);
  };

  const handleCardClick = () => {
    // Navigate to item details page, for now just log
    console.log(`Navigate to item ${id}`);
  };

  return (
    <motion.div
      className="bg-card rounded-2xl shadow-md overflow-hidden group border border-transparent hover:border-primary transition-all duration-300 cursor-pointer"
      onClick={handleCardClick}
      layout
    >
      <div className="relative">
        <img src={imageUrl} alt={name} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-bold flex items-center gap-1">
          <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
          <span>{rating.toFixed(1)}</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/80 to-transparent"></div>
        <div 
          className="absolute bottom-2 left-3 flex items-center gap-2 cursor-pointer"
          onClick={handleChefClick}
        >
          <Avatar className="h-9 w-9 border-2 border-primary">
            <AvatarImage src={chef.avatarUrl} alt={chef.name} />
            <AvatarFallback>{chef.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white text-sm font-bold">{chef.name}</p>
            <p className="text-white/80 text-xs">View Profile</p>
          </div>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-bold text-foreground truncate">{name}</h3>
        <p className="text-sm text-muted-foreground h-10 text-ellipsis overflow-hidden">{description}</p>
        
        <div className="flex justify-between items-center mt-4">
          <p className="text-2xl font-extrabold text-primary">${price.toFixed(2)}</p>
          <Button size="icon" className="rounded-full h-10 w-10">
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default MenuItem;
