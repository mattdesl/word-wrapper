var newline = /\n/
var newlineChar = '\n'
var whitespace = /\s/

module.exports = function wordwrap(text, opt) {
    opt = opt||{}

    //zero width results in nothing visible
    if (opt.width === 0 && opt.mode !== 'nowrap') 
        return []

    text = text||''
    var width = typeof opt.width === 'number' ? opt.width : Number.MAX_VALUE
    var start = Math.max(0, opt.start||0);
    var end = typeof opt.end === 'number' ? opt.end : text.length;
    var mode = opt.mode
    var clip = opt.clip

    var comptue = opt.compute || monospace
    if (mode === 'pre')
        return pre(comptue, text, start, end, width, clip)
    else
        return greedy(comptue, text, start, end, width, mode, clip)
}


function idxOf(text, chr, start, end) {
    var idx = text.indexOf(chr, start);
    if (idx === -1 || idx > end)
        return end;
    return idx;
}

function isWhitespace(chr) {
    return whitespace.test(chr)
}

function pre(compute, text, start, end, width, clip) {
    var lines = []
    var lineStart = start
    for (var i=start; i<end; i++) {
        var chr = text.charAt(i)
        var isNewline = newline.test(chr)

        //If we've reached a newline, then step down a line
        //Or if we've reached the EOF
        if (isNewline || i===end-1) {
            var lineEnd = isNewline ? i : i+1
            var availableWidth = clip ? width : Number.MAX_VALUE
            var computed = compute(text, lineStart, lineEnd, availableWidth)
            lines.push(computed)
            // var chunk = text.substring(computed.start, computed.end)
            // debugger
            
            lineStart = i+1
        }
    }
    return lines
}

function greedy(compute, text, start, end, width, mode, clip) {
    var lines = []

    var testWidth = width
    //if 'nowrap' is specified, we only wrap on newline chars
    if (mode === 'nowrap')
        testWidth = Number.MAX_VALUE

    while (start < end) {
        //get next newline position
        var newLine = idxOf(text, newlineChar, start, end)

        //eat whitespace at start of line
        while (start < newLine) {
            if (!isWhitespace( text.charAt(start) ))
                break
            start++
        }

        //determine visible # of glyphs for the available width
        var computed = compute(text, start, newLine, testWidth)

        var lineEnd = start + (computed.end-computed.start)
        var nextStart = lineEnd + newlineChar.length

        //if we had to cut the line before the next newline...
        if (lineEnd < newLine) {
            //find char to break on
            while (lineEnd > start) {
                if (isWhitespace(text.charAt(lineEnd)))
                    break
                lineEnd--
            }
            if (lineEnd === start) {
                if (nextStart > start + newlineChar.length) nextStart--
                lineEnd = nextStart // If no characters to break, show all.
            } else {
                nextStart = lineEnd
                //eat whitespace at end of line
                while (lineEnd > start) {
                    if (!isWhitespace(text.charAt(lineEnd - newlineChar.length)))
                        break
                    lineEnd--
                }
            }
        }
        if (lineEnd >= start) {
            var result = compute(text, start, lineEnd, testWidth)
            lines.push(result)
        }
        start = nextStart
    }
    return lines
}

//determines the visible number of glyphs within that width
function monospace(text, start, end, width) {
    var glyphs = Math.min(width, end-start)
    return {
        width: glyphs,
        start: start,
        end: start+glyphs
    }
}