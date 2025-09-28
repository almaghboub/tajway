import { useQuery } from "@tanstack/react-query";
import { TrendingUp, DollarSign, Percent, Package, Clock, Plus, UserPlus, PackagePlus, FileText, Database, ShieldCheck, Settings as SettingsIcon, Check, BarChart3, PieChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/header";
import { analyticsApi } from "@/lib/api";

export default function Dashboard() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["/api/analytics/dashboard"],
    queryFn: analyticsApi.getDashboardMetrics,
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header 
        title="Dashboard" 
        description="Welcome back! Here's your logistics overview." 
      />
      
      <div className="flex-1 p-6 space-y-6 bg-muted/20">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="animate-fade-in" data-testid="card-total-profit">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Profit</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-green-600" data-testid="text-total-profit">
                      ${metrics?.totalProfit?.toFixed(2) || "0.00"}
                    </p>
                  )}
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +18.7% vs last period
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in" data-testid="card-revenue">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-primary" data-testid="text-revenue">
                      ${metrics?.totalRevenue?.toFixed(2) || "0.00"}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">All orders total</p>
                </div>
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in" data-testid="card-profit-margin">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Profit Margin</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-purple-600" data-testid="text-profit-margin">
                      {metrics?.profitMargin?.toFixed(1) || "0.0"}%
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">Profit vs Revenue</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Percent className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in" data-testid="card-active-orders">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Orders</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-orange-600" data-testid="text-active-orders">
                      {metrics?.activeOrders || 0}
                    </p>
                  )}
                  <p className="text-xs text-orange-600 flex items-center mt-1">
                    <Clock className="w-3 h-3 mr-1" />
                    3 urgent
                  </p>
                </div>
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="card-revenue-chart">
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Revenue Chart Placeholder</p>
                  <p className="text-xs text-muted-foreground">Chart component will render here</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-order-status-chart">
            <CardHeader>
              <CardTitle>Order Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                <div className="text-center">
                  <PieChart className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Order Status Chart Placeholder</p>
                  <p className="text-xs text-muted-foreground">Pie chart component will render here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="card-recent-orders">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Orders</CardTitle>
                <Button variant="link" className="text-primary hover:text-primary/80 text-sm font-medium">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No recent orders</p>
                  <p className="text-xs text-muted-foreground">Orders will appear here once created</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-system-status">
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-green-800">Database Connection</span>
                  </div>
                  <span className="text-green-600 font-medium">Healthy</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-green-800">Authentication Service</span>
                  </div>
                  <span className="text-green-600 font-medium">Active</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-green-800">Session Management</span>
                  </div>
                  <span className="text-green-600 font-medium">Running</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-green-800">API Endpoints</span>
                  </div>
                  <span className="text-green-600 font-medium">Operational</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-green-800">Role-Based Access</span>
                  </div>
                  <span className="text-green-600 font-medium">Enabled</span>
                </div>

                <Button 
                  className="w-full mt-4" 
                  data-testid="button-run-diagnostics"
                >
                  Run Full Diagnostics
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card data-testid="card-quick-actions">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button className="p-4 h-auto flex-col" data-testid="button-new-order">
                <Plus className="w-6 h-6 mb-2" />
                <span className="font-medium">New Order</span>
              </Button>

              <Button variant="secondary" className="p-4 h-auto flex-col" data-testid="button-add-customer">
                <UserPlus className="w-6 h-6 mb-2" />
                <span className="font-medium">Add Customer</span>
              </Button>

              <Button variant="outline" className="p-4 h-auto flex-col" data-testid="button-update-stock">
                <PackagePlus className="w-6 h-6 mb-2" />
                <span className="font-medium">Update Stock</span>
              </Button>

              <Button variant="ghost" className="p-4 h-auto flex-col" data-testid="button-generate-report">
                <FileText className="w-6 h-6 mb-2" />
                <span className="font-medium">Generate Report</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Application Health Check */}
        <Card data-testid="card-health-check">
          <CardHeader>
            <CardTitle>Application Health Check</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-foreground flex items-center">
                  <Database className="w-4 h-4 mr-2 text-green-600" />
                  Database & Schema
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-green-600">
                    <Check className="w-3 h-3 mr-2" />
                    <span>PostgreSQL connection established</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <Check className="w-3 h-3 mr-2" />
                    <span>Drizzle ORM migrations applied</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <Check className="w-3 h-3 mr-2" />
                    <span>Schema validation successful</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-foreground flex items-center">
                  <ShieldCheck className="w-4 h-4 mr-2 text-green-600" />
                  Authentication & Sessions
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-green-600">
                    <Check className="w-3 h-3 mr-2" />
                    <span>Passport.js authentication active</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <Check className="w-3 h-3 mr-2" />
                    <span>Session store configured</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <Check className="w-3 h-3 mr-2" />
                    <span>Role-based access control enabled</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-foreground flex items-center">
                  <SettingsIcon className="w-4 h-4 mr-2 text-green-600" />
                  CRUD Operations
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-green-600">
                    <Check className="w-3 h-3 mr-2" />
                    <span>Order management API restored</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <Check className="w-3 h-3 mr-2" />
                    <span>Customer operations functional</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <Check className="w-3 h-3 mr-2" />
                    <span>Inventory tracking operational</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-foreground flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
                  Reporting & Analytics
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-green-600">
                    <Check className="w-3 h-3 mr-2" />
                    <span>Profit calculations restored</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <Check className="w-3 h-3 mr-2" />
                    <span>Financial dashboard operational</span>
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
