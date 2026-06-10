const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require("fs");

const html = fs.readFileSync("d:\\software_Design\\miniGame\\games\\SanGuoShaStandard.html", "utf8");

const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.on("error", (err) => {
    console.error("Browser Error:", err);
});
virtualConsole.on("log", (log) => {
    console.log("Browser Log:", log);
});

const dom = new JSDOM(html, { 
    runScripts: "dangerously",
    virtualConsole: virtualConsole
});
