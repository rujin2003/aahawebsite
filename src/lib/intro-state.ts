// Tiny shared store coordinating the cinematic intro with the header,
// the hero content and the hanging felt characters.

import { useSyncExternalStore } from "react";

type IntroState = {
  enabled: boolean; // a scroll-scrubbed intro is active on this page
  done: boolean; // the intro has played through (or none exists)
  zoneBottom: number; // document Y where the intro scroll zone ends
};

const state: IntroState = {
  enabled: false,
  done: true,
  zoneBottom: 0,
};

const listeners = new Set<() => void>();

export function getIntro(): Readonly<IntroState> {
  return state;
}

export function setIntro(partial: Partial<IntroState>) {
  Object.assign(state, partial);
  listeners.forEach((l) => l());
}

export function subscribeIntro(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

// True once the cinematic intro has played through (immediately true when
// no intro is active, e.g. mobile or reduced motion).
export function useIntroDone(): boolean {
  return useSyncExternalStore(
    subscribeIntro,
    () => state.done,
    () => true
  );
}
