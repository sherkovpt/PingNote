import { test, expect } from '@playwright/test';

test.describe('PingNote - Note Creation Flow', () => {
    test('should display the homepage correctly', async ({ page }) => {
        await page.goto('/');

        // Check header
        await expect(page.locator('h1')).toContainText('PingNote');

        // Check textarea is present and focused
        const textarea = page.locator('textarea');
        await expect(textarea).toBeVisible();

        // Check TTL options
        await expect(page.getByText('5 min')).toBeVisible();
        await expect(page.getByText('10 min')).toBeVisible();
        await expect(page.getByText('1 hora')).toBeVisible();
        await expect(page.getByText('24 horas')).toBeVisible();

        // Check create button
        await expect(page.getByRole('button', { name: /Criar e Partilhar/i })).toBeVisible();
    });

    test('should create a simple note', async ({ page }) => {
        await page.goto('/');

        // Type a note
        const textarea = page.locator('textarea');
        await textarea.fill('This is a test note from Playwright!');

        // Click create button
        await page.getByRole('button', { name: /Criar e Partilhar/i }).click();

        // Wait for success
        await expect(page.getByText('Nota criada!')).toBeVisible({ timeout: 5000 });

        // Check short code is displayed (6 uppercase characters)
        const shortCodeElement = page.locator('span.font-mono.text-2xl');
        await expect(shortCodeElement).toBeVisible();
        const shortCode = await shortCodeElement.textContent();
        expect(shortCode).toMatch(/^[A-Z0-9]{6}$/);

        // Check copy buttons are present
        await expect(page.getByRole('button', { name: /Copiar link/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Copiar código/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /QR Code/i })).toBeVisible();
    });

    test('should view a created note', async ({ page, context }) => {
        await page.goto('/');

        const noteContent = 'Note content for viewing test ' + Date.now();

        // Create a note
        await page.locator('textarea').fill(noteContent);
        await page.getByRole('button', { name: /Criar e Partilhar/i }).click();

        // Wait for success
        await expect(page.getByText('Nota criada!')).toBeVisible({ timeout: 5000 });

        // Get the short code
        const shortCodeElement = page.locator('span.font-mono.text-2xl');
        const shortCode = await shortCodeElement.textContent();

        // Open a new page to view the note via code
        const viewPage = await context.newPage();
        await viewPage.goto(`/c/${shortCode}`);

        // Should be redirected to note view and see content
        await expect(viewPage.locator('.note-textarea')).toContainText(noteContent, { timeout: 5000 });

        // Check copy button
        await expect(viewPage.getByRole('button', { name: /Copiar conteúdo/i })).toBeVisible();
    });
});

test.describe('PingNote - One-Time Notes', () => {
    test('should consume one-time note after first view', async ({ page, context }) => {
        await page.goto('/');

        const noteContent = 'One-time secret ' + Date.now();

        // Create a one-time note
        await page.locator('textarea').fill(noteContent);

        // Enable one-time mode
        await page.getByText('Leitura única').click();

        await page.getByRole('button', { name: /Criar e Partilhar/i }).click();

        // Wait for success
        await expect(page.getByText('Nota criada!')).toBeVisible({ timeout: 5000 });
        await expect(page.getByText('Leitura única')).toBeVisible();

        // Get the short code
        const shortCodeElement = page.locator('span.font-mono.text-2xl');
        const shortCode = await shortCodeElement.textContent();

        // First view - should succeed
        const viewPage1 = await context.newPage();
        await viewPage1.goto(`/c/${shortCode}`);
        await expect(viewPage1.locator('.note-textarea')).toContainText(noteContent, { timeout: 5000 });

        // Second view - should fail
        const viewPage2 = await context.newPage();
        await viewPage2.goto(`/c/${shortCode}`);
        await expect(viewPage2.getByText(/já foi lida|não encontrada/i)).toBeVisible({ timeout: 5000 });
    });
});

test.describe('PingNote - Code Entry', () => {
    test('should allow manual code entry', async ({ page }) => {
        await page.goto('/c');

        // Check the page
        await expect(page.getByText('Abrir com código')).toBeVisible();

        // Input should be present
        const input = page.locator('input');
        await expect(input).toBeVisible();

        // Type an invalid code
        await input.fill('ABC123');

        // Button should be enabled
        const button = page.getByRole('button', { name: /Abrir nota/i });
        await expect(button).toBeEnabled();

        // Click and expect error (code doesn't exist)
        await button.click();
        await expect(page.getByText(/não encontrado|expirado/i)).toBeVisible({ timeout: 5000 });
    });
});
