// theMap is defined in the .map file
const {start} = require("./test.arr.js");
const {theMap} = require("./test.arr.map");
const fs = require("fs");
const sourceMap = require("source-map");
const ErrorStackParser = require("error-stack-parser");

const originalCode = String(fs.readFileSync("examples/test.arr"));

const consumer = new sourceMap.SourceMapConsumer(theMap);
consumer.computeColumnSpans();

function findInOriginal(pos) {
  if(pos.name === null) { return "<unknown source>"; }
  const [label, startLine, startCol, endLine, endCol] = pos.name.split(",");
  const lines = originalCode.split("\n");
  if(startLine !== endLine) { return "<multiline range>"; }
  return lines[startLine - 1].slice(startCol, endCol);
}

try {
  start(); // start is the generated entry point
}
catch(e) {
//  console.log("The error is: ", e);
  const parsedStack = ErrorStackParser.parse(e);
//  console.log("Parsed stack: ", parsedStack);
  console.log("All generated positions on stack: ");
  parsedStack.forEach(function(elt) {
//    console.log("\n\nThe reported stack information from the exception: ", elt);
    const originalPos = consumer.originalPositionFor({ source: "test.arr", line: elt.lineNumber, column: elt.columnNumber }, sourceMap.SourceMapConsumer.LEAST_UPPER_BOUND);
    const fragment = findInOriginal(originalPos);

//    console.log("Mapped through original position ranges: ")
    console.log(fragment, " @ ", originalPos.name, elt.source);
    console.log();
  });
}


