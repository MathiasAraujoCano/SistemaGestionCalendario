import { useState, useEffect } from "react";
import { ChevronDown, Building2 } from "lucide-react";
import Calendario from "./components/calendario/Calendario";
import TableroKanban from "./components/kanban/TableroKanban";
import HistorialMovimientos from "./components/historial/HistorialMovimiento";
import { supabase } from "./lib/supabaseClient";
import { COLUMNAS, REGEX_FECHA, esFinDeSemana, NAV_ITEMS, TODAS_EMPRESAS } from "./lib/tareasUtils";


export default function App() {
  const [vistaActiva, setVistaActiva] = useState("calendario");
  const [empresas, setEmpresas] = useState([]);
  const [empresaActivaId, setEmpresaActivaId] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [cargandoEmpresas, setCargandoEmpresas] = useState(true);
  const [errorEmpresas, setErrorEmpresas] = useState(null);

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

      let consulta = supabase.from("tareas").select("*");
      if (empresaActivaId !== TODAS_EMPRESAS) {
        consulta = consulta.eq("empresa_id", empresaActivaId);
      }

      const { data, error } = await consulta;

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

  // Actualiza el título de una tarea (edición inline en el modal de detalle).
  const actualizarTituloTarea = async (idTarea, nuevoTitulo) => {
    const tareaAnterior = tareas.find((t) => String(t.id) === String(idTarea));
    if (!tareaAnterior) return;

    setTareas((prev) =>
      prev.map((t) => (String(t.id) === String(idTarea) ? { ...t, titulo: nuevoTitulo } : t))
    );

    const { error } = await supabase.from("tareas").update({ titulo: nuevoTitulo }).eq("id", tareaAnterior.id);

    if (error) {
      setErrorTareas(error.message);
      setTareas((prev) => prev.map((t) => (String(t.id) === String(idTarea) ? tareaAnterior : t)));
    }
  };

  // Cambia la empresa de una tarea. Si la vista actual está filtrada por una
  // sola empresa y la tarea pasa a otra, deja de pertenecer a esta vista y se
  // saca de la lista local (el modal de detalle se cierra solo porque
  // Calendario ya no la encuentra por id).
  const actualizarEmpresaTarea = async (idTarea, nuevaEmpresaId) => {
    const tareaAnterior = tareas.find((t) => String(t.id) === String(idTarea));
    if (!tareaAnterior) return;

    const seguiraVisible = empresaActivaId === TODAS_EMPRESAS || nuevaEmpresaId === empresaActivaId;

    setTareas((prev) =>
      seguiraVisible
        ? prev.map((t) => (String(t.id) === String(idTarea) ? { ...t, empresa_id: nuevaEmpresaId } : t))
        : prev.filter((t) => String(t.id) !== String(idTarea))
    );

    const { error } = await supabase
      .from("tareas")
      .update({ empresa_id: nuevaEmpresaId })
      .eq("id", tareaAnterior.id);

    if (error) {
      setErrorTareas(error.message);
      setTareas((prev) => {
        const yaEsta = prev.some((t) => String(t.id) === String(idTarea));
        return yaEsta
          ? prev.map((t) => (String(t.id) === String(idTarea) ? tareaAnterior : t))
          : [...prev, tareaAnterior];
      });
    }
  };

  // Crea una tarea desde el formulario del Calendario. `empresa_id` llega
  // elegido desde el modal; si por algo no llega, cae a la empresa activa
  // (salvo que estemos en "todas las empresas", donde es obligatorio elegir).
  const crearTarea = async ({ titulo, descripcion, prioridad, fecha_vencimiento, empresa_id }) => {
    const empresaDestino = empresa_id ?? (empresaActivaId !== TODAS_EMPRESAS ? empresaActivaId : null);

    if (!empresaDestino) {
      return { error: { message: "Elegí una empresa para el ticket." } };
    }

    // Solo la agregamos al estado local si pertenece a lo que se está
    // mostrando ahora mismo (vista combinada, o misma empresa activa).
    const perteneceAVistaActual = empresaActivaId === TODAS_EMPRESAS || empresaDestino === empresaActivaId;

    const idTemporal = `temp-${Date.now()}`;
    const tareaOptimista = {
      id: idTemporal,
      empresa_id: empresaDestino,
      titulo,
      descripcion,
      prioridad,
      estado: "pendiente",
      motivo_bloqueo: null,
      fecha_vencimiento,
    };

    if (perteneceAVistaActual) setTareas((prev) => [...prev, tareaOptimista]);

    const { data, error } = await supabase
      .from("tareas")
      .insert({
        empresa_id: empresaDestino,
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
      if (perteneceAVistaActual) setTareas((prev) => prev.filter((t) => t.id !== idTemporal));
      return { error };
    }

    if (perteneceAVistaActual) {
      setTareas((prev) => prev.map((t) => (t.id === idTemporal ? data : t)));
    }
    return { data };
  };

  return (
    <div className="flex h-screen w-full bg-gray-50 text-gray-800">
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

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
          <h1 className="text-base font-semibold text-gray-900 capitalize">
            {vistaActiva}
          </h1>

          <div className="relative">
            <button
              onClick={() => setMenuAbierto((v) => !v)}
              disabled={cargandoEmpresas || empresas.length === 0}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Building2 className="h-4 w-4 text-gray-500" />
              {cargandoEmpresas
                ? "Cargando..."
                : empresaActivaId === TODAS_EMPRESAS
                  ? "Todas las empresas"
                  : empresaActiva?.nombre ?? "Sin empresas"}
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>

            {menuAbierto && (
              <div className="absolute right-0 z-10 mt-2 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                <button
                  onClick={() => {
                    setEmpresaActivaId(TODAS_EMPRESAS);
                    setMenuAbierto(false);
                  }}
                  className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                    empresaActivaId === TODAS_EMPRESAS ? "font-medium text-indigo-700" : "text-gray-700"
                  }`}
                >
                  Todas las empresas
                </button>
                <div className="my-1 border-t border-gray-100" />
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
                    empresas={empresas}
                    empresaIdPorDefecto={
                      empresaActivaId === TODAS_EMPRESAS ? empresas[0]?.id ?? null : empresaActivaId
                    }
                    vistaCombinada={empresaActivaId === TODAS_EMPRESAS}
                    onActualizarTitulo={actualizarTituloTarea}
                    onActualizarEmpresa={actualizarEmpresaTarea}
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