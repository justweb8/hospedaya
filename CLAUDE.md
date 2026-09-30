# HospedaYa — contexto para continuar el trabajo

> Última actualización: 30/09/2026. **Actualiza este archivo cada vez que terminemos algo** (sin que el dueño lo pida).

## Cómo trabajamos
- Responder **siempre en español**, simple y sin tecnicismos (el dueño no es programador).
- **El dueño inicia sesión en todo** (app y Supabase). **Nunca escribir sus contraseñas** ni crear cuentas reales.
- Antes de un **cambio visual grande**, mostrar 2 o 3 bocetos para que elija.
- **Probar sin tocar sus datos reales**: usar datos con el prefijo `PRUEBA-Claude` y dejar todo como estaba (si algo real se cambia por error, revertirlo y decirlo).
- Antes de un cambio grande, **copia de seguridad** de la carpeta. No cambiar IDs ni nombres de funciones que usa el código.
- Diseño moderno y responsive, **íconos SVG** (no emojis nuevos), imágenes como archivos (no base64).
- Base de datos: el dueño autorizó hacer cambios en Supabase sin pedir permiso; **siempre** guardar respaldo + el SQL en `sql/` con instrucciones para revertir.
- **No tocar el envío real a SUNAT** hasta que el dueño lo pida (el facturador tiene credenciales reales).
- Revisar punto por punto: cada botón, filtro, "⋮", en celular, tablet y PC, y con cada rol.
- Al terminar algo: contarle qué se arregló y qué no, y actualizar `CLAUDE.md` y `CAMBIOS.md`.

## Qué es el proyecto
Sistema para administrar hoteles (PMS) que se vende por suscripción (SaaS): habitaciones, reservas, calendario, huéspedes, caja por turnos con cierre ciego, tiendita, facturación SUNAT, restaurante y cocina (plan PRO), reportes y personal. Hay un panel **SuperAdmin** para dar de alta hoteles y cobrar suscripciones.

- **Hecho con:** HTML + JavaScript sin frameworks (app web instalable / PWA) y **Supabase** (base de datos, inicio de sesión y funciones del servidor).
- **Dónde se publica:** GitHub Pages. El dueño arrastra el contenido de esta carpeta (`hospedaya-main`) a su repositorio de GitHub.
- **Roles:** SuperAdmin, admin (dueño), recepción, restaurante, cocina, limpieza. La tabla de permisos es `PERMISOS_ROL` en `app.js`.
- **Estado:** en pruebas; el dueño todavía no lo vende.

## Qué archivo hace qué
| Archivo | Para qué sirve |
|---|---|
| `index.html` | Pantalla de inicio de sesión, estructura, menú lateral / barra inferior del celular, buscador, notificaciones, `navegarA()` |
| `app.js` | Casi toda la app: todos los módulos, permisos por rol, SuperAdmin, caja, reservas, restaurante, cocina… |
| `facturacionSunat.js` | Facturación: bandeja de comprobantes, emitir, anular (nota de crédito), imprimir/PDF, configuración SUNAT |
| `supabaseClient.js` | Conexión a Supabase y consultas comunes; `chk()` muestra el error real de la base de datos |
| `config.js` | Dirección y clave **pública** de Supabase, WhatsApp de soporte y datos de pago (se ven en la web, es normal) |
| `style.css` | Estilos extra e impresión de tickets de 80 mm |
| `sw.js` | Caché de la app (para que funcione como app y se actualice) |
| `manifest.json`, `icon-*.png`, `favicon.png`, `apple-touch-icon.png` | Ícono e instalación en el celular |
| `banner.jpg` | Foto de la pantalla de inicio de sesión (`banner.png` ya no se usa) |
| `sql/` | Registro de los cambios hechos en Supabase (ya aplicados) |
| `CAMBIOS.md` | Historial detallado de cambios con fechas |
| `_config.yml` | Hace que GitHub Pages no publique `CLAUDE.md`, `CAMBIOS.md`, `README.md` ni `sql/` |

