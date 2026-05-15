import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enAuth from "@/locales/en/auth.json";
import enBrands from "@/locales/en/brands.json";
import enCards from "@/locales/en/cards.json";
import enCommon from "@/locales/en/common.json";
import enScan from "@/locales/en/scan.json";
import enSettings from "@/locales/en/settings.json";
import esAuth from "@/locales/es/auth.json";
import esBrands from "@/locales/es/brands.json";
import esCards from "@/locales/es/cards.json";
import esCommon from "@/locales/es/common.json";
import esScan from "@/locales/es/scan.json";
import esSettings from "@/locales/es/settings.json";

void i18n.use(initReactI18next).init({
  resources: {
    en: {
      common: enCommon,
      auth: enAuth,
      cards: enCards,
      brands: enBrands,
      scan: enScan,
      settings: enSettings,
    },
    es: {
      common: esCommon,
      auth: esAuth,
      cards: esCards,
      brands: esBrands,
      scan: esScan,
      settings: esSettings,
    },
  },
  lng: "en",
  fallbackLng: "en",
  supportedLngs: ["en", "es"],
  defaultNS: "common",
  ns: ["common", "auth", "cards", "brands", "scan", "settings"],
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export default i18n;
