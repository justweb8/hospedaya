// ============================================================
// HospedaYa — app.js
// FASE 3: Panel SuperAdmin + Módulo de Caja por Turnos
// ============================================================
// Este archivo define renderModulo(modulo), que el router de
// index.html llama al navegar. Cada módulo pinta su HTML en
// #contenido y engancha sus propios eventos.
// ============================================================

// ── Utilidades comunes ───────────────────────────────────────
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

function soles(n) {
  const num = Number(n || 0);
  return 'S/ ' + num.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fechaCorta(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fechaHora(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function contenido() { return document.getElementById('contenido'); }

function skeleton() {
  contenido().innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;height:240px;color:var(--texto-sub);gap:0.75rem;">
      <div class="spinner" style="width:28px;height:28px;"></div>
      <span style="font-size:0.9rem;">Cargando…</span>
    </div>`;
}

// ── Modal genérico reutilizable ─────────────────────────────
function abrirModal(titulo, htmlContenido, opciones = {}) {
  cerrarModal();
  const overlay = document.createElement('div');
  overlay.id = 'modal-generico';
  overlay.style.cssText = `
    position:fixed; inset:0; background:rgba(15,39,102,0.55);
    backdrop-filter:blur(4px); z-index:8000; display:flex;
    align-items:center; justify-content:center; padding:1.25rem;`;
  overlay.innerHTML = `
    <div style="background:white; border-radius:18px; max-width:${opciones.ancho || '520px'};
                width:100%; max-height:90vh; overflow-y:auto;
                box-shadow:0 25px 60px rgba(0,0,0,0.3);">
      <div style="display:flex; align-items:center; justify-content:space-between;
                  padding:1.25rem 1.5rem; border-bottom:1px solid var(--gris-borde); position:sticky; top:0; background:white; z-index:1;">
        <h3 style="font-size:1.05rem; font-weight:700; color:var(--texto); margin:0;">${escapeHtml(titulo)}</h3>
        <button onclick="cerrarModal()" style="background:none; border:none; cursor:pointer; color:#94A3B8; display:flex; padding:0.25rem;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:20px;height:20px;">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div style="padding:1.5rem;">${htmlContenido}</div>
    </div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) cerrarModal(); });
  document.body.appendChild(overlay);
}

function cerrarModal() {
  const m = document.getElementById('modal-generico');
  if (m) m.remove();
}

// Estilos de inputs/botones reutilizables (inline para no depender de más CSS)
const ST = {
  label:  'display:block; font-size:0.8rem; font-weight:600; color:var(--texto); margin-bottom:0.4rem;',
  input:  'width:100%; padding:0.65rem 0.85rem; border:1.5px solid var(--gris-borde); border-radius:9px; font-size:0.88rem; color:var(--texto); background:var(--gris-bg); outline:none; font-family:inherit;',
  grupo:  'margin-bottom:1rem;',
  fila:   'display:grid; grid-template-columns:1fr 1fr; gap:0.85rem;',
  btnPri: 'width:100%; padding:0.8rem; background:linear-gradient(135deg,var(--azul),#2563EB); color:white; border:none; border-radius:10px; font-size:0.92rem; font-weight:600; cursor:pointer; box-shadow:0 4px 14px rgba(26,63,166,0.3);',
  btnSec: 'padding:0.55rem 1rem; background:white; color:var(--texto); border:1.5px solid var(--gris-borde); border-radius:9px; font-size:0.85rem; font-weight:600; cursor:pointer;',
  btnDanger: 'padding:0.55rem 1rem; background:#FEF2F2; color:var(--rojo); border:1.5px solid #FECACA; border-radius:9px; font-size:0.85rem; font-weight:600; cursor:pointer;',
  btnOk:  'padding:0.55rem 1rem; background:#F0FDF4; color:var(--verde); border:1.5px solid #BBF7D0; border-radius:9px; font-size:0.85rem; font-weight:600; cursor:pointer;',
};


// ════════════════════════════════════════════════════════════
//  ROUTER DE MÓDULOS
// ════════════════════════════════════════════════════════════
function renderModulo(modulo) {
  switch (modulo) {
    // SuperAdmin
    case 'sa-dashboard':     return moduloSaDashboard();
    case 'sa-hoteles':       return moduloSaHoteles();
    case 'sa-suscripciones': return moduloSaSuscripciones();
    // Hotel — operativa
    case 'dashboard':        return moduloDashboardHotel();
    case 'restaurante':      return moduloRestaurante();
    case 'cocina':           return moduloCocina();
    case 'rack':             return moduloRack();
    case 'reservas':         return moduloReservas();
    case 'huespedes':        return moduloHuespedes();
    case 'caja':             return moduloCaja();
    case 'tiendita':         return moduloTiendita();
    case 'limpieza':         return moduloLimpieza();
    case 'reportes':         return moduloReportes();
    // Hotel — configuración (admin)
    case 'habitacion-config': return moduloHabitacionConfig();
    case 'personal':         return moduloPersonal();
    case 'suscripcion':      return moduloMiSuscripcion();
    // Facturación SUNAT (Fase 5 · facturacionSunat.js)
    case 'facturacion':      return moduloFacturacion();
    case 'sunat-config':     return moduloSunatConfig();
    default:
      contenido().innerHTML = `
        <div style="padding:2rem; color:var(--texto-sub); font-size:0.9rem;">
          Módulo <strong>${escapeHtml(modulo)}</strong> no encontrado.
        </div>`;
  }
}


// ════════════════════════════════════════════════════════════
//  CONSULTA DNI / RUC  (⚠️ PEGAR TU API AQUÍ EN EL FUTURO)
// ════════════════════════════════════════════════════════════
// Cuando tengas tu API de consulta de DNI/RUC, edita SOLO este
// bloque. Debe devolver { nombres, apellidos } para DNI y
// { razon_social, direccion } para RUC. Mientras esté vacío,
// el campo funciona en modo manual sin problemas.
// ────────────────────────────────────────────────────────────
const API_DOC = {
  activa: false,                        // ← cámbialo a true cuando conectes tu API
  url_dni: '',                          // ← ej: 'https://api.midoc.com/dni/'
  url_ruc: '',                          // ← ej: 'https://api.midoc.com/ruc/'
  token:   '',                          // ← tu token de la API
};

async function consultarDNI(dni) {
  if (!API_DOC.activa || !API_DOC.url_dni) return null; // modo manual
  try {
    const r = await fetch(API_DOC.url_dni + dni, {
      headers: API_DOC.token ? { 'Authorization': 'Bearer ' + API_DOC.token } : {}
    });
    if (!r.ok) return null;
    const data = await r.json();
    // ⚠️ Ajusta estos campos según la respuesta de TU API:
    return {
      nombres:   data.nombres   || data.first_name || '',
      apellidos: (data.apellidoPaterno && data.apellidoMaterno)
                    ? `${data.apellidoPaterno} ${data.apellidoMaterno}`
                    : (data.apellidos || data.last_name || ''),
    };
  } catch { return null; }
}

async function consultarRUC(ruc) {
  if (!API_DOC.activa || !API_DOC.url_ruc) return null;
  try {
    const r = await fetch(API_DOC.url_ruc + ruc, {
      headers: API_DOC.token ? { 'Authorization': 'Bearer ' + API_DOC.token } : {}
    });
    if (!r.ok) return null;
    const data = await r.json();
    return {
      razon_social: data.razonSocial || data.nombre || '',
      direccion:    data.direccion   || '',
    };
  } catch { return null; }
}


// ════════════════════════════════════════════════════════════
//  SUPERADMIN › DASHBOARD SAAS
// ════════════════════════════════════════════════════════════
async function moduloSaDashboard() {
  skeleton();
  try {
    const m = await getDashboardSuperadmin();
    const hoteles = await getHoteles();

    contenido().innerHTML = `
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;margin-bottom:1.5rem;">
        <div style="display:flex;align-items:center;gap:1rem;">
          <div style="width:52px;height:52px;border-radius:14px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:26px;height:26px;"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          </div>
          <div>
            <h1 style="font-size:1.5rem;font-weight:700;color:var(--texto);margin:0;">Dashboard SaaS</h1>
            <p style="font-size:0.83rem;color:var(--texto-sub);margin:0.2rem 0 0;">Panel de control de HospedaYa</p>
          </div>
        </div>
        <button onclick="abrirFormAltaHotel()" style="width:auto;padding:0.65rem 1.25rem;background:linear-gradient(135deg,var(--azul),#2563EB);color:white;border:none;border-radius:10px;font-size:0.88rem;font-weight:600;cursor:pointer;box-shadow:0 4px 14px rgba(37,99,235,0.3);display:flex;align-items:center;gap:0.5rem;">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" style="width:16px;height:16px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Registrar hotel
        </button>
      </div>

      <!-- 6 tarjetas -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-bottom:1.5rem;">
        ${saKpi('MRR (mes actual)',    soles(m.mrr_mes_actual),      '#2563EB','#EFF6FF','<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>')}
        ${saKpi('Ingresos totales',   soles(m.ingresos_acumulados), '#16A34A','#F0FDF4','<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>')}
        ${saKpi('Hoteles activos',    m.hoteles_activos,            '#16A34A','#F0FDF4','<path d="M3 21h18M6 21V7l6-4 6 4v14"/>')}
        ${saKpi('Suspendidos',        m.hoteles_suspendidos,        '#DC2626','#FEF2F2','<circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>')}
        ${saKpi('Vencidos',           m.hoteles_vencidos,           '#EA580C','#FFF7ED','<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>')}
        ${saKpi('Total hoteles',      m.hoteles_total,              '#64748B','#F1F5F9','<path d="M3 21h18M6 21V7l6-4 6 4v14"/>')}
      </div>

      <!-- Lista rápida de hoteles -->
      <div style="background:white;border:1px solid var(--gris-borde);border-radius:14px;overflow:hidden;">
        <div style="padding:1rem 1.25rem;border-bottom:1px solid var(--gris-borde);display:flex;align-items:center;justify-content:space-between;">
          <span style="font-weight:700;">Hoteles registrados (${hoteles.length})</span>
          <button onclick="navegarA('sa-hoteles')" style="font-size:0.8rem;color:var(--azul);font-weight:600;background:none;border:none;cursor:pointer;">Ver todos →</button>
        </div>
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:0.85rem;min-width:640px;">
            <thead><tr style="border-bottom:1px solid var(--gris-borde);text-align:left;">
              <th style="${thCss()}">Hotel</th><th style="${thCss()}">Plan</th>
              <th style="${thCss()}">Vence</th><th style="${thCss()}">Estado</th>
              <th style="${thCss()};text-align:right;">Acciones</th>
            </tr></thead>
            <tbody>
              ${hoteles.length===0
                ?`<tr><td colspan="5" style="padding:2rem;text-align:center;color:var(--texto-sub);">Sin hoteles aún.</td></tr>`
                :hoteles.slice(0,8).map(h=>filaHotelSa(h)).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch(err) { contenido().innerHTML = errorBox('No se pudo cargar el dashboard', err.message); }
}

function saKpi(label, valor, color, bg, icono) {
  return `
    <div class="card" style="padding:1.15rem;position:relative;overflow:hidden;">
      <div style="display:flex;align-items:center;gap:0.85rem;">
        <div style="width:44px;height:44px;border-radius:12px;background:${bg};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:22px;height:22px;">${icono}</svg>
        </div>
        <div>
          <div style="font-size:1.55rem;font-weight:700;color:var(--texto);line-height:1;">${valor}</div>
          <div style="font-size:0.75rem;color:var(--texto-sub);margin-top:0.2rem;">${label}</div>
        </div>
      </div>
    </div>`;
}

// ════════════════════════════════════════════════════════════
//  SUPERADMIN › HOTELES
// ════════════════════════════════════════════════════════════
async function moduloSaHoteles() {
  skeleton();
  try {
    const hoteles = await getHoteles();
    contenido().innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;margin-bottom:1.25rem;">
        <div style="display:flex;align-items:center;gap:1rem;">
          <div style="width:52px;height:52px;border-radius:14px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" style="width:26px;height:26px;"><path d="M3 21h18M6 21V7l6-4 6 4v14M10 9h4M10 13h4M10 17h4"/></svg>
          </div>
          <div>
            <h1 style="font-size:1.5rem;font-weight:700;color:var(--texto);margin:0;">Hoteles</h1>
            <p style="font-size:0.83rem;color:var(--texto-sub);margin:0.2rem 0 0;">${hoteles.length} hotel${hoteles.length!==1?'es':''} registrado${hoteles.length!==1?'s':''}</p>
          </div>
        </div>
        <button onclick="abrirFormAltaHotel()" style="width:auto;padding:0.65rem 1.25rem;background:linear-gradient(135deg,var(--azul),#2563EB);color:white;border:none;border-radius:10px;font-size:0.88rem;font-weight:600;cursor:pointer;box-shadow:0 4px 14px rgba(37,99,235,0.3);display:flex;align-items:center;gap:0.5rem;">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" style="width:16px;height:16px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Registrar hotel
        </button>
      </div>
      <div style="background:white;border:1px solid var(--gris-borde);border-radius:14px;overflow:hidden;">
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:0.85rem;min-width:680px;">
            <thead><tr style="border-bottom:1px solid var(--gris-borde);text-align:left;">
              <th style="${thCss()}">Hotel / RUC</th>
              <th style="${thCss()}">Correo dueño</th>
              <th style="${thCss()}">Plan</th>
              <th style="${thCss()}">Vence</th>
              <th style="${thCss()}">Estado</th>
              <th style="${thCss()};text-align:right;">Acciones</th>
            </tr></thead>
            <tbody>
              ${hoteles.length===0
                ?`<tr><td colspan="6" style="padding:2rem;text-align:center;color:var(--texto-sub);">Sin hoteles aún. Registra el primero.</td></tr>`
                :hoteles.map(h=>filaHotelSa(h)).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch(err) { contenido().innerHTML = errorBox('No se pudo cargar hoteles', err.message); }
}

function filaHotelSa(h) {
  const vence = new Date(h.fecha_vencimiento);
  const dias = Math.ceil((vence - new Date()) / (1000*60*60*24));
  const estadoBadge = h.estado==='suspendido'
    ? badge('Suspendido','#FEF2F2','#DC2626')
    : dias<0 ? badge('Vencido','#FFF7ED','#EA580C')
    : dias<=5 ? badge(`${dias}d restantes`,'#FFFBEB','#92400E')
    : badge('Activo','#F0FDF4','#16A34A');
  const planBadge = h.plan==='pro'
    ? `<span style="font-size:0.72rem;font-weight:700;color:#7C3AED;background:#F5F3FF;padding:0.2rem 0.65rem;border-radius:999px;">PRO</span>`
    : `<span style="font-size:0.72rem;font-weight:700;color:#2563EB;background:#EFF6FF;padding:0.2rem 0.65rem;border-radius:999px;">BÁSICO</span>`;

  return `
    <tr style="border-bottom:1px solid var(--gris-borde);">
      <td style="${tdCss()}">
        <div style="font-weight:700;">${escapeHtml(h.nombre_comercial)}</div>
        <div style="font-size:0.72rem;color:var(--texto-sub);">${escapeHtml(h.ruc)} · ${escapeHtml(h.razon_social)}</div>
      </td>
      <td style="${tdCss()};font-size:0.8rem;color:var(--texto-sub);">${escapeHtml(h._email_dueno||'—')}</td>
      <td style="${tdCss()}">${planBadge}</td>
      <td style="${tdCss()};font-size:0.8rem;">${fechaCorta(h.fecha_vencimiento)}<br><span style="font-size:0.7rem;color:${dias<0?'var(--rojo)':dias<=5?'#EA580C':'var(--texto-sub)'};">${dias>=0?dias+' días':'vencido'}</span></td>
      <td style="${tdCss()}">${estadoBadge}</td>
      <td style="${tdCss()};text-align:right;">
        <button onclick="abrirGestionHotel('${h.id}')" style="width:auto;padding:0.4rem 0.85rem;background:white;border:1px solid var(--gris-borde);border-radius:8px;font-size:0.8rem;font-weight:600;cursor:pointer;color:var(--texto);">Gestionar</button>
      </td>
    </tr>`;
}

function thCss() { return 'padding:0.75rem 1rem;font-weight:600;font-size:0.72rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--texto-sub);border-bottom:1px solid var(--gris-borde);'; }
function tdCss() { return 'padding:0.75rem 1rem;border-bottom:1px solid var(--gris-borde);color:var(--texto);'; }
function badge(texto,bg,color) { return `<span style="display:inline-block;font-size:0.7rem;font-weight:700;padding:0.2rem 0.65rem;border-radius:999px;background:${bg};color:${color};">${texto}</span>`; }

// ── Modal gestión completa de un hotel ──────────────────────
async function abrirGestionHotel(hotelId) {
  try {
    const { data: susc } = await db.from('v_suscripcion_hotel').select('*').eq('id', hotelId).single();
    const { data: perfil } = await db.from('perfiles_usuarios').select('*').eq('hotel_id', hotelId).eq('rol','admin').single();

    // Obtener email del dueño via RPC (si existe) o mostrar indicación
    let emailDueno = '—';
    try {
      if (perfil?.user_id) {
        const { data: emailData } = await db.rpc('fn_get_email_usuario', { p_user_id: perfil.user_id });
        if (emailData) emailDueno = emailData;
        else emailDueno = 'Ver en Supabase Auth';
      }
    } catch(_) { emailDueno = 'Ver en Supabase Auth'; }

    const dias = susc?.dias_restantes ?? 0;

    abrirModal(`Gestionar: ${escapeHtml(susc?.nombre_comercial||'Hotel')}`, `
      <!-- Info del hotel -->
      <div style="background:var(--gris-bg);border-radius:12px;padding:1rem;margin-bottom:1.25rem;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;font-size:0.83rem;">
          <div><span style="color:var(--texto-sub);">Dueño:</span> <strong>${escapeHtml(perfil?.nombre_completo||'—')}</strong></div>
          <div><span style="color:var(--texto-sub);">Correo:</span> <strong style="color:var(--azul);">${escapeHtml(emailDueno)}</strong></div>
          <div><span style="color:var(--texto-sub);">Plan:</span> <strong>${susc?.plan?.toUpperCase()||'—'}</strong></div>
          <div><span style="color:var(--texto-sub);">Días restantes:</span> <strong style="color:${dias<0?'var(--rojo)':dias<=5?'#EA580C':'var(--verde)'};">${dias}</strong></div>
        </div>
      </div>

      <!-- 1. Cambiar plan -->
      <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--azul);margin-bottom:0.65rem;">1 · Cambiar plan</div>
      <div style="display:flex;gap:0.5rem;margin-bottom:1.25rem;">
        <button onclick="cambiarPlanHotel('${hotelId}','basico',this)" style="flex:1;padding:0.65rem;border-radius:9px;border:2px solid ${susc?.plan==='basico'?'var(--azul)':'var(--gris-borde)'};background:${susc?.plan==='basico'?'#EFF6FF':'white'};color:${susc?.plan==='basico'?'var(--azul)':'var(--texto-sub)'};font-weight:600;cursor:pointer;font-size:0.85rem;">
          📦 Básico<br><span style="font-size:0.72rem;font-weight:400;">Solo PMS de hotel</span>
        </button>
        <button onclick="cambiarPlanHotel('${hotelId}','pro',this)" style="flex:1;padding:0.65rem;border-radius:9px;border:2px solid ${susc?.plan==='pro'?'#7C3AED':'var(--gris-borde)'};background:${susc?.plan==='pro'?'#F5F3FF':'white'};color:${susc?.plan==='pro'?'#7C3AED':'var(--texto-sub)'};font-weight:600;cursor:pointer;font-size:0.85rem;">
          🚀 PRO<br><span style="font-size:0.72rem;font-weight:400;">PMS + Restaurante + Cocina</span>
        </button>
      </div>

      <!-- 2. Renovar suscripción -->
      <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--azul);margin-bottom:0.65rem;">2 · Renovar suscripción</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.4rem;margin-bottom:0.75rem;">
        ${[1,3,6,12].map(m=>`<button class="btn-renovar-mes" data-meses="${m}" style="padding:0.55rem 0.25rem;border-radius:8px;border:1.5px solid var(--gris-borde);background:white;font-size:0.8rem;font-weight:600;cursor:pointer;text-align:center;">${m} mes${m>1?'es':''}</button>`).join('')}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.65rem;margin-bottom:0.75rem;">
        <div><label style="${ST.label}">Monto cobrado</label><input style="${ST.input}" id="renov-monto" type="number" step="0.01" placeholder="120.00"></div>
        <div><label style="${ST.label}">Método</label>
          <select style="${ST.input}" id="renov-metodo">
            <option value="yape">Yape</option><option value="plin">Plin</option>
            <option value="transferencia">Transferencia</option><option value="efectivo">Efectivo</option>
          </select>
        </div>
      </div>
      <div style="${ST.grupo}"><label style="${ST.label}">Código operación (opcional)</label><input style="${ST.input}" id="renov-codigo" placeholder="Opcional"></div>
      <button id="btn-confirmar-renov" data-meses="1" style="width:100%;padding:0.75rem;background:linear-gradient(135deg,var(--azul),#2563EB);color:white;border:none;border-radius:10px;font-size:0.88rem;font-weight:600;cursor:pointer;margin-bottom:1.25rem;">
        Renovar por <span id="renov-meses-txt">1 mes</span>
      </button>

      <!-- 3. Prórroga -->
      <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--azul);margin-bottom:0.65rem;">3 · Prórroga de gracia</div>
      <div style="display:flex;gap:0.5rem;margin-bottom:1.25rem;">
        <button onclick="darProrroga('${hotelId}',3)" style="flex:1;padding:0.6rem;background:#F0FDF4;color:#16A34A;border:1.5px solid #16A34A;border-radius:9px;font-size:0.85rem;font-weight:600;cursor:pointer;">+3 días</button>
        <button onclick="darProrroga('${hotelId}',5)" style="flex:1;padding:0.6rem;background:#F0FDF4;color:#16A34A;border:1.5px solid #16A34A;border-radius:9px;font-size:0.85rem;font-weight:600;cursor:pointer;">+5 días</button>
      </div>

      <!-- 4. Resetear contraseña del dueño -->
      <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--azul);margin-bottom:0.65rem;">4 · Resetear contraseña del dueño</div>
      <div style="display:flex;gap:0.5rem;margin-bottom:1.25rem;">
        <input style="${ST.input};flex:1;" id="nueva-pass-dueno" type="text" placeholder="Nueva contraseña temporal (mín. 6 caracteres)">
        <button onclick="resetearPassDueno('${perfil?.user_id||''}')" style="white-space:nowrap;padding:0.6rem 1rem;background:#EA580C;color:white;border:none;border-radius:9px;font-size:0.83rem;font-weight:600;cursor:pointer;">Resetear</button>
      </div>

      <!-- 5. Suspender / Activar -->
      <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--rojo);margin-bottom:0.65rem;">5 · Estado del hotel</div>
      <div style="display:flex;gap:0.5rem;">
        ${susc?.estado==='suspendido'
          ?`<button onclick="cambiarEstadoHotel('${hotelId}','activo')" style="flex:1;padding:0.65rem;background:#16A34A;color:white;border:none;border-radius:9px;font-size:0.85rem;font-weight:600;cursor:pointer;">✅ Reactivar hotel</button>`
          :`<button onclick="cambiarEstadoHotel('${hotelId}','suspendido')" style="flex:1;padding:0.65rem;background:#DC2626;color:white;border:none;border-radius:9px;font-size:0.85rem;font-weight:600;cursor:pointer;">🚫 Suspender hotel</button>`}
      </div>
    `, { ancho:'540px' });

    // Selección de meses
    let mesesSel=1;
    $$('.btn-renovar-mes').forEach(b=>{
      b.addEventListener('click',()=>{
        mesesSel=parseInt(b.dataset.meses);
        $$('.btn-renovar-mes').forEach(x=>{ x.style.background='white'; x.style.borderColor='var(--gris-borde)'; x.style.color='var(--texto)'; });
        b.style.background='#EFF6FF'; b.style.borderColor='var(--azul)'; b.style.color='var(--azul)';
        $('#renov-meses-txt').textContent=`${mesesSel} mes${mesesSel>1?'es':''}`;
        $('#btn-confirmar-renov').dataset.meses=mesesSel;
      });
    });
    $$('.btn-renovar-mes')[0].click();

    $('#btn-confirmar-renov').addEventListener('click', async()=>{
      const btn=$('#btn-confirmar-renov');
      const monto=parseFloat($('#renov-monto').value);
      if(!monto||monto<=0){ toast('Falta el monto','Ingresa el monto cobrado','warn'); return; }
      btn.disabled=true; btn.textContent='Renovando…';
      try {
        const r=await rpc('fn_renovar_suscripcion',{ p_hotel_id:hotelId, p_meses:parseInt(btn.dataset.meses), p_monto:monto, p_metodo_pago:$('#renov-metodo').value, p_codigo_operacion:$('#renov-codigo').value||null });
        cerrarModal(); toast('✅ Renovado',`Vence: ${fechaCorta(r.nueva_fecha_vencimiento)}`,'ok');
        moduloSaHoteles();
      } catch(err){ toast('Error',err.message,'error'); btn.disabled=false; btn.textContent='Renovar'; }
    });

  } catch(err){ toast('Error al cargar',err.message,'error'); }
}

async function cambiarPlanHotel(hotelId, plan, btn) {
  try {
    await db.from('hoteles').update({ plan }).eq('id', hotelId);
    cerrarModal();
    toast(`✅ Plan cambiado a ${plan.toUpperCase()}`, plan==='pro'?'Ya tiene acceso a Restaurante y Cocina':'Plan básico activado', 'ok');
    moduloSaHoteles();
  } catch(err){ toast('Error',err.message,'error'); }
}

async function resetearPassDueno(userId) {
  const pass = document.getElementById('nueva-pass-dueno')?.value?.trim();
  if (!pass || pass.length < 6) { toast('Mínimo 6 caracteres','','warn'); return; }
  try {
    await rpc('fn_resetear_password_empleado', { p_empleado_user_id: userId, p_nueva_password: pass });
    toast('✅ Contraseña reseteada', `Nueva contraseña: ${pass}`, 'ok');
    document.getElementById('nueva-pass-dueno').value = '';
  } catch(err){ toast('Error',err.message,'error'); }
}

async function darProrroga(hotelId, dias) {
  try {
    await rpc('fn_dar_prorroga', { p_hotel_id: hotelId, p_dias: dias });
    cerrarModal(); toast('✅ Prórroga otorgada',`+${dias} días de gracia`,'ok');
    moduloSaHoteles();
  } catch(err){ toast('Error',err.message,'error'); }
}

async function cambiarEstadoHotel(hotelId, nuevoEstado) {
  try {
    const { error } = await db.from('hoteles').update({ estado: nuevoEstado }).eq('id', hotelId);
    if (error) throw error;
    cerrarModal();
    toast(nuevoEstado==='activo'?'✅ Hotel reactivado':'🚫 Hotel suspendido','',nuevoEstado==='activo'?'ok':'warn');
    moduloSaHoteles();
  } catch(err){ toast('Error',err.message,'error'); }
}

// ── Alta integral de hotel ──────────────────────────────────
function abrirFormAltaHotel() {
  const html = `
    <form id="form-alta-hotel">
      <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--azul);margin-bottom:0.75rem;">1 · Datos del hotel</div>
      <div style="${ST.grupo}"><label style="${ST.label}">Razón social *</label><input style="${ST.input}" name="razon_social" required placeholder="Inversiones Hotel SAC"></div>
      <div style="${ST.fila}">
        <div style="${ST.grupo}"><label style="${ST.label}">RUC *</label><input style="${ST.input}" name="ruc" required maxlength="11" placeholder="20123456789"></div>
        <div style="${ST.grupo}"><label style="${ST.label}">Nombre comercial *</label><input style="${ST.input}" name="nombre_comercial" required placeholder="Hotel Las Palmeras"></div>
      </div>
      <div style="${ST.grupo}"><label style="${ST.label}">Dirección</label><input style="${ST.input}" name="direccion" placeholder="Av. Principal 123"></div>
      <div style="${ST.fila}">
        <div style="${ST.grupo}"><label style="${ST.label}">Teléfono</label><input style="${ST.input}" name="telefono" placeholder="999999999"></div>
        <div style="${ST.grupo}"><label style="${ST.label}">Email contacto</label><input style="${ST.input}" name="email_contacto" type="email" placeholder="contacto@hotel.com"></div>
      </div>

      <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--azul);margin:1.25rem 0 0.75rem;">2 · Plan y suscripción</div>
      <div style="${ST.fila}">
        <div style="${ST.grupo}"><label style="${ST.label}">Plan</label>
          <select style="${ST.input}" name="plan">
            <option value="basico">Básico (solo PMS)</option>
            <option value="pro">PRO (PMS + Restaurante + Cocina)</option>
          </select>
        </div>
        <div style="${ST.grupo}"><label style="${ST.label}">Ciclo de pago</label>
          <select style="${ST.input}" name="ciclo_pago">
            <option value="mensual">Mensual</option><option value="trimestral">Trimestral</option>
            <option value="semestral">Semestral</option><option value="anual">Anual</option>
          </select>
        </div>
      </div>

      <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--azul);margin:1.25rem 0 0.75rem;">3 · Cuenta del dueño</div>
      <div style="${ST.grupo}"><label style="${ST.label}">Nombre del dueño *</label><input style="${ST.input}" name="nombre_dueno" required placeholder="Juan Pérez"></div>
      <div style="${ST.fila}">
        <div style="${ST.grupo}"><label style="${ST.label}">Email (login) *</label><input style="${ST.input}" name="email_dueno" type="email" required placeholder="dueno@hotel.com"></div>
        <div style="${ST.grupo}"><label style="${ST.label}">Contraseña *</label><input style="${ST.input}" name="password_dueno" required minlength="6" placeholder="Mínimo 6 caracteres"></div>
      </div>

      <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--azul);margin:1.25rem 0 0.75rem;">4 · Pago inicial</div>
      <div style="${ST.fila}">
        <div style="${ST.grupo}"><label style="${ST.label}">Meses pagados *</label>
          <select style="${ST.input}" name="meses_pagados">
            <option value="1">1 mes</option><option value="3">3 meses</option>
            <option value="6">6 meses</option><option value="12">12 meses</option>
          </select>
        </div>
        <div style="${ST.grupo}"><label style="${ST.label}">Monto cobrado *</label><input style="${ST.input}" name="monto_cobrado" type="number" step="0.01" required placeholder="120.00"></div>
      </div>
      <div style="${ST.fila}">
        <div style="${ST.grupo}"><label style="${ST.label}">Método</label>
          <select style="${ST.input}" name="metodo_pago">
            <option value="yape">Yape</option><option value="plin">Plin</option>
            <option value="transferencia">Transferencia</option><option value="efectivo">Efectivo</option>
          </select>
        </div>
        <div style="${ST.grupo}"><label style="${ST.label}">Código operación</label><input style="${ST.input}" name="codigo_operacion" placeholder="Opcional"></div>
      </div>

      <div id="alta-error" style="display:none;background:#FEF2F2;border:1px solid #FECACA;color:var(--rojo);padding:0.6rem 0.85rem;border-radius:8px;font-size:0.82rem;margin-bottom:0.75rem;"></div>
      <button type="submit" id="btn-alta-submit" style="width:100%;padding:0.85rem;background:linear-gradient(135deg,var(--azul),#2563EB);color:white;border:none;border-radius:10px;font-size:0.92rem;font-weight:600;cursor:pointer;">Registrar hotel</button>
    </form>
  `;
  abrirModal('Registrar nuevo hotel', html, { ancho: '560px' });

  $('#form-alta-hotel').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const g = k => fd.get(k) || '';
    const errEl = $('#alta-error'); errEl.style.display='none';
    const btn = $('#btn-alta-submit'); btn.disabled=true; btn.textContent='Registrando…';
    try {
      await rpc('fn_registrar_hotel', {
        p_razon_social:g('razon_social'), p_ruc:g('ruc'), p_nombre_comercial:g('nombre_comercial'),
        p_direccion:g('direccion'), p_telefono:g('telefono'), p_email_contacto:g('email_contacto'),
        p_plan:g('plan'), p_ciclo_pago:g('ciclo_pago'),
        p_email_dueno:g('email_dueno'), p_password_dueno:g('password_dueno'), p_nombre_dueno:g('nombre_dueno'),
        p_meses_pagados:parseInt(g('meses_pagados')), p_monto_cobrado:parseFloat(g('monto_cobrado')),
        p_metodo_pago:g('metodo_pago'), p_codigo_operacion:g('codigo_operacion')||null,
        p_usuario_sol:'', p_clave_sol:'', p_token_api:'', p_endpoint_facturador:'',
      });
      cerrarModal(); toast('✅ Hotel registrado','El dueño ya puede iniciar sesión','ok');
      moduloSaHoteles();
    } catch(err){
      errEl.textContent='Error: '+err.message; errEl.style.display='block';
      btn.disabled=false; btn.textContent='Registrar hotel';
    }
  });
}

// ════════════════════════════════════════════════════════════
//  SUPERADMIN › SUSCRIPCIONES (historial de pagos)
// ════════════════════════════════════════════════════════════
async function moduloSaSuscripciones() {
  skeleton();
  try {
    const { data: pagos, error } = await db.from('suscripciones_pagos')
      .select(`*, hoteles(nombre_comercial, plan)`)
      .order('fecha_pago', { ascending: false }).limit(200);
    if (error) throw error;

    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const totalMes  = pagos.filter(p => new Date(p.fecha_pago) >= inicioMes).reduce((s,p)=>s+Number(p.monto_cobrado),0);
    const totalAcum = pagos.reduce((s,p)=>s+Number(p.monto_cobrado),0);

    contenido().innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;margin-bottom:1.25rem;">
        <div style="display:flex;align-items:center;gap:1rem;">
          <div style="width:52px;height:52px;border-radius:14px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" style="width:26px;height:26px;"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
          </div>
          <div>
            <h1 style="font-size:1.5rem;font-weight:700;color:var(--texto);margin:0;">Suscripciones</h1>
            <p style="font-size:0.83rem;color:var(--texto-sub);margin:0.2rem 0 0;">Historial completo de pagos cobrados</p>
          </div>
        </div>
      </div>

      <!-- KPIs -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-bottom:1.25rem;">
        ${saKpi('MRR este mes', soles(totalMes), '#2563EB','#EFF6FF','<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>')}
        ${saKpi('Total acumulado', soles(totalAcum), '#16A34A','#F0FDF4','<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>')}
        ${saKpi('Total pagos', pagos.length, '#64748B','#F1F5F9','<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>')}
      </div>

      <!-- Tabla -->
      <div style="background:white;border:1px solid var(--gris-borde);border-radius:14px;overflow:hidden;">
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:0.85rem;min-width:640px;">
            <thead><tr style="border-bottom:1px solid var(--gris-borde);text-align:left;">
              <th style="${thCss()}">Fecha</th>
              <th style="${thCss()}">Hotel</th>
              <th style="${thCss()}">Plan</th>
              <th style="${thCss()}">Meses</th>
              <th style="${thCss()}">Monto</th>
              <th style="${thCss()}">Método</th>
              <th style="${thCss()}">Código op.</th>
            </tr></thead>
            <tbody>
              ${pagos.length===0
                ?`<tr><td colspan="7" style="padding:2rem;text-align:center;color:var(--texto-sub);">Sin pagos aún.</td></tr>`
                :pagos.map(p=>`
                  <tr style="border-bottom:1px solid var(--gris-borde);">
                    <td style="${tdCss()};font-size:0.8rem;">${fechaCorta(p.fecha_pago)}</td>
                    <td style="${tdCss()};font-weight:600;">${escapeHtml(p.hoteles?.nombre_comercial||'—')}</td>
                    <td style="${tdCss()}">${p.hoteles?.plan==='pro'
                      ?`<span style="font-size:0.7rem;font-weight:700;color:#7C3AED;background:#F5F3FF;padding:0.15rem 0.55rem;border-radius:999px;">PRO</span>`
                      :`<span style="font-size:0.7rem;font-weight:700;color:#2563EB;background:#EFF6FF;padding:0.15rem 0.55rem;border-radius:999px;">BÁSICO</span>`}
                    </td>
                    <td style="${tdCss()};text-align:center;">${p.meses_renovados}</td>
                    <td style="${tdCss()};font-weight:700;color:var(--verde);">${soles(p.monto_cobrado)}</td>
                    <td style="${tdCss()};text-transform:capitalize;">${p.metodo_pago}</td>
                    <td style="${tdCss()};font-family:monospace;font-size:0.78rem;color:var(--texto-sub);">${escapeHtml(p.codigo_operacion||'—')}</td>
                  </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch(err){ contenido().innerHTML = errorBox('No se pudo cargar el historial', err.message); }
}

//  HOTEL › CAJA POR TURNOS (arqueo ciego, solo efectivo)
// ════════════════════════════════════════════════════════════
async function moduloCaja() {
  skeleton();
  try {
    SESSION.turnoActivo = await getTurnoAbierto();

    if (!SESSION.turnoActivo) {
      renderCajaCerrada();
    } else {
      await renderCajaAbierta();
    }
  } catch (err) {
    contenido().innerHTML = errorBox('No se pudo cargar la caja', err.message);
  }
}

// ── Estado: sin turno abierto → formulario de apertura ──────
function renderCajaCerrada() {
  contenido().innerHTML = `
    <!-- Header -->
    <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem;">
      <div style="width:52px;height:52px;border-radius:14px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:26px;height:26px;"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
      </div>
      <div>
        <h1 style="font-size:1.5rem;font-weight:700;color:var(--texto);margin:0;">Caja / Turno</h1>
        <p style="font-size:0.83rem;color:var(--texto-sub);margin:0.2rem 0 0;">Controla tus ingresos y egresos en tiempo real</p>
      </div>
    </div>

    <!-- Badge sin turno -->
    <div style="display:inline-flex;align-items:center;gap:0.5rem;background:#FEF2F2;border:1px solid #FECACA;border-radius:999px;padding:0.4rem 1rem;font-size:0.82rem;font-weight:600;color:#DC2626;margin-bottom:1.5rem;">
      <span style="width:8px;height:8px;border-radius:50%;background:#DC2626;"></span>
      Sin turno abierto
    </div>

    <!-- Card apertura -->
    <div style="max-width:480px;background:white;border:1px solid var(--gris-borde);border-radius:16px;padding:1.75rem;">
      <div style="display:flex;align-items:center;gap:0.85rem;margin-bottom:1.5rem;">
        <div style="width:48px;height:48px;border-radius:13px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;">
          <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" style="width:24px;height:24px;"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <div>
          <div style="font-weight:700;font-size:1.05rem;">Abrir turno de caja</div>
          <div style="font-size:0.8rem;color:var(--texto-sub);">Cuenta el efectivo físico con el que arrancas</div>
        </div>
      </div>
      <div style="${ST.grupo}">
        <label style="${ST.label}">Fondo inicial (efectivo físico) *</label>
        <input style="${ST.input};font-size:1.2rem;font-weight:600;text-align:center;" id="caja-fondo" type="number" step="0.01" placeholder="100.00" autofocus>
      </div>
      <button style="width:100%;padding:0.85rem;background:linear-gradient(135deg,var(--azul),#2563EB);color:white;border:none;border-radius:10px;font-size:0.95rem;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:0.5rem;box-shadow:0 4px 14px rgba(26,63,166,0.3);" id="btn-abrir-caja">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" style="width:18px;height:18px;"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        Abrir turno
      </button>
    </div>
  `;

  $('#btn-abrir-caja').addEventListener('click', async () => {
    const fondo = parseFloat($('#caja-fondo').value);
    if (isNaN(fondo) || fondo < 0) { toast('Fondo inválido', 'Ingresa el monto físico inicial', 'warn'); return; }
    const btn = $('#btn-abrir-caja');
    btn.disabled = true; btn.innerHTML = 'Abriendo…';
    try {
      const { data, error } = await db.from('turnos_caja').insert({
        hotel_id: SESSION.hotel.id,
        recepcionista_id: SESSION.user.id,
        fondo_inicial: fondo,
        estado: 'abierto',
      }).select().single();
      if (error) throw error;
      SESSION.turnoActivo = data;
      toast('Turno abierto', `Fondo inicial: ${soles(fondo)}`, 'ok');
      await renderCajaAbierta();
    } catch (err) {
      toast('Error al abrir', err.message, 'error');
      btn.disabled = false; btn.innerHTML = 'Abrir turno';
    }
  });
}

