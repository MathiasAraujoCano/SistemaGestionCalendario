// Llamamos directo a la REST API de GoTrue (en vez del cliente supabase-js)
// porque el cliente estaba devolviendo error.message = "{}", sin info real
// del rechazo. Así vemos el texto exacto que manda el servidor.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { email, confirmar } = await req.json();
    if (!email || typeof email !== "string") {
      return json({ error: "email requerido" }, 400);
    }

    // ¿ya existe una cuenta con este email? Si no existe y el frontend
    // todavía no confirmó que quiere crearla, frenamos acá (evita que un
    // typo en el email cree una cuenta nueva sin que nadie se dé cuenta).
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/perfiles_usuario?select=id&email=eq.${encodeURIComponent(email)}`,
      {
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        },
      },
    );
    const existentes = await checkRes.json();
    const yaExiste = Array.isArray(existentes) && existentes.length > 0;

    if (!yaExiste && !confirmar) {
      return json({ needsConfirmation: true });
    }

    const goTrueRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ type: "magiclink", email }),
    });

    const rawText = await goTrueRes.text();
    console.log("generate_link ->", goTrueRes.status, rawText);

    if (!goTrueRes.ok) {
      return json({ error: `GoTrue ${goTrueRes.status}: ${rawText}` }, 400);
    }

    const data = JSON.parse(rawText);
    const otp = data.email_otp;
    if (!otp) {
      return json({ error: "sin email_otp en la respuesta: " + rawText }, 500);
    }

    // email_otp: código de 6 dígitos que normalmente se manda por mail.
    // Se lo devolvemos directo al frontend para que lo canjee al toque.
    return json({ email_otp: otp });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
