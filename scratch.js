const mammoth = require("mammoth");
const fs = require("fs");

async function run() {
  const result = await mammoth.extractRawText({ path: "d:/Medical/medical/nextjs-mongo-professional/docs/4 4 Part 4 Control of Documents.docx" });
  fs.writeFileSync("scratch_cod.txt", result.value);
  console.log("Saved to scratch_cod.txt");
}

run();
