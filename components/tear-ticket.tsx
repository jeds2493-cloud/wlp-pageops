"use client";

// Adaptado de "Tear Ticket" de React Bits (reactbits.dev/micro/tear-ticket): geometría
// de la perforación, fibras que se estiran y revientan, bisagra en la muesca y caída con
// gravedad. Cambios para PageOps: sin inclinación ni tilt 3D, tamaño medido del propio
// ticket (crece con el texto) en vez de ancho/alto fijos, y al cortarse cierra el ticket.

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Pencil, Scissors } from "lucide-react";
import { closeTicket, updateTicket } from "@/app/actions";
import { formatDateTime } from "@/lib/logic";
import { PRIORITIES, type Ticket } from "@/lib/types";
import { buttonCls, SubmitButton } from "./edit";
import { Badge, inputCls } from "./ui";

const GRAVITY = 2400;
const RETRACT = 0.17;
const STUB = 104; // ancho del talón
const RADIUS = 14; // radio de las esquinas (rounded-wlp)
const NOTCH = 9; // muescas arriba y abajo de la perforación
const HOLE = 6; // diámetro de cada perforación
const ROUGH = 0.6;
const TEAR_ANGLE = 30;
const STRETCH = 30;
const RESISTANCE = 0.45;
const FIBRE = "#1d1c1a"; // fibras de asfalto sobre el concreto
const EDGE = "rgb(255 255 255 / 0.07)";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const rad = (deg: number) => (deg * Math.PI) / 180;
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const noise = (seed: number) => {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const f = (n: number) => n.toFixed(2);

interface Bridge {
  y0: number;
  y1: number;
  mid: number;
  pts: [number, number][];
  x: number;
  y: number;
}

function buildGeometry(W: number, H: number) {
  const R = RADIUS;
  const notch = NOTCH;
  const hole = HOLE;
  const x = W - STUB;
  const cross = H;
  const hr = hole / 2;
  const n = Math.max(1, Math.round((H - 2 * notch) / 14));
  const span = cross - 2 * notch;
  const bridge = Math.max(2, (span - n * hole) / (n + 1));
  const random = noise(n * 7919 + Math.round(cross));
  const pt = (u: number, v: number) => `${f(u)},${f(v)}`;
  const arc = (r: number, sweep: number, u: number, v: number) => `A${f(r)},${f(r)} 0 0 ${sweep} ${pt(u, v)}`;
  const bridges: Bridge[] = [];
  for (let i = 0; i <= n; i += 1) {
    const y0 = notch + i * (bridge + hole);
    const y1 = y0 + bridge;
    const steps = Math.max(2, Math.round(bridge / 2.2));
    const pts: [number, number][] = [];
    for (let k = 1; k < steps; k += 1) pts.push([x + (random() - 0.5) * 2 * ROUGH, y0 + (bridge * k) / steps]);
    bridges.push({ y0, y1, mid: (y0 + y1) / 2, pts, x, y: (y0 + y1) / 2 });
  }
  let body = `M${pt(R, 0)}L${pt(x - notch, 0)}${arc(notch, 0, x, notch)}`;
  bridges.forEach((b, i) => {
    b.pts.forEach((p) => {
      body += `L${pt(p[0], p[1])}`;
    });
    body += `L${pt(x, b.y1)}`;
    if (i < n) body += arc(hr, 0, x, b.y1 + hole);
  });
  body += `${arc(notch, 0, x - notch, cross)}L${pt(R, cross)}${arc(R, 1, 0, cross - R)}L${pt(0, R)}${arc(R, 1, R, 0)}Z`;
  let stub = `M${pt(x + notch, 0)}L${pt(W - R, 0)}${arc(R, 1, W, R)}L${pt(W, cross - R)}${arc(R, 1, W - R, cross)}L${pt(x + notch, cross)}${arc(notch, 0, x, cross - notch)}`;
  for (let i = n; i >= 0; i -= 1) {
    const b = bridges[i];
    for (let k = b.pts.length - 1; k >= 0; k -= 1) stub += `L${pt(b.pts[k][0], b.pts[k][1])}`;
    stub += `L${pt(x, b.y0)}`;
    if (i > 0) stub += arc(hr, 0, x, b.y0 - hole);
  }
  stub += `${arc(notch, 0, x + notch, 0)}Z`;
  const ends = [
    { x, y: notch, v: notch },
    { x, y: cross - notch, v: cross - notch },
  ];
  const bodyOutline = `M${pt(x, cross - notch)}${arc(notch, 0, x - notch, cross)}L${pt(R, cross)}${arc(R, 1, 0, cross - R)}L${pt(0, R)}${arc(R, 1, R, 0)}L${pt(x - notch, 0)}${arc(notch, 0, x, notch)}`;
  return { cross, body, stub, bridges, ends, bodyOutline };
}

type Phase = "idle" | "held" | "free" | "drop" | "return";

interface Sim {
  raf: number;
  last: number;
  phase: Phase;
  id: number | null;
  sign: number;
  hinge: { x: number; y: number };
  hingeV: number;
  grab: { x: number; y: number };
  start: { x: number; y: number };
  point: { x: number; y: number };
  a0: number;
  theta: number;
  thetaV: number;
  sx: number;
  sy: number;
  vx: number;
  vy: number;
  spin: number;
  pvx: number;
  pvy: number;
  pt: number;
  fade: number;
  age: number;
  bx: number;
  bv: number;
  snapped: boolean[];
  snapAt: number[];
  span: number[];
}

const freshSim = (): Sim => ({
  raf: 0,
  last: 0,
  phase: "idle",
  id: null,
  sign: 1,
  hinge: { x: 0, y: 0 },
  hingeV: 0,
  grab: { x: 0, y: 0 },
  start: { x: 0, y: 0 },
  point: { x: 0, y: 0 },
  a0: 0,
  theta: 0,
  thetaV: 0,
  sx: 0,
  sy: 0,
  vx: 0,
  vy: 0,
  spin: 0,
  pvx: 0,
  pvy: 0,
  pt: 0,
  fade: 1,
  age: 0,
  bx: 0,
  bv: 0,
  snapped: [],
  snapAt: [],
  span: [],
});

const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function TearTicket({ ticket, pageTitle, pages }: { ticket: Ticket; pageTitle?: string; pages: { id: string; title: string }[] }) {
  const [editing, setEditing] = useState(false);
  const editBtnRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const stubRef = useRef<HTMLDivElement>(null);
  const fibres = useRef<(SVGPathElement | null)[]>([]);
  const sim = useRef<Sim>(freshSim());
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [grabbing, setGrabbing] = useState(false);
  const [gone, setGone] = useState(false);
  const closing = useRef(false);

  // El ticket se mide a sí mismo: la geometría sigue al texto (no hay alto fijo).
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => setSize({ w: el.offsetWidth, h: el.offsetHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const geo = useMemo(() => (size.w > STUB + 40 && size.h > 2 * NOTCH + 10 ? buildGeometry(size.w, size.h) : null), [size]);
  const geoRef = useRef(geo);
  useEffect(() => {
    geoRef.current = geo;
  }, [geo]);

  const finish = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    if (stubRef.current) stubRef.current.style.visibility = "hidden";
    setGone(true);
    setTimeout(() => void closeTicket(ticket.id), 280);
  }, [ticket.id]);

  const paint = useCallback((now: number) => {
    const s = sim.current;
    const g = geoRef.current;
    if (!g) return false;
    if (stubRef.current) {
      stubRef.current.style.transform = `translate(${s.sx.toFixed(2)}px, ${s.sy.toFixed(2)}px) rotate(${((s.theta * s.sign * 180) / Math.PI).toFixed(3)}deg)`;
      stubRef.current.style.opacity = s.fade.toFixed(3);
    }
    if (bodyRef.current) bodyRef.current.style.transform = `translateX(${s.bx.toFixed(2)}px)`;
    const cos = Math.cos(s.theta * s.sign);
    const sin = Math.sin(s.theta * s.sign);
    const ly = 1.6;
    let busy = false;
    g.bridges.forEach((b, i) => {
      const dx = b.x - s.hinge.x;
      const dy = b.y - s.hinge.y;
      const tx = s.hinge.x + dx * cos - dy * sin + s.sx;
      const ty = s.hinge.y + dx * sin + dy * cos + s.sy;
      const ox = b.x + s.bx;
      const oy = b.y;
      const gx = tx - ox;
      const gy = ty - oy;
      const gap = Math.hypot(gx, gy);
      const near = fibres.current[i * 2];
      const far = fibres.current[i * 2 + 1];
      if (!near || !far) return;
      const live = s.phase !== "idle";
      if (!s.snapped[i]) {
        if (!live || gap < 0.35) {
          near.style.opacity = "0";
          far.style.opacity = "0";
          return;
        }
        const k = clamp(gap / STRETCH, 0, 1);
        const sag = gap * 0.18;
        const w = (1.7 - 1.15 * k).toFixed(2);
        const sx = gx / 2;
        const sy = sag + gy / 2;
        near.setAttribute("d", `M${f(ox)},${f(oy - ly)}Q${f(ox + sx)},${f(oy - ly + sy)} ${f(tx)},${f(ty - ly)}`);
        far.setAttribute("d", `M${f(ox)},${f(oy + ly)}Q${f(ox + gx - sx)},${f(oy + ly + gy - sy)} ${f(tx)},${f(ty + ly)}`);
        near.style.strokeWidth = w;
        far.style.strokeWidth = w;
        near.style.opacity = "1";
        far.style.opacity = "1";
        s.span[i] = gap;
        return;
      }
      const t = (now - s.snapAt[i]) / 1000 / RETRACT;
      if (!live || t >= 1 || !s.snapAt[i]) {
        near.style.opacity = "0";
        far.style.opacity = "0";
        return;
      }
      busy = true;
      const left = (1 - t) * (1 - t);
      const len = (s.span[i] || STRETCH) * 0.5 * left;
      const ux = gap > 0.01 ? gx / gap : 1;
      const uy = gap > 0.01 ? gy / gap : 0;
      near.setAttribute("d", `M${f(ox)},${f(oy)}L${f(ox + ux * len)},${f(oy + uy * len)}`);
      far.setAttribute("d", `M${f(tx)},${f(ty)}L${f(tx - ux * len)},${f(ty - uy * len)}`);
      near.style.strokeWidth = "0.9";
      far.style.strokeWidth = "0.9";
      near.style.opacity = left.toFixed(2);
      far.style.opacity = left.toFixed(2);
    });
    return busy;
  }, []);

  const step = useCallback(
    function tick(now: number) {
      const s = sim.current;
      const g = geoRef.current;
      if (!g) return;
      const dt = clamp((now - s.last) / 1000, 0.001, 0.034);
      s.last = now;
      const limit = rad(TEAR_ANGLE);
      if (s.phase === "held") {
        const count = g.bridges.length;
        let intact = 0;
        for (let i = 0; i < count; i += 1) if (!s.snapped[i]) intact += 1;
        const hold = count ? intact / count : 0;
        const follow = 0.92 * (1 - clamp(RESISTANCE, 0, 0.95) * hold);
        const a = Math.atan2(s.point.y - s.hinge.y, s.point.x - s.hinge.x);
        const want = clamp(wrap(a - s.a0) * s.sign * follow, 0, limit + 0.1);
        s.theta += (want - s.theta) * (1 - Math.exp(-dt / 0.035));
        const away = clamp((s.point.x - s.start.x || 0) * 0.05, -2, 4);
        const side = clamp((s.point.y - s.start.y || 0) * 0.05, -3, 3);
        s.sx += (away - s.sx) * (1 - Math.exp(-dt / 0.05));
        s.sy += (side - s.sy) * (1 - Math.exp(-dt / 0.05));
        const slack = Math.hypot(s.sx, s.sy);
        let left = 0;
        g.bridges.forEach((b, i) => {
          if (s.snapped[i]) return;
          const d = Math.abs(b.mid - s.hingeV);
          if (2 * d * Math.sin(s.theta / 2) + slack > STRETCH || s.theta >= limit) {
            s.snapped[i] = true;
            s.snapAt[i] = now;
            s.bv -= 560 / g.bridges.length;
          } else left += 1;
        });
        if (left === 0) {
          s.phase = "free";
          s.bv -= 150;
        }
      } else if (s.phase === "free") {
        const cos = Math.cos(s.theta * s.sign);
        const sin = Math.sin(s.theta * s.sign);
        const gx = s.grab.x - s.hinge.x;
        const gy = s.grab.y - s.hinge.y;
        const wx = s.point.x - s.hinge.x - (gx * cos - gy * sin);
        const wy = s.point.y - s.hinge.y - (gx * sin + gy * cos);
        s.sx += (wx - s.sx) * (1 - Math.exp(-dt / 0.045));
        s.sy += (wy - s.sy) * (1 - Math.exp(-dt / 0.045));
        const hang = limit * 0.55 + clamp(s.pvx * 0.0009 * s.sign, -0.3, 0.3);
        s.theta += (hang - s.theta) * (1 - Math.exp(-dt / 0.12));
      } else if (s.phase === "drop") {
        s.age += dt;
        s.vy += GRAVITY * dt;
        s.sx += s.vx * dt;
        s.sy += s.vy * dt;
        s.theta += s.spin * dt;
        if (s.age > 0.16) s.fade = clamp(1 - (s.age - 0.16) / 0.42, 0, 1);
        if (s.fade <= 0) {
          s.phase = "idle";
          finish();
        }
      } else if (s.phase === "return") {
        s.thetaV += (-300 * s.theta - 24 * s.thetaV) * dt;
        s.theta += s.thetaV * dt;
        s.sx += (0 - s.sx) * (1 - Math.exp(-dt / 0.07));
        s.sy += (0 - s.sy) * (1 - Math.exp(-dt / 0.07));
        if (Math.abs(s.theta) < 0.0008 && Math.abs(s.thetaV) < 0.01 && Math.hypot(s.sx, s.sy) < 0.05) {
          Object.assign(s, {
            theta: 0,
            thetaV: 0,
            sx: 0,
            sy: 0,
            phase: "idle" as Phase,
          });
          s.snapped = [];
          s.snapAt = [];
        }
      }
      s.bv += (-520 * s.bx - 30 * s.bv) * dt;
      s.bx += s.bv * dt;
      const busy = paint(now);
      const moving = Math.abs(s.bx) > 0.02 || Math.abs(s.bv) > 0.5;
      if (s.phase !== "idle" || moving || busy) s.raf = requestAnimationFrame(tick);
      else {
        s.bx = 0;
        s.bv = 0;
        paint(now);
        s.raf = 0;
      }
    },
    [finish, paint],
  );

  const run = () => {
    const s = sim.current;
    if (s.raf) return;
    s.last = performance.now();
    s.raf = requestAnimationFrame(step);
  };

  useEffect(() => {
    const s = sim.current;
    return () => cancelAnimationFrame(s.raf);
  }, []);

  const local = (e: PointerEvent) => {
    const r = rootRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  /** Teclado o clic sin arrastre: el talón se suelta solo y cae. */
  const dropNow = () => {
    const g = geoRef.current;
    if (!g || closing.current) return;
    if (prefersReducedMotion()) return finish();
    const s = sim.current;
    s.sign = 1;
    s.hinge = { x: g.ends[1].x, y: g.ends[1].y };
    s.hingeV = g.ends[1].v;
    if (stubRef.current) stubRef.current.style.transformOrigin = `${s.hinge.x}px ${s.hinge.y}px`;
    s.snapped = g.bridges.map(() => true);
    s.snapAt = g.bridges.map(() => performance.now());
    Object.assign(s, {
      phase: "drop" as Phase,
      vx: 260,
      vy: -380,
      spin: 2.4,
      age: 0,
      bv: -420,
    });
    run();
  };

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    const s = sim.current;
    const g = geoRef.current;
    if (!g || closing.current || e.button !== 0 || s.id !== null || s.phase === "drop") return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    const p = local(e);
    Object.assign(s, {
      id: e.pointerId,
      start: p,
      point: p,
      pt: performance.now(),
      pvx: 0,
      pvy: 0,
    });
    if (s.theta < 0.01) {
      const far = p.y < g.cross / 2;
      const end = g.ends[far ? 1 : 0];
      s.sign = far ? 1 : -1;
      s.hinge = { x: end.x, y: end.y };
      s.hingeV = end.v;
      if (stubRef.current) stubRef.current.style.transformOrigin = `${s.hinge.x}px ${s.hinge.y}px`;
    }
    const cos = Math.cos(-s.theta * s.sign);
    const sin = Math.sin(-s.theta * s.sign);
    const ux = p.x - s.sx - s.hinge.x;
    const uy = p.y - s.sy - s.hinge.y;
    s.grab = {
      x: s.hinge.x + ux * cos - uy * sin,
      y: s.hinge.y + ux * sin + uy * cos,
    };
    s.a0 = Math.atan2(s.grab.y - s.hinge.y, s.grab.x - s.hinge.x) - (s.theta * s.sign) / 0.92;
    s.phase = "held";
    s.thetaV = 0;
    setGrabbing(true);
    run();
  };

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const s = sim.current;
    if (s.id !== e.pointerId) return;
    const p = local(e);
    const now = performance.now();
    const dt = Math.max(0.004, (now - s.pt) / 1000);
    s.pvx += ((p.x - s.point.x) / dt - s.pvx) * 0.35;
    s.pvy += ((p.y - s.point.y) / dt - s.pvy) * 0.35;
    s.pt = now;
    s.point = p;
    if (prefersReducedMotion() && Math.hypot(p.x - s.start.x, p.y - s.start.y) > 28) {
      s.id = null;
      setGrabbing(false);
      finish();
    }
  };

  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    const s = sim.current;
    if (s.id !== e.pointerId) return;
    s.id = null;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    setGrabbing(false);
    const dist = Math.hypot(s.point.x - s.start.x, s.point.y - s.start.y);
    if (s.phase === "free") {
      const still = performance.now() - s.pt > 80;
      s.vx = still ? 0 : clamp(s.pvx, -1600, 1600);
      s.vy = still ? 0 : clamp(s.pvy, -1600, 1200);
      s.spin = clamp(s.vx * 0.004, -6, 6) + 1.2 * s.sign;
      s.age = 0;
      s.phase = "drop";
    } else if (s.phase === "held") {
      // Un clic sin arrastre también corta; un jalón corto regresa.
      if (dist < 4) return dropNow();
      s.phase = "return";
    }
    run();
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    if (!e.repeat) dropNow();
  };

  const number = `#${String(ticket.number).padStart(3, "0")}`;

  return (
    <li
      className={`relative list-none transition-[opacity,transform] duration-300 ease-out ${grabbing ? "z-20" : ""} ${editing ? "col-span-full" : ""}`}
      style={gone ? { opacity: 0, transform: "scale(0.97)" } : undefined}
    >
      <div
        ref={rootRef}
        className="relative select-none [filter:drop-shadow(0_14px_14px_rgb(20_18_14/0.25))_drop-shadow(0_2px_2px_rgb(20_18_14/0.15))]"
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        {/* Cuerpo: en el flujo normal, así crece con el detalle */}
        <div ref={bodyRef} className="relative will-change-transform">
          {geo && !editing && (
            <svg
              aria-hidden
              className="pointer-events-none absolute inset-0 z-10 size-full overflow-visible"
              viewBox={`0 0 ${size.w} ${size.h}`}
            >
              <path d={geo.bodyOutline} fill="none" stroke={EDGE} strokeWidth={1} />
            </svg>
          )}
          <article
            aria-label={`Ticket ${number}: ${ticket.title}`}
            className="flex min-h-36 flex-col bg-tile p-5 text-stone-900 select-text [color-scheme:dark]"
            style={{
              paddingRight: editing ? undefined : STUB + 20,
              clipPath: geo && !editing ? `path('${geo.body}')` : undefined,
              borderRadius: geo && !editing ? undefined : RADIUS,
            }}
          >
            {editing ? (
              <form
                action={async (fd) => {
                  await updateTicket(ticket.id, fd);
                  setEditing(false);
                  requestAnimationFrame(() => editBtnRef.current?.focus());
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setEditing(false);
                    requestAnimationFrame(() => editBtnRef.current?.focus());
                  }
                }}
                className="space-y-2.5"
                aria-label={`Editar ticket ${number}`}
              >
                <span className="font-mono text-xs font-semibold text-stone-500">{number}</span>
                <label className="block">
                  <span className="sr-only">Título</span>
                  <input name="title" required defaultValue={ticket.title} autoFocus className={`${inputCls} font-semibold`} />
                </label>
                <label className="block">
                  <span className="sr-only">Detalle</span>
                  <textarea
                    name="detail"
                    rows={8}
                    defaultValue={ticket.detail ?? ""}
                    placeholder="Detalle (opcional)"
                    className={inputCls}
                  />
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="block">
                    <span className="sr-only">Prioridad</span>
                    <select name="priority" defaultValue={ticket.priority} className={inputCls}>
                      {PRIORITIES.map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="sr-only">Página</span>
                    <select name="pageId" defaultValue={ticket.pageId ?? ""} className={inputCls}>
                      <option value="">Sin página</option>
                      {pages.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="flex gap-2">
                  <SubmitButton>Guardar</SubmitButton>
                  <button
                    type="button"
                    className={buttonCls.quiet}
                    onClick={() => {
                      setEditing(false);
                      requestAnimationFrame(() => editBtnRef.current?.focus());
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-stone-500">{number}</span>
                  {ticket.priority !== "Normal" && (
                    <Badge tone={ticket.priority === "Urgente" ? "danger" : ticket.priority === "Alta" ? "warn" : "neutral"}>{ticket.priority}</Badge>
                  )}
                  <button
                    ref={editBtnRef}
                    type="button"
                    onClick={() => setEditing(true)}
                    aria-label={`Editar ticket ${number}`}
                    title="Editar"
                    className={`${buttonCls.quiet} -my-1.5 ml-auto px-2`}
                  >
                    <Pencil aria-hidden className="size-4" />
                  </button>
                </div>
                <h3 className="text-base leading-snug font-semibold text-balance text-stone-900">{ticket.title}</h3>
                {ticket.detail && <p className="mt-1 text-sm whitespace-pre-line text-stone-600">{ticket.detail}</p>}
                <p className="mt-auto pt-3 text-xs text-stone-500">
                  {ticket.createdBy} · {formatDateTime(ticket.createdAt)}
                  {ticket.pageId && pageTitle && (
                    <>
                      {" · "}
                      <Link href={`/paginas/${ticket.pageId}`} className="font-medium text-stone-700 underline-offset-2 hover:underline">
                        {pageTitle}
                      </Link>
                    </>
                  )}
                </p>
              </>
            )}
          </article>
        </div>

        {/* Fibras de la perforación */}
        <svg aria-hidden className="pointer-events-none absolute inset-0 z-20 size-full overflow-visible">
          {geo?.bridges.map((_, i) => (
            <g key={i} fill="none" stroke={FIBRE} strokeLinecap="round">
              <path
                ref={(el) => {
                  fibres.current[i * 2] = el;
                }}
                style={{ opacity: 0 }}
              />
              <path
                ref={(el) => {
                  fibres.current[i * 2 + 1] = el;
                }}
                style={{ opacity: 0 }}
              />
            </g>
          ))}
        </svg>

        {/* Talón: se jala para cortarlo */}
        {geo && !editing && (
          <div
            ref={stubRef}
            role="button"
            tabIndex={0}
            aria-label={`Cortar el talón para cerrar el ticket ${number}`}
            title="Jala el talón para cortarlo (o haz clic) y cerrar el ticket"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            onLostPointerCapture={onUp}
            onKeyDown={onKey}
            onDragStart={(e) => e.preventDefault()}
            className={`group absolute inset-0 z-30 touch-none outline-none will-change-transform ${grabbing ? "cursor-grabbing" : "cursor-grab"}`}
            style={{ clipPath: `path('${geo.stub}')` }}
          >
            <div
              className="absolute inset-y-0 right-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-[#ffd451] to-signal-yellow text-ink group-hover:brightness-105"
              style={{ width: STUB }}
            >
              <span className="num text-3xl font-semibold">{number}</span>
              <span className="flex items-center gap-1 text-xs font-semibold text-ink/75 group-hover:text-ink group-focus-visible:text-ink">
                <Scissors aria-hidden className="size-3.5" /> Cortar
              </span>
              <span aria-hidden className="absolute inset-x-4 bottom-3 hidden h-0.5 rounded-full bg-ink group-focus-visible:block" />
            </div>
          </div>
        )}
      </div>
    </li>
  );
}
