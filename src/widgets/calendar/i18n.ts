export type Locale = 'ko' | 'en' | 'ja' | 'zh'

export interface CalendarTranslations {
	weekdays: {
		short: string[]
		long: string[]
	}
	months: {
		short: string[]
		long: string[]
	}
	today: string
	allDay: string
	timed: string
	noEvents: string
	add: string
	am: string
	pm: string
	hour: string
}

const translations: Record<Locale, CalendarTranslations> = {
	ko: {
		weekdays: {
			short: ['일', '월', '화', '수', '목', '금', '토'],
			long: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
		},
		months: {
			short: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
			long: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
		},
		today: '오늘',
		allDay: '종일',
		timed: '시간 지정',
		noEvents: '일정이 없습니다',
		add: '추가',
		am: '오전',
		pm: '오후',
		hour: '시'
	},
	en: {
		weekdays: {
			short: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
			long: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
		},
		months: {
			short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
			long: [
				'January',
				'February',
				'March',
				'April',
				'May',
				'June',
				'July',
				'August',
				'September',
				'October',
				'November',
				'December'
			]
		},
		today: 'Today',
		allDay: 'All Day',
		timed: 'Scheduled',
		noEvents: 'No events',
		add: 'Add',
		am: 'AM',
		pm: 'PM',
		hour: ''
	},
	ja: {
		weekdays: {
			short: ['日', '月', '火', '水', '木', '金', '土'],
			long: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日']
		},
		months: {
			short: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
			long: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
		},
		today: '今日',
		allDay: '終日',
		timed: '時間指定',
		noEvents: '予定がありません',
		add: '追加',
		am: '午前',
		pm: '午後',
		hour: '時'
	},
	zh: {
		weekdays: {
			short: ['日', '一', '二', '三', '四', '五', '六'],
			long: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
		},
		months: {
			short: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
			long: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
		},
		today: '今天',
		allDay: '全天',
		timed: '定时',
		noEvents: '没有日程',
		add: '添加',
		am: '上午',
		pm: '下午',
		hour: '点'
	}
}

export const getTranslations = (locale: Locale): CalendarTranslations => translations[locale]

export const dayjsLocaleMap: Record<Locale, string> = {
	ko: 'ko',
	en: 'en',
	ja: 'ja',
	zh: 'zh-cn'
}
