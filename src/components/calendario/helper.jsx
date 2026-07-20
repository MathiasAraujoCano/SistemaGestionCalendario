import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { 
  formatearFecha, 
  OPCIONES_PRIORIDAD,
  esFinDeSemana, 
  BORDE_POR_ESTADO,
  PUNTO_POR_ESTADO,
  COLUMNAS,
  ORDEN_PRIORIDAD,
  DIAS_SEMANA_COMPLETA,
  DIAS_HABILES,
  OPCIONES_ESTADO
   } from "../../lib/tareasUtils";

// Grilla del mes completo (incluye sábados/domingos), con relleno null para
// completar semanas de 7 días.
export function generarGrillaMes(fechaRef) {
  const anio = fechaRef.getFullYear();
  const mes = fechaRef.getMonth();

  const primerDia = new Date(anio, mes, 1);
  const ultimoDia = new Date(anio, mes + 1, 0);

  const dias = [];
  for (let i = 0; i < primerDia.getDay(); i++) dias.push(null);
  for (let d = 1; d <= ultimoDia.getDate(); d++) dias.push(new Date(anio, mes, d));
  while (dias.length % 7 !== 0) dias.push(null);

  return dias;
}

export function obtenerInicioSemana(fecha) {
  const d = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  d.setDate(d.getDate() - d.getDay());
  return d;
}

// Vista Semanal: semana laboral, solo Lunes a Viernes (5 días).
export function generarDiasHabiles(fechaRef) {
  const inicioDomingo = obtenerInicioSemana(fechaRef);
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(inicioDomingo);
    d.setDate(inicioDomingo.getDate() + 1 + i);
    return d;
  });
}

export function formatearRangoSemana(dias) {
  const inicio = dias[0];
  const fin = dias[dias.length - 1];
  const mismoMes = inicio.getMonth() === fin.getMonth() && inicio.getFullYear() === fin.getFullYear();

  if (mismoMes) {
    const mesYAnio = fin.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
    return `${inicio.getDate()} - ${fin.getDate()} de ${mesYAnio}`;
  }

  const inicioTexto = inicio.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  const finTexto = fin.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
  return `${inicioTexto} - ${finTexto}`;
}

// Celda de un día, compartida por la vista Semana (siempre hábil) y Mes
// (incluye fines de semana). El droppableId es "YYYY-MM-DD" en ambos casos,
// por eso el handleDragEnd centralizado en App.jsx no necesita saber qué
// vista está activa.
export function CeldaCalendario({ fecha, tareas, compacta, onAbrirTarea, onCrearEnFecha }) {
  const clave = formatearFecha(fecha);
  const esHoy = clave === formatearFecha(new Date());
  const finDeSemana = esFinDeSemana(clave);

  return (
    <Droppable droppableId={clave} isDropDisabled={finDeSemana}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          onClick={() => {
            if (!finDeSemana) onCrearEnFecha(clave);
          }}
          className={`flex flex-col gap-1.5 p-1.5 transition-colors ${
            compacta ? "min-h-[90px]" : "min-h-[480px]"
          } ${finDeSemana ? "bg-gray-100" : "bg-white"} ${
            !finDeSemana ? "cursor-pointer hover:bg-slate-50" : ""
          } ${snapshot.isDraggingOver ? "bg-blue-50" : ""}`}
        >
          <span
            className={`w-fit text-[11px] font-medium ${
              esHoy
                ? "flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white"
                : "px-1.5 py-0.5 text-slate-500"
            }`}
          >
            {fecha.getDate()}
          </span>

          <div className="flex-1 space-y-1.5 overflow-y-auto">
            {tareas.map((tarea, index) => (
              <Draggable key={tarea.id} draggableId={String(tarea.id)} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAbrirTarea(tarea);
                    }}
                    title={tarea.titulo}
                    className={`cursor-pointer rounded border-l-2 bg-slate-50 shadow-sm ${
                      BORDE_POR_ESTADO[tarea.estado] ?? "border-slate-400"
                    } ${
                      compacta ? "truncate px-1.5 py-0.5 text-[11px]" : "px-2 py-1.5 text-xs"
                    } ${snapshot.isDragging ? "ring-2 ring-blue-400" : ""}`}
                  >
                    <p className={compacta ? "truncate" : "line-clamp-2 font-medium text-slate-700"}>
                      {tarea.titulo}
                    </p>
                    {!compacta && (
                      <span className="mt-1 inline-block rounded bg-white px-1.5 py-0.5 text-[10px] capitalize text-slate-400">
                        {tarea.prioridad ?? "sin prioridad"}
                      </span>
                    )}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        </div>
      )}
    </Droppable>
  );
}

