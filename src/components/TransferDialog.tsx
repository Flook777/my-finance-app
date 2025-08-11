// src/components/TransferDialog.tsx
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
import { format } from 'date-fns';
import { Calendar as CalendarIcon, ArrowRightLeft } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Account = {
  id: number;
  name: string;
};

interface TransferDialogProps {
  onTransferSuccess: () => void;
}

export function TransferDialog({ onTransferSuccess }: TransferDialogProps) {
  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [fromAccountId, setFromAccountId] = useState<string | undefined>();
  const [toAccountId, setToAccountId] = useState<string | undefined>();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    const fetchAccounts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('accounts')
          .select('id, name')
          .eq('user_id', user.id);
        if (error) {
          console.error('Error fetching accounts:', error);
        } else {
          setAccounts(data || []);
        }
      }
    };
    fetchAccounts();
  }, [open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!fromAccountId || !toAccountId || !amount) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    if (fromAccountId === toAccountId) {
      alert('บัญชีต้นทางและปลายทางต้องแตกต่างกัน');
      return;
    }
    setIsLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.rpc('create_transfer', {
      amount: parseFloat(amount),
      from_account_id: parseInt(fromAccountId),
      to_account_id: parseInt(toAccountId),
      description: description || 'โอนเงินระหว่างบัญชี',
      user_id: user.id,
      transfer_date: format(date || new Date(), 'yyyy-MM-dd'),
    });

    if (error) {
      alert(`เกิดข้อผิดพลาดในการโอนเงิน: ${error.message}`);
    } else {
      alert('โอนเงินสำเร็จ!');
      onTransferSuccess();
      setOpen(false);
      // Reset form
      setFromAccountId(undefined);
      setToAccountId(undefined);
      setAmount('');
      setDescription('');
      setDate(new Date());
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ArrowRightLeft className="mr-2 h-4 w-4" />
          โอนเงิน
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>โอนเงินระหว่างบัญชี</DialogTitle>
            <DialogDescription>
              บันทึกการย้ายเงินจากบัญชีหนึ่งไปยังอีกบัญชีหนึ่ง
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fromAccount" className="text-right">
                จาก
              </Label>
              <Select onValueChange={setFromAccountId} value={fromAccountId}>
                <SelectTrigger id="fromAccount" className="col-span-3">
                  <SelectValue placeholder="เลือกบัญชีต้นทาง" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id.toString()}>{acc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="toAccount" className="text-right">
                ไปที่
              </Label>
              <Select onValueChange={setToAccountId} value={toAccountId}>
                <SelectTrigger id="toAccount" className="col-span-3">
                  <SelectValue placeholder="เลือกบัญชีปลายทาง" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id.toString()}>{acc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                จำนวนเงิน
              </Label>
              <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                คำอธิบาย
              </Label>
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
              {isLoading ? 'กำลังโอน...' : 'ยืนยันการโอน'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
