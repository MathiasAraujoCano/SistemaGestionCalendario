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

export const COLORES_FIJOS = {
  azul: { punto: "bg-blue-500", texto: "text-blue-700", chip: "bg-blue-50" },
  rosado: { punto: "bg-pink-500", texto: "text-pink-700", chip: "bg-pink-50" },
};

export const COLOR_POR_EMPRESA = {
  "Jysk": "azul",
  "Kiko": "rosado",
};

const ORDEN_COLOR_POR_DEFECTO = ["azul", "rosado"];

export function colorDeEmpresa(empresas, empresaId) {
  const empresa = empresas.find((e) => e.id === empresaId);
  if (!empresa) return COLORES_FIJOS.azul;

  const asignado = COLOR_POR_EMPRESA[empresa.nombre];
  if (asignado) return COLORES_FIJOS[asignado];

  // Sin asignación manual: por orden (alfabético, tal como se cargan),
  // la primera empresa es azul y la segunda naranja.
  const idx = empresas.findIndex((e) => e.id === empresaId);
  const clave = ORDEN_COLOR_POR_DEFECTO[idx % ORDEN_COLOR_POR_DEFECTO.length];
  return COLORES_FIJOS[clave];
}

// Orden de despliegue dentro de un mismo día: las tareas finalizadas
// siempre van al final. Dentro de cada grupo (finalizadas / no finalizadas)
// respeta el orden manual (arrastrar y soltar, guardado en "orden") y, si
// coincide, ordena alfabéticamente como último criterio.
export function compararTareas(a, b) {
  const finalizadoA = a.estado === "finalizado" ? 1 : 0;
  const finalizadoB = b.estado === "finalizado" ? 1 : 0;
  if (finalizadoA !== finalizadoB) return finalizadoA - finalizadoB;

  const ordenA = a.orden ?? 0;
  const ordenB = b.orden ?? 0;
  if (ordenA !== ordenB) return ordenA - ordenB;

  return (a.titulo ?? "").localeCompare(b.titulo ?? "");
}

// Última fecha hasta la que se generan tareas recurrentes.
// Fija en 2027 para cubrir tareas futuras sin tener que retocar esto cada año.
export const FIN_RECURRENCIA = new Date(2027, 11, 31);

// Si la fecha cae sábado o domingo, la retrocede al viernes hábil más cercano.
export function ajustarADiaHabilAnterior(fecha) {
  const d = new Date(fecha);
  const dia = d.getDay();
  if (dia === 6) d.setDate(d.getDate() - 1); // sábado -> viernes
  else if (dia === 0) d.setDate(d.getDate() - 2); // domingo -> viernes
  return d;
}