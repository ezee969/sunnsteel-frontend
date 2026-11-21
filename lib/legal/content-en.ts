import type { LegalDocument, LegalFacts } from './legal-facts'

/**
 * BILL-07: the English translation of the Spanish texts in `content-es.ts`,
 * section for section. The Spanish version governs; the page says so.
 */

export function termsEn(f: LegalFacts): LegalDocument {
	return {
		title: 'Terms and conditions',
		sections: [
			{
				heading: 'Questions and complaints',
				blocks: [
					`For questions and complaints about Sunnsteel, write to ${f.email}.`,
				],
			},
			{
				heading: 'Acceptance',
				blocks: [
					'By creating an account or using Sunnsteel you accept these terms and the [Privacy policy](/privacidad). If you do not agree, do not use the service.',
				],
			},
			{
				heading: 'Age',
				blocks: [
					`You must be at least ${f.minimumAge} to use Sunnsteel. If you are under 18, you need your parent's or guardian's permission to buy Sunnsteel Pro.`,
				],
			},
			{
				heading: 'Your account',
				blocks: [
					'Use true details and keep access to your account safe: you are responsible for what is done with it. You can export all your data and delete your account at any time from Settings.',
				],
			},
			{
				heading: 'The service',
				blocks: [
					'Sunnsteel is for planning and logging workouts, following your progress and sharing it with other members according to your privacy settings. We may improve, change or stop offering features; if a change affects something you already paid for, we will tell you in advance.',
				],
			},
			{
				heading: 'Plans, price and free trial',
				blocks: [
					`The Free plan costs nothing. Sunnsteel Pro is a monthly subscription of ${f.price} a month, the final price in Argentine pesos, paid through Mercado Pago. We never see or store your card details.`,
					`Each account's first subscription starts with a ${f.trialDays}-day free trial: unless you cancel before it ends, the first month is charged. After that the subscription renews every month until you cancel it.`,
					'If we change the price, we will tell you at least 30 days before it applies, and you can cancel before then.',
					"While payments run in Mercado Pago's test mode, the app says so wherever Pro is offered and no real money is charged.",
				],
			},
			{
				heading: 'Failed payments',
				blocks: [
					`If a renewal charge fails, you keep Pro for ${f.graceDays} days while Mercado Pago retries it, and we tell you in the app. If it cannot be charged, you move to Free without losing any data.`,
				],
			},
			{
				heading: 'Cancelling the subscription',
				blocks: [
					'You can cancel whenever you like from Settings or from the [botón de baja](/baja), even without signing in. Pro lasts until the end of the period you already paid, and you are not charged again. Cancelling deletes nothing you created.',
				],
			},
			{
				heading: 'Right of withdrawal',
				blocks: [
					`You can revoke your Sunnsteel Pro purchase within ${f.revocationDays} calendar days of making it, without giving a reason and at no cost, as article 34 of Consumer Protection Law 24.240 and article 1110 of the Civil and Commercial Code provide. Use the [botón de arrepentimiento](/arrepentimiento): you get a code at once and we refund what was charged. The details are in the [Refund policy](/reembolsos).`,
				],
			},
			{
				heading: 'Founding members',
				blocks: [
					'Accounts that already existed when Pro launched, in October 2026, have Pro at no cost and with no end date as founding members.',
				],
			},
			{
				heading: 'Acceptable use',
				blocks: [
					'By using Sunnsteel you agree not to:',
					{
						list: [
							'harass, threaten or discriminate against other members;',
							'post illegal, hateful or sexual content, or pretend to be someone else;',
							'use the service to send spam or automate its use abusively;',
							"try to access other people's accounts or data, or break the service's security.",
						],
					},
					"You can report content and block other members. Moderation may hide content or restrict an account's messages when it breaks these rules, and every decision is recorded.",
				],
			},
			{
				heading: 'Your content',
				blocks: [
					'What you create in Sunnsteel (routines, workouts, notes, messages) stays yours. You allow us to store it and show it only as needed to provide the service and according to your privacy settings. If you share a routine, other members can copy it into a routine of their own, independent of yours.',
				],
			},
			{
				heading: 'Health',
				blocks: [
					"Sunnsteel gives no medical advice and does not replace a health or training professional. See one before starting or changing a programme, especially if you have an injury or a medical condition. You train at your own risk. The app's suggestions and the routine drafts written with artificial intelligence are guidance only.",
				],
			},
			{
				heading: 'Availability',
				blocks: [
					'We do our best to keep Sunnsteel working at all times, but there may be outages or errors. Nothing in these terms limits the rights the Consumer Protection Law gives you.',
				],
			},
			{
				heading: 'Changes to these terms',
				blocks: [
					'If we change these terms, we will tell you in the app with reasonable notice. If you do not agree with the new ones, you can cancel your subscription and delete your account.',
				],
			},
			{
				heading: 'Governing law and complaints',
				blocks: [
					'These terms are governed by the laws of the Argentine Republic. Any dispute goes to the courts that Law 24.240 makes competent, including those of your own domicile.',
					`Before complaining elsewhere you can write to us at ${f.email}. You can also go to the consumer protection authority where you live.`,
				],
			},
		],
	}
}

