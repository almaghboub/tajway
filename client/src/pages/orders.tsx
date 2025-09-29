import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Package, Search, Filter, Trash2, X, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header } from "@/components/header";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Invoice } from "@/components/invoice";
import type { OrderWithCustomer, Customer, Inventory, InsertOrder, InsertOrderItem } from "@shared/schema";

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<any>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingCountry, setShippingCountry] = useState("");
  const [shippingCategory, setShippingCategory] = useState("normal");
  const [shippingWeight, setShippingWeight] = useState(1);
  const [shippingCalculation, setShippingCalculation] = useState<{
    base_shipping: number;
    commission: number;
    total: number;
    currency: string;
    orderValue: number;
    itemsHash: string;
  } | null>(null);
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [notes, setNotes] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/orders");
      return response.json() as Promise<OrderWithCustomer[]>;
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/customers");
      return response.json() as Promise<Customer[]>;
    },
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ["/api/inventory"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/inventory");
      return response.json() as Promise<Inventory[]>;
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: { order: InsertOrder; items: InsertOrderItem[] }) => {
      const response = await apiRequest("POST", "/api/orders", orderData);
      if (!response.ok) {
        throw new Error("Failed to create order");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/dashboard"] });
      toast({
        title: "Success",
        description: "Order created successfully",
      });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create order",
        variant: "destructive",
      });
    },
  });

  // Query for order details when printing
  const { data: orderWithItems, isLoading: isLoadingOrderItems } = useQuery({
    queryKey: ["/api/orders", selectedOrderForPrint?.id, "items"],
    queryFn: async () => {
      if (!selectedOrderForPrint?.id) return null;
      const [orderResponse, itemsResponse] = await Promise.all([
        apiRequest("GET", `/api/orders/${selectedOrderForPrint.id}`),
        apiRequest("GET", `/api/orders/${selectedOrderForPrint.id}/items`)
      ]);
      const order = await orderResponse.json();
      const items = await itemsResponse.json();
      return { ...order, items };
    },
    enabled: !!selectedOrderForPrint?.id && isPrintModalOpen,
  });

  const handlePrintInvoice = (order: any) => {
    setSelectedOrderForPrint(order);
    setIsPrintModalOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const resetForm = () => {
    setSelectedCustomerId("");
    setOrderItems([]);
    setShippingCost(0);
    setShippingCountry("");
    setShippingCategory("normal");
    setShippingWeight(1);
    setShippingCalculation(null);
    setNotes("");
  };

  // Generate hash of order items to detect changes
  const getItemsHash = () => {
    return JSON.stringify(orderItems.map(item => ({
      id: item.productId,
      qty: item.quantity,
      price: item.unitPrice
    })));
  };

  // Check if shipping calculation is stale
  const isShippingCalculationStale = () => {
    if (!shippingCalculation) return false;
    const currentItemsHash = getItemsHash();
    const currentOrderValue = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
    
    return (
      shippingCalculation.itemsHash !== currentItemsHash ||
      Math.abs(shippingCalculation.orderValue - currentOrderValue) > 0.01
    );
  };

  const calculateShippingCost = async () => {
    if (!shippingCountry || !shippingCategory || !shippingWeight || orderItems.length === 0) {
      return;
    }

    setCalculatingShipping(true);
    try {
      const orderValue = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const itemsHash = getItemsHash();
      
      const response = await apiRequest("POST", "/api/calculate-shipping", {
        country: shippingCountry,
        category: shippingCategory,
        weight: shippingWeight,
        orderValue: orderValue
      });

      if (response.ok) {
        const calculation = await response.json();
        setShippingCalculation({
          ...calculation,
          orderValue,
          itemsHash
        });
        setShippingCost(calculation.base_shipping);
      } else {
        toast({
          title: "Error",
          description: "Failed to calculate shipping cost",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to calculate shipping cost",
        variant: "destructive",
      });
    } finally {
      setCalculatingShipping(false);
    }
  };

  const addOrderItem = () => {
    setOrderItems([...orderItems, {
      productId: "",
      productName: "",
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
    }]);
  };

  const updateOrderItem = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...orderItems];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === "productId") {
      const product = inventory.find(p => p.id === value);
      if (product) {
        newItems[index].productName = product.productName;
        newItems[index].unitPrice = parseFloat(product.sellingPrice);
      }
    }
    
    if (field === "quantity" || field === "unitPrice") {
      newItems[index].totalPrice = newItems[index].quantity * newItems[index].unitPrice;
    }
    
    setOrderItems(newItems);
  };

  const removeOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
    
    // Use dynamic shipping calculation if available
    if (shippingCalculation) {
      // Convert shipping amounts to USD if needed (simplified conversion for demo)
      const exchangeRates = { USD: 1, EUR: 1.1, GBP: 1.25, CNY: 0.14 }; // Simplified rates
      const usdRate = exchangeRates[shippingCalculation.currency as keyof typeof exchangeRates] || 1;
      
      const shippingInUSD = shippingCalculation.base_shipping * usdRate;
      const commissionInUSD = shippingCalculation.commission * usdRate;
      
      const total = subtotal + shippingInUSD;
      const profit = subtotal - commissionInUSD;
      
      return { 
        subtotal, 
        total, 
        commission: commissionInUSD, 
        profit,
        shippingCost: shippingInUSD,
        currency: 'USD', // Normalize to USD
        originalCurrency: shippingCalculation.currency,
        originalShipping: shippingCalculation.base_shipping,
        originalCommission: shippingCalculation.commission
      };
    } else {
      // Fallback to manual calculation
      const total = subtotal + shippingCost;
      const commission = total * 0.15; // Default commission rate
      const profit = subtotal - commission;
      
      return { 
        subtotal, 
        total, 
        commission, 
        profit,
        shippingCost,
        currency: 'USD'
      };
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCustomerId || orderItems.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select a customer and add at least one item",
        variant: "destructive",
      });
      return;
    }

    if (!shippingCalculation) {
      toast({
        title: "Validation Error",
        description: "Please calculate shipping before creating the order",
        variant: "destructive",
      });
      return;
    }

    const totals = calculateTotals();
    
    const order: InsertOrder = {
      customerId: selectedCustomerId,
      status: "pending",
      totalAmount: totals.total.toFixed(2),
      shippingCost: totals.shippingCost.toFixed(2),
      commission: totals.commission.toFixed(2),
      profit: totals.profit.toFixed(2),
      notes: notes || undefined,
    };

    const items: InsertOrderItem[] = orderItems.map(item => ({
      orderId: "", // Will be set by the backend
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toFixed(2),
      totalPrice: item.totalPrice.toFixed(2),
    }));

    createOrderMutation.mutate({ order, items });
  };

  const filteredOrders = orders.filter(order =>
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${order.customer.firstName} ${order.customer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "pending":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header 
        title="Orders" 
        description="Manage and track all customer orders" 
      />
      
      <div className="flex-1 p-6 space-y-6">
        {/* Actions and Search */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
                data-testid="input-search-orders"
              />
            </div>
            <Button variant="outline" data-testid="button-filter-orders">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
          <Button onClick={() => setIsModalOpen(true)} data-testid="button-new-order">
            <Plus className="w-4 h-4 mr-2" />
            New Order
          </Button>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Orders ({filteredOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No orders found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "No orders match your search criteria" : "Get started by creating your first order"}
                </p>
                {!searchTerm && (
                  <Button className="mt-4" onClick={() => setIsModalOpen(true)} data-testid="button-create-first-order">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Order
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Profit</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                      <TableCell className="font-medium" data-testid={`text-order-number-${order.id}`}>
                        {order.orderNumber}
                      </TableCell>
                      <TableCell data-testid={`text-customer-${order.id}`}>
                        {order.customer.firstName} {order.customer.lastName}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)} data-testid={`badge-status-${order.id}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`text-total-${order.id}`}>
                        ${parseFloat(order.totalAmount).toFixed(2)}
                      </TableCell>
                      <TableCell data-testid={`text-profit-${order.id}`}>
                        ${parseFloat(order.profit).toFixed(2)}
                      </TableCell>
                      <TableCell data-testid={`text-date-${order.id}`}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" data-testid={`button-view-order-${order.id}`}>
                            View
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handlePrintInvoice(order)}
                            data-testid={`button-print-invoice-${order.id}`}
                          >
                            <Printer className="w-4 h-4 mr-1" />
                            Print
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

        {/* Order Creation Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="modal-create-order">
            <DialogHeader>
              <DialogTitle>Create New Order</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Selection */}
              <div>
                <Label htmlFor="customer">Customer</Label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId} required>
                  <SelectTrigger data-testid="select-customer">
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.firstName} {customer.lastName} - {customer.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Order Items */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label>Order Items</Label>
                  <Button 
                    type="button" 
                    onClick={addOrderItem} 
                    size="sm"
                    data-testid="button-add-item"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                {orderItems.length === 0 ? (
                  <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-muted-foreground">No items added yet</p>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={addOrderItem}
                      className="mt-2"
                      data-testid="button-add-first-item"
                    >
                      Add First Item
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orderItems.map((item, index) => (
                      <div key={index} className="border rounded-lg p-4" data-testid={`order-item-${index}`}>
                        <div className="grid grid-cols-12 gap-4 items-end">
                          <div className="col-span-4">
                            <Label>Product</Label>
                            <Select 
                              value={item.productId} 
                              onValueChange={(value) => updateOrderItem(index, "productId", value)}
                            >
                              <SelectTrigger data-testid={`select-product-${index}`}>
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                              <SelectContent>
                                {inventory.map((product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    {product.productName} - ${product.sellingPrice}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="col-span-2">
                            <Label>Quantity</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateOrderItem(index, "quantity", parseInt(e.target.value) || 1)}
                              data-testid={`input-quantity-${index}`}
                            />
                          </div>
                          
                          <div className="col-span-2">
                            <Label>Unit Price</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateOrderItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                              data-testid={`input-unit-price-${index}`}
                            />
                          </div>
                          
                          <div className="col-span-2">
                            <Label>Total</Label>
                            <Input
                              value={`$${item.totalPrice.toFixed(2)}`}
                              readOnly
                              className="bg-gray-50"
                              data-testid={`text-item-total-${index}`}
                            />
                          </div>
                          
                          <div className="col-span-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeOrderItem(index)}
                              className="text-red-600 hover:text-red-700"
                              data-testid={`button-remove-item-${index}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Shipping Configuration and Notes */}
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="shipping-country">Shipping Country</Label>
                    <Select value={shippingCountry} onValueChange={setShippingCountry}>
                      <SelectTrigger data-testid="select-shipping-country">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="China">China</SelectItem>
                        <SelectItem value="Turkey">Turkey</SelectItem>
                        <SelectItem value="UK">UK</SelectItem>
                        <SelectItem value="UAE">UAE</SelectItem>
                        <SelectItem value="Germany">Germany</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="shipping-category">Shipping Category</Label>
                    <Select value={shippingCategory} onValueChange={setShippingCategory}>
                      <SelectTrigger data-testid="select-shipping-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="perfumes">Perfumes</SelectItem>
                        <SelectItem value="electronics">Electronics</SelectItem>
                        <SelectItem value="clothing">Clothing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="shipping-weight">Weight (kg)</Label>
                    <Input
                      id="shipping-weight"
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={shippingWeight}
                      onChange={(e) => setShippingWeight(parseFloat(e.target.value) || 1)}
                      data-testid="input-shipping-weight"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    onClick={calculateShippingCost}
                    disabled={calculatingShipping || !shippingCountry || !shippingCategory || orderItems.length === 0}
                    data-testid="button-calculate-shipping"
                  >
                    {calculatingShipping ? "Calculating..." : "Calculate Shipping"}
                  </Button>
                  
                  {shippingCalculation && (
                    <div className="text-sm text-green-600 font-medium" data-testid="text-shipping-calculated">
                      Calculated: Shipping {shippingCalculation.currency} {shippingCalculation.base_shipping.toFixed(2)}, 
                      Commission {shippingCalculation.currency} {shippingCalculation.commission.toFixed(2)}
                      {shippingCalculation.currency !== 'USD' && (
                        <span className="text-blue-600"> (converted to USD in totals)</span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Order notes..."
                    data-testid="input-notes"
                  />
                </div>
              </div>

              {/* Order Summary */}
              {orderItems.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-4">Order Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span data-testid="text-subtotal">${calculateTotals().subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span data-testid="text-shipping">
                        {calculateTotals().currency} {calculateTotals().shippingCost.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Commission{shippingCalculation ? ' (Dynamic)' : ' (15%)'}:</span>
                      <span data-testid="text-commission">
                        {calculateTotals().currency} {calculateTotals().commission.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between font-medium text-lg border-t pt-2">
                      <span>Total:</span>
                      <span data-testid="text-total">
                        {calculateTotals().currency} {calculateTotals().total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Estimated Profit:</span>
                      <span data-testid="text-profit">
                        {calculateTotals().currency} {calculateTotals().profit.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="space-y-2">
                {!shippingCalculation && orderItems.length > 0 && (
                  <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded" data-testid="text-shipping-required">
                    Please calculate shipping before creating the order.
                  </div>
                )}
                {shippingCalculation && isShippingCalculationStale() && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded" data-testid="text-shipping-stale">
                    Order items changed. Please recalculate shipping before creating the order.
                  </div>
                )}
                <div className="flex justify-end space-x-2 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsModalOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={
                      createOrderMutation.isPending || 
                      !selectedCustomerId || 
                      orderItems.length === 0 || 
                      !shippingCalculation || 
                      isShippingCalculationStale()
                    }
                    data-testid="button-create-order"
                  >
                    {createOrderMutation.isPending ? "Creating..." : "Create Order"}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Print Invoice Modal */}
        <Dialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" data-testid="modal-print-invoice">
            <DialogHeader>
              <div className="flex justify-between items-center">
                <DialogTitle>Invoice Preview</DialogTitle>
                <div className="flex space-x-2">
                  <Button onClick={handlePrint} data-testid="button-print">
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                  <Button variant="outline" onClick={() => setIsPrintModalOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </DialogHeader>
            {isLoadingOrderItems ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading order details...</p>
              </div>
            ) : orderWithItems ? (
              <Invoice order={orderWithItems} onPrint={handlePrint} />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Failed to load order details</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
