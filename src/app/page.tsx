// src/app/page.tsx
'use client'; 

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

enum FormMode {
  Login,
  Register,
}

export default function AuthPage() {
  const [mode, setMode] = useState(FormMode.Login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const isLoginMode = mode === FormMode.Login;

  const handleAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    if (isLoginMode) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert(`เกิดข้อผิดพลาดในการ Login: ${error.message}`);
      } else {
        alert('เข้าสู่ระบบสำเร็จ!');
        router.push('/dashboard');
      }
    } else {
      if (password !== confirmPassword) {
        alert('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน!');
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        alert(`เกิดข้อผิดพลาดในการสมัคร: ${error.message}`);
      } else {
        alert('สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลเพื่อยืนยันตัวตน');
      }
    }
    setIsLoading(false);
  };

  return (
    // ----- จุดที่แก้ไข: ลบ bg-gray-100 ออกไป -----
    <main className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-sm">
        <form onSubmit={handleAuth}>
          <CardHeader>
            <CardTitle className="text-2xl">
              {isLoginMode ? 'เข้าสู่ระบบ' : 'สร้างบัญชีใหม่'}
            </CardTitle>
            <CardDescription>
              {isLoginMode
                ? 'กรุณากรอกอีเมลและรหัสผ่านเพื่อเข้าใช้งาน'
                : 'กรอกข้อมูลเพื่อเริ่มต้นใช้งานแอปพลิเคชัน'}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {!isLoginMode && (
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">ยืนยันรหัสผ่าน</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? 'กำลังโหลด...' : (isLoginMode ? 'ลงชื่อเข้าใช้' : 'สมัครสมาชิก')}
            </Button>
            <div className="text-center text-sm">
              {isLoginMode ? 'ยังไม่มีบัญชี?' : 'มีบัญชีอยู่แล้ว?'}
              <Button
                variant="link"
                className="pl-1"
                type="button"
                onClick={() =>
                  setMode(isLoginMode ? FormMode.Register : FormMode.Login)
                }
              >
                {isLoginMode ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
