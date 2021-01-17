function printProgress(progress) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    const percentage = Math.round(progress * 100) > 100 ? 100 : Math.round(progress * 100)
    process.stdout.write(`${percentage}% of work done.`);
}
module.exports = printProgress;
