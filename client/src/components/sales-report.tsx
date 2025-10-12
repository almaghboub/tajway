import { Card, CardContent } from "@/components/ui/card";

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
}

interface SalesReportProps {
  reportType: "profit" | "commission" | "financial";
  data: ReportData;
  onPrint?: () => void;
}

export function SalesReport({ reportType, data, onPrint }: SalesReportProps) {
  const currentDate = new Date().toLocaleDateString();
  
  const getReportTitle = () => {
    switch (reportType) {
      case "profit":
        return "Profit Analysis Report";
      case "commission":
        return "Commission Breakdown Report";
      case "financial":
        return "Financial Summary Report";
      default:
        return "Sales Report";
    }
  };

  const getReportDescription = () => {
    switch (reportType) {
      case "profit":
        return "Detailed profit analysis including order-wise profit margins and trends";
      case "commission":
        return "Country-wise commission breakdown and commission rate analysis";
      case "financial":
        return "Comprehensive financial overview including revenue, costs, and profitability";
      default:
        return "Sales performance report";
    }
  };

  return (
    <div className="sales-report-container max-w-6xl mx-auto p-8 bg-white text-black">
      {/* Report Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-blue-600 mb-2">LYNX LY</h1>
            <p className="text-gray-600">Logistics Management System</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold mb-2">{getReportTitle()}</h2>
            <p className="text-gray-600">Generated: {currentDate}</p>
            {data.periodStart && data.periodEnd && (
              <p className="text-gray-600">
                Period: {new Date(data.periodStart).toLocaleDateString()} - {new Date(data.periodEnd).toLocaleDateString()}
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
        <h3 className="text-lg font-semibold mb-4 text-blue-600">Executive Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 p-4 rounded">
            <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-blue-600">${data.totalRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-green-50 p-4 rounded">
            <p className="text-sm text-gray-600 mb-1">Total Profit</p>
            <p className="text-2xl font-bold text-green-600">${data.totalProfit.toFixed(2)}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded">
            <p className="text-sm text-gray-600 mb-1">Profit Margin</p>
            <p className="text-2xl font-bold text-purple-600">{data.profitMargin.toFixed(1)}%</p>
          </div>
          <div className="bg-orange-50 p-4 rounded">
            <p className="text-sm text-gray-600 mb-1">Total Orders</p>
            <p className="text-2xl font-bold text-orange-600">{data.orderCount}</p>
          </div>
        </div>
      </div>

      {/* Report Content Based on Type */}
      {reportType === "profit" && data.orders && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-blue-600">Order-wise Profit Analysis</h3>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-blue-50">
                <th className="border border-gray-300 px-4 py-2 text-left">Customer Code</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Customer</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Revenue</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Items Profit</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Shipping Profit</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Total Profit</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Margin</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.orders.map((order) => {
                const margin = (parseFloat(order.profit) / parseFloat(order.totalAmount)) * 100;
                
                return (
                  <tr key={order.id}>
                    <td className="border border-gray-300 px-4 py-2">{order.shippingCode || order.orderNumber}</td>
                    <td className="border border-gray-300 px-4 py-2">{order.customerName}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">${parseFloat(order.totalAmount).toFixed(2)}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">${parseFloat(order.itemsProfit || "0").toFixed(2)}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">${parseFloat(order.shippingProfit || "0").toFixed(2)}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">${parseFloat(order.profit).toFixed(2)}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">{margin.toFixed(1)}%</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {reportType === "commission" && data.countryBreakdown && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-blue-600">Country-wise Commission Analysis</h3>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-blue-50">
                <th className="border border-gray-300 px-4 py-2 text-left">Country</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Revenue</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Commission Rate</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Commission Amount</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Orders</th>
              </tr>
            </thead>
            <tbody>
              {data.countryBreakdown.map((country) => (
                <tr key={country.country}>
                  <td className="border border-gray-300 px-4 py-2">{country.country}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">${country.revenue.toFixed(2)}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{(country.commissionRate * 100).toFixed(1)}%</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">${country.commission.toFixed(2)}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">{country.orderCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reportType === "financial" && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-blue-600">Financial Performance Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-medium mb-3">Revenue Analysis</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Gross Revenue:</span>
                  <span className="font-medium">${data.totalRevenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Commission:</span>
                  <span className="font-medium">${data.totalCommission.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>Net Profit:</span>
                  <span className="font-bold text-green-600">${data.totalProfit.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-medium mb-3">Performance Indicators</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Profit Margin:</span>
                  <span className="font-medium">{data.profitMargin.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Order Value:</span>
                  <span className="font-medium">${(data.totalRevenue / data.orderCount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Profit per Order:</span>
                  <span className="font-medium">${(data.totalProfit / data.orderCount).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Footer */}
      <div className="border-t border-gray-300 pt-8 mt-8 text-center text-gray-600">
        <p>Generated by LYNX LY Logistics Management System</p>
        <p className="text-sm mt-2">This report contains confidential business information</p>
        <p className="text-xs mt-1">Report Date: {currentDate}</p>
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