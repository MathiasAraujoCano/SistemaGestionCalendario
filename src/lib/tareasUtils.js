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

export const REGEX_FECHA = /^\d{4}-\d{2}-\d{2}$/;

// Sentinel usado en el selector de empresa para representar "ver todas".
// Compartido entre App.jsx e HistorialMovimiento.jsx para que ambos filtren
// (o dejen de filtrar) exactamente en el mismo caso.
export const TODAS_EMPRESAS = "todas";

export function formatearFecha(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

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

// Paleta fija para distinguir empresas en vistas combinadas (calendario e
// historial). El color se asigna por posición en la lista de empresas
// (orden alfabético por nombre, tal como se cargan desde Supabase).
export const PALETA_COLORES_EMPRESA = [
  { punto: "bg-indigo-500", texto: "text-indigo-700", chip: "bg-indigo-50" },
  { punto: "bg-amber-500", texto: "text-amber-700", chip: "bg-amber-50" },
  { punto: "bg-emerald-500", texto: "text-emerald-700", chip: "bg-emerald-50" },
  { punto: "bg-rose-500", texto: "text-rose-700", chip: "bg-rose-50" },
];

export function colorDeEmpresa(empresas, empresaId) {
  const idx = empresas.findIndex((e) => e.id === empresaId);
  return PALETA_COLORES_EMPRESA[idx === -1 ? 0 : idx % PALETA_COLORES_EMPRESA.length];
}