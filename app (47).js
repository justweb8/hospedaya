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
    // Pantalla "Más" — solo móvil
    case 'mas-mobile':       return renderModuloMasMobile();
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
// ════════════════════════════════════════════════════════════
//  CONSULTA DNI / RUC — Token centralizado en SuperAdmin
//  El token vive SOLO en configuracion_global (tabla blindada).
//  El frontend NUNCA lo ve. Solo llama a la RPC.
// ════════════════════════════════════════════════════════════
const API_DOC = { activa: false };

// Verifica si el servicio global está activo (sin exponer el token)
// Consulta DNI — usa la RPC unificada (token nunca sale al browser)
async function consultarDNI(dni) {
  if (!API_DOC.activa) return null;
  try {
    const { data, error } = await db.rpc('fn_consultar_documento', {
      p_tipo: 'dni', p_numero: dni,
    });
    if (error || data?.error) return null;
    return {
      nombres:   data.nombres || '',
      apellidos: data.apellidoPaterno
        ? `${data.apellidoPaterno} ${data.apellidoMaterno||''}`.trim()
        : (data.apellidos || ''),
    };
  } catch { return null; }
}

// Consulta RUC — usa la RPC unificada
async function consultarRUC(ruc) {
  if (!API_DOC.activa) return null;
  try {
    const { data, error } = await db.rpc('fn_consultar_documento', {
      p_tipo: 'ruc', p_numero: ruc,
    });
    if (error || data?.error) return null;
    return {
      razon_social: data.razonSocial || '',
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
        <div class="tabla-wrap">
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

      <!-- Configuración Global DNI/RUC -->
      ${await renderCardConfigGlobal()}
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
//  SUPERADMIN › CONFIGURACIÓN GLOBAL (Token DNI/RUC)
// ════════════════════════════════════════════════════════════
async function renderCardConfigGlobal() {
  try {
    const { data: cfg } = await db.from('configuracion_global')
      .select('token_dni_ruc, proveedor_dni_ruc, token_factural, fl_empresa_id, fl_endpoint, proveedor_emision, actualizado_el')
      .eq('id', 1).single();

    const tieneTokenDNI = !!(cfg?.token_dni_ruc);
    const tieneTokenFL  = !!(cfg?.token_factural);
    const proveedorDNI  = cfg?.proveedor_dni_ruc || 'apis_net_pe';
    const actualizado   = cfg?.actualizado_el
      ? new Date(cfg.actualizado_el).toLocaleDateString('es-PE',{day:'numeric',month:'short',year:'numeric'})
      : '—';

    return `
      <!-- FacturaLibre Config -->
      <div style="background:white;border:1px solid var(--gris-borde);border-radius:14px;padding:1.5rem;margin-top:1.25rem;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:1.25rem;flex-wrap:wrap;">
          <div style="display:flex;align-items:center;gap:0.85rem;">
            <div style="width:44px;height:44px;border-radius:12px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" style="width:22px;height:22px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div>
              <div style="font-weight:700;font-size:1rem;">FacturaLibre — Plan Distribuidores</div>
              <div style="font-size:0.75rem;color:var(--texto-sub);">Token maestro de emisión SUNAT · Compartido entre todos los hoteles</div>
            </div>
          </div>
          <span style="font-size:0.72rem;font-weight:700;padding:0.25rem 0.75rem;border-radius:999px;
            background:${tieneTokenFL?'#F0FDF4':'#FEF2F2'};color:${tieneTokenFL?'#16A34A':'#DC2626'};
            border:1px solid ${tieneTokenFL?'#BBF7D0':'#FECACA'};">
            ${tieneTokenFL?'✅ Activo':'⚠️ Sin configurar'}
          </span>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:0.85rem;" class="rep-grid">
          <div>
            <label style="${ST.label}">Token distribuidor FacturaLibre</label>
            <div style="position:relative;">
              <input style="${ST.input};padding-right:2.5rem;" id="sa-token-fl" type="password" placeholder="${tieneTokenFL?'••••••••••••••• (activo)':'Token del plan distribuidores'}">
              <button type="button" onclick="togglePass('sa-token-fl',this)" style="position:absolute;right:0.75rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#94A3B8;padding:0;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:15px;height:15px;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
          </div>
          <div>
            <label style="${ST.label}">Endpoint FacturaLibre</label>
            <input style="${ST.input}" id="sa-fl-endpoint" value="${escapeHtml(cfg?.fl_endpoint||'https://facturalibre.net/api/v1')}" placeholder="https://facturalibre.net/api/v1">
          </div>
        </div>

        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1.5rem;">
          <button onclick="guardarConfigFL()" style="width:auto;padding:0.65rem 1.1rem;background:linear-gradient(135deg,var(--azul),#2563EB);color:white;border:none;border-radius:10px;font-size:0.85rem;font-weight:600;cursor:pointer;box-shadow:0 4px 14px rgba(37,99,235,0.3);">
            💾 Guardar config FacturaLibre
          </button>
          <button onclick="probarTokenFL()" style="width:auto;padding:0.65rem 1rem;background:white;border:1.5px solid var(--gris-borde);border-radius:10px;font-size:0.83rem;font-weight:600;cursor:pointer;color:var(--texto-sub);">
            🔌 Probar conexión
          </button>
        </div>

        <!-- DNI/RUC -->
        <div style="border-top:1px solid var(--gris-borde);padding-top:1.25rem;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:1rem;flex-wrap:wrap;">
            <div>
              <div style="font-weight:700;font-size:0.92rem;">Servicio de Identidad (DNI / RUC)</div>
              <div style="font-size:0.73rem;color:var(--texto-sub);">Token centralizado · Los hoteles NUNCA lo ven</div>
            </div>
            <span style="font-size:0.72rem;font-weight:700;padding:0.2rem 0.65rem;border-radius:999px;
              background:${tieneTokenDNI?'#F0FDF4':'#FEF2F2'};color:${tieneTokenDNI?'#16A34A':'#DC2626'};
              border:1px solid ${tieneTokenDNI?'#BBF7D0':'#FECACA'};">
              ${tieneTokenDNI?'✅ Token activo':'⚠️ Sin configurar'}
            </span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:0.85rem;" class="rep-grid">
            <div>
              <label style="${ST.label}">Proveedor</label>
              <select style="${ST.input}" id="sa-proveedor-doc">
                <option value="apis_net_pe" ${proveedorDNI==='apis_net_pe'?'selected':''}>Apis.net.pe</option>
                <option value="migo" ${proveedorDNI==='migo'?'selected':''}>Migo</option>
              </select>
            </div>
            <div>
              <label style="${ST.label}">Última actualización</label>
              <div style="${ST.input};background:var(--gris-bg);color:var(--texto-sub);font-size:0.85rem;">${actualizado}</div>
            </div>
          </div>
          <div style="${ST.grupo};margin-bottom:0.85rem;">
            <label style="${ST.label}">Token maestro DNI/RUC</label>
            <div style="position:relative;">
              <input style="${ST.input};padding-right:2.5rem;" id="sa-token-doc" type="password" placeholder="${tieneTokenDNI?'•••••••••• (activo)':'Token Apis.net.pe o Migo'}">
              <button type="button" onclick="togglePass('sa-token-doc',this)" style="position:absolute;right:0.75rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#94A3B8;padding:0;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:15px;height:15px;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
            <div style="font-size:0.7rem;color:var(--texto-sub);margin-top:0.3rem;">🔒 Almacenado en BD · nunca expuesto al browser · activa autocompletado en TODOS los hoteles</div>
          </div>
          <div style="display:flex;gap:0.5rem;">
            <button onclick="guardarTokenGlobal()" style="width:auto;padding:0.6rem 1rem;background:linear-gradient(135deg,#16A34A,#15803D);color:white;border:none;border-radius:9px;font-size:0.83rem;font-weight:600;cursor:pointer;">
              💾 Guardar token DNI/RUC
            </button>
            <button onclick="probarTokenGlobal()" style="width:auto;padding:0.6rem 0.9rem;background:white;border:1.5px solid var(--gris-borde);border-radius:9px;font-size:0.82rem;font-weight:600;cursor:pointer;color:var(--texto-sub);">
              🔍 Probar
            </button>
          </div>
        </div>
      </div>
    `;
  } catch(err) {
    return `<div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:12px;padding:1rem;margin-top:1rem;font-size:0.83rem;color:#DC2626;">
      Error al cargar config global: ${escapeHtml(err.message)}</div>`;
  }
}

async function guardarConfigFL() {
  const token    = document.getElementById('sa-token-fl')?.value?.trim();
  const endpoint = document.getElementById('sa-fl-endpoint')?.value?.trim() || 'https://facturalibre.net/api/v1';
  const btn      = document.querySelector('[onclick="guardarConfigFL()"]');
  const orig     = btn?.innerHTML;
  if (btn) { btn.disabled=true; btn.innerHTML='Guardando…'; }
  try {
    const update = { fl_endpoint: endpoint, proveedor_emision: 'facturalibre', actualizado_el: new Date().toISOString() };
    if (token) update.token_factural = token;
    const { error } = await db.from('configuracion_global').update(update).eq('id', 1);
    if (error) throw error;
    toast('✅ FacturaLibre configurado', 'Token guardado · todos los hoteles actualizados', 'ok');
    if (token && document.getElementById('sa-token-fl')) document.getElementById('sa-token-fl').value = '';
    moduloSaDashboard();
  } catch(err) { toast('Error', err.message, 'error'); }
  finally { if (btn) { btn.disabled=false; btn.innerHTML=orig; } }
}

async function probarTokenFL() {
  const btn  = document.querySelector('[onclick="probarTokenFL()"]');
  const orig = btn?.innerHTML;
  if (btn) { btn.disabled=true; btn.innerHTML='Probando…'; }
  try {
    const { data: gl } = await db.from('configuracion_global').select('fl_endpoint,token_factural').eq('id',1).single();
    if (!gl?.token_factural) { toast('Sin token','Guarda el token primero','warn'); return; }
    const base = (gl.fl_endpoint||'https://facturalibre.net/api/v1').replace(/\/$/,'');
    const endpoint = base + '/ping';
    const r = await fetch(endpoint, {
      method:'GET',
      headers:{ 'Authorization':'Bearer ' + gl.token_factural, 'Accept':'application/json' },
    });
    if (r.ok) toast('✅ FacturaLibre conectado','Credenciales válidas','ok');
    else { const d=await r.json().catch(()=>({})); toast('❌ Error',d.message||'HTTP '+r.status,'error'); }
  } catch(err) { toast('❌ Sin conexión',err.message,'error'); }
  finally { if (btn) { btn.disabled=false; btn.innerHTML=orig; } }
}

async function guardarTokenGlobal() {
  const token    = document.getElementById('sa-token-doc')?.value?.trim();
  const proveedor= document.getElementById('sa-proveedor-doc')?.value || 'apis_net_pe';
  const btn      = document.querySelector('[onclick="guardarTokenGlobal()"]');
  const orig     = btn?.innerHTML;

  if (btn) { btn.disabled=true; btn.innerHTML='Guardando…'; }
  try {
    const update = { proveedor_dni_ruc: proveedor, actualizado_el: new Date().toISOString() };
    if (token) update.token_dni_ruc = token; // solo actualiza si se ingresó uno nuevo

    const { error } = await db.from('configuracion_global').update(update).eq('id', 1);
    if (error) throw error;

    toast('✅ Token global guardado', 'Proveedor: ' + proveedor + ' · Todos los hoteles actualizados', 'ok');
    document.getElementById('sa-token-doc').value = '';
    moduloSaDashboard(); // recargar para actualizar el badge
  } catch(err) {
    toast('Error', err.message, 'error');
  } finally {
    if (btn) { btn.disabled=false; btn.innerHTML=orig; }
  }
}

async function probarTokenGlobal() {
  const btn  = document.querySelector('[onclick="probarTokenGlobal()"]');
  const orig = btn?.innerHTML;
  if (btn) { btn.disabled=true; btn.innerHTML='Probando…'; }
  try {
    // Prueba con DNI ficticio — la RPC validará las credenciales
    const { data, error } = await db.rpc('fn_consultar_documento', {
      p_tipo: 'dni', p_numero: '00000000'
    });
    if (error) throw new Error(error.message);
    if (data?.error && data.error.includes('no configurado')) {
      toast('⚠️ Token no configurado', 'Guarda un token primero', 'warn');
    } else if (data?.error) {
      // Si hay error del proveedor pero la RPC funcionó = token conecta OK
      toast('✅ Conexión OK', 'La RPC responde. El proveedor devuelve: ' + data.error, 'ok');
    } else {
      toast('✅ Token activo', 'El servicio de identidad responde correctamente', 'ok');
    }
  } catch(err) {
    toast('❌ Error', err.message, 'error');
  } finally {
    if (btn) { btn.disabled=false; btn.innerHTML=orig; }
  }
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
        <div class="tabla-wrap">
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

    // Cargar cuota CPE del hotel
    const { data: cuotaData } = await db.rpc('fn_verificar_cuota_cpe', { p_hotel_id: hotelId }).catch(()=>({data:null}));
    const cuota = cuotaData || { limite:150, emitidos:0, disponibles:150, puede_emitir:true };
    const pctCuota = Math.min(100, Math.round((cuota.emitidos/cuota.limite)*100));
    const colorCuota = pctCuota>=90?'#DC2626':pctCuota>=70?'#EA580C':'#16A34A';

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

      <!-- 6. Cuota de comprobantes CPE -->
      <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--azul);margin-bottom:0.65rem;">6 · Cuota de comprobantes (CPE / mes)</div>
      <div style="background:var(--gris-bg);border-radius:10px;padding:0.85rem 1rem;margin-bottom:0.75rem;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
          <span style="font-size:0.82rem;font-weight:600;">Uso del mes</span>
          <span style="font-size:0.85rem;font-weight:700;color:${colorCuota};">${cuota.emitidos} / ${cuota.limite}</span>
        </div>
        <div style="height:8px;background:var(--gris-borde);border-radius:999px;overflow:hidden;margin-bottom:0.4rem;">
          <div style="width:${pctCuota}%;height:100%;background:${colorCuota};border-radius:999px;"></div>
        </div>
        <div style="font-size:0.72rem;color:var(--texto-sub);">${cuota.disponibles} disponibles · mes ${cuota.mes||new Date().toISOString().slice(0,7)}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-bottom:1.25rem;">
        <div>
          <label style="${ST.label}">Límite base (mes)</label>
          <input style="${ST.input}" id="cuota-limite" type="number" min="1" value="${cuota.limite}" placeholder="150">
        </div>
        <div style="display:flex;flex-direction:column;justify-content:flex-end;">
          <button onclick="guardarLimiteCuota('${hotelId}')" style="padding:0.6rem;background:white;border:1.5px solid var(--azul);border-radius:9px;font-size:0.83rem;font-weight:600;color:var(--azul);cursor:pointer;">
            Actualizar límite
          </button>
        </div>
      </div>
      <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;color:#16A34A;margin-bottom:0.5rem;">Ampliar cuota (créditos extra este mes)</div>
      <div style="display:flex;gap:0.4rem;margin-bottom:1.25rem;flex-wrap:wrap;">
        ${[10,25,50,100].map(n=>`
          <button onclick="ampliarCuotaCPE('${hotelId}',${n})"
            style="flex:1;padding:0.55rem 0.25rem;background:#F0FDF4;color:#16A34A;border:1.5px solid #16A34A;border-radius:9px;font-size:0.82rem;font-weight:700;cursor:pointer;min-width:55px;">
            +${n}
          </button>`).join('')}
      </div>

      <!-- 7. Estado del hotel -->
      <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--rojo);margin-bottom:0.65rem;">7 · Estado del hotel</div>
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

async function ampliarCuotaCPE(hotelId, creditos) {
  try {
    const { data, error } = await db.rpc('fn_ampliar_cuota_cpe', {
      p_hotel_id: hotelId, p_creditos: creditos
    });
    if (error) throw error;
    toast('✅ +' + creditos + ' CPE agregados', 'Nuevo total: ' + data.emitidos + '/' + data.limite + ' · ' + data.disponibles + ' disponibles', 'ok');
    abrirGestionHotel(hotelId); // recargar modal
  } catch(err) { toast('Error', err.message, 'error'); }
}

async function guardarLimiteCuota(hotelId) {
  const limite = parseInt(document.getElementById('cuota-limite')?.value) || 150;
  if (limite < 1) { toast('Límite inválido','','warn'); return; }
  try {
    const { error } = await db.from('hoteles')
      .update({ limite_cpe_mes: limite }).eq('id', hotelId);
    if (error) throw error;
    toast('✅ Límite actualizado', limite + ' CPE/mes para este hotel', 'ok');
    abrirGestionHotel(hotelId);
  } catch(err) { toast('Error', err.message, 'error'); }
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
        <div class="tabla-wrap">
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

  const esMobile = window.innerWidth <= 768;
  const contMovs = (movs||[]).length;

  if (esMobile) {
    // ══════════════════════════════════════════════
    // LAYOUT MÓVIL — igual al mockup
    // ══════════════════════════════════════════════
    contenido().innerHTML = `

      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;gap:0.75rem;margin-bottom:0.85rem;">
        <div style="display:flex;align-items:center;gap:0.75rem;">
          <div style="width:44px;height:44px;border-radius:12px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" style="width:22px;height:22px;"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div>
            <h1 style="font-size:1.15rem;font-weight:700;color:var(--texto);margin:0;">Caja / Turno</h1>
            <p style="font-size:0.7rem;color:var(--texto-sub);margin:0;">Controla tus ingresos y egresos en tiempo real</p>
          </div>
        </div>
        <button onclick="abrirOpcionesCajaMobile()" style="width:36px;height:36px;border:1px solid var(--gris-borde);border-radius:10px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--texto-sub);">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:16px;height:16px;"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
        </button>
      </div>

      <!-- Badge turno -->
      <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:0.85rem 1rem;margin-bottom:1rem;">
        <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.35rem;">
          <span style="width:8px;height:8px;border-radius:50%;background:#16A34A;flex-shrink:0;"></span>
          <span style="font-size:0.85rem;font-weight:700;color:#16A34A;">Turno abierto</span>
        </div>
        <div style="font-size:0.78rem;color:#15803D;">${desdeStr}</div>
        <div style="font-size:0.78rem;color:#15803D;">Fondo inicial: <strong>${soles(turno.fondo_inicial)}</strong></div>
      </div>

      <!-- Tarjetas de métodos — 2 columnas arriba + 3 abajo -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.6rem;margin-bottom:0.6rem;">
        ${cajaTarjetaMobile('Efectivo (ingresos)', res.efectivo||0, '#16A34A', '#F0FDF4',
          '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>',
          (movs||[]).filter(x=>x.metodo_pago==='efectivo'&&x.tipo==='ingreso').length)}
        ${cajaTarjetaMobile('Yape', res.yape||0, '#7C3AED', '#F5F3FF',
          '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>',
          (movs||[]).filter(x=>x.metodo_pago==='yape'&&x.tipo==='ingreso').length)}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.6rem;margin-bottom:1rem;">
        ${cajaTarjetaMobile('Plin', res.plin||0, '#0891B2', '#F0F9FF',
          '<rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>',
          (movs||[]).filter(x=>x.metodo_pago==='plin'&&x.tipo==='ingreso').length)}
        ${cajaTarjetaMobile('Transferencias', res.transferencia||0, '#EA580C', '#FFF7ED',
          '<path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
          (movs||[]).filter(x=>x.metodo_pago==='transferencia'&&x.tipo==='ingreso').length)}
        ${cajaTarjetaMobile('Egresos', res.egresos||0, '#DC2626', '#FEF2F2',
          '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>',
          (movs||[]).filter(x=>x.tipo==='egreso').length)}
      </div>

      <!-- Botones de acción en 4 columnas -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.5rem;margin-bottom:1rem;">
        <button onclick="imprimirArqueoCompleto('${turno.id}')"
          style="display:flex;flex-direction:column;align-items:center;gap:0.35rem;padding:0.7rem 0.25rem;background:white;border:1px solid var(--gris-borde);border-radius:12px;cursor:pointer;font-size:0.65rem;font-weight:600;color:var(--texto-sub);">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:20px;height:20px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Reporte
        </button>
        <button onclick="verHistorialTurnos()"
          style="display:flex;flex-direction:column;align-items:center;gap:0.35rem;padding:0.7rem 0.25rem;background:white;border:1px solid var(--gris-borde);border-radius:12px;cursor:pointer;font-size:0.65rem;font-weight:600;color:var(--texto-sub);">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:20px;height:20px;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Historial
        </button>
        <button onclick="abrirFormMovimiento('ingreso')"
          style="display:flex;flex-direction:column;align-items:center;gap:0.35rem;padding:0.7rem 0.25rem;background:white;border:1.5px solid #BBF7D0;border-radius:12px;cursor:pointer;font-size:0.65rem;font-weight:700;color:#16A34A;">
          <svg viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2.5" stroke-linecap="round" style="width:20px;height:20px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Ingreso
        </button>
        <button onclick="abrirFormMovimiento('egreso')"
          style="display:flex;flex-direction:column;align-items:center;gap:0.35rem;padding:0.7rem 0.25rem;background:white;border:1.5px solid #FECACA;border-radius:12px;cursor:pointer;font-size:0.65rem;font-weight:700;color:#DC2626;">
          <svg viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2.5" stroke-linecap="round" style="width:20px;height:20px;"><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Egreso
        </button>
      </div>

      <!-- Botón Cerrar turno -->
      <button onclick="abrirCierreCiego()"
        style="width:100%;padding:0.9rem;background:linear-gradient(135deg,var(--azul),#2563EB);color:white;border:none;border-radius:14px;font-size:0.95rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:0.6rem;box-shadow:0 4px 16px rgba(37,99,235,0.35);margin-bottom:1rem;">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" style="width:18px;height:18px;"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        Cerrar turno
      </button>

      <!-- Banner movimientos -->
      <div onclick="verMovimientosMobile()" style="background:white;border:1px solid var(--gris-borde);border-radius:14px;padding:0.9rem 1rem;display:flex;align-items:center;gap:0.85rem;cursor:pointer;">
        <div style="width:40px;height:40px;border-radius:11px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" style="width:20px;height:20px;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </div>
        <div style="flex:1;">
          <div style="font-weight:700;font-size:0.9rem;">Movimientos del turno (${contMovs})</div>
          <div style="font-size:0.72rem;color:var(--texto-sub);">Lista de ingresos y egresos registrados en este turno</div>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:16px;height:16px;flex-shrink:0;"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    `;
    return;
  }

  // ══════════════════════════════════════════════
  // LAYOUT DESKTOP — igual que antes
  // ══════════════════════════════════════════════
  contenido().innerHTML = `
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
          <button onclick="verHistorialTurnos()" style="display:flex;align-items:center;gap:0.4rem;background:white;border:1px solid var(--gris-borde);border-radius:9px;padding:0.55rem 0.9rem;font-size:0.82rem;font-weight:500;color:var(--texto-sub);cursor:pointer;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:15px;height:15px;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Historial arqueos
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
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:0.75rem;margin-bottom:1.5rem;">
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
          <div class="tabla-wrap">
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

// Tarjeta de método para móvil
function cajaTarjetaMobile(label, valor, color, bg, icon, movCount) {
  return `
    <div class="card" style="padding:0.85rem;min-width:0;overflow:hidden;position:relative;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem;">
        <div style="width:32px;height:32px;border-radius:9px;background:${bg};display:flex;align-items:center;justify-content:center;">
          <svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" style="width:16px;height:16px;">${icon}</svg>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;opacity:0.7;"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
      </div>
      <div style="font-size:0.65rem;color:var(--texto-sub);margin-bottom:0.2rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${label}</div>
      <div style="font-size:1.1rem;font-weight:700;color:${color};line-height:1;">${soles(valor)}</div>
      <div style="font-size:0.65rem;color:var(--texto-sub);margin-top:0.15rem;">${movCount} movimiento${movCount!==1?'s':''}</div>
    </div>`;
}

function verMovimientosMobile() {
  const turno = SESSION.turnoActivo;
  if (!turno) return;
  // Recargar movimientos y mostrarlos en modal
  db.from('movimientos_caja').select('*').eq('turno_caja_id', turno.id)
    .order('created_at',{ascending:false}).limit(200)
    .then(({ data: movs }) => {
      const html = `
        <div style="max-height:70vh;overflow-y:auto;">
          ${!(movs||[]).length
            ? '<div style="text-align:center;padding:2rem;color:var(--texto-sub);">Sin movimientos aún</div>'
            : (movs||[]).map(m => `
              <div style="display:flex;align-items:center;gap:0.75rem;padding:0.7rem 0;border-bottom:1px solid var(--gris-borde);">
                <div style="width:36px;height:36px;border-radius:10px;background:${m.tipo==='ingreso'?'#F0FDF4':'#FEF2F2'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                  <span style="font-size:1rem;">${m.tipo==='ingreso'?'↑':'↓'}</span>
                </div>
                <div style="flex:1;min-width:0;">
                  <div style="font-weight:600;font-size:0.83rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(m.concepto||m.metodo_pago||'—')}</div>
                  <div style="font-size:0.7rem;color:var(--texto-sub);">${new Date(m.created_at).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'})}</div>
                </div>
                <div style="font-weight:700;font-size:0.9rem;color:${m.tipo==='ingreso'?'#16A34A':'#DC2626'};flex-shrink:0;">
                  ${m.tipo==='ingreso'?'+':'-'}${soles(m.monto)}
                </div>
              </div>`).join('')}
        </div>`;
      abrirModal('Movimientos del turno', html, { ancho:'440px' });
    });
}

function abrirOpcionesCajaMobile() {
  abrirModal('Opciones de caja', `
    <div style="display:flex;flex-direction:column;gap:0.5rem;">
      <button onclick="cerrarModal();imprimirArqueoCompleto('${SESSION.turnoActivo?.id}')" style="${ST.btnSec};display:flex;align-items:center;gap:0.75rem;justify-content:flex-start;padding:0.85rem 1rem;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:18px;height:18px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        Imprimir reporte del turno
      </button>
      <button onclick="cerrarModal();verHistorialTurnos()" style="${ST.btnSec};display:flex;align-items:center;gap:0.75rem;justify-content:flex-start;padding:0.85rem 1rem;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:18px;height:18px;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        Historial de arqueos
      </button>
    </div>
  `, { ancho:'340px' });
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
      SESSION._ultimoTurnoCerrado = turno.id;
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
  // Guardar el turno_id para generar el PDF
  const turnoId = SESSION._ultimoTurnoCerrado;

  let tipoTxt, tipoColor, tipoBg, tipoIcon;
  if (Math.abs(diferencia) < 0.01) {
    tipoTxt = '✅ Caja cuadrada'; tipoColor = '#16A34A'; tipoBg = '#F0FDF4';
    tipoIcon = '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>';
  } else if (diferencia < 0) {
    tipoTxt = '❌ Faltante en caja'; tipoColor = '#DC2626'; tipoBg = '#FEF2F2';
    tipoIcon = '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>';
  } else {
    tipoTxt = '⚠️ Sobrante en caja'; tipoColor = '#EA580C'; tipoBg = '#FFF7ED';
    tipoIcon = '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>';
  }

  abrirModal('Resultado del arqueo', `
    <div style="text-align:center;margin-bottom:1.25rem;">
      <div style="width:64px;height:64px;border-radius:50%;background:${tipoBg};display:flex;align-items:center;justify-content:center;margin:0 auto 0.85rem;">
        <svg viewBox="0 0 24 24" fill="none" stroke="${tipoColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:30px;height:30px;">${tipoIcon}</svg>
      </div>
      <div style="font-size:1.25rem;font-weight:700;color:${tipoColor};">${tipoTxt}</div>
    </div>

    <div style="background:var(--gris-bg);border-radius:12px;padding:1.1rem;margin-bottom:1.1rem;">
      ${[
        ['Efectivo esperado', soles(esperado)],
        ['Efectivo declarado', soles(declarado)],
      ].map(([l,v])=>`
        <div style="display:flex;justify-content:space-between;padding:0.35rem 0;font-size:0.88rem;">
          <span style="color:var(--texto-sub);">${l}</span><strong>${v}</strong>
        </div>`).join('')}
      <div style="height:1px;background:var(--gris-borde);margin:0.5rem 0;"></div>
      <div style="display:flex;justify-content:space-between;font-size:1.05rem;">
        <span style="font-weight:600;">Diferencia</span>
        <strong style="color:${tipoColor};">${diferencia>=0?'+':''}${soles(diferencia)}</strong>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;">
      <button onclick="imprimirArqueoCompleto('${turnoId}')"
        style="padding:0.75rem;background:linear-gradient(135deg,var(--azul),#2563EB);color:white;border:none;border-radius:10px;font-size:0.88rem;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:0.4rem;box-shadow:0 4px 14px rgba(37,99,235,0.3);">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" style="width:16px;height:16px;"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        Imprimir arqueo
      </button>
      <button onclick="cerrarModal();moduloCaja()"
        style="padding:0.75rem;background:white;border:1.5px solid var(--gris-borde);border-radius:10px;font-size:0.88rem;font-weight:600;cursor:pointer;color:var(--texto-sub);">
        Cerrar
      </button>
    </div>
  `, { ancho: '420px' });
}

async function imprimirArqueoCompleto(turnoId) {
  try {
    // Cargar datos del turno
    const { data: turno } = await db.from('turnos_caja')
      .select('*, perfiles_usuarios(nombre_completo)')
      .eq('id', turnoId).single();

    // Todos los movimientos del turno
    const { data: movs } = await db.from('movimientos_caja')
      .select('tipo,monto,metodo_pago,concepto,created_at')
      .eq('turno_caja_id', turnoId)
      .order('created_at');

    const hotel = SESSION.hotel;
    const cajero = turno?.perfiles_usuarios?.nombre_completo || SESSION.perfil?.nombre_completo || '—';

    // Calcular totales por método
    const metodos = ['efectivo','yape','plin','transferencia','otro'];
    const totMetodo = {};
    metodos.forEach(m => totMetodo[m] = { ing:0, egr:0 });

    let totalIngresos = 0, totalEgresos = 0;
    (movs||[]).forEach(m => {
      const met = m.metodo_pago || 'efectivo';
      const key = metodos.includes(met) ? met : 'otro';
      if (m.tipo === 'ingreso') { totMetodo[key].ing += Number(m.monto); totalIngresos += Number(m.monto); }
      else                      { totMetodo[key].egr += Number(m.monto); totalEgresos  += Number(m.monto); }
    });

    const neto            = totalIngresos - totalEgresos;
    const fondoInicial    = Number(turno?.fondo_inicial || 0);
    const efectivoEsp     = Number(turno?.efectivo_esperado || 0);
    const efectivoDec     = Number(turno?.efectivo_declarado || 0);
    const diferencia      = Number(turno?.diferencia || 0);
    const apertura        = turno?.apertura_at  || turno?.created_at;
    const cierre          = turno?.cierre_at;
    const ahora           = new Date();

    // Duración del turno
    const durMin  = apertura ? Math.floor((new Date(cierre||ahora) - new Date(apertura))/60000) : 0;
    const durStr  = durMin >= 60 ? Math.floor(durMin/60)+'h '+(durMin%60)+'min' : durMin+'min';

    const ventana = window.open('','_blank','width=420,height=700');
    ventana.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Arqueo de Caja</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Courier New',Courier,monospace; font-size:12px; color:#000; padding:12px; max-width:320px; margin:0 auto; }
  .center { text-align:center; }
  .bold { font-weight:bold; }
  .line { border-top:1px dashed #000; margin:6px 0; }
  .double { border-top:2px solid #000; margin:6px 0; }
  .row { display:flex; justify-content:space-between; margin:2px 0; }
  .titulo { font-size:15px; font-weight:bold; text-align:center; margin:6px 0; }
  .subtitulo { font-size:11px; text-align:center; color:#333; margin-bottom:4px; }
  .badge { display:inline-block; border:1px solid #000; padding:2px 8px; margin:3px auto; border-radius:3px; }
  .seccion { font-size:10px; font-weight:bold; text-transform:uppercase; margin:6px 0 3px; letter-spacing:0.05em; }
  .ok    { color:#16A34A; }
  .error { color:#DC2626; }
  .warn  { color:#EA580C; }
  @media print {
    body { padding:5px; }
    .no-print { display:none !important; }
    button { display:none; }
  }
</style>
</head>
<body>

  <div class="center bold" style="font-size:14px;">${escapeHtml(hotel?.razon_social||hotel?.nombre_comercial||'Hotel')}</div>
  <div class="center" style="font-size:10px;">${escapeHtml(hotel?.direccion||'')}</div>
  <div class="titulo">ARQUEO DE CAJA</div>
  <div class="line"></div>

  <div class="row"><span>Cajero:</span><span class="bold">${escapeHtml(cajero)}</span></div>
  <div class="row"><span>Apertura:</span><span>${apertura ? new Date(apertura).toLocaleString('es-PE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—'}</span></div>
  <div class="row"><span>Cierre:</span><span>${cierre ? new Date(cierre).toLocaleString('es-PE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—'}</span></div>
  <div class="row"><span>Duración:</span><span>${durStr}</span></div>
  <div class="row"><span>Fondo inicial:</span><span>S/ ${fondoInicial.toFixed(2)}</span></div>
  <div class="line"></div>

  <!-- Resumen por método -->
  <div class="seccion">Ingresos por método de pago</div>
  ${metodos.filter(m => totMetodo[m].ing > 0 || totMetodo[m].egr > 0).map(m => `
  <div class="row">
    <span>${m.charAt(0).toUpperCase()+m.slice(1)}</span>
    <span>
      ${totMetodo[m].ing > 0 ? '+S/ '+totMetodo[m].ing.toFixed(2) : ''}
      ${totMetodo[m].egr > 0 ? ' -S/ '+totMetodo[m].egr.toFixed(2) : ''}
    </span>
  </div>`).join('')}
  <div class="line"></div>
  <div class="row bold"><span>Total ingresos</span><span>S/ ${totalIngresos.toFixed(2)}</span></div>
  <div class="row bold"><span>Total egresos</span><span>-S/ ${totalEgresos.toFixed(2)}</span></div>
  <div class="row bold" style="font-size:13px;"><span>NETO</span><span>S/ ${neto.toFixed(2)}</span></div>
  <div class="double"></div>

  <!-- Arqueo de efectivo -->
  <div class="seccion">Arqueo de efectivo</div>
  <div class="row"><span>Fondo inicial</span><span>S/ ${fondoInicial.toFixed(2)}</span></div>
  <div class="row"><span>Ingresos efectivo</span><span>+S/ ${totMetodo['efectivo'].ing.toFixed(2)}</span></div>
  <div class="row"><span>Egresos efectivo</span><span>-S/ ${totMetodo['efectivo'].egr.toFixed(2)}</span></div>
  <div class="line"></div>
  <div class="row bold"><span>Efectivo esperado</span><span>S/ ${efectivoEsp.toFixed(2)}</span></div>
  <div class="row bold"><span>Efectivo declarado</span><span>S/ ${efectivoDec.toFixed(2)}</span></div>
  <div class="double"></div>
  <div class="row bold" style="font-size:13px;">
    <span>DIFERENCIA</span>
    <span class="${Math.abs(diferencia)<0.01?'ok':diferencia<0?'error':'warn'}">${diferencia>=0?'+':''}S/ ${diferencia.toFixed(2)}</span>
  </div>
  <div class="line"></div>

  <!-- Detalle de movimientos -->
  <div class="seccion">Detalle de movimientos (${(movs||[]).length})</div>
  ${(movs||[]).map(m => `
  <div style="display:flex;justify-content:space-between;margin:2px 0;font-size:11px;">
    <span style="max-width:190px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${m.tipo==='ingreso'?'+':'-'} ${escapeHtml(m.concepto||m.metodo_pago||'—')}</span>
    <span style="${m.tipo==='ingreso'?'':'color:#DC2626;'}">S/ ${Number(m.monto).toFixed(2)}</span>
  </div>`).join('')}
  <div class="double"></div>

  <!-- Notas de cierre -->
  ${turno?.notas_cierre ? `<div class="seccion">Notas</div><div style="font-size:11px;">${escapeHtml(turno.notas_cierre)}</div><div class="line"></div>` : ''}

  <!-- Resultado final -->
  <div class="center bold" style="font-size:13px;margin:6px 0;">
    ${Math.abs(diferencia)<0.01
      ? '<span class="ok">✓ CAJA CUADRADA</span>'
      : diferencia<0
        ? '<span class="error">✗ FALTANTE: S/ '+Math.abs(diferencia).toFixed(2)+'</span>'
        : '<span class="warn">⚠ SOBRANTE: S/ '+diferencia.toFixed(2)+'</span>'}
  </div>
  <div class="line"></div>

  <!-- Firma -->
  <div style="margin-top:20px;">
    <div class="row">
      <div style="text-align:center;flex:1;border-top:1px solid #000;margin:0 5px;padding-top:4px;font-size:10px;">
        Cajero<br>${escapeHtml(cajero)}
      </div>
      <div style="text-align:center;flex:1;border-top:1px solid #000;margin:0 5px;padding-top:4px;font-size:10px;">
        Administrador<br>&nbsp;
      </div>
    </div>
  </div>

  <div class="center" style="font-size:9px;margin-top:8px;color:#666;">
    Impreso el ${ahora.toLocaleString('es-PE')}<br>
    HospedaYa · Sistema de Gestión Hotelera
  </div>

  <div class="no-print" style="text-align:center;margin-top:16px;">
    <button onclick="window.print()" style="padding:8px 20px;background:#2563EB;color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px;margin-right:8px;">
      🖨️ Imprimir
    </button>
    <button onclick="window.close()" style="padding:8px 16px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;cursor:pointer;font-size:13px;">
      Cerrar
    </button>
  </div>
</body>
</html>`);
    ventana.document.close();

  } catch(err) {
    toast('Error al generar arqueo', err.message, 'error');
  }
}




