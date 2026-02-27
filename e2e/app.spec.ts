import { test, expect } from '@playwright/test'
import { captureScreenshot } from './helpers'

// Helper: add a todo by typing and pressing Enter
async function addTodo(page: import('@playwright/test').Page, text: string) {
  const input = page.getByTestId('todo-input')
  await input.fill(text)
  await input.press('Enter')
}

// Clear localStorage before each test for a clean state
test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

// ─────────────────────────────────────────────────────────────────────────────
// Happy path tests
// ─────────────────────────────────────────────────────────────────────────────

test('Happy path — Add a todo: type task, press Enter, verify it appears', async ({ page }) => {
  await addTodo(page, 'Buy groceries')

  const items = page.getByTestId('todo-item')
  await expect(items).toHaveCount(1)

  const text = page.getByTestId('todo-text').first()
  await expect(text).toHaveText('Buy groceries')

  const checkbox = page.getByTestId('todo-checkbox').first()
  await expect(checkbox).not.toBeChecked()

  await captureScreenshot(page, '01-add-todo')
})

test('Happy path — Add a todo via Add button', async ({ page }) => {
  const input = page.getByTestId('todo-input')
  await input.fill('Walk the dog')
  await page.getByTestId('add-button').click()

  await expect(page.getByTestId('todo-item')).toHaveCount(1)
  await expect(page.getByTestId('todo-text').first()).toHaveText('Walk the dog')
})

test('Happy path — Complete a todo: checkbox toggles strikethrough and decrements count', async ({ page }) => {
  await addTodo(page, 'Read a book')
  await addTodo(page, 'Write code')

  // Active count should be 2
  await expect(page.getByTestId('active-count')).toHaveText('2 items left')

  // Check the first todo
  const checkbox = page.getByTestId('todo-checkbox').first()
  await checkbox.check()

  // Text should be struck through (completed class)
  const text = page.getByTestId('todo-text').first()
  await expect(text).toHaveClass(/line-through/)

  // Count should drop to 1
  await expect(page.getByTestId('active-count')).toHaveText('1 item left')

  await captureScreenshot(page, '02-complete-todo')
})

test('Happy path — Delete a todo: hover and click trash, todo is removed', async ({ page }) => {
  await addTodo(page, 'Task to delete')
  await addTodo(page, 'Task to keep')

  await expect(page.getByTestId('todo-item')).toHaveCount(2)

  // Hover over the first item to reveal the delete button
  const firstItem = page.getByTestId('todo-item').first()
  await firstItem.hover()

  // Click delete on the first item
  const deleteBtn = firstItem.getByTestId('todo-delete')
  await deleteBtn.click()

  // One todo should remain
  await expect(page.getByTestId('todo-item')).toHaveCount(1)
  await expect(page.getByTestId('todo-text').first()).toHaveText('Task to keep')

  await captureScreenshot(page, '03-delete-todo')
})

test('Happy path — Filter todos: All / Active / Completed', async ({ page }) => {
  await addTodo(page, 'Active task 1')
  await addTodo(page, 'Active task 2')
  await addTodo(page, 'Will be completed')

  // Complete the third todo (first in list since prepended)
  await page.getByTestId('todo-checkbox').first().check()

  // All: 3 items
  await page.getByTestId('filter-all').click()
  await expect(page.getByTestId('todo-item')).toHaveCount(3)

  // Active: only uncompleted
  await page.getByTestId('filter-active').click()
  await expect(page.getByTestId('todo-item')).toHaveCount(2)
  const activeTexts = page.getByTestId('todo-text')
  await expect(activeTexts.nth(0)).toHaveText('Active task 2')
  await expect(activeTexts.nth(1)).toHaveText('Active task 1')

  // Completed: only the checked one
  await page.getByTestId('filter-completed').click()
  await expect(page.getByTestId('todo-item')).toHaveCount(1)
  await expect(page.getByTestId('todo-text').first()).toHaveText('Will be completed')

  // Back to All
  await page.getByTestId('filter-all').click()
  await expect(page.getByTestId('todo-item')).toHaveCount(3)

  await captureScreenshot(page, '04-filter-todos')
})

