"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { geoOrthographic, geoGraticule10, geoPath, type GeoProjection } from "d3-geo";
import { feature, mesh } from "topojson-client";

type CountryItem = { code: string; name: string; flag: string; frameworkCount: number };

type Point = { code: string; lat: number; lng: number; size: number };

// Approximate lat/lng for plotting (enough for UI visualization)
const COUNTRY_COORDS: Record<string, { lat: number; lng: number }> = {
  IN: { lat: 20.5937, lng: 78.9629 },
  CN: { lat: 35.8617, lng: 104.1954 },
  JP: { lat: 36.2048, lng: 138.2529 },
  KR: { lat: 35.9078, lng: 127.7669 },
  TW: { lat: 23.6978, lng: 120.9605 },

  US: { lat: 37.0902, lng: -95.7129 },
  CA: { lat: 56.1304, lng: -106.3468 },
  BR: { lat: -14.235, lng: -51.9253 },
  MX: { lat: 23.6345, lng: -102.5528 },
  AR: { lat: -38.4161, lng: -63.6167 },
  CO: { lat: 4.5709, lng: -74.2973 },
  CL: { lat: -35.6751, lng: -71.543 },

  EU: { lat: 50.1109, lng: 8.6821 }, // approximate (central EU)
  GB: { lat: 55.3781, lng: -3.436 },
  CH: { lat: 46.8182, lng: 8.2275 },
  TR: { lat: 38.9637, lng: 35.2433 },
  RU: { lat: 61.524, lng: 105.3188 },

  AU: { lat: -25.2744, lng: 133.7751 },
  NZ: { lat: -40.9006, lng: 174.886 },

  SG: { lat: 1.3521, lng: 103.8198 },
  TH: { lat: 15.87, lng: 100.9925 },
  MY: { lat: 4.2105, lng: 101.9758 },
  ID: { lat: -0.7893, lng: 113.9213 },
  PH: { lat: 12.8797, lng: 121.774 },
  VN: { lat: 14.0583, lng: 108.2772 },
  ASEAN: { lat: 10.0, lng: 105.0 }, // approximate SEA centroid

  SA: { lat: 23.8859, lng: 45.0792 },
  AE: { lat: 23.4241, lng: 53.8478 },
  IL: { lat: 31.0461, lng: 34.8516 },
  EG: { lat: 26.8206, lng: 30.8025 },

  ZA: { lat: -30.5595, lng: 22.9375 },
  NG: { lat: 9.082, lng: 8.6753 },
  KE: { lat: -0.0236, lng: 37.9062 },

  PK: { lat: 30.3753, lng: 69.3451 },
  BD: { lat: 23.685, lng: 90.3563 },
};

