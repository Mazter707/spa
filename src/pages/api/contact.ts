import { supabase } from "../../lib/supabase.js";
import type { APIContext } from 'astro';

export const prerender = false;

export async function POST({ request, redirect }: APIContext) {
  const formData = await request.formData();

  const name = (formData.get("name") || "").toString().trim();
  const email = (formData.get("email") || "").toString().trim();
  const message = (formData.get("message") || "").toString().trim();
  const source = (formData.get("source") || "").toString().trim();

  // ✅ Validaciones del backend
  if (!name || !email || !message || !source) {
    return new Response(
      JSON.stringify({ error: "Campos incompletos" }),
      { status: 400 }
    );
  }

  // Opcional: validar formato de email
  if (!/\S+@\S+\.\S+/.test(email)) {
    return new Response(
      JSON.stringify({ error: "Email inválido" }),
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("contact_messages")
    .insert({ name, email, message, source });

  if (error) {
    console.error("Supabase error:", error);
    return new Response("Error saving data", { status: 500 });
  }

  return redirect("/contacto-gracias");
}
