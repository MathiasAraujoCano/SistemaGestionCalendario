import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { COLUMNAS } from "../../lib/tareasUtils";

// Componente controlado: ya no gestiona su propio fetch de Supabase ni
// handleDragEnd. "tareas" es la misma lista que consume Calendario.jsx,
// ambos viven de la fuente de verdad centralizada en App.jsx.
export default function TableroKanban({ tareas, onDragEnd, onActualizarMotivo, onGuardarMotivo }) {
  const tareasPorColumna = COLUMNAS.reduce((acc, col) => {
    acc[col.id] = tareas.filter((t) => t.estado === col.id);
    return acc;
  }, {});

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {COLUMNAS.map((col) => (
          <div key={col.id} className={`rounded-lg border ${col.color} p-2`}>
            <h3 className="mb-2 px-1 text-sm font-semibold text-slate-700">
              {col.titulo} ({tareasPorColumna[col.id]?.length ?? 0})
            </h3>

            <Droppable droppableId={col.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`min-h-[120px] space-y-2 rounded-md p-1 transition-colors ${
                    snapshot.isDraggingOver ? "bg-slate-200/60" : ""
                  }`}
                >
                  {(tareasPorColumna[col.id] ?? []).map((tarea, index) => (
                    <Draggable key={tarea.id} draggableId={String(tarea.id)} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`rounded-md border border-slate-200 bg-white p-2 shadow-sm ${
                            snapshot.isDragging ? "ring-2 ring-blue-400" : ""
                          }`}
                        >
                          <p className="text-sm text-slate-800">{tarea.titulo}</p>

                          {tarea.fecha_vencimiento && (
                            <p className="mt-1 text-[11px] text-slate-400">
                              Vence: {tarea.fecha_vencimiento}
                            </p>
                          )}

                          {tarea.estado === "pendiente" && (
                            <textarea
                              value={tarea.motivo_bloqueo ?? ""}
                              onChange={(e) => onActualizarMotivo(tarea.id, e.target.value)}
                              onBlur={(e) => onGuardarMotivo(tarea.id, e.target.value)}
                              placeholder="Justificá el motivo del bloqueo..."
                              rows={2}
                              className={`mt-2 w-full resize-none rounded border px-2 py-1 text-xs ${
                                tarea.motivo_bloqueo ? "border-slate-300" : "border-red-400"
                              }`}
                            />
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
