import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Package, DollarSign, TrendingUp, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function DarbAssabil() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const { data: orders = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/orders"],
  });

  const { data: settings = [] } = useQuery<Array<{ id: string; key: string; value: string }>>({
    queryKey: ["/api/settings"],
  });

  const globalLydExchangeRate = parseFloat(settings.find(s => s.key === 'lyd_exchange_rate')?.value || '0');

  // Filter orders: delivered, not Tripoli, not yet sent to Darb Assabil
  const readyOrders = orders.filter(order => 
    order.status === 'delivered' && 
    order.shippingCity && 
    order.shippingCity.toLowerCase() !== 'tripoli' &&
    !order.darbAssabilReference
  );

  // Calculate total money to collect
  const totalToCollect = readyOrders.reduce((sum, order) => 
    sum + parseFloat(order.remainingBalance || "0"), 0
  );

  const sendToDarbAssabilMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest("POST", `/api/orders/${orderId}/send-to-darb-assabil`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send order to Darb Assabil');
      }
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: t('success'),
        description: `Order sent to Darb Assabil. Reference: ${data.reference || 'N/A'}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: t('error'),
        description: error.message || 'Failed to send order to Darb Assabil',
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">{t('darbAssabilDashboard') || 'Darb Assabil Dashboard'}</h1>
        <p className="text-muted-foreground mt-2">
          {t('darbAssabilDescription') || 'Orders ready for shipping outside Tripoli'}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('ordersReady') || 'Orders Ready'}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-ready-orders">
              {readyOrders.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('readyForShipping') || 'Ready for shipping'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalToCollect') || 'Total to Collect'}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {globalLydExchangeRate > 0 ? (
              <div>
                <div className="text-2xl font-bold text-green-600" data-testid="text-total-collect">
                  {(totalToCollect * globalLydExchangeRate).toFixed(2)} LYD
                </div>
                <p className="text-xs text-muted-foreground">
                  ${totalToCollect.toFixed(2)}
                </p>
              </div>
            ) : (
              <div className="text-2xl font-bold" data-testid="text-total-collect">
                ${totalToCollect.toFixed(2)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('averageOrder') || 'Average Order'}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {globalLydExchangeRate > 0 ? (
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {readyOrders.length > 0 
                    ? ((totalToCollect / readyOrders.length) * globalLydExchangeRate).toFixed(2)
                    : '0.00'} LYD
                </div>
                <p className="text-xs text-muted-foreground">
                  ${readyOrders.length > 0 ? (totalToCollect / readyOrders.length).toFixed(2) : '0.00'}
                </p>
              </div>
            ) : (
              <div className="text-2xl font-bold">
                ${readyOrders.length > 0 ? (totalToCollect / readyOrders.length).toFixed(2) : '0.00'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('readyOrders') || 'Ready Orders'}</CardTitle>
          <CardDescription>
            {t('ordersReadyForDarbAssabil') || 'Orders delivered and ready to be sent to Darb Assabil'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">{t('loading')}</div>
          ) : readyOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="font-medium">{t('noReadyOrders') || 'No orders ready for shipping'}</p>
              <p className="text-sm mt-2">
                {t('noReadyOrdersDesc') || 'Orders with status "delivered" and city outside Tripoli will appear here'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('orderNumber')}</TableHead>
                  <TableHead>{t('customer')}</TableHead>
                  <TableHead>{t('city')}</TableHead>
                  <TableHead>{t('shippingCodeLabel')}</TableHead>
                  <TableHead className="text-right">{t('totalAmount')}</TableHead>
                  <TableHead className="text-right">{t('toCollect')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {readyOrders.map((order) => (
                  <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                    <TableCell className="font-medium" data-testid={`text-order-number-${order.id}`}>
                      {order.orderNumber}
                    </TableCell>
                    <TableCell data-testid={`text-customer-${order.id}`}>
                      {order.customer.firstName} {order.customer.lastName}
                    </TableCell>
                    <TableCell data-testid={`text-city-${order.id}`}>
                      <Badge variant="outline">{order.shippingCity}</Badge>
                    </TableCell>
                    <TableCell data-testid={`text-shipping-code-${order.id}`}>
                      <span className="font-semibold text-primary">
                        {order.customer.shippingCode || order.orderNumber}
                      </span>
                    </TableCell>
                    <TableCell className="text-right" data-testid={`text-total-${order.id}`}>
                      {globalLydExchangeRate > 0 ? (
                        <div>
                          <div className="font-bold text-blue-600">
                            {(parseFloat(order.totalAmount) * globalLydExchangeRate).toFixed(2)} LYD
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ${parseFloat(order.totalAmount).toFixed(2)}
                          </div>
                        </div>
                      ) : (
                        `$${parseFloat(order.totalAmount).toFixed(2)}`
                      )}
                    </TableCell>
                    <TableCell className="text-right" data-testid={`text-collect-${order.id}`}>
                      {globalLydExchangeRate > 0 ? (
                        <div>
                          <div className="font-bold text-green-600">
                            {(parseFloat(order.remainingBalance) * globalLydExchangeRate).toFixed(2)} LYD
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ${parseFloat(order.remainingBalance).toFixed(2)}
                          </div>
                        </div>
                      ) : (
                        <span className="font-semibold text-green-600">
                          ${parseFloat(order.remainingBalance).toFixed(2)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => sendToDarbAssabilMutation.mutate(order.id)}
                        disabled={sendToDarbAssabilMutation.isPending}
                        data-testid={`button-ship-${order.id}`}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Truck className="w-4 h-4 mr-2" />
                        {sendToDarbAssabilMutation.isPending ? t('sending') : t('ship')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
