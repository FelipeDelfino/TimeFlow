import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Clock, KeyRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const loginSchema = z.object({
  username: z.string().min(1, "Username ou Email é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

const recoverySchema = z.object({
  usernameOrEmail: z.string().min(1, "Username ou Email é obrigatório"),
  recoveryKey: z.string().min(1, "Chave de recuperação é obrigatória"),
  newPassword: z.string().min(6, "Nova senha deve ter no mínimo 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RecoveryFormData = z.infer<typeof recoverySchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const recoveryForm = useForm<RecoveryFormData>({
    resolver: zodResolver(recoverySchema),
    defaultValues: {
      usernameOrEmail: "",
      recoveryKey: "",
      newPassword: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/login", data);
      const result = await response.json();

      if (response.ok) {
        localStorage.setItem('authToken', result.token);
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo ao System TimeFlow.",
        });
        setLocation("/");
      } else {
        throw new Error(result.message || 'Erro no login');
      }
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message || "Credenciais inválidas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRecoverySubmit = async (data: RecoveryFormData) => {
    try {
      const response = await apiRequest("POST", "/api/auth/reset-password-recovery", data);

      if (response.ok) {
        toast({
          title: "Senha redefinida com sucesso!",
          description: "Você já pode fazer login com sua nova senha.",
          variant: "success",
        });
        setIsRecoveryOpen(false);
        recoveryForm.reset();
      } else {
        const result = await response.json();
        throw new Error(result.message || 'Erro ao redefinir senha');
      }
    } catch (error: any) {
      toast({
        title: "Erro na recuperação",
        description: error.message || "Verifique suas credenciais e tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Card className="shadow-lg">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-blue-600">System TimeFlow</h1>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuário ou E-mail</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Seu username ou e-mail"
                  {...form.register("username")}
                  disabled={isLoading}
                  className="w-full"
                />
                {form.formState.errors.username && (
                  <p className="text-red-500 text-xs mt-1">
                    {form.formState.errors.username.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-xs text-blue-600 font-normal"
                    onClick={() => setIsRecoveryOpen(true)}
                  >
                    Esqueci minha senha
                  </Button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Sua senha"
                  {...form.register("password")}
                  disabled={isLoading}
                  className="w-full"
                />
                {form.formState.errors.password && (
                  <p className="text-red-500 text-xs mt-1">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isRecoveryOpen} onOpenChange={setIsRecoveryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recuperação de Senha</DialogTitle>
            <DialogDescription>
              Utilize sua Chave de Recuperação (Recovery Key) para redefinir sua senha.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={recoveryForm.handleSubmit(onRecoverySubmit)} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="rec-username">Usuário ou E-mail</Label>
              <Input
                id="rec-username"
                placeholder="Seu username ou e-mail"
                {...recoveryForm.register("usernameOrEmail")}
              />
              {recoveryForm.formState.errors.usernameOrEmail && (
                <p className="text-red-500 text-xs">{recoveryForm.formState.errors.usernameOrEmail.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rec-key">Chave de Recuperação</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="rec-key"
                  className="pl-9"
                  placeholder="Ex: REC-XXXX-XXXX-XXXX"
                  {...recoveryForm.register("recoveryKey")}
                />
              </div>
              {recoveryForm.formState.errors.recoveryKey && (
                <p className="text-red-500 text-xs">{recoveryForm.formState.errors.recoveryKey.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rec-pass">Nova Senha</Label>
              <Input
                id="rec-pass"
                type="password"
                placeholder="Nova senha segura"
                {...recoveryForm.register("newPassword")}
              />
              {recoveryForm.formState.errors.newPassword && (
                <p className="text-red-500 text-xs">{recoveryForm.formState.errors.newPassword.message}</p>
              )}
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsRecoveryOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={recoveryForm.formState.isSubmitting}>
                {recoveryForm.formState.isSubmitting ? "Redefinindo..." : "Redefinir Senha"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}