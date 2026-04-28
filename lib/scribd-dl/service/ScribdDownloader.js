import { puppeteerSg } from "../utils/request/PuppeteerSg.js";
import { pdfGenerator } from "../utils/io/PdfGenerator.js";
import { directoryIo } from "../utils/io/DirectoryIo.js"
import * as scribdRegex from "../const/ScribdRegex.js"
import * as scribdFlag from '../const/ScribdFlag.js'
import { Image } from "../object/Image.js"
import sharp from "sharp";
import path from 'path'
import sanitize from "sanitize-filename";
import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';

// Default config
const DEFAULT_RENDERTIME = 100;
const SCRIBD_READY_SELECTOR = 'div.document_scroller, div.outer_page_container'
const SCRIBD_PAGE_SELECTOR = "div.outer_page_container div[id^='outer_page_']"

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function waitForScribdDocument(page) {
    try {
        await page.waitForSelector(SCRIBD_READY_SELECTOR, { timeout: 20_000 })
    } catch {
        const title = await page.title().catch(() => '')
        throw new Error(`Không tìm thấy nội dung tài liệu trên Scribd. Trang có thể bị chặn, yêu cầu đăng nhập, hoặc chưa hỗ trợ trên môi trường serverless${title ? ` (${title})` : ''}.`)
    }
}

async function getDocumentTitle(page, fallback) {
    const titleFromLink = await page.evaluate(() => {
        const link = document.querySelector("div.mobile_overlay a")
            || document.querySelector("a[href*='/document/']")
            || document.querySelector("a[href*='/embeds/']")

        return link?.href ? link.href.split('/').pop()?.trim() : ''
    }).catch(() => '')

    if (titleFromLink) {
        return decodeURIComponent(titleFromLink)
    }

    const pageTitle = await page.title().catch(() => '')
    return pageTitle?.replace(/\s*\|\s*Scribd\s*$/i, '').trim() || fallback
}

async function getRequiredElement(page, selector, message) {
    const element = await page.$(selector)
    if (!element) {
        throw new Error(message)
    }

    return element
}

class ScribdDownloader {
    constructor() {
        if (!ScribdDownloader.instance) {
            ScribdDownloader.instance = this
        }
        return ScribdDownloader.instance
    }

    /**
     * @param {string} url 
     * @param {string} flag 
     * @param {object} options { outputDir, filenameMode, onProgress }
     * @returns {Promise<string>} Path to the generated PDF
     */
    async execute(url, flag, options = {}) {
        const { outputDir = 'output', filenameMode = 'title', onProgress = () => { } } = options;

        let fn;
        if (flag === scribdFlag.IMAGE) {
            onProgress('Mode: IMAGE')
            fn = this.embedsImage
        } else {
            onProgress('Mode: DEFAULT')
            fn = this.embedsDefault
        }

        // Bind context
        fn = fn.bind(this);

        if (url.match(scribdRegex.DOCUMENT)) {
            return await fn(`https://www.scribd.com/embeds/${scribdRegex.DOCUMENT.exec(url)[2]}/content`, outputDir, filenameMode, onProgress)
        } else if (url.match(scribdRegex.EMBED)) {
            return await fn(url, outputDir, filenameMode, onProgress)
        } else {
            throw new Error(`Unsupported URL: ${url}`)
        }
    }

