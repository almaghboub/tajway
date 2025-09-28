import { useQuery } from "@tanstack/react-query";
import { TrendingUp, DollarSign, Calculator, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/header";
import { analyticsApi } from "@/lib/api";

export default function Profits() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["/api/analytics/dashboard"],
    queryFn: analyticsApi.getDashboardMetrics,
  });

  return (
    <div className="flex-1 flex flex-col">
      <Header 
        title="Profit Reports" 
        description="Financial analytics and profit tracking" 
      />
      
      <div className="flex-1 p-6 space-y-6">
        {/* Financial Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card data-testid="card-total-profit">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Profit</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-green-600" data-testid="text-total-profit">
                      ${metrics?.totalProfit?.toFixed(2) || "0.00"}
                    </p>
                  )}
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +18.7% vs last period
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-total-revenue">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-primary" data-testid="text-total-revenue">
                      ${metrics?.totalRevenue?.toFixed(2) || "0.00"}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">From all orders</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-profit-margin">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Profit Margin</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-purple-600" data-testid="text-profit-margin">
                      {metrics?.profitMargin?.toFixed(1) || "0.0"}%
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">Average margin</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calculator className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profit Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="card-profit-trend">
            <CardHeader>
              <CardTitle>Profit Trend Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Profit Chart Placeholder</p>
                  <p className="text-xs text-muted-foreground">Trend analysis will render here</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-commission-breakdown">
            <CardHeader>
              <CardTitle>Commission Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8">
                  <Calculator className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">Commission Analysis</h3>
                  <p className="text-muted-foreground mb-4">
                    Commission calculations will be displayed here based on country-specific rules
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>China Commission Rate:</span>
                      <span className="font-medium">18.0%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Turkey Commission Rate:</span>
                      <span className="font-medium">20.0%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>UK Commission Rate:</span>
                      <span className="font-medium">15.0%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>UAE Commission Rate:</span>
                      <span className="font-medium">12.0%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Actions */}
        <Card data-testid="card-report-actions">
          <CardHeader>
            <CardTitle>Generate Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button className="h-auto p-4 flex-col" data-testid="button-profit-report">
                <FileText className="w-6 h-6 mb-2" />
                <span className="font-medium">Profit Report</span>
                <span className="text-xs text-muted-foreground">Monthly profit analysis</span>
              </Button>

              <Button variant="outline" className="h-auto p-4 flex-col" data-testid="button-commission-report">
                <Calculator className="w-6 h-6 mb-2" />
                <span className="font-medium">Commission Report</span>
                <span className="text-xs text-muted-foreground">Country-wise commissions</span>
              </Button>

              <Button variant="secondary" className="h-auto p-4 flex-col" data-testid="button-financial-summary">
                <TrendingUp className="w-6 h-6 mb-2" />
                <span className="font-medium">Financial Summary</span>
                <span className="text-xs text-muted-foreground">Complete financial overview</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Financial Details */}
        <Card data-testid="card-financial-details">
          <CardHeader>
            <CardTitle>Financial Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Detailed Financial Analysis</h3>
              <p className="text-muted-foreground">
                Comprehensive financial data including cost breakdown, shipping fees, and profit margins will be displayed here
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
