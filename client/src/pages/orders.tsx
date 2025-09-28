import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Package, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Header } from "@/components/header";
import { apiRequest } from "@/lib/queryClient";
import type { OrderWithCustomer } from "@shared/schema";

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/orders");
      return response.json() as Promise<OrderWithCustomer[]>;
    },
  });

  const filteredOrders = orders.filter(order =>
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${order.customer.firstName} ${order.customer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "pending":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header 
        title="Orders" 
        description="Manage and track all customer orders" 
      />
      
      <div className="flex-1 p-6 space-y-6">
        {/* Actions and Search */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
                data-testid="input-search-orders"
              />
            </div>
            <Button variant="outline" data-testid="button-filter-orders">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
          <Button data-testid="button-new-order">
            <Plus className="w-4 h-4 mr-2" />
            New Order
          </Button>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Orders ({filteredOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No orders found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "No orders match your search criteria" : "Get started by creating your first order"}
                </p>
                {!searchTerm && (
                  <Button className="mt-4" data-testid="button-create-first-order">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Order
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Profit</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                      <TableCell className="font-medium" data-testid={`text-order-number-${order.id}`}>
                        {order.orderNumber}
                      </TableCell>
                      <TableCell data-testid={`text-customer-${order.id}`}>
                        {order.customer.firstName} {order.customer.lastName}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)} data-testid={`badge-status-${order.id}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`text-total-${order.id}`}>
                        ${parseFloat(order.totalAmount).toFixed(2)}
                      </TableCell>
                      <TableCell data-testid={`text-profit-${order.id}`}>
                        ${parseFloat(order.profit).toFixed(2)}
                      </TableCell>
                      <TableCell data-testid={`text-date-${order.id}`}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" data-testid={`button-view-order-${order.id}`}>
                          View
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
    </div>
  );
}