// ── Estado: turno abierto → panel completo ──────────────────
async function renderCajaAbierta() {
  const turno = SESSION.turnoActivo;

  const { data: movs, error } = await db
    .from('movimientos_caja')
    .select('*')
    .eq('turno_caja_id', turno.id)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;

  // Totales por método
  const res = { efectivo:0, yape:0, plin:0, transferencia:0, egresos:0 };
  let totalIngresos = 0;
  (movs||[]).forEach(m => {
    if (m.tipo === 'ingreso') {
      const met = m.metodo_pago || 'efectivo';
      res[met] = (res[met]||0) + Number(m.monto);
      totalIngresos += Number(m.monto);
    } else if (m.tipo === 'egreso') {
      res.egresos += Number(m.monto);
    }
  });
  const saldoCaja = Number(turno.fondo_inicial) + totalIngresos - res.egresos;

  // Fechas del turno
  const desde = new Date(turno.apertura_at);
  const desdeStr = `Desde ${desde.getDate()} de ${desde.toLocaleString('es-PE',{month:'short'})}. ${desde.getFullYear()}, ${desde.toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'})}`;

  // Métodos con íconos y colores
  const metodos = [
    { key:'efectivo',     label:'Efectivo (ingresos)', color:'#16A34A', bg:'#F0FDF4',
      icon:'<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>' },
    { key:'yape',         label:'Yape',               color:'#7C3AED', bg:'#F5F3FF',
      icon:'<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>' },
    { key:'plin',         label:'Plin',               color:'#0891B2', bg:'#F0F9FF',
      icon:'<rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>' },
    { key:'transferencia',label:'Transferencias',     color:'#EA580C', bg:'#FFF7ED',
      icon:'<path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>' },
    { key:'egresos',      label:'Egresos',            color:'#DC2626', bg:'#FEF2F2',
      icon:'<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>' },
  ];

  contenido().innerHTML = `
    <div>
      <!-- Header + badge + tarjetas (ancho completo) -->
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;margin-bottom:0.85rem;">
        <div style="display:flex;align-items:center;gap:1rem;">
          <div style="width:52px;height:52px;border-radius:14px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" style="width:26px;height:26px;"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div>
            <h1 style="font-size:1.4rem;font-weight:700;color:var(--texto);margin:0;">Caja / Turno</h1>
            <p style="font-size:0.82rem;color:var(--texto-sub);margin:0.2rem 0 0;">Controla tus ingresos y egresos en tiempo real</p>
          </div>
        </div>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;">
          <button onclick="descargarReporteCaja()" style="display:flex;align-items:center;gap:0.4rem;background:white;border:1px solid var(--gris-borde);border-radius:9px;padding:0.55rem 0.9rem;font-size:0.82rem;font-weight:500;color:var(--texto-sub);cursor:pointer;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:15px;height:15px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Reporte de caja
          </button>
          <button onclick="abrirFormMovimiento('ingreso')" style="display:flex;align-items:center;gap:0.4rem;background:white;border:1px solid var(--gris-borde);border-radius:9px;padding:0.55rem 0.9rem;font-size:0.82rem;font-weight:600;color:var(--verde);cursor:pointer;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:15px;height:15px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Ingreso
          </button>
          <button onclick="abrirFormMovimiento('egreso')" style="display:flex;align-items:center;gap:0.4rem;background:white;border:1px solid #FECACA;border-radius:9px;padding:0.55rem 0.9rem;font-size:0.82rem;font-weight:600;color:var(--rojo);cursor:pointer;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:15px;height:15px;"><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Egreso / gasto
          </button>
          <button onclick="abrirCierreCiego()" style="display:flex;align-items:center;gap:0.5rem;background:linear-gradient(135deg,var(--azul),#2563EB);color:white;border:none;border-radius:9px;padding:0.55rem 1rem;font-size:0.82rem;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(26,63,166,0.3);">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" style="width:15px;height:15px;"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Cerrar turno
          </button>
        </div>
      </div>

      <!-- Badge turno abierto + fondo -->
      <div style="display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap;margin-bottom:1.25rem;">
        <div style="display:inline-flex;align-items:center;gap:0.5rem;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:999px;padding:0.4rem 1rem;font-size:0.82rem;font-weight:600;color:#16A34A;">
          <span style="width:8px;height:8px;border-radius:50%;background:#16A34A;"></span>
          Turno abierto
        </div>
        <span style="font-size:0.83rem;color:var(--texto-sub);">${desdeStr}</span>
        <span style="font-size:0.83rem;color:var(--texto-sub);">|</span>
        <span style="font-size:0.83rem;color:var(--texto-sub);">Fondo inicial: <strong>${soles(turno.fondo_inicial)}</strong></span>
      </div>

      <!-- 5 tarjetas por método (ancho completo) -->
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:0.75rem;margin-bottom:1.5rem;">
        ${metodos.map(m => cajaTarjeta(m.label, res[m.key]||0, m.color, m.bg, m.icon,
          (movs||[]).filter(x => m.key==='egresos' ? x.tipo==='egreso' : x.metodo_pago===m.key && x.tipo==='ingreso').length
        )).join('')}
      </div>

      <!-- Grid: movimientos + resumen ALINEADOS -->
      <div style="display:grid;grid-template-columns:1fr 260px;gap:1.25rem;align-items:start;">

        <!-- Movimientos -->
        <div style="background:white;border:1px solid var(--gris-borde);border-radius:14px;overflow:hidden;">
          <div style="padding:1rem 1.25rem;border-bottom:1px solid var(--gris-borde);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.75rem;">
            <div>
              <div style="display:flex;align-items:center;gap:0.6rem;">
                <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" style="width:18px;height:18px;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span style="font-weight:700;">Movimientos del turno (${(movs||[]).length})</span>
              </div>
              <div style="font-size:0.78rem;color:var(--texto-sub);margin-top:0.2rem;">Lista de ingresos y egresos registrados en este turno</div>
            </div>
            <div style="display:flex;align-items:center;gap:0.5rem;">
              <div style="display:flex;align-items:center;gap:0.5rem;background:var(--gris-bg);border:1px solid var(--gris-borde);border-radius:9px;padding:0.5rem 0.85rem;">
                <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" id="caja-buscar" placeholder="Buscar por concepto, hab. o método…" oninput="filtrarMovimientos()" style="border:none;background:none;outline:none;font-size:0.8rem;width:180px;font-family:inherit;color:var(--texto);">
              </div>
              <div style="display:flex;align-items:center;gap:0.4rem;background:white;border:1px solid var(--gris-borde);border-radius:9px;padding:0.5rem 0.75rem;font-size:0.8rem;color:var(--texto-sub);cursor:pointer;">
                Todos
                <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:12px;height:12px;"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
          </div>
          <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:0.85rem;min-width:620px;">
              <thead>
                <tr style="border-bottom:1px solid var(--gris-borde);text-align:left;">
                  <th style="${thCss()}">HORA</th>
                  <th style="${thCss()}">CONCEPTO</th>
                  <th style="${thCss()}">HABITACIÓN</th>
                  <th style="${thCss()}">MÉTODO</th>
                  <th style="${thCss()}">TIPO</th>
                  <th style="${thCss()}">MONTO</th>
                  <th style="${thCss()}">USUARIO</th>
                  <th style="${thCss()};text-align:right;">ACCIONES</th>
                </tr>
              </thead>
              <tbody id="caja-movs-tbody">
                ${renderFilasCaja(movs||[])}
              </tbody>
            </table>
          </div>
          <div style="padding:0.85rem 1.25rem;display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--gris-borde);flex-wrap:wrap;gap:0.75rem;">
            <span style="font-size:0.82rem;color:var(--texto-sub);">Mostrando 1 a ${(movs||[]).length} de ${(movs||[]).length} movimientos</span>
            <div style="display:flex;align-items:center;gap:0.5rem;">
              <button style="width:32px;height:32px;border:1px solid var(--gris-borde);border-radius:8px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--texto-sub);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button style="width:32px;height:32px;border:none;border-radius:8px;background:var(--azul);color:white;font-weight:700;font-size:0.85rem;cursor:pointer;">1</button>
              <button style="width:32px;height:32px;border:1px solid var(--gris-borde);border-radius:8px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--texto-sub);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
              <select style="border:1px solid var(--gris-borde);border-radius:8px;padding:0.3rem 0.6rem;font-size:0.82rem;color:var(--texto-sub);background:white;cursor:pointer;">
                <option>10 por página</option><option>25 por página</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Resumen del turno (alineado con movimientos) -->
        <div style="background:white;border:1px solid var(--gris-borde);border-radius:14px;padding:1.25rem;">
          <div style="display:flex;align-items:center;gap:0.5rem;font-weight:700;margin-bottom:1.1rem;">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--azul)" stroke-width="2" stroke-linecap="round" style="width:18px;height:18px;"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            Resumen del turno
          </div>
          ${filaResumen('Fondo inicial', soles(turno.fondo_inicial), '#64748B')}
          ${filaResumen('Total ingresos', soles(totalIngresos), '#16A34A')}
          ${filaResumen('Total egresos', soles(res.egresos), '#DC2626')}
          <div style="height:1px;background:var(--gris-borde);margin:0.85rem 0;"></div>
          <div style="background:var(--gris-bg);border-radius:12px;padding:1rem;text-align:center;margin-bottom:1rem;">
            <div style="font-size:0.75rem;color:var(--texto-sub);margin-bottom:0.3rem;font-weight:500;">Saldo en caja</div>
            <div style="font-size:1.75rem;font-weight:700;color:var(--texto);">${soles(saldoCaja)}</div>
          </div>
          <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:0.85rem;display:flex;align-items:flex-start;gap:0.65rem;">
            <div style="width:28px;height:28px;border-radius:50%;background:#16A34A;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" style="width:14px;height:14px;"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <div style="font-weight:700;font-size:0.85rem;color:#15803D;">Turno abierto</div>
              <div style="font-size:0.75rem;color:#16A34A;margin-top:0.2rem;">Recuerda cerrar el turno al finalizar tu jornada para mantener un control correcto.</div>
            </div>
          </div>
        </div>

      </div><!-- fin grid movimientos+resumen -->
    </div><!-- fin contenedor principal -->
  `;
}

function cajaTarjeta(label, valor, color, bg, icon, movCount) {
  return `
    <div style="background:white;border:1px solid var(--gris-borde);border-radius:14px;padding:1.1rem 1rem;position:relative;overflow:hidden;min-width:0;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:0.75rem;">
        <div style="width:40px;height:40px;border-radius:11px;background:${bg};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;">${icon}</svg>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" style="width:17px;height:17px;opacity:0.65;margin-top:2px;"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
      </div>
      <div style="font-size:0.73rem;color:var(--texto-sub);margin-bottom:0.25rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${label}</div>
      <div style="font-size:1.25rem;font-weight:700;color:${color==='#DC2626'?'var(--rojo)':color==='#16A34A'?'var(--verde)':color};line-height:1.1;">${soles(valor)}</div>
      <div style="font-size:0.7rem;color:var(--texto-sub);margin-top:0.2rem;">${movCount} movimiento${movCount!==1?'s':''}</div>
    </div>`;
}

function filaResumen(label, valor, color) {
  return `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:0.45rem 0;font-size:0.85rem;">
      <div style="display:flex;align-items:center;gap:0.5rem;color:var(--texto-sub);">
        <span style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0;"></span>
        ${label}
      </div>
      <strong style="color:${color==='#16A34A'?'var(--verde)':color==='#DC2626'?'var(--rojo)':'var(--texto)'};">${valor}</strong>
    </div>`;
}

function renderFilasCaja(movs) {
  if (!movs.length) return `
    <tr><td colspan="8" style="padding:2.5rem;text-align:center;color:var(--texto-sub);">
      <div style="font-size:1.75rem;margin-bottom:0.4rem;">📋</div>
      Sin movimientos en este turno
    </td></tr>`;

  const metIconos = {
    efectivo:      { bg:'#F0FDF4', color:'#16A34A', ico:'<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>', label:'Efectivo' },
    yape:          { bg:'#F5F3FF', color:'#7C3AED', ico:'<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>', label:'Yape' },
    plin:          { bg:'#F0F9FF', color:'#0891B2', ico:'<rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>', label:'Plin' },
    transferencia: { bg:'#FFF7ED', color:'#EA580C', ico:'<path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>', label:'Transferencia' },
  };

  const nombre = SESSION.perfil?.nombre_completo || 'Usuario';
  const iniciales = nombre.split(/\s+/).slice(0,2).map(p=>p[0]||'').join('').toUpperCase()||'U';
  const rolLabel = SESSION.perfil?.rol === 'admin' ? 'Admin' : (SESSION.perfil?.rol||'—');

  return movs.map(m => {
    const met = metIconos[m.metodo_pago] || { bg:'#F1F5F9', color:'#64748B', ico:'<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>', label: m.metodo_pago||'—' };
    const habMatch = m.concepto?.match(/Hab\.\s*(\w+)/i) || m.concepto?.match(/habitaci[oó]n\s+(\w+)/i);
    const habNum = habMatch ? habMatch[1] : null;
    const hora = new Date(m.created_at);
    const esIngreso = m.tipo === 'ingreso';

    return `
      <tr class="caja-fila" data-buscar="${(m.concepto+' '+(m.metodo_pago||'')+' '+(habNum||'')).toLowerCase()}" style="border-bottom:1px solid var(--gris-borde);">
        <td style="${tdCss()}">
          <div style="font-weight:600;font-size:0.85rem;">${hora.toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'})}</div>
          <div style="font-size:0.72rem;color:var(--texto-sub);">${hora.toLocaleDateString('es-PE',{day:'2-digit',month:'2-digit',year:'numeric'})}</div>
        </td>
        <td style="${tdCss()}">
          <div style="font-weight:600;font-size:0.85rem;">${escapeHtml(m.concepto?.split('\n')[0]||'—')}</div>
          ${m.concepto?.includes(' - ') ? `<div style="font-size:0.72rem;color:var(--texto-sub);">${escapeHtml(m.concepto.split(' - ').slice(1).join(' - ').substring(0,40))}</div>` : ''}
        </td>
        <td style="${tdCss()}">
          ${habNum ? `<span style="display:inline-block;background:var(--gris-bg);border:1px solid var(--gris-borde);border-radius:7px;padding:0.2rem 0.6rem;font-weight:700;font-size:0.82rem;">${escapeHtml(habNum)}</span>` : '<span style="color:var(--texto-sub);font-size:0.8rem;">—</span>'}
        </td>
        <td style="${tdCss()}">
          <div style="display:flex;align-items:center;gap:0.5rem;">
            <div style="width:28px;height:28px;border-radius:7px;background:${met.bg};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <svg viewBox="0 0 24 24" fill="none" stroke="${met.color}" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;">${met.ico}</svg>
            </div>
            <span style="font-size:0.82rem;">${met.label}</span>
          </div>
        </td>
        <td style="${tdCss()}">
          <span style="display:inline-flex;align-items:center;gap:0.35rem;font-size:0.75rem;font-weight:700;color:${esIngreso?'#16A34A':'#DC2626'};background:${esIngreso?'#F0FDF4':'#FEF2F2'};padding:0.2rem 0.65rem;border-radius:999px;">
            ${esIngreso ? 'Ingreso ↑' : 'Egreso ↓'}
          </span>
        </td>
        <td style="${tdCss()};font-weight:700;color:${esIngreso?'var(--verde)':'var(--rojo)'};">
          ${esIngreso ? '+' : '−'} ${soles(m.monto)}
        </td>
        <td style="${tdCss()}">
          <div style="display:flex;align-items:center;gap:0.5rem;">
            <div style="width:30px;height:30px;border-radius:8px;background:rgba(37,99,235,0.1);color:var(--azul);font-weight:700;font-size:0.72rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${iniciales}</div>
            <div>
              <div style="font-weight:600;font-size:0.8rem;">${escapeHtml(nombre)}</div>
              <div style="font-size:0.7rem;color:var(--texto-sub);">${rolLabel}</div>
            </div>
          </div>
        </td>
        <td style="${tdCss()};text-align:right;">
          <button style="width:30px;height:30px;border:1px solid var(--gris-borde);border-radius:8px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--texto-sub);" onmouseover="this.style.background='var(--gris-bg)'" onmouseout="this.style.background='white'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
          </button>
        </td>
      </tr>`;
  }).join('');
}

function filtrarMovimientos() {
  const q = (document.getElementById('caja-buscar')?.value||'').toLowerCase();
  document.querySelectorAll('.caja-fila').forEach(tr => {
    tr.style.display = !q || tr.dataset.buscar.includes(q) ? '' : 'none';
  });
}

function descargarReporteCaja() {
  const turno = SESSION.turnoActivo;
  if (!turno) return;
  toast('Reporte', 'Función disponible próximamente', 'info');
}

function resumenTarjeta(label, valor, color) {
  return `
    <div class="card" style="padding:1rem;">
      <div style="font-size:0.72rem; color:var(--texto-sub); margin-bottom:0.3rem;">${label}</div>
      <div style="font-size:1.15rem; font-weight:700; color:${color};">${soles(valor)}</div>
    </div>`;
}

// ── Formulario de ingreso / egreso manual ───────────────────
function abrirFormMovimiento(tipo) {
  const esEgreso = tipo === 'egreso';
  const html = `
    <form id="form-mov">
      <div style="${ST.grupo}">
        <label style="${ST.label}">Concepto / motivo *</label>
        <input style="${ST.input}" name="concepto" required placeholder="${esEgreso ? 'Ej: compra de útiles' : 'Ej: pago pendiente hab. 203'}">
      </div>
      <div style="${ST.fila}">
        <div style="${ST.grupo}">
          <label style="${ST.label}">Monto *</label>
          <input style="${ST.input}" name="monto" type="number" step="0.01" required placeholder="0.00" autofocus>
        </div>
        <div style="${ST.grupo}">
          <label style="${ST.label}">Método</label>
          <select style="${ST.input}" name="metodo_pago">
            <option value="efectivo">Efectivo</option>
            ${!esEgreso ? `
              <option value="yape">Yape</option>
              <option value="plin">Plin</option>
              <option value="transferencia">Transferencia</option>` : ''}
          </select>
        </div>
      </div>
      <button type="submit" style="${esEgreso ? ST.btnDanger : ST.btnPri}; width:100%; padding:0.8rem;">
        Registrar ${esEgreso ? 'egreso' : 'ingreso'}
      </button>
    </form>
  `;
  abrirModal(esEgreso ? 'Registrar egreso / gasto' : 'Registrar ingreso', html);

  $('#form-mov').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target;
    const monto = parseFloat(f.elements['monto'].value);
    if (isNaN(monto) || monto <= 0) { toast('Monto inválido', '', 'warn'); return; }
    try {
      const { error } = await db.from('movimientos_caja').insert({
        hotel_id: SESSION.hotel.id,
        turno_caja_id: SESSION.turnoActivo.id,
        tipo: tipo,
        concepto: f.elements['concepto'].value,
        monto: monto,
        metodo_pago: f.elements['metodo_pago'].value,
        referencia_tipo: esEgreso ? 'egreso_menor' : 'ingreso_manual',
        usuario_id: SESSION.user.id,
      });
      if (error) throw error;
      cerrarModal();
      toast(esEgreso ? 'Egreso registrado' : 'Ingreso registrado', soles(monto), 'ok');
      await renderCajaAbierta();
    } catch (err) {
      toast('Error', err.message, 'error');
    }
  });
}

// ── Cierre CIEGO: el recepcionista NO ve el esperado ────────
function abrirCierreCiego() {
  const html = `
    <div style="background:#FFFBEB; border:1px solid #FDE68A; border-radius:10px; padding:0.85rem 1rem; margin-bottom:1.25rem; font-size:0.82rem; color:#92400E; line-height:1.5;">
      <strong>Arqueo ciego.</strong> Cuenta todo el efectivo físico del cajón (fondo inicial + ventas en efectivo − egresos) y declara el total. El sistema comparará después.
    </div>

    <div style="${ST.grupo}">
      <label style="${ST.label}">Efectivo físico contado *</label>
      <input style="${ST.input}; font-size:1.3rem; font-weight:700; text-align:center;" id="cierre-declarado" type="number" step="0.01" placeholder="0.00" autofocus>
    </div>
    <div style="${ST.grupo}">
      <label style="${ST.label}">Notas de cierre (opcional)</label>
      <input style="${ST.input}" id="cierre-notas" placeholder="Observaciones del turno">
    </div>

    <button style="${ST.btnPri}" id="btn-cierre-confirm">Confirmar cierre</button>
  `;
  abrirModal('Cerrar turno de caja', html);

  $('#btn-cierre-confirm').addEventListener('click', async () => {
    const declarado = parseFloat($('#cierre-declarado').value);
    if (isNaN(declarado) || declarado < 0) { toast('Monto inválido', 'Declara el efectivo contado', 'warn'); return; }
    const btn = $('#btn-cierre-confirm');
    btn.disabled = true; btn.textContent = 'Calculando…';

    try {
      const turno = SESSION.turnoActivo;

      // 1. Calcular efectivo esperado INTERNAMENTE (solo efectivo)
      const { data: movs, error: e1 } = await db
        .from('movimientos_caja')
        .select('tipo, monto, metodo_pago')
        .eq('turno_caja_id', turno.id);
      if (e1) throw e1;

      let ingresosEfectivo = 0, egresosEfectivo = 0;
      (movs || []).forEach(m => {
        if (m.tipo === 'ingreso' && (m.metodo_pago || 'efectivo') === 'efectivo') ingresosEfectivo += Number(m.monto);
        if (m.tipo === 'egreso'  && (m.metodo_pago || 'efectivo') === 'efectivo') egresosEfectivo  += Number(m.monto);
      });

      const esperado   = Number(turno.fondo_inicial) + ingresosEfectivo - egresosEfectivo;
      const diferencia = declarado - esperado;

      // 2. Registrar el cierre inmutable
      const { error: e2 } = await db.from('turnos_caja').update({
        estado: 'cerrado',
        efectivo_esperado: esperado,
        efectivo_declarado: declarado,
        diferencia: diferencia,
        notas_cierre: $('#cierre-notas').value || null,
        cierre_at: new Date().toISOString(),
      }).eq('id', turno.id);
      if (e2) throw e2;

      cerrarModal();
      SESSION.turnoActivo = null;

      // 3. Mostrar RESULTADO del arqueo (recién ahora se revela)
      mostrarResultadoArqueo(esperado, declarado, diferencia);

    } catch (err) {
      toast('Error al cerrar', err.message, 'error');
      btn.disabled = false; btn.textContent = 'Confirmar cierre';
    }
  });
}

function mostrarResultadoArqueo(esperado, declarado, diferencia) {
  let tipoTxt, tipoColor, tipoBg, tipoIcon;
  if (Math.abs(diferencia) < 0.01) {
    tipoTxt = 'Caja cuadrada'; tipoColor = '#16A34A'; tipoBg = '#F0FDF4';
    tipoIcon = '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>';
  } else if (diferencia < 0) {
    tipoTxt = 'Faltante'; tipoColor = '#DC2626'; tipoBg = '#FEF2F2';
    tipoIcon = '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>';
  } else {
    tipoTxt = 'Sobrante'; tipoColor = '#EA580C'; tipoBg = '#FFF7ED';
    tipoIcon = '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>';
  }

  const html = `
    <div style="text-align:center;">
      <div style="width:64px; height:64px; border-radius:50%; background:${tipoBg}; display:flex; align-items:center; justify-content:center; margin:0 auto 1rem;">
        <svg viewBox="0 0 24 24" fill="none" stroke="${tipoColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:30px;height:30px;">${tipoIcon}</svg>
      </div>
      <div style="font-size:1.25rem; font-weight:700; color:${tipoColor}; margin-bottom:1.25rem;">${tipoTxt}</div>

      <div style="background:var(--gris-bg); border-radius:12px; padding:1.25rem; text-align:left;">
        <div style="display:flex; justify-content:space-between; padding:0.4rem 0; font-size:0.9rem;">
          <span style="color:var(--texto-sub);">Efectivo esperado</span>
          <strong>${soles(esperado)}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; padding:0.4rem 0; font-size:0.9rem;">
          <span style="color:var(--texto-sub);">Efectivo declarado</span>
          <strong>${soles(declarado)}</strong>
        </div>
        <div style="height:1px; background:var(--gris-borde); margin:0.5rem 0;"></div>
        <div style="display:flex; justify-content:space-between; padding:0.4rem 0; font-size:1.05rem;">
          <span style="font-weight:600;">Diferencia</span>
          <strong style="color:${tipoColor};">${diferencia >= 0 ? '+' : ''}${soles(diferencia)}</strong>
        </div>
      </div>

      <button style="${ST.btnPri}; margin-top:1.25rem;" onclick="cerrarModal(); moduloCaja();">Entendido</button>
    </div>
  `;
  abrirModal('Resultado del arqueo', html, { ancho: '420px' });
}


// ════════════════════════════════════════════════════════════
//  HOTEL › DASHBOARD (resumen operativo)
// ════════════════════════════════════════════════════════════
async function moduloDashboadHotelPlaceholderRemoved() {}

async function moduloDashboardHotel() {
  skeleton();
  try {
    const habs = await getHabitaciones();
    const conteo = { libre: 0, ocupada: 0, limpieza: 0, reservada: 0, mantenimiento: 0 };
    habs.forEach(h => { conteo[h.estado] = (conteo[h.estado] || 0) + 1; });

    const turno = await getTurnoAbierto();
    const totalHabs = habs.length;
    const ocupadas = conteo.ocupada + conteo.reservada;
    const pctOcupacion = totalHabs > 0 ? Math.round((ocupadas / totalHabs) * 100) : 0;

    // ── Datos reales para las secciones ──
    const hoyIni = new Date(); hoyIni.setHours(0,0,0,0);
    const hoyFin = new Date(); hoyFin.setHours(23,59,59,999);

    // Llegadas de hoy: check-ins (estadías creadas hoy) + reservas con entrada hoy
    const { data: llegadas } = await db.from('estadias_reservas')
      .select(`fecha_entrada, estado, habitaciones(numero), huespedes(nombres, apellidos)`)
      .eq('hotel_id', SESSION.hotel.id)
      .gte('fecha_entrada', hoyIni.toISOString()).lte('fecha_entrada', hoyFin.toISOString())
      .order('fecha_entrada').limit(6);

    // Reservas próximas: reservas a futuro con entrada > ahora
    const { data: reservasProx } = await db.from('estadias_reservas')
      .select(`fecha_entrada, habitaciones(numero), huespedes(nombres, apellidos)`)
      .eq('hotel_id', SESSION.hotel.id)
      .eq('estado', 'reservada')
      .gte('fecha_entrada', new Date().toISOString())
      .order('fecha_entrada').limit(6);

    // Ingresos del día (movimientos de caja de hoy)
    const { data: movsHoy } = await db.from('movimientos_caja')
      .select('tipo, monto, metodo_pago, created_at')
      .eq('hotel_id', SESSION.hotel.id)
      .gte('created_at', hoyIni.toISOString()).lte('created_at', hoyFin.toISOString())
      .limit(2000);
    const ingresosHoy = (movsHoy||[]).filter(m => m.tipo==='ingreso').reduce((s,m)=>s+Number(m.monto),0);

    // Ingresos por hora (para el gráfico de barras)
    const porHora = {};
    (movsHoy||[]).forEach(m => {
      if (m.tipo !== 'ingreso') return;
      const h = new Date(m.created_at).getHours();
      porHora[h] = (porHora[h]||0) + Number(m.monto);
    });
    const horasLabels = ['8 a.m.','10 a.m.','12 p.m.','2 p.m.','4 p.m.','6 p.m.','8 p.m.'];
    const horasKeys = [8,10,12,14,16,18,20];
    const horasData = horasKeys.map(h => (porHora[h]||0) + (porHora[h+1]||0));

    const fechaHoy = new Date().toLocaleDateString('es-PE', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
    const nombreUsuario = SESSION.perfil.nombre_completo || SESSION.hotel.nombre_comercial;

    contenido().innerHTML = `
      <!-- Saludo -->
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem; margin-bottom:1.5rem;">
        <div>
          <h1 style="font-size:1.75rem; font-weight:700; color:var(--texto); margin:0;">¡Hola, ${escapeHtml(nombreUsuario)}! 👋</h1>
          <p style="color:var(--texto-sub); margin:0.35rem 0 0; font-size:0.92rem;">Aquí tienes un resumen de la operación de hoy.</p>
        </div>
        <div class="card" style="display:flex; align-items:center; gap:0.75rem; padding:0.85rem 1.15rem;">
          <div style="width:38px;height:38px;border-radius:10px;background:rgba(37,99,235,0.1);display:flex;align-items:center;justify-content:center;">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--azul)" stroke-width="2" stroke-linecap="round" style="width:20px;height:20px;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div>
            <div style="font-size:0.82rem; font-weight:600; color:var(--texto); text-transform:capitalize;">${fechaHoy}</div>
            <div style="font-size:0.72rem; color:var(--texto-sub);">Buen día, que sea una gran jornada.</div>
          </div>
        </div>
      </div>

      <!-- 4 tarjetas de estado -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:1rem; margin-bottom:1.25rem;">
        ${dashTarjeta('Habitaciones libres', conteo.libre, '#16A34A', '#F0FDF4', 'bed', 'rack')}
        ${dashTarjeta('Habitaciones ocupadas', conteo.ocupada, '#DC2626', '#FEF2F2', 'bed', 'rack')}
        ${dashTarjeta('En limpieza', conteo.limpieza, '#CA8A04', '#FEFCE8', 'sparkles', 'rack')}
        ${dashTarjeta('Reservadas', conteo.reservada, '#2563EB', '#EFF6FF', 'calendar', 'reservas')}
      </div>

      <!-- Ocupación + Turno de caja -->
      <div style="display:grid; grid-template-columns:1.4fr 1fr; gap:1rem; margin-bottom:1.25rem;" class="dash-fila">
        <div class="card">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem;">
            <div>
              <div style="font-weight:700; font-size:1.05rem;">Ocupación actual</div>
              <div style="font-size:0.8rem; color:var(--texto-sub);">Resumen de estado de habitaciones</div>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:1.5rem; flex-wrap:wrap;">
            <div style="position:relative; width:170px; height:170px;">
              <canvas id="chart-ocupacion"></canvas>
              <div style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; pointer-events:none;">
                <div style="font-size:0.7rem; color:var(--texto-sub);">Total</div>
                <div style="font-size:1.6rem; font-weight:700;">${totalHabs}</div>
              </div>
            </div>
            <div style="flex:1; min-width:180px;">
              ${leyendaOcupacion('Libres', conteo.libre, totalHabs, '#16A34A')}
              ${leyendaOcupacion('Ocupadas', conteo.ocupada, totalHabs, '#DC2626')}
              ${leyendaOcupacion('Limpieza', conteo.limpieza, totalHabs, '#CA8A04')}
              ${leyendaOcupacion('Reservadas', conteo.reservada, totalHabs, '#2563EB')}
              ${leyendaOcupacion('Mantenimiento', conteo.mantenimiento, totalHabs, '#64748B')}
            </div>
          </div>
        </div>

        <div class="card">
          <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:1rem;">
            <span style="font-weight:700; font-size:1.05rem;">Tu turno de caja</span>
            ${turno ? '<span style="font-size:0.68rem; font-weight:700; color:#16A34A; background:#F0FDF4; padding:0.15rem 0.6rem; border-radius:999px;">● Abierto</span>' : '<span style="font-size:0.68rem; font-weight:700; color:#DC2626; background:#FEF2F2; padding:0.15rem 0.6rem; border-radius:999px;">● Cerrado</span>'}
          </div>
          ${turno ? `
            <div style="background:var(--gris-bg); border-radius:12px; padding:1rem; margin-bottom:1rem;">
              <div style="font-size:0.72rem; color:var(--texto-sub);">Turno abierto desde</div>
              <div style="font-weight:600; font-size:0.92rem;">${fechaHora(turno.apertura_at)}</div>
              <div style="font-size:0.72rem; color:var(--texto-sub); margin-top:0.6rem;">Fondo inicial</div>
              <div style="font-weight:700; font-size:1.15rem; color:var(--azul);">${soles(turno.fondo_inicial)}</div>
            </div>
            <div style="display:flex; gap:0.5rem;">
              <button style="${ST.btnPri}; flex:1;" onclick="navegarA('caja')">Ir a caja</button>
            </div>`
          : `
            <div style="font-size:0.85rem; color:var(--texto-sub); margin-bottom:1rem;">No tienes turno abierto. Ábrelo para empezar a operar y cobrar.</div>
            <button style="${ST.btnPri}; width:100%;" onclick="navegarA('caja')">Abrir turno</button>`}
        </div>
      </div>

      <!-- Llegadas + Reservas + Ingresos -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:1rem;">
        <!-- Llegadas de hoy -->
        <div class="card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.85rem;">
            <span style="font-weight:700;">Llegadas de hoy</span>
            <a href="#" onclick="navegarA('huespedes');return false;" style="font-size:0.78rem; color:var(--azul); text-decoration:none; font-weight:600;">Ver todas</a>
          </div>
          ${(llegadas||[]).length ? llegadas.map(l => filaPersona(l.huespedes, l.habitaciones?.numero, new Date(l.fecha_entrada).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'}), l.estado==='activa'?['Llegó','#16A34A','#F0FDF4']:['Pendiente','#CA8A04','#FEFCE8'])).join('') : filaVacia('Sin llegadas registradas hoy')}
        </div>

        <!-- Reservas próximas -->
        <div class="card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.85rem;">
            <span style="font-weight:700;">Reservas próximas</span>
            <a href="#" onclick="navegarA('reservas');return false;" style="font-size:0.78rem; color:var(--azul); text-decoration:none; font-weight:600;">Ver todas</a>
          </div>
          ${(reservasProx||[]).length ? reservasProx.map(r => filaPersona(r.huespedes, r.habitaciones?.numero, new Date(r.fecha_entrada).toLocaleDateString('es-PE',{day:'numeric',month:'short'}), ['Confirmada','#16A34A','#F0FDF4'])).join('') : filaVacia('Sin reservas próximas')}
        </div>

        <!-- Ingresos del día -->
        <div class="card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">
            <span style="font-weight:700;">Ingresos del día</span>
          </div>
          <div style="font-size:1.75rem; font-weight:700; color:var(--texto); margin-bottom:0.85rem;">${soles(ingresosHoy)}</div>
          <canvas id="chart-ingresos-hoy" style="max-height:150px;"></canvas>
        </div>
      </div>
    `;

    // Gráfico de dona de ocupación
    if (typeof Chart !== 'undefined') {
      const ctx = document.getElementById('chart-ocupacion');
      if (ctx) new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Libres','Ocupadas','Limpieza','Reservadas','Mantenim.'],
          datasets: [{ data:[conteo.libre,conteo.ocupada,conteo.limpieza,conteo.reservada,conteo.mantenimiento], backgroundColor:['#16A34A','#DC2626','#CA8A04','#2563EB','#64748B'], borderWidth:3, borderColor:'#fff' }],
        },
        options: { plugins:{ legend:{ display:false } }, cutout:'72%' },
      });

      const ctx2 = document.getElementById('chart-ingresos-hoy');
      if (ctx2) new Chart(ctx2, {
        type: 'bar',
        data: { labels: horasLabels, datasets:[{ data: horasData, backgroundColor:'#2563EB', borderRadius:6, barThickness:14 }] },
        options: { plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true, ticks:{ font:{size:10} } }, x:{ ticks:{ font:{size:9} } } } },
      });
    }
  } catch (err) {
    contenido().innerHTML = errorBox('No se pudo cargar el dashboard', err.message);
  }
}

// Tarjeta de estado del dashboard (estilo imagen)
function dashTarjeta(label, valor, color, bg, icon, modulo) {
  const iconos = {
    bed: '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>',
    sparkles: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  };
  return `
    <div class="card" style="display:flex; align-items:center; gap:1rem; cursor:pointer; padding:1.15rem;" onclick="navegarA('${modulo}')">
      <div style="width:52px; height:52px; border-radius:14px; background:${bg}; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
        <svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:26px;height:26px;">${iconos[icon]}</svg>
      </div>
      <div style="flex:1;">
        <div style="font-size:1.85rem; font-weight:700; color:var(--texto); line-height:1;">${valor}</div>
        <div style="font-size:0.8rem; color:var(--texto-sub); margin-top:0.25rem;">${label}</div>
      </div>
      <svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" style="width:18px;height:18px;opacity:0.5;"><polyline points="9 18 15 12 9 6"/></svg>
    </div>`;
}

function leyendaOcupacion(label, valor, total, color) {
  const pct = total > 0 ? Math.round((valor/total)*100) : 0;
  return `
    <div style="display:flex; align-items:center; gap:0.6rem; padding:0.3rem 0;">
      <span style="width:10px; height:10px; border-radius:50%; background:${color}; flex-shrink:0;"></span>
      <span style="flex:1; font-size:0.85rem; color:var(--texto-sub);">${label}</span>
      <span style="font-weight:700; font-size:0.9rem;">${valor}</span>
      <span style="font-size:0.78rem; color:var(--texto-sub); width:38px; text-align:right;">${pct}%</span>
    </div>`;
}

