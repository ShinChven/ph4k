import http from "superagent";
import fs from "fs-extra";

require('superagent-proxy')(http);

export type DownloadArgs = {
    url: string;
    dist: string;
    proxy?: string;
}

/**
 * Download file by url
 * @param url
 * @param dist
 * @param proxy
 */
export const download = async ({url, dist, proxy}: DownloadArgs) => {
    const res = await http.get(url).proxy(proxy!);
    await fs.writeFile(dist, res.body, "binary");
}
