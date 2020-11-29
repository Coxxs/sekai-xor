'use strict'

const path = require('path');
const fs = require('fs').promises

async function getFiles(dir) {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(dirents.map((dirent) => {
    const res = path.resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  }));
  return Array.prototype.concat(...files);
}

let myArgs = process.argv.slice(2)
if (myArgs.length !== 1) {
    console.error('wrong arguments')
}
let base = myArgs[0]

;(async () => {
  let filePaths = await getFiles(base)
  for (const filePath of filePaths) {
    let file = await fs.readFile(filePath)
    if (file.length <= 84) {
      console.log(`${filePath} too small (${file.length} Bytes), skip.`)
      continue
    }
    let head = file.readInt32LE(0)
    if (head !== 16) {
      console.log(`${filePath} not encrypted (head = ${head}), skip.`)
      continue
    }
    file = file.slice(4)
    let ptr = 0
    while (ptr < 0x80) {
      // >>> 0 returns unsigned value
      file.writeUInt32BE((file.readUInt32BE(ptr) ^ 0xFFFFFFFF) >>> 0, ptr)
      ptr += 4
      file.writeUInt32BE((file.readUInt32BE(ptr) ^ 0xFF000000) >>> 0, ptr)
      ptr += 4
    }
    await fs.writeFile(filePath, file)
    console.log(`${filePath} done.`)
  }
})()