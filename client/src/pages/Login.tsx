import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, FileText, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";

const loginSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(8, { message: "Mínimo 8 caracteres" }),
});

const registerSchema = z.object({
  name: z.string().min(1, { message: "Nome é obrigatório" }),
  nif: z.string().min(1, { message: "NIF/BI é obrigatório" }),
  phone: z.string().min(1, { message: "Telefone é obrigatório" }),
  email: z.string().email({ message: "Email inválido" }),
  password: z.string()
    .min(8, { message: "Mínimo 8 caracteres" })
    .regex(/[A-Z]/, { message: "Deve conter pelo menos uma maiúscula" })
    .regex(/[0-9]/, { message: "Deve conter pelo menos um número" }),
  terms: z.boolean().refine((val) => val === true, {
    message: "Deve aceitar os termos e condições",
  }),
});

export default function Login() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      toast.success("Login efetuado com sucesso!");
      window.location.href = "/dashboard";
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
    <div className="min-h-screen flex">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#004b36] to-[#004b36]/90 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-20 w-72 h-72 bg-[#e66a00]/15 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white/5 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] border border-white/5 rounded-full" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link href="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium transition-colors w-fit">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao início
          </Link>

          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">FacturaAGT</p>
                <p className="text-sm text-white/60">Facturação Electrónica</p>
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-white leading-tight">
              Gerir o seu negócio<br />
              <span className="text-[#e66a00]">nunca foi tão fácil.</span>
            </h2>
            <p className="mt-4 text-white/70 text-lg max-w-md leading-relaxed">
              Emita facturas, gere inventário e cumpra a legislação fiscal angolana — tudo num só lugar.
            </p>
          </div>

          <div className="flex items-center gap-6 text-white/50 text-sm">
            <span>Conformidade AGT</span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span>SAFT-AO</span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span>ATCUD</span>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-muted/30">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#004b36] to-[#004b36]/80 flex items-center justify-center shadow-md shadow-[#004b36]/20">
              <FileText className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight">FacturaAGT</span>
          </div>

          <Card className="shadow-xl border-border/50 bg-card/80 backdrop-blur-sm">
            <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "login" | "register")}>
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl font-bold tracking-tight">
                  {activeTab === "login" ? "Bem-vindo de volta" : "Criar conta"}
                </CardTitle>
                <CardDescription>
                  {activeTab === "login"
                    ? "Introduza as suas credenciais para aceder"
                    : "Preencha os dados para criar a sua conta"}
                </CardDescription>
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
                      <Input id="email" type="email" placeholder="nome@empresa.com" {...registerLogin("email")} className="h-11" />
                      {loginErrors.email && <span className="text-xs text-destructive">{loginErrors.email.message}</span>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Palavra-passe</Label>
                      <Input id="password" type="password" placeholder="••••••••" {...registerLogin("password")} className="h-11" />
                      {loginErrors.password && <span className="text-xs text-destructive">{loginErrors.password.message}</span>}
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-11 mt-2 bg-gradient-to-r from-[#004b36] to-[#004b36]/90 hover:brightness-110 text-white font-semibold shadow-md shadow-[#004b36]/20"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Entrar no Sistema
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={handleSubmitSignup(onSubmitSignup)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-name">Nome da Empresa / Entidade</Label>
                      <Input id="reg-name" placeholder="A minha empresa" {...registerSignup("name")} className="h-11" />
                      {signupErrors.name && <span className="text-xs text-destructive">{signupErrors.name.message}</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="reg-nif">NIF / BI</Label>
                        <Input id="reg-nif" placeholder="000000000" {...registerSignup("nif")} className="h-11" />
                        {signupErrors.nif && <span className="text-xs text-destructive">{signupErrors.nif.message}</span>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-phone">Telefone</Label>
                        <Input id="reg-phone" placeholder="900000000" {...registerSignup("phone")} className="h-11" />
                        {signupErrors.phone && <span className="text-xs text-destructive">{signupErrors.phone.message}</span>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">Email</Label>
                      <Input id="reg-email" type="email" placeholder="nome@empresa.com" {...registerSignup("email")} className="h-11" />
                      {signupErrors.email && <span className="text-xs text-destructive">{signupErrors.email.message}</span>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Palavra-passe</Label>
                      <Input id="reg-password" type="password" placeholder="••••••••" {...registerSignup("password")} className="h-11" />
                      {signupErrors.password && <span className="text-xs text-destructive">{signupErrors.password.message}</span>}
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                      <Checkbox
                        id="terms"
                        checked={termsAccepted}
                        onCheckedChange={(checked) => setValue("terms", checked === true, { shouldValidate: true })}
                      />
                      <Label htmlFor="terms" className="text-sm font-normal">
                        Li e aceito os{" "}
                        <Dialog>
                          <DialogTrigger asChild>
                            <span className="text-[#e66a00] cursor-pointer hover:underline font-medium">termos e condições</span>
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
                              A exatidão dos dados inseridos, como NIFs, moradas e taxas de IVA, é da inteira responsabilidade do utilizador.</p>
                              <p><strong>4. Obrigações Fiscais</strong><br/>
                              Ao utilizar a plataforma, compromete-se a cumprir todas as regras da Administração Geral Tributária (AGT) referentes à comunicação de documentos.</p>
                            </div>
                            <DialogFooter className="mt-4">
                              <DialogClose asChild>
                                <Button type="button" variant="outline">Cancelar</Button>
                              </DialogClose>
                              <DialogClose asChild>
                                <Button type="button" onClick={() => setValue("terms", true, { shouldValidate: true })} className="bg-[#004b36] text-white hover:brightness-110">
                                  Concordo e Aceito
                                </Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </Label>
                    </div>
                    {signupErrors.terms && <span className="text-xs text-destructive block mt-1">{signupErrors.terms.message}</span>}

                    <Button
                      type="submit"
                      className="w-full h-11 mt-2 bg-gradient-to-r from-[#e66a00] to-[#e66a00]/90 hover:brightness-110 text-white font-semibold shadow-md shadow-[#e66a00]/20"
                      disabled={registerMutation.isPending}
                    >
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
      </div>
    </div>
  );
}
