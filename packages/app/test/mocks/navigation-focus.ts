import React from "react";

let registeredEffect: (() => void | (() => void)) | null = null;
let activeCleanup: (() => void) | null = null;

export const navigationFocusMocks = {
  blur: () => {
    activeCleanup?.();
    activeCleanup = null;
  },
  focus: () => {
    if (!registeredEffect) {
      return;
    }
    const cleanup = registeredEffect();
    activeCleanup = typeof cleanup === "function" ? cleanup : null;
  },
};

export function getNavigationFocusMocks() {
  return (
    globalThis as typeof globalThis & {
      __navigationFocusMocks: typeof navigationFocusMocks;
    }
  ).__navigationFocusMocks;
}

export function createNavigationNativeModule() {
  return {
    useFocusEffect: (effect: () => void | (() => void)) => {
      React.useEffect(() => {
        registeredEffect = effect;
        const cleanup = effect();
        activeCleanup = typeof cleanup === "function" ? cleanup : null;

        return () => {
          activeCleanup?.();
          activeCleanup = null;
          registeredEffect = null;
        };
      }, [effect]);
    },
  };
}
