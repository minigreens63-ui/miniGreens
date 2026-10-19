import sharp from "sharp";
import fs from "fs";
import path from "path";

const root = "public/images";
const MAX_DIM = 2000;
const QUALITY = 82;

function walk(dir, files = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, files);
    else if (/\.(png|jpe?g)$/i.test(f) && !p.replace(/\\/g, "/").includes("/images/og/")) {
      files.push(p);
    }
  }
  return files;
}

const files = walk(root);
let totalBefore = 0;
let totalAfter = 0;
const mapping = [];

for (const file of files) {
  const before = fs.statSync(file).size;
  totalBefore += before;
  const out = file.replace(/\.(png|jpe?g)$/i, ".webp");

  const meta = await sharp(file).metadata();
  const resize = {};
  if (meta.width > MAX_DIM || meta.height > MAX_DIM) {
    if (meta.width >= meta.height) resize.width = MAX_DIM;
    else resize.height = MAX_DIM;
  }

  let pipeline = sharp(file);
  if (resize.width || resize.height) pipeline = pipeline.resize(resize);
  await pipeline.webp({ quality: QUALITY }).toFile(out);

  const after = fs.statSync(out).size;
  totalAfter += after;
  mapping.push([file.replace(/\\/g, "/"), out.replace(/\\/g, "/")]);
  fs.unlinkSync(file);
  console.log(
    `${file} ${(before / 1024 / 1024).toFixed(2)}MB -> ${out} ${(after / 1024 / 1024).toFixed(2)}MB`,
  );
}

fs.writeFileSync(
  path.join(process.cwd(), "image-mapping.json"),
  JSON.stringify(mapping, null, 2),
);

console.log("\nTotal before:", (totalBefore / 1024 / 1024).toFixed(1), "MB");
console.log("Total after:", (totalAfter / 1024 / 1024).toFixed(1), "MB");
