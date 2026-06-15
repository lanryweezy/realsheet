from playwright.sync_api import sync_playwright
import time
import os

def main():
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:3000")

        # Bypass onboarding
        try:
            page.get_by_text("Continue with Email").click(timeout=5000)
        except:
            pass

        try:
            page.get_by_text("Create New Workbook").click(force=True, timeout=5000)
        except:
            pass

        try:
            page.get_by_text("Skip tour").click(timeout=5000)
        except:
            pass

        time.sleep(2)

        # Dispatch click to Integrations button
        page.evaluate("""() => {
            const btns = document.querySelectorAll('button');
            for (let btn of btns) {
                if (btn.textContent.includes('Integrations')) {
                    btn.click();
                }
            }
        }""")

        time.sleep(1)

        print("Checking if Integration Center is visible")

        page.evaluate("""() => {
            const tabs = document.querySelectorAll('button[role="tab"]');
            for (let tab of tabs) {
                if (tab.textContent.includes('Webhooks')) {
                    tab.click();
                }
            }
        }""")
        time.sleep(1)

        page.evaluate("""() => {
            const btns = document.querySelectorAll('button');
            for (let btn of btns) {
                if (btn.textContent.includes('Create Webhook')) {
                    btn.click();
                }
            }
        }""")
        time.sleep(1)

        power_btn = page.locator('button[aria-label="Disable webhook"]').first
        if power_btn.count() > 0:
            power_btn.focus()
            time.sleep(0.5)
            page.screenshot(path="/home/jules/verification/screenshots/power_btn_focused.png")
            print("Screenshot saved to /home/jules/verification/screenshots/power_btn_focused.png")

        delete_btn = page.locator('button[aria-label="Delete webhook"]').first
        if delete_btn.count() > 0:
            delete_btn.focus()
            time.sleep(0.5)
            page.screenshot(path="/home/jules/verification/screenshots/delete_btn_focused.png")
            print("Screenshot saved to /home/jules/verification/screenshots/delete_btn_focused.png")

        browser.close()

if __name__ == "__main__":
    main()
