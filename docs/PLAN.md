# WLP PageOps — Plan de producto

Herramienta interna para controlar la producción de páginas de welovepaving.com: qué páginas estás trabajando, en qué etapa va cada una, las revisiones del Admin, el QA y las entregas. Reemplaza a la hoja de cálculo actual.

**Estado:** plan cerrado, listo para Fase 0 · **Última revisión:** 30 sep 2026 (ajustado con las capturas de la hoja y el acceso del Admin)

---

## 1. Decisiones

| Tema | Decisión | Por qué |
|---|---|---|
| Qué páginas entran | **Solo las que tú das de alta.** Nada de inventario automático del sitio ni páginas "legacy". | Tú decides qué se controla y cuándo entra. |
| Revisor | Rol **Admin** con **acceso propio desde V1**: entra, ve las páginas y deja su feedback directo en cada revisión. | Así el feedback llega ya separado por puntos y no tienes que copiarlo de otro lado. |
| Construir o adaptar | **App propia**: Next.js + Supabase, desplegada en Vercel, en su propio repo (`wlp-pageops`). | Tu molestia es la UI de tabla, y Airtable o Notion te devuelven otra tabla. El valor está en el ciclo revisión → tareas y en las plantillas por tipo, y ahí una herramienta genérica se queda corta. |
| Story points | **Sí, solo en los trabajos** (no en las tareas), escala 1–13 con anclas tomadas de tus propias páginas y sugeridos por la plantilla. | Trabajas solo y por entregas. Los puntos sirven para medir tu capacidad semanal y mostrarle volumen al Admin, no para calcular la velocity de un equipo. |
| Tipos de página | **Las 4 pestañas de la hoja**: Páginas Principales · Servicios Core · Empleos · Landing Pages. Son datos editables: agregar un tipo no requiere código. | Es como ya organizas el trabajo. |
| Idioma | Interfaz en español. | Es el idioma en que trabajas y en el que está la hoja. |

---

## 2. Tu flujo real (según la hoja)

La hoja tiene 25 páginas. Todas se construyen **directo en WordPress** (los enlaces son previews `?page_id=…&preview=true` o slugs `-v2/`).

```
En progreso ──► En revisión (Admin) ──► En producción / Publicado
                     │                         │
                     └── notas de feedback     └── siguen saliendo pendientes
                                                   (rendimiento, ajustes)
```

Lo que la hoja deja ver y la herramienta tiene que resolver:

| En la hoja hoy | Problema | En la app |
|---|---|---|
| "Fecha de entrega" dice **ENTREGADA** en vez de una fecha | No hay fecha compromiso; solo sabes que ya se entregó | Dos campos: **fecha de entrega** (compromiso) y **entregada el** (automática al pasar a revisión) |
| "Desde" es el día en que terminaste la página, y hay que escribirlo a mano | No se sabe cuánto tiempo lleva cada página en revisión ni cuánto tardó en construirse | **Entregada el** se llena sola al pasar a Revisión Admin, y la actividad registra cada cambio de etapa con fecha |
| "Notas" mezcla feedback del Admin ("revisar saturación de amarillo y negro") con decisiones técnicas ("WP Rocket ya carga el mapa diferido") | El feedback no se puede marcar como resuelto; las decisiones se pierden | **Feedback** con estado dentro de cada revisión, y **Notas** de decisión técnica aparte |
| Páginas "En producción" con pendientes (rendimiento de Home, mapa de Services, carrusel de Testimonials) | Un pendiente de una página ya publicada no tiene dónde vivir | **Trabajo de ajuste** sobre la misma página: la página queda publicada y el ajuste sigue su propio flujo |
| "En Producción" en unas pestañas y "Publicado" en otra | El mismo estado con dos nombres | Una sola etapa: **Publicado** |
| Canal (Bing) solo en Landing Pages | — | Campo **Canal** que aparece solo en landings |
| The Paving Panda Pledge apunta a `/careers-v2/`, igual que Careers; Contractor Partnership en `http://` sin `www` | Errores de captura que nadie detecta | Validación de URL y aviso si dos páginas comparten enlace |

---

## 3. Modelo de datos

