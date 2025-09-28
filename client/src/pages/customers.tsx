import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Users, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Header } from "@/components/header";
import { apiRequest } from "@/lib/queryClient";
import type { Customer } from "@shared/schema";

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/customers");
      return response.json() as Promise<Customer[]>;
    },
  });

  const filteredCustomers = customers.filter(customer =>
    `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col">
      <Header 
        title="Customers" 
        description="Manage customer information and relationships" 
      />
      
      <div className="flex-1 p-6 space-y-6">
        {/* Actions and Search */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
                data-testid="input-search-customers"
              />
            </div>
            <Button variant="outline" data-testid="button-filter-customers">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
          <Button data-testid="button-new-customer">
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Customers ({filteredCustomers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading customers...</p>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No customers found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "No customers match your search criteria" : "Get started by adding your first customer"}
                </p>
                {!searchTerm && (
                  <Button className="mt-4" data-testid="button-add-first-customer">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Customer
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                      <TableCell className="font-medium" data-testid={`text-name-${customer.id}`}>
                        {customer.firstName} {customer.lastName}
                      </TableCell>
                      <TableCell data-testid={`text-email-${customer.id}`}>
                        {customer.email}
                      </TableCell>
                      <TableCell data-testid={`text-phone-${customer.id}`}>
                        {customer.phone || "—"}
                      </TableCell>
                      <TableCell data-testid={`text-country-${customer.id}`}>
                        {customer.country}
                      </TableCell>
                      <TableCell data-testid={`text-created-${customer.id}`}>
                        {new Date(customer.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" data-testid={`button-view-customer-${customer.id}`}>
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
