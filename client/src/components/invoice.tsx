import logoPath from "@assets/lynx-logo.png";

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
  const commission = parseFloat(order.commission);
  const total = parseFloat(order.totalAmount);

  return (
    <div className="invoice-container max-w-4xl mx-auto p-8 bg-white text-black">
      {/* Invoice Header with Logo and Company Info */}
      <div className="mb-8 border-b-4 border-red-700 pb-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-4">
            <img src={logoPath} alt="Lynx Logo" className="h-20 w-auto" />
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold text-red-700 mb-2">INVOICE</h2>
            <div className="text-sm space-y-1">
              <p className="font-semibold">Invoice #: {order.orderNumber}</p>
              <p>Date: {new Date(order.createdAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
              <p className="text-gray-600">Status: <span className="capitalize font-semibold text-red-700">{order.status}</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Company and Customer Information Side by Side */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* From Section */}
        <div>
          <h3 className="text-sm font-bold text-red-700 mb-3 uppercase tracking-wide">From:</h3>
          <div className="space-y-1">
            <p className="font-bold text-lg">Lynx</p>
            <p className="text-sm">International Shipping & Purchasing</p>
            <p className="text-sm text-gray-600">للشحن والشراء الدولي</p>
          </div>
        </div>

        {/* Bill To Section */}
        <div>
          <h3 className="text-sm font-bold text-red-700 mb-3 uppercase tracking-wide">Bill To:</h3>
          <div className="bg-gray-50 p-4 rounded-lg space-y-1">
            <p className="font-bold">{order.customer.firstName} {order.customer.lastName}</p>
            {order.customer.email && <p className="text-sm">{order.customer.email}</p>}
            {order.customer.phone && <p className="text-sm">{order.customer.phone}</p>}
            {order.customer.address && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-sm">{order.customer.address}</p>
                {order.customer.city && order.customer.postalCode && (
                  <p className="text-sm">{order.customer.city}, {order.customer.postalCode}</p>
                )}
                <p className="text-sm font-semibold">{order.customer.country}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Items Table */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-red-700 mb-3 uppercase tracking-wide">Shipment Details:</h3>
        <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-red-700 text-white">
                <th className="px-4 py-3 text-left font-semibold">Product Description</th>
                <th className="px-4 py-3 text-center font-semibold">Qty</th>
                <th className="px-4 py-3 text-right font-semibold">Unit Price</th>
                <th className="px-4 py-3 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {order.items?.map((item, index) => (
                <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 font-medium">{item.productName}</td>
                  <td className="px-4 py-3 text-center">{item.quantity}</td>
                  <td className="px-4 py-3 text-right">${parseFloat(item.unitPrice).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-semibold">${parseFloat(item.totalPrice).toFixed(2)}</td>
                </tr>
              )) || (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    Loading shipment details...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Section */}
      <div className="flex justify-end mb-8">
        <div className="w-96">
          <div className="bg-gray-50 rounded-lg p-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-semibold">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Shipping & Handling:</span>
              <span className="font-semibold">${shipping.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Commission:</span>
              <span className="font-semibold">${commission.toFixed(2)}</span>
            </div>
            <div className="border-t-2 border-gray-300 pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-red-700">TOTAL:</span>
                <span className="text-2xl font-bold text-red-700">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes Section */}
      {order.notes && (
        <div className="mb-8 bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
          <h3 className="text-sm font-bold text-amber-800 mb-2 uppercase tracking-wide">Notes:</h3>
          <p className="text-sm text-amber-900">{order.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="border-t-2 border-gray-200 pt-6 mt-8">
        <div className="text-center space-y-2">
          <p className="text-sm font-semibold text-red-700">Thank you for choosing Lynx!</p>
          <p className="text-xs text-gray-600">International Shipping & Purchasing - للشحن والشراء الدولي</p>
          <p className="text-xs text-gray-500 mt-4">This invoice was automatically generated by Lynx Logistics Management System</p>
        </div>
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
              background: #f9fafb !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .bg-red-700 {
              background: #b91c1c !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .text-red-700 {
              color: #b91c1c !important;
            }
            
            .text-white {
              color: white !important;
            }
            
            .border-red-700 {
              border-color: #b91c1c !important;
            }
            
            .border-gray-200,
            .border-gray-300 {
              border-color: #e5e7eb !important;
            }
            
            table {
              page-break-inside: avoid;
            }
            
            tr {
              page-break-inside: avoid;
            }
            
            img {
              max-height: 80px !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        `
      }} />
    </div>
  );
}
