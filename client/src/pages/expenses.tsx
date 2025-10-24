import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Expense } from "@shared/schema";

export default function Expenses() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const { data: settings = [] } = useQuery<Array<{ id: string; key: string; value: string }>>({
    queryKey: ["/api/settings"],
  });

  const lydExchangeRate = parseFloat(settings.find(s => s.key === 'lyd_exchange_rate')?.value || '0');

  const createExpenseMutation = useMutation({
    mutationFn: async (data: { category: string; amount: string; description?: string; date: string }) => {
      return await apiRequest("POST", "/api/expenses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({
        title: t('success'),
        description: t('expenseAddedSuccess'),
      });
      setIsAddModalOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('failedAddExpense'),
        variant: "destructive",
      });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({
        title: t('success'),
        description: t('expenseDeletedSuccess'),
      });
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('failedDeleteExpense'),
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedCategory("");
    setAmount("");
    setDescription("");
    setExpenseDate(new Date().toISOString().split('T')[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCategory || !amount) {
      toast({
        title: t('validationError'),
        description: t('selectCategoryAndAmount'),
        variant: "destructive",
      });
      return;
    }

    createExpenseMutation.mutate({
      category: selectedCategory,
      amount: amount,
      description: description || undefined,
      date: expenseDate,
    });
  };

  const getCategoryLabel = (category: string) => {
    const categoryMap: Record<string, string> = {
      employee_salaries: t('employeeSalaries'),
      supplier_expenses: t('supplierExpenses'),
      marketing_commission: t('marketingCommission'),
      rent: t('rent'),
      cleaning_salaries: t('cleaningSalaries'),
      other: t('otherExpenses'),
    };
    return categoryMap[category] || category;
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

  const expensesByCategory = expenses.reduce((acc, expense) => {
    const category = expense.category;
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += parseFloat(expense.amount);
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('expenses')}</h1>
          <p className="text-muted-foreground">{t('expensesDescription')}</p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-expense">
              <Plus className="mr-2 h-4 w-4" />
              {t('addExpense')}
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="modal-add-expense">
            <DialogHeader>
              <DialogTitle>{t('addNewExpense')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="expense-category">{t('expenseCategory')}</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger id="expense-category" data-testid="select-category">
                    <SelectValue placeholder={t('selectCategory')} />
                  </SelectTrigger>
                  <SelectContent className="z-[9999]" position="popper" sideOffset={5}>
                    <SelectItem value="employee_salaries">{t('employeeSalaries')}</SelectItem>
                    <SelectItem value="supplier_expenses">{t('supplierExpenses')}</SelectItem>
                    <SelectItem value="marketing_commission">{t('marketingCommission')}</SelectItem>
                    <SelectItem value="rent">{t('rent')}</SelectItem>
                    <SelectItem value="cleaning_salaries">{t('cleaningSalaries')}</SelectItem>
                    <SelectItem value="other">{t('otherExpenses')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="expense-amount">{t('amountDollar')}</Label>
                <Input
                  id="expense-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={t('enterAmount')}
                  data-testid="input-amount"
                  required
                />
              </div>

              <div>
                <Label htmlFor="expense-date">{t('date')}</Label>
                <Input
                  id="expense-date"
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  data-testid="input-date"
                  required
                />
              </div>

              <div>
                <Label htmlFor="expense-description">{t('descriptionOptional')}</Label>
                <textarea
                  id="expense-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full min-h-[100px] p-3 border rounded-md resize-none"
                  placeholder={t('addDescription')}
                  data-testid="textarea-description"
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                  data-testid="button-cancel"
                >
                  {t('cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={createExpenseMutation.isPending}
                  data-testid="button-submit"
                >
                  {createExpenseMutation.isPending ? t('adding') : t('addExpense')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalExpenses')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {lydExchangeRate > 0 ? (
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600" data-testid="text-total-expenses">
                  {(totalExpenses * lydExchangeRate).toFixed(2)} LYD
                </div>
                <div className="text-sm text-muted-foreground">
                  ${totalExpenses.toFixed(2)}
                </div>
              </div>
            ) : (
              <div className="text-2xl font-bold" data-testid="text-total-expenses">
                ${totalExpenses.toFixed(2)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">{t('fromAllExpenses')}</p>
          </CardContent>
        </Card>

        {Object.entries(expensesByCategory).slice(0, 5).map(([category, total]) => (
          <Card key={category}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{getCategoryLabel(category)}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {lydExchangeRate > 0 ? (
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {(total * lydExchangeRate).toFixed(2)} LYD
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ${total.toFixed(2)}
                  </div>
                </div>
              ) : (
                <div className="text-2xl font-bold">${total.toFixed(2)}</div>
              )}
              <p className="text-xs text-muted-foreground">
                {expenses.filter(e => e.category === category).length} {t('entries')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('expensesList')}</CardTitle>
          <CardDescription>{t('manageAllExpenses')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">{t('loadingExpenses')}</div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>{t('noExpensesFound')}</p>
              <p className="text-sm mt-2">{t('getStartedFirstExpense')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('date')}</TableHead>
                  <TableHead>{t('category')}</TableHead>
                  <TableHead>{t('description')}</TableHead>
                  <TableHead className="text-right">{t('amount')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id} data-testid={`row-expense-${expense.id}`}>
                    <TableCell data-testid={`text-date-${expense.id}`}>
                      {new Date(expense.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell data-testid={`text-category-${expense.id}`}>
                      {getCategoryLabel(expense.category)}
                    </TableCell>
                    <TableCell data-testid={`text-description-${expense.id}`}>
                      {expense.description || "—"}
                    </TableCell>
                    <TableCell className="text-right" data-testid={`text-amount-${expense.id}`}>
                      {lydExchangeRate > 0 ? (
                        <div>
                          <div className="font-bold text-blue-600">
                            {(parseFloat(expense.amount) * lydExchangeRate).toFixed(2)} LYD
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ${parseFloat(expense.amount).toFixed(2)}
                          </div>
                        </div>
                      ) : (
                        <span className="font-semibold">${parseFloat(expense.amount).toFixed(2)}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteExpenseMutation.mutate(expense.id)}
                        data-testid={`button-delete-${expense.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
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
