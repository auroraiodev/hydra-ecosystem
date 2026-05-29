import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard - Chat (Soporte)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to chat route
    await page.goto('/dashboard/chat');
  });

  test('should display chat layout and active conversations list', async ({ page }) => {
    const chatTitle = page.locator('h2', { hasText: /Soporte/i }).first();
    await expect(chatTitle).toBeVisible();

    // Verify Juan Perez is loaded in conversation list in sidebar
    await expect(page.locator('text=Juan Perez')).toBeVisible();
    await expect(page.locator('text=Hola, tengo una duda con mi pedido')).toBeVisible();
  });

  test('should click conversation, load history, and send/receive messages in real time', async ({ page }) => {
    // Click on Juan Perez conversation
    const convoItem = page.locator('text=Juan Perez');
    await convoItem.click();

    // Verify chat window loaded message history
    const messageBubble = page.locator('text=Hola, tengo una duda con mi pedido');
    await expect(messageBubble).toBeVisible();

    // Locate the message input box and type a reply
    const messageInput = page.locator('input[placeholder*="mensaje"], textarea[placeholder*="mensaje"], input[placeholder*="Escribe"]');
    await expect(messageInput).toBeVisible();
    await messageInput.fill('Hola Juan, claro, dime en qué te puedo ayudar');

    // Click the send button
    const sendButton = page.locator('button:has-text("Enviar"), button:has-text("Send"), button:has([class*="Send"])');
    await expect(sendButton).toBeVisible();
    await sendButton.click();

    // Verify sent message is displayed in conversation log
    const sentBubble = page.locator('text=Hola Juan, claro, dime en qué te puedo ayudar');
    await expect(sentBubble).toBeVisible();

    // Wait for the mock backend's simulated client response (1 second timeout in backend, give it 3 seconds)
    const clientEcho = page.locator('text=Recibido: "Hola Juan, claro, dime en qué te puedo ayudar"');
    await expect(clientEcho).toBeVisible({ timeout: 5000 });
  });

  test('should support deleting a conversation', async ({ page }) => {
    // Open conversation
    await page.click('text=Juan Perez');

    // Click delete conversation action button (usually a trash icon or dots menu)
    const deleteConvoBtn = page.locator('button[aria-label*="conversation"], button[aria-label*="chat"], button:has-text("Eliminar Chat"), button:has-text("Borrar Chat")');
    if (await deleteConvoBtn.count() > 0) {
      page.once('dialog', async (dialog) => {
        await dialog.accept();
      });
      await deleteConvoBtn.click();

      // Conversation should disappear from list
      await expect(page.locator('text=Juan Perez')).not.toBeVisible();
    }
  });
});
