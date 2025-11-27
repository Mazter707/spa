import { supabase } from "../../lib/supabase.js";
import type { APIContext } from 'astro';

export const prerender = false;

export async function POST({ request, redirect }: APIContext) {
  const formData = await request.formData();

  const name = formData.get("name");
  const email = formData.get("email");
  const message = formData.get("message");
  const source = formData.get("source");

  const { error } = await supabase.from("contact_messages").insert({
    name,
    email,
    message,
    source,
  });

  if (error) {
    console.error("Supabase error:", error);
    return new Response("Error saving data", { status: 500 });
  }

  return redirect("/contacto-gracias");
}
