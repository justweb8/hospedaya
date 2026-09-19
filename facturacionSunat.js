// ============================================================
// HospedaYa — facturacionSunat.js
// FASE 5: Facturación SUNAT + tickets térmicos 80mm + WhatsApp
// ============================================================

// ════════════════════════════════════════════════════════════
//  ⚠️ CONFIGURACIÓN DEL FACTURADOR / OSE  (PEGAR AQUÍ TU API)
// ════════════════════════════════════════════════════════════
// Cuando contrates tu facturador electrónico u OSE, edita SOLO
// este bloque. Mientras 'activa' sea false, los comprobantes se
// guardan en estado PENDIENTE_ENVIO y funcionan para imprimir /
// enviar por WhatsApp, pero NO se declaran a SUNAT todavía.
// ────────────────────────────────────────────────────────────
const API_SUNAT = {
  activa: false,               // ← cámbialo a true cuando conectes tu facturador
  url_emision: '',             // ← ej: 'https://api.tufacturador.com/emitir'
  token: '',                   // ← token/API key de tu facturador
};

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
    if (!SESSION.turnoActivo) SESSION.turnoActivo = await getTurnoAbierto();

    const { data: comps, error } = await db
      .from('comprobantes_sunat')
      .select('*')
      .eq('hotel_id', SESSION.hotel.id)
      .order('created_at', { ascending: false })
      .limit(150);
    if (error) throw error;

    contenido().innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem;">
        <div>
          <div class="seccion-titulo">Facturación SUNAT</div>
          <div class="seccion-sub">${(comps||[]).length} comprobante(s) · emisión ilimitada</div>
        </div>
        <button style="${ST.btnPri}; width:auto; padding:0.65rem 1.2rem;" onclick="abrirEmitirComprobante()">+ Emitir comprobante</button>
      </div>

      ${!API_SUNAT.activa ? `
        <div style="background:#EFF6FF; border:1px solid #BFDBFE; border-radius:10px; padding:0.85rem 1rem; margin-bottom:1rem; font-size:0.83rem; color:#1E40AF;">
          ℹ️ Modo sin facturador conectado. Los comprobantes se guardan como <strong>PENDIENTE_ENVIO</strong> y puedes imprimirlos o enviarlos por WhatsApp. Cuando conectes tu OSE, se declararán a SUNAT.
        </div>` : ''}

      <div class="card" style="padding:0; overflow:hidden;">
        <div style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; font-size:0.85rem; min-width:720px;">
            <thead><tr style="background:var(--gris-bg); text-align:left;">
              <th style="${thCss()}">Comprobante</th><th style="${thCss()}">Tipo</th>
              <th style="${thCss()}">Cliente</th><th style="${thCss()}">Total</th>
              <th style="${thCss()}">Estado</th><th style="${thCss()}; text-align:right;">Acciones</th>
            </tr></thead>
            <tbody>
              ${(comps||[]).length === 0 ? `<tr><td colspan="6" style="padding:2rem;text-align:center;color:var(--texto-sub);">Sin comprobantes emitidos aún.</td></tr>` :
              comps.map(c => filaComprobante(c)).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    window._compsCache = {};
    (comps||[]).forEach(c => window._compsCache[c.id] = c);
  } catch (err) {
    contenido().innerHTML = errorBox('No se pudo cargar facturación', err.message);
  }
}

