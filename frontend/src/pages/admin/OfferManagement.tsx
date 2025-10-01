import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import axios from "axios";
import { Edit, Plus, RefreshCw, Tag, Trash2 } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

interface Offer {
  offer_id: number;
  description: string;
  discount: number;
  valid_until: string;
  price: number;
  created_at: string;
}

interface OfferFormData {
  description: string;
  discount: string;
  valid_until: string;
  price: string;
}

/**
 * Offer Management Component
 *
 * Features:
 * - View all offers
 * - Create new offers
 * - Edit existing offers
 * - Delete offers
 * - View offer statistics
 */

const OfferManagement: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [formData, setFormData] = useState<OfferFormData>({
    description: "",
    discount: "",
    valid_until: "",
    price: "",
  });

  // Load offers
  const loadOffers = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(`${API_BASE_URL}/food/offers/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setOffers(response.data.results || response.data || []);
    } catch (error) {
      console.error("Error loading offers:", error);
      toast({
        title: "Error",
        description: "Failed to load offers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  // Create offer
  const handleCreateOffer = async () => {
    try {
      const token = localStorage.getItem("access_token");
      await axios.post(
        `${API_BASE_URL}/food/offers/`,
        {
          description: formData.description,
          discount: parseFloat(formData.discount),
          valid_until: formData.valid_until,
          price: parseInt(formData.price),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast({
        title: "Success",
        description: "Offer created successfully",
      });
      setShowCreateDialog(false);
      setFormData({
        description: "",
        discount: "",
        valid_until: "",
        price: "",
      });
      loadOffers(true);
    } catch (error) {
      console.error("Error creating offer:", error);
      toast({
        title: "Error",
        description: "Failed to create offer",
        variant: "destructive",
      });
    }
  };

  // Update offer
  const handleUpdateOffer = async () => {
    if (!selectedOffer) return;

    try {
      const token = localStorage.getItem("access_token");
      await axios.put(
        `${API_BASE_URL}/food/offers/${selectedOffer.offer_id}/`,
        {
          description: formData.description,
          discount: parseFloat(formData.discount),
          valid_until: formData.valid_until,
          price: parseInt(formData.price),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast({
        title: "Success",
        description: "Offer updated successfully",
      });
      setShowEditDialog(false);
      setSelectedOffer(null);
      setFormData({
        description: "",
        discount: "",
        valid_until: "",
        price: "",
      });
      loadOffers(true);
    } catch (error) {
      console.error("Error updating offer:", error);
      toast({
        title: "Error",
        description: "Failed to update offer",
        variant: "destructive",
      });
    }
  };

  // Delete offer
  const handleDeleteOffer = async (offerId: number) => {
    if (!confirm("Are you sure you want to delete this offer?")) return;

    try {
      const token = localStorage.getItem("access_token");
      await axios.delete(`${API_BASE_URL}/food/offers/${offerId}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast({
        title: "Success",
        description: "Offer deleted successfully",
      });
      loadOffers(true);
    } catch (error) {
      console.error("Error deleting offer:", error);
      toast({
        title: "Error",
        description: "Failed to delete offer",
        variant: "destructive",
      });
    }
  };

  // Open edit dialog
  const handleEditClick = (offer: Offer) => {
    setSelectedOffer(offer);
    setFormData({
      description: offer.description,
      discount: offer.discount.toString(),
      valid_until: offer.valid_until,
      price: offer.price.toString(),
    });
    setShowEditDialog(true);
  };

  // Check if offer is expired
  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date();
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Calculate statistics
  const stats = {
    total: offers.length,
    active: offers.filter((o) => !isExpired(o.valid_until)).length,
    expired: offers.filter((o) => isExpired(o.valid_until)).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Offer Management</h2>
          <p className="text-muted-foreground mt-1">
            Manage special offers and discounts
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => loadOffers()} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateDialog(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Offer
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Offers</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Offers</CardTitle>
            <Tag className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Expired Offers
            </CardTitle>
            <Tag className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.expired}</div>
          </CardContent>
        </Card>
      </div>

      {/* Offers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Offers</CardTitle>
        </CardHeader>
        <CardContent>
          {offers.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No offers yet</p>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="mt-4"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Offer
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers.map((offer) => (
                  <TableRow key={offer.offer_id}>
                    <TableCell className="font-medium max-w-md">
                      {offer.description}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">{offer.discount}% OFF</Badge>
                    </TableCell>
                    <TableCell>{formatDate(offer.valid_until)}</TableCell>
                    <TableCell>
                      {isExpired(offer.valid_until) ? (
                        <Badge variant="destructive">Expired</Badge>
                      ) : (
                        <Badge variant="default" className="bg-green-500">
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(offer.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(offer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteOffer(offer.offer_id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
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

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Offer</DialogTitle>
            <DialogDescription>
              Create a new discount offer for food items
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="e.g., Summer Special - 20% off all pizzas"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount">Discount (%)</Label>
              <Input
                id="discount"
                type="number"
                min="0"
                max="100"
                placeholder="e.g., 20"
                value={formData.discount}
                onChange={(e) =>
                  setFormData({ ...formData, discount: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valid_until">Valid Until</Label>
              <Input
                id="valid_until"
                type="date"
                value={formData.valid_until}
                onChange={(e) =>
                  setFormData({ ...formData, valid_until: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Food Price ID</Label>
              <Input
                id="price"
                type="number"
                placeholder="e.g., 1"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Enter the ID of the food price this offer applies to
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateOffer}>
              <Plus className="h-4 w-4 mr-2" />
              Create Offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Offer</DialogTitle>
            <DialogDescription>Update offer details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_description">Description</Label>
              <Textarea
                id="edit_description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_discount">Discount (%)</Label>
              <Input
                id="edit_discount"
                type="number"
                min="0"
                max="100"
                value={formData.discount}
                onChange={(e) =>
                  setFormData({ ...formData, discount: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_valid_until">Valid Until</Label>
              <Input
                id="edit_valid_until"
                type="date"
                value={formData.valid_until}
                onChange={(e) =>
                  setFormData({ ...formData, valid_until: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_price">Food Price ID</Label>
              <Input
                id="edit_price"
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateOffer}>
              <Edit className="h-4 w-4 mr-2" />
              Update Offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OfferManagement;
