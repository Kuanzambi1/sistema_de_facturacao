import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatDate, formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Plus, AlertTriangle, Package, ArrowDown, ArrowUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

type MovementForm = {
  productId: number;
  type: "entrada" | "saida" | "ajuste";
  quantity: number;
  unitCost: number;
  reference: string;
  notes: string;
};

export default function Inventory() {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const utils = trpc.useUtils();

  const { data: stockAlerts } = trpc.inventory.stockAlerts.useQuery();
  const { data: movements, isLoading } = trpc.inventory.list.useQuery({ page });
  const { data: products } = trpc.products.list.useQuery({ limit: 200 });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<MovementForm>({
    defaultValues: { type: "entrada", quantity: 1 },
  });

  const addMovement = trpc.inventory.addMovement.useMutation({
    onSuccess: () => {
      utils.inventory.list.invalidate();
      utils.inventory.stockAlerts.invalidate();
      utils.products.list.invalidate();
      setOpen(false);
      reset();
      toast.success("Movimento registado!");
    },
    onError: (e) => toast.error(e.message),
  });

  function onSubmit(data: MovementForm) {
    addMovement.mutate({
      productId: Number(data.productId),
      type: data.type,
      quantity: Number(data.quantity),
      unitCost: data.unitCost ? Number(data.unitCost) : undefined,
      reference: data.reference || undefined,
      notes: data.notes || undefined,
    });
  }

  const movType = watch("type");

  return (
    <div className="p-6 space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Inventário</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Controlo de stock e movimentos</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Registar Movimento</Button>
      </div>

      {/* Alertas de stock */}
      {(stockAlerts?.length ?? 0) > 0 && (
        <div className="card-elevated border-amber-200 bg-amber-50/50">
          <div className="px-4 py-3 border-b border-amber-200 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h2 className="text-sm font-semibold text-amber-800">Alertas de Stock Mínimo ({stockAlerts?.length})</h2>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stockAlerts?.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-amber-200">
                <Package className="h-8 w-8 text-amber-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                  <p className="text-xs text-amber-700">
                    Stock: <strong>{Number(p.currentStock).toFixed(0)}</strong> {p.unit} | Mínimo: {Number(p.minStock).toFixed(0)} {p.unit}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stock actual por produto */}
      <div className="card-elevated">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Stock Actual</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-elegant">
            <thead><tr>
              <th className="text-left">Código</th>
              <th className="text-left">Produto</th>
              <th className="text-center">Stock Actual</th>
              <th className="text-center">Stock Mínimo</th>
              <th className="text-right">Preço Unitário</th>
              <th className="text-center">Estado</th>
            </tr></thead>
            <tbody>
              {products?.data.filter(p => p.stockControl).map((p) => {
                const low = Number(p.currentStock) <= Number(p.minStock);
                return (
                  <tr key={p.id}>
                    <td className="font-mono text-xs">{p.code}</td>
                    <td className="text-sm font-medium text-foreground">{p.name}</td>
                    <td className="text-center">
                      <span className={cn("text-sm font-semibold", low ? "text-amber-600" : "text-foreground")}>
                        {Number(p.currentStock).toFixed(2)} {p.unit}
                      </span>
                    </td>
                    <td className="text-center text-xs text-muted-foreground">{Number(p.minStock).toFixed(2)} {p.unit}</td>
                    <td className="text-right text-sm">{formatCurrency(Number(p.price))}</td>
                    <td className="text-center">
                      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", low ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700")}>
                        {low ? <><AlertTriangle className="h-3 w-3" />Baixo</> : "Normal"}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {products?.data.filter(p => p.stockControl).length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">Nenhum produto com controlo de stock.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Histórico de movimentos */}
      <div className="card-elevated">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Histórico de Movimentos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-elegant">
            <thead><tr>
              <th className="text-left">Data</th>
              <th className="text-left">Produto</th>
              <th className="text-center">Tipo</th>
              <th className="text-right">Quantidade</th>
              <th className="text-right">Custo Unit.</th>
              <th className="text-left">Referência</th>
            </tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">A carregar...</td></tr>}
              {!isLoading && movements?.data.map((m) => {
                const prod = products?.data.find(p => p.id === m.productId);
                return (
                  <tr key={m.id}>
                    <td className="text-xs text-muted-foreground">{formatDate(m.movementDate)}</td>
                    <td className="text-sm text-foreground">{prod?.name ?? `Produto #${m.productId}`}</td>
                    <td className="text-center">
                      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                        m.type === "entrada" ? "bg-emerald-50 text-emerald-700" :
                        m.type === "saida" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700")}>
                        {m.type === "entrada" ? <ArrowDown className="h-3 w-3" /> : m.type === "saida" ? <ArrowUp className="h-3 w-3" /> : <RefreshCw className="h-3 w-3" />}
                        {m.type === "entrada" ? "Entrada" : m.type === "saida" ? "Saída" : "Ajuste"}
                      </span>
                    </td>
                    <td className="text-right text-sm font-semibold">{Number(m.quantity).toFixed(2)} {prod?.unit ?? "UN"}</td>
                    <td className="text-right text-xs text-muted-foreground">{m.unitCost ? formatCurrency(Number(m.unitCost)) : "—"}</td>
                    <td className="text-xs text-muted-foreground">{m.reference ?? m.notes ?? "—"}</td>
                  </tr>
                );
              })}
              {!isLoading && movements?.data.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">Nenhum movimento registado.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Registar Movimento de Stock</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Produto *</Label>
              <Select onValueChange={(v) => setValue("productId", Number(v))}>
                <SelectTrigger className={errors.productId ? "border-destructive" : ""}><SelectValue placeholder="Seleccionar produto..." /></SelectTrigger>
                <SelectContent>
                  {products?.data.filter(p => p.stockControl).map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.code} — {p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tipo de Movimento</Label>
                <Select value={movType} onValueChange={(v) => setValue("type", v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                    <SelectItem value="ajuste">Ajuste de Inventário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Quantidade *</Label>
                <Input {...register("quantity", { required: true, min: 0.001 })} type="number" step="0.001" placeholder="0" className={errors.quantity ? "border-destructive" : ""} />
              </div>
              {movType === "entrada" && (
                <div className="space-y-1.5">
                  <Label>Custo Unitário (AOA)</Label>
                  <Input {...register("unitCost")} type="number" step="0.01" placeholder="0.00" />
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Referência</Label>
                <Input {...register("reference")} placeholder="Nº guia, factura..." />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Textarea {...register("notes")} rows={2} placeholder="Observações..." />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={addMovement.isPending}>Registar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
