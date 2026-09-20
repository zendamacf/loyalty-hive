import { AppState } from "react-native";

export function subscribeOnAppResume(
  onResume: () => void | Promise<void>,
): () => void {
  const subscription = AppState.addEventListener("change", (state) => {
    if (state === "active") {
      void onResume();
    }
  });

  return () => subscription.remove();
}
