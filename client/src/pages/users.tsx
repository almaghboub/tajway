import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Users2, Search, Filter, X, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/header";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

interface SafeUser {
  id: string;
  username: string;
  role: "owner" | "customer_service" | "receptionist" | "sorter" | "stock_manager" | "shipping_staff";
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

// Form schema with password confirmation - validation messages will use translations
const getCreateUserSchema = (t: (key: string) => string) => insertUserSchema.extend({
  confirmPassword: z.string().min(6, t('passwordMinSixChars')),
}).refine((data) => data.password === data.confirmPassword, {
  message: t('passwordsDontMatch'),
  path: ["confirmPassword"],
});

type CreateUserForm = z.infer<ReturnType<typeof getCreateUserSchema>>;

export default function Users() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SafeUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<SafeUser | null>(null);
  const [roleFilters, setRoleFilters] = useState<string[]>(["owner", "customer_service", "receptionist", "sorter", "stock_manager", "shipping_staff"]);
  const { toast } = useToast();
  
  const createUserSchema = getCreateUserSchema(t);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/users");
      return response.json() as Promise<SafeUser[]>;
    },
  });

  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      email: "",
      role: "customer_service",
      isActive: true,
    },
  });

  // Edit form schema - password is optional for updates
  const editUserSchema = insertUserSchema.partial({ password: true }).extend({
    confirmPassword: z.string().optional(),
  }).refine((data) => {
    if (data.password && data.confirmPassword) {
      return data.password === data.confirmPassword;
    }
    return true;
  }, {
    message: t('passwordsDontMatch'),
    path: ["confirmPassword"],
  });

  const editForm = useForm<z.infer<typeof editUserSchema>>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      username: "",
      firstName: "",
      lastName: "",
      email: "",
      role: "customer_service",
      isActive: true,
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      const response = await apiRequest("POST", "/api/users", userData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || t('failedCreateUser'));
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsCreateModalOpen(false);
      form.reset();
      toast({
        title: t('userCreatedSuccess'),
        description: t('userCreatedDescription'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('errorCreatingUser'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, userData }: { id: string; userData: Partial<InsertUser> }) => {
      const response = await apiRequest("PUT", `/api/users/${id}`, userData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || t('failedUpdateUser'));
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsEditModalOpen(false);
      setEditingUser(null);
      editForm.reset();
      toast({
        title: t('userUpdatedSuccess'),
        description: t('userUpdatedDescription'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('errorUpdatingUser'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/users/${id}`);
      if (!response.ok) {
        throw new Error(t('failedDeleteUser'));
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: t('userDeletedSuccess'),
        description: t('userDeletedDescription'),
      });
      setIsDeleteDialogOpen(false);
      setDeletingUser(null);
    },
    onError: () => {
      toast({
        title: t('errorDeletingUser'),
        description: t('failedDeleteUser'),
        variant: "destructive",
      });
    },
  });

  const handleCreateUser = (data: CreateUserForm) => {
    const { confirmPassword, ...userData } = data;
    createUserMutation.mutate(userData);
  };

  const handleEditUser = (data: z.infer<typeof editUserSchema>) => {
    if (!editingUser) return;
    const { confirmPassword, ...userData } = data;
    // Remove undefined/null password if not provided
    if (!userData.password) {
      delete userData.password;
    }
    updateUserMutation.mutate({ id: editingUser.id, userData });
  };

  const openCreateModal = () => {
    form.reset();
    setIsCreateModalOpen(true);
  };

  const openEditModal = (user: SafeUser) => {
    setEditingUser(user);
    editForm.reset({
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      password: "",
      confirmPassword: "",
    });
    setIsEditModalOpen(true);
  };

  const openDeleteDialog = (user: SafeUser) => {
    setDeletingUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (!deletingUser) return;
    deleteUserMutation.mutate(deletingUser.id);
  };

  const toggleRoleFilter = (role: string) => {
    setRoleFilters(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilters.includes(user.role);
    return matchesSearch && matchesRole;
  });

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
      case "shipping_staff":
        return "bg-teal-100 text-teal-800";
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
        title={t('userManagement')} 
        description={t('usersDescription')} 
      />
      
      <div className="flex-1 p-6 space-y-6">
        {/* Actions and Search */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('searchUsers')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
                data-testid="input-search-users"
              />
            </div>
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" data-testid="button-filter-users">
                  <Filter className="w-4 h-4 mr-2" />
                  {t('filter')}
                  {roleFilters.length < 3 && (
                    <Badge variant="secondary" className="ml-2">
                      {roleFilters.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" data-testid="popover-filter-users">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-3">{t('filterByRole')}</h4>
                    <div className="space-y-2">
                      {[
                        { value: "owner", label: t('owner') },
                        { value: "customer_service", label: t('customerService') },
                        { value: "receptionist", label: t('receptionist') },
                        { value: "sorter", label: t('sorter') },
                        { value: "stock_manager", label: t('stockManager') },
                        { value: "shipping_staff", label: t('shippingStaff') }
                      ].map((role) => (
                        <div key={role.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`filter-${role.value}`}
                            checked={roleFilters.includes(role.value)}
                            onCheckedChange={() => toggleRoleFilter(role.value)}
                            data-testid={`checkbox-filter-${role.value}`}
                          />
                          <Label
                            htmlFor={`filter-${role.value}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {role.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRoleFilters(["owner", "customer_service", "receptionist"])}
                      data-testid="button-reset-filters"
                    >
                      {t('reset')}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setIsFilterOpen(false)}
                      data-testid="button-apply-filters"
                    >
                      {t('apply')}
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <Button onClick={openCreateModal} data-testid="button-new-user">
            <Plus className="w-4 h-4 mr-2" />
            {t('addUser')}
          </Button>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users2 className="w-5 h-5 mr-2" />
              {t('usersCount')} ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">{t('loadingUsers')}</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">{t('noUsersFound')}</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? t('noUsersMatch') : t('getStartedFirstUser')}
                </p>
                {!searchTerm && (
                  <Button className="mt-4" onClick={openCreateModal} data-testid="button-add-first-user">
                    <Plus className="w-4 h-4 mr-2" />
                    {t('addFirstUser')}
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('name')}</TableHead>
                    <TableHead>{t('username')}</TableHead>
                    <TableHead>{t('email')}</TableHead>
                    <TableHead>{t('role')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead>{t('created')}</TableHead>
                    <TableHead>{t('actions')}</TableHead>
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
                          {user.isActive ? t('active') : t('inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`text-created-${user.id}`}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openEditModal(user)}
                            data-testid={`button-edit-user-${user.id}`}
                          >
                            {t('edit')}
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => openDeleteDialog(user)}
                            data-testid={`button-delete-user-${user.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create User Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="sm:max-w-md" data-testid="modal-create-user">
            <DialogHeader>
              <DialogTitle>{t('createNewUser')}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateUser)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('firstName')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('firstNamePlaceholder')} {...field} data-testid="input-first-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('lastName')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('lastNamePlaceholder')} {...field} data-testid="input-last-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('username')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('usernamePlaceholder')} {...field} data-testid="input-username" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('email')}</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder={t('emailPlaceholder')} {...field} data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('role')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-role">
                            <SelectValue placeholder={t('selectRole')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="owner">{t('owner')}</SelectItem>
                          <SelectItem value="customer_service">{t('customerService')}</SelectItem>
                          <SelectItem value="receptionist">{t('receptionist')}</SelectItem>
                          <SelectItem value="sorter">{t('sorter')}</SelectItem>
                          <SelectItem value="stock_manager">{t('stockManager')}</SelectItem>
                          <SelectItem value="shipping_staff">{t('shippingStaff')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('password')}</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder={t('passwordPlaceholder')} {...field} data-testid="input-password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('confirmPassword')}</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder={t('passwordPlaceholder')} {...field} data-testid="input-confirm-password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                    data-testid="button-cancel-user"
                  >
                    {t('cancel')}
                  </Button>
                  <Button
                    type="submit"
                    disabled={createUserMutation.isPending}
                    data-testid="button-create-user"
                  >
                    {createUserMutation.isPending ? t('creatingUser') : t('createUser')}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit User Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-md" data-testid="modal-edit-user">
            <DialogHeader>
              <DialogTitle>{t('editUser')}</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEditUser)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('firstName')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('firstNamePlaceholder')} {...field} data-testid="input-edit-first-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('lastName')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('lastNamePlaceholder')} {...field} data-testid="input-edit-last-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={editForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('username')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('usernamePlaceholder')} {...field} data-testid="input-edit-username" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('email')}</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder={t('emailPlaceholder')} {...field} data-testid="input-edit-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('role')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-role">
                            <SelectValue placeholder={t('selectRole')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="owner">{t('owner')}</SelectItem>
                          <SelectItem value="customer_service">{t('customerService')}</SelectItem>
                          <SelectItem value="receptionist">{t('receptionist')}</SelectItem>
                          <SelectItem value="sorter">{t('sorter')}</SelectItem>
                          <SelectItem value="stock_manager">{t('stockManager')}</SelectItem>
                          <SelectItem value="shipping_staff">{t('shippingStaff')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('newPasswordOptional')}</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder={t('passwordPlaceholder')} {...field} data-testid="input-edit-password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('confirmPassword')}</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder={t('passwordPlaceholder')} {...field} data-testid="input-edit-confirm-password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditModalOpen(false)}
                    data-testid="button-cancel-edit-user"
                  >
                    {t('cancel')}
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateUserMutation.isPending}
                    data-testid="button-update-user"
                  >
                    {updateUserMutation.isPending ? t('updatingUser') : t('updateUser')}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent data-testid="dialog-delete-user">
            <AlertDialogHeader>
              <AlertDialogTitle>{t('deleteUser')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('deleteUserConfirmation')}
                {deletingUser && (
                  <div className="mt-2 p-2 bg-muted rounded text-sm">
                    <strong>{deletingUser.firstName} {deletingUser.lastName}</strong> ({deletingUser.username}) - {deletingUser.email}
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">{t('cancel')}</AlertDialogCancel>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete();
                  setIsDeleteDialogOpen(false);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-delete"
              >
                {t('delete')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
