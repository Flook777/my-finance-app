// src/components/AddTransactionDialog.tsx
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
  DialogTrigger,
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

// รับ prop onTransactionAdded เพื่อแจ้งเตือน Dashboard ให้รีเฟรช
export function AddTransactionDialog({ onTransactionAdded }: { onTransactionAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ดึงข้อมูลหมวดหมู่เมื่อ component ถูกโหลด
  useEffect(() => {
    const fetchCategories = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching categories:', error);
        } else {
          setCategories(data || []);
        }
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !categoryId || !amount) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      setIsLoading(false);
      return;
    }

    const finalAmount = type === 'expense' ? -Math.abs(parseFloat(amount)) : parseFloat(amount);

    const { error } = await supabase.from('transactions').insert({
      description,
      amount: finalAmount,
      category_id: parseInt(categoryId),
      transaction_date: date ? format(date, 'yyyy-MM-dd') : new Date(),
      user_id: user.id,
    });

    if (error) {
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } else {
      alert('บันทึกรายการสำเร็จ!');
      onTransactionAdded(); // เรียกใช้ callback เพื่อรีเฟรชข้อมูลใน Dashboard
      setOpen(false); // ปิด Dialog
      // รีเซ็ตฟอร์ม
      setDescription('');
      setAmount('');
      setCategoryId(undefined);
      setDate(new Date());
    }
    setIsLoading(false);
  };

  const filteredCategories = categories.filter(cat => cat.type === type);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ เพิ่มรายการ</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>เพิ่มรายการใหม่</DialogTitle>
            <DialogDescription>
              กรอกข้อมูลรายรับ-รายจ่ายของคุณที่นี่
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
              {isLoading ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
