import { get } from 'svelte/store';
import { appState } from '../stores/appState';
import { translations, type TranslationKey } from './translations';

export function t(key: TranslationKey): string {
  const state = get(appState);
  const lang = state.currentLang;
  return translations[lang][key] || translations.en[key] || key;
}

export { translations, type TranslationKey };