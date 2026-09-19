import { isInitialized, trackScreenView } from "@bitte-kaufen/expo-umami";
import { useEffect } from "react";

type TrackScreenViewOptions = {
  title?: string;
};

export function useTrackScreenView(
  path: string,
  options?: TrackScreenViewOptions,
): void {
  const title = options?.title;

  useEffect(() => {
    if (!isInitialized()) {
      return;
    }

    void trackScreenView(path, title ? { title } : undefined);
  }, [path, title]);
}
