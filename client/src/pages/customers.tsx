import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Users, Search, Filter, X, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Customer, InsertCustomer, OrderWithCustomer } from "@shared/schema";

export default function Customers() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [countryFilters, setCountryFilters] = useState<string[]>([]);
  const [formData, setFormData] = useState<InsertCustomer>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    postalCode: "",
    shippingCode: "",
  });
  const [editFormData, setEditFormData] = useState<InsertCustomer>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    postalCode: "",
    shippingCode: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/customers");
      return response.json() as Promise<Customer[]>;
    },
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/orders");
      return response.json() as Promise<OrderWithCustomer[]>;
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (customerData: InsertCustomer) => {
      const response = await apiRequest("POST", "/api/customers", customerData);
      if (!response.ok) {
        throw new Error("Failed to create customer");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: t("success"),
        description: t("customerCreatedSuccess"),
      });
      setIsModalOpen(false);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        country: "",
        postalCode: "",
        shippingCode: "",
      });
    },
    onError: (error) => {
      toast({
        title: t("error"),
        description: t("failedCreateCustomer"),
        variant: "destructive",
      });
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, customerData }: { id: string; customerData: InsertCustomer }) => {
      const response = await apiRequest("PUT", `/api/customers/${id}`, customerData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update customer");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: t("success"),
        description: t("customerUpdatedSuccess"),
      });
      setIsEditModalOpen(false);
      setEditingCustomer(null);
      setEditFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        country: "",
        postalCode: "",
        shippingCode: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/customers/${id}`);
      if (!response.ok) {
        throw new Error("Failed to delete customer");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: t("success"),
        description: t("customerDeletedSuccess"),
      });
      setIsDeleteDialogOpen(false);
      setDeletingCustomer(null);
    },
    onError: () => {
      toast({
        title: t("error"),
        description: t("failedDeleteCustomer"),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCustomerMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    updateCustomerMutation.mutate({ id: editingCustomer.id, customerData: editFormData });
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditFormData({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone || "",
      address: customer.address || "",
      city: customer.city || "",
      country: customer.country || "",
      postalCode: customer.postalCode || "",
      shippingCode: customer.shippingCode || "",
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (customer: Customer) => {
    setViewingCustomer(customer);
    setIsViewModalOpen(true);
  };

  const openDeleteDialog = (customer: Customer) => {
    setDeletingCustomer(customer);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (!deletingCustomer) return;
    deleteCustomerMutation.mutate(deletingCustomer.id);
  };

  const toggleCountryFilter = (country: string) => {
    setCountryFilters(prev =>
      prev.includes(country)
        ? prev.filter(c => c !== country)
        : [...prev, country]
    );
  };

  const uniqueCountries = Array.from(new Set(customers.map(c => c.country).filter(Boolean))) as string[];

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.email?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesCountry = countryFilters.length === 0 || countryFilters.includes(customer.country || "");
    return matchesSearch && matchesCountry;
  });

  return (
    <div className="flex-1 flex flex-col">
      <Header 
        title={t("customers")} 
        description={t("customersDescription")} 
      />
      
      <div className="flex-1 p-6 space-y-6">
        {/* Actions and Search */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("searchCustomers")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
                data-testid="input-search-customers"
              />
            </div>
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" data-testid="button-filter-customers">
                  <Filter className="w-4 h-4 mr-2" />
                  {t("filter")}
                  {countryFilters.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {countryFilters.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" data-testid="popover-filter-customers">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-3">{t("filterByCountry")}</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {uniqueCountries.length > 0 ? (
                        uniqueCountries.map((country) => (
                          <div key={country} className="flex items-center space-x-2">
                            <Checkbox
                              id={`filter-${country}`}
                              checked={countryFilters.includes(country)}
                              onCheckedChange={() => toggleCountryFilter(country)}
                              data-testid={`checkbox-filter-${country}`}
                            />
                            <Label
                              htmlFor={`filter-${country}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {country}
                            </Label>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">{t("noCountriesAvailable")}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCountryFilters([])}
                      data-testid="button-reset-filters"
                    >
                      {t("reset")}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setIsFilterOpen(false)}
                      data-testid="button-apply-filters"
                    >
                      {t("apply")}
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <Button onClick={() => setIsModalOpen(true)} data-testid="button-new-customer">
            <Plus className="w-4 h-4 mr-2" />
            {t("addCustomer")}
          </Button>
        </div>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              {t("customersCount")} ({filteredCustomers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">{t("loadingCustomers")}</p>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">{t("noCustomersFound")}</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? t("noCustomersMatch") : t("getStartedFirstCustomer")}
                </p>
                {!searchTerm && (
                  <Button className="mt-4" onClick={() => setIsModalOpen(true)} data-testid="button-add-first-customer">
                    <Plus className="w-4 h-4 mr-2" />
                    {t("addFirstCustomer")}
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("name")}</TableHead>
                    <TableHead>{t("email")}</TableHead>
                    <TableHead>{t("phone")}</TableHead>
                    <TableHead>{t("country")}</TableHead>
                    <TableHead>{t("customerCreated")}</TableHead>
                    <TableHead>{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                      <TableCell className="font-medium" data-testid={`text-name-${customer.id}`}>
                        {customer.firstName} {customer.lastName}
                      </TableCell>
                      <TableCell data-testid={`text-email-${customer.id}`}>
                        {customer.email}
                      </TableCell>
                      <TableCell data-testid={`text-phone-${customer.id}`}>
                        {customer.phone || t("emptyPhone")}
                      </TableCell>
                      <TableCell data-testid={`text-country-${customer.id}`}>
                        {customer.country}
                      </TableCell>
                      <TableCell data-testid={`text-created-${customer.id}`}>
                        {new Date(customer.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditModal(customer)} data-testid={`button-edit-customer-${customer.id}`}>
                            {t("edit")}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openViewModal(customer)}
                            data-testid={`button-view-customer-${customer.id}`}
                          >
                            {t("view")}
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => openDeleteDialog(customer)}
                            data-testid={`button-delete-customer-${customer.id}`}
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

        {/* Customer Creation Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-md" data-testid="modal-create-customer">
            <DialogHeader>
              <DialogTitle>{t("addNewCustomer")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name*</Label>
                <Input
                  id="fullName"
                  value={formData.firstName + (formData.lastName ? ' ' + formData.lastName : '')}
                  onChange={(e) => {
                    const nameParts = e.target.value.trim().split(/\s+/);
                    const firstName = nameParts[0] || "";
                    const lastName = nameParts.slice(1).join(" ") || "";
                    setFormData(prev => ({ ...prev, firstName, lastName }));
                  }}
                  placeholder="Enter full name"
                  required
                  data-testid="input-full-name"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone*</Label>
                <Input
                  id="phone"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                  required
                  data-testid="input-phone"
                />
              </div>

              <div>
                <Label htmlFor="city">City*</Label>
                <Input
                  id="city"
                  value={formData.city || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Enter city"
                  required
                  data-testid="input-city"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)}
                  data-testid="button-cancel"
                >
                  {t("cancel")}
                </Button>
                <Button 
                  type="submit" 
                  disabled={createCustomerMutation.isPending}
                  data-testid="button-save-customer"
                >
                  {createCustomerMutation.isPending ? t("creatingCustomer") : t("createCustomer")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Customer Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-md" data-testid="modal-edit-customer">
            <DialogHeader>
              <DialogTitle>{t("editCustomer")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-firstName">{t("firstNameRequired")}</Label>
                  <Input
                    id="edit-firstName"
                    value={editFormData.firstName}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    required
                    data-testid="input-edit-first-name"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-lastName">{t("lastNameRequired")}</Label>
                  <Input
                    id="edit-lastName"
                    value={editFormData.lastName}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    required
                    data-testid="input-edit-last-name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-email">{t("emailRequired")}</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editFormData.email || ""}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  data-testid="input-edit-email"
                />
              </div>

              <div>
                <Label htmlFor="edit-phone">{t("phone")}</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  value={editFormData.phone || ""}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                  data-testid="input-edit-phone"
                />
              </div>

              <div>
                <Label htmlFor="edit-address">{t("address")}</Label>
                <Input
                  id="edit-address"
                  value={editFormData.address || ""}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, address: e.target.value }))}
                  data-testid="input-edit-address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-city">{t("city")}</Label>
                  <Input
                    id="edit-city"
                    value={editFormData.city || ""}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, city: e.target.value }))}
                    data-testid="input-edit-city"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-postalCode">{t("postalCode")}</Label>
                  <Input
                    id="edit-postalCode"
                    value={editFormData.postalCode || ""}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                    data-testid="input-edit-postal-code"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-country">{t("countryRequired")}</Label>
                <Input
                  id="edit-country"
                  value={editFormData.country || ""}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, country: e.target.value }))}
                  required
                  data-testid="input-edit-country"
                />
              </div>

              <div>
                <Label htmlFor="edit-shippingCode">{t("shippingCode")}</Label>
                <Input
                  id="edit-shippingCode"
                  value={editFormData.shippingCode || ""}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, shippingCode: e.target.value }))}
                  data-testid="input-edit-shipping-code"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditModalOpen(false)}
                  data-testid="button-cancel-edit"
                >
                  {t("cancel")}
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateCustomerMutation.isPending}
                  data-testid="button-update-customer"
                >
                  {updateCustomerMutation.isPending ? t("updatingCustomer") : t("updateCustomer")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Customer Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={(open) => {
          setIsViewModalOpen(open);
          if (!open) setViewingCustomer(null);
        }}>
          <DialogContent className="max-w-2xl" data-testid="modal-view-customer">
            <DialogHeader>
              <DialogTitle>{t("customerDetails")}</DialogTitle>
            </DialogHeader>
            {viewingCustomer && (
              <div className="space-y-6">
                {/* Personal Information */}
                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <h3 className="font-semibold text-lg mb-3">{t("personalInformation")}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">{t("customerId")}</span>
                      <p className="mt-1" data-testid="text-view-customer-id">{viewingCustomer.id.substring(0, 8)}...</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">{t("fullName")}</span>
                      <p className="mt-1" data-testid="text-view-customer-name">
                        {viewingCustomer.firstName} {viewingCustomer.lastName}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">{t("emailLabel")}</span>
                      <p className="mt-1" data-testid="text-view-customer-email">{viewingCustomer.email}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">{t("phoneLabel")}</span>
                      <p className="mt-1" data-testid="text-view-customer-phone">{viewingCustomer.phone || t("naLabel")}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">{t("createdDate")}</span>
                      <p className="mt-1" data-testid="text-view-customer-created">
                        {new Date(viewingCustomer.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <h3 className="font-semibold text-lg mb-3">{t("addressInformation")}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">{t("streetAddress")}</span>
                      <p className="mt-1" data-testid="text-view-customer-address">
                        {viewingCustomer.address || t("naLabel")}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">{t("city")}:</span>
                      <p className="mt-1" data-testid="text-view-customer-city">{viewingCustomer.city || t("naLabel")}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">{t("postalCode")}:</span>
                      <p className="mt-1" data-testid="text-view-customer-postal">
                        {viewingCustomer.postalCode || t("naLabel")}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">{t("country")}:</span>
                      <p className="mt-1" data-testid="text-view-customer-country">{viewingCustomer.country}</p>
                    </div>
                    {viewingCustomer.shippingCode && (
                      <div className="col-span-2">
                        <span className="font-medium text-muted-foreground">Shipping Code:</span>
                        <p className="mt-1" data-testid="text-view-customer-shipping-code">{viewingCustomer.shippingCode}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Information */}
                {(() => {
                  const customerOrders = orders.filter(order => order.customerId === viewingCustomer.id);
                  const totalAmount = customerOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
                  const totalDownPayment = customerOrders.reduce((sum, order) => sum + parseFloat(order.downPayment || "0"), 0);
                  const totalRemainingBalance = customerOrders.reduce((sum, order) => sum + parseFloat(order.remainingBalance || "0"), 0);
                  
                  return (
                    <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                      <h3 className="font-semibold text-lg mb-3">Payment Summary</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-muted-foreground">Total Orders:</span>
                          <p className="mt-1" data-testid="text-view-total-orders">{customerOrders.length}</p>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">Total Order Amount:</span>
                          <p className="mt-1 font-semibold" data-testid="text-view-total-amount">${totalAmount.toFixed(2)}</p>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">Total Down Payment:</span>
                          <p className="mt-1 text-blue-600 font-semibold" data-testid="text-view-total-down-payment">${totalDownPayment.toFixed(2)}</p>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">Total Remaining Balance:</span>
                          <p className="mt-1 text-red-600 font-semibold" data-testid="text-view-total-remaining-balance">${totalRemainingBalance.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex justify-end pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsViewModalOpen(false)}
                    data-testid="button-close-view-customer"
                  >
                    {t("close")}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent data-testid="dialog-delete-customer">
            <AlertDialogHeader>
              <AlertDialogTitle>{t("deleteCustomerTitle")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("deleteCustomerConfirmation")}
                {deletingCustomer && (
                  <div className="mt-2 p-2 bg-muted rounded text-sm">
                    <strong>{deletingCustomer.firstName} {deletingCustomer.lastName}</strong> - {deletingCustomer.email}
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">{t("cancel")}</AlertDialogCancel>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete();
                  setIsDeleteDialogOpen(false);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-delete"
              >
                {t("delete")}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
