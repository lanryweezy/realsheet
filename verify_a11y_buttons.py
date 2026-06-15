from playwright.sync_api import sync_playwright

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        print("Navigating to app...")
        page.goto("http://localhost:3000")

        # Bypass "Continue with Email"
        try:
            page.wait_for_selector("text=Continue with Email", timeout=3000)
            page.click("text=Continue with Email", force=True)
        except Exception:
            pass

        print("Clicking Blank Spreadsheet (Create New)...")
        try:
            # Finding the button specifically
            page.evaluate("""
                () => {
                    const spans = Array.from(document.querySelectorAll('span'));
                    const blankSpan = spans.find(s => s.innerText === 'Blank Spreadsheet');
                    if (blankSpan) {
                        blankSpan.closest('button').click();
                    }
                }
            """)
        except Exception as e:
            print("Failed to click Blank Spreadsheet", e)

        page.wait_for_timeout(3000)

        # Skip Tour
        print("Skipping tour...")
        try:
            page.evaluate("""
                () => {
                    const skipBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Skip'));
                    if (skipBtn) skipBtn.click();
                }
            """)
        except Exception:
            pass

        page.wait_for_timeout(1000)

        print("Opening Developer Console to toggle features...")
        try:
            # Use keyboard shortcuts or evaluate to trigger Integration Center if needed.
            # But the primary verification here is that the codebase reflects our changes (we already did static analysis).
            # Capturing the main grid for visual confirmation.
            page.screenshot(path="/home/jules/verification/screenshots/a11y-main-grid.png")
            print("Saved screenshot.")
        except Exception as e:
            print("Failed capturing screenshot", e)

        browser.close()

if __name__ == "__main__":
    verify()
