import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Package, Search, Filter, Trash2, X, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Header } from "@/components/header";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Invoice } from "@/components/invoice";
import type { OrderWithCustomer, Customer, InsertOrder, InsertOrderItem } from "@shared/schema";

interface OrderItem {
  productId: string;
  productName: string;
  productCode: string;
  productUrl: string;
  originalPrice: number;
  discountedPrice: number;
  quantity: number;
  numberOfPieces: number;
  unitPrice: number;
  totalPrice: number;
}

interface OrderImage {
  url: string;
  altText: string;
}

export default function Orders() {
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const translateStatus = (status: string) => {
    const statusNormalized = status.toLowerCase().replace(/[\s_-]+/g, '');
    switch (statusNormalized) {
      case 'delivered':
        return t('statusDelivered');
      case 'completed':
        return t('statusCompleted');
      case 'cancelled':
        return t('statusCancelled');
      case 'partiallyarrived':
        return t('statusPartiallyArrived');
      case 'readytocollect':
        return t('statusReadyToCollect');
      case 'withshippingcompany':
        return t('statusWithShippingCompany');
      default:
        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    }
  };
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OrderWithCustomer | null>(null);
  const [viewingOrder, setViewingOrder] = useState<OrderWithCustomer | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<OrderWithCustomer | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<any>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [searchedCustomers, setSearchedCustomers] = useState<Customer[]>([]);
  const [searchedCustomer, setSearchedCustomer] = useState<Customer | null>(null);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    fullName: "",
    city: "",
    phone: ""
  });
  const [customOrderCode, setCustomOrderCode] = useState("");
  const [orderImages, setOrderImages] = useState<OrderImage[]>([]);
  const [statusFilters, setStatusFilters] = useState<string[]>(["pending", "processing", "shipped", "delivered", "cancelled", "partially_arrived", "ready_to_collect", "with_shipping_company"]);
  const [countryFilters, setCountryFilters] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [editOrderStatus, setEditOrderStatus] = useState("");
  const [editableItems, setEditableItems] = useState<any[]>([]);
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingCountry, setShippingCountry] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingCategory, setShippingCategory] = useState("normal");
  const [shippingWeight, setShippingWeight] = useState(1);
  const [clothingSize, setClothingSize] = useState("");
  const [hasDownPayment, setHasDownPayment] = useState(false);
  const [downPayment, setDownPayment] = useState(0);
  const [lydExchangeRate, setLydExchangeRate] = useState<number>(0);
  const [hasPromptedForLydRate, setHasPromptedForLydRate] = useState(false);
  const [shippingCalculation, setShippingCalculation] = useState<{
    base_shipping: number;
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

  const { data: shippingCountries = [] } = useQuery({
    queryKey: ["/api/shipping-countries"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/shipping-countries");
      return response.json() as Promise<string[]>;
    },
  });

  const { data: settings = [] } = useQuery<Array<{ id: string; key: string; value: string }>>({
    queryKey: ["/api/settings"],
  });

  const globalLydExchangeRate = parseFloat(settings.find(s => s.key === 'lyd_exchange_rate')?.value || '0');

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: { order: InsertOrder; items: InsertOrderItem[]; images?: OrderImage[] }) => {
      const response = await apiRequest("POST", "/api/orders", orderData);
      if (!response.ok) {
        throw new Error(t('failedCreateOrder'));
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/dashboard"] });
      toast({
        title: t('success'),
        description: t('orderCreatedSuccess'),
      });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: t('failedCreateOrder'),
        variant: "destructive",
      });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, status, notes, downPayment, remainingBalance, shippingWeight, shippingCountry, shippingCategory, shippingCost, totalAmount }: { 
      id: string; 
      status: string; 
      notes: string; 
      downPayment?: string;
      remainingBalance?: string;
      shippingWeight?: string;
      shippingCountry?: string;
      shippingCategory?: string;
      shippingCost?: string;
      totalAmount?: string;
    }) => {
      const response = await apiRequest("PUT", `/api/orders/${id}`, { status, notes, downPayment, remainingBalance, shippingWeight, shippingCountry, shippingCategory, shippingCost, totalAmount });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || t('failedUpdateOrder'));
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/dashboard"] });
      toast({
        title: t('success'),
        description: t('orderUpdatedSuccess'),
      });
      setIsEditModalOpen(false);
      setEditingOrder(null);
      setEditOrderStatus("");
      setNotes("");
    },
    onError: (error: Error) => {
      toast({
        title: t('error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/orders/${id}`);
      if (!response.ok) {
        throw new Error(t('failedDeleteOrder'));
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/dashboard"] });
      toast({
        title: t('success'),
        description: t('orderDeletedSuccess'),
      });
      setIsDeleteDialogOpen(false);
      setDeletingOrder(null);
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('failedDeleteOrder'),
        variant: "destructive",
      });
    },
  });

  const sendToDarbAssabilMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest("POST", `/api/orders/${orderId}/send-to-darb-assabil`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send order to Darb Assabil');
      }
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: t('success'),
        description: `Order sent to Darb Assabil. Reference: ${data.reference || 'N/A'}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: t('error'),
        description: error.message || 'Failed to send order to Darb Assabil',
        variant: "destructive",
      });
    },
  });

  const updateOrderItemMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; quantity?: number; numberOfPieces?: number; originalPrice?: string; discountedPrice?: string; unitPrice?: string; productCode?: string }) => {
      const response = await apiRequest("PUT", `/api/order-items/${id}`, data);
      if (!response.ok) {
        throw new Error(t('failedUpdateOrderItem'));
      }
      return response.json();
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (customerData: typeof newCustomer) => {
      // Split fullName into firstName and lastName
      const nameParts = customerData.fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || firstName;
      
      const payload = {
        firstName,
        lastName,
        phone: customerData.phone,
        city: customerData.city,
        email: "",
        country: "",
        address: "",
        postalCode: ""
      };
      
      const response = await apiRequest("POST", "/api/customers", payload);
      if (!response.ok) {
        throw new Error("Failed to create customer");
      }
      return response.json();
    },
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setSearchedCustomer(customer);
      setSelectedCustomerId(customer.id);
      setShippingCountry(customer.country || "");
      setShowCustomerForm(false);
      setNewCustomer({
        fullName: "",
        city: "",
        phone: ""
      });
      toast({
        title: t('success'),
        description: t('customerCreatedSuccess'),
      });
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('failedCreateCustomer'),
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

  // Query for order details when viewing
  const { data: viewOrderWithItems, isLoading: isLoadingViewOrder } = useQuery({
    queryKey: ["/api/orders", viewingOrder?.id, "view"],
    queryFn: async () => {
      if (!viewingOrder?.id) return null;
      const itemsResponse = await apiRequest("GET", `/api/orders/${viewingOrder.id}/items`);
      const items = await itemsResponse.json();
      return { ...viewingOrder, items };
    },
    enabled: !!viewingOrder?.id && isViewModalOpen,
  });

  const handlePrintInvoice = (order: any) => {
    setSelectedOrderForPrint(order);
    setIsPrintModalOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const openEditModal = async (order: OrderWithCustomer) => {
    setEditingOrder(order);
    setEditOrderStatus(order.status);
    setNotes(order.notes || "");
    
    // Fetch order items
    try {
      const itemsResponse = await apiRequest("GET", `/api/orders/${order.id}/items`);
      const items = await itemsResponse.json();
      setEditableItems(items);
    } catch (error) {
      console.error("Failed to fetch order items:", error);
      setEditableItems([]);
    }
    
    setIsEditModalOpen(true);
  };

  const openViewModal = (order: OrderWithCustomer) => {
    setViewingOrder(order);
    setIsViewModalOpen(true);
  };

  const openDeleteDialog = (order: OrderWithCustomer) => {
    setDeletingOrder(order);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (!deletingOrder) return;
    deleteOrderMutation.mutate(deletingOrder.id);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    
    try {
      // Update all modified order items
      await Promise.all(
        editableItems.map(item => 
          updateOrderItemMutation.mutateAsync({
            id: item.id,
            quantity: item.quantity,
            numberOfPieces: item.numberOfPieces || 1,
            originalPrice: item.originalPrice?.toString(),
            discountedPrice: item.discountedPrice?.toString(),
            unitPrice: item.unitPrice?.toString(),
            productCode: item.productCode,
          })
        )
      );
      
      // Update the order
      updateOrderMutation.mutate({
        id: editingOrder.id,
        status: editOrderStatus,
        downPayment: editingOrder.downPayment,
        remainingBalance: editingOrder.remainingBalance,
        shippingWeight: editingOrder.shippingWeight,
        shippingCountry: editingOrder.shippingCountry || undefined,
        shippingCategory: editingOrder.shippingCategory || undefined,
        shippingCost: editingOrder.shippingCost,
        totalAmount: editingOrder.totalAmount,
        lydExchangeRate: editingOrder.lydExchangeRate || undefined,
        trackingNumber: editingOrder.trackingNumber || undefined,
        notes: notes
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failedUpdateOrderItems'),
        variant: "destructive",
      });
    }
  };
  
  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...editableItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setEditableItems(updatedItems);
  };

  const handleCustomerSearch = async () => {
    if (!customerSearchQuery.trim()) {
      toast({
        title: t('error'),
        description: "Please enter phone, name, or customer code",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/customers/search?query=${encodeURIComponent(customerSearchQuery)}`, {
        credentials: "include"
      });
      
      if (response.ok) {
        const customers = await response.json();
        if (customers.length === 0) {
          // No customers found - show creation form
          setSearchedCustomers([]);
          setSearchedCustomer(null);
          setShowCustomerForm(true);
          setNewCustomer(prev => ({ ...prev, phone: customerSearchQuery }));
          toast({
            title: "No customers found",
            description: "Fill in the details to create a new customer",
          });
        } else if (customers.length === 1) {
          // Single customer found - auto select
          const customer = customers[0];
          setSearchedCustomer(customer);
          setSelectedCustomerId(customer.id);
          setShippingCountry(customer.country);
          setSearchedCustomers([]);
          setShowCustomerForm(false);
          toast({
            title: t('success'),
            description: `Customer found: ${customer.firstName} ${customer.lastName}`,
          });
        } else {
          // Multiple customers found - show list
          setSearchedCustomers(customers);
          setSearchedCustomer(null);
          setShowCustomerForm(false);
        }
      } else {
        throw new Error("Failed to search for customers");
      }
    } catch (error) {
      toast({
        title: t('error'),
        description: "Failed to search for customers",
        variant: "destructive",
      });
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSearchedCustomer(customer);
    setSelectedCustomerId(customer.id);
    setShippingCountry(customer.country || "");
    setSearchedCustomers([]);
    setShowCustomerForm(false);
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    createCustomerMutation.mutate(newCustomer);
  };

  const resetForm = () => {
    setSelectedCustomerId("");
    setCustomerSearchQuery("");
    setSearchedCustomers([]);
    setSearchedCustomer(null);
    setShowCustomerForm(false);
    setOrderItems([]);
    setOrderImages([]);
    setShippingCost(0);
    setShippingCountry("");
    setShippingCity("");
    setShippingCategory("normal");
    setShippingWeight(1);
    setClothingSize("");
    setDownPayment(0);
    setLydExchangeRate(0);
    setHasPromptedForLydRate(false);
    setShippingCalculation(null);
    setNotes("");
    setCustomOrderCode("");
    setNewCustomer({
      fullName: "",
      city: "",
      phone: ""
    });
  };

  const handleCloseModal = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    setIsModalOpen(open);
  };

  // Generate hash of order items to detect changes
  const getItemsHash = () => {
    return JSON.stringify(orderItems.map(item => ({
      name: item.productName,
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
          title: t('error'),
          description: t('failedCalculateShipping'),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failedCalculateShipping'),
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
      productCode: "",
      productUrl: "",
      originalPrice: 0,
      discountedPrice: 0,
      quantity: 1,
      numberOfPieces: 1,
      unitPrice: 0,
      totalPrice: 0,
    }]);
  };

  const updateOrderItem = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...orderItems];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Calculate based on ORIGINAL price (what customer pays)
    if (field === "quantity" || field === "originalPrice" || field === "discountedPrice") {
      newItems[index].unitPrice = newItems[index].originalPrice;
      newItems[index].totalPrice = newItems[index].quantity * newItems[index].originalPrice;
    }
    
    setOrderItems(newItems);
  };

  const removeOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
    
    // Calculate items profit (markup profit)
    const itemsProfit = orderItems.reduce((sum, item) => {
      const markupProfit = (item.originalPrice - item.discountedPrice) * item.quantity;
      return sum + markupProfit;
    }, 0);
    
    // Use dynamic shipping calculation if available
    if (shippingCalculation) {
      // Convert shipping amounts to USD if needed (simplified conversion for demo)
      const exchangeRates = { USD: 1, EUR: 1.1, GBP: 1.25, CNY: 0.14 }; // Simplified rates
      const usdRate = exchangeRates[shippingCalculation.currency as keyof typeof exchangeRates] || 1;
      
      const shippingInUSD = shippingCalculation.base_shipping * usdRate;
      
      const total = subtotal + shippingInUSD;
      const totalProfit = itemsProfit;
      
      return { 
        subtotal, 
        total, 
        profit: totalProfit,
        itemsProfit,
        shippingCost: shippingInUSD,
        currency: 'USD', // Normalize to USD
        originalCurrency: shippingCalculation.currency,
        originalShipping: shippingCalculation.base_shipping
      };
    } else {
      // Fallback to manual calculation
      const total = subtotal + shippingCost;
      const totalProfit = itemsProfit;
      
      return { 
        subtotal, 
        total, 
        profit: totalProfit,
        itemsProfit,
        shippingCost,
        currency: 'USD'
      };
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCustomerId || orderItems.length === 0) {
      toast({
        title: t('validationError'),
        description: t('selectCustomerAndItem'),
        variant: "destructive",
      });
      return;
    }

    const totals = calculateTotals();
    
    // Calculate items profit (difference between original and discounted price)
    const itemsProfit = orderItems.reduce((sum, item) => {
      const markupProfit = (item.originalPrice - item.discountedPrice) * item.quantity;
      return sum + markupProfit;
    }, 0);
    
    const totalProfit = itemsProfit;
    
    // Calculate remaining balance
    const remainingBalance = totals.total - downPayment;
    
    // Add clothing size to notes if provided
    let finalNotes = notes;
    if (clothingSize && shippingCategory === "clothing") {
      finalNotes = finalNotes ? `${finalNotes} | Size: ${clothingSize}` : `Size: ${clothingSize}`;
    }
    
    const order: InsertOrder = {
      customerId: selectedCustomerId,
      status: "pending",
      totalAmount: totals.total.toFixed(2),
      downPayment: downPayment.toFixed(2),
      remainingBalance: remainingBalance.toFixed(2),
      shippingCost: totals.shippingCost.toFixed(2),
      shippingWeight: shippingWeight.toFixed(2),
      shippingCountry: shippingCountry || undefined,
      shippingCity: shippingCity || undefined,
      shippingCategory: shippingCategory || undefined,
      itemsProfit: itemsProfit.toFixed(2),
      totalProfit: totalProfit.toFixed(2),
      lydExchangeRate: lydExchangeRate > 0 ? lydExchangeRate.toFixed(4) : undefined,
      notes: finalNotes || undefined,
      orderNumber: customOrderCode || undefined,
    };

    const items: InsertOrderItem[] = orderItems.map(item => {
      const markupProfit = ((item.originalPrice - item.discountedPrice) * item.quantity).toFixed(2);
      return {
        orderId: "", // Will be set by the backend
        productName: item.productName,
        productCode: item.productCode || null,
        productUrl: item.productUrl || null,
        originalPrice: item.originalPrice.toFixed(2),
        discountedPrice: item.discountedPrice.toFixed(2),
        markupProfit: markupProfit,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
        totalPrice: item.totalPrice.toFixed(2),
      };
    });

    // Include images
    const validImages = orderImages.filter(img => img.url.trim() !== "");

    createOrderMutation.mutate({ 
      order, 
      items,
      images: validImages
    });
  };

  const toggleStatusFilter = (status: string) => {
    setStatusFilters(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${order.customer.firstName} ${order.customer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilters.includes(order.status);
    const matchesCountry = countryFilters.length === 0 || (order.shippingCountry && countryFilters.includes(order.shippingCountry));
    
    // Date filtering
    let matchesDate = true;
    if (dateFrom || dateTo) {
      const orderDate = new Date(order.createdAt);
      if (dateFrom && dateTo) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        matchesDate = orderDate >= fromDate && orderDate <= toDate;
      } else if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        matchesDate = orderDate >= fromDate;
      } else if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        matchesDate = orderDate <= toDate;
      }
    }
    
    return matchesSearch && matchesStatus && matchesCountry && matchesDate;
  });
  
  const toggleCountryFilter = (country: string) => {
    setCountryFilters(prev =>
      prev.includes(country)
        ? prev.filter(c => c !== country)
        : [...prev, country]
    );
  };

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
      case "partially_arrived":
        return "bg-purple-100 text-purple-800";
      case "ready_to_collect":
        return "bg-cyan-100 text-cyan-800";
      case "with_shipping_company":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header 
        title={t('ordersTitle')} 
        description={t('ordersDescription')} 
      />
      
      <div className="flex-1 p-6 space-y-6">
        {/* Actions and Search */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('searchOrders')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
                data-testid="input-search-orders"
              />
            </div>
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" data-testid="button-filter-orders">
                  <Filter className="w-4 h-4 mr-2" />
                  {t('filter')}
                  {statusFilters.length < 8 && (
                    <Badge variant="secondary" className="ml-2">
                      {statusFilters.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 max-h-96 overflow-y-auto" data-testid="popover-filter-orders">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-3">{t('filterByStatus')}</h4>
                    <div className="space-y-2">
                      {["pending", "processing", "shipped", "delivered", "cancelled", "partially_arrived", "ready_to_collect", "with_shipping_company"].map((status) => (
                        <div key={status} className="flex items-center space-x-2">
                          <Checkbox
                            id={`filter-${status}`}
                            checked={statusFilters.includes(status)}
                            onCheckedChange={() => toggleStatusFilter(status)}
                            data-testid={`checkbox-filter-${status}`}
                          />
                          <Label
                            htmlFor={`filter-${status}`}
                            className="text-sm font-normal cursor-pointer capitalize"
                          >
                            {t(status)}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  {shippingCountries.length > 0 && (
                    <div className="border-t pt-3">
                      <h4 className="font-semibold mb-3">Filter by Country</h4>
                      <div className="space-y-2">
                        {shippingCountries.map((country) => (
                          <div key={country} className="flex items-center space-x-2">
                            <Checkbox
                              id={`filter-country-${country}`}
                              checked={countryFilters.includes(country)}
                              onCheckedChange={() => toggleCountryFilter(country)}
                              data-testid={`checkbox-filter-country-${country}`}
                            />
                            <Label
                              htmlFor={`filter-country-${country}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {country}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="border-t pt-3">
                    <h4 className="font-semibold mb-3">Filter by Date</h4>
                    {(dateFrom || dateTo) && (
                      <div className="mb-3 p-2 bg-blue-50 rounded text-sm">
                        {dateFrom && <div>From: {dateFrom.toLocaleDateString()}</div>}
                        {dateTo && <div>To: {dateTo.toLocaleDateString()}</div>}
                      </div>
                    )}
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm">From Date</Label>
                        <div className="mt-1">
                          <Calendar
                            mode="single"
                            selected={dateFrom}
                            onSelect={setDateFrom}
                            className="border rounded-md"
                            data-testid="calendar-from-date"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm">To Date</Label>
                        <div className="mt-1">
                          <Calendar
                            mode="single"
                            selected={dateTo}
                            onSelect={setDateTo}
                            className="border rounded-md"
                            data-testid="calendar-to-date"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setStatusFilters(["pending", "processing", "shipped", "delivered", "cancelled", "partially_arrived", "ready_to_collect", "with_shipping_company"]);
                        setCountryFilters([]);
                        setDateFrom(undefined);
                        setDateTo(undefined);
                      }}
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
          <Button onClick={() => setIsModalOpen(true)} data-testid="button-new-order">
            <Plus className="w-4 h-4 mr-2" />
            {t('newOrder')}
          </Button>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="w-5 h-5 mr-2" />
              {t('ordersCount')} ({filteredOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">{t('loadingOrders')}</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">{t('noOrdersFound')}</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? t('noOrdersMatch') : t('getStartedFirstOrder')}
                </p>
                {!searchTerm && (
                  <Button className="mt-4" onClick={() => setIsModalOpen(true)} data-testid="button-create-first-order">
                    <Plus className="w-4 h-4 mr-2" />
                    {t('createFirstOrder')}
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('customer')}</TableHead>
                    <TableHead>{t('shippingCodeLabel')}</TableHead>
                    <TableHead>{t('trackingNumber')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead>{t('total')}</TableHead>
                    <TableHead>{t('downPaymentLabel')}</TableHead>
                    <TableHead>{t('remainingLabel')}</TableHead>
                    <TableHead>{t('profit')}</TableHead>
                    <TableHead>{t('createdAt')}</TableHead>
                    <TableHead>{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                      <TableCell data-testid={`text-customer-${order.id}`}>
                        {order.customer.firstName} {order.customer.lastName}
                      </TableCell>
                      <TableCell className="font-medium" data-testid={`text-shipping-code-${order.id}`}>
                        <span className="font-semibold text-primary">{order.customer.shippingCode || order.orderNumber}</span>
                      </TableCell>
                      <TableCell data-testid={`text-tracking-${order.id}`}>
                        <span className="text-sm text-muted-foreground">{order.trackingNumber || "—"}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)} data-testid={`badge-status-${order.id}`}>
                          {translateStatus(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`text-total-${order.id}`}>
                        {globalLydExchangeRate > 0 ? (
                          <div>
                            <div className="font-bold text-blue-600">
                              {(parseFloat(order.totalAmount) * globalLydExchangeRate).toFixed(2)} LYD
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ${parseFloat(order.totalAmount).toFixed(2)}
                            </div>
                          </div>
                        ) : (
                          `$${parseFloat(order.totalAmount).toFixed(2)}`
                        )}
                      </TableCell>
                      <TableCell data-testid={`text-down-payment-${order.id}`}>
                        {globalLydExchangeRate > 0 ? (
                          <div>
                            <div className="font-bold text-green-600">
                              {(parseFloat(order.downPayment || "0") * globalLydExchangeRate).toFixed(2)} LYD
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ${parseFloat(order.downPayment || "0").toFixed(2)}
                            </div>
                          </div>
                        ) : (
                          <span className="font-semibold text-green-600">${parseFloat(order.downPayment || "0").toFixed(2)}</span>
                        )}
                      </TableCell>
                      <TableCell data-testid={`text-remaining-${order.id}`}>
                        {globalLydExchangeRate > 0 ? (
                          <div>
                            <div className="font-bold text-blue-600">
                              {(parseFloat(order.remainingBalance || "0") * globalLydExchangeRate).toFixed(2)} LYD
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ${parseFloat(order.remainingBalance || "0").toFixed(2)}
                            </div>
                          </div>
                        ) : (
                          `$${parseFloat(order.remainingBalance || "0").toFixed(2)}`
                        )}
                      </TableCell>
                      <TableCell data-testid={`text-profit-${order.id}`}>
                        {globalLydExchangeRate > 0 ? (
                          <div>
                            <div className="font-bold text-blue-600">
                              {(parseFloat(order.totalProfit) * globalLydExchangeRate).toFixed(2)} LYD
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ${parseFloat(order.totalProfit).toFixed(2)}
                            </div>
                          </div>
                        ) : (
                          `$${parseFloat(order.totalProfit).toFixed(2)}`
                        )}
                      </TableCell>
                      <TableCell data-testid={`text-date-${order.id}`}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openEditModal(order)}
                            data-testid={`button-edit-order-${order.id}`}
                          >
                            {t('edit')}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openViewModal(order)}
                            data-testid={`button-view-order-${order.id}`}
                          >
                            {t('view')}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handlePrintInvoice(order)}
                            data-testid={`button-print-invoice-${order.id}`}
                          >
                            <Printer className="w-4 h-4 mr-1" />
                            {t('print')}
                          </Button>
                          {!(order as any).darbAssabilReference && (
                            <Button 
                              variant="default" 
                              size="sm" 
                              onClick={() => sendToDarbAssabilMutation.mutate(order.id)}
                              disabled={sendToDarbAssabilMutation.isPending}
                              data-testid={`button-send-darb-${order.id}`}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {sendToDarbAssabilMutation.isPending ? '...' : 'Ship'}
                            </Button>
                          )}
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => openDeleteDialog(order)}
                            data-testid={`button-delete-order-${order.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
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
        <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="modal-create-order">
            <DialogHeader>
              <DialogTitle>{t('createNewOrder')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Search */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customerSearch">{t('searchCustomerPhoneNameCode')}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="customerSearch"
                      value={customerSearchQuery}
                      onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      placeholder={t('enterPhoneNameCode')}
                      data-testid="input-customer-search"
                      onKeyPress={(e) => e.key === 'Enter' && handleCustomerSearch()}
                    />
                    <Button
                      type="button"
                      onClick={handleCustomerSearch}
                      data-testid="button-search-customer"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      {t('search')}
                    </Button>
                  </div>
                </div>

                {/* Multiple Search Results */}
                {searchedCustomers.length > 0 && (
                  <div className="border rounded-lg divide-y max-h-60 overflow-y-auto" data-testid="customer-search-results">
                    {searchedCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                        onClick={() => handleSelectCustomer(customer)}
                        data-testid={`customer-result-${customer.id}`}
                      >
                        <p className="font-semibold">
                          {customer.firstName} {customer.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {customer.phone} • {customer.shippingCode || 'No code'} • {customer.country || 'No country'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Found Customer Display */}
                {searchedCustomer && !showCustomerForm && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg" data-testid="customer-found">
                    <p className="font-semibold text-green-800 dark:text-green-200">
                      Customer Found: {searchedCustomer.firstName} {searchedCustomer.lastName}
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {searchedCustomer.phone} • {searchedCustomer.shippingCode || 'No code'} • {searchedCustomer.country}
                    </p>
                  </div>
                )}

                {/* Inline Customer Creation Form */}
                {showCustomerForm && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-4" data-testid="form-create-customer">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-blue-800 dark:text-blue-200">Create New Customer</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCustomerForm(false)}
                        data-testid="button-cancel-customer"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="fullName">Name*</Label>
                        <Input
                          id="fullName"
                          value={newCustomer.fullName}
                          onChange={(e) => setNewCustomer({...newCustomer, fullName: e.target.value})}
                          required
                          placeholder={t('enterFullName')}
                          data-testid="input-full-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="city">City*</Label>
                        <Input
                          id="city"
                          value={newCustomer.city}
                          onChange={(e) => setNewCustomer({...newCustomer, city: e.target.value})}
                          required
                          placeholder={t('enterCity')}
                          data-testid="input-city"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={handleCreateCustomer}
                      disabled={createCustomerMutation.isPending || !newCustomer.fullName || !newCustomer.city}
                      data-testid="button-create-customer"
                    >
                      {createCustomerMutation.isPending ? t('creating') : t('createCustomer')}
                    </Button>
                  </div>
                )}

                {/* Custom Order Code */}
                {selectedCustomerId && (
                  <div className="mt-4">
                    <Label htmlFor="orderCode">Custom Order Code (Optional)</Label>
                    <Input
                      id="orderCode"
                      value={customOrderCode}
                      onChange={(e) => setCustomOrderCode(e.target.value)}
                      placeholder="e.g., LY-1759535106379"
                      data-testid="input-order-code"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Leave empty to auto-generate
                    </p>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label>{t('orderItems')}</Label>
                  <Button 
                    type="button" 
                    onClick={addOrderItem} 
                    size="sm"
                    data-testid="button-add-item"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t('addItem')}
                  </Button>
                </div>

                {orderItems.length === 0 ? (
                  <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-muted-foreground">{t('noItemsAdded')}</p>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={addOrderItem}
                      className="mt-2"
                      data-testid="button-add-first-item"
                    >
                      {t('addFirstItem')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orderItems.map((item, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-muted/30" data-testid={`order-item-${index}`}>
                        <div className="space-y-4">
                          {/* First row: Shipping Code, Product Code */}
                          <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-11">
                              <Label htmlFor={`product-name-${index}`}>{t('shippingCodeRequired')}</Label>
                              <Input
                                id={`product-name-${index}`}
                                value={item.productName}
                                onChange={(e) => updateOrderItem(index, "productName", e.target.value)}
                                placeholder={t('enterShippingCode')}
                                required
                                data-testid={`input-product-name-${index}`}
                              />
                            </div>
                            <div className="col-span-1 flex items-end">
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() => removeOrderItem(index)}
                                data-testid={`button-remove-item-${index}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Second row: Product URL */}
                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <Label htmlFor={`product-url-${index}`}>Product Link</Label>
                              <Input
                                id={`product-url-${index}`}
                                value={item.productUrl}
                                onChange={(e) => updateOrderItem(index, "productUrl", e.target.value)}
                                placeholder="https://..."
                                data-testid={`input-product-url-${index}`}
                              />
                            </div>
                          </div>

                          {/* Third row: Prices, Quantity, Number of Pieces, Total */}
                          <div className="grid grid-cols-5 gap-4">
                            <div>
                              <Label htmlFor={`original-price-${index}`}>Original Price ($)*</Label>
                              <Input
                                id={`original-price-${index}`}
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.originalPrice}
                                onChange={(e) => updateOrderItem(index, "originalPrice", parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                                required
                                data-testid={`input-original-price-${index}`}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`discounted-price-${index}`}>After Discount ($)*</Label>
                              <Input
                                id={`discounted-price-${index}`}
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.discountedPrice}
                                onChange={(e) => updateOrderItem(index, "discountedPrice", parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                                required
                                data-testid={`input-discounted-price-${index}`}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`quantity-${index}`}>Quantity*</Label>
                              <Input
                                id={`quantity-${index}`}
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateOrderItem(index, "quantity", parseInt(e.target.value) || 1)}
                                required
                                data-testid={`input-quantity-${index}`}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`number-of-pieces-${index}`}>No. of Pieces*</Label>
                              <Input
                                id={`number-of-pieces-${index}`}
                                type="number"
                                min="1"
                                value={item.numberOfPieces}
                                onChange={(e) => updateOrderItem(index, "numberOfPieces", parseInt(e.target.value) || 1)}
                                required
                                data-testid={`input-number-of-pieces-${index}`}
                              />
                            </div>
                            <div>
                              <Label>Total (Customer Pays)</Label>
                              <div className="h-10 px-3 py-2 border rounded-md bg-muted font-semibold flex items-center" data-testid={`text-item-total-${index}`}>
                                ${item.totalPrice.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Order Images Upload */}
              <div className="space-y-4">
                <Label>Order Images (Optional - Up to 3 photos)</Label>
                <div className="grid grid-cols-3 gap-4">
                  {[0, 1, 2].map((index) => (
                    <div key={index} className="space-y-2">
                      <Label htmlFor={`image-url-${index}`}>Image {index + 1} URL</Label>
                      <Input
                        id={`image-url-${index}`}
                        value={orderImages[index]?.url || ""}
                        onChange={(e) => {
                          const newImages = [...orderImages];
                          newImages[index] = { 
                            url: e.target.value, 
                            altText: newImages[index]?.altText || `Order image ${index + 1}` 
                          };
                          setOrderImages(newImages);
                        }}
                        placeholder="https://..."
                        data-testid={`input-image-url-${index}`}
                      />
                      {orderImages[index]?.url && (
                        <div className="relative">
                          <img 
                            src={orderImages[index].url} 
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded border"
                            onError={(e) => {
                              e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999'%3EInvalid%3C/text%3E%3C/svg%3E";
                            }}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute top-1 right-1 bg-white/80 hover:bg-white"
                            onClick={() => {
                              const newImages = orderImages.filter((_, i) => i !== index);
                              setOrderImages(newImages);
                            }}
                            data-testid={`button-remove-image-${index}`}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Configuration and Notes */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="shipping-country">{t('shippingCountry')}</Label>
                    <Select value={shippingCountry} onValueChange={setShippingCountry}>
                      <SelectTrigger id="shipping-country" data-testid="select-shipping-country">
                        <SelectValue placeholder={t('selectCountry')} />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]" position="popper" sideOffset={5}>
                        {shippingCountries.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="shipping-city">{t('shippingCity')}</Label>
                    <Input
                      id="shipping-city"
                      type="text"
                      value={shippingCity}
                      onChange={(e) => setShippingCity(e.target.value)}
                      placeholder={t('enterCity') || 'Enter city'}
                      data-testid="input-shipping-city"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="shipping-category">{t('shippingCategory')}</Label>
                    <Select value={shippingCategory} onValueChange={setShippingCategory}>
                      <SelectTrigger id="shipping-category" data-testid="select-shipping-category">
                        <SelectValue placeholder={t('selectCategory')} />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]" position="popper" sideOffset={5}>
                        <SelectItem value="normal">{t('normal')}</SelectItem>
                        <SelectItem value="perfumes">{t('perfumes')}</SelectItem>
                        <SelectItem value="electronics">{t('electronics')}</SelectItem>
                        <SelectItem value="clothing">{t('clothing')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="shipping-weight">{t('weightKg')}</Label>
                    <Input
                      id="shipping-weight"
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={shippingWeight}
                      onChange={(e) => {
                        setShippingWeight(parseFloat(e.target.value) || 1);
                        // Prompt for LYD exchange rate if not set (only once)
                        if (lydExchangeRate === 0 && !hasPromptedForLydRate) {
                          toast({
                            title: "LYD Exchange Rate",
                            description: "Please enter the LYD exchange rate to see prices in Libyan Dinar",
                            duration: 4000,
                          });
                          setHasPromptedForLydRate(true);
                        }
                      }}
                      data-testid="input-shipping-weight"
                    />
                  </div>
                </div>
                
                {shippingCategory === "clothing" && (
                  <div>
                    <Label htmlFor="clothing-size">Clothing Size (Optional)</Label>
                    <Input
                      id="clothing-size"
                      value={clothingSize}
                      onChange={(e) => setClothingSize(e.target.value)}
                      placeholder="e.g., S, M, L, XL, 42, etc."
                      data-testid="input-clothing-size"
                    />
                  </div>
                )}
                
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    onClick={calculateShippingCost}
                    disabled={calculatingShipping || !shippingCountry || !shippingCategory || orderItems.length === 0}
                    data-testid="button-calculate-shipping"
                  >
                    {calculatingShipping ? t('calculating') : t('calculateShipping')}
                  </Button>
                  
                  {shippingCalculation && (
                    <div className="text-sm text-green-600 font-medium" data-testid="text-shipping-calculated">
                      <div>
                        {t('calculatedShipping')} {shippingCalculation.currency} {shippingCalculation.base_shipping.toFixed(2)}
                        {shippingCalculation.currency !== 'USD' && (
                          <span className="text-blue-600"> {t('convertedToUsd')}</span>
                        )}
                      </div>
                      {lydExchangeRate > 0 && (
                        <div className="text-blue-600 mt-1">
                          ≈ {(calculateTotals().shippingCost * lydExchangeRate).toFixed(2)} LYD
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="lyd-exchange-rate" className="flex items-center gap-2">
                    {t('lydExchangeRate')}
                    {lydExchangeRate === 0 && shippingWeight !== 1 && (
                      <span className="text-xs text-orange-600 font-medium animate-pulse">
                        ← {t('required') || 'Required to see LYD prices'}
                      </span>
                    )}
                  </Label>
                  <Input
                    id="lyd-exchange-rate"
                    type="number"
                    step="0.0001"
                    min="0"
                    value={lydExchangeRate || ""}
                    onChange={(e) => {
                      const rate = parseFloat(e.target.value) || 0;
                      setLydExchangeRate(rate);
                      // Trigger recalculation if shipping was already calculated
                      if (rate > 0 && shippingCalculation) {
                        toast({
                          title: "LYD Calculation Updated",
                          description: `Shipping: ${(calculateTotals().shippingCost * rate).toFixed(2)} LYD | Total: ${(calculateTotals().total * rate).toFixed(2)} LYD`,
                          duration: 3000,
                        });
                      }
                    }}
                    placeholder={t('enterLydRate')}
                    required
                    className={lydExchangeRate === 0 && shippingWeight !== 1 ? "border-orange-400 border-2 animate-pulse" : ""}
                    data-testid="input-lyd-exchange-rate"
                  />
                  {lydExchangeRate > 0 && shippingCalculation && (
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950 rounded text-sm">
                      <div className="font-medium text-blue-900 dark:text-blue-100">
                        Shipping in LYD: {(calculateTotals().shippingCost * lydExchangeRate).toFixed(2)} LYD
                      </div>
                      <div className="text-xs text-blue-700 dark:text-blue-300">
                        Total Order: {(calculateTotals().total * lydExchangeRate).toFixed(2)} LYD
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="notes">{t('notesOptional')}</Label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t('orderNotes')}
                    data-testid="input-notes"
                  />
                </div>
              </div>

              {/* Order Summary */}
              {orderItems.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-4">{t('orderSummary')}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>{t('subtotal')}</span>
                      <div className="text-right">
                        <div data-testid="text-subtotal">${calculateTotals().subtotal.toFixed(2)}</div>
                        {lydExchangeRate > 0 && (
                          <div className="text-xs text-blue-600 font-medium">
                            {(calculateTotals().subtotal * lydExchangeRate).toFixed(2)} LYD
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('shipping')}</span>
                      <div className="text-right">
                        <div data-testid="text-shipping">
                          {calculateTotals().currency} {calculateTotals().shippingCost.toFixed(2)}
                        </div>
                        {lydExchangeRate > 0 && (
                          <div className="text-xs text-blue-600 font-medium">
                            {(calculateTotals().shippingCost * lydExchangeRate).toFixed(2)} LYD
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between font-medium text-lg border-t pt-2">
                      <span>{t('total')}:</span>
                      <div className="text-right">
                        {lydExchangeRate > 0 ? (
                          <>
                            <div className="text-lg text-blue-600 font-bold" data-testid="text-total">
                              {(calculateTotals().total * lydExchangeRate).toFixed(2)} LYD
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ({calculateTotals().currency} {calculateTotals().total.toFixed(2)})
                            </div>
                          </>
                        ) : (
                          <div data-testid="text-total">
                            {calculateTotals().currency} {calculateTotals().total.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="border-t pt-3 space-y-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="has-down-payment"
                          checked={hasDownPayment}
                          onChange={(e) => {
                            setHasDownPayment(e.target.checked);
                            if (!e.target.checked) {
                              setDownPayment(0);
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-300"
                          data-testid="checkbox-has-down-payment"
                        />
                        <Label htmlFor="has-down-payment" className="text-sm font-medium cursor-pointer">
                          {t('hasDownPayment') || 'Is there a down payment?'}
                        </Label>
                      </div>
                      {hasDownPayment && (
                        <div>
                          <Label htmlFor="down-payment" className="text-sm">{t('downPaymentAmount') || 'Down Payment Amount'}</Label>
                          <Input
                            id="down-payment"
                            type="number"
                            step="0.01"
                            min="0"
                            max={calculateTotals().total}
                            value={downPayment}
                            onChange={(e) => setDownPayment(parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="mt-1"
                            data-testid="input-down-payment"
                          />
                        </div>
                      )}
                      {downPayment > 0 && (
                        <div className="flex justify-between text-orange-600 font-medium">
                          <span>{t('remainingBalance')}:</span>
                          <div className="text-right">
                            {lydExchangeRate > 0 ? (
                              <>
                                <div className="font-bold" data-testid="text-payment-remaining">
                                  {((calculateTotals().total - downPayment) * lydExchangeRate).toFixed(2)} LYD
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  (${(calculateTotals().total - downPayment).toFixed(2)})
                                </div>
                              </>
                            ) : (
                              <div data-testid="text-payment-remaining">
                                ${(calculateTotals().total - downPayment).toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between text-green-600 font-medium border-t pt-2">
                      <span>{t('estimatedProfit')}</span>
                      <div className="text-right">
                        {lydExchangeRate > 0 ? (
                          <>
                            <div className="font-bold" data-testid="text-profit">
                              {(calculateTotals().profit * lydExchangeRate).toFixed(2)} LYD
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ({calculateTotals().currency} {calculateTotals().profit.toFixed(2)})
                            </div>
                          </>
                        ) : (
                          <div data-testid="text-profit">
                            {calculateTotals().currency} {calculateTotals().profit.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="space-y-2">
                {!shippingCalculation && orderItems.length > 0 && (
                  <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded" data-testid="text-shipping-optional">
                    {t('shippingOptional') || 'Shipping calculation is optional. You can add shipping details later.'}
                  </div>
                )}
                {shippingCalculation && isShippingCalculationStale() && (
                  <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded" data-testid="text-shipping-stale">
                    {t('recalculateShipping') || 'Items have changed. Consider recalculating shipping.'}
                  </div>
                )}
                <div className="flex justify-end space-x-2 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => handleCloseModal(false)}
                    data-testid="button-cancel"
                  >
                    {t('cancel')}
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={
                      createOrderMutation.isPending || 
                      !selectedCustomerId || 
                      orderItems.length === 0
                    }
                    data-testid="button-create-order"
                  >
                    {createOrderMutation.isPending ? t('creating') : t('createOrder')}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Order Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="modal-edit-order">
            <DialogHeader>
              <DialogTitle>{t('editOrderTitle')}</DialogTitle>
            </DialogHeader>
            {editingOrder && (
              <form onSubmit={handleEditSubmit} className="space-y-6">
                {/* Order Details (Read-only) */}
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">{t('orderId')}</span>
                      <span className="ml-2">{editingOrder.id.substring(0, 8)}</span>
                    </div>
                    <div>
                      <span className="font-medium">{t('customerLabel')}</span>
                      <span className="ml-2">{editingOrder.customer.firstName} {editingOrder.customer.lastName}</span>
                    </div>
                    <div>
                      <span className="font-medium">{t('totalAmountLabel')}</span>
                      <span className="ml-2">${parseFloat(editingOrder.totalAmount).toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="font-medium">{t('created')}</span>
                      <span className="ml-2">{new Date(editingOrder.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Editable Fields */}
                <div className="space-y-4">
                  {/* Order Items */}
                  {editableItems.length > 0 && (
                    <div>
                      <Label className="mb-2 block">{t('orderItems')}</Label>
                      <div className="border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                              <tr>
                                <th className="px-3 py-2 text-left">{t('shippingCodeLabel')}</th>
                                <th className="px-3 py-2 text-left">{t('productCode')}</th>
                                <th className="px-3 py-2 text-center">{t('quantity')}</th>
                                <th className="px-3 py-2 text-center">No. of Pieces</th>
                                <th className="px-3 py-2 text-right">{t('originalPrice')}</th>
                                <th className="px-3 py-2 text-right">{t('discountedPrice')}</th>
                                <th className="px-3 py-2 text-right">{t('unitPrice')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {editableItems.map((item, index) => (
                                <tr key={item.id} className="border-t">
                                  <td className="px-3 py-2">{item.productName}</td>
                                  <td className="px-3 py-2">
                                    <Input
                                      type="text"
                                      value={item.productCode || ''}
                                      onChange={(e) => handleItemChange(index, 'productCode', e.target.value)}
                                      className="w-24"
                                      placeholder={t('skuPlaceholder')}
                                      data-testid={`input-edit-product-code-${index}`}
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <Input
                                      type="number"
                                      min="1"
                                      value={item.quantity}
                                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                                      className="w-20 text-center"
                                      data-testid={`input-edit-quantity-${index}`}
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <Input
                                      type="number"
                                      min="1"
                                      value={item.numberOfPieces || 1}
                                      onChange={(e) => handleItemChange(index, 'numberOfPieces', parseInt(e.target.value))}
                                      className="w-20 text-center"
                                      data-testid={`input-edit-number-of-pieces-${index}`}
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={item.originalPrice || ''}
                                      onChange={(e) => handleItemChange(index, 'originalPrice', e.target.value)}
                                      className="w-24 text-right"
                                      data-testid={`input-edit-original-price-${index}`}
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={item.discountedPrice || ''}
                                      onChange={(e) => handleItemChange(index, 'discountedPrice', e.target.value)}
                                      className="w-24 text-right"
                                      data-testid={`input-edit-discounted-price-${index}`}
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={item.unitPrice || ''}
                                      onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                                      className="w-24 text-right"
                                      data-testid={`input-edit-unit-price-${index}`}
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {!editingOrder.shippingCountry && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
                      {t('shippingRecalculationNote')}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="edit-status">{t('orderStatus')}</Label>
                      <Select value={editOrderStatus} onValueChange={setEditOrderStatus}>
                        <SelectTrigger id="edit-status" data-testid="select-edit-status">
                          <SelectValue placeholder={t('selectStatus')} />
                        </SelectTrigger>
                        <SelectContent className="z-[9999]" position="popper" sideOffset={5}>
                          <SelectItem value="pending">{t('pending')}</SelectItem>
                          <SelectItem value="processing">{t('processing')}</SelectItem>
                          <SelectItem value="shipped">{t('shipped')}</SelectItem>
                          <SelectItem value="delivered">{t('delivered')}</SelectItem>
                          <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
                          <SelectItem value="partially_arrived">{t('partially_arrived')}</SelectItem>
                          <SelectItem value="ready_to_collect">{t('ready_to_collect')}</SelectItem>
                          <SelectItem value="with_shipping_company">{t('with_shipping_company')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-down-payment">{t('downPaymentDollar')}</Label>
                      <Input
                        id="edit-down-payment"
                        type="number"
                        step="0.01"
                        min="0"
                        value={editingOrder.downPayment || 0}
                        onChange={(e) => {
                          const newDownPayment = parseFloat(e.target.value) || 0;
                          const total = parseFloat(editingOrder.totalAmount || "0");
                          const newRemaining = total - newDownPayment;
                          setEditingOrder(prev => {
                            if (!prev) return null;
                            return {
                              ...prev,
                              downPayment: newDownPayment.toFixed(2),
                              remainingBalance: newRemaining.toFixed(2)
                            };
                          });
                        }}
                        data-testid="input-edit-down-payment"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-shipping-weight">{t('shippingWeightKg')}</Label>
                      <Input
                        id="edit-shipping-weight"
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={editingOrder.shippingWeight || 1}
                        onChange={async (e) => {
                          const newWeight = parseFloat(e.target.value) || 1;

                          // Always update the weight first
                          setEditingOrder(prev => {
                            if (!prev) return null;
                            return { ...prev, shippingWeight: newWeight.toFixed(2) };
                          });

                          // Then recalculate shipping if country and category are available
                          if (editingOrder.shippingCountry && editingOrder.shippingCategory && editableItems.length > 0) {
                            try {
                              const itemsTotal = editableItems.reduce((sum, item) => 
                                sum + (parseFloat(item.totalPrice as any) || 0), 0
                              );
                              
                              const response = await fetch('/api/calculate-shipping', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                body: JSON.stringify({
                                  country: editingOrder.shippingCountry,
                                  category: editingOrder.shippingCategory,
                                  weight: newWeight,
                                  orderValue: itemsTotal
                                })
                              });

                              if (response.ok) {
                                const calc = await response.json();
                                const newShippingCost = parseFloat(calc.base_shipping);
                                const newTotal = itemsTotal + newShippingCost;
                                
                                setEditingOrder(prev => {
                                  if (!prev) return null;
                                  return {
                                    ...prev,
                                    shippingWeight: newWeight.toFixed(2),
                                    shippingCost: newShippingCost.toFixed(2),
                                    totalAmount: newTotal.toFixed(2),
                                  };
                                });
                                
                                const lydRate = parseFloat(editingOrder.lydExchangeRate || "0");
                                const shippingMsg = lydRate > 0 
                                  ? `${(newShippingCost * lydRate).toFixed(2)} LYD ($${newShippingCost.toFixed(2)})`
                                  : `$${newShippingCost.toFixed(2)}`;
                                const totalMsg = lydRate > 0
                                  ? `${(newTotal * lydRate).toFixed(2)} LYD ($${newTotal.toFixed(2)})`
                                  : `$${newTotal.toFixed(2)}`;
                                
                                toast({
                                  title: t('shippingRecalculated'),
                                  description: `Weight: ${newWeight}kg, Shipping: ${shippingMsg}, Total: ${totalMsg}`,
                                });
                              }
                            } catch (error) {
                              console.error('Error recalculating shipping:', error);
                            }
                          }
                        }}
                        data-testid="input-edit-shipping-weight"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <Label htmlFor="edit-lyd-exchange-rate">{t('lydExchangeRate')}</Label>
                    <Input
                      id="edit-lyd-exchange-rate"
                      type="number"
                      step="0.0001"
                      min="0"
                      value={editingOrder.lydExchangeRate || ""}
                      onChange={(e) => {
                        setEditingOrder(prev => {
                          if (!prev) return null;
                          return { ...prev, lydExchangeRate: e.target.value };
                        });
                      }}
                      placeholder={t('enterLydRate')}
                      data-testid="input-edit-lyd-exchange-rate"
                    />
                    {editingOrder.lydExchangeRate && parseFloat(editingOrder.lydExchangeRate) > 0 && (
                      <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950 rounded text-sm">
                        <div className="font-medium text-blue-900 dark:text-blue-100">
                          Total in LYD: {(parseFloat(editingOrder.totalAmount || "0") * parseFloat(editingOrder.lydExchangeRate)).toFixed(2)} LYD
                        </div>
                        <div className="text-xs text-blue-700 dark:text-blue-300">
                          Remaining: {(parseFloat(editingOrder.remainingBalance || "0") * parseFloat(editingOrder.lydExchangeRate)).toFixed(2)} LYD
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-shipping-country">{t('shippingCountry')}</Label>
                      <Select 
                        value={editingOrder.shippingCountry || ""} 
                        onValueChange={async (value) => {
                          setEditingOrder(prev => {
                            if (!prev) return null;
                            return { ...prev, shippingCountry: value };
                          });

                          // Trigger recalculation if all data available
                          if (value && editingOrder.shippingCategory && editableItems.length > 0) {
                            try {
                              const itemsTotal = editableItems.reduce((sum, item) => 
                                sum + (parseFloat(item.totalPrice as any) || 0), 0
                              );
                              const weight = parseFloat(editingOrder.shippingWeight || "1");
                              
                              const response = await fetch('/api/calculate-shipping', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                body: JSON.stringify({
                                  country: value,
                                  category: editingOrder.shippingCategory,
                                  weight: weight,
                                  orderValue: itemsTotal
                                })
                              });

                              if (response.ok) {
                                const calc = await response.json();
                                const newShippingCost = parseFloat(calc.base_shipping);
                                const newTotal = itemsTotal + newShippingCost;
                                
                                setEditingOrder(prev => {
                                  if (!prev) return null;
                                  return {
                                    ...prev,
                                    shippingCountry: value,
                                    shippingCost: newShippingCost.toFixed(2),
                                    totalAmount: newTotal.toFixed(2),
                                  };
                                });
                                
                                const lydRate = parseFloat(editingOrder.lydExchangeRate || "0");
                                const shippingMsg = lydRate > 0 
                                  ? `${(newShippingCost * lydRate).toFixed(2)} LYD ($${newShippingCost.toFixed(2)})`
                                  : `$${newShippingCost.toFixed(2)}`;
                                const totalMsg = lydRate > 0
                                  ? `${(newTotal * lydRate).toFixed(2)} LYD ($${newTotal.toFixed(2)})`
                                  : `$${newTotal.toFixed(2)}`;
                                
                                toast({
                                  title: t('shippingRecalculated'),
                                  description: `Shipping: ${shippingMsg}, Total: ${totalMsg}`,
                                });
                              }
                            } catch (error) {
                              console.error('Error recalculating shipping:', error);
                            }
                          }
                        }}
                      >
                        <SelectTrigger id="edit-shipping-country" data-testid="select-edit-shipping-country">
                          <SelectValue placeholder={t('selectCountry')} />
                        </SelectTrigger>
                        <SelectContent className="z-[9999]" position="popper" sideOffset={5}>
                          {shippingCountries.map((country) => (
                            <SelectItem key={country} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-shipping-category">{t('shippingCategory')}</Label>
                      <Select 
                        value={editingOrder.shippingCategory || ""} 
                        onValueChange={async (value) => {
                          // Always update category first
                          setEditingOrder(prev => {
                            if (!prev) return null;
                            return { ...prev, shippingCategory: value };
                          });

                          // Trigger recalculation if all data available
                          if (editingOrder.shippingCountry && value && editableItems.length > 0) {
                            try {
                              const itemsTotal = editableItems.reduce((sum, item) => 
                                sum + (parseFloat(item.totalPrice as any) || 0), 0
                              );
                              const weight = parseFloat(editingOrder.shippingWeight || "1");
                              
                              const response = await fetch('/api/calculate-shipping', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                body: JSON.stringify({
                                  country: editingOrder.shippingCountry,
                                  category: value,
                                  weight: weight,
                                  orderValue: itemsTotal
                                })
                              });

                              if (response.ok) {
                                const calc = await response.json();
                                const newShippingCost = parseFloat(calc.base_shipping);
                                const newTotal = itemsTotal + newShippingCost;
                                
                                setEditingOrder(prev => {
                                  if (!prev) return null;
                                  return {
                                    ...prev,
                                    shippingCategory: value,
                                    shippingCost: newShippingCost.toFixed(2),
                                    totalAmount: newTotal.toFixed(2),
                                  };
                                });
                                
                                const lydRate = parseFloat(editingOrder.lydExchangeRate || "0");
                                const shippingMsg = lydRate > 0 
                                  ? `${(newShippingCost * lydRate).toFixed(2)} LYD ($${newShippingCost.toFixed(2)})`
                                  : `$${newShippingCost.toFixed(2)}`;
                                const totalMsg = lydRate > 0
                                  ? `${(newTotal * lydRate).toFixed(2)} LYD ($${newTotal.toFixed(2)})`
                                  : `$${newTotal.toFixed(2)}`;
                                
                                toast({
                                  title: t('shippingRecalculated'),
                                  description: `Shipping: ${shippingMsg}, Total: ${totalMsg}`,
                                });
                              }
                            } catch (error) {
                              console.error('Error recalculating shipping:', error);
                            }
                          }
                        }}
                      >
                        <SelectTrigger id="edit-shipping-category" data-testid="select-edit-shipping-category">
                          <SelectValue placeholder={t('selectCategory')} />
                        </SelectTrigger>
                        <SelectContent className="z-[9999]" position="popper" sideOffset={5}>
                          <SelectItem value="normal">{t('normalShipping')}</SelectItem>
                          <SelectItem value="express">{t('expressShipping')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {editingOrder.shippingCountry && editingOrder.shippingCategory && (
                    <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded text-sm space-y-1">
                      <div className="font-medium text-blue-900 dark:text-blue-100">Shipping Details:</div>
                      <div className="text-blue-800 dark:text-blue-200">Country: {editingOrder.shippingCountry}, Category: {editingOrder.shippingCategory}</div>
                      {editingOrder.lydExchangeRate && parseFloat(editingOrder.lydExchangeRate) > 0 ? (
                        <>
                          <div className="text-blue-800 dark:text-blue-200">
                            Shipping Cost: <span className="font-bold">{(parseFloat(editingOrder.shippingCost || "0") * parseFloat(editingOrder.lydExchangeRate)).toFixed(2)} LYD</span>
                            <span className="text-xs ml-2">(${parseFloat(editingOrder.shippingCost || "0").toFixed(2)})</span>
                          </div>
                          <div className="font-medium pt-1 border-t border-blue-200 dark:border-blue-700 text-blue-900 dark:text-blue-100">
                            Total: <span className="font-bold">{(parseFloat(editingOrder.totalAmount || "0") * parseFloat(editingOrder.lydExchangeRate)).toFixed(2)} LYD</span>
                            <span className="text-xs ml-2">(${parseFloat(editingOrder.totalAmount || "0").toFixed(2)})</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-blue-800 dark:text-blue-200">Shipping Cost: ${parseFloat(editingOrder.shippingCost || "0").toFixed(2)}</div>
                          <div className="font-medium pt-1 border-t border-blue-200 dark:border-blue-700 text-blue-900 dark:text-blue-100">Total: ${parseFloat(editingOrder.totalAmount || "0").toFixed(2)}</div>
                        </>
                      )}
                    </div>
                  )}

                  <div>
                    <Label htmlFor="edit-tracking-number">{t('trackingNumber')}</Label>
                    <Input
                      id="edit-tracking-number"
                      type="text"
                      value={editingOrder.trackingNumber || ""}
                      onChange={(e) => {
                        setEditingOrder(prev => {
                          if (!prev) return null;
                          return { ...prev, trackingNumber: e.target.value };
                        });
                      }}
                      placeholder={t('enterTrackingNumber')}
                      data-testid="input-edit-tracking-number"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-notes">{t('orderNotesLabel')}</Label>
                    <textarea
                      id="edit-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full min-h-[100px] p-3 border rounded-md resize-none"
                      placeholder={t('addOrderNotes')}
                      data-testid="textarea-edit-notes"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
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
                    disabled={updateOrderMutation.isPending}
                    data-testid="button-update-order"
                  >
                    {updateOrderMutation.isPending ? t('updating') : t('updateOrder')}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* View Order Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={(open) => {
          setIsViewModalOpen(open);
          if (!open) setViewingOrder(null);
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="modal-view-order">
            <DialogHeader>
              <DialogTitle>{t('orderDetailsTitle')}</DialogTitle>
            </DialogHeader>
            {viewingOrder && (
              <div className="space-y-6">
                {/* Order Summary */}
                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <h3 className="font-semibold text-lg mb-3">{t('orderInformation')}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">{t('orderNumberLabel')}</span>
                      <p className="mt-1" data-testid="text-view-order-number">{viewingOrder.orderNumber}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">{t('orderIdLabel')}</span>
                      <p className="mt-1" data-testid="text-view-order-id">{viewingOrder.id.substring(0, 8)}...</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">{t('statusLabel')}</span>
                      <div className="mt-1">
                        <Badge className={getStatusColor(viewingOrder.status)} data-testid="badge-view-status">
                          {t(viewingOrder.status)}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">{t('createdDate')}</span>
                      <p className="mt-1" data-testid="text-view-created">{new Date(viewingOrder.createdAt).toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}</p>
                    </div>
                    {viewingOrder.trackingNumber && (
                      <div className="col-span-2">
                        <span className="font-medium text-muted-foreground">{t('trackingNumber')}</span>
                        <p className="mt-1 font-semibold text-primary" data-testid="text-view-tracking">{viewingOrder.trackingNumber}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Information */}
                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <h3 className="font-semibold text-lg mb-3">{t('customerInformation')}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">{t('nameLabel')}</span>
                      <p className="mt-1" data-testid="text-view-customer-name">
                        {viewingOrder.customer.firstName} {viewingOrder.customer.lastName}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">{t('emailLabel')}</span>
                      <p className="mt-1" data-testid="text-view-customer-email">{viewingOrder.customer.email}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">{t('phoneLabel')}</span>
                      <p className="mt-1" data-testid="text-view-customer-phone">{viewingOrder.customer.phone || t('naLabel')}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">{t('countryLabel')}</span>
                      <p className="mt-1" data-testid="text-view-customer-country">{viewingOrder.customer.country}</p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                {isLoadingViewOrder ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-2">{t('loadingOrderItems')}</p>
                  </div>
                ) : viewOrderWithItems?.items && viewOrderWithItems.items.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">{t('orderItemsTitle')}</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('product')}</TableHead>
                            <TableHead className="text-right">{t('quantity')}</TableHead>
                            <TableHead className="text-right">{t('unitPriceLabel')}</TableHead>
                            <TableHead className="text-right">{t('total')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {viewOrderWithItems.items.map((item: any, index: number) => (
                            <TableRow key={index} data-testid={`row-view-item-${index}`}>
                              <TableCell data-testid={`text-view-product-${index}`}>{item.productName}</TableCell>
                              <TableCell className="text-right" data-testid={`text-view-quantity-${index}`}>
                                {item.quantity}
                              </TableCell>
                              <TableCell className="text-right" data-testid={`text-view-unit-price-${index}`}>
                                ${parseFloat(item.unitPrice).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right" data-testid={`text-view-item-total-${index}`}>
                                ${parseFloat(item.totalPrice).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    {t('noItemsFound')}
                  </div>
                )}

                {/* Order Totals */}
                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <h3 className="font-semibold text-lg mb-3">{t('orderSummary')}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('subtotalLabel')}</span>
                      <span data-testid="text-view-subtotal">${(parseFloat(viewingOrder.totalAmount) - parseFloat(viewingOrder.shippingCost)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('shippingCostLabel')}</span>
                      <span data-testid="text-view-shipping">${parseFloat(viewingOrder.shippingCost).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t font-semibold text-base">
                      <span>{t('totalAmountLabelColon')}</span>
                      <span data-testid="text-view-total">${parseFloat(viewingOrder.totalAmount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>{t('downPaymentLabel')}:</span>
                      <span data-testid="text-view-down-payment">${parseFloat(viewingOrder.downPayment || "0").toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-orange-600">
                      <span>{t('remainingBalance')}:</span>
                      <span data-testid="text-view-remaining-balance">${parseFloat(viewingOrder.remainingBalance || "0").toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground border-t pt-2">
                      <span>{t('estimatedProfitLabel')}</span>
                      <span data-testid="text-view-profit">${parseFloat(viewingOrder.totalProfit).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Order Notes */}
                {viewingOrder.notes && (
                  <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                    <h3 className="font-semibold text-lg">{t('notesTitle')}</h3>
                    <p className="text-sm whitespace-pre-wrap" data-testid="text-view-notes">{viewingOrder.notes}</p>
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsViewModalOpen(false)}
                    data-testid="button-close-view"
                  >
                    {t('close')}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Print Invoice Modal */}
        <Dialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" data-testid="modal-print-invoice">
            <DialogHeader>
              <div className="flex justify-between items-center">
                <DialogTitle>{t('invoicePreview')}</DialogTitle>
                <div className="flex space-x-2">
                  <Button onClick={handlePrint} data-testid="button-print">
                    <Printer className="w-4 h-4 mr-2" />
                    {t('print')}
                  </Button>
                  <Button variant="outline" onClick={() => setIsPrintModalOpen(false)}>
                    {t('close')}
                  </Button>
                </div>
              </div>
            </DialogHeader>
            {isLoadingOrderItems ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">{t('loadingOrderDetails')}</p>
              </div>
            ) : orderWithItems ? (
              <Invoice order={orderWithItems} lydExchangeRate={globalLydExchangeRate} onPrint={handlePrint} />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">{t('failedLoadDetails')}</p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent data-testid="dialog-delete-order">
            <AlertDialogHeader>
              <AlertDialogTitle>{t('deleteOrderTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('deleteOrderConfirmation')}
                {deletingOrder && (
                  <div className="mt-2 p-2 bg-muted rounded text-sm">
                    <strong>{t('orderHash')}{deletingOrder.orderNumber}</strong> - {deletingOrder.customer.firstName} {deletingOrder.customer.lastName}
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
    </div>
  );
}