function filaPersona(huesped, habNum, tiempo, estado) {
  const nombre = huesped ? `${huesped.nombres||''} ${huesped.apellidos||''}`.trim() : 'Huésped';
  const iniciales = nombre.split(/\s+/).slice(0,2).map(p=>p[0]||'').join('').toUpperCase() || 'H';
  return `
    <div style="display:flex; align-items:center; gap:0.75rem; padding:0.6rem 0; border-bottom:1px solid var(--gris-borde);">
      <div style="width:38px; height:38px; border-radius:10px; background:rgba(37,99,235,0.1); color:var(--azul); font-weight:700; font-size:0.8rem; display:flex; align-items:center; justify-content:center; flex-shrink:0;">${iniciales}</div>
      <div style="flex:1; min-width:0;">
        <div style="font-weight:600; font-size:0.85rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(nombre)}</div>
        <div style="font-size:0.75rem; color:var(--texto-sub);">Habitación ${escapeHtml(habNum||'—')}</div>
      </div>
      <div style="font-size:0.78rem; color:var(--texto-sub); white-space:nowrap;">${tiempo}</div>
      <span style="font-size:0.68rem; font-weight:700; color:${estado[1]}; background:${estado[2]}; padding:0.2rem 0.6rem; border-radius:999px; white-space:nowrap;">${estado[0]}</span>
    </div>`;
}

function filaVacia(msg) {
  return `<div style="text-align:center; color:var(--texto-sub); font-size:0.83rem; padding:1.5rem 0;">${msg}</div>`;
}

function estadoTarjeta(label, valor, color) {
  return `
    <div class="card" style="padding:1rem; border-left:4px solid ${color};">
      <div style="font-size:1.6rem; font-weight:700; color:var(--texto); line-height:1;">${valor}</div>
      <div style="font-size:0.78rem; color:var(--texto-sub); margin-top:0.3rem;">${label}</div>
    </div>`;
}


// ════════════════════════════════════════════════════════════
//  HOTEL › RACK INTERACTIVO DE HABITACIONES
// ════════════════════════════════════════════════════════════
const COLORES_ESTADO = {
  libre:         { bg: '#F0FDF4', borde: '#16A34A', texto: '#15803D', label: 'Libre',        badgeBg:'#16A34A' },
  ocupada:       { bg: '#FEF2F2', borde: '#DC2626', texto: '#B91C1C', label: 'Ocupada',      badgeBg:'#DC2626' },
  limpieza:      { bg: '#FEFCE8', borde: '#CA8A04', texto: '#A16207', label: 'Limpieza',     badgeBg:'#CA8A04' },
  reservada:     { bg: '#EFF6FF', borde: '#2563EB', texto: '#1D4ED8', label: 'Reservada',    badgeBg:'#2563EB' },
  mantenimiento: { bg: '#F1F5F9', borde: '#64748B', texto: '#475569', label: 'Mantenim.',    badgeBg:'#64748B' },
};

// Fotos de fondo por tipo de habitación (Unsplash, sin auth)
const FOTOS_HAB = [
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=70',
  'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&q=70',
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&q=70',
  'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400&q=70',
  'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&q=70',
  'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&q=70',
];

// Estado del rack (filtros)
let _rackFiltroEstado = 'todos';
let _rackVista = 'cuadricula'; // 'cuadricula' | 'lista'
let _rackHabs = [];

async function moduloRack() {
  skeleton();
  try {
    SESSION.turnoActivo = await getTurnoAbierto();
    _rackHabs = await getHabitaciones();
    renderRack();
  } catch (err) {
    contenido().innerHTML = errorBox('No se pudo cargar el rack', err.message);
  }
}

function renderRack() {
  const habs = _rackHabs;
  if (habs.length === 0) {
    contenido().innerHTML = `
      <div class="seccion-titulo">Rack de Habitaciones</div>
      <div class="seccion-sub">Aún no hay habitaciones creadas</div>
      <div class="card" style="max-width:480px;">
        <p style="font-size:0.9rem; color:var(--texto-sub);">Primero crea tus tipos de habitación y habitaciones desde el menú <strong>Habitaciones</strong>.</p>
        ${SESSION.perfil.rol==='admin'?`<button style="${ST.btnPri}; width:auto; padding:0.6rem 1.2rem;" onclick="navegarA('habitacion-config')">Ir a configuración</button>`:''}
      </div>`;
    return;
  }

  const conteo = { libre:0, ocupada:0, limpieza:0, reservada:0, mantenimiento:0 };
  habs.forEach(h => { if(conteo[h.estado]!==undefined) conteo[h.estado]++; });
  const total = habs.length;

  // Filtrar
  const habsFiltradas = _rackFiltroEstado === 'todos' ? habs : habs.filter(h => h.estado === _rackFiltroEstado);

  // Agrupar por piso
  const pisos = {};
  habsFiltradas.forEach(h => {
    const p = h.piso || '—';
    if (!pisos[p]) pisos[p] = [];
    pisos[p].push(h);
  });
  const pisosOrden = Object.keys(pisos).sort();

  const avisoTurno = !SESSION.turnoActivo
    ? `<div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:0.7rem 1rem;margin-bottom:1rem;font-size:0.83rem;color:#92400E;">
         ⚠️ No tienes turno de caja abierto. <a href="#" onclick="navegarA('caja');return false;" style="color:#92400E;font-weight:600;text-decoration:underline;">Ábrelo</a> para cobrar check-ins.
       </div>` : '';

  const filtroBtn = (estado, label, cnt, color) => `
    <button onclick="setRackFiltro('${estado}')"
      style="display:inline-flex;align-items:center;gap:0.4rem;padding:0.45rem 0.9rem;border-radius:999px;font-size:0.82rem;font-weight:600;cursor:pointer;border:1.5px solid ${_rackFiltroEstado===estado?color:'var(--gris-borde)'};background:${_rackFiltroEstado===estado?color:'white'};color:${_rackFiltroEstado===estado?'white':'var(--texto-sub)'};">
      ${label} <span style="background:${_rackFiltroEstado===estado?'rgba(255,255,255,0.25)':'var(--gris-bg)'};color:${_rackFiltroEstado===estado?'white':'var(--texto)'};border-radius:999px;padding:0 0.4rem;font-size:0.75rem;">${cnt}</span>
    </button>`;

  contenido().innerHTML = `
    <!-- Header -->
    <div style="margin-bottom:1.25rem;">
      <h1 style="font-size:1.5rem;font-weight:700;color:var(--texto);margin:0;">Rack de Habitaciones</h1>
      <div style="font-size:0.88rem;color:var(--texto-sub);margin-top:0.25rem;">Visualiza el estado de todas las habitaciones y realiza operaciones de forma rápida.</div>
    </div>

    <!-- 5 tarjetas de resumen -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:0.85rem;margin-bottom:1.25rem;">
      ${rackStatCard('Habitaciones libres',   conteo.libre,         total, '#16A34A','#F0FDF4', 'bed-libre')}
      ${rackStatCard('Habitaciones ocupadas', conteo.ocupada,       total, '#DC2626','#FEF2F2', 'bed-ocu')}
      ${rackStatCard('En limpieza',           conteo.limpieza,      total, '#CA8A04','#FEFCE8', 'broom')}
      ${rackStatCard('Reservadas',            conteo.reservada,     total, '#2563EB','#EFF6FF', 'calendar')}
      ${rackStatCard('En mantenimiento',      conteo.mantenimiento, total, '#64748B','#F1F5F9', 'wrench')}
    </div>

    ${avisoTurno}

    <!-- Filtros + toggle vista -->
    <div style="display:flex;flex-wrap:wrap;align-items:center;gap:0.5rem;margin-bottom:1.25rem;background:white;border:1px solid var(--gris-borde);border-radius:14px;padding:0.75rem 1rem;">
      ${filtroBtn('todos','Todos',total,'#1C2B4A')}
      ${filtroBtn('libre','Libre',conteo.libre,'#16A34A')}
      ${filtroBtn('ocupada','Ocupada',conteo.ocupada,'#DC2626')}
      ${filtroBtn('limpieza','Limpieza',conteo.limpieza,'#CA8A04')}
      ${filtroBtn('reservada','Reservada',conteo.reservada,'#2563EB')}
      ${filtroBtn('mantenimiento','Mantenimiento',conteo.mantenimiento,'#64748B')}
      <div style="flex:1;"></div>
      <div style="display:flex;border:1.5px solid var(--gris-borde);border-radius:9px;overflow:hidden;">
        <button onclick="setRackVista('cuadricula')" title="Cuadrícula"
          style="padding:0.45rem 0.75rem;border:none;cursor:pointer;background:${_rackVista==='cuadricula'?'var(--azul)':'white'};color:${_rackVista==='cuadricula'?'white':'var(--texto-sub)'};">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
        </button>
        <button onclick="setRackVista('lista')" title="Lista"
          style="padding:0.45rem 0.75rem;border:none;cursor:pointer;background:${_rackVista==='lista'?'var(--azul)':'white'};color:${_rackVista==='lista'?'white':'var(--texto-sub)'};">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </div>
    </div>

    <!-- Habitaciones agrupadas por piso -->
    <div id="rack-pisos">
      ${pisosOrden.map(p => renderPiso(p, pisos[p])).join('')}
      ${pisosOrden.length === 0 ? filaVacia('No hay habitaciones con ese filtro.') : ''}
    </div>
  `;
}

function rackStatCard(label, valor, total, color, bg, tipo) {
  const pct = total > 0 ? Math.round((valor/total)*100) : 0;
  const iconos = {
    'bed-libre': '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>',
    'bed-ocu':   '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>',
    'broom':     '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/>',
    'calendar':  '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    'wrench':    '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  };
  return `
    <div class="card" style="padding:1rem;">
      <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.6rem;">
        <div style="width:44px;height:44px;border-radius:12px;background:${bg};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:22px;height:22px;">${iconos[tipo]||''}</svg>
        </div>
        <div>
          <div style="font-size:1.65rem;font-weight:700;color:var(--texto);line-height:1;">${valor}</div>
          <div style="font-size:0.75rem;color:var(--texto-sub);">${label}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:0.5rem;">
        <div style="flex:1;height:6px;background:var(--gris-borde);border-radius:999px;overflow:hidden;">
          <div style="width:${pct}%;height:100%;background:${color};border-radius:999px;"></div>
        </div>
        <span style="font-size:0.72rem;font-weight:700;color:${color};">${pct}%</span>
      </div>
    </div>`;
}

function renderPiso(piso, habs) {
  const cnt = { libre:0, ocupada:0, limpieza:0, reservada:0, mantenimiento:0 };
  habs.forEach(h => { if(cnt[h.estado]!==undefined) cnt[h.estado]++; });

  const resumenPiso = `
    <span style="font-size:0.78rem;color:var(--texto-sub);display:flex;gap:0.75rem;flex-wrap:wrap;">
      <span>🟢 ${cnt.libre} libres</span>
      <span>🔴 ${cnt.ocupada} ocupadas</span>
      <span>🟡 ${cnt.limpieza} limpieza</span>
      <span>🔵 ${cnt.reservada} reservadas</span>
      <span>⚫ ${cnt.mantenimiento} mantenimiento</span>
    </span>`;

  const grid = _rackVista === 'cuadricula'
    ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem;">${habs.map(h => tarjetaHabNueva(h)).join('')}</div>`
    : `<div style="display:flex;flex-direction:column;gap:0.5rem;">${habs.map(h => filaHabLista(h)).join('')}</div>`;

  return `
    <div style="margin-bottom:1.75rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.85rem;">
        <div style="display:flex;align-items:center;gap:0.75rem;">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--azul)" stroke-width="2" stroke-linecap="round" style="width:18px;height:18px;cursor:pointer;"><polyline points="18 15 12 9 6 15"/></svg>
          <span style="font-weight:700;font-size:1rem;">${piso === '—' ? 'Sin piso asignado' : 'Piso '+escapeHtml(piso)}</span>
          <span style="background:var(--gris-bg);color:var(--texto-sub);font-size:0.75rem;font-weight:600;padding:0.15rem 0.65rem;border-radius:999px;">${habs.length} habitaciones</span>
        </div>
        ${resumenPiso}
      </div>
      ${grid}
    </div>`;
}

function tarjetaHabNueva(h) {
  const c = COLORES_ESTADO[h.estado] || COLORES_ESTADO.libre;
  const tipo = h.tipos_habitacion || {};
  // Foto pseudo-aleatoria pero consistente por número de habitación
  const fotoIdx = (parseInt(h.numero.replace(/\D/g,''))||0) % FOTOS_HAB.length;
  const foto = FOTOS_HAB[fotoIdx];
  return `
    <div onclick="abrirHabitacion('${h.id}')" style="cursor:pointer;border-radius:16px;overflow:hidden;border:1.5px solid var(--gris-borde);background:white;transition:box-shadow 0.15s,transform 0.1s;"
         onmouseover="this.style.boxShadow='0 8px 24px rgba(0,0,0,0.12)';this.style.transform='translateY(-2px)'"
         onmouseout="this.style.boxShadow='none';this.style.transform='translateY(0)'">
      <!-- Foto + badge de estado -->
      <div style="position:relative;height:130px;background:#E2E8F0;overflow:hidden;">
        <img src="${foto}" alt="hab" loading="lazy" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">
        <div style="position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,0.08) 0%,rgba(0,0,0,0.35) 100%);"></div>
        <span style="position:absolute;top:0.65rem;left:0.65rem;font-size:1.4rem;font-weight:800;color:white;text-shadow:0 1px 4px rgba(0,0,0,0.5);">${escapeHtml(h.numero)}</span>
        <span style="position:absolute;top:0.65rem;right:0.65rem;font-size:0.65rem;font-weight:700;color:white;background:${c.badgeBg};padding:0.2rem 0.55rem;border-radius:999px;">${c.label}</span>
      </div>
      <!-- Info -->
      <div style="padding:0.85rem;">
        <div style="font-weight:600;font-size:0.9rem;margin-bottom:0.4rem;">${escapeHtml(tipo.nombre||'Sin tipo')}</div>
        <div style="display:flex;align-items:center;gap:0.85rem;font-size:0.78rem;color:var(--texto-sub);">
          <span style="display:flex;align-items:center;gap:0.25rem;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            ${tipo.capacidad_max||'—'}
          </span>
          <span style="display:flex;align-items:center;gap:0.25rem;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px;"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            ${soles(tipo.tarifa_noche||0)}
          </span>
        </div>
        <div style="display:flex;gap:0.5rem;margin-top:0.75rem;">
          <button onclick="event.stopPropagation();abrirHabitacion('${h.id}')" style="${ST.btnSec};flex:1;padding:0.4rem 0;font-size:0.78rem;text-align:center;">Ver más</button>
          <button onclick="event.stopPropagation();abrirMenuRapidoHab('${h.id}')" style="${ST.btnSec};padding:0.4rem 0.6rem;font-size:0.78rem;">···</button>
        </div>
      </div>
    </div>`;
}

function filaHabLista(h) {
  const c = COLORES_ESTADO[h.estado] || COLORES_ESTADO.libre;
  const tipo = h.tipos_habitacion || {};
  return `
    <div onclick="abrirHabitacion('${h.id}')" class="card" style="padding:0.85rem 1.1rem;display:flex;align-items:center;gap:1rem;cursor:pointer;transition:box-shadow 0.15s;"
         onmouseover="this.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)'"
         onmouseout="this.style.boxShadow='none'">
      <div style="width:44px;height:44px;border-radius:12px;background:${c.bg};display:flex;align-items:center;justify-content:center;font-size:1.1rem;font-weight:700;color:${c.texto};flex-shrink:0;">${escapeHtml(h.numero)}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:600;font-size:0.9rem;">${escapeHtml(tipo.nombre||'Sin tipo')}</div>
        <div style="font-size:0.75rem;color:var(--texto-sub);">Piso ${escapeHtml(h.piso||'—')} · Cap. ${tipo.capacidad_max||'—'} · ${soles(tipo.tarifa_noche||0)}/noche</div>
      </div>
      <span style="font-size:0.72rem;font-weight:700;color:white;background:${c.badgeBg};padding:0.25rem 0.75rem;border-radius:999px;white-space:nowrap;">${c.label}</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:16px;height:16px;flex-shrink:0;"><polyline points="9 18 15 12 9 6"/></svg>
    </div>`;
}

function setRackFiltro(estado) {
  _rackFiltroEstado = estado;
  renderRack();
}

function setRackVista(vista) {
  _rackVista = vista;
  renderRack();
}

function abrirMenuRapidoHab(habId) {
  const h = _rackHabs.find(x => x.id === habId);
  if (!h) return;
  abrirCambioEstadoSimple(h);
}

// ── Acciones sobre una habitación según su estado ───────────
async function abrirHabitacion(habId) {
  try {
    const { data: h, error } = await db
      .from('habitaciones')
      .select(`*, tipos_habitacion ( nombre, tarifa_noche, tarifa_horas, horas_bloque, capacidad_max )`)
      .eq('id', habId).single();
    if (error) throw error;

    if (h.estado === 'libre' || h.estado === 'limpieza') {
      abrirCheckIn(h);
    } else if (h.estado === 'ocupada' || h.estado === 'reservada') {
      abrirEstadiaActiva(h);
    } else {
      // mantenimiento → solo cambiar estado
      abrirCambioEstadoSimple(h);
    }
  } catch (err) {
    toast('Error', err.message, 'error');
  }
}

// ── CHECK-IN (habitación libre) ─────────────────────────────
function abrirCheckIn(h) {
  if (!SESSION.turnoActivo) {
    toast('Abre tu turno de caja', 'Necesitas un turno abierto para cobrar', 'warn');
    navegarA('caja');
    return;
  }
  const tipo = h.tipos_habitacion || {};
  const html = `
    <form id="form-checkin">
      <div style="background:var(--gris-bg); border-radius:10px; padding:0.85rem 1rem; margin-bottom:1.25rem;">
        <strong style="font-size:1.05rem;">Habitación ${escapeHtml(h.numero)}</strong>
        <span style="font-size:0.82rem; color:var(--texto-sub);"> · ${escapeHtml(tipo.nombre || '')}</span>
      </div>

      <!-- Modalidad -->
      <div style="${ST.grupo}">
        <label style="${ST.label}">Modalidad de alquiler *</label>
        <div style="display:flex; gap:0.5rem;">
          <button type="button" class="btn-modalidad" data-mod="noche" style="${ST.btnSec}; flex:1;">
            🌙 Por noche · ${soles(tipo.tarifa_noche)}
          </button>
          <button type="button" class="btn-modalidad" data-mod="horas" style="${ST.btnSec}; flex:1;">
            ⏱️ Por horas · ${soles(tipo.tarifa_horas)}/${tipo.horas_bloque || 3}h
          </button>
        </div>
      </div>

      <div id="campo-horas" style="${ST.grupo}; display:none;">
        <label style="${ST.label}">Horas contratadas</label>
        <input style="${ST.input}" id="checkin-horas" type="number" value="${tipo.horas_bloque || 3}" min="1">
      </div>

      <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:var(--azul); margin:1rem 0 0.65rem;">Datos del huésped</div>
      <div style="${ST.fila}">
        <div style="${ST.grupo}">
          <label style="${ST.label}">DNI *</label>
          <div style="display:flex; gap:0.4rem;">
            <input style="${ST.input}" id="checkin-dni" maxlength="8" placeholder="12345678">
            <button type="button" style="${ST.btnSec}; padding:0.55rem 0.75rem; white-space:nowrap;" id="btn-buscar-dni" title="Buscar por DNI">🔍</button>
          </div>
        </div>
        <div style="${ST.grupo}">
          <label style="${ST.label}">Celular</label>
          <input style="${ST.input}" id="checkin-celular" placeholder="999999999">
        </div>
      </div>
      <div style="${ST.fila}">
        <div style="${ST.grupo}">
          <label style="${ST.label}">Nombres *</label>
          <input style="${ST.input}" id="checkin-nombres" required>
        </div>
        <div style="${ST.grupo}">
          <label style="${ST.label}">Apellidos *</label>
          <input style="${ST.input}" id="checkin-apellidos" required>
        </div>
      </div>

      <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:var(--azul); margin:1rem 0 0.65rem;">Cobro anticipado</div>
      <div style="${ST.fila}">
        <div style="${ST.grupo}">
          <label style="${ST.label}">Monto a cobrar *</label>
          <input style="${ST.input}" id="checkin-monto" type="number" step="0.01" required>
        </div>
        <div style="${ST.grupo}">
          <label style="${ST.label}">Método de pago</label>
          <select style="${ST.input}" id="checkin-metodo">
            <option value="efectivo">Efectivo</option>
            <option value="yape">Yape</option>
            <option value="plin">Plin</option>
            <option value="transferencia">Transferencia</option>
          </select>
        </div>
      </div>

      <button type="submit" style="${ST.btnPri}; margin-top:0.5rem;">Registrar check-in y cobrar</button>
    </form>
  `;
  abrirModal(`Check-in · Hab. ${h.numero}`, html, { ancho: '560px' });

  let modalidad = 'noche';
  const selMod = (mod) => {
    modalidad = mod;
    $$('.btn-modalidad').forEach(b => {
      const activo = b.dataset.mod === mod;
      b.style.background = activo ? 'rgba(26,63,166,0.08)' : 'white';
      b.style.borderColor = activo ? 'var(--azul)' : 'var(--gris-borde)';
      b.style.color = activo ? 'var(--azul)' : 'var(--texto)';
    });
    $('#campo-horas').style.display = mod === 'horas' ? 'block' : 'none';
    // autocompletar monto sugerido
    $('#checkin-monto').value = mod === 'noche' ? (tipo.tarifa_noche || 0) : (tipo.tarifa_horas || 0);
  };
  $$('.btn-modalidad').forEach(b => b.addEventListener('click', () => selMod(b.dataset.mod)));
  selMod('noche');

  // Buscar DNI
  $('#btn-buscar-dni').addEventListener('click', async () => {
    const dni = $('#checkin-dni').value.trim();
    if (dni.length !== 8) { toast('DNI inválido', 'Debe tener 8 dígitos', 'warn'); return; }
    const btn = $('#btn-buscar-dni');
    btn.textContent = '…';
    const res = await consultarDNI(dni);
    btn.textContent = '🔍';
    if (res) {
      $('#checkin-nombres').value = res.nombres;
      $('#checkin-apellidos').value = res.apellidos;
      toast('Datos encontrados', '', 'ok', 2000);
    } else {
      toast('Consulta manual', API_DOC.activa ? 'No se encontró el DNI' : 'API de DNI no configurada. Ingresa manual.', 'info', 3000);
    }
  });

  // Submit
  $('#form-checkin').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Procesando…';
    try {
      await procesarCheckIn(h, modalidad);
    } catch (err) {
      toast('Error', err.message, 'error');
      btn.disabled = false; btn.textContent = 'Registrar check-in y cobrar';
    }
  });
}

async function procesarCheckIn(h, modalidad) {
  const dni       = $('#checkin-dni').value.trim();
  const nombres   = $('#checkin-nombres').value.trim();
  const apellidos = $('#checkin-apellidos').value.trim();
  const celular   = $('#checkin-celular').value.trim();
  const monto     = parseFloat($('#checkin-monto').value);
  const metodo    = $('#checkin-metodo').value;
  const horas     = modalidad === 'horas' ? parseInt($('#checkin-horas').value) : null;
  const tipo      = h.tipos_habitacion || {};

  if (!nombres || !apellidos || !dni) throw new Error('Completa DNI, nombres y apellidos.');
  if (isNaN(monto) || monto < 0) throw new Error('Monto inválido.');

  // 1. Buscar o crear huésped
  let huespedId;
  const { data: hExist } = await db.from('huespedes')
    .select('id').eq('hotel_id', SESSION.hotel.id).eq('num_doc', dni).maybeSingle();

  if (hExist) {
    huespedId = hExist.id;
    await db.from('huespedes').update({ nombres, apellidos, celular }).eq('id', huespedId);
  } else {
    const { data: nuevoH, error: eH } = await db.from('huespedes').insert({
      hotel_id: SESSION.hotel.id, tipo_doc: 'DNI', num_doc: dni,
      nombres, apellidos, celular,
    }).select('id').single();
    if (eH) throw eH;
    huespedId = nuevoH.id;
  }

  // 2. Calcular fecha de salida prevista
  const ahora = new Date();
  let salidaPrev;
  const tarifa = modalidad === 'noche' ? (tipo.tarifa_noche || 0) : (tipo.tarifa_horas || 0);
  if (modalidad === 'noche') {
    salidaPrev = new Date(ahora); salidaPrev.setDate(salidaPrev.getDate() + 1); salidaPrev.setHours(12, 0, 0, 0);
  } else {
    salidaPrev = new Date(ahora.getTime() + (horas || 3) * 3600 * 1000);
  }

  // 3. Crear estadía
  const { data: estadia, error: eE } = await db.from('estadias_reservas').insert({
    hotel_id: SESSION.hotel.id,
    habitacion_id: h.id,
    huesped_id: huespedId,
    turno_caja_id: SESSION.turnoActivo.id,
    modalidad,
    tipo_reserva: 'directa',
    estado: 'activa',
    fecha_entrada: ahora.toISOString(),
    fecha_salida_prev: salidaPrev.toISOString(),
    horas_contratadas: horas,
    tarifa_aplicada: tarifa,
    adelanto_pagado: monto,
    total_final: tarifa,
    metodo_pago: metodo,
  }).select('id').single();
  if (eE) throw eE;

  // 4. Registrar el cobro en caja
  if (monto > 0) {
    await db.from('movimientos_caja').insert({
      hotel_id: SESSION.hotel.id,
      turno_caja_id: SESSION.turnoActivo.id,
      tipo: 'ingreso',
      concepto: `Check-in Hab. ${h.numero} (${nombres} ${apellidos})`,
      monto, metodo_pago: metodo,
      referencia_id: estadia.id, referencia_tipo: 'estadia',
      usuario_id: SESSION.user.id,
    });
  }

  // 5. Marcar habitación ocupada
  await db.from('habitaciones').update({ estado: 'ocupada' }).eq('id', h.id);

  cerrarModal();
  toast('Check-in registrado', `Hab. ${h.numero} · ${soles(monto)} cobrado`, 'ok');
  moduloRack();
}

// ── ESTADÍA ACTIVA (habitación ocupada) ─────────────────────
async function abrirEstadiaActiva(h) {
  const { data: est, error } = await db
    .from('estadias_reservas')
    .select(`*, huespedes ( nombres, apellidos, num_doc, celular )`)
    .eq('habitacion_id', h.id)
    .in('estado', ['activa', 'reservada'])
    .order('created_at', { ascending: false })
    .limit(1).maybeSingle();
  if (error || !est) { toast('Error', 'No se encontró la estadía activa', 'error'); return; }

  const hu = est.huespedes || {};
  const { data: consumos } = await db.from('consumos_estadia')
    .select('*').eq('estadia_id', est.id).order('created_at');

  const totalConsumos = (consumos || []).reduce((s, c) => s + Number(c.subtotal), 0);

  const html = `
    <div style="background:var(--gris-bg); border-radius:10px; padding:1rem; margin-bottom:1.25rem;">
      <div style="font-weight:700; font-size:1.05rem;">${escapeHtml(hu.nombres || '')} ${escapeHtml(hu.apellidos || '')}</div>
      <div style="font-size:0.8rem; color:var(--texto-sub); margin-top:0.25rem;">
        DNI ${escapeHtml(hu.num_doc || '—')} · ${est.modalidad === 'noche' ? '🌙 Por noche' : '⏱️ Por horas'}<br>
        Entrada: ${fechaHora(est.fecha_entrada)}<br>
        Salida prevista: ${fechaHora(est.fecha_salida_prev)}
      </div>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.6rem; margin-bottom:1.25rem;">
      <div style="background:white; border:1px solid var(--gris-borde); border-radius:10px; padding:0.75rem;">
        <div style="font-size:0.72rem; color:var(--texto-sub);">Tarifa</div>
        <div style="font-weight:700;">${soles(est.tarifa_aplicada)}</div>
      </div>
      <div style="background:white; border:1px solid var(--gris-borde); border-radius:10px; padding:0.75rem;">
        <div style="font-size:0.72rem; color:var(--texto-sub);">Consumos</div>
        <div style="font-weight:700;">${soles(totalConsumos)}</div>
      </div>
      <div style="background:white; border:1px solid var(--gris-borde); border-radius:10px; padding:0.75rem;">
        <div style="font-size:0.72rem; color:var(--texto-sub);">Adelanto</div>
        <div style="font-weight:700; color:var(--verde);">${soles(est.adelanto_pagado)}</div>
      </div>
      <div style="background:white; border:1px solid var(--gris-borde); border-radius:10px; padding:0.75rem;">
        <div style="font-size:0.72rem; color:var(--texto-sub);">Saldo</div>
        <div style="font-weight:700; color:var(--azul);">${soles((Number(est.tarifa_aplicada) + totalConsumos) - Number(est.adelanto_pagado))}</div>
      </div>
    </div>

    ${(consumos || []).length ? `
      <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; color:var(--azul); margin-bottom:0.5rem;">Consumos cargados</div>
      <div style="max-height:140px; overflow-y:auto; margin-bottom:1rem;">
        ${consumos.map(c => `
          <div style="display:flex; justify-content:space-between; padding:0.4rem 0; border-bottom:1px solid var(--gris-borde); font-size:0.83rem;">
            <span>${c.cantidad}× ${escapeHtml(c.descripcion)}</span>
            <strong>${soles(c.subtotal)}</strong>
          </div>`).join('')}
      </div>` : ''}

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem;">
      <button style="${ST.btnSec}" onclick="abrirCargarConsumo('${est.id}','${escapeHtml(h.numero)}')">+ Cargar consumo</button>
      <button style="${ST.btnSec}" onclick="abrirRoomMove('${est.id}','${h.id}','${escapeHtml(h.numero)}')">↔ Cambiar habitación</button>
      <button style="${ST.btnSec}" onclick="abrirLateCheckout('${est.id}')">+ Penalidad / hora extra</button>
      <button style="${ST.btnPri}; padding:0.6rem;" onclick="abrirCheckOut('${est.id}','${h.id}','${escapeHtml(h.numero)}')">Check-out</button>
    </div>
  `;
  abrirModal(`Hab. ${h.numero} — Ocupada`, html, { ancho: '560px' });
}

// ── Cargar consumo a la habitación ──────────────────────────
async function abrirCargarConsumo(estadiaId, numero) {
  const { data: productos } = await db.from('productos')
    .select('*').eq('hotel_id', SESSION.hotel.id).eq('activo', true).gt('stock_actual', 0).order('nombre');

  const opcionesProd = (productos || []).map(p =>
    `<option value="${p.id}" data-precio="${p.precio_venta}" data-stock="${p.stock_actual}">${escapeHtml(p.nombre)} — ${soles(p.precio_venta)} (stock: ${p.stock_actual})</option>`
  ).join('');

  const html = `
    <form id="form-consumo">
      <div style="${ST.grupo}">
        <label style="${ST.label}">Producto</label>
        <select style="${ST.input}" id="consumo-producto">
          <option value="">— Producto libre (manual) —</option>
          ${opcionesProd}
        </select>
      </div>
      <div style="${ST.fila}">
        <div style="${ST.grupo}">
          <label style="${ST.label}">Descripción *</label>
          <input style="${ST.input}" id="consumo-desc" required placeholder="Ej: Gaseosa">
        </div>
        <div style="${ST.grupo}">
          <label style="${ST.label}">Cantidad *</label>
          <input style="${ST.input}" id="consumo-cant" type="number" value="1" min="1">
        </div>
      </div>
      <div style="${ST.grupo}">
        <label style="${ST.label}">Precio unitario *</label>
        <input style="${ST.input}" id="consumo-precio" type="number" step="0.01" required>
      </div>
      <button type="submit" style="${ST.btnPri}">Cargar a habitación ${escapeHtml(numero)}</button>
    </form>
  `;
  abrirModal('Cargar consumo', html);

  $('#consumo-producto').addEventListener('change', e => {
    const opt = e.target.selectedOptions[0];
    if (opt.value) {
      $('#consumo-desc').value = opt.textContent.split(' — ')[0];
      $('#consumo-precio').value = opt.dataset.precio;
    }
  });

  $('#form-consumo').addEventListener('submit', async e => {
    e.preventDefault();
    const prodId = $('#consumo-producto').value || null;
    const desc   = $('#consumo-desc').value.trim();
    const cant   = parseInt($('#consumo-cant').value);
    const precio = parseFloat($('#consumo-precio').value);
    if (!desc || isNaN(cant) || cant < 1 || isNaN(precio)) { toast('Datos inválidos', '', 'warn'); return; }

    try {
      // Insertar consumo (el trigger recalcula el total de la estadía)
      const { error: eC } = await db.from('consumos_estadia').insert({
        hotel_id: SESSION.hotel.id, estadia_id: estadiaId, producto_id: prodId,
        descripcion: desc, cantidad: cant, precio_unitario: precio,
        turno_caja_id: SESSION.turnoActivo?.id, usuario_id: SESSION.user.id,
      });
      if (eC) throw eC;

      // Descontar stock si es producto de inventario
      if (prodId) {
        await db.from('movimientos_inventario').insert({
          hotel_id: SESSION.hotel.id, producto_id: prodId, tipo: 'salida',
          cantidad: cant, precio_venta: precio, motivo: 'Cargo a habitación',
          referencia_id: estadiaId, turno_caja_id: SESSION.turnoActivo?.id,
          usuario_id: SESSION.user.id,
        });
      }
      cerrarModal();
      toast('Consumo cargado', `${cant}× ${desc}`, 'ok');
    } catch (err) {
      toast('Error', err.message, 'error');
    }
  });
}

// ── Penalidad / late checkout ───────────────────────────────
function abrirLateCheckout(estadiaId) {
  const html = `
    <form id="form-late">
      <div style="${ST.grupo}">
        <label style="${ST.label}">Concepto</label>
        <input style="${ST.input}" id="late-concepto" value="Late check-out / hora extra">
      </div>
      <div style="${ST.grupo}">
        <label style="${ST.label}">Monto de penalidad *</label>
        <input style="${ST.input}" id="late-monto" type="number" step="0.01" required autofocus>
      </div>
      <button type="submit" style="${ST.btnPri}">Agregar penalidad</button>
    </form>
  `;
  abrirModal('Penalidad / hora extra', html);

  $('#form-late').addEventListener('submit', async e => {
    e.preventDefault();
    const monto = parseFloat($('#late-monto').value);
    if (isNaN(monto) || monto <= 0) { toast('Monto inválido', '', 'warn'); return; }
    try {
      const { data: est } = await db.from('estadias_reservas')
        .select('penalidad_late, tarifa_aplicada, total_consumos').eq('id', estadiaId).single();
      const nuevaPenalidad = Number(est.penalidad_late) + monto;
      await db.from('estadias_reservas').update({
        penalidad_late: nuevaPenalidad,
        total_final: Number(est.tarifa_aplicada) + Number(est.total_consumos) + nuevaPenalidad,
      }).eq('id', estadiaId);
      cerrarModal();
      toast('Penalidad agregada', soles(monto), 'ok');
    } catch (err) { toast('Error', err.message, 'error'); }
  });
}

// ── Room Move (cambio de habitación con consumos) ───────────
async function abrirRoomMove(estadiaId, habActualId, numeroActual) {
  const { data: libres } = await db.from('habitaciones')
    .select(`id, numero, tipos_habitacion(nombre)`)
    .eq('hotel_id', SESSION.hotel.id).eq('estado', 'libre').eq('activo', true).order('numero');

  if (!libres || libres.length === 0) {
    toast('Sin habitaciones libres', 'No hay a dónde mover', 'warn'); return;
  }

  const html = `
    <p style="font-size:0.85rem; color:var(--texto-sub); margin-bottom:1rem;">
      Los consumos y el cobro se mantienen. La habitación ${escapeHtml(numeroActual)} quedará en limpieza.
    </p>
    <div style="${ST.grupo}">
      <label style="${ST.label}">Mover a habitación *</label>
      <select style="${ST.input}" id="move-destino">
        ${libres.map(l => `<option value="${l.id}">Hab. ${escapeHtml(l.numero)} — ${escapeHtml(l.tipos_habitacion?.nombre || '')}</option>`).join('')}
      </select>
    </div>
    <button style="${ST.btnPri}" id="btn-move">Confirmar cambio</button>
  `;
  abrirModal('Cambiar de habitación', html);

  $('#btn-move').addEventListener('click', async () => {
    const destinoId = $('#move-destino').value;
    try {
      await db.from('estadias_reservas').update({ habitacion_id: destinoId }).eq('id', estadiaId);
      await db.from('habitaciones').update({ estado: 'ocupada' }).eq('id', destinoId);
      await db.from('habitaciones').update({ estado: 'limpieza' }).eq('id', habActualId);
      cerrarModal();
      toast('Habitación cambiada', '', 'ok');
      moduloRack();
    } catch (err) { toast('Error', err.message, 'error'); }
  });
}

// ── CHECK-OUT con liquidación ───────────────────────────────
async function abrirCheckOut(estadiaId, habId, numero) {
  const { data: est } = await db.from('estadias_reservas')
    .select('*').eq('id', estadiaId).single();

  const totalFinal = Number(est.tarifa_aplicada) + Number(est.total_consumos) + Number(est.penalidad_late);
  const saldo = totalFinal - Number(est.adelanto_pagado);

  const html = `
    <div style="background:var(--gris-bg); border-radius:12px; padding:1.25rem; margin-bottom:1.25rem;">
      <div style="display:flex; justify-content:space-between; padding:0.35rem 0; font-size:0.88rem;">
        <span style="color:var(--texto-sub);">Tarifa (${est.modalidad})</span><strong>${soles(est.tarifa_aplicada)}</strong>
      </div>
      <div style="display:flex; justify-content:space-between; padding:0.35rem 0; font-size:0.88rem;">
        <span style="color:var(--texto-sub);">Consumos</span><strong>${soles(est.total_consumos)}</strong>
      </div>
      <div style="display:flex; justify-content:space-between; padding:0.35rem 0; font-size:0.88rem;">
        <span style="color:var(--texto-sub);">Penalidades</span><strong>${soles(est.penalidad_late)}</strong>
      </div>
      <div style="height:1px; background:var(--gris-borde); margin:0.5rem 0;"></div>
      <div style="display:flex; justify-content:space-between; padding:0.35rem 0; font-size:0.95rem;">
        <span style="font-weight:600;">Total</span><strong>${soles(totalFinal)}</strong>
      </div>
      <div style="display:flex; justify-content:space-between; padding:0.35rem 0; font-size:0.88rem;">
        <span style="color:var(--texto-sub);">Adelanto pagado</span><strong style="color:var(--verde);">− ${soles(est.adelanto_pagado)}</strong>
      </div>
      <div style="display:flex; justify-content:space-between; padding:0.35rem 0; font-size:1.15rem;">
        <span style="font-weight:700;">Saldo a cobrar</span><strong style="color:var(--azul);">${soles(saldo)}</strong>
      </div>
    </div>

    ${saldo > 0.01 ? `
      <div style="${ST.grupo}">
        <label style="${ST.label}">Método de pago del saldo</label>
        <select style="${ST.input}" id="checkout-metodo">
          <option value="efectivo">Efectivo</option>
          <option value="yape">Yape</option>
          <option value="plin">Plin</option>
          <option value="transferencia">Transferencia</option>
        </select>
      </div>` : ''}

    <button style="${ST.btnPri}" id="btn-checkout" data-saldo="${saldo}">
      Confirmar check-out${saldo > 0.01 ? ` y cobrar ${soles(saldo)}` : ''}
    </button>
  `;
  abrirModal(`Check-out · Hab. ${numero}`, html, { ancho: '480px' });

  $('#btn-checkout').addEventListener('click', async () => {
    const saldoNum = parseFloat($('#btn-checkout').dataset.saldo);
    const btn = $('#btn-checkout');
    btn.disabled = true; btn.textContent = 'Procesando…';
    try {
      // 1. Cobrar saldo pendiente si lo hay
      if (saldoNum > 0.01) {
        const metodo = $('#checkout-metodo').value;
        await db.from('movimientos_caja').insert({
          hotel_id: SESSION.hotel.id, turno_caja_id: SESSION.turnoActivo?.id,
          tipo: 'ingreso', concepto: `Saldo check-out Hab. ${numero}`,
          monto: saldoNum, metodo_pago: metodo,
          referencia_id: estadiaId, referencia_tipo: 'estadia', usuario_id: SESSION.user.id,
        });
        await db.from('estadias_reservas').update({
          adelanto_pagado: Number(est.adelanto_pagado) + saldoNum,
        }).eq('id', estadiaId);
      }
      // 2. Cerrar estadía
      await db.from('estadias_reservas').update({
        estado: 'check_out', fecha_salida_real: new Date().toISOString(),
        total_final: Number(est.tarifa_aplicada) + Number(est.total_consumos) + Number(est.penalidad_late),
      }).eq('id', estadiaId);
      // 3. Habitación a limpieza
      await db.from('habitaciones').update({ estado: 'limpieza' }).eq('id', habId);

      cerrarModal();
      toast('Check-out completado', `Hab. ${numero} en limpieza`, 'ok');
      moduloRack();
    } catch (err) {
      toast('Error', err.message, 'error');
      btn.disabled = false; btn.textContent = 'Confirmar check-out';
    }
  });
}

