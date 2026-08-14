"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { setIntro, getIntro } from "@/lib/intro-state";

// Scroll-scrubbed cinematic opening. The reference film shows the felt
// characters standing on a workshop table, being caught by strings and
// lifted out of the scene — so the camera choreography leans into that
// story: it opens close on the raw materials, pulls back as the strings
// descend, and holds wide while the characters rise out of frame. As the
// film fades, the same characters drop from the navigation: they left the
// film and hung themselves on the website. Plays once per browser session.

type CamKey = {
  p: number;
  s: number; // scale
  fx: number; // focal point, % of frame
  fy: number;
  blur: number;
  sat: number;
  br: number;
  veil: number; // cream vignette strength
};

const CAM: CamKey[] = [
  { p: 0.0, s: 1.55, fx: 30, fy: 40, blur: 6, sat: 0.9, br: 1.05, veil: 0.55 },
  { p: 0.28, s: 1.2, fx: 42, fy: 46, blur: 0.7, sat: 0.97, br: 1.02, veil: 0.3 },
  { p: 0.55, s: 1.0, fx: 50, fy: 50, blur: 0, sat: 1, br: 1, veil: 0.1 },
  { p: 0.78, s: 1.0, fx: 50, fy: 50, blur: 0, sat: 1, br: 1, veil: 0.08 },
  // the characters rise out of frame as the camera settles on the empty
  // table — which is exactly what the hero behind this film shows
  { p: 0.93, s: 1.45, fx: 50, fy: 80, blur: 0, sat: 0.96, br: 1.02, veil: 0.1 },
  { p: 1.0, s: 1.52, fx: 50, fy: 86, blur: 1, sat: 0.94, br: 1.03, veil: 0.15 },
];

const CAPTIONS = [
  { from: 0.03, to: 0.24, text: "It begins with wool." },
  { from: 0.32, to: 0.54, text: "Shaped by hand, stitch by stitch." },
  { from: 0.6, to: 0.76, text: "Until it comes to life." },
];

// the film plays once per browser session — returning from another page
// (or reloading mid-visit) lands straight on the hero
const SEEN_KEY = "aaha-intro-seen";

