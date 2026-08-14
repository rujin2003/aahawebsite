"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { getIntro } from "@/lib/intro-state";

type Char = {
  id: string;
  src: string;
  imgW: number;
  imgH: number;
  attach: number; // % from image left where the string meets the toy
  x: number; // % across the rail
  tabletX?: number;
  mobileX?: number;
  len: number; // string length px (desktop)
  tabletLen?: number;
  mobileLen?: number;
  w: number; // rendered width px (desktop)
  mobileMul?: number; // extra size factor on mobile
  mass: number;
  swayAmp: number; // deg
  swaySpeed: number; // rad/s
  phase: number;
  delay: number; // drop-in stagger ms
  tablet: boolean;
  mobile: boolean;
};

const CHARS: Char[] = [
  { id: "doll-1", src: "/hanging/doll-1.png", imgW: 206, imgH: 351, attach: 55.3, x: 41, tabletX: 28, len: 150, tabletLen: 55, w: 118, mass: 1, swayAmp: 2.1, swaySpeed: 1.05, phase: 0.7, delay: 150, tablet: true, mobile: true, mobileX: 15, mobileLen: 34 },
  { id: "doll-2", src: "/hanging/doll-2.png", imgW: 178, imgH: 333, attach: 49.4, x: 50, tabletX: 50, len: 235, tabletLen: 66, w: 104, mass: 0.9, swayAmp: 2.5, swaySpeed: 1.3, phase: 2.3, delay: 300, tablet: true, mobile: false },
  { id: "doll-3", src: "/hanging/doll-3.png", imgW: 186, imgH: 341, attach: 47, x: 58, len: 185, w: 108, mass: 1, swayAmp: 2.3, swaySpeed: 1.18, phase: 5.2, delay: 450, tablet: false, mobile: false },
  { id: "horse", src: "/hanging/horse.png", imgW: 345, imgH: 362, attach: 27.3, x: 70, len: 220, w: 205, mass: 1.6, swayAmp: 2.8, swaySpeed: 0.78, phase: 4.1, delay: 650, tablet: false, mobile: true, mobileX: 82, mobileLen: 30, mobileMul: 0.8 },
  { id: "elephant", src: "/hanging/elephant.png", imgW: 531, imgH: 397, attach: 38.5, x: 88, tabletX: 89, len: 160, tabletLen: 48, w: 235, mass: 2.6, swayAmp: 1.6, swaySpeed: 0.55, phase: 1.9, delay: 850, tablet: true, mobile: false },
];

type Bp = "mobile" | "tablet" | "desktop";

type CharState = {
  theta: number;
  omega: number;
  y: number;
  vy: number;
  releaseAt: number | null;
  started: boolean;
  grabbed: boolean;
  dragVel: number;
  lastEvt: number;
  downX: number;
  downT: number;
  moved: number;
};

const MAX_ANGLE = 26;

