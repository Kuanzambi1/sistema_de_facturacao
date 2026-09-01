import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate, DOCUMENT_TYPE_LABELS, FREQUENCY_LABELS, VAT_RATES, STATUS_COLORS, STATUS_LABELS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Plus, Play, Trash2, CalendarClock, Zap, RefreshCw, Repeat, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

type RuleItem = {
  productId?: number;
  productCode?: string;
  type?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  discount: number;
};

export default function RecurringRules() {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState<number | undefined>();
  const [frequency, setFrequency] = useState("mensal");
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [nextRunDate, setNextRunDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [withholding, setWithholding] = useState("0");
  const [lines, setLines] = useState<RuleItem[]>([{ description: "", quantity: 1, unitPrice: 0, vatRate: 14, discount: 0 }]);

  const { data: rules, isLoading } = trpc.recurring.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery({ limit: 500 });
  const { data: products } = trpc.products.list.useQuery({ limit: 500 });

  const create = trpc.recurring.create.useMutation({
    onSuccess: () => {
      utils.recurring.list.invalidate();
      setOpen(false);
      setName("");
      setLines([{ description: "", quantity: 1, unitPrice: 0, vatRate: 14, discount: 0 }]);
      toast.success("Regra recorrente criada!");
    },
    onError: (e) => toast.error(e.message),
  });

  const runNow = trpc.recurring.runNow.useMutation({
    onSuccess: (inv) => {
      utils.recurring.list.invalidate();
      utils.invoices.list.invalidate();
      toast.success(inv ? `Factura ${inv.fullNumber} emitida!` : "Regra executada.");
    },
    onError: (e) => toast.error(e.message),
  });

  const runDue = trpc.recurring.runDue.useMutation({
    onSuccess: (results) => {
      utils.recurring.list.invalidate();
      utils.invoices.list.invalidate();
      const ok = results.filter(r => r.ok).length;
      toast.success(`Processadas ${results.length} regras (${ok} com sucesso).`);
    },
    onError: (e) => toast.error(e.message),
  });

  const update = trpc.recurring.update.useMutation({
    onSuccess: () => { utils.recurring.list.invalidate(); toast.success("Regra actualizada!"); },
    onError: (e) => toast.error(e.message),
  });

  const remove = trpc.recurring.delete.useMutation({
    onSuccess: () => { utils.recurring.list.invalidate(); toast.success("Regra eliminada."); },
    onError: (e) => toast.error(e.message),
  });

  function addLine() { setLines(l => [...l, { description: "", quantity: 1, unitPrice: 0, vatRate: 14, discount: 0 }]); }
  function removeLine(i: number) { setLines(l => l.filter((_, idx) => idx !== i)); }
  function updateLine(i: number, field: keyof RuleItem, value: any) {
    setLines(l => l.map((line, idx) => idx === i ? { ...line, [field]: value } : line));
  }
  function selectProduct(i: number, productId: number) {
    const p = products?.data.find(p => p.id === productId);
    if (p) {
      setLines(l => l.map((line, idx) => idx === i ? {
        ...line,
        productId: p.id,
        productCode: p.code,
        description: p.name,
        unitPrice: Number(p.price),
        vatRate: p.isVatExempt ? 0 : Number(p.vatRate),
        type: p.type,
      } : line));
    }
  }

  function handleCreate() {
    if (lines.some(l => !l.description)) { toast.error("Preencha a descrição de todos os artigos."); return; }
    const client = clients?.data.find(c => c.id === clientId);
    create.mutate({
      name,
      clientId,
      clientName: client?.name,
      clientNif: client?.nif ?? undefined,
      clientEmail: client?.email ?? undefined,
      documentType: "FT",
      frequency: frequency as any,
      dayOfMonth: Number(dayOfMonth),
      nextRunDate: new Date(nextRunDate + "T12:00:00"),
      withholdingTaxPercent: Number(withholding),
      items: lines.map(l => ({
        productId: l.productId,
        productCode: l.productCode,
        type: l.type,
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        vatRate: l.vatRate,
        discountPercent: l.discount,
      })),
    });
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Facturação Recorrente</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Emita facturas automaticamente com frequência definida</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => runDue.mutate()} disabled={runDue.isPending}>
            <RefreshCw className={cn("h-4 w-4", runDue.isPending && "animate-spin")} />
            Processar vencidas
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" />Nova Regra</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova regra recorrente</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Nome da regra *</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Renda mensal escritório" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Cliente</Label>
                    <Select value={clientId ? String(clientId) : "consumidor"} onValueChange={v => setClientId(v === "consumidor" ? undefined : Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consumidor">Consumidor Final</SelectItem>
                        {clients?.data.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Frequência</Label>
                    <Select value={frequency} onValueChange={setFrequency}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(FREQUENCY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Dia do mês</Label>
                    <Input type="number" min="1" max="31" value={dayOfMonth} onChange={e => setDayOfMonth(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Próxima emissão</Label>
                    <Input type="date" value={nextRunDate} onChange={e => setNextRunDate(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Retenção na fonte (%)</Label>
                    <Input type="number" min="0" max="100" step="0.1" value={withholding} onChange={e => setWithholding(e.target.value)} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Artigos / Serviços</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addLine} className="gap-1"><Plus className="h-3.5 w-3.5" />Linha</Button>
                  </div>
                  <div className="space-y-2">
                    {lines.map((line, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 items-end border rounded-lg p-2">
                        <div className="col-span-4">
                          <Select value={line.productId ? String(line.productId) : ""} onValueChange={v => selectProduct(i, Number(v))}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Produto..." /></SelectTrigger>
                            <SelectContent>
                              {products?.data.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.code} — {p.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-4">
                          <Input className="h-8 text-xs" placeholder="Descrição *" value={line.description} onChange={e => updateLine(i, "description", e.target.value)} />
                        </div>
                        <div className="col-span-1">
                          <Input className="h-8 text-xs text-right" type="number" min="0.001" step="0.001" value={line.quantity} onChange={e => updateLine(i, "quantity", Number(e.target.value))} />
                        </div>
                        <div className="col-span-1">
                          <Input className="h-8 text-xs text-right" type="number" min="0" step="0.01" value={line.unitPrice} onChange={e => updateLine(i, "unitPrice", Number(e.target.value))} />
                        </div>
                        <div className="col-span-1">
                          <Select value={String(line.vatRate)} onValueChange={v => updateLine(i, "vatRate", Number(v))}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {VAT_RATES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-1 text-right">
                          {lines.length > 1 && (
                            <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => removeLine(i)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreate} disabled={create.isPending || !name}>{create.isPending ? "A criar..." : "Criar regra"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="card-elevated">
        <div className="overflow-x-auto">
          <table className="w-full table-elegant">
            <thead><tr>
              <th className="text-left">Nome</th>
              <th className="text-left">Cliente</th>
              <th className="text-left">Frequência</th>
              <th className="text-left">Próxima emissão</th>
              <th className="text-left">Última execução</th>
              <th className="text-right">Artigos</th>
              <th className="text-center">Estado</th>
              <th className="text-center">Acções</th>
            </tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={8} className="text-center py-10 text-muted-foreground text-sm">A carregar...</td></tr>}
              {!isLoading && rules?.map((r) => (
                <tr key={r.id}>
                  <td>
                    <p className="text-sm font-medium text-foreground">{r.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{DOCUMENT_TYPE_LABELS[r.documentType] ?? r.documentType}</p>
                  </td>
                  <td className="text-sm">{r.clientName ?? "Consumidor Final"}</td>
                  <td className="text-xs text-muted-foreground">{FREQUENCY_LABELS[r.frequency] ?? r.frequency} (dia {r.dayOfMonth})</td>
                  <td className="text-xs text-muted-foreground">{formatDate(r.nextRunDate)}</td>
                  <td className="text-xs text-muted-foreground">
                    {r.lastRunDate ? formatDate(r.lastRunDate) : "—"}
                    {r.lastError && <p className="text-xs text-destructive mt-0.5">{r.lastError}</p>}
                  </td>
                  <td className="text-right text-sm">{Array.isArray(r.items) ? (r.items as any[]).length : 0} itens</td>
                  <td className="text-center">
                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", r.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500")}>
                      {r.isActive ? "Activa" : "Pausada"}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Executar agora" disabled={!r.isActive || runNow.isPending}
                        onClick={() => runNow.mutate({ id: r.id })}>
                        <Play className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title={r.isActive ? "Pausar" : "Activar"}
                        onClick={() => update.mutate({ id: r.id, isActive: !r.isActive })}>
                        {r.isActive ? <Zap className="h-3.5 w-3.5 text-amber-600" /> : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" title="Eliminar"
                        onClick={() => { if (confirm(`Eliminar a regra "${r.name}"?`)) remove.mutate({ id: r.id }); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && rules?.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-muted-foreground text-sm">
                  Nenhuma regra recorrente. Crie a primeira para automatizar facturas.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
