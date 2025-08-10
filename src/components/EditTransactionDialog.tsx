// src/components/EditTransactionDialog.tsx
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

// --- สร้างการเชื่อมต่อ Supabase ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Category = {
  id: number;
  name: string;
  type: 'income' | 'expense';
};

type Transaction = {
  id: number;
  description: string | null;
  amount: number;
  transaction_date: string;
  category_id?: number;
  categories: { name: string; type: 'income' | 'expense' } | null;
};

interface EditTransactionDialogProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onTransactionUpdated: () => void;
}

export function EditTransactionDialog({
  transaction,
  isOpen,
  onOpenChange,
  onTransactionUpdated,
}: EditTransactionDialogProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [date, setDate] = useState<Date | undefined>();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // เมื่อ transaction ที่ถูกส่งเข้ามาเปลี่ยนไป ให้ตั้งค่าเริ่มต้นของฟอร์ม
  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description || '');
      setAmount(Math.abs(transaction.amount).toString());
      setCategoryId(transaction.category_id?.toString());
      setDate(new Date(transaction.transaction_date));
      setType(transaction.amount > 0 ? 'income' : 'expense');
    }
  }, [transaction]);

  // ดึงข้อมูลหมวดหมู่
  useEffect(() => {
    const fetchCategories = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase.from('categories').select('*').eq('user_id', user.id);
        if (data) setCategories(data);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!transaction) return;
    setIsLoading(true);

    const finalAmount = type === 'expense' ? -Math.abs(parseFloat(amount)) : parseFloat(amount);

    const { error } = await supabase
      .from('transactions')
      .update({
        description,
        amount: finalAmount,
        category_id: categoryId ? parseInt(categoryId) : null,
        transaction_date: date ? format(date, 'yyyy-MM-dd') : new Date(),
      })
      .eq('id', transaction.id);

    if (error) {
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } else {
      alert('อัปเดตรายการสำเร็จ!');
      onTransactionUpdated();
      onOpenChange(false);
    }
    setIsLoading(false);
  };

  const filteredCategories = categories.filter(cat => cat.type === type);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>แก้ไขรายการ</DialogTitle>
            <DialogDescription>
              อัปเดตข้อมูลรายรับ-รายจ่ายของคุณ
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <ToggleGroup type="single" value={type} onValueChange={(value: 'income' | 'expense') => value && setType(value)} className="grid grid-cols-2">
              <ToggleGroupItem value="expense">รายจ่าย</ToggleGroupItem>
              <ToggleGroupItem value="income">รายรับ</ToggleGroupItem>
            </ToggleGroup>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">จำนวนเงิน</Label>
              <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">หมวดหมู่</Label>
              <Select onValueChange={setCategoryId} value={categoryId}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="เลือกหมวดหมู่" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">คำอธิบาย</Label>
              <Input id="description" value={description} onChange={e => setDescription(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">วันที่</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className="col-span-3 justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>เลือกวันที่</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'กำลังอัปเดต...' : 'บันทึกการเปลี่ยนแปลง'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
