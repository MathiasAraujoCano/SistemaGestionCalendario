import { useState, useEffect } from "react";
import { ChevronDown, Building2 } from "lucide-react";
import Calendario from "./components/calendario/Calendario";
import TableroKanban from "./components/kanban/TableroKanban";
import HistorialMovimientos from "./components/historial/HistorialMovimiento";
import { supabase } from "./lib/SupabaseClient";
import { COLUMNAS, REGEX_FECHA, esFinDeSemana, NAV_ITEMS } from "./lib/tareasUtils";


export default function App() {
  const [vistaActiva, setVistaActiva] = useState("calendario");
  const [empresas, setEmpresas] = useState([]);
  const [empresaActivaId, setEmpresaActivaId] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [cargandoEmpresas, setCargandoEmpresas] = useState(true);
  const [errorEmpresas, setErrorEmpresas] = useState(null);

  // --- Fuente de verdad única de "tareas", compartida por Calendario y Tablero ---
  const [tareas, setTareas] = useState([]);
  const [cargandoTareas, setCargandoTareas] = useState(true);
  const [errorTareas, setErrorTareas] = useState(null);

  useEffect(() => {
    let activo = true;

    async function cargarEmpresas() {
      setCargandoEmpresas(true);
      const { data, error } = await supabase
        .from("empresas")
        .select("*")
        .order("nombre", { ascending: true });

      if (!activo) return;

      if (error) {
        setErrorEmpresas(error.message);
      } else {
        setEmpresas(data ?? []);
        if (data && data.length > 0) {
          setEmpresaActivaId(data[0].id);
        }
      }
      setCargandoEmpresas(false);
    }

    cargarEmpresas();

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (!empresaActivaId) return;

    let activo = true;

    async function cargarTareas() {
      setCargandoTareas(true);
      setErrorTareas(null);

      const { data, error } = await supabase
        .from("tareas")
        .select("*")
        .eq("empresa_id", empresaActivaId);

      if (!activo) return;

      if (error) {
        setErrorTareas(error.message);
      } else {
        setTareas(data ?? []);
      }
      setCargandoTareas(false);
    }

    cargarTareas();

    return () => {
      activo = false;
    };
  }, [empresaActivaId]);

  const empresaActiva = empresas.find((e) => e.id === empresaActivaId);

  // --- Mutaciones compartidas sobre "tareas" ---
  // Las usan tanto el drag-and-drop (Tablero y Calendario) como el modal de
  // detalle y el formulario de creación del Calendario.

  const actualizarEstadoTarea = async (idTarea, nuevoEstado) => {
    const tareaAnterior = tareas.find((t) => String(t.id) === String(idTarea));
    if (!tareaAnterior) return;

    const nuevoMotivo = nuevoEstado === "pendiente" ? (tareaAnterior.motivo_bloqueo ?? "") : null;

    setTareas((prev) =>
      prev.map((t) =>
        String(t.id) === String(idTarea) ? { ...t, estado: nuevoEstado, motivo_bloqueo: nuevoMotivo } : t
      )
    );

    const { error } = await supabase
      .from("tareas")
      .update({ estado: nuevoEstado, motivo_bloqueo: nuevoMotivo })
      .eq("id", tareaAnterior.id);

    if (error) {
      setErrorTareas(error.message);
      setTareas((prev) => prev.map((t) => (String(t.id) === String(idTarea) ? tareaAnterior : t)));
    }
  };

  const actualizarFechaTarea = async (idTarea, nuevaFecha) => {
    const tareaAnterior = tareas.find((t) => String(t.id) === String(idTarea));
    if (!tareaAnterior) return;

    setTareas((prev) =>
      prev.map((t) => (String(t.id) === String(idTarea) ? { ...t, fecha_vencimiento: nuevaFecha } : t))
    );

    const { error } = await supabase
      .from("tareas")
      .update({ fecha_vencimiento: nuevaFecha })
      .eq("id", tareaAnterior.id);

    if (error) {
      setErrorTareas(error.message);
      setTareas((prev) => prev.map((t) => (String(t.id) === String(idTarea) ? tareaAnterior : t)));
    }
  };

  // Único handleDragEnd para el Tablero y el Calendario (Semana o Mes): el
  // droppableId de destino define la mutación.
  // - id de columna del Kanban ("pendiente", "en_progreso", ...) -> cambia estado
  // - fecha "YYYY-MM-DD" (mismo formato en ambas vistas del calendario) -> cambia fecha_vencimiento
  // - fecha que cae en sábado/domingo -> se cancela de forma optimista, sin tocar Supabase
  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const esColumnaDestino = COLUMNAS.some((c) => c.id === destination.droppableId);
    const esFechaDestino = REGEX_FECHA.test(destination.droppableId);

    if (esColumnaDestino) {
      actualizarEstadoTarea(draggableId, destination.droppableId);
      return;
    }

    if (esFechaDestino) {
      if (esFinDeSemana(destination.droppableId)) return;
      actualizarFechaTarea(draggableId, destination.droppableId);
    }
  };

  const actualizarMotivoLocal = (id, motivo) => {
    setTareas((prev) => prev.map((t) => (t.id === id ? { ...t, motivo_bloqueo: motivo } : t)));
  };

  const guardarMotivo = async (id, motivo) => {
    const { error } = await supabase.from("tareas").update({ motivo_bloqueo: motivo }).eq("id", id);
    if (error) setErrorTareas(error.message);
  };

  // Crea una tarea desde el formulario del Calendario (día hábil vacío).
  // Optimista: la agrega a la lista con un id temporal y la reemplaza por el
  // registro real cuando Supabase confirma. Si falla, la retira y devuelve
  // el error para que el modal lo muestre sin cerrarse.
  const crearTarea = async ({ titulo, descripcion, prioridad, fecha_vencimiento }) => {
    if (!empresaActivaId) {
      return { error: { message: "No hay una empresa activa seleccionada." } };
    }

    const idTemporal = `temp-${Date.now()}`;
    const tareaOptimista = {
      id: idTemporal,
      empresa_id: empresaActivaId,
      titulo,
      descripcion,
      prioridad,
      estado: "pendiente",
      motivo_bloqueo: null,
      fecha_vencimiento,
    };

    setTareas((prev) => [...prev, tareaOptimista]);

    const { data, error } = await supabase
      .from("tareas")
      .insert({
        empresa_id: empresaActivaId,
        titulo,
        descripcion,
        prioridad,
        estado: "pendiente",
        fecha_vencimiento,
      })
      .select()
      .single();

    if (error) {
      setErrorTareas(error.message);
      setTareas((prev) => prev.filter((t) => t.id !== idTemporal));
      return { error };
    }

    setTareas((prev) => prev.map((t) => (t.id === idTemporal ? data : t)));
    return { data };
  };

  return (
    <div className="flex h-screen w-full bg-gray-50 text-gray-800">
      {/* Sidebar */}
      <aside className="flex w-56 flex-col border-r border-gray-200 bg-white">
        <div className="flex h-16 items-center px-5 text-lg font-semibold text-gray-900">
          Gestión
        </div>
        <nav className="flex flex-col gap-1 px-3">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setVistaActiva(key)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                vistaActiva === key
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Contenido principal */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
          <h1 className="text-base font-semibold text-gray-900 capitalize">
            {vistaActiva}
          </h1>

          {/* Selector de Empresa Activa */}
          <div className="relative">
            <button
              onClick={() => setMenuAbierto((v) => !v)}
              disabled={cargandoEmpresas || empresas.length === 0}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Building2 className="h-4 w-4 text-gray-500" />
              {cargandoEmpresas
                ? "Cargando..."
                : empresaActiva?.nombre ?? "Sin empresas"}
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>

            {menuAbierto && (
              <div className="absolute right-0 z-10 mt-2 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                {empresas.map((empresa) => (
                  <button
                    key={empresa.id}
                    onClick={() => {
                      setEmpresaActivaId(empresa.id);
                      setMenuAbierto(false);
                    }}
                    className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                      empresa.id === empresaActivaId
                        ? "font-medium text-indigo-700"
                        : "text-gray-700"
                    }`}
                  >
                    {empresa.nombre}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Área de contenido según vista */}
        <main className="flex-1 overflow-auto p-6">
          {errorEmpresas && (
            <div className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              Error al cargar empresas: {errorEmpresas}
            </div>
          )}
          {errorTareas && (
            <div className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              Error al sincronizar tareas: {errorTareas}
            </div>
          )}

          {vistaActiva === "historial" && (
            <HistorialMovimientos empresaId={empresaActivaId} />
          )}

          {vistaActiva !== "historial" &&
            (cargandoTareas || !empresaActivaId ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                {empresaActivaId ? "Cargando tareas..." : "Seleccioná una empresa para comenzar."}
              </div>
            ) : (
              <>
                {vistaActiva === "calendario" && (
                  <Calendario
                    tareas={tareas}
                    onDragEnd={handleDragEnd}
                    onCambiarEstado={actualizarEstadoTarea}
                    onActualizarMotivo={actualizarMotivoLocal}
                    onGuardarMotivo={guardarMotivo}
                    onCrearTarea={crearTarea}
                  />
                )}
                {vistaActiva === "tablero" && (
                  <TableroKanban
                    tareas={tareas}
                    onDragEnd={handleDragEnd}
                    onActualizarMotivo={actualizarMotivoLocal}
                    onGuardarMotivo={guardarMotivo}
                  />
                )}
              </>
            ))}
        </main>
      </div>
    </div>
  );
}
