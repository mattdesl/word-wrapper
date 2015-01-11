(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

//This demo shows off custom text rendering and measuring.
//It cycles through a few different examples.

var wrap = require("../");

//our font for the canvas
var fontStyle = "12px \"Courier New\", monospace";
var lineHeight = 15;

//some sample text to word-wrap
var code = JSON.stringify(require("../package.json"), undefined, 2);
var lipsum = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum luctus, elit nec rutrum interdum, ipsum nulla auctor magna, ut tincidunt turpis ex efficitur orci. Aenean maximus interdum diam, nec consequat sapien ullamcorper ac. In et tortor dictum, commodo enim ac, sodales dolor.";
var multiline = "the quick\nbrown\n\nfox jumps over the\nlazy dog";

//create a canvas2d
var context = require("2d-context")({
  width: window.innerWidth,
  height: window.innerHeight
});

//setup font metrics
var metrics = createMetrics(context, fontStyle);

//some examples to see different modes and text
var slides = [{
  text: lipsum, description: "normal at 200px",
  width: 200,
  measure: metrics
}, {
  text: multiline, description: "nowrap (newline only)",
  mode: "nowrap",
  measure: metrics
}, {
  text: code, description: "pre",
  mode: "pre"
}, {
  text: code, description: "pre clipped to 200px",
  mode: "pre",
  clip: true,
  width: 200,
  measure: metrics
}];

//This will wordwrap and draw the example "slide"
function draw(context, opt) {
  var text = opt.text;

  //wrap the text and get back a list of lines
  var lines = wrap.lines(text, opt);

  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  context.save();
  context.translate(20, 20);

  //now draw each line
  context.font = fontStyle;
  lines.forEach(function (line, i) {
    var str = text.substring(line.start, line.end);
    context.fillText(str, 0, 0 + i * lineHeight);
  });

  context.restore();
}

function createMetrics(context, font) {
  context.font = font;
  var charWidth = context.measureText("M").width;

  return function measure(text, start, end, width) {
    //measures the chunk of text, returning the substring
    //we can fit within the given width
    var availableGlyphs = Math.floor(width / charWidth);
    var totalGlyphs = Math.floor((end - start) * charWidth);
    var glyphs = Math.min(end - start, availableGlyphs, totalGlyphs);
    return {
      start: start,
      end: start + glyphs
    };
  };
}

//a little helper to show the current state
function createInfo() {
  var div = document.body.appendChild(document.createElement("div"));
  return function (text) {
    div.innerHTML = text;
  };
}


//once the dom is ready, load up our app
require("domready")(function (x) {
  var info = createInfo();
  document.body.appendChild(context.canvas);

  var index = 0;

  //start app
  change(slides[index]);

  //cycle through modes
  setInterval(function () {
    index++;
    change(slides[index % slides.length]);
  }, 2500);

  function change(slide) {
    draw(context, slide);
    info(slide.description);
  }
});

},{"../":2,"../package.json":5,"2d-context":3,"domready":4}],2:[function(require,module,exports){
"use strict";

var newline = /\n/;
var newlineChar = "\n";
var whitespace = /\s/;

module.exports = function (text, opt) {
  var lines = module.exports.lines(text, opt);
  return lines.map(function (line) {
    return text.substring(line.start, line.end);
  }).join("\n");
};

module.exports.lines = function wordwrap(text, opt) {
  opt = opt || {};

  //zero width results in nothing visible
  if (opt.width === 0 && opt.mode !== "nowrap") return [];

  text = text || "";
  var width = typeof opt.width === "number" ? opt.width : Number.MAX_VALUE;
  var start = Math.max(0, opt.start || 0);
  var end = typeof opt.end === "number" ? opt.end : text.length;
  var mode = opt.mode;

  var measure = opt.measure || monospace;
  if (mode === "pre") return pre(measure, text, start, end, width);else return greedy(measure, text, start, end, width, mode);
};

function idxOf(text, chr, start, end) {
  var idx = text.indexOf(chr, start);
  if (idx === -1 || idx > end) return end;
  return idx;
}

function isWhitespace(chr) {
  return whitespace.test(chr);
}

function pre(measure, text, start, end, width) {
  var lines = [];
  var lineStart = start;
  for (var i = start; i < end && i < text.length; i++) {
    var chr = text.charAt(i);
    var isNewline = newline.test(chr);

    //If we've reached a newline, then step down a line
    //Or if we've reached the EOF
    if (isNewline || i === end - 1) {
      var lineEnd = isNewline ? i : i + 1;
      var measured = measure(text, lineStart, lineEnd, width);
      lines.push(measured);

      lineStart = i + 1;
    }
  }
  return lines;
}

function greedy(measure, text, start, end, width, mode) {
  var lines = [];

  var testWidth = width;
  //if 'nowrap' is specified, we only wrap on newline chars
  if (mode === "nowrap") testWidth = Number.MAX_VALUE;

  while (start < end && start < text.length) {
    //get next newline position
    var newLine = idxOf(text, newlineChar, start, end);

    //eat whitespace at start of line
    while (start < newLine) {
      if (!isWhitespace(text.charAt(start))) break;
      start++;
    }

    //determine visible # of glyphs for the available width
    var measured = measure(text, start, newLine, testWidth);

    var lineEnd = start + (measured.end - measured.start);
    var nextStart = lineEnd + newlineChar.length;

    //if we had to cut the line before the next newline...
    if (lineEnd < newLine) {
      //find char to break on
      while (lineEnd > start) {
        if (isWhitespace(text.charAt(lineEnd))) break;
        lineEnd--;
      }
      if (lineEnd === start) {
        if (nextStart > start + newlineChar.length) nextStart--;
        lineEnd = nextStart // If no characters to break, show all.
        ;
      } else {
        nextStart = lineEnd;
        //eat whitespace at end of line
        while (lineEnd > start) {
          if (!isWhitespace(text.charAt(lineEnd - newlineChar.length))) break;
          lineEnd--;
        }
      }
    }
    if (lineEnd >= start) {
      var result = measure(text, start, lineEnd, testWidth);
      lines.push(result);
    }
    start = nextStart;
  }
  return lines;
}

//determines the visible number of glyphs within a given width
function monospace(text, start, end, width) {
  var glyphs = Math.min(width, end - start);
  return {
    start: start,
    end: start + glyphs
  };
}

},{}],3:[function(require,module,exports){
module.exports = function createCanvas2D(opt) {
    opt = opt||{}
    var canvas = opt.canvas || document.createElement('canvas')
    if (typeof opt.width === 'number')
        canvas.width = opt.width
    if (typeof opt.height === 'number')
        canvas.height = opt.height
    try {
        return canvas.getContext('2d', opt) || null
    } catch (e) {
        return null
    }
}
},{}],4:[function(require,module,exports){
/*!
  * domready (c) Dustin Diaz 2014 - License MIT
  */
!function (name, definition) {

  if (typeof module != 'undefined') module.exports = definition()
  else if (typeof define == 'function' && typeof define.amd == 'object') define(definition)
  else this[name] = definition()

}('domready', function () {

  var fns = [], listener
    , doc = document
    , hack = doc.documentElement.doScroll
    , domContentLoaded = 'DOMContentLoaded'
    , loaded = (hack ? /^loaded|^c/ : /^loaded|^i|^c/).test(doc.readyState)


  if (!loaded)
  doc.addEventListener(domContentLoaded, listener = function () {
    doc.removeEventListener(domContentLoaded, listener)
    loaded = 1
    while (listener = fns.shift()) listener()
  })

  return function (fn) {
    loaded ? fn() : fns.push(fn)
  }

});

},{}],5:[function(require,module,exports){
module.exports={
  "name": "word-wrapper",
  "version": "1.0.0",
  "description": "wraps words based on arbitrary 2D glyphs",
  "main": "index.js",
  "license": "MIT",
  "author": {
    "name": "Matt DesLauriers",
    "email": "dave.des@gmail.com",
    "url": "https://github.com/mattdesl"
  },
  "dependencies": {},
  "devDependencies": {
    "2d-context": "^1.1.0",
    "6to5ify": "^3.1.2",
    "beefy": "^2.1.1",
    "browserify": "^8.1.0",
    "domready": "^1.0.7",
    "tap-spec": "^2.1.2",
    "tape": "^3.0.3"
  },
  "scripts": {
    "test": "node test.js | tap-spec",
    "canvas": "beefy demo/canvas.js -- -t 6to5ify",
    "build": "browserify demo/canvas.js -t 6to5ify > demo/bundle.js"
  },
  "keywords": [
    "glyph",
    "word",
    "wrap",
    "wordwrap",
    "pre",
    "string",
    "text",
    "font",
    "rendering",
    "canvas",
    "2d",
    "text"
  ],
  "repository": {
    "type": "git",
    "url": "git://github.com/mattdesl/word-wrapper.git"
  },
  "homepage": "https://github.com/mattdesl/word-wrapper",
  "bugs": {
    "url": "https://github.com/mattdesl/word-wrapper/issues"
  }
}

},{}]},{},[1]);
