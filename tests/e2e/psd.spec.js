import {test, expect} from '@playwright/test'

test('PSD route loads', async ({page}) => {
    await page.goto('/psd')
    await expect(page.getByText('Particle Size Distribution')).toBeVisible()
})
