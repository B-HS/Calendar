export type Locale = 'ko' | 'en' | 'ja' | 'zh'
export type LocaleSetting = Locale | 'auto'

export interface Translations {
	common: {
		login: string
		logout: string
		register: string
		email: string
		password: string
		passwordConfirm: string
		name: string
		save: string
		cancel: string
		delete: string
		close: string
		copy: string
		loading: string
	}
	auth: {
		loginTitle: string
		registerTitle: string
		registerDescription: string
		loginLoading: string
		registerLoading: string
		loginWithGoogle: string
		noAccount: string
		hasAccount: string
		loginFailed: string
		registerFailed: string
		passwordMismatch: string
		passwordMinLength: string
	}
	header: {
		myCalendar: string
		editProfile: string
		changeLanguage: string
		selectLanguage: string
		changeTheme: string
		selectTheme: string
	}
	themes: {
		system: string
		light: string
		dark: string
	}
	profile: {
		title: string
		currentName: string
		newName: string
		profileImage: string
		changeImage: string
		removeImage: string
		updateSuccess: string
		updateFailed: string
		imageUploadFailed: string
	}
	languages: {
		auto: string
		ko: string
		en: string
		ja: string
		zh: string
	}
	schedule: {
		title: string
		pageTitle: string
		icsLink: string
		icsSubscription: string
		icsDescription: string
		regenerateLink: string
		createLink: string
		icsNotCreated: string
		icsCopied: string
		linkCreated: string
		newLinkGenerated: string
		linkGenerateFailed: string
		eventUpdated: string
		eventUpdateFailed: string
		eventCreated: string
		eventDeleted: string
		saveFailed: string
		deleteFailed: string
	}
	eventForm: {
		newEvent: string
		editEvent: string
		summary: string
		description: string
		location: string
		allDay: string
		start: string
		end: string
		color: string
	}
	landing: {
		heroTitle: string
		heroSubtitle: string
		heroDescription: string
		tryCta: string
		getStartedCta: string
		demoTitle: string
		demoDescription: string
		featuresTitle: string
		featuresSubtitle: string
		feature1Title: string
		feature1Description: string
		feature2Title: string
		feature2Description: string
		feature3Title: string
		feature3Description: string
		feature4Title: string
		feature4Description: string
		feature5Title: string
		feature5Description: string
		feature6Title: string
		feature6Description: string
		howToUseTitle: string
		howToUseSubtitle: string
		step1Title: string
		step1Description: string
		step2Title: string
		step2Description: string
		step3Title: string
		step3Description: string
		pricingTitle: string
		pricingSubtitle: string
		pricingFree: string
		pricingDescription: string
		pricingFeature1: string
		pricingFeature2: string
		pricingFeature3: string
		pricingFeature4: string
		footerDescription: string
	}
}