```
Página (la das de alta tú)
 ├─ Trabajo (tipo: Página nueva/V2 | Ajuste)
 │   ├─ Tareas
 │   ├─ Revisiones ── Feedback ──► Tarea
 │   ├─ QA (copiado de la plantilla)
 │   └─ Actividad (automática)
 └─ Notas (decisiones técnicas, indicaciones del Admin)
```

### Página

| Campo | Notas |
|---|---|
| Título, tipo | El tipo es una de las 4 pestañas. |
| Canal | Solo en Landing Pages (Bing, Google…). |
| ID de WordPress | Con el ID se generan solos los enlaces de **Preview** y **Editar en WP**. |
| URL pública | El slug final (`/careers-v2/`, `/lp-concrete-repair/`). |
| Documentación | Enlace opcional (las carpetas actuales son de antes del protocolo nuevo y no se importan). |
| Figma | Opcional. |

### Trabajo

| Campo | Notas |
|---|---|
| Título, página, tipo de trabajo | **Página nueva/V2**: el trabajo principal. **Ajuste**: cambios sobre una página ya publicada. |
| Etapa | Ver §4. |
| Bloqueado + motivo + desde | Bandera independiente de la etapa. |
| Prioridad | Urgente · Alta · Normal · Baja |
| Story points | Ver §7. |
| Inicio, fecha de entrega | Fechas planeadas. Las reales (inició, entregó, se publicó) salen de la actividad. |

### El resto

- **Tarea**: título, categoría, hecha, crítica (sí/no), fecha opcional y feedback de origen.
  Categorías: Diseño/UI · Color · Responsive · Copy · Rendimiento · Imágenes · SEO · Accesibilidad · Tracking · WordPress · Formularios · Bug.
