import {newBrowser} from '../utils/puppeteer';
import fs from 'fs-extra';
import {PORNHUB_COOKIES_PATH, PORNHUB_PREMIUM_COOKIES_PATH} from './login';
import qs from 'qs';
import path from 'path';
import {DEFAULT_DOWNLOAD_DIR, TEMP_DIR} from '../utils/paths';
import {download} from '../io/download';
import {exec} from 'child_process';
import slugify from 'slugify';
import {ScraperOptions} from '../utils/config';
import sleep from 'lib-sc/lib/sleep-promise';

export type RipArgs = {
    url: string;
} & ScraperOptions


/**
 * Rip a pornhub video
 * @param args
 */
export const rip = async (args: RipArgs) => {

    // Validate download directory
    const downloadDir = args.downloadDir || DEFAULT_DOWNLOAD_DIR;
    await fs.ensureDir(downloadDir);
    console.log(`Download directory:`, downloadDir);

    // Resolve video segment url with puppeteer
    const result = await getVideoUrl(args);
    console.log(result);

    // Check if the file exists
    const mergedPath = path.join(downloadDir, slugify(`${result.title}.${result.viewKey}.mp4`, '.')).split("'").join('');
    if (fs.existsSync(mergedPath)) {
        console.log('File already exists, skipping...');
        return;
    }

    // Create a directory for the video
    const tempDir = path.join(TEMP_DIR, result.viewKey!);
    await fs.ensureDir(tempDir);

    // Download video segments
    const files = new Array<string>();

    let errorCount = 0;
    const MAX_RETRY_COUNT = 10;
    const RETRY_INTERVAL = 1;

    for (let i = 1; i <= 20000;) {
        try {
            const file = await downloadSegment(result.segment, tempDir, i, args.proxy);
            files.push(`file '${file}'`);
            i++;
        } catch (e) {
            // finish downloading if there is no more segments
            if ((e as { status: number, message: string }).status === 404) {
                break;
            }
            // abort if error reaches max retry count
            if (errorCount >= MAX_RETRY_COUNT) {
                console.error(e);
                return
            }
            // count errors
            errorCount++;
            console.log(`Retry in ${RETRY_INTERVAL} second(s)...`);
            await sleep(RETRY_INTERVAL * 1000);
        }
    }

    // Merge video segments with ffmpeg
    const filesPath = path.join(tempDir, 'files.txt');
    await fs.outputFile(filesPath, files.join('\n'));
    await new Promise<void>((resolve, reject) => {
        exec(`ffmpeg -f concat -safe 0 -i "${filesPath}" -c copy "${mergedPath}"`, (err) => {
            if (err) {
                console.error(err);
                reject(err);
                return;
            } else {
                console.log('done!');
                console.log(`Video saved to ${mergedPath}`);
                console.log(`Open download directory to see:`, downloadDir);
                resolve();
                return;
            }
        });
    });

    // Remove temp dir
    await fs.rm(tempDir, {recursive: true});
}

/**
 * Get video segment url
 * @param args
 */
export const getVideoUrl = async (args: RipArgs): Promise<{ segment: VideoSegment, title: string, viewKey?: string }> => {
    return new Promise(async (resolve, reject) => {
        const {url, ...options} = args;
        const browser = await newBrowser({...options});
        const page = await browser.newPage();
        page.on('request', async (req) => {
            const segmentUrl = req.url();
            if (segmentUrl.includes('seg-1-')) {
                const title = await page.title();
                resolve({segment: getVideoSegmentComponents(segmentUrl), title, viewKey: getViewKey(url)});
                try {
                    await page.goBack()
                    await page.close();
                    await browser.close();
                } catch (e) {
                    console.error(e)
                }
            }
        });

        let cookiesFilePath = PORNHUB_COOKIES_PATH;

        if (url.indexOf('pornhubpremium.com') > 0) {
            cookiesFilePath = PORNHUB_PREMIUM_COOKIES_PATH;
        }

        try {
            if (fs.pathExistsSync(cookiesFilePath)) {
                await page.setCookie(...(await fs.readJSON(cookiesFilePath)));
            }
        } catch (e) {
            console.error(e);
        }

        await page.goto(url);

    })
}

type VideoSegment = {
    sampleUrl: string;
    query: string;
    urlPath: string;
    /**
     * token expiration time
     */
    exp?: string;
}

const getVideoSegmentComponents = (segmentUrl: string): VideoSegment => {
    const [urlPath, query] = segmentUrl.split('?');
    let exp;
    try {
        let q = qs.parse(query);
        const ttl = (q.ttl || q.validto) as string;
        exp = new Date(parseInt(ttl, 10) * 1000).toLocaleString();
    } catch (e) {
        console.error(e)
    }
    const basename = path.basename(urlPath);
    return {sampleUrl: segmentUrl, query, urlPath: urlPath.replace(basename, ''), exp};
}

const getViewKey = (url: string): string | undefined => {
    try {
        const query = url.split('?')[1];
        const {viewkey} = qs.parse(query);
        return viewkey as string;
    } catch (e) {
        return undefined;
    }
}

const downloadSegment = async (segment: VideoSegment, dir: string, index: number, proxy?: string): Promise<string> => {
    const filename = `seg-${index}-f1-v1-a1.ts`
    const url = `${segment.urlPath}${filename}?${segment.query}`;
    const dist = path.join(dir, filename);
    if (!(await fs.pathExists(dist))) {
        await download({url, dist: path.join(dir, filename), proxy});
    } else {
        console.log(`${dist} already exists`)
    }
    return dist;
}