    async embedsDefault(url, outputDir, filenameMode, onProgress) {
        const m = scribdRegex.EMBED.exec(url)
        if (!m) {
            throw new Error(`Unsupported URL: ${url}`)
        }

        let page
        const id = m[1]

        try {
            onProgress('Connecting to Scribd...')
            page = await puppeteerSg.getPage(url)

            await waitForScribdDocument(page)
            await delay(1000)

            const title = await getDocumentTitle(page, id)
            const identifier = `${sanitize(filenameMode == "title" ? title : id) || id}`

            const cookieSelectors = ["div.customOptInDialog", "div[aria-label='Cookie Consent Banner']"];
            for (const selector of cookieSelectors) {
                const elements = await page.$$(selector);
                for (const el of elements) {
                    await el.evaluate(node => node.remove()).catch(() => undefined);
                }
            }

            onProgress('Loading pages (scrolling)...')
            const containerSelector = await getRequiredElement(
                page,
                'div.document_scroller',
                'Không tìm thấy vùng cuộn tài liệu Scribd. Tài liệu có thể bị chặn hoặc Scribd đã đổi giao diện.'
            )

            await containerSelector.click().catch(() => undefined);

            let scrollTop = await containerSelector.evaluate(el => el.scrollTop);
            let clientHeight = await containerSelector.evaluate(el => el.clientHeight);
            let scrollHeight = await containerSelector.evaluate(el => el.scrollHeight);

            while (scrollTop + clientHeight < scrollHeight) {
                await page.keyboard.press('PageDown');
                await delay(DEFAULT_RENDERTIME)

                scrollTop = await containerSelector.evaluate(el => el.scrollTop);
                clientHeight = await containerSelector.evaluate(el => el.clientHeight);
                scrollHeight = await containerSelector.evaluate(el => el.scrollHeight);

                const percent = Math.min(100, Math.round(((scrollTop + clientHeight) / scrollHeight) * 100));
                onProgress(`Loading content: ${percent}%`)
            }
            onProgress('All content loaded. Preparing capture...')

            let pageSelectors = await page.$$(SCRIBD_PAGE_SELECTOR)
            if (pageSelectors.length === 0) {
                throw new Error('Không tìm thấy trang nào trong tài liệu Scribd sau khi tải.')
            }

            for (let i = 0; i < pageSelectors.length; i++) {
                await page.evaluate((i) => {
                    const page = document.getElementById(`outer_page_${(i + 1)}`)
                    if (page) page.style.margin = 0
                }, i)
            }

            await page.evaluate(() => {
                const container = document.querySelector("div.outer_page_container")
                if (!container) {
                    throw new Error('Missing Scribd page container')
                }
                document.body.innerHTML = container.innerHTML
            })

            for (let i = 0; i < pageSelectors.length; i++) {
                await page.evaluate((i) => {
                    const page = document.getElementById(`outer_page_${(i + 1)}`)
                    if (page) page.style.display = 'none'
                }, i)
            }

            let options = {
                printBackground: true,
                timeout: 0
            }

            onProgress(`Generating PDF pages (Total: ${pageSelectors.length})...`)

            for (let i = 0; i < pageSelectors.length; i++) {
                await page.evaluate((i) => {
                    const page = document.getElementById(`outer_page_${(i + 1)}`)
                    if (page) page.style.display = 'block'
                }, i)

                let pageSelector = await getRequiredElement(
                    page,
                    `#outer_page_${(i + 1)}`,
                    `Không tìm thấy trang ${i + 1} trong tài liệu Scribd.`
                )
                let style = await pageSelector.evaluate((el) => el.getAttribute("style") || '')
                const heightMatch = style.match(/height:\s*(\d+)px/)
                const widthMatch = style.match(/width:\s*(\d+)px/)

                if (!heightMatch || !widthMatch) {
                    throw new Error(`Không đọc được kích thước trang ${i + 1} của tài liệu Scribd.`)
                }

                options.path = `${outputDir}/${identifier}/${("00" + i).slice(-3)}.pdf`
                options.height = parseInt(heightMatch[1], 10)
                if (options.height % 2 !== 0) {
                    options.height += 1
                }
                options.width = parseInt(widthMatch[1], 10)

                await directoryIo.create(path.dirname(options.path))
                await page.pdf(options);

                await page.evaluate((i) => {
                    const page = document.getElementById(`outer_page_${(i + 1)}`)
                    if (page) page.style.display = 'none'
                }, i)

                onProgress(`Capturing page ${i + 1}/${pageSelectors.length}`)
            }

            onProgress('Merging PDF files...')
            const outputPdf = await PDFDocument.create();
            for (let i = 0; i < pageSelectors.length; i++) {
                let tmpPdfPath = `${outputDir}/${identifier}/${("00" + i).slice(-3)}.pdf`
                try {
                    const pdfBytes = await fs.readFile(tmpPdfPath);
                    const sourcePdf = await PDFDocument.load(pdfBytes);
                    const copiedPages = await outputPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
                    copiedPages.forEach(page => {
                        outputPdf.addPage(page);
                    });
                } catch (error) {
                    console.error(`Failed to merge PDF at ${tmpPdfPath}:`, error.message);
                }
            }
            const outputPdfBytes = await outputPdf.save();
            let outputPdfPath = `${outputDir}/${identifier}.pdf`
            await fs.writeFile(outputPdfPath, outputPdfBytes);

            onProgress('Cleaning up temporary files...')

            try {
                await fs.rm(`${outputDir}/${identifier}`, { recursive: true, force: true });
            } catch (error) {
                console.error(`Failed to delete temporary directory at ${outputDir}/${identifier}:`, error.message);
            }

            return outputPdfPath;
        } finally {
            if (page && !page.isClosed()) {
                await page.close().catch(() => undefined)
            }
            await puppeteerSg.close().catch(() => undefined)
        }
    }

