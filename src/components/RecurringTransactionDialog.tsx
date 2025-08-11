// src/components/RecurringTransactionDialog.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Account = { id: number; name: string; };
type Category = { id: number; name: string; type: 'income' | 'expense'; };
type RecurringTransaction = {
    id: number;
    description: string | null;
    amount: number;
    frequency: string;
    start_date: string;
    account_id: number;
    category_id: number;
};

interface RecurringTransactionDialogProps {
  item?: RecurringTransaction | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RecurringTransactionDialog({ item, isOpen, onOpenChange, onSuccess }: RecurringTransactionDialogProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [accountId, setAccountId] = useState<string | undefined>();
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<string | undefined>();
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = !!item;

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: accData } = await supabase.from('accounts').select('id, name').eq('user_id', user.id);
        setAccounts(accData || []);
        const { data: catData } = await supabase.from('categories').select('*').eq('user_id', user.id);
        setCategories(catData || []);
      }
    };
    fetchData();

    if (isEditMode && item) {
        const itemCategory = categories.find(c => c.id === item.category_id);
        setType(item.amount > 0 ? 'income' : 'expense');
        setAccountId(item.account_id.toString());
        setCategoryId(item.category_id.toString());
        setAmount(Math.abs(item.amount).toString());
        setDescription(item.description || '');
        setFrequency(item.frequency);
        setStartDate(new Date(item.start_date));
    } else {
        // Reset form
        setType('expense');
        setAccountId(undefined);
        setCategoryId(undefined);
        setAmount('');
        setDescription('');
        setFrequency(undefined);
        setStartDate(new Date());
    }
  }, [item, isEditMode, isOpen, categories]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !accountId || !categoryId || !amount || !frequency || !startDate) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      setIsLoading(false);
      return;
    }

    const finalAmount = type === 'expense' ? -Math.abs(parseFloat(amount)) : parseFloat(amount);
    const formattedStartDate = format(startDate, 'yyyy-MM-dd');

    const recurringData = {
        user_id: user.id,
        account_id: parseInt(accountId),
        category_id: parseInt(categoryId),
        amount: finalAmount,
        description,
        frequency,
        start_date: formattedStartDate,
        next_due_date: formattedStartDate, // Initial due date is the start date
    };

    let error;
    if (isEditMode) {
        const { error: updateError } = await supabase.from('recurring_transactions').update(recurringData).eq('id', item!.id);
        error = updateError;
    } else {
        const { error: insertError } = await supabase.from('recurring_transactions').insert(recurringData);
        error = insertError;
    }

    if (error) {
        alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } else {
        alert(isEditMode ? 'อัปเดตสำเร็จ!' : 'สร้างรายการประจำสำเร็จ!');
        onSuccess();
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
            <DialogTitle>{isEditMode ? 'แก้ไขรายการประจำ' : 'สร้างรายการประจำใหม่'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <ToggleGroup type="single" value={type} onValueChange={(value: 'income' | 'expense') => value && setType(value)} className="grid grid-cols-2">
              <ToggleGroupItem value="expense">รายจ่าย</ToggleGroupItem>
              <ToggleGroupItem value="income">รายรับ</ToggleGroupItem>
            </ToggleGroup>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">บัญชี</Label>
              <Select onValueChange={setAccountId} value={accountId}>
                <SelectTrigger className="col-span-3"><SelectValue placeholder="เลือกบัญชี" /></SelectTrigger>
                <SelectContent>{accounts.map(acc => <SelectItem key={acc.id} value={acc.id.toString()}>{acc.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">หมวดหมู่</Label>
              <Select onValueChange={setCategoryId} value={categoryId}>
                <SelectTrigger className="col-span-3"><SelectValue placeholder="เลือกหมวดหมู่" /></SelectTrigger>
                <SelectContent>{filteredCategories.map(cat => <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">จำนวนเงิน</Label>
              <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="col-span-3" required />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">คำอธิบาย</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} className="col-span-3" />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">ความถี่</Label>
              <Select onValueChange={setFrequency} value={frequency}>
                <SelectTrigger className="col-span-3"><SelectValue placeholder="เลือกความถี่" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="daily">ทุกวัน</SelectItem>
                    <SelectItem value="weekly">ทุกสัปดาห์</SelectItem>
                    <SelectItem value="monthly">ทุกเดือน</SelectItem>
                    <SelectItem value="yearly">ทุกปี</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">วันที่เริ่ม</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className="col-span-3 justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>เลือกวันที่</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus /></PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>{isLoading ? 'กำลังบันทึก...' : 'บันทึก'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
