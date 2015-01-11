var wrap = require('../')

//get canvas2d
var context = require('2d-context')({ 
    width: window.innerWidth, 
    height: window.innerHeight 
})

//append to DOM
require('domready')(x => {
    document.body.appendChild(context.canvas)
})

//our font for the canvas
var fontStyle = '12px "Courier New", monospace'
var lineHeight = 15

//setup font metrics
var metrics = createFont(context, fontStyle)

//start app
draw(context)

function draw(context) {
    //get some text to word-wrap
    var text = JSON.stringify(require('../package.json'), undefined, 2)

    var lines = wrap(text, { mode: 'pre', clip: true, width: 200, compute: metrics })
    
    context.save()
    context.translate(20, 20)
    //now draw each line
    context.font = fontStyle
    lines.forEach(function (line, i) {
        var str = text.substring(line.start, line.end)
        context.fillText(str, 0, 0 + i * lineHeight)
    })
    context.restore()
}

function stringify(text, lines) {
    return lines.map(function(line) {
        return text.substring(line.start, line.end)
    }).join('\n')
}


function createFont(context, font) {
    context.font = font
    var charWidth = context.measureText('W').width
    // charWidth = 20

    return function compute(text, start, end, width) {
        var availableGlyphs = Math.floor(width/charWidth)
        var totalGlyphs = Math.floor((end-start)*charWidth)
        var glyphs = Math.min((end-start), availableGlyphs, totalGlyphs)
        return {
            width: glyphs * charWidth,
            start: start,
            end: start+glyphs
        }
    }
}