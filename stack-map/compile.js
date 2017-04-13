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

function strpos(ast) {
  const pos = ast.pos;
  return [ast.name, pos.startRow, pos.startCol, pos.endRow, pos.endCol];
}

function compile(ast, name) {
  switch(ast.name) {
    case 'program':
      return new SN(
        ast.pos.startRow,
        ast.pos.startCol + 1,
        name,
        ["//# sourceMappingURL=./" + path.basename(name) + ".map", "\n",
         "function raise(err) { console.error(err); throw new Error(err); }\n",
         "function start() {\n"].concat(
          ast.kids.map(function(a) { return compile(a, name); })
         ).concat(["\n}\nmodule.exports = { start: start }"]),
        strpos(ast)
      );
    case 'prelude':
      return "";
    case 'fun-expr':
      return new SN(
        ast.pos.startRow,
        ast.pos.startCol + 1,
        name,
        ["function ",
         new SN(
          ast.kids[1].pos.startRow,
          ast.kids[1].pos.startCol + 1,
          name,
          [ast.kids[1].value],
          strpos(ast.kids[1])),
         "() {\n",
         "return ",
         compile(ast.kids[5], name),
         ";",
         "\n}\n"
        ],
        strpos(ast));
    case 'id-expr':
      return ast.kids[0].value;
      return new SN(
        ast.pos.startRow,
        ast.pos.startCol + 1,
        name,
        [ast.kids[0].value],
        strpos(ast));
    case 'obj-expr':
      return ["{", compile(ast.kids[1], name), "}"];
    case 'let-expr':
      const binding = ast.kids[0].kids[0].kids[0];
      console.log(binding);
      return ["const ", binding.kids[0].value, " = ", compile(ast.kids[2], name), ";\n"];
    case 'obj-field':
      return [ast.kids[0].kids[0].value, ":", compile(ast.kids[2], name)];
    case 'dot-expr':
      return new SN(
        ast.pos.startRow,
        ast.pos.startCol + 1,
        name,
        [compile(ast.kids[0], name), "[\"", ast.kids[2].value, "\"]"],
        strpos(ast));
    case 'app-expr':
      return new SN(
        ast.pos.startRow,
        ast.pos.startCol + 1,
        name,
        [compile(ast.kids[0], name), "(", compile(ast.kids[1], name), ")"],
        strpos(ast));
    case 'app-args':
      return compile(ast.kids[1]);
    case 'opt-comma-binops':
      return intersperse(ast.kids.map(function(a) { return compile(a, name); }), ",");
    case 'string-expr':
      return ast.kids[0].value;
    case 'obj-fields':
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

const m = compile(parse(program), path.basename(toRead));

const mapped = m.toStringWithSourceMap({
  file: path.basename(toRead)
});

fs.writeFileSync(toRead + ".js", mapped.code);
fs.writeFileSync(toRead + ".map", "module.exports = { theMap: " + mapped.map.toString() + "};");

});
