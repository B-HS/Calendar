import type { Locale, LocaleSetting, Translations } from './types'
import { ko, en, ja, zh } from './locales'

export type { Locale, LocaleSetting, Translations }

const translations: Record<Locale, Translations> = {
	ko,
	en,
	ja,
	zh
}

const LOCALE_STORAGE_KEY = 'app-locale'
const DEFAULT_SETTING: LocaleSetting = 'auto'

const detectBrowserLocale = (): Locale => {
	if (typeof window === 'undefined') return 'ko'

	const browserLang = navigator.language.toLowerCase()

	if (browserLang.startsWith('ko')) return 'ko'
	if (browserLang.startsWith('ja')) return 'ja'
	if (browserLang.startsWith('zh')) return 'zh'
	if (browserLang.startsWith('en')) return 'en'

	return 'ko'
}

const getStoredSetting = (): LocaleSetting | null => {
	if (typeof window === 'undefined') return null
	const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
	if (stored === 'auto' || stored === 'ko' || stored === 'en' || stored === 'ja' || stored === 'zh') {
		return stored
	}
	return null
}

let currentSetting: LocaleSetting = DEFAULT_SETTING

export const localeStore = {
	get setting(): LocaleSetting {
		if (typeof window !== 'undefined' && currentSetting === DEFAULT_SETTING) {
			const stored = getStoredSetting()
			if (stored) {
				currentSetting = stored
			}
		}
		return currentSetting
	},
	set setting(value: LocaleSetting) {
		currentSetting = value
		if (typeof window !== 'undefined') {
			if (value === 'auto') {
				localStorage.removeItem(LOCALE_STORAGE_KEY)
			} else {
				localStorage.setItem(LOCALE_STORAGE_KEY, value)
			}
		}
	},
	get locale(): Locale {
		const setting = this.setting
		if (setting === 'auto') {
			return detectBrowserLocale()
		}
		return setting
	},
	set locale(value: Locale) {
		this.setting = value
	},
	get t() {
		return translations[this.locale]
	}
}

export const getTranslations = (locale: Locale): Translations => translations[locale]

export const t = (locale: Locale) => translations[locale]

export const LOCALE_OPTIONS: LocaleSetting[] = ['auto', 'ko', 'en', 'ja', 'zh']
