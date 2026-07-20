// Utilidades y constantes compartidas entre App.jsx, TableroKanban.jsx y
// Calendario.jsx, para que ambas vistas (y las mutaciones en App.jsx) usen
// exactamente las mismas definiciones de estado, colores y formato de fecha.
import { LayoutGrid, History, CalendarDays } from "lucide-react";

export const COLUMNAS = [
  { id: "tarea", titulo: "Tareas", color: "bg-slate-100 border-slate-300" },
  { id: "pendiente", titulo: "Pendientes", color: "bg-red-50 border-red-300" },
  { id: "finalizado", titulo: "Finalizados", color: "bg-green-50 border-green-300" },
];

export const BORDE_POR_ESTADO = {
  tarea: "border-slate-400",
  pendiente: "border-red-400",
  finalizado: "border-green-400",
};

export const PUNTO_POR_ESTADO = {
  tarea: "bg-slate-400",
  pendiente: "bg-red-400",
  finalizado: "bg-green-400",
};

export const NAV_ITEMS = [
  { key: "calendario", label: "Calendario", icon: CalendarDays },
  { key: "tablero", label: "Tablero", icon: LayoutGrid },
  { key: "historial", label: "Historial", icon: History },
];

export const ORDEN_PRIORIDAD = { alta: 0, media: 1, baja: 2 };

// Formato usado por los droppableId de fecha en el calendario ("YYYY-MM-DD").
export const REGEX_FECHA = /^\d{4}-\d{2}-\d{2}$/;

// Formatea una fecha local como "YYYY-MM-DD" evitando el corrimiento de día
// que provoca toISOString() al convertir a UTC.
export function formatearFecha(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Recibe una fecha "YYYY-MM-DD" (mismo formato que fecha_vencimiento y que
// los droppableId del calendario) y determina si cae en sábado o domingo.
export function esFinDeSemana(fechaStr) {
  const dia = new Date(`${fechaStr}T00:00:00`).getDay();
  return dia === 0 || dia === 6;
}

export const DIAS_SEMANA_COMPLETA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
export const DIAS_HABILES = ["Lun", "Mar", "Mié", "Jue", "Vie"];
export const OPCIONES_PRIORIDAD = ["baja", "media", "alta"];

export const OPCIONES_ESTADO = [
  { id: "tarea", label: "Tarea" },
  { id: "pendiente", label: "Pendiente" },
  { id: "finalizado", label: "Finalizado" },
];