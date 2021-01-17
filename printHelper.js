function printProgress(progress) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`${Math.round(progress * 100)}% of work done.`);
}
module.exports = printProgress;
