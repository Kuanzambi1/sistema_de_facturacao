import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatDate, ANGOLA_PROVINCES } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Plus, Search, Edit2, Trash2, User, Building2, Globe, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

type ClientForm = {
  name: string; nif: string; type: "singular" | "colectivo" | "estrangeiro";
  address: string; city: string; province: string; country: string;
  phone: string; email: string; contactPerson: string; paymentTerms: number; notes: string;
};

export default function Clients() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.clients.list.useQuery({ search, page, limit: 15 });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ClientForm>({
    defaultValues: { country: "Angola", type: "colectivo", paymentTerms: 30 },
  });

  const createMutation = trpc.clients.create.useMutation({
    onSuccess: () => { utils.clients.list.invalidate(); setOpen(false); reset(); toast.success("Cliente criado com sucesso!"); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.clients.update.useMutation({
    onSuccess: () => { utils.clients.list.invalidate(); setOpen(false); reset(); setEditId(null); toast.success("Cliente actualizado!"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.clients.delete.useMutation({
    onSuccess: () => { utils.clients.list.invalidate(); toast.success("Cliente removido."); },
    onError: (e) => toast.error(e.message),
  });

  function openCreate() { setEditId(null); reset({ country: "Angola", type: "colectivo", paymentTerms: 30 }); setOpen(true); }
  function openEdit(c: any) {
    setEditId(c.id);
    reset({ name: c.name, nif: c.nif ?? "", type: c.type, address: c.address ?? "", city: c.city ?? "", province: c.province ?? "", country: c.country ?? "Angola", phone: c.phone ?? "", email: c.email ?? "", contactPerson: c.contactPerson ?? "", paymentTerms: c.paymentTerms ?? 30, notes: c.notes ?? "" });
    setOpen(true);
  }

  function onSubmit(data: ClientForm) {
    if (editId) updateMutation.mutate({ id: editId, ...data });
    else createMutation.mutate(data);
  }

  const typeIcon = (type: string) => type === "singular" ? <User className="h-3 w-3" /> : type === "estrangeiro" ? <Globe className="h-3 w-3" /> : <Building2 className="h-3 w-3" />;
  const typeLabel = (type: string) => ({ singular: "Singular", colectivo: "Colectivo", estrangeiro: "Estrangeiro" })[type] ?? type;

  return (
    <div className="p-6 space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{data?.total ?? 0} clientes registados</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Novo Cliente</Button>
      </div>

      <div className="card-elevated">
        <div className="px-4 py-3 border-b border-border">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Pesquisar por nome, NIF..." className="pl-9 h-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-elegant">
            <thead><tr>
              <th className="text-left">Nome</th>
              <th className="text-left">NIF</th>
              <th className="text-left">Tipo</th>
              <th className="text-left">Contacto</th>
              <th className="text-left">Localidade</th>
              <th className="text-left">Criado em</th>
              <th className="text-center">Acções</th>
            </tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} className="text-center py-10 text-muted-foreground text-sm">A carregar...</td></tr>}
              {!isLoading && data?.data.map((c) => (
                <tr key={c.id}>
                  <td><p className="font-medium text-foreground text-sm">{c.name}</p>{c.contactPerson && <p className="text-xs text-muted-foreground">{c.contactPerson}</p>}</td>
                  <td className="font-mono text-xs">{c.nif ?? "—"}</td>
                  <td><span className="inline-flex items-center gap-1 text-xs text-muted-foreground">{typeIcon(c.type ?? "colectivo")}{typeLabel(c.type ?? "colectivo")}</span></td>
                  <td>
                    <div className="space-y-0.5">
                      {c.phone && <p className="text-xs flex items-center gap-1"><Phone className="h-3 w-3 text-muted-foreground" />{c.phone}</p>}
                      {c.email && <p className="text-xs flex items-center gap-1"><Mail className="h-3 w-3 text-muted-foreground" />{c.email}</p>}
                    </div>
                  </td>
                  <td className="text-xs text-muted-foreground">{[c.city, c.province].filter(Boolean).join(", ") || "—"}</td>
                  <td className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</td>
                  <td>
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(c)}><Edit2 className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => { if (confirm("Remover cliente?")) deleteMutation.mutate({ id: c.id }); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && data?.data.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-muted-foreground text-sm">Nenhum cliente encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {(data?.total ?? 0) > 15 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Página {page} de {Math.ceil((data?.total ?? 0) / 15)}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
              <Button variant="outline" size="sm" disabled={page >= Math.ceil((data?.total ?? 0) / 15)} onClick={() => setPage(p => p + 1)}>Seguinte</Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Nome / Denominação Social *</Label>
                <Input {...register("name", { required: true })} placeholder="Nome completo ou razão social" className={errors.name ? "border-destructive" : ""} />
              </div>
              <div className="space-y-1.5">
                <Label>NIF</Label>
                <Input {...register("nif")} placeholder="000000000" />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo de Contribuinte</Label>
                <Select value={watch("type")} onValueChange={(v) => setValue("type", v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="singular">Pessoa Singular</SelectItem>
                    <SelectItem value="colectivo">Pessoa Colectiva</SelectItem>
                    <SelectItem value="estrangeiro">Entidade Estrangeira</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Morada</Label>
                <Input {...register("address")} placeholder="Rua, número, bairro" />
              </div>
              <div className="space-y-1.5">
                <Label>Cidade / Município</Label>
                <Input {...register("city")} placeholder="Luanda" />
              </div>
              <div className="space-y-1.5">
                <Label>Província</Label>
                <Select value={watch("province")} onValueChange={(v) => setValue("province", v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {ANGOLA_PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>País</Label>
                <Input {...register("country")} defaultValue="Angola" />
              </div>
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input {...register("phone")} placeholder="+244 9XX XXX XXX" />
              </div>
              <div className="space-y-1.5">
                <Label>E-mail</Label>
                <Input {...register("email")} type="email" placeholder="email@empresa.ao" />
              </div>
              <div className="space-y-1.5">
                <Label>Pessoa de Contacto</Label>
                <Input {...register("contactPerson")} placeholder="Nome do responsável" />
              </div>
              <div className="space-y-1.5">
                <Label>Prazo de Pagamento (dias)</Label>
                <Input {...register("paymentTerms", { valueAsNumber: true })} type="number" defaultValue={30} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Notas</Label>
                <Textarea {...register("notes")} placeholder="Observações internas..." rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editId ? "Guardar Alterações" : "Criar Cliente"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
