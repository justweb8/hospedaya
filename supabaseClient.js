// ============================================================
// HospedaYa — supabaseClient.js
// Inicialización de Supabase y helpers de consulta seguros
// ============================================================

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON);

// ── Estado global de sesión ─────────────────────────────────
let SESSION = {
  user:        null,   // objeto auth.user
  perfil:      null,   // fila de perfiles_usuarios
  hotel:       null,   // fila de hoteles
  turnoActivo: null,   // turno_caja abierto (si aplica)
};

// ── Auth helpers ────────────────────────────────────────────
async function signIn(email, password) {
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signOut() {
  await db.auth.signOut();
  SESSION = { user: null, perfil: null, hotel: null, turnoActivo: null };
}

async function getSession() {
  const { data: { session } } = await db.auth.getSession();
  return session;
}

// ── Cargar perfil completo tras login ───────────────────────
async function cargarPerfil(userId) {
  const { data, error } = await db
    .from('perfiles_usuarios')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return data;
}

async function cargarHotel(hotelId) {
  const { data, error } = await db
    .from('hoteles')
    .select('*')
    .eq('id', hotelId)
    .single();
  if (error) throw error;
  return data;
}

// ── Verificar estado de suscripción ─────────────────────────
function estadoSuscripcion(hotel) {
  if (!hotel) return 'sin_hotel';
  const ahora     = new Date();
  const vence     = new Date(hotel.fecha_vencimiento);
  const diffDias  = Math.ceil((vence - ahora) / (1000 * 60 * 60 * 24));

  if (hotel.estado === 'suspendido') return 'suspendido';
  if (diffDias < 0)                  return 'vencido';
  if (diffDias <= 5)                 return 'por_vencer';
  return 'vigente';
}

// ── Helpers de datos ─────────────────────────────────────────

// Garantiza que SESSION.perfil y SESSION.hotel estén cargados.
// Si por algún refresco de sesión se perdieron, los recarga desde la BD.
async function asegurarSesion() {
  if (!SESSION.user) {
    const s = await getSession();
    if (s) SESSION.user = s.user;
  }
  if (!SESSION.user) throw new Error('No hay sesión activa. Vuelve a iniciar sesión.');

  if (!SESSION.perfil) {
    SESSION.perfil = await cargarPerfil(SESSION.user.id);
  }
  if (!SESSION.hotel && SESSION.perfil?.hotel_id) {
    SESSION.hotel = await cargarHotel(SESSION.perfil.hotel_id);
  }
  return SESSION;
}

// Habitaciones con estado en tiempo real
async function getHabitaciones() {
  await asegurarSesion();
  const { data, error } = await db
    .from('habitaciones')
    .select(`
      *,
      tipos_habitacion ( nombre, tarifa_noche, tarifa_horas, horas_bloque )
    `)
    .eq('hotel_id', SESSION.hotel.id)
    .eq('activo', true)
    .order('numero');
  if (error) throw error;
  return data;
}

// Turno abierto del recepcionista actual
async function getTurnoAbierto() {
  await asegurarSesion();
  const { data, error } = await db
    .from('turnos_caja')
    .select('*')
    .eq('hotel_id', SESSION.hotel.id)
    .eq('recepcionista_id', SESSION.user.id)
    .eq('estado', 'abierto')
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Todos los hoteles (solo superadmin)
async function getHoteles() {
  const { data, error } = await db
    .from('hoteles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;

  // Traer emails de dueños via perfiles_usuarios + RPC opcional
  const { data: perfiles } = await db
    .from('perfiles_usuarios')
    .select('hotel_id, nombre_completo, user_id')
    .eq('rol', 'admin');

  let emailsMap = {};
  try {
    const { data: emailsData } = await db.rpc('fn_listar_emails_duenos');
    if (emailsData) emailsData.forEach(e => { emailsMap[e.user_id] = e.email; });
  } catch(_) {}

  return (data || []).map(h => {
    const perfil = (perfiles||[]).find(p => p.hotel_id === h.id);
    const email = perfil ? (emailsMap[perfil.user_id] || 'ver en Auth') : '—';
    return { ...h, _nombre_dueno: perfil?.nombre_completo || '—', _email_dueno: email };
  });
}

// Dashboard superadmin
async function getDashboardSuperadmin() {
  const { data, error } = await db
    .from('v_dashboard_superadmin')
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

// Suscripción del hotel actual
async function getSuscripcionHotel(hotelId) {
  const { data, error } = await db
    .from('v_suscripcion_hotel')
    .select('*')
    .eq('id', hotelId)
    .single();
  if (error) throw error;
  return data;
}

// Llamar función SECURITY DEFINER
async function rpc(fn, params = {}) {
  const { data, error } = await db.rpc(fn, params);
  if (error) throw error;
  return data;
}
