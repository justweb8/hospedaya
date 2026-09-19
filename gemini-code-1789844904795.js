// supabaseClient.js - Conector central con Supabase y lógica de sesión
const { createClient } = supabase;
const db = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

const AuthManager = {
  // Iniciar sesión con email y password
  async login(email, password) {
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  // Cerrar sesión
  async logout() {
    const { error } = await db.auth.signOut();
    if (error) console.error("Error al salir:", error.message);
    window.location.reload();
  },

  // Obtener usuario autenticado actual
  async getUsuarioActual() {
    const { data: { session } } = await db.auth.getSession();
    if (!session) return null;

    // Obtener perfil y datos del hotel
    const { data: perfil, error: errPerfil } = await db
      .from('perfiles_usuarios')
      .select('*, hoteles(*)')
      .eq('id', session.user.id)
      .single();

    if (errPerfil || !perfil) return null;
    return perfil;
  },

  // Validar estado de la suscripción del hotel
  verificarSuscripcion(hotel) {
    if (!hotel) return { permitido: false, razon: 'no_hotel' };
    if (hotel.estado === 'suspendido') {
      return { permitido: false, razon: 'suspendido', diasRestantes: 0 };
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaVence = new Date(hotel.fecha_vencimiento);
    fechaVence.setHours(0, 0, 0, 0);

    // Sumar días de gracia a la fecha límite
    const fechaLimiteGracia = new Date(fechaVence);
    fechaLimiteGracia.setDate(fechaLimiteGracia.getDate() + (hotel.dias_gracia || 0));

    const diffTiempo = fechaLimiteGracia.getTime() - hoy.getTime();
    const diasRestantes = Math.ceil(diffTiempo / (1000 * 60 * 60 * 24));

    if (diasRestantes < 0) {
      return { permitido: false, razon: 'vencido', diasRestantes };
    }

    const mostrarAlertaRenovacion = diasRestantes <= 5;
    return {
      permitido: true,
      diasRestantes,
      mostrarAlertaRenovacion,
      enGracia: hoy > fechaVence && diasRestantes >= 0
    };
  }
};