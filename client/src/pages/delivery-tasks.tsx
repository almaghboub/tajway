import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Package, CheckCircle, Clock, DollarSign, MapPin, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Header } from "@/components/header";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/components/auth-provider";
import type { DeliveryTaskWithDetails } from "@shared/schema";

export default function DeliveryTasks() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<DeliveryTaskWithDetails | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [customerCode, setCustomerCode] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [taskNotes, setTaskNotes] = useState("");

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["/api/delivery-tasks"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/delivery-tasks");
      return response.json() as Promise<DeliveryTaskWithDetails[]>;
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/delivery-tasks/${id}`, data);
      if (!response.ok) {
        throw new Error("Failed to update task");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-tasks"] });
      setIsUpdateModalOpen(false);
      setSelectedTask(null);
      setCustomerCode("");
      setPaymentAmount("");
      setTaskNotes("");
      toast({
        title: t('success'),
        description: t('taskUpdatedSuccess'),
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: t('error'),
        description: t('failedUpdateTask'),
      });
    },
  });

  const handleMarkComplete = (task: DeliveryTaskWithDetails) => {
    updateTaskMutation.mutate({
      id: task.id,
      data: {
        status: "completed",
        completedAt: new Date().toISOString(),
      },
    });
  };

  const handleMarkToCollect = (task: DeliveryTaskWithDetails) => {
    setSelectedTask(task);
    setCustomerCode(task.customerCode || "");
    setPaymentAmount(task.paymentAmount || "");
    setTaskNotes(task.notes || "");
    setIsUpdateModalOpen(true);
  };

  const handleSubmitToCollect = () => {
    if (!selectedTask) return;
    
    updateTaskMutation.mutate({
      id: selectedTask.id,
      data: {
        status: "to_collect",
        customerCode: customerCode || undefined,
        paymentAmount: paymentAmount ? parseFloat(paymentAmount) : undefined,
        notes: taskNotes || undefined,
      },
    });
  };

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

  const pendingTasks = tasks.filter(t => t.status === "pending");
  const completedTasks = tasks.filter(t => t.status === "completed");
  const toCollectTasks = tasks.filter(t => t.status === "to_collect");

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={t('deliveryTasks')} description={t('deliveryTasksDescription')} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('pendingTasks')}</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingTasks.length}</div>
              <p className="text-xs text-muted-foreground">{t('tasksAwaitingDelivery')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('toCollect')}</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{toCollectTasks.length}</div>
              <p className="text-xs text-muted-foreground">{t('paymentsToCollect')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('completed')}</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedTasks.length}</div>
              <p className="text-xs text-muted-foreground">{t('tasksFinished')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tasks Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t('myDeliveryTasks')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">{t('loadingTasks')}</div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{t('noTasksAssigned')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('taskType')}</TableHead>
                      <TableHead>{t('customerCode')}</TableHead>
                      <TableHead>{t('customer')}</TableHead>
                      <TableHead>{t('location')}</TableHead>
                      <TableHead>{t('details')}</TableHead>
                      <TableHead>{t('status')}</TableHead>
                      <TableHead>{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => {
                      const taskTypeLabel = task.taskType === "task" ? t('taskTypeTask') :
                        task.taskType === "receive_payment" ? t('taskTypeReceivePayment') :
                        t('taskTypeReceiveShipments');
                      
                      return (
                        <TableRow key={task.id} data-testid={`task-row-${task.id}`}>
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
                            {task.taskType === "task" ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 text-sm">
                                  <MapPin className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs text-gray-500">{t('pickupLocation')}:</span> {task.pickupLocation}
                                </div>
                                <div className="flex items-center gap-1 text-sm">
                                  <MapPin className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs text-gray-500">{t('deliveryLocation')}:</span> {task.deliveryLocation}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-gray-400" />
                                {task.address || '-'}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {task.taskType === "task" ? (
                              task.paymentType === "collect" ? (
                                <span className="text-sm">
                                  ${parseFloat(task.paymentAmount || "0").toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">{t('none')}</span>
                              )
                            ) : (
                              <div className="space-y-1 text-sm">
                                {task.value && <div>{t('taskValue')}: ${parseFloat(task.value).toFixed(2)}</div>}
                                {task.weight && <div>{t('taskWeight')}: {parseFloat(task.weight).toFixed(2)} kg</div>}
                                {!task.value && !task.weight && '-'}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(task.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {task.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleMarkComplete(task)}
                                    data-testid={`button-complete-${task.id}`}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    {t('complete')}
                                  </Button>
                                  {task.taskType === "task" && task.paymentType === "collect" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleMarkToCollect(task)}
                                      data-testid={`button-to-collect-${task.id}`}
                                    >
                                      <DollarSign className="w-4 h-4 mr-1" />
                                      {t('toCollect')}
                                    </Button>
                                  )}
                                </>
                              )}
                              {task.status === "to_collect" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleMarkComplete(task)}
                                  data-testid={`button-complete-${task.id}`}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  {t('complete')}
                                </Button>
                              )}
                            </div>
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

        {/* Update Task Modal */}
        <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
          <DialogContent className="max-w-md" data-testid="modal-update-task">
            <DialogHeader>
              <DialogTitle>{t('markForPaymentCollection')}</DialogTitle>
            </DialogHeader>
            {selectedTask && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customer-code">{t('customerCode')}</Label>
                  <Input
                    id="customer-code"
                    value={customerCode}
                    onChange={(e) => setCustomerCode(e.target.value)}
                    placeholder={t('enterCustomerCode')}
                    data-testid="input-customer-code"
                  />
                </div>
                <div>
                  <Label htmlFor="payment-amount">{t('paymentAmountDollar')}</Label>
                  <Input
                    id="payment-amount"
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder={t('enterAmount')}
                    data-testid="input-payment-amount"
                  />
                </div>
                <div>
                  <Label htmlFor="task-notes">{t('notes')}</Label>
                  <textarea
                    id="task-notes"
                    value={taskNotes}
                    onChange={(e) => setTaskNotes(e.target.value)}
                    className="w-full min-h-[100px] p-3 border rounded-md resize-none"
                    placeholder={t('addAnyNotes')}
                    data-testid="textarea-task-notes"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsUpdateModalOpen(false)}
                    data-testid="button-cancel"
                  >
                    {t('cancel')}
                  </Button>
                  <Button
                    onClick={handleSubmitToCollect}
                    disabled={updateTaskMutation.isPending}
                    data-testid="button-submit"
                  >
                    {updateTaskMutation.isPending ? t('updating') : t('markToCollect')}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
