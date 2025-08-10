// src/components/SavingGoalDialog.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type SavingGoal = { id: number; name: string; target_amount: number; };
interface SavingGoalDialogProps {
  goal?: SavingGoal | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onGoalUpdated: () => void;
}

export function SavingGoalDialog({ goal, isOpen, onOpenChange, onGoalUpdated }: SavingGoalDialogProps) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = !!goal;

  useEffect(() => {
    if (isEditMode && goal) {
      setName(goal.name);
      setTargetAmount(goal.target_amount.toString());
    } else {
      setName('');
      setTargetAmount('');
    }
  }, [goal, isEditMode, isOpen]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoading(false); return; }

    const goalData = { name, target_amount: parseFloat(targetAmount), user_id: user.id };
    let error;
    if (isEditMode) {
      const { error: updateError } = await supabase.from('saving_goals').update({ name: goalData.name, target_amount: goalData.target_amount }).eq('id', goal!.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('saving_goals').insert(goalData);
      error = insertError;
    }

    if (error) {
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } else {
      alert(isEditMode ? 'อัปเดตเป้าหมายสำเร็จ!' : 'สร้างเป้าหมายสำเร็จ!');
      onGoalUpdated();
      onOpenChange(false);
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'แก้ไขเป้าหมาย' : 'สร้างเป้าหมายใหม่'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">ชื่อเป้าหมาย</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="target_amount" className="text-right">จำนวนเงินเป้าหมาย</Label>
              <Input id="target_amount" type="number" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} className="col-span-3" required />
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
