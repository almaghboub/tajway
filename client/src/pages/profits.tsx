import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { TrendingUp, DollarSign, Calculator, FileText, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Header } from "@/components/header";
import { analyticsApi } from "@/lib/api";
import { SalesReport } from "@/components/sales-report";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export default function Profits() {
  const { t } = useTranslation();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<"profit" | "commission" | "financial">("profit");
  const [reportData, setReportData] = useState<any>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const { toast } = useToast();

  const { data: metrics, isLoading } = useQuery({
    queryKey: ["/api/analytics/dashboard"],
    queryFn: analyticsApi.getDashboardMetrics,
  });

  const generateReport = async (reportType: "profit" | "commission" | "financial") => {
    setIsGeneratingReport(true);
    setSelectedReportType(reportType);
    
    try {
      // Fetch detailed data for reports
      const [ordersResponse, customersResponse] = await Promise.all([
        apiRequest("GET", "/api/orders"),
        apiRequest("GET", "/api/customers")
      ]);
      
      const orders = await ordersResponse.json();
      const customers = await customersResponse.json();
      
      // Create customer lookup map
      const customerMap = customers.reduce((acc: any, customer: any) => {
        acc[customer.id] = customer;
        return acc;
      }, {});
      
      // Process orders data
      const orderSummaries = orders.map((order: any) => {
        const customer = customerMap[order.customerId];
        return {
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: customer ? `${customer.firstName} ${customer.lastName}` : t('unknown'),
          totalAmount: order.totalAmount,
          profit: order.profit,
          commission: order.commission,
          country: customer?.country || t('unknown'),
          createdAt: order.createdAt
        };
      });
      
      // Calculate totals
      const totalRevenue = orders.reduce((sum: number, order: any) => sum + parseFloat(order.totalAmount), 0);
      const totalProfit = orders.reduce((sum: number, order: any) => sum + parseFloat(order.profit), 0);
      const totalCommission = orders.reduce((sum: number, order: any) => sum + parseFloat(order.commission), 0);
      const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
      
      // Create country breakdown for commission report
      const countryBreakdown = Object.values(
        orderSummaries.reduce((acc: any, order: any) => {
          const country = order.country;
          if (!acc[country]) {
            acc[country] = {
              country,
              revenue: 0,
              commission: 0,
              commissionRate: 0.15, // Default 15%
              orderCount: 0
            };
          }
          acc[country].revenue += parseFloat(order.totalAmount);
          acc[country].commission += parseFloat(order.commission);
          acc[country].orderCount += 1;
          // Calculate average commission rate for this country
          acc[country].commissionRate = acc[country].revenue > 0 ? acc[country].commission / acc[country].revenue : 0.15;
          return acc;
        }, {})
      );
      
      const reportData = {
        totalRevenue,
        totalProfit,
        totalCommission,
        profitMargin,
        orderCount: orders.length,
        orders: reportType === "profit" ? orderSummaries : undefined,
        countryBreakdown: reportType === "commission" ? countryBreakdown : undefined,
        periodStart: orders.length > 0 ? orders[orders.length - 1].createdAt : undefined,
        periodEnd: orders.length > 0 ? orders[0].createdAt : undefined
      };
      
      setReportData(reportData);
      setIsReportModalOpen(true);
      
    } catch (error) {
      toast({
        title: t('errorGeneratingReport'),
        description: t('failedToFetchReportData'),
        variant: "destructive",
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header 
        title={t('profitReports')} 
        description={t('profitReportsDescription')} 
      />
      
      <div className="flex-1 p-6 space-y-6">
        {/* Financial Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card data-testid="card-total-profit">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('totalProfit')}</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-green-600" data-testid="text-total-profit">
                      ${metrics?.totalProfit?.toFixed(2) || "0.00"}
                    </p>
                  )}
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {t('percentageVsLastPeriod')}
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
                  <p className="text-sm text-muted-foreground">{t('totalRevenue')}</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-primary" data-testid="text-total-revenue">
                      ${metrics?.totalRevenue?.toFixed(2) || "0.00"}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{t('fromAllOrders')}</p>
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
                  <p className="text-sm text-muted-foreground">{t('profitMargin')}</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-purple-600" data-testid="text-profit-margin">
                      {metrics?.profitMargin?.toFixed(1) || "0.0"}%
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{t('averageMargin')}</p>
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
              <CardTitle>{t('profitTrendAnalysis')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">{t('profitChartPlaceholder')}</p>
                  <p className="text-xs text-muted-foreground">{t('trendAnalysisWillRender')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-commission-breakdown">
            <CardHeader>
              <CardTitle>{t('commissionBreakdown')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8">
                  <Calculator className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">{t('commissionAnalysis')}</h3>
                  <p className="text-muted-foreground mb-4">
                    {t('commissionCalculationsDescription')}
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>{t('chinaCommissionRate')}</span>
                      <span className="font-medium">18.0%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('turkeyCommissionRate')}</span>
                      <span className="font-medium">20.0%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('ukCommissionRate')}</span>
                      <span className="font-medium">15.0%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('uaeCommissionRate')}</span>
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
            <CardTitle>{t('generateReports')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                className="h-auto p-4 flex-col" 
                onClick={() => generateReport("profit")}
                disabled={isGeneratingReport}
                data-testid="button-profit-report"
              >
                <FileText className="w-6 h-6 mb-2" />
                <span className="font-medium">{t('profitReportTitle')}</span>
                <span className="text-xs text-muted-foreground">{t('orderWiseProfitAnalysis')}</span>
              </Button>

              <Button 
                variant="outline" 
                className="h-auto p-4 flex-col" 
                onClick={() => generateReport("commission")}
                disabled={isGeneratingReport}
                data-testid="button-commission-report"
              >
                <Calculator className="w-6 h-6 mb-2" />
                <span className="font-medium">{t('commissionReportTitle')}</span>
                <span className="text-xs text-muted-foreground">{t('countryWiseCommissions')}</span>
              </Button>

              <Button 
                variant="secondary" 
                className="h-auto p-4 flex-col" 
                onClick={() => generateReport("financial")}
                disabled={isGeneratingReport}
                data-testid="button-financial-summary"
              >
                <TrendingUp className="w-6 h-6 mb-2" />
                <span className="font-medium">{t('financialSummaryTitle')}</span>
                <span className="text-xs text-muted-foreground">{t('completeFinancialOverview')}</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Financial Details */}
        <Card data-testid="card-financial-details">
          <CardHeader>
            <CardTitle>{t('financialBreakdown')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">{t('detailedFinancialAnalysis')}</h3>
              <p className="text-muted-foreground">
                {t('comprehensiveFinancialDataDescription')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Sales Report Modal */}
        <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto" data-testid="modal-sales-report">
            <DialogHeader>
              <div className="flex justify-between items-center">
                <DialogTitle>{t('salesReportPreview')}</DialogTitle>
                <div className="flex space-x-2">
                  <Button onClick={handlePrint} data-testid="button-print-report">
                    <Printer className="w-4 h-4 mr-2" />
                    {t('printReport')}
                  </Button>
                  <Button variant="outline" onClick={() => setIsReportModalOpen(false)}>
                    {t('close')}
                  </Button>
                </div>
              </div>
            </DialogHeader>
            {isGeneratingReport ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">{t('generatingReport')}</p>
              </div>
            ) : reportData ? (
              <SalesReport 
                reportType={selectedReportType} 
                data={reportData} 
                onPrint={handlePrint} 
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">{t('failedToGenerateReport')}</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