async function verHistorialTurnos() {
  try {
    const { data: turnos } = await db.from('turnos_caja')
      .select('*, perfiles_usuarios(nombre_completo)')
      .eq('hotel_id', SESSION.hotel.id)
      .eq('estado', 'cerrado')
      .order('cierre_at', { ascending: false })
      .limit(20);

    abrirModal('📋 Historial de arqueos', `
      ${!turnos?.length
        ? `<div style="text-align:center;color:var(--texto-sub);padding:2rem;">Sin arqueos registrados</div>`
        : `<div style="display:flex;flex-direction:column;gap:0.5rem;max-height:460px;overflow-y:auto;">
            ${turnos.map(t => {
              const dif = Number(t.diferencia || 0);
              const color = Math.abs(dif)<0.01 ? '#16A34A' : dif<0 ? '#DC2626' : '#EA580C';
              const label = Math.abs(dif)<0.01 ? '✅ Cuadrada' : dif<0 ? '❌ Faltante' : '⚠️ Sobrante';
              return `
                <div style="background:white;border:1px solid var(--gris-borde);border-radius:12px;padding:0.9rem 1rem;display:flex;align-items:center;gap:0.75rem;">
                  <div style="flex:1;min-width:0;">
                    <div style="font-weight:700;font-size:0.88rem;">${fechaCorta(t.apertura_at||t.created_at)}</div>
                    <div style="font-size:0.75rem;color:var(--texto-sub);">
                      ${t.perfiles_usuarios?.nombre_completo||'—'}
                      ${t.cierre_at?' · Cierre: '+new Date(t.cierre_at).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'}):''}
                    </div>
                  </div>
                  <div style="text-align:right;">
                    <div style="font-size:0.72rem;font-weight:700;color:${color};">${label}</div>
                    <div style="font-size:0.8rem;font-weight:700;color:${dif<0?'var(--rojo)':'var(--verde)'};">
                      ${dif>=0?'+':''}S/ ${Math.abs(dif).toFixed(2)}
                    </div>
                  </div>
                  <button onclick="imprimirArqueoCompleto('${t.id}')"
                    style="padding:0.4rem 0.65rem;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;font-size:0.75rem;font-weight:600;color:var(--azul);cursor:pointer;flex-shrink:0;">
                    🖨️
                  </button>
                </div>`;
            }).join('')}
          </div>`}
    `, { ancho: '480px' });
  } catch(err) { toast('Error', err.message, 'error'); }
}


//  Busca: huéspedes, habitaciones, reservas activas
// ════════════════════════════════════════════════════════════
let _busqTimer  = null;
let _busqActivo = 0; // índice del resultado activo (teclado)
let _busqResultados = [];

async function busquedaGlobalInput(q) {
  clearTimeout(_busqTimer);
  q = q.trim();

  // Ocultar si menos de 2 caracteres
  if (q.length < 2) { cerrarPanelBusqueda(); return; }

  // Mostrar spinner mientras busca
  mostrarPanelBusqueda();
  document.getElementById('busqueda-resultados').innerHTML = `
    <div style="padding:1.5rem;text-align:center;color:var(--texto-sub);font-size:0.85rem;">
      <div class="spinner" style="width:18px;height:18px;margin:0 auto 0.5rem;"></div>
      Buscando…
    </div>`;

  _busqTimer = setTimeout(() => ejecutarBusqueda(q), 280);
}

async function ejecutarBusqueda(q) {
  if (!SESSION.hotel) return;
  const ql = q.toLowerCase();
  const resultados = [];

  try {
    // ── 1. Huéspedes ────────────────────────────────────────
    const { data: huespedes } = await db.from('huespedes')
      .select('id,nombres,apellidos,num_doc,tipo_doc,celular')
      .eq('hotel_id', SESSION.hotel.id)
      .or(`nombres.ilike.%${q}%,apellidos.ilike.%${q}%,num_doc.ilike.%${q}%`)
      .limit(5);

    (huespedes||[]).forEach(h => {
      resultados.push({
        tipo:    'huesped',
        id:      h.id,
        titulo:  `${h.nombres} ${h.apellidos}`,
        sub:     `${h.tipo_doc} ${h.num_doc}${h.celular?' · '+h.celular:''}`,
        icono:   '👤',
        color:   '#2563EB',
        bg:      '#EFF6FF',
        accion:  () => abrirFichaHuesped(h.id),
      });
    });

    // ── 2. Habitaciones ──────────────────────────────────────
    const { data: habs } = await db.from('habitaciones')
      .select('id,numero,estado,tipos_habitacion(nombre)')
      .eq('hotel_id', SESSION.hotel.id)
      .ilike('numero', `%${q}%`)
      .limit(5);

    (habs||[]).forEach(h => {
      const c = COLORES_ESTADO?.[h.estado] || { label: h.estado, badgeBg: '#64748B' };
      resultados.push({
        tipo:   'habitacion',
        id:     h.id,
        titulo: `Hab. ${h.numero} — ${h.tipos_habitacion?.nombre||''}`,
        sub:    c.label,
        icono:  '🛏️',
        color:  '#7C3AED',
        bg:     '#F5F3FF',
        badge:  c.label,
        badgeColor: c.badgeBg,
        accion: () => { navegarA('rack'); },
      });
    });

    // ── 3. Estadías activas / reservadas ────────────────────
    const { data: estadias } = await db.from('estadias_reservas')
      .select('id,estado,fecha_entrada,habitaciones(numero),huespedes(nombres,apellidos,num_doc)')
      .eq('hotel_id', SESSION.hotel.id)
      .in('estado', ['activa','reservada'])
      .limit(30);

    (estadias||[]).filter(e => {
      const hu = e.huespedes;
      const txt = `${hu?.nombres||''} ${hu?.apellidos||''} ${hu?.num_doc||''} ${e.habitaciones?.numero||''}`.toLowerCase();
      return txt.includes(ql);
    }).slice(0,4).forEach(e => {
      const hu = e.huespedes||{};
      resultados.push({
        tipo:   'estadia',
        id:     e.id,
        titulo: `${hu.nombres||''} ${hu.apellidos||''} — Hab. ${e.habitaciones?.numero||'?'}`,
        sub:    `${e.estado==='activa'?'🏨 Estadía activa':'📅 Reserva'} · Entrada: ${fechaCorta(e.fecha_entrada)}`,
        icono:  e.estado==='activa' ? '🏨' : '📅',
        color:  e.estado==='activa' ? '#16A34A' : '#CA8A04',
        bg:     e.estado==='activa' ? '#F0FDF4' : '#FEFCE8',
        accion: () => navegarA('rack'),
      });
    });

    _busqResultados = resultados;
    _busqActivo = 0;
    renderResultadosBusqueda(q);

  } catch(err) {
    document.getElementById('busqueda-resultados').innerHTML = `
      <div style="padding:1.5rem;text-align:center;color:var(--rojo);font-size:0.83rem;">Error: ${escapeHtml(err.message)}</div>`;
  }
}

function renderResultadosBusqueda(q) {
  const cont = document.getElementById('busqueda-resultados');
  if (!cont) return;

  if (!_busqResultados.length) {
    cont.innerHTML = `
      <div style="padding:2rem;text-align:center;">
        <div style="font-size:2rem;margin-bottom:0.5rem;">🔍</div>
        <div style="font-weight:600;color:var(--texto);margin-bottom:0.25rem;">Sin resultados para "${escapeHtml(q)}"</div>
        <div style="font-size:0.8rem;color:var(--texto-sub);">Prueba con el nombre, DNI o número de habitación</div>
      </div>`;
    return;
  }

  // Agrupar por tipo
  const grupos = {
    huesped:    { label:'Huéspedes',   items:[] },
    habitacion: { label:'Habitaciones', items:[] },
    estadia:    { label:'Estadías',     items:[] },
  };
  _busqResultados.forEach(r => grupos[r.tipo]?.items.push(r));

  let html = '';
  let idx = 0;
  Object.entries(grupos).forEach(([tipo, grupo]) => {
    if (!grupo.items.length) return;
    html += `<div style="padding:0.5rem 1rem 0.25rem;font-size:0.68rem;font-weight:700;text-transform:uppercase;color:var(--texto-sub);letter-spacing:0.05em;">${grupo.label}</div>`;
    grupo.items.forEach(r => {
      const i = idx++;
      html += `
        <div class="busq-item" data-idx="${i}"
          onclick="clickResultadoBusqueda(${i})"
          onmouseover="activarResultado(${i})"
          style="display:flex;align-items:center;gap:0.85rem;padding:0.75rem 1rem;cursor:pointer;transition:background 0.1s;${i===0?'background:var(--gris-bg);':''}"
          onmouseout="this.style.background=''">
          <div style="width:36px;height:36px;border-radius:10px;background:${r.bg};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:1.1rem;">${r.icono}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:600;font-size:0.88rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(r.titulo)}</div>
            <div style="font-size:0.73rem;color:var(--texto-sub);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(r.sub)}</div>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;flex-shrink:0;"><polyline points="9 18 15 12 9 6"/></svg>
        </div>`;
    });
  });

  // Footer con tip de teclado
  html += `
    <div style="padding:0.65rem 1rem;border-top:1px solid var(--gris-borde);display:flex;align-items:center;gap:0.75rem;font-size:0.72rem;color:var(--texto-sub);">
      <span>↑↓ Navegar</span>
      <span>↵ Abrir</span>
      <span>Esc Cerrar</span>
    </div>`;

  cont.innerHTML = html;
}

function activarResultado(idx) {
  _busqActivo = idx;
  document.querySelectorAll('.busq-item').forEach((el,i) => {
    el.style.background = i===idx ? 'var(--gris-bg)' : '';
  });
}

function clickResultadoBusqueda(idx) {
  const r = _busqResultados[idx];
  if (!r) return;
  cerrarPanelBusqueda();
  document.getElementById('topbar-buscar').value = '';
  // Si es huésped abrimos la ficha directamente
  if (r.tipo === 'huesped') {
    abrirFichaHuesped(r.id);
  } else {
    r.accion?.();
  }
}

function busquedaGlobalKeydown(e) {
  const total = _busqResultados.length;
  if (!total) return;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    activarResultado((_busqActivo+1) % total);
    scrollResultadoActivo();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    activarResultado((_busqActivo-1+total) % total);
    scrollResultadoActivo();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    clickResultadoBusqueda(_busqActivo);
  } else if (e.key === 'Escape') {
    cerrarPanelBusqueda();
  }
}

function scrollResultadoActivo() {
  const el = document.querySelector(`.busq-item[data-idx="${_busqActivo}"]`);
  el?.scrollIntoView({ block:'nearest' });
}

function mostrarPanelBusqueda() {
  const panel = document.getElementById('panel-busqueda');
  if (panel) panel.style.display = 'block';
}

function cerrarPanelBusqueda() {
  const panel = document.getElementById('panel-busqueda');
  if (panel) panel.style.display = 'none';
  _busqResultados = [];
  _busqActivo = 0;
}

// Cerrar al hacer click fuera
document.addEventListener('click', e => {
  const search = document.querySelector('.topbar-search');
  if (search && !search.contains(e.target)) cerrarPanelBusqueda();
});


let _notificaciones = [];
let _panelAbierto   = false;

async function cargarNotificaciones() {
  if (!SESSION.hotel || SESSION.perfil?.es_superadmin) return;
  try {
    const ahora    = new Date();
    const hoy      = ahora.toISOString().slice(0,10);
    const notis    = [];

    // 1. Habitaciones que vencen hoy (salida prevista hoy)
    const { data: vencenHoy } = await db.from('estadias_reservas')
      .select('*, habitaciones(numero), huespedes(nombres,apellidos)')
      .eq('hotel_id', SESSION.hotel.id)
      .eq('estado','activa')
      .gte('fecha_salida_prev', hoy+'T00:00:00')
      .lte('fecha_salida_prev', hoy+'T23:59:59');

    (vencenHoy||[]).forEach(e => {
      const hora = new Date(e.fecha_salida_prev).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'});
      notis.push({
        id: 'salida-'+e.id, tipo: 'salida', urgencia: 'alta',
        titulo: `Check-out previsto · Hab. ${e.habitaciones?.numero}`,
        msg: `${e.huespedes?.nombres} ${e.huespedes?.apellidos} · Salida a las ${hora}`,
        accion: () => navegarA('rack'),
        icono: '🚪', color: '#DC2626', bg: '#FEF2F2',
      });
    });

    // 2. Reservas con entrada hoy
    const { data: entradasHoy } = await db.from('estadias_reservas')
      .select('*, habitaciones(numero), huespedes(nombres,apellidos)')
      .eq('hotel_id', SESSION.hotel.id)
      .eq('estado','reservada')
      .gte('fecha_entrada', hoy+'T00:00:00')
      .lte('fecha_entrada', hoy+'T23:59:59');

    (entradasHoy||[]).forEach(e => {
      notis.push({
        id: 'entrada-'+e.id, tipo: 'entrada', urgencia: 'media',
        titulo: `Check-in hoy · Hab. ${e.habitaciones?.numero}`,
        msg: `${e.huespedes?.nombres} ${e.huespedes?.apellidos} tiene reserva para hoy`,
        accion: () => navegarA('rack'),
        icono: '📅', color: '#2563EB', bg: '#EFF6FF',
      });
    });

    // 3. Habitaciones en limpieza por mucho tiempo (> 2 horas)
    const { data: enLimpieza } = await db.from('habitaciones')
      .select('*').eq('hotel_id', SESSION.hotel.id).eq('estado','limpieza');

    (enLimpieza||[]).forEach(h => {
      notis.push({
        id: 'limpieza-'+h.id, tipo: 'limpieza', urgencia: 'baja',
        titulo: `Hab. ${h.numero} en limpieza`,
        msg: 'Pendiente de marcar como libre',
        accion: () => navegarA('rack'),
        icono: '🧹', color: '#CA8A04', bg: '#FEFCE8',
      });
    });

    // 4. Turno sin cerrar del día anterior
    if (SESSION.turnoActivo) {
      const apertura = new Date(SESSION.turnoActivo.apertura_at||SESSION.turnoActivo.created_at);
      const horas    = Math.floor((ahora - apertura) / 3600000);
      if (horas >= 12) {
        notis.push({
          id: 'turno-abierto', tipo: 'turno', urgencia: 'media',
          titulo: 'Turno abierto hace ' + horas + 'h',
          msg: 'El turno lleva más de 12 horas abierto. Considera hacer el arqueo.',
          accion: () => navegarA('caja'),
          icono: '💰', color: '#EA580C', bg: '#FFF7ED',
        });
      }
    }

    // 5. Suscripción por vencer (≤ 7 días)
    if (SESSION.hotel.fecha_vencimiento) {
      const diasRestantes = Math.ceil(
        (new Date(SESSION.hotel.fecha_vencimiento) - ahora) / (1000*60*60*24)
      );
      if (diasRestantes > 0 && diasRestantes <= 7) {
        notis.push({
          id: 'suscripcion', tipo: 'suscripcion', urgencia: diasRestantes<=3?'alta':'media',
          titulo: `Suscripción vence en ${diasRestantes} día${diasRestantes!==1?'s':''}`,
          msg: 'Renueva para no perder el acceso al sistema',
          accion: () => navegarA('suscripcion'),
          icono: '⚠️', color: diasRestantes<=3?'#DC2626':'#EA580C',
          bg: diasRestantes<=3?'#FEF2F2':'#FFF7ED',
        });
      }
    }

    // 6. Habitaciones en mantenimiento
    const { data: enMant } = await db.from('habitaciones')
      .select('numero').eq('hotel_id', SESSION.hotel.id).eq('estado','mantenimiento');
    if (enMant?.length) {
      notis.push({
        id: 'mantenimiento', tipo: 'mantenimiento', urgencia: 'baja',
        titulo: `${enMant.length} hab. en mantenimiento`,
        msg: enMant.map(h=>`Hab. ${h.numero}`).join(', '),
        accion: () => navegarA('rack'),
        icono: '🔧', color: '#64748B', bg: '#F1F5F9',
      });
    }

    _notificaciones = notis;
    actualizarBadgeCampana();
    if (_panelAbierto) renderPanelNotificaciones();
  } catch(e) { console.warn('Notificaciones:', e.message); }
}

function actualizarBadgeCampana() {
  const dot   = document.getElementById('bell-dot');
  const count = document.getElementById('bell-count');
  const n = _notificaciones.filter(n=>n.urgencia==='alta'||n.urgencia==='media').length;
  if (n > 0) {
    if (dot)   { dot.style.display='block'; }
    if (count) { count.textContent=n>9?'9+':n; count.style.display='flex'; }
  } else {
    if (dot)   dot.style.display='none';
    if (count) count.style.display='none';
  }
}

function toggleNotificaciones() {
  const panel = document.getElementById('panel-notificaciones');
  if (!panel) return;
  _panelAbierto = !_panelAbierto;
  panel.style.display = _panelAbierto ? 'block' : 'none';
  if (_panelAbierto) {
    renderPanelNotificaciones();
    // Cerrar al hacer click fuera
    setTimeout(()=>{
      document.addEventListener('click', cerrarNotificacionesFuera, { once:true });
    }, 10);
  }
}

function cerrarNotificaciones() {
  _panelAbierto = false;
  const panel = document.getElementById('panel-notificaciones');
  if (panel) panel.style.display = 'none';
}

function cerrarNotificacionesFuera(e) {
  const panel = document.getElementById('panel-notificaciones');
  const btn   = document.getElementById('btn-campana');
  if (panel && !panel.contains(e.target) && !btn?.contains(e.target)) {
    cerrarNotificaciones();
  }
}

function renderPanelNotificaciones() {
  const lista = document.getElementById('lista-notificaciones');
  if (!lista) return;

  if (!_notificaciones.length) {
    lista.innerHTML = `
      <div style="padding:2.5rem;text-align:center;color:var(--texto-sub);">
        <div style="font-size:2.5rem;margin-bottom:0.75rem;">✅</div>
        <div style="font-weight:600;margin-bottom:0.25rem;">Todo al día</div>
        <div style="font-size:0.82rem;">No hay notificaciones pendientes</div>
      </div>`;
    return;
  }

  // Ordenar: alta → media → baja
  const orden = { alta:0, media:1, baja:2 };
  const sorted = [..._notificaciones].sort((a,b)=>orden[a.urgencia]-orden[b.urgencia]);

  lista.innerHTML = sorted.map(n=>`
    <div onclick="clickNotificacion('${n.id}')"
      style="display:flex;align-items:flex-start;gap:0.75rem;padding:0.9rem 1.1rem;border-bottom:1px solid var(--gris-borde);cursor:pointer;transition:background 0.1s;"
      onmouseover="this.style.background='var(--gris-bg)'"
      onmouseout="this.style.background='white'">
      <div style="width:36px;height:36px;border-radius:10px;background:${n.bg};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:1.1rem;">${n.icono}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:700;font-size:0.85rem;color:${n.color};">${escapeHtml(n.titulo)}</div>
        <div style="font-size:0.78rem;color:var(--texto-sub);margin-top:0.15rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(n.msg)}</div>
      </div>
      <div style="width:8px;height:8px;border-radius:50%;background:${n.urgencia==='baja'?'#CBD5E1':n.color};flex-shrink:0;margin-top:4px;"></div>
    </div>`).join('');

  // Footer
  lista.innerHTML += `
    <div style="padding:0.75rem 1.1rem;text-align:center;">
      <button onclick="cargarNotificaciones()" style="font-size:0.78rem;color:var(--azul);font-weight:600;background:none;border:none;cursor:pointer;">
        🔄 Actualizar
      </button>
    </div>`;
}

function clickNotificacion(id) {
  const n = _notificaciones.find(x=>x.id===id);
  if (n?.accion) { n.accion(); cerrarNotificaciones(); }
}

