import { routing } from "./routing";
import enMessages from "../messages/en.json";
import zhMessages from "../messages/zh.json";

export type AppLocale = (typeof routing.locales)[number];

export function resolveLocale(locale: string): AppLocale {
  if (routing.locales.includes(locale as AppLocale)) {
    return locale as AppLocale;
  }

  return routing.defaultLocale;
}

export async function getMessagesForLocale(locale: string) {
  const resolvedLocale = resolveLocale(locale);

  return resolvedLocale === "zh" ? zhMessages : enMessages;
}
