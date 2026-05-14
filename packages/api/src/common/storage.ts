import { config } from "./config";

export const logoUrl = (logoFile: string) =>
  `${config.server.fileStorageUrl}/logos/${logoFile}`;
