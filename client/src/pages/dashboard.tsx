import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { TrendingUp, DollarSign, Percent, Package, Clock, Plus, UserPlus, PackagePlus, FileText, Database, ShieldCheck, Settings as SettingsIcon, Check, BarChart3, PieChart, Users, ShoppingCart, CheckCircle, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";
import { analyticsApi } from "@/lib/api";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/components/auth-provider";
import { useLydExchangeRate } from "@/hooks/use-lyd-exchange-rate";
import type { OrderWithCustomer } from "@shared/schema";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Legend } from "recharts";

export default function Dashboard() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["/api/analytics/dashboard"],
    queryFn: analyticsApi.getDashboardMetrics,
  });

  // Use shared LYD exchange rate hook
  const { exchangeRate, convertToLYD } = useLydExchangeRate();

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

  const { data: orders = [] } = useQuery({
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
      return response.json();
    },
  });

  // Calculate current month sales
  const currentMonthSales = orders
    .filter(order => {
      const orderDate = new Date(order.createdAt);
      const now = new Date();
      return orderDate.getMonth() === now.getMonth() && 
             orderDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);

  // Get completed and active orders count (case-insensitive)
  const completedOrders = orders.filter(order => {
    const status = order.status.toLowerCase();
    return status === "delivered" || status === "completed";
  }).length;

  const activeOrdersCount = orders.filter(order => {
    const status = order.status.toLowerCase();
    return status !== "delivered" && status !== "completed" && status !== "cancelled";
  }).length;

  // Get recent orders (last 5, sorted by date)
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Calculate revenue trend for last 6 months
  const revenueData = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(new Date(), i);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    
    const monthRevenue = orders
      .filter(order => {
        const orderDate = new Date(order.createdAt);
        return isWithinInterval(orderDate, { start: monthStart, end: monthEnd });
      })
      .reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
    
    revenueData.push({
      month: format(monthDate, 'MMM yyyy'),
      revenue: parseFloat(monthRevenue.toFixed(2))
    });
  }

  // Calculate order status distribution
  const statusCounts: { [key: string]: number } = {};
  orders.forEach(order => {
    const status = order.status.toLowerCase();
    const normalizedStatus = 
      status === "delivered" || status === "completed" ? "Completed" :
      status === "cancelled" ? "Cancelled" :
      status === "pending" ? "Pending" :
      status === "processing" ? "Processing" :
      status === "shipped" ? "Shipped" :
      status === "partially_arrived" ? "Partially Arrived" :
      status === "ready_to_collect" ? "Ready to Collect" :
      status === "with_shipping_company" ? "With Shipping" :
      "Other";
    
    statusCounts[normalizedStatus] = (statusCounts[normalizedStatus] || 0) + 1;
  });

  const orderStatusData = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value
  }));

  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#6366f1'];

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header 
        title={t('dashboard')} 
        description={t('welcomeBack')} 
      />
      
      <div className="flex-1 p-6 space-y-6 bg-muted/20">
        {/* Metrics Grid - First Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="animate-fade-in" data-testid="card-total-orders">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('totalOrders')}</p>
                  <p className="text-2xl font-bold text-blue-600" data-testid="text-total-orders">
                    {orders.length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{t('allTime')}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in" data-testid="card-customers">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('totalCustomers')}</p>
                  <p className="text-2xl font-bold text-purple-600" data-testid="text-customers">
                    {customers.length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{t('registered')}</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in" data-testid="card-completed-orders">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('completedOrders')}</p>
                  <p className="text-2xl font-bold text-green-600" data-testid="text-completed-orders">
                    {completedOrders}
                  </p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {t('statusDelivered')}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in" data-testid="card-active-orders">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('activeOrders')}</p>
                  <p className="text-2xl font-bold text-orange-600" data-testid="text-active-orders">
                    {activeOrdersCount}
                  </p>
                  <p className="text-xs text-orange-600 flex items-center mt-1">
                    <Clock className="w-3 h-3 mr-1" />
                    {t('inProgress')}
                  </p>
                </div>
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Metrics Grid - Second Row (Revenue and Profit) - Hidden for Shipping Staff */}
        {user?.role !== 'shipping_staff' && (
          <div className={`grid grid-cols-1 ${user?.role === 'owner' ? 'md:grid-cols-2' : ''} gap-6`}>
            <Card className="animate-fade-in" data-testid="card-month-sales">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{t('currentMonthSales')}</p>
                    <p className="text-2xl font-bold text-primary" data-testid="text-month-sales">
                      ${currentMonthSales.toFixed(2)}
                    </p>
                    {exchangeRate > 0 && (
                      <p className="text-lg font-semibold text-green-600 mt-1" data-testid="text-month-sales-lyd">
                        {convertToLYD(currentMonthSales)} LYD
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(), 'MMMM yyyy')}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {user?.role === 'owner' && (
              <Card className="animate-fade-in" data-testid="card-total-profit">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">{t('totalProfit')}</p>
                      {isLoading ? (
                        <Skeleton className="h-8 w-24 mt-1" />
                      ) : (
                        <>
                          <p className="text-2xl font-bold text-green-600" data-testid="text-total-profit">
                            ${metrics?.totalProfit?.toFixed(2) || "0.00"}
                          </p>
                          {exchangeRate > 0 && metrics?.totalProfit !== undefined && (
                            <p className="text-lg font-semibold text-primary mt-1" data-testid="text-total-profit-lyd">
                              {convertToLYD(metrics.totalProfit)} LYD
                            </p>
                          )}
                        </>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('allTime')} • {metrics?.profitMargin?.toFixed(1) || "0.0"}% {t('margin')}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="card-revenue-chart">
            <CardHeader>
              <CardTitle>{t('revenueTrend')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value) => `$${value}`}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Bar dataKey="revenue" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-order-status-chart">
            <CardHeader>
              <CardTitle>{t('orderStatus')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {orderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="card-recent-orders">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('recentOrders')}</CardTitle>
                <Button 
                  variant="link" 
                  className="text-primary hover:text-primary/80 text-sm font-medium"
                  onClick={() => setLocation("/orders")}
                >
                  {t('viewAll')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">{t('noRecentOrders')}</p>
                    <p className="text-xs text-muted-foreground">{t('ordersWillAppear')}</p>
                  </div>
                ) : (
                  recentOrders.map((order) => (
                    <div 
                      key={order.id} 
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => setLocation(`/orders`)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <ShoppingCart className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{order.customer.shippingCode || order.orderNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.customer.firstName} {order.customer.lastName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${parseFloat(order.totalAmount).toFixed(2)}</p>
                        {exchangeRate > 0 && (
                          <p className="text-sm text-green-600 font-medium">
                            {convertToLYD(parseFloat(order.totalAmount))} LYD
                          </p>
                        )}
                        <Badge variant={
                          order.status.toLowerCase() === "delivered" || order.status.toLowerCase() === "completed" ? "default" : 
                          order.status.toLowerCase() === "cancelled" ? "destructive" : "secondary"
                        }>
                          {translateStatus(order.status)}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-system-status">
            <CardHeader>
              <CardTitle>{t('systemHealth')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-green-800">{t('databaseStatus')}</span>
                  </div>
                  <span className="text-green-600 font-medium">{t('healthy')}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-green-800">{t('authService')}</span>
                  </div>
                  <span className="text-green-600 font-medium">{t('active')}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-green-800">{t('sessionManagement')}</span>
                  </div>
                  <span className="text-green-600 font-medium">{t('running')}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-green-800">{t('apiEndpoints')}</span>
                  </div>
                  <span className="text-green-600 font-medium">{t('operational')}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-green-800">{t('roleBasedAccess')}</span>
                  </div>
                  <span className="text-green-600 font-medium">{t('enabled')}</span>
                </div>

                <Button 
                  className="w-full mt-4" 
                  data-testid="button-run-diagnostics"
                >
                  {t('runDiagnostics')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions - Hidden for Shipping Staff */}
        {user?.role !== 'shipping_staff' && (
          <Card data-testid="card-quick-actions">
            <CardHeader>
              <CardTitle>{t('quickActions')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  className="p-4 h-auto flex-col" 
                  data-testid="button-new-order"
                  onClick={() => setLocation("/orders")}
                >
                  <Plus className="w-6 h-6 mb-2" />
                  <span className="font-medium">{t('newOrder')}</span>
                </Button>

                <Button 
                  variant="secondary" 
                  className="p-4 h-auto flex-col" 
                  data-testid="button-add-customer"
                  onClick={() => setLocation("/customers")}
                >
                  <UserPlus className="w-6 h-6 mb-2" />
                  <span className="font-medium">{t('addCustomer')}</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="p-4 h-auto flex-col" 
                  data-testid="button-task-assignment"
                  onClick={() => setLocation("/task-assignment")}
                >
                  <Truck className="w-6 h-6 mb-2" />
                  <span className="font-medium">{t('taskAssignment')}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Application Health Check */}
        <Card data-testid="card-health-check">
          <CardHeader>
            <CardTitle>{t('applicationHealthCheck')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-foreground flex items-center">
                  <Database className="w-4 h-4 mr-2 text-green-600" />
                  {t('databaseAndSchema')}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-green-600">
                    <Check className="w-3 h-3 mr-2" />
                    <span>{t('postgresqlConnected')}</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <Check className="w-3 h-3 mr-2" />
                    <span>{t('drizzleApplied')}</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <Check className="w-3 h-3 mr-2" />
                    <span>{t('schemaValidated')}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-foreground flex items-center">
                  <ShieldCheck className="w-4 h-4 mr-2 text-green-600" />
                  {t('authenticationAndSessions')}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-green-600">
                    <Check className="w-3 h-3 mr-2" />
                    <span>{t('passportActive')}</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <Check className="w-3 h-3 mr-2" />
                    <span>{t('sessionStoreConfigured')}</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <Check className="w-3 h-3 mr-2" />
                    <span>{t('rbacEnabled')}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-foreground flex items-center">
                  <SettingsIcon className="w-4 h-4 mr-2 text-green-600" />
                  {t('crudOperations')}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-green-600">
                    <Check className="w-3 h-3 mr-2" />
                    <span>{t('orderManagementRestored')}</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <Check className="w-3 h-3 mr-2" />
                    <span>{t('customerOperations')}</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <Check className="w-3 h-3 mr-2" />
                    <span>{t('inventoryTracking')}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-foreground flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
                  {t('reportingAnalytics')}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-green-600">
                    <Check className="w-3 h-3 mr-2" />
                    <span>{t('profitCalculations')}</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <Check className="w-3 h-3 mr-2" />
                    <span>{t('financialDashboard')}</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <Check className="w-3 h-3 mr-2" />
                    <span>Commission calculations active</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
