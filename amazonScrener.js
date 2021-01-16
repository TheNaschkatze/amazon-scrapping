const puppeteer = require('puppeteer');

export default async function amazonScrener() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://amazon.de');
    await page.click('#twotabsearchtextbox');
    await page.keyboard.type("bet");
    await page.keyboard.press('Enter');
    await page.waitForSelector('.a-section', {timeout: 10000});
    //await page.evaluate(() => {
    //let elements = document.querySelectorAll('h3.LC20lb')
    // "for loop" will click all element not random
    //let randomIndex = Math.floor(Math.random() * elements.length) + 1
    //elements[randomIndex].click();
    //})
    await page.screenshot({path: 'example.png'});

    await browser.close();
};
