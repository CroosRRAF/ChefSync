// import { useState } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { 
//   Search, 
//   Plus, 
//   Edit, 
//   Trash2, 
//   DollarSign,
//   Clock,
//   ChefHat
// } from "lucide-react";

// interface MenuItem {
//   id: string;
//   name: string;
//   description: string;
//   price: number;
//   category: string;
//   prepTime: number;
//   status: "active" | "pending" | "inactive";
// }

// export default function Menu() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
//   const [menuItems] = useState<MenuItem[]>([
//     {
//       id: "1",
//       name: "Truffle Pasta",
//       description: "Handmade pasta with black truffle and parmesan",
//       price: 28.50,
//       category: "Main Course",
//       prepTime: 25,
//       status: "active"
//     },
//     {
//       id: "2",
//       name: "Chef's Special Burger",
//       description: "Wagyu beef with caramelized onions and special sauce",
//       price: 24.00,
//       category: "Main Course",
//       prepTime: 20,
//       status: "active"
//     },
//     {
//       id: "3",
//       name: "Grilled Salmon",
//       description: "Atlantic salmon with herb butter and roasted vegetables",
//       price: 32.00,
//       category: "Main Course",
//       prepTime: 18,
//       status: "active"
//     },
//     {
//       id: "4",
//       name: "Chocolate Soufflé",
//       description: "Rich chocolate soufflé with vanilla ice cream",
//       price: 12.00,
//       category: "Dessert",
//       prepTime: 35,
//       status: "pending"
//     }
//   ]);

//   const filteredItems = menuItems.filter(item =>
//     item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     item.category.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   const handleAddFood = (event: React.FormEvent) => {
//     event.preventDefault();
//     // Handle form submission - send to admin for approval
//     setIsAddDialogOpen(false);
//     // Show success toast or notification
//   };

//   const getStatusBadge = (status: string) => {
//     switch (status) {
//       case "active":
//         return <Badge className="bg-green-100 text-green-800">Active</Badge>;
//       case "pending":
//         return <Badge variant="secondary">Pending Approval</Badge>;
//       case "inactive":
//         return <Badge variant="destructive">Inactive</Badge>;
//       default:
//         return <Badge variant="secondary">{status}</Badge>;
//     }
//   };

//   return (
//     <div className="p-6 space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold text-foreground">Menu Management</h1>
//           <p className="text-muted-foreground mt-1">Manage your delicious creations</p>
//         </div>
        
//         <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
//           <DialogTrigger asChild>
//             <Button className="bg-primary hover:bg-primary/90">
//               <Plus className="h-4 w-4 mr-2" />
//               Add New Food
//             </Button>
//           </DialogTrigger>
//           <DialogContent className="sm:max-w-[600px]">
//             <DialogHeader>
//               <DialogTitle>Add New Food Item</DialogTitle>
//             </DialogHeader>
//             <form onSubmit={handleAddFood} className="space-y-4">
//               <div className="grid grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="name">Food Name</Label>
//                   <Input id="name" placeholder="Enter food name" required />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="category">Category</Label>
//                   <Input id="category" placeholder="e.g., Main Course, Dessert" required />
//                 </div>
//               </div>
              
//               <div className="space-y-2">
//                 <Label htmlFor="description">Description</Label>
//                 <Textarea id="description" placeholder="Describe your dish..." required />
//               </div>
              
//               <div className="grid grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="price">Price ($)</Label>
//                   <Input id="price" type="number" step="0.01" placeholder="0.00" required />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="prepTime">Prep Time (minutes)</Label>
//                   <Input id="prepTime" type="number" placeholder="15" required />
//                 </div>
//               </div>
              
//               <div className="flex justify-end gap-3 pt-4">
//                 <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
//                   Cancel
//                 </Button>
//                 <Button type="submit">Submit for Approval</Button>
//               </div>
//             </form>
//           </DialogContent>
//         </Dialog>
//       </div>

//       <Card className="chef-card">
//         <CardHeader>
//           <div className="flex items-center justify-between">
//             <CardTitle className="flex items-center gap-2">
//               <ChefHat className="h-5 w-5 text-primary" />
//               Your Menu Items
//             </CardTitle>
//             <div className="relative w-64">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
//               <Input
//                 placeholder="Search menu items..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="pl-10"
//               />
//             </div>
//           </div>
//         </CardHeader>
//         <CardContent>
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Food Name</TableHead>
//                 <TableHead>Category</TableHead>
//                 <TableHead>Description</TableHead>
//                 <TableHead>Price</TableHead>
//                 <TableHead>Prep Time</TableHead>
//                 <TableHead>Status</TableHead>
//                 <TableHead className="text-right">Actions</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {filteredItems.map((item) => (
//                 <TableRow key={item.id}>
//                   <TableCell className="font-medium">{item.name}</TableCell>
//                   <TableCell>{item.category}</TableCell>
//                   <TableCell className="max-w-xs truncate">{item.description}</TableCell>
//                   <TableCell>
//                     <div className="flex items-center gap-1">
//                       <DollarSign className="h-3 w-3" />
//                       {item.price.toFixed(2)}
//                     </div>
//                   </TableCell>
//                   <TableCell>
//                     <div className="flex items-center gap-1">
//                       <Clock className="h-3 w-3" />
//                       {item.prepTime} min
//                     </div>
//                   </TableCell>
//                   <TableCell>{getStatusBadge(item.status)}</TableCell>
//                   <TableCell className="text-right">
//                     <div className="flex items-center justify-end gap-2">
//                       <Button variant="ghost" size="sm">
//                         <Edit className="h-4 w-4" />
//                       </Button>
//                       <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
//                         <Trash2 className="h-4 w-4" />
//                       </Button>
//                     </div>
//                   </TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }


