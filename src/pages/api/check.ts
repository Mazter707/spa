// src/pages/api/check.ts
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import dayjs from 'dayjs';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { fecha, hora } = body; // fecha: 'YYYY-MM-DD', hora: 'HH:mm' (24h)

    if (!fecha || !hora) {
      return new Response(JSON.stringify({ ok: false, message: 'Fecha u hora faltante' }), { status: 400 });
    }

    // Normaliza
    const fechaISO = dayjs(fecha).format('YYYY-MM-DD');
    const horaStr = hora.slice(0,5); // 'HH:mm'

    // Busca si ya existe reserva para esa fecha+hora
    const { data, error } = await supabase
      .from('reservas')
      .select('id')
      .eq('fecha', fechaISO)
      .eq('hora', horaStr)
      .limit(1);

    if (error) throw error;

    const disponible = (data?.length ?? 0) === 0;

    return new Response(JSON.stringify({ ok: true, disponible }), { status: 200 });
  } catch (err: any) {
    console.error('check error', err);
    return new Response(JSON.stringify({ ok: false, message: err.message || 'error' }), { status: 500 });
  }
};
