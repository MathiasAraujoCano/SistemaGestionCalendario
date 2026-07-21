import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { 
  formatearFecha, 
  esFinDeSemana, 
  BORDE_POR_ESTADO,
  colorDeEmpresa,
   } from "../../lib/tareasUtils";

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

// `ocultarNumero`: en la vista Semana el encabezado ya muestra el número del
// día junto a la abreviación (Lun, Mar...), así que acá adentro no hace
// falta repetirlo. En la vista Mes sí hace falta, porque es la única
// referencia al número de cada celda.
export function CeldaCalendario({
  fecha,
  tareas,
  compacta,
  onAbrirTarea,
  onCrearEnFecha,
  ocultarNumero = false,
  empresas = [],
  mostrarEmpresa = false,
}) {
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
          {!ocultarNumero && (
            <span
              className={`w-fit text-[11px] font-medium ${
                esHoy
                  ? "flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white"
                  : "px-1.5 py-0.5 text-slate-500"
              }`}
            >
              {fecha.getDate()}
            </span>
          )}

          <div className="flex-1 space-y-1.5 overflow-y-auto">
            {tareas.map((tarea, index) => {
              const colorEmpresa = mostrarEmpresa ? colorDeEmpresa(empresas, tarea.empresa_id) : null;

              const partesTooltip = [tarea.titulo];
              if (tarea.descripcion?.trim()) partesTooltip.push(tarea.descripcion.trim());
              if (mostrarEmpresa) {
                const nombreEmpresa = empresas.find((e) => e.id === tarea.empresa_id)?.nombre;
                if (nombreEmpresa) partesTooltip.push(nombreEmpresa);
              }

              return (
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
                      title={partesTooltip.join("\n\n")}
                      className={`cursor-pointer rounded border-l-2 shadow-sm ${
                        BORDE_POR_ESTADO[tarea.estado] ?? "border-slate-400"
                      } ${colorEmpresa ? colorEmpresa.chip : "bg-slate-50"} ${
                        compacta ? "truncate px-1.5 py-0.5 text-[11px]" : "px-2 py-1.5 text-xs"
                      } ${snapshot.isDragging ? "ring-2 ring-blue-400" : ""}`}
                    >
                      <div className="flex items-center gap-1">
                        {colorEmpresa && (
                          <span className={`h-2 w-2 shrink-0 rounded-full ${colorEmpresa.punto}`} />
                        )}
                        <p className={`${compacta ? "truncate" : "line-clamp-2 font-medium text-slate-700"} ${
                          tarea.estado === "finalizado" ? "text-slate-400 line-through" : ""
                        }`}>
                          {tarea.titulo}
                        </p>
                      </div>
                    </div>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </div>
        </div>
      )}
    </Droppable>
  );
}