function filaComprobante(c) {
  const estados = {
    ACEPTADO:        badge('Aceptado', '#F0FDF4', '#16A34A'),
    PENDIENTE_ENVIO: badge('Pendiente', '#FFFBEB', '#92400E'),
    RECHAZADO:       badge('Rechazado', '#FEF2F2', '#DC2626'),
    ANULADO:         badge('Anulado', '#F1F5F9', '#64748B'),
  };
  const anulable = c.estado !== 'ANULADO' && c.tipo_doc !== 'nota_credito';
  return `
    <tr>
      <td style="${tdCss()}; font-family:monospace; font-weight:600;">${escapeHtml(c.numero_completo)}</td>
      <td style="${tdCss()}; font-size:0.78rem;">${NOMBRE_TIPO[c.tipo_doc] || c.tipo_doc}</td>
      <td style="${tdCss()}">${escapeHtml(c.razon_social_rec || 'Cliente varios')}</td>
      <td style="${tdCss()}; font-weight:600;">${soles(c.total)}</td>
      <td style="${tdCss()}">${estados[c.estado] || c.estado}</td>
      <td style="${tdCss()}; text-align:right; white-space:nowrap;">
        <button style="${ST.btnSec}; padding:0.35rem 0.55rem; margin-left:0.2rem;" title="Imprimir ticket 80mm" onclick="imprimirTicket('${c.id}')">🖨️</button>
        <button style="${ST.btnSec}; padding:0.35rem 0.55rem; margin-left:0.2rem;" title="Descargar PDF" onclick="descargarPDF('${c.id}')">📄</button>
        <button style="${ST.btnSec}; padding:0.35rem 0.55rem; margin-left:0.2rem;" title="Enviar por WhatsApp" onclick="enviarComprobanteWA('${c.id}')">💬</button>
        ${c.estado === 'PENDIENTE_ENVIO' && API_SUNAT.activa ? `<button style="${ST.btnOk}; padding:0.35rem 0.55rem; margin-left:0.2rem;" title="Reintentar envío" onclick="reintentarEnvio('${c.id}')">↻</button>` : ''}
        ${anulable ? `<button style="${ST.btnDanger}; padding:0.35rem 0.55rem; margin-left:0.2rem;" title="Anular (nota de crédito)" onclick="anularComprobante('${c.id}')">✕</button>` : ''}
      </td>
    </tr>`;
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
async function enviarASunat(comprobanteId) {
  if (!API_SUNAT.activa) return; // modo pendiente

  try {
    const { data: c } = await db.from('comprobantes_sunat').select('*').eq('id', comprobanteId).single();
    const { data: cfg } = await db.from('configuracion_sunat').select('*').eq('hotel_id', SESSION.hotel.id).single();

    // ⚠️ Ajusta el body según lo que pida TU facturador/OSE:
    const r = await fetch(API_SUNAT.url_emision, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(API_SUNAT.token ? { 'Authorization': 'Bearer ' + API_SUNAT.token } : {}),
      },
      body: JSON.stringify({
        tipo: c.tipo_doc, serie: c.serie, correlativo: c.correlativo,
        ruc_emisor: c.ruc_emisor, ruc_receptor: c.ruc_receptor,
        razon_social: c.razon_social_rec, total: c.total, igv: c.igv,
        usuario_sol: cfg.usuario_sol, clave_sol: cfg.clave_sol,
      }),
    });

    if (!r.ok) throw new Error('El facturador respondió ' + r.status);
    const data = await r.json();

    // ⚠️ Ajusta los campos según la respuesta de TU facturador:
    await db.from('comprobantes_sunat').update({
      estado_sunat: 'ACEPTADO',
      url_pdf: data.pdf || data.url_pdf || null,
      url_xml: data.xml || data.url_xml || null,
      hash_cpe: data.hash || data.hash_cpe || null,
      codigo_qr: data.qr || data.codigo_qr || null,
      mensaje_sunat: data.mensaje || 'Aceptado',
    }).eq('id', comprobanteId);

  } catch (err) {
    // Contingencia: queda PENDIENTE_ENVIO para reintentar
    await db.from('comprobantes_sunat').update({
      estado_sunat: 'PENDIENTE_ENVIO',
      mensaje_sunat: 'Pendiente: ' + err.message,
    }).eq('id', comprobanteId);
    toast('Guardado en contingencia', 'Se reintentará el envío a SUNAT', 'warn');
  }
}