export default function GlobePanel({
  countries,
  title = "Global footprint",
  variant = "panel",
}: {
  countries: CountryItem[];
  title?: string;
  variant?: "panel" | "background";
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);

  const rotateRef = useRef<[number, number, number]>([-25, -10, 0]); // [lambda, phi, gamma]
  const [hover, setHover] = useState<{ name: string; code?: string } | null>(null);
  const worldRef = useRef<{ land: GeoJSON.FeatureCollection; borders: GeoJSON.Feature } | null>(null);

  const points: Point[] = useMemo(() => {
    const maxTypes = Math.max(1, ...countries.map((c) => c.frameworkCount || 1));
    return countries
      .map((c) => {
        const coord = COUNTRY_COORDS[c.code];
        if (!coord) return null;
        const size = 0.18 + (0.55 * (c.frameworkCount || 1)) / maxTypes;
        return {
          code: c.code,
          lat: coord.lat,
          lng: coord.lng,
          size,
        } as Point;
      })
      .filter(Boolean) as Point[];
  }, [countries]);

  const shown = points.length;

  function buildProjection(w: number, h: number): GeoProjection {
    const r = Math.min(w, h) * 0.43;
    return geoOrthographic()
      .scale(r)
      .translate([w / 2, h / 2])
      .clipAngle(90)
      .rotate(rotateRef.current);
  }

  // Render loop (canvas)
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setSize = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w, h };
    };

    let { w, h } = setSize();
    const grat = geoGraticule10();

    const ensureWorld = async () => {
      if (worldRef.current) return;
      try {
        const res = await fetch("https://unpkg.com/world-atlas@2/countries-110m.json", { cache: "force-cache" });
        const topo = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj = (topo.objects as any).countries;
        const land = feature(topo, obj) as unknown as GeoJSON.FeatureCollection;
        const borders = mesh(topo, obj, (a, b) => a !== b) as unknown as GeoJSON.Feature;
        worldRef.current = { land, borders };
      } catch {
        // If fetch fails, we still render dotted globe + points.
        worldRef.current = null;
      }
    };

    let last = performance.now();

    const draw = async (now: number) => {
      const dt = Math.min(40, now - last);
      last = now;

      // auto-rotate (when not dragging)
      if (!draggingRef.current) {
        const r = rotateRef.current;
        rotateRef.current = [r[0] + (dt * 0.008), r[1], r[2]];
      }

      const proj = buildProjection(w, h);
      const path = geoPath(proj, ctx);

      ctx.clearRect(0, 0, w, h);

      // background subtle vignette
      const g = ctx.createRadialGradient(w * 0.5, h * 0.38, 20, w * 0.5, h * 0.5, Math.min(w, h) * 0.55);
      g.addColorStop(0, "rgba(14,165,233,0.06)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      const isBg = variant === "background";

      // globe edge
      const R = Math.min(w, h) * 0.43;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, R, 0, Math.PI * 2);
      ctx.strokeStyle = isBg ? "rgba(226,232,240,0.65)" : "rgba(226,232,240,1)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // dotted surface (always render, even if world fetch fails)
      const latStep = 8;
      const lngStep = 8;
      ctx.fillStyle = isBg ? "rgba(148,163,184,0.32)" : "rgba(148,163,184,0.45)";
      for (let lat = -80; lat <= 80; lat += latStep) {
        for (let lng = -180; lng < 180; lng += lngStep) {
          const p = proj([lng, lat]);
          if (!p) continue;
          const dx = p[0] - w / 2;
          const dy = p[1] - h / 2;
          if ((dx * dx + dy * dy) > R * R) continue;
          ctx.beginPath();
          ctx.arc(p[0], p[1], isBg ? 0.7 : 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // land + country borders (lightweight)
      if (!worldRef.current) await ensureWorld();
      if (worldRef.current) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, R, 0, Math.PI * 2);
        ctx.clip();

        ctx.beginPath();
        path(worldRef.current.land);
        ctx.fillStyle = "rgba(15,23,42,0.045)";
        ctx.fill();

        ctx.beginPath();
        path(worldRef.current.borders);
        ctx.strokeStyle = "rgba(148,163,184,0.34)";
        ctx.lineWidth = 0.9;
        ctx.stroke();
        ctx.restore();
      }

      // graticule (very subtle)
      ctx.strokeStyle = "rgba(148,163,184,0.18)";
      ctx.lineWidth = 1;
      // draw graticule lines by sampling
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lines: any = grat;
      const drawLineString = (coords: [number, number][]) => {
        let started = false;
        for (const c of coords) {
          const p = proj(c);
          if (!p) { started = false; continue; }
          const dx = p[0] - w / 2;
          const dy = p[1] - h / 2;
          if ((dx * dx + dy * dy) > R * R) { started = false; continue; }
          if (!started) { ctx.beginPath(); ctx.moveTo(p[0], p[1]); started = true; }
          else ctx.lineTo(p[0], p[1]);
        }
        if (started) ctx.stroke();
      };
      for (const l of lines.coordinates || []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        drawLineString(l as any);
      }

      // covered points
      for (const pt of points) {
        const p = proj([pt.lng, pt.lat]);
        if (!p) continue;
        const dx = p[0] - w / 2;
        const dy = p[1] - h / 2;
        if ((dx * dx + dy * dy) > R * R) continue;

        const r = (isBg ? 3.8 : 3.2) + pt.size * (isBg ? 3.8 : 3.2);
        ctx.beginPath();
        ctx.arc(p[0], p[1], r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(14,165,233,0.95)";
        ctx.shadowColor = "rgba(14,165,233,0.35)";
        ctx.shadowBlur = isBg ? 10 : 8;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(255,255,255,0.9)";
        ctx.stroke();
      }

      rafRef.current = window.requestAnimationFrame((t) => void draw(t));
    };

    rafRef.current = window.requestAnimationFrame((t) => void draw(t));

    const onResize = () => {
      ({ w, h } = setSize());
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [points, variant]);

  // Drag interaction
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const onDown = (e: PointerEvent) => {
      draggingRef.current = true;
      lastRef.current = { x: e.clientX, y: e.clientY };
      wrap.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current || !lastRef.current) return;
      const dx = e.clientX - lastRef.current.x;
      const dy = e.clientY - lastRef.current.y;
      lastRef.current = { x: e.clientX, y: e.clientY };
      const r = rotateRef.current;
      rotateRef.current = [r[0] + dx * 0.25, Math.max(-60, Math.min(60, r[1] - dy * 0.25)), r[2]];
    };
    const onUp = () => {
      draggingRef.current = false;
      lastRef.current = null;
    };

    wrap.addEventListener("pointerdown", onDown);
    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerup", onUp);
    wrap.addEventListener("pointercancel", onUp);

    return () => {
      wrap.removeEventListener("pointerdown", onDown);
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerup", onUp);
      wrap.removeEventListener("pointercancel", onUp);
    };
  }, []);

  // Hover tooltip for plotted countries
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const onHover = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const w = rect.width;
      const h = rect.height;
      const R = Math.min(w, h) * 0.43;
      const dx = x - w / 2;
      const dy = y - h / 2;
      if ((dx * dx + dy * dy) > R * R * 1.02) {
        setHover(null);
        return;
      }

      const proj = geoOrthographic()
        .scale(R)
        .translate([w / 2, h / 2])
        .clipAngle(90)
        .rotate(rotateRef.current);
      let best: { code: string; dist: number } | null = null;
      for (const pt of points) {
        const p = proj([pt.lng, pt.lat]);
        if (!p) continue;
        const ddx = p[0] - x;
        const ddy = p[1] - y;
        const d = Math.sqrt(ddx * ddx + ddy * ddy);
        if (d < (best?.dist ?? 1e9)) best = { code: pt.code, dist: d };
      }

      if (best && best.dist < 12) {
        const c = countries.find((cc) => cc.code === best.code);
        setHover(c ? { name: c.name, code: c.code } : { name: best.code, code: best.code });
      } else {
        setHover(null);
      }
    };

    wrap.addEventListener("pointermove", onHover);
    return () => wrap.removeEventListener("pointermove", onHover);
  }, [points, countries]);

  const body = (
    <div
      ref={wrapRef}
      className={`relative ${variant === "panel" ? "h-[560px] rounded-2xl border border-border" : "h-full"} bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.05),transparent_55%)] overflow-hidden`}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
      {variant === "panel" && hover && (
        <div className="absolute left-3 top-3 bg-surface/90 backdrop-blur-sm border border-border rounded-xl px-3 py-2 text-xs text-foreground shadow-sm">
          <div className="font-semibold">{hover.name}</div>
          {hover.code && <div className="text-[10px] text-muted mt-0.5">Country: {hover.code}</div>}
        </div>
      )}
      {variant === "panel" && (
        <div className="absolute inset-x-0 bottom-0 p-3">
          <div className="bg-surface/85 backdrop-blur-sm border border-border rounded-xl px-3 py-2 text-[11px] text-muted">
            Drag to rotate • Auto-rotates
          </div>
        </div>
      )}
    </div>
  );

  if (variant === "background") return body;

  return (
    <div className="w-full">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-bold text-foreground">{title}</p>
          <p className="text-xs text-muted">Plotted: {shown} markets</p>
        </div>
        <div className="text-[10px] px-2 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-bold border border-[var(--accent)]/15">
          3D
        </div>
      </div>
      {body}
    </div>
  );
}