import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign,
  Clock,
  ChefHat
} from "lucide-react";

// Interface matches your Django Food model with FoodPrice
interface FoodPrice {
  price_id: number;
  size: string;
  price: string;
  image_url?: string;
  food: number;
  cook: number;
  created_at: string;
  updated_at: string;
}

interface MenuItem {
  food_id: number;
  name: string;
  description: string;
  category: string;
  status: string;
  preparation_time: number;
  chef: number;
  chef_name: string;
  prices: FoodPrice[];
  ingredients: string[];
  is_vegetarian: boolean;
  is_vegan: boolean;
  spice_level: string;
  rating_average: string;
  total_reviews: number;
  total_orders: number;
}

export default function Menu() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch approved foods from backend
  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await axios.get("http://127.0.0.1:8000/api/food/foods/", {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        // Ensure response.data is an array
        const foodData = Array.isArray(response.data) ? response.data : response.data?.results || [];
        setMenuItems(foodData);
      } catch (error) {
        console.error("Error fetching foods:", error);
        setMenuItems([]); // Ensure menuItems is always an array
      } finally {
        setLoading(false);
      }
    };
    fetchFoods();
  }, []);

  const filteredItems = (Array.isArray(menuItems) ? menuItems : []).filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddFood = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newFood = {
      name: formData.get("name") as string,
      category: formData.get("category") as string,
      description: formData.get("description") as string,
      ingredients: formData.get("ingredients") as string || "",
      preparation_time: parseInt(formData.get("prepTime") as string, 10),
      is_vegetarian: formData.get("is_vegetarian") === "on",
      is_vegan: formData.get("is_vegan") === "on",
      spice_level: formData.get("spice_level") as string || "",
      is_available: true,
    };

    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post("http://127.0.0.1:8000/api/food/foods/", newFood, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Show success message
      alert(response.data.message || "Your food item has been submitted for admin approval");
      
      // Reset form and close dialog
      setIsAddDialogOpen(false);
      event.currentTarget.reset();
      
      // No need to add to menuItems since it won't show until approved
    } catch (error) {
      console.error("Error adding food:", error);
      alert("Error submitting food item. Please try again.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending Approval</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status || 'Unknown'}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Menu Management</h1>
          <p className="text-muted-foreground mt-1">Manage your delicious creations</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add New Food
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Food Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddFood} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Food Name</Label>
                  <Input id="name" name="name" placeholder="Enter food name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" name="category" placeholder="e.g., Main Course, Dessert" required />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="Describe your dish..." required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ingredients">Ingredients</Label>
                <Textarea id="ingredients" name="ingredients" placeholder="List the main ingredients..." />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prepTime">Prep Time (minutes)</Label>
                  <Input id="prepTime" name="prepTime" type="number" placeholder="15" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="spice_level">Spice Level</Label>
                  <select id="spice_level" name="spice_level" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                    <option value="">Select spice level</option>
                    <option value="mild">Mild</option>
                    <option value="medium">Medium</option>
                    <option value="hot">Hot</option>
                    <option value="very_hot">Very Hot</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <input id="is_vegetarian" name="is_vegetarian" type="checkbox" className="h-4 w-4" />
                  <Label htmlFor="is_vegetarian" className="text-sm">Vegetarian</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input id="is_vegan" name="is_vegan" type="checkbox" className="h-4 w-4" />
                  <Label htmlFor="is_vegan" className="text-sm">Vegan</Label>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Submit for Approval</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="chef-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-primary" />
              Your Menu Items
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Loading menu items...</p>
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No menu items found</p>
              <p className="text-sm text-muted-foreground mt-2">
                {searchTerm ? "Try adjusting your search terms" : "Add your first food item to get started"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Food Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Prep Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.food_id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {item.prices && item.prices.length > 0 ? (
                          item.prices.map((price) => (
                            <div key={price.price_id} className="flex items-center gap-1 text-sm">
                              <DollarSign className="h-3 w-3" />
                              <span>{price.size}: ${parseFloat(price.price).toFixed(2)}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-muted-foreground">No prices set</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {item.preparation_time} min
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
