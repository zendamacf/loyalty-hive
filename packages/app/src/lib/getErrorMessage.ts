import i18n from "@/i18n";
import { I18nNamespace } from "@/i18n/i18n.constants";

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
  return i18n.t(`${I18nNamespace.Common}:errors.generic`);
}
