// src/components/BudgetDialog.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Category = {
  id: number;
  name: string;
};

type Budget = {
    id: number;
    amount: number;
    category_id: number;
};

interface BudgetDialogProps {
  budget?: Budget | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onBudgetUpdated: () => void;
  currentMonth: number;
  currentYear: number;
}

export function BudgetDialog({
  budget,
  isOpen,
  onOpenChange,
  onBudgetUpdated,
  currentMonth,
  currentYear,
}: BudgetDialogProps) {
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const isEditMode = !!budget;

  useEffect(() => {
    const fetchExpenseCategories = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name')
          .eq('user_id', user.id)
          .eq('type', 'expense');

        if (error) {
          console.error('Error fetching categories:', error);
        } else {
          setExpenseCategories(data || []);
        }
      }
    };
    if(isOpen) {
        fetchExpenseCategories();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isEditMode && budget) {
      setAmount(budget.amount.toString());
      setCategoryId(budget.category_id.toString());
    } else {
      setAmount('');
      setCategoryId(undefined);
    }
  }, [budget, isEditMode, isOpen]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !categoryId || !amount) {
      setIsLoading(false);
      return;
    }
    
    const budgetData = {
      amount: parseFloat(amount),
      category_id: parseInt(categoryId),
      month: currentMonth,
      year: currentYear,
      user_id: user.id,
    };

    let error;

    if (isEditMode) {
      const { error: updateError } = await supabase
        .from('budgets')
        .update({ amount: budgetData.amount })
        .eq('id', budget!.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('budgets')
        .insert(budgetData);
      error = insertError;
    }

    if (error) {
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } else {
      alert(isEditMode ? 'อัปเดตงบประมาณสำเร็จ!' : 'ตั้งงบประมาณสำเร็จ!');
      onBudgetUpdated();
      onOpenChange(false);
    }

    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'แก้ไขงบประมาณ' : 'ตั้งงบประมาณใหม่'}</DialogTitle>
            <DialogDescription>
              กำหนดวงเงินสำหรับหมวดหมู่รายจ่ายในเดือนนี้
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                หมวดหมู่
              </Label>
              <Select onValueChange={setCategoryId} value={categoryId} disabled={isEditMode}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="เลือกหมวดหมู่รายจ่าย" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                วงเงิน (บาท)
              </Label>
              <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="col-span-3" required />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
