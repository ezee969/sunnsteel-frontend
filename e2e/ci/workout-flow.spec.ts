import { expect, type Page, test } from '@playwright/test'

/**
 * PLAT-03: the one end-to-end path CI holds every pull request to, on a stack
 * built from both repositories: a new member signs in, skips setup, builds a
 * routine from a starter template, starts one of its days and trains it to the
 * recap. The member is created for the run on the job's own local Supabase
 * (`e2e/ci/create-member.mjs`); nothing here touches a real account.
 *
 * It asserts what a member would notice break -- that each step lands where it
 * should -- and leaves layout to the local visual sweep.
 */

const email = process.env.E2E_EMAIL
const password = process.env.E2E_PASSWORD

/** The set to log next, found by its tick's name so it survives re-renders. */
async function logCurrentSet(page: Page, reps: string, weight: string) {
	const label = await page
		.locator('[data-state="current"]')
		.first()
		.getByRole('checkbox')
		.first()
		.getAttribute('aria-label')
	if (!label) throw new Error('No current set to log')
	const tick = page.getByRole('checkbox', { name: label, exact: true })
	const row = page.getByTestId('set-log-container').filter({ has: tick })
	await row.locator('input[id$="-reps"]').fill(reps)
	const weightField = row.locator('input[id$="-weight"]')
	if (!(await weightField.inputValue())) await weightField.fill(weight)
	await tick.click()
	await expect(tick).toHaveAttribute('data-state', 'checked')
	return label
}

test('a new member signs in, builds a routine from a template and trains it to its recap', async ({
	page,
}) => {
	expect(email, 'E2E_EMAIL is set by the workflow').toBeTruthy()
	expect(password, 'E2E_PASSWORD is set by the workflow').toBeTruthy()

	await test.step('sign in', async () => {
		await page.goto('/login')
		await page.getByRole('textbox', { name: 'Email' }).fill(email!)
		await page.getByLabel('Password', { exact: true }).fill(password!)
		await page.getByRole('button', { name: 'Log in' }).click()
		await page.waitForURL(/\/(dashboard|welcome)(\?|$)/, { timeout: 60_000 })
	})

	await test.step('skip setup, which a new account is offered once', async () => {
		const skip = page.getByRole('button', { name: 'Skip for now' })
		await page
			.waitForURL(/\/welcome(\?|$)/, { timeout: 30_000 })
			.catch(() => undefined)
		if (await skip.isVisible().catch(() => false)) {
			await skip.click()
			await page.waitForURL(/\/dashboard(\?|$)/)
		}
	})

	await test.step('build a routine from a starter template', async () => {
		await page.goto('/routines/new?template=full-body-foundations')
		// Four steps; the last two load on demand, so each move waits for the
		// stepper to mark the next step current rather than for a button.
		for (const step of [2, 3, 4]) {
			await page.getByRole('button', { name: /^(Next|Review)$/ }).click()
			await expect(
				page.getByRole('button', {
					name: new RegExp(`^Step ${step} of 4: .*current step$`),
				}),
			).toBeVisible({ timeout: 30_000 })
		}
		const create = page.getByRole('button', { name: 'Create Routine' })
		await expect(create).toBeVisible({ timeout: 30_000 })
		await create.click()
		await page.waitForURL(url => !url.pathname.endsWith('/routines/new'), {
			timeout: 60_000,
		})
	})

	await test.step('start one of its days', async () => {
		await page.goto('/workouts')
		await page.getByRole('button', { name: 'Train another day' }).click()
		await page
			.getByRole('dialog')
			.getByRole('button', { name: /^Start .+ from Full Body Foundations$/ })
			.first()
			.click()
		await page.waitForURL(/\/workouts\/sessions\/[^/]+$/, { timeout: 60_000 })
	})

	await test.step('log three sets and finish', async () => {
		for (let set = 0; set < 3; set++) await logCurrentSet(page, '5', '40')
		await page.getByRole('button', { name: 'Finish Session' }).first().click()
		await page
			.getByRole('alertdialog')
			.getByRole('button', { name: 'Finish Session' })
			.click()
	})

	await test.step('see the recap', async () => {
		await expect(page.getByText('Completed sets').first()).toBeVisible({
			timeout: 60_000,
		})
	})
})
