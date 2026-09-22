// ============================================================
// HospedaYa — facturacionSunat.js
// Motor de emisión: FacturaLibre (Plan Distribuidores)
// Identidad DNI/RUC: Migo vía RPC centralizada (SuperAdmin)
// ============================================================

// ════════════════════════════════════════════════════════════
//  CONFIG DINÁMICA — se carga desde BD al iniciar módulo
// ════════════════════════════════════════════════════════════
const API_SUNAT = {
  activa:       false,
  proveedor:    'facturalibre',
  endpoint:     'https://facturalibre.net/api/v1',
  token:        '',        // Token distribuidor FacturaLibre
  empresa_id:   '',        // ID empresa del hotel en FacturaLibre
  ruc_emisor:   '',
  razon_social: '',
  modo_prod:    false,
};

async function cargarConfigSunat() {
  if (!SESSION.hotel) return;
  try {
    // 1. Config del hotel (series, usuario SOL, etc.)
    const { data: cfg } = await db.from('configuracion_sunat')
      .select('*').eq('hotel_id', SESSION.hotel.id).single();

    // 2. Token FacturaLibre desde configuracion_global (solo superadmin puede verlo)
    //    Para los hoteles, la RPC intermedia la petición — el token nunca llega al browser
    const { data: gl } = await db.from('configuracion_global')
      .select('fl_endpoint, proveedor_emision')
      .eq('id', 1).single();

    if (cfg?.token_api) {
      // Si el hotel tiene su propio token de FacturaLibre (empresa propia)
      API_SUNAT.activa      = true;
      API_SUNAT.token       = cfg.token_api;
      API_SUNAT.empresa_id  = cfg.fl_empresa_id || '';
      API_SUNAT.endpoint    = gl?.fl_endpoint || cfg.api_endpoint || 'https://facturalibre.net/api/v1';
      API_SUNAT.proveedor   = gl?.proveedor_emision || 'facturalibre';
      API_SUNAT.ruc_emisor  = cfg.ruc_emisor   || '';
      API_SUNAT.razon_social= cfg.razon_social  || '';
      API_SUNAT.modo_prod   = cfg.modo_produccion || false;
    }
  } catch(_) {}
}

// ════════════════════════════════════════════════════════════
//  CUOTAS — verificar antes de emitir
// ════════════════════════════════════════════════════════════
let _cuotaCache = null;

async function verificarCuotaCPE() {
  try {
    const { data, error } = await db.rpc('fn_verificar_cuota_cpe', {
      p_hotel_id: SESSION.hotel.id
    });
    if (error) throw error;
    _cuotaCache = data;
    return data;
  } catch(e) {
    console.warn('Cuota CPE:', e.message);
    return { puede_emitir: true, disponibles: 999, emitidos: 0, limite: 150 };
  }
}

function mostrarAlertaCuota(cuota) {
  const pct = Math.round((cuota.emitidos / cuota.limite) * 100);
  if (cuota.disponibles <= 0) {
    toast(
      '🚫 Límite de comprobantes alcanzado',
      `Has emitido ${cuota.emitidos} de ${cuota.limite} CPE este mes. Contacta a soporte para ampliar tu cuota.`,
      'error', 0  // 0 = no se cierra solo
    );
    return false;
  }
  if (cuota.disponibles <= 10) {
    toast(`⚠️ Cuota casi agotada`, `Solo quedan ${cuota.disponibles} comprobantes disponibles este mes.`, 'warn', 6000);
  }
  return true;
}


const IGV_TASA = 0.18;  // 18% Perú

// Códigos SUNAT de tipo de comprobante
const COD_TIPO = { boleta: '03', factura: '01', nota_credito: '07' };
const NOMBRE_TIPO = { boleta: 'BOLETA DE VENTA', factura: 'FACTURA', nota_credito: 'NOTA DE CRÉDITO' };


