export const prerender = false;

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// --- Inicializar Supabase ---
const supabase = createClient(
	import.meta.env.SUPABASE_URL!,
	import.meta.env.SUPABASE_SERVICE_ROLE_KEY!
);

// --- Inicializar Resend ---
const resend = new Resend(import.meta.env.RESEND_API_KEY!);

export const POST: APIRoute = async ({ request }) => {
	try {
		const data = await request.json().catch(() => null);

		if (!data) {
			return new Response(
				JSON.stringify({ success: false, error: 'JSON inválido o vacío' }),
				{ status: 400 }
			);
		}

		const { nombre, email, telefono, servicio, fecha, hora, comentarios } =
			data;

		if (!nombre || !email || !servicio || !fecha || !hora) {
			return new Response(
				JSON.stringify({ success: false, error: 'Faltan campos obligatorios' }),
				{ status: 400 }
			);
		}

		const { data: inserted, error } = await supabase
			.from('reservas')
			.insert([
				{
					nombre,
					email,
					telefono,
					servicio,
					fecha,
					hora,
					nota: comentarios,
				},
			])
			.select();

		if (error) {
			console.error('❌ Error insertando en Supabase:', error);
			return new Response(
				JSON.stringify({ success: false, error: error.message }),
				{ status: 500 }
			);
		}

		console.log('✅ Insertado en Supabase:', inserted);

		await resend.emails.send({
			from: 'Reservas A&A Spa <noreply@reservas.ayaspa.com>',
			to: email,
			subject: 'Tu reserva ha sido recibida',
			html: `
        <h2>Hola ${nombre},</h2>
        <p>Hemos recibido tu solicitud de reserva.</p>
        <p>
          <strong>Servicio:</strong> ${servicio}<br>
          <strong>Fecha:</strong> ${fecha}<br>
          <strong>Hora:</strong> ${hora}<br>
          <strong>Teléfono:</strong> ${telefono}
        </p>
        <p>Nos pondremos en contacto contigo para confirmarla.</p>
        <p>— A&A Spa</p>
      `,
		});

		return new Response(JSON.stringify({ success: true }), { status: 200 });
	} catch (err: any) {
		console.error('🔥 Error general:', err);
		return new Response(
			JSON.stringify({
				success: false,
				error: err?.message ?? 'Error desconocido',
			}),
			{ status: 500 }
		);
	}
};
