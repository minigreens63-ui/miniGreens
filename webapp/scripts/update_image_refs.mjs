import fs from "fs";
import path from "path";

const mapping = JSON.parse(fs.readFileSync("image-mapping.json", "utf8"));

// Replace both the full "/images/..." path and the bare filename (for maps
// keyed by filename only, e.g. BOTTLE_IMAGE_FILENAMES in lib/productImages.ts).
const replacements = [];
for (const [oldPath, newPath] of mapping) {
  const oldUrl = "/" + oldPath.replace(/^public\//, "");
  const newUrl = "/" + newPath.replace(/^public\//, "");
  replacements.push([oldUrl, newUrl]);
  replacements.push([path.basename(oldPath), path.basename(newPath)]);
}
// Longest-first so full paths match before bare filenames collide.
replacements.sort((a, b) => b[0].length - a[0].length);

function walk(dir, files = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      if (f === "node_modules" || f === ".next") continue;
      walk(p, files);
    } else if (/\.(ts|tsx|js|jsx)$/.test(f)) {
      files.push(p);
    }
  }
  return files;
}

const dirs = ["app", "components", "lib", "store", "context"];
let changedFiles = 0;
let totalReplacements = 0;

for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue;
  for (const file of walk(dir)) {
    let content = fs.readFileSync(file, "utf8");
    let fileChanged = false;
    for (const [oldStr, newStr] of replacements) {
      if (content.includes(oldStr)) {
        const count = content.split(oldStr).length - 1;
        content = content.split(oldStr).join(newStr);
        totalReplacements += count;
        fileChanged = true;
      }
    }
    if (fileChanged) {
      fs.writeFileSync(file, content);
      changedFiles++;
      console.log("updated:", file);
    }
  }
}

console.log(`\n${changedFiles} files changed, ${totalReplacements} replacements`);
