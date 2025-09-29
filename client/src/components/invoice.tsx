import { Card, CardContent } from "@/components/ui/card";

interface OrderWithItems {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: string;
  shippingCost: string;
  commission: string;
  profit: string;
  notes?: string;
  createdAt: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    country: string;
    postalCode?: string;
  };
  items?: {
    id: string;
    productName: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
  }[];
}

interface InvoiceProps {
  order: OrderWithItems;
  onPrint?: () => void;
}

export function Invoice({ order, onPrint }: InvoiceProps) {
  const subtotal = order.items?.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0) || 0;
  const shipping = parseFloat(order.shippingCost);
  const total = parseFloat(order.totalAmount);

  return (
    <div className="invoice-container max-w-4xl mx-auto p-8 bg-white text-black">
      {/* Invoice Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-blue-600 mb-2">LYNX LY</h1>
            <p className="text-gray-600">Logistics Management System</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold mb-2">INVOICE</h2>
            <p className="text-gray-600">Invoice #: {order.orderNumber}</p>
            <p className="text-gray-600">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-blue-600">Bill To:</h3>
        <div className="bg-gray-50 p-4 rounded">
          <p className="font-semibold">{order.customer.firstName} {order.customer.lastName}</p>
          {order.customer.email && <p>{order.customer.email}</p>}
          {order.customer.phone && <p>{order.customer.phone}</p>}
          {order.customer.address && (
            <div className="mt-2">
              <p>{order.customer.address}</p>
              {order.customer.city && order.customer.postalCode && (
                <p>{order.customer.city}, {order.customer.postalCode}</p>
              )}
              <p>{order.customer.country}</p>
            </div>
          )}
        </div>
      </div>

      {/* Order Items */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-blue-600">Order Details:</h3>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-blue-50">
              <th className="border border-gray-300 px-4 py-2 text-left">Product</th>
              <th className="border border-gray-300 px-4 py-2 text-center">Quantity</th>
              <th className="border border-gray-300 px-4 py-2 text-right">Unit Price</th>
              <th className="border border-gray-300 px-4 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item) => (
              <tr key={item.id}>
                <td className="border border-gray-300 px-4 py-2">{item.productName}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{item.quantity}</td>
                <td className="border border-gray-300 px-4 py-2 text-right">${parseFloat(item.unitPrice).toFixed(2)}</td>
                <td className="border border-gray-300 px-4 py-2 text-right">${parseFloat(item.totalPrice).toFixed(2)}</td>
              </tr>
            )) || (
              <tr>
                <td colSpan={4} className="border border-gray-300 px-4 py-2 text-center text-gray-500">
                  Loading order items...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Order Summary */}
      <div className="flex justify-end mb-8">
        <div className="w-80">
          <div className="bg-gray-50 p-4 rounded">
            <div className="flex justify-between py-2">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span>Shipping:</span>
              <span>${shipping.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-300 pt-2 mt-2">
              <div className="flex justify-between py-2 font-bold text-lg">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="mb-8">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-2 text-blue-600">Order Status:</h3>
            <p className="capitalize">{order.status}</p>
          </div>
          {order.notes && (
            <div>
              <h3 className="text-lg font-semibold mb-2 text-blue-600">Notes:</h3>
              <p>{order.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-300 pt-8 mt-8 text-center text-gray-600">
        <p>Thank you for your business!</p>
        <p className="text-sm mt-2">This invoice was generated by LYNX LY Logistics Management System</p>
      </div>

      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            .invoice-container {
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
            
            .bg-gray-50 {
              background: #f9f9f9 !important;
            }
            
            .bg-blue-50 {
              background: #e3f2fd !important;
            }
            
            .text-blue-600 {
              color: #1976d2 !important;
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
          }
        `
      }} />
    </div>
  );
}