    async embedsImage(url, outputDir, filenameMode, onProgress) {
        let deviceScaleFactor = 2
        const m = scribdRegex.EMBED.exec(url)
        if (!m) {
            throw new Error(`Unsupported URL: ${url}`)
        }

        let page
        let id = m[1]

        try {

            onProgress('Connecting to Scribd (Image Mode)...')

            // prepare temp dir
            let dir = `${outputDir}/${id}`
            await directoryIo.create(dir)

            // navigate to scribd
            page = await puppeteerSg.getPage(url)

            // wait rendering
            await waitForScribdDocument(page)
            await delay(1000)

            // get the title
            let title = await getDocumentTitle(page, id)
            let filename = sanitize(filenameMode == "title" ? title : id) || id

            // hide blockers
            let docScroller = await getRequiredElement(
                page,
                "div.document_scroller",
                'Không tìm thấy vùng cuộn tài liệu Scribd. Tài liệu có thể bị chặn hoặc Scribd đã đổi giao diện.'
            )
            await docScroller.evaluate((el) => {
                el["style"]["bottom"] = "0px"
                el["style"]["margin-top"] = "0px"
            });
            let docToolbarDrop = await page.$("div.toolbar_drop")
            await docToolbarDrop?.evaluate((el) => el["style"]["display"] = "none");

            // download images
            let docOuterPages = await page.$$(SCRIBD_PAGE_SELECTOR)
            if (docOuterPages.length === 0) {
                throw new Error('Không tìm thấy trang nào trong tài liệu Scribd sau khi tải.')
            }
            let images = []

            onProgress(`Processing ${docOuterPages.length} pages...`)

            for (let i = 0; i < docOuterPages.length; i++) {
                await page.evaluate((i) => { // eslint-disable-next-line
                    document.getElementById(`outer_page_${(i + 1)}`).scrollIntoView()
                }, i)

                let width = 1191
                let height = 1684
                let style = await docOuterPages[i].evaluate((el) => el.getAttribute("style") || "");
                if (style.includes("width:") && style.includes("height:")) {
                    height = Math.ceil(width * parseInt(style.split("height:")[1].split("px")[0].trim()) / parseInt(style.split("width:")[1].split("px")[0].trim()))
                }
                await page.setViewport({ width: width, height: height, deviceScaleFactor: deviceScaleFactor });

                let imagePath = `${dir}/${(i + 1).toString().padStart(4, 0)}.png`
                await docOuterPages[i].screenshot({ path: imagePath });

                let metadata = await sharp(imagePath).metadata()
                images.push(new Image(
                    imagePath,
                    metadata.width,
                    metadata.height
                ))

                onProgress(`Captured page ${i + 1}/${docOuterPages.length}`)
            }

            // generate pdf
            onProgress('Generating final PDF...')
            const finalPath = `${outputDir}/${filename}.pdf`
            await pdfGenerator.generate(images, finalPath)

            // remove temp dir
            directoryIo.remove(`${dir}`)

            return finalPath;
        } finally {
            if (page && !page.isClosed()) {
                await page.close().catch(() => undefined)
            }
            await puppeteerSg.close().catch(() => undefined)
        }
    }
}

export const scribdDownloader = new ScribdDownloader()
