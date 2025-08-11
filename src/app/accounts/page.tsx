// src/app/accounts/page.tsx
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { AccountDialog } from '@/components/AccountDialog';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Account = {
  id: number;
  name: string;
  balance: number;
};

export default function AccountsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

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
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching accounts:', error);
    } else {
      setAccounts(data || []);
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleDelete = async (accountId: number) => {
    if (!user) return;
    const { error } = await supabase.from('accounts').delete().eq('id', accountId);
    if (error) {
      alert(`เกิดข้อผิดพลาดในการลบ: ${error.message}`);
    } else {
      alert('ลบบัญชีสำเร็จ!');
      fetchData(user.id);
    }
  };

  const handleOpenDialog = (account: Account | null = null) => {
    setEditingAccount(account);
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
          <Link href="/budgets" className="text-muted-foreground transition-colors hover:text-foreground">Budgets</Link>
          <Link href="/saving-goals" className="text-muted-foreground transition-colors hover:text-foreground">Saving Goals</Link>
          <Link href="/accounts" className="text-foreground transition-colors hover:text-foreground">Accounts</Link>
        </nav>
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <div className="ml-auto flex-1 sm:flex-initial">
             <Button onClick={() => handleOpenDialog()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              เพิ่มบัญชี
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
          <h1 className="text-lg font-semibold md:text-2xl">จัดการบัญชี</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((acc) => (
            <Card key={acc.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{acc.name}</CardTitle>
                <AlertDialog>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleOpenDialog(acc)}>แก้ไข</DropdownMenuItem>
                      <AlertDialogTrigger asChild>
                         <DropdownMenuItem className="text-red-500">ลบ</DropdownMenuItem>
                      </AlertDialogTrigger>
                    </DropdownMenuContent>
                  </DropdownMenu>
                   <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>คุณแน่ใจหรือไม่?</AlertDialogTitle>
                        <AlertDialogDescription>การลบบัญชีจะทำให้รายการทั้งหมดในบัญชีนี้ถูกลบไปด้วย</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(acc.id)}>ยืนยันการลบ</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">฿{acc.balance.toLocaleString()}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <AccountDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        account={editingAccount}
        onAccountUpdated={() => fetchData(user.id)}
      />
    </div>
  );
}
