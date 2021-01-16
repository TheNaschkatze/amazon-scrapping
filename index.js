const puppeteer = require('puppeteer');

function printProgress(progress) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`${Math.round(progress * 100)}% of work done.`);
}

async function getProducts(productLinks) {
    let products = []
    let counter = 0
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    for (const productLink of productLinks) {
        await page.goto(productLink.url);
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
        product.link = productLink.url
        products.push(product)
        counter++
        printProgress(counter / productLinks.length)
    }
    await browser.close();
    return products
}

async function getProductLinksInAPage(page) {
    return await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('.s-result-item'));
        return items.map(link => {
            if (link.querySelector(".a-link-normal.a-text-normal") && link.querySelector(".a-link-normal.a-text-normal").href) {
                return {
                    url: link.querySelector(".a-link-normal.a-text-normal").href,
                };
            }
        });
    });
}

async function getProductLinksInNPages(page, n) {
    console.log('getting all products pdp URLS')
    let allLinks = []
    for (let i = 0; i < n; i++) {
        const links = await getProductLinksInAPage(page)
        allLinks = [...allLinks, ...links]
        page.click('.a-last')
    }
    //@TODO: Delete nulls values in the construction of productlinks
    return allLinks.filter(link => link !== null)
}

async function scrappeOnAmazon(product, numberOfPages) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://amazon.de');
    await page.type('#twotabsearchtextbox', product);
    await page.keyboard.press('Enter');
    await page.waitForNavigation();
    const productLinks = await getProductLinksInNPages(page, numberOfPages)
    const products = await getProducts(productLinks)
    await browser.close();
    return products
}

module.exports = scrappeOnAmazon;

//(async () => {
  //  const test = await scrappeOnAmazon('play station 5', 1)
//})();
