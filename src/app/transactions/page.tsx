// src/app/transactions/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient, type User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AddTransactionDialog } from '@/components/AddTransactionDialog';
import { EditTransactionDialog } from '@/components/EditTransactionDialog'; // <-- Import component ใหม่
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal } from 'lucide-react';

// --- สร้างการเชื่อมต่อ Supabase ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);
// ---------------------------------

// --- ปรับปรุง Type ---
type Transaction = {
  id: number;
  description: string | null;
  amount: number;
  transaction_date: string;
  category_id?: number; // <-- เพิ่ม category_id
  categories: { name: string; type: 'income' | 'expense' } | null;
};

type GroupedTransactions = {
  [date: string]: Transaction[];
};

export default function TransactionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [groupedTransactions, setGroupedTransactions] = useState<GroupedTransactions>({});
  const [isLoading, setIsLoading] = useState(true);
  // --- เพิ่ม State สำหรับจัดการการแก้ไข ---
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  // ------------------------------------

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
    // --- ปรับปรุง Query ---
    const { data, error } = await supabase
      .from('transactions')
      .select('*, categories(id, name, type)') // <-- ดึง id ของ category มาด้วย
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
    } else if (data) {
      // --- ปรับปรุงการ map ข้อมูล ---
      const mappedData = data.map(tx => ({ ...tx, category_id: tx.categories?.id }));
      const grouped = mappedData.reduce((acc: GroupedTransactions, tx: Transaction) => {
        const date = tx.transaction_date;
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(tx);
        return acc;
      }, {});
      setGroupedTransactions(grouped);
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleDelete = async (transactionId: number) => {
    if (!user) return;
    const { error } = await supabase.from('transactions').delete().eq('id', transactionId);
    if (error) {
      alert(`เกิดข้อผิดพลาดในการลบ: ${error.message}`);
    } else {
      alert('ลบรายการสำเร็จ!');
      fetchData(user.id);
    }
  };

  // --- เพิ่มฟังก์ชันสำหรับเปิดหน้าต่างแก้ไข ---
  const handleOpenEditDialog = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsEditDialogOpen(true);
  };
  // --------------------------------------

  if (isLoading || !user) {
    return <div className="flex items-center justify-center min-h-screen">กำลังโหลดข้อมูล...</div>;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      {/* Header */}
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-10">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold md:text-base">
            💰
            <span className="sr-only">Finance App</span>
          </Link>
          <Link href="/dashboard" className="text-muted-foreground transition-colors hover:text-foreground">
            Dashboard
          </Link>
          <Link href="/transactions" className="text-foreground transition-colors hover:text-foreground">
            Transactions
          </Link>
           <Link href="/categories" className="text-muted-foreground transition-colors hover:text-foreground">
            Categories
          </Link>
          <Link href="/budgets" className="text-muted-foreground transition-colors hover:text-foreground">
          Budgets
          </Link>
          <Link href="/saving-goals" className="text-muted-foreground transition-colors hover:text-foreground">Saving Goals</Link>
        </nav>
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <div className="ml-auto flex-1 sm:flex-initial">
            <AddTransactionDialog onTransactionAdded={() => fetchData(user.id)} />
          </div>
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

      {/* Main Content */}
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">รายการทั้งหมด</h1>
        </div>
        <div className="flex flex-col gap-6">
          {Object.keys(groupedTransactions).map((date) => (
            <Card key={date}>
              <CardHeader>
                <CardTitle>{new Date(date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {groupedTransactions[date].map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-10 rounded-full ${tx.amount > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <div>
                          <p className="font-medium">{tx.description || 'ไม่มีคำอธิบาย'}</p>
                          <p className="text-sm text-muted-foreground">{tx.categories?.name || 'ไม่มีหมวดหมู่'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} ฿
                        </div>
                        <AlertDialog>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {/* --- จุดที่แก้ไข --- */}
                              <DropdownMenuItem onClick={() => handleOpenEditDialog(tx)}>
                                แก้ไข
                              </DropdownMenuItem>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-red-500">
                                  ลบ
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>คุณแน่ใจหรือไม่?</AlertDialogTitle>
                              <AlertDialogDescription>
                                การกระทำนี้ไม่สามารถย้อนกลับได้ ข้อมูลรายการนี้จะถูกลบออกจากระบบอย่างถาวร
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(tx.id)}>
                                ยืนยันการลบ
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      {/* --- เพิ่ม Dialog แก้ไขเข้ามาในหน้า --- */}
      <EditTransactionDialog
        transaction={editingTransaction}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onTransactionUpdated={() => fetchData(user.id)}
      />
    </div>
  );
}
