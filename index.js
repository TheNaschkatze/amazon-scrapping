const puppeteer = require('puppeteer');
const print = require('./printHelper')

async function getPDPProductInfo(browser, pageLink) {
    try {
        const page = await browser.newPage();
        await page.goto(pageLink);
        await page.waitForSelector('#productTitle', {timeout: 3000});
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
    } catch {
    }
}

async function getProducts(productLinks, numberOfSimultaneousPDP) {
    let products = []
    const numberOfProductUrls = productLinks.length
    const numberOfTabs = numberOfSimultaneousPDP
    const browser = await puppeteer.launch();

    for (let i = 0; i < numberOfProductUrls; i += numberOfTabs) {
        let promises = [];
        for (let j = 0; j < numberOfTabs; j++) {
            print((i + j) / numberOfProductUrls)
            if (productLinks[i + j])
                promises.push(getPDPProductInfo(browser, productLinks[i + j]))
        }
        promises = await Promise.all(promises)
        products = [...products, ...promises]
    }

    await browser.close();
    return products.filter(product => !!product)
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

async function getPDPUrlsInNSearchResultPages(numberOfSearchPages, product) {
    console.log(`fetching all pdp URLS for ${product}, until the result-page number ${numberOfSearchPages}`)
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    let allPDPUrls = []

    await page.goto('https://amazon.de');
    await page.type('#twotabsearchtextbox', product);
    await page.keyboard.press('Enter');
    await page.waitForNavigation();

    for (let i = 0; i < numberOfSearchPages; i++) {
        const urls = await getProductLinksInASearchPage(page)
        allPDPUrls = [...allPDPUrls, ...urls]
        await page.click('.a-last')
    }
    await browser.close()
    return allPDPUrls.filter(link => !!link)
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
    const productPDPUrls = await getPDPUrlsInNSearchResultPages(numberOfSearchPages, product)
    return await getProducts(productPDPUrls, numberOfSimultaneousPDP)
}
//scrappeOnAmazon('nintendo 64', 2, 10).then((r)=>console.log(r))
module.exports = scrappeOnAmazon;