// ── Cambio de estado simple (mantenimiento/limpieza) ────────
function abrirCambioEstadoSimple(h) {
  const html = `
    <p style="font-size:0.85rem; color:var(--texto-sub); margin-bottom:1rem;">Cambiar estado de la Hab. ${escapeHtml(h.numero)}:</p>
    <div style="display:flex; flex-direction:column; gap:0.5rem;">
      <button style="${ST.btnOk}" onclick="setEstadoHab('${h.id}','libre')">✓ Marcar como Libre</button>
      <button style="${ST.btnSec}" onclick="setEstadoHab('${h.id}','limpieza')">🧹 Enviar a Limpieza</button>
      <button style="${ST.btnDanger}" onclick="setEstadoHab('${h.id}','mantenimiento')">🔧 Mantenimiento</button>
    </div>
  `;
  abrirModal(`Hab. ${h.numero}`, html, { ancho: '380px' });
}

async function setEstadoHab(habId, estado) {
  try {
    await db.from('habitaciones').update({ estado }).eq('id', habId);
    cerrarModal();
    toast('Estado actualizado', COLORES_ESTADO[estado]?.label || estado, 'ok');
    moduloRack();
  } catch (err) { toast('Error', err.message, 'error'); }
}


// ════════════════════════════════════════════════════════════
//  HOTEL › RESERVAS A FUTURO
// ════════════════════════════════════════════════════════════
async function moduloReservas() {
  skeleton();
  try {
    const { data: reservas } = await db.from('estadias_reservas')
      .select(`*, habitaciones(numero), huespedes(nombres, apellidos, num_doc, celular)`)
      .eq('hotel_id', SESSION.hotel.id)
      .eq('estado', 'reservada')
      .order('fecha_entrada')
      .limit(200);

    const total      = (reservas||[]).length;
    const habsUnicas = new Set((reservas||[]).map(r => r.habitacion_id)).size;
    const huespsUni  = new Set((reservas||[]).map(r => r.huesped_id)).size;
    const ingrEsp    = (reservas||[]).reduce((s,r) => s + Number(r.adelanto_pagado||0), 0);

    // Estado por reserva según fecha
    const ahora = new Date();
    const estadoReserva = (r) => {
      const entrada = new Date(r.fecha_entrada);
      const diff = Math.ceil((entrada - ahora) / (1000*60*60*24));
      if (diff <= 0) return ['Hoy','#16A34A','#F0FDF4'];
      if (diff <= 3) return ['Próxima','#2563EB','#EFF6FF'];
      return ['Confirmada','#7C3AED','#F5F3FF'];
    };

    contenido().innerHTML = `
      <!-- Header con botón a la derecha -->
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;margin-bottom:1.5rem;">
        <div style="display:flex;align-items:center;gap:1rem;">
          <div style="width:52px;height:52px;border-radius:14px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:26px;height:26px;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div>
            <h1 style="font-size:1.5rem;font-weight:700;color:var(--texto);margin:0;">Reservas a futuro</h1>
            <p style="font-size:0.83rem;color:var(--texto-sub);margin:0.2rem 0 0;">Gestiona las reservas próximas y mantén el control de tu ocupación</p>
          </div>
        </div>
        <button onclick="abrirNuevaReserva()" style="width:auto;padding:0.7rem 1.35rem;background:linear-gradient(135deg,var(--azul),#2563EB);color:white;border:none;border-radius:10px;font-size:0.88rem;font-weight:600;cursor:pointer;box-shadow:0 4px 14px rgba(26,63,166,0.3);display:flex;align-items:center;gap:0.5rem;white-space:nowrap;">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" style="width:16px;height:16px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nueva reserva
        </button>
      </div>

      <!-- 4 tarjetas con onda de fondo -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:1rem;margin-bottom:1.5rem;">
        ${resMetrica('Reserva(s) pendiente(s)', total, '#2563EB', '#EFF6FF', '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>')}
        ${resMetrica('Habitación(es) reservada(s)', habsUnicas, '#16A34A', '#F0FDF4', '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>')}
        ${resMetrica('Huésped(es) próximo(s)', huespsUni, '#16A34A', '#F0FDF4', '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>')}
        ${resMetricaSoles('Ingresos esperados', ingrEsp, '#7C3AED', '#F5F3FF', '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>')}
      </div>

      <!-- Buscador + filtros decorativos + Exportar -->
      <div style="display:flex;align-items:center;gap:0.65rem;flex-wrap:wrap;margin-bottom:0;">
        <div style="flex:1;min-width:220px;display:flex;align-items:center;gap:0.6rem;background:white;border:1px solid var(--gris-borde);border-radius:10px;padding:0.6rem 1rem;">
          <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:16px;height:16px;flex-shrink:0;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="res-buscar" placeholder="Buscar por huésped, habitación o fecha…" oninput="filtrarReservas()" style="border:none;background:none;outline:none;font-size:0.85rem;width:100%;font-family:inherit;color:var(--texto);">
        </div>
        <!-- Filtro fechas (decorativo) -->
        <div style="display:flex;align-items:center;gap:0.45rem;background:white;border:1px solid var(--gris-borde);border-radius:10px;padding:0.6rem 0.9rem;cursor:pointer;font-size:0.83rem;color:var(--texto-sub);">
          <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:15px;height:15px;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Todas las fechas
          <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <!-- Filtro estado (decorativo) -->
        <div style="display:flex;align-items:center;gap:0.45rem;background:white;border:1px solid var(--gris-borde);border-radius:10px;padding:0.6rem 0.9rem;cursor:pointer;font-size:0.83rem;color:var(--texto-sub);">
          <span style="width:8px;height:8px;border-radius:50%;background:#16A34A;flex-shrink:0;"></span>
          Todas las reservas
          <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <!-- Exportar -->
        <button style="display:flex;align-items:center;gap:0.4rem;background:white;border:1px solid var(--gris-borde);border-radius:10px;padding:0.6rem 0.9rem;cursor:pointer;font-size:0.83rem;color:var(--texto-sub);" onclick="exportarReservasCSV()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:15px;height:15px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Exportar
        </button>
      </div>

      <!-- Tabla sin card exterior (línea divisoria directa) -->
      <div style="background:white;border:1px solid var(--gris-borde);border-radius:12px;overflow:hidden;margin-top:0.85rem;margin-bottom:1rem;">
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:0.85rem;min-width:700px;">
            <thead>
              <tr style="border-bottom:1px solid var(--gris-borde);text-align:left;">
                <th style="${thCss()}">ENTRADA ↕</th>
                <th style="${thCss()}">SALIDA ↕</th>
                <th style="${thCss()}">HAB.</th>
                <th style="${thCss()}">HUÉSPED</th>
                <th style="${thCss()}">ADELANTO ↕</th>
                <th style="${thCss()}">ESTADO</th>
                <th style="${thCss()};text-align:right;">ACCIÓN</th>
              </tr>
            </thead>
            <tbody id="res-tbody">
              ${renderFilasReservas(reservas||[], estadoReserva)}
            </tbody>
          </table>
        </div>
        <!-- Paginación -->
        <div style="padding:0.85rem 1.25rem;display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--gris-borde);flex-wrap:wrap;gap:0.75rem;">
          <span style="font-size:0.82rem;color:var(--texto-sub);">Mostrando ${total} de ${total} reserva${total!==1?'s':''}</span>
          <div style="display:flex;align-items:center;gap:0.5rem;">
            <button style="width:32px;height:32px;border:1px solid var(--gris-borde);border-radius:8px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--texto-sub);">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button style="width:32px;height:32px;border:none;border-radius:8px;background:var(--azul);color:white;font-weight:700;font-size:0.85rem;cursor:pointer;">1</button>
            <button style="width:32px;height:32px;border:1px solid var(--gris-borde);border-radius:8px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--texto-sub);">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <select style="border:1px solid var(--gris-borde);border-radius:8px;padding:0.3rem 0.6rem;font-size:0.82rem;color:var(--texto-sub);background:white;cursor:pointer;">
              <option>10 por página</option>
              <option>25 por página</option>
              <option>50 por página</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Banner inferior con onda y botón Ver calendario -->
      <div style="background:white;border:1px solid var(--gris-borde);border-radius:12px;padding:1.25rem 1.5rem;display:flex;align-items:center;gap:1.25rem;flex-wrap:wrap;position:relative;overflow:hidden;">
        <!-- Onda decorativa de fondo -->
        <svg style="position:absolute;bottom:0;right:60px;opacity:0.12;" viewBox="0 0 300 80" width="300" height="80" preserveAspectRatio="none">
          <path d="M0 60 Q75 20 150 50 Q225 80 300 40 L300 80 L0 80 Z" fill="#2563EB"/>
        </svg>
        <svg style="position:absolute;bottom:0;right:0;opacity:0.08;" viewBox="0 0 200 80" width="200" height="80" preserveAspectRatio="none">
          <path d="M0 50 Q50 10 100 40 Q150 70 200 30 L200 80 L0 80 Z" fill="#7C3AED"/>
        </svg>
        <div style="width:46px;height:46px;border-radius:13px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative;">
          <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" style="width:23px;height:23px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div style="flex:1;position:relative;">
          <div style="font-weight:700;color:var(--texto);">Mantén tu ocupación al día</div>
          <div style="font-size:0.82rem;color:var(--texto-sub);">Las reservas a futuro te ayudan a planificar mejor la operatividad de tu hotel.</div>
        </div>
        <button style="display:flex;align-items:center;gap:0.5rem;background:white;border:1.5px solid var(--azul);border-radius:10px;padding:0.6rem 1.1rem;font-size:0.83rem;font-weight:600;color:var(--azul);cursor:pointer;position:relative;white-space:nowrap;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:15px;height:15px;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Ver calendario
        </button>
      </div>
    `;

    // Guardar en window para el filtro
    window._reservasData = reservas || [];
    window._reservasEstadoFn = estadoReserva;

  } catch (err) {
    contenido().innerHTML = errorBox('No se pudo cargar reservas', err.message);
  }
}

function renderFilasReservas(reservas, estadoReserva) {
  if (!reservas.length) return `
    <tr><td colspan="7" style="padding:3rem;text-align:center;color:var(--texto-sub);">
      <div style="font-size:2rem;margin-bottom:0.5rem;">📅</div>
      Sin reservas pendientes
    </td></tr>`;

  return reservas.map(r => {
    const h = r.huespedes || {};
    const hab = r.habitaciones || {};
    const nombre = `${h.nombres||''} ${h.apellidos||''}`.trim() || 'Sin nombre';
    const iniciales = nombre.split(/\s+/).slice(0,2).map(p=>p[0]||'').join('').toUpperCase()||'?';
    const [estLabel, estColor, estBg] = estadoReserva(r);
    const entradaD = new Date(r.fecha_entrada);
    const salidaD  = new Date(r.fecha_salida_prev);

    return `
      <tr style="border-bottom:1px solid var(--gris-borde);" class="res-fila"
          data-buscar="${(nombre+' '+hab.numero+' '+r.fecha_entrada).toLowerCase()}">
        <td style="${tdCss()}">
          <div style="font-size:1.35rem;font-weight:700;color:var(--texto);line-height:1;">${entradaD.getDate()}</div>
          <div style="font-size:0.75rem;color:var(--texto-sub);">${entradaD.toLocaleString('es-PE',{month:'short',year:'numeric'})}</div>
          <div style="font-size:0.72rem;color:var(--texto-sub);">${entradaD.toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'})}</div>
        </td>
        <td style="${tdCss()}">
          <div style="display:flex;align-items:center;gap:0.5rem;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            <div>
              <div style="font-size:1.05rem;font-weight:700;color:var(--texto);line-height:1;">${salidaD.getDate()}</div>
              <div style="font-size:0.72rem;color:var(--texto-sub);">${salidaD.toLocaleString('es-PE',{month:'short',year:'numeric'})}</div>
              <div style="font-size:0.72rem;color:var(--texto-sub);">${salidaD.toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'})}</div>
            </div>
          </div>
        </td>
        <td style="${tdCss()}">
          <span style="display:inline-block;background:var(--gris-bg);border:1.5px solid var(--gris-borde);border-radius:8px;padding:0.3rem 0.75rem;font-weight:700;font-size:0.9rem;">${escapeHtml(hab.numero||'—')}</span>
        </td>
        <td style="${tdCss()}">
          <div style="display:flex;align-items:center;gap:0.65rem;">
            <div style="width:34px;height:34px;border-radius:9px;background:rgba(37,99,235,0.1);color:var(--azul);font-weight:700;font-size:0.78rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${iniciales}</div>
            <div>
              <div style="font-weight:600;font-size:0.85rem;">${escapeHtml(nombre)}</div>
              <div style="font-size:0.72rem;color:var(--texto-sub);">1 huésped</div>
            </div>
          </div>
        </td>
        <td style="${tdCss()}">
          <span style="font-weight:700;color:${Number(r.adelanto_pagado)>0?'var(--verde)':'var(--texto-sub)'};">${soles(r.adelanto_pagado)}</span>
        </td>
        <td style="${tdCss()}">
          <span style="font-size:0.72rem;font-weight:700;color:${estColor};background:${estBg};padding:0.25rem 0.75rem;border-radius:999px;display:inline-flex;align-items:center;gap:0.3rem;">
            <span style="width:6px;height:6px;border-radius:50%;background:${estColor};"></span>
            ${estLabel}
          </span>
        </td>
        <td style="${tdCss()};text-align:right;">
          <div style="display:flex;align-items:center;gap:0.4rem;justify-content:flex-end;">
            <button style="${ST.btnOk};padding:0.4rem 0.9rem;display:flex;align-items:center;gap:0.35rem;font-size:0.8rem;" onclick="confirmarLlegadaReserva('${r.id}','${r.habitacion_id}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Check-in
            </button>
            <button style="${ST.btnSec};padding:0.4rem 0.55rem;" onclick="abrirOpcionesReserva('${r.id}','${r.habitacion_id}')">···</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

function resMetrica(label, valor, color, bg, icono) {
  return `
    <div class="card" style="padding:1.15rem;position:relative;overflow:hidden;">
      <div style="display:flex;align-items:flex-start;gap:0.85rem;">
        <div style="width:44px;height:44px;border-radius:12px;background:${bg};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:22px;height:22px;">${icono}</svg>
        </div>
        <div>
          <div style="font-size:1.75rem;font-weight:700;color:var(--texto);line-height:1;">${valor}</div>
          <div style="font-size:0.78rem;color:var(--texto-sub);margin-top:0.25rem;">${label}</div>
        </div>
      </div>
      <!-- onda decorativa de fondo -->
      <svg style="position:absolute;bottom:-10px;right:-10px;opacity:0.06;" viewBox="0 0 120 60" width="120" height="60">
        <path d="M0 40 Q30 10 60 40 Q90 70 120 40" fill="${color}" stroke="none"/>
      </svg>
    </div>`;
}

function resMetricaSoles(label, valor, color, bg, icono) {
  return `
    <div class="card" style="padding:1.15rem;position:relative;overflow:hidden;">
      <div style="display:flex;align-items:flex-start;gap:0.85rem;">
        <div style="width:44px;height:44px;border-radius:12px;background:${bg};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:22px;height:22px;">${icono}</svg>
        </div>
        <div>
          <div style="font-size:1.35rem;font-weight:700;color:var(--texto);line-height:1;">${soles(valor)}</div>
          <div style="font-size:0.78rem;color:var(--texto-sub);margin-top:0.25rem;">${label}</div>
        </div>
      </div>
      <svg style="position:absolute;bottom:-10px;right:-10px;opacity:0.06;" viewBox="0 0 120 60" width="120" height="60">
        <path d="M0 40 Q30 10 60 40 Q90 70 120 40" fill="${color}" stroke="none"/>
      </svg>
    </div>`;
}

function filtrarReservas() {
  const q = (document.getElementById('res-buscar')?.value||'').toLowerCase();
  document.querySelectorAll('.res-fila').forEach(tr => {
    tr.style.display = !q || tr.dataset.buscar.includes(q) ? '' : 'none';
  });
}

function exportarReservasCSV() {
  const rows = window._reservasData || [];
  if (!rows.length) { toast('Sin datos', '', 'warn'); return; }
  const cab = ['Entrada','Salida','Habitación','Nombres','Apellidos','Adelanto'];
  const lineas = rows.map(r => [
    fechaHora(r.fecha_entrada), fechaHora(r.fecha_salida_prev),
    r.habitaciones?.numero||'', r.huespedes?.nombres||'', r.huespedes?.apellidos||'',
    r.adelanto_pagado,
  ].map(v=>`"${String(v).replace(/"/g,'""')}"`).join(','));
  const csv = '\uFEFF' + [cab.join(','), ...lineas].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type:'text/csv;charset=utf-8;' }));
  a.download = `reservas_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  toast('Exportado', 'Archivo CSV descargado', 'ok');
}

function abrirOpcionesReserva(reservaId, habId) {
  abrirModal('Opciones de reserva', `
    <div style="display:flex;flex-direction:column;gap:0.5rem;">
      <button style="${ST.btnDanger};width:100%;padding:0.75rem;" onclick="cancelarReserva('${reservaId}','${habId}')">
        Cancelar reserva (liberar habitación)
      </button>
    </div>
  `, { ancho: '380px' });
}

async function cancelarReserva(reservaId, habId) {
  try {
    await db.from('estadias_reservas').update({ estado:'anulada' }).eq('id', reservaId);
    await db.from('habitaciones').update({ estado:'libre' }).eq('id', habId);
    cerrarModal();
    toast('Reserva cancelada', 'La habitación quedó libre', 'ok');
    moduloReservas();
  } catch(err) { toast('Error', err.message, 'error'); }
}

async function abrirNuevaReserva() {
  if (!SESSION.turnoActivo) SESSION.turnoActivo = await getTurnoAbierto();
  const { data: habs } = await db.from('habitaciones')
    .select(`id, numero, tipos_habitacion(nombre, tarifa_noche)`)
    .eq('hotel_id', SESSION.hotel.id).in('estado', ['libre']).eq('activo', true).order('numero');

  if (!habs || habs.length === 0) { toast('Sin habitaciones libres', '', 'warn'); return; }

  const html = `
    <form id="form-reserva">
      <div style="${ST.grupo}">
        <label style="${ST.label}">Habitación *</label>
        <select style="${ST.input}" id="res-hab">
          ${habs.map(h => `<option value="${h.id}" data-tarifa="${h.tipos_habitacion?.tarifa_noche||0}">Hab. ${escapeHtml(h.numero)} — ${escapeHtml(h.tipos_habitacion?.nombre||'')}</option>`).join('')}
        </select>
      </div>
      <div style="${ST.grupo}">
        <label style="${ST.label}">Fecha y hora de entrada *</label>
        <input style="${ST.input}" id="res-fecha" type="datetime-local" required>
      </div>
      <div style="${ST.fila}">
        <div style="${ST.grupo}"><label style="${ST.label}">DNI</label><input style="${ST.input}" id="res-dni" maxlength="8"></div>
        <div style="${ST.grupo}"><label style="${ST.label}">Celular</label><input style="${ST.input}" id="res-celular"></div>
      </div>
      <div style="${ST.fila}">
        <div style="${ST.grupo}"><label style="${ST.label}">Nombres *</label><input style="${ST.input}" id="res-nombres" required></div>
        <div style="${ST.grupo}"><label style="${ST.label}">Apellidos *</label><input style="${ST.input}" id="res-apellidos" required></div>
      </div>
      <div style="${ST.fila}">
        <div style="${ST.grupo}"><label style="${ST.label}">Adelanto</label><input style="${ST.input}" id="res-adelanto" type="number" step="0.01" value="0"></div>
        <div style="${ST.grupo}"><label style="${ST.label}">Método</label>
          <select style="${ST.input}" id="res-metodo"><option value="efectivo">Efectivo</option><option value="yape">Yape</option><option value="plin">Plin</option><option value="transferencia">Transferencia</option></select>
        </div>
      </div>
      <button type="submit" style="${ST.btnPri}">Crear reserva</button>
    </form>
  `;
  abrirModal('Nueva reserva', html, { ancho: '520px' });

  $('#form-reserva').addEventListener('submit', async e => {
    e.preventDefault();
    try {
      const habId = $('#res-hab').value;
      const tarifa = parseFloat($('#res-hab').selectedOptions[0].dataset.tarifa) || 0;
      const dni = $('#res-dni').value.trim() || ('SINDOC'+Date.now());
      const nombres = $('#res-nombres').value.trim();
      const apellidos = $('#res-apellidos').value.trim();
      const adelanto = parseFloat($('#res-adelanto').value) || 0;
      const fecha = $('#res-fecha').value;
      if (!nombres || !apellidos || !fecha) { toast('Completa los campos', '', 'warn'); return; }

      // Huésped
      let huespedId;
      const { data: hE } = await db.from('huespedes').select('id').eq('hotel_id', SESSION.hotel.id).eq('num_doc', dni).maybeSingle();
      if (hE) { huespedId = hE.id; }
      else {
        const { data: nH } = await db.from('huespedes').insert({
          hotel_id: SESSION.hotel.id, tipo_doc:'DNI', num_doc:dni, nombres, apellidos, celular:$('#res-celular').value.trim(),
        }).select('id').single();
        huespedId = nH.id;
      }

      // Estadía tipo reserva
      const salidaPrev = new Date(fecha); salidaPrev.setDate(salidaPrev.getDate()+1);
      const { data: est } = await db.from('estadias_reservas').insert({
        hotel_id: SESSION.hotel.id, habitacion_id: habId, huesped_id: huespedId,
        turno_caja_id: SESSION.turnoActivo?.id, modalidad:'noche', tipo_reserva:'reserva_futura',
        estado:'reservada', fecha_entrada:new Date(fecha).toISOString(),
        fecha_salida_prev:salidaPrev.toISOString(), tarifa_aplicada:tarifa,
        adelanto_pagado:adelanto, total_final:tarifa, metodo_pago:$('#res-metodo').value,
      }).select('id').single();

      // Cobrar adelanto a caja
      if (adelanto > 0 && SESSION.turnoActivo) {
        await db.from('movimientos_caja').insert({
          hotel_id: SESSION.hotel.id, turno_caja_id: SESSION.turnoActivo.id, tipo:'ingreso',
          concepto:`Adelanto reserva Hab. (${nombres})`, monto:adelanto, metodo_pago:$('#res-metodo').value,
          referencia_id:est.id, referencia_tipo:'adelanto', usuario_id:SESSION.user.id,
        });
      }
      // Marcar habitación reservada
      await db.from('habitaciones').update({ estado:'reservada' }).eq('id', habId);

      cerrarModal();
      toast('Reserva creada', adelanto>0?`Adelanto ${soles(adelanto)} cobrado`:'', 'ok');
      moduloReservas();
    } catch (err) { toast('Error', err.message, 'error'); }
  });
}

async function confirmarLlegadaReserva(estadiaId, habId) {
  try {
    await db.from('estadias_reservas').update({
      estado:'activa', fecha_entrada:new Date().toISOString(),
    }).eq('id', estadiaId);
    await db.from('habitaciones').update({ estado:'ocupada' }).eq('id', habId);
    toast('Huésped registrado', 'La reserva pasó a estadía activa', 'ok');
    moduloReservas();
  } catch (err) { toast('Error', err.message, 'error'); }
}


// ════════════════════════════════════════════════════════════
//  HOTEL › HUÉSPEDES (registro oficial + export Excel)
// ════════════════════════════════════════════════════════════
async function moduloHuespedes() {
  skeleton();
  try {
    const { data: huespedes } = await db.from('huespedes')
      .select('*').eq('hotel_id', SESSION.hotel.id).order('created_at', { ascending:false }).limit(300);

    // Métricas: alojamientos activos y check-ins/outs de hoy
    const hoyIni = new Date(); hoyIni.setHours(0,0,0,0);
    const hoyFin = new Date(); hoyFin.setHours(23,59,59,999);

    const { data: activos } = await db.from('estadias_reservas')
      .select('id', { count:'exact' }).eq('hotel_id', SESSION.hotel.id).eq('estado','activa');
    const { data: checkinHoy } = await db.from('estadias_reservas')
      .select('id').eq('hotel_id', SESSION.hotel.id)
      .gte('fecha_entrada', hoyIni.toISOString()).lte('fecha_entrada', hoyFin.toISOString())
      .eq('estado','activa');
    const { data: checkoutHoy } = await db.from('estadias_reservas')
      .select('id').eq('hotel_id', SESSION.hotel.id)
      .gte('fecha_salida_real', hoyIni.toISOString()).lte('fecha_salida_real', hoyFin.toISOString())
      .eq('estado','check_out');

    const totalHuespedes = (huespedes||[]).length;
    const totalActivos   = (activos||[]).length;
    const totalCIHoy     = (checkinHoy||[]).length;
    const totalCOHoy     = (checkoutHoy||[]).length;

    window._huespedesCache = huespedes || [];
    window._huespedesAll   = huespedes || [];

    contenido().innerHTML = `
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;margin-bottom:1.5rem;">
        <div style="display:flex;align-items:center;gap:1rem;">
          <div style="width:52px;height:52px;border-radius:14px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:26px;height:26px;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div>
            <h1 style="font-size:1.5rem;font-weight:700;color:var(--texto);margin:0;">Huéspedes</h1>
            <p style="font-size:0.83rem;color:var(--texto-sub);margin:0.2rem 0 0;">Registro oficial de huéspedes del establecimiento</p>
          </div>
        </div>
        <button onclick="abrirRegistrarHuesped()" style="width:auto;padding:0.7rem 1.35rem;background:linear-gradient(135deg,var(--azul),#2563EB);color:white;border:none;border-radius:10px;font-size:0.88rem;font-weight:600;cursor:pointer;box-shadow:0 4px 14px rgba(26,63,166,0.3);display:flex;align-items:center;gap:0.5rem;white-space:nowrap;">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" style="width:16px;height:16px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Registrar huésped
        </button>
      </div>

      <!-- 4 tarjetas métricas -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:1rem;margin-bottom:1.5rem;">
        ${huesMetrica('Huéspedes registrados', totalHuespedes, '#2563EB', '#EFF6FF',
          '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>', true)}
        ${huesMetrica('Alojamientos activos', totalActivos, '#16A34A', '#F0FDF4',
          '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>', true)}
        ${huesMetrica('Check-in hoy', totalCIHoy, '#CA8A04', '#FEFCE8',
          '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>', false)}
        ${huesMetrica('Check-out hoy', totalCOHoy, '#DC2626', '#FEF2F2',
          '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>', false)}
      </div>

      <!-- Barra de filtros -->
      <div style="background:white;border:1px solid var(--gris-borde);border-radius:12px;padding:0.85rem 1.1rem;display:flex;align-items:center;gap:0.65rem;flex-wrap:wrap;margin-bottom:1rem;">
        <div style="flex:1;min-width:200px;display:flex;align-items:center;gap:0.6rem;background:var(--gris-bg);border:1px solid var(--gris-borde);border-radius:9px;padding:0.55rem 0.9rem;">
          <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:15px;height:15px;flex-shrink:0;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="hues-buscar" placeholder="Buscar por nombre, DNI o celular…" oninput="filtrarHuespedes()" style="border:none;background:none;outline:none;font-size:0.83rem;width:100%;font-family:inherit;color:var(--texto);">
        </div>
        <div style="display:flex;align-items:center;gap:0.4rem;background:var(--gris-bg);border:1px solid var(--gris-borde);border-radius:9px;padding:0.5rem 0.8rem;font-size:0.8rem;color:var(--texto-sub);cursor:pointer;">
          <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Fecha de registro
          <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:12px;height:12px;"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div style="display:flex;align-items:center;gap:0.4rem;background:var(--gris-bg);border:1px solid var(--gris-borde);border-radius:9px;padding:0.5rem 0.8rem;font-size:0.8rem;color:var(--texto-sub);cursor:pointer;">
          <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          Todos los estados
          <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:12px;height:12px;"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div style="display:flex;align-items:center;gap:0.4rem;background:var(--gris-bg);border:1px solid var(--gris-borde);border-radius:9px;padding:0.5rem 0.8rem;font-size:0.8rem;color:var(--texto-sub);cursor:pointer;">
          <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
          Más recientes
          <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:12px;height:12px;"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <button onclick="document.getElementById('hues-buscar').value=''; filtrarHuespedes();" style="background:none;border:none;font-size:0.8rem;color:var(--texto-sub);cursor:pointer;padding:0.5rem 0.6rem;border-radius:9px;white-space:nowrap;" onmouseover="this.style.background='var(--gris-bg)'" onmouseout="this.style.background='none'">
          Limpiar filtros
        </button>
        <div style="margin-left:auto;">
          <button style="display:flex;align-items:center;gap:0.4rem;background:none;border:none;font-size:0.8rem;color:var(--texto-sub);cursor:pointer;padding:0.5rem 0.75rem;border-radius:9px;" onclick="exportarHuespedesCSV()" onmouseover="this.style.background='var(--gris-bg)'" onmouseout="this.style.background='none'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Exportar CSV
          </button>
        </div>
      </div>

      <!-- Tabla -->
      <div style="background:white;border:1px solid var(--gris-borde);border-radius:12px;overflow:hidden;">
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:0.85rem;min-width:700px;">
            <thead>
              <tr style="border-bottom:1px solid var(--gris-borde);text-align:left;">
                <th style="${thCss()}; width:50px;">#</th>
                <th style="${thCss()}">DOCUMENTO</th>
                <th style="${thCss()}">NOMBRES</th>
                <th style="${thCss()}">APELLIDOS</th>
                <th style="${thCss()}">CELULAR</th>
                <th style="${thCss()}">REGISTRO</th>
                <th style="${thCss()}">ESTADO</th>
                <th style="${thCss()};text-align:right;">ACCIONES</th>
              </tr>
            </thead>
            <tbody id="hues-tbody">
              ${renderFilasHuespedes(huespedes||[])}
            </tbody>
          </table>
        </div>
        <!-- Paginación -->
        <div style="padding:0.85rem 1.25rem;display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--gris-borde);flex-wrap:wrap;gap:0.75rem;">
          <span style="font-size:0.82rem;color:var(--texto-sub);">Mostrando ${totalHuespedes} de ${totalHuespedes} registro(s)</span>
          <div style="display:flex;align-items:center;gap:0.5rem;">
            <button style="width:32px;height:32px;border:1px solid var(--gris-borde);border-radius:8px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--texto-sub);">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button style="width:32px;height:32px;border:none;border-radius:8px;background:var(--azul);color:white;font-weight:700;font-size:0.85rem;cursor:pointer;">1</button>
            <button style="width:32px;height:32px;border:1px solid var(--gris-borde);border-radius:8px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--texto-sub);">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <select style="border:1px solid var(--gris-borde);border-radius:8px;padding:0.3rem 0.6rem;font-size:0.82rem;color:var(--texto-sub);background:white;cursor:pointer;">
              <option>10 por página</option>
              <option>25 por página</option>
              <option>50 por página</option>
            </select>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    contenido().innerHTML = errorBox('No se pudo cargar huéspedes', err.message);
  }
}

function huesMetrica(label, valor, color, bg, icono, flecha) {
  return `
    <div class="card" style="padding:1.15rem;position:relative;overflow:hidden;">
      <div style="display:flex;align-items:center;gap:0.85rem;">
        <div style="width:46px;height:46px;border-radius:13px;background:${bg};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:23px;height:23px;">${icono}</svg>
        </div>
        <div style="flex:1;">
          <div style="display:flex;align-items:center;gap:0.5rem;">
            <span style="font-size:1.75rem;font-weight:700;color:var(--texto);line-height:1;">${valor}</span>
            ${flecha ? `<svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" style="width:18px;height:18px;opacity:0.7;"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>` : ''}
          </div>
          <div style="font-size:0.78rem;color:var(--texto-sub);margin-top:0.2rem;">${label}</div>
        </div>
      </div>
      <svg style="position:absolute;bottom:-8px;right:-8px;opacity:0.07;" viewBox="0 0 100 50" width="100" height="50">
        <path d="M0 35 Q25 10 50 30 Q75 50 100 25 L100 50 L0 50 Z" fill="${color}"/>
      </svg>
    </div>`;
}

function renderFilasHuespedes(lista) {
  if (!lista.length) return `
    <tr><td colspan="8" style="padding:3rem;text-align:center;color:var(--texto-sub);">
      <div style="font-size:2rem;margin-bottom:0.5rem;">👤</div>
      Sin huéspedes registrados aún
    </td></tr>`;

  return lista.map((h, i) => `
    <tr class="hues-fila" data-buscar="${(h.nombres+' '+h.apellidos+' '+h.num_doc+' '+(h.celular||'')).toLowerCase()}" style="border-bottom:1px solid var(--gris-borde);">
      <td style="${tdCss()};color:var(--texto-sub);">${i+1}</td>
      <td style="${tdCss()}">
        <div style="display:flex;align-items:center;gap:0.5rem;">
          <div style="width:32px;height:32px;border-radius:8px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" style="width:15px;height:15px;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <span style="font-family:monospace;font-weight:600;">${escapeHtml(h.tipo_doc)} ${escapeHtml(h.num_doc)}</span>
        </div>
      </td>
      <td style="${tdCss()};font-weight:600;">${escapeHtml(h.nombres)}</td>
      <td style="${tdCss()}">${escapeHtml(h.apellidos)}</td>
      <td style="${tdCss()};color:var(--texto-sub);">${escapeHtml(h.celular||'—')}</td>
      <td style="${tdCss()}">
        <div style="display:flex;align-items:center;gap:0.5rem;">
          <div style="width:28px;height:28px;border-radius:7px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div>
            <div style="font-weight:600;font-size:0.83rem;">${new Date(h.created_at).toLocaleDateString('es-PE',{day:'numeric',month:'short',year:'numeric'})}</div>
            <div style="font-size:0.72rem;color:var(--texto-sub);">${new Date(h.created_at).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'})}</div>
          </div>
        </div>
      </td>
      <td style="${tdCss()}">
        <span style="display:inline-flex;align-items:center;gap:0.35rem;font-size:0.72rem;font-weight:700;color:#16A34A;background:#F0FDF4;padding:0.25rem 0.75rem;border-radius:999px;">
          <span style="width:6px;height:6px;border-radius:50%;background:#16A34A;"></span>
          Registrado
        </span>
      </td>
      <td style="${tdCss()};text-align:right;">
        <div style="display:flex;align-items:center;gap:0.35rem;justify-content:flex-end;">
          <button title="Ver detalle" style="width:32px;height:32px;border:1px solid var(--gris-borde);border-radius:8px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--texto-sub);" onmouseover="this.style.background='var(--gris-bg)'" onmouseout="this.style.background='white'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button title="Editar" style="width:32px;height:32px;border:1px solid var(--gris-borde);border-radius:8px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--texto-sub);" onmouseover="this.style.background='var(--gris-bg)'" onmouseout="this.style.background='white'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button title="Más opciones" style="width:32px;height:32px;border:1px solid var(--gris-borde);border-radius:8px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--texto-sub);" onmouseover="this.style.background='var(--gris-bg)'" onmouseout="this.style.background='white'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
          </button>
        </div>
      </td>
    </tr>`).join('');
}

function filtrarHuespedes() {
  const q = (document.getElementById('hues-buscar')?.value||'').toLowerCase();
  document.querySelectorAll('.hues-fila').forEach(tr => {
    tr.style.display = !q || tr.dataset.buscar.includes(q) ? '' : 'none';
  });
}

function abrirRegistrarHuesped() {
  const html = `
    <form id="form-huesped">
      <div style="${ST.fila}">
        <div style="${ST.grupo}">
          <label style="${ST.label}">Tipo documento *</label>
          <select style="${ST.input}" id="h-tipodoc">
            <option value="DNI">DNI</option>
            <option value="CE">Carnet Extranjería</option>
            <option value="PASAPORTE">Pasaporte</option>
          </select>
        </div>
        <div style="${ST.grupo}">
          <label style="${ST.label}">Número *</label>
          <input style="${ST.input}" id="h-numdoc" required maxlength="12" placeholder="73336027">
        </div>
      </div>
      <div style="${ST.fila}">
        <div style="${ST.grupo}"><label style="${ST.label}">Nombres *</label><input style="${ST.input}" id="h-nombres" required></div>
        <div style="${ST.grupo}"><label style="${ST.label}">Apellidos *</label><input style="${ST.input}" id="h-apellidos" required></div>
      </div>
      <div style="${ST.grupo}"><label style="${ST.label}">Celular</label><input style="${ST.input}" id="h-celular" placeholder="975561764"></div>
      <button type="submit" style="${ST.btnPri}">Registrar huésped</button>
    </form>
  `;
  abrirModal('Registrar huésped', html, { ancho: '480px' });

  $('#form-huesped').addEventListener('submit', async e => {
    e.preventDefault();
    const tipodoc = $('#h-tipodoc').value;
    const numdoc  = $('#h-numdoc').value.trim();
    const nombres = $('#h-nombres').value.trim();
    const apellidos = $('#h-apellidos').value.trim();
    const celular = $('#h-celular').value.trim();
    if (!numdoc || !nombres || !apellidos) { toast('Completa los campos requeridos','','warn'); return; }
    try {
      const { error } = await db.from('huespedes').insert({
        hotel_id: SESSION.hotel.id, tipo_doc: tipodoc, num_doc: numdoc,
        nombres, apellidos, celular: celular||null,
      });
      if (error) throw error;
      cerrarModal();
      toast('Huésped registrado','','ok');
      moduloHuespedes();
    } catch(err) {
      toast('Error', err.message.includes('duplicate')?'Ya existe un huésped con ese documento':err.message,'error');
    }
  });
}

function exportarHuespedesCSV() {
  const rows = window._huespedesCache || [];
  if (!rows.length) { toast('Sin datos', 'No hay huéspedes para exportar', 'warn'); return; }
  const cab = ['Tipo Doc','Documento','Nombres','Apellidos','Celular','Nacionalidad','Fecha Registro'];
  const lineas = rows.map(h => [
    h.tipo_doc, h.num_doc, h.nombres, h.apellidos, h.celular||'', h.nacionalidad||'PE', fechaCorta(h.created_at)
  ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(','));
  const csv = '\uFEFF' + [cab.join(','), ...lineas].join('\n');
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `huespedes_${SESSION.hotel.nombre_comercial}_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  toast('Exportado', 'Archivo CSV descargado', 'ok');
}


