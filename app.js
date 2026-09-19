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
    case 'rack':             return moduloRack();
    case 'reservas':         return moduloReservas();
    case 'huespedes':        return moduloHuespedes();
    case 'caja':             return moduloCaja();
    case 'tiendita':         return moduloTiendita();
    case 'limpieza':         return moduloLimpieza();
    // Hotel — configuración (admin)
    case 'habitacion-config': return moduloHabitacionConfig();
    case 'personal':         return moduloPersonal();
    case 'suscripcion':      return moduloMiSuscripcion();
    // Placeholder Fase 5
    case 'facturacion':
    case 'sunat-config':
      contenido().innerHTML = `
        <div style="padding:2rem; color:var(--texto-sub); font-size:0.9rem;">
          Módulo <strong>${escapeHtml(modulo)}</strong> — se implementa en Fase 5 (Facturación SUNAT).
        </div>`;
      return;
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

    const tarjetas = [
      { label: 'MRR (mes actual)',     valor: soles(m.mrr_mes_actual),        color: '#1A3FA6', icon: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>' },
      { label: 'Ingresos acumulados',  valor: soles(m.ingresos_acumulados),   color: '#16A34A', icon: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>' },
      { label: 'Hoteles activos',      valor: m.hoteles_activos,              color: '#2563EB', icon: '<path d="M3 21h18M6 21V7l6-4 6 4v14M10 9h4M10 13h4M10 17h4"/>' },
      { label: 'Suspendidos',          valor: m.hoteles_suspendidos,          color: '#DC2626', icon: '<circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>' },
      { label: 'Vencidos',             valor: m.hoteles_vencidos,             color: '#EA580C', icon: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>' },
      { label: 'Total hoteles',        valor: m.hoteles_total,                color: '#64748B', icon: '<path d="M3 21h18M6 21V7l6-4 6 4v14"/>' },
    ];

    contenido().innerHTML = `
      <div class="seccion-titulo">Dashboard SaaS</div>
      <div class="seccion-sub">Métricas globales de HospedaYa</div>

      <div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:1rem;">
        ${tarjetas.map(t => `
          <div class="card" style="display:flex; align-items:center; gap:1rem;">
            <div style="width:48px; height:48px; border-radius:12px; background:${t.color}15;
                        display:flex; align-items:center; justify-content:center; flex-shrink:0;">
              <svg viewBox="0 0 24 24" fill="none" stroke="${t.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:22px;height:22px;">${t.icon}</svg>
            </div>
            <div>
              <div style="font-size:1.5rem; font-weight:700; color:var(--texto); line-height:1;">${t.valor}</div>
              <div style="font-size:0.78rem; color:var(--texto-sub); margin-top:0.25rem;">${t.label}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <div style="margin-top:1.75rem; display:flex; gap:0.75rem; flex-wrap:wrap;">
        <button style="${ST.btnPri}; width:auto; padding:0.7rem 1.25rem;" onclick="navegarA('sa-hoteles')">
          + Registrar nuevo hotel
        </button>
        <button style="${ST.btnSec}" onclick="navegarA('sa-suscripciones')">
          Gestionar suscripciones
        </button>
      </div>
    `;
  } catch (err) {
    contenido().innerHTML = errorBox('No se pudo cargar el dashboard', err.message);
  }
}


// ════════════════════════════════════════════════════════════
//  SUPERADMIN › HOTELES (listado + alta integral)
// ════════════════════════════════════════════════════════════
async function moduloSaHoteles() {
  skeleton();
  try {
    const hoteles = await getHoteles();

    contenido().innerHTML = `
      <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; flex-wrap:wrap;">
        <div>
          <div class="seccion-titulo">Hoteles</div>
          <div class="seccion-sub">${hoteles.length} hotel${hoteles.length !== 1 ? 'es' : ''} registrado${hoteles.length !== 1 ? 's' : ''}</div>
        </div>
        <button style="${ST.btnPri}; width:auto; padding:0.7rem 1.25rem;" onclick="abrirFormAltaHotel()">
          + Registrar hotel
        </button>
      </div>

      <div class="card" style="padding:0; overflow:hidden; margin-top:0.5rem;">
        <div style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; font-size:0.85rem; min-width:640px;">
            <thead>
              <tr style="background:var(--gris-bg); text-align:left;">
                <th style="${thCss()}">Hotel</th>
                <th style="${thCss()}">RUC</th>
                <th style="${thCss()}">Plan</th>
                <th style="${thCss()}">Vence</th>
                <th style="${thCss()}">Estado</th>
                <th style="${thCss()}; text-align:right;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${hoteles.length === 0 ? `
                <tr><td colspan="6" style="padding:2rem; text-align:center; color:var(--texto-sub);">
                  Aún no hay hoteles. Registra el primero con el botón de arriba.
                </td></tr>` :
              hoteles.map(h => filaHotel(h)).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    contenido().innerHTML = errorBox('No se pudo cargar la lista de hoteles', err.message);
  }
}

function thCss() {
  return 'padding:0.75rem 1rem; font-weight:600; font-size:0.72rem; text-transform:uppercase; letter-spacing:0.05em; color:var(--texto-sub); border-bottom:1px solid var(--gris-borde);';
}
function tdCss() {
  return 'padding:0.75rem 1rem; border-bottom:1px solid var(--gris-borde); color:var(--texto);';
}

function filaHotel(h) {
  const vence = new Date(h.fecha_vencimiento);
  const dias = Math.ceil((vence - new Date()) / (1000 * 60 * 60 * 24));
  let estadoBadge;
  if (h.estado === 'suspendido') {
    estadoBadge = badge('Suspendido', '#FEF2F2', '#DC2626');
  } else if (dias < 0) {
    estadoBadge = badge('Vencido', '#FFF7ED', '#EA580C');
  } else if (dias <= 5) {
    estadoBadge = badge(`${dias}d restantes`, '#FFFBEB', '#92400E');
  } else {
    estadoBadge = badge('Activo', '#F0FDF4', '#16A34A');
  }

  return `
    <tr>
      <td style="${tdCss()}">
        <div style="font-weight:600;">${escapeHtml(h.nombre_comercial)}</div>
        <div style="font-size:0.75rem; color:var(--texto-sub);">${escapeHtml(h.razon_social)}</div>
      </td>
      <td style="${tdCss()}; font-family:monospace; font-size:0.8rem;">${escapeHtml(h.ruc)}</td>
      <td style="${tdCss()}"><span class="badge-plan ${h.plan}">${h.plan}</span></td>
      <td style="${tdCss()}; font-size:0.8rem;">${fechaCorta(h.fecha_vencimiento)}</td>
      <td style="${tdCss()}">${estadoBadge}</td>
      <td style="${tdCss()}; text-align:right; white-space:nowrap;">
        <button style="${ST.btnSec}; padding:0.4rem 0.75rem;" onclick="abrirGestionHotel('${h.id}')">Gestionar</button>
      </td>
    </tr>`;
}

function badge(texto, bg, color) {
  return `<span style="display:inline-block; font-size:0.7rem; font-weight:700; padding:0.2rem 0.65rem; border-radius:999px; background:${bg}; color:${color};">${texto}</span>`;
}


// ── Formulario de alta integral de hotel ────────────────────
function abrirFormAltaHotel() {
  const html = `
    <form id="form-alta-hotel">
      <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:var(--azul); margin-bottom:0.75rem;">1 · Datos del hotel</div>
      <div style="${ST.grupo}">
        <label style="${ST.label}">Razón social *</label>
        <input style="${ST.input}" name="razon_social" required placeholder="Inversiones Hotel SAC">
      </div>
      <div style="${ST.fila}">
        <div style="${ST.grupo}">
          <label style="${ST.label}">RUC *</label>
          <input style="${ST.input}" name="ruc" required maxlength="11" placeholder="20123456789">
        </div>
        <div style="${ST.grupo}">
          <label style="${ST.label}">Nombre comercial *</label>
          <input style="${ST.input}" name="nombre_comercial" required placeholder="Hotel Las Palmeras">
        </div>
      </div>
      <div style="${ST.grupo}">
        <label style="${ST.label}">Dirección</label>
        <input style="${ST.input}" name="direccion" placeholder="Av. Principal 123">
      </div>
      <div style="${ST.fila}">
        <div style="${ST.grupo}">
          <label style="${ST.label}">Teléfono</label>
          <input style="${ST.input}" name="telefono" placeholder="999999999">
        </div>
        <div style="${ST.grupo}">
          <label style="${ST.label}">Email contacto</label>
          <input style="${ST.input}" name="email_contacto" type="email" placeholder="contacto@hotel.com">
        </div>
      </div>

      <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:var(--azul); margin:1.25rem 0 0.75rem;">2 · Plan y suscripción</div>
      <div style="${ST.fila}">
        <div style="${ST.grupo}">
          <label style="${ST.label}">Plan *</label>
          <select style="${ST.input}" name="plan" required>
            <option value="basico">Básico</option>
            <option value="pro">Pro</option>
          </select>
        </div>
        <div style="${ST.grupo}">
          <label style="${ST.label}">Ciclo *</label>
          <select style="${ST.input}" name="ciclo_pago" id="sel-ciclo" required>
            <option value="mensual">Mensual (1 mes)</option>
            <option value="trimestral">Trimestral (3 meses)</option>
            <option value="semestral">Semestral (6 meses)</option>
            <option value="anual">Anual (12 meses)</option>
          </select>
        </div>
      </div>

      <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:var(--azul); margin:1.25rem 0 0.75rem;">3 · Cuenta del dueño</div>
      <div style="${ST.grupo}">
        <label style="${ST.label}">Nombre del dueño *</label>
        <input style="${ST.input}" name="nombre_dueno" required placeholder="Juan Pérez">
      </div>
      <div style="${ST.fila}">
        <div style="${ST.grupo}">
          <label style="${ST.label}">Email (login) *</label>
          <input style="${ST.input}" name="email_dueno" type="email" required placeholder="dueno@hotel.com">
        </div>
        <div style="${ST.grupo}">
          <label style="${ST.label}">Contraseña inicial *</label>
          <input style="${ST.input}" name="password_dueno" required minlength="6" placeholder="Mínimo 6 caracteres">
        </div>
      </div>

      <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:var(--azul); margin:1.25rem 0 0.75rem;">4 · Pago inicial recibido</div>
      <div style="${ST.fila}">
        <div style="${ST.grupo}">
          <label style="${ST.label}">Monto cobrado *</label>
          <input style="${ST.input}" name="monto_cobrado" type="number" step="0.01" required placeholder="120.00">
        </div>
        <div style="${ST.grupo}">
          <label style="${ST.label}">Método *</label>
          <select style="${ST.input}" name="metodo_pago" required>
            <option value="yape">Yape</option>
            <option value="plin">Plin</option>
            <option value="transferencia">Transferencia</option>
            <option value="efectivo">Efectivo</option>
          </select>
        </div>
      </div>
      <div style="${ST.grupo}">
        <label style="${ST.label}">Código de operación</label>
        <input style="${ST.input}" name="codigo_operacion" placeholder="Ej: 00123456">
      </div>

      <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:var(--azul); margin:1.25rem 0 0.75rem;">5 · Configuración SUNAT</div>
      <div style="${ST.fila}">
        <div style="${ST.grupo}">
          <label style="${ST.label}">Usuario SOL</label>
          <input style="${ST.input}" name="usuario_sol" placeholder="MODDATOS">
        </div>
        <div style="${ST.grupo}">
          <label style="${ST.label}">Clave SOL</label>
          <input style="${ST.input}" name="clave_sol" type="password" placeholder="••••••">
        </div>
      </div>
      <div style="${ST.grupo}">
        <label style="${ST.label}">Token API facturador</label>
        <input style="${ST.input}" name="token_api" placeholder="Token del proveedor OSE/facturador">
      </div>
      <div style="${ST.grupo}">
        <label style="${ST.label}">Endpoint facturador</label>
        <input style="${ST.input}" name="endpoint_facturador" placeholder="https://api.facturador.com">
      </div>
      <div style="${ST.fila}">
        <div style="${ST.grupo}">
          <label style="${ST.label}">Serie boleta / correlativo</label>
          <div style="display:flex; gap:0.5rem;">
            <input style="${ST.input}" name="serie_boleta" value="B001" style="flex:1;">
            <input style="${ST.input}; width:90px;" name="correlativo_boleta" type="number" value="1" title="Correlativo inicial">
          </div>
        </div>
        <div style="${ST.grupo}">
          <label style="${ST.label}">Serie factura / correlativo</label>
          <div style="display:flex; gap:0.5rem;">
            <input style="${ST.input}" name="serie_factura" value="F001" style="flex:1;">
            <input style="${ST.input}; width:90px;" name="correlativo_factura" type="number" value="1" title="Correlativo inicial">
          </div>
        </div>
      </div>

      <div id="alta-error" style="display:none; background:#FEF2F2; border:1px solid #FECACA; color:var(--rojo); padding:0.65rem 0.9rem; border-radius:8px; font-size:0.82rem; margin-bottom:0.75rem;"></div>

      <button type="submit" style="${ST.btnPri}; margin-top:0.5rem;" id="btn-alta-submit">
        Registrar hotel y crear cuenta
      </button>
    </form>
  `;
  abrirModal('Registrar nuevo hotel', html, { ancho: '640px' });

  $('#form-alta-hotel').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = $('#btn-alta-submit');
    const errEl = $('#alta-error');
    errEl.style.display = 'none';
    btn.disabled = true;
    btn.textContent = 'Registrando…';

    const f = e.target;
    const g = name => f.elements[name].value;

    try {
      // meses según ciclo
      const mesesMap = { mensual: 1, trimestral: 3, semestral: 6, anual: 12 };
      const meses = mesesMap[g('ciclo_pago')];

      const resp = await rpc('fn_registrar_hotel', {
        p_razon_social:        g('razon_social'),
        p_ruc:                 g('ruc'),
        p_nombre_comercial:    g('nombre_comercial'),
        p_direccion:           g('direccion'),
        p_telefono:            g('telefono'),
        p_email_contacto:      g('email_contacto'),
        p_plan:                g('plan'),
        p_ciclo_pago:          g('ciclo_pago'),
        p_email_dueno:         g('email_dueno'),
        p_password_dueno:      g('password_dueno'),
        p_nombre_dueno:        g('nombre_dueno'),
        p_meses_pagados:       meses,
        p_monto_cobrado:       parseFloat(g('monto_cobrado')),
        p_metodo_pago:         g('metodo_pago'),
        p_codigo_operacion:    g('codigo_operacion'),
        p_usuario_sol:         g('usuario_sol'),
        p_clave_sol:           g('clave_sol'),
        p_token_api:           g('token_api'),
        p_endpoint_facturador: g('endpoint_facturador'),
        p_serie_boleta:        g('serie_boleta'),
        p_correlativo_boleta:  parseInt(g('correlativo_boleta')) || 1,
        p_serie_factura:       g('serie_factura'),
        p_correlativo_factura: parseInt(g('correlativo_factura')) || 1,
      });

      cerrarModal();
      toast('Hotel registrado', `Vence el ${fechaCorta(resp.fecha_vencimiento)}`, 'ok');
      moduloSaHoteles();
    } catch (err) {
      errEl.textContent = 'Error: ' + err.message;
      errEl.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Registrar hotel y crear cuenta';
    }
  });
}


// ── Gestión de un hotel (renovar / prórroga / suspender) ────
async function abrirGestionHotel(hotelId) {
  try {
    const susc = await getSuscripcionHotel(hotelId);

    const html = `
      <div class="card" style="margin-bottom:1.25rem; background:var(--gris-bg);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
          <span style="font-weight:700; font-size:1.05rem;">${escapeHtml(susc.nombre_comercial)}</span>
          <span class="badge-plan ${susc.plan}">${susc.plan}</span>
        </div>
        <div style="font-size:0.82rem; color:var(--texto-sub); line-height:1.7;">
          Ciclo: <strong>${susc.ciclo_pago}</strong><br>
          Vence: <strong>${fechaCorta(susc.fecha_vencimiento)}</strong>
          (${susc.dias_restantes >= 0 ? susc.dias_restantes + ' días restantes' : 'vencido hace ' + Math.abs(susc.dias_restantes) + ' días'})<br>
          Estado: <strong>${susc.estado}</strong>
        </div>
      </div>

      <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:var(--azul); margin-bottom:0.65rem;">Renovar suscripción</div>
      <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:0.5rem; margin-bottom:0.75rem;">
        ${[1,3,6,12].map(m => `
          <button class="btn-renovar-mes" data-meses="${m}" style="${ST.btnSec}; padding:0.6rem 0.25rem; text-align:center;">
            ${m} mes${m>1?'es':''}
          </button>`).join('')}
      </div>
      <div style="${ST.fila}; margin-bottom:0.75rem;">
        <div>
          <label style="${ST.label}">Monto cobrado</label>
          <input style="${ST.input}" id="renov-monto" type="number" step="0.01" placeholder="120.00">
        </div>
        <div>
          <label style="${ST.label}">Método</label>
          <select style="${ST.input}" id="renov-metodo">
            <option value="yape">Yape</option>
            <option value="plin">Plin</option>
            <option value="transferencia">Transferencia</option>
            <option value="efectivo">Efectivo</option>
          </select>
        </div>
      </div>
      <div style="${ST.grupo}">
        <label style="${ST.label}">Código operación</label>
        <input style="${ST.input}" id="renov-codigo" placeholder="Opcional">
      </div>
      <button style="${ST.btnPri}; margin-bottom:1.5rem;" id="btn-confirmar-renov" data-meses="1">
        Renovar por <span id="renov-meses-txt">1 mes</span>
      </button>

      <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:var(--azul); margin-bottom:0.65rem;">Prórroga de gracia</div>
      <div style="display:flex; gap:0.5rem; margin-bottom:1.5rem;">
        <button style="${ST.btnOk}; flex:1;" onclick="darProrroga('${hotelId}', 3)">+3 días de gracia</button>
        <button style="${ST.btnOk}; flex:1;" onclick="darProrroga('${hotelId}', 5)">+5 días de gracia</button>
      </div>

      <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:var(--rojo); margin-bottom:0.65rem;">Estado del hotel</div>
      <div style="display:flex; gap:0.5rem;">
        ${susc.estado === 'suspendido'
          ? `<button style="${ST.btnOk}; flex:1;" onclick="cambiarEstadoHotel('${hotelId}','activo')">Reactivar hotel</button>`
          : `<button style="${ST.btnDanger}; flex:1;" onclick="cambiarEstadoHotel('${hotelId}','suspendido')">Suspender hotel</button>`}
      </div>
    `;
    abrirModal('Gestionar suscripción', html, { ancho: '560px' });

    // Selección de meses a renovar
    let mesesSel = 1;
    $$('.btn-renovar-mes').forEach(b => {
      b.addEventListener('click', () => {
        mesesSel = parseInt(b.dataset.meses);
        $$('.btn-renovar-mes').forEach(x => {
          x.style.background = 'white';
          x.style.borderColor = 'var(--gris-borde)';
          x.style.color = 'var(--texto)';
        });
        b.style.background = 'rgba(26,63,166,0.08)';
        b.style.borderColor = 'var(--azul)';
        b.style.color = 'var(--azul)';
        $('#renov-meses-txt').textContent = `${mesesSel} mes${mesesSel>1?'es':''}`;
        $('#btn-confirmar-renov').dataset.meses = mesesSel;
      });
    });
    $$('.btn-renovar-mes')[0].click(); // preselecciona 1 mes

    // Confirmar renovación
    $('#btn-confirmar-renov').addEventListener('click', async () => {
      const btn = $('#btn-confirmar-renov');
      const monto = parseFloat($('#renov-monto').value);
      if (!monto || monto <= 0) { toast('Falta el monto', 'Ingresa el monto cobrado', 'warn'); return; }
      btn.disabled = true;
      try {
        const r = await rpc('fn_renovar_suscripcion', {
          p_hotel_id: hotelId,
          p_meses: parseInt(btn.dataset.meses),
          p_monto: monto,
          p_metodo_pago: $('#renov-metodo').value,
          p_codigo_operacion: $('#renov-codigo').value || null,
        });
        cerrarModal();
        toast('Suscripción renovada', `Nuevo vencimiento: ${fechaCorta(r.nueva_fecha_vencimiento)}`, 'ok');
        moduloSaHoteles();
      } catch (err) {
        toast('Error al renovar', err.message, 'error');
        btn.disabled = false;
      }
    });

  } catch (err) {
    toast('Error', err.message, 'error');
  }
}

async function darProrroga(hotelId, dias) {
  try {
    await rpc('fn_dar_prorroga', { p_hotel_id: hotelId, p_dias: dias });
    cerrarModal();
    toast('Prórroga otorgada', `+${dias} días de gracia`, 'ok');
    moduloSaHoteles();
  } catch (err) {
    toast('Error', err.message, 'error');
  }
}

async function cambiarEstadoHotel(hotelId, nuevoEstado) {
  try {
    const { error } = await db.from('hoteles').update({ estado: nuevoEstado }).eq('id', hotelId);
    if (error) throw error;
    cerrarModal();
    toast(nuevoEstado === 'activo' ? 'Hotel reactivado' : 'Hotel suspendido', '', nuevoEstado === 'activo' ? 'ok' : 'warn');
    moduloSaHoteles();
  } catch (err) {
    toast('Error', err.message, 'error');
  }
}


// ════════════════════════════════════════════════════════════
//  SUPERADMIN › SUSCRIPCIONES (historial de pagos)
// ════════════════════════════════════════════════════════════
async function moduloSaSuscripciones() {
  skeleton();
  try {
    const { data: pagos, error } = await db
      .from('suscripciones_pagos')
      .select(`*, hoteles ( nombre_comercial )`)
      .order('fecha_pago', { ascending: false })
      .limit(100);
    if (error) throw error;

    contenido().innerHTML = `
      <div class="seccion-titulo">Suscripciones</div>
      <div class="seccion-sub">Historial de pagos cobrados (últimos 100)</div>

      <div class="card" style="padding:0; overflow:hidden;">
        <div style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; font-size:0.85rem; min-width:640px;">
            <thead>
              <tr style="background:var(--gris-bg); text-align:left;">
                <th style="${thCss()}">Fecha</th>
                <th style="${thCss()}">Hotel</th>
                <th style="${thCss()}">Meses</th>
                <th style="${thCss()}">Monto</th>
                <th style="${thCss()}">Método</th>
                <th style="${thCss()}">Cód. operación</th>
              </tr>
            </thead>
            <tbody>
              ${pagos.length === 0 ? `
                <tr><td colspan="6" style="padding:2rem; text-align:center; color:var(--texto-sub);">Sin pagos registrados aún.</td></tr>` :
              pagos.map(p => `
                <tr>
                  <td style="${tdCss()}; font-size:0.8rem;">${fechaCorta(p.fecha_pago)}</td>
                  <td style="${tdCss()}; font-weight:600;">${escapeHtml(p.hoteles?.nombre_comercial || '—')}</td>
                  <td style="${tdCss()}">${p.meses_renovados}</td>
                  <td style="${tdCss()}; font-weight:600;">${soles(p.monto_cobrado)}</td>
                  <td style="${tdCss()}; text-transform:capitalize;">${p.metodo_pago}</td>
                  <td style="${tdCss()}; font-family:monospace; font-size:0.8rem;">${escapeHtml(p.codigo_operacion || '—')}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    contenido().innerHTML = errorBox('No se pudo cargar el historial', err.message);
  }
}


// ════════════════════════════════════════════════════════════
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
    <div class="seccion-titulo">Caja / Turno</div>
    <div class="seccion-sub">No tienes ningún turno abierto</div>

    <div class="card" style="max-width:440px;">
      <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1.25rem;">
        <div style="width:44px; height:44px; border-radius:12px; background:rgba(26,63,166,0.1); display:flex; align-items:center; justify-content:center;">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--azul)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:22px;height:22px;">
            <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </div>
        <div>
          <div style="font-weight:700;">Abrir turno de caja</div>
          <div style="font-size:0.8rem; color:var(--texto-sub);">Cuenta el efectivo físico con el que arrancas</div>
        </div>
      </div>

      <div style="${ST.grupo}">
        <label style="${ST.label}">Fondo inicial (efectivo físico) *</label>
        <input style="${ST.input}" id="caja-fondo" type="number" step="0.01" placeholder="100.00" autofocus>
      </div>

      <button style="${ST.btnPri}" id="btn-abrir-caja">Abrir turno</button>
    </div>
  `;

  $('#btn-abrir-caja').addEventListener('click', async () => {
    const fondo = parseFloat($('#caja-fondo').value);
    if (isNaN(fondo) || fondo < 0) { toast('Fondo inválido', 'Ingresa el monto físico inicial', 'warn'); return; }
    const btn = $('#btn-abrir-caja');
    btn.disabled = true; btn.textContent = 'Abriendo…';
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
      btn.disabled = false; btn.textContent = 'Abrir turno';
    }
  });
}

// ── Estado: turno abierto → panel de movimientos ────────────
async function renderCajaAbierta() {
  const turno = SESSION.turnoActivo;

  // Traer movimientos del turno
  const { data: movs, error } = await db
    .from('movimientos_caja')
    .select('*')
    .eq('turno_caja_id', turno.id)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;

  // Calcular totales POR MÉTODO (para mostrar resumen; el efectivo esperado es interno)
  const resumen = { efectivo: 0, yape: 0, plin: 0, transferencia: 0, egresos: 0 };
  (movs || []).forEach(m => {
    if (m.tipo === 'ingreso') {
      const met = m.metodo_pago || 'efectivo';
      resumen[met] = (resumen[met] || 0) + Number(m.monto);
    } else if (m.tipo === 'egreso') {
      resumen.egresos += Number(m.monto);
    }
  });

  contenido().innerHTML = `
    <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; flex-wrap:wrap;">
      <div>
        <div class="seccion-titulo">Caja / Turno</div>
        <div class="seccion-sub">Abierto ${fechaHora(turno.apertura_at)} · Fondo inicial ${soles(turno.fondo_inicial)}</div>
      </div>
      <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
        <button style="${ST.btnSec}" onclick="abrirFormMovimiento('ingreso')">+ Ingreso</button>
        <button style="${ST.btnDanger}" onclick="abrirFormMovimiento('egreso')">− Egreso / gasto</button>
        <button style="${ST.btnPri}; width:auto; padding:0.55rem 1.1rem;" onclick="abrirCierreCiego()">Cerrar turno</button>
      </div>
    </div>

    <!-- Resumen por método (informativo) -->
    <div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:0.85rem; margin-bottom:1.5rem;">
      ${resumenTarjeta('Efectivo (ingresos)', resumen.efectivo, '#16A34A')}
      ${resumenTarjeta('Yape', resumen.yape, '#7C3AED')}
      ${resumenTarjeta('Plin', resumen.plin, '#0891B2')}
      ${resumenTarjeta('Transferencias', resumen.transferencia, '#2563EB')}
      ${resumenTarjeta('Egresos', resumen.egresos, '#DC2626')}
    </div>

    <div class="card" style="padding:0; overflow:hidden;">
      <div style="padding:0.9rem 1.25rem; border-bottom:1px solid var(--gris-borde); font-weight:600; font-size:0.9rem;">
        Movimientos del turno (${(movs || []).length})
      </div>
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:0.85rem; min-width:560px;">
          <thead>
            <tr style="background:var(--gris-bg); text-align:left;">
              <th style="${thCss()}">Hora</th>
              <th style="${thCss()}">Concepto</th>
              <th style="${thCss()}">Método</th>
              <th style="${thCss()}; text-align:right;">Monto</th>
            </tr>
          </thead>
          <tbody>
            ${(movs || []).length === 0 ? `
              <tr><td colspan="4" style="padding:1.5rem; text-align:center; color:var(--texto-sub);">Sin movimientos aún.</td></tr>` :
            movs.map(m => `
              <tr>
                <td style="${tdCss()}; font-size:0.8rem;">${new Date(m.created_at).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'})}</td>
                <td style="${tdCss()}">${escapeHtml(m.concepto)}</td>
                <td style="${tdCss()}; text-transform:capitalize;">${m.metodo_pago || '—'}</td>
                <td style="${tdCss()}; text-align:right; font-weight:600; color:${m.tipo==='egreso'?'var(--rojo)':'var(--verde)'};">
                  ${m.tipo==='egreso'?'−':'+'} ${soles(m.monto)}
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
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

    contenido().innerHTML = `
      <div class="seccion-titulo">Dashboard</div>
      <div class="seccion-sub">${escapeHtml(SESSION.hotel.nombre_comercial)}</div>

      <div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:0.85rem; margin-bottom:1.5rem;">
        ${estadoTarjeta('Libres', conteo.libre, '#16A34A')}
        ${estadoTarjeta('Ocupadas', conteo.ocupada, '#DC2626')}
        ${estadoTarjeta('Limpieza', conteo.limpieza, '#CA8A04')}
        ${estadoTarjeta('Reservadas', conteo.reservada, '#2563EB')}
      </div>

      <div class="card" style="max-width:520px;">
        <div style="font-weight:600; margin-bottom:0.75rem;">Tu turno de caja</div>
        ${turno
          ? `<div style="font-size:0.85rem; color:var(--texto-sub);">Turno abierto desde ${fechaHora(turno.apertura_at)} · Fondo ${soles(turno.fondo_inicial)}</div>
             <button style="${ST.btnSec}; margin-top:0.75rem;" onclick="navegarA('caja')">Ir a caja</button>`
          : `<div style="font-size:0.85rem; color:var(--texto-sub);">No tienes turno abierto. Ábrelo para empezar a operar.</div>
             <button style="${ST.btnPri}; width:auto; padding:0.6rem 1.2rem; margin-top:0.75rem;" onclick="navegarA('caja')">Abrir turno</button>`}
      </div>
    `;
  } catch (err) {
    contenido().innerHTML = errorBox('No se pudo cargar el dashboard', err.message);
  }
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
  libre:         { bg: '#F0FDF4', borde: '#16A34A', texto: '#15803D', label: 'Libre' },
  ocupada:       { bg: '#FEF2F2', borde: '#DC2626', texto: '#B91C1C', label: 'Ocupada' },
  limpieza:      { bg: '#FEFCE8', borde: '#CA8A04', texto: '#A16207', label: 'Limpieza' },
  reservada:     { bg: '#EFF6FF', borde: '#2563EB', texto: '#1D4ED8', label: 'Reservada' },
  mantenimiento: { bg: '#F1F5F9', borde: '#64748B', texto: '#475569', label: 'Mantenim.' },
};

async function moduloRack() {
  skeleton();
  try {
    // Verificar turno abierto (necesario para cobrar)
    SESSION.turnoActivo = await getTurnoAbierto();
    const habs = await getHabitaciones();

    if (habs.length === 0) {
      contenido().innerHTML = `
        <div class="seccion-titulo">Rack de Habitaciones</div>
        <div class="seccion-sub">Aún no hay habitaciones creadas</div>
        <div class="card" style="max-width:480px;">
          <p style="font-size:0.9rem; color:var(--texto-sub);">
            Primero crea tus tipos de habitación y habitaciones desde el menú
            <strong>Habitaciones</strong> (config).
          </p>
          ${SESSION.perfil.rol === 'admin'
            ? `<button style="${ST.btnPri}; width:auto; padding:0.6rem 1.2rem;" onclick="navegarA('habitacion-config')">Ir a configuración</button>`
            : ''}
        </div>`;
      return;
    }

    const avisoTurno = !SESSION.turnoActivo
      ? `<div style="background:#FFFBEB; border:1px solid #FDE68A; border-radius:10px; padding:0.75rem 1rem; margin-bottom:1rem; font-size:0.83rem; color:#92400E;">
           ⚠️ No tienes turno de caja abierto. <a href="#" onclick="navegarA('caja');return false;" style="color:#92400E; font-weight:600; text-decoration:underline;">Ábrelo</a> para poder cobrar check-ins.
         </div>`
      : '';

    contenido().innerHTML = `
      <div class="seccion-titulo">Rack de Habitaciones</div>
      <div class="seccion-sub">Toca una habitación para operar</div>
      ${avisoTurno}

      <!-- Leyenda -->
      <div style="display:flex; gap:1rem; flex-wrap:wrap; margin-bottom:1.25rem;">
        ${Object.entries(COLORES_ESTADO).map(([k, c]) => `
          <div style="display:flex; align-items:center; gap:0.4rem; font-size:0.78rem; color:var(--texto-sub);">
            <span style="width:14px; height:14px; border-radius:4px; background:${c.bg}; border:2px solid ${c.borde};"></span>
            ${c.label}
          </div>`).join('')}
      </div>

      <!-- Grid de habitaciones -->
      <div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:0.85rem;">
        ${habs.map(h => tarjetaHabitacion(h)).join('')}
      </div>
    `;
  } catch (err) {
    contenido().innerHTML = errorBox('No se pudo cargar el rack', err.message);
  }
}

function tarjetaHabitacion(h) {
  const c = COLORES_ESTADO[h.estado] || COLORES_ESTADO.libre;
  const tipo = h.tipos_habitacion || {};
  return `
    <div onclick="abrirHabitacion('${h.id}')" style="
        cursor:pointer; background:${c.bg}; border:2px solid ${c.borde};
        border-radius:14px; padding:1rem; transition:transform 0.1s;
        display:flex; flex-direction:column; gap:0.35rem;"
        onmouseover="this.style.transform='translateY(-2px)'"
        onmouseout="this.style.transform='translateY(0)'">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <span style="font-size:1.35rem; font-weight:700; color:var(--texto);">${escapeHtml(h.numero)}</span>
        <span style="font-size:0.62rem; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; color:${c.texto}; background:white; padding:0.15rem 0.45rem; border-radius:999px;">${c.label}</span>
      </div>
      <div style="font-size:0.75rem; color:var(--texto-sub);">${escapeHtml(tipo.nombre || 'Sin tipo')}</div>
      <div style="font-size:0.72rem; color:var(--texto-sub);">
        Noche ${soles(tipo.tarifa_noche)} · ${tipo.horas_bloque || 3}h ${soles(tipo.tarifa_horas)}
      </div>
    </div>`;
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
      .select(`*, habitaciones(numero), huespedes(nombres, apellidos, celular)`)
      .eq('hotel_id', SESSION.hotel.id)
      .eq('estado', 'reservada')
      .order('fecha_entrada')
      .limit(100);

    contenido().innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem;">
        <div>
          <div class="seccion-titulo">Reservas a futuro</div>
          <div class="seccion-sub">${(reservas||[]).length} reserva(s) pendiente(s)</div>
        </div>
        <button style="${ST.btnPri}; width:auto; padding:0.65rem 1.2rem;" onclick="abrirNuevaReserva()">+ Nueva reserva</button>
      </div>

      <div class="card" style="padding:0; overflow:hidden;">
        <div style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; font-size:0.85rem; min-width:640px;">
            <thead><tr style="background:var(--gris-bg); text-align:left;">
              <th style="${thCss()}">Entrada</th><th style="${thCss()}">Hab.</th>
              <th style="${thCss()}">Huésped</th><th style="${thCss()}">Adelanto</th>
              <th style="${thCss()}; text-align:right;">Acción</th>
            </tr></thead>
            <tbody>
              ${(reservas||[]).length === 0 ? `<tr><td colspan="5" style="padding:2rem;text-align:center;color:var(--texto-sub);">Sin reservas pendientes.</td></tr>` :
              reservas.map(r => `
                <tr>
                  <td style="${tdCss()}; font-size:0.8rem;">${fechaHora(r.fecha_entrada)}</td>
                  <td style="${tdCss()}; font-weight:600;">${escapeHtml(r.habitaciones?.numero||'—')}</td>
                  <td style="${tdCss()}">${escapeHtml((r.huespedes?.nombres||'')+' '+(r.huespedes?.apellidos||''))}</td>
                  <td style="${tdCss()}; color:var(--verde); font-weight:600;">${soles(r.adelanto_pagado)}</td>
                  <td style="${tdCss()}; text-align:right;">
                    <button style="${ST.btnOk}; padding:0.4rem 0.75rem;" onclick="confirmarLlegadaReserva('${r.id}','${r.habitacion_id}')">Check-in</button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    contenido().innerHTML = errorBox('No se pudo cargar reservas', err.message);
  }
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

    contenido().innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem;">
        <div>
          <div class="seccion-titulo">Huéspedes</div>
          <div class="seccion-sub">Registro oficial · ${(huespedes||[]).length} registrado(s)</div>
        </div>
        <button style="${ST.btnSec}" onclick="exportarHuespedesCSV()">⬇ Exportar Excel (CSV)</button>
      </div>

      <div class="card" style="padding:0; overflow:hidden;">
        <div style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; font-size:0.85rem; min-width:640px;">
            <thead><tr style="background:var(--gris-bg); text-align:left;">
              <th style="${thCss()}">Documento</th><th style="${thCss()}">Nombres</th>
              <th style="${thCss()}">Apellidos</th><th style="${thCss()}">Celular</th><th style="${thCss()}">Registro</th>
            </tr></thead>
            <tbody>
              ${(huespedes||[]).length === 0 ? `<tr><td colspan="5" style="padding:2rem;text-align:center;color:var(--texto-sub);">Sin huéspedes aún.</td></tr>` :
              huespedes.map(h => `
                <tr>
                  <td style="${tdCss()}; font-family:monospace;">${escapeHtml(h.tipo_doc)} ${escapeHtml(h.num_doc)}</td>
                  <td style="${tdCss()}">${escapeHtml(h.nombres)}</td>
                  <td style="${tdCss()}">${escapeHtml(h.apellidos)}</td>
                  <td style="${tdCss()}">${escapeHtml(h.celular||'—')}</td>
                  <td style="${tdCss()}; font-size:0.8rem;">${fechaCorta(h.created_at)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    window._huespedesCache = huespedes || [];
  } catch (err) {
    contenido().innerHTML = errorBox('No se pudo cargar huéspedes', err.message);
  }
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

    contenido().innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem;">
        <div>
          <div class="seccion-titulo">Tiendita / Almacén</div>
          <div class="seccion-sub">${(productos||[]).length} producto(s)</div>
        </div>
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <button style="${ST.btnSec}" onclick="abrirFormProducto()">+ Nuevo producto</button>
          <button style="${ST.btnSec}" onclick="abrirReposicion()">📦 Reposición stock</button>
          <button style="${ST.btnPri}; width:auto; padding:0.55rem 1.1rem;" onclick="abrirVentaRapida()">🛒 Venta rápida</button>
        </div>
      </div>

      <div class="card" style="padding:0; overflow:hidden;">
        <div style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; font-size:0.85rem; min-width:600px;">
            <thead><tr style="background:var(--gris-bg); text-align:left;">
              <th style="${thCss()}">Producto</th><th style="${thCss()}">Precio venta</th>
              <th style="${thCss()}">Costo</th><th style="${thCss()}">Stock</th><th style="${thCss()}; text-align:right;">Acción</th>
            </tr></thead>
            <tbody>
              ${(productos||[]).length === 0 ? `<tr><td colspan="5" style="padding:2rem;text-align:center;color:var(--texto-sub);">Sin productos. Crea el primero.</td></tr>` :
              productos.map(p => `
                <tr>
                  <td style="${tdCss()}; font-weight:600;">${escapeHtml(p.nombre)}<div style="font-size:0.72rem;color:var(--texto-sub);font-weight:400;">${escapeHtml(p.categoria||'')}</div></td>
                  <td style="${tdCss()}">${soles(p.precio_venta)}</td>
                  <td style="${tdCss()}; color:var(--texto-sub);">${soles(p.costo_compra)}</td>
                  <td style="${tdCss()}">
                    <span style="font-weight:700; color:${p.stock_actual <= p.stock_minimo ? 'var(--rojo)':'var(--texto)'};">${p.stock_actual}</span>
                    ${p.stock_actual <= p.stock_minimo ? '<span style="font-size:0.68rem;color:var(--rojo);"> ⚠ bajo</span>':''}
                  </td>
                  <td style="${tdCss()}; text-align:right;">
                    <button style="${ST.btnSec}; padding:0.35rem 0.65rem;" onclick="abrirFormProducto('${p.id}')">Editar</button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    window._productosCache = productos || [];
  } catch (err) {
    contenido().innerHTML = errorBox('No se pudo cargar la tiendita', err.message);
  }
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

    contenido().innerHTML = `
      <div class="seccion-titulo">Configuración de Habitaciones</div>
      <div class="seccion-sub">Crea tus tipos con tarifas y luego tus habitaciones</div>

      <!-- Tipos de habitación -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin:1rem 0 0.75rem;">
        <h3 style="font-size:1rem; font-weight:700; margin:0;">Tipos de habitación</h3>
        <button style="${ST.btnSec}" onclick="abrirFormTipo()">+ Nuevo tipo</button>
      </div>
      <div class="card" style="padding:0; overflow:hidden; margin-bottom:1.75rem;">
        <div style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; font-size:0.85rem; min-width:520px;">
            <thead><tr style="background:var(--gris-bg); text-align:left;">
              <th style="${thCss()}">Tipo</th><th style="${thCss()}">Cap.</th>
              <th style="${thCss()}">Tarifa noche</th><th style="${thCss()}">Tarifa horas</th><th style="${thCss()};text-align:right;">Acción</th>
            </tr></thead>
            <tbody>
              ${(tipos||[]).length===0?`<tr><td colspan="5" style="padding:1.5rem;text-align:center;color:var(--texto-sub);">Crea tu primer tipo.</td></tr>`:
              tipos.map(t=>`
                <tr>
                  <td style="${tdCss()}; font-weight:600;">${escapeHtml(t.nombre)}</td>
                  <td style="${tdCss()}">${t.capacidad_max}</td>
                  <td style="${tdCss()}">${soles(t.tarifa_noche)}</td>
                  <td style="${tdCss()}">${soles(t.tarifa_horas)} / ${t.horas_bloque}h</td>
                  <td style="${tdCss()}; text-align:right;"><button style="${ST.btnSec}; padding:0.35rem 0.65rem;" onclick="abrirFormTipo('${t.id}')">Editar</button></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Habitaciones -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin:1rem 0 0.75rem;">
        <h3 style="font-size:1rem; font-weight:700; margin:0;">Habitaciones</h3>
        <button style="${ST.btnPri}; width:auto; padding:0.55rem 1.1rem;" onclick="abrirFormHabitacion()" ${(tipos||[]).length===0?'disabled title="Crea un tipo primero"':''}>+ Nueva habitación</button>
      </div>
      <div class="card" style="padding:0; overflow:hidden;">
        <div style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; font-size:0.85rem; min-width:480px;">
            <thead><tr style="background:var(--gris-bg); text-align:left;">
              <th style="${thCss()}">Número</th><th style="${thCss()}">Tipo</th>
              <th style="${thCss()}">Piso</th><th style="${thCss()}">Estado</th><th style="${thCss()};text-align:right;">Acción</th>
            </tr></thead>
            <tbody>
              ${(habs||[]).length===0?`<tr><td colspan="5" style="padding:1.5rem;text-align:center;color:var(--texto-sub);">Sin habitaciones aún.</td></tr>`:
              habs.map(h=>`
                <tr>
                  <td style="${tdCss()}; font-weight:600;">${escapeHtml(h.numero)}</td>
                  <td style="${tdCss()}">${escapeHtml(h.tipos_habitacion?.nombre||'—')}</td>
                  <td style="${tdCss()}">${escapeHtml(h.piso||'—')}</td>
                  <td style="${tdCss()}">${badge(COLORES_ESTADO[h.estado]?.label||h.estado, COLORES_ESTADO[h.estado]?.bg||'#eee', COLORES_ESTADO[h.estado]?.texto||'#333')}</td>
                  <td style="${tdCss()}; text-align:right;"><button style="${ST.btnSec}; padding:0.35rem 0.65rem;" onclick="abrirFormHabitacion('${h.id}')">Editar</button></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    window._tiposCache = tipos || [];
  } catch (err) {
    contenido().innerHTML = errorBox('No se pudo cargar la configuración', err.message);
  }
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
      .select('*').eq('hotel_id', SESSION.hotel.id).order('created_at');

    contenido().innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem;">
        <div>
          <div class="seccion-titulo">Personal</div>
          <div class="seccion-sub">${(personal||[]).length} usuario(s)</div>
        </div>
      </div>
      <div style="background:#EFF6FF; border:1px solid #BFDBFE; border-radius:10px; padding:0.85rem 1rem; margin-bottom:1rem; font-size:0.83rem; color:#1E40AF;">
        ℹ️ Para crear empleados con login propio, escríbeme y lo agregamos vía función segura en la Fase 5. Por ahora puedes ver el listado y resetear contraseñas.
      </div>

      <div class="card" style="padding:0; overflow:hidden;">
        <div style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; font-size:0.85rem; min-width:480px;">
            <thead><tr style="background:var(--gris-bg); text-align:left;">
              <th style="${thCss()}">Nombre</th><th style="${thCss()}">Rol</th><th style="${thCss()}">Estado</th><th style="${thCss()};text-align:right;">Acción</th>
            </tr></thead>
            <tbody>
              ${(personal||[]).map(p=>`
                <tr>
                  <td style="${tdCss()}; font-weight:600;">${escapeHtml(p.nombre_completo||'—')}</td>
                  <td style="${tdCss()}; text-transform:capitalize;">${escapeHtml(p.rol)}</td>
                  <td style="${tdCss()}">${p.activo?badge('Activo','#F0FDF4','#16A34A'):badge('Inactivo','#FEF2F2','#DC2626')}</td>
                  <td style="${tdCss()}; text-align:right;">
                    ${p.rol!=='admin'?`<button style="${ST.btnSec}; padding:0.35rem 0.65rem;" onclick="abrirResetPass('${p.user_id}','${escapeHtml(p.nombre_completo||'')}')">Reset clave</button>`:''}
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    contenido().innerHTML = errorBox('No se pudo cargar el personal', err.message);
  }
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
    let estadoColor = dias < 0 ? '#DC2626' : dias <= 5 ? '#EA580C' : '#16A34A';

    contenido().innerHTML = `
      <div class="seccion-titulo">Mi Suscripción</div>
      <div class="seccion-sub">Estado de tu plan en HospedaYa</div>

      <div class="card" style="max-width:480px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem;">
          <span style="font-weight:700; font-size:1.15rem;">${escapeHtml(susc.nombre_comercial)}</span>
          <span class="badge-plan ${susc.plan}">${susc.plan}</span>
        </div>
        <div style="text-align:center; padding:1.5rem; background:var(--gris-bg); border-radius:12px; margin-bottom:1.25rem;">
          <div style="font-size:2.5rem; font-weight:700; color:${estadoColor}; line-height:1;">${dias >= 0 ? dias : 0}</div>
          <div style="font-size:0.85rem; color:var(--texto-sub); margin-top:0.35rem;">${dias >= 0 ? 'días restantes' : 'suscripción vencida'}</div>
        </div>
        <div style="font-size:0.85rem; color:var(--texto-sub); line-height:1.8;">
          Ciclo de pago: <strong style="color:var(--texto); text-transform:capitalize;">${susc.ciclo_pago}</strong><br>
          Vence el: <strong style="color:var(--texto);">${fechaCorta(susc.fecha_vencimiento)}</strong>
        </div>
        <a href="${WA_URL}" target="_blank" rel="noopener" style="display:flex; align-items:center; justify-content:center; gap:0.5rem; background:#16A34A; color:white; text-decoration:none; padding:0.85rem; border-radius:10px; font-weight:600; margin-top:1.25rem;">
          <svg viewBox="0 0 24 24" fill="white" style="width:18px;height:18px;"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.186 21.9l4.83-1.225A9.953 9.953 0 0 0 12 22c5.522 0 10-4.478 10-10S17.521 2 11.999 2z"/></svg>
          Renovar por WhatsApp
        </a>
      </div>
    `;
  } catch (err) {
    contenido().innerHTML = errorBox('No se pudo cargar tu suscripción', err.message);
  }
}


// ── Caja de error reutilizable ──────────────────────────────
function errorBox(titulo, msg) {
  return `
    <div class="card" style="border-color:#FECACA; background:#FEF2F2;">
      <div style="font-weight:700; color:var(--rojo); margin-bottom:0.4rem;">${escapeHtml(titulo)}</div>
      <div style="font-size:0.85rem; color:#991B1B;">${escapeHtml(msg)}</div>
    </div>`;
}