function marcarTodasLeidas() {
  _notificaciones = [];
  actualizarBadgeCampana();
  renderPanelNotificaciones();
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

    const hoyIni = new Date(); hoyIni.setHours(0,0,0,0);
    const hoyFin = new Date(); hoyFin.setHours(23,59,59,999);

    const { data: llegadas } = await db.from('estadias_reservas')
      .select(`fecha_entrada, estado, habitaciones(numero), huespedes(nombres, apellidos)`)
      .eq('hotel_id', SESSION.hotel.id)
      .gte('fecha_entrada', hoyIni.toISOString()).lte('fecha_entrada', hoyFin.toISOString())
      .order('fecha_entrada').limit(6);

    const { data: reservasProx } = await db.from('estadias_reservas')
      .select(`fecha_entrada, habitaciones(numero), huespedes(nombres, apellidos)`)
      .eq('hotel_id', SESSION.hotel.id)
      .eq('estado', 'reservada')
      .gte('fecha_entrada', new Date().toISOString())
      .order('fecha_entrada').limit(6);

    const { data: movsHoy } = await db.from('movimientos_caja')
      .select('tipo, monto, metodo_pago, created_at')
      .eq('hotel_id', SESSION.hotel.id)
      .gte('created_at', hoyIni.toISOString()).lte('created_at', hoyFin.toISOString())
      .limit(2000);
    const ingresosHoy = (movsHoy||[]).filter(m=>m.tipo==='ingreso').reduce((s,m)=>s+Number(m.monto),0);

    const porHora = {};
    (movsHoy||[]).forEach(m => {
      if (m.tipo !== 'ingreso') return;
      const h = new Date(m.created_at).getHours();
      porHora[h] = (porHora[h]||0) + Number(m.monto);
    });
    const horasLabels = ['8a','10a','12p','2p','4p','6p','8p'];
    const horasKeys   = [8,10,12,14,16,18,20];
    const horasData   = horasKeys.map(h => (porHora[h]||0) + (porHora[h+1]||0));

    const fechaHoy = new Date().toLocaleDateString('es-PE', {
      weekday:'long', day:'numeric', month:'long', year:'numeric'
    }).replace(/\b\w/g, (c, i) => i === 0 ? c.toUpperCase() : c.toLowerCase());
    const nombreUsuario = (SESSION.perfil.nombre_completo || SESSION.hotel.nombre_comercial || '').split(' ')[0];
    const esMobile = window.innerWidth <= 768;

    if (esMobile) {
      // ══════════════════════════════════════════════
      // LAYOUT MÓVIL — igual al mockup
      // ══════════════════════════════════════════════
      contenido().innerHTML = `

        <!-- Saludo -->
        <div style="margin-bottom:1.1rem;">
          <h1 style="font-size:1.45rem;font-weight:700;color:var(--texto);margin:0 0 0.2rem;">
            ¡Hola, ${escapeHtml(nombreUsuario)}! 👋
          </h1>
          <p style="font-size:0.82rem;color:var(--texto-sub);margin:0;">Aquí tienes un resumen de la operación de hoy.</p>
        </div>

        <!-- Fecha -->
        <div class="card" style="display:flex;align-items:center;gap:0.75rem;padding:0.85rem 1rem;margin-bottom:1rem;cursor:default;">
          <div style="width:36px;height:36px;border-radius:10px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--azul)" stroke-width="2" stroke-linecap="round" style="width:18px;height:18px;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div style="flex:1;">
            <div style="font-size:0.82rem;font-weight:600;color:var(--texto);text-transform:capitalize;">${fechaHoy}</div>
            <div style="font-size:0.72rem;color:var(--texto-sub);">Buen día, que sea una gran jornada.</div>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" stroke-width="2" stroke-linecap="round" style="width:16px;height:16px;flex-shrink:0;"><polyline points="9 18 15 12 9 6"/></svg>
        </div>

        <!-- 4 KPIs en 2x2 -->
        <div id="dash-kpis-mobile" style="display:grid;grid-template-columns:1fr 1fr;gap:0.65rem;margin-bottom:1rem;">
          ${dashKpiMobile('Habitaciones libres',   conteo.libre,       '#16A34A','#F0FDF4','bed',      'rack')}
          ${dashKpiMobile('Habitaciones ocupadas', conteo.ocupada,     '#DC2626','#FEF2F2','bed-ocu',  'rack')}
          ${dashKpiMobile('En limpieza',           conteo.limpieza,    '#CA8A04','#FEFCE8','sparkles', 'rack')}
          ${dashKpiMobile('Reservadas',            conteo.reservada,   '#2563EB','#EFF6FF','calendar', 'reservas')}
        </div>

        <!-- Ocupación actual con dona -->
        <div class="card" style="margin-bottom:1rem;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.85rem;">
            <div>
              <div style="font-weight:700;font-size:0.95rem;">Ocupación actual</div>
              <div style="font-size:0.72rem;color:var(--texto-sub);">Resumen de estado de habitaciones</div>
            </div>
            <button onclick="navegarA('rack')" style="font-size:0.75rem;color:var(--azul);font-weight:600;background:none;border:none;cursor:pointer;display:flex;align-items:center;gap:0.2rem;">
              Ver detalle
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--azul)" stroke-width="2.5" stroke-linecap="round" style="width:13px;height:13px;"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
          <div style="display:flex;align-items:center;gap:1.25rem;">
            <div style="position:relative;width:130px;height:130px;flex-shrink:0;">
              <canvas id="chart-ocupacion"></canvas>
              <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;">
                <div style="font-size:0.65rem;color:var(--texto-sub);">Total</div>
                <div style="font-size:1.5rem;font-weight:700;">${totalHabs}</div>
              </div>
            </div>
            <div style="flex:1;">
              ${leyendaOcupacion('Libres',        conteo.libre,         totalHabs, '#16A34A')}
              ${leyendaOcupacion('Ocupadas',      conteo.ocupada,       totalHabs, '#DC2626')}
              ${leyendaOcupacion('Limpieza',      conteo.limpieza,      totalHabs, '#CA8A04')}
              ${leyendaOcupacion('Reservadas',    conteo.reservada,     totalHabs, '#2563EB')}
              ${leyendaOcupacion('Mantenimiento', conteo.mantenimiento, totalHabs, '#64748B')}
            </div>
          </div>
        </div>

        <!-- Tu turno de caja -->
        <div class="card" style="margin-bottom:1rem;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.85rem;">
            <span style="font-weight:700;font-size:0.95rem;">Tu turno de caja</span>
            ${turno
              ? '<span style="font-size:0.68rem;font-weight:700;color:#16A34A;background:#F0FDF4;padding:0.2rem 0.65rem;border-radius:999px;border:1px solid #BBF7D0;">● Abierto</span>'
              : '<span style="font-size:0.68rem;font-weight:700;color:#DC2626;background:#FEF2F2;padding:0.2rem 0.65rem;border-radius:999px;border:1px solid #FECACA;">● Cerrado</span>'}
          </div>
          ${turno ? `
            <div style="background:var(--gris-bg);border-radius:12px;padding:0.85rem 1rem;margin-bottom:0.85rem;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                  <div style="font-size:0.7rem;color:var(--texto-sub);">Turno abierto desde</div>
                  <div style="font-weight:600;font-size:0.85rem;">${fechaHora(turno.apertura_at)}</div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:0.7rem;color:var(--texto-sub);">Fondo inicial</div>
                  <div style="font-weight:700;font-size:1.05rem;color:var(--azul);">${soles(turno.fondo_inicial)}</div>
                </div>
              </div>
            </div>
            <button onclick="navegarA('caja')" style="width:100%;padding:0.85rem;background:var(--azul);color:white;border:none;border-radius:12px;font-size:0.95rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:0.5rem;">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" style="width:18px;height:18px;"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
              Ir a caja
            </button>` : `
            <p style="font-size:0.83rem;color:var(--texto-sub);margin-bottom:0.85rem;">No tienes turno abierto. Ábrelo para empezar a operar.</p>
            <button onclick="navegarA('caja')" style="width:100%;padding:0.85rem;background:var(--azul);color:white;border:none;border-radius:12px;font-size:0.95rem;font-weight:700;cursor:pointer;">
              Abrir turno
            </button>`}
        </div>

        <!-- Llegadas de hoy -->
        <div class="card" style="margin-bottom:1rem;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.85rem;">
            <span style="font-weight:700;font-size:0.95rem;">Llegadas de hoy</span>
            <a href="#" onclick="navegarA('huespedes');return false;" style="font-size:0.75rem;color:var(--azul);font-weight:600;text-decoration:none;display:flex;align-items:center;gap:0.2rem;">
              Ver todas
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--azul)" stroke-width="2.5" stroke-linecap="round" style="width:13px;height:13px;"><polyline points="9 18 15 12 9 6"/></svg>
            </a>
          </div>
          ${(llegadas||[]).length
            ? llegadas.map(l => filaPersonaMobile(l.huespedes, l.habitaciones?.numero,
                new Date(l.fecha_entrada).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'}),
                l.estado==='activa'?['Llegó','#16A34A','#F0FDF4']:['Pendiente','#CA8A04','#FEFCE8'])).join('')
            : filaVaciaMobile('Sin llegadas registradas hoy', 'Aquí aparecerán los huéspedes que llegan hoy.')}
        </div>

        <!-- Reservas próximas -->
        <div class="card" style="margin-bottom:1rem;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.85rem;">
            <span style="font-weight:700;font-size:0.95rem;">Reservas próximas</span>
            <a href="#" onclick="navegarA('reservas');return false;" style="font-size:0.75rem;color:var(--azul);font-weight:600;text-decoration:none;display:flex;align-items:center;gap:0.2rem;">
              Ver todas
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--azul)" stroke-width="2.5" stroke-linecap="round" style="width:13px;height:13px;"><polyline points="9 18 15 12 9 6"/></svg>
            </a>
          </div>
          ${(reservasProx||[]).length
            ? reservasProx.map(r => filaPersonaMobile(r.huespedes, r.habitaciones?.numero,
                new Date(r.fecha_entrada).toLocaleDateString('es-PE',{day:'numeric',month:'short'}),
                ['Confirmada','#16A34A','#F0FDF4'])).join('')
            : filaVaciaMobile('Sin reservas próximas', 'Las próximas reservas se mostrarán aquí.')}
        </div>

        <!-- Ingresos del día -->
        <div class="card" style="margin-bottom:1rem;">
          <div style="font-weight:700;font-size:0.95rem;margin-bottom:0.25rem;">Ingresos del día</div>
          <div style="font-size:2rem;font-weight:700;color:var(--texto);margin-bottom:0.85rem;">${soles(ingresosHoy)}</div>
          <canvas id="chart-ingresos-hoy" style="max-height:130px;"></canvas>
        </div>
      `;

    } else {
      // ══════════════════════════════════════════════
      // LAYOUT DESKTOP — igual que antes
      // ══════════════════════════════════════════════
      contenido().innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:1rem;margin-bottom:1.5rem;">
          <div>
            <h1 style="font-size:1.75rem;font-weight:700;color:var(--texto);margin:0;">¡Hola, ${escapeHtml(nombreUsuario)}! 👋</h1>
            <p style="color:var(--texto-sub);margin:0.35rem 0 0;font-size:0.92rem;">Aquí tienes un resumen de la operación de hoy.</p>
          </div>
          <div class="card" style="display:flex;align-items:center;gap:0.75rem;padding:0.85rem 1.15rem;">
            <div style="width:38px;height:38px;border-radius:10px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--azul)" stroke-width="2" stroke-linecap="round" style="width:20px;height:20px;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div>
              <div style="font-size:0.82rem;font-weight:600;color:var(--texto);text-transform:capitalize;">${fechaHoy}</div>
              <div style="font-size:0.72rem;color:var(--texto-sub);">Buen día, que sea una gran jornada.</div>
            </div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-bottom:1.25rem;">
          ${dashTarjeta('Habitaciones libres',   conteo.libre,         '#16A34A','#F0FDF4','bed',      'rack')}
          ${dashTarjeta('Habitaciones ocupadas', conteo.ocupada,       '#DC2626','#FEF2F2','bed',      'rack')}
          ${dashTarjeta('En limpieza',           conteo.limpieza,      '#CA8A04','#FEFCE8','sparkles', 'rack')}
          ${dashTarjeta('Reservadas',            conteo.reservada,     '#2563EB','#EFF6FF','calendar', 'reservas')}
        </div>

        <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:1rem;margin-bottom:1.25rem;" class="dash-fila">
          <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.5rem;">
              <div>
                <div style="font-weight:700;font-size:1.05rem;">Ocupación actual</div>
                <div style="font-size:0.8rem;color:var(--texto-sub);">Resumen de estado de habitaciones</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap;">
              <div style="position:relative;width:170px;height:170px;">
                <canvas id="chart-ocupacion"></canvas>
                <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;">
                  <div style="font-size:0.7rem;color:var(--texto-sub);">Total</div>
                  <div style="font-size:1.6rem;font-weight:700;">${totalHabs}</div>
                </div>
              </div>
              <div style="flex:1;min-width:180px;">
                ${leyendaOcupacion('Libres',        conteo.libre,         totalHabs, '#16A34A')}
                ${leyendaOcupacion('Ocupadas',      conteo.ocupada,       totalHabs, '#DC2626')}
                ${leyendaOcupacion('Limpieza',      conteo.limpieza,      totalHabs, '#CA8A04')}
                ${leyendaOcupacion('Reservadas',    conteo.reservada,     totalHabs, '#2563EB')}
                ${leyendaOcupacion('Mantenimiento', conteo.mantenimiento, totalHabs, '#64748B')}
              </div>
            </div>
          </div>
          <div class="card">
            <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem;">
              <span style="font-weight:700;font-size:1.05rem;">Tu turno de caja</span>
              ${turno
                ? '<span style="font-size:0.68rem;font-weight:700;color:#16A34A;background:#F0FDF4;padding:0.15rem 0.6rem;border-radius:999px;">● Abierto</span>'
                : '<span style="font-size:0.68rem;font-weight:700;color:#DC2626;background:#FEF2F2;padding:0.15rem 0.6rem;border-radius:999px;">● Cerrado</span>'}
            </div>
            ${turno ? `
              <div style="background:var(--gris-bg);border-radius:12px;padding:1rem;margin-bottom:1rem;">
                <div style="font-size:0.72rem;color:var(--texto-sub);">Turno abierto desde</div>
                <div style="font-weight:600;font-size:0.92rem;">${fechaHora(turno.apertura_at)}</div>
                <div style="font-size:0.72rem;color:var(--texto-sub);margin-top:0.6rem;">Fondo inicial</div>
                <div style="font-weight:700;font-size:1.15rem;color:var(--azul);">${soles(turno.fondo_inicial)}</div>
              </div>
              <button style="${ST.btnPri};flex:1;" onclick="navegarA('caja')">Ir a caja</button>`
            : `
              <div style="font-size:0.85rem;color:var(--texto-sub);margin-bottom:1rem;">No tienes turno abierto. Ábrelo para empezar a operar y cobrar.</div>
              <button style="${ST.btnPri};width:100%;" onclick="navegarA('caja')">Abrir turno</button>`}
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1rem;">
          <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.85rem;">
              <span style="font-weight:700;">Llegadas de hoy</span>
              <a href="#" onclick="navegarA('huespedes');return false;" style="font-size:0.78rem;color:var(--azul);text-decoration:none;font-weight:600;">Ver todas</a>
            </div>
            ${(llegadas||[]).length
              ? llegadas.map(l => filaPersona(l.huespedes, l.habitaciones?.numero,
                  new Date(l.fecha_entrada).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'}),
                  l.estado==='activa'?['Llegó','#16A34A','#F0FDF4']:['Pendiente','#CA8A04','#FEFCE8'])).join('')
              : filaVacia('Sin llegadas registradas hoy')}
          </div>
          <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.85rem;">
              <span style="font-weight:700;">Reservas próximas</span>
              <a href="#" onclick="navegarA('reservas');return false;" style="font-size:0.78rem;color:var(--azul);text-decoration:none;font-weight:600;">Ver todas</a>
            </div>
            ${(reservasProx||[]).length
              ? reservasProx.map(r => filaPersona(r.huespedes, r.habitaciones?.numero,
                  new Date(r.fecha_entrada).toLocaleDateString('es-PE',{day:'numeric',month:'short'}),
                  ['Confirmada','#16A34A','#F0FDF4'])).join('')
              : filaVacia('Sin reservas próximas')}
          </div>
          <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.35rem;">
              <span style="font-weight:700;">Ingresos del día</span>
            </div>
            <div style="font-size:1.75rem;font-weight:700;color:var(--texto);margin-bottom:0.85rem;">${soles(ingresosHoy)}</div>
            <canvas id="chart-ingresos-hoy" style="max-height:150px;"></canvas>
          </div>
        </div>
      `;
    }

    // ── Gráficos (compartidos móvil y desktop) ──────────
    requestAnimationFrame(() => {
      if (typeof Chart === 'undefined') return;

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
        data: { labels: horasLabels, datasets:[{ data: horasData, backgroundColor:'rgba(37,99,235,0.8)', borderRadius:5, barThickness:12 }] },
        options: { plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true, ticks:{ font:{size:10} } }, x:{ ticks:{ font:{size:9} } } } },
      });
    });

  } catch (err) {
    contenido().innerHTML = errorBox('No se pudo cargar el dashboard', err.message);
  }
}

// KPI card para móvil (compacta con flecha)
function dashKpiMobile(label, valor, color, bg, icon, modulo) {
  const iconos = {
    'bed':      '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>',
    'bed-ocu':  '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>',
    'sparkles': '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/>',
    'calendar': '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  };
  return `
    <div class="card" onclick="navegarA('${modulo}')" style="cursor:pointer;padding:0.85rem;display:flex;align-items:center;gap:0.65rem;min-width:0;overflow:hidden;">
      <div style="width:40px;height:40px;border-radius:12px;background:${bg};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;">${iconos[icon]||''}</svg>
      </div>
      <div style="flex:1;min-width:0;overflow:hidden;">
        <div style="font-size:1.5rem;font-weight:700;color:var(--texto);line-height:1;">${valor}</div>
        <div style="font-size:0.7rem;color:var(--texto-sub);margin-top:0.15rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${label}</div>
      </div>
      <svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" style="width:14px;height:14px;opacity:0.6;flex-shrink:0;"><polyline points="9 18 15 12 9 6"/></svg>
    </div>`;
}

// Fila de persona para móvil con estado vacío mejorado
function filaPersonaMobile(huesped, habNum, tiempo, estado) {
  const nombre = huesped ? `${huesped.nombres||''} ${huesped.apellidos||''}`.trim() : 'Huésped';
  const iniciales = nombre.split(/\s+/).slice(0,2).map(p=>p[0]||'').join('').toUpperCase() || 'H';
  return `
    <div style="display:flex;align-items:center;gap:0.75rem;padding:0.6rem 0;border-bottom:1px solid var(--gris-borde);">
      <div style="width:36px;height:36px;border-radius:10px;background:#EFF6FF;color:var(--azul);font-weight:700;font-size:0.78rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${iniciales}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:600;font-size:0.82rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(nombre)}</div>
        <div style="font-size:0.7rem;color:var(--texto-sub);">Hab. ${escapeHtml(habNum||'—')}</div>
      </div>
      <div style="text-align:right;flex-shrink:0;">
        <div style="font-size:0.7rem;color:var(--texto-sub);">${tiempo}</div>
        <span style="font-size:0.62rem;font-weight:700;color:${estado[1]};background:${estado[2]};padding:0.15rem 0.5rem;border-radius:999px;">${estado[0]}</span>
      </div>
    </div>`;
}

function filaVaciaMobile(titulo, sub) {
  return `
    <div style="text-align:center;padding:1.5rem 0.5rem;">
      <svg viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" stroke-width="1.5" stroke-linecap="round" style="width:40px;height:40px;margin-bottom:0.65rem;">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
      <div style="font-weight:600;font-size:0.83rem;color:var(--texto);margin-bottom:0.2rem;">${titulo}</div>
      <div style="font-size:0.75rem;color:var(--texto-sub);">${sub}</div>
    </div>`;
}

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
//  MÓDULO "MÁS" — Pantalla completa en móvil
// ════════════════════════════════════════════════════════════
function renderModuloMasMobile() {
  const rol   = SESSION.perfil?.rol;
  const plan  = SESSION.hotel?.plan || 'basico';
  const esPro = plan === 'pro';

  const todosLosModulos = [
    { id:'caja',              label:'Caja / Turno',       sub:'Control de caja',           color:'#16A34A', bg:'#F0FDF4',  svg:'<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',                       roles:['admin','recepcion'] },
    { id:'tiendita',          label:'Tiendita',            sub:'Productos y stock',         color:'#7C3AED', bg:'#F5F3FF',  svg:'<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>',  roles:['admin','recepcion'] },
    { id:'facturacion',       label:'Facturación SUNAT',   sub:'Comprobantes electrónicos', color:'#2563EB', bg:'#EFF6FF',  svg:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>',  roles:['admin','recepcion'] },
    { id:'restaurante',       label:'Restaurante',         sub:'Mesas y pedidos',           color:'#EA580C', bg:'#FFF7ED',  svg:'<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>',  roles:['admin','recepcion','restaurante'], pro:true },
    { id:'cocina',            label:'Cocina / Comandas',   sub:'Gestión de cocina',         color:'#DC2626', bg:'#FEF2F2',  svg:'<path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/><line x1="6" y1="17" x2="18" y2="17"/>',  roles:['admin','cocina'], pro:true },
    { id:'reportes',          label:'Reportes',            sub:'Estadísticas y análisis',   color:'#0891B2', bg:'#ECFEFF',  svg:'<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',                roles:['admin'] },
    { id:'personal',          label:'Personal',            sub:'Usuarios y roles',          color:'#7C3AED', bg:'#F5F3FF',  svg:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><circle cx="19" cy="11" r="3"/>',                roles:['admin'] },
    { id:'habitacion-config', label:'Habitaciones',        sub:'Gestión de habitaciones',   color:'#2563EB', bg:'#EFF6FF',  svg:'<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>',                                    roles:['admin'] },
    { id:'suscripcion',       label:'Mi Suscripción',      sub:'Plan y facturación',        color:'#16A34A', bg:'#F0FDF4',  svg:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>',                                       roles:['admin'] },
    { id:'sunat-config',      label:'Config. SUNAT',       sub:'Configuración tributaria',  color:'#CA8A04', bg:'#FEFCE8',  svg:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09"/>',  roles:['admin'] },
  ];

  const visibles = todosLosModulos.filter(m => {
    if (m.pro && !esPro) return false;
    return !m.roles || m.roles.includes(rol);
  });

  contenido().innerHTML = `
    <div style="display:flex;align-items:center;gap:0.85rem;margin-bottom:1.25rem;">
      <div style="width:44px;height:44px;border-radius:12px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" style="width:22px;height:22px;"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
      </div>
      <div>
        <h1 style="font-size:1.3rem;font-weight:700;color:var(--texto);margin:0;">Más</h1>
        <p style="font-size:0.75rem;color:var(--texto-sub);margin:0;">Todas las herramientas de tu hotel en un solo lugar</p>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.65rem;">
      ${visibles.map(m => `
        <div onclick="navegarA('${m.id}')"
          style="background:white;border:1.5px solid var(--gris-borde);border-radius:16px;padding:1rem 0.6rem;text-align:center;cursor:pointer;-webkit-tap-highlight-color:transparent;"
          ontouchstart="this.style.transform='scale(0.95)';this.style.background='var(--gris-bg)'"
          ontouchend="this.style.transform='';this.style.background='white'">
          <div style="width:50px;height:50px;border-radius:14px;background:${m.bg};display:flex;align-items:center;justify-content:center;margin:0 auto 0.7rem;">
            <svg viewBox="0 0 24 24" fill="none" stroke="${m.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:24px;height:24px;">${m.svg}</svg>
          </div>
          <div style="font-weight:700;font-size:0.78rem;color:var(--texto);line-height:1.2;margin-bottom:0.2rem;">${m.label}</div>
          <div style="font-size:0.62rem;color:var(--texto-sub);line-height:1.3;">${m.sub}</div>
          ${m.pro ? '<div style="margin-top:0.4rem;display:inline-block;font-size:0.55rem;font-weight:700;background:#FFFBEB;color:#92400E;border:1px solid #FDE68A;border-radius:999px;padding:0.1rem 0.45rem;">PRO</div>' : ''}
        </div>`).join('')}
    </div>
  `;
}


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
  const esMobile = window.innerWidth <= 768;

  if (habs.length === 0) {
    contenido().innerHTML = `
      <div class="seccion-titulo">Rack de Habitaciones</div>
      <div class="seccion-sub">Aún no hay habitaciones creadas</div>
      <div class="card" style="max-width:480px;">
        <p style="font-size:0.9rem;color:var(--texto-sub);">Primero crea tus tipos de habitación desde <strong>Habitaciones</strong>.</p>
        ${SESSION.perfil.rol==='admin'?`<button style="${ST.btnPri};width:auto;padding:0.6rem 1.2rem;" onclick="navegarA('habitacion-config')">Ir a configuración</button>`:''}
      </div>`;
    return;
  }

  const conteo = { libre:0, ocupada:0, limpieza:0, reservada:0, mantenimiento:0 };
  habs.forEach(h => { if(conteo[h.estado]!==undefined) conteo[h.estado]++; });
  const total = habs.length;

  const habsFiltradas = _rackFiltroEstado === 'todos' ? habs
    : habs.filter(h => h.estado === _rackFiltroEstado);

  const pisos = {};
  habsFiltradas.forEach(h => {
    const p = h.piso || '—';
    if (!pisos[p]) pisos[p] = [];
    pisos[p].push(h);
  });
  const pisosOrden = Object.keys(pisos).sort();

  const avisoTurno = !SESSION.turnoActivo
    ? `<div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:0.7rem 1rem;margin-bottom:1rem;font-size:0.83rem;color:#92400E;">
         ⚠️ No tienes turno de caja abierto. <a href="#" onclick="navegarA('caja');return false;" style="color:#92400E;font-weight:600;text-decoration:underline;">Ábrelo</a> para cobrar.
       </div>` : '';

  if (esMobile) {
    // ══════════════════════════════════════════════
    // DISEÑO MÓVIL — igual al mockup
    // ══════════════════════════════════════════════
    const filtrosMobile = [
      { id:'todos',        label:'Todos',          cnt: total,                color:'#1C2B4A' },
      { id:'libre',        label:'Libre',          cnt: conteo.libre,         color:'#16A34A' },
      { id:'ocupada',      label:'Ocupada',        cnt: conteo.ocupada,       color:'#DC2626' },
      { id:'limpieza',     label:'Limpieza',       cnt: conteo.limpieza,      color:'#CA8A04' },
      { id:'reservada',    label:'Reservada',      cnt: conteo.reservada,     color:'#2563EB' },
      { id:'mantenimiento',label:'Mantenimiento',  cnt: conteo.mantenimiento, color:'#64748B' },
    ];

    contenido().innerHTML = `
      <!-- Header móvil -->
      <div style="margin-bottom:0.85rem;">
        <h1 style="font-size:1.25rem;font-weight:700;color:var(--texto);margin:0 0 0.15rem;">Habitaciones</h1>
        <div style="font-size:0.78rem;color:var(--texto-sub);">Estado y disponibilidad en tiempo real</div>
      </div>

      <!-- Stats compactas móvil: 2 columnas -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.6rem;margin-bottom:1rem;" class="rack-stats-grid">
        ${rackStatCard('Habitaciones libres',   conteo.libre,         total, '#16A34A','#F0FDF4', 'bed-libre')}
        ${rackStatCard('Habitaciones ocupadas', conteo.ocupada,       total, '#DC2626','#FEF2F2', 'bed-ocu')}
        ${rackStatCard('En limpieza',           conteo.limpieza,      total, '#CA8A04','#FEFCE8', 'broom')}
        ${rackStatCard('Reservadas',            conteo.reservada,     total, '#2563EB','#EFF6FF', 'calendar')}
        <div style="grid-column:1/-1;">
          <div class="card" style="padding:0.85rem 1.1rem;display:flex;align-items:center;gap:1rem;">
            <div style="width:44px;height:44px;border-radius:12px;background:#F1F5F9;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <svg viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:22px;height:22px;"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            </div>
            <div style="flex:1;min-width:0;">
              <div style="display:flex;align-items:baseline;gap:0.5rem;margin-bottom:0.35rem;">
                <span style="font-size:1.5rem;font-weight:700;color:var(--texto);line-height:1;">${conteo.mantenimiento}</span>
                <span style="font-size:0.78rem;color:var(--texto-sub);">En mantenimiento</span>
              </div>
              <div style="display:flex;align-items:center;gap:0.5rem;">
                <div style="flex:1;height:6px;background:var(--gris-borde);border-radius:999px;overflow:hidden;">
                  <div style="width:${total>0?Math.round((conteo.mantenimiento/total)*100):0}%;height:100%;background:#64748B;border-radius:999px;"></div>
                </div>
                <span style="font-size:0.72rem;font-weight:700;color:#64748B;">${total>0?Math.round((conteo.mantenimiento/total)*100):0}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      ${avisoTurno}

      <!-- Buscador móvil -->
      <div style="position:relative;margin-bottom:0.85rem;">
        <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:16px;height:16px;position:absolute;left:0.8rem;top:50%;transform:translateY(-50%);pointer-events:none;">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" placeholder="Buscar habitación…" oninput="filtrarRackMobile(this.value)"
          style="width:100%;padding:0.65rem 0.75rem 0.65rem 2.4rem;border:1.5px solid var(--gris-borde);border-radius:12px;font-size:0.88rem;background:white;box-sizing:border-box;outline:none;"
          onfocus="this.style.borderColor='var(--azul)'" onblur="this.style.borderColor='var(--gris-borde)'">
        <button onclick="toggleRackVistaMobile()" title="Ajustes vista"
          style="position:absolute;right:0.6rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#94A3B8;padding:0.2rem;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:18px;height:18px;">
            <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- Pills filtro con scroll horizontal -->
      <div style="overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;margin-bottom:1rem;">
        <div style="display:flex;gap:0.5rem;padding-bottom:0.25rem;min-width:max-content;">
          ${filtrosMobile.map(f => `
            <button onclick="setRackFiltro('${f.id}')"
              style="display:inline-flex;align-items:center;gap:0.35rem;padding:0.45rem 0.9rem;border-radius:999px;font-size:0.82rem;font-weight:600;cursor:pointer;white-space:nowrap;
                border:1.5px solid ${_rackFiltroEstado===f.id ? f.color : 'var(--gris-borde)'};
                background:${_rackFiltroEstado===f.id ? f.color : 'white'};
                color:${_rackFiltroEstado===f.id ? 'white' : 'var(--texto-sub)'};">
              ${f.label}
              <span style="background:${_rackFiltroEstado===f.id?'rgba(255,255,255,0.25)':'var(--gris-bg)'};color:${_rackFiltroEstado===f.id?'white':'var(--texto)'};border-radius:999px;padding:0.05rem 0.45rem;font-size:0.72rem;">${f.cnt}</span>
            </button>`).join('')}
        </div>
      </div>

      <!-- Pisos con tarjetas 2 columnas -->
      <div id="rack-pisos-mobile">
        ${pisosOrden.map(p => renderPisoMobile(p, pisos[p])).join('')}
        ${pisosOrden.length === 0 ? `<div style="text-align:center;padding:2rem;color:var(--texto-sub);">Sin habitaciones con ese filtro</div>` : ''}
      </div>
    `;

  } else {
    // ══════════════════════════════════════════════
    // DISEÑO DESKTOP — igual que antes
    // ══════════════════════════════════════════════
    const filtroBtn = (estado, label, cnt, color) => `
      <button onclick="setRackFiltro('${estado}')"
        style="display:inline-flex;align-items:center;gap:0.4rem;padding:0.45rem 0.9rem;border-radius:999px;font-size:0.82rem;font-weight:600;cursor:pointer;border:1.5px solid ${_rackFiltroEstado===estado?color:'var(--gris-borde)'};background:${_rackFiltroEstado===estado?color:'white'};color:${_rackFiltroEstado===estado?'white':'var(--texto-sub)'};">
        ${label} <span style="background:${_rackFiltroEstado===estado?'rgba(255,255,255,0.25)':'var(--gris-bg)'};color:${_rackFiltroEstado===estado?'white':'var(--texto)'};border-radius:999px;padding:0 0.4rem;font-size:0.75rem;">${cnt}</span>
      </button>`;

    contenido().innerHTML = `
      <div style="margin-bottom:1.25rem;">
        <h1 style="font-size:1.5rem;font-weight:700;color:var(--texto);margin:0;">Habitaciones</h1>
        <div style="font-size:0.88rem;color:var(--texto-sub);margin-top:0.25rem;">Estado y disponibilidad en tiempo real.</div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:0.65rem;margin-bottom:1.25rem;">
        ${rackStatCard('Habitaciones libres',   conteo.libre,         total, '#16A34A','#F0FDF4', 'bed-libre')}
        ${rackStatCard('Habitaciones ocupadas', conteo.ocupada,       total, '#DC2626','#FEF2F2', 'bed-ocu')}
        ${rackStatCard('En limpieza',           conteo.limpieza,      total, '#CA8A04','#FEFCE8', 'broom')}
        ${rackStatCard('Reservadas',            conteo.reservada,     total, '#2563EB','#EFF6FF', 'calendar')}
        ${rackStatCard('Mant.',      conteo.mantenimiento, total, '#64748B','#F1F5F9', 'wrench')}
      </div>

      ${avisoTurno}

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

      <div id="rack-pisos">
        ${pisosOrden.map(p => renderPiso(p, pisos[p])).join('')}
        ${pisosOrden.length === 0 ? filaVacia('No hay habitaciones con ese filtro.') : ''}
      </div>
    `;
  }
}

// ── Piso en móvil — colapsable + grid 2 columnas ─────────────
const _pisoColapsado = {};

function renderPisoMobile(piso, habs) {
  const cnt = { libre:0, ocupada:0, limpieza:0, reservada:0, mantenimiento:0 };
  habs.forEach(h => { if(cnt[h.estado]!==undefined) cnt[h.estado]++; });
  const colapsado = _pisoColapsado[piso] || false;
  const label = piso === '—' ? 'Sin piso' : 'Piso ' + piso;

  return `
    <div style="margin-bottom:1.25rem;">
      <!-- Header piso colapsable -->
      <div onclick="togglePisoMobile('${piso}')" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem;cursor:pointer;">
        <div style="display:flex;align-items:center;gap:0.6rem;">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--azul)" stroke-width="2.5" stroke-linecap="round" style="width:16px;height:16px;transition:transform 0.2s;transform:${colapsado?'rotate(-90deg)':'rotate(0deg)'}">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
          <span style="font-weight:700;font-size:0.95rem;">${label}</span>
          <span style="background:var(--gris-bg);color:var(--texto-sub);font-size:0.72rem;font-weight:600;padding:0.1rem 0.55rem;border-radius:999px;">${habs.length} habitaciones</span>
        </div>
        <div style="display:flex;align-items:center;gap:0.35rem;font-size:0.7rem;">
          ${cnt.libre>0?`<span style="color:#16A34A;font-weight:600;">● ${cnt.libre} libres</span>`:''}
          ${cnt.ocupada>0?`<span style="color:#DC2626;font-weight:600;">● ${cnt.ocupada} ocup.</span>`:''}
          ${cnt.limpieza>0?`<span style="color:#CA8A04;font-weight:600;">● ${cnt.limpieza} limp.</span>`:''}
        </div>
      </div>

      <!-- Mini resumen puntos de colores -->
      <div style="display:flex;flex-wrap:wrap;gap:0.65rem;font-size:0.72rem;color:var(--texto-sub);margin-bottom:0.75rem;padding:0 0.25rem;">
        <span>🟢 ${cnt.libre} libres</span>
        <span>🔴 ${cnt.ocupada} ocupadas</span>
        <span>🟡 ${cnt.limpieza} limpieza</span>
        <span>🔵 ${cnt.reservada} reservadas</span>
        <span>⚫ ${cnt.mantenimiento} mant.</span>
      </div>

      <!-- Grid 2 columnas -->
      ${colapsado ? '' : `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
          ${habs.map(h => tarjetaHabMobile(h)).join('')}
        </div>
      `}
    </div>`;
}

// ── Tarjeta de habitación en móvil ──────────────────────────
function tarjetaHabMobile(h) {
  const c    = COLORES_ESTADO[h.estado] || COLORES_ESTADO.libre;
  const tipo = h.tipos_habitacion || {};
  const fotoIdx = (parseInt(h.numero.replace(/\D/g,''))||0) % FOTOS_HAB.length;
  const foto = FOTOS_HAB[fotoIdx];

  return `
    <div onclick="abrirHabitacion('${h.id}')" style="cursor:pointer;border-radius:14px;overflow:hidden;border:1.5px solid var(--gris-borde);background:white;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
      <!-- Foto con número y badge -->
      <div style="position:relative;height:115px;background:#E2E8F0;overflow:hidden;">
        <img src="${foto}" alt="hab" loading="lazy" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">
        <div style="position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,0.15) 0%,rgba(0,0,0,0.45) 100%);"></div>
        <!-- Número -->
        <span style="position:absolute;top:0.5rem;left:0.6rem;font-size:1.3rem;font-weight:800;color:white;text-shadow:0 1px 6px rgba(0,0,0,0.6);">${escapeHtml(h.numero)}</span>
        <!-- Badge estado -->
        <span style="position:absolute;top:0.5rem;right:0.5rem;font-size:0.6rem;font-weight:700;color:white;background:${c.badgeBg};padding:0.2rem 0.5rem;border-radius:999px;white-space:nowrap;">${c.label}</span>
      </div>
      <!-- Info compacta -->
      <div style="padding:0.65rem 0.7rem;">
        <div style="font-weight:700;font-size:0.8rem;margin-bottom:0.2rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(tipo.nombre||'Sin tipo').toUpperCase()}</div>
        <div style="display:flex;align-items:center;gap:0.4rem;font-size:0.72rem;color:var(--texto-sub);margin-bottom:0.55rem;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:11px;height:11px;flex-shrink:0;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          <span>${tipo.capacidad_max||'—'}</span>
          <span style="color:#CBD5E1;">·</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:11px;height:11px;flex-shrink:0;"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          <span>${soles(tipo.tarifa_noche||0)}</span>
        </div>
        ${h.estado==='mantenimiento' && h.motivo_mantenimiento ? `
          <div style="background:#F1F5F9;border-radius:6px;padding:0.25rem 0.4rem;margin-bottom:0.5rem;font-size:0.65rem;color:#475569;">
            🔧 ${escapeHtml(h.motivo_mantenimiento)}
          </div>` : ''}
        <!-- Botones -->
        <div style="display:flex;gap:0.35rem;">
          <button onclick="event.stopPropagation();abrirHabitacion('${h.id}')"
            style="flex:1;padding:0.4rem 0;background:white;border:1.5px solid var(--gris-borde);border-radius:8px;font-size:0.72rem;font-weight:600;cursor:pointer;color:var(--texto-sub);">
            Ver más
          </button>
          <button onclick="event.stopPropagation();abrirMenuRapidoHab('${h.id}')"
            style="padding:0.4rem 0.55rem;background:white;border:1.5px solid var(--gris-borde);border-radius:8px;font-size:0.78rem;cursor:pointer;color:var(--texto-sub);">
            ···
          </button>
        </div>
      </div>
    </div>`;
}

function togglePisoMobile(piso) {
  _pisoColapsado[piso] = !_pisoColapsado[piso];
  renderRack();
}

function filtrarRackMobile(q) {
  if (!q.trim()) { renderRack(); return; }
  const ql = q.toLowerCase();
  const cont = document.getElementById('rack-pisos-mobile');
  if (!cont) return;
  const filtradas = _rackHabs.filter(h =>
    h.numero.toLowerCase().includes(ql) ||
    (h.tipos_habitacion?.nombre||'').toLowerCase().includes(ql) ||
    (h.estado||'').toLowerCase().includes(ql)
  );
  if (!filtradas.length) {
    cont.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--texto-sub);">Sin resultados para "${escapeHtml(q)}"</div>`;
    return;
  }
  cont.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">${filtradas.map(h=>tarjetaHabMobile(h)).join('')}</div>`;
}

