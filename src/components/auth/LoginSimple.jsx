import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/login-simple`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export default function LoginSimple() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmando, setConfirmando] = useState(false);

  async function pedirCodigo(confirmar) {
    const res = await fetch(FN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({ email, confirmar }),
    });
    const payload = await res.json();
    console.log("respuesta de login-simple:", res.status, payload);
    return { res, payload };
  }

  async function canjearCodigo(otp) {
    const { error: otpError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });
    if (otpError) throw otpError;
    // No hace falta hacer nada más: App.jsx escucha onAuthStateChange
    // y va a renderizar la vista principal solo.
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { res, payload } = await pedirCodigo(false);

      if (payload.needsConfirmation) {
        // Email nuevo: no seguimos hasta que el usuario confirme que
        // quiere crear la cuenta (evita que un typo cree una al pedo).
        setConfirmando(true);
        return;
      }

      if (!res.ok || payload.error || !payload.email_otp) {
        throw new Error(payload.error ?? `Respuesta inesperada (status ${res.status}): ${JSON.stringify(payload)}`);
      }

      await canjearCodigo(payload.email_otp);
    } catch (err) {
      setError(err.message ?? "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  async function confirmarCreacion() {
    setConfirmando(false);
    setLoading(true);
    setError(null);

    try {
      const { res, payload } = await pedirCodigo(true);
      if (!res.ok || payload.error || !payload.email_otp) {
        throw new Error(payload.error ?? `Respuesta inesperada (status ${res.status}): ${JSON.stringify(payload)}`);
      }
      await canjearCodigo(payload.email_otp);
    } catch (err) {
      setError(err.message ?? "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-3 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h1 className="text-lg font-semibold text-gray-900">Gestión</h1>
        <p className="text-sm text-gray-500">Ingresá tu email para entrar.</p>

        <input
          type="email"
          required
          autoFocus
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none"
        />

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      {confirmando && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
            <h2 className="text-base font-semibold text-gray-900">Cuenta nueva</h2>
            <p className="mt-2 text-sm text-gray-600">
              Todavía no existe ninguna cuenta con <span className="font-medium text-gray-900">{email}</span>.
              Revisá que esté bien escrito antes de continuar.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmando(false)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Corregir email
              </button>
              <button
                type="button"
                onClick={confirmarCreacion}
                disabled={loading}
                className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Creando..." : "Sí, crear cuenta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
