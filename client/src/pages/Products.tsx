import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency, VAT_RATES } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Plus, Search, Edit2, Trash2, Package, Wrench, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";

type ProductForm = {
  code: string; name: string; description: string; type: "produto" | "servico";
  unit: string; price: string; costPrice: string; vatRate: string;
  vatExemptReason: string; isVatExempt: boolean; stockControl: boolean; minStock: string;
};

export default function Products() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.products.list.useQuery({ search, type: typeFilter || undefined, page, limit: 15 });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ProductForm>({
    defaultValues: { type: "produto", unit: "UN", vatRate: "14", isVatExempt: false, stockControl: true },
  });

  const createMutation = trpc.products.create.useMutation({
    onSuccess: () => { utils.products.list.invalidate(); setOpen(false); reset(); toast.success("Produto criado!"); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.products.update.useMutation({
    onSuccess: () => { utils.products.list.invalidate(); setOpen(false); reset(); setEditId(null); toast.success("Produto actualizado!"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.products.delete.useMutation({
    onSuccess: () => { utils.products.list.invalidate(); toast.success("Produto removido."); },
    onError: (e) => toast.error(e.message),
  });

  function openCreate() { setEditId(null); reset({ type: "produto", unit: "UN", vatRate: "14", isVatExempt: false, stockControl: true }); setOpen(true); }
  function openEdit(p: any) {
    setEditId(p.id);
    reset({ code: p.code, name: p.name, description: p.description ?? "", type: p.type, unit: p.unit ?? "UN", price: String(p.price), costPrice: p.costPrice ? String(p.costPrice) : "", vatRate: String(p.vatRate), vatExemptReason: p.vatExemptReason ?? "", isVatExempt: p.isVatExempt, stockControl: p.stockControl, minStock: p.minStock ? String(p.minStock) : "" });
    setOpen(true);
  }
  function onSubmit(data: ProductForm) {
    if (editId) updateMutation.mutate({ id: editId, ...data });
    else createMutation.mutate(data);
  }

  const isVatExempt = watch("isVatExempt");
  const stockControl = watch("stockControl");
  const productType = watch("type");

  const nextCodeQuery = trpc.products.getNextCode.useQuery({ type: productType as any }, { enabled: !editId });

  useEffect(() => {
    if (!editId && nextCodeQuery.data) {
      setValue("code", nextCodeQuery.data);
    }
  }, [nextCodeQuery.data, editId, setValue]);

  return (
    <div className="p-6 space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Produtos & Serviços</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{data?.total ?? 0} itens no catálogo</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Novo Item</Button>
      </div>

      <div className="card-elevated">
        <div className="px-4 py-3 border-b border-border flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Pesquisar por nome, código..." className="pl-9 h-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <Select value={typeFilter || "all"} onValueChange={v => { setTypeFilter(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="produto">Produtos</SelectItem>
              <SelectItem value="servico">Serviços</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-elegant">
            <thead><tr>
              <th className="text-left">Código</th>
              <th className="text-left">Designação</th>
              <th className="text-left">Tipo</th>
              <th className="text-left">Unid.</th>
              <th className="text-right">Preço (s/IVA)</th>
              <th className="text-center">IVA</th>
              <th className="text-right">Stock</th>
              <th className="text-center">Acções</th>
            </tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={8} className="text-center py-10 text-muted-foreground text-sm">A carregar...</td></tr>}
              {!isLoading && data?.data.map((p) => {
                const lowStock = p.stockControl && Number(p.currentStock) <= Number(p.minStock);
                return (
                  <tr key={p.id}>
                    <td className="font-mono text-xs font-medium">{p.code}</td>
                    <td>
                      <p className="font-medium text-foreground text-sm">{p.name}</p>
                      {p.description && <p className="text-xs text-muted-foreground truncate max-w-xs">{p.description}</p>}
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        {p.type === "produto" ? <Package className="h-3 w-3" /> : <Wrench className="h-3 w-3" />}
                        {p.type === "produto" ? "Produto" : "Serviço"}
                      </span>
                    </td>
                    <td className="text-xs text-muted-foreground">{p.unit}</td>
                    <td className="text-sm font-semibold text-right">{formatCurrency(Number(p.price))}</td>
                    <td className="text-center">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", p.isVatExempt ? "bg-gray-100 text-gray-600" : "bg-blue-50 text-blue-700")}>
                        {p.isVatExempt ? "Isento" : `${Number(p.vatRate).toFixed(0)}%`}
                      </span>
                    </td>
                    <td className="text-right">
                      {p.stockControl ? (
                        <span className={cn("text-sm font-medium flex items-center justify-end gap-1", lowStock ? "text-amber-600" : "text-foreground")}>
                          {lowStock && <AlertTriangle className="h-3.5 w-3.5" />}
                          {Number(p.currentStock).toFixed(0)} {p.unit}
                        </span>
                      ) : <span className="text-xs text-muted-foreground">N/A</span>}
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(p)}><Edit2 className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => { if (confirm("Remover produto?")) deleteMutation.mutate({ id: p.id }); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!isLoading && data?.data.length === 0 && <tr><td colSpan={8} className="text-center py-10 text-muted-foreground text-sm">Nenhum produto encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Editar Produto/Serviço" : "Novo Produto/Serviço"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Código</Label>
                <Input {...register("code")} disabled={true} placeholder="Gerado automaticamente" className={errors.code ? "border-destructive" : "bg-muted/50"} />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={watch("type")} onValueChange={(v) => setValue("type", v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="produto">Produto</SelectItem>
                    <SelectItem value="servico">Serviço</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Designação *</Label>
                <Input {...register("name", { required: true })} placeholder="Nome do produto ou serviço" className={errors.name ? "border-destructive" : ""} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Descrição</Label>
                <Textarea {...register("description")} rows={2} placeholder="Descrição detalhada..." />
              </div>
              <div className="space-y-1.5">
                <Label>Preço Unitário (AOA) *</Label>
                <Input {...register("price", { required: true })} type="number" step="0.01" placeholder="0.00" className={errors.price ? "border-destructive" : ""} />
              </div>
              <div className="space-y-1.5">
                <Label>Preço de Custo (AOA)</Label>
                <Input {...register("costPrice")} type="number" step="0.01" placeholder="0.00" />
              </div>
              {productType === "produto" && (
                <div className="space-y-1.5">
                  <Label>Unidade de Medida</Label>
                  <Input {...register("unit")} placeholder="UN, KG, L, M2..." />
                </div>
              )}
              {productType === "produto" ? (
                <>
                  <div className="space-y-1.5">
                    <Label>Taxa de IVA</Label>
                    <Select value={watch("vatRate")} onValueChange={(v) => setValue("vatRate", v)} disabled={isVatExempt}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {VAT_RATES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Switch checked={isVatExempt} onCheckedChange={(v) => { setValue("isVatExempt", v); if (v) setValue("vatRate", "0"); }} />
                    <div>
                      <p className="text-sm font-medium">Isento de IVA</p>
                      <p className="text-xs text-muted-foreground">Marcar se este item está isento de IVA por lei</p>
                    </div>
                  </div>
                  {isVatExempt && (
                    <div className="col-span-2 space-y-1.5">
                      <Label>Motivo de Isenção</Label>
                      <Input {...register("vatExemptReason")} placeholder="Ex: Art. 12.º do CIVA" />
                    </div>
                  )}
                </>
              ) : (
                <div className="col-span-2 flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-amber-900">Retenção na Fonte (IRT 6.5%)</p>
                    <p className="text-xs text-amber-700">Ao emitir a fatura para este serviço, será possível aplicar a retenção na fonte. Sem incidência de IVA.</p>
                  </div>
                </div>
              )}
              {productType === "produto" && (
                <>
                  <div className="col-span-2 flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Switch checked={stockControl} onCheckedChange={(v) => setValue("stockControl", v)} />
                    <div>
                      <p className="text-sm font-medium">Controlo de Stock</p>
                      <p className="text-xs text-muted-foreground">Activar gestão de inventário para este produto</p>
                    </div>
                  </div>
                  {stockControl && (
                    <div className="space-y-1.5">
                      <Label>Stock Mínimo</Label>
                      <Input {...register("minStock")} type="number" step="0.01" placeholder="0" />
                    </div>
                  )}
                </>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>{editId ? "Guardar" : "Criar Item"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
