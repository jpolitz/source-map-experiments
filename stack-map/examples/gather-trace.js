// theMap is defined in the .map file
const consumer = new sourceMap.SourceMapConsumer(theMap);
consumer.computeColumnSpans();

try {
  start(); // start is the generated entry point
}
catch(e) {
  console.log("The error is: ", e);
  const parsedStack = ErrorStackParser.parse(e);
  console.log("Parsed stack: ", parsedStack);
  console.log("All generated positions on stack: ");
  parsedStack.forEach(function(elt) {
    console.log(consumer.originalPositionFor({ source: "test.arr", line: elt.lineNumber, column: elt.columnNumber }));
  });
}


