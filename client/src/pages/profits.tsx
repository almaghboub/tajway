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

  const { data: commissionRules = [], isLoading: isLoadingCommissionRules } = useQuery({
    queryKey: ["/api/commission-rules"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/commission-rules");
      return response.json();
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

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Country filter
      const matchesCountry = performanceCountryFilters.length === 0 || performanceCountryFilters.includes(order.shippingCountry || "");
      
      // Date range filter
      let matchesDateRange = true;
      if (performanceDateFrom || performanceDateTo) {
        const orderDate = new Date(order.date);
        if (performanceDateFrom) {
          const fromDate = new Date(performanceDateFrom);
          matchesDateRange = matchesDateRange && orderDate >= fromDate;
        }
        if (performanceDateTo) {
          const toDate = new Date(performanceDateTo);
          toDate.setHours(23, 59, 59, 999); // Include the entire end date
          matchesDateRange = matchesDateRange && orderDate <= toDate;
        }
      }
      
      return matchesCountry && matchesDateRange;
    });
  }, [orders, performanceCountryFilters, performanceDateFrom, performanceDateTo]);

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
      
      <div className="flex-1 p-6 space-y-8 bg-gradient-to-br from-background via-background to-muted/20">
        {/* Header Section with Filter */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {t('profitMetrics')}
            </h2>
            <p className="text-muted-foreground mt-1">{t('basedOnOrders', { count: filteredOrders.length })}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Unified Filter Button */}
            <Popover open={isPerformanceFilterOpen} onOpenChange={setIsPerformanceFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow" data-testid="button-filter-profits">
                  <Filter className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                  {t("filter")}
                  {(performanceCountryFilters.length > 0 || performanceDateFrom || performanceDateTo) && (
                    <Badge variant="default" className="ltr:ml-2 rtl:mr-2">
                      {performanceCountryFilters.length + (performanceDateFrom || performanceDateTo ? 1 : 0)}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" data-testid="popover-filter-profits">
                <div className="space-y-4">
                  {/* Country Filter */}
                  <div>
                    <h4 className="font-semibold mb-3">{t("filterByCountry")}</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {shippingCountries.length > 0 ? (
                        shippingCountries.map((country) => (
                          <div key={country} className="flex items-center space-x-2 rtl:space-x-reverse">
                            <Checkbox
                              id={`filter-${country}`}
                              checked={performanceCountryFilters.includes(country)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setPerformanceCountryFilters(prev => [...prev, country]);
                                } else {
                                  setPerformanceCountryFilters(prev => prev.filter(c => c !== country));
                                }
                              }}
                              data-testid={`checkbox-filter-${country}`}
                            />
                            <Label htmlFor={`filter-${country}`} className="cursor-pointer flex-1">
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
                        <Label htmlFor="date-from" className="text-sm">{t("from")}</Label>
                        <input
                          id="date-from"
                          type="date"
                          value={performanceDateFrom}
                          onChange={(e) => setPerformanceDateFrom(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                          data-testid="input-date-from"
                        />
                      </div>
                      <div>
                        <Label htmlFor="date-to" className="text-sm">{t("to")}</Label>
                        <input
                          id="date-to"
                          type="date"
                          value={performanceDateTo}
                          onChange={(e) => setPerformanceDateTo(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                          data-testid="input-date-to"
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
                      data-testid="button-clear-filters"
                    >
                      {t("clearFilters")}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setIsPerformanceFilterOpen(false)}
                      data-testid="button-apply-filters"
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

        {/* Key Metrics - First Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card data-testid="card-order-count" className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t('numberOfOrders')}</p>
                  {isLoading ? (
                    <Skeleton className="h-10 w-28 mt-2" />
                  ) : (
                    <p className="text-4xl font-extrabold text-blue-600 dark:text-blue-400 mt-2" data-testid="text-order-count">
                      {metrics.orderCount}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">{t('totalOrders')}</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <ShoppingCart className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-average-order-value" className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t('averageOrderValue')}</p>
                  {isLoading ? (
                    <Skeleton className="h-10 w-32 mt-2" />
                  ) : (
                    <p className="text-4xl font-extrabold text-purple-600 dark:text-purple-400 mt-2" data-testid="text-average-order-value">
                      {currency} {metrics.averageOrderValue.toFixed(2)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">{t('perOrder')}</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Calculator className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-total-revenue" className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-background">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t('totalRevenue')}</p>
                  {isLoading ? (
                    <Skeleton className="h-10 w-36 mt-2" />
                  ) : (
                    <p className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2" data-testid="text-total-revenue">
                      {currency} {metrics.totalRevenue.toFixed(2)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">{t('fromAllOrders')}</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profit Breakdown - Highlighted Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 rounded-3xl blur-xl"></div>
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card data-testid="card-items-profit" className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-cyan-50 to-white dark:from-cyan-950/20 dark:to-background overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-400/20 to-transparent rounded-full -mr-16 -mt-16"></div>
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t('profitFromOrders')}</p>
                    {isLoading ? (
                      <Skeleton className="h-10 w-32 mt-2" />
                    ) : (
                      <p className="text-4xl font-extrabold text-cyan-600 dark:text-cyan-400 mt-2" data-testid="text-items-profit">
                        {currency} {metrics.totalItemsProfit.toFixed(2)}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">{t('orderValueMinusCost')}</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Package className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-shipping-profit" className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-background overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/20 to-transparent rounded-full -mr-16 -mt-16"></div>
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t('profitFromShipping')}</p>
                    {isLoading ? (
                      <Skeleton className="h-10 w-32 mt-2" />
                    ) : (
                      <p className="text-4xl font-extrabold text-orange-600 dark:text-orange-400 mt-2" data-testid="text-shipping-profit">
                        {currency} {metrics.totalShippingProfit.toFixed(2)}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">{t('shippingFeeMinusCost')}</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-total-profit" className="border-2 border-green-200 dark:border-green-800 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/30 to-transparent rounded-full -mr-16 -mt-16"></div>
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-green-700 dark:text-green-400 uppercase tracking-wide flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      {t('totalProfit')}
                    </p>
                    {isLoading ? (
                      <Skeleton className="h-12 w-40 mt-2" />
                    ) : (
                      <p className="text-5xl font-black text-green-600 dark:text-green-400 mt-2" data-testid="text-total-profit">
                        {currency} {metrics.totalProfit.toFixed(2)}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      <div className="h-2 flex-1 bg-green-200 dark:bg-green-900 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" style={{ width: `${Math.min(metrics.profitMargin, 100)}%` }}></div>
                      </div>
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">
                        {metrics.profitMargin.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl">
                    <DollarSign className="w-10 h-10 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Profit Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="card-profit-trend">
            <CardHeader>
              <CardTitle>{t('profitTrendAnalysis')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('totalProfit')}</p>
                      <p className="text-2xl font-bold text-green-600">
                        {currency} {metrics.totalProfit.toFixed(2)}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-600" />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-600" />
                        <span className="text-sm">{t('profitFromOrders')}</span>
                      </div>
                      <span className="font-semibold text-blue-600">
                        {currency} {metrics.totalItemsProfit.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-orange-600" />
                        <span className="text-sm">{t('profitFromShipping')}</span>
                      </div>
                      <span className="font-semibold text-orange-600">
                        {currency} {metrics.totalShippingProfit.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-primary/5">
                      <div className="flex items-center gap-2">
                        <Percent className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium">{t('profitMargin')}</span>
                      </div>
                      <span className="font-bold text-primary">
                        {metrics.profitMargin.toFixed(1)}%
                      </span>
                    </div>
                    
                    <div className="pt-2 text-center">
                      <p className="text-xs text-muted-foreground">
                        {t('basedOnOrders', { count: metrics.orderCount })}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-commission-breakdown">
            <CardHeader>
              <CardTitle>{t('commissionBreakdown')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingCommissionRules ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : commissionRules.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-4">
                    <Calculator className="w-5 h-5 text-primary" />
                    <p className="text-sm text-muted-foreground">
                      {t('commissionRulesFromSettings')}
                    </p>
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {commissionRules.map((rule: any) => (
                      <div key={rule.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-sm">{rule.country}</span>
                          <span className="font-bold text-primary">
                            {(parseFloat(rule.percentage) * 100).toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {t('range')}: ${parseFloat(rule.minValue).toFixed(2)}
                            {rule.maxValue ? ` - $${parseFloat(rule.maxValue).toFixed(2)}` : '+'}
                          </span>
                          {parseFloat(rule.fixedFee) > 0 && (
                            <span className="text-orange-600">
                              +${parseFloat(rule.fixedFee).toFixed(2)} {t('fixedFee')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 text-center">
                    <p className="text-xs text-muted-foreground">
                      {t('totalCommissionRules', { count: commissionRules.length })}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calculator className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">{t('noCommissionRules')}</h3>
                  <p className="text-muted-foreground text-sm">
                    {t('addCommissionRulesInSettings')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Report Actions */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-950/50 dark:to-background" data-testid="card-report-actions">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">{t('generateReports')}</CardTitle>
                <p className="text-sm text-muted-foreground">Export detailed analytics reports</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                className="h-auto p-6 flex-col gap-3 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300" 
                onClick={() => generateReport("profit")}
                disabled={isGeneratingReport}
                data-testid="button-profit-report"
              >
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <span className="font-semibold text-lg text-white">{t('profitReportTitle')}</span>
                <span className="text-xs text-blue-100">{t('orderWiseProfitAnalysis')}</span>
              </Button>

              <Button 
                variant="outline" 
                className="h-auto p-6 flex-col gap-3 border-2 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/20 shadow-lg hover:shadow-xl transition-all duration-300" 
                onClick={() => generateReport("commission")}
                disabled={isGeneratingReport}
                data-testid="button-commission-report"
              >
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <Calculator className="w-6 h-6 text-purple-600" />
                </div>
                <span className="font-semibold text-lg">{t('commissionReportTitle')}</span>
                <span className="text-xs text-muted-foreground">{t('countryWiseCommissions')}</span>
              </Button>

              <Button 
                variant="outline"
                className="h-auto p-6 flex-col gap-3 border-2 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/20 shadow-lg hover:shadow-xl transition-all duration-300" 
                onClick={() => generateReport("financial")}
                disabled={isGeneratingReport}
                data-testid="button-financial-summary"
              >
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <span className="font-semibold text-lg">{t('financialSummaryTitle')}</span>
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

        {/* Performance Analytics */}
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