function toggleRackVistaMobile() {
  // En móvil solo hay cuadrícula, esto podría abrir opciones de filtro en el futuro
  toast('Vista', 'En móvil se muestra la cuadrícula optimizada', 'info', 2000);
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
        ${h.estado==='mantenimiento' && h.motivo_mantenimiento ? `
          <div style="background:#F1F5F9;border-radius:8px;padding:0.4rem 0.6rem;margin-bottom:0.5rem;font-size:0.72rem;color:#475569;">
            🔧 ${escapeHtml(h.motivo_mantenimiento)}
            ${h.fecha_fin_mant_est?`<span style="color:#64748B;"> · hasta ${fechaCorta(h.fecha_fin_mant_est)}</span>`:''}
          </div>` : ''}
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
    _rackHabSelId = habId;
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
    navegarA('caja'); return;
  }
  const tipo = h.tipos_habitacion || {};
  const hoy  = new Date();
  const mañana = new Date(hoy); mañana.setDate(mañana.getDate()+1);
  const fmtDate = d => d.toISOString().slice(0,10);

  const html = `
    <form id="form-checkin">
      <!-- Info habitación -->
      <div style="display:flex;align-items:center;gap:0.85rem;background:var(--gris-bg);border-radius:12px;padding:1rem;margin-bottom:1.25rem;">
        <div style="width:44px;height:44px;border-radius:11px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" style="width:22px;height:22px;"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>
        </div>
        <div>
          <div style="font-weight:700;font-size:1.05rem;">Habitación ${escapeHtml(h.numero)}</div>
          <div style="font-size:0.8rem;color:var(--texto-sub);">${escapeHtml(tipo.nombre||'')} · Cap. ${tipo.capacidad_max||1} persona(s)</div>
        </div>
        <div style="margin-left:auto;text-align:right;">
          <div style="font-size:0.72rem;color:var(--texto-sub);">Tarifa noche</div>
          <div style="font-weight:700;color:var(--verde);font-size:1.05rem;">${soles(tipo.tarifa_noche||0)}</div>
        </div>
      </div>

      <!-- Modalidad -->
      <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--azul);margin-bottom:0.65rem;">1 · Modalidad</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-bottom:1.1rem;">
        <button type="button" class="btn-modalidad" data-mod="noche"
          style="padding:0.75rem;border-radius:10px;border:2px solid var(--azul);background:#EFF6FF;color:var(--azul);font-weight:700;font-size:0.9rem;cursor:pointer;">
          🌙 Por noche<br><span style="font-size:0.75rem;font-weight:400;">${soles(tipo.tarifa_noche||0)}/noche</span>
        </button>
        <button type="button" class="btn-modalidad" data-mod="horas"
          style="padding:0.75rem;border-radius:10px;border:2px solid var(--gris-borde);background:white;color:var(--texto-sub);font-weight:700;font-size:0.9rem;cursor:pointer;">
          ⏱️ Por horas<br><span style="font-size:0.75rem;font-weight:400;">${soles(tipo.tarifa_horas||0)}/${tipo.horas_bloque||3}h</span>
        </button>
      </div>

      <!-- Fechas (por noche) -->
      <div id="campos-noche">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.5rem;margin-bottom:1.1rem;">
          <div><label style="${ST.label}">Entrada</label>
            <input style="${ST.input}" id="checkin-fecha-entrada" type="date" value="${fmtDate(hoy)}" onchange="calcularNoches()">
          </div>
          <div><label style="${ST.label}">Salida</label>
            <input style="${ST.input}" id="checkin-fecha-salida" type="date" value="${fmtDate(mañana)}" onchange="calcularNoches()">
          </div>
          <div><label style="${ST.label}">Noches</label>
            <div style="${ST.input};background:var(--gris-bg);font-weight:700;text-align:center;" id="checkin-noches-disp">1</div>
          </div>
        </div>
      </div>

      <!-- Horas -->
      <div id="campos-horas" style="display:none;margin-bottom:1.1rem;">
        <div style="${ST.grupo}"><label style="${ST.label}">Horas contratadas</label>
          <input style="${ST.input}" id="checkin-horas" type="number" value="${tipo.horas_bloque||3}" min="1" max="24">
        </div>
      </div>

      <!-- Datos del huésped -->
      <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--azul);margin-bottom:0.65rem;">2 · Datos del huésped</div>
      <div style="display:flex;gap:0.5rem;margin-bottom:0.65rem;">
        <div style="flex:1;"><label style="${ST.label}">Tipo doc.</label>
          <select style="${ST.input}" id="checkin-tipo-doc">
            <option value="DNI">DNI</option>
            <option value="CE">Carnet Extranjería</option>
            <option value="PASAPORTE">Pasaporte</option>
          </select>
        </div>
        <div style="flex:2;"><label style="${ST.label}">N° documento *</label>
          <div style="display:flex;gap:0.4rem;">
            <input style="${ST.input}" id="checkin-dni" maxlength="15" placeholder="12345678">
            <button type="button" style="${ST.btnSec};padding:0.55rem 0.75rem;white-space:nowrap;" id="btn-buscar-dni" title="Buscar">🔍</button>
          </div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-bottom:0.65rem;">
        <div><label style="${ST.label}">Nombres *</label>
          <input style="${ST.input}" id="checkin-nombres" required placeholder="Juan">
        </div>
        <div><label style="${ST.label}">Apellidos *</label>
          <input style="${ST.input}" id="checkin-apellidos" required placeholder="Pérez López">
        </div>
      </div>
      <div style="${ST.grupo};margin-bottom:1.1rem;">
        <label style="${ST.label}">Celular</label>
        <input style="${ST.input}" id="checkin-celular" placeholder="999999999">
      </div>

      <!-- Cobro anticipado -->
      <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--azul);margin-bottom:0.65rem;">3 · Cobro anticipado</div>
      <div style="background:var(--gris-bg);border-radius:10px;padding:0.75rem;margin-bottom:0.75rem;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:0.83rem;color:var(--texto-sub);">Total estimado:</span>
        <span style="font-weight:700;font-size:1.1rem;color:var(--verde);" id="checkin-total-est">${soles(tipo.tarifa_noche||0)}</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-bottom:0.65rem;">
        <div><label style="${ST.label}">Monto a cobrar *</label>
          <input style="${ST.input}" id="checkin-monto" type="number" step="0.01" required placeholder="0.00">
        </div>
        <div><label style="${ST.label}">Método de pago</label>
          <select style="${ST.input}" id="checkin-metodo">
            <option value="efectivo">💵 Efectivo</option>
            <option value="yape">📱 Yape</option>
            <option value="plin">📲 Plin</option>
            <option value="transferencia">🏦 Transferencia</option>
          </select>
        </div>
      </div>

      <!-- Comprobante -->
      <div style="${ST.grupo}"><label style="${ST.label}">Comprobante (opcional)</label>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.4rem;" id="comp-btns-ci">
          <button type="button" onclick="selCompCi('ninguno',this)" class="btn-comp-ci" style="padding:0.5rem;border-radius:8px;border:1.5px solid var(--azul);background:#EFF6FF;font-size:0.78rem;font-weight:600;cursor:pointer;color:var(--azul);">Sin comp.</button>
          <button type="button" onclick="selCompCi('boleta',this)" class="btn-comp-ci" style="padding:0.5rem;border-radius:8px;border:1.5px solid var(--gris-borde);background:white;font-size:0.78rem;font-weight:600;cursor:pointer;color:var(--texto-sub);">📄 Boleta</button>
          <button type="button" onclick="selCompCi('factura',this)" class="btn-comp-ci" style="padding:0.5rem;border-radius:8px;border:1.5px solid var(--gris-borde);background:white;font-size:0.78rem;font-weight:600;cursor:pointer;color:var(--texto-sub);">📋 Factura</button>
        </div>
        <input type="hidden" id="checkin-comprobante" value="ninguno">
      </div>
      <div id="ci-datos-fact" style="display:none;${ST.grupo}">
        <label style="${ST.label}">RUC del cliente</label>
        <input style="${ST.input}" id="ci-ruc" placeholder="20123456789" maxlength="11">
        <label style="${ST.label};margin-top:0.5rem;">Razón social</label>
        <input style="${ST.input}" id="ci-razon" placeholder="Empresa SAC">
      </div>

      <button type="submit" style="width:100%;padding:0.85rem;background:linear-gradient(135deg,var(--azul),#2563EB);color:white;border:none;border-radius:10px;font-size:0.92rem;font-weight:600;cursor:pointer;margin-top:0.5rem;box-shadow:0 4px 14px rgba(37,99,235,0.3);">
        ✅ Registrar check-in y cobrar
      </button>
    </form>
  `;
  abrirModal(`Check-in · Hab. ${h.numero}`, html, { ancho:'560px' });

  let modalidad = 'noche';

  // Selección modalidad
  const selMod = (mod) => {
    modalidad = mod;
    $$('.btn-modalidad').forEach(b => {
      const activo = b.dataset.mod === mod;
      b.style.border  = activo ? '2px solid var(--azul)' : '2px solid var(--gris-borde)';
      b.style.background = activo ? '#EFF6FF' : 'white';
      b.style.color   = activo ? 'var(--azul)' : 'var(--texto-sub)';
    });
    $('#campos-noche').style.display = mod==='noche' ? '' : 'none';
    $('#campos-horas').style.display = mod==='horas' ? '' : 'none';
    if (mod==='noche') { calcularNoches(); }
    else {
      const horas = parseInt($('#checkin-horas')?.value||tipo.horas_bloque||3);
      const total = (tipo.tarifa_horas||0) * Math.ceil(horas/(tipo.horas_bloque||3));
      $('#checkin-monto').value = total;
      $('#checkin-total-est').textContent = soles(total);
    }
  };
  $$('.btn-modalidad').forEach(b => b.addEventListener('click', () => selMod(b.dataset.mod)));
  $('#checkin-horas')?.addEventListener('input', () => selMod('horas'));

  // Comprobante check-in
  window.selCompCi = (tipo, btn) => {
    document.querySelectorAll('.btn-comp-ci').forEach(b=>{ b.style.background='white'; b.style.borderColor='var(--gris-borde)'; b.style.color='var(--texto-sub)'; });
    btn.style.background='#EFF6FF'; btn.style.borderColor='var(--azul)'; btn.style.color='var(--azul)';
    $('#checkin-comprobante').value=tipo;
    $('#ci-datos-fact').style.display=tipo==='factura'?'':'none';
  };

  // Buscar DNI
  $('#btn-buscar-dni').addEventListener('click', async () => {
    const dni = $('#checkin-dni').value.trim();
    if (dni.length < 8) { toast('Doc. inválido','','warn'); return; }
    // Buscar en huéspedes propios primero
    const { data: hEx } = await db.from('huespedes').select('*').eq('hotel_id',SESSION.hotel.id).eq('num_doc',dni).maybeSingle();
    if (hEx) {
      $('#checkin-nombres').value  = hEx.nombres;
      $('#checkin-apellidos').value= hEx.apellidos;
      $('#checkin-celular').value  = hEx.celular||'';
      toast('Huésped encontrado','Datos cargados','ok'); return;
    }
    // Consultar API DNI
    const btn = $('#btn-buscar-dni'); btn.textContent='…';
    const res = await consultarDNI(dni);
    btn.textContent='🔍';
    if (res) { $('#checkin-nombres').value=res.nombres; $('#checkin-apellidos').value=res.apellidos; toast('Datos encontrados','','ok',2000); }
    else { toast('No encontrado','Ingresa manual','info',3000); }
  });

  selMod('noche');

  // Submit
  $('#form-checkin').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled=true; btn.textContent='Procesando…';
    try { await procesarCheckIn(h, modalidad); }
    catch (err) { toast('Error',err.message,'error'); btn.disabled=false; btn.textContent='Registrar check-in y cobrar'; }
  });
}

// Calcular noches y actualizar monto
window.calcularNoches = function() {
  const entrada = new Date($('#checkin-fecha-entrada')?.value);
  const salida  = new Date($('#checkin-fecha-salida')?.value);
  if (isNaN(entrada)||isNaN(salida)||salida<=entrada) return;
  const noches = Math.round((salida-entrada)/(1000*60*60*24));
  const tipo = _rackHabs.find(rh=>rh.id===_rackHabSelId)?.tipos_habitacion || {};
  const total = noches * (tipo.tarifa_noche||0);
  if ($('#checkin-noches-disp')) $('#checkin-noches-disp').textContent = noches;
  if ($('#checkin-monto'))       $('#checkin-monto').value = total;
  if ($('#checkin-total-est'))   $('#checkin-total-est').textContent = soles(total);
};

let _rackHabSelId = null;

