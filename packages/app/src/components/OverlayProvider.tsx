import {
  createContext,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { type View as RNView, StyleSheet, View } from "react-native";

type OverlayContextValue = {
  setOverlay: (content: ReactNode | null) => void;
  layerRef: RefObject<RNView | null>;
};

const OverlayContext = createContext<OverlayContextValue | null>(null);

type OverlayProviderProps = {
  children: ReactNode;
};

/** Renders full-screen overlays in the main window (avoids RN Modal on Android). */
export const OverlayProvider = ({ children }: OverlayProviderProps) => {
  const [overlay, setOverlayState] = useState<ReactNode | null>(null);
  const layerRef = useRef<RNView | null>(null);
  const setOverlay = useCallback((content: ReactNode | null) => {
    setOverlayState(content);
  }, []);
  const value = useMemo(() => ({ setOverlay, layerRef }), [setOverlay]);

  return (
    <OverlayContext.Provider value={value}>
      <View style={styles.host}>
        {children}
        <View
          ref={layerRef}
          collapsable={false}
          style={styles.layer}
          pointerEvents={overlay != null ? "box-none" : "none"}
        >
          {overlay}
        </View>
      </View>
    </OverlayContext.Provider>
  );
};

export const useOverlay = (): OverlayContextValue => {
  const context = useContext(OverlayContext);
  if (context == null) {
    throw new Error("useOverlay must be used within OverlayProvider");
  }
  return context;
};

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
  layer: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
    elevation: 1000,
  },
});
