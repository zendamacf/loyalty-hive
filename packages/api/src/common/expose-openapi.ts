/** Whether Swagger UI and OpenAPI JSON routes are mounted on the HTTP server. */
export function resolveExposeOpenApi(
  nodeEnv: string,
  exposeOpenApiEnv: string | undefined,
): boolean {
  if (exposeOpenApiEnv !== undefined && exposeOpenApiEnv !== "") {
    const normalized = exposeOpenApiEnv.trim().toLowerCase();
    if (normalized === "false" || normalized === "0" || normalized === "no") {
      return false;
    }
    if (normalized === "true" || normalized === "1" || normalized === "yes") {
      return true;
    }
  }

  return nodeEnv !== "production";
}
