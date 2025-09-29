import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Box, Search, Filter, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/header";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInventorySchema } from "@shared/schema";
import type { Inventory, InsertInventory } from "@shared/schema";
import { z } from "zod";

const createInventorySchema = z.object({
  productName: z.string().min(1, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  quantity: z.string().min(1, "Quantity is required"),
  unitCost: z.string().min(1, "Unit cost is required"),
  sellingPrice: z.string().min(1, "Selling price is required"),
  lowStockThreshold: z.string().min(1, "Low stock threshold is required"),
});

type CreateInventoryForm = z.infer<typeof createInventorySchema>;

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Inventory | null>(null);
  const [stockStatusFilters, setStockStatusFilters] = useState<string[]>(["in-stock", "low-stock", "out-of-stock"]);
  const { toast } = useToast();

  const form = useForm<CreateInventoryForm>({
    resolver: zodResolver(createInventorySchema),
    defaultValues: {
      productName: "",
      sku: "",
      quantity: "",
      unitCost: "",
      sellingPrice: "",
      lowStockThreshold: "",
    },
  });

  const editForm = useForm<CreateInventoryForm>({
    resolver: zodResolver(createInventorySchema),
    defaultValues: {
      productName: "",
      sku: "",
      quantity: "",
      unitCost: "",
      sellingPrice: "",
      lowStockThreshold: "",
    },
  });

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ["/api/inventory"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/inventory");
      return response.json() as Promise<Inventory[]>;
    },
  });

  const createInventoryMutation = useMutation({
    mutationFn: async (data: CreateInventoryForm) => {
      const payload = {
        ...data,
        quantity: parseInt(data.quantity),
        unitCost: data.unitCost,
        sellingPrice: data.sellingPrice,
        lowStockThreshold: parseInt(data.lowStockThreshold),
      };
      const response = await apiRequest("POST", "/api/inventory", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      setIsCreateModalOpen(false);
      form.reset();
      toast({
        title: "Item created",
        description: "Inventory item has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create inventory item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateInventoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CreateInventoryForm }) => {
      const payload = {
        ...data,
        quantity: parseInt(data.quantity),
        unitCost: data.unitCost,
        sellingPrice: data.sellingPrice,
        lowStockThreshold: parseInt(data.lowStockThreshold),
      };
      const response = await apiRequest("PUT", `/api/inventory/${id}`, payload);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update inventory item");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      setIsEditModalOpen(false);
      setEditingItem(null);
      editForm.reset();
      toast({
        title: "Item updated",
        description: "Inventory item has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateInventoryForm) => {
    createInventoryMutation.mutate(data);
  };

  const onEditSubmit = (data: CreateInventoryForm) => {
    if (!editingItem) return;
    updateInventoryMutation.mutate({ id: editingItem.id, data });
  };

  const openEditModal = (item: Inventory) => {
    setEditingItem(item);
    editForm.reset({
      productName: item.productName,
      sku: item.sku,
      quantity: item.quantity.toString(),
      unitCost: item.unitCost,
      sellingPrice: item.sellingPrice,
      lowStockThreshold: item.lowStockThreshold.toString(),
    });
    setIsEditModalOpen(true);
  };

  const getStockStatus = (quantity: number, threshold: number) => {
    if (quantity === 0) return { label: "Out of Stock", color: "bg-red-100 text-red-800" };
    if (quantity <= threshold) return { label: "Low Stock", color: "bg-yellow-100 text-yellow-800" };
    return { label: "In Stock", color: "bg-green-100 text-green-800" };
  };

  const getStockStatusKey = (quantity: number, threshold: number): string => {
    if (quantity === 0) return "out-of-stock";
    if (quantity <= threshold) return "low-stock";
    return "in-stock";
  };

  const toggleStockStatusFilter = (status: string) => {
    setStockStatusFilters(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const stockStatus = getStockStatusKey(item.quantity, item.lowStockThreshold);
    const matchesStatus = stockStatusFilters.includes(stockStatus);
    return matchesSearch && matchesStatus;
  });

  const lowStockItems = inventory.filter(item => item.quantity <= item.lowStockThreshold);

  return (
    <div className="flex-1 flex flex-col">
      <Header 
        title="Inventory" 
        description="Manage stock levels and product information" 
      />
      
      <div className="flex-1 p-6 space-y-6">
        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <h3 className="font-medium text-yellow-800">
                  {lowStockItems.length} item(s) running low on stock
                </h3>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                Items need restocking: {lowStockItems.map(item => item.productName).join(", ")}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Actions and Search */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
                data-testid="input-search-inventory"
              />
            </div>
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" data-testid="button-filter-inventory">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                  {stockStatusFilters.length < 3 && (
                    <Badge variant="secondary" className="ml-2">
                      {stockStatusFilters.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" data-testid="popover-filter-inventory">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-3">Filter by Stock Status</h4>
                    <div className="space-y-2">
                      {[
                        { value: "in-stock", label: "In Stock" },
                        { value: "low-stock", label: "Low Stock" },
                        { value: "out-of-stock", label: "Out of Stock" }
                      ].map((status) => (
                        <div key={status.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`filter-${status.value}`}
                            checked={stockStatusFilters.includes(status.value)}
                            onCheckedChange={() => toggleStockStatusFilter(status.value)}
                            data-testid={`checkbox-filter-${status.value}`}
                          />
                          <Label
                            htmlFor={`filter-${status.value}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {status.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStockStatusFilters(["in-stock", "low-stock", "out-of-stock"])}
                      data-testid="button-reset-filters"
                    >
                      Reset
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setIsFilterOpen(false)}
                      data-testid="button-apply-filters"
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} data-testid="button-add-item">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>

        {/* Inventory Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Box className="w-5 h-5 mr-2" />
              Inventory ({filteredInventory.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading inventory...</p>
              </div>
            ) : filteredInventory.length === 0 ? (
              <div className="text-center py-8">
                <Box className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No inventory items found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "No items match your search criteria" : "Get started by adding your first inventory item"}
                </p>
                {!searchTerm && (
                  <Button className="mt-4" onClick={() => setIsCreateModalOpen(true)} data-testid="button-add-first-item">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Item
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead>Selling Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item) => {
                    const status = getStockStatus(item.quantity, item.lowStockThreshold);
                    
                    return (
                      <TableRow key={item.id} data-testid={`row-inventory-${item.id}`}>
                        <TableCell className="font-medium" data-testid={`text-product-${item.id}`}>
                          {item.productName}
                        </TableCell>
                        <TableCell data-testid={`text-sku-${item.id}`}>
                          {item.sku}
                        </TableCell>
                        <TableCell data-testid={`text-quantity-${item.id}`}>
                          {item.quantity}
                        </TableCell>
                        <TableCell data-testid={`text-cost-${item.id}`}>
                          ${parseFloat(item.unitCost).toFixed(2)}
                        </TableCell>
                        <TableCell data-testid={`text-price-${item.id}`}>
                          ${parseFloat(item.sellingPrice).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge className={status.color} data-testid={`badge-status-${item.id}`}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openEditModal(item)}
                            data-testid={`button-edit-item-${item.id}`}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Item Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl" data-testid="modal-create-item">
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="productName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter product name" {...field} data-testid="input-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter SKU" {...field} data-testid="input-sku" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity *</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} data-testid="input-quantity" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lowStockThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Low Stock Threshold *</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="10" {...field} data-testid="input-threshold" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="unitCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Cost *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-cost" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sellingPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selling Price *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-price" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createInventoryMutation.isPending}
                  data-testid="button-save"
                >
                  {createInventoryMutation.isPending ? "Creating..." : "Create Item"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Inventory Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md" data-testid="modal-edit-inventory">
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="productName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter product name" {...field} data-testid="input-edit-product-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter SKU" {...field} data-testid="input-edit-sku" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity *</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} data-testid="input-edit-quantity" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="lowStockThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Low Stock Threshold *</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="10" {...field} data-testid="input-edit-threshold" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="unitCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Cost *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-edit-cost" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="sellingPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selling Price *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-edit-price" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateInventoryMutation.isPending}
                  data-testid="button-update-item"
                >
                  {updateInventoryMutation.isPending ? "Updating..." : "Update Item"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
