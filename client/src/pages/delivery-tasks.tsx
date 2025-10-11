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
        description: "Task updated successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: t('error'),
        description: "Failed to update task",
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
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-50 text-green-700"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>;
      case "to_collect":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700"><DollarSign className="w-3 h-3 mr-1" /> To Collect</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingTasks = tasks.filter(t => t.status === "pending");
  const completedTasks = tasks.filter(t => t.status === "completed");
  const toCollectTasks = tasks.filter(t => t.status === "to_collect");

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('deliveryTasks')}</h1>
          <p className="mt-2 text-gray-600">Manage your delivery tasks and track your progress</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingTasks.length}</div>
              <p className="text-xs text-muted-foreground">Tasks awaiting delivery</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">To Collect</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{toCollectTasks.length}</div>
              <p className="text-xs text-muted-foreground">Payments to collect</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedTasks.length}</div>
              <p className="text-xs text-muted-foreground">Tasks finished</p>
            </CardContent>
          </Card>
        </div>

        {/* Tasks Table */}
        <Card>
          <CardHeader>
            <CardTitle>My Delivery Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading tasks...</div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No tasks assigned yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Pickup Location</TableHead>
                      <TableHead>Delivery Location</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => (
                      <TableRow key={task.id} data-testid={`task-row-${task.id}`}>
                        <TableCell className="font-medium">
                          {task.order.orderNumber}
                        </TableCell>
                        <TableCell>
                          {task.order.customer.firstName} {task.order.customer.lastName}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            {task.pickupLocation}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            {task.deliveryLocation}
                          </div>
                        </TableCell>
                        <TableCell>
                          {task.paymentType === "collect" ? (
                            <span className="text-sm">
                              ${parseFloat(task.paymentAmount || "0").toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">None</span>
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
                                  Complete
                                </Button>
                                {task.paymentType === "collect" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleMarkToCollect(task)}
                                    data-testid={`button-to-collect-${task.id}`}
                                  >
                                    <DollarSign className="w-4 h-4 mr-1" />
                                    To Collect
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
                                Complete
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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
              <DialogTitle>Mark for Payment Collection</DialogTitle>
            </DialogHeader>
            {selectedTask && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customer-code">Customer Code</Label>
                  <Input
                    id="customer-code"
                    value={customerCode}
                    onChange={(e) => setCustomerCode(e.target.value)}
                    placeholder="Enter customer code"
                    data-testid="input-customer-code"
                  />
                </div>
                <div>
                  <Label htmlFor="payment-amount">Payment Amount ($)</Label>
                  <Input
                    id="payment-amount"
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Enter amount"
                    data-testid="input-payment-amount"
                  />
                </div>
                <div>
                  <Label htmlFor="task-notes">Notes</Label>
                  <textarea
                    id="task-notes"
                    value={taskNotes}
                    onChange={(e) => setTaskNotes(e.target.value)}
                    className="w-full min-h-[100px] p-3 border rounded-md resize-none"
                    placeholder="Add any notes..."
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
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitToCollect}
                    disabled={updateTaskMutation.isPending}
                    data-testid="button-submit"
                  >
                    {updateTaskMutation.isPending ? "Updating..." : "Mark To Collect"}
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
