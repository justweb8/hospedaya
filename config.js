// ============================================================
// HospedaYa — config.js
// Reemplaza los valores con los de tu proyecto en Supabase:
// Settings → API → Project URL y anon/public key
// ============================================================

const SUPABASE_URL  = 'https://gcuicpitzbcwqxlloodm.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjdWljcGl0emJjd3F4bGxvb2RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzMzU4NTQsImV4cCI6MjA4NzkxMTg1NH0.NArYzoJqW4wpAUAvmy6Y4Pf1GPgsK5Tz1tkhxrAnpG8';

// WhatsApp del SuperAdmin para renovaciones
const WA_SUPERADMIN = '51975561764'; // Cambia por tu número con código de país
const WA_MENSAJE_RENOVAR = encodeURIComponent('Hola, quiero renovar mi suscripción de HospedaYa.');
const WA_URL = `https://wa.me/${WA_SUPERADMIN}?text=${WA_MENSAJE_RENOVAR}`;

// Datos bancarios para el paywall (se muestran al vencer)
const DATOS_PAGO = {
  yape:         '975 561 764 (José Perez)',
  plin:         '975 561 764 (José Perez)',
  transferencia: 'BCP · Cta. 123-456789-0-12 · José García',
  bcp_cci:      '00212345678901234567',
};
