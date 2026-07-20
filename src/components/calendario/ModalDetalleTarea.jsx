import { PUNTO_POR_ESTADO, OPCIONES_ESTADO } from "../../lib/tareasUtils";

// Modal de detalle: se abre al clickear una tarea. Permite leer la
// descripción completa y cambiar el estado (mueve la tarjeta de columna
// en el Tablero automáticamente, porque comparten la misma fuente de datos).
export function ModalDetalleTarea({ tarea, onCerrar, onCambiarEstado, onActualizarMotivo, onGuardarMotivo }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onCerrar}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h3 className="flex min-w-0 items-center gap-2 truncate pr-2 text-sm font-semibold text-slate-800">
            <span className={`h-2 w-2 shrink-0 rounded-full ${PUNTO_POR_ESTADO[tarea.estado] ?? "bg-slate-400"}`} />
            <span className="truncate">{tarea.titulo}</span>
          </h3>
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

            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">Prioridad</p>
              <p className="rounded bg-slate-100 px-2 py-1.5 text-xs capitalize text-slate-600">
                {tarea.prioridad ?? "sin definir"}
              </p>
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs font-medium text-slate-500">Vencimiento</p>
            <p className="text-xs text-slate-600">{tarea.fecha_vencimiento ?? "sin fecha"}</p>
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