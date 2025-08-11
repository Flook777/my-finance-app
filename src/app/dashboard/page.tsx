// src/app/dashboard/page.tsx
'use client'; 

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient, type User } from '@supabase/supabase-js'; 
import { AddTransactionDialog } from '@/components/AddTransactionDialog'; 
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { ThemeToggle } from '@/components/theme-toggle'; // <-- เพิ่มบรรทัดนี้
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// --- สร้างการเชื่อมต่อ Supabase ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);
// ---------------------------------

// --- สร้าง Type สำหรับข้อมูลของเรา ---
type TransactionWithCategory = {
  id: number;
  description: string | null;
  amount: number;
  transaction_date: string;
  categories: { name: string } | null; 
};

type Summary = {
  income: number;
  expense: number;
  balance: number;
};

type ChartData = {
  name: string;
  value: number;
};
// -----------------------------------

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null); 
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [summary, setSummary] = useState<Summary>({ income: 0, expense: 0, balance: 0 });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Effect นี้ใช้สำหรับตรวจสอบ session ของ user เท่านั้น
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      } else {
        router.push('/');
      }
    };
    checkUser();
  }, [router]);

  // 2. Effect นี้จะทำงานเมื่อ 'user' มีข้อมูลแล้ว เพื่อเริ่มดึงข้อมูล
  useEffect(() => {
    if (user) {
      fetchData(user.id);
    }
  }, [user]);

  const fetchData = async (userId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, categories(name)') 
        .eq('user_id', userId)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      
      if (data) {
        processFetchedData(data as TransactionWithCategory[]);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      alert('เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };
  
  const processFetchedData = (data: TransactionWithCategory[]) => {
    const income = data.filter(tx => tx.amount > 0).reduce((acc, tx) => acc + tx.amount, 0);
    const expense = data.filter(tx => tx.amount < 0).reduce((acc, tx) => acc + tx.amount, 0);
    setSummary({
      income,
      expense: Math.abs(expense),
      balance: income + expense,
    });

    const expenseByCategory = data
      .filter(tx => tx.amount < 0 && tx.categories)
      .reduce((acc, tx) => {
        const categoryName = tx.categories!.name;
        acc[categoryName] = (acc[categoryName] || 0) + Math.abs(tx.amount);
        return acc;
      }, {} as Record<string, number>);

    const formattedChartData = Object.entries(expenseByCategory).map(([name, value]) => ({
      name,
      value,
    }));
    setChartData(formattedChartData);

    setTransactions(data.slice(0, 10));
  };


  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/'); 
  };

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">กำลังตรวจสอบผู้ใช้งาน...</div>;
  }
  
  if (isLoading || !user) {
  return <LoadingSkeleton />;
}



  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      {/* Header */}
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold md:text-base">
            💰
            <span className="sr-only">Finance App</span>
          </Link>
          <Link href="/dashboard" className="text-foreground transition-colors hover:text-foreground">
            Dashboard
          </Link>
          <Link href="/transactions" className="text-muted-foreground transition-colors hover:text-foreground">
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
            {/* --- จุดที่แก้ไข --- */}
            <AddTransactionDialog onTransactionAdded={() => fetchData(user.id)} />
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

      {/* Main Content */}
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>รายรับเดือนนี้</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-green-600">
                ฿{summary.income.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>รายจ่ายเดือนนี้</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-red-600">
                ฿{summary.expense.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>ยอดคงเหลือ</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">
                ฿{summary.balance.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Chart and Recent Transactions */}
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>ภาพรวมรายจ่าย</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `฿${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="value" fill="#ef4444" name="รายจ่าย" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>รายการล่าสุด</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>รายการ</TableHead>
                    <TableHead className="text-right">จำนวนเงิน</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{tx.description || 'ไม่มีคำอธิบาย'}</TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          tx.amount > 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {tx.amount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
