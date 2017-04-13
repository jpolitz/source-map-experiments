const r = require("requirejs");
r(["fs", "source-map", "path", "pyret-parser", "pyret-tokenizer"],
  function(fs, sourceMap, path, parser, tokenizer) {

const SN = sourceMap.SourceNode;

const toRead = process.argv[2];
if(!toRead) { throw "No file argument given for parsing"; }

const program = String(fs.readFileSync(toRead));

function parse(code) {
  const toks = tokenizer.Tokenizer;
  const grammar = parser.PyretGrammar;
  toks.tokenizeFrom(code);
  var parsed = grammar.parse(toks);
  var countParses = grammar.countAllParses(parsed);
  if (countParses == 0) {
    console.error("Couldn't parse: ", nextTok);
    throw new Error("Counldn't parse: " + nextTok.pos);
  }
  if (countParses === 1) {
    var ast = grammar.constructUniqueParse(parsed);
    return ast;
  } else {
    var asts = grammar.constructAllParses(parsed);
    throw "Non-unique parse";
  }
}

function intersperse(lst, elt) {
  const newList = [];
  if(lst.length === 0) { return newList; }
  for(var i = 0; i < lst.length  - 1; i += 1) {
    newList.push(lst[i]);
    newList.push(elt);
  }
  newList.push(lst[i]);
  return newList;
}

function compile(ast, name) {
  switch(ast.name) {
    case 'program':
      return new SN(
        ast.pos.startRow,
        ast.pos.startCol,
        name,
        ["//# sourceMappingURL=./" + path.basename(name) + ".map", "\n",
         "function raise(err) { console.error(err); throw new Error(err); }\n",
         "function start() {\n"].concat(
          ast.kids.map(function(a) { return compile(a, name); })
         ).concat(["\n}"])
      );
    case 'prelude':
      return "";
    case 'fun-expr':
      return new SN(
        ast.pos.startRow,
        ast.pos.startCol,
        name,
        ["function ",
         new SN(
          ast.kids[1].pos.startRow,
          ast.kids[1].pos.startCol,
          name,
          [ast.kids[1].value]),
         "() {\n",
         "return ",
         compile(ast.kids[5], name),
         ";",
         "\n}\n"
        ]);
    case 'id-expr':
      return new SN(
        ast.pos.startRow,
        ast.pos.startCol,
        name,
        [ast.kids[0].value]);
    case 'app-expr':
      return new SN(
        ast.pos.startRow,
        ast.pos.startCol,
        name,
        [compile(ast.kids[0], name), "(", compile(ast.kids[1]), ")"]);
    case 'app-args':
      return compile(ast.kids[1]);
    case 'opt-comma-binops':
      return intersperse(ast.kids.map(function(a) { return compile(a, name); }), ",");
    case 'string-expr':
      return ast.kids[0].value;
    case 'prim-expr':
    case 'binop-expr':
    case 'check-test':
    case 'expr':
    case 'block':
      return ast.kids.map(function(a) { return compile(a, name); });
    case 'stmt':
      return ast.kids.map(function(a) { return compile(a, name); });
    default:
      console.log(ast);
  }

}

console.log(parse(program));
console.log(compile(parse(program), toRead));

/*
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

*/
const m = compile(parse(program), path.basename(toRead));

const mapped = m.toStringWithSourceMap({
  file: path.basename(toRead)
});

fs.writeFileSync(toRead + ".js", mapped.code);
fs.writeFileSync(toRead + ".map", "const theMap = " + mapped.map.toString() + ";");

});