const introSeen = () => {
  try {
    return sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
};

const markIntroSeen = () => {
  try {
    sessionStorage.setItem(SEEN_KEY, "1");
  } catch {}
};

// warm filmic base grade — a touch of contrast and sepia-warmth so the
// footage reads like afternoon workshop light instead of flat video; the
// saturate boost compensates for what the sepia pulls out
const GRADE = "contrast(1.06) sepia(0.14)";
const GRADE_SAT = 1.12;

// fine monochrome grain tiled over the film — texture that makes the soft
// footage read as intentional, like wool fibre and paper
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E\")";

const smooth = (t: number) => t * t * (3 - 2 * t);

function cam(p: number): CamKey {
  let a = CAM[0];
  let b = CAM[CAM.length - 1];
  for (let i = 0; i < CAM.length - 1; i++) {
    if (p >= CAM[i].p && p <= CAM[i + 1].p) {
      a = CAM[i];
      b = CAM[i + 1];
      break;
    }
  }
  const t = b.p === a.p ? 0 : smooth((p - a.p) / (b.p - a.p));
  const l = (x: number, y: number) => x + (y - x) * t;
  return {
    p,
    s: l(a.s, b.s),
    fx: l(a.fx, b.fx),
    fy: l(a.fy, b.fy),
    blur: l(a.blur, b.blur),
    sat: l(a.sat, b.sat),
    br: l(a.br, b.br),
    veil: l(a.veil, b.veil),
  };
}

export function CinematicIntro() {
  const containerRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const captionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [disabled, setDisabled] = useState(false);
  // scroll distance the page loses when the finished film's zone collapses;
  // compensated before paint so the hero doesn't move on screen
  const collapseShiftRef = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    const layer = layerRef.current;
    const video = videoRef.current;
    if (!el || !layer || !video) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || introSeen()) {
      setIntro({ enabled: false, done: true, zoneBottom: 0 });
      setDisabled(true);
      return;
    }

    let top = 0;
    const measure = () => {
      top = el.getBoundingClientRect().top + window.scrollY;
      const zoneBottom = top + el.offsetHeight - window.innerHeight;
      setIntro({ zoneBottom });
    };
    measure();

    setIntro({ enabled: true, done: window.scrollY >= getIntro().zoneBottom });
    window.addEventListener("resize", measure);

    const onError = () => {
      setIntro({ enabled: false, done: true, zoneBottom: 0 });
      setDisabled(true);
    };
    video.addEventListener("error", onError);

    let raf = 0;
    let current = 0;
    let done = getIntro().done;

    const tick = () => {
      const max = Math.max(el.offsetHeight - window.innerHeight, 1);
      const p = Math.min(1, Math.max(0, (window.scrollY - top) / max));

      if (p >= 0.995) {
        // the film is over and the hero owns the screen: remove the scroll
        // zone above it so scrolling up never scrubs the film again
        markIntroSeen();
        collapseShiftRef.current = el.offsetHeight - window.innerHeight;
        setDisabled(true);
        return;
      }

      // scrub
      const dur = video.duration || 10;
      const target = p * Math.max(dur - 0.05, 0);
      current += (target - current) * 0.22;
      if (video.readyState >= 1 && !video.seeking && Math.abs(video.currentTime - current) > 0.005) {
        video.currentTime = current;
      }

      // camera: recompose the frame as the story progresses
      const k = cam(p);
      const lim = (k.s - 1) * 50;
      const tx = Math.max(-lim, Math.min(lim, (50 - k.fx) * k.s));
      const ty = Math.max(-lim, Math.min(lim, (50 - k.fy) * k.s));
      video.style.transform = `translate(${tx.toFixed(2)}%, ${ty.toFixed(2)}%) scale(${k.s.toFixed(3)})`;
      const tone = `${GRADE} saturate(${(k.sat * GRADE_SAT).toFixed(2)}) brightness(${k.br.toFixed(2)})`;
      video.style.filter = k.blur > 0.05 ? `blur(${k.blur.toFixed(1)}px) ${tone}` : tone;
      if (veilRef.current) veilRef.current.style.opacity = k.veil.toFixed(2);

      // story captions
      CAPTIONS.forEach((c, i) => {
        const node = captionRefs.current[i];
        if (!node) return;
        const o = Math.max(0, Math.min((p - c.from) / 0.06, (c.to - p) / 0.06, 1));
        node.style.opacity = o.toFixed(2);
        node.style.transform = `translateY(${((1 - o) * 14).toFixed(1)}px)`;
      });

      // the film hands over: fade out while the characters take the stage
      const fade = p < 0.86 ? 1 : Math.max(0, 1 - (p - 0.86) / 0.12);
      layer.style.opacity = fade.toFixed(3);

      // the logo drifts upward with the scroll and hands the stage to the story
      if (markRef.current) {
        const mo = Math.max(0, Math.min(1, (0.3 - p) / 0.09));
        markRef.current.style.opacity = mo.toFixed(2);
        markRef.current.style.transform = `translateY(${(-(p / 0.3) * 70).toFixed(1)}px)`;
      }
      if (hintRef.current) hintRef.current.style.opacity = p > 0.04 ? "0" : "1";

      if (p >= 0.85 && !done) {
        done = true;
        // the film has effectively played through — don't replay it when
        // the visitor comes back to the home page this session
        markIntroSeen();
        setIntro({ done: true });
      } else if (p < 0.72 && done) {
        done = false;
        setIntro({ done: false });
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      video.removeEventListener("error", onError);
      setIntro({ enabled: false, done: true, zoneBottom: 0 });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);

  // the zone above the hero just unmounted — pull the scroll position up
  // by the same distance before the browser paints, so the hero stays
  // exactly where it was on screen
  useLayoutEffect(() => {
    if (disabled && collapseShiftRef.current > 0) {
      window.scrollTo({
        top: Math.max(0, window.scrollY - collapseShiftRef.current),
        behavior: "instant",
      });
      collapseShiftRef.current = 0;
    }
  }, [disabled]);

  if (disabled) return null;

  return (
    <div ref={containerRef} className="relative z-40 h-[200vh] md:h-[280vh] mb-[-100vh]">
      <div
        ref={layerRef}
        className="sticky top-0 h-screen w-full overflow-hidden pointer-events-none"
        style={{ backgroundColor: "#efe6d5" }}
      >
        <video
          ref={videoRef}
          src="/intro.mp4"
          poster="/intro-poster.jpg"
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ willChange: "transform, filter" }}
        />

        {/* natural window light — warm amber falling from the upper left,
            a whisper of cool lavender in the far corner */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(118deg, rgba(255,192,132,0.5) 0%, rgba(255,232,205,0.18) 34%, rgba(255,255,255,0) 55%, rgba(168,142,190,0.16) 100%)",
            mixBlendMode: "soft-light",
          }}
        />

        {/* dreamy cream vignette, strongest at the opening */}
        <div
          ref={veilRef}
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 95% at 50% 42%, rgba(244,238,227,0) 42%, rgba(244,238,227,0.92) 100%)",
          }}
        />

        {/* film grain over the whole frame */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage: GRAIN,
            backgroundSize: "180px 180px",
            mixBlendMode: "overlay",
            opacity: 0.13,
          }}
        />

        {/* grand brand mark floating over the opening while the nav is away */}
        <div
          ref={markRef}
          className="absolute top-8 left-5 sm:top-14 sm:left-14"
          style={{ willChange: "transform, opacity" }}
        >
          <div className="float-animation">
            <Image
              src="/logo.svg"
              alt="Aaha Felt"
              width={520}
              height={173}
              priority
              className="h-20 sm:h-36 lg:h-44 w-auto"
              style={{
                filter:
                  "drop-shadow(0 0 10px rgba(255,255,255,1)) drop-shadow(0 0 28px rgba(255,252,244,0.95)) drop-shadow(0 3px 10px rgba(255,255,255,0.85)) contrast(1.15) saturate(1.3)",
              }}
            />
          </div>
        </div>

        {/* story captions */}
        {CAPTIONS.map((c, i) => (
          <div
            key={c.text}
            ref={(node) => {
              captionRefs.current[i] = node;
            }}
            className="absolute left-[8%] right-[8%] bottom-[18%] max-w-md font-playfair italic font-medium text-2xl sm:text-3xl lg:text-4xl leading-snug"
            style={{
              opacity: 0,
              color: "#42321f",
              textShadow:
                "0 1px 2px rgba(248,243,234,0.95), 0 0 22px rgba(248,243,234,0.95), 0 0 44px rgba(248,243,234,0.8)",
            }}
          >
            {c.text}
          </div>
        ))}

        {/* scroll hint */}
        <div
          ref={hintRef}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-foreground/70 transition-opacity duration-700"
        >
          <span className="text-xs font-medium tracking-[0.25em] uppercase">Scroll</span>
          <svg className="w-5 h-5 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </div>
  );
}
