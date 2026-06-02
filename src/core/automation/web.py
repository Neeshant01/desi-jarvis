import asyncio
import base64
from playwright.async_api import async_playwright

class PlaywrightBrowserAgent:
    def __init__(self):
        self.playwright = None
        self.browser = None
        self.context = None
        self.page = None
        self.is_paused = False
        self.resume_event = asyncio.Event()

    async def start(self, headless: bool = False):
        """Starts Playwright and launches Chromium."""
        if not self.playwright:
            self.playwright = await async_playwright().start()
        if not self.browser:
            # launch local Chrome with non-headless mode by default so user can interact
            self.browser = await self.playwright.chromium.launch(headless=headless)
            self.context = await self.browser.new_context(
                viewport={"width": 1280, "height": 720}
            )
            self.page = await self.context.new_page()
            print("Playwright Browser launched successfully.")

    async def stop(self):
        """Stops the browser and playwright."""
        if self.page:
            await self.page.close()
            self.page = None
        if self.context:
            await self.context.close()
            self.context = None
        if self.browser:
            await self.browser.close()
            self.browser = None
        if self.playwright:
            await self.playwright.stop()
            self.playwright = None
        print("Playwright Browser stopped.")

    async def navigate_to(self, url: str) -> str:
        """Navigates to URL and returns base64 screenshot."""
        await self.start()
        await self.page.goto(url)
        # Wait for network idle or 3s
        try:
            await self.page.wait_for_load_state("networkidle", timeout=3000)
        except Exception:
            pass
        return await self.get_screenshot()

    async def get_screenshot(self) -> str:
        """Takes a screenshot of the page and returns base64 string."""
        if not self.page:
            return ""
        screenshot_bytes = await self.page.screenshot()
        return base64.b64encode(screenshot_bytes).decode("utf-8")

    async def click_element(self, selector: str) -> str:
        """Clicks an element by selector and returns screenshot."""
        if not self.page:
            return ""
        await self.page.click(selector)
        await asyncio.sleep(1) # wait for page transition
        return await self.get_screenshot()

    async def type_element(self, selector: str, text: str) -> str:
        """Types text into selector and returns screenshot."""
        if not self.page:
            return ""
        await self.page.fill(selector, text)
        await asyncio.sleep(0.5)
        return await self.get_screenshot()

    async def detect_challenge(self) -> bool:
        """Checks if a CAPTCHA or Cloudflare challenge is on the page."""
        if not self.page:
            return False
        
        # Selectors commonly used by CAPTCHA frames, Cloudflare, or general verification messages
        selectors = [
            'iframe[src*="recaptcha"]',
            'iframe[src*="hcaptcha"]',
            '.cf-turnstile',
            '#challenge-running',
            'div:has-text("Verify you are human")',
            'h1:has-text("Please verify you are human")',
            'span:has-text("Verify you are human")',
            'text=Verify you are human',
            'text=CAPTCHA'
        ]
        
        for selector in selectors:
            try:
                count = await self.page.locator(selector).count()
                if count > 0:
                    print(f"Bot/CAPTCHA detected via selector: {selector}")
                    return True
            except Exception:
                continue
        return False

    async def pause_for_human(self, callback_notify):
        """Pauses execution and notifies client via callback."""
        self.is_paused = True
        self.resume_event.clear()
        
        screenshot = await self.get_screenshot()
        # Trigger notification
        await callback_notify(screenshot)
        
        print("Execution paused. Waiting for human to solve CAPTCHA on desktop...")
        await self.resume_event.wait()
        self.is_paused = False
        print("Execution resumed.")

    def resume(self):
        """Resumes paused execution."""
        self.resume_event.set()

# Singleton browser instance
browser_agent = PlaywrightBrowserAgent()

def get_browser_agent() -> PlaywrightBrowserAgent:
    return browser_agent