- **Revisión**: número (#1, #2…), fecha de solicitud, de respuesta y de cierre, y resultado (Aprobado / Cambios solicitados).
- **Feedback**: texto, estado (Pendiente / Resuelto / Descartado + motivo) y tarea vinculada.
- **Nota**: texto, autor (Tú / Admin), tipo (Decisión técnica · Indicación del Admin · General) y si está fijada.
  Ejemplo real: *"El mapa era un iframe con carga diferida y tardaba; se cambió por imagen. WP Rocket ya carga el hero diferido."*
- **Actividad**: registra con fecha y hora cada cambio de etapa, bloqueo, fecha, SP, URL y revisión. Se guarda con triggers en la base de datos, así que no depende de que la interfaz se acuerde de registrarlo. **De aquí salen todas las métricas.**

---

## 4. Etapas

| Etapa | Qué significa | Equivale en la hoja | Al entrar, la app avisa si… |
|---|---|---|---|
| Por hacer | Definida, sin empezar | — | — |
| En curso | La estás construyendo en WordPress | En progreso | — |
| QA | Tu revisión contra el checklist antes de entregar | — | — |
| Revisión Admin | Entregada, esperando al Admin (se abre la Revisión #N) | En revisión | el QA no está completo |
| Cambios solicitados | El Admin pidió cambios y hay feedback pendiente | (hoy vive en Notas) | — |
| Publicado | En producción | En Producción / Publicado | hay feedback pendiente o tareas críticas abiertas |
| Archivado | Cancelada o reemplazada | — | — |

- Son **avisos, no bloqueos**. Puedes seguir adelante, y la actividad deja registrado que se saltó la regla.
- **Bloqueado** es una bandera que se puede activar en cualquier etapa. Motivos: Decisión del Admin · Contenido/copy · Fotos/video · Accesos · Dependencia técnica (plugin, formulario) · Otro.
- Un **Ajuste** recorre las mismas etapas, pero la página sigue marcada como publicada mientras tanto.

---

## 5. Revisión del Admin

1. Mueves el trabajo a **Revisión Admin**. Se abre la Revisión #N con la fecha y el enlace de preview listo para mandar.
2. El Admin entra a la revisión y deja su feedback **punto por punto** (también puedes capturarlo tú si te llega por otro lado). Por ejemplo, la nota de The Paving Panda Pledge se vuelve 3 puntos: saturación de amarillos · negro de alerta · secciones con colores claros.
3. Cada punto se convierte en tarea con un clic, o se descarta con un motivo.
4. Si todo quedó aprobado, el trabajo pasa a Publicado. Si hay cambios, pasa a Cambios solicitados; cuando los resuelves, pides otra revisión (#N+1).

Resultado: sabes cuántas rondas lleva cada página, cuántos días lleva esperando al Admin (hoy hay 7 páginas en revisión desde el 24–25 de septiembre) y qué tipo de cambios pide más. Por las notas actuales, **color/saturación** y **rendimiento** ya se ven como los temas que más se repiten.

---

## 6. QA antes de entregar

Checklist base para todas las páginas, sacado de lo que el Admin ya ha señalado y de tus propias notas técnicas:

- **Rendimiento**
  - PageSpeed móvil ≥ objetivo (falta definir el número)
  - Imagen del hero optimizada; decidir si se muestra en celular
  - Iframes y mapas: imagen estática o carga diferida
  - CSS/JS: bloque de código vs. hook, compatible con el diferido de WP Rocket
- **Color y diseño**
  - Amarillo y negro con la saturación de la guía
  - Secciones claras revisadas
  - Consistente con las demás páginas V2
- **Responsive**: móvil, tablet y escritorio; sin overflow horizontal
- **Contenido**: copy revisado, CTAs y teléfono correctos
- **SEO**: title, meta description, un solo H1, slug final
- **Técnico**: enlaces probados, formulario enviando, sin errores de consola
- **Accesibilidad**: alt text, contraste, foco visible

**Extras según tipo:**
- **Landing Pages**: tracking del canal, thank-you page, key events, UTM
- **Empleos**: formulario de aplicación funcionando y datos del puesto correctos

Todo el checklist es editable. Se **copia** a cada trabajo cuando se crea, para que un cambio en la plantilla no altere trabajos ya terminados.

---

## 7. Story points

- Van **en el trabajo, no en las tareas**.
- Miden **tu esfuerzo**. El tiempo esperando al Admin lo mide la actividad por separado.
- Cuentan como completados cuando el trabajo llega a **Revisión Admin**, que es cuando terminó tu parte. Los cambios solicitados se registran como tareas dentro del mismo trabajo.
- La plantilla sugiere un valor y tú lo ajustas; cualquier cambio queda en la actividad.

| SP | Tamaño | Ancla (de tu hoja) |
|---|---|---|
| 1 | Ajuste puntual | Quitar la imagen del hero en celular (Home) |
| 2 | Página utilitaria o ronda de cambios de color | 404, Thank You; ajustar saturación de Careers |
| 3 | Página desde plantilla existente | Una oferta de Empleos (CDL Commercial Drivers) o una landing de la serie LP Concrete |
| 5 | Página V2 estándar | About Us, Corporate Information, Our Values |
| 8 | Página V2 con componente nuevo o pesado | Service Areas (mapa), Projects / Project Gallery |
| 13 | Demasiado grande: hay que dividirlo | — |

Para qué sirven: capacidad semanal (comprometidos vs. entregados), reporte de volumen para el Admin y estimar antes de comprometer una fecha de entrega.

---

## 8. Pantallas (V1)

1. **Inicio**
   - Atención: trabajos vencidos, por vencer (3 días), bloqueados (con días), esperando al Admin más de 2 días, cambios solicitados sin tocar, ajustes abiertos de páginas publicadas
   - Semana: SP comprometidos vs. entregados
2. **Páginas**
   - Pestañas por tipo, igual que la hoja, más una pestaña "Todas"
   - Columnas: Página · Etapa · En esta etapa desde · Entrega · SP · ⚠
   - Filtros: etapa, bloqueado, vencido, canal
   - Un clic abre el panel lateral
   - Botón **Nueva página**: título, tipo, ID de WP → se crea con su trabajo, tareas y QA de la plantilla
3. **Detalle de página**
   - Encabezado con botones: Preview ↗ · Editar en WP ↗ · Pública ↗ · Documentación ↗
   - Trabajo activo: barra de etapas, fechas, SP y bloqueo
   - Pestañas: Tareas · Revisiones · QA · Notas · Actividad
   - Historial de trabajos anteriores (la V2, los ajustes)
4. **Tablero**: columnas = etapas; tarjetas = trabajos. Arrastrar una tarjeta cambia su etapa (con los avisos de §4).
5. **Revisiones**
   - Esperando al Admin (días de espera)
   - Cambios solicitados (feedback pendiente)
6. **Vista del Admin**: lo mismo en modo lectura, más poder dejar feedback en revisiones abiertas, dejar notas y marcar una revisión como Aprobada o con Cambios.

Dirección visual: estilo Linear. Fondo claro, tablas densas pero limpias, pills de estado y un panel lateral para editar sin salir de la lista.

---

## 9. Stack

| Pieza | Elección |
|---|---|
| App | Next.js (App Router) + TypeScript, Tailwind + shadcn/ui, dnd-kit para el tablero |
| Datos | Supabase: Postgres, login por magic link, RLS con roles `produccion` / `admin`, Storage para archivos (Fase 2) |
| Actividad | Triggers de Postgres |
| Deploy | Vercel, con un preview por rama |
| Código | Repo nuevo `wlp-pageops` |

**Hosting y costos:**
- El plan gratis de Supabase alcanza de sobra. Pausa los proyectos tras 7 días sin uso, lo que no aplica si lo usas a diario.
- **Vercel Hobby no sirve para esto.** Sus reglas cuentan como uso comercial cualquier proyecto hecho por alguien a quien le pagan por ese trabajo, aunque sea una herramienta interna. Una herramienta para tu trabajo en WLP entra ahí.
- Opciones: **Vercel Pro** (de pago, idealmente cubierto por WLP) o **Netlify**, cuyo plan gratis no tiene esa restricción y soporta Next.js. Decisión pendiente (§13).

---

## 10. Migración desde la hoja

Las 25 filas de la hoja ya están transcritas y normalizadas en [`datos-iniciales.csv`](datos-iniciales.csv):

- **Estado → etapa**: En progreso → En curso · En revisión → Revisión Admin · En Producción / Publicado → Publicado.
- **Enlace**: se extrae el ID de WordPress cuando es un preview; si no, queda como URL pública.
- **Notas**:
  - En páginas **en revisión**, se vuelven feedback de la Revisión #1.
  - En páginas **publicadas**, se vuelven decisión técnica y, si queda algo pendiente, un trabajo de Ajuste abierto.
- **Fecha de entrega "ENTREGADA"**: no se importa como fecha.
- **"Desde"** es el día en que terminaste la página: se importa como **Entregada el**.
- Las carpetas de documentación no se importan (son de antes del protocolo nuevo).

---

## 11. Fases

| Fase | Alcance | Lista cuando… |
|---|---|---|
| **0 — Tus datos en la nueva UI** | Repo, esquema, importación de las 25 páginas, pantallas Páginas y Detalle en modo lectura, en un preview de Vercel | Ves tus páginas organizadas y decides si la estructura te convence |
| **1 — Reemplaza la hoja** | Acceso del Admin (ver páginas, dejar feedback y notas), edición completa, nueva página desde plantilla, etapas + actividad, tareas, revisiones con feedback → tarea, QA, notas, bloqueos, tablero, cola de revisiones, inicio con "Atención", login | Llevas 2 semanas sin abrir la hoja |
| **1.1** | Calendario de entregas, Cmd+K, duplicar página (p. ej. otra oferta de empleo u otra LP), plantillas editables desde la UI | — |
| **2** | Reportes (SP por semana, tiempo por etapa, días esperando al Admin, rondas de revisión, temas de feedback más frecuentes); avisos por correo al Admin cuando hay algo para revisar | — |
| **3** | Integraciones: WordPress REST (título y estado por ID), PageSpeed Insights | — |

## 12. Fuera de alcance por ahora

Inventario automático del sitio, registro de horas, SP por tarea, comentarios tipo chat y múltiples equipos.

## 13. Pendiente de tu lado

1. **Hosting**: Vercel Pro (pagado por WLP) o Netlify gratis.
2. **OK para crear el repo `wlp-pageops`.**
