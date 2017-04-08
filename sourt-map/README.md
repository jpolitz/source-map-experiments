# Sourt-Map

This compiler takes in a newline-separated list of numbers and produces a
program that logs them in sorted order, along with an accurate source map.  It
uses https://github.com/mozilla/source-map to do so.  The end result is that
you can use the debugger to jump through the input numbers in sorted order:

![Orderly debugging](https://raw.githubusercontent.com/jpolitz/source-map-experiments/master/sourt-map/debug.gif)

To build the example, run

```
$ npm install
```

In the directory above this (the root of the repo).  Then in this directory
(`sourt-map`), run:

```
$ node compile.js examples/input1.sort
```

This will produce two files, `input1.sort.js`, and `input1.sort.map`.  The
first references the second to load it as a source map when the developer
console opens.  If you open `examples/input1.html` in a browser, you can see
the demo in action.

Notes:

- For some reason, in my Chrome version, it won't let me set a breakpoint on
  the `1` from the `input1.sort` view, but the other numbers work.  I can set
  it from the `input1.sort.js` view, however.
- All the paths are relative in this example, and they all need to be correct
  relative to the open page.  So, for example, it's important that all the
  locations (the third argument to `SourceNode`) refer correctly to
  `input1.sort` which has the original contents.  This motivates the use of
  `basename` all over the place to keep this tidy.
- Note the order of requests here – first the browser loads `input1.sort.js`
  then it loads `input1.sort.map`, then since that mapping references
  `input1.sort`, it finds that file.  If the browser can't find the file
  referenced by the paths given to the `SourceNode`s, it simply shows up blank
  in dev tools.


