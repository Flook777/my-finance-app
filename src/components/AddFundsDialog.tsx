// src/components/AddFundsDialog.tsx
'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type SavingGoal = { id: number; name: string; };
interface AddFundsDialogProps {
  goal: SavingGoal | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onFundsAdded: () => void;
}

export function AddFundsDialog({ goal, isOpen, onOpenChange, onFundsAdded }: AddFundsDialogProps) {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!goal) return;
    setIsLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoading(false); return; }

    const { error } = await supabase.rpc('add_funds_to_goal', {
      goal_id_in: goal.id,
      amount_in: parseFloat(amount),
      user_id_in: user.id,
      description_in: `ออมเงินสำหรับ: ${goal.name}`
    });

    if (error) {
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } else {
      alert('เพิ่มเงินออมสำเร็จ!');
      onFundsAdded();
      onOpenChange(false);
      setAmount('');
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            {/* --- จุดที่แก้ไข --- */}
            <DialogTitle>{`เพิ่มเงินออมสำหรับ "${goal?.name}"`}</DialogTitle>
            <DialogDescription>
              จำนวนเงินนี้จะถูกบันทึกเป็นรายจ่ายและเพิ่มเข้าสู่เป้าหมายของคุณ
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">จำนวนเงิน</Label>
              <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="col-span-3" required />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>{isLoading ? 'กำลังออม...' : 'ยืนยันการออม'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
