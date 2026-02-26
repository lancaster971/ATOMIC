import { mergeTranslations } from "ra-core";
import polyglotI18nProvider from "ra-i18n-polyglot";
import englishMessages from "ra-language-english";
import italianMessages from "./italianMessages";
import { crmEnglishMessages, crmItalianMessages } from "./crmMessages";

const translations: Record<string, () => object> = {
  en: () =>
    mergeTranslations(englishMessages, crmEnglishMessages),
  it: () =>
    mergeTranslations(italianMessages, crmItalianMessages),
};

export const i18nProvider = polyglotI18nProvider(
  (locale) => translations[locale](),
  "en",
  [
    { locale: "en", name: "English" },
    { locale: "it", name: "Italiano" },
  ],
  { allowMissing: true },
);