export function privacyEn(f: LegalFacts): LegalDocument {
	return {
		title: 'Privacy policy',
		sections: [
			{
				heading: 'Contact about your data',
				blocks: [`Write to ${f.email} with any question about your data.`],
			},
			{
				heading: 'What data we process',
				blocks: [
					{
						list: [
							'Account: email, name, username, profile photo, language, time zone and preferences.',
							'Training: the routines, workouts, sets, notes, goals and body measurements you log.',
							'Social: whom you follow and who follows you, activity, comments, direct messages, reports and blocks.',
							'Payments: your subscription status and Mercado Pago identifiers. We never receive your card details.',
							'Technical: error logs with your IP address and browser, for security and to fix faults.',
							'Revocation or cancellation requests: the name, email and reference you write.',
						],
					},
				],
			},
			{
				heading: 'What we use it for',
				blocks: [
					'To provide the service and show you your progress, for the social features according to your privacy settings, to charge Sunnsteel Pro, for security and moderation, and to meet legal obligations such as invoicing. We do not sell your data or use it for advertising.',
				],
			},
			{
				heading: 'Who processes it',
				blocks: [
					'We use these providers, who process data on our behalf and only to provide the service:',
					{
						list: [
							'Supabase: sign-in and profile photos.',
							'Railway: the server and the database.',
							'Vercel: hosting the website.',
							'Sentry: error logging.',
							'Mercado Pago: subscription payments.',
							'Google: only if you sign in with Google.',
							'Anthropic: only the text you write to ask for a routine draft; it is not stored.',
						],
					},
				],
			},
			{
				heading: 'International transfer',
				blocks: [
					'These providers host data outside Argentina, for example in the United States. We choose providers that commit to protecting the data they process on our behalf.',
				],
			},
			{
				heading: 'Who sees what',
				blocks: [
					'Your privacy settings decide what each person sees of your profile and activity, and you can change them at any time. Direct messages are stored on our server and are not end-to-end encrypted. If someone reports a message, moderation can read that message and up to five before it in that conversation.',
				],
			},
			{
				heading: 'How long we keep it',
				blocks: [
					'For as long as you have an account. If you delete it, everything of yours is deleted at once, except what we must keep by law, such as invoicing records, and revocation or cancellation requests, which are kept as proof. Notifications are deleted after 90 days.',
				],
			},
			{
				heading: 'Your rights',
				blocks: [
					`You can access, correct, update or ask us to delete your data, as Personal Data Protection Law 25.326 provides. From Settings you can export it and delete your account; for anything else, write to ${f.email}. Access is free at intervals of no less than six months, unless you show a legitimate interest.`,
					'The Agency for Access to Public Information, as the supervisory body of Law 25.326, has the power to handle complaints and claims from anyone whose rights are affected by a breach of the rules on personal data protection.',
				],
			},
			{
				heading: 'Age',
				blocks: [`Sunnsteel is not meant for anyone under ${f.minimumAge}.`],
			},
			{
				heading: 'Cookies and storage',
				blocks: [
					'We use only the cookies and browser storage the app needs to work: your session, your language and your display preferences. We use no advertising or tracking cookies.',
				],
			},
			{
				heading: 'Changes',
				blocks: [
					'If we change this policy, we will tell you in the app before it applies.',
				],
			},
		],
	}
}

export function refundsEn(f: LegalFacts): LegalDocument {
	return {
		title: 'Refund policy',
		sections: [
			{
				heading: 'Withdrawal: the first days',
				blocks: [
					`You can revoke your Sunnsteel Pro purchase within ${f.revocationDays} calendar days of making it, without giving a reason. We cancel the subscription and refund everything charged, to the same payment method.`,
					`To ask, use the [botón de arrepentimiento](/arrepentimiento), no sign-in needed, or write to ${f.email}. You get a code at once as proof of your request.`,
					'If you are still in the free trial and nothing was charged, cancelling the subscription is enough.',
				],
			},
			{
				heading: 'After that period',
				blocks: [
					'We do not refund periods that have already started. When you cancel, Pro lasts until the end of the period you already paid, and you are not charged again. You can do it from Settings or from the [botón de baja](/baja).',
				],
			},
			{
				heading: 'Charges made by mistake',
				blocks: [
					`If you were charged twice, or after cancelling, write to ${f.email} and we refund the full amount.`,
				],
			},
			{
				heading: 'How refunds are made',
				blocks: [
					'Refunds go through Mercado Pago, to the same payment method you used. How long the money takes to appear in your account or on your card depends on Mercado Pago and your bank.',
				],
			},
			{
				heading: 'Contact',
				blocks: [`Email: ${f.email}.`],
			},
		],
	}
}
