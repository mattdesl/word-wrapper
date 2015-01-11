var wrap = require('./')
var test = require('tape')

var pre = JSON.stringify(require('./package.json'), undefined, 2)

test('wraps monospace glyphs by columns', function(t) {
    t.equal(stringify(pre, { mode: 'pre' }), pre, 'pre with no width makes no changes')
    t.equal(stringify(pre, { mode: 'pre', width: 20 }), pre, 'pre with width does not clip text')
    t.equal(stringify(pre, { mode: 'pre', width: 20, clip: true }), chop(pre, 20), 'pre with width + clip')

    var text = 'lorem   ipsum \t dolor sit amet'
    var multi = 'lorem\nipsum dolor sit amet'
    t.equal(stringify(text), text, 'text with no width is unchanged')
    t.equal(stringify(multi), multi, 'text with newlines is multi-lined')
    t.equal(stringify(text, { width: 10 }), 'lorem\nipsum\ndolor sit\namet', 'word-wrap with N width')
    
    var overflow = 'it overflows'
    t.equal(stringify(overflow, { width: 5 }), 'it\noverf\nlows', 'overflow text pushed to next line')
    
    var nowrap = 'this text  \n  only wraps \nnewlines'
    t.equal(stringify(nowrap, { mode: 'nowrap' }), 'this text  \nonly wraps \nnewlines', 'eats starting whitespace')

    t.end()
})


test('custom compute function', function(t) {
    //a custom compute function that assumes pixel width instead of monospace char width
    var word = 'words'
    t.deepEqual(compute2(word, 0, word.length, 4), { end: 0, start: 0, width: 0 }, 'test compute')
    t.deepEqual(compute2(word, 0, word.length, 5), { end: 1, start: 0, width: 5 }, 'test compute')

    var text = 'some lines'
    t.equal(stringify(text, { width: 20, compute: compute2 }), 'some\nline\ns', 'cuts text with variable glyph width')
    t.end()
})

function compute2(text, start, end, width) {
    //assume each glyph is Npx monospace
    var pxWidth = 5
    var availableGlyphs = Math.floor(width/pxWidth)
    var totalGlyphs = Math.floor((end-start)*pxWidth)
    var glyphs = Math.min(availableGlyphs, totalGlyphs)

    return {
        width: glyphs * pxWidth,
        start: start,
        end: start+glyphs
    }
}

function chop(text, width) {
    return text.split(/\n/g).map(function(str) {
        return str.substring(0, width)
    }).join('\n')
}

function stringify(text, opt) {
    var lines = wrap(text, opt)
    return lines.map(function(line) {
        return text.substring(line.start, line.end)
    }).join('\n')
}