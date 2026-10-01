---
target: detalle de página PageOps
total_score: 22
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/home/user/wlp-pageops/app/paginas/[id]/page.tsx"
target_fingerprint: "sha256:7ef5abb11cd5b4ee417b6d7fdd6042694d6784a8cda454e7a1517b28a8574b28"
target_path: /home/user/wlp-pageops/app/paginas/[id]/page.tsx
timestamp: 2026-10-01T16-28-45Z
slug: app-paginas-id-page-tsx
---
# Crítica Impeccable — detalle de página (app/paginas/[id]/page.tsx)
Method: dual-agent (A: design review · B: detector + browser)

Nielsen: 1 Estado 3 · 2 Mundo real 3 · 3 Control 2 · 4 Consistencia 2 · 5 Prevención 2 · 6 Reconocer 3 · 7 Eficiencia 1 · 8 Minimalismo 1 · 9 Recuperación 2 · 10 Ayuda 3 = 22/40

Detector: CLI 0 hallazgos; navegador: low-contrast (#A8A192 2.3–2.6:1, #6B6558 sobre negro 3.2:1, blanco sobre verde 3.7:1), undersized-ui-text (labels/chips 10–10.5px). Falsos positivos: kicker-above-heading, overused-font, em-dash (datos), edge-flush (scroller).

Prioridades:
- [P1] Detalle = modelo de datos como formularios siempre abiertos (14 campos arriba del pliegue). Fix: leer primero, editar en línea con autoguardado; config de página en disclosure.
- [P1] Acciones de revisión contradictorias y sin rol (Solicitar #2 + Aprobar a la vez; publicado ofrece Solicitar #1; Producción se autoaprueba). Fix: un CTA por etapa+rol.
- [P1] Etapa repetida 5 veces y editable en 2–3 lugares. Fix: stepper como único control.
- [P2] Página vs trabajo confundidos (links duplicados, notas/actividad dentro de pestañas del trabajo, selector de trabajos al fondo en móvil). Fix: switcher bajo el H1, notas+actividad a nivel página.
- [P2] Accesibilidad/táctil: contraste stone-400, sin anillo de foco, botones de 24px, tabs sin flechas, estado solo por color, labels 10.5px.
- [P3] Fechas mm/dd/yyyy en UI en español.
