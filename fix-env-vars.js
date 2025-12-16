// fix-env-vars.js
const fs = require("fs");
const path = require("path");

// Folder to scan (change if your code is elsewhere)
const srcDir = path.join(__dirname, "src");

// Recursively get all .js files
function getAllJsFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllJsFiles(filePath));
    } else if (file.endsWith(".js")) {
      results.push(filePath);
    }
  });
  return results;
}

// Replace "${process.env.REACT_APP_API_URL}/..." with `${process.env.REACT_APP_API_URL}/...`
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");

  // Match all occurrences of "${process.env.REACT_APP_API_URL}..." inside quotes
  const regex = /"\$\{process\.env\.REACT_APP_API_URL\}([^"]*)"/g;

  if (regex.test(content)) {
    content = content.replace(regex, (_, p1) => {
      return `\`${process.env.REACT_APP_API_URL}${p1}\``;
    });
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`Fixed: ${filePath}`);
  }
}

const files = getAllJsFiles(srcDir);
files.forEach(fixFile);

console.log("✅ All files scanned and fixed if needed.");
