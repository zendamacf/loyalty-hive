export type CardView = "1D" | "2D";

export function resolveCardView(view: string | null | undefined): CardView {
  return view === "2D" ? "2D" : "1D";
}
