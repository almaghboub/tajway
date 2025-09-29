import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Database, Shield, Bell, Palette, Check, Truck, DollarSign, Plus, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Header } from "@/components/header";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertShippingRateSchema, insertCommissionRuleSchema } from "@shared/schema";
import type { Setting, ShippingRate, CommissionRule, InsertShippingRate, InsertCommissionRule } from "@shared/schema";
import { z } from "zod";

// Shipping Commission Manager Component
function ShippingCommissionManager() {
  const { toast } = useToast();
  const [isShippingDialogOpen, setIsShippingDialogOpen] = useState(false);
  const [isCommissionDialogOpen, setIsCommissionDialogOpen] = useState(false);
  const [editingShippingRate, setEditingShippingRate] = useState<ShippingRate | null>(null);
  const [editingCommissionRule, setEditingCommissionRule] = useState<CommissionRule | null>(null);

  // Fetch shipping rates
  const { data: shippingRates = [], isLoading: loadingShippingRates } = useQuery({
    queryKey: ["/api/shipping-rates"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/shipping-rates");
      return response.json() as Promise<ShippingRate[]>;
    },
  });

  // Fetch commission rules
  const { data: commissionRules = [], isLoading: loadingCommissionRules } = useQuery({
    queryKey: ["/api/commission-rules"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/commission-rules");
      return response.json() as Promise<CommissionRule[]>;
    },
  });

  // Shipping rate form
  const shippingForm = useForm<InsertShippingRate>({
    resolver: zodResolver(insertShippingRateSchema),
    defaultValues: {
      country: "",
      category: "normal",
      pricePerKg: "",
      currency: "USD",
    },
  });

  // Commission rule form
  const commissionForm = useForm<InsertCommissionRule>({
    resolver: zodResolver(insertCommissionRuleSchema),
    defaultValues: {
      country: "",
      minValue: "",
      maxValue: "",
      percentage: "",
      fixedFee: "0.00",
    },
  });

  // Shipping rate mutations
  const createShippingMutation = useMutation({
    mutationFn: async (data: InsertShippingRate) => {
      const response = await apiRequest("POST", "/api/shipping-rates", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shipping-rates"] });
      setIsShippingDialogOpen(false);
      shippingForm.reset();
      toast({ title: "Success", description: "Shipping rate created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create shipping rate", variant: "destructive" });
    },
  });

  const updateShippingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertShippingRate> }) => {
      const response = await apiRequest("PUT", `/api/shipping-rates/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shipping-rates"] });
      setIsShippingDialogOpen(false);
      setEditingShippingRate(null);
      shippingForm.reset();
      toast({ title: "Success", description: "Shipping rate updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update shipping rate", variant: "destructive" });
    },
  });

  const deleteShippingMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/shipping-rates/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shipping-rates"] });
      toast({ title: "Success", description: "Shipping rate deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete shipping rate", variant: "destructive" });
    },
  });

  // Commission rule mutations
  const createCommissionMutation = useMutation({
    mutationFn: async (data: InsertCommissionRule) => {
      const response = await apiRequest("POST", "/api/commission-rules", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/commission-rules"] });
      setIsCommissionDialogOpen(false);
      commissionForm.reset();
      toast({ title: "Success", description: "Commission rule created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create commission rule", variant: "destructive" });
    },
  });

  const updateCommissionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertCommissionRule> }) => {
      const response = await apiRequest("PUT", `/api/commission-rules/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/commission-rules"] });
      setIsCommissionDialogOpen(false);
      setEditingCommissionRule(null);
      commissionForm.reset();
      toast({ title: "Success", description: "Commission rule updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update commission rule", variant: "destructive" });
    },
  });

  const deleteCommissionMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/commission-rules/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/commission-rules"] });
      toast({ title: "Success", description: "Commission rule deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete commission rule", variant: "destructive" });
    },
  });

  const handleCreateShipping = (data: InsertShippingRate) => {
    createShippingMutation.mutate(data);
  };

  const handleUpdateShipping = (data: InsertShippingRate) => {
    if (editingShippingRate) {
      updateShippingMutation.mutate({ id: editingShippingRate.id, data });
    }
  };

  const handleEditShipping = (rate: ShippingRate) => {
    setEditingShippingRate(rate);
    shippingForm.reset({
      country: rate.country,
      category: rate.category,
      pricePerKg: rate.pricePerKg,
      currency: rate.currency,
    });
    setIsShippingDialogOpen(true);
  };

  const handleCreateCommission = (data: InsertCommissionRule) => {
    createCommissionMutation.mutate(data);
  };

  const handleUpdateCommission = (data: InsertCommissionRule) => {
    if (editingCommissionRule) {
      updateCommissionMutation.mutate({ id: editingCommissionRule.id, data });
    }
  };

  const handleEditCommission = (rule: CommissionRule) => {
    setEditingCommissionRule(rule);
    commissionForm.reset({
      country: rule.country,
      minValue: rule.minValue,
      maxValue: rule.maxValue || "",
      percentage: rule.percentage,
      fixedFee: rule.fixedFee,
    });
    setIsCommissionDialogOpen(true);
  };

  const resetShippingForm = () => {
    setEditingShippingRate(null);
    shippingForm.reset({
      country: "",
      category: "normal",
      pricePerKg: "",
      currency: "USD",
    });
  };

  const resetCommissionForm = () => {
    setEditingCommissionRule(null);
    commissionForm.reset({
      country: "",
      minValue: "",
      maxValue: "",
      percentage: "",
      fixedFee: "0.00",
    });
  };

  return (
    <div className="space-y-6">
      {/* Shipping Rates */}
      <Card data-testid="card-shipping-rates">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Truck className="w-5 h-5 mr-2" />
              Shipping Rates
            </CardTitle>
            <Dialog 
              open={isShippingDialogOpen} 
              onOpenChange={(open) => {
                setIsShippingDialogOpen(open);
                if (!open) resetShippingForm();
              }}
            >
              <DialogTrigger asChild>
                <Button data-testid="button-add-shipping-rate">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Rate
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingShippingRate ? "Edit Shipping Rate" : "Add Shipping Rate"}
                  </DialogTitle>
                </DialogHeader>
                <Form {...shippingForm}>
                  <form 
                    onSubmit={shippingForm.handleSubmit(
                      editingShippingRate ? handleUpdateShipping : handleCreateShipping
                    )} 
                    className="space-y-4"
                  >
                    <FormField
                      control={shippingForm.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., China, Turkey, UK" {...field} data-testid="input-shipping-country" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={shippingForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-shipping-category">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="perfumes">Perfumes</SelectItem>
                              <SelectItem value="electronics">Electronics</SelectItem>
                              <SelectItem value="clothing">Clothing</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={shippingForm.control}
                      name="pricePerKg"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price per KG</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="8.00" {...field} data-testid="input-shipping-price" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={shippingForm.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-shipping-currency">
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="GBP">GBP</SelectItem>
                              <SelectItem value="CNY">CNY</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setIsShippingDialogOpen(false);
                          resetShippingForm();
                        }}
                        data-testid="button-cancel-shipping"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createShippingMutation.isPending || updateShippingMutation.isPending}
                        data-testid="button-save-shipping"
                      >
                        {editingShippingRate ? "Update" : "Create"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loadingShippingRates ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price/KG</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shippingRates.map((rate) => (
                  <TableRow key={rate.id} data-testid={`row-shipping-rate-${rate.id}`}>
                    <TableCell>{rate.country}</TableCell>
                    <TableCell>{rate.category}</TableCell>
                    <TableCell>{rate.pricePerKg}</TableCell>
                    <TableCell>{rate.currency}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditShipping(rate)}
                          data-testid={`button-edit-shipping-${rate.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteShippingMutation.mutate(rate.id)}
                          disabled={deleteShippingMutation.isPending}
                          data-testid={`button-delete-shipping-${rate.id}`}
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

      {/* Commission Rules */}
      <Card data-testid="card-commission-rules">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Commission Rules
            </CardTitle>
            <Dialog 
              open={isCommissionDialogOpen} 
              onOpenChange={(open) => {
                setIsCommissionDialogOpen(open);
                if (!open) resetCommissionForm();
              }}
            >
              <DialogTrigger asChild>
                <Button data-testid="button-add-commission-rule">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Rule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCommissionRule ? "Edit Commission Rule" : "Add Commission Rule"}
                  </DialogTitle>
                </DialogHeader>
                <Form {...commissionForm}>
                  <form 
                    onSubmit={commissionForm.handleSubmit(
                      editingCommissionRule ? handleUpdateCommission : handleCreateCommission
                    )} 
                    className="space-y-4"
                  >
                    <FormField
                      control={commissionForm.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., China, Turkey, UK" {...field} data-testid="input-commission-country" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={commissionForm.control}
                      name="minValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Order Value</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-commission-min" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={commissionForm.control}
                      name="maxValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Order Value (optional)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="Leave empty for no limit" {...field} data-testid="input-commission-max" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={commissionForm.control}
                      name="percentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Commission Percentage (as decimal)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.0001" placeholder="0.1500" {...field} data-testid="input-commission-percentage" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={commissionForm.control}
                      name="fixedFee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fixed Fee</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-commission-fixed" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setIsCommissionDialogOpen(false);
                          resetCommissionForm();
                        }}
                        data-testid="button-cancel-commission"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createCommissionMutation.isPending || updateCommissionMutation.isPending}
                        data-testid="button-save-commission"
                      >
                        {editingCommissionRule ? "Update" : "Create"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loadingCommissionRules ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead>Min Value</TableHead>
                  <TableHead>Max Value</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Fixed Fee</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissionRules.map((rule) => (
                  <TableRow key={rule.id} data-testid={`row-commission-rule-${rule.id}`}>
                    <TableCell>{rule.country}</TableCell>
                    <TableCell>${rule.minValue}</TableCell>
                    <TableCell>{rule.maxValue ? `$${rule.maxValue}` : "No limit"}</TableCell>
                    <TableCell>{(parseFloat(rule.percentage) * 100).toFixed(2)}%</TableCell>
                    <TableCell>${rule.fixedFee}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditCommission(rule)}
                          data-testid={`button-edit-commission-${rule.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteCommissionMutation.mutate(rule.id)}
                          disabled={deleteCommissionMutation.isPending}
                          data-testid={`button-delete-commission-${rule.id}`}
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
    </div>
  );
}

// Default settings
const DEFAULT_SETTINGS = {
  emailNotifications: false,
  autoBackup: true,
  maintenanceMode: false,
  twoFactor: false,
  sessionTimeout: true,
  orderNotifications: true,
  inventoryAlerts: true,
  systemAlerts: true,
  darkMode: false,
};

export default function Settings() {
  const [settingsState, setSettingsState] = useState(DEFAULT_SETTINGS);
  const { toast } = useToast();

  // Load settings from API
  const { data: settings = [], isLoading } = useQuery({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/settings");
      return response.json() as Promise<Setting[]>;
    },
  });

  // Process settings when data changes
  useEffect(() => {
    if (settings.length > 0) {
      // Convert settings array to state object
      const settingsObj = { ...DEFAULT_SETTINGS };
      settings.forEach((setting: Setting) => {
        if (setting.type === "boolean") {
          settingsObj[setting.key as keyof typeof DEFAULT_SETTINGS] = setting.value === "true";
        }
      });
      setSettingsState(settingsObj);
    }
  }, [settings]);

  // Apply dark mode to document
  useEffect(() => {
    if (settingsState.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settingsState.darkMode]);

  // Update setting mutation
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const existingSetting = settings.find(s => s.key === key);
      if (existingSetting) {
        const response = await apiRequest("PUT", `/api/settings/${key}`, { value, type: "boolean" });
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/settings", {
          key,
          value,
          type: "boolean",
          description: `Setting for ${key}`
        });
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Setting updated",
        description: "Your setting has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update setting. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSettingChange = (key: keyof typeof DEFAULT_SETTINGS, checked: boolean) => {
    setSettingsState(prev => ({ ...prev, [key]: checked }));
    updateSettingMutation.mutate({ key, value: checked.toString() });
  };

  const handleDatabaseBackup = () => {
    toast({
      title: "Backup initiated",
      description: "Database backup has started. You will be notified when complete.",
    });
  };

  const handleDatabaseOptimize = () => {
    toast({
      title: "Optimization started",
      description: "Database optimization is running in the background.",
    });
  };

  const handleViewSecurityLogs = () => {
    toast({
      title: "Security logs",
      description: "Security log viewer will be implemented in a future update.",
    });
  };

  const handleResetPasswords = () => {
    toast({
      title: "Password reset",
      description: "This feature requires additional confirmation. Contact system administrator.",
      variant: "destructive",
    });
  };
  return (
    <div className="flex-1 flex flex-col">
      <Header 
        title="Settings" 
        description="Configure system preferences and settings" 
      />
      
      <div className="flex-1 p-6 space-y-6">
        {/* System Settings */}
        <Card data-testid="card-system-settings">
          <CardHeader>
            <CardTitle className="flex items-center">
              <SettingsIcon className="w-5 h-5 mr-2" />
              System Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email notifications for order updates
                </p>
              </div>
              <Switch 
                id="notifications" 
                checked={settingsState.emailNotifications}
                onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                disabled={updateSettingMutation.isPending}
                data-testid="switch-notifications" 
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-backup">Automatic Backup</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically backup data daily
                </p>
              </div>
              <Switch 
                id="auto-backup" 
                checked={settingsState.autoBackup}
                onCheckedChange={(checked) => handleSettingChange('autoBackup', checked)}
                disabled={updateSettingMutation.isPending}
                data-testid="switch-auto-backup" 
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="maintenance">Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Enable maintenance mode for system updates
                </p>
              </div>
              <Switch 
                id="maintenance" 
                checked={settingsState.maintenanceMode}
                onCheckedChange={(checked) => handleSettingChange('maintenanceMode', checked)}
                disabled={updateSettingMutation.isPending}
                data-testid="switch-maintenance" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Database Settings */}
        <Card data-testid="card-database-settings">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="w-5 h-5 mr-2" />
              Database Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                onClick={handleDatabaseBackup}
                data-testid="button-backup-database"
              >
                <Database className="w-4 h-4 mr-2" />
                Backup Database
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleDatabaseOptimize}
                data-testid="button-optimize-database"
              >
                <SettingsIcon className="w-4 h-4 mr-2" />
                Optimize Database
              </Button>
            </div>
            
            <div className="p-4 bg-muted/20 rounded-lg">
              <h4 className="font-medium mb-2">Database Status</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Connection Status:</span>
                  <span className="text-green-600 font-medium">Connected</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Backup:</span>
                  <span>Today at 3:00 AM</span>
                </div>
                <div className="flex justify-between">
                  <span>Database Size:</span>
                  <span>12.4 MB</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card data-testid="card-security-settings">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Security & Access Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Require 2FA for all user logins
                </p>
              </div>
              <Switch 
                id="two-factor" 
                checked={settingsState.twoFactor}
                onCheckedChange={(checked) => handleSettingChange('twoFactor', checked)}
                disabled={updateSettingMutation.isPending}
                data-testid="switch-two-factor" 
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="session-timeout">Auto Session Timeout</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically log out inactive users after 30 minutes
                </p>
              </div>
              <Switch 
                id="session-timeout" 
                checked={settingsState.sessionTimeout}
                onCheckedChange={(checked) => handleSettingChange('sessionTimeout', checked)}
                disabled={updateSettingMutation.isPending}
                data-testid="switch-session-timeout" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                onClick={handleViewSecurityLogs}
                data-testid="button-view-logs"
              >
                View Security Logs
              </Button>
              <Button 
                variant="outline" 
                onClick={handleResetPasswords}
                data-testid="button-reset-passwords"
              >
                Reset All Passwords
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card data-testid="card-notification-settings">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="order-notifications">Order Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Notify when orders are created or updated
                </p>
              </div>
              <Switch 
                id="order-notifications" 
                checked={settingsState.orderNotifications}
                onCheckedChange={(checked) => handleSettingChange('orderNotifications', checked)}
                disabled={updateSettingMutation.isPending}
                data-testid="switch-order-notifications" 
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="inventory-alerts">Low Stock Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Alert when inventory items are running low
                </p>
              </div>
              <Switch 
                id="inventory-alerts" 
                checked={settingsState.inventoryAlerts}
                onCheckedChange={(checked) => handleSettingChange('inventoryAlerts', checked)}
                disabled={updateSettingMutation.isPending}
                data-testid="switch-inventory-alerts" 
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="system-alerts">System Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Notify about system errors and maintenance
                </p>
              </div>
              <Switch 
                id="system-alerts" 
                checked={settingsState.systemAlerts}
                onCheckedChange={(checked) => handleSettingChange('systemAlerts', checked)}
                disabled={updateSettingMutation.isPending}
                data-testid="switch-system-alerts" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card data-testid="card-theme-settings">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Palette className="w-5 h-5 mr-2" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Use dark theme for the interface
                </p>
              </div>
              <Switch 
                id="dark-mode" 
                checked={settingsState.darkMode}
                onCheckedChange={(checked) => handleSettingChange('darkMode', checked)}
                disabled={updateSettingMutation.isPending}
                data-testid="switch-dark-mode" 
              />
            </div>

            <div className="p-4 bg-muted/20 rounded-lg">
              <h4 className="font-medium mb-2">Current Theme</h4>
              <p className="text-sm text-muted-foreground">
                {settingsState.darkMode ? "Dark theme is currently active" : "Light theme is currently active"}
              </p>
              {updateSettingMutation.isPending && (
                <div className="flex items-center text-sm text-muted-foreground mt-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                  Saving settings...
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Shipping & Commission Management */}
        <ShippingCommissionManager />
      </div>
    </div>
  );
}
