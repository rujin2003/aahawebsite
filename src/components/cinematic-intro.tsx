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
//
// Phones can't be scrubbed the way desktops can: iOS Safari refuses to
// paint frames of a video that has never played, treats preload="auto" as
// a suggestion, and drops every seek that lands on an unbuffered byte —
// which is why a seek-driven film shows an empty cream screen there. So on
// small screens the film *plays* instead (muted inline playback is the one
// thing mobile browsers do reliably) and playback time drives the same
// choreography. Scrolling still pushes the story forward, and the poster
// sits underneath the whole time, so there is never a blank frame.

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

// A portrait phone screen already crops a landscape film hard through
// object-cover, so the desktop opening (1.55x zoom, 6px blur, heavy veil)
// lands on an abstract smear of wool. Mobile opens close to full frame and
// keeps the focal point centred on the characters.
const CAM_MOBILE: CamKey[] = [
  { p: 0.0, s: 1.14, fx: 50, fy: 44, blur: 2, sat: 0.94, br: 1.04, veil: 0.34 },
  { p: 0.3, s: 1.06, fx: 50, fy: 48, blur: 0.4, sat: 0.98, br: 1.02, veil: 0.18 },
  { p: 0.58, s: 1.0, fx: 50, fy: 50, blur: 0, sat: 1, br: 1, veil: 0.08 },
  { p: 0.8, s: 1.0, fx: 50, fy: 50, blur: 0, sat: 1, br: 1, veil: 0.06 },
  { p: 0.93, s: 1.16, fx: 50, fy: 72, blur: 0, sat: 0.97, br: 1.02, veil: 0.1 },
  { p: 1.0, s: 1.2, fx: 50, fy: 78, blur: 0.5, sat: 0.95, br: 1.03, veil: 0.14 },
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

// phones and small tablets: play the film rather than scrub it
const isSmallScreen = () => window.matchMedia("(max-width: 767px)").matches;

// the full-size film is 12MB — far too much to start playing over a cell
// connection, so phones get a 540p cut at ~40% of the weight
const DESKTOP_SRC = "/intro.mp4";
const MOBILE_SRC = "/intro-mobile.mp4";

// if the film hasn't produced a single decodable frame by now the visitor is
// on a connection that can't carry it — hand the screen to the hero instead
// of holding them on an empty cream rectangle
// (the poster is already on screen through this window, so waiting reads as
// a held opening shot rather than a stall)
const READY_TIMEOUT_MOBILE = 4500;
const READY_TIMEOUT_DESKTOP = 7000;

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

function cam(p: number, keys: CamKey[]): CamKey {
  let a = keys[0];
  let b = keys[keys.length - 1];
  for (let i = 0; i < keys.length - 1; i++) {
    if (p >= keys[i].p && p <= keys[i + 1].p) {
      a = keys[i];
      b = keys[i + 1];
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
  const posterRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const captionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [disabled, setDisabled] = useState(false);
  const [mobile, setMobile] = useState(false);
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

    const small = isSmallScreen();
    setMobile(small);
    const keys = small ? CAM_MOBILE : CAM;

    // the source is chosen here rather than in the markup so that neither
    // build downloads the other's file, and so a visitor who never sees the
    // film (reduced motion, already played this session) never fetches it
    const src = small ? MOBILE_SRC : DESKTOP_SRC;
    if (video.getAttribute("src") !== src) {
      video.src = src;
      video.load();
    }
    // the film hands the stage over earlier on a phone: the hero copy is the
    // reason the visitor is here, and a phone screen is all film until then
    const handover = small ? 0.7 : 0.86;
    const handoverSpan = small ? 0.2 : 0.12;

    // measure against the pinned layer, not window.innerHeight: on mobile
    // 100vh is the *large* viewport (URL bar hidden) while innerHeight is
    // whatever is visible right now, and mixing the two made the progress
    // run out before the film reached its last frame
    let top = 0;
    let span = 1;
    const measure = () => {
      top = el.getBoundingClientRect().top + window.scrollY;
      span = Math.max(el.offsetHeight - layer.offsetHeight, 1);
      setIntro({ zoneBottom: top + span });
    };
    measure();

    setIntro({ enabled: true, done: window.scrollY >= getIntro().zoneBottom });
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);

    const bail = () => {
      setIntro({ enabled: false, done: true, zoneBottom: 0 });
      setDisabled(true);
    };
    video.addEventListener("error", bail);

    // no frame ever arrived — don't strand the visitor on a blank screen
    const readyTimer = window.setTimeout(
      () => {
        if (video.readyState < 2) bail();
      },
      small ? READY_TIMEOUT_MOBILE : READY_TIMEOUT_DESKTOP
    );

    let playing = false;
    let autoplayBlocked = false;

    // iOS will not paint a frame of a video that has never played, so prime
    // it as soon as there is data. Desktop pauses again straight away and
    // goes back to scrubbing; mobile keeps rolling and lets playback time
    // drive the story.
    const onReady = () => {
      window.clearTimeout(readyTimer);
      video.style.opacity = "1";
      const started = video.play();
      if (started && typeof started.then === "function") {
        started
          .then(() => {
            if (small) {
              playing = true;
            } else {
              video.pause();
            }
          })
          .catch(() => {
            autoplayBlocked = true;
            // scrubbing is all that's left; the poster carries the frame
            // if the seeks come back empty
          });
      } else if (!small) {
        video.pause();
      }
    };
    video.addEventListener("loadeddata", onReady);
    if (video.readyState >= 2) onReady();

    let raf = 0;
    let current = 0;
    let done = getIntro().done;
    // mobile progress never walks backwards: scrolling up shouldn't rewind a
    // film that is playing forward
    let floor = 0;

    const finish = () => {
      // the film is over and the hero owns the screen: remove the scroll
      // zone above it so scrolling up never scrubs the film again.
      // The document only loses (height + the negative bottom margin) —
      // measure it rather than assuming the pinned layer is exactly 100vh,
      // which it isn't on a phone with the URL bar showing.
      markIntroSeen();
      const mb = parseFloat(getComputedStyle(el).marginBottom) || 0;
      const removed = Math.max(el.offsetHeight + mb, 0);
      collapseShiftRef.current = Math.min(window.scrollY, removed);
      setDisabled(true);
    };

    const tick = () => {
      const layerHeight = layer.offsetHeight;
      const max = Math.max(el.offsetHeight - layerHeight, 1);
      const scrollP = Math.min(1, Math.max(0, (window.scrollY - top) / max));

      let p = scrollP;
      if (small) {
        const dur = video.duration;
        const playP =
          playing && dur && isFinite(dur) ? Math.min(1, video.currentTime / Math.max(dur - 0.12, 0.1)) : 0;
        // whichever is further along wins — an impatient swipe skips ahead,
        // a still thumb still gets the whole film
        floor = Math.max(floor, playP, scrollP);
        p = floor;
        if (video.ended) p = 1;
      }

      if (p >= 0.995) {
        finish();
        return;
      }

      // scrub — desktop only. Seeking is exactly what phones can't do here,
      // and on mobile the frames are already arriving from playback.
      if (!small || autoplayBlocked) {
        const dur = video.duration || 10;
        const target = p * Math.max(dur - 0.05, 0);
        current += (target - current) * (small ? 0.4 : 0.22);
        if (video.readyState >= 2 && !video.seeking && Math.abs(video.currentTime - current) > 0.005) {
          video.currentTime = current;
        }
      }

      // camera: recompose the frame as the story progresses
      const k = cam(p, keys);
      const lim = (k.s - 1) * 50;
      const tx = Math.max(-lim, Math.min(lim, (50 - k.fx) * k.s));
      const ty = Math.max(-lim, Math.min(lim, (50 - k.fy) * k.s));
      const transform = `translate(${tx.toFixed(2)}%, ${ty.toFixed(2)}%) scale(${k.s.toFixed(3)})`;
      const tone = `${GRADE} saturate(${(k.sat * GRADE_SAT).toFixed(2)}) brightness(${k.br.toFixed(2)})`;
      const filter = k.blur > 0.05 ? `blur(${k.blur.toFixed(1)}px) ${tone}` : tone;
      video.style.transform = transform;
      video.style.filter = filter;
      // the poster rides the same camera, so a dropped or missing frame
      // reveals the same composition rather than an empty rectangle
      if (posterRef.current) {
        posterRef.current.style.transform = transform;
        posterRef.current.style.filter = filter;
      }
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
      const fade = p < handover ? 1 : Math.max(0, 1 - (p - handover) / handoverSpan);
      layer.style.opacity = fade.toFixed(3);

      // the logo drifts upward with the scroll and hands the stage to the story
      if (markRef.current) {
        const mo = Math.max(0, Math.min(1, (0.3 - p) / 0.09));
        markRef.current.style.opacity = mo.toFixed(2);
        markRef.current.style.transform = `translateY(${(-(p / 0.3) * 70).toFixed(1)}px)`;
      }
      if (hintRef.current) hintRef.current.style.opacity = p > 0.04 ? "0" : "1";

      if (p >= handover && !done) {
        done = true;
        // the film has effectively played through — don't replay it when
        // the visitor comes back to the home page this session
        markIntroSeen();
        setIntro({ done: true });
      } else if (p < handover - 0.14 && done) {
        done = false;
        setIntro({ done: false });
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(readyTimer);
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
      video.removeEventListener("error", bail);
      video.removeEventListener("loadeddata", onReady);
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
        // h-screen is the fallback; 100dvh caps the pinned frame to what the
        // phone is actually showing, so the bottom of the film (and the
        // scroll hint) never sit under the browser chrome
        className="sticky top-0 h-screen w-full overflow-hidden pointer-events-none"
        style={{ maxHeight: "100dvh", backgroundColor: "#efe6d5" }}
      >
        {/* the film's own first frame, 86KB and always decodable — the floor
            under every frame the video fails to deliver */}
        <div ref={posterRef} className="absolute inset-0" style={{ willChange: "transform, filter" }}>
          <Image
            src="/intro-poster.jpg"
            alt=""
            aria-hidden
            fill
            priority
            fetchPriority="high"
            quality={70}
            sizes="100vw"
            className="object-cover"
          />
        </div>

        {/* src is assigned on mount — see the effect above */}
        <video
          ref={videoRef}
          poster="/intro-poster.jpg"
          muted
          loop={false}
          playsInline
          preload="auto"
          disablePictureInPicture
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
          style={{ willChange: "transform, filter", opacity: 0 }}
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

        {/* film grain over the whole frame — a blended full-screen layer is
            an expensive thing to composite on a phone, so desktop only */}
        {!mobile && (
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
        )}

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
            className="absolute left-[8%] right-[8%] bottom-[22%] sm:bottom-[18%] max-w-md font-playfair italic font-medium text-xl sm:text-3xl lg:text-4xl leading-snug"
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
          className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-foreground/70 transition-opacity duration-700"
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
