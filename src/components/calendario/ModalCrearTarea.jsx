import { useState } from "react";
import { formatearFecha } from "../../lib/tareasUtils";

const pluralizarDia = (dia) => (dia.endsWith("s") ? dia : `${dia}s`);

function finDeMes(base) {
  return new Date(base.getFullYear(), base.getMonth() + 1, 0);
}

function finDeAnio(base) {
  return new Date(base.getFullYear(), 11, 31);
}

function generarFechas(fechaBase, tipoRepeticion) {
  const base = new Date(`${fechaBase}T00:00:00`);

  if (tipoRepeticion === "unico") return [fechaBase];

  if (tipoRepeticion === "diaria") {
    const fin = finDeMes(base);
    const fechas = [];
    const cursor = new Date(base);
    while (cursor <= fin) {
      fechas.push(formatearFecha(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return fechas;
  }

  const fin = tipoRepeticion === "mensual" ? finDeMes(base) : finDeAnio(base);
  const fechas = [];
  const cursor = new Date(base);
  while (cursor <= fin) {
    fechas.push(formatearFecha(cursor));
    cursor.setDate(cursor.getDate() + 7);
  }
  return fechas;
}

// Modal de creación: se abre al clickear un espacio vacío de un día hábil.
// `empresas` y `empresaIdPorDefecto` habilitan elegir a qué empresa
// pertenece el ticket (por defecto, la empresa que se está viendo).
export function ModalCrearTarea({ fecha, onCerrar, onCrear, empresas = [], empresaIdPorDefecto }) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [empresaId, setEmpresaId] = useState(empresaIdPorDefecto ?? empresas[0]?.id ?? "");
  const [tipoRepeticion, setTipoRepeticion] = useState("unico");
  const [enviando, setEnviando] = useState(false);
  const [errorLocal, setErrorLocal] = useState(null);

  const nombreDia = pluralizarDia(
    new Date(`${fecha}T00:00:00`).toLocaleDateString("es-ES", { weekday: "long" })
  );

  const opcionesRepeticion = [
    { value: "unico", label: "Solo este día" },
    { value: "diaria", label: "Todos los días (resto del mes)" },
    { value: "mensual", label: `Todos los ${nombreDia} de este mes` },
    { value: "anual", label: `Todos los ${nombreDia} del año` },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titulo.trim()) {
      setErrorLocal("El título es obligatorio.");
      return;
    }
    if (!empresaId) {
      setErrorLocal("Elegí una empresa.");
      return;
    }

    setEnviando(true);
    setErrorLocal(null);

    const fechas = generarFechas(fecha, tipoRepeticion);

    for (const fechaVencimiento of fechas) {
      const resultado = await onCrear({
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        prioridad: "media",
        fecha_vencimiento: fechaVencimiento,
        empresa_id: empresaId,
      });

      if (resultado?.error) {
        setEnviando(false);
        setErrorLocal(resultado.error.message ?? "No se pudo crear la tarea.");
        return;
      }
    }

    setEnviando(false);
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
          {empresas.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Empresa</label>
              <select
                value={empresaId}
                onChange={(e) => setEmpresaId(e.target.value)}
                className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
              >
                {empresas.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Fecha</label>
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
            <label className="mb-1 block text-xs font-medium text-slate-600">Repetición</label>
            <select
              value={tipoRepeticion}
              onChange={(e) => setTipoRepeticion(e.target.value)}
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
            >
              {opcionesRepeticion.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
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