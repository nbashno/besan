const crypto = require("crypto");
const fs = require("fs");
const initData = fs.readFileSync("initdata.txt", "utf8").trim();
let hash = "";
const data = [];
for (const p of initData.split("&")) {
  const i = p.indexOf("=");
  const k = p.substring(0, i), v = p.substring(i + 1);
  if (k === "hash") hash = v; else data.push(k + "=" + v);
}
data.sort();
const t = "8877710192:AAEUy771CekMnlyHwvyZa1y2ht56L9LuvkA";
const secret = crypto.createHmac("sha256", "WebAppData").update(t).digest();
const computed = crypto.createHmac("sha256", secret).update(data.join("\n")).digest("hex");
const uname = /first_name%22%3A%22([^%]*)/.exec(initData);
console.log("user:", uname ? decodeURIComponent(uname[1]) : "?");
console.log("received:", hash);
console.log("computed:", computed);
console.log(hash === computed ? "*** MATCH ***" : "MISMATCH");