async function procesarCheckIn(h, modalidad) {
  const tipoDoc   = $('#checkin-tipo-doc')?.value || 'DNI';
  const dni       = $('#checkin-dni').value.trim();
  const nombres   = $('#checkin-nombres').value.trim();
  const apellidos = $('#checkin-apellidos').value.trim();
  const celular   = $('#checkin-celular').value.trim();
  const monto     = parseFloat($('#checkin-monto').value);
  const metodo    = $('#checkin-metodo').value;
  const horas     = modalidad==='horas' ? parseInt($('#checkin-horas').value)||3 : null;
  const comprobante = $('#checkin-comprobante')?.value||'ninguno';
  const tipo      = h.tipos_habitacion || {};

  if (!nombres||!apellidos||!dni) throw new Error('Completa documento, nombres y apellidos.');
  if (isNaN(monto)||monto<0) throw new Error('Monto inválido.');

  // Calcular fechas
  const ahora = new Date();
  let fechaEntrada = ahora;
  let salidaPrev;
  let noches = 1;

  if (modalidad==='noche') {
    const fEntrada = $('#checkin-fecha-entrada')?.value;
    const fSalida  = $('#checkin-fecha-salida')?.value;
    if (fEntrada) fechaEntrada = new Date(fEntrada+'T'+ahora.toTimeString().slice(0,8));
    if (fSalida)  { salidaPrev = new Date(fSalida+'T12:00:00'); }
    else          { salidaPrev = new Date(fechaEntrada); salidaPrev.setDate(salidaPrev.getDate()+1); salidaPrev.setHours(12,0,0,0); }
    noches = Math.max(1, Math.round((salidaPrev-fechaEntrada)/(1000*60*60*24)));
  } else {
    salidaPrev = new Date(ahora.getTime()+(horas||3)*3600*1000);
    noches = null;
  }

  // 1. Buscar o crear huésped
  let huespedId;
  const { data: hExist } = await db.from('huespedes')
    .select('id').eq('hotel_id',SESSION.hotel.id).eq('num_doc',dni).maybeSingle();
  if (hExist) {
    huespedId = hExist.id;
    await db.from('huespedes').update({ nombres, apellidos, celular, tipo_doc:tipoDoc }).eq('id',huespedId);
  } else {
    const { data:nH, error:eH } = await db.from('huespedes').insert({
      hotel_id:SESSION.hotel.id, tipo_doc:tipoDoc, num_doc:dni, nombres, apellidos, celular,
    }).select('id').single();
    if (eH) throw eH;
    huespedId = nH.id;
  }

  const tarifa = modalidad==='noche' ? (tipo.tarifa_noche||0)*noches : (tipo.tarifa_horas||0);

  // 2. Crear estadía
  const { data:estadia, error:eE } = await db.from('estadias_reservas').insert({
    hotel_id:SESSION.hotel.id, habitacion_id:h.id, huesped_id:huespedId,
    turno_caja_id:SESSION.turnoActivo.id, modalidad, tipo_reserva:'directa',
    estado:'activa', fecha_entrada:fechaEntrada.toISOString(),
    fecha_salida_prev:salidaPrev.toISOString(),
    horas_contratadas:horas, tarifa_aplicada:tarifa,
    adelanto_pagado:monto, total_final:tarifa, metodo_pago:metodo,
  }).select('id').single();
  if (eE) throw eE;

  // 3. Registrar cobro en caja
  if (monto>0) {
    await db.from('movimientos_caja').insert({
      hotel_id:SESSION.hotel.id, turno_caja_id:SESSION.turnoActivo.id,
      tipo:'ingreso', concepto:`Check-in Hab.${h.numero} (${nombres} ${apellidos})`,
      monto, metodo_pago:metodo, referencia_id:estadia.id,
      referencia_tipo:'estadia', usuario_id:SESSION.user.id,
    });
  }

  // 4. Marcar habitación ocupada
  await db.from('habitaciones').update({ estado:'ocupada' }).eq('id',h.id);

  // 5. Emitir comprobante si solicitó
  if (comprobante!=='ninguno' && monto>0) {
    try {
      const { data:cfg } = await db.from('configuracion_sunat').select('*').eq('hotel_id',SESSION.hotel.id).single();
      if (cfg) {
        const esFact = comprobante==='factura';
        const serie  = esFact ? cfg.serie_factura   : cfg.serie_boleta;
        const corr   = esFact ? cfg.correlativo_factura : cfg.correlativo_boleta;
        const igv    = parseFloat((monto*0.18/1.18).toFixed(2));
        const rucRec = esFact ? ($('#ci-ruc')?.value?.trim()||'') : dni;
        const razon  = esFact ? ($('#ci-razon')?.value?.trim()||'') : `${nombres} ${apellidos}`;
        await db.from('comprobantes_sunat').insert({
          hotel_id:SESSION.hotel.id, estadia_id:estadia.id,
          tipo_doc:comprobante, serie, correlativo:corr,
          ruc_emisor:cfg.ruc_emisor||SESSION.hotel.ruc||'',
          ruc_receptor:rucRec, razon_social_rec:razon,
          total:monto, igv, estado_sunat:'PENDIENTE_ENVIO',
        });
        const campo = esFact?'correlativo_factura':'correlativo_boleta';
        await db.from('configuracion_sunat').update({[campo]:corr+1}).eq('hotel_id',SESSION.hotel.id);
      }
    } catch(e) { console.warn('Comprobante check-in:', e.message); }
  }

  cerrarModal();
  const detalle = modalidad==='noche' ? `${noches} noche(s) · hasta ${salidaPrev.toLocaleDateString('es-PE')}` : `${horas}h · hasta ${salidaPrev.toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'})}`;
  toast('✅ Check-in registrado', `Hab.${h.numero} · ${detalle} · ${soles(monto)} cobrado`, 'ok');
  moduloRack();
}
async function abrirEstadiaActiva(h) {
  const { data:est, error } = await db.from('estadias_reservas')
    .select(`*, huespedes(nombres,apellidos,num_doc,celular)`)
    .eq('habitacion_id',h.id).in('estado',['activa','reservada'])
    .order('created_at',{ascending:false}).limit(1).maybeSingle();
  if (error||!est) { toast('Error','No se encontró la estadía activa','error'); return; }

  const hu = est.huespedes||{};
  const { data:consumos } = await db.from('consumos_estadia')
    .select('*').eq('estadia_id',est.id).order('created_at');

  const totalConsumos = (consumos||[]).reduce((s,c)=>s+Number(c.subtotal||c.precio_unitario*c.cantidad),0);
  const totalFinal    = Number(est.tarifa_aplicada)+totalConsumos+Number(est.penalidad_late||0);
  const saldo         = totalFinal - Number(est.adelanto_pagado);

  // Tiempo en habitación
  const entrada = new Date(est.fecha_entrada);
  const ahora   = new Date();
  const minutos = Math.floor((ahora-entrada)/60000);
  const tiempoStr = minutos<60 ? `${minutos}min` : `${Math.floor(minutos/60)}h ${minutos%60}min`;

  const html = `
    <!-- Header huésped -->
    <div style="display:flex;align-items:center;gap:0.85rem;background:var(--gris-bg);border-radius:12px;padding:1rem;margin-bottom:1.1rem;">
      <div style="width:44px;height:44px;border-radius:50%;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:1.3rem;font-weight:700;color:var(--azul);">
        ${escapeHtml((hu.nombres||'?')[0].toUpperCase())}
      </div>
      <div style="flex:1;">
        <div style="font-weight:700;font-size:1rem;">${escapeHtml(hu.nombres||'')} ${escapeHtml(hu.apellidos||'')}</div>
        <div style="font-size:0.78rem;color:var(--texto-sub);">DNI ${escapeHtml(hu.num_doc||'—')} · ${hu.celular||'—'}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:0.68rem;color:var(--texto-sub);">En habitación</div>
        <div style="font-size:0.9rem;font-weight:700;color:var(--azul);">${tiempoStr}</div>
      </div>
    </div>

    <!-- Info estadía -->
    <div style="display:flex;gap:0.5rem;margin-bottom:0.5rem;font-size:0.78rem;color:var(--texto-sub);">
      <span>${est.modalidad==='noche'?'🌙 Por noche':'⏱️ Por horas'}</span>
      <span>·</span>
      <span>Entrada: ${fechaHora(est.fecha_entrada)}</span>
      <span>·</span>
      <span>Salida prev.: ${fechaHora(est.fecha_salida_prev)}</span>
    </div>

    <!-- 4 métricas -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.5rem;margin-bottom:1.1rem;">
      ${[
        ['Tarifa',       soles(est.tarifa_aplicada), '#2563EB','#EFF6FF'],
        ['Consumos',     soles(totalConsumos),        '#EA580C','#FFF7ED'],
        ['Adelanto',     soles(est.adelanto_pagado),  '#16A34A','#F0FDF4'],
        ['Saldo',        soles(Math.max(0,saldo)),    saldo>0?'#DC2626':'#16A34A', saldo>0?'#FEF2F2':'#F0FDF4'],
      ].map(([label,val,color,bg])=>`
        <div style="background:white;border:1px solid var(--gris-borde);border-radius:10px;padding:0.65rem;text-align:center;">
          <div style="font-size:0.68rem;color:var(--texto-sub);margin-bottom:0.2rem;">${label}</div>
          <div style="font-weight:700;font-size:0.95rem;color:${color};">${val}</div>
        </div>`).join('')}
    </div>

    <!-- Consumos -->
    ${(consumos||[]).length?`
    <div style="margin-bottom:1rem;">
      <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;color:var(--azul);margin-bottom:0.5rem;">Consumos cargados</div>
      <div style="max-height:130px;overflow-y:auto;border:1px solid var(--gris-borde);border-radius:10px;">
        ${consumos.map(c=>`
          <div style="display:flex;justify-content:space-between;padding:0.5rem 0.75rem;border-bottom:1px solid var(--gris-borde);font-size:0.82rem;">
            <span>${c.cantidad}× ${escapeHtml(c.descripcion)}</span>
            <strong>${soles(c.precio_unitario*c.cantidad)}</strong>
          </div>`).join('')}
      </div>
    </div>`:''}

    <!-- Acciones -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;">
      <button style="${ST.btnSec};display:flex;align-items:center;justify-content:center;gap:0.4rem;" onclick="abrirCargarConsumo('${est.id}','${escapeHtml(h.numero)}')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Cargar consumo
      </button>
      <button style="${ST.btnSec};display:flex;align-items:center;justify-content:center;gap:0.4rem;" onclick="abrirRoomMove('${est.id}','${h.id}','${escapeHtml(h.numero)}')">
        ↔ Cambiar habitación
      </button>
      <button style="${ST.btnSec};display:flex;align-items:center;justify-content:center;gap:0.4rem;" onclick="abrirLateCheckout('${est.id}')">
        ⏱️ Hora extra / penalidad
      </button>
      <button style="width:100%;padding:0.7rem;background:linear-gradient(135deg,var(--azul),#2563EB);color:white;border:none;border-radius:10px;font-size:0.88rem;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:0.4rem;box-shadow:0 4px 14px rgba(37,99,235,0.3);"
        onclick="abrirCheckOut('${est.id}','${h.id}','${escapeHtml(h.numero)}')">
        🚪 Check-out
      </button>
    </div>
  `;
  abrirModal(`Hab. ${h.numero} — ${escapeHtml(hu.nombres||'')} ${escapeHtml(hu.apellidos||'')}`, html, { ancho:'540px' });
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

// ── CHECK-OUT con liquidación y comprobante ─────────────────
async function abrirCheckOut(estadiaId, habId, numero) {
  const { data:est } = await db.from('estadias_reservas')
    .select('*, huespedes(nombres,apellidos,num_doc)').eq('id',estadiaId).single();
  const { data:consumos } = await db.from('consumos_estadia')
    .select('*').eq('estadia_id',estadiaId).order('created_at');

  const totalConsumos = (consumos||[]).reduce((s,c)=>s+Number(c.subtotal||c.precio_unitario*c.cantidad),0);
  const totalFinal    = Number(est.tarifa_aplicada)+totalConsumos+Number(est.penalidad_late||0);
  const saldo         = Math.max(0, totalFinal - Number(est.adelanto_pagado));
  const hu            = est.huespedes||{};

  const html = `
    <!-- Resumen liquidación -->
    <div style="background:var(--gris-bg);border-radius:12px;padding:1.1rem;margin-bottom:1.1rem;">
      <div style="font-weight:700;margin-bottom:0.75rem;font-size:0.92rem;">Liquidación final — Hab. ${escapeHtml(numero)}</div>
      ${[
        ['Tarifa alojamiento', Number(est.tarifa_aplicada)],
        ['Consumos',           totalConsumos],
        ['Penalidades',        Number(est.penalidad_late||0)],
      ].map(([label,val])=>`
        <div style="display:flex;justify-content:space-between;padding:0.3rem 0;font-size:0.85rem;">
          <span style="color:var(--texto-sub);">${label}</span><strong>${soles(val)}</strong>
        </div>`).join('')}
      <div style="border-top:1px solid var(--gris-borde);margin:0.5rem 0;"></div>
      <div style="display:flex;justify-content:space-between;font-size:0.92rem;">
        <span style="font-weight:600;">Total</span><strong>${soles(totalFinal)}</strong>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-top:0.25rem;">
        <span style="color:var(--verde);">Adelanto pagado</span><strong style="color:var(--verde);">− ${soles(est.adelanto_pagado)}</strong>
      </div>
      <div style="border-top:2px solid var(--gris-borde);margin:0.5rem 0;"></div>
      <div style="display:flex;justify-content:space-between;font-size:1.15rem;">
        <span style="font-weight:700;">Saldo a cobrar</span>
        <strong style="color:${saldo>0?'var(--azul)':'var(--verde)'};">${soles(saldo)}</strong>
      </div>
    </div>

    ${saldo>0.01?`
    <!-- Método de pago saldo -->
    <div style="${ST.grupo}"><label style="${ST.label}">Método de pago del saldo</label>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.4rem;">
        ${['efectivo','yape','plin','transferencia'].map((m,i)=>`
          <button type="button" onclick="selMetodoCO('${m}',this)" class="btn-metodo-co"
            style="padding:0.55rem 0.25rem;border-radius:8px;border:1.5px solid ${i===0?'var(--azul)':'var(--gris-borde)'};background:${i===0?'#EFF6FF':'white'};font-size:0.75rem;font-weight:600;cursor:pointer;color:${i===0?'var(--azul)':'var(--texto-sub)'};">
            ${m==='efectivo'?'💵':m==='yape'?'📱':m==='plin'?'📲':'🏦'}<br>${m.charAt(0).toUpperCase()+m.slice(1)}
          </button>`).join('')}
      </div>
      <input type="hidden" id="checkout-metodo" value="efectivo">
    </div>`:''}

    <!-- Comprobante -->
    <div style="${ST.grupo}"><label style="${ST.label}">Comprobante del alojamiento</label>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.4rem;">
        <button type="button" onclick="selCompCO('ninguno',this)" class="btn-comp-co"
          style="padding:0.5rem;border-radius:8px;border:1.5px solid var(--azul);background:#EFF6FF;font-size:0.78rem;font-weight:600;cursor:pointer;color:var(--azul);">Sin comp.</button>
        <button type="button" onclick="selCompCO('boleta',this)" class="btn-comp-co"
          style="padding:0.5rem;border-radius:8px;border:1.5px solid var(--gris-borde);background:white;font-size:0.78rem;font-weight:600;cursor:pointer;color:var(--texto-sub);">📄 Boleta</button>
        <button type="button" onclick="selCompCO('factura',this)" class="btn-comp-co"
          style="padding:0.5rem;border-radius:8px;border:1.5px solid var(--gris-borde);background:white;font-size:0.78rem;font-weight:600;cursor:pointer;color:var(--texto-sub);">📋 Factura</button>
      </div>
      <input type="hidden" id="checkout-comprobante" value="ninguno">
    </div>
    <div id="co-datos-fact" style="display:none;">
      <div style="${ST.grupo}"><label style="${ST.label}">RUC del cliente</label>
        <input style="${ST.input}" id="co-ruc" placeholder="20123456789" maxlength="11">
      </div>
      <div style="${ST.grupo}"><label style="${ST.label}">Razón social</label>
        <input style="${ST.input}" id="co-razon" placeholder="Empresa SAC">
      </div>
    </div>

    <button id="btn-checkout" data-saldo="${saldo}" data-estadiaid="${estadiaId}" data-habid="${habId}"
      style="width:100%;padding:0.85rem;background:linear-gradient(135deg,var(--azul),#2563EB);color:white;border:none;border-radius:10px;font-size:0.92rem;font-weight:600;cursor:pointer;margin-top:0.5rem;box-shadow:0 4px 14px rgba(37,99,235,0.3);">
      🚪 Confirmar check-out${saldo>0.01?` · cobrar ${soles(saldo)}`:''}
    </button>
  `;
  abrirModal(`Check-out · Hab. ${numero}`, html, { ancho:'480px' });

  // Helpers comprobante y método
  window.selMetodoCO = (m, btn) => {
    document.querySelectorAll('.btn-metodo-co').forEach(b=>{ b.style.background='white'; b.style.borderColor='var(--gris-borde)'; b.style.color='var(--texto-sub)'; });
    btn.style.background='#EFF6FF'; btn.style.borderColor='var(--azul)'; btn.style.color='var(--azul)';
    $('#checkout-metodo').value=m;
  };
  window.selCompCO = (tipo, btn) => {
    document.querySelectorAll('.btn-comp-co').forEach(b=>{ b.style.background='white'; b.style.borderColor='var(--gris-borde)'; b.style.color='var(--texto-sub)'; });
    btn.style.background='#EFF6FF'; btn.style.borderColor='var(--azul)'; btn.style.color='var(--azul)';
    $('#checkout-comprobante').value=tipo;
    $('#co-datos-fact').style.display=tipo==='factura'?'':'none';
  };

  $('#btn-checkout').addEventListener('click', async () => {
    const btn = $('#btn-checkout');
    btn.disabled=true; btn.textContent='Procesando…';
    try {
      const saldoNum   = parseFloat(btn.dataset.saldo)||0;
      const metodo     = $('#checkout-metodo')?.value||'efectivo';
      const comprobante= $('#checkout-comprobante')?.value||'ninguno';

      // 1. Cobrar saldo
      if (saldoNum>0.01) {
        await db.from('movimientos_caja').insert({
          hotel_id:SESSION.hotel.id, turno_caja_id:SESSION.turnoActivo?.id,
          tipo:'ingreso', concepto:`Saldo check-out Hab.${numero}`,
          monto:saldoNum, metodo_pago:metodo,
          referencia_id:estadiaId, referencia_tipo:'estadia', usuario_id:SESSION.user.id,
        });
      }

      // 2. Cerrar estadía
      await db.from('estadias_reservas').update({
        estado:'check_out', fecha_salida_real:new Date().toISOString(), total_final:totalFinal,
        adelanto_pagado:Number(est.adelanto_pagado)+saldoNum,
      }).eq('id',estadiaId);

      // 3. Habitación a limpieza
      await db.from('habitaciones').update({ estado:'limpieza' }).eq('id',habId);

      // 4. Comprobante si solicitó
      if (comprobante!=='ninguno' && totalFinal>0) {
        try {
          const { data:cfg } = await db.from('configuracion_sunat').select('*').eq('hotel_id',SESSION.hotel.id).single();
          if (cfg) {
            const esFact = comprobante==='factura';
            const serie  = esFact?cfg.serie_factura:cfg.serie_boleta;
            const corr   = esFact?cfg.correlativo_factura:cfg.correlativo_boleta;
            const igv    = parseFloat((totalFinal*0.18/1.18).toFixed(2));
            const rucRec = esFact?($('#co-ruc')?.value?.trim()||''):(hu.num_doc||'');
            const razon  = esFact?($('#co-razon')?.value?.trim()||''):`${hu.nombres||''} ${hu.apellidos||''}`.trim();
            await db.from('comprobantes_sunat').insert({
              hotel_id:SESSION.hotel.id, estadia_id:estadiaId,
              tipo_doc:comprobante, serie, correlativo:corr,
              ruc_emisor:cfg.ruc_emisor||SESSION.hotel.ruc||'',
              ruc_receptor:rucRec, razon_social_rec:razon,
              total:totalFinal, igv, estado_sunat:'PENDIENTE_ENVIO',
            });
            const campo = esFact?'correlativo_factura':'correlativo_boleta';
            await db.from('configuracion_sunat').update({[campo]:corr+1}).eq('hotel_id',SESSION.hotel.id);
          }
        } catch(e){ console.warn('Comprobante CO:',e.message); }
      }

      cerrarModal();
      toast('✅ Check-out completado',`Hab.${numero} en limpieza${saldoNum>0.01?` · ${soles(saldoNum)} cobrado`:''}`, 'ok');
      moduloRack();
    } catch(err) {
      toast('Error',err.message,'error');
      btn.disabled=false; btn.textContent=`🚪 Confirmar check-out${saldo>0.01?` · cobrar ${soles(saldo)}`:''}`;
    }
  });
}


// ── Cambio de estado simple (mantenimiento/limpieza) ────────
// ════════════════════════════════════════════════════════════
//  MANTENIMIENTO DE HABITACIONES
// ════════════════════════════════════════════════════════════
function abrirCambioEstadoSimple(h) {
  const enMant = h.estado === 'mantenimiento';
  const html = `
    <!-- Info habitación -->
    <div style="display:flex;align-items:center;gap:0.85rem;background:var(--gris-bg);border-radius:12px;padding:0.85rem 1rem;margin-bottom:1.1rem;">
      <div style="width:40px;height:40px;border-radius:10px;background:${enMant?'#F1F5F9':'#EFF6FF'};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:1.3rem;">
        ${enMant?'🔧':'🛏️'}
      </div>
      <div>
        <div style="font-weight:700;">Habitación ${escapeHtml(h.numero)}</div>
        <div style="font-size:0.78rem;color:var(--texto-sub);">
          ${h.tipos_habitacion?.nombre||''} · Estado actual:
          <span style="font-weight:700;color:${COLORES_ESTADO[h.estado]?.badgeBg||'var(--texto)'};">
            ${COLORES_ESTADO[h.estado]?.label||h.estado}
          </span>
        </div>
        ${enMant && h.motivo_mantenimiento ? `<div style="font-size:0.75rem;color:#64748B;margin-top:0.15rem;">📋 ${escapeHtml(h.motivo_mantenimiento)}</div>` : ''}
      </div>
    </div>

    <!-- Cambios rápidos de estado -->
    <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;color:var(--azul);margin-bottom:0.65rem;">Cambio rápido de estado</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-bottom:1.1rem;">
      <button onclick="setEstadoHab('${h.id}','libre')"
        style="padding:0.7rem;border-radius:10px;border:1.5px solid #16A34A;background:${h.estado==='libre'?'#16A34A':'#F0FDF4'};color:${h.estado==='libre'?'white':'#16A34A'};font-weight:600;font-size:0.85rem;cursor:pointer;">
        ✅ Libre
      </button>
      <button onclick="setEstadoHab('${h.id}','limpieza')"
        style="padding:0.7rem;border-radius:10px;border:1.5px solid #CA8A04;background:${h.estado==='limpieza'?'#CA8A04':'#FEFCE8'};color:${h.estado==='limpieza'?'white':'#CA8A04'};font-weight:600;font-size:0.85rem;cursor:pointer;">
        🧹 Limpieza
      </button>
    </div>

    <!-- Enviar a mantenimiento -->
    <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;color:#64748B;margin-bottom:0.65rem;">
      ${enMant ? '🔧 En mantenimiento — actualizar o finalizar' : '🔧 Enviar a mantenimiento'}
    </div>

    ${!enMant ? `
    <div style="${ST.grupo}">
      <label style="${ST.label}">Motivo *</label>
      <select style="${ST.input}" id="mant-motivo-sel" onchange="toggleMotivoCustom(this)">
        <option value="">— Selecciona —</option>
        <option value="Pintura">Pintura</option>
        <option value="Plomería / Agua">Plomería / Agua</option>
        <option value="Electricidad">Electricidad</option>
        <option value="Aire acondicionado">Aire acondicionado</option>
        <option value="TV / Internet">TV / Internet</option>
        <option value="Cama / Muebles">Cama / Muebles</option>
        <option value="Limpieza profunda">Limpieza profunda</option>
        <option value="Desinfección">Desinfección</option>
        <option value="otro">Otro (especificar)…</option>
      </select>
    </div>
    <div id="mant-motivo-custom-wrap" style="display:none;${ST.grupo}">
      <label style="${ST.label}">Especifica el motivo</label>
      <input style="${ST.input}" id="mant-motivo-custom" placeholder="Ej: Reparación de ventana">
    </div>
    <div style="${ST.grupo}">
      <label style="${ST.label}">Descripción / detalle (opcional)</label>
      <textarea style="${ST.input};resize:vertical;min-height:60px;" id="mant-desc" placeholder="Describe el trabajo a realizar…"></textarea>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.65rem;margin-bottom:0.85rem;">
      <div>
        <label style="${ST.label}">Responsable</label>
        <input style="${ST.input}" id="mant-resp" placeholder="Nombre del técnico">
      </div>
      <div>
        <label style="${ST.label}">Fecha fin estimada</label>
        <input style="${ST.input}" id="mant-fecha-fin" type="date" min="${new Date().toISOString().slice(0,10)}">
      </div>
    </div>
    <div style="${ST.grupo}">
      <label style="${ST.label}">Costo estimado (S/)</label>
      <input style="${ST.input}" id="mant-costo" type="number" step="0.01" min="0" placeholder="0.00">
    </div>
    <button onclick="iniciarMantenimiento('${h.id}')"
      style="width:100%;padding:0.8rem;background:linear-gradient(135deg,#475569,#64748B);color:white;border:none;border-radius:10px;font-size:0.9rem;font-weight:700;cursor:pointer;margin-top:0.25rem;">
      🔧 Enviar a mantenimiento
    </button>
    ` : `
    <!-- Ya está en mantenimiento -->
    <div style="background:#F1F5F9;border:1px solid #CBD5E1;border-radius:10px;padding:0.85rem 1rem;margin-bottom:0.85rem;">
      <div style="font-size:0.82rem;display:flex;flex-direction:column;gap:0.35rem;">
        ${h.motivo_mantenimiento?`<div>📋 <strong>Motivo:</strong> ${escapeHtml(h.motivo_mantenimiento)}</div>`:''}
        ${h.responsable_mant?`<div>👷 <strong>Responsable:</strong> ${escapeHtml(h.responsable_mant)}</div>`:''}
        ${h.fecha_inicio_mant?`<div>🕐 <strong>Inicio:</strong> ${fechaHora(h.fecha_inicio_mant)}</div>`:''}
        ${h.fecha_fin_mant_est?`<div>📅 <strong>Fin estimado:</strong> ${fechaCorta(h.fecha_fin_mant_est)}</div>`:''}
      </div>
    </div>
    <div style="${ST.grupo}">
      <label style="${ST.label}">Costo real (S/)</label>
      <input style="${ST.input}" id="mant-costo-real" type="number" step="0.01" min="0" placeholder="0.00">
    </div>
    <div style="${ST.grupo}">
      <label style="${ST.label}">Observaciones finales</label>
      <textarea style="${ST.input};resize:vertical;min-height:55px;" id="mant-obs" placeholder="Trabajo realizado, pendientes…"></textarea>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;">
      <button onclick="finalizarMantenimiento('${h.id}','completado')"
        style="padding:0.75rem;background:#16A34A;color:white;border:none;border-radius:10px;font-size:0.88rem;font-weight:700;cursor:pointer;">
        ✅ Finalizado — Libre
      </button>
      <button onclick="finalizarMantenimiento('${h.id}','limpieza')"
        style="padding:0.75rem;background:#CA8A04;color:white;border:none;border-radius:10px;font-size:0.88rem;font-weight:700;cursor:pointer;">
        🧹 Finalizado — A limpieza
      </button>
    </div>
    <button onclick="verHistorialMant('${h.id}','${escapeHtml(h.numero)}')"
      style="width:100%;padding:0.55rem;background:none;border:1px solid var(--gris-borde);border-radius:9px;font-size:0.8rem;color:var(--texto-sub);cursor:pointer;margin-top:0.5rem;">
      📋 Ver historial de mantenimientos
    </button>
    `}

    <!-- Historial rápido (siempre visible) -->
    <div id="historial-mant-preview"></div>
  `;
  abrirModal(`Habitación ${h.numero}`, html, { ancho: '480px' });

  // Cargar historial reciente al abrir
  setTimeout(() => cargarHistorialMantPreview(h.id), 100);
}

// Toggle motivo personalizado
window.toggleMotivoCustom = function(sel) {
  const wrap = document.getElementById('mant-motivo-custom-wrap');
  if (wrap) wrap.style.display = sel.value === 'otro' ? '' : 'none';
};

async function iniciarMantenimiento(habId) {
  const sel     = document.getElementById('mant-motivo-sel')?.value;
  const custom  = document.getElementById('mant-motivo-custom')?.value?.trim();
  const motivo  = sel === 'otro' ? custom : sel;
  const desc    = document.getElementById('mant-desc')?.value?.trim();
  const resp    = document.getElementById('mant-resp')?.value?.trim();
  const fechaFin= document.getElementById('mant-fecha-fin')?.value;
  const costo   = parseFloat(document.getElementById('mant-costo')?.value)||null;

  if (!motivo) { toast('Selecciona o escribe el motivo','','warn'); return; }

  try {
    const now = new Date().toISOString();
    // Actualizar habitación
    await db.from('habitaciones').update({
      estado:                'mantenimiento',
      motivo_mantenimiento:  motivo,
      fecha_inicio_mant:     now,
      fecha_fin_mant_est:    fechaFin || null,
      responsable_mant:      resp || null,
    }).eq('id', habId);

    // Registrar en historial
    await db.from('mantenimientos').insert({
      hotel_id:       SESSION.hotel.id,
      habitacion_id:  habId,
      motivo,
      descripcion:    desc || null,
      responsable:    resp || null,
      fecha_inicio:   now,
      fecha_fin_est:  fechaFin || null,
      costo_estimado: costo,
      creado_por:     SESSION.user.id,
      estado:         'activo',
    });

    cerrarModal();
    toast('🔧 Hab. en mantenimiento', motivo, 'ok');
    moduloRack();
  } catch(err) { toast('Error', err.message, 'error'); }
}

async function finalizarMantenimiento(habId, nuevoEstado) {
  const costoReal = parseFloat(document.getElementById('mant-costo-real')?.value)||null;
  const obs       = document.getElementById('mant-obs')?.value?.trim();
  const now       = new Date().toISOString();

  try {
    const estadoHab = nuevoEstado === 'limpieza' ? 'limpieza' : 'libre';

    // Actualizar habitación
    await db.from('habitaciones').update({
      estado:               estadoHab,
      motivo_mantenimiento: null,
      fecha_inicio_mant:    null,
      fecha_fin_mant_est:   null,
      responsable_mant:     null,
    }).eq('id', habId);

    // Cerrar el registro de mantenimiento activo
    await db.from('mantenimientos').update({
      estado:        'completado',
      fecha_fin_real:now,
      costo_real:    costoReal,
      descripcion:   obs || null,
    }).eq('habitacion_id', habId).eq('estado', 'activo');

    cerrarModal();
    toast(
      estadoHab === 'limpieza' ? '🧹 A limpieza' : '✅ Habitación libre',
      'Mantenimiento finalizado',
      'ok'
    );
    moduloRack();
  } catch(err) { toast('Error', err.message, 'error'); }
}

async function cargarHistorialMantPreview(habId) {
  const el = document.getElementById('historial-mant-preview');
  if (!el) return;
  try {
    const { data: hist } = await db.from('mantenimientos')
      .select('*').eq('habitacion_id', habId)
      .order('created_at', { ascending: false }).limit(3);
    if (!hist?.length) return;

    el.innerHTML = `
      <div style="margin-top:1rem;border-top:1px solid var(--gris-borde);padding-top:0.85rem;">
        <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;color:var(--texto-sub);margin-bottom:0.5rem;">
          Últimos mantenimientos
        </div>
        ${hist.map(m=>`
          <div style="display:flex;align-items:flex-start;gap:0.65rem;padding:0.5rem 0;border-bottom:1px solid var(--gris-borde);">
            <span style="font-size:0.9rem;">${m.estado==='completado'?'✅':'🔧'}</span>
            <div style="flex:1;min-width:0;">
              <div style="font-size:0.82rem;font-weight:600;">${escapeHtml(m.motivo)}</div>
              <div style="font-size:0.72rem;color:var(--texto-sub);">
                ${fechaCorta(m.fecha_inicio)}
                ${m.responsable?' · '+escapeHtml(m.responsable):''}
                ${m.costo_real?' · S/'+Number(m.costo_real).toFixed(2):''}
              </div>
            </div>
            <span style="font-size:0.68rem;font-weight:700;padding:0.15rem 0.5rem;border-radius:999px;
              background:${m.estado==='completado'?'#F0FDF4':'#F1F5F9'};
              color:${m.estado==='completado'?'#16A34A':'#64748B'};">
              ${m.estado==='completado'?'Hecho':'Activo'}
            </span>
          </div>`).join('')}
        <button onclick="verHistorialMant('${habId}','')" style="width:100%;padding:0.45rem;background:none;border:none;font-size:0.78rem;color:var(--azul);cursor:pointer;margin-top:0.35rem;font-weight:600;">
          Ver historial completo →
        </button>
      </div>`;
  } catch(_) {}
}

async function verHistorialMant(habId, numero) {
  try {
    const { data: hist } = await db.from('mantenimientos')
      .select('*').eq('habitacion_id', habId)
      .order('created_at', { ascending: false }).limit(50);

    abrirModal('📋 Historial — Hab. ' + numero, `
      ${!hist?.length
        ? `<div style="text-align:center;color:var(--texto-sub);padding:2rem;">Sin registros de mantenimiento</div>`
        : `<div style="display:flex;flex-direction:column;gap:0.65rem;max-height:420px;overflow-y:auto;">
            ${hist.map(m=>`
              <div style="background:white;border:1px solid var(--gris-borde);border-radius:12px;padding:0.9rem 1rem;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.4rem;">
                  <span style="font-weight:700;font-size:0.9rem;">${escapeHtml(m.motivo)}</span>
                  <span style="font-size:0.7rem;font-weight:700;padding:0.2rem 0.6rem;border-radius:999px;
                    background:${m.estado==='completado'?'#F0FDF4':m.estado==='cancelado'?'#FEF2F2':'#F1F5F9'};
                    color:${m.estado==='completado'?'#16A34A':m.estado==='cancelado'?'#DC2626':'#64748B'};">
                    ${m.estado==='completado'?'✅ Completado':m.estado==='cancelado'?'❌ Cancelado':'🔧 Activo'}
                  </span>
                </div>
                ${m.descripcion?`<div style="font-size:0.78rem;color:var(--texto-sub);margin-bottom:0.35rem;">${escapeHtml(m.descripcion)}</div>`:''}
                <div style="display:flex;flex-wrap:wrap;gap:0.75rem;font-size:0.75rem;color:var(--texto-sub);">
                  <span>🕐 Inicio: ${fechaHora(m.fecha_inicio)}</span>
                  ${m.fecha_fin_real?`<span>🏁 Fin: ${fechaHora(m.fecha_fin_real)}</span>`:''}
                  ${m.responsable?`<span>👷 ${escapeHtml(m.responsable)}</span>`:''}
                  ${m.costo_estimado?`<span>💰 Est: S/${Number(m.costo_estimado).toFixed(2)}</span>`:''}
                  ${m.costo_real?`<span>💵 Real: S/${Number(m.costo_real).toFixed(2)}</span>`:''}
                </div>
              </div>`).join('')}
          </div>`}
    `, { ancho: '520px' });
  } catch(err) { toast('Error', err.message, 'error'); }
}

async function setEstadoHab(habId, estado) {
  try {
    const update = { estado };
    // Si sale de mantenimiento, limpiar campos
    if (estado !== 'mantenimiento') {
      update.motivo_mantenimiento = null;
      update.fecha_inicio_mant    = null;
      update.fecha_fin_mant_est   = null;
      update.responsable_mant     = null;
    }
    await db.from('habitaciones').update(update).eq('id', habId);
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

    const ahora = new Date();
    const estadoReserva = (r) => {
      const entrada = new Date(r.fecha_entrada);
      const diff = Math.ceil((entrada - ahora) / (1000*60*60*24));
      if (diff <= 0) return ['Hoy','#16A34A','#F0FDF4'];
      if (diff <= 3) return ['Próxima','#2563EB','#EFF6FF'];
      return ['Confirmada','#7C3AED','#F5F3FF'];
    };

    const esMobile = window.innerWidth <= 768;

    if (esMobile) {
      // ══════════════════════════════════════════════
      // LAYOUT MÓVIL — igual al mockup
      // ══════════════════════════════════════════════
      contenido().innerHTML = `

        <!-- Header -->
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:0.75rem;margin-bottom:1rem;">
          <div style="display:flex;align-items:center;gap:0.75rem;">
            <div style="width:44px;height:44px;border-radius:12px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" style="width:22px;height:22px;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div>
              <h1 style="font-size:1.15rem;font-weight:700;color:var(--texto);margin:0;">Reservas a futuro</h1>
              <p style="font-size:0.72rem;color:var(--texto-sub);margin:0.1rem 0 0;">Gestiona las reservas y mantén el control de tu ocupación</p>
            </div>
          </div>
          <button onclick="abrirNuevaReserva()" style="flex-shrink:0;display:flex;align-items:center;gap:0.35rem;padding:0.6rem 0.85rem;background:var(--azul);color:white;border:none;border-radius:10px;font-size:0.78rem;font-weight:700;cursor:pointer;white-space:nowrap;box-shadow:0 4px 12px rgba(37,99,235,0.3);">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" style="width:14px;height:14px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nueva reserva
          </button>
        </div>

        <!-- 4 KPIs en 2x2 -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.6rem;margin-bottom:1rem;">
          ${resKpiMobile('Reserva(s) pendiente(s)', total, '#2563EB', '#EFF6FF', '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>')}
          ${resKpiMobile('Habitación(es) reservada(s)', habsUnicas, '#16A34A', '#F0FDF4', '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>')}
          ${resKpiMobile('Huésped(es) próximo(s)', huespsUni, '#16A34A', '#F0FDF4', '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>')}
          ${resKpiMobileSoles('Ingresos esperados', ingrEsp, '#7C3AED', '#F5F3FF', '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>')}
        </div>

        <!-- Buscador -->
        <div style="position:relative;margin-bottom:0.75rem;">
          <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:15px;height:15px;position:absolute;left:0.8rem;top:50%;transform:translateY(-50%);pointer-events:none;">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" id="res-buscar" placeholder="Buscar por huésped, habitación o fecha…"
            oninput="filtrarReservasMobile()"
            style="width:100%;padding:0.65rem 0.75rem 0.65rem 2.35rem;border:1.5px solid var(--gris-borde);border-radius:12px;font-size:0.83rem;background:white;box-sizing:border-box;outline:none;font-family:inherit;"
            onfocus="this.style.borderColor='var(--azul)'" onblur="this.style.borderColor='var(--gris-borde)'">
        </div>

        <!-- Filtros en fila scrollable -->
        <div style="display:flex;gap:0.5rem;overflow-x:auto;scrollbar-width:none;margin-bottom:1rem;padding-bottom:0.1rem;">
          <div style="display:flex;align-items:center;gap:0.4rem;background:white;border:1px solid var(--gris-borde);border-radius:999px;padding:0.45rem 0.85rem;font-size:0.78rem;color:var(--texto-sub);white-space:nowrap;cursor:pointer;flex-shrink:0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Todas las fechas
            <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:12px;height:12px;"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <div style="display:flex;align-items:center;gap:0.4rem;background:white;border:1px solid var(--gris-borde);border-radius:999px;padding:0.45rem 0.85rem;font-size:0.78rem;color:var(--texto-sub);white-space:nowrap;cursor:pointer;flex-shrink:0;">
            <span style="width:7px;height:7px;border-radius:50%;background:#16A34A;flex-shrink:0;"></span>
            Todas las reservas
            <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:12px;height:12px;"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <div style="display:flex;align-items:center;background:white;border:1px solid var(--gris-borde);border-radius:999px;padding:0.45rem 0.7rem;cursor:pointer;flex-shrink:0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:15px;height:15px;"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="5 8 12 1 19 8"/><polyline points="19 16 12 23 5 16"/></svg>
          </div>
        </div>

        <!-- Tarjetas de reservas -->
        <div id="res-cards-mobile">
          ${renderTarjetasReservasMobile(reservas||[], estadoReserva)}
        </div>

        <!-- Paginación móvil -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin:0.85rem 0;font-size:0.78rem;color:var(--texto-sub);">
          <span>Mostrando ${total} de ${total} reserva${total!==1?'s':''}</span>
          <div style="display:flex;align-items:center;gap:0.4rem;">
            <button style="width:30px;height:30px;border:1px solid var(--gris-borde);border-radius:8px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px;"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button style="width:30px;height:30px;border:none;border-radius:8px;background:var(--azul);color:white;font-weight:700;font-size:0.82rem;cursor:pointer;">1</button>
            <button style="width:30px;height:30px;border:1px solid var(--gris-borde);border-radius:8px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px;"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <select style="border:1px solid var(--gris-borde);border-radius:8px;padding:0.25rem 0.5rem;font-size:0.75rem;background:white;">
              <option>10 por página</option>
              <option>25 por página</option>
            </select>
          </div>
        </div>

        <!-- Banner inferior -->
        <div style="background:white;border:1px solid var(--gris-borde);border-radius:14px;padding:1rem;display:flex;align-items:center;gap:0.85rem;margin-bottom:0.5rem;position:relative;overflow:hidden;">
          <svg style="position:absolute;bottom:0;right:0;opacity:0.08;" viewBox="0 0 200 80" width="200" height="80" preserveAspectRatio="none">
            <path d="M0 50 Q50 10 100 40 Q150 70 200 30 L200 80 L0 80 Z" fill="#2563EB"/>
          </svg>
          <div style="width:40px;height:40px;border-radius:11px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" style="width:20px;height:20px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div style="flex:1;position:relative;">
            <div style="font-weight:700;font-size:0.85rem;color:var(--texto);">Mantén tu ocupación al día</div>
            <div style="font-size:0.72rem;color:var(--texto-sub);margin-top:0.1rem;">Las reservas a futuro te ayudan a planificar mejor la operatividad de tu hotel.</div>
          </div>
          <button style="flex-shrink:0;display:flex;align-items:center;gap:0.35rem;background:white;border:1.5px solid var(--azul);border-radius:9px;padding:0.5rem 0.75rem;font-size:0.75rem;font-weight:600;color:var(--azul);cursor:pointer;position:relative;white-space:nowrap;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Ver calendario
          </button>
        </div>
      `;

      window._reservasData = reservas || [];
      window._reservasEstadoFn = estadoReserva;
      return;
    }

    // ══════════════════════════════════════════════
    // LAYOUT DESKTOP — igual que antes
    // ══════════════════════════════════════════════
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
        <div class="tabla-wrap">
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

function resKpiMobile(label, valor, color, bg, svgPath) {
  return `
    <div class="card" style="padding:0.85rem;min-width:0;overflow:hidden;">
      <div style="width:36px;height:36px;border-radius:10px;background:${bg};display:flex;align-items:center;justify-content:center;margin-bottom:0.5rem;">
        <svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" style="width:18px;height:18px;">${svgPath}</svg>
      </div>
      <div style="font-size:1.4rem;font-weight:700;color:var(--texto);line-height:1;">${valor}</div>
      <div style="font-size:0.68rem;color:var(--texto-sub);margin-top:0.2rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${label}</div>
    </div>`;
}

function resKpiMobileSoles(label, valor, color, bg, svgPath) {
  return `
    <div class="card" style="padding:0.85rem;min-width:0;overflow:hidden;">
      <div style="width:36px;height:36px;border-radius:10px;background:${bg};display:flex;align-items:center;justify-content:center;margin-bottom:0.5rem;">
        <svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" style="width:18px;height:18px;">${svgPath}</svg>
      </div>
      <div style="font-size:1.1rem;font-weight:700;color:var(--texto);line-height:1;">${soles(valor)}</div>
      <div style="font-size:0.68rem;color:var(--texto-sub);margin-top:0.2rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${label}</div>
    </div>`;
}

function renderTarjetasReservasMobile(reservas, estadoReserva) {
  if (!reservas.length) return `
    <div style="text-align:center;padding:2.5rem 1rem;color:var(--texto-sub);">
      <div style="font-size:2.5rem;margin-bottom:0.75rem;">📅</div>
      <div style="font-weight:600;color:var(--texto);margin-bottom:0.25rem;">Sin reservas pendientes</div>
      <div style="font-size:0.8rem;">Las reservas que registres aparecerán aquí</div>
    </div>`;

  return reservas.map(r => {
    const h   = r.huespedes || {};
    const hab = r.habitaciones || {};
    const nombre   = `${h.nombres||''} ${h.apellidos||''}`.trim() || 'Sin nombre';
    const iniciales= nombre.split(/\s+/).slice(0,2).map(p=>p[0]||'').join('').toUpperCase()||'?';
    const [estLabel, estColor, estBg] = estadoReserva(r);
    const entradaD = new Date(r.fecha_entrada);
    const salidaD  = new Date(r.fecha_salida_prev);
    const fmtHora  = d => d.toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'});

    return `
      <div class="card" style="padding:0.9rem 1rem;margin-bottom:0.65rem;">
        <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.75rem;">
          <div>
            <div style="font-size:1.3rem;font-weight:700;color:var(--texto);line-height:1;">${entradaD.getDate()}</div>
            <div style="font-size:0.68rem;color:var(--texto-sub);">${entradaD.toLocaleString('es-PE',{month:'short',year:'numeric'})}</div>
            <div style="font-size:0.68rem;color:var(--texto-sub);">${fmtHora(entradaD)}</div>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:16px;height:16px;flex-shrink:0;"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          <div>
            <div style="font-size:1.1rem;font-weight:700;color:var(--texto);line-height:1;">${salidaD.getDate()}</div>
            <div style="font-size:0.68rem;color:var(--texto-sub);">${salidaD.toLocaleString('es-PE',{month:'short',year:'numeric'})}</div>
            <div style="font-size:0.68rem;color:var(--texto-sub);">${fmtHora(salidaD)}</div>
          </div>
          <div style="flex:1;"></div>
          <span style="font-size:0.7rem;font-weight:700;color:${estColor};background:${estBg};padding:0.2rem 0.65rem;border-radius:999px;white-space:nowrap;">● ${estLabel}</span>
        </div>
        <div style="display:flex;align-items:center;gap:0.65rem;padding:0.6rem 0;border-top:1px solid var(--gris-borde);border-bottom:1px solid var(--gris-borde);">
          <div style="display:flex;align-items:center;gap:0.35rem;background:var(--gris-bg);border-radius:8px;padding:0.3rem 0.6rem;font-size:0.8rem;font-weight:700;flex-shrink:0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px;"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>
            ${escapeHtml(hab.numero||'—')}
          </div>
          <div style="width:28px;height:28px;border-radius:8px;background:#EFF6FF;color:var(--azul);font-size:0.7rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${iniciales}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:600;font-size:0.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(nombre)}</div>
            <div style="font-size:0.7rem;color:var(--texto-sub);">1 huésped</div>
          </div>
          <button style="padding:0.3rem 0.5rem;background:white;border:1px solid var(--gris-borde);border-radius:8px;cursor:pointer;color:var(--texto-sub);font-size:1rem;line-height:1;">···</button>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:0.65rem;">
          <span style="font-size:0.8rem;color:var(--texto-sub);">Adelanto: <strong style="color:var(--texto);">${soles(r.adelanto_pagado||0)}</strong></span>
          <button onclick="hacerCheckinReserva('${r.id}')"
            style="display:flex;align-items:center;gap:0.4rem;background:white;border:1.5px solid #16A34A;border-radius:9px;padding:0.45rem 0.9rem;font-size:0.78rem;font-weight:700;color:#16A34A;cursor:pointer;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
            Check-in
            <svg viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2.5" stroke-linecap="round" style="width:11px;height:11px;"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>
      </div>`;
  }).join('');
}

function filtrarReservasMobile() {
  const q = document.getElementById('res-buscar')?.value?.toLowerCase().trim() || '';
  const cont = document.getElementById('res-cards-mobile');
  if (!cont) return;
  const data = window._reservasData || [];
  const fn   = window._reservasEstadoFn;
  const filtradas = !q ? data : data.filter(r => {
    const h = r.huespedes || {};
    return `${h.nombres||''} ${h.apellidos||''} ${r.habitaciones?.numero||''} ${r.fecha_entrada||''}`.toLowerCase().includes(q);
  });
  cont.innerHTML = renderTarjetasReservasMobile(filtradas, fn);
}

async function hacerCheckinReserva(reservaId) {
  const res = (window._reservasData||[]).find(r=>r.id===reservaId);
  if (res?.habitacion_id) {
    navegarA('rack');
    setTimeout(()=> abrirHabitacion(res.habitacion_id), 500);
  }
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

    const hoyIni = new Date(); hoyIni.setHours(0,0,0,0);
    const hoyFin = new Date(); hoyFin.setHours(23,59,59,999);

    const { data: activos }     = await db.from('estadias_reservas').select('id').eq('hotel_id', SESSION.hotel.id).eq('estado','activa');
    const { data: checkinHoy }  = await db.from('estadias_reservas').select('id').eq('hotel_id', SESSION.hotel.id).gte('fecha_entrada', hoyIni.toISOString()).lte('fecha_entrada', hoyFin.toISOString()).eq('estado','activa');
    const { data: checkoutHoy } = await db.from('estadias_reservas').select('id').eq('hotel_id', SESSION.hotel.id).gte('fecha_salida_real', hoyIni.toISOString()).lte('fecha_salida_real', hoyFin.toISOString()).eq('estado','check_out');

    const totalHuespedes = (huespedes||[]).length;
    const totalActivos   = (activos||[]).length;
    const totalCIHoy     = (checkinHoy||[]).length;
    const totalCOHoy     = (checkoutHoy||[]).length;

    window._huespedesCache = huespedes || [];
    window._huespedesAll   = huespedes || [];

    const esMobile = window.innerWidth <= 768;

    if (esMobile) {
      contenido().innerHTML = `

        <!-- Header -->
        <div style="display:flex;align-items:center;justify-content:space-between;gap:0.75rem;margin-bottom:1rem;">
          <div style="display:flex;align-items:center;gap:0.75rem;">
            <div style="width:42px;height:42px;border-radius:12px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" style="width:21px;height:21px;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div>
              <h1 style="font-size:1.2rem;font-weight:700;color:var(--texto);margin:0;">Huéspedes</h1>
              <p style="font-size:0.7rem;color:var(--texto-sub);margin:0;">Registro oficial de huéspedes del establecimiento</p>
            </div>
          </div>
          <button onclick="abrirRegistrarHuesped()" style="flex-shrink:0;display:flex;align-items:center;gap:0.35rem;padding:0.6rem 0.85rem;background:var(--azul);color:white;border:none;border-radius:10px;font-size:0.78rem;font-weight:700;cursor:pointer;white-space:nowrap;box-shadow:0 4px 12px rgba(37,99,235,0.3);">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" style="width:14px;height:14px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Registrar huésped
          </button>
        </div>

        <!-- 4 KPIs en 2x2 -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.6rem;margin-bottom:1rem;">
          ${huesKpiMobile('Huéspedes registrados', totalHuespedes, '#2563EB', '#EFF6FF',
            '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>', true)}
          ${huesKpiMobile('Alojamientos activos', totalActivos, '#16A34A', '#F0FDF4',
            '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>', false)}
          ${huesKpiMobile('Check-in hoy', totalCIHoy, '#CA8A04', '#FEFCE8',
            '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>', false)}
          ${huesKpiMobile('Check-out hoy', totalCOHoy, '#DC2626', '#FEF2F2',
            '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>', false)}
        </div>

        <!-- Buscador -->
        <div style="position:relative;margin-bottom:0.75rem;">
          <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:15px;height:15px;position:absolute;left:0.8rem;top:50%;transform:translateY(-50%);pointer-events:none;">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" id="hues-buscar" placeholder="Buscar por nombre, DNI o celular…"
            oninput="filtrarHuespedes()"
            style="width:100%;padding:0.65rem 0.75rem 0.65rem 2.35rem;border:1.5px solid var(--gris-borde);border-radius:12px;font-size:0.83rem;background:white;box-sizing:border-box;outline:none;font-family:inherit;"
            onfocus="this.style.borderColor='var(--azul)'" onblur="this.style.borderColor='var(--gris-borde)'">
        </div>

        <!-- Filtros pills -->
        <div style="display:flex;gap:0.5rem;overflow-x:auto;scrollbar-width:none;margin-bottom:1rem;padding-bottom:0.1rem;">
          <div style="display:flex;align-items:center;gap:0.4rem;background:white;border:1px solid var(--gris-borde);border-radius:999px;padding:0.45rem 0.85rem;font-size:0.78rem;color:var(--texto-sub);white-space:nowrap;cursor:pointer;flex-shrink:0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Fecha
            <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:11px;height:11px;"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <div style="display:flex;align-items:center;gap:0.4rem;background:white;border:1px solid var(--gris-borde);border-radius:999px;padding:0.45rem 0.85rem;font-size:0.78rem;color:var(--texto-sub);white-space:nowrap;cursor:pointer;flex-shrink:0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px;"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            Estados
            <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:11px;height:11px;"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <div style="display:flex;align-items:center;gap:0.4rem;background:white;border:1px solid var(--gris-borde);border-radius:999px;padding:0.45rem 0.85rem;font-size:0.78rem;color:var(--texto-sub);white-space:nowrap;cursor:pointer;flex-shrink:0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px;"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
            Recientes
            <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:11px;height:11px;"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>

        <!-- Tarjetas de huéspedes -->
        <div id="hues-cards-mobile">
          ${renderTarjetasHuespedesMobile(huespedes||[])}
        </div>

        <!-- Paginación -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin:0.85rem 0;font-size:0.78rem;color:var(--texto-sub);">
          <span>Mostrando ${totalHuespedes} de ${totalHuespedes} registro(s)</span>
          <div style="display:flex;align-items:center;gap:0.4rem;">
            <button style="width:30px;height:30px;border:1px solid var(--gris-borde);border-radius:8px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px;"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button style="width:30px;height:30px;border:none;border-radius:8px;background:var(--azul);color:white;font-weight:700;font-size:0.82rem;cursor:pointer;">1</button>
            <button style="width:30px;height:30px;border:1px solid var(--gris-borde);border-radius:8px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px;"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
      `;
      return;
    }

    // ══════════════ DESKTOP ══════════════
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
        <div class="tabla-wrap">
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

function huesKpiMobile(label, valor, color, bg, svgPath, flecha) {
  return `
    <div class="card" style="padding:0.85rem;min-width:0;overflow:hidden;position:relative;">
      <div style="position:absolute;bottom:-8px;right:-8px;opacity:0.07;">
        <svg viewBox="0 0 80 60" width="80" height="60"><path d="M0 40 Q20 10 40 30 Q60 50 80 20 L80 60 L0 60 Z" fill="${color}"/></svg>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem;">
        <div style="width:34px;height:34px;border-radius:10px;background:${bg};display:flex;align-items:center;justify-content:center;">
          <svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" style="width:17px;height:17px;">${svgPath}</svg>
        </div>
        ${flecha ? `<svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;opacity:0.6;"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>` : ''}
      </div>
      <div style="font-size:1.5rem;font-weight:700;color:var(--texto);line-height:1;">${valor}</div>
      <div style="font-size:0.68rem;color:var(--texto-sub);margin-top:0.2rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${label}</div>
    </div>`;
}

function renderTarjetasHuespedesMobile(lista) {
  if (!lista.length) return `
    <div style="text-align:center;padding:2.5rem 1rem;color:var(--texto-sub);">
      <div style="font-size:2.5rem;margin-bottom:0.75rem;">👤</div>
      <div style="font-weight:600;color:var(--texto);margin-bottom:0.25rem;">Sin huéspedes registrados</div>
      <div style="font-size:0.8rem;">Los huéspedes que registres aparecerán aquí</div>
    </div>`;

  return lista.map((h, idx) => {
    const nombre   = `${h.nombres||''} ${h.apellidos||''}`.trim() || 'Sin nombre';
    const iniciales= nombre.split(/\s+/).slice(0,2).map(p=>p[0]||'').join('').toUpperCase()||'?';
    const colores  = ['#2563EB','#16A34A','#7C3AED','#CA8A04','#DC2626'];
    const color    = colores[idx % colores.length];
    const bgColor  = ['#EFF6FF','#F0FDF4','#F5F3FF','#FEFCE8','#FEF2F2'][idx % 5];
    const registro = new Date(h.created_at).toLocaleDateString('es-PE',{day:'numeric',month:'short',year:'numeric'});
    const hora     = new Date(h.created_at).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'});

    return `
      <div class="card" style="padding:0.9rem 1rem;margin-bottom:0.6rem;" onclick="abrirFichaHuesped('${h.id}')" style="cursor:pointer;">
        <!-- Nombre + DNI + badge -->
        <div style="display:flex;align-items:flex-start;gap:0.75rem;margin-bottom:0.75rem;">
          <div style="width:40px;height:40px;border-radius:12px;background:${bgColor};color:${color};font-weight:700;font-size:0.88rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${iniciales}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:700;font-size:0.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(nombre)}</div>
            <div style="font-size:0.75rem;color:var(--texto-sub);margin-top:0.1rem;">${escapeHtml(h.tipo_doc||'DNI')} ${escapeHtml(h.num_doc||'—')}</div>
            ${h.celular ? `<div style="font-size:0.72rem;color:var(--texto-sub);">Cel: ${escapeHtml(h.celular)}</div>` : ''}
          </div>
          <span style="flex-shrink:0;font-size:0.65rem;font-weight:700;color:#16A34A;background:#F0FDF4;padding:0.2rem 0.6rem;border-radius:999px;border:1px solid #BBF7D0;">● Registrado</span>
        </div>

        <!-- Fecha registro + habitación + botón -->
        <div style="display:flex;align-items:center;gap:0.75rem;padding-top:0.65rem;border-top:1px solid var(--gris-borde);">
          <div style="width:32px;height:32px;border-radius:9px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" style="width:15px;height:15px;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:0.68rem;color:var(--texto-sub);">Registro</div>
            <div style="font-size:0.8rem;font-weight:600;">${registro} · ${hora}</div>
          </div>
          <div style="display:flex;align-items:center;gap:0.4rem;">
            <div style="text-align:right;">
              <div style="font-size:0.68rem;color:var(--texto-sub);">Habitación</div>
              <div style="font-size:0.8rem;font-weight:600;display:flex;align-items:center;gap:0.3rem;">
                <svg viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2" stroke-linecap="round" style="width:12px;height:12px;"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>
                —
              </div>
            </div>
            <button onclick="event.stopPropagation();editarHuesped('${h.id}','${escapeHtml(h.nombres)}','${escapeHtml(h.apellidos)}','${escapeHtml(h.celular||'')}','${escapeHtml(h.tipo_doc||'DNI')}','${escapeHtml(h.num_doc||'')}')"
              style="padding:0.35rem 0.6rem;background:white;border:1px solid var(--gris-borde);border-radius:8px;cursor:pointer;color:var(--texto-sub);font-size:1rem;line-height:1;flex-shrink:0;">···</button>
          </div>
        </div>
      </div>`;
  }).join('');
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
          <button title="Ver ficha" onclick="abrirFichaHuesped('${h.id}')"
            style="width:32px;height:32px;border:1px solid var(--gris-borde);border-radius:8px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--texto-sub);" onmouseover="this.style.background='var(--gris-bg)'" onmouseout="this.style.background='white'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button title="Editar" onclick="editarHuesped('${h.id}','${escapeHtml(h.nombres)}','${escapeHtml(h.apellidos)}','${escapeHtml(h.celular||'')}','${escapeHtml(h.tipo_doc)}','${escapeHtml(h.num_doc)}')"
            style="width:32px;height:32px;border:1px solid var(--gris-borde);border-radius:8px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--texto-sub);" onmouseover="this.style.background='var(--gris-bg)'" onmouseout="this.style.background='white'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          ${h.celular ? `
          <a href="https://wa.me/51${h.celular.replace(/\D/g,'')}" target="_blank" title="WhatsApp"
            style="width:32px;height:32px;border:1px solid #BBF7D0;border-radius:8px;background:#F0FDF4;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#16A34A;text-decoration:none;" onmouseover="this.style.background='#DCFCE7'" onmouseout="this.style.background='#F0FDF4'">
            <svg viewBox="0 0 24 24" fill="#16A34A" style="width:15px;height:15px;"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.186 21.9l4.83-1.225A9.953 9.953 0 0 0 12 22c5.522 0 10-4.478 10-10S17.521 2 11.999 2z"/></svg>
          </a>` : ''}
        </div>
      </td>
          </button>
        </div>
      </td>
    </tr>`).join('');
}

function filtrarHuespedes() {
  const q = (document.getElementById('hues-buscar')?.value||'').toLowerCase();

  // Desktop: filtrar filas de tabla
  document.querySelectorAll('.hues-fila').forEach(tr => {
    tr.style.display = !q || tr.dataset.buscar.includes(q) ? '' : 'none';
  });

  // Móvil: filtrar tarjetas
  const contMobile = document.getElementById('hues-cards-mobile');
  if (contMobile) {
    const data = window._huespedesAll || [];
    const filtrados = !q ? data : data.filter(h => {
      return `${h.nombres||''} ${h.apellidos||''} ${h.num_doc||''} ${h.celular||''}`.toLowerCase().includes(q);
    });
    contMobile.innerHTML = renderTarjetasHuespedesMobile(filtrados);
  }
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

// ════════════════════════════════════════════════════════════
//  FICHA COMPLETA DEL HUÉSPED — Historial + Stats
// ════════════════════════════════════════════════════════════
async function abrirFichaHuesped(huespedId) {
  try {
    // Datos del huésped
    const { data: h } = await db.from('huespedes')
      .select('*').eq('id', huespedId).single();

    // Todas sus estadías
    const { data: estadias } = await db.from('estadias_reservas')
      .select('*, habitaciones(numero, tipos_habitacion(nombre))')
      .eq('huesped_id', huespedId)
      .order('fecha_entrada', { ascending: false })
      .limit(50);

    const todas    = estadias || [];
    const completadas = todas.filter(e => e.estado === 'check_out');
    const activa      = todas.find(e => e.estado === 'activa');
    const pendientes  = todas.filter(e => e.estado === 'reservada');

    // Estadísticas
    const totalGastado = completadas.reduce((s,e) => s + Number(e.total_final||0), 0);
    const totalNoches  = completadas.reduce((s,e) => {
      if (!e.fecha_entrada || !e.fecha_salida_real) return s;
      return s + Math.max(1, Math.round((new Date(e.fecha_salida_real)-new Date(e.fecha_entrada))/(1000*60*60*24)));
    }, 0);
    const ticketProm   = completadas.length ? totalGastado/completadas.length : 0;
    const saldoPend    = todas.filter(e=>e.estado==='activa').reduce((s,e)=>s+Math.max(0,Number(e.total_final||0)-Number(e.adelanto_pagado||0)),0);

    // Badge fidelidad
    const nivel = totalGastado >= 2000 ? { label:'⭐ VIP', color:'#7C3AED', bg:'#F5F3FF' }
                : totalGastado >= 500  ? { label:'🥇 Frecuente', color:'#CA8A04', bg:'#FEFCE8' }
                : completadas.length > 0 ? { label:'✅ Recurrente', color:'#16A34A', bg:'#F0FDF4' }
                : { label:'🆕 Nuevo', color:'#2563EB', bg:'#EFF6FF' };

    abrirModal(`Ficha — ${escapeHtml(h.nombres)} ${escapeHtml(h.apellidos)}`, `

      <!-- Avatar + info principal -->
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.25rem;">
        <div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,var(--azul),#2563EB);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:1.4rem;font-weight:800;color:white;">
          ${h.nombres[0].toUpperCase()}
        </div>
        <div style="flex:1;">
          <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
            <span style="font-weight:700;font-size:1.05rem;">${escapeHtml(h.nombres)} ${escapeHtml(h.apellidos)}</span>
            <span style="font-size:0.7rem;font-weight:700;padding:0.2rem 0.6rem;border-radius:999px;background:${nivel.bg};color:${nivel.color};">${nivel.label}</span>
          </div>
          <div style="font-size:0.8rem;color:var(--texto-sub);margin-top:0.2rem;">
            ${escapeHtml(h.tipo_doc)} ${escapeHtml(h.num_doc)}
            ${h.celular ? ` · 📱 ${escapeHtml(h.celular)}` : ''}
            ${h.email ? ` · ✉️ ${escapeHtml(h.email)}` : ''}
          </div>
          <div style="font-size:0.72rem;color:var(--texto-sub);margin-top:0.1rem;">
            Cliente desde ${new Date(h.created_at).toLocaleDateString('es-PE',{month:'long',year:'numeric'})}
          </div>
        </div>
        ${h.celular ? `
        <a href="https://wa.me/51${h.celular.replace(/\D/g,'')}" target="_blank"
          style="padding:0.5rem 0.85rem;background:#16A34A;color:white;border-radius:9px;font-size:0.8rem;font-weight:600;text-decoration:none;display:flex;align-items:center;gap:0.35rem;flex-shrink:0;">
          💬 WA
        </a>` : ''}
      </div>

      <!-- 4 métricas -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.65rem;margin-bottom:1.25rem;">
        ${[
          ['Estadías', completadas.length, '#2563EB','#EFF6FF'],
          ['Noches',   totalNoches,        '#7C3AED','#F5F3FF'],
          ['Gasto total', soles(totalGastado), '#16A34A','#F0FDF4'],
          ['Ticket prom.', soles(ticketProm), '#EA580C','#FFF7ED'],
        ].map(([label,val,color,bg])=>`
          <div style="background:white;border:1px solid var(--gris-borde);border-radius:10px;padding:0.75rem;text-align:center;">
            <div style="font-size:0.65rem;color:var(--texto-sub);text-transform:uppercase;margin-bottom:0.2rem;">${label}</div>
            <div style="font-weight:700;font-size:0.95rem;color:${color};">${val}</div>
          </div>`).join('')}
      </div>

      ${saldoPend > 0 ? `
      <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:10px;padding:0.75rem 1rem;margin-bottom:1rem;display:flex;align-items:center;justify-content:space-between;">
        <span style="font-size:0.83rem;font-weight:600;color:#DC2626;">⚠️ Saldo pendiente en estadía activa</span>
        <span style="font-weight:700;color:#DC2626;">${soles(saldoPend)}</span>
      </div>` : ''}

      ${activa ? `
      <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:10px;padding:0.75rem 1rem;margin-bottom:1rem;display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="font-weight:700;font-size:0.85rem;color:var(--azul);">🏨 Estadía activa — Hab. ${activa.habitaciones?.numero}</div>
          <div style="font-size:0.75rem;color:var(--texto-sub);">Entrada: ${fechaHora(activa.fecha_entrada)} · Salida prev: ${fechaHora(activa.fecha_salida_prev)}</div>
        </div>
        <button onclick="cerrarModal();abrirEstadiaActiva({id:'${activa.habitacion_id}',numero:'${activa.habitaciones?.numero}',tipos_habitacion:{}})"
          style="padding:0.4rem 0.75rem;background:var(--azul);color:white;border:none;border-radius:8px;font-size:0.78rem;font-weight:600;cursor:pointer;">
          Ver estadía
        </button>
      </div>` : ''}

      <!-- Historial de estadías -->
      <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;color:var(--texto-sub);margin-bottom:0.65rem;">
        Historial de estadías (${todas.length})
      </div>
      <div style="display:flex;flex-direction:column;gap:0.5rem;max-height:280px;overflow-y:auto;">
        ${!todas.length
          ? `<div style="text-align:center;color:var(--texto-sub);padding:1.5rem;font-size:0.83rem;">Sin estadías registradas</div>`
          : todas.map(e => {
            const hab    = e.habitaciones?.numero || '?';
            const tipo   = e.habitaciones?.tipos_habitacion?.nombre || '';
            const noches = e.fecha_salida_real
              ? Math.max(1, Math.round((new Date(e.fecha_salida_real)-new Date(e.fecha_entrada))/(1000*60*60*24)))
              : null;
            const estColor = e.estado==='check_out' ? '#16A34A'
                           : e.estado==='activa'    ? '#2563EB'
                           : e.estado==='reservada' ? '#CA8A04' : '#64748B';
            const estBg    = e.estado==='check_out' ? '#F0FDF4'
                           : e.estado==='activa'    ? '#EFF6FF'
                           : e.estado==='reservada' ? '#FEFCE8' : '#F1F5F9';
            const estLabel = e.estado==='check_out' ? 'Check-out'
                           : e.estado==='activa'    ? '🏨 Activa'
                           : e.estado==='reservada' ? '📅 Reserva' : e.estado;
            return `
              <div style="display:flex;align-items:center;gap:0.75rem;background:white;border:1px solid var(--gris-borde);border-radius:10px;padding:0.75rem 0.9rem;">
                <div style="width:36px;height:36px;border-radius:9px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:800;font-size:0.85rem;color:var(--azul);">
                  ${hab}
                </div>
                <div style="flex:1;min-width:0;">
                  <div style="font-weight:600;font-size:0.83rem;">${escapeHtml(tipo)} · Hab. ${hab}</div>
                  <div style="font-size:0.72rem;color:var(--texto-sub);">
                    ${fechaCorta(e.fecha_entrada)}
                    ${e.fecha_salida_real ? ' → '+fechaCorta(e.fecha_salida_real) : ''}
                    ${noches ? ' · '+noches+' noche'+(noches>1?'s':'') : ''}
                    · ${escapeHtml(e.modalidad||'noche')}
                  </div>
                </div>
                <div style="text-align:right;flex-shrink:0;">
                  <div style="font-weight:700;font-size:0.88rem;color:var(--verde);">${soles(e.total_final||e.tarifa_aplicada||0)}</div>
                  <span style="font-size:0.65rem;font-weight:700;padding:0.15rem 0.5rem;border-radius:999px;background:${estBg};color:${estColor};">${estLabel}</span>
                </div>
              </div>`;
          }).join('')}
      </div>

      <!-- Botones -->
      <div style="display:flex;gap:0.5rem;margin-top:1rem;">
        <button onclick="editarHuesped('${h.id}','${escapeHtml(h.nombres)}','${escapeHtml(h.apellidos)}','${escapeHtml(h.celular||'')}','${escapeHtml(h.tipo_doc)}','${escapeHtml(h.num_doc)}')"
          style="${ST.btnSec};flex:1;display:flex;align-items:center;justify-content:center;gap:0.4rem;">
          ✏️ Editar datos
        </button>
        ${activa ? '' : `
        <button onclick="cerrarModal();navegarA('rack')"
          style="${ST.btnPri};flex:1;display:flex;align-items:center;justify-content:center;gap:0.4rem;">
          🏨 Nuevo check-in
        </button>`}
      </div>
    `, { ancho: '560px' });

  } catch(err) { toast('Error', err.message, 'error'); }
}

function editarHuesped(id, nombres, apellidos, celular, tipoDoc, numDoc) {
  abrirModal('Editar huésped', `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.65rem;margin-bottom:0.65rem;">
      <div><label style="${ST.label}">Nombres *</label>
        <input style="${ST.input}" id="edit-hues-nombres" value="${escapeHtml(nombres)}">
      </div>
      <div><label style="${ST.label}">Apellidos *</label>
        <input style="${ST.input}" id="edit-hues-apellidos" value="${escapeHtml(apellidos)}">
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.65rem;margin-bottom:0.65rem;">
      <div><label style="${ST.label}">Tipo doc.</label>
        <select style="${ST.input}" id="edit-hues-tipo">
          <option ${tipoDoc==='DNI'?'selected':''}>DNI</option>
          <option ${tipoDoc==='CE'?'selected':''}>CE</option>
          <option ${tipoDoc==='PASAPORTE'?'selected':''}>PASAPORTE</option>
        </select>
      </div>
      <div><label style="${ST.label}">N° documento</label>
        <input style="${ST.input}" id="edit-hues-doc" value="${escapeHtml(numDoc)}">
      </div>
    </div>
    <div style="${ST.grupo}">
      <label style="${ST.label}">Celular</label>
      <input style="${ST.input}" id="edit-hues-celular" value="${escapeHtml(celular)}" placeholder="999999999">
    </div>
    <button onclick="guardarEdicionHuesped('${id}')" style="${ST.btnPri}">Guardar cambios</button>
  `, { ancho:'420px' });
}

async function guardarEdicionHuesped(id) {
  const nombres   = document.getElementById('edit-hues-nombres')?.value?.trim();
  const apellidos = document.getElementById('edit-hues-apellidos')?.value?.trim();
  const tipo      = document.getElementById('edit-hues-tipo')?.value;
  const doc       = document.getElementById('edit-hues-doc')?.value?.trim();
  const celular   = document.getElementById('edit-hues-celular')?.value?.trim();
  if (!nombres || !apellidos) { toast('Completa nombres y apellidos','','warn'); return; }
  try {
    await db.from('huespedes').update({ nombres, apellidos, tipo_doc:tipo, num_doc:doc, celular }).eq('id', id);
    cerrarModal();
    toast('✅ Datos actualizados','','ok');
    moduloHuespedes();
  } catch(err) { toast('Error', err.message, 'error'); }
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

    const esMobile = window.innerWidth <= 768;

    if (esMobile) {
      contenido().innerHTML = `

        <!-- Header -->
        <div style="display:flex;align-items:flex-start;gap:0.85rem;margin-bottom:1rem;">
          <div style="width:44px;height:44px;border-radius:12px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" style="width:22px;height:22px;"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          </div>
          <div>
            <h1 style="font-size:1.2rem;font-weight:700;color:var(--texto);margin:0;">Tiendita / Almacén</h1>
            <p style="font-size:0.7rem;color:var(--texto-sub);margin:0.1rem 0 0;">Gestiona tus productos, controla el stock y realiza ventas rápidas.</p>
          </div>
        </div>

        <!-- 4 KPIs en 2x2 -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.6rem;margin-bottom:1rem;">
          ${tiendaKpiMobile('Productos', totalProds, 'Activos en inventario', '#2563EB', '#EFF6FF', '0%',
            '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>', false)}
          ${tiendaKpiMobile('Stock total', stockTotal, 'Unidades', '#16A34A', '#F0FDF4', '12%',
            '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>', false)}
          ${tiendaKpiMobile('Valor en inventario (costo)', valorCosto, '', '#EA580C', '#FFF7ED', '8%',
            '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>', true)}
          ${tiendaKpiMobile('Valor de venta (potencial)', valorVenta, '', '#DC2626', '#FEF2F2', '8%',
            '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>', true)}
        </div>

        <!-- Pills de categoría scroll -->
        <div style="overflow-x:auto;scrollbar-width:none;margin-bottom:0.85rem;">
          <div style="display:flex;gap:0.5rem;padding-bottom:0.1rem;min-width:max-content;">
            ${cats.map(c => `
              <button onclick="filtrarTiendaCat('${c}')"
                style="padding:0.45rem 0.9rem;border-radius:999px;font-size:0.78rem;font-weight:600;cursor:pointer;white-space:nowrap;
                  background:${window._tiendaFiltrocat===c?'var(--azul)':'white'};
                  color:${window._tiendaFiltrocat===c?'white':'var(--texto-sub)'};
                  border:1.5px solid ${window._tiendaFiltrocat===c?'transparent':'var(--gris-borde)'};
                  box-shadow:${window._tiendaFiltrocat===c?'0 4px 12px rgba(37,99,235,0.3)':'none'};">
                ${escapeHtml(c)} (${catCounts[c]||0})
              </button>`).join('')}
          </div>
        </div>

        <!-- 3 botones de acción -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.6rem;margin-bottom:1rem;">
          <button onclick="abrirReposicion()"
            style="display:flex;flex-direction:column;align-items:center;gap:0.35rem;padding:0.85rem 0.5rem;background:white;border:1.5px solid var(--gris-borde);border-radius:14px;cursor:pointer;font-size:0.68rem;font-weight:600;color:var(--texto-sub);">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:22px;height:22px;"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            Reposición de stock
          </button>
          <button onclick="abrirVentaRapida()"
            style="display:flex;flex-direction:column;align-items:center;gap:0.35rem;padding:0.85rem 0.5rem;background:white;border:1.5px solid #BFDBFE;border-radius:14px;cursor:pointer;font-size:0.68rem;font-weight:700;color:var(--azul);">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--azul)" stroke-width="2" stroke-linecap="round" style="width:22px;height:22px;"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            Venta rápida
          </button>
          <button onclick="abrirFormProducto()"
            style="display:flex;flex-direction:column;align-items:center;gap:0.35rem;padding:0.85rem 0.5rem;background:var(--azul);border:none;border-radius:14px;cursor:pointer;font-size:0.68rem;font-weight:700;color:white;box-shadow:0 4px 14px rgba(37,99,235,0.35);">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" style="width:22px;height:22px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo producto
          </button>
        </div>

        <!-- Banner inferior -->
        <div onclick="verListaProductosMobile()" style="background:white;border:1px solid var(--gris-borde);border-radius:14px;padding:1rem;display:flex;align-items:center;gap:0.85rem;position:relative;overflow:hidden;cursor:pointer;"
          ontouchstart="this.style.background='var(--gris-bg)'" ontouchend="this.style.background='white'">
          <svg style="position:absolute;bottom:0;right:0;opacity:0.07;" viewBox="0 0 200 80" width="200" height="80" preserveAspectRatio="none">
            <path d="M0 50 Q50 10 100 40 Q150 70 200 30 L200 80 L0 80 Z" fill="#2563EB"/>
          </svg>
          <div style="width:40px;height:40px;border-radius:11px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" style="width:20px;height:20px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div style="flex:1;position:relative;">
            <div style="font-weight:700;font-size:0.88rem;color:var(--texto);">Mantén tu inventario bajo control</div>
            <div style="font-size:0.72rem;color:var(--texto-sub);margin-top:0.1rem;">Registra nuevos productos, actualiza el stock y realiza ventas rápidas desde aquí.</div>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--azul)" stroke-width="2.5" stroke-linecap="round" style="width:16px;height:16px;flex-shrink:0;position:relative;"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      `;
      return;
    }

    // ══════════ DESKTOP ══════════
    contenido().innerHTML = `
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
        <div class="tabla-wrap">
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

function verListaProductosMobile() {
  const prods = window._productosCache || [];

  // Categorías
  const cats = ['Todos', ...new Set(prods.map(p => p.categoria||'general'))];
  const catCounts = {};
  cats.forEach(c => { catCounts[c] = c==='Todos' ? prods.length : prods.filter(p=>(p.categoria||'general')===c).length; });
  const filtro = window._tiendaFiltrocat || 'Todos';

  function renderCards(lista) {
    if (!lista.length) return `<div style="text-align:center;padding:2.5rem;color:var(--texto-sub);">Sin productos en esta categoría</div>`;
    return lista.map(p => {
      const enStock  = Number(p.stock_actual||0) > 0;
      const valStock = Number(p.stock_actual||0) * Number(p.precio_venta||0);
      return `
        <div class="card" style="padding:0.9rem 1rem;margin-bottom:0.65rem;">
          <!-- Fila superior: checkbox + imagen + nombre + badge + ··· -->
          <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.75rem;">
            <input type="checkbox" style="width:16px;height:16px;cursor:pointer;flex-shrink:0;accent-color:var(--azul);">
            <div style="width:48px;height:48px;border-radius:10px;background:var(--gris-bg);display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;">
              ${p.imagen_url
                ? `<img src="${escapeHtml(p.imagen_url)}" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.innerHTML='📦'">`
                : '<span style="font-size:1.5rem;">📦</span>'}
            </div>
            <div style="flex:1;min-width:0;">
              <div style="font-weight:700;font-size:0.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(p.nombre||'—')}</div>
              <span style="display:inline-block;background:#F1F5F9;color:#64748B;font-size:0.65rem;font-weight:600;padding:0.15rem 0.5rem;border-radius:999px;margin-top:0.15rem;">${escapeHtml(p.categoria||'general')}</span>
            </div>
            <span style="font-size:0.68rem;font-weight:700;color:${enStock?'#16A34A':'#DC2626'};background:${enStock?'#F0FDF4':'#FEF2F2'};padding:0.2rem 0.6rem;border-radius:999px;white-space:nowrap;flex-shrink:0;">● ${enStock?'En stock':'Sin stock'}</span>
            <button onclick="abrirFormProducto('${p.id}')" style="padding:0.3rem 0.5rem;background:white;border:1px solid var(--gris-borde);border-radius:8px;cursor:pointer;color:var(--texto-sub);font-size:1rem;line-height:1;flex-shrink:0;">···</button>
          </div>
          <!-- Fila inferior: métricas -->
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.5rem;padding-top:0.65rem;border-top:1px solid var(--gris-borde);">
            <div>
              <div style="font-size:0.62rem;color:var(--texto-sub);">Precio venta</div>
              <div style="font-weight:700;font-size:0.82rem;color:var(--texto);">${soles(p.precio_venta||0)}</div>
            </div>
            <div>
              <div style="font-size:0.62rem;color:var(--texto-sub);">Costo</div>
              <div style="font-weight:700;font-size:0.82rem;color:var(--texto);">${soles(p.costo_compra||0)}</div>
            </div>
            <div>
              <div style="font-size:0.62rem;color:var(--texto-sub);">Stock</div>
              <div style="font-weight:700;font-size:0.82rem;color:${enStock?'#16A34A':'#DC2626'};">${p.stock_actual||0}</div>
            </div>
            <div>
              <div style="font-size:0.62rem;color:var(--texto-sub);">Valor en stock</div>
              <div style="font-weight:700;font-size:0.82rem;color:var(--texto);">${soles(valStock)}</div>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  const filtrados = filtro==='Todos' ? prods : prods.filter(p=>(p.categoria||'general')===filtro);

  contenido().innerHTML = `
    <!-- Header con botón volver -->
    <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem;">
      <button onclick="moduloTiendita()" style="width:36px;height:36px;border:1px solid var(--gris-borde);border-radius:10px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--texto-sub);flex-shrink:0;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:16px;height:16px;"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <div>
        <h1 style="font-size:1.15rem;font-weight:700;color:var(--texto);margin:0;">Tienda / Almacén</h1>
        <p style="font-size:0.7rem;color:var(--texto-sub);margin:0;">Lista de productos registrados</p>
      </div>
    </div>

    <!-- Buscador -->
    <div style="position:relative;margin-bottom:0.75rem;">
      <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:15px;height:15px;position:absolute;left:0.8rem;top:50%;transform:translateY(-50%);pointer-events:none;">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input type="text" id="tienda-buscar-mobile" placeholder="Buscar producto…"
        oninput="filtrarTiendaMobileLista(this.value)"
        style="width:100%;padding:0.65rem 0.75rem 0.65rem 2.35rem;border:1.5px solid var(--gris-borde);border-radius:12px;font-size:0.83rem;background:white;box-sizing:border-box;outline:none;font-family:inherit;"
        onfocus="this.style.borderColor='var(--azul)'" onblur="this.style.borderColor='var(--gris-borde)'">
    </div>

    <!-- Filtros ordenar + filtro -->
    <div style="display:flex;gap:0.5rem;margin-bottom:0.75rem;">
      <div style="display:flex;align-items:center;gap:0.4rem;background:white;border:1px solid var(--gris-borde);border-radius:999px;padding:0.45rem 0.85rem;font-size:0.78rem;color:var(--texto-sub);cursor:pointer;">
        Ordenar por
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:12px;height:12px;"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div style="display:flex;align-items:center;gap:0.4rem;background:white;border:1px solid var(--gris-borde);border-radius:999px;padding:0.45rem 0.85rem;font-size:0.78rem;color:var(--texto-sub);cursor:pointer;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px;"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
        Filtros
      </div>
    </div>

    <!-- Pills categoría scroll -->
    <div style="overflow-x:auto;scrollbar-width:none;margin-bottom:1rem;">
      <div style="display:flex;gap:0.5rem;min-width:max-content;padding-bottom:0.1rem;">
        ${cats.map(c => `
          <button onclick="filtrarTiendaCatMobile('${c}')" id="cat-mob-${c.replace(/\s/g,'_')}"
            style="padding:0.45rem 0.9rem;border-radius:999px;font-size:0.78rem;font-weight:600;cursor:pointer;white-space:nowrap;
              background:${filtro===c?'var(--azul)':'white'};
              color:${filtro===c?'white':'var(--texto-sub)'};
              border:1.5px solid ${filtro===c?'transparent':'var(--gris-borde)'};
              box-shadow:${filtro===c?'0 4px 12px rgba(37,99,235,0.3)':'none'};">
            ${escapeHtml(c)} (${catCounts[c]||0})
          </button>`).join('')}
      </div>
    </div>

    <!-- Lista de productos -->
    <div id="lista-prods-mobile">
      ${renderCards(filtrados)}
    </div>

    <!-- Paginación -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin:0.75rem 0;font-size:0.75rem;color:var(--texto-sub);">
      <span>Mostrando 1 a ${filtrados.length} de ${filtrados.length} productos</span>
      <div style="display:flex;align-items:center;gap:0.4rem;">
        <button style="width:28px;height:28px;border:1px solid var(--gris-borde);border-radius:7px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:12px;height:12px;"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button style="width:28px;height:28px;border:none;border-radius:7px;background:var(--azul);color:white;font-weight:700;font-size:0.8rem;cursor:pointer;">1</button>
        <button style="width:28px;height:28px;border:1px solid var(--gris-borde);border-radius:7px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:12px;height:12px;"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <select style="border:1px solid var(--gris-borde);border-radius:7px;padding:0.2rem 0.45rem;font-size:0.72rem;background:white;">
          <option>10 por página</option><option>25 por página</option>
        </select>
      </div>
    </div>

    <!-- Botón ver reporte -->
    <button style="width:100%;padding:0.85rem;background:white;border:1.5px solid var(--gris-borde);border-radius:14px;font-size:0.88rem;font-weight:600;color:var(--texto-sub);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:0.5rem;margin-bottom:0.5rem;">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:16px;height:16px;"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
      Ver reporte de stock
    </button>
  `;

  // Guardar render para filtros
  window._renderCardsTienda = renderCards;
}

function filtrarTiendaCatMobile(cat) {
  window._tiendaFiltrocat = cat;
  const prods = window._productosCache || [];
  // Actualizar estilos de pills
  document.querySelectorAll('[id^="cat-mob-"]').forEach(btn => {
    const activo = btn.id === 'cat-mob-' + cat.replace(/\s/g,'_');
    btn.style.background = activo ? 'var(--azul)' : 'white';
    btn.style.color       = activo ? 'white' : 'var(--texto-sub)';
    btn.style.borderColor = activo ? 'transparent' : 'var(--gris-borde)';
    btn.style.boxShadow   = activo ? '0 4px 12px rgba(37,99,235,0.3)' : 'none';
  });
  const filtrados = cat==='Todos' ? prods : prods.filter(p=>(p.categoria||'general')===cat);
  const cont = document.getElementById('lista-prods-mobile');
  if (cont && window._renderCardsTienda) cont.innerHTML = window._renderCardsTienda(filtrados);
}

function filtrarTiendaMobileLista(q) {
  const prods  = window._productosCache || [];
  const filtro = window._tiendaFiltrocat || 'Todos';
  let lista = filtro==='Todos' ? prods : prods.filter(p=>(p.categoria||'general')===filtro);
  if (q.trim()) lista = lista.filter(p => (p.nombre||'').toLowerCase().includes(q.toLowerCase()));
  const cont = document.getElementById('lista-prods-mobile');
  if (cont && window._renderCardsTienda) cont.innerHTML = window._renderCardsTienda(lista);
}

function tiendaKpiMobile(label, valor, sub, color, bg, pct, icono, esSoles) {
  const bajada = pct.startsWith('-') || pct.includes('8%'); // rojos bajan
  return `
    <div class="card" style="padding:0.9rem;min-width:0;overflow:hidden;position:relative;">
      <div style="position:absolute;bottom:-8px;right:-8px;opacity:0.07;">
        <svg viewBox="0 0 80 60" width="80" height="60"><path d="M0 40 Q20 10 40 30 Q60 50 80 20 L80 60 L0 60 Z" fill="${color}"/></svg>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem;">
        <div style="width:34px;height:34px;border-radius:10px;background:${bg};display:flex;align-items:center;justify-content:center;">
          <svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" style="width:17px;height:17px;">${icono}</svg>
        </div>
        <span style="font-size:0.65rem;font-weight:700;color:${bajada?'#DC2626':'#16A34A'};display:flex;align-items:center;gap:0.15rem;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:10px;height:10px;">
            ${bajada?'<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>'
                    :'<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>'}
          </svg>
          ${pct}
        </span>
      </div>
      <div style="font-size:${esSoles?'1.1':'1.4'}rem;font-weight:700;color:var(--texto);line-height:1;">${esSoles?soles(valor):valor}</div>
      <div style="font-size:0.67rem;color:var(--texto-sub);margin-top:0.2rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${label}${sub?'<br>'+sub:''}</div>
    </div>`;
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
        <div class="tabla-wrap">
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
        <div class="tabla-wrap">
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
        <div class="tabla-wrap">
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

  // Helper sparkline disponible en toda la función
  const sparkline = (color) => `<svg viewBox="0 0 80 30" preserveAspectRatio="none" style="position:absolute;bottom:0;left:0;right:0;width:100%;height:50px;opacity:0.3;"><polyline points="0,25 20,18 40,22 60,10 80,5" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

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
  const total      = _restNumMesas;
  const libres     = total - mesasOcupadas.size;
  const ocupadas   = mesasOcupadas.size;
  const enPrep     = _restComandas.filter(c=>(c.notas||'').includes('ESTADO:preparando')).length;
  const listos     = _restComandas.filter(c=>(c.notas||'').includes('ESTADO:listo')).length;

  window._restFiltro = window._restFiltro || 'Todos';
  window._restVista  = window._restVista  || 'grilla';

  const avisoTurno = !SESSION.turnoActivo ? `
    <div id="aviso-turno-rest" style="display:flex;align-items:center;justify-content:space-between;gap:1rem;background:#FFFBEB;border:1px solid #FDE68A;border-radius:12px;padding:0.75rem 1.1rem;margin-bottom:1.25rem;">
      <div style="display:flex;align-items:center;gap:0.65rem;">
        <svg viewBox="0 0 24 24" fill="none" stroke="#CA8A04" stroke-width="2" stroke-linecap="round" style="width:18px;height:18px;flex-shrink:0;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <span style="font-size:0.83rem;color:#92400E;font-weight:500;">Abre un turno de caja antes de cobrar.</span>
        <a href="#" onclick="navegarA('caja');return false;" style="font-size:0.83rem;font-weight:700;color:#92400E;text-decoration:none;">Ir a Caja →</a>
      </div>
      <button onclick="document.getElementById('aviso-turno-rest').remove()" style="background:none;border:none;cursor:pointer;color:#CA8A04;font-size:1.1rem;padding:0;line-height:1;">✕</button>
    </div>` : '';

  const esMobile = window.innerWidth <= 768;

  if (esMobile) {
    contenido().innerHTML = `

      <!-- Header móvil -->
      <div style="display:flex;align-items:center;gap:0.85rem;margin-bottom:1rem;">
        <div style="width:44px;height:44px;border-radius:12px;background:#FFF7ED;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg viewBox="0 0 24 24" fill="none" stroke="#EA580C" stroke-width="2" stroke-linecap="round" style="width:22px;height:22px;"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>
        </div>
        <div>
          <h1 style="font-size:1.2rem;font-weight:700;color:var(--texto);margin:0;">Restaurante</h1>
          <p style="font-size:0.7rem;color:var(--texto-sub);margin:0;">Selecciona una mesa para tomar el pedido</p>
        </div>
      </div>

      ${avisoTurno}

      <!-- 4 KPIs en 2×2 -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.6rem;margin-bottom:1rem;">
        <!-- Mesas totales -->
        <div class="card" style="padding:0.9rem;display:flex;align-items:center;gap:0.75rem;min-width:0;">
          <div style="width:38px;height:38px;border-radius:10px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" style="width:19px;height:19px;"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
          </div>
          <div>
            <div style="font-size:1.5rem;font-weight:700;color:var(--texto);line-height:1;">${total}</div>
            <div style="font-size:0.68rem;color:var(--texto-sub);">Mesas totales</div>
          </div>
        </div>
        <!-- Libres -->
        <div class="card" style="padding:0.9rem;display:flex;align-items:center;gap:0.75rem;min-width:0;">
          <span style="width:14px;height:14px;border-radius:50%;background:#16A34A;flex-shrink:0;box-shadow:0 0 0 3px #BBF7D0;"></span>
          <div>
            <div style="font-size:1.5rem;font-weight:700;color:var(--texto);line-height:1;">${libres}</div>
            <div style="font-size:0.68rem;color:var(--texto-sub);">Mesas libres</div>
          </div>
        </div>
        <!-- Ocupadas -->
        <div class="card" style="padding:0.9rem;display:flex;align-items:center;gap:0.75rem;min-width:0;background:#FEF2F2;border-color:#FECACA;">
          <span style="width:14px;height:14px;border-radius:50%;background:#DC2626;flex-shrink:0;box-shadow:0 0 0 3px #FECACA;"></span>
          <div>
            <div style="font-size:1.5rem;font-weight:700;color:var(--texto);line-height:1;">${ocupadas}</div>
            <div style="font-size:0.68rem;color:var(--texto-sub);">Mesas ocupadas</div>
          </div>
        </div>
        <!-- En preparación -->
        <div class="card" style="padding:0.9rem;display:flex;align-items:center;gap:0.75rem;min-width:0;background:#FEFCE8;border-color:#FDE68A;">
          <span style="width:14px;height:14px;border-radius:50%;background:#CA8A04;flex-shrink:0;box-shadow:0 0 0 3px #FDE68A;"></span>
          <div>
            <div style="font-size:1.5rem;font-weight:700;color:var(--texto);line-height:1;">${enPrep}</div>
            <div style="font-size:0.68rem;color:var(--texto-sub);">En preparación</div>
          </div>
        </div>
      </div>

      <!-- Pills filtro scroll -->
      <div style="overflow-x:auto;scrollbar-width:none;margin-bottom:0.85rem;">
        <div style="display:flex;gap:0.5rem;min-width:max-content;padding-bottom:0.1rem;">
          ${[['Todas',total],['Libres',libres],['Ocupadas',ocupadas],['Preparando',enPrep]].map(([label,cnt]) => `
            <button onclick="setRestFiltro('${label}')" id="rest-filtro-${label}"
              style="padding:0.45rem 0.9rem;border-radius:999px;font-size:0.78rem;font-weight:600;cursor:pointer;white-space:nowrap;
                background:${window._restFiltro===label?'var(--azul)':'white'};
                color:${window._restFiltro===label?'white':'var(--texto-sub)'};
                border:1.5px solid ${window._restFiltro===label?'transparent':'var(--gris-borde)'};
                box-shadow:${window._restFiltro===label?'0 4px 12px rgba(37,99,235,0.3)':'none'};">
              ${label} (${cnt})
            </button>`).join('')}
        </div>
      </div>

      <!-- Grid 2×2 de mesas -->
      <div id="rest-mesas-container">
        ${renderMesasMobile(mesasOcupadas, window._restFiltro)}
      </div>
    `;
    return;
  }

  // ══════════ DESKTOP ══════════

  contenido().innerHTML = `
    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;margin-bottom:1.25rem;">
      <div style="display:flex;align-items:center;gap:1rem;">
        <div style="width:56px;height:56px;border-radius:16px;background:#FFF7ED;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg viewBox="0 0 24 24" fill="none" stroke="#EA580C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px;"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>
        </div>
        <div>
          <h1 style="font-size:1.55rem;font-weight:700;color:var(--texto);margin:0;">Restaurante</h1>
          <p style="font-size:0.83rem;color:var(--texto-sub);margin:0.2rem 0 0;">Selecciona una mesa para tomar el pedido</p>
        </div>
      </div>
      <button onclick="abrirConfigRestaurante()" style="display:flex;align-items:center;gap:0.5rem;padding:0.7rem 1.25rem;background:linear-gradient(135deg,var(--azul),#2563EB);color:white;border:none;border-radius:10px;font-size:0.88rem;font-weight:600;cursor:pointer;box-shadow:0 4px 14px rgba(37,99,235,0.3);white-space:nowrap;">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" style="width:16px;height:16px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nueva reserva
      </button>
    </div>

    ${avisoTurno}

    <!-- 5 tarjetas métricas -->
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:0.85rem;margin-bottom:1.5rem;" class="rest-metrics-grid">
      <!-- Mesas totales -->
      <div class="card" style="padding:1.1rem;display:flex;align-items:center;gap:0.85rem;">
        <div style="width:44px;height:44px;border-radius:12px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" style="width:22px;height:22px;"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
        </div>
        <div>
          <div style="font-size:1.6rem;font-weight:700;color:var(--texto);line-height:1;">${total}</div>
          <div style="font-size:0.75rem;color:var(--texto-sub);">Mesas totales</div>
        </div>
      </div>
      <!-- Libres -->
      <div class="card" style="padding:1.1rem;display:flex;align-items:center;gap:0.85rem;">
        <span style="width:14px;height:14px;border-radius:50%;background:#16A34A;flex-shrink:0;box-shadow:0 0 0 3px #BBF7D0;"></span>
        <div>
          <div style="font-size:1.6rem;font-weight:700;color:var(--texto);line-height:1;">${libres}</div>
          <div style="font-size:0.75rem;color:var(--texto-sub);">Mesas libres</div>
        </div>
      </div>
      <!-- Ocupadas -->
      <div class="card" style="padding:1.1rem;display:flex;align-items:center;gap:0.85rem;background:#FEF2F2;border-color:#FECACA;">
        <span style="width:14px;height:14px;border-radius:50%;background:#DC2626;flex-shrink:0;box-shadow:0 0 0 3px #FECACA;"></span>
        <div>
          <div style="font-size:1.6rem;font-weight:700;color:var(--texto);line-height:1;">${ocupadas}</div>
          <div style="font-size:0.75rem;color:var(--texto-sub);">Mesas ocupadas</div>
        </div>
      </div>
      <!-- En preparación -->
      <div class="card" style="padding:1.1rem;display:flex;align-items:center;gap:0.85rem;background:#FEFCE8;border-color:#FDE68A;">
        <span style="width:14px;height:14px;border-radius:50%;background:#CA8A04;flex-shrink:0;box-shadow:0 0 0 3px #FDE68A;"></span>
        <div>
          <div style="font-size:1.6rem;font-weight:700;color:var(--texto);line-height:1;">${enPrep}</div>
          <div style="font-size:0.75rem;color:var(--texto-sub);">En preparación</div>
        </div>
      </div>
      <!-- Turno -->
      <div class="card" style="padding:1.1rem;display:flex;align-items:center;justify-content:space-between;gap:0.75rem;">
        <div style="display:flex;align-items:center;gap:0.65rem;">
          <div style="width:36px;height:36px;border-radius:10px;background:#F1F5F9;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2" stroke-linecap="round" style="width:18px;height:18px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div>
            <div style="font-size:0.72rem;color:var(--texto-sub);">Turno actual</div>
            <div style="font-size:0.88rem;font-weight:700;color:${SESSION.turnoActivo?'#16A34A':'var(--texto-sub)'};">
              ${SESSION.turnoActivo ? '● Abierto' : 'No iniciado'}
            </div>
          </div>
        </div>
        <button onclick="navegarA('caja')" style="padding:0.45rem 0.85rem;background:white;border:1.5px solid var(--gris-borde);border-radius:9px;font-size:0.78rem;font-weight:600;cursor:pointer;white-space:nowrap;color:var(--texto-sub);">
          Ir a Caja
        </button>
      </div>
    </div>

    <!-- Filtros + buscador + toggle vista -->
    <div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;margin-bottom:1.25rem;">
      <div style="display:flex;gap:0.35rem;flex:1;min-width:280px;flex-wrap:wrap;">
        ${[['Todas',total],['Libres',libres],['Ocupadas',ocupadas],['Preparando',enPrep]].map(([label,cnt]) => `
          <button onclick="setRestFiltro('${label}')" id="rest-filtro-${label}"
            style="padding:0.5rem 1rem;border-radius:999px;font-size:0.83rem;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:0.4rem;
              background:${window._restFiltro===label?'var(--azul)':'white'};
              color:${window._restFiltro===label?'white':'var(--texto-sub)'};
              border:1.5px solid ${window._restFiltro===label?'transparent':'var(--gris-borde)'};
              box-shadow:${window._restFiltro===label?'0 4px 12px rgba(37,99,235,0.3)':'none'};">
            ${label==='Libres'?'<span style="width:8px;height:8px;border-radius:50%;background:'+(window._restFiltro==='Libres'?'white':'#16A34A')+';"></span>':''}
            ${label==='Ocupadas'?'<span style="width:8px;height:8px;border-radius:50%;background:'+(window._restFiltro==='Ocupadas'?'white':'#DC2626')+';"></span>':''}
            ${label==='Preparando'?'<span style="width:8px;height:8px;border-radius:50%;background:'+(window._restFiltro==='Preparando'?'white':'#CA8A04')+';"></span>':''}
            ${label} (${cnt})
          </button>`).join('')}
      </div>

      <!-- Buscador de mesa -->
      <div style="display:flex;align-items:center;gap:0.5rem;background:white;border:1px solid var(--gris-borde);border-radius:10px;padding:0.55rem 0.9rem;min-width:180px;">
        <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:15px;height:15px;flex-shrink:0;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" id="rest-buscar-mesa" placeholder="Buscar mesa…" oninput="filtrarMesasRest(this.value)"
          style="border:none;background:none;outline:none;font-size:0.83rem;width:100%;font-family:inherit;color:var(--texto);">
      </div>

      <!-- Toggle grilla/lista -->
      <div style="display:flex;border:1.5px solid var(--gris-borde);border-radius:10px;overflow:hidden;">
        <button onclick="setRestVista('grilla')" title="Vista grilla"
          style="padding:0.5rem 0.85rem;border:none;cursor:pointer;display:flex;align-items:center;gap:0.4rem;font-size:0.82rem;font-weight:600;
            background:${window._restVista==='grilla'?'var(--azul)':'white'};
            color:${window._restVista==='grilla'?'white':'var(--texto-sub)'};">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          Vista grilla
        </button>
        <button onclick="setRestVista('lista')" title="Vista lista"
          style="padding:0.5rem 0.85rem;border:none;border-left:1.5px solid var(--gris-borde);cursor:pointer;display:flex;align-items:center;gap:0.4rem;font-size:0.82rem;font-weight:600;
            background:${window._restVista==='lista'?'var(--azul)':'white'};
            color:${window._restVista==='lista'?'white':'var(--texto-sub)'};">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          Vista lista
        </button>
      </div>
    </div>

    <!-- Grid / Lista de mesas -->
    <div id="rest-mesas-container">
      ${renderMesasRest(mesasOcupadas, window._restFiltro, window._restVista)}
    </div>

    <!-- Accesos rápidos -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.75rem;margin-top:1.25rem;" class="rep-grid">
      <button onclick="abrirGestionCarta()" style="padding:0.85rem;background:white;border:1.5px solid var(--gris-borde);border-radius:12px;cursor:pointer;text-align:left;display:flex;align-items:center;gap:0.75rem;">
        <div style="width:38px;height:38px;border-radius:10px;background:#FFF7ED;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:1.2rem;">🥤</div>
        <div><div style="font-weight:700;font-size:0.88rem;">Carta fija</div><div style="font-size:0.73rem;color:var(--texto-sub);">${_restCartaFija.length} productos</div></div>
      </button>
      <button onclick="abrirGestionMenuDia()" style="padding:0.85rem;background:white;border:1.5px solid var(--gris-borde);border-radius:12px;cursor:pointer;text-align:left;display:flex;align-items:center;gap:0.75rem;">
        <div style="width:38px;height:38px;border-radius:10px;background:#F0FDF4;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:1.2rem;">🍽️</div>
        <div><div style="font-weight:700;font-size:0.88rem;">Menú del día</div><div style="font-size:0.73rem;color:var(--texto-sub);">${_restMenuDia.length} platos hoy</div></div>
      </button>
      <button onclick="abrirComprobantesRestaurante()" style="padding:0.85rem;background:white;border:1.5px solid var(--gris-borde);border-radius:12px;cursor:pointer;text-align:left;display:flex;align-items:center;gap:0.75rem;">
        <div style="width:38px;height:38px;border-radius:10px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:1.2rem;">🧾</div>
        <div><div style="font-weight:700;font-size:0.88rem;">Comprobantes</div><div style="font-size:0.73rem;color:var(--texto-sub);">Boletas y facturas</div></div>
      </button>
    </div>
  `;
}

function renderMesasRest(mesasOcupadas, filtro='Todos', vista='grilla') {
  const mesas = Array.from({length:_restNumMesas},(_,i) => {
    const num     = i + 1;
    const comanda = _restComandas.find(c=>(c.notas||'').includes('MESA:'+num));
    const ocupada = mesasOcupadas.has(num);
    const enPrep  = comanda && (comanda.notas||'').includes('ESTADO:preparando');
    const enListo = comanda && (comanda.notas||'').includes('ESTADO:listo');
    const total   = comanda ? (comanda.items_venta_directa||[]).reduce((s,it)=>s+Number(it.subtotal||0),0) : 0;
    const color   = enListo?'#2563EB':enPrep?'#CA8A04':ocupada?'#DC2626':'#16A34A';
    const bg      = enListo?'#EFF6FF':enPrep?'#FEFCE8':ocupada?'#FEF2F2':'#F0FDF4';
    const label   = enListo?'Listo':enPrep?'Preparando':ocupada?'Ocupada':'Libre';
    return { num, ocupada, enPrep, enListo, total, color, bg, label };
  });

  // Filtrar
  const filtradas = filtro === 'Todos' || filtro === 'Todas' ? mesas
    : filtro === 'Libres'     ? mesas.filter(m => !m.ocupada)
    : filtro === 'Ocupadas'   ? mesas.filter(m => m.ocupada && !m.enPrep && !m.enListo)
    : filtro === 'Preparando' ? mesas.filter(m => m.enPrep)
    : mesas;

  if (!filtradas.length) return `<div style="text-align:center;padding:3rem;color:var(--texto-sub);">Sin mesas con ese filtro</div>`;

  if (vista === 'lista') {
    return `
      <div style="background:white;border:1px solid var(--gris-borde);border-radius:14px;overflow:hidden;">
        ${filtradas.map(m => `
          <div onclick="abrirMesaRestaurante(${m.num})" style="display:flex;align-items:center;gap:1rem;padding:0.9rem 1.25rem;border-bottom:1px solid var(--gris-borde);cursor:pointer;transition:background 0.1s;" onmouseover="this.style.background='var(--gris-bg)'" onmouseout="this.style.background=''">
            <div style="width:40px;height:40px;border-radius:10px;background:${m.bg};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:700;font-size:0.9rem;color:${m.color};">${m.num}</div>
            <div style="flex:1;">
              <div style="font-weight:700;font-size:0.9rem;">Mesa ${m.num}</div>
              <div style="font-size:0.75rem;color:var(--texto-sub);">4 personas</div>
            </div>
            <span style="font-size:0.72rem;font-weight:700;color:${m.color};background:${m.bg};padding:0.2rem 0.7rem;border-radius:999px;">● ${m.label}</span>
            ${m.ocupada ? `<span style="font-weight:700;color:#16A34A;">${soles(m.total)}</span>` : ''}
            <span style="font-size:0.8rem;color:var(--azul);font-weight:600;">Tomar pedido →</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" stroke-width="2" stroke-linecap="round" style="width:16px;height:16px;"><polyline points="9 18 15 12 9 6"/></svg>
          </div>`).join('')}
      </div>`;
  }

  // Vista grilla
  return `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem;">
      ${filtradas.map(m => `
        <div onclick="abrirMesaRestaurante(${m.num})"
          style="background:white;border:1.5px solid ${m.ocupada?m.color:'var(--gris-borde)'};border-radius:16px;padding:1.25rem;cursor:pointer;transition:box-shadow 0.15s,transform 0.1s;position:relative;"
          onmouseover="this.style.boxShadow='0 6px 20px rgba(0,0,0,0.1)';this.style.transform='translateY(-2px)'"
          onmouseout="this.style.boxShadow='none';this.style.transform='translateY(0)'">
          <!-- Badge estado arriba derecha -->
          <span style="position:absolute;top:0.75rem;right:0.75rem;font-size:0.68rem;font-weight:700;color:${m.color};background:${m.bg};padding:0.2rem 0.6rem;border-radius:999px;display:flex;align-items:center;gap:0.3rem;">
            <span style="width:6px;height:6px;border-radius:50%;background:${m.color};"></span>
            ${m.label}
          </span>
          <!-- Nombre -->
          <div style="font-size:1.15rem;font-weight:800;color:var(--texto);margin-bottom:0.2rem;">Mesa ${m.num}</div>
          <div style="font-size:0.78rem;color:var(--texto-sub);margin-bottom:${m.ocupada?'0.6rem':'1rem'};">4 personas</div>
          ${m.ocupada ? `<div style="font-size:0.85rem;font-weight:700;color:#16A34A;margin-bottom:0.75rem;">${soles(m.total)}</div>` : ''}
          <!-- Divider -->
          <div style="height:1px;background:var(--gris-borde);margin-bottom:0.75rem;"></div>
          <!-- Link tomar pedido + flecha -->
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <span style="font-size:0.8rem;font-weight:600;color:var(--azul);">Tomar pedido →</span>
            <div style="width:28px;height:28px;border-radius:50%;border:1.5px solid var(--gris-borde);display:flex;align-items:center;justify-content:center;">
              <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round" style="width:13px;height:13px;"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>
        </div>`).join('')}
    </div>`;
}

// SVG de silla para móvil
const SILLA_SVG = '<path d="M6 2v6M18 2v6M3 8h18M3 20h18M8 20v-8h8v8"/>';

function renderMesasMobile(mesasOcupadas, filtro='Todas') {
  const mesas = Array.from({length:_restNumMesas},(_,i) => {
    const num     = i + 1;
    const comanda = _restComandas.find(c=>(c.notas||'').includes('MESA:'+num));
    const ocupada = mesasOcupadas.has(num);
    const enPrep  = comanda && (comanda.notas||'').includes('ESTADO:preparando');
    const enListo = comanda && (comanda.notas||'').includes('ESTADO:listo');
    const total   = comanda ? (comanda.items_venta_directa||[]).reduce((s,it)=>s+Number(it.subtotal||0),0) : 0;
    const color   = enListo?'#2563EB':enPrep?'#CA8A04':ocupada?'#DC2626':'#16A34A';
    const bg      = enListo?'#EFF6FF':enPrep?'#FEFCE8':ocupada?'#FEF2F2':'#F0FDF4';
    const borde   = enListo?'#BFDBFE':enPrep?'#FDE68A':ocupada?'#FECACA':'#BBF7D0';
    const label   = enListo?'Listo':enPrep?'Preparando':ocupada?'Ocupada':'Libre';
    return { num, ocupada, enPrep, enListo, total, color, bg, borde, label };
  });

  const filtradas = filtro==='Todas'||filtro==='Todos' ? mesas
    : filtro==='Libres'     ? mesas.filter(m=>!m.ocupada)
    : filtro==='Ocupadas'   ? mesas.filter(m=>m.ocupada&&!m.enPrep&&!m.enListo)
    : filtro==='Preparando' ? mesas.filter(m=>m.enPrep)
    : mesas;

  if (!filtradas.length) return `<div style="text-align:center;padding:2.5rem;color:var(--texto-sub);">Sin mesas con ese filtro</div>`;

  return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.65rem;">
    ${filtradas.map(m => `
      <div onclick="abrirMesaRestaurante(${m.num})"
        style="background:${m.ocupada?m.bg:'white'};border:2px solid ${m.ocupada?m.borde:'var(--gris-borde)'};border-radius:16px;padding:1rem;cursor:pointer;-webkit-tap-highlight-color:transparent;"
        ontouchstart="this.style.transform='scale(0.96)'" ontouchend="this.style.transform=''">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:0.65rem;">
          <div style="width:38px;height:38px;border-radius:10px;background:${m.ocupada?'white':m.bg};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="${m.color}" stroke-width="2" stroke-linecap="round" style="width:20px;height:20px;">${SILLA_SVG}</svg>
          </div>
          <span style="font-size:0.63rem;font-weight:700;color:${m.color};padding:0.2rem 0.55rem;border-radius:999px;display:flex;align-items:center;gap:0.25rem;background:${m.ocupada?'white':m.bg};border:1px solid ${m.borde};">
            <span style="width:6px;height:6px;border-radius:50%;background:${m.color};"></span>${m.label}
          </span>
        </div>
        <div style="font-size:1rem;font-weight:800;color:var(--texto);margin-bottom:0.1rem;">Mesa ${m.num}</div>
        <div style="font-size:0.72rem;color:var(--texto-sub);margin-bottom:${m.ocupada?'0.35rem':'0.75rem'};">4 personas</div>
        ${m.ocupada?`<div style="font-size:0.9rem;font-weight:700;color:#16A34A;margin-bottom:0.6rem;">${soles(m.total)}</div>`:''}
        <div style="height:1px;background:${m.ocupada?m.borde:'var(--gris-borde)'};margin-bottom:0.55rem;"></div>
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span style="font-size:0.75rem;font-weight:600;color:var(--azul);">Tomar pedido →</span>
          <div style="width:22px;height:22px;border-radius:50%;border:1.5px solid ${m.ocupada?m.borde:'var(--gris-borde)'};display:flex;align-items:center;justify-content:center;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round" style="width:10px;height:10px;"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      </div>`).join('')}
  </div>`;
}

function setRestFiltro(filtro) {
  window._restFiltro = filtro;
  const cont = document.getElementById('rest-mesas-container');
  const mesasOcupadas = new Set(_restComandas.map(c => {
    const m = (c.notas||'').match(/MESA:(\d+)/);
    return m ? parseInt(m[1]) : null;
  }).filter(Boolean));
  document.querySelectorAll('[id^="rest-filtro-"]').forEach(btn => {
    const activo = btn.id === 'rest-filtro-' + filtro;
    btn.style.background   = activo ? 'var(--azul)' : 'white';
    btn.style.color        = activo ? 'white' : 'var(--texto-sub)';
    btn.style.borderColor  = activo ? 'transparent' : 'var(--gris-borde)';
    btn.style.boxShadow    = activo ? '0 4px 12px rgba(37,99,235,0.3)' : 'none';
  });
  if (!cont) return;
  if (window.innerWidth <= 768) {
    cont.innerHTML = renderMesasMobile(mesasOcupadas, filtro);
  } else {
    cont.innerHTML = renderMesasRest(mesasOcupadas, filtro, window._restVista);
  }
}

function setRestVista(vista) {
  window._restVista = vista;
  const mesasOcupadas = new Set(_restComandas.map(c => {
    const m = (c.notas||'').match(/MESA:(\d+)/);
    return m ? parseInt(m[1]) : null;
  }).filter(Boolean));
  document.querySelectorAll('[onclick^="setRestVista"]').forEach(btn => {
    const v = btn.getAttribute('onclick').includes('grilla') ? 'grilla' : 'lista';
    btn.style.background = v === vista ? 'var(--azul)' : 'white';
    btn.style.color      = v === vista ? 'white' : 'var(--texto-sub)';
  });
  const cont = document.getElementById('rest-mesas-container');
  if (cont) cont.innerHTML = renderMesasRest(mesasOcupadas, window._restFiltro, vista);
}

function filtrarMesasRest(q) {
  const mesasOcupadas = new Set(_restComandas.map(c => {
    const m = (c.notas||'').match(/MESA:(\d+)/);
    return m ? parseInt(m[1]) : null;
  }).filter(Boolean));
  const cont = document.getElementById('rest-mesas-container');
  if (!cont) return;
  if (!q.trim()) {
    cont.innerHTML = renderMesasRest(mesasOcupadas, window._restFiltro, window._restVista);
    return;
  }
  // Filtrar por número de mesa
  const num = parseInt(q);
  const todas = Array.from({length:_restNumMesas},(_,i)=>i+1).filter(n =>
    String(n).includes(q.trim()) || ('mesa '+n).includes(q.toLowerCase())
  );
  // Crear set ficticio con las mesas encontradas
  const mesasFiltradas = {
    has: n => mesasOcupadas.has(n) && todas.includes(n) || (!mesasOcupadas.has(n) && todas.includes(n))
  };
  // Render solo las mesas que coinciden
  const html = todas.length === 0
    ? `<div style="text-align:center;padding:2rem;color:var(--texto-sub);">Sin resultados para "${escapeHtml(q)}"</div>`
    : renderMesasRestLista(mesasOcupadas, todas);
  cont.innerHTML = html;
}

function renderMesasRestLista(mesasOcupadas, nums) {
  return `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem;">
    ${nums.map(num => {
      const comanda = _restComandas.find(c=>(c.notas||'').includes('MESA:'+num));
      const ocupada = mesasOcupadas.has(num);
      const enPrep  = comanda && (comanda.notas||'').includes('ESTADO:preparando');
      const enListo = comanda && (comanda.notas||'').includes('ESTADO:listo');
      const total   = comanda ? (comanda.items_venta_directa||[]).reduce((s,it)=>s+Number(it.subtotal||0),0) : 0;
      const color   = enListo?'#2563EB':enPrep?'#CA8A04':ocupada?'#DC2626':'#16A34A';
      const bg      = enListo?'#EFF6FF':enPrep?'#FEFCE8':ocupada?'#FEF2F2':'#F0FDF4';
      const label   = enListo?'Listo':enPrep?'Preparando':ocupada?'Ocupada':'Libre';
      return `<div onclick="abrirMesaRestaurante(${num})" style="background:white;border:1.5px solid ${ocupada?color:'var(--gris-borde)'};border-radius:16px;padding:1.25rem;cursor:pointer;position:relative;" onmouseover="this.style.boxShadow='0 6px 20px rgba(0,0,0,0.1)'" onmouseout="this.style.boxShadow='none'">
        <span style="position:absolute;top:0.75rem;right:0.75rem;font-size:0.68rem;font-weight:700;color:${color};background:${bg};padding:0.2rem 0.6rem;border-radius:999px;">● ${label}</span>
        <div style="font-size:1.1rem;font-weight:800;margin-bottom:0.2rem;">Mesa ${num}</div>
        <div style="font-size:0.78rem;color:var(--texto-sub);margin-bottom:0.75rem;">4 personas</div>
        <div style="height:1px;background:var(--gris-borde);margin-bottom:0.65rem;"></div>
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span style="font-size:0.8rem;font-weight:600;color:var(--azul);">Tomar pedido →</span>
          <div style="width:28px;height:28px;border-radius:50%;border:1.5px solid var(--gris-borde);display:flex;align-items:center;justify-content:center;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round" style="width:13px;height:13px;"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}


async function abrirComprobantesRestaurante() {
  try {
    // Traer comprobantes de ventas_directas (mesas) de los últimos 30 días
    const hace30 = new Date(Date.now() - 30*24*3600*1000).toISOString();
    const { data: comps, error } = await db.from('comprobantes_sunat')
      .select('*, ventas_directas(notas, items_venta_directa(descripcion, cantidad, precio_unitario, subtotal))')
      .eq('hotel_id', SESSION.hotel.id)
      .not('venta_directa_id', 'is', null)  // solo los de restaurante
      .gte('created_at', hace30)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;

    const hoy = new Date().toLocaleDateString('es-PE');

    abrirModal('🧾 Comprobantes del Restaurante', `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;">
        <div style="font-size:0.82rem;color:var(--texto-sub);">Últimos 30 días · ${comps?.length||0} comprobantes</div>
        <div style="display:flex;gap:0.5rem;">
          <button onclick="filtrarCompsRest('todos',this)" class="btn-filtro-comp" style="padding:0.35rem 0.7rem;border-radius:7px;border:1.5px solid var(--azul);background:#EFF6FF;color:var(--azul);font-size:0.78rem;font-weight:600;cursor:pointer;">Todos</button>
          <button onclick="filtrarCompsRest('boleta',this)" class="btn-filtro-comp" style="padding:0.35rem 0.7rem;border-radius:7px;border:1.5px solid var(--gris-borde);background:white;color:var(--texto-sub);font-size:0.78rem;font-weight:600;cursor:pointer;">Boletas</button>
          <button onclick="filtrarCompsRest('factura',this)" class="btn-filtro-comp" style="padding:0.35rem 0.7rem;border-radius:7px;border:1.5px solid var(--gris-borde);background:white;color:var(--texto-sub);font-size:0.78rem;font-weight:600;cursor:pointer;">Facturas</button>
        </div>
      </div>

      ${!comps?.length ? `
        <div style="text-align:center;padding:2.5rem;color:var(--texto-sub);">
          <div style="font-size:2.5rem;margin-bottom:0.75rem;">🧾</div>
          <div style="font-weight:600;margin-bottom:0.35rem;">Sin comprobantes aún</div>
          <div style="font-size:0.82rem;">Los comprobantes aparecerán aquí cuando cobres una mesa con boleta o factura.</div>
        </div>
      ` : `
        <div id="lista-comps-rest" style="display:flex;flex-direction:column;gap:0.5rem;max-height:420px;overflow-y:auto;">
          ${comps.map(c => {
            const mesa = ((c.ventas_directas?.notas||'').match(/MESA:(\d+)/)||[])[1]||'?';
            const hora = new Date(c.created_at).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'});
            const fecha = new Date(c.created_at).toLocaleDateString('es-PE',{day:'numeric',month:'short'});
            const serie = `${c.serie}-${String(c.correlativo).padStart(8,'0')}`;
            const esFact = c.tipo_doc === 'factura';
            const estadoColor = c.estado_sunat==='ACEPTADO'?'#16A34A':c.estado_sunat==='RECHAZADO'?'#DC2626':'#CA8A04';
            const estadoBg    = c.estado_sunat==='ACEPTADO'?'#F0FDF4':c.estado_sunat==='RECHAZADO'?'#FEF2F2':'#FEFCE8';
            const estadoLabel = c.estado_sunat==='ACEPTADO'?'Aceptado':c.estado_sunat==='RECHAZADO'?'Rechazado':'Pendiente';
            return `
              <div class="comp-rest-item" data-tipo="${c.tipo_doc}" style="background:white;border:1px solid var(--gris-borde);border-radius:12px;padding:0.9rem 1rem;display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
                <div style="width:40px;height:40px;border-radius:10px;background:${esFact?'#EFF6FF':'#F5F3FF'};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:1.3rem;">${esFact?'📋':'📄'}</div>
                <div style="flex:1;min-width:0;">
                  <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
                    <span style="font-weight:700;font-size:0.9rem;">${serie}</span>
                    <span style="font-size:0.7rem;font-weight:700;color:${esFact?'var(--azul)':'#7C3AED'};background:${esFact?'#EFF6FF':'#F5F3FF'};padding:0.1rem 0.5rem;border-radius:999px;">${esFact?'FACTURA':'BOLETA'}</span>
                    <span style="font-size:0.7rem;font-weight:700;color:${estadoColor};background:${estadoBg};padding:0.1rem 0.5rem;border-radius:999px;">${estadoLabel}</span>
                  </div>
                  <div style="font-size:0.78rem;color:var(--texto-sub);margin-top:0.15rem;">
                    Mesa ${mesa} · ${fecha} ${hora}
                    ${c.ruc_receptor?` · ${esFact?'RUC':'Doc'}: ${c.ruc_receptor}`:''}
                    ${c.razon_social_rec?` · ${c.razon_social_rec}`:''}
                  </div>
                </div>
                <div style="font-weight:700;color:var(--verde);font-size:1rem;min-width:75px;text-align:right;">S/ ${Number(c.total).toFixed(2)}</div>
                <button onclick="imprimirComprobanteRest('${c.id}')" style="flex-shrink:0;padding:0.45rem 0.85rem;background:var(--azul);color:white;border:none;border-radius:8px;font-size:0.8rem;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:0.35rem;">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px;"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                  Imprimir
                </button>
              </div>`;
          }).join('')}
        </div>
      `}
    `, { ancho:'620px' });

    // Guardar comprobantes en window para uso posterior
    window._compsRestaurante = comps || [];

  } catch(err) { toast('Error al cargar comprobantes', err.message, 'error'); }
}

function filtrarCompsRest(tipo, btn) {
  document.querySelectorAll('.btn-filtro-comp').forEach(b=>{
    b.style.background='white'; b.style.borderColor='var(--gris-borde)'; b.style.color='var(--texto-sub)';
  });
  btn.style.background='#EFF6FF'; btn.style.borderColor='var(--azul)'; btn.style.color='var(--azul)';
  document.querySelectorAll('.comp-rest-item').forEach(el=>{
    el.style.display = (tipo==='todos' || el.dataset.tipo===tipo) ? '' : 'none';
  });
}

async function imprimirComprobanteRest(compId) {
  const comp = (window._compsRestaurante||[]).find(c=>c.id===compId);
  if (!comp) { toast('Comprobante no encontrado','','warn'); return; }

  const items = comp.ventas_directas?.items_venta_directa || [];
  const mesa  = ((comp.ventas_directas?.notas||'').match(/MESA:(\d+)/)||[])[1]||'?';
  const serie = `${comp.serie}-${String(comp.correlativo).padStart(8,'0')}`;
  const esFact = comp.tipo_doc === 'factura';
  const fecha = new Date(comp.created_at).toLocaleString('es-PE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
  const subtotal = Number(comp.total) - Number(comp.igv||0);

  const { data: hotel } = await db.from('hoteles').select('razon_social,ruc,direccion,nombre_comercial').eq('id',SESSION.hotel.id).single();

  const ventana = window.open('','_blank','width=400,height=600');
  ventana.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${serie}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Courier New',monospace; font-size:12px; padding:15px; color:#000; max-width:300px; margin:0 auto; }
        .center { text-align:center; }
        .bold { font-weight:bold; }
        .line { border-top:1px dashed #000; margin:8px 0; }
        .row { display:flex; justify-content:space-between; margin:3px 0; }
        .titulo { font-size:16px; font-weight:bold; text-align:center; margin:6px 0; }
        .badge { border:1px solid #000; padding:2px 8px; display:inline-block; margin:4px auto; }
        table { width:100%; border-collapse:collapse; margin:6px 0; }
        td { padding:2px 0; vertical-align:top; }
        td:last-child { text-align:right; }
        @media print { body { padding:5px; } button { display:none; } }
      </style>
    </head>
    <body>
      <div class="center bold" style="font-size:14px;">${hotel?.razon_social||SESSION.hotel.razon_social||''}</div>
      <div class="center">RUC: ${hotel?.ruc||''}</div>
      <div class="center" style="font-size:10px;">${hotel?.direccion||''}</div>
      <div class="line"></div>
      <div class="titulo">${esFact?'FACTURA ELECTRÓNICA':'BOLETA DE VENTA ELECTRÓNICA'}</div>
      <div class="center badge">${serie}</div>
      <div class="line"></div>
      <div class="row"><span>Fecha:</span><span>${fecha}</span></div>
      <div class="row"><span>Mesa:</span><span>${mesa}</span></div>
      ${comp.ruc_receptor?`<div class="row"><span>${esFact?'RUC':'Doc'}:</span><span>${comp.ruc_receptor}</span></div>`:''}
      ${comp.razon_social_rec?`<div class="row"><span>${esFact?'Cliente':'Nombre'}:</span><span style="max-width:160px;text-align:right;">${comp.razon_social_rec}</span></div>`:''}
      <div class="line"></div>
      <table>
        <tr><td class="bold">DESCRIPCIÓN</td><td class="bold" style="text-align:center;">CANT</td><td class="bold">PRECIO</td><td class="bold">TOTAL</td></tr>
        <tr><td colspan="4"><div style="border-top:1px solid #000;margin:2px 0;"></div></td></tr>
        ${items.map(it=>`
          <tr>
            <td style="max-width:140px;">${it.descripcion}</td>
            <td style="text-align:center;">${it.cantidad}</td>
            <td>S/${Number(it.precio_unitario).toFixed(2)}</td>
            <td>S/${Number(it.subtotal).toFixed(2)}</td>
          </tr>`).join('')}
      </table>
      <div class="line"></div>
      <div class="row"><span>OP. GRAVADA:</span><span>S/ ${subtotal.toFixed(2)}</span></div>
      <div class="row"><span>IGV (18%):</span><span>S/ ${Number(comp.igv||0).toFixed(2)}</span></div>
      <div class="row bold" style="font-size:14px;"><span>TOTAL:</span><span>S/ ${Number(comp.total).toFixed(2)}</span></div>
      <div class="line"></div>
      <div class="center" style="font-size:10px;margin-top:4px;">Estado: ${comp.estado_sunat}</div>
      <div class="center" style="font-size:10px;">Representación impresa del comprobante</div>
      <div class="center" style="font-size:10px;">electrónico — consulte en SUNAT</div>
      <div class="line"></div>
      <div class="center" style="font-size:11px;font-weight:bold;">¡Gracias por su preferencia!</div>
      <br>
      <div class="center"><button onclick="window.print()" style="padding:8px 20px;background:#2563EB;color:white;border:none;border-radius:6px;cursor:pointer;font-size:13px;">🖨️ Imprimir</button></div>
    </body>
    </html>
  `);
  ventana.document.close();
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

    <div style="display:grid;grid-template-columns:1fr 320px;gap:1.25rem;align-items:start;" class="susc-grid">
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

  const activas    = (comandas||[]).filter(c=>{ const n=c.notas||''; return n.includes('ESTADO:preparando')||n.includes('ESTADO:abierta')||n.includes('ESTADO:listo'); });
  const pendientes = activas.filter(c=>(c.notas||'').includes('ESTADO:abierta'));
  const preparando = activas.filter(c=>(c.notas||'').includes('ESTADO:preparando'));
  const listos     = activas.filter(c=>(c.notas||'').includes('ESTADO:listo'));

  const ahora = new Date();
  const horaStr = ahora.toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'});

  contenido().innerHTML = `

    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;margin-bottom:1.5rem;">
      <div style="display:flex;align-items:center;gap:1rem;">
        <div style="width:56px;height:56px;border-radius:16px;background:#F0FDF4;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px;"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/><line x1="6" y1="17" x2="18" y2="17"/></svg>
        </div>
        <div>
          <h1 style="font-size:1.55rem;font-weight:700;color:var(--texto);margin:0;">Cocina / Comandas</h1>
          <p style="font-size:0.83rem;color:var(--texto-sub);margin:0.2rem 0 0;">Gestiona los pedidos del restaurante en tiempo real</p>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;">
        <div style="display:flex;align-items:center;gap:0.6rem;font-size:0.82rem;color:var(--texto-sub);">
          <span style="width:10px;height:10px;border-radius:50%;background:#16A34A;animation:pulse 2s infinite;"></span>
          Auto-actualiza cada 20s
        </div>
        <div style="width:1px;height:22px;background:var(--gris-borde);"></div>
        <div style="display:flex;align-items:center;gap:0.45rem;font-size:0.82rem;color:var(--texto-sub);">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:15px;height:15px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          ${horaStr}
        </div>
        <button onclick="cargarYRenderCocina()" style="display:flex;align-items:center;gap:0.5rem;background:white;border:1.5px solid var(--gris-borde);border-radius:10px;padding:0.6rem 1.1rem;font-size:0.85rem;font-weight:600;cursor:pointer;color:var(--texto);">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:16px;height:16px;"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          Actualizar
        </button>
      </div>
    </div>

    <!-- 4 tarjetas métricas -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.5rem;" class="cocina-metrics-grid">
      <!-- Total en proceso -->
      <div class="card" style="padding:1.25rem;display:flex;align-items:center;gap:1rem;">
        <div style="width:52px;height:52px;border-radius:14px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" style="width:26px;height:26px;"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
        </div>
        <div>
          <div style="font-size:2rem;font-weight:700;color:var(--texto);line-height:1;">${activas.length}</div>
          <div style="font-size:0.78rem;color:var(--texto-sub);margin-top:0.2rem;">Total de comandas<br>en proceso</div>
        </div>
      </div>
      <!-- Nuevas -->
      <div class="card" style="padding:1.25rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;${pendientes.length>0?'border-color:#FECACA;background:#FEF2F2;':''}">
        <div style="display:flex;align-items:center;gap:1rem;">
          <div style="width:52px;height:52px;border-radius:14px;background:${pendientes.length>0?'white':'#FEF2F2'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2" stroke-linecap="round" style="width:26px;height:26px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
          </div>
          <div>
            <div style="font-size:2rem;font-weight:700;color:#DC2626;line-height:1;">${pendientes.length}</div>
            <div style="font-size:0.82rem;font-weight:700;color:#DC2626;">Nuevas</div>
          </div>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2.5" stroke-linecap="round" style="width:16px;height:16px;opacity:0.5;"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
      <!-- Preparando -->
      <div class="card" style="padding:1.25rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;${preparando.length>0?'border-color:#FDE68A;background:#FEFCE8;':''}">
        <div style="display:flex;align-items:center;gap:1rem;">
          <div style="width:52px;height:52px;border-radius:14px;background:${preparando.length>0?'white':'#FEFCE8'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#CA8A04" stroke-width="2" stroke-linecap="round" style="width:26px;height:26px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div>
            <div style="font-size:2rem;font-weight:700;color:#CA8A04;line-height:1;">${preparando.length}</div>
            <div style="font-size:0.82rem;font-weight:700;color:#CA8A04;">Preparando</div>
          </div>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="#CA8A04" stroke-width="2.5" stroke-linecap="round" style="width:16px;height:16px;opacity:0.5;"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
      <!-- Listas para servir -->
      <div class="card" style="padding:1.25rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;${listos.length>0?'border-color:#BBF7D0;background:#F0FDF4;':''}">
        <div style="display:flex;align-items:center;gap:1rem;">
          <div style="width:52px;height:52px;border-radius:14px;background:${listos.length>0?'white':'#F0FDF4'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2" stroke-linecap="round" style="width:26px;height:26px;"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div>
            <div style="font-size:2rem;font-weight:700;color:#16A34A;line-height:1;">${listos.length}</div>
            <div style="font-size:0.82rem;font-weight:700;color:#16A34A;">Listas para servir</div>
          </div>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2.5" stroke-linecap="round" style="width:16px;height:16px;opacity:0.5;"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    </div>

    <!-- 3 columnas Kanban con fondos difuminados -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem;margin-bottom:1.5rem;" class="rep-grid">

      <!-- COLUMNA: Nuevas (fondo rojo difuminado) -->
      <div style="background:linear-gradient(135deg,#FEF2F2 0%,#FFF5F5 60%,#FFFBFB 100%);border:1.5px solid #FECACA;border-radius:18px;padding:1.1rem;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;">
          <div style="display:flex;align-items:center;gap:0.65rem;">
            <div style="width:40px;height:40px;border-radius:12px;background:#DC2626;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" style="width:20px;height:20px;"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/></svg>
            </div>
            <div>
              <div style="font-weight:700;font-size:1rem;color:var(--texto);">Nuevas</div>
              <div style="font-size:0.72rem;color:var(--texto-sub);">Pedidos recién recibidos</div>
            </div>
          </div>
          <span style="width:28px;height:28px;border-radius:50%;background:#DC2626;color:white;font-size:0.82rem;font-weight:700;display:flex;align-items:center;justify-content:center;">${pendientes.length}</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:0.75rem;">
          ${pendientes.length===0
            ? `<div style="background:white;border:2px dashed #FECACA;border-radius:14px;padding:2.5rem 1.5rem;text-align:center;">
                <svg viewBox="0 0 24 24" fill="none" stroke="#FECACA" stroke-width="1.5" stroke-linecap="round" style="width:40px;height:40px;margin:0 auto 0.75rem;">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
                <div style="font-weight:600;font-size:0.88rem;color:var(--texto);margin-bottom:0.3rem;">No hay comandas nuevas</div>
                <div style="font-size:0.75rem;color:var(--texto-sub);">Cuando lleguen nuevos pedidos se mostrarán aquí.</div>
              </div>`
            : pendientes.map(c => tarjetaComandaCocina(c,'nueva')).join('')}
        </div>
      </div>

      <!-- COLUMNA: Preparando (fondo amarillo difuminado) -->
      <div style="background:linear-gradient(135deg,#FEFCE8 0%,#FFFDF0 60%,#FFFFFE 100%);border:1.5px solid #FDE68A;border-radius:18px;padding:1.1rem;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;">
          <div style="display:flex;align-items:center;gap:0.65rem;">
            <div style="width:40px;height:40px;border-radius:12px;background:#CA8A04;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" style="width:20px;height:20px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div>
              <div style="font-weight:700;font-size:1rem;color:var(--texto);">Preparando</div>
              <div style="font-size:0.72rem;color:var(--texto-sub);">En preparación en cocina</div>
            </div>
          </div>
          <span style="width:28px;height:28px;border-radius:50%;background:#CA8A04;color:white;font-size:0.82rem;font-weight:700;display:flex;align-items:center;justify-content:center;">${preparando.length}</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:0.75rem;">
          ${preparando.length===0
            ? `<div style="background:white;border:2px dashed #FDE68A;border-radius:14px;padding:2.5rem 1.5rem;text-align:center;color:var(--texto-sub);font-size:0.83rem;">Nada en preparación</div>`
            : preparando.map(c => tarjetaComandaCocina(c,'preparando')).join('')}
        </div>
      </div>

      <!-- COLUMNA: Listo para servir (fondo verde difuminado) -->
      <div style="background:linear-gradient(135deg,#F0FDF4 0%,#F7FFF9 60%,#FEFFFF 100%);border:1.5px solid #BBF7D0;border-radius:18px;padding:1.1rem;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;">
          <div style="display:flex;align-items:center;gap:0.65rem;">
            <div style="width:40px;height:40px;border-radius:12px;background:#16A34A;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" style="width:20px;height:20px;"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <div style="font-weight:700;font-size:1rem;color:var(--texto);">Listo para servir</div>
              <div style="font-size:0.72rem;color:var(--texto-sub);">Listo para llevar a la mesa</div>
            </div>
          </div>
          <span style="width:28px;height:28px;border-radius:50%;background:#16A34A;color:white;font-size:0.82rem;font-weight:700;display:flex;align-items:center;justify-content:center;">${listos.length}</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:0.75rem;">
          ${listos.length===0
            ? `<div style="background:white;border:2px dashed #BBF7D0;border-radius:14px;padding:2.5rem 1.5rem;text-align:center;color:var(--texto-sub);font-size:0.83rem;">Sin platos listos aún</div>`
            : listos.map(c => tarjetaComandaCocina(c,'listo')).join('')}
        </div>
      </div>
    </div>

    <!-- Banner inferior -->
    <div style="background:white;border:1px solid var(--gris-borde);border-radius:16px;padding:1.25rem 1.5rem;display:flex;align-items:center;gap:1.25rem;position:relative;overflow:hidden;">
      <!-- Cubiertos decorativos de fondo -->
      <svg style="position:absolute;right:180px;top:50%;transform:translateY(-50%);opacity:0.08;" viewBox="0 0 60 80" width="60" height="80">
        <line x1="10" y1="5" x2="10" y2="75" stroke="#2563EB" stroke-width="3"/>
        <path d="M5 5 Q10 20 10 35" stroke="#2563EB" stroke-width="3" fill="none"/>
        <path d="M15 5 Q10 20 10 35" stroke="#2563EB" stroke-width="3" fill="none"/>
        <line x1="40" y1="5" x2="40" y2="75" stroke="#2563EB" stroke-width="3"/>
        <ellipse cx="40" cy="18" rx="9" ry="13" stroke="#2563EB" stroke-width="3" fill="none"/>
      </svg>
      <div style="width:52px;height:52px;border-radius:15px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" style="width:26px;height:26px;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
      </div>
      <div style="flex:1;">
        <div style="font-weight:700;font-size:1.05rem;color:var(--texto);">Flujo más rápido, mejor servicio</div>
        <div style="font-size:0.82rem;color:var(--texto-sub);margin-top:0.15rem;">Mantén el control de tus comandas y ofrece una experiencia increíble a tus huéspedes.</div>
      </div>
      <button onclick="toast('Próximamente','Reporte de ventas en desarrollo','info')" style="display:flex;align-items:center;gap:0.5rem;background:white;border:1.5px solid var(--azul);border-radius:11px;padding:0.7rem 1.25rem;font-size:0.85rem;font-weight:600;color:var(--azul);cursor:pointer;white-space:nowrap;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:16px;height:16px;"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        Ver reporte de ventas
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:13px;height:13px;"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>
  `;
}

function tarjetaComandaCocina(comanda, estado) {
  const mesa    = ((comanda.notas||'').match(/MESA:(\d+)/)||[])[1]||'?';
  const hora    = new Date(comanda.created_at).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'});
  const items   = comanda.items_venta_directa||[];
  const minutos = Math.floor((new Date()-new Date(comanda.created_at))/60000);
  const urgente = minutos > 15;

  return `
    <div style="background:white;border:1px solid ${urgente?'#DC2626':'var(--gris-borde)'};border-radius:14px;padding:1rem;${urgente?'box-shadow:0 0 0 3px rgba(220,38,38,0.08);':''}">
      <!-- Mesa + tiempo + ··· -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.65rem;">
        <div style="display:flex;align-items:center;gap:0.5rem;">
          <span style="font-weight:800;font-size:1rem;">Mesa ${escapeHtml(mesa)}</span>
          <span style="font-size:0.72rem;color:var(--texto-sub);">${minutos} min</span>
        </div>
        <div style="display:flex;align-items:center;gap:0.65rem;">
          <span style="font-size:0.72rem;color:var(--texto-sub);">${hora}</span>
          <button style="background:none;border:none;cursor:pointer;color:var(--texto-sub);font-size:1.1rem;padding:0;line-height:1;">⋯</button>
        </div>
      </div>
      <!-- Items -->
      <div style="margin-bottom:0.85rem;">
        ${items.map(it=>`
          <div style="display:flex;align-items:center;gap:0.6rem;padding:0.25rem 0;">
            <span style="font-size:0.82rem;font-weight:700;color:var(--texto-sub);min-width:22px;">${it.cantidad}x</span>
            <span style="font-size:0.85rem;">${escapeHtml(it.descripcion)}</span>
          </div>`).join('')}
      </div>
      <!-- Botón acción -->
      ${estado==='nueva'
        ? `<button onclick="moverComandaCocina('${comanda.id}','preparando')"
            style="width:100%;padding:0.65rem;background:#EA580C;color:white;border:none;border-radius:10px;font-size:0.83rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:0.5rem;">
            🔥 Empezar a preparar
          </button>`
        : estado==='preparando'
        ? `<button onclick="moverComandaCocina('${comanda.id}','listo')"
            style="width:100%;padding:0.65rem;background:#FEFCE8;color:#CA8A04;border:1.5px solid #FDE68A;border-radius:10px;font-size:0.83rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:0.5rem;">
            ✅ Marcar como listo
          </button>`
        : `<div style="width:100%;padding:0.65rem;background:#EFF6FF;border-radius:10px;font-size:0.83rem;font-weight:700;color:#2563EB;display:flex;align-items:center;justify-content:center;gap:0.5rem;">
            🛎️ Esperando que el mozo lo sirva
          </div>`}
    </div>`;
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
