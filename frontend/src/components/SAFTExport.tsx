import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Download } from "lucide-react";

export function SAFTExport() {
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().substring(0, 10));
  const [dateTo, setDateTo] = useState(new Date().toISOString().substring(0, 10));

  const exportSaft = trpc.reports.exportSaft.useMutation({
    onSuccess: (data) => {
      const blob = new Blob([data.xml], { type: "application/xml" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SAFT_AO_${dateFrom}_${dateTo}.xml`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("SAF-T (AO) gerado com sucesso.");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="card-elevated p-6 max-w-lg">
      <h2 className="text-sm font-semibold text-foreground mb-4">Exportação SAF-T (AO)</h2>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-1.5">
          <Label>Data de Início</Label>
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Data de Fim</Label>
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
      </div>
      <Button 
        onClick={() => exportSaft.mutate({ dateFrom, dateTo })}
        disabled={exportSaft.isPending}
      >
        <Download className="mr-2 h-4 w-4" />
        {exportSaft.isPending ? "A gerar ficheiro XML..." : "Gerar SAF-T"}
      </Button>
    </div>
  );
}
