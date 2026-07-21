import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const loginSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "Mínimo 6 caracteres" }),
});

const registerSchema = z.object({
  name: z.string().min(1, { message: "Nome é obrigatório" }),
  nif: z.string().min(1, { message: "NIF/BI é obrigatório" }),
  phone: z.string().min(1, { message: "Telefone é obrigatório" }),
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "Mínimo 6 caracteres" }),
  terms: z.boolean().refine((val) => val === true, {
    message: "Deve aceitar os termos e condições",
  }),
});

export default function Login() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const { refresh } = useAuth();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      toast.success("Login efetuado com sucesso!");
      refresh();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao efetuar login");
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      toast.success("Conta criada! Pode agora fazer login.");
      setActiveTab("login");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar conta");
    },
  });

  const { register: registerLogin, handleSubmit: handleSubmitLogin, formState: { errors: loginErrors } } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  const { register: registerSignup, handleSubmit: handleSubmitSignup, formState: { errors: signupErrors }, setValue, watch } = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
  });

  const termsAccepted = watch("terms");

  const onSubmitLogin = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(data);
  };

  const onSubmitSignup = (data: z.infer<typeof registerSchema>) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-lg border-primary/10">
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "login" | "register")}>
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold tracking-tight">Sistema de Facturação</CardTitle>
            <CardDescription>Aceda à sua conta para gerir o seu negócio</CardDescription>
            <TabsList className="grid w-full grid-cols-2 mt-4">
              <TabsTrigger value="login">Iniciar Sessão</TabsTrigger>
              <TabsTrigger value="register">Criar Conta</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent>
            <TabsContent value="login">
              <form onSubmit={handleSubmitLogin(onSubmitLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="nome@empresa.com" {...registerLogin("email")} />
                  {loginErrors.email && <span className="text-xs text-destructive">{loginErrors.email.message}</span>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Palavra-passe</Label>
                  <Input id="password" type="password" {...registerLogin("password")} />
                  {loginErrors.password && <span className="text-xs text-destructive">{loginErrors.password.message}</span>}
                </div>
                <Button type="submit" className="w-full mt-6" disabled={loginMutation.isPending}>
                  {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Entrar no Sistema
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleSubmitSignup(onSubmitSignup)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-name">Nome da Empresa / Entidade</Label>
                  <Input id="reg-name" placeholder="A minha empresa" {...registerSignup("name")} />
                  {signupErrors.name && <span className="text-xs text-destructive">{signupErrors.name.message}</span>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-nif">NIF / BI</Label>
                    <Input id="reg-nif" placeholder="000000000" {...registerSignup("nif")} />
                    {signupErrors.nif && <span className="text-xs text-destructive">{signupErrors.nif.message}</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-phone">Telefone</Label>
                    <Input id="reg-phone" placeholder="900000000" {...registerSignup("phone")} />
                    {signupErrors.phone && <span className="text-xs text-destructive">{signupErrors.phone.message}</span>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input id="reg-email" type="email" placeholder="nome@empresa.com" {...registerSignup("email")} />
                  {signupErrors.email && <span className="text-xs text-destructive">{signupErrors.email.message}</span>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Palavra-passe</Label>
                  <Input id="reg-password" type="password" {...registerSignup("password")} />
                  {signupErrors.password && <span className="text-xs text-destructive">{signupErrors.password.message}</span>}
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox 
                    id="terms" 
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setValue("terms", checked === true, { shouldValidate: true })} 
                  />
                  <Label htmlFor="terms" className="text-sm font-normal">
                    Li e aceito os <Dialog>
                      <DialogTrigger asChild>
                        <span className="text-primary cursor-pointer hover:underline">termos e condições</span>
                      </DialogTrigger>
                      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Termos e Condições</DialogTitle>
                          <DialogDescription>
                            Leia atentamente os termos de uso do Sistema de Facturação.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="text-sm text-foreground space-y-4">
                          <p><strong>1. Uso da Plataforma</strong><br/>
                          O Sistema de Facturação destina-se ao uso profissional para emissão de documentos fiscais e gestão de inventário.</p>
                          <p><strong>2. Privacidade e Dados</strong><br/>
                          Os dados registados, incluindo informações de clientes e transações comerciais, são armazenados de forma segura e não serão partilhados com terceiros, exceto mediante obrigação legal.</p>
                          <p><strong>3. Responsabilidade do Utilizador</strong><br/>
                          A exatidão dos dados inseridos, como NIFs, moradas e taxas de IVA, é da inteira responsabilidade do utilizador. O sistema não se responsabiliza por coimas resultantes de má utilização ou inserção de dados falsos.</p>
                          <p><strong>4. Obrigações Fiscais</strong><br/>
                          Ao utilizar a plataforma, compromete-se a cumprir todas as regras da Administração Geral Tributária (AGT) referentes à comunicação de documentos.</p>
                        </div>
                        <DialogFooter className="mt-4">
                          <DialogClose asChild>
                            <Button type="button" variant="outline">Cancelar</Button>
                          </DialogClose>
                          <DialogClose asChild>
                            <Button type="button" onClick={() => setValue("terms", true, { shouldValidate: true })}>
                              Concordo e Aceito
                            </Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </Label>
                </div>
                {signupErrors.terms && <span className="text-xs text-destructive block mt-1">{signupErrors.terms.message}</span>}

                <Button type="submit" className="w-full mt-6" disabled={registerMutation.isPending}>
                  {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Registar Conta
                </Button>
              </form>
            </TabsContent>
          </CardContent>
          <CardFooter className="flex justify-center border-t p-4 mt-2">
            <p className="text-xs text-muted-foreground">
              Protegido por Autenticação Local Segura
            </p>
          </CardFooter>
        </Tabs>
      </Card>
    </div>
  );
}
