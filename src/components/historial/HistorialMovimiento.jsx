import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { TODAS_EMPRESAS, colorDeEmpresa } from '../../lib/tareasUtils';

const ESTADOS = {
  tareas: { label: 'Tarea', dot: 'bg-gray-400', bg: 'bg-gray-100', text: 'text-gray-700' },
  finalizado: { label: 'Finalizado', dot: 'bg-green-500', bg: 'bg-green-100', text: 'text-green-700' },
  pendiente: { label: 'Pendiente', dot: 'bg-red-500', bg: 'bg-red-100', text: 'text-red-700' },
};

function getEstadoInfo(estado) {
  return (
    ESTADOS[estado] || {
      label: estado || 'Desconocido',
      dot: 'bg-gray-400',
      bg: 'bg-gray-100',
      text: 'text-gray-700',
    }
  );
}

function formatFecha(fechaISO) {
  const fecha = new Date(fechaISO);
  const ahora = new Date();
  const diffMin = Math.floor((ahora - fecha) / 60000);
  const diffDias = Math.floor(diffMin / 1440);
  const hora = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  if (diffMin < 1) return 'Justo ahora';
  if (diffMin < 60) return `Hace ${diffMin} min · ${hora}`;
  if (fecha.toDateString() === ahora.toDateString()) return `Hoy, ${hora}`;

  const ayer = new Date(ahora);
  ayer.setDate(ahora.getDate() - 1);
  if (fecha.toDateString() === ayer.toDateString()) return `Ayer, ${hora}`;

  if (diffDias < 7) {
    const dia = fecha.toLocaleDateString('es-AR', { weekday: 'long' });
    return `${dia.charAt(0).toUpperCase() + dia.slice(1)}, ${hora}`;
  }

  return `${fecha.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}, ${hora}`;
}

function formatDuracion(segundos) {
  if (segundos === null || segundos === undefined) return null;

  if (segundos < 60) return 'Unos instantes';

  if (segundos < 3600) {
    const minutos = Math.floor(segundos / 60);
    return `${minutos} min`;
  }

  if (segundos < 86400) {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    return `${horas} hs ${minutos} min`;
  }

  const dias = Math.floor(segundos / 86400);
  const horas = Math.floor((segundos % 86400) / 3600);
  return `${dias} ${dias === 1 ? 'día' : 'días'}, ${horas} hs`;
}

export default function HistorialMovimientos({ empresaId, empresas = [] }) {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const vistaCombinada = empresaId === TODAS_EMPRESAS;

  useEffect(() => {
    if (!empresaId) {
      setMovimientos([]);
      setLoading(false);
      return;
    }

    let activo = true;

    async function fetchHistorial() {
      setLoading(true);
      setError(null);

      let consulta = supabase
        .from('historial_auditoria')
        .select('*')
        .eq('tabla_afectada', 'tareas')
        .order('created_at', { ascending: false });

      if (empresaId !== TODAS_EMPRESAS) {
        consulta = consulta.eq('empresa_id', empresaId);
      }

      const { data, error: fetchError } = await consulta;

      if (!activo) return;

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      const eventos = (data || [])
        .map((registro) => {
          const anterior = registro.datos_anteriores;
          const nuevo = registro.datos_nuevos || {};

          return {
            id: registro.id,
            empresaIdOrigen: registro.empresa_id,
            titulo: nuevo.titulo || anterior?.titulo || 'Tarea sin título',
            estadoAnterior: anterior?.estado ?? null,
            estadoNuevo: nuevo.estado ?? null,
            duracionSegundos: registro.duracion_segundos,
            createdAt: registro.created_at,
            esCreacion: !anterior,
          };
        })
        .filter((ev) => ev.esCreacion || (ev.estadoAnterior && ev.estadoNuevo && ev.estadoAnterior !== ev.estadoNuevo));

      setMovimientos(eventos);
      setLoading(false);
    }

    fetchHistorial();

    return () => {
      activo = false;
    };
  }, [empresaId]);

  if (loading) {
    return <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Cargando historial...</div>;
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
        Error al cargar el historial: {error}
      </div>
    );
  }

  if (movimientos.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
        {vistaCombinada
          ? 'Todavía no hay movimientos registrados.'
          : 'Todavía no hay movimientos registrados para esta empresa.'}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-6">Historial de movimientos</h2>

      <ol className="relative border-l-2 border-gray-200 ml-3">
        {movimientos.map((mov) => {
          const estadoNuevoInfo = getEstadoInfo(mov.estadoNuevo);
          const estadoAnteriorInfo = mov.estadoAnterior ? getEstadoInfo(mov.estadoAnterior) : null;
          const duracion = formatDuracion(mov.duracionSegundos);
          const colorEmpresa = vistaCombinada ? colorDeEmpresa(empresas, mov.empresaIdOrigen) : null;
          const nombreEmpresa = vistaCombinada
            ? empresas.find((e) => e.id === mov.empresaIdOrigen)?.nombre ?? 'Empresa'
            : null;

          return (
            <li key={mov.id} className="mb-6 ml-6 last:mb-0">
              <span
                className={`absolute -left-[9px] flex h-4 w-4 rounded-full ring-4 ring-white ${estadoNuevoInfo.dot}`}
              />

              <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-sm font-medium text-gray-900">{mov.titulo}</p>
                  {colorEmpresa && (
                    <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${colorEmpresa.chip} ${colorEmpresa.texto}`}>
                      {nombreEmpresa}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {estadoAnteriorInfo && (
                    <>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${estadoAnteriorInfo.bg} ${estadoAnteriorInfo.text}`}>
                        {estadoAnteriorInfo.label}
                      </span>
                      <span className="text-gray-400 text-xs">→</span>
                    </>
                  )}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${estadoNuevoInfo.bg} ${estadoNuevoInfo.text}`}>
                    {estadoNuevoInfo.label}
                  </span>
                  {!estadoAnteriorInfo && (
                    <span className="text-xs text-gray-400">(tarea creada)</span>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <p className="text-xs text-gray-400">{formatFecha(mov.createdAt)}</p>
                  {duracion && (
                    <p className="text-xs text-gray-400">· estuvo {duracion} en el estado anterior</p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}