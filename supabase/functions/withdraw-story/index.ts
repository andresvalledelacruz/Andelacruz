import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WITHDRAWAL_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const allowedOrigins = new Set([
  "https://desgracias.es",
  "https://www.desgracias.es",
  "https://andresvalledelacruz.github.io",
]);

function corsHeaders(origin: string | null) {
  const allowOrigin = origin && allowedOrigins.has(origin) ? origin : "https://desgracias.es";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
    "Cache-Control": "no-store",
  };
}

function jsonResponse(status: number, body: Record<string, unknown>, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function hmacSha256Hex(keyText: string, value: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(keyText),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function requestIp(req: Request) {
  const cf = req.headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf;
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  const real = req.headers.get("x-real-ip")?.trim();
  return real || null;
}

function canonicalWithdrawalCode(code: string) {
  return code.toUpperCase().replace(/[^A-Z2-9]/g, "");
}

function validWithdrawalCode(canonical: string) {
  if (canonical.length !== 27 || !canonical.startsWith("DGR")) return false;
  for (const char of canonical.slice(3)) {
    if (!WITHDRAWAL_ALPHABET.includes(char)) return false;
  }
  return true;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    if (origin && !allowedOrigins.has(origin)) return jsonResponse(403, { error: "origin_not_allowed" }, origin);
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (req.method !== "POST") return jsonResponse(405, { error: "method_not_allowed" }, origin);
  if (origin && !allowedOrigins.has(origin)) return jsonResponse(403, { error: "origin_not_allowed" }, origin);

  const rawBody = await req.text();
  if (rawBody.length > 1000) return jsonResponse(413, { error: "payload_too_large" }, origin);

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return jsonResponse(400, { error: "invalid_json" }, origin);
  }

  const enteredCode = String(payload.code || "").trim();
  const canonical = canonicalWithdrawalCode(enteredCode);
  if (!validWithdrawalCode(canonical)) return jsonResponse(400, { error: "invalid_withdrawal_code" }, origin);

  const tokenHash = await hmacSha256Hex(SERVICE_ROLE_KEY, `withdrawal:${canonical}`);
  const ip = requestIp(req);
  const ipHash = await hmacSha256Hex(SERVICE_ROLE_KEY, `withdraw-ip:${ip || "unknown"}`);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await admin.rpc("withdraw_story_by_token", {
    p_token_hash: tokenHash,
    p_ip_hash: ipHash,
  });

  if (error) {
    const code = String(error.code || "");
    if (code === "P0001") return jsonResponse(429, { error: "rate_limit" }, origin);
    if (code === "P0002") return jsonResponse(404, { error: "code_not_found" }, origin);
    if (code === "22023") return jsonResponse(400, { error: "invalid_withdrawal_code" }, origin);
    console.error("story withdrawal failed", { code });
    return jsonResponse(500, { error: "withdrawal_failed" }, origin);
  }

  return jsonResponse(200, {
    ok: true,
    alreadyWithdrawn: Boolean(data?.already_withdrawn),
  }, origin);
});
