const puppeteer = require('puppeteer');
const print = require('./printHelper')

async function getPDPProductInfo(browser, pageLink) {
    const page = await browser.newPage();
    await page.goto(pageLink);
    await page.waitForSelector('#main-image-container');
    let product = await page.evaluate(() => {
        const title = document.querySelector('#productTitle') ? document.querySelector('#productTitle').textContent.replace(/\n/g, '') : null;
        const price = document.querySelector('#priceblock_ourprice') ? document.querySelector('#priceblock_ourprice').textContent : null;
        const avgRating = document.querySelector('#acrPopover') ? document.querySelector('#acrPopover').title : null
        const numberOfReviews = document.querySelector('#acrCustomerReviewText') ? document.querySelector('#acrCustomerReviewText').textContent : null
        return ({
            //@TODO ADD FIRST LISTING DATE AMAZON
            title: title,
            price: price,
            avgRating: avgRating,
            numberOfReviews: numberOfReviews,
        })
    });
    product.link = pageLink
    return product
}

async function getProducts(productLinks, numberOfSimultaneousPDP) {
    let products = []
    const numberOfProductLinks = productLinks.length
    const numberOfTabs = numberOfSimultaneousPDP
    const browser = await puppeteer.launch();

    for (let i = 0; i < numberOfProductLinks; i += numberOfTabs) {
        let promises = [];
        for (let j = 0; j < numberOfTabs; j++) {
            if (productLinks[i + j])
                promises.push(getPDPProductInfo(browser, productLinks[i + j]))
        }
        promises = await Promise.all(promises)
        products = [...products, ...promises]
        print((i + numberOfTabs) / numberOfProductLinks)
    }
    await browser.close();
    return products
}

async function getProductLinksInASearchPage(page) {
    return await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('.s-result-item'));
        return items.map(link => {
            if (link.querySelector(".a-link-normal.a-text-normal") && link.querySelector(".a-link-normal.a-text-normal").href) {
                return link.querySelector(".a-link-normal.a-text-normal").href;
            }
        });
    });
}

async function getPDPUrlsInNSearchResultPages(n, product) {
    console.log(`fetching all pdp URLS for ${product}, until the result-page number ${n}`)
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://amazon.de');
    await page.type('#twotabsearchtextbox', product);
    await page.keyboard.press('Enter');
    await page.waitForNavigation();
    let allPDPLinks = []
    for (let i = 0; i < n; i++) {
        const links = await getProductLinksInASearchPage(page)
        allPDPLinks = [...allPDPLinks, ...links]
        await page.click('.a-last')
    }
    await browser.close()
    return allPDPLinks.filter(link => !!link)
}

function correctnessOfParams(product, numberOfSearchPages, numberOfSimultaneousPDP) {
    if (typeof product !== "string")
        throw new Error('product must be a string')
    if (typeof numberOfSearchPages !== 'number' || numberOfSearchPages <= 0)
        throw new Error('numberOfSearchPages must be a number and greater than 0')
    if (typeof numberOfSimultaneousPDP !== 'number' || numberOfSimultaneousPDP <= 0)
        throw new Error('numberOfSimultaneousPDP must be a number and greater than 0')
}

async function scrappeOnAmazon(product, numberOfSearchPages, numberOfSimultaneousPDP) {
    correctnessOfParams(product, numberOfSearchPages, numberOfSimultaneousPDP)
    const productPDPLinks = await getPDPUrlsInNSearchResultPages(numberOfSearchPages, product)
    return await getProducts(productPDPLinks, numberOfSimultaneousPDP)
}

module.exports = scrappeOnAmazon;

// (async () => {
//     const test = await scrappeOnAmazon('play station 5', 1, 5)
//     console.log(test)
// })();
