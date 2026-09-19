// ============================================================
// HospedaYa — config.js
// Reemplaza los valores con los de tu proyecto en Supabase:
// Settings → API → Project URL y anon/public key
// ============================================================

const SUPABASE_URL  = 'https://TU_PROJECT_ID.supabase.co';
const SUPABASE_ANON = 'TU_ANON_KEY_AQUI';

// WhatsApp del SuperAdmin para renovaciones
const WA_SUPERADMIN = '51999999999'; // Cambia por tu número con código de país
const WA_MENSAJE_RENOVAR = encodeURIComponent('Hola, quiero renovar mi suscripción de HospedaYa.');
const WA_URL = `https://wa.me/${WA_SUPERADMIN}?text=${WA_MENSAJE_RENOVAR}`;

// Datos bancarios para el paywall (se muestran al vencer)
const DATOS_PAGO = {
  yape:         '999 999 999 (José García)',
  plin:         '999 999 999 (José García)',
  transferencia: 'BCP · Cta. 123-456789-0-12 · José García',
  bcp_cci:      '00212345678901234567',
};