## En qué nos quedamos (30/09/2026)
- **Hecho y probado (28/09/2026):** revisión completa de los 6 roles, en PC, tablet y celular: dueño, recepción, limpieza, restaurante, cocina y SuperAdmin. Se corrigieron decenas de errores y varios huecos de seguridad en la base de datos. El detalle está en `CAMBIOS.md`.
- **Hecho y probado (30/09/2026):** optimización de velocidad. El arranque tarda ~1 s; la primera visita a cada sección, 0.3–0.9 s; volver a una sección ya vista es instantáneo. Se probó en PC y celular, sin errores (detalle en `CAMBIOS.md`).
- **Hecho y probado (30/09/2026):** en el celular (iPhone), la barra de arriba ya no se mezcla con la hora y la batería, y la barra de abajo respeta la rayita de inicio.
- **Hecho y probado (30/09/2026):** nuevo método de pago **Tarjeta (POS)** en todos los cobros (hotel, tiendita, restaurante, caja, suscripciones) y en caja y reportes.
- **Hecho y probado (30/09/2026):** listas largas. Huéspedes se carga de a 50 con "Ver más" y búsqueda en todos; Comprobantes se ve por mes.
- **Aún no publicado:** los cambios de la app están guardados en esta carpeta, pero **el dueño todavía no los subió a GitHub**. Hay que subir el contenido de `hospedaya-main`; la carpeta `.claude` no hace falta.
- **Datos de prueba que quedaron** en el hotel demo "luna nueva":
  - habitaciones, huéspedes, boletas y pedidos con el prefijo "PRUEBA";
  - la Mesa 2 en "Listo para servir" (S/ 37);
  - el turno de caja del restaurante abierto.

## Pendiente (en orden de prioridad)
1. **Envío automático a SUNAT desde el servidor (obligatorio antes de vender).** La función ya existe en la base de datos: `fn_emitir_a_facturalibre`. Falta:
   - que la app la use en lugar de `enviarASunat()` de `facturacionSunat.js`;
   - permitirla también al rol restaurante (hoy solo admin y recepción);
   - probarla en el modo de pruebas del facturador.

   Mientras tanto, lo que emiten recepción y restaurante queda "Pendiente de envío".
2. **"¿Necesitas ayuda?" en celular:** hoy solo existe en la barra lateral de PC (`abrirAyudaSoporte()`, abre WhatsApp al 975 561 764). Propuesta: ventanita con WhatsApp, correo y videos, también en el menú "Más" del celular. Falta que el dueño diga el correo de soporte y si tiene videos.
   - **Cuenta BCP de ejemplo en `config.js` (`DATOS_PAGO.transferencia` y `bcp_cci`):** es lo que ve un hotel con la suscripción vencida. Hay que poner la cuenta real antes de vender.
3. **Corregir datos:**
   - los RUC mal escritos de los 3 hoteles ("12616469", "3246546464+", "2035879641");
   - la razón social "luan nueva";
   - la tarifa MATRIMONIAL (S/ 20 la noche contra S/ 50 por 3 h);
   - productos con precio menor al costo;
   - la categoría "preservativods";
   - la factura antigua F001-00000002, que tiene un RUC de 9 dígitos.
4. **Fotos de las habitaciones:** hoy se descargan de Unsplash, un sitio externo (`FOTOS_HAB` en `app.js`), y aparecen con retraso. Conviene guardarlas como archivos dentro del proyecto (por ejemplo, en una carpeta `img/`). Para eso hay que pedir permiso al dueño antes de descargarlas.
5. **Antes de vender (capacidad, análisis del 30/09/2026):**
   - pasar a Supabase Pro (US$ 25/mes): el plan gratis no tiene copias de seguridad y se pausa tras 1 semana sin uso;
   - mover la web de GitHub Pages a Cloudflare Pages, Netlify o Vercel (gratis y pensados para uso comercial);
   - HECHO (30/09/2026): Huéspedes se pide al servidor de a 50, con búsqueda en todos, y Comprobantes se ve por mes. Pendiente menor: revisar otras listas cuando crezcan (Personal, historial de caja).
   - Mediciones por sección: 2–9 KB; Reportes, 22 KB; cocina, 2 KB cada 20 s; limpieza, 3.6 KB cada 30 s.
   - Estimado de salida de datos: 0.2–0.4 GB al mes por hotel BÁSICO y 0.6–1 GB por hotel PRO con cocina y limpieza abiertas todo el día.
   - Gratis alcanza para unos 5 hoteles de prueba; Pro, para 200 o más.
