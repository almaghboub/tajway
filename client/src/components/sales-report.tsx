import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

interface OrderSummary {
  id: string;
  orderNumber: string;
  shippingCode?: string;
  customerName: string;
  totalAmount: string;
  profit: string;
  itemsProfit?: string;
  shippingProfit?: string;
  commission: string;
  country: string;
  createdAt: string;
}

interface CommissionRule {
  id: string;
  country: string;
  minValue: string;
  maxValue: string | null;
  percentage: string;
  fixedFee: string;
}

interface ReportData {
  totalRevenue: number;
  totalProfit: number;
  totalCommission: number;
  profitMargin: number;
  orderCount: number;
  orders?: OrderSummary[];
  periodStart?: string;
  periodEnd?: string;
  countryBreakdown?: {
    country: string;
    revenue: number;
    commission: number;
    commissionRate: number;
    orderCount: number;
  }[];
  exchangeRate?: number;
  currency?: string;
  commissionRules?: CommissionRule[];
}

interface SalesReportProps {
  reportType: "profit" | "commission" | "financial";
  data: ReportData;
  onPrint?: () => void;
}

export function SalesReport({ reportType, data, onPrint }: SalesReportProps) {
  const { t, i18n } = useTranslation();
  const currentDate = new Date().toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US');
  const currency = data.currency || "USD";
  const exchangeRate = data.exchangeRate || 0;
  
  // Helper function to convert USD to LYD if exchange rate is set
  const convertToLYD = (usdAmount: number): number => {
    if (exchangeRate > 0) {
      return parseFloat((usdAmount * exchangeRate).toFixed(2));
    }
    return usdAmount;
  };
  
  const getReportTitle = () => {
    switch (reportType) {
      case "profit":
        return t('profitAnalysisReport');
      case "commission":
        return t('commissionBreakdownReport');
      case "financial":
        return t('financialSummaryReport');
      default:
        return t('salesReportPreview');
    }
  };

  const getReportDescription = () => {
    switch (reportType) {
      case "profit":
        return t('profitAnalysisDescription');
      case "commission":
        return t('commissionBreakdownDescription');
      case "financial":
        return t('financialSummaryDescription');
      default:
        return "";
    }
  };

  return (
    <div className="sales-report-container max-w-6xl mx-auto p-8 bg-white text-black">
      {/* Report Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-blue-600 mb-2">LYNX LY</h1>
            <p className="text-gray-600">{t('logisticsManagementSystem')}</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold mb-2">{getReportTitle()}</h2>
            <p className="text-gray-600">{t('generated')}: {currentDate}</p>
            {data.periodStart && data.periodEnd && (
              <p className="text-gray-600">
                {t('period')}: {new Date(data.periodStart).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')} - {new Date(data.periodEnd).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <p className="text-gray-700">{getReportDescription()}</p>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-blue-600">{t('executiveSummary')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 p-4 rounded">
            <p className="text-sm text-gray-600 mb-1">{t('totalRevenue')}</p>
            <p className="text-2xl font-bold text-blue-600">{currency} {convertToLYD(data.totalRevenue).toFixed(2)}</p>
          </div>
          <div className="bg-green-50 p-4 rounded">
            <p className="text-sm text-gray-600 mb-1">{t('totalProfit')}</p>
            <p className="text-2xl font-bold text-green-600">{currency} {convertToLYD(data.totalProfit).toFixed(2)}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded">
            <p className="text-sm text-gray-600 mb-1">{t('profitMargin')}</p>
            <p className="text-2xl font-bold text-purple-600">{data.profitMargin.toFixed(1)}%</p>
          </div>
          <div className="bg-orange-50 p-4 rounded">
            <p className="text-sm text-gray-600 mb-1">{t('totalOrders')}</p>
            <p className="text-2xl font-bold text-orange-600">{data.orderCount}</p>
          </div>
        </div>
      </div>

      {/* Report Content Based on Type */}
      {reportType === "profit" && data.orders && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-blue-600">{t('orderWiseProfitAnalysisTable')}</h3>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-blue-50">
                <th className="border border-gray-300 px-4 py-2 text-left">{t('customerCode')}</th>
                <th className="border border-gray-300 px-4 py-2 text-left">{t('customer')}</th>
                <th className="border border-gray-300 px-4 py-2 text-right">{t('revenue')}</th>
                <th className="border border-gray-300 px-4 py-2 text-right">{t('itemsProfit')}</th>
                <th className="border border-gray-300 px-4 py-2 text-right">{t('shippingProfit')}</th>
                <th className="border border-gray-300 px-4 py-2 text-right">{t('totalProfit')}</th>
                <th className="border border-gray-300 px-4 py-2 text-right">{t('margin')}</th>
                <th className="border border-gray-300 px-4 py-2 text-center">{t('date')}</th>
              </tr>
            </thead>
            <tbody>
              {data.orders.map((order) => {
                const margin = (parseFloat(order.profit) / parseFloat(order.totalAmount)) * 100;
                
                return (
                  <tr key={order.id}>
                    <td className="border border-gray-300 px-4 py-2">{order.shippingCode || order.orderNumber}</td>
                    <td className="border border-gray-300 px-4 py-2">{order.customerName}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">{currency} {convertToLYD(parseFloat(order.totalAmount)).toFixed(2)}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">{currency} {convertToLYD(parseFloat(order.itemsProfit || "0")).toFixed(2)}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">{currency} {convertToLYD(parseFloat(order.shippingProfit || "0")).toFixed(2)}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">{currency} {convertToLYD(parseFloat(order.profit)).toFixed(2)}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">{margin.toFixed(1)}%</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{new Date(order.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {reportType === "commission" && (
        <>
          {/* Commission Rules Section */}
          {data.commissionRules && data.commissionRules.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 text-blue-600">{t('commissionRules')}</h3>
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">{t('country')}</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">{t('minValue')}</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">{t('maxValue')}</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">{t('percentage')}</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">{t('fixedFee')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.commissionRules.map((rule) => (
                    <tr key={rule.id}>
                      <td className="border border-gray-300 px-4 py-2">{rule.country}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">{currency} {convertToLYD(parseFloat(rule.minValue)).toFixed(2)}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        {rule.maxValue ? `${currency} ${convertToLYD(parseFloat(rule.maxValue)).toFixed(2)}` : t('noLimit')}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right">{(parseFloat(rule.percentage) * 100).toFixed(2)}%</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">{currency} {convertToLYD(parseFloat(rule.fixedFee)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Country-wise Commission Analysis */}
          {data.countryBreakdown && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 text-blue-600">{t('countryWiseCommissionAnalysis')}</h3>
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">{t('country')}</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">{t('revenue')}</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">{t('commissionRate')}</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">{t('commissionAmount')}</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">{t('orders')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.countryBreakdown.map((country) => (
                    <tr key={country.country}>
                      <td className="border border-gray-300 px-4 py-2">{country.country}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">{currency} {convertToLYD(country.revenue).toFixed(2)}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">{(country.commissionRate * 100).toFixed(1)}%</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">{currency} {convertToLYD(country.commission).toFixed(2)}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{country.orderCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {reportType === "financial" && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-blue-600">{t('financialPerformanceMetrics')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-medium mb-3">{t('revenueAnalysis')}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{t('grossRevenue')}:</span>
                  <span className="font-medium">{currency} {convertToLYD(data.totalRevenue).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('totalCommission')}:</span>
                  <span className="font-medium">{currency} {convertToLYD(data.totalCommission).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>{t('netProfit')}:</span>
                  <span className="font-bold text-green-600">{currency} {convertToLYD(data.totalProfit).toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-medium mb-3">{t('performanceIndicators')}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{t('profitMargin')}:</span>
                  <span className="font-medium">{data.profitMargin.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('averageOrderValue')}:</span>
                  <span className="font-medium">{currency} {convertToLYD(data.totalRevenue / data.orderCount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('averageProfitPerOrder')}:</span>
                  <span className="font-medium">{currency} {convertToLYD(data.totalProfit / data.orderCount).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Footer */}
      <div className="border-t border-gray-300 pt-8 mt-8 text-center text-gray-600">
        <p>{t('generatedByLynx')}</p>
        <p className="text-sm mt-2">{t('reportConfidential')}</p>
        <p className="text-xs mt-1">{t('reportDate')}: {currentDate}</p>
      </div>

      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            .sales-report-container {
              max-width: none !important;
              margin: 0 !important;
              padding: 20px !important;
              background: white !important;
              box-shadow: none !important;
            }
            
            body {
              background: white !important;
            }
            
            * {
              color: black !important;
            }
            
            .bg-gray-50, .bg-blue-50, .bg-green-50, .bg-purple-50, .bg-orange-50 {
              background: #f9f9f9 !important;
            }
            
            .text-blue-600 {
              color: #1976d2 !important;
            }
            
            .text-green-600 {
              color: #16a34a !important;
            }
            
            .text-purple-600 {
              color: #9333ea !important;
            }
            
            .text-orange-600 {
              color: #ea580c !important;
            }
            
            .border-gray-300 {
              border-color: #d1d5db !important;
            }
            
            table {
              page-break-inside: avoid;
            }
            
            tr {
              page-break-inside: avoid;
            }
            
            .grid {
              page-break-inside: avoid;
            }
          }
        `
      }} />
    </div>
  );
}