// ════════════════════════════════════════════════════════════
//  MÓDULO: BANDEJA DE COMPROBANTES
// ════════════════════════════════════════════════════════════
async function moduloFacturacion() {
  skeleton();
  try {
    await cargarConfigSunat();
    if (!SESSION.turnoActivo) SESSION.turnoActivo = await getTurnoAbierto();

    // Cargar cuota mensual
    const cuota = await verificarCuotaCPE();
    _cuotaCache = cuota;
    const pctUso = Math.min(100, Math.round((cuota.emitidos / cuota.limite) * 100));
    const colorBarra = pctUso >= 90 ? '#DC2626' : pctUso >= 70 ? '#EA580C' : '#16A34A';
    const bannerCuota = `
      <div style="display:flex;align-items:center;gap:1rem;background:white;border:1px solid var(--gris-borde);border-radius:12px;padding:0.9rem 1.1rem;margin-bottom:1rem;flex-wrap:wrap;">
        <div style="flex:1;min-width:200px;">
          <div style="display:flex;justify-content:space-between;font-size:0.82rem;margin-bottom:0.4rem;">
            <span style="font-weight:600;">Comprobantes este mes</span>
            <span style="font-weight:700;color:${colorBarra};">${cuota.emitidos} / ${cuota.limite}</span>
          </div>
          <div style="height:8px;background:var(--gris-borde);border-radius:999px;overflow:hidden;">
            <div style="width:${pctUso}%;height:100%;background:${colorBarra};border-radius:999px;transition:width 0.5s;"></div>
          </div>
          <div style="font-size:0.72rem;color:var(--texto-sub);margin-top:0.3rem;">${cuota.disponibles} disponibles · mes ${cuota.mes}</div>
        </div>
        ${pctUso >= 90 ? `<div style="font-size:0.78rem;font-weight:600;color:#DC2626;background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:0.4rem 0.75rem;">⚠️ ${cuota.disponibles <= 0 ? 'Cuota agotada' : 'Cuota casi agotada'}</div>` : ''}
      </div>
    `;

    const { data: comps, error } = await db
      .from('comprobantes_sunat')
      .select('*')
      .eq('hotel_id', SESSION.hotel.id)
      .order('created_at', { ascending: false })
      .limit(150);
    if (error) throw error;

    const lista = comps || [];
    window._compsCache = {};
    lista.forEach(c => window._compsCache[c.id] = c);

    // Métricas
    const totalComps   = lista.length;
    const montoTotal   = lista.reduce((s,c) => s + Number(c.total||0), 0);
    const totalFact    = lista.filter(c => c.tipo_doc === 'factura').length;
    const totalBoletas = lista.filter(c => c.tipo_doc === 'boleta').length;
    const totalEnviados= lista.filter(c => c.estado === 'ACEPTADO').length;
    const pendientes   = lista.filter(c => c.estado === 'PENDIENTE_ENVIO').length;

    // Filtro activo
    window._factFiltro = window._factFiltro || 'Todos';

    const esMobile = window.innerWidth <= 768;

    if (esMobile) {
      contenido().innerHTML = `

        <!-- Header -->
        <div style="display:flex;align-items:flex-start;gap:0.85rem;margin-bottom:0.85rem;">
          <div style="width:44px;height:44px;border-radius:12px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" style="width:22px;height:22px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <div>
            <h1 style="font-size:1.2rem;font-weight:700;color:var(--texto);margin:0;">Facturación SUNAT</h1>
            <p style="font-size:0.7rem;color:var(--texto-sub);margin:0;">Gestiona tus comprobantes electrónicos de forma rápida y segura.</p>
          </div>
        </div>

        <!-- Badge modo facturador -->
        <div style="display:flex;align-items:center;justify-content:space-between;background:white;border:1px solid var(--gris-borde);border-radius:12px;padding:0.75rem 1rem;margin-bottom:0.85rem;cursor:pointer;" onclick="navegarA('sunat-config')">
          <div style="display:flex;align-items:center;gap:0.5rem;font-size:0.82rem;font-weight:600;color:var(--texto-sub);">
            <span style="width:8px;height:8px;border-radius:50%;background:${API_SUNAT.activa?'#16A34A':'#CA8A04'};flex-shrink:0;"></span>
            ${API_SUNAT.activa ? 'Facturador conectado' : 'Modo sin facturador conectado'}
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:15px;height:15px;"><polyline points="9 18 15 12 9 6"/></svg>
        </div>

        <!-- Botones Config + Emitir -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.6rem;margin-bottom:1rem;">
          <button onclick="navegarA('sunat-config')"
            style="display:flex;align-items:center;justify-content:center;gap:0.4rem;padding:0.7rem 0.5rem;background:white;border:1.5px solid var(--gris-borde);border-radius:12px;font-size:0.8rem;font-weight:600;color:var(--texto-sub);cursor:pointer;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:16px;height:16px;"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51"/></svg>
            Configuración SUNAT
          </button>
          <button onclick="abrirEmitirComprobante()"
            style="display:flex;align-items:center;justify-content:center;gap:0.4rem;padding:0.7rem 0.5rem;background:var(--azul);border:none;border-radius:12px;font-size:0.8rem;font-weight:700;color:white;cursor:pointer;box-shadow:0 4px 14px rgba(37,99,235,0.3);">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" style="width:16px;height:16px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Emitir comprobante
          </button>
        </div>

        <!-- Cuota banner -->
        ${bannerCuota}

        <!-- 5 KPIs: 2x2 + 1 ancho completo -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.6rem;margin-bottom:0.6rem;">
          ${factKpiMobile('Comprobantes', totalComps, 'Total registrado', '#2563EB', '#EFF6FF',
            '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>', false)}
          ${factKpiMobile(soles(montoTotal), '', 'Monto total de comprobantes', '#16A34A', '#F0FDF4',
            '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>', true)}
          ${factKpiMobile('Facturas', totalFact, 'Facturas emitidas', '#7C3AED', '#F5F3FF',
            '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/>', false)}
          ${factKpiMobile('Boletas de venta', totalBoletas, 'Boletas emitidas', '#EA580C', '#FFF7ED',
            '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>', false)}
        </div>
        <!-- 5ta métrica ancho completo -->
        <div style="margin-bottom:1rem;">
          <div class="card" style="padding:0.85rem 1rem;display:flex;align-items:center;gap:1rem;">
            <div style="width:36px;height:36px;border-radius:10px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" style="width:18px;height:18px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div style="flex:1;">
              <div style="font-size:1.3rem;font-weight:700;color:var(--texto);line-height:1;">${pendientes}</div>
              <div style="font-size:0.72rem;color:var(--texto-sub);">Enviados a SUNAT pendientes: ${pendientes}</div>
            </div>
          </div>
        </div>

        <!-- Pills filtro -->
        <div style="overflow-x:auto;scrollbar-width:none;margin-bottom:0.75rem;">
          <div style="display:flex;gap:0.5rem;min-width:max-content;padding-bottom:0.1rem;">
            ${[['Todos',totalComps],['Facturas',totalFact],['Boletas de venta',totalBoletas]].map(([label,cnt]) => `
              <button onclick="filtrarFacturacion('${label}')" id="fact-btn-${label.replace(/\s/g,'_')}"
                style="padding:0.45rem 0.9rem;border-radius:999px;font-size:0.78rem;font-weight:600;cursor:pointer;white-space:nowrap;
                  background:${window._factFiltro===label?'var(--azul)':'white'};
                  color:${window._factFiltro===label?'white':'var(--texto-sub)'};
                  border:1.5px solid ${window._factFiltro===label?'transparent':'var(--gris-borde)'};
                  box-shadow:${window._factFiltro===label?'0 4px 12px rgba(37,99,235,0.3)':'none'};">
                ${escapeHtml(label)} (${cnt})
              </button>`).join('')}
          </div>
        </div>

        <!-- Buscador -->
        <div style="position:relative;margin-bottom:0.75rem;">
          <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:15px;height:15px;position:absolute;left:0.8rem;top:50%;transform:translateY(-50%);pointer-events:none;">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" id="fact-buscar" placeholder="Buscar por número, cliente o tipo…"
            oninput="filtrarFactBuscar()"
            style="width:100%;padding:0.65rem 0.75rem 0.65rem 2.35rem;border:1.5px solid var(--gris-borde);border-radius:12px;font-size:0.83rem;background:white;box-sizing:border-box;outline:none;font-family:inherit;"
            onfocus="this.style.borderColor='var(--azul)'" onblur="this.style.borderColor='var(--gris-borde)'">
        </div>

        <!-- Filtros fila -->
        <div style="display:flex;gap:0.5rem;margin-bottom:1rem;overflow-x:auto;scrollbar-width:none;">
          <div style="display:flex;align-items:center;gap:0.4rem;background:white;border:1px solid var(--gris-borde);border-radius:999px;padding:0.45rem 0.85rem;font-size:0.78rem;color:var(--texto-sub);white-space:nowrap;cursor:pointer;flex-shrink:0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Todas las fechas
            <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:11px;height:11px;"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <div style="display:flex;align-items:center;gap:0.4rem;background:white;border:1px solid var(--gris-borde);border-radius:999px;padding:0.45rem 0.85rem;font-size:0.78rem;color:var(--texto-sub);white-space:nowrap;cursor:pointer;flex-shrink:0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px;"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            Filtros
          </div>
        </div>

        <!-- Lista comprobantes móvil -->
        <div id="fact-tbody-mobile">
          ${lista.length === 0
            ? `<div style="text-align:center;padding:2.5rem;color:var(--texto-sub);"><div style="font-size:2.5rem;margin-bottom:0.75rem;">📄</div><div style="font-weight:600;color:var(--texto);">Sin comprobantes emitidos aún</div></div>`
            : lista.map(c => tarjetaComprobanteMobile(c)).join('')}
        </div>

        <!-- Paginación -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin:0.75rem 0;font-size:0.75rem;color:var(--texto-sub);">
          <span>Mostrando 1 a ${lista.length} de ${lista.length} comprobantes</span>
          <div style="display:flex;gap:0.35rem;">
            <button style="width:28px;height:28px;border:1px solid var(--gris-borde);border-radius:7px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:12px;height:12px;"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button style="width:28px;height:28px;border:none;border-radius:7px;background:var(--azul);color:white;font-weight:700;font-size:0.8rem;cursor:pointer;">1</button>
            <button style="width:28px;height:28px;border:1px solid var(--gris-borde);border-radius:7px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:12px;height:12px;"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
      `;
      return;
    }

    // ══════════ DESKTOP ══════════
    contenido().innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;margin-bottom:1rem;">
        <div style="display:flex;align-items:center;gap:1rem;">
          <div style="width:52px;height:52px;border-radius:14px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:26px;height:26px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </div>
          <div>
            <h1 style="font-size:1.5rem;font-weight:700;color:var(--texto);margin:0;">Facturación SUNAT</h1>
            <p style="font-size:0.83rem;color:var(--texto-sub);margin:0.2rem 0 0;">Gestiona tus comprobantes electrónicos de forma rápida y segura</p>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
          <!-- Badge modo sin facturador -->
          <span style="display:inline-flex;align-items:center;gap:0.45rem;background:white;border:1px solid var(--gris-borde);border-radius:999px;padding:0.4rem 0.9rem;font-size:0.78rem;font-weight:600;color:var(--texto-sub);">
            <span style="width:8px;height:8px;border-radius:50%;background:#16A34A;"></span>
            Modo sin facturador conectado
          </span>
          <button onclick="navegarA('config-sunat')" style="display:flex;align-items:center;gap:0.4rem;background:white;border:1px solid var(--gris-borde);border-radius:10px;padding:0.6rem 0.9rem;font-size:0.82rem;font-weight:500;color:var(--texto-sub);cursor:pointer;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:15px;height:15px;"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 0-14.14 0M4.93 19.07a10 10 0 0 0 14.14 0M4.93 4.93L19.07 19.07"/></svg>
            Configuración SUNAT
          </button>
          <button onclick="abrirEmitirComprobante()" style="width:auto;padding:0.6rem 1.1rem;background:linear-gradient(135deg,var(--azul),#2563EB);color:white;border:none;border-radius:10px;font-size:0.83rem;font-weight:600;cursor:pointer;box-shadow:0 4px 14px rgba(26,63,166,0.3);display:flex;align-items:center;gap:0.45rem;">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" style="width:15px;height:15px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Emitir comprobante
          </button>
        </div>
      </div>

      <!-- Banner info modo sin OSE -->
      ${!API_SUNAT.activa ? `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:0.85rem 1.25rem;margin-bottom:1.25rem;flex-wrap:wrap;">
        <div style="display:flex;align-items:flex-start;gap:0.75rem;">
          <div style="width:30px;height:30px;border-radius:50%;background:#2563EB;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" style="width:15px;height:15px;"><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/><circle cx="12" cy="12" r="10"/></svg>
          </div>
          <span style="font-size:0.82rem;color:#1E40AF;">Los comprobantes se guardan como <strong>PENDIENTE_ENVIO</strong> y puedes imprimirlos o enviarlos por WhatsApp. Cuando conectes tu OSE, se declararán automáticamente a SUNAT.</span>
        </div>
        <a href="#" style="font-size:0.82rem;font-weight:600;color:#2563EB;white-space:nowrap;text-decoration:none;display:flex;align-items:center;gap:0.3rem;">Más información <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:13px;height:13px;"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></a>
      </div>` : ''}

      <!-- 5 tarjetas métricas -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:1rem;margin-bottom:1.5rem;">
        ${factMetrica('Comprobantes', totalComps, 'Total registrado', '#2563EB', '#EFF6FF',
          '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',false)}
        ${factMetrica(soles(montoTotal), '', 'Monto total de comprobantes', '#16A34A', '#F0FDF4',
          '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>',false, true)}
        ${factMetrica('Facturas', totalFact, 'emitidas', '#7C3AED', '#F5F3FF',
          '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>',false)}
        ${factMetrica('Boletas de venta', totalBoletas, 'emitidas', '#EA580C', '#FFF7ED',
          '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>',false)}
        ${factMetrica('Enviados a SUNAT', totalEnviados, 'pendientes: '+pendientes, '#64748B', '#F1F5F9',
          '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',false)}
      </div>

      <!-- Filtros por tipo + buscador + fechas + filtros -->
      <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-bottom:1rem;">
        <div style="display:flex;gap:0.35rem;flex:1;min-width:220px;">
          ${[['Todos',totalComps],['Facturas',totalFact],['Boletas de venta',totalBoletas]].map(([label,cnt]) => `
            <button onclick="filtrarFacturacion('${label}')" id="fact-btn-${label.replace(/\s/g,'_')}"
              style="padding:0.45rem 0.9rem;border-radius:999px;font-size:0.82rem;font-weight:600;cursor:pointer;
              background:${window._factFiltro===label?'var(--azul)':'white'};
              color:${window._factFiltro===label?'white':'var(--texto-sub)'};
              border:1.5px solid ${window._factFiltro===label?'transparent':'var(--gris-borde)'};
              box-shadow:${window._factFiltro===label?'0 4px 12px rgba(37,99,235,0.3)':'none'};">
              ${escapeHtml(label)} (${cnt})
            </button>`).join('')}
        </div>
        <div style="display:flex;align-items:center;gap:0.5rem;">
          <div style="display:flex;align-items:center;gap:0.5rem;background:white;border:1px solid var(--gris-borde);border-radius:10px;padding:0.5rem 0.85rem;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" id="fact-buscar" placeholder="Buscar por número, cliente o tipo…" oninput="filtrarFactBuscar()" style="border:none;background:none;outline:none;font-size:0.82rem;width:200px;font-family:inherit;color:var(--texto);">
          </div>
          <div style="display:flex;align-items:center;gap:0.4rem;background:white;border:1px solid var(--gris-borde);border-radius:10px;padding:0.5rem 0.8rem;font-size:0.8rem;color:var(--texto-sub);cursor:pointer;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Todas las fechas
            <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:12px;height:12px;"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <div style="display:flex;align-items:center;gap:0.4rem;background:white;border:1px solid var(--gris-borde);border-radius:10px;padding:0.5rem 0.8rem;font-size:0.8rem;color:var(--texto-sub);cursor:pointer;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px;"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            Filtros
          </div>
        </div>
      </div>

      <!-- Tabla de comprobantes -->
      <div style="background:white;border:1px solid var(--gris-borde);border-radius:12px;overflow:hidden;margin-bottom:1rem;">
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:0.85rem;min-width:750px;">
            <thead>
              <tr style="border-bottom:1px solid var(--gris-borde);text-align:left;">
                <th style="${thCss()};width:40px;">#</th>
                <th style="${thCss()}">COMPROBANTE</th>
                <th style="${thCss()}">TIPO</th>
                <th style="${thCss()}">CLIENTE</th>
                <th style="${thCss()}">TOTAL</th>
                <th style="${thCss()}">ESTADO</th>
                <th style="${thCss()}">FECHA EMISIÓN</th>
                <th style="${thCss()};text-align:right;">ACCIONES</th>
              </tr>
            </thead>
            <tbody id="fact-tbody">
              ${lista.length === 0
                ? `<tr><td colspan="8" style="padding:3rem;text-align:center;color:var(--texto-sub);"><div style="font-size:2rem;margin-bottom:0.5rem;">📄</div>Sin comprobantes emitidos aún.</td></tr>`
                : lista.map((c,i) => filaComprobante(c, i+1)).join('')}
            </tbody>
          </table>
        </div>
        <!-- Paginación -->
        <div style="padding:0.85rem 1.25rem;display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--gris-borde);flex-wrap:wrap;gap:0.75rem;">
          <span style="font-size:0.82rem;color:var(--texto-sub);">Mostrando 1 a ${lista.length} de ${lista.length} comprobantes</span>
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
        <div style="width:46px;height:46px;border-radius:13px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative;">
          <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" style="width:22px;height:22px;"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 0-14.14 0M4.93 19.07a10 10 0 0 0 14.14 0"/></svg>
        </div>
        <div style="flex:1;position:relative;">
          <div style="font-weight:700;color:var(--texto);">Conecta tu facturador para enviar automáticamente a SUNAT</div>
          <div style="font-size:0.82rem;color:var(--texto-sub);">Configura tu OSE y mantén tu facturación al día.</div>
        </div>
        <button onclick="navegarA('config-sunat')" style="display:flex;align-items:center;gap:0.5rem;background:white;border:1.5px solid var(--azul);border-radius:10px;padding:0.6rem 1.1rem;font-size:0.83rem;font-weight:600;color:var(--azul);cursor:pointer;position:relative;white-space:nowrap;">
          Configurar SUNAT
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:13px;height:13px;"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
      </div>
    `;
  } catch (err) {
    contenido().innerHTML = errorBox('No se pudo cargar facturación', err.message);
  }
}

function factKpiMobile(label, valor, sub, color, bg, icono, esSoles) {
  return `
    <div class="card" style="padding:0.9rem;min-width:0;overflow:hidden;">
      <div style="width:34px;height:34px;border-radius:10px;background:${bg};display:flex;align-items:center;justify-content:center;margin-bottom:0.5rem;">
        <svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" style="width:17px;height:17px;">${icono}</svg>
      </div>
      <div style="font-size:${esSoles?'1.1':'1.4'}rem;font-weight:700;color:var(--texto);line-height:1;">${esSoles ? label : valor}</div>
      <div style="font-size:0.67rem;color:var(--texto-sub);margin-top:0.2rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esSoles ? sub : label}${(!esSoles&&sub)?'<br><span style="font-size:0.63rem;">'+sub+'</span>':''}</div>
    </div>`;
}

function tarjetaComprobanteMobile(c) {
  const estColor = c.estado_sunat==='ACEPTADO' ? '#16A34A'
    : c.estado_sunat==='ANULADO' ? '#DC2626' : '#CA8A04';
  const estBg    = c.estado_sunat==='ACEPTADO' ? '#F0FDF4'
    : c.estado_sunat==='ANULADO' ? '#FEF2F2' : '#FEFCE8';
  const estLabel = c.estado_sunat==='ACEPTADO' ? '✅ Aceptado'
    : c.estado_sunat==='ANULADO' ? '❌ Anulado' : '⏳ Pendiente';
  const tipo = c.tipo_doc==='factura' ? 'Factura' : c.tipo_doc==='nota_credito' ? 'N. Crédito' : 'Boleta';
  const tipoColor = c.tipo_doc==='factura' ? '#7C3AED' : c.tipo_doc==='nota_credito' ? '#EA580C' : '#EA580C';
  const tipoBg    = c.tipo_doc==='factura' ? '#F5F3FF' : '#FFF7ED';
  const nombreCliente = c.razon_social_rec || c.ruc_receptor || '—';
  const numero = `${c.serie||'?'}-${String(c.correlativo||0).padStart(8,'0')}`;

  return `
    <div class="card" style="padding:0.9rem 1rem;margin-bottom:0.6rem;">
      <!-- Tipo + estado + acciones -->
      <div style="display:flex;align-items:center;gap:0.65rem;margin-bottom:0.65rem;">
        <span style="font-size:0.68rem;font-weight:700;color:${tipoColor};background:${tipoBg};padding:0.2rem 0.6rem;border-radius:999px;white-space:nowrap;">${tipo}</span>
        <span style="font-weight:700;font-size:0.85rem;color:var(--texto);flex:1;">${escapeHtml(numero)}</span>
        <span style="font-size:0.65rem;font-weight:700;color:${estColor};background:${estBg};padding:0.2rem 0.55rem;border-radius:999px;white-space:nowrap;">${estLabel}</span>
        <button onclick="abrirAccionesComprobante('${c.id}')" style="padding:0.25rem 0.5rem;background:white;border:1px solid var(--gris-borde);border-radius:7px;cursor:pointer;color:var(--texto-sub);font-size:0.9rem;line-height:1;flex-shrink:0;">···</button>
      </div>
      <!-- Cliente + total + fecha -->
      <div style="display:flex;align-items:center;justify-content:space-between;gap:0.75rem;">
        <div style="min-width:0;">
          <div style="font-size:0.78rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(nombreCliente)}</div>
          <div style="font-size:0.7rem;color:var(--texto-sub);">${new Date(c.created_at).toLocaleDateString('es-PE',{day:'numeric',month:'short',year:'numeric'})}</div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-weight:700;font-size:0.95rem;color:var(--verde);">${soles(c.total||0)}</div>
          ${c.url_pdf ? `<a href="${c.url_pdf}" target="_blank" style="font-size:0.65rem;color:var(--azul);font-weight:600;text-decoration:none;">📄 Ver PDF</a>` : ''}
        </div>
      </div>
    </div>`;
}

function factMetrica(label, valor, sub, color, bg, icono, flecha=false, esSoles=false) {
  return `
    <div class="card" style="padding:1.1rem;position:relative;overflow:hidden;">
      <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.5rem;">
        <div style="width:40px;height:40px;border-radius:11px;background:${bg};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;">${icono}</svg>
        </div>
      </div>
      <div style="font-size:${esSoles?'1.3':'1.65'}rem;font-weight:700;color:var(--texto);line-height:1.1;">${esSoles ? label : valor}</div>
      <div style="font-size:0.75rem;color:var(--texto-sub);margin-top:0.2rem;">${esSoles ? valor||sub : label}</div>
      ${sub && !esSoles ? `<div style="font-size:0.7rem;color:var(--texto-sub);">${sub}</div>` : ''}
      <svg style="position:absolute;bottom:-8px;right:-8px;opacity:0.07;" viewBox="0 0 100 50" width="100" height="50">
        <path d="M0 35 Q25 10 50 30 Q75 50 100 25 L100 50 L0 50 Z" fill="${color}"/>
      </svg>
    </div>`;
}

function filaComprobante(c, idx) {
  const tipoLabel = { boleta:'Boleta de venta', factura:'Factura', nota_credito:'Nota de crédito' };
  const tipoColor = { boleta:{ bg:'#EDE9FE', color:'#7C3AED' }, factura:{ bg:'#EFF6FF', color:'#2563EB' }, nota_credito:{ bg:'#FFF7ED', color:'#EA580C' } };
  const tc = tipoColor[c.tipo_doc] || tipoColor.boleta;

  const estadoMap = {
    ACEPTADO:        ['Aceptado',       '#16A34A','#F0FDF4'],
    PENDIENTE_ENVIO: ['Pendiente envío','#CA8A04','#FEFCE8'],
    RECHAZADO:       ['Rechazado',      '#DC2626','#FEF2F2'],
    ANULADO:         ['Anulado',        '#64748B','#F1F5F9'],
  };
  const [estLabel, estColor, estBg] = estadoMap[c.estado] || ['—','#64748B','#F1F5F9'];
  const anulable = c.estado !== 'ANULADO' && c.tipo_doc !== 'nota_credito';
  const fechaEm = new Date(c.created_at);
  const docLabel = c.num_doc_rec ? (c.tipo_doc==='factura'?'RUC':'DNI')+': '+c.num_doc_rec : '';

  return `
    <tr class="fact-fila" data-tipo="${c.tipo_doc}" data-buscar="${(c.numero_completo+' '+(c.razon_social_rec||'')+' '+c.tipo_doc).toLowerCase()}" style="border-bottom:1px solid var(--gris-borde);">
      <td style="${tdCss()};color:var(--texto-sub);">${idx}</td>
      <td style="${tdCss()};font-family:monospace;font-weight:700;font-size:0.88rem;">${escapeHtml(c.numero_completo)}</td>
      <td style="${tdCss()}">
        <span style="font-size:0.75rem;font-weight:600;color:${tc.color};background:${tc.bg};padding:0.2rem 0.7rem;border-radius:999px;">
          ${escapeHtml(tipoLabel[c.tipo_doc]||c.tipo_doc)}
        </span>
      </td>
      <td style="${tdCss()}">
        <div style="font-weight:600;font-size:0.85rem;">${escapeHtml(c.razon_social_rec||'Cliente varios')}</div>
        ${docLabel?`<div style="font-size:0.72rem;color:var(--texto-sub);">${escapeHtml(docLabel)}</div>`:''}
      </td>
      <td style="${tdCss()};font-weight:700;">${soles(c.total)}</td>
      <td style="${tdCss()}">
        <span style="display:inline-flex;align-items:center;gap:0.35rem;font-size:0.72rem;font-weight:700;color:${estColor};background:${estBg};padding:0.25rem 0.75rem;border-radius:999px;">
          <span style="width:6px;height:6px;border-radius:50%;background:${estColor};"></span>
          ${estLabel}
        </span>
      </td>
      <td style="${tdCss()}">
        <div style="font-weight:600;font-size:0.83rem;">${fechaEm.toLocaleDateString('es-PE',{day:'numeric',month:'short',year:'numeric'})}</div>
        <div style="font-size:0.72rem;color:var(--texto-sub);">${fechaEm.toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'})}</div>
      </td>
      <td style="${tdCss()};text-align:right;">
        <div style="display:flex;align-items:center;gap:0.3rem;justify-content:flex-end;">
          <button title="Imprimir ticket 80mm" onclick="imprimirTicket('${c.id}')" style="width:30px;height:30px;border:1px solid var(--gris-borde);border-radius:7px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--texto-sub);" onmouseover="this.style.background='var(--gris-bg)'" onmouseout="this.style.background='white'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px;"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          </button>
          <button title="Descargar PDF" onclick="descargarPDF('${c.id}')" style="width:30px;height:30px;border:1px solid var(--gris-borde);border-radius:7px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--texto-sub);" onmouseover="this.style.background='var(--gris-bg)'" onmouseout="this.style.background='white'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </button>
          <button title="Enviar por WhatsApp" onclick="enviarComprobanteWA('${c.id}')" style="width:30px;height:30px;border:1px solid var(--gris-borde);border-radius:7px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#16A34A;" onmouseover="this.style.background='var(--gris-bg)'" onmouseout="this.style.background='white'">
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" style="width:13px;height:13px;"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM11.999 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.186 21.9l4.83-1.225A9.953 9.953 0 0 0 12 22c5.522 0 10-4.478 10-10S17.521 2 11.999 2z"/></svg>
          </button>
          <button title="Más opciones" style="width:30px;height:30px;border:1px solid var(--gris-borde);border-radius:7px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--texto-sub);" onmouseover="this.style.background='var(--gris-bg)'" onmouseout="this.style.background='white'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px;"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
          </button>
        </div>
      </td>
    </tr>`;
}

function filtrarFacturacion(tipo) {
  window._factFiltro = tipo;
  const lista = Object.values(window._compsCache||{});
  document.querySelectorAll('[id^="fact-btn-"]').forEach(btn => {
    const esActivo = btn.id === 'fact-btn-'+tipo.replace(/\s/g,'_');
    btn.style.background = esActivo ? 'var(--azul)' : 'white';
    btn.style.color = esActivo ? 'white' : 'var(--texto-sub)';
    btn.style.borderColor = esActivo ? 'transparent' : 'var(--gris-borde)';
    btn.style.boxShadow = esActivo ? '0 4px 12px rgba(37,99,235,0.3)' : 'none';
  });
  const mapa = { 'Todos': null, 'Facturas':'factura', 'Boletas de venta':'boleta' };
  const filtro = mapa[tipo];
  const filtrada = filtro ? lista.filter(c => c.tipo_doc===filtro) : lista;
  const tbody = document.getElementById('fact-tbody');
  if (tbody) tbody.innerHTML = filtrada.length
    ? filtrada.map((c,i) => filaComprobante(c,i+1)).join('')
    : `<tr><td colspan="8" style="padding:2.5rem;text-align:center;color:var(--texto-sub);">Sin comprobantes de este tipo.</td></tr>`;
}

function filtrarFactBuscar() {
  const q = (document.getElementById('fact-buscar')?.value||'').toLowerCase();
  document.querySelectorAll('.fact-fila').forEach(tr => {
    tr.style.display = !q || tr.dataset.buscar.includes(q) ? '' : 'none';
  });
}


// ════════════════════════════════════════════════════════════
//  EMITIR COMPROBANTE
// ════════════════════════════════════════════════════════════
function abrirEmitirComprobante() {
  const html = `
    <form id="form-emitir">
      <div style="${ST.grupo}">
        <label style="${ST.label}">Tipo de comprobante *</label>
        <div style="display:flex; gap:0.5rem;">
          <button type="button" class="btn-tipocomp" data-tipo="boleta" style="${ST.btnSec}; flex:1;">Boleta</button>
          <button type="button" class="btn-tipocomp" data-tipo="factura" style="${ST.btnSec}; flex:1;">Factura</button>
        </div>
      </div>

      <!-- Datos del receptor (solo factura pide RUC obligatorio) -->
      <div id="bloque-ruc" style="display:none;">
        <div style="${ST.grupo}">
          <label style="${ST.label}">RUC del cliente *</label>
          <div style="display:flex; gap:0.4rem;">
            <input style="${ST.input}" id="emi-ruc" maxlength="11" placeholder="20123456789">
            <button type="button" style="${ST.btnSec}; padding:0.55rem 0.75rem;" id="btn-buscar-ruc" title="Buscar RUC">🔍</button>
          </div>
        </div>
        <div style="${ST.grupo}">
          <label style="${ST.label}">Razón social *</label>
          <input style="${ST.input}" id="emi-razon" placeholder="Empresa SAC">
        </div>
      </div>

      <div id="bloque-dni" style="${ST.grupo}">
        <label style="${ST.label}">Nombre del cliente (opcional en boleta)</label>
        <input style="${ST.input}" id="emi-nombre" placeholder="Cliente varios">
      </div>

      <div style="${ST.grupo}">
        <label style="${ST.label}">Total a facturar (incluye IGV) *</label>
        <input style="${ST.input}; font-size:1.15rem; font-weight:700;" id="emi-total" type="number" step="0.01" required placeholder="0.00">
      </div>

      <div id="emi-desglose" style="background:var(--gris-bg); border-radius:10px; padding:0.85rem 1rem; margin-bottom:1rem; font-size:0.82rem; color:var(--texto-sub); display:none;">
        <div style="display:flex; justify-content:space-between; padding:0.15rem 0;"><span>Op. gravada</span><strong id="emi-base">S/ 0.00</strong></div>
        <div style="display:flex; justify-content:space-between; padding:0.15rem 0;"><span>IGV (18%)</span><strong id="emi-igv">S/ 0.00</strong></div>
        <div style="display:flex; justify-content:space-between; padding:0.15rem 0; color:var(--texto);"><span style="font-weight:600;">Total</span><strong id="emi-tot">S/ 0.00</strong></div>
      </div>

      <div style="${ST.grupo}">
        <label style="${ST.label}">Concepto / descripción</label>
        <input style="${ST.input}" id="emi-concepto" value="Servicio de hospedaje" placeholder="Detalle del servicio">
      </div>
      <div style="${ST.grupo}">
        <label style="${ST.label}">Celular del cliente (para WhatsApp)</label>
        <input style="${ST.input}" id="emi-celular" placeholder="999999999">
      </div>

      <div id="emitir-error" style="display:none; background:#FEF2F2; border:1px solid #FECACA; color:var(--rojo); padding:0.6rem 0.85rem; border-radius:8px; font-size:0.82rem; margin-bottom:0.75rem;"></div>

      <button type="submit" style="${ST.btnPri}" id="btn-emitir-submit">Emitir comprobante</button>
    </form>
  `;
  abrirModal('Emitir comprobante', html, { ancho: '520px' });

  let tipoSel = 'boleta';
  const selTipo = (t) => {
    tipoSel = t;
    $$('.btn-tipocomp').forEach(b => {
      const on = b.dataset.tipo === t;
      b.style.background = on ? 'rgba(26,63,166,0.08)' : 'white';
      b.style.borderColor = on ? 'var(--azul)' : 'var(--gris-borde)';
      b.style.color = on ? 'var(--azul)' : 'var(--texto)';
    });
    $('#bloque-ruc').style.display = t === 'factura' ? 'block' : 'none';
    $('#bloque-dni').style.display = t === 'boleta' ? 'block' : 'none';
  };
  $$('.btn-tipocomp').forEach(b => b.addEventListener('click', () => selTipo(b.dataset.tipo)));
  selTipo('boleta');

  // Desglose IGV en vivo
  $('#emi-total').addEventListener('input', () => {
    const total = parseFloat($('#emi-total').value) || 0;
    const base = total / (1 + IGV_TASA);
    const igv = total - base;
    $('#emi-base').textContent = soles(base);
    $('#emi-igv').textContent = soles(igv);
    $('#emi-tot').textContent = soles(total);
    $('#emi-desglose').style.display = total > 0 ? 'block' : 'none';
  });

  // Buscar RUC
  $('#btn-buscar-ruc').addEventListener('click', async () => {
    const ruc = $('#emi-ruc').value.trim();
    if (ruc.length !== 11) { toast('RUC inválido', 'Debe tener 11 dígitos', 'warn'); return; }
    const btn = $('#btn-buscar-ruc'); btn.textContent = '…';
    const res = await consultarRUC(ruc);
    btn.textContent = '🔍';
    if (res) { $('#emi-razon').value = res.razon_social; toast('RUC encontrado', '', 'ok', 2000); }
    else toast('Consulta manual', API_DOC.activa ? 'No se encontró el RUC' : 'API de RUC no configurada. Ingresa manual.', 'info', 3000);
  });

  // Submit
  $('#form-emitir').addEventListener('submit', async e => {
    e.preventDefault();
    const errEl = $('#emitir-error'); errEl.style.display = 'none';
    const total = parseFloat($('#emi-total').value);
    if (isNaN(total) || total <= 0) { errEl.textContent = 'Ingresa un total válido.'; errEl.style.display = 'block'; return; }

    let rucRec = null, razonRec = null;
    if (tipoSel === 'factura') {
      rucRec = $('#emi-ruc').value.trim();
      razonRec = $('#emi-razon').value.trim();
      if (rucRec.length !== 11 || !razonRec) { errEl.textContent = 'Para factura, ingresa RUC (11 dígitos) y razón social.'; errEl.style.display = 'block'; return; }
    } else {
      razonRec = $('#emi-nombre').value.trim() || 'Cliente varios';
    }

    const btn = $('#btn-emitir-submit'); btn.disabled = true; btn.textContent = 'Emitiendo…';
    try {
      const base = total / (1 + IGV_TASA);
      const igv = total - base;

      const resp = await rpc('fn_emitir_comprobante', {
        p_tipo_doc: tipoSel,
        p_estadia_id: null,
        p_venta_directa_id: null,
        p_turno_caja_id: SESSION.turnoActivo?.id || null,
        p_ruc_receptor: rucRec,
        p_razon_social_rec: razonRec,
        p_total: total,
        p_igv: Number(igv.toFixed(2)),
        p_concepto: $('#emi-concepto').value || 'Servicio',
        p_celular: $('#emi-celular').value.trim() || null,
        p_referencia_nc: null,
      });

      // ── Verificar cuota CPE antes de insertar ────────────
      const cuota = await verificarCuotaCPE();
      if (!cuota.puede_emitir) {
        mostrarAlertaCuota(cuota);
        btn.disabled = false; btn.textContent = 'Emitir comprobante';
        return;
      }

      // Si hay facturador conectado, enviar a SUNAT
      if (API_SUNAT.activa) {
        await enviarASunat(resp.comprobante_id);
      }

      cerrarModal();
      toast('Comprobante emitido', resp.numero_completo, 'ok');
      moduloFacturacion();
      // Abrir el ticket automáticamente
      setTimeout(() => imprimirTicket(resp.comprobante_id), 400);
    } catch (err) {
      errEl.textContent = 'Error: ' + err.message; errEl.style.display = 'block';
      btn.disabled = false; btn.textContent = 'Emitir comprobante';
    }
  });
}


// ════════════════════════════════════════════════════════════
//  ENVÍO A SUNAT (cuando el facturador esté conectado)
// ════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════
//  MOTOR FACTURALIBRE — Emisión a SUNAT
//  Docs: https://facturalibre.net/api/v1/docs
// ════════════════════════════════════════════════════════════

// Construye el payload JSON exigido por FacturaLibre
function buildPayloadFL(c, cfg) {
  const esFact = c.tipo_doc === 'factura';
  const esNC   = c.tipo_doc === 'nota_credito';
  const subtotal = Number(c.total) - Number(c.igv || 0);

  const payload = {
    // ── Emisor ──────────────────────────────────────────────
    empresa: {
      ruc:          cfg.ruc_emisor || API_SUNAT.ruc_emisor,
      razon_social: cfg.razon_social || API_SUNAT.razon_social,
      usuario_sol:  cfg.usuario_sol,
      clave_sol:    cfg.clave_sol,
      // FacturaLibre distribuidor: identificar empresa cliente
      empresa_id:   API_SUNAT.empresa_id || cfg.fl_empresa_id || undefined,
    },

    // ── Comprobante ─────────────────────────────────────────
    comprobante: {
      tipo:        esFact ? '01' : esNC ? '07' : '03',
      serie:       c.serie,
      correlativo: String(c.correlativo).padStart(8, '0'),
      fecha:       new Date(c.created_at).toISOString().slice(0, 10),
      moneda:      'PEN',
      ambiente:    API_SUNAT.modo_prod ? 'produccion' : 'beta',
    },

    // ── Receptor ────────────────────────────────────────────
    receptor: {
      tipo_doc:    esFact ? '6' : '1',   // 6=RUC 1=DNI
      numero_doc:  c.ruc_receptor || '',
      denominacion:c.razon_social_rec || '',
    },

    // ── Items ───────────────────────────────────────────────
    items: c._items || [{
      codigo:           'S001',
      descripcion:      esNC
        ? `NC: ${c.motivo_anulacion || 'Anulación'}`
        : 'Servicio de Hospedaje',
      unidad:           'ZZ',
      cantidad:         1,
      precio_unitario:  subtotal.toFixed(2),
      tipo_afectacion:  '10',   // gravado
      total_base:       subtotal.toFixed(2),
      igv:              Number(c.igv || 0).toFixed(2),
      total:            Number(c.total).toFixed(2),
    }],

    // ── Totales ─────────────────────────────────────────────
    totales: {
      gravadas:   subtotal.toFixed(2),
      igv:        Number(c.igv || 0).toFixed(2),
      total:      Number(c.total).toFixed(2),
    },
  };

  // Nota de crédito: referencia al comprobante original
  if (esNC) {
    payload.comprobante.documento_referencia = {
      tipo:       '03',
      serie:      c.comprobante_original_serie || '',
      correlativo:String(c.comprobante_original_corr || 1).padStart(8, '0'),
    };
    payload.comprobante.motivo_nota = c.motivo_anulacion || 'Anulación de comprobante';
    payload.comprobante.tipo_nota   = '01'; // anulación
  }

  return payload;
}

async function enviarASunat(comprobanteId) {
  if (!API_SUNAT.activa) return;

  try {
    const { data: c }   = await db.from('comprobantes_sunat').select('*').eq('id', comprobanteId).single();
    const { data: cfg } = await db.from('configuracion_sunat').select('*').eq('hotel_id', SESSION.hotel.id).single();
    if (!c || !cfg) throw new Error('Datos insuficientes para emitir');

    // ── Verificar cuota antes de emitir ──────────────────
    const cuota = await verificarCuotaCPE();
    if (!cuota.puede_emitir) {
      await db.from('comprobantes_sunat').update({
        estado_sunat:  'PENDIENTE_ENVIO',
        mensaje_sunat: `Cuota mensual agotada (${cuota.emitidos}/${cuota.limite})`,
      }).eq('id', comprobanteId);
      mostrarAlertaCuota(cuota);
      return;
    }

    const payload  = buildPayloadFL(c, cfg);
    const endpoint = `${API_SUNAT.endpoint}/invoice`.replace(/([^:])\/\//g, '$1/');

    // ── POST a FacturaLibre ───────────────────────────────
    const r = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Accept':        'application/json',
        'Authorization': `Bearer ${API_SUNAT.token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await r.json();

    if (!r.ok) {
      const msg = data.message || data.error || `Error FacturaLibre ${r.status}`;
      throw new Error(msg);
    }

    // ── ✅ Respuesta exitosa de FacturaLibre ─────────────
    // FL devuelve: { success, data: { pdf, xml, cdr, hash, qr, numero } }
    const info = data.data || data;

    // URL del QR estándar SUNAT
    const qrTexto = [
      cfg.ruc_emisor,
      c.tipo_doc === 'factura' ? '01' : '03',
      c.serie,
      String(c.correlativo).padStart(8,'0'),
      Number(c.igv||0).toFixed(2),
      Number(c.total).toFixed(2),
      new Date(c.created_at).toISOString().slice(0,10),
    ].join('|');

    await db.from('comprobantes_sunat').update({
      estado_sunat:  'ACEPTADO',
      url_pdf:       info.pdf   || info.url_pdf   || null,
      url_xml:       info.xml   || info.url_xml   || null,
      codigo_hash:   info.hash  || info.hash_cpe  || null,
      codigo_qr:     info.qr    || qrTexto,
      migo_id:       info.id    || info.invoice_id || null,
      mensaje_sunat: info.sunat_description || info.mensaje || 'Aceptado por SUNAT',
    }).eq('id', comprobanteId);

    toast('✅ Emitido a SUNAT', `${c.serie}-${String(c.correlativo).padStart(8,'0')} aceptado`, 'ok');

  } catch (err) {
    await db.from('comprobantes_sunat').update({
      estado_sunat:  'PENDIENTE_ENVIO',
      mensaje_sunat: 'Error: ' + err.message,
    }).eq('id', comprobanteId);
    toast('⚠️ En contingencia', err.message, 'warn', 8000);
    console.error('[FacturaLibre]', err.message);
  }
}

async function reintentarEnvio(comprobanteId) {
  toast('Reintentando envío a SUNAT…', '', 'info', 2000);
  await enviarASunat(comprobanteId);
  moduloFacturacion();
}


async function reintentarEnvio(comprobanteId) {
  toast('Reintentando envío a SUNAT…', '', 'info', 2000);
  await enviarASunat(comprobanteId);
  moduloFacturacion();
}



// ════════════════════════════════════════════════════════════
//  ANULAR (genera Nota de Crédito)
// ════════════════════════════════════════════════════════════
async function anularComprobante(comprobanteId) {
  const c = window._compsCache[comprobanteId];
  if (!c) return;
  const html = `
    <p style="font-size:0.88rem; color:var(--texto); margin-bottom:1rem;">
      Vas a anular <strong>${escapeHtml(c.numero_completo)}</strong> generando una Nota de Crédito por ${soles(c.total)}.
    </p>
    <div style="${ST.grupo}">
      <label style="${ST.label}">Motivo de anulación *</label>
      <input style="${ST.input}" id="anular-motivo" placeholder="Ej: error en el monto" required>
    </div>
    <button style="${ST.btnDanger}; width:100%; padding:0.8rem;" id="btn-anular-conf">Anular y generar Nota de Crédito</button>
  `;
  abrirModal('Anular comprobante', html);

  $('#btn-anular-conf').addEventListener('click', async () => {
    const motivo = $('#anular-motivo').value.trim();
    if (!motivo) { toast('Ingresa el motivo', '', 'warn'); return; }
    const btn = $('#btn-anular-conf'); btn.disabled = true; btn.textContent = 'Procesando…';
    try {
      const resp = await rpc('fn_emitir_comprobante', {
        p_tipo_doc: 'nota_credito',
        p_estadia_id: c.estadia_id, p_venta_directa_id: c.venta_directa_id,
        p_turno_caja_id: SESSION.turnoActivo?.id || null,
        p_ruc_receptor: c.ruc_receptor, p_razon_social_rec: c.razon_social_rec,
        p_total: c.total, p_igv: c.igv,
        p_concepto: 'Anulación: ' + motivo, p_celular: null,
        p_referencia_nc: comprobanteId,
      });
      // Marcar el original como anulado
      await db.from('comprobantes_sunat').update({ estado_sunat: 'ANULADO', mensaje_sunat: motivo }).eq('id', comprobanteId);
      if (API_SUNAT.activa) await enviarASunat(resp.comprobante_id);
      cerrarModal();
      toast('Comprobante anulado', 'NC ' + resp.numero_completo, 'ok');
      moduloFacturacion();
    } catch (err) { toast('Error', err.message, 'error'); btn.disabled = false; btn.textContent = 'Anular y generar Nota de Crédito'; }
  });
}


// ════════════════════════════════════════════════════════════
//  TICKET TÉRMICO 80mm  (impresión)
// ════════════════════════════════════════════════════════════
function construirTicketHTML(c) {
  const base = Number(c.total) - Number(c.igv);
  const fecha = new Date(c.created_at).toLocaleString('es-PE', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
  const h = SESSION.hotel;

  // Texto del QR según formato SUNAT
  const qrTexto = [
    c.ruc_emisor, COD_TIPO[c.tipo_doc] || '03', c.serie, c.correlativo,
    Number(c.igv).toFixed(2), Number(c.total).toFixed(2),
    fecha.slice(0,10), c.ruc_receptor ? '6' : '1', c.ruc_receptor || '-',
  ].join('|');

  return `
    <div style="width:80mm; padding:4mm 3mm; font-family:'Courier New',monospace; color:#000; font-size:11px; line-height:1.35;">
      <div style="text-align:center;">
        <div style="font-size:14px; font-weight:700;">${escapeHtml(h.nombre_comercial || '')}</div>
        <div style="font-size:10px;">${escapeHtml(h.razon_social || '')}</div>
        <div style="font-size:10px;">RUC: ${escapeHtml(c.ruc_emisor || '')}</div>
        ${h.direccion ? `<div style="font-size:9px;">${escapeHtml(h.direccion)}</div>` : ''}
      </div>
      <div style="border-top:1px dashed #000; margin:2mm 0;"></div>
      <div style="text-align:center; font-weight:700; font-size:12px;">${NOMBRE_TIPO[c.tipo_doc] || ''} ELECTRÓNICA</div>
      <div style="text-align:center; font-size:12px; font-weight:700;">${escapeHtml(c.numero_completo)}</div>
      <div style="border-top:1px dashed #000; margin:2mm 0;"></div>
      <div style="font-size:10px;">
        Fecha: ${fecha}<br>
        ${c.ruc_receptor ? `RUC: ${escapeHtml(c.ruc_receptor)}<br>` : ''}
        Cliente: ${escapeHtml(c.razon_social_rec || 'Cliente varios')}
      </div>
      <div style="border-top:1px dashed #000; margin:2mm 0;"></div>
      <table style="width:100%; font-size:10px;">
        <tr><td>Op. Gravada</td><td style="text-align:right;">S/ ${base.toFixed(2)}</td></tr>
        <tr><td>IGV (18%)</td><td style="text-align:right;">S/ ${Number(c.igv).toFixed(2)}</td></tr>
        <tr style="font-weight:700; font-size:12px;"><td>TOTAL</td><td style="text-align:right;">S/ ${Number(c.total).toFixed(2)}</td></tr>
      </table>
      <div style="border-top:1px dashed #000; margin:2mm 0;"></div>
      <div style="text-align:center;" id="qr-ticket-box"></div>
      ${c.hash_cpe ? `<div style="font-size:8px; text-align:center; word-break:break-all;">Hash: ${escapeHtml(c.hash_cpe)}</div>` : ''}
      <div style="text-align:center; font-size:9px; margin-top:2mm;">
        ${c.estado === 'PENDIENTE_ENVIO' ? '*** PENDIENTE DE ENVÍO A SUNAT ***<br>' : ''}
        Representación impresa del comprobante<br>
        electrónico. ¡Gracias por su preferencia!
      </div>
    </div>
  `;
}

function renderQR(contenedor, texto) {
  if (!contenedor) return;
  contenedor.innerHTML = '';
  if (typeof QRCode !== 'undefined') {
    new QRCode(contenedor, { text: texto, width: 110, height: 110, correctLevel: QRCode.CorrectLevel.M });
  }
}

function imprimirTicket(comprobanteId) {
  const c = window._compsCache?.[comprobanteId];
  if (!c) { toast('Error', 'Comprobante no encontrado', 'error'); return; }

  let cont = document.getElementById('ticket-print');
  if (!cont) {
    cont = document.createElement('div');
    cont.id = 'ticket-print';
    document.body.appendChild(cont);
  }
  cont.innerHTML = construirTicketHTML(c);

  // QR
  const qrTexto = [
    c.ruc_emisor, COD_TIPO[c.tipo_doc] || '03', c.serie, c.correlativo,
    Number(c.igv).toFixed(2), Number(c.total).toFixed(2),
    new Date(c.created_at).toISOString().slice(0,10),
    c.ruc_receptor ? '6' : '1', c.ruc_receptor || '-',
  ].join('|');
  renderQR(cont.querySelector('#qr-ticket-box'), c.codigo_qr || qrTexto);

  document.body.classList.add('imprimiendo');
  setTimeout(() => {
    window.print();
    document.body.classList.remove('imprimiendo');
  }, 300);
}


// ════════════════════════════════════════════════════════════
//  DESCARGAR PDF (usa jsPDF, ancho 80mm)
// ════════════════════════════════════════════════════════════
async function descargarPDF(comprobanteId) {
  const c = window._compsCache?.[comprobanteId];
  if (!c) return;
  if (typeof window.jspdf === 'undefined') { toast('Cargando PDF…', 'Intenta de nuevo en un momento', 'warn'); return; }

  const { jsPDF } = window.jspdf;
  const base = Number(c.total) - Number(c.igv);
  const fecha = new Date(c.created_at).toLocaleString('es-PE');
  const h = SESSION.hotel;

  // 80mm de ancho, alto dinámico
  const doc = new jsPDF({ unit: 'mm', format: [80, 200] });
  let y = 8;
  const cx = 40; // centro
  const linea = () => { doc.setLineDashPattern([1,1],0); doc.line(4, y, 76, y); y += 3; };

  doc.setFont('courier', 'bold'); doc.setFontSize(11);
  doc.text(h.nombre_comercial || '', cx, y, { align:'center' }); y += 4;
  doc.setFont('courier','normal'); doc.setFontSize(8);
  doc.text(h.razon_social || '', cx, y, { align:'center' }); y += 3.5;
  doc.text('RUC: ' + (c.ruc_emisor||''), cx, y, { align:'center' }); y += 4;
  linea();
  doc.setFont('courier','bold'); doc.setFontSize(10);
  doc.text((NOMBRE_TIPO[c.tipo_doc]||'') + ' ELECTRÓNICA', cx, y, { align:'center' }); y += 4;
  doc.text(c.numero_completo, cx, y, { align:'center' }); y += 4;
  linea();
  doc.setFont('courier','normal'); doc.setFontSize(8);
  doc.text('Fecha: ' + fecha, 4, y); y += 3.5;
  if (c.ruc_receptor) { doc.text('RUC: ' + c.ruc_receptor, 4, y); y += 3.5; }
  doc.text('Cliente: ' + (c.razon_social_rec||'Cliente varios').slice(0,32), 4, y); y += 4;
  linea();
  doc.text('Op. Gravada', 4, y); doc.text('S/ '+base.toFixed(2), 76, y, {align:'right'}); y += 3.5;
  doc.text('IGV (18%)', 4, y); doc.text('S/ '+Number(c.igv).toFixed(2), 76, y, {align:'right'}); y += 3.5;
  doc.setFont('courier','bold'); doc.setFontSize(10);
  doc.text('TOTAL', 4, y); doc.text('S/ '+Number(c.total).toFixed(2), 76, y, {align:'right'}); y += 5;
  linea();

  // QR como imagen
  try {
    const qrTexto = c.codigo_qr || [c.ruc_emisor, COD_TIPO[c.tipo_doc], c.serie, c.correlativo, Number(c.igv).toFixed(2), Number(c.total).toFixed(2)].join('|');
    const tmp = document.createElement('div');
    new QRCode(tmp, { text: qrTexto, width: 120, height: 120, correctLevel: QRCode.CorrectLevel.M });
    await new Promise(r => setTimeout(r, 150));
    const img = tmp.querySelector('img') || tmp.querySelector('canvas');
    const dataUrl = img.tagName === 'IMG' ? img.src : img.toDataURL();
    doc.addImage(dataUrl, 'PNG', cx-15, y, 30, 30); y += 33;
  } catch {}

  doc.setFont('courier','normal'); doc.setFontSize(7);
  if (c.estado === 'PENDIENTE_ENVIO') { doc.text('*** PENDIENTE DE ENVIO A SUNAT ***', cx, y, {align:'center'}); y += 3; }
  doc.text('Gracias por su preferencia', cx, y, { align:'center' });

  doc.save(`${c.numero_completo}.pdf`);
  toast('PDF descargado', c.numero_completo, 'ok');
}


// ════════════════════════════════════════════════════════════
//  ENVIAR POR WHATSAPP
// ════════════════════════════════════════════════════════════
function enviarComprobanteWA(comprobanteId) {
  const c = window._compsCache?.[comprobanteId];
  if (!c) return;
  const h = SESSION.hotel;
  const base = Number(c.total) - Number(c.igv);

  const texto =
`*${h.nombre_comercial}*
${NOMBRE_TIPO[c.tipo_doc]} ELECTRÓNICA
${c.numero_completo}
------------------------
Cliente: ${c.razon_social_rec || 'Cliente varios'}
${c.ruc_receptor ? 'RUC: ' + c.ruc_receptor + '\n' : ''}Fecha: ${new Date(c.created_at).toLocaleString('es-PE')}
------------------------
Op. Gravada: S/ ${base.toFixed(2)}
IGV (18%): S/ ${Number(c.igv).toFixed(2)}
*TOTAL: S/ ${Number(c.total).toFixed(2)}*
${c.url_pdf ? '\nDescarga tu comprobante: ' + c.url_pdf : ''}
------------------------
¡Gracias por su preferencia!`;

  const html = `
    <div style="${ST.grupo}">
      <label style="${ST.label}">Celular del cliente (con 51 si es necesario)</label>
      <input style="${ST.input}" id="wa-celular" placeholder="51999999999">
    </div>
    <p style="font-size:0.78rem; color:var(--texto-sub); margin-bottom:1rem;">Se abrirá WhatsApp con el detalle del comprobante listo para enviar.</p>
    <button style="${ST.btnPri}" id="btn-wa-enviar">Abrir WhatsApp</button>
  `;
  abrirModal('Enviar por WhatsApp', html, { ancho: '420px' });

  $('#btn-wa-enviar').addEventListener('click', () => {
    let cel = $('#wa-celular').value.trim().replace(/\D/g, '');
    if (cel.length === 9) cel = '51' + cel; // Perú por defecto
    if (cel.length < 8) { toast('Celular inválido', '', 'warn'); return; }
    window.open(`https://wa.me/${cel}?text=${encodeURIComponent(texto)}`, '_blank');
    cerrarModal();
  });
}


// ════════════════════════════════════════════════════════════
//  MÓDULO: CONFIGURACIÓN SUNAT  (solo admin — RLS blindado)
// ════════════════════════════════════════════════════════════
async function moduloSunatConfig() {
  skeleton();
  try {
    let { data: cfg, error } = await db.from('configuracion_sunat')
      .select('*').eq('hotel_id', SESSION.hotel.id).single();

    // Si no existe, crear uno vacío
    if (error || !cfg) {
      const defaults = {
        hotel_id: SESSION.hotel.id,
        ruc_emisor: '', razon_social: '',
        serie_boleta: 'B001', correlativo_boleta: 1,
        serie_factura: 'F001', correlativo_factura: 1,
        serie_nota_credito: 'FC01', correlativo_nota_cred: 1,
        usuario_sol: '', clave_sol: '',
        token_api: '', endpoint_facturador: '',
        modo_produccion: false,
      };
      const { data: nuevo, error: err2 } = await db.from('configuracion_sunat')
        .upsert(defaults, { onConflict:'hotel_id' }).select().single();
      if (err2) throw err2;
      cfg = nuevo || defaults;
    }

    const esMobile = window.innerWidth <= 768;

    if (esMobile) {
      contenido().innerHTML = `
        <!-- Header móvil -->
        <div style="display:flex;align-items:flex-start;gap:0.85rem;margin-bottom:0.85rem;">
          <div style="width:44px;height:44px;border-radius:12px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" style="width:22px;height:22px;"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 0-14.14 0M4.93 19.07a10 10 0 0 0 14.14 0"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>
          </div>
          <div>
            <h1 style="font-size:1.15rem;font-weight:700;color:var(--texto);margin:0;">Configuración SUNAT</h1>
            <p style="font-size:0.7rem;color:var(--texto-sub);margin:0.1rem 0 0;">Configura tus series, correlativos y credenciales tributarias</p>
          </div>
        </div>

        <!-- Banner confidencial -->
        <div id="banner-conf" style="display:flex;align-items:flex-start;justify-content:space-between;gap:0.75rem;background:#FEF2F2;border:1px solid #FECACA;border-radius:12px;padding:0.85rem 1rem;margin-bottom:1rem;">
          <div style="display:flex;align-items:flex-start;gap:0.65rem;">
            <div style="width:30px;height:30px;border-radius:50%;background:#FEF2F2;border:2px solid #FECACA;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:0.1rem;">
              <svg viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <div style="font-size:0.78rem;color:#991B1B;"><strong>Estos datos son confidenciales.</strong> Solo tú (admin) puedes verlos y editarlos. El personal de recepción y otras áreas no tienen acceso.</div>
          </div>
          <button onclick="document.getElementById('banner-conf').style.display='none'" style="background:none;border:none;cursor:pointer;color:#DC2626;font-size:1rem;padding:0;line-height:1;flex-shrink:0;">✕</button>
        </div>

        <form id="form-sunat">

          <!-- Datos de la empresa -->
          <div class="card" style="padding:1.1rem;margin-bottom:0.75rem;">
            <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem;">
              <div style="width:38px;height:38px;border-radius:10px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" style="width:19px;height:19px;"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
              </div>
              <div>
                <div style="font-weight:700;font-size:0.92rem;">Datos de la empresa</div>
                <div style="font-size:0.7rem;color:var(--texto-sub);">RUC y Razón Social con los que se emiten los comprobantes</div>
              </div>
            </div>
            <div style="margin-bottom:0.75rem;">
              <label style="${ST.label}">RUC emisor *</label>
              <input style="${ST.input}" id="s-ruc" value="${escapeHtml(cfg.ruc_emisor||'')}" placeholder="20123456789">
            </div>
            <div>
              <label style="${ST.label}">Razón social *</label>
              <input style="${ST.input}" id="s-rs" value="${escapeHtml(cfg.razon_social||'')}" placeholder="Hotel Las Palmeras SAC">
            </div>
          </div>

          <!-- Series y correlativos -->
          <div class="card" style="padding:1.1rem;margin-bottom:0.75rem;">
            <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem;">
              <div style="width:38px;height:38px;border-radius:10px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" style="width:19px;height:19px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>
              </div>
              <div>
                <div style="font-weight:700;font-size:0.92rem;">Series y correlativos</div>
                <div style="font-size:0.7rem;color:var(--texto-sub);">Configura las series y correlativos para tus comprobantes <span style="color:var(--azul);">electrónicos</span></div>
              </div>
            </div>
            <!-- Boleta -->
            <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.85rem;">
              <div style="width:34px;height:34px;border-radius:9px;background:#F5F3FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2" stroke-linecap="round" style="width:17px;height:17px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <div style="flex:1;display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;">
                <div>
                  <label style="${ST.label}">Serie boleta</label>
                  <input style="${ST.input}" id="s-sb" value="${escapeHtml(cfg.serie_boleta)}" placeholder="B001">
                </div>
                <div>
                  <label style="${ST.label}">Correlativo actual</label>
                  <input style="${ST.input}" id="s-cb" type="number" min="1" value="${cfg.correlativo_boleta}">
                </div>
              </div>
            </div>
            <!-- Factura -->
            <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.85rem;">
              <div style="width:34px;height:34px;border-radius:9px;background:#F0FDF4;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2" stroke-linecap="round" style="width:17px;height:17px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>
              </div>
              <div style="flex:1;display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;">
                <div>
                  <label style="${ST.label}">Serie factura</label>
                  <input style="${ST.input}" id="s-sf" value="${escapeHtml(cfg.serie_factura)}" placeholder="F001">
                </div>
                <div>
                  <label style="${ST.label}">Correlativo actual</label>
                  <input style="${ST.input}" id="s-cf" type="number" min="1" value="${cfg.correlativo_factura}">
                </div>
              </div>
            </div>
            <!-- Nota crédito -->
            <div style="display:flex;align-items:center;gap:0.75rem;">
              <div style="width:34px;height:34px;border-radius:9px;background:#FFF7ED;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg viewBox="0 0 24 24" fill="none" stroke="#EA580C" stroke-width="2" stroke-linecap="round" style="width:17px;height:17px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <div style="flex:1;display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;">
                <div>
                  <label style="${ST.label}">Serie nota crédito</label>
                  <input style="${ST.input}" id="s-snc" value="${escapeHtml(cfg.serie_nota_credito)}" placeholder="FC01">
                </div>
                <div>
                  <label style="${ST.label}">Correlativo actual</label>
                  <input style="${ST.input}" id="s-cnc" type="number" min="1" value="${cfg.correlativo_nota_cred}">
                </div>
              </div>
            </div>
          </div>

          <!-- Autocompletado DNI/RUC -->
          <div class="card" style="padding:1.1rem;margin-bottom:0.75rem;">
            <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.85rem;">
              <div style="width:38px;height:38px;border-radius:10px;background:#F0FDF4;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2" stroke-linecap="round" style="width:19px;height:19px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div>
                <div style="font-weight:700;font-size:0.92rem;">Autocompletado DNI / RUC</div>
                <div style="font-size:0.68rem;color:var(--texto-sub);">Token de Apis.net.pe — el token queda en la BD, nunca expuesto en el código</div>
              </div>
            </div>
            <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:0.75rem 0.9rem;display:flex;align-items:center;gap:0.6rem;">
              <svg viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2" stroke-linecap="round" style="width:18px;height:18px;flex-shrink:0;"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              <div>
                <div style="font-weight:700;font-size:0.8rem;color:#16A34A;">Servicio activo y provisto por HospedaYa</div>
                <div style="font-size:0.7rem;color:#16A34A;">El autocompletado de DNI y RUC está habilitado para tu hotel. No necesitas configurar ningún token.</div>
              </div>
            </div>
          </div>

          <!-- Modo Pruebas Beta -->
          <div style="background:#FEF2F2;border:1.5px solid #FECACA;border-radius:12px;padding:0.85rem 1rem;display:flex;align-items:center;justify-content:space-between;gap:0.75rem;margin-bottom:0.75rem;">
            <div style="display:flex;align-items:center;gap:0.6rem;">
              <span style="width:14px;height:14px;border-radius:50%;background:#DC2626;flex-shrink:0;"></span>
              <div>
                <div style="font-weight:700;font-size:0.85rem;color:#DC2626;">Modo Pruebas (Beta)</div>
                <div style="font-size:0.7rem;color:#DC2626;">Los comprobantes van al ambiente de pruebas de SUNAT</div>
              </div>
            </div>
            <label style="position:relative;display:inline-block;width:44px;height:24px;flex-shrink:0;">
              <input type="checkbox" id="s-modo-pruebas" ${cfg.modo_produccion?'':'checked'} style="opacity:0;width:0;height:0;">
              <span onclick="this.previousElementSibling.click()" style="position:absolute;inset:0;background:${cfg.modo_produccion?'#CBD5E1':'#DC2626'};border-radius:999px;cursor:pointer;transition:0.2s;">
                <span style="position:absolute;width:18px;height:18px;background:white;border-radius:50%;top:3px;left:${cfg.modo_produccion?'23':'3'}px;transition:0.2s;"></span>
              </span>
            </label>
          </div>

          <!-- Credenciales SOL -->
          <div class="card" style="padding:1.1rem;margin-bottom:0.75rem;">
            <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem;">
              <div style="width:38px;height:38px;border-radius:10px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" style="width:19px;height:19px;"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <div>
                <div style="font-weight:700;font-size:0.92rem;">Credenciales SOL (blindadas)</div>
                <div style="font-size:0.7rem;color:var(--texto-sub);">Necesarias para la comunicación con SUNAT</div>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.65rem;margin-bottom:0.65rem;">
              <div>
                <label style="${ST.label}">Usuario SOL</label>
                <div style="position:relative;">
                  <div style="position:absolute;left:0.65rem;top:50%;transform:translateY(-50%);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <input style="${ST.input};padding-left:2rem;" id="s-usol" value="${escapeHtml(cfg.usuario_sol||'')}" placeholder="usuario">
                </div>
              </div>
              <div>
                <label style="${ST.label}">Clave SOL</label>
                <div style="position:relative;">
                  <div style="position:absolute;left:0.65rem;top:50%;transform:translateY(-50%);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </div>
                  <input style="${ST.input};padding-left:2rem;padding-right:2rem;" id="s-csol" type="password" value="${escapeHtml(cfg.clave_sol||'')}" placeholder="••••••••">
                  <button type="button" onclick="togglePass('s-csol',this)" style="position:absolute;right:0.6rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#94A3B8;padding:0;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.65rem;margin-bottom:1rem;">
              <div>
                <label style="${ST.label}">Token API facturador</label>
                <div style="position:relative;">
                  <div style="position:absolute;left:0.65rem;top:50%;transform:translateY(-50%);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                  </div>
                  <input style="${ST.input};padding-left:2rem;" id="s-token" value="${escapeHtml(cfg.token_api||'')}" placeholder="token">
                </div>
              </div>
              <div>
                <label style="${ST.label}">Endpoint facturador</label>
                <div style="position:relative;">
                  <div style="position:absolute;left:0.65rem;top:50%;transform:translateY(-50%);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  </div>
                  <input style="${ST.input};padding-left:2rem;" id="s-endpoint" value="${escapeHtml(cfg.endpoint_facturador||'')}" placeholder="https://...">
                </div>
              </div>
            </div>
            <!-- Botones -->
            <div style="display:grid;grid-template-columns:1fr 1.5fr;gap:0.6rem;">
              <button type="button" onclick="probarConexionSunat()" style="display:flex;align-items:center;justify-content:center;gap:0.4rem;background:white;border:1.5px solid var(--gris-borde);border-radius:10px;padding:0.75rem 0.5rem;font-size:0.8rem;font-weight:600;color:var(--texto-sub);cursor:pointer;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:15px;height:15px;"><path d="M1.8 14.4a11 11 0 0 1 0-4.8"/><path d="M5 17.6a7 7 0 0 1 0-11.2"/><path d="M8.4 20a4 4 0 0 1 0-16"/><circle cx="12" cy="12" r="1"/></svg>
                Probar conexión
              </button>
              <button type="submit" style="display:flex;align-items:center;justify-content:center;gap:0.4rem;background:linear-gradient(135deg,var(--azul),#2563EB);color:white;border:none;border-radius:10px;padding:0.75rem 0.5rem;font-size:0.82rem;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(37,99,235,0.3);">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" style="width:15px;height:15px;"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Guardar configuración
              </button>
            </div>
          </div>

          <!-- Conexión con SUNAT -->
          <div class="card" style="padding:1.1rem;margin-bottom:0.75rem;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:0.75rem;">
              <div style="display:flex;align-items:center;gap:0.75rem;">
                <div style="width:38px;height:38px;border-radius:10px;background:#F0FDF4;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2" stroke-linecap="round" style="width:19px;height:19px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                </div>
                <div>
                  <div style="font-weight:700;font-size:0.88rem;">Conexión con SUNAT</div>
                  <div style="font-size:0.7rem;color:var(--texto-sub);">Listo para emitir comprobantes</div>
                </div>
              </div>
              <button onclick="probarConexionSunat()" style="display:flex;align-items:center;gap:0.35rem;background:#EFF6FF;border:1.5px solid #BFDBFE;border-radius:9px;padding:0.45rem 0.75rem;font-size:0.75rem;font-weight:600;color:var(--azul);cursor:pointer;white-space:nowrap;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px;"><path d="M1.8 14.4a11 11 0 0 1 0-4.8"/><path d="M5 17.6a7 7 0 0 1 0-11.2"/><path d="M8.4 20a4 4 0 0 1 0-16"/><circle cx="12" cy="12" r="1"/></svg>
                Probar conexión
              </button>
            </div>
          </div>

          <!-- Guía rápida -->
          <div style="background:white;border:1px solid var(--gris-borde);border-radius:14px;padding:1rem;display:flex;align-items:center;justify-content:space-between;gap:0.75rem;margin-bottom:1rem;cursor:pointer;">
            <div style="display:flex;align-items:center;gap:0.75rem;">
              <div style="width:38px;height:38px;border-radius:10px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" style="width:19px;height:19px;"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              </div>
              <div>
                <div style="font-weight:700;font-size:0.88rem;">Guía rápida</div>
                <div style="font-size:0.7rem;color:var(--texto-sub);">Sigue estos pasos para configurar correctamente</div>
              </div>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:16px;height:16px;flex-shrink:0;"><polyline points="9 18 15 12 9 6"/></svg>
          </div>

        </form>
      `;

      // Reusar el mismo submit handler que el desktop
      document.getElementById('form-sunat').addEventListener('submit', async e => {
        e.preventDefault();
        const btn = e.submitter || document.querySelector('#form-sunat button[type="submit"]');
        if (btn) { btn.disabled = true; btn.textContent = 'Guardando…'; }
        try {
          const payload = {
            hotel_id:              SESSION.hotel.id,
            ruc_emisor:            document.getElementById('s-ruc')?.value?.trim() || cfg.ruc_emisor,
            razon_social:          document.getElementById('s-rs')?.value?.trim()  || cfg.razon_social,
            serie_boleta:          document.getElementById('s-sb').value.trim(),
            correlativo_boleta:    parseInt(document.getElementById('s-cb').value)||1,
            serie_factura:         document.getElementById('s-sf').value.trim(),
            correlativo_factura:   parseInt(document.getElementById('s-cf').value)||1,
            serie_nota_credito:    document.getElementById('s-snc').value.trim(),
            correlativo_nota_cred: parseInt(document.getElementById('s-cnc').value)||1,
            usuario_sol:           document.getElementById('s-usol').value.trim(),
            clave_sol:             document.getElementById('s-csol').value.trim(),
            token_api:             document.getElementById('s-token').value.trim(),
            endpoint_facturador:   document.getElementById('s-endpoint').value.trim(),
            modo_produccion:       !document.getElementById('s-modo-pruebas')?.checked,
          };
          const { error } = await db.from('configuracion_sunat').upsert(payload, { onConflict:'hotel_id' });
          if (error) throw error;
          await initApiSunat();
          toast('✅ Configuración guardada','Tus credenciales SUNAT están actualizadas.','exito');
        } catch(err) {
          toast('❌ Error al guardar', err.message, 'error');
        } finally {
          if (btn) { btn.disabled = false; btn.textContent = 'Guardar configuración'; }
        }
      });
      return;
    }

    // ══════════ DESKTOP ══════════
    contenido().innerHTML = `
        <div style="display:flex;align-items:center;gap:1rem;">
          <div style="width:52px;height:52px;border-radius:14px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:26px;height:26px;"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 0-14.14 0M4.93 19.07a10 10 0 0 0 14.14 0"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>
          </div>
          <div>
            <h1 style="font-size:1.5rem;font-weight:700;color:var(--texto);margin:0;">Configuración SUNAT</h1>
            <p style="font-size:0.83rem;color:var(--texto-sub);margin:0.2rem 0 0;">Configura tus series, correlativos y credenciales tributarias</p>
          </div>
        </div>
        <div style="font-size:0.8rem;color:var(--texto-sub);display:flex;align-items:center;gap:0.4rem;">
          <span>Inicio</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px;"><polyline points="9 18 15 12 9 6"/></svg>
          <span style="color:var(--texto);font-weight:600;">Config. SUNAT</span>
        </div>
      </div>

      <!-- Banner confidencial -->
      <div id="banner-conf" style="display:flex;align-items:center;justify-content:space-between;gap:1rem;background:#FEF2F2;border:1px solid #FECACA;border-radius:12px;padding:0.85rem 1.1rem;margin-bottom:1.25rem;flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:0.75rem;">
          <div style="width:30px;height:30px;border-radius:50%;background:#FEF2F2;border:2px solid #FECACA;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2" stroke-linecap="round" style="width:15px;height:15px;"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <span style="font-size:0.82rem;color:#991B1B;">
            <strong>Estos datos son confidenciales.</strong> Solo tú (admin) puedes verlos y editarlos. El personal de recepción y otras áreas no tienen acceso.
          </span>
        </div>
        <button onclick="document.getElementById('banner-conf').style.display='none'" style="background:none;border:none;cursor:pointer;color:#DC2626;font-size:1.1rem;padding:0;line-height:1;">✕</button>
      </div>

      <!-- Grid: formulario + sidebar -->
      <div style="display:grid;grid-template-columns:1fr 320px;gap:1.25rem;align-items:start;" class="susc-grid">

        <!-- Columna izquierda: form -->
        <div>
          <form id="form-sunat">

            <!-- Sección: Series y correlativos -->
            <div style="background:white;border:1px solid var(--gris-borde);border-radius:14px;padding:1.5rem;margin-bottom:1.1rem;">
              <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1.25rem;">
                <div style="width:40px;height:40px;border-radius:11px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" style="width:20px;height:20px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                </div>
                <div>
                  <div style="font-weight:700;font-size:1rem;">Series y correlativos</div>
                  <div style="font-size:0.75rem;color:var(--texto-sub);">Configura las series y correlativos para tus comprobantes <span style="color:var(--azul);font-weight:600;">electrónicos</span></div>
                </div>
              </div>

              <!-- Boleta -->
              <div style="display:flex;align-items:flex-end;gap:1rem;margin-bottom:1rem;flex-wrap:wrap;">
                <div style="width:40px;height:40px;border-radius:11px;background:#F5F3FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;align-self:flex-end;margin-bottom:0.2rem;">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2" stroke-linecap="round" style="width:20px;height:20px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div style="flex:1;min-width:150px;">
                  <label style="${ST.label}">Serie boleta</label>
                  <input style="${ST.input}" id="s-sb" value="${escapeHtml(cfg.serie_boleta)}" placeholder="B001">
                </div>
                <div style="flex:1;min-width:150px;">
                  <label style="${ST.label}">Correlativo actual</label>
                  <input style="${ST.input}" id="s-cb" type="number" min="1" value="${cfg.correlativo_boleta}">
                </div>
              </div>

              <!-- Factura -->
              <div style="display:flex;align-items:flex-end;gap:1rem;margin-bottom:1rem;flex-wrap:wrap;">
                <div style="width:40px;height:40px;border-radius:11px;background:#F0FDF4;display:flex;align-items:center;justify-content:center;flex-shrink:0;align-self:flex-end;margin-bottom:0.2rem;">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2" stroke-linecap="round" style="width:20px;height:20px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>
                </div>
                <div style="flex:1;min-width:150px;">
                  <label style="${ST.label}">Serie factura</label>
                  <input style="${ST.input}" id="s-sf" value="${escapeHtml(cfg.serie_factura)}" placeholder="F001">
                </div>
                <div style="flex:1;min-width:150px;">
                  <label style="${ST.label}">Correlativo actual</label>
                  <input style="${ST.input}" id="s-cf" type="number" min="1" value="${cfg.correlativo_factura}">
                </div>
              </div>

              <!-- Nota crédito -->
              <div style="display:flex;align-items:flex-end;gap:1rem;flex-wrap:wrap;">
                <div style="width:40px;height:40px;border-radius:11px;background:#FFF7ED;display:flex;align-items:center;justify-content:center;flex-shrink:0;align-self:flex-end;margin-bottom:0.2rem;">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#EA580C" stroke-width="2" stroke-linecap="round" style="width:20px;height:20px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div style="flex:1;min-width:150px;">
                  <label style="${ST.label}">Serie nota crédito</label>
                  <input style="${ST.input}" id="s-snc" value="${escapeHtml(cfg.serie_nota_credito)}" placeholder="FC01">
                </div>
                <div style="flex:1;min-width:150px;">
                  <label style="${ST.label}">Correlativo actual</label>
                  <input style="${ST.input}" id="s-cnc" type="number" min="1" value="${cfg.correlativo_nota_cred}">
                </div>
              </div>
            </div>

            <!-- Sección: Credenciales SOL -->
            <div style="background:white;border:1px solid var(--gris-borde);border-radius:14px;padding:1.5rem;">
              <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1.25rem;">
                <div style="width:40px;height:40px;border-radius:11px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" style="width:20px;height:20px;"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <div>
                  <div style="font-weight:700;font-size:1rem;">Credenciales SOL (blindadas)</div>
                  <div style="font-size:0.75rem;color:var(--texto-sub);">Necesarias para la comunicación con SUNAT</div>
                </div>
              </div>

              <!-- Usuario + Clave SOL -->
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem;">
                <div>
                  <label style="${ST.label}">Usuario SOL</label>
                  <div style="position:relative;">
                    <div style="position:absolute;left:0.75rem;top:50%;transform:translateY(-50%);">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:15px;height:15px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <input style="${ST.input};padding-left:2.2rem;" id="s-usol" value="${escapeHtml(cfg.usuario_sol||'')}" placeholder="usuario">
                  </div>
                </div>
                <div>
                  <label style="${ST.label}">Clave SOL</label>
                  <div style="position:relative;">
                    <div style="position:absolute;left:0.75rem;top:50%;transform:translateY(-50%);">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2" stroke-linecap="round" style="width:15px;height:15px;"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <input style="${ST.input};padding-left:2.2rem;padding-right:2.5rem;" id="s-csol" type="password" value="${escapeHtml(cfg.clave_sol||'')}" placeholder="••••••••">
                    <button type="button" onclick="togglePass('s-csol',this)" style="position:absolute;right:0.75rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#94A3B8;padding:0;">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:16px;height:16px;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Token + Endpoint -->
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem;">
                <div>
                  <label style="${ST.label}">Token API facturador</label>
                  <div style="position:relative;">
                    <div style="position:absolute;left:0.75rem;top:50%;transform:translateY(-50%);">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:15px;height:15px;"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                    </div>
                    <input style="${ST.input};padding-left:2.2rem;" id="s-token" value="${escapeHtml(cfg.token_api||'')}" placeholder="token">
                  </div>
                </div>
                <div>
                  <label style="${ST.label}">Endpoint facturador</label>
                  <div style="position:relative;">
                    <div style="position:absolute;left:0.75rem;top:50%;transform:translateY(-50%);">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" style="width:15px;height:15px;"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                    </div>
                    <input style="${ST.input};padding-left:2.2rem;" id="s-endpoint" value="${escapeHtml(cfg.endpoint_facturador||'')}" placeholder="https://...">
                  </div>
                </div>
              </div>

              <!-- Botones -->
              <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
                <button type="button" onclick="probarConexionSunat()" style="display:flex;align-items:center;gap:0.5rem;background:white;border:1.5px solid var(--gris-borde);border-radius:10px;padding:0.7rem 1.1rem;font-size:0.85rem;font-weight:600;color:var(--texto-sub);cursor:pointer;">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:16px;height:16px;"><path d="M1.8 14.4a11 11 0 0 1 0-4.8"/><path d="M5 17.6a7 7 0 0 1 0-11.2"/><path d="M8.4 20a4 4 0 0 1 0-16"/><circle cx="12" cy="12" r="1"/></svg>
                  Probar conexión
                </button>
                <button type="submit" style="flex:1;display:flex;align-items:center;justify-content:center;gap:0.5rem;background:linear-gradient(135deg,var(--azul),#2563EB);color:white;border:none;border-radius:10px;padding:0.7rem 1.35rem;font-size:0.88rem;font-weight:600;cursor:pointer;box-shadow:0 4px 14px rgba(37,99,235,0.3);">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" style="width:16px;height:16px;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  Guardar configuración
                </button>
              </div>
            </div>

          </form>
        </div>

        <!-- Sidebar derecho -->
        <div style="display:flex;flex-direction:column;gap:1rem;">

          <!-- Conexión con SUNAT -->
          <div style="background:white;border:1px solid var(--gris-borde);border-radius:14px;padding:1.25rem;position:relative;overflow:hidden;">
            <svg style="position:absolute;bottom:0;right:0;opacity:0.1;" viewBox="0 0 150 80" width="150" height="80" preserveAspectRatio="none">
              <path d="M0 60 Q40 20 80 45 Q120 70 150 35 L150 80 L0 80 Z" fill="#16A34A"/>
            </svg>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:0.75rem;flex-wrap:wrap;">
              <div style="display:flex;align-items:center;gap:0.75rem;">
                <div style="width:14px;height:14px;border-radius:50%;background:#16A34A;box-shadow:0 0 0 4px #BBF7D0;flex-shrink:0;"></div>
                <div>
                  <div style="font-weight:700;font-size:0.92rem;">Conexión con SUNAT</div>
                  <div style="font-size:0.75rem;color:var(--texto-sub);">Listo para emitir comprobantes</div>
                </div>
              </div>
              <button onclick="probarConexionSunat()" style="display:flex;align-items:center;gap:0.4rem;background:#EFF6FF;border:1.5px solid #BFDBFE;border-radius:9px;padding:0.45rem 0.85rem;font-size:0.78rem;font-weight:600;color:var(--azul);cursor:pointer;position:relative;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;"><path d="M1.8 14.4a11 11 0 0 1 0-4.8"/><path d="M5 17.6a7 7 0 0 1 0-11.2"/><path d="M8.4 20a4 4 0 0 1 0-16"/><circle cx="12" cy="12" r="1"/></svg>
                Probar conexión
              </button>
            </div>
          </div>

          <!-- Guía rápida -->
          <div style="background:white;border:1px solid var(--gris-borde);border-radius:14px;padding:1.25rem;">
            <div style="display:flex;align-items:center;gap:0.65rem;margin-bottom:1rem;">
              <div style="width:38px;height:38px;border-radius:10px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" style="width:19px;height:19px;"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              </div>
              <div>
                <div style="font-weight:700;font-size:0.92rem;">Guía rápida</div>
                <div style="font-size:0.73rem;color:var(--texto-sub);">Sigue estos pasos para configurar correctamente</div>
              </div>
            </div>
            ${[
              ['Ingresa tus series y correlativos','Define las series que utilizarás para boletas, facturas y notas de crédito.'],
              ['Configura tus credenciales SOL','Ingresa tu usuario, clave, token y endpoint del facturador.'],
              ['Verifica la conexión','Usa el botón de prueba para validar que todo funcione correctamente.'],
              ['Guarda la configuración','Listo. Tu sistema quedará configurado para emitir comprobantes.'],
            ].map(([titulo, desc], i) => `
              <div style="display:flex;align-items:flex-start;gap:0.75rem;padding:0.65rem 0;${i<3?'border-bottom:1px solid var(--gris-borde);':''}">
                <div style="width:26px;height:26px;border-radius:50%;background:var(--azul);color:white;font-weight:700;font-size:0.75rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;">${i+1}</div>
                <div>
                  <div style="font-weight:600;font-size:0.83rem;">${titulo}</div>
                  <div style="font-size:0.73rem;color:var(--texto-sub);margin-top:0.15rem;">${desc}</div>
                </div>
              </div>`).join('')}
          </div>

          <!-- Tu información segura -->
          <div style="background:white;border:1px solid var(--gris-borde);border-radius:14px;padding:1.1rem;display:flex;align-items:center;gap:0.85rem;position:relative;overflow:hidden;">
            <svg style="position:absolute;bottom:-10px;right:-10px;opacity:0.06;" viewBox="0 0 24 24" fill="#16A34A" style="width:80px;height:80px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <div style="width:40px;height:40px;border-radius:11px;background:#F0FDF4;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <svg viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2" stroke-linecap="round" style="width:20px;height:20px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
            </div>
            <div>
              <div style="font-weight:700;font-size:0.88rem;">Tu información segura</div>
              <div style="font-size:0.73rem;color:var(--texto-sub);">Utilizamos cifrado avanzado para proteger tus credenciales tributarias.</div>
            </div>
          </div>

        </div>
      </div>
    `;

    // Agregar nuevos campos al form después de cargar
    // (se inyectan en la sección de Credenciales SOL que ya existe)

    // Submit del form — ahora guarda todos los campos incluyendo los nuevos
    $('#form-sunat').addEventListener('submit', async e => {
      e.preventDefault();
      const btn = e.submitter || document.querySelector('#form-sunat button[type="submit"]');
      const orig = btn.innerHTML; btn.disabled = true; btn.innerHTML = 'Guardando…';
      try {
        await db.from('configuracion_sunat').update({
          // Empresa
          ruc_emisor:           $('#s-ruc-emisor')?.value?.trim() || cfg.ruc_emisor,
          razon_social:         $('#s-razon-social')?.value?.trim() || cfg.razon_social,
          // Series y correlativos
          serie_boleta:         $('#s-sb').value.trim(),
          correlativo_boleta:   parseInt($('#s-cb').value)||1,
          serie_factura:        $('#s-sf').value.trim(),
          correlativo_factura:  parseInt($('#s-cf').value)||1,
          serie_nota_credito:   $('#s-snc').value.trim(),
          correlativo_nota_cred:parseInt($('#s-cnc').value)||1,
          // Credenciales SOL
          usuario_sol:          $('#s-usol').value.trim(),
          clave_sol:            $('#s-csol').value,
          // Migo
          token_api:            $('#s-token').value.trim(),
          api_endpoint:         $('#s-endpoint').value.trim() || 'https://api.migo.pe/api/v1/',
          proveedor_api:        'migo',
          modo_produccion:      $('#s-modo-prod')?.checked || false,
          // token_dni_ruc ya no se gestiona aquí — lo gestiona el SuperAdmin globalmente
        }).eq('hotel_id', SESSION.hotel.id);

        // Recargar config Migo en memoria
        await cargarConfigSunat();

        toast('✅ Configuración guardada', 'Los cambios están activos', 'ok');
      } catch (err) {
        toast('Error', err.message, 'error');
      } finally {
        btn.disabled = false; btn.innerHTML = orig;
      }
    });

    // Inyectar campos extra (RUC emisor, Razón Social, Token DNI/RUC, Modo Producción)
    // al panel de Credenciales SOL que ya existe en el DOM
    setTimeout(() => {
      const formSunat = document.getElementById('form-sunat');
      if (!formSunat) return;

      // Sección empresa — insertar al inicio del form
      const secEmpresa = document.createElement('div');
      secEmpresa.style.cssText = 'background:white;border:1px solid var(--gris-borde);border-radius:14px;padding:1.5rem;margin-bottom:1.1rem;';
      secEmpresa.innerHTML = `
        <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1.25rem;">
          <div style="width:40px;height:40px;border-radius:11px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" style="width:20px;height:20px;"><path d="M3 21h18M6 21V7l6-4 6 4v14"/></svg>
          </div>
          <div>
            <div style="font-weight:700;font-size:1rem;">Datos de la empresa</div>
            <div style="font-size:0.75rem;color:var(--texto-sub);">RUC y Razón Social con los que se emiten los comprobantes</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 2fr;gap:0.75rem;">
          <div>
            <label style="${ST.label}">RUC emisor *</label>
            <input style="${ST.input}" id="s-ruc-emisor" value="${escapeHtml(cfg.ruc_emisor||'')}" maxlength="11" placeholder="20123456789">
          </div>
          <div>
            <label style="${ST.label}">Razón social *</label>
            <input style="${ST.input}" id="s-razon-social" value="${escapeHtml(cfg.razon_social||'')}" placeholder="Hotel Las Palmeras SAC">
          </div>
        </div>
      `;
      formSunat.insertBefore(secEmpresa, formSunat.firstChild);

      // Sección Token DNI/RUC + Modo Producción — al final del form antes del submit
      const secExtra = document.createElement('div');
      secExtra.style.cssText = 'background:white;border:1px solid var(--gris-borde);border-radius:14px;padding:1.5rem;margin-bottom:1rem;';
      secExtra.innerHTML = `
        <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1.25rem;">
          <div style="width:40px;height:40px;border-radius:11px;background:#F0FDF4;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2" stroke-linecap="round" style="width:20px;height:20px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div>
            <div style="font-weight:700;font-size:1rem;">Autocompletado DNI / RUC</div>
            <div style="font-size:0.75rem;color:var(--texto-sub);">Token de <strong>Apis.net.pe</strong> — el token queda en la BD, nunca expuesto en el código</div>
          </div>
        </div>
        <div style="${ST.grupo}">
          <label style="${ST.label}">Autocompletado DNI / RUC</label>
          <div style="display:flex;align-items:center;gap:0.75rem;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:0.85rem 1rem;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2" stroke-linecap="round" style="width:20px;height:20px;flex-shrink:0;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <div>
              <div style="font-weight:700;font-size:0.85rem;color:#15803D;">Servicio activo y provisto por HospedaYa</div>
              <div style="font-size:0.72rem;color:#16A34A;margin-top:0.15rem;">El autocompletado de DNI y RUC está habilitado para tu hotel. No necesitas configurar ningún token.</div>
            </div>
          </div>
        </div>

        <!-- Modo producción -->
        <div style="display:flex;align-items:center;justify-content:space-between;background:${cfg.modo_produccion?'#F0FDF4':'#FEF2F2'};border:1px solid ${cfg.modo_produccion?'#BBF7D0':'#FECACA'};border-radius:10px;padding:0.85rem 1rem;margin-top:0.75rem;">
          <div>
            <div style="font-weight:700;font-size:0.88rem;color:${cfg.modo_produccion?'#16A34A':'#DC2626'};">${cfg.modo_produccion?'🟢 Modo Producción':'🔴 Modo Pruebas (Beta)'}</div>
            <div style="font-size:0.72rem;color:var(--texto-sub);">${cfg.modo_produccion?'Los comprobantes se declaran a SUNAT real':'Los comprobantes van al ambiente de pruebas de SUNAT'}</div>
          </div>
          <label style="position:relative;display:inline-block;width:44px;height:24px;cursor:pointer;flex-shrink:0;">
            <input type="checkbox" id="s-modo-prod" ${cfg.modo_produccion?'checked':''} style="opacity:0;width:0;height:0;"
              onchange="this.closest('div').style.background=this.checked?'#F0FDF4':'#FEF2F2';this.closest('div').style.borderColor=this.checked?'#BBF7D0':'#FECACA'">
            <span style="position:absolute;cursor:pointer;inset:0;background:${cfg.modo_produccion?'#16A34A':'#D1D5DB'};border-radius:999px;transition:0.3s;">
              <span style="position:absolute;content:'';height:18px;width:18px;left:3px;bottom:3px;background:white;border-radius:50%;transition:0.3s;transform:${cfg.modo_produccion?'translateX(20px)':'translateX(0)'}"></span>
            </span>
          </label>
        </div>
      `;
      // Insertar antes del botón submit
      const btnSubmit = formSunat.querySelector('button[type="submit"]')?.parentElement;
      if (btnSubmit) formSunat.insertBefore(secExtra, btnSubmit.parentElement || btnSubmit);
      else formSunat.appendChild(secExtra);
    }, 50);

  } catch (err) {
    contenido().innerHTML = errorBox('No se pudo cargar la configuración SUNAT', err.message);
  }
}

function togglePass(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  const visible = inp.type === 'text';
  inp.type = visible ? 'password' : 'text';
  btn.style.color = visible ? '#94A3B8' : 'var(--azul)';
}

async function probarConexionSunat() {
  if (!API_SUNAT.activa) {
    toast('Sin facturador', 'Configura el Token FacturaLibre para activar la emisión', 'warn'); return;
  }
  const btn  = document.querySelector('[onclick="probarConexionSunat()"]');
  const orig = btn?.innerHTML;
  if (btn) { btn.disabled=true; btn.innerHTML='Probando…'; }
  try {
    // FacturaLibre — endpoint de verificación de credenciales
    const endpoint = `${API_SUNAT.endpoint}/ping`.replace(/([^:])\/\//g,'$1/');
    const r = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_SUNAT.token}`,
        'Accept': 'application/json',
      },
    });
    if (r.ok) {
      toast('✅ FacturaLibre conectado', 'Credenciales válidas · listo para emitir', 'ok');
    } else {
      const d = await r.json().catch(()=>({}));
      toast('❌ Error de conexión', d.message || `Token inválido (${r.status})`, 'error');
    }
  } catch(err) {
    toast('❌ Sin conexión', err.message, 'error');
  } finally {
    if (btn) { btn.disabled=false; btn.innerHTML=orig; }
  }
}
