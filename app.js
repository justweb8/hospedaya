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
    // Hotel — caja
    case 'caja':             return moduloCaja();
    // Placeholder para módulos de Fase 4
    case 'dashboard':        return moduloDashboardHotel();
    default:
      contenido().innerHTML = `
        <div style="padding:2rem; color:var(--texto-sub); font-size:0.9rem;">
          Módulo <strong>${escapeHtml(modulo)}</strong> — se implementa en Fase 4.
        </div>`;
  }
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
//  HOTEL › DASHBOARD (placeholder simple hasta Fase 4)
// ════════════════════════════════════════════════════════════
function moduloDashboardHotel() {
  contenido().innerHTML = `
    <div class="seccion-titulo">Dashboard</div>
    <div class="seccion-sub">Resumen del hotel</div>
    <div class="card">
      <p style="font-size:0.9rem; color:var(--texto-sub); margin:0;">
        El rack de habitaciones, reservas y reportes se implementan en la Fase 4.
        Por ahora puedes usar el módulo <strong>Caja / Turno</strong> del menú lateral.
      </p>
    </div>
  `;
}


// ── Caja de error reutilizable ──────────────────────────────
function errorBox(titulo, msg) {
  return `
    <div class="card" style="border-color:#FECACA; background:#FEF2F2;">
      <div style="font-weight:700; color:var(--rojo); margin-bottom:0.4rem;">${escapeHtml(titulo)}</div>
      <div style="font-size:0.85rem; color:#991B1B;">${escapeHtml(msg)}</div>
    </div>`;
}
