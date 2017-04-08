const fs = require('fs');
const sourceMap = require('source-map');
const path = require('path');

const SN = sourceMap.SourceNode;

const toRead = process.argv[2];
if(!toRead) { throw "No file argument given for parsing"; }

const program = String(fs.readFileSync(toRead));



function parse(code) {
  const lines = code.split("\n");
  const ast = [];
  var totalChars = 0;
  lines.forEach(function(l, i) {
    console.log(l.length);
    ast.push({
      loc: {
        startLine: i + 1,
        startCol: 0,
        startCh: totalChars,
        endLine: i + 1,
        endCol: l.length,
        endCh: totalChars + l.length
      },
      content: l
    });
    totalChars += l.length + 1;
  });
  return ast;
}

function compile(ast) {
  const sorted = Array.prototype.slice.apply(ast, []);
  sorted.sort(function(a, b) { return Number(a.content) - Number(b.content); });
  const compiled = sorted.map(function(l) {
    return {
      loc: l.loc,
      code: "console.log(" + l.content + ");",
      original: l
    }
  });
  return compiled;
}


function makeMap(compiled, name) {
  return new SN(
    compiled[0].loc.startLine,
    compiled[0].loc.startCol,
    name,
    ["//# sourceMappingURL=./" + path.basename(toRead) + ".map", "\n",
     "function go() {\n"].concat(
      compiled.map(function(c) {
        console.log(c.code);
        return new SN(c.loc.startLine, c.loc.startCol, name, [c.code, "\n"]);
      })).concat([
     "}"
     ])
  );
}

const m = makeMap(compile(parse(program)), path.basename(toRead));

const mapped = m.toStringWithSourceMap({
  file: toRead
});

fs.writeFileSync(toRead + ".js", mapped.code);
fs.writeFileSync(toRead + ".map", mapped.map.toString());




