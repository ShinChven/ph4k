import {newBrowser} from '../utils/puppeteer';
import fs from 'fs-extra';
import {APP_DATA_DIR} from '../utils/paths';
import path from 'path';

export const PORNHUB_COOKIES_PATH = path.join(APP_DATA_DIR, './pornhub-cookies.json');
export const PORNHUB_PREMIUM_COOKIES_PATH = path.join(APP_DATA_DIR, './pornhub-premium-cookies.json');

export const PORNHUB_LOGIN_URL = 'https://www.pornhub.com/login';
export const PORNHUB_PREMIUM_LOGIN_URL = 'https://www.pornhubpremium.com/login';

/**
 * Launch a Chrome tab for user to log in pornhub.com manually.
 * Cookies will be saved for access highest quality of videos.
 */
export const login = async () => {
    const browser = await newBrowser();
    const page = await browser.newPage();
    page.on('load', async () => {
        console.log(`Page loaded, please login. cookies will be saved to ${PORNHUB_COOKIES_PATH} once login is complete.`);
        const cookies = await page.cookies();
        const url = page.url();

        await fs.ensureDir(path.resolve(APP_DATA_DIR));

        if (url.includes('pornhubpremium.com')) {
            await fs.outputJSON(PORNHUB_PREMIUM_COOKIES_PATH, cookies);
        } else if (url.includes('pornhub.com')){
            await fs.outputJSON(PORNHUB_COOKIES_PATH, cookies);
        }

    });

    page.on('close', async () => {
        process.exit(0);
    });

    if (fs.pathExistsSync(PORNHUB_COOKIES_PATH)) {
        await page.setCookie(...(await fs.readJSON(PORNHUB_COOKIES_PATH)));
    }

    await page.goto(PORNHUB_LOGIN_URL);
};

/**
 * Launch a Chrome tab for user to log in pornhubpremium.com manually.
 * Cookies will be saved for access highest quality of videos.
 */
export const loginPremium = async () => {
    const browser = await newBrowser();
    const page = await browser.newPage();
    page.on('load', async () => {
        console.log(`Page loaded, please login. cookies will be saved to ${PORNHUB_PREMIUM_COOKIES_PATH} once login is complete.`);
        // noinspection DuplicatedCode
        const cookies = await page.cookies();
        const url = page.url();

        await fs.ensureDir(path.resolve(APP_DATA_DIR));

        if (url.includes('pornhubpremium.com')) {
            await fs.outputJSON(PORNHUB_PREMIUM_COOKIES_PATH, cookies);
        } else if (url.includes('pornhub.com')){
            await fs.outputJSON(PORNHUB_COOKIES_PATH, cookies);
        }
    });

    page.on('close', async () => {
        process.exit(0);
    });

    if (fs.pathExistsSync(PORNHUB_PREMIUM_COOKIES_PATH)) {
        await page.setCookie(...(await fs.readJSON(PORNHUB_PREMIUM_COOKIES_PATH)));
    }

    await page.goto(PORNHUB_PREMIUM_LOGIN_URL);
};