async function reintentarEnvio(comprobanteId) {
  toast('Reintentando…', '', 'info', 2000);
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
    const { data: cfg, error } = await db.from('configuracion_sunat')
      .select('*').eq('hotel_id', SESSION.hotel.id).single();
    if (error) throw error;

    contenido().innerHTML = `
      <div class="seccion-titulo">Configuración SUNAT</div>
      <div class="seccion-sub">Series, correlativos y credenciales tributarias</div>

      <div style="background:#FEF2F2; border:1px solid #FECACA; border-radius:10px; padding:0.85rem 1rem; margin-bottom:1.25rem; font-size:0.82rem; color:#991B1B;">
        🔒 Estos datos son confidenciales. Solo tú (admin) puedes verlos y editarlos. Recepción y personal no tienen acceso.
      </div>

      <div class="card" style="max-width:560px;">
        <form id="form-sunat">
          <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; color:var(--azul); margin-bottom:0.65rem;">Series y correlativos</div>
          <div style="${ST.fila}">
            <div style="${ST.grupo}"><label style="${ST.label}">Serie boleta</label><input style="${ST.input}" id="s-sb" value="${escapeHtml(cfg.serie_boleta)}"></div>
            <div style="${ST.grupo}"><label style="${ST.label}">Correlativo actual</label><input style="${ST.input}" id="s-cb" type="number" value="${cfg.correlativo_boleta}"></div>
          </div>
          <div style="${ST.fila}">
            <div style="${ST.grupo}"><label style="${ST.label}">Serie factura</label><input style="${ST.input}" id="s-sf" value="${escapeHtml(cfg.serie_factura)}"></div>
            <div style="${ST.grupo}"><label style="${ST.label}">Correlativo actual</label><input style="${ST.input}" id="s-cf" type="number" value="${cfg.correlativo_factura}"></div>
          </div>
          <div style="${ST.fila}">
            <div style="${ST.grupo}"><label style="${ST.label}">Serie nota crédito</label><input style="${ST.input}" id="s-snc" value="${escapeHtml(cfg.serie_nota_credito)}"></div>
            <div style="${ST.grupo}"><label style="${ST.label}">Correlativo actual</label><input style="${ST.input}" id="s-cnc" type="number" value="${cfg.correlativo_nota_cred}"></div>
          </div>

          <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; color:var(--azul); margin:1.25rem 0 0.65rem;">Credenciales SOL (blindadas)</div>
          <div style="${ST.grupo}"><label style="${ST.label}">Usuario SOL</label><input style="${ST.input}" id="s-usol" value="${escapeHtml(cfg.usuario_sol||'')}"></div>
          <div style="${ST.grupo}"><label style="${ST.label}">Clave SOL</label><input style="${ST.input}" id="s-csol" type="password" value="${escapeHtml(cfg.clave_sol||'')}"></div>
          <div style="${ST.grupo}"><label style="${ST.label}">Token API facturador</label><input style="${ST.input}" id="s-token" value="${escapeHtml(cfg.token_api||'')}"></div>
          <div style="${ST.grupo}"><label style="${ST.label}">Endpoint facturador</label><input style="${ST.input}" id="s-endpoint" value="${escapeHtml(cfg.endpoint_facturador||'')}"></div>

          <button type="submit" style="${ST.btnPri}">Guardar configuración</button>
        </form>
      </div>
    `;

    $('#form-sunat').addEventListener('submit', async e => {
      e.preventDefault();
      try {
        await db.from('configuracion_sunat').update({
          serie_boleta: $('#s-sb').value.trim(), correlativo_boleta: parseInt($('#s-cb').value)||1,
          serie_factura: $('#s-sf').value.trim(), correlativo_factura: parseInt($('#s-cf').value)||1,
          serie_nota_credito: $('#s-snc').value.trim(), correlativo_nota_cred: parseInt($('#s-cnc').value)||1,
          usuario_sol: $('#s-usol').value.trim(), clave_sol: $('#s-csol').value,
          token_api: $('#s-token').value.trim(), endpoint_facturador: $('#s-endpoint').value.trim(),
        }).eq('hotel_id', SESSION.hotel.id);
        toast('Configuración guardada', '', 'ok');
      } catch (err) { toast('Error', err.message, 'error'); }
    });
  } catch (err) {
    contenido().innerHTML = errorBox('No se pudo cargar la configuración SUNAT', err.message);
  }
}
