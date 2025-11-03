import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ShoppingCart, Search, Eye } from "lucide-react";
import { useLydExchangeRate } from "@/hooks/use-lyd-exchange-rate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Header } from "@/components/header";
import { useIsMobile } from "@/hooks/use-mobile";
import type { OrderWithCustomer } from "@shared/schema";
import { format } from "date-fns";

export default function ReadyToBuy() {
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderWithCustomer | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const { lydRate } = useLydExchangeRate();

  const { data: orders = [], isLoading } = useQuery<OrderWithCustomer[]>({
    queryKey: ["/api/orders"],
  });

  const readyToBuyOrders = orders.filter(order => order.status === "ready_to_buy");

  const filteredOrders = readyToBuyOrders.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(searchLower) ||
      order.customer?.firstName?.toLowerCase().includes(searchLower) ||
      order.customer?.lastName?.toLowerCase().includes(searchLower) ||
      order.customer?.phone?.toLowerCase().includes(searchLower) ||
      order.customer?.shippingCode?.toLowerCase().includes(searchLower)
    );
  });

  const handleViewDetails = (order: OrderWithCustomer) => {
    setSelectedOrder(order);
    setIsDetailsDialogOpen(true);
  };

  const formatCurrency = (amount: string | number | null | undefined, currency: 'USD' | 'LYD' = 'USD') => {
    if (!amount) return currency === 'USD' ? '$0.00' : 'د.ل 0.00';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (currency === 'LYD') {
      const lydAmount = numAmount * lydRate;
      return i18n.language === 'ar' 
        ? `${lydAmount.toFixed(2)} د.ل`
        : `د.ل ${lydAmount.toFixed(2)}`;
    }
    
    return `$${numAmount.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">
              {t('readyToBuy')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('readyToBuyDescription')}
            </p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2" data-testid="badge-order-count">
            {filteredOrders.length} {t('orders')}
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              {t('readyToBuyOrders')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('searchOrders')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('loading')}...
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? t('noOrdersFound') : t('noReadyToBuyOrders')}
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('orderNumber')}</TableHead>
                      <TableHead>{t('customer')}</TableHead>
                      <TableHead>{t('customerCode')}</TableHead>
                      <TableHead>{t('city')}</TableHead>
                      <TableHead className="text-right">{t('totalAmount')}</TableHead>
                      <TableHead className="text-right">{t('downPayment')}</TableHead>
                      <TableHead className="text-right">{t('remainingBalance')}</TableHead>
                      <TableHead>{t('date')}</TableHead>
                      <TableHead className="text-center">{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                        <TableCell className="font-medium">
                          {order.orderNumber}
                        </TableCell>
                        <TableCell>
                          {order.customer?.firstName} {order.customer?.lastName}
                          <div className="text-sm text-muted-foreground">
                            {order.customer?.phone}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {order.customer?.shippingCode || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell>{order.shippingCity || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div>{formatCurrency(order.totalAmount)}</div>
                          <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                            {formatCurrency(order.totalAmount, 'LYD')}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div>{formatCurrency(order.downPayment)}</div>
                          <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                            {formatCurrency(order.downPayment, 'LYD')}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div>{formatCurrency(order.remainingBalance)}</div>
                          <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                            {formatCurrency(order.remainingBalance, 'LYD')}
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(order)}
                            data-testid={`button-view-${order.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t('orderDetails')} - {selectedOrder?.orderNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">{t('customerInformation')}</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>{t('name')}:</strong> {selectedOrder.customer?.firstName} {selectedOrder.customer?.lastName}</p>
                    <p><strong>{t('phone')}:</strong> {selectedOrder.customer?.phone}</p>
                    <p><strong>{t('customerCode')}:</strong> {selectedOrder.customer?.shippingCode || '-'}</p>
                    <p><strong>{t('city')}:</strong> {selectedOrder.customer?.city}</p>
                    <p><strong>{t('country')}:</strong> {selectedOrder.customer?.country}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{t('orderInformation')}</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>{t('orderNumber')}:</strong> {selectedOrder.orderNumber}</p>
                    <p><strong>{t('status')}:</strong> <Badge>{t('readyToBuy')}</Badge></p>
                    <p><strong>{t('totalAmount')}:</strong> {formatCurrency(selectedOrder.totalAmount)}</p>
                    <p><strong>{t('downPayment')}:</strong> {formatCurrency(selectedOrder.downPayment)}</p>
                    <p><strong>{t('remainingBalance')}:</strong> {formatCurrency(selectedOrder.remainingBalance)}</p>
                    <p><strong>{t('shippingCost')}:</strong> {formatCurrency(selectedOrder.shippingCost)}</p>
                  </div>
                </div>
              </div>
              {selectedOrder.notes && (
                <div>
                  <h3 className="font-semibold mb-2">{t('notes')}</h3>
                  <p className="text-sm text-muted-foreground">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
