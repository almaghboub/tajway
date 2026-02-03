import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { History, User, CheckCircle, Clock, DollarSign, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header } from "@/components/header";
import { apiRequest } from "@/lib/queryClient";
import type { DeliveryTaskWithDetails } from "@shared/schema";
import { format } from "date-fns";

interface ShippingStaff {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
}

export default function TaskHistory() {
  const { t } = useTranslation();
  const [selectedStaffId, setSelectedStaffId] = useState<string>("all");

  const { data: allTasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ["/api/delivery-tasks"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/delivery-tasks");
      return response.json() as Promise<DeliveryTaskWithDetails[]>;
    },
  });

  const { data: shippingStaff = [] } = useQuery({
    queryKey: ["/api/shipping-staff"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/shipping-staff");
      return response.json() as Promise<ShippingStaff[]>;
    },
  });

  const filteredTasks = selectedStaffId === "all" 
    ? allTasks 
    : allTasks.filter(task => task.assignedToUserId === selectedStaffId);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700"><Clock className="w-3 h-3 mr-1" /> {t('statusPending')}</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-50 text-green-700"><CheckCircle className="w-3 h-3 mr-1" /> {t('statusCompleted')}</Badge>;
      case "to_collect":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700"><DollarSign className="w-3 h-3 mr-1" /> {t('statusToCollect')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const calculateStats = (tasks: DeliveryTaskWithDetails[]) => {
    const completed = tasks.filter(t => t.status === "completed").length;
    const pending = tasks.filter(t => t.status === "pending").length;
    const toCollect = tasks.filter(t => t.status === "to_collect").length;
    const totalPayments = tasks
      .filter(t => t.paymentType === "collect" && t.paymentAmount)
      .reduce((sum, t) => sum + parseFloat(t.paymentAmount || "0"), 0);

    return { completed, pending, toCollect, totalPayments };
  };

  const stats = calculateStats(filteredTasks);
  const selectedStaff = shippingStaff.find(s => s.id === selectedStaffId);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={t('taskHistoryTracking')} description={t('viewTaskHistoryPerformance')} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Staff Filter */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('filterByStaffMember')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
              <SelectTrigger className="w-full md:w-64" data-testid="select-staff-filter">
                <SelectValue placeholder={t('selectStaffMember')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allStaffMembers')}</SelectItem>
                {shippingStaff.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.firstName} {staff.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('totalTasks')}</CardTitle>
              <Package className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredTasks.length}</div>
              <p className="text-xs text-muted-foreground">
                {selectedStaffId === "all" ? t('allTasks') : `${t('tasksFor')} ${selectedStaff?.firstName}`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('statusCompleted')}</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
              <p className="text-xs text-muted-foreground">{t('successfullyDelivered')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('pending')}</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">{t('awaitingDelivery')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('totalCollections')}</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalPayments.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{t('paymentCollections')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Task History Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              <History className="w-5 h-5 inline-block mr-2" />
              {t('taskHistory')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingTasks ? (
              <div className="text-center py-8">{t('loadingTaskHistory')}</div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{t('noTasksFound')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('date')}</TableHead>
                      <TableHead>{t('taskType')}</TableHead>
                      <TableHead>{t('customerCode')}</TableHead>
                      <TableHead>{t('customer')}</TableHead>
                      <TableHead>{t('assignedTo')}</TableHead>
                      <TableHead>{t('assignedBy')}</TableHead>
                      <TableHead>{t('location')}</TableHead>
                      <TableHead>{t('details')}</TableHead>
                      <TableHead>{t('status')}</TableHead>
                      <TableHead>{t('completedAt')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.map((task) => {
                      const taskTypeLabel = task.taskType === "task" ? t('taskTypeTask') :
                        task.taskType === "receive_payment" ? t('taskTypeReceivePayment') :
                        t('taskTypeReceiveShipments');
                      
                      return (
                        <TableRow key={task.id} data-testid={`task-history-row-${task.id}`}>
                          <TableCell className="text-sm">
                            {format(new Date(task.createdAt), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{taskTypeLabel}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {task.order ? (task.order.customer.shippingCode || task.order.orderNumber) : '-'}
                          </TableCell>
                          <TableCell>
                            {task.order ? `${task.order.customer.firstName} ${task.order.customer.lastName}` : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3 text-gray-400" />
                              {task.assignedTo.firstName} {task.assignedTo.lastName}
                            </div>
                          </TableCell>
                          <TableCell>
                            {task.assignedBy.firstName} {task.assignedBy.lastName}
                          </TableCell>
                          <TableCell className="text-sm">
                            {task.taskType === "task" ? (
                              <div className="space-y-1">
                                <div className="text-xs text-gray-500">{t('pickup')}: {task.pickupLocation}</div>
                                <div className="text-xs text-gray-500">{t('delivery')}: {task.deliveryLocation}</div>
                              </div>
                            ) : (
                              task.address || '-'
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {task.taskType === "task" ? (
                              task.paymentType === "collect" ? (
                                <span className="font-medium">
                                  ${parseFloat(task.paymentAmount || "0").toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-gray-400">{t('naLabel')}</span>
                              )
                            ) : (
                              <div className="space-y-1">
                                {task.value && <div>${parseFloat(task.value).toFixed(2)}</div>}
                                {task.weight && <div>{parseFloat(task.weight).toFixed(2)} kg</div>}
                                {!task.value && !task.weight && '-'}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(task.status)}</TableCell>
                          <TableCell className="text-sm">
                            {task.completedAt 
                              ? format(new Date(task.completedAt), "MMM dd, HH:mm")
                              : "-"
                            }
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Staff Performance Summary (when filtering by specific staff) */}
        {selectedStaffId !== "all" && selectedStaff && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>{t('performanceSummary')} {selectedStaff.firstName} {selectedStaff.lastName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                  <div className="text-sm text-gray-600">{t('completedTasks')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                  <div className="text-sm text-gray-600">{t('pendingTasks')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.toCollect}</div>
                  <div className="text-sm text-gray-600">{t('paymentCollections')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {filteredTasks.length > 0 
                      ? `${Math.round((stats.completed / filteredTasks.length) * 100)}%`
                      : "0%"
                    }
                  </div>
                  <div className="text-sm text-gray-600">{t('completionRate')}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
