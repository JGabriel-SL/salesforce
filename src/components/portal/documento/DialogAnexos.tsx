import { useRef } from "react";
import { Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatBytes, fmtDateTime } from "@/lib/mock";
import type { Documento } from "@/lib/mock";
import { anexarDocumento, dbStore } from "@/lib/stores/db";
import { useUsuario } from "@/lib/stores/sessao";

/* TSIATA — Arquivos Anexados */
export function DialogAnexos({
  doc,
  open,
  onOpenChange,
}: {
  doc: Documento;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const anexados = dbStore.useStore((s) => s.anexados);
  const usuario = useUsuario();
  const fileRef = useRef<HTMLInputElement>(null);
  const docs = anexados.filter((d) => d.nunota === doc.nunota);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((f, i) => {
      const ext = f.name.split(".").pop() || "bin";
      anexarDocumento({
        nunota: doc.nunota,
        sequencia: Date.now() + i,
        nomeArquivo: f.name.replace(`.${ext}`, ""),
        extensao: ext,
        tamanhoBytes: f.size,
        usuario: usuario?.nome ?? "Você",
        dataHora: new Date().toISOString(),
      });
    });
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Documentos anexados</DialogTitle>
          <DialogDescription>
            NUNOTA {doc.nunota} · {doc.parceiro}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-5 transition-colors hover:border-slate-300 hover:bg-slate-50">
          <input ref={fileRef} type="file" multiple onChange={handleUpload} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600"
          >
            <Upload className="h-4 w-4" />
            Clique para selecionar arquivos
          </button>
        </div>

        <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
          {docs.map((d) => (
            <div key={d.sequencia} className="flex items-center justify-between gap-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  {d.extensao}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {d.nomeArquivo}.{d.extensao}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {formatBytes(d.tamanhoBytes)} · {d.usuario} · {fmtDateTime(d.dataHora)}
                  </p>
                </div>
              </div>
              <button className="shrink-0 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50">
                Download
              </button>
            </div>
          ))}
          {docs.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">
              Nenhum documento anexado a este registro.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
