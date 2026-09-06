import { NextResponse } from 'next/server'

const COOKIE_NAME = 'ss_session'
const MAX_AGE = 7 * 24 * 60 * 60 // 7 days, mirrors the backend marker lifetime

// The frontend owns this `ss_session` marker cookie because the Next.js
// middleware that reads it runs on the frontend's OWN domain. It cannot be set
// by the backend: a cookie in the backend's response is scoped to the backend's
// domain (a third-party cookie relative to this app) and is never sent back to
// the frontend domain, so middleware would never see it. This is a non-secret
// routing marker only — real auth is the Supabase bearer token attached to each
// API request.
function sessionCookie(value: string, maxAge: number) {
	return {
		name: COOKIE_NAME,
		value,
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax' as const,
		path: '/',
		maxAge,
	}
}

export async function POST() {
	const res = NextResponse.json({ ok: true })
	res.cookies.set(sessionCookie('1', MAX_AGE))
	return res
}

export async function DELETE() {
	const res = NextResponse.json({ ok: true })
	res.cookies.set(sessionCookie('', 0))
	return res
}