// ════════════════════════════════════════════════════════════
//  HOTEL › TIENDITA / ALMACÉN
// ════════════════════════════════════════════════════════════
async function moduloTiendita() {
  skeleton();
  try {
    if (!SESSION.turnoActivo) SESSION.turnoActivo = await getTurnoAbierto();
    const { data: productos } = await db.from('productos')
      .select('*').eq('hotel_id', SESSION.hotel.id).eq('activo', true).order('nombre');

    const prods = productos || [];
    window._productosCache = prods;

    // Métricas
    const totalProds   = prods.length;
    const stockTotal   = prods.reduce((s,p) => s + Number(p.stock_actual||0), 0);
    const valorCosto   = prods.reduce((s,p) => s + Number(p.stock_actual||0) * Number(p.costo_compra||0), 0);
    const valorVenta   = prods.reduce((s,p) => s + Number(p.stock_actual||0) * Number(p.precio_venta||0), 0);

    // Categorías únicas
    const cats = ['Todos', ...new Set(prods.map(p => p.categoria||'general').filter(Boolean))];
    const catCounts = {};
    cats.forEach(c => { catCounts[c] = c==='Todos' ? prods.length : prods.filter(p=>(p.categoria||'general')===c).length; });

    // Filtro activo
    window._tiendaFiltrocat = window._tiendaFiltrocat || 'Todos';

    contenido().innerHTML = `
      <!-- Header -->
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;flex-wrap:wrap;margin-bottom:1.5rem;">
        <div>
          <h1 style="font-size:1.5rem;font-weight:700;color:var(--texto);margin:0;">Tiendita / Almacén</h1>
          <p style="font-size:0.83rem;color:var(--texto-sub);margin:0.2rem 0 0;">Gestiona tus productos, controla el stock y realiza ventas rápidas.</p>
        </div>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;">
          <button onclick="abrirReposicion()" style="display:flex;align-items:center;gap:0.45rem;background:white;border:1px solid var(--gris-borde);border-radius:10px;padding:0.6rem 1rem;font-size:0.83rem;font-weight:500;color:var(--texto-sub);cursor:pointer;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:16px;height:16px;"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            Reposición de stock
          </button>
          <button onclick="abrirVentaRapida()" style="display:flex;align-items:center;gap:0.45rem;background:white;border:1px solid var(--gris-borde);border-radius:10px;padding:0.6rem 1rem;font-size:0.83rem;font-weight:600;color:var(--azul);cursor:pointer;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:16px;height:16px;"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            Venta rápida
          </button>
          <button onclick="abrirFormProducto()" style="width:auto;padding:0.6rem 1.1rem;background:linear-gradient(135deg,var(--azul),#2563EB);color:white;border:none;border-radius:10px;font-size:0.83rem;font-weight:600;cursor:pointer;box-shadow:0 4px 14px rgba(26,63,166,0.3);display:flex;align-items:center;gap:0.45rem;">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" style="width:15px;height:15px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo producto
          </button>
        </div>
      </div>

      <!-- 4 tarjetas métricas -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:1rem;margin-bottom:1.5rem;">
        ${tiendaMetrica('Productos', totalProds, 'Activos en inventario', '#2563EB', '#EFF6FF', '0%',
          '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>')}
        ${tiendaMetrica('Stock total', stockTotal, 'Unidades', '#16A34A', '#F0FDF4', '12%',
          '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>')}
        ${tiendaMetrica('Valor en inventario (costo)', valorCosto, '', '#EA580C', '#FFF7ED', '8%',
          '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>',
          true)}
        ${tiendaMetrica('Valor de venta (potencial)', valorVenta, '', '#DC2626', '#FEF2F2', '8%',
          '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
          true)}
      </div>

      <!-- Filtros de categoría + buscador + ordenar + filtros -->
      <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-bottom:1rem;">
        <div style="display:flex;gap:0.35rem;flex-wrap:wrap;flex:1;">
          ${cats.map(c => `
            <button onclick="filtrarTiendaCat('${c}')" id="cat-btn-${c.replace(/\s/g,'_')}"
              style="padding:0.45rem 0.9rem;border-radius:999px;font-size:0.82rem;font-weight:600;cursor:pointer;border:none;
              background:${window._tiendaFiltrocat===c?'var(--azul)':'white'};
              color:${window._tiendaFiltrocat===c?'white':'var(--texto-sub)'};
              box-shadow:${window._tiendaFiltrocat===c?'0 4px 12px rgba(37,99,235,0.3)':'none'};
              border:1px solid ${window._tiendaFiltrocat===c?'transparent':'var(--gris-borde)'};">
              ${escapeHtml(c)} (${catCounts[c]||0})
            </button>`).join('')}
        </div>
        <div style="display:flex;align-items:center;gap:0.5rem;">
          <div style="display:flex;align-items:center;gap:0.5rem;background:white;border:1px solid var(--gris-borde);border-radius:10px;padding:0.5rem 0.85rem;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" id="tienda-buscar" placeholder="Buscar producto…" oninput="filtrarTiendaBuscar()" style="border:none;background:none;outline:none;font-size:0.82rem;width:140px;font-family:inherit;color:var(--texto);">
          </div>
          <div style="display:flex;align-items:center;gap:0.4rem;background:white;border:1px solid var(--gris-borde);border-radius:10px;padding:0.5rem 0.8rem;font-size:0.8rem;color:var(--texto-sub);cursor:pointer;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px;"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
            Ordenar por
            <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:12px;height:12px;"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <div style="display:flex;align-items:center;gap:0.4rem;background:white;border:1px solid var(--gris-borde);border-radius:10px;padding:0.5rem 0.8rem;font-size:0.8rem;color:var(--texto-sub);cursor:pointer;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px;"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            Filtros
          </div>
        </div>
      </div>

      <!-- Tabla de productos -->
      <div style="background:white;border:1px solid var(--gris-borde);border-radius:12px;overflow:hidden;margin-bottom:1rem;">
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:0.85rem;min-width:750px;">
            <thead>
              <tr style="border-bottom:1px solid var(--gris-borde);text-align:left;">
                <th style="padding:0.85rem 0.75rem;width:40px;"><input type="checkbox" style="cursor:pointer;"></th>
                <th style="${thCss()};width:40px;">#</th>
                <th style="${thCss()}">PRODUCTO</th>
                <th style="${thCss()}">CATEGORÍA</th>
                <th style="${thCss()}">PRECIO VENTA</th>
                <th style="${thCss()}">COSTO</th>
                <th style="${thCss()}">STOCK</th>
                <th style="${thCss()}">VALOR EN STOCK</th>
                <th style="${thCss()}">ESTADO</th>
                <th style="${thCss()};text-align:right;">ACCIÓN</th>
              </tr>
            </thead>
            <tbody id="tienda-tbody">
              ${renderFilasTienda(prods, 'Todos')}
            </tbody>
          </table>
        </div>
        <!-- Paginación -->
        <div style="padding:0.85rem 1.25rem;display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--gris-borde);flex-wrap:wrap;gap:0.75rem;">
          <span style="font-size:0.82rem;color:var(--texto-sub);">Mostrando 1 a ${prods.length} de ${prods.length} productos</span>
          <div style="display:flex;align-items:center;gap:0.5rem;">
            <button style="width:32px;height:32px;border:1px solid var(--gris-borde);border-radius:8px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--texto-sub);">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button style="width:32px;height:32px;border:none;border-radius:8px;background:var(--azul);color:white;font-weight:700;font-size:0.85rem;cursor:pointer;">1</button>
            <button style="width:32px;height:32px;border:1px solid var(--gris-borde);border-radius:8px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--texto-sub);">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <select style="border:1px solid var(--gris-borde);border-radius:8px;padding:0.3rem 0.6rem;font-size:0.82rem;color:var(--texto-sub);background:white;cursor:pointer;">
              <option>10 por página</option><option>25 por página</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Banner inferior -->
      <div style="background:white;border:1px solid var(--gris-borde);border-radius:12px;padding:1.25rem 1.5rem;display:flex;align-items:center;gap:1.25rem;flex-wrap:wrap;position:relative;overflow:hidden;">
        <svg style="position:absolute;bottom:0;right:80px;opacity:0.10;" viewBox="0 0 300 80" width="300" height="80" preserveAspectRatio="none">
          <path d="M0 60 Q75 20 150 50 Q225 80 300 40 L300 80 L0 80 Z" fill="#2563EB"/>
        </svg>
        <svg style="position:absolute;bottom:0;right:0;opacity:0.07;" viewBox="0 0 200 80" width="200" height="80" preserveAspectRatio="none">
          <path d="M0 50 Q50 10 100 40 Q150 70 200 30 L200 80 L0 80 Z" fill="#7C3AED"/>
        </svg>
        <div style="width:46px;height:46px;border-radius:13px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative;">
          <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" style="width:22px;height:22px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <div style="flex:1;position:relative;">
          <div style="font-weight:700;color:var(--texto);">Mantén tu inventario bajo control</div>
          <div style="font-size:0.82rem;color:var(--texto-sub);">Registra nuevos productos, actualiza el stock y realiza ventas rápidas desde aquí.</div>
        </div>
        <button onclick="toast('Próximamente','Función en desarrollo','info')" style="display:flex;align-items:center;gap:0.5rem;background:white;border:1.5px solid var(--azul);border-radius:10px;padding:0.6rem 1.1rem;font-size:0.83rem;font-weight:600;color:var(--azul);cursor:pointer;position:relative;white-space:nowrap;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:15px;height:15px;"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          Ver reporte de stock
        </button>
      </div>
    `;
  } catch (err) {
    contenido().innerHTML = errorBox('No se pudo cargar la tiendita', err.message);
  }
}

function tiendaMetrica(label, valor, sub, color, bg, pct, icono, esSoles=false) {
  return `
    <div class="card" style="padding:1.15rem;position:relative;overflow:hidden;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:0.6rem;">
        <div style="width:44px;height:44px;border-radius:12px;background:${bg};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:22px;height:22px;">${icono}</svg>
        </div>
        <span style="font-size:0.72rem;font-weight:700;color:${color};background:${bg};padding:0.15rem 0.5rem;border-radius:999px;display:flex;align-items:center;gap:0.2rem;">
          <svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" style="width:11px;height:11px;"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          ${pct}
        </span>
      </div>
      <div style="font-size:1.65rem;font-weight:700;color:var(--texto);line-height:1.1;">${esSoles ? soles(valor) : valor}</div>
      <div style="font-size:0.75rem;color:var(--texto-sub);margin-top:0.2rem;">${label}${sub ? '<br><span style="font-size:0.7rem;">'+sub+'</span>' : ''}</div>
      <svg style="position:absolute;bottom:-8px;right:-8px;opacity:0.07;" viewBox="0 0 100 50" width="100" height="50">
        <path d="M0 35 Q25 10 50 30 Q75 50 100 25 L100 50 L0 50 Z" fill="${color}"/>
      </svg>
    </div>`;
}

const TIENDA_CATS_COLORES = {
  bebidas:  { bg:'#EFF6FF', color:'#2563EB' },
  snacks:   { bg:'#FFF7ED', color:'#EA580C' },
  higiene:  { bg:'#F5F3FF', color:'#7C3AED' },
  general:  { bg:'#F1F5F9', color:'#64748B' },
  otros:    { bg:'#F1F5F9', color:'#64748B' },
};

