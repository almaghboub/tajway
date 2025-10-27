import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Package, Percent, Calendar } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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

export default function PerformanceReport() {
  const { t, i18n } = useTranslation();
  const [timeRange, setTimeRange] = useState<TimeRange>('daily');
  const isRTL = i18n.language === 'ar';

  const { data: reportData, isLoading } = useQuery<PerformanceData>({
    queryKey: [`/api/reports/performance?range=${timeRange}`],
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: string) => {
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

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded w-1/3"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return <div className="container mx-auto p-4 md:p-6">No data available</div>;
  }

  const { metrics, period, previousPeriod } = reportData;
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
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isRTL ? 'تقرير الأداء' : 'Performance Report'}
          </h1>
          <p className="text-muted-foreground">
            {isRTL 
              ? 'تقرير شامل عن المبيعات والأرباح والنمو' 
              : 'Comprehensive sales, profit, and growth analysis'}
          </p>
        </div>
        <div className="w-full md:w-[200px]">
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
            {formatDate(period.start)} - {formatDate(period.end)}
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
              {formatCurrency(metrics.totalSales)}
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
              {formatCurrency(metrics.totalProfit)}
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
              {formatCurrency(metrics.avgOrderValue)}
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
                  {formatCurrency(metrics.avgProfitPerOrder)}
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
                  {formatCurrency(metrics.avgProfitPerOrder)}
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
                Generated <span className="font-semibold text-foreground">{formatCurrency(metrics.totalSales)}</span> in
                revenue with <span className="font-semibold text-green-600">{formatCurrency(metrics.totalProfit)}</span> profit
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
                  <li>✓ Average profit per order: {formatCurrency(metrics.avgProfitPerOrder)}</li>
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
                تم تحقيق <span className="font-semibold text-foreground">{formatCurrency(metrics.totalSales)}</span> من
                الإيرادات مع <span className="font-semibold text-green-600">{formatCurrency(metrics.totalProfit)}</span> ربح
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
                  <li>✓ متوسط ​​الربح لكل طلب: {formatCurrency(metrics.avgProfitPerOrder)}</li>
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
    </div>
  );
}
