import fs from "fs";

const logoBase64 = fs.readFileSync("./image.png", "base64");
console.log(logoBase64);
