// src/app/budgets/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient, type User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BudgetDialog } from '@/components/BudgetDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { ThemeToggle } from '@/components/theme-toggle'; // <-- เพิ่มบรรทัดนี้


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Budget = {
  id: number;
  amount: number;
  category_id: number;
  categories: { name: string };
  spent: number; // Will be calculated
  progress: number; // Will be calculated
};

export default function BudgetsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  useEffect(() => {
    const checkUserAndFetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
      } else {
        setUser(session.user);
        await fetchData(session.user.id);
      }
    };
    checkUserAndFetchData();
  }, [router, currentDate]);

  const fetchData = async (userId: string) => {
    setIsLoading(true);
    
    // 1. Fetch budgets for the current month
    const { data: budgetData, error: budgetError } = await supabase
      .from('budgets')
      .select('*, categories(name)')
      .eq('user_id', userId)
      .eq('month', currentMonth)
      .eq('year', currentYear);

    if (budgetError) {
      console.error('Error fetching budgets:', budgetError);
      setIsLoading(false);
      return;
    }

    // 2. Fetch all expenses for the current month
    const firstDay = new Date(currentYear, currentMonth - 1, 1).toISOString();
    const lastDay = new Date(currentYear, currentMonth, 0).toISOString();

    const { data: transactionData, error: transactionError } = await supabase
      .from('transactions')
      .select('amount, category_id')
      .eq('user_id', userId)
      .gte('transaction_date', firstDay)
      .lte('transaction_date', lastDay)
      .lt('amount', 0); // Only expenses

    if (transactionError) {
        console.error('Error fetching transactions:', transactionError);
        setIsLoading(false);
        return;
    }

    // 3. Calculate spent amount for each budget
    const processedBudgets = budgetData.map(budget => {
        const spent = transactionData
            .filter(tx => tx.category_id === budget.category_id)
            .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
        const progress = Math.min((spent / budget.amount) * 100, 100);
        return { ...budget, spent, progress };
    });

    setBudgets(processedBudgets);
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };
  
  const handleDelete = async (budgetId: number) => {
    if (!user) return;
    const { error } = await supabase.from('budgets').delete().eq('id', budgetId);
    if (error) {
      alert(`เกิดข้อผิดพลาดในการลบ: ${error.message}`);
    } else {
      alert('ลบงบประมาณสำเร็จ!');
      fetchData(user.id);
    }
  };

  const handleOpenDialog = (budget: Budget | null = null) => {
    setEditingBudget(budget);
    setIsDialogOpen(true);
  };

  if (isLoading || !user) {
  return <LoadingSkeleton />;
}


  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-10">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold md:text-base">💰</Link>
          <Link href="/dashboard" className="text-muted-foreground transition-colors hover:text-foreground">Dashboard</Link>
          <Link href="/transactions" className="text-muted-foreground transition-colors hover:text-foreground">Transactions</Link>
          <Link href="/categories" className="text-muted-foreground transition-colors hover:text-foreground">Categories</Link>
          <Link href="/budgets" className="text-foreground transition-colors hover:text-foreground">Budgets</Link>
          <Link href="/saving-goals" className="text-muted-foreground transition-colors hover:text-foreground">Saving Goals</Link>
          <Link href="/accounts" className="text-foreground transition-colors hover:text-foreground">Accounts</Link>

        </nav>
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <div className="ml-auto flex-1 sm:flex-initial">
             <Button onClick={() => handleOpenDialog()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              ตั้งงบประมาณ
            </Button>
          </div>
           {/* ----- จุดที่แก้ไข ----- */}
                    <ThemeToggle />
                    {/* --------------------- */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar>
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback>{user.email?.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">
            งบประมาณประจำเดือน {currentDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
          </h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => (
            <Card key={budget.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{budget.categories.name}</CardTitle>
                <AlertDialog>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleOpenDialog(budget)}>แก้ไข</DropdownMenuItem>
                        <AlertDialogTrigger asChild>
                           <DropdownMenuItem className="text-red-500">ลบ</DropdownMenuItem>
                        </AlertDialogTrigger>
                      </DropdownMenuContent>
                    </DropdownMenu>
                     <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>คุณแน่ใจหรือไม่?</AlertDialogTitle>
                          <AlertDialogDescription>การกระทำนี้ไม่สามารถย้อนกลับได้</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(budget.id)}>ยืนยันการลบ</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                </AlertDialog>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">฿{budget.spent.toLocaleString()} / <span className="text-base font-normal text-muted-foreground">{budget.amount.toLocaleString()}</span></div>
                <Progress value={budget.progress} className="mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <BudgetDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        budget={editingBudget}
        onBudgetUpdated={() => fetchData(user.id)}
        currentMonth={currentMonth}
        currentYear={currentYear}
      />
    </div>
  );
}