function renderFilasTienda(prods, cat) {
  const lista = cat==='Todos' ? prods : prods.filter(p=>(p.categoria||'general')===cat);
  if (!lista.length) return `
    <tr><td colspan="10" style="padding:3rem;text-align:center;color:var(--texto-sub);">
      <div style="font-size:2rem;margin-bottom:0.5rem;">📦</div>
      Sin productos${cat!=='Todos'?' en esta categoría':''}. ${cat==='Todos'?'Crea el primero.':''}
    </td></tr>`;

  return lista.map((p, i) => {
    const catKey = (p.categoria||'general').toLowerCase();
    const catColor = TIENDA_CATS_COLORES[catKey] || TIENDA_CATS_COLORES.general;
    const valorStock = Number(p.stock_actual||0) * Number(p.precio_venta||0);
    const bajStock = Number(p.stock_actual||0) <= Number(p.stock_minimo||0);

    return `
      <tr class="tienda-fila" data-cat="${escapeHtml(p.categoria||'general')}" data-buscar="${escapeHtml(p.nombre+' '+(p.categoria||'')).toLowerCase()}" style="border-bottom:1px solid var(--gris-borde);">
        <td style="padding:0.85rem 0.75rem;"><input type="checkbox" style="cursor:pointer;"></td>
        <td style="${tdCss()};color:var(--texto-sub);">${i+1}</td>
        <td style="${tdCss()}">
          <div style="font-weight:700;font-size:0.88rem;">${escapeHtml(p.nombre)}</div>
          <div style="font-size:0.72rem;color:var(--texto-sub);">${escapeHtml(p.descripcion||p.categoria||'')}</div>
        </td>
        <td style="${tdCss()}">
          <span style="font-size:0.75rem;font-weight:600;color:${catColor.color};background:${catColor.bg};padding:0.2rem 0.7rem;border-radius:999px;">
            ${escapeHtml(p.categoria||'general')}
          </span>
        </td>
        <td style="${tdCss()};font-weight:600;">${soles(p.precio_venta)}</td>
        <td style="${tdCss()};color:var(--texto-sub);">${soles(p.costo_compra)}</td>
        <td style="${tdCss()}">
          <span style="display:inline-block;min-width:36px;text-align:center;font-weight:700;font-size:0.9rem;padding:0.25rem 0.6rem;border-radius:8px;background:${bajStock?'#FEF2F2':'#F0FDF4'};color:${bajStock?'var(--rojo)':'var(--verde)'};">
            ${p.stock_actual}
          </span>
          ${bajStock?'<span style="font-size:0.65rem;color:var(--rojo);margin-left:0.3rem;">⚠ bajo</span>':''}
        </td>
        <td style="${tdCss()};font-weight:600;">${soles(valorStock)}</td>
        <td style="${tdCss()}">
          <span style="display:inline-flex;align-items:center;gap:0.35rem;font-size:0.72rem;font-weight:700;color:${bajStock?'#DC2626':'#16A34A'};background:${bajStock?'#FEF2F2':'#F0FDF4'};padding:0.25rem 0.75rem;border-radius:999px;">
            <span style="width:6px;height:6px;border-radius:50%;background:${bajStock?'#DC2626':'#16A34A'};"></span>
            ${bajStock?'Stock bajo':'En stock'}
          </span>
        </td>
        <td style="${tdCss()};text-align:right;">
          <div style="display:flex;align-items:center;gap:0.35rem;justify-content:flex-end;">
            <button title="Editar" onclick="abrirFormProducto('${p.id}')" style="width:32px;height:32px;border:1px solid var(--gris-borde);border-radius:8px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--texto-sub);" onmouseover="this.style.background='var(--gris-bg)'" onmouseout="this.style.background='white'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button title="Más opciones" style="width:32px;height:32px;border:1px solid var(--gris-borde);border-radius:8px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--texto-sub);" onmouseover="this.style.background='var(--gris-bg)'" onmouseout="this.style.background='white'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

function filtrarTiendaCat(cat) {
  window._tiendaFiltrocat = cat;
  const prods = window._productosCache || [];
  // Actualizar botones activos
  document.querySelectorAll('[id^="cat-btn-"]').forEach(btn => {
    const esteActivo = btn.id === 'cat-btn-'+cat.replace(/\s/g,'_');
    btn.style.background = esteActivo ? 'var(--azul)' : 'white';
    btn.style.color = esteActivo ? 'white' : 'var(--texto-sub)';
    btn.style.boxShadow = esteActivo ? '0 4px 12px rgba(37,99,235,0.3)' : 'none';
    btn.style.borderColor = esteActivo ? 'transparent' : 'var(--gris-borde)';
  });
  const tbody = document.getElementById('tienda-tbody');
  if (tbody) tbody.innerHTML = renderFilasTienda(prods, cat);
}

function filtrarTiendaBuscar() {
  const q = (document.getElementById('tienda-buscar')?.value||'').toLowerCase();
  document.querySelectorAll('.tienda-fila').forEach(tr => {
    tr.style.display = !q || tr.dataset.buscar.includes(q) ? '' : 'none';
  });
}

async function abrirFormProducto(prodId = null) {
  let p = { nombre:'', categoria:'', precio_venta:'', costo_compra:'', stock_actual:0, stock_minimo:0 };
  if (prodId) {
    const { data } = await db.from('productos').select('*').eq('id', prodId).single();
    if (data) p = data;
  }
  const html = `
    <form id="form-prod">
      <div style="${ST.grupo}"><label style="${ST.label}">Nombre *</label><input style="${ST.input}" id="p-nombre" value="${escapeHtml(p.nombre)}" required></div>
      <div style="${ST.grupo}"><label style="${ST.label}">Categoría</label><input style="${ST.input}" id="p-cat" value="${escapeHtml(p.categoria||'')}" placeholder="Bebidas, snacks…"></div>
      <div style="${ST.fila}">
        <div style="${ST.grupo}"><label style="${ST.label}">Precio venta *</label><input style="${ST.input}" id="p-precio" type="number" step="0.01" value="${p.precio_venta}" required></div>
        <div style="${ST.grupo}"><label style="${ST.label}">Costo compra</label><input style="${ST.input}" id="p-costo" type="number" step="0.01" value="${p.costo_compra}"></div>
      </div>
      <div style="${ST.fila}">
        <div style="${ST.grupo}"><label style="${ST.label}">Stock ${prodId?'(usar reposición para sumar)':'inicial'}</label><input style="${ST.input}" id="p-stock" type="number" value="${p.stock_actual}" ${prodId?'disabled':''}></div>
        <div style="${ST.grupo}"><label style="${ST.label}">Stock mínimo (alerta)</label><input style="${ST.input}" id="p-min" type="number" value="${p.stock_minimo}"></div>
      </div>
      <button type="submit" style="${ST.btnPri}">${prodId?'Guardar cambios':'Crear producto'}</button>
    </form>
  `;
  abrirModal(prodId?'Editar producto':'Nuevo producto', html);

  $('#form-prod').addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      hotel_id: SESSION.hotel.id,
      nombre: $('#p-nombre').value.trim(),
      categoria: $('#p-cat').value.trim() || 'general',
      precio_venta: parseFloat($('#p-precio').value)||0,
      costo_compra: parseFloat($('#p-costo').value)||0,
      stock_minimo: parseInt($('#p-min').value)||0,
    };
    try {
      if (prodId) {
        await db.from('productos').update(payload).eq('id', prodId);
      } else {
        payload.stock_actual = parseInt($('#p-stock').value)||0;
        await db.from('productos').insert(payload);
      }
      cerrarModal();
      toast(prodId?'Producto actualizado':'Producto creado', '', 'ok');
      moduloTiendita();
    } catch (err) { toast('Error', err.message, 'error'); }
  });
}

async function abrirReposicion() {
  const prods = window._productosCache || [];
  if (!prods.length) { toast('Sin productos', 'Crea productos primero', 'warn'); return; }
  const html = `
    <form id="form-repo">
      <div style="${ST.grupo}">
        <label style="${ST.label}">Producto *</label>
        <select style="${ST.input}" id="repo-prod">
          ${prods.map(p => `<option value="${p.id}" data-costo="${p.costo_compra}" data-precio="${p.precio_venta}">${escapeHtml(p.nombre)} (stock: ${p.stock_actual})</option>`).join('')}
        </select>
      </div>
      <div style="${ST.fila}">
        <div style="${ST.grupo}"><label style="${ST.label}">Cantidad a ingresar *</label><input style="${ST.input}" id="repo-cant" type="number" min="1" required></div>
        <div style="${ST.grupo}"><label style="${ST.label}">Costo compra unit.</label><input style="${ST.input}" id="repo-costo" type="number" step="0.01"></div>
      </div>
      <div style="${ST.grupo}"><label style="${ST.label}">Nuevo precio venta (opcional)</label><input style="${ST.input}" id="repo-precio" type="number" step="0.01"></div>
      <button type="submit" style="${ST.btnPri}">Registrar reposición</button>
    </form>
  `;
  abrirModal('Reposición de mercadería', html);

  const setDefaults = () => {
    const opt = $('#repo-prod').selectedOptions[0];
    $('#repo-costo').value = opt.dataset.costo;
    $('#repo-precio').placeholder = 'Actual: '+opt.dataset.precio;
  };
  $('#repo-prod').addEventListener('change', setDefaults); setDefaults();

  $('#form-repo').addEventListener('submit', async e => {
    e.preventDefault();
    const prodId = $('#repo-prod').value;
    const cant = parseInt($('#repo-cant').value);
    const costo = parseFloat($('#repo-costo').value)||null;
    const nuevoPrecio = parseFloat($('#repo-precio').value)||null;
    if (isNaN(cant) || cant<1) { toast('Cantidad inválida', '', 'warn'); return; }
    try {
      // Registrar entrada (el trigger suma stock automáticamente)
      await db.from('movimientos_inventario').insert({
        hotel_id: SESSION.hotel.id, producto_id: prodId, tipo:'entrada',
        cantidad: cant, costo_unitario: costo, motivo:'Reposición de mercadería',
        turno_caja_id: SESSION.turnoActivo?.id, usuario_id: SESSION.user.id,
      });
      // Actualizar costo/precio si cambió
      const upd = {};
      if (costo != null) upd.costo_compra = costo;
      if (nuevoPrecio != null) upd.precio_venta = nuevoPrecio;
      if (Object.keys(upd).length) await db.from('productos').update(upd).eq('id', prodId);

      cerrarModal();
      toast('Reposición registrada', `+${cant} unidades`, 'ok');
      moduloTiendita();
    } catch (err) { toast('Error', err.message, 'error'); }
  });
}

async function abrirVentaRapida() {
  if (!SESSION.turnoActivo) { toast('Abre tu turno de caja', '', 'warn'); navegarA('caja'); return; }
  const prods = (window._productosCache || []).filter(p => p.stock_actual > 0);
  if (!prods.length) { toast('Sin stock', 'No hay productos disponibles', 'warn'); return; }

  const carrito = [];
  const html = `
    <div style="${ST.grupo}">
      <label style="${ST.label}">Agregar producto</label>
      <select style="${ST.input}" id="vr-prod">
        ${prods.map(p => `<option value="${p.id}" data-precio="${p.precio_venta}" data-nombre="${escapeHtml(p.nombre)}" data-stock="${p.stock_actual}">${escapeHtml(p.nombre)} — ${soles(p.precio_venta)}</option>`).join('')}
      </select>
      <button type="button" style="${ST.btnSec}; margin-top:0.5rem; width:100%;" id="vr-add">+ Agregar al carrito</button>
    </div>
    <div id="vr-carrito" style="margin:1rem 0; min-height:40px;"></div>
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; font-size:1.1rem;">
      <span style="font-weight:600;">Total</span>
      <strong id="vr-total" style="color:var(--azul);">S/ 0.00</strong>
    </div>
    <div style="${ST.grupo}">
      <label style="${ST.label}">Método de pago</label>
      <select style="${ST.input}" id="vr-metodo"><option value="efectivo">Efectivo</option><option value="yape">Yape</option><option value="plin">Plin</option><option value="transferencia">Transferencia</option></select>
    </div>
    <button style="${ST.btnPri}" id="vr-cobrar">Cobrar venta</button>
  `;
  abrirModal('Venta rápida al paso', html, { ancho: '480px' });

  const render = () => {
    const total = carrito.reduce((s,i)=>s+i.precio*i.cant,0);
    $('#vr-total').textContent = soles(total);
    $('#vr-carrito').innerHTML = carrito.length ? carrito.map((i,idx)=>`
      <div style="display:flex; justify-content:space-between; align-items:center; padding:0.4rem 0; border-bottom:1px solid var(--gris-borde); font-size:0.85rem;">
        <span>${i.cant}× ${escapeHtml(i.nombre)}</span>
        <span style="display:flex; gap:0.5rem; align-items:center;">
          <strong>${soles(i.precio*i.cant)}</strong>
          <button onclick="window._vrRemove(${idx})" style="background:none;border:none;color:var(--rojo);cursor:pointer;font-size:1rem;">×</button>
        </span>
      </div>`).join('') : '<div style="color:var(--texto-sub);font-size:0.83rem;text-align:center;padding:0.5rem;">Carrito vacío</div>';
  };
  window._vrRemove = (idx) => { carrito.splice(idx,1); render(); };

  $('#vr-add').addEventListener('click', () => {
    const opt = $('#vr-prod').selectedOptions[0];
    const id = opt.value;
    const exist = carrito.find(i=>i.id===id);
    if (exist) exist.cant++;
    else carrito.push({ id, nombre:opt.dataset.nombre, precio:parseFloat(opt.dataset.precio), cant:1 });
    render();
  });

  $('#vr-cobrar').addEventListener('click', async () => {
    if (!carrito.length) { toast('Carrito vacío', '', 'warn'); return; }
    const btn = $('#vr-cobrar'); btn.disabled = true; btn.textContent='Procesando…';
    try {
      const total = carrito.reduce((s,i)=>s+i.precio*i.cant,0);
      const metodo = $('#vr-metodo').value;
      // Crear venta
      const { data: venta } = await db.from('ventas_directas').insert({
        hotel_id: SESSION.hotel.id, turno_caja_id: SESSION.turnoActivo.id,
        total, metodo_pago: metodo, usuario_id: SESSION.user.id,
      }).select('id').single();
      // Items + descuento de stock
      for (const i of carrito) {
        await db.from('items_venta_directa').insert({
          hotel_id: SESSION.hotel.id, venta_id: venta.id, producto_id: i.id,
          descripcion: i.nombre, cantidad: i.cant, precio_unitario: i.precio,
        });
        await db.from('movimientos_inventario').insert({
          hotel_id: SESSION.hotel.id, producto_id: i.id, tipo:'salida',
          cantidad: i.cant, precio_venta: i.precio, motivo:'Venta rápida',
          referencia_id: venta.id, turno_caja_id: SESSION.turnoActivo.id, usuario_id: SESSION.user.id,
        });
      }
      // Ingreso a caja
      await db.from('movimientos_caja').insert({
        hotel_id: SESSION.hotel.id, turno_caja_id: SESSION.turnoActivo.id, tipo:'ingreso',
        concepto:`Venta rápida (${carrito.length} item)`, monto: total, metodo_pago: metodo,
        referencia_id: venta.id, referencia_tipo:'venta_directa', usuario_id: SESSION.user.id,
      });
      cerrarModal();
      toast('Venta cobrada', soles(total), 'ok');
      moduloTiendita();
    } catch (err) { toast('Error', err.message, 'error'); btn.disabled=false; btn.textContent='Cobrar venta'; }
  });
}


// ════════════════════════════════════════════════════════════
//  HOTEL › LIMPIEZA (rol limpieza)
// ════════════════════════════════════════════════════════════
async function moduloLimpieza() {
  skeleton();
  try {
    const habs = await getHabitaciones();
    contenido().innerHTML = `
      <div class="seccion-titulo">Estado de Habitaciones</div>
      <div class="seccion-sub">Marca las habitaciones limpias</div>
      <div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:0.85rem;">
        ${habs.map(h => {
          const c = COLORES_ESTADO[h.estado];
          const puedeMarcar = h.estado === 'limpieza';
          return `
            <div style="background:${c.bg}; border:2px solid ${c.borde}; border-radius:14px; padding:1rem;">
              <div style="font-size:1.35rem; font-weight:700;">${escapeHtml(h.numero)}</div>
              <div style="font-size:0.72rem; color:${c.texto}; font-weight:700; text-transform:uppercase; margin:0.25rem 0 0.5rem;">${c.label}</div>
              ${puedeMarcar ? `<button style="${ST.btnOk}; width:100%; padding:0.4rem;" onclick="setEstadoHab('${h.id}','libre')">✓ Limpia</button>` : ''}
            </div>`;
        }).join('')}
      </div>
    `;
  } catch (err) {
    contenido().innerHTML = errorBox('No se pudo cargar', err.message);
  }
}


// ════════════════════════════════════════════════════════════
//  HOTEL › CONFIG HABITACIONES (admin: tipos + habitaciones)
// ════════════════════════════════════════════════════════════
async function moduloHabitacionConfig() {
  skeleton();
  try {
    const { data: tipos } = await db.from('tipos_habitacion')
      .select('*').eq('hotel_id', SESSION.hotel.id).eq('activo', true).order('nombre');
    const { data: habs } = await db.from('habitaciones')
      .select(`*, tipos_habitacion(nombre)`).eq('hotel_id', SESSION.hotel.id).order('numero');

    window._tiposCache = tipos || [];

    const ESTADO_CFG = {
      libre:         { dot:'#16A34A', bg:'#F0FDF4', label:'Libre' },
      ocupada:       { dot:'#DC2626', bg:'#FEF2F2', label:'Ocupada' },
      limpieza:      { dot:'#CA8A04', bg:'#FEFCE8', label:'Limpieza' },
      reservada:     { dot:'#2563EB', bg:'#EFF6FF', label:'Reservada' },
      mantenimiento: { dot:'#64748B', bg:'#F1F5F9', label:'Mantenim.' },
    };

    // Tipos únicos para el filtro de habitaciones
    const tiposUnicos = [...new Set((habs||[]).map(h => h.tipos_habitacion?.nombre).filter(Boolean))];

    contenido().innerHTML = `
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;margin-bottom:0.5rem;">
        <div style="display:flex;align-items:center;gap:1rem;">
          <div style="width:52px;height:52px;border-radius:14px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:26px;height:26px;"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>
          </div>
          <div>
            <h1 style="font-size:1.5rem;font-weight:700;color:var(--texto);margin:0;">Configuración de Habitaciones</h1>
            <p style="font-size:0.83rem;color:var(--texto-sub);margin:0.2rem 0 0;">Crea tus tipos con tarifas y luego gestiona tus habitaciones</p>
          </div>
        </div>
        <!-- Breadcrumb -->
        <div style="font-size:0.8rem;color:var(--texto-sub);display:flex;align-items:center;gap:0.4rem;">
          <span>Habitaciones</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px;"><polyline points="9 18 15 12 9 6"/></svg>
          <span style="color:var(--texto);font-weight:600;">Configuración</span>
        </div>
      </div>

      <!-- ── TIPOS DE HABITACIÓN ── -->
      <div style="background:white;border:1px solid var(--gris-borde);border-radius:14px;overflow:hidden;margin-bottom:1.25rem;">
        <!-- Header sección tipos -->
        <div style="padding:1.1rem 1.35rem;border-bottom:1px solid var(--gris-borde);display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:0.75rem;">
            <div style="width:36px;height:36px;border-radius:10px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;">
              <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" style="width:18px;height:18px;"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>
            </div>
            <div>
              <div style="font-weight:700;font-size:1rem;">Tipos de habitación</div>
              <div style="font-size:0.75rem;color:var(--texto-sub);">Define las categorías, capacidades y tarifas de tu hotel</div>
            </div>
          </div>
          <button onclick="abrirFormTipo()" style="width:auto;padding:0.55rem 1.1rem;background:linear-gradient(135deg,var(--azul),#2563EB);color:white;border:none;border-radius:10px;font-size:0.83rem;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(37,99,235,0.3);display:flex;align-items:center;gap:0.4rem;">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" style="width:15px;height:15px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo tipo
          </button>
        </div>
        <!-- Tabla tipos -->
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:0.85rem;min-width:580px;">
            <thead>
              <tr style="border-bottom:1px solid var(--gris-borde);text-align:left;">
                <th style="${thCss()};width:50px;">#</th>
                <th style="${thCss()}">TIPO</th>
                <th style="${thCss()}">CAPACIDAD</th>
                <th style="${thCss()}">TARIFA NOCHE</th>
                <th style="${thCss()}">TARIFA HORAS</th>
                <th style="${thCss()}">ESTADO</th>
                <th style="${thCss()};text-align:right;">ACCIÓN</th>
              </tr>
            </thead>
            <tbody>
              ${(tipos||[]).length === 0
                ? `<tr><td colspan="7" style="padding:2.5rem;text-align:center;color:var(--texto-sub);">Crea tu primer tipo de habitación.</td></tr>`
                : tipos.map((t,i) => `
                  <tr style="border-bottom:1px solid var(--gris-borde);">
                    <td style="${tdCss()};color:var(--texto-sub);">${i+1}</td>
                    <td style="${tdCss()};font-weight:700;">${escapeHtml(t.nombre)}</td>
                    <td style="${tdCss()};color:var(--texto-sub);">${t.capacidad_max} persona${t.capacidad_max!==1?'s':''}</td>
                    <td style="${tdCss()};font-weight:600;">${soles(t.tarifa_noche)}</td>
                    <td style="${tdCss()};color:var(--texto-sub);">${soles(t.tarifa_horas)} / ${t.horas_bloque}h</td>
                    <td style="${tdCss()}">
                      <span style="display:inline-flex;align-items:center;gap:0.35rem;font-size:0.75rem;font-weight:700;color:#16A34A;background:#F0FDF4;padding:0.22rem 0.75rem;border-radius:999px;">
                        <span style="width:6px;height:6px;border-radius:50%;background:#16A34A;"></span>Activo
                      </span>
                    </td>
                    <td style="${tdCss()};text-align:right;">
                      <div style="display:flex;align-items:center;gap:0.35rem;justify-content:flex-end;">
                        <button title="Editar" onclick="abrirFormTipo('${t.id}')" style="width:32px;height:32px;border:1px solid var(--gris-borde);border-radius:8px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--azul);" onmouseover="this.style.background='#EFF6FF'" onmouseout="this.style.background='white'">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button title="Eliminar" onclick="eliminarTipo('${t.id}')" style="width:32px;height:32px;border:1px solid #FECACA;border-radius:8px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--rojo);" onmouseover="this.style.background='#FEF2F2'" onmouseout="this.style.background='white'">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── HABITACIONES ── -->
      <div style="background:white;border:1px solid var(--gris-borde);border-radius:14px;overflow:hidden;">
        <!-- Header sección habitaciones -->
        <div style="padding:1.1rem 1.35rem;border-bottom:1px solid var(--gris-borde);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.75rem;">
          <div style="display:flex;align-items:center;gap:0.75rem;">
            <div style="width:36px;height:36px;border-radius:10px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;">
              <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" style="width:18px;height:18px;"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>
            </div>
            <div>
              <div style="font-weight:700;font-size:1rem;">Habitaciones</div>
              <div style="font-size:0.75rem;color:var(--texto-sub);">Administra tus habitaciones y su estado en tiempo real</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
            <!-- Buscador -->
            <div style="display:flex;align-items:center;gap:0.5rem;background:var(--gris-bg);border:1px solid var(--gris-borde);border-radius:9px;padding:0.45rem 0.8rem;">
              <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" id="hab-buscar" placeholder="Buscar habitación…" oninput="filtrarHabsConfig()" style="border:none;background:none;outline:none;font-size:0.8rem;width:130px;font-family:inherit;color:var(--texto);">
            </div>
            <!-- Filtro tipo -->
            <div style="display:flex;align-items:center;gap:0.4rem;background:var(--gris-bg);border:1px solid var(--gris-borde);border-radius:9px;padding:0.45rem 0.8rem;font-size:0.8rem;color:var(--texto-sub);cursor:pointer;">
              Todos los tipos
              <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:12px;height:12px;"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            <!-- Filtro estado -->
            <div style="display:flex;align-items:center;gap:0.4rem;background:var(--gris-bg);border:1px solid var(--gris-borde);border-radius:9px;padding:0.45rem 0.8rem;font-size:0.8rem;color:var(--texto-sub);cursor:pointer;">
              Todos los estados
              <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:12px;height:12px;"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            <!-- Botón nueva habitación -->
            <button onclick="abrirFormHabitacion()" ${(tipos||[]).length===0?'disabled title="Crea un tipo primero"':''} style="width:auto;padding:0.5rem 1rem;background:linear-gradient(135deg,var(--azul),#2563EB);color:white;border:none;border-radius:9px;font-size:0.82rem;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(37,99,235,0.3);display:flex;align-items:center;gap:0.4rem;${(tipos||[]).length===0?'opacity:0.5;cursor:not-allowed;':''}">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" style="width:14px;height:14px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Nueva habitación
            </button>
          </div>
        </div>
        <!-- Tabla habitaciones -->
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:0.85rem;min-width:540px;">
            <thead>
              <tr style="border-bottom:1px solid var(--gris-borde);text-align:left;">
                <th style="${thCss()};width:50px;">#</th>
                <th style="${thCss()}">NÚMERO</th>
                <th style="${thCss()}">TIPO</th>
                <th style="${thCss()}">PISO</th>
                <th style="${thCss()}">ESTADO</th>
                <th style="${thCss()};text-align:right;">ACCIÓN</th>
              </tr>
            </thead>
            <tbody id="habs-config-tbody">
              ${(habs||[]).length === 0
                ? `<tr><td colspan="6" style="padding:2.5rem;text-align:center;color:var(--texto-sub);">Sin habitaciones aún.</td></tr>`
                : habs.map((h,i) => {
                    const ec = ESTADO_CFG[h.estado] || { dot:'#64748B', bg:'#F1F5F9', label: h.estado };
                    const tipoNombre = escapeHtml(h.tipos_habitacion?.nombre||'—');
                    return `
                    <tr class="hab-cfg-fila" data-buscar="${(h.numero+' '+(h.tipos_habitacion?.nombre||'')+' '+(h.piso||'')).toLowerCase()}" style="border-bottom:1px solid var(--gris-borde);">
                      <td style="${tdCss()};color:var(--texto-sub);">${i+1}</td>
                      <td style="${tdCss()};font-weight:700;font-size:1rem;">${escapeHtml(h.numero)}</td>
                      <td style="${tdCss()}">
                        <span style="font-size:0.75rem;font-weight:600;color:#2563EB;background:#EFF6FF;padding:0.22rem 0.75rem;border-radius:999px;">${tipoNombre}</span>
                      </td>
                      <td style="${tdCss()};color:var(--texto-sub);">${escapeHtml(h.piso||'—')}</td>
                      <td style="${tdCss()}">
                        <span style="display:inline-flex;align-items:center;gap:0.35rem;font-size:0.75rem;font-weight:700;color:${ec.dot};background:${ec.bg};padding:0.22rem 0.75rem;border-radius:999px;">
                          <span style="width:6px;height:6px;border-radius:50%;background:${ec.dot};"></span>
                          ${ec.label}
                        </span>
                      </td>
                      <td style="${tdCss()};text-align:right;">
                        <button title="Editar" onclick="abrirFormHabitacion('${h.id}')" style="width:32px;height:32px;border:1px solid var(--gris-borde);border-radius:8px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--azul);margin-left:auto;" onmouseover="this.style.background='#EFF6FF'" onmouseout="this.style.background='white'">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                      </td>
                    </tr>`;
                  }).join('')}
            </tbody>
          </table>
        </div>
        <!-- Paginación -->
        <div style="padding:0.85rem 1.25rem;display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--gris-borde);flex-wrap:wrap;gap:0.75rem;">
          <span style="font-size:0.82rem;color:var(--texto-sub);">Mostrando 1 a ${(habs||[]).length} de ${(habs||[]).length} habitaciones</span>
          <div style="display:flex;align-items:center;gap:0.5rem;">
            <button style="width:32px;height:32px;border:1px solid var(--gris-borde);border-radius:8px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--texto-sub);">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button style="width:32px;height:32px;border:none;border-radius:8px;background:var(--azul);color:white;font-weight:700;font-size:0.85rem;cursor:pointer;">1</button>
            <button style="width:32px;height:32px;border:1px solid var(--gris-borde);border-radius:8px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--texto-sub);">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <select style="border:1px solid var(--gris-borde);border-radius:8px;padding:0.3rem 0.6rem;font-size:0.82rem;color:var(--texto-sub);background:white;cursor:pointer;">
              <option>10 por página</option><option>25 por página</option>
            </select>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    contenido().innerHTML = errorBox('No se pudo cargar la configuración', err.message);
  }
}

function filtrarHabsConfig() {
  const q = (document.getElementById('hab-buscar')?.value||'').toLowerCase();
  document.querySelectorAll('.hab-cfg-fila').forEach(tr => {
    tr.style.display = !q || tr.dataset.buscar.includes(q) ? '' : 'none';
  });
}

async function eliminarTipo(tipoId) {
  if (!confirm('¿Eliminar este tipo? Las habitaciones de este tipo perderán su referencia.')) return;
  try {
    await db.from('tipos_habitacion').update({ activo: false }).eq('id', tipoId);
    toast('Tipo eliminado','','ok');
    moduloHabitacionConfig();
  } catch(err) { toast('Error', err.message, 'error'); }
}

async function abrirFormTipo(tipoId=null) {
  let t = { nombre:'', capacidad_max:2, tarifa_noche:'', tarifa_horas:'', horas_bloque:3, descripcion:'' };
  if (tipoId) { const {data}=await db.from('tipos_habitacion').select('*').eq('id',tipoId).single(); if(data)t=data; }
  const html = `
    <form id="form-tipo">
      <div style="${ST.grupo}"><label style="${ST.label}">Nombre del tipo *</label><input style="${ST.input}" id="t-nombre" value="${escapeHtml(t.nombre)}" required placeholder="Simple, Matrimonial, Suite…"></div>
      <div style="${ST.fila}">
        <div style="${ST.grupo}"><label style="${ST.label}">Capacidad máx.</label><input style="${ST.input}" id="t-cap" type="number" min="1" value="${t.capacidad_max}"></div>
        <div style="${ST.grupo}"><label style="${ST.label}">Horas por bloque</label><input style="${ST.input}" id="t-horas" type="number" min="1" value="${t.horas_bloque}"></div>
      </div>
      <div style="${ST.fila}">
        <div style="${ST.grupo}"><label style="${ST.label}">Tarifa por noche *</label><input style="${ST.input}" id="t-tnoche" type="number" step="0.01" value="${t.tarifa_noche}" required></div>
        <div style="${ST.grupo}"><label style="${ST.label}">Tarifa por bloque de horas</label><input style="${ST.input}" id="t-thoras" type="number" step="0.01" value="${t.tarifa_horas}"></div>
      </div>
      <button type="submit" style="${ST.btnPri}">${tipoId?'Guardar':'Crear tipo'}</button>
    </form>
  `;
  abrirModal(tipoId?'Editar tipo':'Nuevo tipo de habitación', html);

  $('#form-tipo').addEventListener('submit', async e=>{
    e.preventDefault();
    const payload = {
      hotel_id: SESSION.hotel.id, nombre:$('#t-nombre').value.trim(),
      capacidad_max: parseInt($('#t-cap').value)||2,
      horas_bloque: parseInt($('#t-horas').value)||3,
      tarifa_noche: parseFloat($('#t-tnoche').value)||0,
      tarifa_horas: parseFloat($('#t-thoras').value)||0,
    };
    try {
      if (tipoId) await db.from('tipos_habitacion').update(payload).eq('id',tipoId);
      else await db.from('tipos_habitacion').insert(payload);
      cerrarModal(); toast(tipoId?'Tipo actualizado':'Tipo creado','','ok'); moduloHabitacionConfig();
    } catch(err){ toast('Error',err.message,'error'); }
  });
}

async function abrirFormHabitacion(habId=null) {
  const tipos = window._tiposCache || [];
  if (!tipos.length) { toast('Crea un tipo primero','','warn'); return; }
  let h = { numero:'', piso:'', tipo_habitacion_id: tipos[0].id };
  if (habId){ const {data}=await db.from('habitaciones').select('*').eq('id',habId).single(); if(data)h=data; }
  const html = `
    <form id="form-hab">
      <div style="${ST.fila}">
        <div style="${ST.grupo}"><label style="${ST.label}">Número *</label><input style="${ST.input}" id="h-num" value="${escapeHtml(h.numero)}" required placeholder="101"></div>
        <div style="${ST.grupo}"><label style="${ST.label}">Piso</label><input style="${ST.input}" id="h-piso" value="${escapeHtml(h.piso||'')}" placeholder="1"></div>
      </div>
      <div style="${ST.grupo}">
        <label style="${ST.label}">Tipo *</label>
        <select style="${ST.input}" id="h-tipo">
          ${tipos.map(t=>`<option value="${t.id}" ${t.id===h.tipo_habitacion_id?'selected':''}>${escapeHtml(t.nombre)} — ${soles(t.tarifa_noche)}/noche</option>`).join('')}
        </select>
      </div>
      <button type="submit" style="${ST.btnPri}">${habId?'Guardar':'Crear habitación'}</button>
    </form>
  `;
  abrirModal(habId?'Editar habitación':'Nueva habitación', html);

  $('#form-hab').addEventListener('submit', async e=>{
    e.preventDefault();
    const payload = {
      hotel_id: SESSION.hotel.id, numero:$('#h-num').value.trim(),
      piso:$('#h-piso').value.trim()||null, tipo_habitacion_id:$('#h-tipo').value,
    };
    try {
      if (habId) await db.from('habitaciones').update(payload).eq('id',habId);
      else await db.from('habitaciones').insert(payload);
      cerrarModal(); toast(habId?'Habitación actualizada':'Habitación creada','','ok'); moduloHabitacionConfig();
    } catch(err){
      toast('Error', err.message.includes('duplicate')?'Ya existe una habitación con ese número':err.message,'error');
    }
  });
}


// ════════════════════════════════════════════════════════════
//  HOTEL › PERSONAL (admin gestiona empleados)
// ════════════════════════════════════════════════════════════
async function moduloPersonal() {
  skeleton();
  try {
    const { data: personal } = await db.from('perfiles_usuarios')
      .select('*')
      .eq('hotel_id', SESSION.hotel.id)
      .order('created_at');

    const lista = personal || [];
    const totalUsuarios = lista.length;
    const activos   = lista.filter(p => p.activo !== false).length;
    const inactivos = lista.filter(p => p.activo === false).length;
    const roles     = new Set(lista.map(p => p.rol)).size;

    const ROL_COLOR = {
      admin:       { bg:'#EFF6FF', color:'#2563EB' },
      recepcion:   { bg:'#FFF7ED', color:'#EA580C' },
      limpieza:    { bg:'#F5F3FF', color:'#7C3AED' },
      restaurante: { bg:'#F0FDF4', color:'#16A34A' },
      cocina:      { bg:'#FEFCE8', color:'#CA8A04' },
    };

    contenido().innerHTML = `
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;margin-bottom:1.5rem;">
        <div style="display:flex;align-items:center;gap:1rem;">
          <div style="width:52px;height:52px;border-radius:14px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:26px;height:26px;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div>
            <h1 style="font-size:1.5rem;font-weight:700;color:var(--texto);margin:0;">Personal</h1>
            <p style="font-size:0.83rem;color:var(--texto-sub);margin:0.2rem 0 0;">Gestiona los usuarios del sistema y sus permisos</p>
          </div>
        </div>
        <button onclick="abrirCrearEmpleado()" style="width:auto;padding:0.65rem 1.25rem;background:linear-gradient(135deg,var(--azul),#2563EB);color:white;border:none;border-radius:10px;font-size:0.88rem;font-weight:600;cursor:pointer;box-shadow:0 4px 14px rgba(26,63,166,0.3);display:flex;align-items:center;gap:0.5rem;">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" style="width:16px;height:16px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Crear empleado
        </button>
      </div>

      <!-- 4 tarjetas métricas -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-bottom:1.5rem;">
        ${persMetrica('Total de usuarios', totalUsuarios, '#2563EB', '#EFF6FF', '0%',
          '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>')}
        ${persMetrica('Usuarios activos', activos, '#16A34A', '#F0FDF4', '100%',
          '<circle cx="12" cy="12" r="10"/><polyline points="20 6 9 17 4 12"/>',true)}
        ${persMetrica('Usuarios inactivos', inactivos, '#DC2626', '#FEF2F2', '0%',
          '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',false,true)}
        ${persMetrica('Roles asignados', roles, '#7C3AED', '#F5F3FF', '',
          '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',false,false,true)}
      </div>

      <!-- Buscador + filtros + exportar -->
      <div style="display:flex;align-items:center;gap:0.65rem;flex-wrap:wrap;margin-bottom:1rem;">
        <div style="flex:1;min-width:220px;display:flex;align-items:center;gap:0.6rem;background:white;border:1px solid var(--gris-borde);border-radius:10px;padding:0.6rem 1rem;">
          <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:15px;height:15px;flex-shrink:0;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="pers-buscar" placeholder="Buscar por nombre, rol o email…" oninput="filtrarPersonal()" style="border:none;background:none;outline:none;font-size:0.83rem;width:100%;font-family:inherit;color:var(--texto);">
        </div>
        <div style="display:flex;align-items:center;gap:0.4rem;background:white;border:1px solid var(--gris-borde);border-radius:10px;padding:0.55rem 0.85rem;font-size:0.8rem;color:var(--texto-sub);cursor:pointer;">
          <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Todos los roles
          <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:12px;height:12px;"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div style="display:flex;align-items:center;gap:0.4rem;background:white;border:1px solid var(--gris-borde);border-radius:10px;padding:0.55rem 0.85rem;font-size:0.8rem;color:var(--texto-sub);cursor:pointer;">
          <span style="width:8px;height:8px;border-radius:50%;background:#16A34A;flex-shrink:0;"></span>
          Todos los estados
          <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:12px;height:12px;"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <button style="display:flex;align-items:center;gap:0.4rem;background:white;border:1px solid var(--gris-borde);border-radius:10px;padding:0.55rem 0.85rem;font-size:0.8rem;color:var(--texto-sub);cursor:pointer;" onclick="toast('Próximamente','','info')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Exportar
        </button>
      </div>

      <!-- Tabla -->
      <div style="background:white;border:1px solid var(--gris-borde);border-radius:12px;overflow:hidden;margin-bottom:1rem;">
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:0.85rem;min-width:600px;">
            <thead>
              <tr style="border-bottom:1px solid var(--gris-borde);text-align:left;">
                <th style="${thCss()};width:50px;">#</th>
                <th style="${thCss()}">NOMBRE</th>
                <th style="${thCss()}">ROL</th>
                <th style="${thCss()}">ESTADO</th>
                <th style="${thCss()}">ÚLTIMO ACCESO</th>
                <th style="${thCss()};text-align:right;">ACCIÓN</th>
              </tr>
            </thead>
            <tbody id="pers-tbody">
              ${lista.length === 0
                ? `<tr><td colspan="6" style="padding:3rem;text-align:center;color:var(--texto-sub);"><div style="font-size:2rem;margin-bottom:0.5rem;">👤</div>Sin empleados aún.</td></tr>`
                : lista.map((p,i) => {
                    const rc = ROL_COLOR[p.rol] || { bg:'#F1F5F9', color:'#64748B' };
                    const activo = p.activo !== false;
                    const nombre = p.nombre_completo || '—';
                    const email  = p.rol + "@hotel.com";
                    const ultimoAcceso = p.created_at || null;
                    const iniciales = nombre.split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'?';
                    return `
                      <tr class="pers-fila" data-buscar="${(nombre+' '+p.rol+' '+email).toLowerCase()}" style="border-bottom:1px solid var(--gris-borde);">
                        <td style="${tdCss()};color:var(--texto-sub);">${i+1}</td>
                        <td style="${tdCss()}">
                          <div style="display:flex;align-items:center;gap:0.75rem;">
                            <div style="width:38px;height:38px;border-radius:10px;background:rgba(37,99,235,0.1);color:var(--azul);font-weight:700;font-size:0.82rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${iniciales}</div>
                            <div>
                              <div style="font-weight:700;font-size:0.88rem;">${escapeHtml(nombre)}</div>
                              <div style="font-size:0.72rem;color:var(--texto-sub);">${escapeHtml(email)}</div>
                            </div>
                          </div>
                        </td>
                        <td style="${tdCss()}">
                          <span style="font-size:0.75rem;font-weight:600;color:${rc.color};background:${rc.bg};padding:0.22rem 0.75rem;border-radius:999px;text-transform:capitalize;">${escapeHtml(p.rol)}</span>
                        </td>
                        <td style="${tdCss()}">
                          <span style="display:inline-flex;align-items:center;gap:0.4rem;font-size:0.75rem;font-weight:700;color:${activo?'#16A34A':'#DC2626'};background:${activo?'#F0FDF4':'#FEF2F2'};padding:0.22rem 0.75rem;border-radius:999px;">
                            <span style="width:7px;height:7px;border-radius:50%;background:${activo?'#16A34A':'#DC2626'};"></span>
                            ${activo?'Activo':'Inactivo'}
                          </span>
                        </td>
                        <td style="${tdCss()}">
                          ${ultimoAcceso
                            ? `<div style="font-weight:600;font-size:0.83rem;">${new Date(ultimoAcceso).toLocaleDateString('es-PE',{day:'numeric',month:'short',year:'numeric'})}</div>
                               <div style="font-size:0.72rem;color:var(--texto-sub);">${new Date(ultimoAcceso).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'})}</div>`
                            : '<span style="color:var(--texto-sub);font-size:0.8rem;">Sin accesos</span>'}
                        </td>
                        <td style="${tdCss()};text-align:right;">
                          <div style="display:flex;align-items:center;gap:0.35rem;justify-content:flex-end;">
                            ${p.rol!=='admin'?`
                              <button title="Resetear contraseña" onclick="abrirResetPass('${p.user_id}','${escapeHtml(nombre)}')" style="width:32px;height:32px;border:1px solid var(--gris-borde);border-radius:8px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--texto-sub);" onmouseover="this.style.background='var(--gris-bg)'" onmouseout="this.style.background='white'">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              </button>`:''
                            }
                            <button title="Más opciones" style="width:32px;height:32px;border:1px solid var(--gris-borde);border-radius:8px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--texto-sub);" onmouseover="this.style.background='var(--gris-bg)'" onmouseout="this.style.background='white'">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                            </button>
                          </div>
                        </td>
                      </tr>`;
                  }).join('')}
            </tbody>
          </table>
        </div>
        <!-- Paginación -->
        <div style="padding:0.85rem 1.25rem;display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--gris-borde);flex-wrap:wrap;gap:0.75rem;">
          <span style="font-size:0.82rem;color:var(--texto-sub);">Mostrando 1 a ${totalUsuarios} de ${totalUsuarios} usuarios</span>
          <div style="display:flex;align-items:center;gap:0.5rem;">
            <button style="width:32px;height:32px;border:1px solid var(--gris-borde);border-radius:8px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--texto-sub);">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button style="width:32px;height:32px;border:none;border-radius:8px;background:var(--azul);color:white;font-weight:700;font-size:0.85rem;cursor:pointer;">1</button>
            <button style="width:32px;height:32px;border:1px solid var(--gris-borde);border-radius:8px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--texto-sub);">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <select style="border:1px solid var(--gris-borde);border-radius:8px;padding:0.3rem 0.6rem;font-size:0.82rem;color:var(--texto-sub);background:white;cursor:pointer;">
              <option>10 por página</option><option>25 por página</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Banner inferior -->
      <div style="background:white;border:1px solid var(--gris-borde);border-radius:12px;padding:1.25rem 1.5rem;display:flex;align-items:center;gap:1.25rem;flex-wrap:wrap;position:relative;overflow:hidden;">
        <svg style="position:absolute;bottom:0;right:80px;opacity:0.09;" viewBox="0 0 300 80" width="300" height="80" preserveAspectRatio="none">
          <path d="M0 60 Q75 20 150 50 Q225 80 300 40 L300 80 L0 80 Z" fill="#2563EB"/>
        </svg>
        <div style="width:44px;height:44px;border-radius:13px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative;">
          <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" style="width:22px;height:22px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <div style="flex:1;position:relative;">
          <div style="font-weight:700;color:var(--texto);">Gestiona los accesos de tu equipo de forma segura</div>
          <div style="font-size:0.82rem;color:var(--texto-sub);">Asigna roles, controla permisos y mantén un registro de la actividad de cada usuario en el sistema.</div>
        </div>
        <button onclick="toast('Próximamente','','info')" style="display:flex;align-items:center;gap:0.5rem;background:white;border:1.5px solid var(--azul);border-radius:10px;padding:0.6rem 1.1rem;font-size:0.83rem;font-weight:600;color:var(--azul);cursor:pointer;position:relative;white-space:nowrap;">
          Ver guía de permisos
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:13px;height:13px;"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
      </div>
    `;
  } catch (err) {
    contenido().innerHTML = errorBox('No se pudo cargar el personal', err.message);
  }
}

function persMetrica(label, valor, color, bg, pct, icono, esActivo=false, esInactivo=false, esEscudo=false) {
  const iconDot = esActivo
    ? `<div style="width:40px;height:40px;border-radius:50%;background:#F0FDF4;display:flex;align-items:center;justify-content:center;"><span style="width:16px;height:16px;border-radius:50%;background:#16A34A;display:block;"></span></div>`
    : esInactivo
    ? `<div style="width:40px;height:40px;border-radius:50%;background:#FEF2F2;display:flex;align-items:center;justify-content:center;"><span style="width:16px;height:16px;border-radius:50%;background:#DC2626;display:block;"></span></div>`
    : `<div style="width:40px;height:40px;border-radius:12px;background:${bg};display:flex;align-items:center;justify-content:center;"><svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;">${icono}</svg></div>`;

  return `
    <div class="card" style="padding:1.1rem;position:relative;overflow:hidden;">
      <div style="display:flex;align-items:center;gap:0.85rem;">
        ${iconDot}
        <div style="flex:1;">
          <div style="display:flex;align-items:center;gap:0.5rem;">
            <span style="font-size:1.75rem;font-weight:700;color:var(--texto);line-height:1;">${valor}</span>
            ${pct?`<span style="font-size:0.7rem;font-weight:700;color:${esInactivo?'#DC2626':color};background:${bg};padding:0.15rem 0.45rem;border-radius:999px;">${esInactivo?'↓':'↑'} ${pct}</span>`:''}
          </div>
          <div style="font-size:0.77rem;color:var(--texto-sub);margin-top:0.15rem;">${label}</div>
        </div>
      </div>
      <svg style="position:absolute;bottom:-8px;right:-8px;opacity:0.07;" viewBox="0 0 100 50" width="100" height="50">
        <path d="M0 35 Q25 10 50 30 Q75 50 100 25 L100 50 L0 50 Z" fill="${color}"/>
      </svg>
    </div>`;
}

function filtrarPersonal() {
  const q = (document.getElementById('pers-buscar')?.value||'').toLowerCase();
  document.querySelectorAll('.pers-fila').forEach(tr => {
    tr.style.display = !q || tr.dataset.buscar.includes(q) ? '' : 'none';
  });
}

// ── Crear empleado con login propio ─────────────────────────
function abrirCrearEmpleado() {
  const html = `
    <form id="form-empleado">
      <div style="${ST.grupo}">
        <label style="${ST.label}">Nombre completo *</label>
        <input style="${ST.input}" id="emp-nombre" required placeholder="María Torres">
      </div>
      <div style="${ST.grupo}">
        <label style="${ST.label}">Rol *</label>
        <select style="${ST.input}" id="emp-rol">
          <option value="recepcion">Recepción</option>
          <option value="limpieza">Limpieza</option>
          <option value="restaurante">Restaurante</option>
          <option value="cocina">Cocina</option>
        </select>
      </div>
      <div style="${ST.fila}">
        <div style="${ST.grupo}">
          <label style="${ST.label}">Email (login) *</label>
          <input style="${ST.input}" id="emp-email" type="email" required placeholder="empleado@hotel.com">
        </div>
        <div style="${ST.grupo}">
          <label style="${ST.label}">Contraseña *</label>
          <input style="${ST.input}" id="emp-pass" required minlength="6" placeholder="Mínimo 6 caracteres">
        </div>
      </div>
      <div id="emp-error" style="display:none; background:#FEF2F2; border:1px solid #FECACA; color:var(--rojo); padding:0.6rem 0.85rem; border-radius:8px; font-size:0.82rem; margin-bottom:0.75rem;"></div>
      <button type="submit" style="${ST.btnPri}" id="btn-emp-submit">Crear empleado</button>
    </form>
  `;
  abrirModal('Crear empleado', html);

  $('#form-empleado').addEventListener('submit', async e => {
    e.preventDefault();
    const errEl = $('#emp-error'); errEl.style.display = 'none';
    const btn = $('#btn-emp-submit'); btn.disabled = true; btn.textContent = 'Creando…';
    try {
      await rpc('fn_crear_empleado', {
        p_nombre: $('#emp-nombre').value.trim(),
        p_rol: $('#emp-rol').value,
        p_email: $('#emp-email').value.trim(),
        p_password: $('#emp-pass').value,
      });
      cerrarModal();
      toast('Empleado creado', 'Ya puede iniciar sesión', 'ok');
      moduloPersonal();
    } catch (err) {
      errEl.textContent = 'Error: ' + err.message; errEl.style.display = 'block';
      btn.disabled = false; btn.textContent = 'Crear empleado';
    }
  });
}

function abrirResetPass(userId, nombre) {
  const html = `
    <p style="font-size:0.85rem; color:var(--texto-sub); margin-bottom:1rem;">Nueva contraseña para <strong>${escapeHtml(nombre)}</strong>:</p>
    <div style="${ST.grupo}"><input style="${ST.input}" id="reset-pass" type="text" placeholder="Mínimo 6 caracteres" minlength="6"></div>
    <button style="${ST.btnPri}" id="btn-reset">Resetear contraseña</button>
  `;
  abrirModal('Resetear contraseña', html);
  $('#btn-reset').addEventListener('click', async ()=>{
    const pass = $('#reset-pass').value;
    if (!pass || pass.length<6) { toast('Mínimo 6 caracteres','','warn'); return; }
    try {
      await rpc('fn_resetear_password_empleado', { p_empleado_user_id:userId, p_nueva_password:pass });
      cerrarModal(); toast('Contraseña actualizada','','ok');
    } catch(err){ toast('Error',err.message,'error'); }
  });
}


// ════════════════════════════════════════════════════════════
//  HOTEL › MI SUSCRIPCIÓN
// ════════════════════════════════════════════════════════════
async function moduloMiSuscripcion() {
  skeleton();
  try {
    const susc = await getSuscripcionHotel(SESSION.hotel.id);
    const dias = susc.dias_restantes;
    const estadoColor = dias < 0 ? '#DC2626' : dias <= 5 ? '#EA580C' : '#16A34A';
    const estadoBg    = dias < 0 ? '#FEF2F2' : dias <= 5 ? '#FFF7ED' : '#F0FDF4';
    const diasMostrar = Math.max(0, dias);
    const pct = Math.min(100, Math.max(0, (diasMostrar / 30) * 100));
    // Arco SVG: radio=80, circunferencia=2π*80≈502
    const circ = 502;
    const offset = circ - (circ * pct / 100);
    const planLabel = (susc.plan||'basico').toUpperCase();
    const venceStr = susc.fecha_vencimiento
      ? new Date(susc.fecha_vencimiento).toLocaleDateString('es-PE',{day:'numeric',month:'short',year:'numeric'})
      : '—';
    const cicloStr = susc.ciclo_pago
      ? susc.ciclo_pago.charAt(0).toUpperCase()+susc.ciclo_pago.slice(1)
      : '—';

    const beneficios = [
      'Gestión de reservas',
      'Control de huéspedes',
      'Rack de habitaciones',
      'Reportes básicos',
      'Soporte por WhatsApp',
    ];

    contenido().innerHTML = `
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;margin-bottom:1.25rem;">
        <div style="display:flex;align-items:center;gap:1rem;">
          <div style="width:52px;height:52px;border-radius:14px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:26px;height:26px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div>
            <h1 style="font-size:1.5rem;font-weight:700;color:var(--texto);margin:0;">Mi Suscripción</h1>
            <p style="font-size:0.83rem;color:var(--texto-sub);margin:0.2rem 0 0;">Gestiona tu plan y mantén tu hotel siempre en marcha</p>
          </div>
        </div>
        <!-- Breadcrumb -->
        <div style="font-size:0.8rem;color:var(--texto-sub);display:flex;align-items:center;gap:0.4rem;">
          <span>Inicio</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px;"><polyline points="9 18 15 12 9 6"/></svg>
          <span style="color:var(--texto);font-weight:600;">Mi Suscripción</span>
        </div>
      </div>

      <!-- Grid principal: plan + sidebar -->
      <div style="display:grid;grid-template-columns:1fr 320px;gap:1.25rem;margin-bottom:1.25rem;" class="susc-grid">

        <!-- Card plan actual -->
        <div style="background:white;border:1px solid var(--gris-borde);border-radius:16px;padding:1.75rem;">
          <div style="font-size:0.78rem;font-weight:600;color:var(--texto-sub);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:0.4rem;">Plan actual</div>
          <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.5rem;">
            <span style="font-size:1.75rem;font-weight:800;color:var(--texto);">${escapeHtml(susc.nombre_comercial)}</span>
            <span style="font-size:0.72rem;font-weight:700;color:#2563EB;background:#EFF6FF;padding:0.25rem 0.75rem;border-radius:999px;letter-spacing:0.05em;">${planLabel}</span>
          </div>
          <p style="font-size:0.85rem;color:var(--texto-sub);margin:0 0 1.5rem;">Ideal para pequeños alojamientos que buscan una gestión simple y eficiente.</p>

          <!-- Detalles del plan + arco circular -->
          <div style="display:flex;align-items:center;gap:2rem;flex-wrap:wrap;">
            <div style="flex:1;min-width:200px;">
              ${filaDetalleSusc('calendar','Ciclo de pago', cicloStr)}
              ${filaDetalleSusc('calendar','Vence el', venceStr)}
              ${filaDetalleSusc('credit-card','Método de pago','No registrado')}
              ${filaDetalleSuscEstado('Estado', dias >= 0 ? 'Activo' : 'Vencido', estadoColor, estadoBg)}
            </div>
            <!-- Arco circular de días -->
            <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;">
              <div style="position:relative;width:180px;height:180px;">
                <svg viewBox="0 0 200 200" width="180" height="180">
                  <!-- Pista gris -->
                  <circle cx="100" cy="100" r="80" fill="none" stroke="#E7EBF2" stroke-width="14" stroke-linecap="round"/>
                  <!-- Arco de progreso -->
                  <circle cx="100" cy="100" r="80" fill="none" stroke="${estadoColor}" stroke-width="14" stroke-linecap="round"
                    stroke-dasharray="${circ}" stroke-dashoffset="${offset}"
                    transform="rotate(-90 100 100)" style="transition:stroke-dashoffset 1s ease;"/>
                </svg>
                <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">
                  <div style="font-size:2.5rem;font-weight:800;color:${estadoColor};line-height:1;">${diasMostrar}</div>
                  <div style="font-size:0.8rem;color:var(--texto-sub);font-weight:500;">días restantes</div>
                </div>
              </div>
              <div style="font-size:0.8rem;color:var(--texto-sub);text-align:center;margin-top:0.5rem;">
                Tu plan se renovará el<br><strong style="color:var(--texto);">${venceStr}</strong>
              </div>
            </div>
          </div>

          <!-- Botones -->
          <div style="display:flex;gap:0.75rem;flex-wrap:wrap;margin-top:1.5rem;align-items:center;">
            <a href="${WA_URL}" target="_blank" rel="noopener" style="flex:1;display:flex;align-items:center;justify-content:center;gap:0.6rem;background:#16A34A;color:white;text-decoration:none;padding:0.85rem 1.25rem;border-radius:12px;font-weight:700;font-size:0.92rem;min-width:200px;">
              <svg viewBox="0 0 24 24" fill="white" style="width:20px;height:20px;"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.186 21.9l4.83-1.225A9.953 9.953 0 0 0 12 22c5.522 0 10-4.478 10-10S17.521 2 11.999 2z"/></svg>
              Renovar por WhatsApp →
            </a>
            <div style="display:flex;align-items:center;gap:0.6rem;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:0.85rem 1.1rem;flex:1;min-width:180px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2" stroke-linecap="round" style="width:18px;height:18px;flex-shrink:0;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span style="font-size:0.8rem;color:#16A34A;font-weight:500;">Renueva a tiempo y evita interrupciones en el servicio.</span>
            </div>
          </div>
        </div>

        <!-- Sidebar derecho -->
        <div style="display:flex;flex-direction:column;gap:1rem;">
          <!-- ¿Necesitas más funciones? -->
          <div style="background:white;border:1px solid var(--gris-borde);border-radius:14px;padding:1.25rem;display:flex;align-items:flex-start;gap:1rem;">
            <div style="width:48px;height:48px;border-radius:13px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" style="width:24px;height:24px;"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
            <div style="flex:1;">
              <div style="font-weight:700;font-size:0.92rem;margin-bottom:0.25rem;">¿Necesitas más funciones?</div>
              <div style="font-size:0.78rem;color:var(--texto-sub);margin-bottom:0.75rem;">Descubre nuestros planes y elige el que mejor se adapte a tu hotel.</div>
              <a href="${WA_URL}" target="_blank" style="display:inline-flex;align-items:center;gap:0.4rem;background:white;border:1.5px solid var(--azul);border-radius:9px;padding:0.45rem 0.9rem;font-size:0.8rem;font-weight:600;color:var(--azul);text-decoration:none;cursor:pointer;">
                Ver planes <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:12px;height:12px;"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </a>
            </div>
          </div>

          <!-- Beneficios del plan -->
          <div style="background:white;border:1px solid var(--gris-borde);border-radius:14px;padding:1.25rem;position:relative;overflow:hidden;">
            <!-- Ícono decorativo fondo -->
            <div style="position:absolute;bottom:-10px;right:-10px;opacity:0.06;">
              <svg viewBox="0 0 24 24" fill="#2563EB" style="width:100px;height:100px;"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/></svg>
            </div>
            <div style="font-weight:700;font-size:1rem;margin-bottom:1rem;">Beneficios de tu plan</div>
            ${beneficios.map(b=>`
              <div style="display:flex;align-items:center;gap:0.6rem;padding:0.4rem 0;">
                <div style="width:22px;height:22px;border-radius:50%;background:#16A34A;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" style="width:12px;height:12px;"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <span style="font-size:0.85rem;color:var(--texto);">${b}</span>
              </div>`).join('')}
          </div>
        </div>
      </div>

      <!-- Banner inferior "Haz crecer tu hotel" -->
      <div style="background:white;border:1px solid var(--gris-borde);border-radius:14px;padding:1.35rem 1.75rem;display:flex;align-items:center;gap:1.25rem;flex-wrap:wrap;position:relative;overflow:hidden;">
        <svg style="position:absolute;bottom:0;right:120px;opacity:0.09;" viewBox="0 0 300 80" width="300" height="80" preserveAspectRatio="none">
          <path d="M0 60 Q75 20 150 50 Q225 80 300 40 L300 80 L0 80 Z" fill="#2563EB"/>
        </svg>
        <svg style="position:absolute;bottom:0;right:0;opacity:0.06;" viewBox="0 0 200 80" width="200" height="80" preserveAspectRatio="none">
          <path d="M0 50 Q50 10 100 40 Q150 70 200 30 L200 80 L0 80 Z" fill="#7C3AED"/>
        </svg>
        <div style="width:52px;height:52px;border-radius:14px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative;">
          <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" style="width:26px;height:26px;"><path d="M2 4l3 12h14l3-12-6 7.5-4-6-4 6L2 4z"/></svg>
        </div>
        <div style="flex:1;position:relative;">
          <div style="font-weight:700;font-size:1.05rem;color:var(--texto);">Haz crecer tu hotel</div>
          <div style="font-size:0.82rem;color:var(--texto-sub);">Optimiza tu operación con más herramientas y funcionalidades.</div>
        </div>
        <a href="${WA_URL}" target="_blank" style="display:flex;align-items:center;gap:0.5rem;background:linear-gradient(135deg,var(--azul),#2563EB);color:white;text-decoration:none;padding:0.7rem 1.35rem;border-radius:10px;font-size:0.88rem;font-weight:600;cursor:pointer;position:relative;white-space:nowrap;box-shadow:0 4px 14px rgba(37,99,235,0.3);">
          Conocer otros planes
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" style="width:14px;height:14px;"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </a>
      </div>
    `;
  } catch (err) {
    contenido().innerHTML = errorBox('No se pudo cargar tu suscripción', err.message);
  }
}

function filaDetalleSusc(icon, label, valor) {
  const iconos = {
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    'credit-card': '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  };
  return `
    <div style="display:flex;align-items:center;gap:0.75rem;padding:0.55rem 0;border-bottom:1px solid var(--gris-borde);">
      <div style="width:28px;height:28px;border-radius:8px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;">${iconos[icon]||iconos.calendar}</svg>
      </div>
      <span style="flex:1;font-size:0.82rem;color:var(--texto-sub);">${label}</span>
      <span style="font-size:0.85rem;font-weight:600;color:var(--texto);">${valor}</span>
    </div>`;
}

function filaDetalleSuscEstado(label, valor, color, bg) {
  return `
    <div style="display:flex;align-items:center;gap:0.75rem;padding:0.55rem 0;">
      <div style="width:28px;height:28px;border-radius:8px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      </div>
      <span style="flex:1;font-size:0.82rem;color:var(--texto-sub);">${label}</span>
      <span style="display:inline-flex;align-items:center;gap:0.35rem;font-size:0.75rem;font-weight:700;color:${color};background:${bg};padding:0.22rem 0.75rem;border-radius:999px;">
        <span style="width:6px;height:6px;border-radius:50%;background:${color};"></span>
        ${valor}
      </span>
    </div>`;
}


// ════════════════════════════════════════════════════════════
//  HOTEL › REPORTES (ventas por rango de fechas)
// ════════════════════════════════════════════════════════════
async function moduloReportes() {
  skeleton();
  const hoy = new Date();
  const hace30 = new Date(hoy.getTime() - 29 * 24 * 3600 * 1000);
  const fmt = d => d.toISOString().slice(0, 10);
  window._repDesde = fmt(hace30);
  window._repHasta = fmt(hoy);
  window._repPeriodo = 'Últimos 30 días';

  const periodos = ['Hoy','Últimos 7 días','Últimos 30 días','Este mes','Mes anterior','Este año'];

  contenido().innerHTML = `
    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;margin-bottom:1.25rem;">
      <div style="display:flex;align-items:center;gap:1rem;">
        <div style="width:52px;height:52px;border-radius:14px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:26px;height:26px;"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>
        </div>
        <div>
          <h1 style="font-size:1.5rem;font-weight:700;color:var(--texto);margin:0;">Reportes</h1>
          <p style="font-size:0.83rem;color:var(--texto-sub);margin:0.2rem 0 0;">Analiza tus ventas e ingresos en un solo lugar</p>
        </div>
      </div>
      <button onclick="exportarReporteCSV()" style="display:flex;align-items:center;gap:0.45rem;background:white;border:1px solid var(--gris-borde);border-radius:10px;padding:0.6rem 1.1rem;font-size:0.83rem;font-weight:500;color:var(--texto-sub);cursor:pointer;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:15px;height:15px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Exportar reporte
      </button>
    </div>

    <!-- Selector de fechas + periodos rápidos -->
    <div style="background:white;border:1px solid var(--gris-borde);border-radius:12px;padding:1rem 1.25rem;display:flex;align-items:center;gap:1rem;flex-wrap:wrap;margin-bottom:1.25rem;">
      <div style="display:flex;align-items:center;gap:0.75rem;">
        <div>
          <div style="font-size:0.72rem;font-weight:600;color:var(--texto-sub);margin-bottom:0.2rem;">Desde</div>
          <div style="display:flex;align-items:center;gap:0.5rem;background:var(--gris-bg);border:1px solid var(--gris-borde);border-radius:9px;padding:0.45rem 0.75rem;">
            <input type="date" id="rep-desde" value="${fmt(hace30)}" onchange="window._repDesde=this.value" style="border:none;background:none;outline:none;font-size:0.85rem;font-weight:600;color:var(--texto);font-family:inherit;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;flex-shrink:0;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
        </div>
        <div>
          <div style="font-size:0.72rem;font-weight:600;color:var(--texto-sub);margin-bottom:0.2rem;">Hasta</div>
          <div style="display:flex;align-items:center;gap:0.5rem;background:var(--gris-bg);border:1px solid var(--gris-borde);border-radius:9px;padding:0.45rem 0.75rem;">
            <input type="date" id="rep-hasta" value="${fmt(hoy)}" onchange="window._repHasta=this.value" style="border:none;background:none;outline:none;font-size:0.85rem;font-weight:600;color:var(--texto);font-family:inherit;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;flex-shrink:0;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
        </div>
        <button onclick="generarReporte()" style="align-self:flex-end;padding:0.6rem 1.35rem;background:linear-gradient(135deg,var(--azul),#2563EB);color:white;border:none;border-radius:9px;font-size:0.88rem;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(37,99,235,0.3);">
          Generar reporte
        </button>
      </div>
      <div style="flex:1;display:flex;justify-content:flex-end;gap:0.35rem;flex-wrap:wrap;" id="rep-periodos">
        ${periodos.map(p => `
          <button onclick="setRepPeriodo('${p}')" id="rep-p-${p.replace(/\s/g,'_')}"
            style="padding:0.4rem 0.8rem;border-radius:8px;font-size:0.8rem;font-weight:600;cursor:pointer;
            background:${'Últimos 30 días'===p?'var(--azul)':'white'};
            color:${'Últimos 30 días'===p?'white':'var(--texto-sub)'};
            border:1.5px solid ${'Últimos 30 días'===p?'transparent':'var(--gris-borde)'};">
            ${p}
          </button>`).join('')}
      </div>
    </div>

    <!-- Resultado del reporte -->
    <div id="rep-resultado">
      <div style="display:flex;align-items:center;gap:0.75rem;color:var(--texto-sub);padding:2rem;justify-content:center;">
        <div class="spinner" style="width:22px;height:22px;"></div> Generando reporte…
      </div>
    </div>
  `;

  generarReporte();
}

function setRepPeriodo(periodo) {
  window._repPeriodo = periodo;
  const hoy = new Date();
  let desde, hasta = new Date(hoy);
  const fmt = d => d.toISOString().slice(0,10);

  if (periodo === 'Hoy') {
    desde = new Date(hoy); desde.setHours(0,0,0,0);
  } else if (periodo === 'Últimos 7 días') {
    desde = new Date(hoy.getTime() - 6*24*3600*1000);
  } else if (periodo === 'Últimos 30 días') {
    desde = new Date(hoy.getTime() - 29*24*3600*1000);
  } else if (periodo === 'Este mes') {
    desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  } else if (periodo === 'Mes anterior') {
    desde = new Date(hoy.getFullYear(), hoy.getMonth()-1, 1);
    hasta = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
  } else if (periodo === 'Este año') {
    desde = new Date(hoy.getFullYear(), 0, 1);
  }

  window._repDesde = fmt(desde);
  window._repHasta = fmt(hasta);
  const dInput = document.getElementById('rep-desde');
  const hInput = document.getElementById('rep-hasta');
  if (dInput) dInput.value = window._repDesde;
  if (hInput) hInput.value = window._repHasta;

  // Actualizar botones
  ['Hoy','Últimos 7 días','Últimos 30 días','Este mes','Mes anterior','Este año'].forEach(p => {
    const btn = document.getElementById('rep-p-'+p.replace(/\s/g,'_'));
    if (!btn) return;
    const activo = p === periodo;
    btn.style.background = activo ? 'var(--azul)' : 'white';
    btn.style.color = activo ? 'white' : 'var(--texto-sub)';
    btn.style.borderColor = activo ? 'transparent' : 'var(--gris-borde)';
  });

  generarReporte();
}

async function generarReporte() {
  const cont = document.getElementById('rep-resultado');
  if (!cont) return;
  cont.innerHTML = `<div style="display:flex;align-items:center;gap:0.75rem;color:var(--texto-sub);padding:2rem;justify-content:center;"><div class="spinner" style="width:22px;height:22px;"></div> Generando…</div>`;

  const desde = window._repDesde || document.getElementById('rep-desde')?.value;
  const hasta = window._repHasta || document.getElementById('rep-hasta')?.value;
  const desdeISO = new Date(desde+'T00:00:00').toISOString();
  const hastaISO = new Date(hasta+'T23:59:59').toISOString();

  try {
    const [{ data: movs }, { data: estadias }, { data: comps }, { data: ventasRest }] = await Promise.all([
      db.from('movimientos_caja').select('tipo,monto,metodo_pago,concepto,created_at').eq('hotel_id',SESSION.hotel.id).gte('created_at',desdeISO).lte('created_at',hastaISO).limit(5000),
      db.from('estadias_reservas').select('modalidad,tarifa_aplicada,created_at,estado,fecha_entrada,fecha_salida_real').eq('hotel_id',SESSION.hotel.id).gte('created_at',desdeISO).lte('created_at',hastaISO).limit(5000),
      db.from('comprobantes_sunat').select('tipo_doc,total,estado,created_at').eq('hotel_id',SESSION.hotel.id).gte('created_at',desdeISO).lte('created_at',hastaISO).limit(5000),
      db.from('ventas_directas').select('*, items_venta_directa(*)').eq('hotel_id',SESSION.hotel.id).like('notas','MESA:%').gte('created_at',desdeISO).lte('created_at',hastaISO).limit(5000),
    ]);

    // ── Totales ──
    const porMetodo = { efectivo:0, yape:0, plin:0, transferencia:0, mixto:0 };
    let ingresos = 0, egresos = 0;
    (movs||[]).forEach(m => {
      if (m.tipo==='ingreso') { ingresos+=Number(m.monto); const k=m.metodo_pago||'efectivo'; porMetodo[k]=(porMetodo[k]||0)+Number(m.monto); }
      else if (m.tipo==='egreso') egresos+=Number(m.monto);
    });
    const neto = ingresos - egresos;
    const totalCheckins = (estadias||[]).length;
    const porNoche = (estadias||[]).filter(e=>e.modalidad==='noche').length;
    const porHoras = (estadias||[]).filter(e=>e.modalidad==='horas').length;
    const totalFacturado = (comps||[]).filter(c=>c.estado!=='ANULADO').reduce((s,c)=>s+Number(c.total),0);
    const totalMetodos = Object.values(porMetodo).reduce((a,b)=>a+b,0);

    // ── Ventas restaurante ──
    const ventasRestCobradas = (ventasRest||[]).filter(v=>(v.notas||'').includes('ESTADO:cobrada'));
    const totalRest     = ventasRestCobradas.reduce((s,v)=>s+Number(v.total||0),0);
    const ingresosHotel = ingresos - totalRest; // ingresos de caja sin restaurante
    const ticketProm    = ventasRestCobradas.length ? (totalRest/ventasRestCobradas.length).toFixed(2) : 0;

    // Productos más vendidos del restaurante
    const conteoPlatos = {};
    ventasRestCobradas.forEach(v=>{
      (v.items_venta_directa||[]).forEach(it=>{
        const k = it.descripcion;
        if (!conteoPlatos[k]) conteoPlatos[k] = { nombre:k, cantidad:0, total:0 };
        conteoPlatos[k].cantidad += it.cantidad;
        conteoPlatos[k].total   += Number(it.subtotal||0);
      });
    });
    const topPlatos = Object.values(conteoPlatos).sort((a,b)=>b.total-a.total).slice(0,8);

    // Movimientos de caja del restaurante por día
    const porDiaRest = {};
    ventasRestCobradas.forEach(v=>{
      const dia = v.created_at.slice(0,10);
      porDiaRest[dia] = (porDiaRest[dia]||0) + Number(v.total||0);
    });
    const estadiasConFecha = (estadias||[]).filter(e=>e.fecha_entrada&&e.fecha_salida_real);
    const promedioNoches = estadiasConFecha.length
      ? (estadiasConFecha.reduce((s,e)=>{
          const diff=(new Date(e.fecha_salida_real)-new Date(e.fecha_entrada))/(1000*3600*24);
          return s+Math.max(0,diff);
        },0)/estadiasConFecha.length).toFixed(1)
      : '—';
    const huespedesAtendidos = totalCheckins;
    const totalHabs = await db.from('habitaciones').select('id',{count:'exact'}).eq('hotel_id',SESSION.hotel.id).eq('activo',true);
    const numHabs = (totalHabs.data||[]).length || 1;
    const rangoDias = Math.max(1, Math.ceil((new Date(hastaISO)-new Date(desdeISO))/(1000*3600*24)));
    const ocupPct = Math.round((porNoche/(numHabs*rangoDias))*100);
    const revpar = numHabs>0 ? (ingresos/(numHabs*rangoDias)).toFixed(2) : 0;

    // ── Ingresos por día ──
    const porDia = {};
    (movs||[]).forEach(m => {
      if (m.tipo!=='ingreso') return;
      const dia = m.created_at.slice(0,10);
      porDia[dia]=(porDia[dia]||0)+Number(m.monto);
    });
    const dias = Object.keys(porDia).sort();
    const valDias = dias.map(d=>porDia[d]);

    // ── Comprobantes por tipo ──
    const cTipos = { factura:{ cnt:0, total:0 }, boleta:{ cnt:0, total:0 } };
    (comps||[]).filter(c=>c.estado!=='ANULADO').forEach(c => {
      if (cTipos[c.tipo_doc]) { cTipos[c.tipo_doc].cnt++; cTipos[c.tipo_doc].total+=Number(c.total); }
    });

    const totalCompTot = (cTipos.factura.total+cTipos.boleta.total)||1;

    cont.innerHTML = `
      <!-- 6 tarjetas métricas con sparkline -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-bottom:1.5rem;">
        ${repKpi(soles(ingresos),'Ingresos totales','#16A34A','#F0FDF4','12%',sparkline('#16A34A'),'<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>')}
        ${repKpi(soles(egresos),'Egresos','#DC2626','#FEF2F2','0%',sparkline('#DC2626'),'<line x1="5" y1="12" x2="19" y2="12"/>')}
        ${repKpi(soles(neto),'Neto','#2563EB','#EFF6FF','12%',sparkline('#2563EB'),'<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>')}
        ${repKpi(soles(totalFacturado),'Total facturado','#7C3AED','#F5F3FF','8%',sparkline('#7C3AED'),'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>')}
        ${repKpi(totalCheckins,'Check-ins','#EA580C','#FFF7ED','0%',sparkline('#EA580C'),'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>')}
        ${repKpi(porNoche+' / '+porHoras,'Por noche / horas','#0891B2','#F0F9FF','0%',sparkline('#0891B2'),'<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>')}
      </div>

      <!-- Gráficos: barras + dona -->
      <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:1rem;margin-bottom:1.25rem;" class="rep-grid">
        <!-- Ingresos por día -->
        <div class="card">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;">
            <div style="font-weight:700;font-size:1rem;">Ingresos por día</div>
            <div style="display:flex;align-items:center;gap:0.4rem;background:var(--gris-bg);border:1px solid var(--gris-borde);border-radius:8px;padding:0.35rem 0.75rem;font-size:0.8rem;color:var(--texto-sub);cursor:pointer;">
              Ingresos <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:12px;height:12px;"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>
          ${dias.length
            ? '<canvas id="chart-dias" style="max-height:240px;"></canvas>'
            : '<div style="text-align:center;color:var(--texto-sub);padding:2rem;font-size:0.85rem;">Sin ingresos en este rango.</div>'}
        </div>

        <!-- Ingresos por método de pago -->
        <div class="card">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;">
            <div style="font-weight:700;font-size:1rem;">Ingresos por método de pago</div>
            <div style="display:flex;align-items:center;gap:0.4rem;background:var(--gris-bg);border:1px solid var(--gris-borde);border-radius:8px;padding:0.35rem 0.75rem;font-size:0.8rem;color:var(--texto-sub);cursor:pointer;">
              Por monto <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:12px;height:12px;"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:1.25rem;flex-wrap:wrap;">
            <div style="position:relative;width:160px;height:160px;flex-shrink:0;">
              <canvas id="chart-metodos"></canvas>
              <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;">
                <div style="font-size:1.1rem;font-weight:700;">${soles(totalMetodos)}</div>
                <div style="font-size:0.7rem;color:var(--texto-sub);">Total</div>
              </div>
            </div>
            <div style="flex:1;min-width:140px;">
              ${[['Efectivo','#16A34A',porMetodo.efectivo],['Yape','#7C3AED',porMetodo.yape],['Plin','#0891B2',porMetodo.plin],['Transferencia','#EA580C',porMetodo.transferencia],['Mixto','#64748B',porMetodo.mixto]].map(([label,color,val])=>`
                <div style="display:flex;align-items:center;gap:0.6rem;padding:0.3rem 0;">
                  <span style="width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0;"></span>
                  <span style="flex:1;font-size:0.82rem;color:var(--texto-sub);">${label}</span>
                  <span style="font-weight:700;font-size:0.85rem;">${soles(val)}</span>
                  <span style="font-size:0.75rem;color:var(--texto-sub);width:40px;text-align:right;">${totalMetodos>0?Math.round((val/totalMetodos)*100)+'%':'0%'}</span>
                </div>`).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Comprobantes + indicadores adicionales -->
      <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:1rem;" class="rep-grid">
        <!-- Resumen por tipo de comprobante -->
        <div class="card">
          <div style="font-weight:700;font-size:1rem;margin-bottom:1rem;">Resumen por tipo de comprobante</div>
          <table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
            <thead><tr style="border-bottom:1px solid var(--gris-borde);">
              <th style="${thCss()}">TIPO</th>
              <th style="${thCss()}">CANTIDAD</th>
              <th style="${thCss()}">TOTAL</th>
              <th style="${thCss()}"></th>
            </tr></thead>
            <tbody>
              ${[['Factura','#2563EB',cTipos.factura],['Boleta de venta','#7C3AED',cTipos.boleta]].map(([label,color,datos])=>`
                <tr style="border-bottom:1px solid var(--gris-borde);">
                  <td style="${tdCss()}"><span style="display:inline-flex;align-items:center;gap:0.5rem;"><span style="width:10px;height:10px;border-radius:50%;background:${color};"></span>${label}</span></td>
                  <td style="${tdCss()}">${datos.cnt}</td>
                  <td style="${tdCss()};font-weight:600;">${soles(datos.total)}</td>
                  <td style="${tdCss()}">
                    <div style="display:flex;align-items:center;gap:0.5rem;">
                      <div style="flex:1;height:8px;background:var(--gris-borde);border-radius:999px;overflow:hidden;">
                        <div style="width:${totalCompTot>0?Math.round((datos.total/totalCompTot)*100):0}%;height:100%;background:${color};border-radius:999px;"></div>
                      </div>
                      <span style="font-size:0.75rem;color:var(--texto-sub);width:32px;text-align:right;">${totalCompTot>0?Math.round((datos.total/totalCompTot)*100):0}%</span>
                    </div>
                  </td>
                </tr>`).join('')}
              <tr>
                <td style="${tdCss()};font-weight:700;">Total</td>
                <td style="${tdCss()};font-weight:700;">${cTipos.factura.cnt+cTipos.boleta.cnt}</td>
                <td style="${tdCss()};font-weight:700;">${soles(cTipos.factura.total+cTipos.boleta.total)}</td>
                <td style="${tdCss()}">
                  <div style="display:flex;align-items:center;gap:0.5rem;">
                    <div style="flex:1;height:8px;background:#2563EB;border-radius:999px;"></div>
                    <span style="font-size:0.75rem;color:var(--texto-sub);width:32px;text-align:right;">100%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Indicadores adicionales -->
        <div class="card">
          <div style="font-weight:700;font-size:1rem;margin-bottom:1rem;">Indicadores adicionales</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
            ${indCard('Estadía promedio',promedioNoches,'noches','#2563EB','#EFF6FF','<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>')}
            ${indCard('Huéspedes atendidos',huespedesAtendidos,'personas','#16A34A','#F0FDF4','<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>')}
            ${indCard('Ocupación',ocupPct+'%','promedio','#EA580C','#FFF7ED','<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>')}
            ${indCard('RevPAR',soles(revpar),'por habitación','#7C3AED','#F5F3FF','<path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>')}
          </div>
        </div>
      </div>
      ${seccionRest||''}
    `;

    window._repData = { movs, estadias, comps, ingresos, egresos, neto, ventasRest };

    // ── Sección restaurante (solo si plan PRO y hay ventas) ──
    const esProPlan = SESSION.hotel?.plan === 'pro';
    const seccionRest = esProPlan ? `
      <div style="margin-top:1.25rem;">
        <div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:1rem;">
          <div style="width:8px;height:8px;border-radius:50%;background:#EA580C;"></div>
          <span style="font-weight:700;font-size:1rem;">Restaurante</span>
          <span style="background:#FFF7ED;color:#EA580C;font-size:0.72rem;font-weight:700;padding:0.15rem 0.55rem;border-radius:999px;">Plan PRO</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;margin-bottom:1.25rem;">
          ${repKpi(soles(totalRest),'Ventas restaurante','#EA580C','#FFF7ED','',sparkline('#EA580C'),'<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>')}
          ${repKpi(ventasRestCobradas.length,'Mesas atendidas','#EA580C','#FFF7ED','',sparkline('#EA580C'),'<path d="M3 21h18M6 21V7l6-4 6 4v14"/>')}
          ${repKpi(soles(ticketProm),'Ticket promedio','#EA580C','#FFF7ED','',sparkline('#EA580C'),'<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>')}
          ${repKpi(soles(ingresosHotel),'Solo hotel (sin rest.)','#64748B','#F1F5F9','',sparkline('#64748B'),'<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>')}
        </div>

        <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:1rem;" class="rep-grid">
          <!-- Top platos vendidos -->
          <div class="card">
            <div style="font-weight:700;font-size:1rem;margin-bottom:1rem;">🏆 Platos más vendidos</div>
            ${topPlatos.length===0
              ? `<div style="text-align:center;color:var(--texto-sub);padding:1.5rem;font-size:0.85rem;">Sin ventas en este período</div>`
              : `<table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
                  <thead><tr style="border-bottom:1px solid var(--gris-borde);">
                    <th style="${thCss()}">#</th>
                    <th style="${thCss()}">PLATO / BEBIDA</th>
                    <th style="${thCss()};text-align:center;">CANT.</th>
                    <th style="${thCss()};text-align:right;">TOTAL</th>
                  </tr></thead>
                  <tbody>
                    ${topPlatos.map((p,i)=>`
                      <tr style="border-bottom:1px solid var(--gris-borde);">
                        <td style="${tdCss()};color:${i===0?'#EA580C':i===1?'#64748B':i===2?'#92400E':'var(--texto-sub)'};font-weight:700;">${i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}</td>
                        <td style="${tdCss()};font-weight:600;">${escapeHtml(p.nombre)}</td>
                        <td style="${tdCss()};text-align:center;">${p.cantidad}</td>
                        <td style="${tdCss()};text-align:right;font-weight:700;color:var(--verde);">${soles(p.total)}</td>
                      </tr>`).join('')}
                  </tbody>
                </table>`}
          </div>

          <!-- Ventas por día del restaurante -->
          <div class="card">
            <div style="font-weight:700;font-size:1rem;margin-bottom:1rem;">📅 Ventas diarias del restaurante</div>
            ${Object.keys(porDiaRest).length===0
              ? `<div style="text-align:center;color:var(--texto-sub);padding:1.5rem;font-size:0.85rem;">Sin ventas en este período</div>`
              : `<div style="display:flex;flex-direction:column;gap:0.5rem;">
                  ${Object.entries(porDiaRest).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,7).map(([dia,monto])=>{
                    const [,m,dd]=dia.split('-');
                    const meses=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
                    const pct=totalRest>0?Math.round((monto/totalRest)*100):0;
                    return `<div style="display:flex;align-items:center;gap:0.75rem;">
                      <span style="font-size:0.78rem;color:var(--texto-sub);min-width:60px;">${parseInt(dd)} ${meses[parseInt(m)-1]}</span>
                      <div style="flex:1;height:8px;background:var(--gris-borde);border-radius:999px;overflow:hidden;">
                        <div style="width:${pct}%;height:100%;background:#EA580C;border-radius:999px;"></div>
                      </div>
                      <span style="font-weight:700;font-size:0.82rem;min-width:70px;text-align:right;">${soles(monto)}</span>
                    </div>`;
                  }).join('')}
                </div>`}
          </div>
        </div>
      </div>
    ` : '';


    // Gráfico barras por día
    if (typeof Chart !== 'undefined') {
      // Formatear etiquetas de fecha
      const labelsDia = dias.map(d => {
        const [,m,dd] = d.split('-');
        const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
        return `${parseInt(dd)} ${meses[parseInt(m)-1]}`;
      });
      if (dias.length) {
        new Chart(document.getElementById('chart-dias'), {
          type: 'bar',
          data: { labels: labelsDia, datasets: [{ data: valDias, backgroundColor: '#2563EB', borderRadius: 5, barThickness: 'flex', maxBarThickness: 28 }] },
          options: { plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true, ticks:{ font:{ size:10 } } }, x:{ ticks:{ font:{ size:10 }, maxRotation:45 } } } },
        });
      }
      // Dona de métodos
      new Chart(document.getElementById('chart-metodos'), {
        type: 'doughnut',
        data: {
          labels: ['Efectivo','Yape','Plin','Transferencia','Mixto'],
          datasets: [{ data:[porMetodo.efectivo,porMetodo.yape,porMetodo.plin,porMetodo.transferencia,porMetodo.mixto], backgroundColor:['#16A34A','#7C3AED','#0891B2','#EA580C','#64748B'], borderWidth:3, borderColor:'#fff' }],
        },
        options: { plugins:{ legend:{ display:false } }, cutout:'68%' },
      });
    }
  } catch (err) {
    cont.innerHTML = errorBox('No se pudo generar el reporte', err.message);
  }
}

function repKpi(valor, label, color, bg, pct, sparkline, icono) {
  return `
    <div style="background:white;border:1px solid var(--gris-borde);border-radius:14px;padding:1.1rem;position:relative;overflow:hidden;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:0.4rem;">
        <div style="width:36px;height:36px;border-radius:10px;background:${bg};display:flex;align-items:center;justify-content:center;">
          <svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;">${icono}</svg>
        </div>
        <span style="font-size:0.7rem;font-weight:700;color:${color};background:${bg};padding:0.15rem 0.45rem;border-radius:999px;">${pct==='0%'?'↓ '+pct:'↑ '+pct}</span>
      </div>
      <div style="font-size:1.25rem;font-weight:700;color:var(--texto);line-height:1.1;">${valor}</div>
      <div style="font-size:0.73rem;color:var(--texto-sub);margin-top:0.15rem;">${label}</div>
      ${sparkline}
    </div>`;
}

function indCard(label, valor, sub, color, bg, icono) {
  return `
    <div style="background:${bg};border-radius:12px;padding:0.9rem;display:flex;align-items:flex-start;gap:0.6rem;">
      <div style="width:36px;height:36px;border-radius:10px;background:white;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;">${icono}</svg>
      </div>
      <div>
        <div style="font-size:0.72rem;color:var(--texto-sub);">${label}</div>
        <div style="font-size:1.2rem;font-weight:700;color:var(--texto);line-height:1.1;">${valor}</div>
        <div style="font-size:0.7rem;color:var(--texto-sub);">${sub}</div>
      </div>
    </div>`;
}

function exportarReporteCSV() {
  const d = window._repData;
  if (!d) { toast('Genera el reporte primero','','warn'); return; }
  const cab = ['Tipo','Monto','Método','Fecha'];
  const lineas = (d.movs||[]).map(m=>[m.tipo,m.monto,m.metodo_pago||'',m.created_at].map(v=>`"${String(v||'').replace(/"/g,'""')}"`).join(','));
  const csv = '\uFEFF'+[cab.join(','),...lineas].join('\n');
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));
  a.download=`reporte_${window._repDesde}_${window._repHasta}.csv`; a.click();
  toast('Exportado','CSV descargado','ok');
}

function repTarjeta(label, valor, color) {
  return `
    <div class="card" style="padding:1rem; border-top:3px solid ${color};">
      <div style="font-size:1.35rem; font-weight:700; color:var(--texto); line-height:1;">${valor}</div>
      <div style="font-size:0.75rem; color:var(--texto-sub); margin-top:0.3rem;">${label}</div>
    </div>`;
}


// ── Caja de error reutilizable ──────────────────────────────
function errorBox(titulo, msg) {
  return `
    <div class="card" style="border-color:#FECACA; background:#FEF2F2;">
      <div style="font-weight:700; color:var(--rojo); margin-bottom:0.4rem;">${escapeHtml(titulo)}</div>
      <div style="font-size:0.85rem; color:#991B1B;">${escapeHtml(msg)}</div>
    </div>`;
}
// ════════════════════════════════════════════════════════════
//  PLAN PRO › RESTAURANTE
//  Carta fija (carta_restaurante) + Menú del día (menu_dia)
//  Mesas configurables (config_restaurante)
// ════════════════════════════════════════════════════════════
let _restCartaFija = [], _restMenuDia = [], _restComandas = [],
    _restPedidoActual = [], _restMesaActual = null, _restNumMesas = 12;

async function moduloRestaurante() {
  skeleton();
  try {
    if (!SESSION.turnoActivo) SESSION.turnoActivo = await getTurnoAbierto();

    // Config de mesas
    const { data: cfgRest } = await db.from('config_restaurante')
      .select('*').eq('hotel_id', SESSION.hotel.id).single();
    _restNumMesas = cfgRest?.num_mesas || 12;

    // Carta fija (bebidas, snacks, etc.)
    const { data: cartaFija } = await db.from('carta_restaurante')
      .select('*').eq('hotel_id', SESSION.hotel.id).eq('activo', true).order('categoria').order('nombre');
    _restCartaFija = cartaFija || [];

    // Menú del día (fecha de hoy)
    const hoy = new Date().toISOString().slice(0,10);
    const { data: menuDia } = await db.from('menu_dia')
      .select('*').eq('hotel_id', SESSION.hotel.id).eq('fecha', hoy).eq('activo', true).order('nombre');
    _restMenuDia = menuDia || [];

    // Comandas activas
    const { data: todasComandas } = await db.from('ventas_directas')
      .select('*, items_venta_directa(*)')
      .eq('hotel_id', SESSION.hotel.id)
      .like('notas', 'MESA:%')
      .order('created_at', { ascending: false }).limit(100);
    _restComandas = (todasComandas||[]).filter(c=>{
      const n = c.notas||'';
      return n.includes('ESTADO:abierta') || n.includes('ESTADO:preparando') || n.includes('ESTADO:listo');
    });

    const mesasOcupadas = new Set();
    _restComandas.forEach(c=>{ const m=(c.notas||'').match(/MESA:(\d+)/); if(m) mesasOcupadas.add(parseInt(m[1])); });
    renderRestaurante(mesasOcupadas);
  } catch(err) { contenido().innerHTML = errorBox('No se pudo cargar el restaurante', err.message); }
}

function renderRestaurante(mesasOcupadas) {
  const avisoTurno = !SESSION.turnoActivo
    ? `<div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:0.7rem 1rem;margin-bottom:1rem;font-size:0.83rem;color:#92400E;">⚠️ Abre un turno de caja antes de cobrar. <a href="#" onclick="navegarA('caja');return false;" style="font-weight:600;color:#92400E;text-decoration:underline;">Ir a Caja</a></div>` : '';

  contenido().innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;margin-bottom:1.25rem;">
      <div style="display:flex;align-items:center;gap:1rem;">
        <div style="width:52px;height:52px;border-radius:14px;background:#FFF7ED;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg viewBox="0 0 24 24" fill="none" stroke="#EA580C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:26px;height:26px;"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>
        </div>
        <div>
          <h1 style="font-size:1.5rem;font-weight:700;color:var(--texto);margin:0;">Restaurante</h1>
          <p style="font-size:0.83rem;color:var(--texto-sub);margin:0.2rem 0 0;">Selecciona una mesa para tomar el pedido</p>
        </div>
      </div>
      <div style="display:flex;gap:0.5rem;align-items:center;">
        <span style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:999px;padding:0.3rem 0.85rem;font-size:0.78rem;font-weight:600;color:#16A34A;">🟢 ${_restNumMesas - mesasOcupadas.size} libres</span>
        <span style="background:#FEF2F2;border:1px solid #FECACA;border-radius:999px;padding:0.3rem 0.85rem;font-size:0.78rem;font-weight:600;color:#DC2626;">🔴 ${mesasOcupadas.size} ocupadas</span>
        <button onclick="abrirConfigRestaurante()" style="width:auto;padding:0.4rem 0.75rem;background:white;border:1px solid var(--gris-borde);border-radius:8px;font-size:0.78rem;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:0.35rem;color:var(--texto-sub);">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          Config
        </button>
      </div>
    </div>

    ${avisoTurno}

    <div style="display:flex;gap:1rem;margin-bottom:1.25rem;font-size:0.8rem;color:var(--texto-sub);">
      <span style="display:flex;align-items:center;gap:0.35rem;"><span style="width:10px;height:10px;border-radius:50%;background:#16A34A;"></span>Libre</span>
      <span style="display:flex;align-items:center;gap:0.35rem;"><span style="width:10px;height:10px;border-radius:50%;background:#DC2626;"></span>Ocupada</span>
      <span style="display:flex;align-items:center;gap:0.35rem;"><span style="width:10px;height:10px;border-radius:50%;background:#CA8A04;"></span>Preparando</span>
      <span style="display:flex;align-items:center;gap:0.35rem;"><span style="width:10px;height:10px;border-radius:50%;background:#2563EB;"></span>Listo para servir</span>
    </div>

    <!-- Grid de mesas -->
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:1rem;margin-bottom:1.5rem;">
      ${Array.from({length:_restNumMesas},(_,i)=>{
        const num=i+1;
        const comanda=_restComandas.find(c=>(c.notas||'').includes('MESA:'+num));
        const ocupada=mesasOcupadas.has(num);
        const enPrep=comanda&&(comanda.notas||'').includes('ESTADO:preparando');
        const enListo=comanda&&(comanda.notas||'').includes('ESTADO:listo');
        const total=comanda?(comanda.items_venta_directa||[]).reduce((s,it)=>s+Number(it.subtotal||0),0):0;
        const color=enListo?'#2563EB':enPrep?'#CA8A04':ocupada?'#DC2626':'#16A34A';
        const bg=enListo?'#EFF6FF':enPrep?'#FEFCE8':ocupada?'#FEF2F2':'#F0FDF4';
        const label=enListo?'✅ Listo':enPrep?'Preparando':ocupada?'Ocupada':'Libre';
        return `<div onclick="abrirMesaRestaurante(${num})" style="background:white;border:2px solid ${color};border-radius:14px;padding:1rem;cursor:pointer;text-align:center;transition:box-shadow 0.15s,transform 0.1s;" onmouseover="this.style.boxShadow='0 6px 20px rgba(0,0,0,0.1)';this.style.transform='translateY(-2px)'" onmouseout="this.style.boxShadow='none';this.style.transform='translateY(0)'">
          <div style="font-size:1.75rem;margin-bottom:0.3rem;">🍽️</div>
          <div style="font-size:1rem;font-weight:800;">Mesa ${num}</div>
          <div style="font-size:0.7rem;font-weight:700;color:${color};background:${bg};border-radius:999px;padding:0.15rem 0.5rem;margin:0.35rem auto 0;display:inline-block;">${label}</div>
          ${ocupada?`<div style="font-size:0.78rem;font-weight:600;color:var(--verde);margin-top:0.3rem;">${soles(total)}</div>`:''}
        </div>`;
      }).join('')}
    </div>

    <!-- Comandas activas -->
    ${_restComandas.length?`
    <div class="card">
      <div style="font-weight:700;margin-bottom:0.75rem;">📋 Comandas activas (${_restComandas.length})</div>
      ${_restComandas.map(c=>{
        const mesa=((c.notas||'').match(/MESA:(\d+)/)||[])[1]||'?';
        const items=c.items_venta_directa||[];
        const total=items.reduce((s,it)=>s+Number(it.subtotal||0),0);
        const enPrep=(c.notas||'').includes('ESTADO:preparando');
        const enListo=(c.notas||'').includes('ESTADO:listo');
        const estadoColor = enListo?'#2563EB':enPrep?'#CA8A04':'#DC2626';
        const estadoBg    = enListo?'#EFF6FF':enPrep?'#FEFCE8':'#FEF2F2';
        const estadoLabel = enListo?'✅ Listo':enPrep?'Preparando':'Abierta';
        return `<div style="display:flex;align-items:center;gap:1rem;padding:0.6rem 0;border-bottom:1px solid var(--gris-borde);">
          <span style="font-weight:700;min-width:60px;">Mesa ${mesa}</span>
          <span style="flex:1;font-size:0.78rem;color:var(--texto-sub);">${items.length} ítem(s)</span>
          <span style="font-size:0.7rem;font-weight:700;color:${estadoColor};background:${estadoBg};padding:0.2rem 0.55rem;border-radius:999px;">${estadoLabel}</span>
          <span style="font-weight:700;color:var(--verde);">${soles(total)}</span>
          <button onclick="abrirMesaRestaurante(${mesa})" style="${ST.btnSec};padding:0.3rem 0.6rem;font-size:0.78rem;">Ver</button>
        </div>`;
      }).join('')}
    </div>`:''}

    <!-- Accesos rápidos gestión carta -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-top:1rem;" class="rep-grid">
      <button onclick="abrirGestionCarta()" style="padding:0.85rem;background:white;border:1.5px solid var(--gris-borde);border-radius:12px;cursor:pointer;text-align:left;display:flex;align-items:center;gap:0.75rem;">
        <div style="width:38px;height:38px;border-radius:10px;background:#FFF7ED;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:1.25rem;">🥤</div>
        <div><div style="font-weight:700;font-size:0.9rem;">Carta fija</div><div style="font-size:0.75rem;color:var(--texto-sub);">${_restCartaFija.length} productos · bebidas, snacks, etc.</div></div>
      </button>
      <button onclick="abrirGestionMenuDia()" style="padding:0.85rem;background:white;border:1.5px solid var(--gris-borde);border-radius:12px;cursor:pointer;text-align:left;display:flex;align-items:center;gap:0.75rem;">
        <div style="width:38px;height:38px;border-radius:10px;background:#F0FDF4;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:1.25rem;">🍽️</div>
        <div><div style="font-weight:700;font-size:0.9rem;">Menú del día</div><div style="font-size:0.75rem;color:var(--texto-sub);">${_restMenuDia.length} platos hoy · se actualiza diario</div></div>
      </button>
    </div>
  `;
}

// ── Configuración: número de mesas ──────────────────────────
function abrirConfigRestaurante() {
  abrirModal('Configuración del restaurante', `
    <div style="${ST.grupo}">
      <label style="${ST.label}">Número de mesas (1 - 30)</label>
      <input style="${ST.input}" id="cfg-num-mesas" type="number" min="1" max="30" value="${_restNumMesas}">
    </div>
    <div style="background:#EFF6FF;border-radius:10px;padding:0.75rem;font-size:0.82rem;color:#1D4ED8;margin-bottom:1rem;">
      💡 Puedes tener entre 1 y 30 mesas. Los cambios se aplican inmediatamente.
    </div>
    <button style="${ST.btnPri}" onclick="guardarConfigRestaurante()">Guardar configuración</button>
  `, { ancho:'380px' });
}

async function guardarConfigRestaurante() {
  const num = parseInt(document.getElementById('cfg-num-mesas')?.value) || 12;
  if (num < 1 || num > 30) { toast('Entre 1 y 30 mesas','','warn'); return; }
  try {
    await db.from('config_restaurante').upsert({
      hotel_id: SESSION.hotel.id, num_mesas: num, updated_at: new Date().toISOString()
    }, { onConflict: 'hotel_id' });
    _restNumMesas = num;
    cerrarModal();
    toast('✅ Guardado', `${num} mesas configuradas`, 'ok');
    moduloRestaurante();
  } catch(err) { toast('Error', err.message, 'error'); }
}

// ── Gestión carta fija ───────────────────────────────────────
function abrirGestionCarta() {
  const cats = ['bebidas','snacks','postres','otros'];
  abrirModal('Carta fija del restaurante', `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
      <span style="font-size:0.83rem;color:var(--texto-sub);">${_restCartaFija.length} productos</span>
      <button onclick="abrirFormProductoCarta()" style="width:auto;padding:0.45rem 0.9rem;background:var(--azul);color:white;border:none;border-radius:8px;font-size:0.82rem;font-weight:600;cursor:pointer;">+ Agregar</button>
    </div>
    <div id="lista-carta-fija">
      ${_restCartaFija.length===0
        ? `<div style="text-align:center;color:var(--texto-sub);padding:1.5rem 0;font-size:0.85rem;">Sin productos aún. Agrega bebidas, snacks, etc.</div>`
        : _restCartaFija.map(p=>`
          <div style="display:flex;align-items:center;gap:0.75rem;padding:0.6rem 0;border-bottom:1px solid var(--gris-borde);">
            <div style="font-size:1.25rem;">${p.categoria==='bebidas'?'🥤':p.categoria==='snacks'?'🍿':p.categoria==='postres'?'🍰':'🍽️'}</div>
            <div style="flex:1;">
              <div style="font-weight:600;font-size:0.88rem;">${escapeHtml(p.nombre)}</div>
              <div style="font-size:0.72rem;color:var(--texto-sub);">${escapeHtml(p.categoria)}</div>
            </div>
            <div style="font-weight:700;color:var(--verde);">${soles(p.precio)}</div>
            <button onclick="eliminarProductoCarta('${p.id}')" style="background:none;border:none;cursor:pointer;color:var(--rojo);font-size:1rem;padding:0.25rem;">✕</button>
          </div>`).join('')}
    </div>
  `, { ancho:'480px' });
}

function abrirFormProductoCarta() {
  const cats = ['bebidas','snacks','postres','otros'];
  abrirModal('Agregar a carta fija', `
    <div style="${ST.grupo}"><label style="${ST.label}">Nombre *</label>
      <input style="${ST.input}" id="carta-nombre" placeholder="Ej: Gaseosa 500ml">
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.65rem;">
      <div style="${ST.grupo}"><label style="${ST.label}">Categoría</label>
        <select style="${ST.input}" id="carta-cat">
          ${cats.map(c=>`<option value="${c}">${c.charAt(0).toUpperCase()+c.slice(1)}</option>`).join('')}
        </select>
      </div>
      <div style="${ST.grupo}"><label style="${ST.label}">Precio *</label>
        <input style="${ST.input}" id="carta-precio" type="number" step="0.50" min="0" placeholder="5.00">
      </div>
    </div>
    <button style="${ST.btnPri}" onclick="guardarProductoCarta()">Agregar a la carta</button>
  `, { ancho:'400px' });
}

async function guardarProductoCarta() {
  const nombre = document.getElementById('carta-nombre')?.value?.trim();
  const precio = parseFloat(document.getElementById('carta-precio')?.value);
  const cat    = document.getElementById('carta-cat')?.value || 'bebidas';
  if (!nombre) { toast('Escribe el nombre','','warn'); return; }
  if (!precio || precio <= 0) { toast('Escribe el precio','','warn'); return; }
  try {
    const { data } = await db.from('carta_restaurante').insert({
      hotel_id: SESSION.hotel.id, nombre, categoria: cat, precio
    }).select().single();
    _restCartaFija.push(data);
    cerrarModal();
    toast('✅ Producto agregado', nombre, 'ok');
    abrirGestionCarta();
  } catch(err) { toast('Error', err.message, 'error'); }
}

async function eliminarProductoCarta(id) {
  if (!confirm('¿Eliminar este producto de la carta?')) return;
  try {
    await db.from('carta_restaurante').delete().eq('id', id);
    _restCartaFija = _restCartaFija.filter(p=>p.id!==id);
    abrirGestionCarta();
    toast('Producto eliminado','','ok');
  } catch(err) { toast('Error', err.message, 'error'); }
}

// ── Gestión menú del día ─────────────────────────────────────
function abrirGestionMenuDia() {
  const hoy = new Date().toLocaleDateString('es-PE', {weekday:'long', day:'numeric', month:'long'});
  abrirModal('Menú del día', `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
      <span style="font-size:0.8rem;color:var(--texto-sub);">📅 ${hoy} · ${_restMenuDia.length} platos</span>
      <div style="display:flex;gap:0.5rem;">
        <button onclick="limpiarMenuDia()" style="width:auto;padding:0.4rem 0.7rem;background:#FEF2F2;color:var(--rojo);border:1px solid #FECACA;border-radius:8px;font-size:0.78rem;font-weight:600;cursor:pointer;">Limpiar todo</button>
        <button onclick="abrirFormMenuDia()" style="width:auto;padding:0.4rem 0.7rem;background:var(--azul);color:white;border:none;border-radius:8px;font-size:0.82rem;font-weight:600;cursor:pointer;">+ Agregar plato</button>
      </div>
    </div>
    <div id="lista-menu-dia">
      ${_restMenuDia.length===0
        ? `<div style="text-align:center;color:var(--texto-sub);padding:1.5rem 0;font-size:0.85rem;">Sin platos hoy. Agrega los del día.</div>`
        : _restMenuDia.map(p=>`
          <div style="display:flex;align-items:center;gap:0.75rem;padding:0.6rem 0;border-bottom:1px solid var(--gris-borde);">
            <div style="font-size:1.25rem;">🍽️</div>
            <div style="flex:1;">
              <div style="font-weight:600;font-size:0.88rem;">${escapeHtml(p.nombre)}</div>
              ${p.descripcion?`<div style="font-size:0.72rem;color:var(--texto-sub);">${escapeHtml(p.descripcion)}</div>`:''}
            </div>
            <div style="font-weight:700;color:var(--verde);">${soles(p.precio)}</div>
            <button onclick="eliminarPlato('${p.id}')" style="background:none;border:none;cursor:pointer;color:var(--rojo);font-size:1rem;padding:0.25rem;">✕</button>
          </div>`).join('')}
    </div>
  `, { ancho:'480px' });
}

function abrirFormMenuDia() {
  abrirModal('Agregar plato del día', `
    <div style="${ST.grupo}"><label style="${ST.label}">Nombre del plato *</label>
      <input style="${ST.input}" id="menu-nombre" placeholder="Ej: Lomo saltado">
    </div>
    <div style="${ST.grupo}"><label style="${ST.label}">Descripción (opcional)</label>
      <input style="${ST.input}" id="menu-desc" placeholder="Ej: Con arroz y papas fritas">
    </div>
    <div style="${ST.grupo}"><label style="${ST.label}">Precio *</label>
      <input style="${ST.input}" id="menu-precio" type="number" step="0.50" min="0" placeholder="15.00">
    </div>
    <button style="${ST.btnPri}" onclick="guardarPlatoMenuDia()">Agregar al menú de hoy</button>
  `, { ancho:'400px' });
}

async function guardarPlatoMenuDia() {
  const nombre = document.getElementById('menu-nombre')?.value?.trim();
  const desc   = document.getElementById('menu-desc')?.value?.trim();
  const precio = parseFloat(document.getElementById('menu-precio')?.value);
  if (!nombre) { toast('Escribe el nombre','','warn'); return; }
  if (!precio || precio <= 0) { toast('Escribe el precio','','warn'); return; }
  const hoy = new Date().toISOString().slice(0,10);
  try {
    const { data } = await db.from('menu_dia').insert({
      hotel_id: SESSION.hotel.id, fecha: hoy, nombre, descripcion: desc||null, precio
    }).select().single();
    _restMenuDia.push(data);
    cerrarModal();
    toast('✅ Plato agregado', nombre, 'ok');
    abrirGestionMenuDia();
  } catch(err) { toast('Error', err.message, 'error'); }
}

async function eliminarPlato(id) {
  if (!confirm('¿Eliminar este plato del menú?')) return;
  try {
    await db.from('menu_dia').delete().eq('id', id);
    _restMenuDia = _restMenuDia.filter(p=>p.id!==id);
    abrirGestionMenuDia();
    toast('Plato eliminado','','ok');
  } catch(err) { toast('Error', err.message, 'error'); }
}

async function limpiarMenuDia() {
  if (!confirm('¿Limpiar todos los platos del menú de hoy?')) return;
  const hoy = new Date().toISOString().slice(0,10);
  try {
    await db.from('menu_dia').delete().eq('hotel_id', SESSION.hotel.id).eq('fecha', hoy);
    _restMenuDia = [];
    abrirGestionMenuDia();
    toast('Menú del día limpiado','Listo para el nuevo menú','ok');
  } catch(err) { toast('Error', err.message, 'error'); }
}

// ── Vista de comanda por mesa ────────────────────────────────
async function abrirMesaRestaurante(numMesa) {
  _restMesaActual = numMesa;
  const comanda = _restComandas.find(c=>(c.notas||'').includes('MESA:'+numMesa));
  _restPedidoActual = comanda
    ? (comanda.items_venta_directa||[]).map(it=>({ producto_id:it.producto_id, descripcion:it.descripcion, cantidad:it.cantidad, precio:Number(it.precio_unitario), subtotal:Number(it.subtotal||0), tipo:it.tipo||'carta' }))
    : [];
  const { data: estadias } = await db.from('estadias_reservas')
    .select('id, habitaciones(numero), huespedes(nombres,apellidos)')
    .eq('hotel_id', SESSION.hotel.id).eq('estado','activa');
  renderComandaMesa(numMesa, comanda, estadias||[]);
}

function renderComandaMesa(numMesa, comandaExistente, estadias) {
  const totalPedido = _restPedidoActual.reduce((s,i)=>s+i.subtotal,0);
  const enPrep = comandaExistente&&(comandaExistente.notas||'').includes('ESTADO:preparando');

  // Unir carta fija + menú del día para mostrar en la comanda
  const cartaFijaConTipo = _restCartaFija.map(p=>({...p, _tipo:'carta'}));
  const menuDiaConTipo   = _restMenuDia.map(p=>({...p, _tipo:'menu'}));
  const todaLaCarta      = [...menuDiaConTipo, ...cartaFijaConTipo];
  const categorias       = [...new Set(todaLaCarta.map(p=>p._tipo==='menu'?'🍽️ Menú del día':p.categoria||'otros'))];

  contenido().innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;margin-bottom:1.25rem;">
      <div style="display:flex;align-items:center;gap:0.75rem;">
        <button onclick="moduloRestaurante()" style="${ST.btnSec};padding:0.5rem 0.85rem;display:flex;align-items:center;gap:0.4rem;font-size:0.83rem;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:15px;height:15px;"><polyline points="15 18 9 12 15 6"/></svg> Mesas
        </button>
        <h1 style="font-size:1.4rem;font-weight:700;color:var(--texto);margin:0;">Mesa ${numMesa}</h1>
        ${enPrep?'<span style="background:#FEFCE8;color:#CA8A04;font-size:0.75rem;font-weight:700;padding:0.2rem 0.65rem;border-radius:999px;">🔥 En cocina</span>':''}
      </div>
      <div style="font-weight:700;font-size:1.15rem;color:var(--verde);">Total: ${soles(totalPedido)}</div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 320px;gap:1.25rem;align-items:start;">
      <!-- Carta -->
      <div>
        <!-- Filtros por sección -->
        <div style="display:flex;gap:0.4rem;flex-wrap:wrap;margin-bottom:1rem;">
          <button onclick="filtrarCarta('todos',this)" class="cat-carta" style="padding:0.4rem 0.85rem;border-radius:999px;font-size:0.8rem;font-weight:600;background:var(--azul);color:white;border:1.5px solid transparent;cursor:pointer;">Todos</button>
          ${_restMenuDia.length?`<button onclick="filtrarCarta('menu',this)" class="cat-carta" style="padding:0.4rem 0.85rem;border-radius:999px;font-size:0.8rem;font-weight:600;background:white;color:var(--texto-sub);border:1.5px solid var(--gris-borde);cursor:pointer;">🍽️ Menú del día</button>`:''}
          ${[...new Set(_restCartaFija.map(p=>p.categoria||'otros'))].map(c=>`<button onclick="filtrarCarta('${escapeHtml(c)}',this)" class="cat-carta" style="padding:0.4rem 0.85rem;border-radius:999px;font-size:0.8rem;font-weight:600;background:white;color:var(--texto-sub);border:1.5px solid var(--gris-borde);cursor:pointer;">${c==='bebidas'?'🥤 ':c==='snacks'?'🍿 ':c==='postres'?'🍰 ':''}${escapeHtml(c.charAt(0).toUpperCase()+c.slice(1))}</button>`).join('')}
        </div>

        <!-- Sin productos -->
        ${todaLaCarta.length===0?`
          <div style="background:white;border:1.5px dashed var(--gris-borde);border-radius:14px;padding:2rem;text-align:center;color:var(--texto-sub);">
            <div style="font-size:2rem;margin-bottom:0.5rem;">🍽️</div>
            <div style="font-weight:600;margin-bottom:0.35rem;">Sin carta configurada</div>
            <div style="font-size:0.82rem;">Agrega productos desde la pantalla principal del restaurante.</div>
          </div>
        `:`
        <!-- Grid de platos -->
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:0.75rem;" id="carta-grid">

          <!-- Menú del día primero -->
          ${_restMenuDia.map(p=>`
            <div class="plato-card" data-cat="menu" onclick="agregarAlPedido('menu_${p.id}','${escapeHtml(p.nombre).replace(/'/g,"\\'")}',${p.precio},'menu')"
              style="background:linear-gradient(135deg,#F0FDF4,#DCFCE7);border:1.5px solid #16A34A;border-radius:14px;padding:1rem;cursor:pointer;transition:box-shadow 0.15s;"
              onmouseover="this.style.boxShadow='0 4px 14px rgba(22,163,74,0.2)'"
              onmouseout="this.style.boxShadow='none'">
              <div style="font-size:1.6rem;text-align:center;margin-bottom:0.4rem;">🍽️</div>
              <div style="font-weight:700;font-size:0.83rem;text-align:center;margin-bottom:0.2rem;">${escapeHtml(p.nombre)}</div>
              ${p.descripcion?`<div style="font-size:0.68rem;color:#16A34A;text-align:center;margin-bottom:0.25rem;">${escapeHtml(p.descripcion)}</div>`:''}
              <div style="font-weight:700;color:#16A34A;text-align:center;">${soles(p.precio)}</div>
              <div style="font-size:0.65rem;font-weight:700;color:white;background:#16A34A;border-radius:999px;padding:0.1rem 0.5rem;margin:0.35rem auto 0;display:inline-block;width:100%;text-align:center;">MENÚ HOY</div>
            </div>`).join('')}

          <!-- Carta fija -->
          ${_restCartaFija.map(p=>`
            <div class="plato-card" data-cat="${escapeHtml(p.categoria||'otros')}" onclick="agregarAlPedido('carta_${p.id}','${escapeHtml(p.nombre).replace(/'/g,"\\'")}',${p.precio},'carta')"
              style="background:white;border:1.5px solid var(--gris-borde);border-radius:14px;padding:1rem;cursor:pointer;transition:border-color 0.15s,box-shadow 0.15s;"
              onmouseover="this.style.borderColor='var(--azul)';this.style.boxShadow='0 4px 12px rgba(37,99,235,0.15)'"
              onmouseout="this.style.borderColor='var(--gris-borde)';this.style.boxShadow='none'">
              <div style="font-size:1.6rem;text-align:center;margin-bottom:0.4rem;">${p.categoria==='bebidas'?'🥤':p.categoria==='snacks'?'🍿':p.categoria==='postres'?'🍰':'☕'}</div>
              <div style="font-weight:600;font-size:0.83rem;text-align:center;margin-bottom:0.25rem;">${escapeHtml(p.nombre)}</div>
              <div style="font-weight:700;color:var(--verde);text-align:center;">${soles(p.precio)}</div>
            </div>`).join('')}
        </div>`}
      </div>

      <!-- Panel pedido -->
      <div style="background:white;border:1px solid var(--gris-borde);border-radius:16px;padding:1.25rem;position:sticky;top:80px;">
        <div style="font-weight:700;font-size:1rem;margin-bottom:0.85rem;">🧾 Pedido — Mesa ${numMesa}</div>
        <div id="pedido-items" style="min-height:80px;max-height:280px;overflow-y:auto;margin-bottom:1rem;">${renderItemsPedido()}</div>
        <div style="border-top:2px solid var(--gris-borde);padding-top:0.85rem;margin-bottom:1rem;">
          <div style="display:flex;justify-content:space-between;font-weight:700;font-size:1.1rem;">
            <span>Total</span><span style="color:var(--verde);" id="pedido-total">${soles(totalPedido)}</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:0.5rem;">
          <button onclick="enviarComandaCocina(${numMesa},${comandaExistente?`'${comandaExistente.id}'`:'null'})"
            style="width:100%;padding:0.75rem;background:linear-gradient(135deg,#EA580C,#F97316);color:white;border:none;border-radius:10px;font-size:0.9rem;font-weight:700;cursor:pointer;">
            ${comandaExistente?'🔄 Actualizar comanda':'🔥 Enviar a cocina'}
          </button>
          ${_restPedidoActual.length?`
          <button onclick="abrirCobroMesa(${numMesa},${comandaExistente?`'${comandaExistente.id}'`:'null'},'directo')"
            style="width:100%;padding:0.7rem;background:linear-gradient(135deg,var(--azul),#2563EB);color:white;border:none;border-radius:10px;font-size:0.88rem;font-weight:600;cursor:pointer;">
            💳 Cobrar en caja
          </button>
          <button onclick="abrirCobroMesa(${numMesa},${comandaExistente?`'${comandaExistente.id}'`:'null'},'habitacion')"
            style="width:100%;padding:0.7rem;background:#F0FDF4;color:#16A34A;border:1.5px solid #16A34A;border-radius:10px;font-size:0.88rem;font-weight:600;cursor:pointer;">
            🛏️ Cargar a habitación
          </button>`:''}
          ${comandaExistente?`
          <button onclick="cancelarComanda('${comandaExistente.id}',${numMesa})"
            style="width:100%;padding:0.6rem;background:none;border:1px solid var(--gris-borde);border-radius:10px;font-size:0.82rem;color:var(--texto-sub);cursor:pointer;">
            Cancelar comanda
          </button>`:''}
        </div>
      </div>
    </div>
  `;
  window._estadiasActivas = estadias;
}

function renderItemsPedido() {
  if (!_restPedidoActual.length) return `<div style="text-align:center;color:var(--texto-sub);padding:1.5rem 0;font-size:0.85rem;">Toca un plato para agregarlo</div>`;
  return _restPedidoActual.map((it,i)=>`
    <div style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem 0;border-bottom:1px solid var(--gris-borde);">
      <div style="flex:1;min-width:0;">
        <div style="font-size:0.85rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(it.descripcion)}</div>
        <div style="font-size:0.72rem;color:var(--texto-sub);">${soles(it.precio)} c/u</div>
      </div>
      <div style="display:flex;align-items:center;gap:0.25rem;">
        <button onclick="cambiarCantidad(${i},-1)" style="width:24px;height:24px;border:1px solid var(--gris-borde);border-radius:6px;background:white;cursor:pointer;font-weight:700;font-size:0.9rem;display:flex;align-items:center;justify-content:center;">−</button>
        <span style="width:24px;text-align:center;font-weight:700;">${it.cantidad}</span>
        <button onclick="cambiarCantidad(${i},1)" style="width:24px;height:24px;border:1px solid var(--gris-borde);border-radius:6px;background:white;cursor:pointer;font-weight:700;font-size:0.9rem;display:flex;align-items:center;justify-content:center;">+</button>
      </div>
      <span style="font-weight:700;color:var(--verde);min-width:55px;text-align:right;">${soles(it.subtotal)}</span>
    </div>`).join('');
}

function agregarAlPedido(productoId, nombre, precio, tipo) {
  const key = productoId; // 'menu_UUID' o 'carta_UUID'
  const idx = _restPedidoActual.findIndex(i=>i.producto_id===key);
  if (idx>=0) { _restPedidoActual[idx].cantidad++; _restPedidoActual[idx].subtotal=_restPedidoActual[idx].cantidad*_restPedidoActual[idx].precio; }
  else { _restPedidoActual.push({ producto_id:key, descripcion:nombre, cantidad:1, precio:Number(precio), subtotal:Number(precio), tipo:tipo||'carta' }); }
  const el=document.getElementById('pedido-items'); const tot=document.getElementById('pedido-total');
  if(el) el.innerHTML=renderItemsPedido();
  if(tot) tot.textContent=soles(_restPedidoActual.reduce((s,i)=>s+i.subtotal,0));
}

function cambiarCantidad(idx, delta) {
  _restPedidoActual[idx].cantidad+=delta;
  if(_restPedidoActual[idx].cantidad<=0) _restPedidoActual.splice(idx,1);
  else _restPedidoActual[idx].subtotal=_restPedidoActual[idx].cantidad*_restPedidoActual[idx].precio;
  const el=document.getElementById('pedido-items'); const tot=document.getElementById('pedido-total');
  if(el) el.innerHTML=renderItemsPedido();
  if(tot) tot.textContent=soles(_restPedidoActual.reduce((s,i)=>s+i.subtotal,0));
}

function filtrarCarta(cat, btn) {
  document.querySelectorAll('.cat-carta').forEach(b=>{ b.style.background='white'; b.style.color='var(--texto-sub)'; b.style.borderColor='var(--gris-borde)'; });
  btn.style.background='var(--azul)'; btn.style.color='white'; btn.style.borderColor='transparent';
  document.querySelectorAll('.plato-card').forEach(card=>{ card.style.display=(cat==='todos'||card.dataset.cat===cat)?'':'none'; });
}

async function enviarComandaCocina(numMesa, comandaId) {
  if (!_restPedidoActual.length) { toast('Pedido vacío','Agrega al menos un plato','warn'); return; }
  try {
    const total = _restPedidoActual.reduce((s,i)=>s+i.subtotal,0);
    const hora = new Date().toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'});
    const notas = `MESA:${numMesa}|ESTADO:preparando|HORA:${hora}`;
    if (comandaId && comandaId!=='null') {
      await db.from('ventas_directas').update({ total, notas }).eq('id', comandaId);
      await db.from('items_venta_directa').delete().eq('venta_id', comandaId);
    } else {
      const { data: nv } = await db.from('ventas_directas').insert({
        hotel_id: SESSION.hotel.id, turno_caja_id: SESSION.turnoActivo?.id||null,
        total, metodo_pago: null, notas, usuario_id: SESSION.user.id,
      }).select().single();
      comandaId = nv.id;
    }
    await db.from('items_venta_directa').insert(_restPedidoActual.map(it=>({
      hotel_id: SESSION.hotel.id, venta_id: comandaId,
      producto_id: null, descripcion: it.descripcion,
      cantidad: it.cantidad, precio_unitario: it.precio,
    })));
    toast('✅ Comanda enviada',`Mesa ${numMesa} → Cocina`,'ok');
    moduloRestaurante();
  } catch(err) { toast('Error',err.message,'error'); }
}

async function abrirCobroMesa(numMesa, comandaId, tipo) {
  if (!SESSION.turnoActivo) { toast('Abre un turno de caja primero','','warn'); return; }
  const total = _restPedidoActual.reduce((s,i)=>s+i.subtotal,0);
  if (tipo==='habitacion') {
    const estadias = window._estadiasActivas||[];
    abrirModal('Cargar a habitación', `
      <div style="${ST.grupo}"><label style="${ST.label}">Habitación</label>
        <select style="${ST.input}" id="hab-cargo-sel">
          ${estadias.map(e=>`<option value="${e.id}">Hab. ${e.habitaciones?.numero} — ${e.huespedes?.nombres} ${e.huespedes?.apellidos}</option>`).join('')||'<option>Sin estadías activas</option>'}
        </select>
      </div>
      <div style="text-align:center;background:var(--gris-bg);border-radius:10px;padding:1rem;margin:0.75rem 0;">
        <div style="font-size:0.78rem;color:var(--texto-sub);">Total</div>
        <div style="font-size:1.5rem;font-weight:700;color:var(--verde);">${soles(total)}</div>
      </div>
      <button style="${ST.btnPri}" onclick="confirmarCargoHabitacion('${comandaId}',${numMesa})">Confirmar cargo</button>
    `, { ancho:'420px' });
  } else {
    // Verificar si tiene config SUNAT para ofrecer comprobante
    let cfgSunat = null;
    try {
      const { data } = await db.from('configuracion_sunat')
        .select('serie_boleta,correlativo_boleta,serie_factura,correlativo_factura,ruc_emisor')
        .eq('hotel_id', SESSION.hotel.id).single();
      cfgSunat = data;
    } catch(_) {}

    abrirModal(`💳 Cobrar — Mesa ${numMesa}`, `
      <!-- Total -->
      <div style="text-align:center;background:var(--gris-bg);border-radius:12px;padding:1.25rem;margin-bottom:1.1rem;">
        <div style="font-size:0.78rem;color:var(--texto-sub);">Total a cobrar</div>
        <div style="font-size:1.9rem;font-weight:700;color:var(--verde);">${soles(total)}</div>
        <div style="font-size:0.75rem;color:var(--texto-sub);margin-top:0.25rem;">${_restPedidoActual.length} ítem(s)</div>
      </div>

      <!-- Método de pago -->
      <div style="${ST.grupo}"><label style="${ST.label}">Método de pago</label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;" id="metodo-btns">
          ${['efectivo','yape','plin','transferencia'].map((m,i)=>`
            <button onclick="selMetodoCobro('${m}',this)" class="btn-metodo" style="padding:0.6rem;border-radius:9px;border:1.5px solid ${i===0?'var(--azul)':'var(--gris-borde)'};background:${i===0?'#EFF6FF':'white'};font-size:0.85rem;font-weight:600;cursor:pointer;color:${i===0?'var(--azul)':'var(--texto-sub)'};">
              ${m==='efectivo'?'💵':m==='yape'?'📱':m==='plin'?'📲':'🏦'} ${m.charAt(0).toUpperCase()+m.slice(1)}
            </button>`).join('')}
        </div>
        <input type="hidden" id="rest-metodo" value="efectivo">
      </div>

      <!-- Comprobante -->
      <div style="${ST.grupo}"><label style="${ST.label}">Comprobante</label>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.5rem;" id="comp-btns">
          <button onclick="selComprobante('ninguno',this)" class="btn-comp" style="padding:0.55rem;border-radius:9px;border:1.5px solid var(--azul);background:#EFF6FF;font-size:0.8rem;font-weight:600;cursor:pointer;color:var(--azul);">🧾 Sin comp.</button>
          <button onclick="selComprobante('boleta',this)" class="btn-comp" style="padding:0.55rem;border-radius:9px;border:1.5px solid var(--gris-borde);background:white;font-size:0.8rem;font-weight:600;cursor:pointer;color:var(--texto-sub);">📄 Boleta</button>
          <button onclick="selComprobante('factura',this)" class="btn-comp" style="padding:0.55rem;border-radius:9px;border:1.5px solid var(--gris-borde);background:white;font-size:0.8rem;font-weight:600;cursor:pointer;color:var(--texto-sub);">📋 Factura</button>
        </div>
        <input type="hidden" id="rest-comprobante" value="ninguno">
      </div>

      <!-- Datos del cliente (para boleta/factura) -->
      <div id="datos-cliente" style="display:none;">
        <div id="datos-factura" style="display:none;">
          <div style="${ST.grupo}"><label style="${ST.label}">RUC del cliente</label>
            <input style="${ST.input}" id="cli-ruc" placeholder="20123456789" maxlength="11">
          </div>
          <div style="${ST.grupo}"><label style="${ST.label}">Razón social</label>
            <input style="${ST.input}" id="cli-razon" placeholder="Empresa SAC">
          </div>
        </div>
        <div id="datos-boleta" style="display:none;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;">
            <div style="${ST.grupo}"><label style="${ST.label}">Tipo doc.</label>
              <select style="${ST.input}" id="cli-tipo-doc">
                <option value="DNI">DNI</option>
                <option value="CE">Carnet Extranjer.</option>
                <option value="PASAPORTE">Pasaporte</option>
              </select>
            </div>
            <div style="${ST.grupo}"><label style="${ST.label}">N° documento</label>
              <input style="${ST.input}" id="cli-num-doc" placeholder="12345678" maxlength="15">
            </div>
          </div>
          <div style="${ST.grupo}"><label style="${ST.label}">Nombre del cliente (opcional)</label>
            <input style="${ST.input}" id="cli-nombre" placeholder="Opcional">
          </div>
        </div>
      </div>

      <button style="${ST.btnPri}" onclick="confirmarCobroMesa('${comandaId}',${numMesa},${total})">
        ✅ Confirmar cobro
      </button>
    `, { ancho:'420px' });
  }
}

function selMetodoCobro(metodo, btn) {
  document.querySelectorAll('.btn-metodo').forEach(b=>{
    b.style.background='white'; b.style.borderColor='var(--gris-borde)'; b.style.color='var(--texto-sub)';
  });
  btn.style.background='#EFF6FF'; btn.style.borderColor='var(--azul)'; btn.style.color='var(--azul)';
  const inp = document.getElementById('rest-metodo');
  if (inp) inp.value = metodo;
}

function selComprobante(tipo, btn) {
  document.querySelectorAll('.btn-comp').forEach(b=>{
    b.style.background='white'; b.style.borderColor='var(--gris-borde)'; b.style.color='var(--texto-sub)';
  });
  btn.style.background='#EFF6FF'; btn.style.borderColor='var(--azul)'; btn.style.color='var(--azul)';
  const inp = document.getElementById('rest-comprobante');
  if (inp) inp.value = tipo;
  const datosCliente = document.getElementById('datos-cliente');
  const datosFact    = document.getElementById('datos-factura');
  const datosBol     = document.getElementById('datos-boleta');
  if (datosCliente) datosCliente.style.display = tipo==='ninguno' ? 'none' : '';
  if (datosFact)    datosFact.style.display    = tipo==='factura' ? '' : 'none';
  if (datosBol)     datosBol.style.display     = tipo==='boleta'  ? '' : 'none';
}

// ── Helper: normalizar notas para marcar como cobrada ───────
function notasCobrada(notas) {
  return (notas||'')
    .replace('ESTADO:abierta',   'ESTADO:cobrada')
    .replace('ESTADO:preparando','ESTADO:cobrada')
    .replace('ESTADO:listo',     'ESTADO:cobrada');
}

async function confirmarCobroMesa(comandaId, numMesa, total) {
  const metodo     = document.getElementById('rest-metodo')?.value||'efectivo';
  const comprobante= document.getElementById('rest-comprobante')?.value||'ninguno';
  try {
    // 1. Movimiento de caja
    await db.from('movimientos_caja').insert({
      hotel_id: SESSION.hotel.id, turno_caja_id: SESSION.turnoActivo.id,
      tipo:'ingreso', concepto:`Restaurante Mesa ${numMesa}`,
      monto: total, metodo_pago: metodo, referencia_tipo:'venta_directa',
      referencia_id:(comandaId&&comandaId!=='null')?comandaId:null,
      usuario_id: SESSION.user.id,
    });

    // 2. Marcar comanda como cobrada (incluye estado listo)
    if (comandaId&&comandaId!=='null') {
      const { data:cv } = await db.from('ventas_directas').select('notas').eq('id',comandaId).single();
      await db.from('ventas_directas').update({
        metodo_pago: metodo,
        notas: notasCobrada(cv?.notas)
      }).eq('id', comandaId);
    }

    // 3. Emitir comprobante SUNAT si solicitó boleta o factura
    if (comprobante !== 'ninguno') {
      try {
        const { data: cfg } = await db.from('configuracion_sunat')
          .select('*').eq('hotel_id', SESSION.hotel.id).single();
        if (cfg) {
          const esFact = comprobante === 'factura';
          const serie  = esFact ? cfg.serie_factura   : cfg.serie_boleta;
          const corr   = esFact ? cfg.correlativo_factura : cfg.correlativo_boleta;
          const igv    = parseFloat((total * 0.18 / 1.18).toFixed(2));

          // Datos del receptor
          const rucRec    = esFact ? (document.getElementById('cli-ruc')?.value?.trim()||'')    : '';
          const razonRec  = esFact ? (document.getElementById('cli-razon')?.value?.trim()||'')  : (document.getElementById('cli-nombre')?.value?.trim()||'');
          const numDoc    = !esFact ? (document.getElementById('cli-num-doc')?.value?.trim()||'') : '';
          const tipoDocCli= !esFact ? (document.getElementById('cli-tipo-doc')?.value||'DNI')     : '';

          await db.from('comprobantes_sunat').insert({
            hotel_id: SESSION.hotel.id,
            venta_directa_id: (comandaId&&comandaId!=='null')?comandaId:null,
            tipo_doc: comprobante,
            serie, correlativo: corr,
            ruc_emisor: cfg.ruc_emisor || SESSION.hotel.ruc || '',
            ruc_receptor: esFact ? rucRec : numDoc,
            razon_social_rec: razonRec || null,
            total, igv,
            estado_sunat: 'PENDIENTE_ENVIO',
          });

          // Incrementar correlativo
          const campo = esFact ? 'correlativo_factura' : 'correlativo_boleta';
          await db.from('configuracion_sunat').update({ [campo]: corr+1 }).eq('hotel_id', SESSION.hotel.id);

          toast(`✅ Cobrado + ${comprobante} emitida`,`${serie}-${String(corr).padStart(8,'0')} por ${soles(total)}`,'ok');
        } else {
          toast('✅ Cobrado','Configura SUNAT para emitir comprobantes','ok');
        }
      } catch(e) {
        toast('✅ Cobrado (sin comprobante)',`Error SUNAT: ${e.message}`,'warn');
      }
    } else {
      toast('✅ Cobrado',`Mesa ${numMesa} — ${soles(total)}`,'ok');
    }

    cerrarModal();
    moduloRestaurante();
  } catch(err) { toast('Error',err.message,'error'); }
}

async function confirmarCargoHabitacion(comandaId, numMesa) {
  const estadiaId = document.getElementById('hab-cargo-sel')?.value;
  if (!estadiaId) { toast('Selecciona una habitación','','warn'); return; }
  const total = _restPedidoActual.reduce((s,i)=>s+i.subtotal,0);
  try {
    for (const it of _restPedidoActual) {
      await db.from('consumos_estadia').insert({
        hotel_id: SESSION.hotel.id, estadia_id: estadiaId,
        producto_id: null, descripcion:`[Rest.] ${it.descripcion}`,
        cantidad: it.cantidad, precio_unitario: it.precio,
        turno_caja_id: SESSION.turnoActivo?.id||null, usuario_id: SESSION.user.id,
      });
    }
    if (comandaId&&comandaId!=='null') {
      const { data:cv } = await db.from('ventas_directas').select('notas').eq('id',comandaId).single();
      await db.from('ventas_directas').update({ metodo_pago:'mixto', notas: notasCobrada(cv?.notas) }).eq('id',comandaId);
    }
    cerrarModal(); toast('✅ Cargado a habitación',`${soles(total)} agregado`,'ok');
    moduloRestaurante();
  } catch(err) { toast('Error',err.message,'error'); }
}

async function cancelarComanda(comandaId, numMesa) {
  if (!confirm(`¿Cancelar comanda Mesa ${numMesa}?`)) return;
  try {
    const { data:cv } = await db.from('ventas_directas').select('notas').eq('id',comandaId).single();
    await db.from('ventas_directas').update({ notas:(cv?.notas||'').replace('ESTADO:preparando','ESTADO:cancelada').replace('ESTADO:abierta','ESTADO:cancelada') }).eq('id',comandaId);
    toast('Comanda cancelada','','ok'); moduloRestaurante();
  } catch(err) { toast('Error',err.message,'error'); }
}

// ════════════════════════════════════════════════════════════
//  PLAN PRO › COCINA / COMANDAS — Kanban en tiempo real
// ════════════════════════════════════════════════════════════
async function moduloCocina() {
  skeleton();
  try {
    await cargarYRenderCocina();
    if (window._cocinaTicker) clearInterval(window._cocinaTicker);
    window._cocinaTicker = setInterval(()=>{ if(moduloActual==='cocina') cargarYRenderCocina(); }, 20000);
  } catch(err) { contenido().innerHTML = errorBox('No se pudo cargar cocina', err.message); }
}

async function cargarYRenderCocina() {
  const { data: comandas } = await db.from('ventas_directas')
    .select('*, items_venta_directa(*)')
    .eq('hotel_id', SESSION.hotel.id)
    .like('notas','MESA:%')
    .order('created_at',{ascending:true}).limit(100);
  const activas = (comandas||[]).filter(c=>{ const n=c.notas||''; return n.includes('ESTADO:preparando')||n.includes('ESTADO:abierta')||n.includes('ESTADO:listo'); });
  const pendientes = activas.filter(c=>(c.notas||'').includes('ESTADO:abierta'));
  const preparando = activas.filter(c=>(c.notas||'').includes('ESTADO:preparando'));
  const listos     = activas.filter(c=>(c.notas||'').includes('ESTADO:listo'));

  contenido().innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;margin-bottom:1.25rem;">
      <div style="display:flex;align-items:center;gap:1rem;">
        <div style="width:52px;height:52px;border-radius:14px;background:#F0FDF4;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:26px;height:26px;"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/><line x1="6" y1="17" x2="18" y2="17"/></svg>
        </div>
        <div>
          <h1 style="font-size:1.5rem;font-weight:700;color:var(--texto);margin:0;">Cocina / Comandas</h1>
          <p style="font-size:0.83rem;color:var(--texto-sub);margin:0.2rem 0 0;">Panel en tiempo real · Auto-actualiza cada 20s</p>
        </div>
      </div>
      <button onclick="cargarYRenderCocina()" style="${ST.btnSec};padding:0.5rem 0.9rem;display:flex;align-items:center;gap:0.4rem;font-size:0.82rem;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:15px;height:15px;"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        Actualizar
      </button>
    </div>
    ${activas.length===0?`
      <div class="card" style="text-align:center;padding:3rem;">
        <div style="font-size:3rem;margin-bottom:0.75rem;">👨‍🍳</div>
        <div style="font-weight:700;font-size:1.1rem;margin-bottom:0.4rem;">¡Todo al día!</div>
        <div style="font-size:0.85rem;color:var(--texto-sub);">No hay comandas pendientes.</div>
      </div>
    `:`
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem;" class="rep-grid">
      <div>
        <div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.85rem;">
          <div style="width:12px;height:12px;border-radius:50%;background:#DC2626;"></div>
          <span style="font-weight:700;font-size:1rem;">Nuevas</span>
          <span style="background:#FEF2F2;color:#DC2626;font-size:0.72rem;font-weight:700;padding:0.15rem 0.55rem;border-radius:999px;">${pendientes.length}</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:0.75rem;">
          ${pendientes.length===0
            ?`<div style="background:white;border:2px dashed var(--gris-borde);border-radius:14px;padding:2rem;text-align:center;color:var(--texto-sub);font-size:0.83rem;">Sin comandas nuevas</div>`
            :pendientes.map(c=>tarjetaComandaCocina(c,'nueva')).join('')}
        </div>
      </div>
      <div>
        <div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.85rem;">
          <div style="width:12px;height:12px;border-radius:50%;background:#CA8A04;"></div>
          <span style="font-weight:700;font-size:1rem;">Preparando</span>
          <span style="background:#FEFCE8;color:#CA8A04;font-size:0.72rem;font-weight:700;padding:0.15rem 0.55rem;border-radius:999px;">${preparando.length}</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:0.75rem;">
          ${preparando.length===0
            ?`<div style="background:white;border:2px dashed var(--gris-borde);border-radius:14px;padding:2rem;text-align:center;color:var(--texto-sub);font-size:0.83rem;">Nada en preparación</div>`
            :preparando.map(c=>tarjetaComandaCocina(c,'preparando')).join('')}
        </div>
      </div>
      <div>
        <div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.85rem;">
          <div style="width:12px;height:12px;border-radius:50%;background:#2563EB;"></div>
          <span style="font-weight:700;font-size:1rem;">Listo para servir</span>
          <span style="background:#EFF6FF;color:#2563EB;font-size:0.72rem;font-weight:700;padding:0.15rem 0.55rem;border-radius:999px;">${listos.length}</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:0.75rem;">
          ${listos.length===0
            ?`<div style="background:white;border:2px dashed var(--gris-borde);border-radius:14px;padding:2rem;text-align:center;color:var(--texto-sub);font-size:0.83rem;">Sin platos listos</div>`
            :listos.map(c=>tarjetaComandaCocina(c,'listo')).join('')}
        </div>
      </div>
    </div>`}
  `;
}

function tarjetaComandaCocina(comanda, estado) {
  const mesa=((comanda.notas||'').match(/MESA:(\d+)/)||[])[1]||'?';
  const hora=((comanda.notas||'').match(/HORA:([^|]+)/)||[])[1]||'';
  const items=comanda.items_venta_directa||[];
  const minutos=Math.floor((new Date()-new Date(comanda.created_at))/60000);
  const urgente=minutos>15;
  return `
    <div style="background:white;border:1.5px solid ${urgente?'#DC2626':'var(--gris-borde)'};border-radius:14px;padding:1.1rem;${urgente?'box-shadow:0 0 0 3px rgba(220,38,38,0.1);':''}">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem;">
        <div style="display:flex;align-items:center;gap:0.5rem;">
          <span style="font-size:1.25rem;font-weight:800;">Mesa ${mesa}</span>
          ${urgente?`<span style="background:#FEF2F2;color:#DC2626;font-size:0.65rem;font-weight:700;padding:0.15rem 0.5rem;border-radius:999px;">⚠️ ${minutos}min</span>`:`<span style="font-size:0.72rem;color:var(--texto-sub);">${minutos}min</span>`}
        </div>
        <span style="font-size:0.7rem;color:var(--texto-sub);">${hora}</span>
      </div>
      <div style="margin-bottom:0.85rem;">
        ${items.map(it=>`<div style="display:flex;align-items:center;gap:0.5rem;padding:0.3rem 0;border-bottom:1px solid var(--gris-borde);">
          <span style="font-size:1rem;font-weight:700;color:var(--azul);min-width:26px;">×${it.cantidad}</span>
          <span style="font-size:0.85rem;font-weight:500;">${escapeHtml(it.descripcion)}</span>
        </div>`).join('')}
      </div>
      ${estado==='nueva'
        ?`<button onclick="moverComandaCocina('${comanda.id}','preparando')" style="width:100%;padding:0.6rem;background:#EA580C;color:white;border:none;border-radius:9px;font-size:0.82rem;font-weight:700;cursor:pointer;">🔥 Empezar a preparar</button>`
        :estado==='preparando'
        ?`<button onclick="moverComandaCocina('${comanda.id}','listo')" style="width:100%;padding:0.6rem;background:#16A34A;color:white;border:none;border-radius:9px;font-size:0.82rem;font-weight:700;cursor:pointer;">✅ Marcar como listo</button>`
        :`<div style="text-align:center;font-size:0.82rem;font-weight:700;color:#2563EB;padding:0.5rem;background:#EFF6FF;border-radius:9px;">🛎️ Esperando que el mozo lo sirva</div>`}
    </div>`;
}

async function moverComandaCocina(comandaId, nuevoEstado) {
  try {
    const { data:cv } = await db.from('ventas_directas').select('notas').eq('id',comandaId).single();
    const notas=(cv?.notas||'').replace('ESTADO:abierta','ESTADO:'+nuevoEstado).replace('ESTADO:preparando','ESTADO:'+nuevoEstado);
    await db.from('ventas_directas').update({ notas }).eq('id',comandaId);
    if (nuevoEstado==='listo') toast('✅ Plato listo','El mozo puede servir la mesa','ok');
    await cargarYRenderCocina();
  } catch(err) { toast('Error',err.message,'error'); }
}
