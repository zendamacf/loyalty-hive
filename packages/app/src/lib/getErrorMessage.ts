import i18n from "@/i18n";
import { I18nNamespace } from "@/i18n/i18n.constants";

function genericErrorMessage(): string {
  return i18n.t(`${I18nNamespace.Common}:errors.generic`);
}

function readStringField(
  err: object,
  field: "error" | "message",
): string | undefined {
  if (
    field in err &&
    typeof (err as Record<string, unknown>)[field] === "string"
  ) {
    return (err as Record<string, string>)[field];
  }
  return undefined;
}

export function getErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) {
    return err.message;
  }

  if (err && typeof err === "object") {
    const apiError = readStringField(err, "error");
    if (apiError) {
      return apiError;
    }

    const message = readStringField(err, "message");
    if (message) {
      return message;
    }
  }

  if (typeof err === "string" && err.length > 0) {
    return err;
  }

  console.error(err);
  return genericErrorMessage();
}

export function isGenericErrorMessage(message: string): boolean {
  return message === genericErrorMessage();
}
