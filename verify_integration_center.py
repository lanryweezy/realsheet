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
        close_btn = page.get_by_role("button", name="Close Integration Center")
        if close_btn.count() > 0:
            close_btn.first.focus()
            time.sleep(0.5)
            page.screenshot(path="/home/jules/verification/screenshots/integration_center_focused.png")
            print("Screenshot saved to /home/jules/verification/screenshots/integration_center_focused.png")

            # Click Webhooks tab
            webhooks_tab = page.get_by_role("tab", name="Webhooks")
            if webhooks_tab.count() > 0:
                webhooks_tab.click()
                time.sleep(0.5)

                # Click Create Webhook
                create_btn = page.get_by_role("button", name="Create Webhook")
                if create_btn.count() > 0:
                    create_btn.click()
                    time.sleep(0.5)

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
        else:
            print("Failed to find 'Close Integration Center' button")

        browser.close()

if __name__ == "__main__":
    main()
