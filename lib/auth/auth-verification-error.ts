export class AuthVerificationCancelledError extends Error {
	constructor() {
		super('Authentication changed while verification was pending')
		this.name = 'AuthVerificationCancelledError'
	}
}