test('Happy path — Clear completed: removes done todos, keeps active ones', async ({ page }) => {
  await addTodo(page, 'Keep me')
  await addTodo(page, 'Delete me 1')
  await addTodo(page, 'Delete me 2')

  // Complete the first two (most recently added appear first)
  await page.getByTestId('todo-checkbox').first().check()
  await page.getByTestId('todo-checkbox').nth(1).check()

  await expect(page.getByTestId('todo-item')).toHaveCount(3)

  await page.getByTestId('clear-completed').click()

  await expect(page.getByTestId('todo-item')).toHaveCount(1)
  await expect(page.getByTestId('todo-text').first()).toHaveText('Keep me')

  await captureScreenshot(page, '05-clear-completed')
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge cases
// ─────────────────────────────────────────────────────────────────────────────

test('Edge case — Prevent empty todos: empty input adds nothing', async ({ page }) => {
  // Click Add with no text
  await page.getByTestId('add-button').click()
  await expect(page.getByTestId('todo-item')).toHaveCount(0)

  // Press Enter with empty input
  await page.getByTestId('todo-input').press('Enter')
  await expect(page.getByTestId('todo-item')).toHaveCount(0)
})

test('Edge case — Prevent empty todos: whitespace-only input adds nothing', async ({ page }) => {
  const input = page.getByTestId('todo-input')
  await input.fill('   ')
  await input.press('Enter')
  await expect(page.getByTestId('todo-item')).toHaveCount(0)
})

test('Edge case — Theme toggle: switches dark to light and back', async ({ page }) => {
  // Default is dark
  const root = page.locator('html')
  await expect(root).toHaveClass(/dark/)

  // Toggle to light
  await page.getByTestId('theme-toggle').click()
  await expect(root).not.toHaveClass(/dark/)
  await expect(root).toHaveAttribute('data-theme', 'light')

  // Toggle back to dark
  await page.getByTestId('theme-toggle').click()
  await expect(root).toHaveClass(/dark/)
  await expect(root).toHaveAttribute('data-theme', 'dark')

  await captureScreenshot(page, '07-theme-toggle')
})

// ─────────────────────────────────────────────────────────────────────────────
// Data persistence
// ─────────────────────────────────────────────────────────────────────────────

test('Data persistence — Todos survive reload', async ({ page }) => {
  await addTodo(page, 'Persistent task 1')
  await addTodo(page, 'Persistent task 2')
  await addTodo(page, 'Persistent task 3')

  // Complete the first one in the list
  await page.getByTestId('todo-checkbox').first().check()

  await page.reload()

  // All 3 should still be there
  await expect(page.getByTestId('todo-item')).toHaveCount(3)

  // The completed one should still be checked
  const firstCheckbox = page.getByTestId('todo-checkbox').first()
  await expect(firstCheckbox).toBeChecked()
  const firstText = page.getByTestId('todo-text').first()
  await expect(firstText).toHaveClass(/line-through/)

  await captureScreenshot(page, '08-persistence-todos')
})

test('Data persistence — Theme preference survives reload', async ({ page }) => {
  // Switch to light mode
  await page.getByTestId('theme-toggle').click()
  const root = page.locator('html')
  await expect(root).toHaveAttribute('data-theme', 'light')

  // Reload and verify light mode persists
  await page.reload()
  await expect(root).toHaveAttribute('data-theme', 'light')
  await expect(root).not.toHaveClass(/dark/)

  await captureScreenshot(page, '09-persistence-theme')
})

// ─────────────────────────────────────────────────────────────────────────────
// Key screenshot scenarios
// ─────────────────────────────────────────────────────────────────────────────

test('Screenshot — Dark mode with mixed todos and All filter', async ({ page }) => {
  await addTodo(page, 'Finish the report')
  await addTodo(page, 'Call the dentist')
  await addTodo(page, 'Buy groceries')
  await addTodo(page, 'Read documentation')
  await addTodo(page, 'Write unit tests')

  // Complete a couple
  await page.getByTestId('todo-checkbox').first().check()
  await page.getByTestId('todo-checkbox').nth(2).check()

  await captureScreenshot(page, 'screen-1-dark-mixed-todos')
})

test('Screenshot — Light mode empty state', async ({ page }) => {
  // Switch to light
  await page.getByTestId('theme-toggle').click()
  await captureScreenshot(page, 'screen-2-light-empty')
})

test('Screenshot — Dark mode Active filter', async ({ page }) => {
  await addTodo(page, 'Active task A')
  await addTodo(page, 'Active task B')
  await addTodo(page, 'Completed task')

  await page.getByTestId('todo-checkbox').first().check()
  await page.getByTestId('filter-active').click()

  await captureScreenshot(page, 'screen-3-dark-active-filter')
})
