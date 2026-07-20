import { useState } from "react";
import { OPCIONES_PRIORIDAD } from "../../lib/tareasUtils";
// Modal de creación: se abre al clickear un espacio vacío de un día hábil.
// La fecha viaja fija (no editable) y el estado inicial siempre es "pendiente".
export function ModalCrearTarea({ fecha, onCerrar, onCrear }) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [prioridad, setPrioridad] = useState("media");
  const [enviando, setEnviando] = useState(false);
  const [errorLocal, setErrorLocal] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titulo.trim()) {
      setErrorLocal("El título es obligatorio.");
      return;
    }

    setEnviando(true);
    setErrorLocal(null);

    const resultado = await onCrear({
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      prioridad,
      fecha_vencimiento: fecha,
    });

    setEnviando(false);

    if (resultado?.error) {
      setErrorLocal(resultado.error.message ?? "No se pudo crear la tarea.");
      return;
    }

    onCerrar();
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
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-800">Nueva tarea</h3>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 px-4 py-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Fecha de vencimiento</label>
            <input
              type="text"
              disabled
              value={new Date(`${fecha}T00:00:00`).toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm capitalize text-slate-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Título</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              autoFocus
              placeholder="Ej: Enviar propuesta al cliente"
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              placeholder="Detalle del ticket (opcional)"
              className="w-full resize-none rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Prioridad</label>
            <select
              value={prioridad}
              onChange={(e) => setPrioridad(e.target.value)}
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm capitalize focus:border-blue-400 focus:outline-none"
            >
              {OPCIONES_PRIORIDAD.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {errorLocal && <p className="text-xs text-red-600">{errorLocal}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCerrar}
              className="rounded px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {enviando ? "Creando..." : "Crear tarea"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}