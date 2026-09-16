// src/components/auth/AuthForm.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// Schemas de validação
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  passwordConfirm: z.string(),
  role: z.enum(['student', 'teacher']),
}).refine((data) => data.password === data.passwordConfirm, {
  message: 'Senhas não coincidem',
  path: ['passwordConfirm'],
});

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;

export default function AuthForm() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, register } = useAuth();

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      passwordConfirm: '',
      role: 'teacher',
    },
  });

  const onLoginSubmit = async (data: LoginData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await login(data.email, data.password);
      toast.success('Login realizado com sucesso!');
    } catch (error: any) {
      setError(error.message || 'Erro no login');
      toast.error('Erro no login');
    } finally {
      setIsLoading(false);
    }
  };

  const onRegisterSubmit = async (data: RegisterData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await register(data);
      toast.success('Conta criada com sucesso! Faça login para continuar.');
      setActiveTab('login');
      registerForm.reset();
    } catch (error: any) {
      setError(error.message || 'Erro no registro');
      toast.error('Erro ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Chatbot Teacher</CardTitle>
          <CardDescription>
            {activeTab === 'login' 
              ? 'Entre para acessar o dashboard' 
              : 'Crie sua conta para começar'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'register')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Registro</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    {...loginForm.register('email')}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-red-500">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="********"
                    {...loginForm.register('password')}
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-red-500">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Entrar
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    placeholder="Seu nome"
                    {...registerForm.register('name')}
                  />
                  {registerForm.formState.errors.name && (
                    <p className="text-sm text-red-500">{registerForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="seu@email.com"
                    {...registerForm.register('email')}
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-sm text-red-500">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Tipo de conta</Label>
                  <Select onValueChange={(value) => registerForm.setValue('role', value as 'student' | 'teacher')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teacher">Professor</SelectItem>
                      <SelectItem value="student">Aluno</SelectItem>
                    </SelectContent>
                  </Select>
                  {registerForm.formState.errors.role && (
                    <p className="text-sm text-red-500">{registerForm.formState.errors.role.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Senha</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="********"
                    {...registerForm.register('password')}
                  />
                  {registerForm.formState.errors.password && (
                    <p className="text-sm text-red-500">{registerForm.formState.errors.password.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordConfirm">Confirmar senha</Label>
                  <Input
                    id="passwordConfirm"
                    type="password"
                    placeholder="********"
                    {...registerForm.register('passwordConfirm')}
                  />
                  {registerForm.formState.errors.passwordConfirm && (
                    <p className="text-sm text-red-500">{registerForm.formState.errors.passwordConfirm.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar conta
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
