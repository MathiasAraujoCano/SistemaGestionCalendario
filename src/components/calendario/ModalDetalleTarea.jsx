import { useEffect, useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { PUNTO_POR_ESTADO, OPCIONES_ESTADO, colorDeEmpresa } from "../../lib/tareasUtils";

export function ModalDetalleTarea({
  tarea,
  onCerrar,
  onCambiarEstado,
  onActualizarMotivo,
  onGuardarMotivo,
  onActualizarTitulo,
  onActualizarEmpresa,
  empresas = [],
}) {
  const [editandoTitulo, setEditandoTitulo] = useState(false);
  const [tituloEditado, setTituloEditado] = useState(tarea.titulo);

  useEffect(() => {
    if (!editandoTitulo) setTituloEditado(tarea.titulo);
  }, [tarea.titulo, editandoTitulo]);

  const colorEmpresa = empresas.length > 0 ? colorDeEmpresa(empresas, tarea.empresa_id) : null;

  const cancelarEdicionTitulo = () => {
    setTituloEditado(tarea.titulo);
    setEditandoTitulo(false);
  };

  const guardarTitulo = () => {
    const valor = tituloEditado.trim();
    if (!valor) {
      cancelarEdicionTitulo();
      return;
    }
    setEditandoTitulo(false);
    if (valor === tarea.titulo) return;
    onActualizarTitulo(tarea.id, valor);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onCerrar}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className={`h-2 w-2 shrink-0 rounded-full ${PUNTO_POR_ESTADO[tarea.estado] ?? "bg-slate-400"}`} />

            {editandoTitulo ? (
              <>
                <input
                  autoFocus
                  value={tituloEditado}
                  onChange={(e) => setTituloEditado(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      guardarTitulo();
                    }
                    if (e.key === "Escape") {
                      e.preventDefault();
                      cancelarEdicionTitulo();
                    }
                  }}
                  className="min-w-0 flex-1 rounded border border-blue-300 px-1.5 py-0.5 text-sm font-semibold text-slate-800 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={guardarTitulo}
                  className="shrink-0 rounded p-1 text-green-600 hover:bg-green-50"
                  aria-label="Guardar título"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={cancelarEdicionTitulo}
                  className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100"
                  aria-label="Cancelar edición"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">
                  {tarea.titulo}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditandoTitulo(true)}
                  className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Editar título"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onCerrar}
            className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 px-4 py-3 text-sm">
          <div>
            <p className="mb-1 text-xs font-medium text-slate-500">Descripción</p>
            <p className="whitespace-pre-wrap text-slate-700">
              {tarea.descripcion?.trim() ? tarea.descripcion : "Sin descripción."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Estado</label>
              <select
                value={tarea.estado}
                onChange={(e) => onCambiarEstado(tarea.id, e.target.value)}
                className="w-full rounded border border-slate-300 px-2 py-1.5 text-xs focus:border-blue-400 focus:outline-none"
              >
                {OPCIONES_ESTADO.map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.label}
                  </option>
                ))}
              </select>
            </div>

            {empresas.length > 0 && (
              <div>
                <label className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-500">
                  {colorEmpresa && <span className={`h-2 w-2 rounded-full ${colorEmpresa.punto}`} />}
                  Empresa
                </label>
                <select
                  value={tarea.empresa_id}
                  onChange={(e) => onActualizarEmpresa(tarea.id, e.target.value)}
                  className="w-full rounded border border-slate-300 px-2 py-1.5 text-xs focus:border-blue-400 focus:outline-none"
                >
                  {empresas.map((empresa) => (
                    <option key={empresa.id} value={empresa.id}>
                      {empresa.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <p className="mb-1 text-xs font-medium text-slate-500">Vencimiento</p>
            <p className="rounded bg-slate-100 px-2 py-1.5 text-xs text-slate-600">
              {tarea.fecha_vencimiento ?? "sin fecha"}
            </p>
          </div>

          {tarea.estado === "pendiente" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Motivo del bloqueo</label>
              <textarea
                value={tarea.motivo_bloqueo ?? ""}
                onChange={(e) => onActualizarMotivo(tarea.id, e.target.value)}
                onBlur={(e) => onGuardarMotivo(tarea.id, e.target.value)}
                rows={2}
                placeholder="Justificá el motivo del bloqueo..."
                className={`w-full resize-none rounded border px-2 py-1.5 text-xs ${
                  tarea.motivo_bloqueo ? "border-slate-300" : "border-red-400"
                }`}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}