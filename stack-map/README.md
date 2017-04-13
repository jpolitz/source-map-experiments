# Mapping Pyret Locations

To try out the demo, make sure you run `npm install` in the root of the repo,
then in this directory (`stack-map`), run

```
$ node compile.js examples/test.arr
$ node gather-trace.js examples/test.arr
```

There are some `console.log` statements you can comment in and out in
`gather-trace` to see what's going on.

An example input program:

```
fun h():
  { f: f }
end

fun f():
  g()
end

o = { h: h }

fun g():
  raise("yikes")
end

o.h().f()
```

Generated code:

```
//# sourceMappingURL=./test.arr.map
function raise(err) { console.error(err); throw new Error(err); }
function start() {
function h() {
return {f:f};
}
function f() {
return g();
}
const o = {h:h};
function g() {
return raise("yikes");
}
o["h"]()["f"]()
}
module.exports = { start: start }
```

Output of running the program:

```
All generated positions on stack:
<multiline range>  @  program,1,0,15,9     at raise (/Users/joe/src/simple-sourcemap/stack-map/examples/test.arr.js:2:49)

raise("yikes")  @  app-expr,12,2,12,16     at g (/Users/joe/src/simple-sourcemap/stack-map/examples/test.arr.js:12:8)

g()  @  app-expr,6,2,6,5     at Object.f (/Users/joe/src/simple-sourcemap/stack-map/examples/test.arr.js:8:8)

o.h().f()  @  app-expr,15,0,15,9     at start (/Users/joe/src/simple-sourcemap/stack-map/examples/test.arr.js:14:14)

<unknown source>  @  null     at Object.<anonymous> (/Users/joe/src/simple-sourcemap/stack-map/gather-trace.js:26:3)

<unknown source>  @  null     at Module._compile (module.js:571:32)

<unknown source>  @  null     at Object.Module._extensions..js (module.js:580:10)

<unknown source>  @  null     at Module.load (module.js:488:32)

<unknown source>  @  null     at tryModuleLoad (module.js:447:12)

<unknown source>  @  null     at Function.Module._load (module.js:439:3)
```

The `<unknown source>` lines mean that there was no mapping (these are internal
to `node`).  The first mapping matched the whole program (as many toplevel
matches will).  The others are quite sensible, and the program fragments were
fetched by using the ranges stored in the `name` fields of the reverse mappings.

One trick is that if this is only for stack traces, then we may _only_ want to
put source locations on app expressions.  See that in the `id-expr` case, there
are two return statements; if we used the second one, applications of the form
`g()` or `raise("yikes")` only report the location of the id, not the location
of the full application.

```
    case 'id-expr':
      return ast.kids[0].value;
      return new SN(
        ast.pos.startRow,
        ast.pos.startCol + 1,
        name,
        [ast.kids[0].value],
        strpos(ast));
```

