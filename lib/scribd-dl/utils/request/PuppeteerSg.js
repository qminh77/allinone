import puppeteer from 'puppeteer'
import chromium from '@sparticuz/chromium'

const SERVERLESS_CHROMIUM_ENVS = [
  'AWS_EXECUTION_ENV',
  'AWS_LAMBDA_FUNCTION_NAME',
  'NETLIFY',
  'VERCEL',
]

const SYSTEM_CHROME_PATHS = [
  '/usr/bin/google-chrome-stable',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
]

const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

function shouldUseServerlessChromium() {
  return process.env.USE_SERVERLESS_CHROMIUM === 'true'
    || SERVERLESS_CHROMIUM_ENVS.some((key) => Boolean(process.env[key]))
}

async function fileExists(path) {
  const fs = await import('fs/promises')

  try {
    await fs.access(path)
    return true
  } catch {
    return false
  }
}

async function findSystemChromePath() {
  for (const path of SYSTEM_CHROME_PATHS) {
    if (await fileExists(path)) {
      return path
    }
  }

  return null
}

function getConfiguredExecutablePath() {
  return process.env.PUPPETEER_EXECUTABLE_PATH
    || process.env.CHROME_EXECUTABLE_PATH
    || process.env.GOOGLE_CHROME_BIN
}

class PuppeteerSg {
  constructor() {
    if (!PuppeteerSg.instance) {
      PuppeteerSg.instance = this;
      process.on('exit', () => {
        this.close();
      });
    }
    return PuppeteerSg.instance;
  }

  /**
   * Launch a browser
   */
  async launch() {
    const configuredExecutablePath = getConfiguredExecutablePath()
    const serverless = shouldUseServerlessChromium()
    const systemChromePath = configuredExecutablePath || (!serverless ? await findSystemChromePath() : null)
    const args = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    const launchOptions = {
      headless: true,
      defaultViewport: null,
      args,
      timeout: 0,
    }

    if (serverless && !configuredExecutablePath) {
      launchOptions.executablePath = await chromium.executablePath()
      launchOptions.args = [...chromium.args, ...args]
      launchOptions.defaultViewport = chromium.defaultViewport
      launchOptions.headless = chromium.headless
    } else if (systemChromePath) {
      launchOptions.executablePath = systemChromePath
    }

    this.browser = await puppeteer.launch({
      ...launchOptions,
    });
  }

  /**
   * New a page
   * @param {string} url 
   * @returns 
   */
  async getPage(url) {
    if (!this.browser || !this.browser.connected) {
      await this.launch()
    }
    let page = await this.browser.newPage()
    page.setDefaultNavigationTimeout(45_000)
    page.setDefaultTimeout(30_000)
    await page.setUserAgent(DEFAULT_USER_AGENT)
    await page.setViewport({ width: 1366, height: 1600, deviceScaleFactor: 1 })
    await page.goto(url, {
      waitUntil: ["domcontentloaded", "networkidle2"],
      timeout: 45_000,
    })
    return page
  }

  /**
   * Close the browser
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export const puppeteerSg = new PuppeteerSg()
