# PH4K

> Rip video from p***hub at it's highest quality.

## Install

- Install nodejs.
- Install ts-node globally: `npm i -g ts-node`.
- Install Chrome to [default path](/src/utils/puppeteer.ts#L10) for puppeteer-core to resolve video url.
- Install FFmpeg to merge video segments.
- Clone this repository.
- Run script below to install this cli:

```bash
npm link
```

## Usage

```bash
ph4k login
ph4k [url] [...options]
```

## Login

You must log in your `p***hub account` to access the highest quality of the video, this cli downloads the highest quality of the video only. If you don't log in your account or your account is not eligible for accessing the highest quality, it will fail. Please use [youtube-dl](https://yt-dl.org/) instead if your account can't access the best quality of the video, yt-dl works for other quality options.

Run the following command to launch a Chrome tab for loging in. Cookies will be saved for downloading videos.

### Command

```bash
# Login regular site
ph4k login
# Login premium site
ph4k login-premium
```

### Manage Cookies Manually

You can write the cookies manually instead of loging in through this cli.

+ Login `p***hub` in your own browser instance. 
+ Save cookies as json manually at `~/.config/ph4k/pornhub-cookies.json`(`~/.config/ph4k/pornhub-premium-cookies.json` for premium site). 
+ Cookies can be exported with extension like [EditThisCookie](https://www.editthiscookie.com/) from browser.

## Download Video

### Command

```bash
ph4k [url] [...options]
```

### Example

```bash
ph4k "<VIDEO_URL>"
ph4k "<VIDEO_URL>" --proxy=<PROXY_URL> --headless --download-dir=<DOWNLOAD_DIR>
```

## Options and Config

| Option           | Key         | Data type | Description           |
|------------------|-------------|-----------|-----------------------|
| --proxy          | proxy       | string    | Proxy url.            |
| --headless       | headless    | boolean   | Run in headless mode. |
| --download-dir   | downloadDir | string    | Download directory.   |

There are 3 ways to set config:
- Pass from command line argv.
- Use `ph4k set <key>=<value>` command to set config.
- Edit configs in file `~/.config/ph4k/config.json`.

## Download path

The default download path is `~/Downloads/ph4k/`.

