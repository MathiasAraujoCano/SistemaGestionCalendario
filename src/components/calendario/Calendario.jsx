import { useState, useMemo, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  compararTareas,
  formatearFecha,
  DIAS_SEMANA_COMPLETA,
  DIAS_HABILES,
} from "../../lib/tareasUtils";
import { 
  generarGrillaMes, 
  obtenerInicioSemana, 
  generarDiasHabiles, 
  formatearRangoSemana, 
  CeldaCalendario,
} from "./helper";
import { ModalCrearTarea } from "./ModalCrearTarea";
import { ModalDetalleTarea } from "./ModalDetalleTarea";


export default function Calendario({
  tareas,
  onDragEnd,
  onCambiarEstado,
  onActualizarMotivo,
  onGuardarMotivo,
  onCrearTarea,
  empresas = [],
  empresaIdPorDefecto = null,
  vistaCombinada = false,
  onActualizarTitulo,
  onActualizarEmpresa,
}) {
  const [fechaRef, setFechaRef] = useState(() => new Date());
  const [vista, setVista] = useState("semana");
  const [idTareaSeleccionada, setIdTareaSeleccionada] = useState(null);
  const [fechaCreacion, setFechaCreacion] = useState(null);
  const arrastrandoRef = useRef(false);
  const ultimoDragEndRef = useRef(0);

  const tareaSeleccionada = tareas.find((t) => t.id === idTareaSeleccionada) ?? null;

  const manejarInicioDrag = () => {
    arrastrandoRef.current = true;
  };

  const manejarFinDrag = (result) => {
    arrastrandoRef.current = false;
    ultimoDragEndRef.current = Date.now();
    onDragEnd(result);
  };

  // Evita que el click "fantasma" que dispara el navegador justo después de
  // soltar un ticket abra el modal de crear tarea.
  const abrirCreacion = (clave) => {
    if (arrastrandoRef.current || Date.now() - ultimoDragEndRef.current < 250) return;
    setFechaCreacion(clave);
  };

  const tareasPorFecha = useMemo(() => {
    const agrupadas = {};
    for (const t of tareas) {
      if (!t.fecha_vencimiento) continue;
      (agrupadas[t.fecha_vencimiento] ??= []).push(t);
    }

    Object.values(agrupadas).forEach((lista) =>
      lista.sort(compararTareas)
      // lista.sort((a, b) => {
      //   const pa = ORDEN_PRIORIDAD[a.prioridad?.toLowerCase()] ?? 99;
      //   const pb = ORDEN_PRIORIDAD[b.prioridad?.toLowerCase()] ?? 99;
      //   if (pa !== pb) return pa - pb;
      //   return (a.titulo ?? "").localeCompare(b.titulo ?? "");
      // })
    );

    return agrupadas;
  }, [tareas]);

  const grillaMes = useMemo(() => generarGrillaMes(fechaRef), [fechaRef]);
  const diasHabiles = useMemo(() => generarDiasHabiles(fechaRef), [fechaRef]);

  const irAnterior = () => {
    setFechaRef((prev) => {
      if (vista === "semana") {
        const d = new Date(prev);
        d.setDate(d.getDate() - 7);
        return d;
      }
      return new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
    });
  };

  const irSiguiente = () => {
    setFechaRef((prev) => {
      if (vista === "semana") {
        const d = new Date(prev);
        d.setDate(d.getDate() + 7);
        return d;
      }
      return new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
    });
  };

  const irHoy = () => setFechaRef(new Date());

  return (
    <div>
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-sm font-semibold capitalize text-slate-700">
              {vista === "semana"
                ? formatearRangoSemana(diasHabiles)
                : fechaRef.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
            </h3>

            <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5">
              <button
                type="button"
                onClick={() => setVista("semana")}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  vista === "semana" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Semana
              </button>
              <button
                type="button"
                onClick={() => setVista("mes")}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  vista === "mes" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Mes
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={irAnterior}
              className="rounded px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
              aria-label="Anterior"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={irHoy}
              className="rounded px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={irSiguiente}
              className="rounded px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
              aria-label="Siguiente"
            >
              ›
            </button>
          </div>
        </div>

        <DragDropContext onDragStart={manejarInicioDrag} onDragEnd={manejarFinDrag}>
          <div
            className={`grid gap-px overflow-hidden rounded-md border border-slate-200 bg-slate-200 ${
              vista === "semana" ? "grid-cols-5" : "grid-cols-7"
            }`}
          >
            {vista === "semana"
              ? diasHabiles.map((fecha, idx) => {
                  const esHoy = formatearFecha(fecha) === formatearFecha(new Date());
                  return (
                    <div
                      key={formatearFecha(fecha)}
                      className={`flex flex-col items-center justify-center py-1.5 bg-slate-50 border-b border-slate-200`}
                    >
                      <span className="text-[10px] font-semibold uppercase text-slate-400 leading-none">
                        {DIAS_HABILES[idx]}
                      </span>
                      <span
                        className={`mt-0.5 text-sm font-bold leading-none flex h-6 w-6 items-center justify-center rounded-full ${
                          esHoy ? "bg-blue-600 text-white shadow-sm" : "text-slate-700"
                        }`}
                      >
                        {fecha.getDate()}
                      </span>
                    </div>
                  );
                })
              : DIAS_SEMANA_COMPLETA.map((dia) => (
                  <div
                    key={dia}
                    className="bg-slate-50 py-2 text-center text-[11px] font-semibold uppercase text-slate-500 border-b border-slate-200"
                  >
                    {dia}
                  </div>
                ))}

            {vista === "semana"
              ? diasHabiles.map((fecha) => (
                  <CeldaCalendario
                    key={formatearFecha(fecha)}
                    fecha={fecha}
                    tareas={tareasPorFecha[formatearFecha(fecha)] ?? []}
                    compacta={false}
                    onAbrirTarea={(t) => setIdTareaSeleccionada(t.id)}
                    onCrearEnFecha={abrirCreacion}
                    ocultarNumero={true}
                    empresas={empresas}
                    mostrarEmpresa={vistaCombinada}
                  />
                ))
              : grillaMes.map((fecha, i) =>
                  fecha ? (
                    <CeldaCalendario
                      key={formatearFecha(fecha)}
                      fecha={fecha}
                      tareas={tareasPorFecha[formatearFecha(fecha)] ?? []}
                      compacta={true}
                      onAbrirTarea={(t) => setIdTareaSeleccionada(t.id)}
                      onCrearEnFecha={abrirCreacion}
                      ocultarNumero={false}
                      empresas={empresas}
                      mostrarEmpresa={vistaCombinada}
                    />
                  ) : (
                    <div key={`vacio-${i}`} className="min-h-[90px] bg-slate-50/50" />
                  )
                )}
          </div>
        </DragDropContext>
      </div>

      {tareaSeleccionada && (
        <ModalDetalleTarea
          tarea={tareaSeleccionada}
          onCerrar={() => setIdTareaSeleccionada(null)}
          onCambiarEstado={onCambiarEstado}
          onActualizarMotivo={onActualizarMotivo}
          onGuardarMotivo={onGuardarMotivo}
          onActualizarTitulo={onActualizarTitulo}
          onActualizarEmpresa={onActualizarEmpresa}
          empresas={empresas}
        />
      )}

      {fechaCreacion && (
        <ModalCrearTarea
          fecha={fechaCreacion}
          onCerrar={() => setFechaCreacion(null)}
          onCrear={onCrearTarea}
          empresas={empresas}
          empresaIdPorDefecto={empresaIdPorDefecto}
        />
      )}
    </div>
  );
}