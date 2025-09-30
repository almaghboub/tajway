import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Box, Search, Filter, AlertTriangle, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
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

type CreateInventoryForm = {
  productName: string;
  sku: string;
  quantity: string;
  unitCost: string;
  sellingPrice: string;
  lowStockThreshold: string;
};

export default function Inventory() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Inventory | null>(null);
  const [deletingItem, setDeletingItem] = useState<Inventory | null>(null);
  const [stockStatusFilters, setStockStatusFilters] = useState<string[]>(["in-stock", "low-stock", "out-of-stock"]);
  const { toast } = useToast();

  const createInventorySchema = z.object({
    productName: z.string().min(1, t('productNameValidation')),
    sku: z.string().min(1, t('skuValidation')),
    quantity: z.string().min(1, t('quantityValidation')),
    unitCost: z.string().min(1, t('unitCostValidation')),
    sellingPrice: z.string().min(1, t('sellingPriceValidation')),
    lowStockThreshold: z.string().min(1, t('lowStockThresholdValidation')),
  });

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
        title: t('itemCreated'),
        description: t('itemCreatedSuccess'),
      });
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('failedCreateItem'),
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
        throw new Error(error.message || t('failedUpdateItem'));
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      setIsEditModalOpen(false);
      setEditingItem(null);
      editForm.reset();
      toast({
        title: t('itemUpdated'),
        description: t('itemUpdatedSuccess'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteInventoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/inventory/${id}`);
      if (!response.ok) {
        throw new Error(t('failedDeleteItem'));
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({
        title: t('itemDeleted'),
        description: t('itemDeletedSuccess'),
      });
      setIsDeleteDialogOpen(false);
      setDeletingItem(null);
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('failedDeleteItem'),
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

  const openDeleteDialog = (item: Inventory) => {
    setDeletingItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (!deletingItem) return;
    deleteInventoryMutation.mutate(deletingItem.id);
  };

  const getStockStatus = (quantity: number, threshold: number) => {
    if (quantity === 0) return { label: t('outOfStock'), color: "bg-red-100 text-red-800" };
    if (quantity <= threshold) return { label: t('lowStock'), color: "bg-yellow-100 text-yellow-800" };
    return { label: t('inStock'), color: "bg-green-100 text-green-800" };
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
        title={t('inventoryTitle')} 
        description={t('inventoryDescription')} 
      />
      
      <div className="flex-1 p-6 space-y-6">
        {lowStockItems.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <h3 className="font-medium text-yellow-800">
                  {lowStockItems.length} {t('lowStockAlert')}
                </h3>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                {t('itemsNeedRestocking')} {lowStockItems.map(item => item.productName).join(", ")}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('searchInventory')}
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
                  {t('filter')}
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
                    <h4 className="font-semibold mb-3">{t('filterByStockStatus')}</h4>
                    <div className="space-y-2">
                      {[
                        { value: "in-stock", label: t('inStock') },
                        { value: "low-stock", label: t('lowStock') },
                        { value: "out-of-stock", label: t('outOfStock') }
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
                      {t('reset')}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setIsFilterOpen(false)}
                      data-testid="button-apply-filters"
                    >
                      {t('apply')}
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} data-testid="button-add-item">
            <Plus className="w-4 h-4 mr-2" />
            {t('addItem')}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Box className="w-5 h-5 mr-2" />
              {t('inventoryCount')} ({filteredInventory.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">{t('loadingInventory')}</p>
              </div>
            ) : filteredInventory.length === 0 ? (
              <div className="text-center py-8">
                <Box className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">{t('noInventoryItems')}</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? t('noItemsMatch') : t('getStartedInventory')}
                </p>
                {!searchTerm && (
                  <Button className="mt-4" onClick={() => setIsCreateModalOpen(true)} data-testid="button-add-first-item">
                    <Plus className="w-4 h-4 mr-2" />
                    {t('addFirstItem')}
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('productName')}</TableHead>
                    <TableHead>{t('sku')}</TableHead>
                    <TableHead>{t('quantity')}</TableHead>
                    <TableHead>{t('unitCost')}</TableHead>
                    <TableHead>{t('sellingPrice')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead>{t('actions')}</TableHead>
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
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openEditModal(item)}
                              data-testid={`button-edit-item-${item.id}`}
                            >
                              {t('edit')}
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => openDeleteDialog(item)}
                              data-testid={`button-delete-item-${item.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
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

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl" data-testid="modal-create-item">
          <DialogHeader>
            <DialogTitle>{t('addNewItem')}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="productName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('productNameRequired')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('enterProductName')} {...field} data-testid="input-name" />
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
                      <FormLabel>{t('skuRequired')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('enterSku')} {...field} data-testid="input-sku" />
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
                      <FormLabel>{t('quantityRequired')}</FormLabel>
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
                      <FormLabel>{t('lowStockThresholdRequired')}</FormLabel>
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
                      <FormLabel>{t('unitCostRequired')}</FormLabel>
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
                      <FormLabel>{t('sellingPriceRequired')}</FormLabel>
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
                  {t('cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={createInventoryMutation.isPending}
                  data-testid="button-save"
                >
                  {createInventoryMutation.isPending ? t('creatingItem') : t('createItem')}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md" data-testid="modal-edit-inventory">
          <DialogHeader>
            <DialogTitle>{t('editInventoryItem')}</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="productName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('productNameRequired')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('enterProductName')} {...field} data-testid="input-edit-product-name" />
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
                      <FormLabel>{t('skuRequired')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('enterSku')} {...field} data-testid="input-edit-sku" />
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
                      <FormLabel>{t('quantityRequired')}</FormLabel>
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
                      <FormLabel>{t('lowStockThresholdRequired')}</FormLabel>
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
                      <FormLabel>{t('unitCostRequired')}</FormLabel>
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
                      <FormLabel>{t('sellingPriceRequired')}</FormLabel>
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
                  {t('cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={updateInventoryMutation.isPending}
                  data-testid="button-update-item"
                >
                  {updateInventoryMutation.isPending ? t('updatingItem') : t('updateItem')}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-item">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteInventoryItem')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteInventoryConfirmation')}
              {deletingItem && (
                <div className="mt-2 p-2 bg-muted rounded text-sm">
                  <strong>{deletingItem.productName}</strong> ({t('sku')}: {deletingItem.sku})
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">{t('cancel')}</AlertDialogCancel>
            <Button
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
                setIsDeleteDialogOpen(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {t('delete')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
