// src/components/AccountDialog.tsx
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Account = {
  id: number;
  name: string;
  balance: number;
};

interface AccountDialogProps {
  account?: Account | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAccountUpdated: () => void;
}

export function AccountDialog({
  account,
  isOpen,
  onOpenChange,
  onAccountUpdated,
}: AccountDialogProps) {
  const [name, setName] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isEditMode = !!account;

  useEffect(() => {
    if (isEditMode && account) {
      setName(account.name);
      setInitialBalance(account.balance.toString());
    } else {
      setName('');
      setInitialBalance('0');
    }
  }, [account, isEditMode, isOpen]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoading(false);
      return;
    }

    const accountData = {
      name,
      balance: parseFloat(initialBalance),
      user_id: user.id,
    };

    let error;

    if (isEditMode) {
      const { error: updateError } = await supabase
        .from('accounts')
        .update({ name: accountData.name })
        .eq('id', account!.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('accounts')
        .insert(accountData);
      error = insertError;
    }

    if (error) {
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } else {
      alert(isEditMode ? 'อัปเดตบัญชีสำเร็จ!' : 'เพิ่มบัญชีสำเร็จ!');
      onAccountUpdated();
      onOpenChange(false);
    }

    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'แก้ไขบัญชี' : 'สร้างบัญชีใหม่'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                ชื่อบัญชี
              </Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
            </div>
            {!isEditMode && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="balance" className="text-right">
                  ยอดยกมา
                </Label>
                <Input id="balance" type="number" value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} className="col-span-3" required />
              </div>
            )}
             {isEditMode && (
                 <p className="text-sm text-muted-foreground text-center col-span-4">ไม่สามารถแก้ไขยอดยกมาได้โดยตรง</p>
            )}
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