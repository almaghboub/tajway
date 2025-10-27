import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { TrendingUp, TrendingDown, DollarSign, Calculator, FileText, Printer, Filter, Package, ShoppingCart, BarChart3, Calendar, Percent } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/header";
import { analyticsApi } from "@/lib/api";
import { SalesReport } from "@/components/sales-report";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useLydExchangeRate } from "@/hooks/use-lyd-exchange-rate";
import type { OrderWithCustomer } from "@shared/schema";

type TimeRange = 'daily' | 'weekly' | 'monthly';

interface PerformanceMetrics {
  totalOrders: number;
  totalSales: string;
  totalProfit: string;
  discountedOrders: number;
  avgOrderValue: string;
  avgProfitPerOrder: string;
  avgExchangeRate: string;
  orderGrowth: string;
  salesGrowth: string;
  profitGrowth: string;
}

interface PerformanceData {
  range: string;
  period: {
    start: string;
    end: string;
  };
  previousPeriod: {
    start: string;
    end: string;
  };
  metrics: PerformanceMetrics;
  previousMetrics: {
    totalOrders: number;
    totalSales: string;
    totalProfit: string;
  };
}

export default function Profits() {
  const { t, i18n } = useTranslation();
  const { exchangeRate, convertToLYD } = useLydExchangeRate();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<"profit" | "commission" | "financial">("profit");
  const [reportData, setReportData] = useState<any>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [countryFilters, setCountryFilters] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('daily');
  const [performanceCountryFilters, setPerformanceCountryFilters] = useState<string[]>([]);
  const [performanceDateFrom, setPerformanceDateFrom] = useState<string>('');
  const [performanceDateTo, setPerformanceDateTo] = useState<string>('');
  const [isPerformanceFilterOpen, setIsPerformanceFilterOpen] = useState(false);
  const { toast } = useToast();
  const currency = exchangeRate > 0 ? "LYD" : "USD";
  const isRTL = i18n.language === 'ar';

  const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/orders");
      return response.json() as Promise<OrderWithCustomer[]>;
    },
  });

  const { data: shippingCountries = [] } = useQuery({
    queryKey: ["/api/shipping-countries"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/shipping-countries");
      return response.json() as Promise<string[]>;
    },
  });

  const performanceQueryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.append('range', timeRange);
    if (performanceCountryFilters.length > 0) {
      performanceCountryFilters.forEach(country => params.append('country', country));
    }
    if (performanceDateFrom) {
      params.append('dateFrom', performanceDateFrom);
    }
    if (performanceDateTo) {
      params.append('dateTo', performanceDateTo);
    }
    return params.toString();
  }, [timeRange, performanceCountryFilters, performanceDateFrom, performanceDateTo]);

  const { data: performanceData, isLoading: isLoadingPerformance } = useQuery<PerformanceData>({
    queryKey: [`/api/reports/performance`, performanceQueryParams],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/reports/performance?${performanceQueryParams}`);
      return response.json();
    },
  });

  const toggleCountryFilter = (country: string) => {
    setCountryFilters(prev =>
      prev.includes(country)
        ? prev.filter(c => c !== country)
        : [...prev, country]
    );
  };

  const togglePerformanceCountryFilter = (country: string) => {
    setPerformanceCountryFilters(prev =>
      prev.includes(country)
        ? prev.filter(c => c !== country)
        : [...prev, country]
    );
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesCountry = countryFilters.length === 0 || countryFilters.includes(order.shippingCountry || "");
      return matchesCountry;
    });
  }, [orders, countryFilters]);

  const metrics = useMemo(() => {
    const orderCount = filteredOrders.length;
    const totalRevenueUSD = filteredOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
    const totalItemsProfitUSD = filteredOrders.reduce((sum, order) => sum + parseFloat(order.itemsProfit || "0"), 0);
    const totalShippingProfitUSD = filteredOrders.reduce((sum, order) => sum + parseFloat(order.shippingProfit || "0"), 0);
    const totalProfitUSD = filteredOrders.reduce((sum, order) => sum + parseFloat(order.totalProfit || "0"), 0);
    const averageOrderValueUSD = orderCount > 0 ? totalRevenueUSD / orderCount : 0;
    
    // Convert to LYD if exchange rate is set
    const totalRevenue = exchangeRate > 0 ? parseFloat(convertToLYD(totalRevenueUSD)) : totalRevenueUSD;
    const totalItemsProfit = exchangeRate > 0 ? parseFloat(convertToLYD(totalItemsProfitUSD)) : totalItemsProfitUSD;
    const totalShippingProfit = exchangeRate > 0 ? parseFloat(convertToLYD(totalShippingProfitUSD)) : totalShippingProfitUSD;
    const totalProfit = exchangeRate > 0 ? parseFloat(convertToLYD(totalProfitUSD)) : totalProfitUSD;
    const averageOrderValue = exchangeRate > 0 ? parseFloat(convertToLYD(averageOrderValueUSD)) : averageOrderValueUSD;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      orderCount,
      totalRevenue,
      totalItemsProfit,
      totalShippingProfit,
      totalProfit,
      averageOrderValue,
      profitMargin,
    };
  }, [filteredOrders, exchangeRate, convertToLYD]);

  const isLoading = isLoadingOrders;

  const generateReport = async (reportType: "profit" | "commission" | "financial") => {
    setIsGeneratingReport(true);
    setSelectedReportType(reportType);
    
    try {
      // Fetch detailed data for reports
      const requests = [
        apiRequest("GET", "/api/orders"),
        apiRequest("GET", "/api/customers")
      ];
      
      // Fetch commission rules only for commission report
      if (reportType === "commission") {
        requests.push(apiRequest("GET", "/api/commission-rules"));
      }
      
      const responses = await Promise.all(requests);
      
      const orders = await responses[0].json();
      const customers = await responses[1].json();
      const commissionRules = reportType === "commission" && responses[2] ? await responses[2].json() : [];
      
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
          shippingCode: customer?.shippingCode || order.orderNumber,
          customerName: customer ? `${customer.firstName} ${customer.lastName}` : t('unknown'),
          totalAmount: order.totalAmount,
          profit: order.totalProfit || order.profit || "0",
          itemsProfit: order.itemsProfit || "0",
          shippingProfit: order.shippingProfit || "0",
          commission: order.commission,
          country: customer?.country || t('unknown'),
          createdAt: order.createdAt
        };
      });
      
      // Calculate totals
      const totalRevenue = orders.reduce((sum: number, order: any) => sum + parseFloat(order.totalAmount), 0);
      const totalProfit = orders.reduce((sum: number, order: any) => sum + parseFloat(order.totalProfit || order.profit || "0"), 0);
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
        commissionRules: reportType === "commission" ? commissionRules : undefined,
        periodStart: orders.length > 0 ? orders[orders.length - 1].createdAt : undefined,
        periodEnd: orders.length > 0 ? orders[0].createdAt : undefined,
        exchangeRate,
        currency
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

  const formatPerformanceDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPerformanceCurrency = (amount: string) => {
    return `$${parseFloat(amount).toLocaleString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatGrowth = (growth: string) => {
    const value = parseFloat(growth);
    const isPositive = value >= 0;
    return {
      value: Math.abs(value),
      isPositive,
      text: `${isPositive ? '+' : '-'}${Math.abs(value).toFixed(2)}%`,
    };
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header 
        title={t('profitReports')} 
        description={t('profitReportsDescription')} 
      />
      
      <div className="flex-1 p-6">
        <Tabs defaultValue="profit-metrics" className="w-full">
          <TabsList className="grid w-full md:w-[400px] grid-cols-2 mb-6">
            <TabsTrigger value="profit-metrics" data-testid="tab-profit-metrics">
              {t('profitMetrics') || 'Profit Metrics'}
            </TabsTrigger>
            <TabsTrigger value="performance-report" data-testid="tab-performance-report">
              {isRTL ? 'تقرير الأداء' : 'Performance Report'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profit-metrics" className="space-y-6">
        {/* Filter Section */}
        <div className="flex items-center justify-end">
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" data-testid="button-filter-profits">
                <Filter className="w-4 h-4 mr-2" />
                {t("filter")}
                {countryFilters.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {countryFilters.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" data-testid="popover-filter-profits">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-3">{t("filterByCountry")}</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {shippingCountries.length > 0 ? (
                      shippingCountries.map((country) => (
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

        {/* Key Metrics - First Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card data-testid="card-order-count">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('numberOfOrders')}</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-primary" data-testid="text-order-count">
                      {metrics.orderCount}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{t('totalOrders')}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-average-order-value">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('averageOrderValue')}</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-purple-600" data-testid="text-average-order-value">
                      {currency} {metrics.averageOrderValue.toFixed(2)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{t('perOrder')}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calculator className="w-6 h-6 text-purple-600" />
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
                      {currency} {metrics.totalRevenue.toFixed(2)}
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
        </div>

        {/* Profit Breakdown - Second Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card data-testid="card-items-profit">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('profitFromOrders')}</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-blue-600" data-testid="text-items-profit">
                      {currency} {metrics.totalItemsProfit.toFixed(2)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{t('orderValueMinusCost')}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-shipping-profit">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('profitFromShipping')}</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-orange-600" data-testid="text-shipping-profit">
                      {currency} {metrics.totalShippingProfit.toFixed(2)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{t('shippingFeeMinusCost')}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-total-profit">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('totalProfit')}</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-green-600" data-testid="text-total-profit">
                      {currency} {metrics.totalProfit.toFixed(2)}
                    </p>
                  )}
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {metrics.profitMargin.toFixed(1)}% {t('margin')}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
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

          </TabsContent>

          <TabsContent value="performance-report" className="space-y-6">
            {isLoadingPerformance ? (
              <div className="animate-pulse space-y-4">
                <div className="h-10 bg-muted rounded w-1/3"></div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-32 bg-muted rounded"></div>
                  ))}
                </div>
              </div>
            ) : performanceData ? (
              <>
                {(() => {
                  const { metrics, period, previousPeriod } = performanceData;
                  const orderGrowth = formatGrowth(metrics.orderGrowth);
                  const salesGrowth = formatGrowth(metrics.salesGrowth);
                  const profitGrowth = formatGrowth(metrics.profitGrowth);

                  const periodLabel = {
                    daily: isRTL ? 'اليوم' : 'Today',
                    weekly: isRTL ? 'هذا الأسبوع' : 'This Week',
                    monthly: isRTL ? 'هذا الشهر' : 'This Month',
                  };

                  const prevPeriodLabel = {
                    daily: isRTL ? 'أمس' : 'Yesterday',
                    weekly: isRTL ? 'الأسبوع الماضي' : 'Last Week',
                    monthly: isRTL ? 'الشهر الماضي' : 'Last Month',
                  };

                  return (
                    <>
                      {/* Filters and Time Range Selector */}
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <p className="text-muted-foreground">
                            {isRTL 
                              ? 'تقرير شامل عن المبيعات والأرباح والنمو' 
                              : 'Comprehensive sales, profit, and growth analysis'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Filter Button */}
                          <Popover open={isPerformanceFilterOpen} onOpenChange={setIsPerformanceFilterOpen}>
                            <PopoverTrigger asChild>
                              <Button variant="outline" data-testid="button-filter-performance">
                                <Filter className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                                {t("filter")}
                                {(performanceCountryFilters.length > 0 || performanceDateFrom || performanceDateTo) && (
                                  <Badge variant="secondary" className="ltr:ml-2 rtl:mr-2">
                                    {performanceCountryFilters.length + (performanceDateFrom || performanceDateTo ? 1 : 0)}
                                  </Badge>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80" data-testid="popover-filter-performance">
                              <div className="space-y-4">
                                {/* Country Filter */}
                                <div>
                                  <h4 className="font-semibold mb-3">{t("filterByCountry")}</h4>
                                  <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {shippingCountries.length > 0 ? (
                                      shippingCountries.map((country) => (
                                        <div key={country} className="flex items-center space-x-2 rtl:space-x-reverse">
                                          <Checkbox
                                            id={`perf-filter-${country}`}
                                            checked={performanceCountryFilters.includes(country)}
                                            onCheckedChange={() => togglePerformanceCountryFilter(country)}
                                          />
                                          <Label htmlFor={`perf-filter-${country}`} className="cursor-pointer flex-1">
                                            {country}
                                          </Label>
                                        </div>
                                      ))
                                    ) : (
                                      <p className="text-sm text-muted-foreground">{t("noCountriesAvailable")}</p>
                                    )}
                                  </div>
                                </div>

                                <Separator />

                                {/* Date Range Filter */}
                                <div>
                                  <h4 className="font-semibold mb-3">{t("filterByDate")}</h4>
                                  <div className="space-y-2">
                                    <div>
                                      <Label htmlFor="perf-date-from" className="text-sm">{t("from")}</Label>
                                      <input
                                        id="perf-date-from"
                                        type="date"
                                        value={performanceDateFrom}
                                        onChange={(e) => setPerformanceDateFrom(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md"
                                        data-testid="input-perf-date-from"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="perf-date-to" className="text-sm">{t("to")}</Label>
                                      <input
                                        id="perf-date-to"
                                        type="date"
                                        value={performanceDateTo}
                                        onChange={(e) => setPerformanceDateTo(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md"
                                        data-testid="input-perf-date-to"
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setPerformanceCountryFilters([]);
                                      setPerformanceDateFrom('');
                                      setPerformanceDateTo('');
                                    }}
                                    data-testid="button-clear-perf-filters"
                                  >
                                    {t("clearFilters")}
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => setIsPerformanceFilterOpen(false)}
                                    data-testid="button-apply-perf-filters"
                                  >
                                    {t("apply")}
                                  </Button>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>

                          {/* Time Range Selector */}
                          <div className="w-[200px]">
                            <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
                              <SelectTrigger data-testid="select-time-range">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="daily">{isRTL ? 'يومي' : 'Daily'}</SelectItem>
                                <SelectItem value="weekly">{isRTL ? 'أسبوعي' : 'Weekly'}</SelectItem>
                                <SelectItem value="monthly">{isRTL ? 'شهري' : 'Monthly'}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Period Display */}
                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-muted-foreground" />
                            <CardTitle className="text-lg">{periodLabel[timeRange]}</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {formatPerformanceDate(period.start)} - {formatPerformanceDate(period.end)}
                          </p>
                        </CardContent>
                      </Card>

                      {/* Key Metrics Grid */}
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {/* Total Orders */}
                        <Card data-testid="card-total-orders">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                              {isRTL ? 'إجمالي الطلبات' : 'Total Orders'}
                            </CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold" data-testid="text-total-orders">{metrics.totalOrders}</div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              {orderGrowth.isPositive ? (
                                <TrendingUp className="h-3 w-3 text-green-600" />
                              ) : (
                                <TrendingDown className="h-3 w-3 text-red-600" />
                              )}
                              <span className={orderGrowth.isPositive ? 'text-green-600' : 'text-red-600'}>
                                {orderGrowth.text}
                              </span>
                              <span>{isRTL ? 'مقارنة بـ' : 'vs'} {prevPeriodLabel[timeRange]}</span>
                            </p>
                          </CardContent>
                        </Card>

                        {/* Total Sales */}
                        <Card data-testid="card-total-sales">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                              {isRTL ? 'إجمالي المبيعات' : 'Total Sales'}
                            </CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold" data-testid="text-total-sales">
                              {formatPerformanceCurrency(metrics.totalSales)}
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              {salesGrowth.isPositive ? (
                                <TrendingUp className="h-3 w-3 text-green-600" />
                              ) : (
                                <TrendingDown className="h-3 w-3 text-red-600" />
                              )}
                              <span className={salesGrowth.isPositive ? 'text-green-600' : 'text-red-600'}>
                                {salesGrowth.text}
                              </span>
                              <span>{isRTL ? 'مقارنة بـ' : 'vs'} {prevPeriodLabel[timeRange]}</span>
                            </p>
                          </CardContent>
                        </Card>

                        {/* Total Profit */}
                        <Card data-testid="card-total-profit">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                              {isRTL ? 'إجمالي الربح' : 'Total Profit'}
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-green-600" data-testid="text-total-profit">
                              {formatPerformanceCurrency(metrics.totalProfit)}
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              {profitGrowth.isPositive ? (
                                <TrendingUp className="h-3 w-3 text-green-600" />
                              ) : (
                                <TrendingDown className="h-3 w-3 text-red-600" />
                              )}
                              <span className={profitGrowth.isPositive ? 'text-green-600' : 'text-red-600'}>
                                {profitGrowth.text}
                              </span>
                              <span>{isRTL ? 'مقارنة بـ' : 'vs'} {prevPeriodLabel[timeRange]}</span>
                            </p>
                          </CardContent>
                        </Card>

                        {/* Average Order Value */}
                        <Card data-testid="card-avg-order">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                              {isRTL ? 'متوسط قيمة الطلب' : 'Avg Order Value'}
                            </CardTitle>
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold" data-testid="text-avg-order">
                              {formatPerformanceCurrency(metrics.avgOrderValue)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {isRTL ? 'متوسط قيمة الطلب الواحد' : 'Per order average'}
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Detailed Metrics Section */}
                      <div className="grid gap-4 md:grid-cols-2">
                        {/* English Section */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <BarChart3 className="w-5 h-5" />
                              Detailed Metrics
                            </CardTitle>
                            <CardDescription>
                              Performance indicators for {periodLabel[timeRange].toLowerCase()}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Number of Discounted Orders</span>
                                <span className="font-semibold" data-testid="text-discounted-orders-en">
                                  {metrics.discountedOrders}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Orders with down payments made
                              </p>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Average Profit per Order</span>
                                <span className="font-semibold text-green-600" data-testid="text-avg-profit-en">
                                  {formatPerformanceCurrency(metrics.avgProfitPerOrder)}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Profit generated per order on average
                              </p>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Average Exchange Rate</span>
                                <span className="font-semibold" data-testid="text-avg-rate-en">
                                  {parseFloat(metrics.avgExchangeRate) > 0 
                                    ? `1 USD = ${parseFloat(metrics.avgExchangeRate).toFixed(4)} LYD`
                                    : 'N/A'}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Average USD to LYD conversion rate
                              </p>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Arabic Section */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-right" dir="rtl">
                              <span>مقاييس تفصيلية</span>
                              <BarChart3 className="w-5 h-5" />
                            </CardTitle>
                            <CardDescription className="text-right" dir="rtl">
                              مؤشرات الأداء لـ {periodLabel[timeRange]}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4" dir="rtl">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="font-semibold" data-testid="text-discounted-orders-ar">
                                  {metrics.discountedOrders}
                                </span>
                                <span className="text-sm text-muted-foreground">عدد الطلبات المخصومة</span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                الطلبات التي تم دفع مقدم فيها
                              </p>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="font-semibold text-green-600" data-testid="text-avg-profit-ar">
                                  {formatPerformanceCurrency(metrics.avgProfitPerOrder)}
                                </span>
                                <span className="text-sm text-muted-foreground">متوسط ​​الربح لكل طلب</span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                الربح المحقق لكل طلب في المتوسط
                              </p>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="font-semibold" data-testid="text-avg-rate-ar">
                                  {parseFloat(metrics.avgExchangeRate) > 0 
                                    ? `1 دولار = ${parseFloat(metrics.avgExchangeRate).toFixed(4)} دينار`
                                    : 'غير متوفر'}
                                </span>
                                <span className="text-sm text-muted-foreground">متوسط ​​سعر الصرف</span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                متوسط ​​سعر تحويل الدولار إلى الدينار
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Performance Summary */}
                      <div className="grid gap-4 md:grid-cols-2">
                        {/* English Summary */}
                        <Card className="border-2">
                          <CardHeader className="bg-primary/5">
                            <CardTitle className="flex items-center gap-2">
                              <TrendingUp className="w-5 h-5 text-primary" />
                              Performance Summary
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-6 space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2">Revenue & Profit</h4>
                              <p className="text-sm text-muted-foreground">
                                Generated <span className="font-semibold text-foreground">{formatPerformanceCurrency(metrics.totalSales)}</span> in
                                revenue with <span className="font-semibold text-green-600">{formatPerformanceCurrency(metrics.totalProfit)}</span> profit
                                from <span className="font-semibold text-foreground">{metrics.totalOrders}</span> orders.
                              </p>
                            </div>

                            <Separator />

                            <div>
                              <h4 className="font-semibold mb-2">Growth Trends</h4>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                <li className="flex items-center gap-2">
                                  <span className={orderGrowth.isPositive ? 'text-green-600' : 'text-red-600'}>
                                    {orderGrowth.isPositive ? '↑' : '↓'}
                                  </span>
                                  Orders {orderGrowth.isPositive ? 'increased' : 'decreased'} by <span className="font-semibold">{orderGrowth.text}</span>
                                </li>
                                <li className="flex items-center gap-2">
                                  <span className={salesGrowth.isPositive ? 'text-green-600' : 'text-red-600'}>
                                    {salesGrowth.isPositive ? '↑' : '↓'}
                                  </span>
                                  Sales {salesGrowth.isPositive ? 'grew' : 'declined'} by <span className="font-semibold">{salesGrowth.text}</span>
                                </li>
                                <li className="flex items-center gap-2">
                                  <span className={profitGrowth.isPositive ? 'text-green-600' : 'text-red-600'}>
                                    {profitGrowth.isPositive ? '↑' : '↓'}
                                  </span>
                                  Profit {profitGrowth.isPositive ? 'improved' : 'dropped'} by <span className="font-semibold">{profitGrowth.text}</span>
                                </li>
                              </ul>
                            </div>

                            <Separator />

                            <div>
                              <h4 className="font-semibold mb-2">Key Insights</h4>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {profitGrowth.isPositive && profitGrowth.value > 10 && (
                                  <li>✓ Strong profit growth indicates healthy business performance</li>
                                )}
                                {parseFloat(metrics.avgProfitPerOrder) > 0 && (
                                  <li>✓ Average profit per order: {formatPerformanceCurrency(metrics.avgProfitPerOrder)}</li>
                                )}
                                {metrics.discountedOrders > 0 && (
                                  <li>✓ {((metrics.discountedOrders / metrics.totalOrders) * 100).toFixed(1)}% of orders included down payments</li>
                                )}
                              </ul>
                            </div>

                            {profitGrowth.isPositive === false && profitGrowth.value > 5 && (
                              <>
                                <Separator />
                                <div>
                                  <h4 className="font-semibold mb-2 text-orange-600">Recommendations</h4>
                                  <ul className="text-sm text-muted-foreground space-y-1">
                                    <li>• Review pricing strategy to improve profit margins</li>
                                    <li>• Analyze top-performing products and promote them</li>
                                    <li>• Consider cost optimization opportunities</li>
                                  </ul>
                                </div>
                              </>
                            )}
                          </CardContent>
                        </Card>

                        {/* Arabic Summary */}
                        <Card className="border-2" dir="rtl">
                          <CardHeader className="bg-primary/5">
                            <CardTitle className="flex items-center gap-2">
                              <span>ملخص الأداء</span>
                              <TrendingUp className="w-5 h-5 text-primary" />
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-6 space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2">الإيرادات والأرباح</h4>
                              <p className="text-sm text-muted-foreground">
                                تم تحقيق <span className="font-semibold text-foreground">{formatPerformanceCurrency(metrics.totalSales)}</span> من
                                الإيرادات مع <span className="font-semibold text-green-600">{formatPerformanceCurrency(metrics.totalProfit)}</span> ربح
                                من <span className="font-semibold text-foreground">{metrics.totalOrders}</span> طلب.
                              </p>
                            </div>

                            <Separator />

                            <div>
                              <h4 className="font-semibold mb-2">اتجاهات النمو</h4>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                <li className="flex items-center gap-2">
                                  <span className="font-semibold">{orderGrowth.text}</span>
                                  بنسبة {orderGrowth.isPositive ? 'زيادة' : 'انخفاض'} الطلبات
                                  <span className={orderGrowth.isPositive ? 'text-green-600' : 'text-red-600'}>
                                    {orderGrowth.isPositive ? '↑' : '↓'}
                                  </span>
                                </li>
                                <li className="flex items-center gap-2">
                                  <span className="font-semibold">{salesGrowth.text}</span>
                                  بنسبة {salesGrowth.isPositive ? 'نمو' : 'انخفاض'} المبيعات
                                  <span className={salesGrowth.isPositive ? 'text-green-600' : 'text-red-600'}>
                                    {salesGrowth.isPositive ? '↑' : '↓'}
                                  </span>
                                </li>
                                <li className="flex items-center gap-2">
                                  <span className="font-semibold">{profitGrowth.text}</span>
                                  بنسبة {profitGrowth.isPositive ? 'تحسن' : 'انخفاض'} الربح
                                  <span className={profitGrowth.isPositive ? 'text-green-600' : 'text-red-600'}>
                                    {profitGrowth.isPositive ? '↑' : '↓'}
                                  </span>
                                </li>
                              </ul>
                            </div>

                            <Separator />

                            <div>
                              <h4 className="font-semibold mb-2">رؤى رئيسية</h4>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {profitGrowth.isPositive && profitGrowth.value > 10 && (
                                  <li>✓ نمو قوي في الأرباح يشير إلى أداء تجاري صحي</li>
                                )}
                                {parseFloat(metrics.avgProfitPerOrder) > 0 && (
                                  <li>✓ متوسط ​​الربح لكل طلب: {formatPerformanceCurrency(metrics.avgProfitPerOrder)}</li>
                                )}
                                {metrics.discountedOrders > 0 && (
                                  <li>✓ {((metrics.discountedOrders / metrics.totalOrders) * 100).toFixed(1)}٪ من الطلبات شملت دفعات مقدمة</li>
                                )}
                              </ul>
                            </div>

                            {profitGrowth.isPositive === false && profitGrowth.value > 5 && (
                              <>
                                <Separator />
                                <div>
                                  <h4 className="font-semibold mb-2 text-orange-600">توصيات</h4>
                                  <ul className="text-sm text-muted-foreground space-y-1">
                                    <li>• مراجعة استراتيجية التسعير لتحسين هوامش الربح</li>
                                    <li>• تحليل المنتجات الأكثر أداءً والترويج لها</li>
                                    <li>• النظر في فرص تحسين التكاليف</li>
                                  </ul>
                                </div>
                              </>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </>
                  );
                })()}
              </>
            ) : (
              <div className="text-center py-8">No performance data available</div>
            )}
          </TabsContent>
        </Tabs>

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
