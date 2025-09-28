import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Users2, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Header } from "@/components/header";
import { apiRequest } from "@/lib/queryClient";

interface SafeUser {
  id: string;
  username: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

export default function Users() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/users");
      return response.json() as Promise<SafeUser[]>;
    },
  });

  const filteredUsers = users.filter(user =>
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-purple-100 text-purple-800";
      case "customer_service":
        return "bg-blue-100 text-blue-800";
      case "receptionist":
        return "bg-green-100 text-green-800";
      case "sorter":
        return "bg-yellow-100 text-yellow-800";
      case "stock_manager":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatRole = (role: string) => {
    return role.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header 
        title="User Management" 
        description="Manage system users and their permissions" 
      />
      
      <div className="flex-1 p-6 space-y-6">
        {/* Actions and Search */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
                data-testid="input-search-users"
              />
            </div>
            <Button variant="outline" data-testid="button-filter-users">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
          <Button data-testid="button-new-user">
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users2 className="w-5 h-5 mr-2" />
              Users ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No users found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "No users match your search criteria" : "Get started by adding your first user"}
                </p>
                {!searchTerm && (
                  <Button className="mt-4" data-testid="button-add-first-user">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First User
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                      <TableCell className="font-medium" data-testid={`text-name-${user.id}`}>
                        {user.firstName} {user.lastName}
                      </TableCell>
                      <TableCell data-testid={`text-username-${user.id}`}>
                        {user.username}
                      </TableCell>
                      <TableCell data-testid={`text-email-${user.id}`}>
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(user.role)} data-testid={`badge-role-${user.id}`}>
                          {formatRole(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                          data-testid={`badge-status-${user.id}`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`text-created-${user.id}`}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" data-testid={`button-edit-user-${user.id}`}>
                          Edit
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