6. Probar una boleta nueva en el check-out con el flujo del servidor (la del check-in ya se probó: B001-00000006).
7. Riesgo bajo: todos los empleados del hotel pueden ver la lista `perfiles_usuarios` (nombres y roles).
8. Permitir que el dueño vea los correos de su personal (`fn_get_email_usuario`).
9. Guardar en `sql/` el resto de funciones de Supabase (hoy solo están los cambios de esta revisión).
10. Opcional: los "créditos extra" de comprobantes no se reinician cada mes.

## Datos útiles
- **Probar en la PC:** servidor local en el puerto **5500** (`http://localhost:5500`). En esta PC no hay Python ni Node, así que se usa `..\.claude\servidor-local.ps1` (PowerShell), configurado en `..\.claude\launch.json` con el nombre `hospedaya`.
- **Supabase:** proyecto `gcuicpitzbcwqxlloodm` ("hotel-system"). Los cambios de base de datos se hacen en el SQL Editor del panel web, con la sesión del dueño.
- **Zona segura del celular:** la app se dibuja a pantalla completa. Todo elemento nuevo fijo arriba o abajo (barras, botones flotantes, paneles) debe sumar `env(safe-area-inset-top/bottom, 0px)`. Ver el bloque "ZONA SEGURA" al final del `<style>` de `index.html`.
- **Versión del caché:** `hospedaya-v14` (en `sw.js`). Súbela cada vez que cambies archivos de la app. El caché abre con la copia guardada y la actualiza en segundo plano. Para probar en local, recarga 2 veces después de un cambio.
- **Hotel demo:** "luna nueva" (plan PRO). También existen "hotel cuchurumi" (PRO) y "hotel lupita" (BÁSICO).
- **Respaldo previo a la revisión:** `Downloads\HOSPEDAYA-20260924T025822Z-1-001\RESPALDO-hospedaya-2026-09-28\`.
- **SQL (todos APLICADOS el 28/09/2026):**
  | Archivo | Qué hace |
  |---|---|
  | `00-respaldo-politicas` | Respaldo de las reglas originales (no se ejecuta) |
  | `01-seguridad-roles` | La clave SOL ya no llega a los empleados; restaurante puede emitir; solo el dueño cambia la estructura de las habitaciones |
  | `02-restaurante-caja` | Caja propia y cierre ciego para restaurante; cargar a habitación sin datos del huésped |
  | `03-carta-categorias` | Categorías de la carta (entradas, platos, bebidas, postres, snacks, otros) |
  | `04-productos-precios-solo-admin` | Solo el dueño crea productos o cambia precios |
  | `05-permisos-escritura-por-rol` | Carta, menú y mesas: dueño y restaurante; mantenimientos: dueño y recepción; habitación ocupada solo se libera con check-out |
  | `06-cocina-solo-estado-comanda` | Cocina solo mueve el pedido: Nueva → Preparando → Listo |
  | `07-consulta-documento-segura` | Consulta de DNI/RUC validada; el "ping" ya no gasta consultas |
  | `08-suscripcion-y-token-blindados` | El token de FacturaLibre ya no lo puede pedir ningún usuario |
  | `09-cuota-cpe-mes-peru` | La cuota de comprobantes cuenta el mes de Perú; cada hotel solo ve la suya |
  | `10-pago-con-tarjeta` | (30/09/2026) Se acepta el método de pago "tarjeta" (POS) |
  - **No aplicados:** ninguno.
- **Seguridad ya verificada** (no hay que tocarla):
  - el dueño no puede cambiarse el plan, el vencimiento ni la cuota (`tg_hoteles_guard`);
  - limpieza solo puede pasar una habitación de "limpieza" a "libre" (`tg_habitaciones_guard`);
  - las funciones de SuperAdmin exigen ser SuperAdmin.
- **Nunca** poner contraseñas, claves ni tokens en estos archivos.
