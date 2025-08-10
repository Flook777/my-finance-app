// src/components/CategoryDialog.tsx
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Category = {
  id: number;
  name: string;
  type: 'income' | 'expense';
};

interface CategoryDialogProps {
  category?: Category | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryUpdated: () => void;
}

export function CategoryDialog({
  category,
  isOpen,
  onOpenChange,
  onCategoryUpdated,
}: CategoryDialogProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [isLoading, setIsLoading] = useState(false);

  const isEditMode = !!category;

  useEffect(() => {
    if (isEditMode && category) {
      setName(category.name);
      setType(category.type);
    } else {
      // Reset form for new category
      setName('');
      setType('expense');
    }
  }, [category, isEditMode, isOpen]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoading(false);
      return;
    }

    const categoryData = {
      name,
      type,
      user_id: user.id,
    };

    let error;

    if (isEditMode) {
      // Update existing category
      const { error: updateError } = await supabase
        .from('categories')
        .update(categoryData)
        .eq('id', category!.id);
      error = updateError;
    } else {
      // Create new category
      const { error: insertError } = await supabase
        .from('categories')
        .insert(categoryData);
      error = insertError;
    }

    if (error) {
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } else {
      alert(isEditMode ? 'อัปเดตหมวดหมู่สำเร็จ!' : 'เพิ่มหมวดหมู่สำเร็จ!');
      onCategoryUpdated();
      onOpenChange(false);
    }

    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'แก้ไขหมวดหมู่' : 'สร้างหมวดหมู่ใหม่'}</DialogTitle>
            <DialogDescription>
              จัดการหมวดหมู่สำหรับรายรับและรายจ่ายของคุณ
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <ToggleGroup type="single" value={type} onValueChange={(value: 'income' | 'expense') => value && setType(value)} className="grid grid-cols-2">
              <ToggleGroupItem value="expense">รายจ่าย</ToggleGroupItem>
              <ToggleGroupItem value="income">รายรับ</ToggleGroupItem>
            </ToggleGroup>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                ชื่อหมวดหมู่
              </Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
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
