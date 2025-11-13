// src/pages/api/reservar.ts
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import dayjs from 'dayjs';
import { Resend } from 'resend';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Resend init
const resend = new Resend(process.env.RESEND_API_KEY!);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;
const SITE = process.env.SITE || 'http://localhost:4321';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { nombre, email, telefono, servicio, fecha, hora, nota } = body;

    if (!nombre || !email || !servicio || !fecha || !hora) {
      return new Response(JSON.stringify({ ok: false, message: 'Campos obligatorios faltan' }), { status: 400 });
    }

    const fechaISO = dayjs(fecha).format('YYYY-MM-DD');
    const horaStr = hora.slice(0,5); // 'HH:mm'

    // 1) Verificar disponibilidad (evitar race conditions no cubiertas por locking en este MVP)
    const { data: existing, error: selErr } = await supabase
      .from('reservas')
      .select('id')
      .eq('fecha', fechaISO)
      .eq('hora', horaStr)
      .limit(1);

    if (selErr) throw selErr;
    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ ok: false, message: 'Horario no disponible' }), { status: 409 });
    }

    // 2) Insertar reserva
    const { data, error: insertErr } = await supabase
      .from('reservas')
      .insert([{
        nombre,
        email,
        telefono: telefono || null,
        servicio,
        fecha: fechaISO,
        hora: horaStr,
        nota: nota || null,
      }])
      .select()
      .single();

    if (insertErr) throw insertErr;

    // 3) Enviar emails (cliente + admin)
    const reserva = data;
    const fechaFmt = dayjs(reserva.fecha).format('DD/MM/YYYY');

    // Email al cliente
    await resend.emails.send({
      from: `Reservas <no-reply@${new URL(SITE).hostname}>`,
      to: reserva.email,
      subject: `Confirmación de cita - ${reserva.servicio}`,
      html: `
        <p>Hola ${reserva.nombre},</p>
        <p>Gracias por reservar. Tu cita quedó confirmada:</p>
        <ul>
          <li><strong>Servicio:</strong> ${reserva.servicio}</li>
          <li><strong>Fecha:</strong> ${fechaFmt}</li>
          <li><strong>Hora:</strong> ${reserva.hora}</li>
        </ul>
        <p>Si necesitas cambiarla, contesta este correo o llama al negocio.</p>
        <p>Saludos,<br/>El equipo</p>
      `
    });

    // Email al admin
    await resend.emails.send({
      from: `Reservas <no-reply@${new URL(SITE).hostname}>`,
      to: ADMIN_EMAIL,
      subject: `Nueva reserva: ${reserva.servicio} - ${reserva.nombre}`,
      html: `
        <p>Nueva reserva registrada:</p>
        <ul>
          <li><strong>Nombre:</strong> ${reserva.nombre}</li>
          <li><strong>Email:</strong> ${reserva.email}</li>
          <li><strong>Teléfono:</strong> ${reserva.telefono ?? '—'}</li>
          <li><strong>Servicio:</strong> ${reserva.servicio}</li>
          <li><strong>Fecha:</strong> ${fechaFmt}</li>
          <li><strong>Hora:</strong> ${reserva.hora}</li>
          <li><strong>Nota:</strong> ${reserva.nota ?? '—'}</li>
        </ul>
        <p><em>ID:</em> ${reserva.id}</p>
      `
    });

    return new Response(JSON.stringify({ ok: true, reserva }), { status: 200 });
  } catch (err: any) {
    console.error('reservar error', err);
    return new Response(JSON.stringify({ ok: false, message: err.message || 'error' }), { status: 500 });
  }
};
