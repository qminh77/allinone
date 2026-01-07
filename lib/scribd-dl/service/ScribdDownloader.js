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
        if (m) {
            let id = m[1]

            onProgress('Connecting to Scribd...')
            // navigate to scribd
            let page = await puppeteerSg.getPage(url)

            // wait rendering
            await new Promise(resolve => setTimeout(resolve, 1000))

            // get the title
            let overlaySelector = await page.$("div.mobile_overlay a")
            let title = decodeURIComponent(await overlaySelector.evaluate((el) => el.href.split('/').pop().trim()))

            // prepare identifier
            let identifier = `${sanitize(filenameMode == "title" ? title : id)}`

            // remove cookie consent dialogs
            const cookieSelectors = ["div.customOptInDialog", "div[aria-label='Cookie Consent Banner']"];
            for (const selector of cookieSelectors) {
                const elements = await page.$$(selector);
                for (const el of elements) {
                    await el.evaluate(node => node.remove());
                }
            }

            // scroll to load all pages
            onProgress('Loading pages (scrolling)...')
            await page.click('div.document_scroller');
            const containerSelector = await page.$('div.document_scroller');
            const scrollHeight = await containerSelector.evaluate(el => el.scrollHeight);
            const clientHeight = await containerSelector.evaluate(el => el.clientHeight);

            let scrollTop = await containerSelector.evaluate(el => el.scrollTop);
            while (scrollTop + clientHeight < scrollHeight) {
                await page.keyboard.press('PageDown');
                await new Promise(resolve => setTimeout(resolve, DEFAULT_RENDERTIME))
                scrollTop = await containerSelector.evaluate(el => el.scrollTop);

                // Report progress
                const percent = Math.round(((scrollTop + clientHeight) / scrollHeight) * 100);
                onProgress(`Loading content: ${percent}%`)
            }
            onProgress('All content loaded. Preparing capture...')

            // remove margin of each page
            let pageSelectors = await page.$$("div.outer_page_container div[id^='outer_page_']")
            for (let i = 0; i < pageSelectors.length; i++) {
                await page.evaluate((i) => {
                    document.getElementById(`outer_page_${(i + 1)}`).style.margin = 0
                }, i)
            }

            // keep only the outer_page_container content
            await page.evaluate(() => { // eslint-disable-next-line
                document.body.innerHTML = document.querySelector("div.outer_page_container").innerHTML
            })

            // hide all pages initially
            for (let i = 0; i < pageSelectors.length; i++) {
                await page.evaluate((i) => {
                    document.getElementById(`outer_page_${(i + 1)}`).style.display = 'none'
                }, i)
            }

            // prepare pdf options
            let options = {
                printBackground: true,
                timeout: 0
            }

            // generate per-page pdfs
            onProgress(`Generating PDF pages (Total: ${pageSelectors.length})...`)

            for (let i = 0; i < pageSelectors.length; i++) {
                // show current page
                await page.evaluate((i) => {
                    document.getElementById(`outer_page_${(i + 1)}`).style.display = 'block'
                }, i)

                // get page size and set options
                let pageSelector = await page.$(`#outer_page_${(i + 1)}`);
                let style = await pageSelector.evaluate((el) => el.getAttribute("style"))
                options.path = `${outputDir}/${identifier}/${("00" + i).slice(-3)}.pdf`
                options.height = parseInt(style.split("height:")[1].split("px")[0].trim())
                if (options.height % 2 !== 0) {
                    options.height += 1
                }
                options.width = parseInt(style.split("width:")[1].split("px")[0].trim())

                // generate pdf
                await directoryIo.create(path.dirname(options.path))
                await page.pdf(options);

                // hide current page
                await page.evaluate((i) => {
                    document.getElementById(`outer_page_${(i + 1)}`).style.display = 'none'
                }, i)

                // Log progress
                onProgress(`Capturing page ${i + 1}/${pageSelectors.length}`)
            }

            // merge per-page pdfs
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

            // remove temporary directory
            try {
                await fs.rm(`${outputDir}/${identifier}`, { recursive: true, force: true });
            } catch (error) {
                console.error(`Failed to delete temporary directory at ${outputDir}/${identifier}:`, error.message);
            }

            await page.close()
            await puppeteerSg.close()

            return outputPdfPath;
        } else {
            throw new Error(`Unsupported URL: ${url}`)
        }
    }

    async embedsImage(url, outputDir, filenameMode, onProgress) {
        let deviceScaleFactor = 2
        const m = scribdRegex.EMBED.exec(url)
        if (m) {
            let id = m[1]

            onProgress('Connecting to Scribd (Image Mode)...')

            // prepare temp dir
            let dir = `${outputDir}/${id}`
            await directoryIo.create(dir)

            // navigate to scribd
            let page = await puppeteerSg.getPage(url)

            // wait rendering
            await new Promise(resolve => setTimeout(resolve, 1000))

            // get the title
            let div = await page.$("div.mobile_overlay a")
            let title = decodeURIComponent(await div.evaluate((el) => el.href.split('/').pop().trim()))
            let filename = sanitize(filenameMode == "title" ? title : id)

            // hide blockers
            let docScroller = await page.$("div.document_scroller")
            await docScroller.evaluate((el) => {
                el["style"]["bottom"] = "0px"
                el["style"]["margin-top"] = "0px"
            });
            let docToolbarDrop = await page.$("div.toolbar_drop")
            await docToolbarDrop.evaluate((el) => el["style"]["display"] = "none");

            // download images
            let docOuterPages = await page.$$("div.outer_page_container div[id^='outer_page_']")
            let images = []

            onProgress(`Processing ${docOuterPages.length} pages...`)

            for (let i = 0; i < docOuterPages.length; i++) {
                await page.evaluate((i) => { // eslint-disable-next-line
                    document.getElementById(`outer_page_${(i + 1)}`).scrollIntoView()
                }, i)

                let width = 1191
                let height = 1684
                let style = await docOuterPages[i].evaluate((el) => el.getAttribute("style"));
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

            await page.close()
            await puppeteerSg.close()

            return finalPath;
        } else {
            throw new Error(`Unsupported URL: ${url}`)
        }
    }
}

export const scribdDownloader = new ScribdDownloader()
