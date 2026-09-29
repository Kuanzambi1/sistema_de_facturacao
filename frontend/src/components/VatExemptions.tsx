import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export function VatExemptions() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const utils = trpc.useUtils();
  
  const { data: exemptions, isLoading } = trpc.vatExemptions.list.useQuery();
  
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [legalBasis, setLegalBasis] = useState("");

  const createExemption = trpc.vatExemptions.create.useMutation({
    onSuccess: () => {
      utils.vatExemptions.list.invalidate();
      setCode("");
      setDescription("");
      setLegalBasis("");
      toast.success("Motivo de isenção adicionado.");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteExemption = trpc.vatExemptions.delete.useMutation({
    onSuccess: () => {
      utils.vatExemptions.list.invalidate();
      toast.success("Motivo de isenção removido.");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="card-elevated max-w-4xl">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Motivos de Isenção (IVA)</h2>
      </div>
      
      {isAdmin && (
        <div className="p-5 border-b border-border bg-muted/20">
          <div className="grid grid-cols-4 gap-4 items-end">
            <div className="space-y-1.5">
              <Label>Código (MXX)</Label>
              <Input value={code} onChange={e => setCode(e.target.value)} placeholder="Ex: M02" />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Descrição</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Transmissões de bens..." />
            </div>
            <div className="space-y-1.5">
              <Label>Base Legal</Label>
              <Input value={legalBasis} onChange={e => setLegalBasis(e.target.value)} placeholder="Art. 12.º do CIVA" />
            </div>
          </div>
          <Button 
            className="mt-4" 
            onClick={() => createExemption.mutate({ code, description, legalBasis })}
            disabled={!code || !description || !legalBasis || createExemption.isPending}
          >
            Adicionar Motivo
          </Button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full table-elegant">
          <thead>
            <tr>
              <th className="text-left w-24">Código</th>
              <th className="text-left">Descrição</th>
              <th className="text-left">Base Legal</th>
              {isAdmin && <th className="text-center w-24">Acções</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} className="text-center py-8">A carregar...</td></tr>
            ) : exemptions?.map((ex) => (
              <tr key={ex.id}>
                <td className="font-medium text-xs">{ex.code}</td>
                <td className="text-sm">{ex.description}</td>
                <td className="text-sm text-muted-foreground">{ex.legalBasis}</td>
                {isAdmin && (
                  <td className="text-center">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => deleteExemption.mutate({ id: ex.id })}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
