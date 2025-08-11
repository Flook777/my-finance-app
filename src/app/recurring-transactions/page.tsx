// src/app/recurring-transactions/page.tsx
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MoreHorizontal, PlusCircle, Repeat } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { RecurringTransactionDialog } from '@/components/RecurringTransactionDialog'; // New Dialog
import { format } from 'date-fns';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Corrected Type Definition
type RecurringTransaction = {
  id: number;
  description: string | null;
  amount: number;
  frequency: string;
  start_date: string; // Keep as string to match dialog prop
  next_due_date: string;
  account_id: number;
  category_id: number;
  accounts: { name: string };
  categories: { name: string };
};

export default function RecurringTransactionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(null);

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
  }, [router]);

  const fetchData = async (userId: string) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('recurring_transactions')
      .select('*, accounts(name), categories(name)')
      .eq('user_id', userId)
      .order('next_due_date', { ascending: true });

    if (error) {
      console.error('Error fetching recurring transactions:', error);
    } else {
      // Correctly cast the fetched data
      setRecurring(data as RecurringTransaction[] || []);
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleDelete = async (itemId: number) => {
    if (!user) return;
    const { error } = await supabase.from('recurring_transactions').delete().eq('id', itemId);
    if (error) {
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } else {
      alert('ลบรายการประจำสำเร็จ!');
      fetchData(user.id);
    }
  };

  const handleOpenDialog = (item: RecurringTransaction | null = null) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const formatFrequency = (freq: string) => {
    switch (freq) {
      case 'daily': return 'ทุกวัน';
      case 'weekly': return 'ทุกสัปดาห์';
      case 'monthly': return 'ทุกเดือน';
      case 'yearly': return 'ทุกปี';
      default: return freq;
    }
  };

  if (isLoading || !user) {
    return <div className="flex items-center justify-center min-h-screen">กำลังโหลดข้อมูล...</div>;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-10">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold md:text-base">💰</Link>
          <Link href="/dashboard" className="text-muted-foreground transition-colors hover:text-foreground">Dashboard</Link>
          <Link href="/transactions" className="text-muted-foreground transition-colors hover:text-foreground">Transactions</Link>
          <Link href="/categories" className="text-muted-foreground transition-colors hover:text-foreground">Categories</Link>
          <Link href="/budgets" className="text-muted-foreground transition-colors hover:text-foreground">Budgets</Link>
          <Link href="/saving-goals" className="text-muted-foreground transition-colors hover:text-foreground">Saving Goals</Link>
          <Link href="/accounts" className="text-muted-foreground transition-colors hover:text-foreground">Accounts</Link>
          <Link href="/recurring-transactions" className="text-foreground transition-colors hover:text-foreground">Recurring</Link>
        </nav>
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <div className="ml-auto flex-1 sm:flex-initial">
             <Button onClick={() => handleOpenDialog()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              สร้างรายการประจำ
            </Button>
          </div>
          <ThemeToggle />
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
          <h1 className="text-lg font-semibold md:text-2xl">รายการประจำ</h1>
        </div>
        <div className="grid gap-4">
          {recurring.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${item.amount > 0 ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                        <Repeat className={`h-6 w-6 ${item.amount > 0 ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                    <div>
                        <p className="font-semibold">{item.description || 'ไม่มีคำอธิบาย'}</p>
                        <p className="text-sm text-muted-foreground">
                            {item.accounts.name} · {item.categories.name}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className={`font-bold text-lg ${item.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.amount > 0 ? '+' : '-'}฿{Math.abs(item.amount).toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            ครั้งถัดไป: {format(new Date(item.next_due_date), 'd MMM yyyy')} ({formatFrequency(item.frequency)})
                        </p>
                    </div>
                    <AlertDialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleOpenDialog(item)}>แก้ไข</DropdownMenuItem>
                          <AlertDialogTrigger asChild>
                             <DropdownMenuItem className="text-red-500">ลบ</DropdownMenuItem>
                          </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                       <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>คุณแน่ใจหรือไม่?</AlertDialogTitle>
                            <AlertDialogDescription>การกระทำนี้จะลบรายการประจำออกอย่างถาวร</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(item.id)}>ยืนยันการลบ</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <RecurringTransactionDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        item={editingItem}
        onSuccess={() => fetchData(user.id)}
      />
    </div>
  );
}
