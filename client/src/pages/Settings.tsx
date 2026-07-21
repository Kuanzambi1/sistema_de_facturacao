import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { ANGOLA_PROVINCES, formatDate, formatDateTime } from "@/lib/utils";
import { Building2, FileText, Plus, Users, Shield, ShieldOff, Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { useAuth } from "@/_core/hooks/useAuth";

const DOCUMENT_TYPES = { FT: "Factura", FR: "Factura-Recibo", FS: "Factura Simplificada", FA: "Factura de Adiantamento", NC: "Nota de Crédito", ND: "Nota de Débito", RC: "Recibo", RG: "Recibo Global" };

function UserRow({ user, currentUserId, updateRole }: { user: any; currentUserId?: number; updateRole: any }) {
  const utils = trpc.useUtils();
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const editForm = useForm({ defaultValues: { name: user.name ?? "", email: user.email ?? "" } });

  const updateUser = trpc.users.update.useMutation({
    onSuccess: () => { utils.users.list.invalidate(); setEditOpen(false); toast.success("Utilizador actualizado!"); },
    onError: (e) => toast.error(e.message),
  });

  const deleteUser = trpc.users.delete.useMutation({
    onSuccess: () => { utils.users.list.invalidate(); setDeleteOpen(false); toast.success("Utilizador desactivado!"); },
    onError: (e) => toast.error(e.message),
  });

  const isSelf = user.id === currentUserId;

  return (
    <>
      <tr>
        <td className="text-sm font-medium text-foreground">{user.name ?? "—"}</td>
        <td className="text-xs text-muted-foreground">{user.email ?? "—"}</td>
        <td className="text-xs text-muted-foreground">{user.loginMethod === "local" ? "Local" : user.loginMethod ?? "—"}</td>
        <td className="text-xs text-muted-foreground">{formatDate(user.createdAt)}</td>
        <td className="text-center">
          <Select
            value={user.role}
            disabled={updateRole.isPending || isSelf}
            onValueChange={(role) => updateRole.mutate({ id: user.id, role: role as "user" | "admin" })}
          >
            <SelectTrigger className={`h-7 w-28 text-xs ${user.role === "admin" ? "text-purple-700" : "text-gray-600"}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">
                <span className="flex items-center gap-1.5"><ShieldOff className="h-3 w-3" />Utilizador</span>
              </SelectItem>
              <SelectItem value="admin">
                <span className="flex items-center gap-1.5"><Shield className="h-3 w-3" />Admin</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </td>
        <td className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setViewOpen(true)} title="Visualizar">
              <Eye className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => { editForm.reset({ name: user.name ?? "", email: user.email ?? "" }); setEditOpen(true); }} title="Editar">
              <Pencil className="h-4 w-4" />
            </Button>
            {!isSelf && (
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)} title="Eliminar">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </td>
      </tr>

      {/* Visualizar */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Detalhes do Utilizador</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-3 gap-2">
              <span className="text-muted-foreground">Nome:</span>
              <span className="col-span-2 font-medium">{user.name ?? "—"}</span>
              <span className="text-muted-foreground">Email:</span>
              <span className="col-span-2">{user.email ?? "—"}</span>
              <span className="text-muted-foreground">Permissão:</span>
              <span className="col-span-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${user.role === "admin" ? "bg-purple-50 text-purple-700" : "bg-gray-100 text-gray-600"}`}>
                  {user.role === "admin" ? <Shield className="h-3 w-3" /> : <ShieldOff className="h-3 w-3" />}
                  {user.role === "admin" ? "Admin" : "Utilizador"}
                </span>
              </span>
              <span className="text-muted-foreground">Método de Login:</span>
              <span className="col-span-2">{user.loginMethod === "local" ? "Local (email + password)" : user.loginMethod ?? "—"}</span>
              <span className="text-muted-foreground">Registado em:</span>
              <span className="col-span-2">{formatDateTime(user.createdAt)}</span>
              <span className="text-muted-foreground">Último Login:</span>
              <span className="col-span-2">{formatDateTime(user.lastSignedIn)}</span>
            </div>
          </div>
          <DialogFooter><DialogClose asChild><Button variant="outline">Fechar</Button></DialogClose></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Editar */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Editar Utilizador</DialogTitle></DialogHeader>
          <form onSubmit={editForm.handleSubmit((d) => updateUser.mutate({ id: user.id, ...d }))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input {...editForm.register("name")} placeholder="Nome do utilizador" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input {...editForm.register("email")} type="email" placeholder="email@exemplo.com" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={updateUser.isPending}>{updateUser.isPending ? "A guardar..." : "Guardar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Eliminar */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Utilizador</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acção irá desactivar o acesso de <strong>{user.name ?? user.email}</strong> ao sistema.
              O registo do utilizador será mantido mas não poderá fazer login.
              Esta operação é reversível por um administrador.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteUser.isPending}
              onClick={(e) => { e.preventDefault(); deleteUser.mutate({ id: user.id }); }}
            >
              {deleteUser.isPending ? "A desactivar..." : "Sim, desactivar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function Settings() {
  const [seriesOpen, setSeriesOpen] = useState(false);
  const utils = trpc.useUtils();

  const { data: company } = trpc.company.get.useQuery();
  const { data: series } = trpc.series.list.useQuery({});

  const companyForm = useForm({ defaultValues: { name: "", nif: "", address: "", city: "", province: "", country: "Angola", phone: "", email: "", website: "", taxRegime: "geral" as "geral" | "simplificado" | "exclusao", bankName: "", bankIban: "", agtPortalUser: "" } });
  const seriesForm = useForm({ defaultValues: { code: "", name: "", documentType: "FT" as any, year: new Date().getFullYear() } });

  // Pre-fill company form when data loads
  if (company && !companyForm.getValues("name") && company.name) {
    companyForm.reset({ name: company.name, nif: company.nif, address: company.address ?? "", city: company.city ?? "", province: company.province ?? "", country: company.country ?? "Angola", phone: company.phone ?? "", email: company.email ?? "", website: company.website ?? "", taxRegime: (company.taxRegime ?? "geral") as any, bankName: company.bankName ?? "", bankIban: company.bankIban ?? "", agtPortalUser: company.agtPortalUser ?? "" });
  }

  const upsertCompany = trpc.company.upsert.useMutation({
    onSuccess: () => { utils.company.get.invalidate(); toast.success("Configurações da empresa guardadas!"); },
    onError: (e) => toast.error(e.message),
  });

  const createSeries = trpc.series.create.useMutation({
    onSuccess: () => { utils.series.list.invalidate(); setSeriesOpen(false); seriesForm.reset(); toast.success("Série criada com sucesso!"); },
    onError: (e) => toast.error(e.message),
  });

  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin";
  const { data: usersData } = trpc.users.list.useQuery({ page: 1, limit: 50 }, { enabled: isAdmin });
  const updateRole = trpc.users.updateRole.useMutation({
    onSuccess: () => { utils.users.list.invalidate(); toast.success("Permissão actualizada!"); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="p-6 space-y-5 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Empresa, séries de facturação e preferências</p>
      </div>

      <Tabs defaultValue="company">
        <TabsList className="mb-4">
          <TabsTrigger value="company" className="gap-2"><Building2 className="h-4 w-4" />Empresa</TabsTrigger>
          <TabsTrigger value="series" className="gap-2"><FileText className="h-4 w-4" />Séries de Facturação</TabsTrigger>
          {isAdmin && <TabsTrigger value="users" className="gap-2"><Users className="h-4 w-4" />Utilizadores</TabsTrigger>}
        </TabsList>

        {/* Empresa */}
        <TabsContent value="company">
          <div className="card-elevated p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">Dados da Empresa Emitente</h2>
            <form onSubmit={companyForm.handleSubmit((d) => upsertCompany.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label>Denominação Social *</Label>
                  <Input {...companyForm.register("name", { required: true })} placeholder="Nome da empresa" />
                </div>
                <div className="space-y-1.5">
                  <Label>NIF *</Label>
                  <Input {...companyForm.register("nif", { required: true })} placeholder="000000000" />
                </div>
                <div className="space-y-1.5">
                  <Label>Regime Fiscal</Label>
                  <Select value={companyForm.watch("taxRegime")} onValueChange={(v) => companyForm.setValue("taxRegime", v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="geral">Regime Geral</SelectItem>
                      <SelectItem value="simplificado">Regime Simplificado</SelectItem>
                      <SelectItem value="exclusao">Regime de Exclusão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Morada</Label>
                  <Input {...companyForm.register("address")} placeholder="Rua, número, bairro" />
                </div>
                <div className="space-y-1.5">
                  <Label>Cidade</Label>
                  <Input {...companyForm.register("city")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Província</Label>
                  <Select value={companyForm.watch("province")} onValueChange={(v) => companyForm.setValue("province", v)}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>{ANGOLA_PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Telefone</Label><Input {...companyForm.register("phone")} /></div>
                <div className="space-y-1.5"><Label>E-mail</Label><Input {...companyForm.register("email")} type="email" /></div>
                <div className="space-y-1.5"><Label>Website</Label><Input {...companyForm.register("website")} /></div>
                <div className="space-y-1.5"><Label>Utilizador Portal AGT</Label><Input {...companyForm.register("agtPortalUser")} placeholder="Utilizador do Portal AGT" /></div>
              </div>
              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-medium text-foreground mb-3">Dados Bancários</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>Banco</Label><Input {...companyForm.register("bankName")} placeholder="Nome do banco" /></div>
                  <div className="space-y-1.5"><Label>IBAN</Label><Input {...companyForm.register("bankIban")} placeholder="AO06 0000 0000 0000 0000 0000 0" /></div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={upsertCompany.isPending}>
                  {upsertCompany.isPending ? "A guardar..." : "Guardar Configurações"}
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>

        {/* Séries */}
        <TabsContent value="series">
          <div className="card-elevated">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Séries de Facturação</h2>
              <Button size="sm" onClick={() => setSeriesOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Nova Série</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full table-elegant">
                <thead><tr>
                  <th className="text-left">Código</th>
                  <th className="text-left">Designação</th>
                  <th className="text-left">Tipo de Documento</th>
                  <th className="text-left">Ano</th>
                  <th className="text-right">Último Nº</th>
                  <th className="text-left">Código de Validação</th>
                  <th className="text-center">Estado</th>
                </tr></thead>
                <tbody>
                  {series?.map((s) => (
                    <tr key={s.id}>
                      <td className="font-mono text-xs font-semibold">{s.code}</td>
                      <td className="text-sm text-foreground">{s.name}</td>
                      <td className="text-xs text-muted-foreground">{(DOCUMENT_TYPES as any)[s.documentType] ?? s.documentType}</td>
                      <td className="text-xs text-muted-foreground">{s.year}</td>
                      <td className="text-right text-sm font-semibold">{s.lastNumber}</td>
                      <td className="font-mono text-xs text-muted-foreground">{s.validationCode ?? "—"}</td>
                      <td className="text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                          {s.isActive ? "Activa" : "Inactiva"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!series || series.length === 0) && (
                    <tr><td colSpan={7} className="text-center py-8 text-muted-foreground text-sm">Nenhuma série criada. Crie uma série para começar a emitir documentos.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card-elevated p-5 mt-4 bg-blue-50/50 border-blue-200">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">ℹ️ Sobre as Séries de Facturação</h3>
            <p className="text-xs text-blue-700 leading-relaxed">
              As séries de facturação devem ser comunicadas à AGT antes de serem utilizadas. O código de validação gerado automaticamente é para uso interno durante o desenvolvimento. Em produção, utilize o código fornecido pela AGT após a comunicação da série. O ATCUD de cada documento é gerado com base no código de validação da série e no número sequencial do documento.
            </p>
          </div>
        </TabsContent>
        {/* Utilizadores */}
        {isAdmin && (
          <TabsContent value="users">
            <div className="card-elevated">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">Gestão de Utilizadores</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full table-elegant">
                  <thead><tr>
                    <th className="text-left">Nome</th>
                    <th className="text-left">Email</th>
                    <th className="text-left">Método</th>
                    <th className="text-left">Registo</th>
                    <th className="text-center">Permissão</th>
                    <th className="text-center">Acções</th>
                  </tr></thead>
                  <tbody>
                    {usersData?.data?.map((u) => (
                      <UserRow
                        key={u.id}
                        user={u}
                        currentUserId={currentUser?.id}
                        updateRole={updateRole}
                      />
                    ))}
                    {(!usersData?.data || usersData.data.length === 0) && (
                      <tr><td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">Nenhum utilizador encontrado.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={seriesOpen} onOpenChange={setSeriesOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nova Série de Facturação</DialogTitle></DialogHeader>
          <form onSubmit={seriesForm.handleSubmit((d) => createSeries.mutate(d))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Código da Série *</Label>
              <Input {...seriesForm.register("code", { required: true })} placeholder="Ex: FT2026A" />
              <p className="text-xs text-muted-foreground">Código único que identifica a série (ex: FT2026A)</p>
            </div>
            <div className="space-y-1.5">
              <Label>Designação *</Label>
              <Input {...seriesForm.register("name", { required: true })} placeholder="Ex: Facturas 2026" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tipo de Documento</Label>
                <Select value={seriesForm.watch("documentType")} onValueChange={(v) => seriesForm.setValue("documentType", v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(DOCUMENT_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{k} — {v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Ano</Label>
                <Input {...seriesForm.register("year", { valueAsNumber: true })} type="number" defaultValue={new Date().getFullYear()} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSeriesOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createSeries.isPending}>Criar Série</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