export function HangingFelt({
  navHidden,
  subtle = false,
}: {
  navHidden: boolean;
  subtle?: boolean; // secondary pages: smaller, purely decorative garland
}) {
  const [bp, setBp] = useState<Bp | null>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const statesRef = useRef<Record<string, CharState>>({});
  const rectRef = useRef<DOMRect | null>(null);
  const navHiddenRef = useRef(navHidden);
  navHiddenRef.current = navHidden;
  const reducedRef = useRef(false);

  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const update = () =>
      setBp(window.innerWidth < 640 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop");
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const sizeMul = bp === "mobile" ? 0.66 : bp === "tablet" ? 0.85 : 1;
  const lenMul = bp === "mobile" ? 0.6 : bp === "tablet" ? 0.85 : 1;

  const visible = useMemo(
    () =>
      CHARS.filter((c) => (bp === "mobile" ? c.mobile : bp === "tablet" ? c.tablet : true)),
    [bp]
  );

  const dims = (c: Char) => {
    const w = c.w * sizeMul * (bp === "mobile" ? c.mobileMul ?? 1 : 1);
    const h = (w * c.imgH) / c.imgW;
    const len =
      bp === "mobile" && c.mobileLen != null
        ? c.mobileLen
        : bp === "tablet" && c.tabletLen != null
          ? c.tabletLen
          : c.len * lenMul;
    return { w, h, len, hiddenY: -(len + h + 60) };
  };

  const resolveX = (c: Char) =>
    bp === "mobile" && c.mobileX != null
      ? c.mobileX
      : bp === "tablet" && c.tabletX != null
        ? c.tabletX
        : c.x;

  useEffect(() => {
    if (!bp) return;
    const inner = innerRef.current;
    if (!inner) return;

    const now0 = performance.now();
    const states: Record<string, CharState> = {};
    for (const c of visible) {
      const { hiddenY } = dims(c);
      states[c.id] = {
        theta: (c.phase % 2 > 1 ? -1 : 1) * 2.5,
        omega: 0,
        y: hiddenY,
        vy: 0,
        releaseAt: null,
        started: false,
        grabbed: false,
        dragVel: 0,
        lastEvt: 0,
        downX: 0,
        downT: 0,
        moved: 0,
      };
    }
    statesRef.current = states;

    if (reducedRef.current) {
      // static hang, no simulation
      for (const c of visible) {
        const node = nodeRefs.current[c.id];
        if (node) node.style.transform = "translate3d(0,0,0)";
      }
      return;
    }

    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const mouse = { x: 0, y: 0, until: 0 };
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.until = performance.now() + 120;
    };
    if (finePointer) window.addEventListener("mousemove", onMouseMove, { passive: true });

    let raf = 0;
    let last = now0;
    let lastScrollY = window.scrollY;
    let scale = 1;

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30) || 1 / 60;
      last = now;

      const rect = inner.getBoundingClientRect();
      rectRef.current = rect;

      const scrollY = window.scrollY;
      const sv = Math.max(-2400, Math.min(2400, (scrollY - lastScrollY) / Math.max(dt, 1e-3)));
      lastScrollY = scrollY;

      // compress upward as the user goes deeper into the page
      // (measured from the end of the cinematic intro zone, if one exists);
      // secondary pages keep a small decorative garland throughout
      const effY = Math.max(0, getIntro().enabled ? scrollY - getIntro().zoneBottom : scrollY);
      const targetScale = subtle ? 0.45 : effY < 60 ? 1 : effY > 420 ? 0.5 : 1 - (0.5 * (effY - 60)) / 360;
      scale += (targetScale - scale) * Math.min(1, dt * 6);

      // on the home page the installation belongs to the hero only: once the
      // visitor scrolls past it the characters retract up behind the nav, and
      // drop back in when the hero returns
      const pastHero = !subtle && effY > Math.min(window.innerHeight * 0.75, 560);

      // while any part of the film is still on screen the characters wait
      // behind the nav — the string drop plays out in full view the moment
      // the visitor lands on the hero
      const introNow = getIntro();
      const inFilm = introNow.enabled && scrollY < introNow.zoneBottom - 4;

      const t = now / 1000;
      for (const c of visible) {
        const st = states[c.id];
        const node = nodeRefs.current[c.id];
        if (!st || !node) continue;

        const { w, h, len, hiddenY } = dims(c);

        // hold hidden behind the nav until the cinematic intro (if any) has
        // played through and the nav itself is visible
        const intro = getIntro();
        const held = navHiddenRef.current || (intro.enabled && !intro.done) || inFilm || pastHero;
        if (held) {
          st.releaseAt = null;
        } else if (st.releaseAt == null) {
          st.releaseAt = now + 120 + c.delay * 0.55;
        }
        const released = !held && st.releaseAt != null && now >= st.releaseAt;
        if (released && !st.started) {
          st.started = true;
          st.omega = ((c.phase % 2 > 1 ? -1 : 1) * 7) / c.mass;
        }

        // vertical drop / retract spring (slightly underdamped => soft overshoot)
        const dropTarget = released ? 0 : hiddenY;
        {
          const acc = 42 * (dropTarget - st.y) - 7.2 * st.vy;
          st.vy += acc * dt;
          st.y += st.vy * dt;
        }

        if (!st.grabbed) {
          const k = 9 / Math.pow(c.mass, 0.9);
          const damp = 0.9 + c.mass * 0.15;
          let acc = -k * st.theta - damp * st.omega;

          // scroll velocity drags the toys like air resistance
          acc += (-sv * 0.045) / c.mass;

          // gentle repulsion from a nearby cursor
          if (finePointer && st.started && now < mouse.until) {
            const cx = rect.left + (resolveX(c) / 100) * rect.width;
            const cy = rect.top + st.y + (len + h / 2) * scale;
            const dx = cx - mouse.x;
            const dy = cy - mouse.y;
            const d = Math.hypot(dx, dy);
            const r = 150 * scale;
            if (d < r && d > 1) {
              acc += (Math.sign(dx) * (1 - d / r) * 160) / c.mass;
            }
          }

          st.omega += acc * dt;
          st.theta += st.omega * dt;

          if (Math.abs(st.theta) > MAX_ANGLE) {
            st.theta = Math.sign(st.theta) * MAX_ANGLE;
            st.omega *= -0.35;
          }
        }

        const sway =
          st.started && !st.grabbed
            ? c.swayAmp * Math.sin(t * c.swaySpeed + c.phase) +
              0.35 * c.swayAmp * Math.sin(t * c.swaySpeed * 1.7 + c.phase * 2)
            : 0;

        node.style.transform = `translate3d(0, ${st.y.toFixed(2)}px, 0) scale(${scale.toFixed(3)}) rotate(${(st.theta + sway).toFixed(2)}deg)`;
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      if (finePointer) window.removeEventListener("mousemove", onMouseMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bp]);

  if (!bp) return null;

  const pivotX = (c: Char) => {
    const rect = rectRef.current;
    return rect ? rect.left + (resolveX(c) / 100) * rect.width : 0;
  };

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-full -left-24 -right-24 h-[460px] overflow-hidden"
    >
      <div ref={innerRef} className="absolute left-24 right-24 top-0 h-full">
        {visible.map((c) => {
          const { w, h, len, hiddenY } = dims(c);
          const x = resolveX(c);

          const onPointerDown = (e: React.PointerEvent) => {
            const st = statesRef.current[c.id];
            if (!st || !st.started || reducedRef.current) return;
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            st.grabbed = true;
            st.dragVel = 0;
            st.moved = 0;
            st.downX = e.clientX;
            st.downT = performance.now();
            st.lastEvt = st.downT;
          };

          const onPointerMove = (e: React.PointerEvent) => {
            const st = statesRef.current[c.id];
            if (!st || !st.grabbed) return;
            const now = performance.now();
            const dt = Math.max((now - st.lastEvt) / 1000, 1e-3);
            st.lastEvt = now;
            st.moved = Math.max(st.moved, Math.abs(e.clientX - st.downX));
            const dx = e.clientX - pivotX(c);
            const eff = Math.max((len + h * 0.5), 40);
            const next = Math.max(
              -32,
              Math.min(32, (Math.atan2(dx, eff) * 180) / Math.PI)
            );
            st.dragVel = st.dragVel * 0.5 + ((next - st.theta) / dt) * 0.5;
            st.theta = next;
            st.omega = 0;
          };

          const onPointerUp = (e: React.PointerEvent) => {
            const st = statesRef.current[c.id];
            if (!st || !st.grabbed) return;
            st.grabbed = false;
            const now = performance.now();
            if (st.moved < 6 && now - st.downT < 350) {
              // a light tap: small impulse away from the poke, tiny string stretch
              const dx = e.clientX - pivotX(c);
              st.omega += ((dx > 0 ? -1 : 1) * 120) / c.mass;
              st.vy += 30;
            } else {
              st.omega = Math.max(-220, Math.min(220, st.dragVel));
            }
          };

          return (
            <div key={c.id} className="absolute top-0" style={{ left: `${x}%` }}>
              <div
                ref={(el) => {
                  nodeRefs.current[c.id] = el;
                }}
                style={{
                  transformOrigin: "0 0",
                  willChange: "transform",
                  transform: `translate3d(0, ${hiddenY}px, 0)`,
                }}
              >
                {/* string */}
                <div
                  style={{
                    position: "absolute",
                    left: -0.75,
                    top: -12,
                    width: 1.5,
                    height: len + 12,
                    background: "linear-gradient(180deg, #f2e9d8 0%, #e4d5ba 100%)",
                    borderRadius: 2,
                    boxShadow: "0.5px 0 0 rgba(120,95,60,0.15)",
                  }}
                />
                {/* knot where the string meets the toy */}
                <div
                  style={{
                    position: "absolute",
                    left: -2.5,
                    top: len - 3,
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "#e7d8bd",
                    boxShadow: "0 1px 1px rgba(90,70,40,0.25)",
                  }}
                />
                <Image
                  src={c.src}
                  alt=""
                  width={c.imgW}
                  height={c.imgH}
                  draggable={false}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  style={{
                    position: "absolute",
                    top: len,
                    left: -(c.attach / 100) * w,
                    width: w,
                    height: h,
                    maxWidth: "none",
                    pointerEvents: subtle ? "none" : "auto",
                    cursor: "grab",
                    touchAction: "pan-y",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    filter: "drop-shadow(0 14px 10px rgba(70,45,20,0.16))",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
