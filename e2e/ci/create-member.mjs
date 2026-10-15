// PLAT-03: creates the run's test member on the job's local Supabase through
// its admin API, with a password generated here and never printed, then hands
// both to the following steps through $GITHUB_ENV. Only ever pointed at the
// local stack the workflow started: it refuses any other host.
import { randomBytes } from 'node:crypto'
import { appendFileSync } from 'node:fs'

const url = process.env.SB_API_URL
const serviceKey = process.env.SB_SERVICE_ROLE_KEY
const email = process.env.E2E_EMAIL
if (!url || !serviceKey || !email) {
	throw new Error('SB_API_URL, SB_SERVICE_ROLE_KEY and E2E_EMAIL are required')
}
const host = new URL(url).hostname
if (host !== '127.0.0.1' && host !== 'localhost') {
	throw new Error(`Refusing to create a member on ${host}: local stack only`)
}

const password = randomBytes(24).toString('base64url')
const res = await fetch(`${url}/auth/v1/admin/users`, {
	method: 'POST',
	headers: {
		apikey: serviceKey,
		Authorization: `Bearer ${serviceKey}`,
		'Content-Type': 'application/json',
	},
	body: JSON.stringify({ email, password, email_confirm: true }),
})
if (!res.ok) {
	throw new Error(
		`Creating the member failed: ${res.status} ${await res.text()}`,
	)
}

console.log(`::add-mask::${password}`)
if (process.env.GITHUB_ENV) {
	appendFileSync(process.env.GITHUB_ENV, `E2E_PASSWORD=${password}\n`)
}
console.log(`Created ${email} on the local stack`)
