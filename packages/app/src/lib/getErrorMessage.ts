export function getErrorMessage(err: unknown): string {
  if (
    err &&
    typeof err === "object" &&
    "error" in err &&
    typeof (err as { error: unknown }).error === "string"
  ) {
    return (err as { error: string }).error;
  }
  if (typeof err === "string") {
    return err;
  }
  console.error(err);
  return "Something went wrong. Please try again.";
}
