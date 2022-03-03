const PREFIXES = {
  'even':'even',
  'focus':'focus',
  'focusWithin':'focus-within',
  'hover':'hover',
  'disabled':'disabled',
  'resonsiveSmall':'sm',
  'responsiveMedium':'md',
  'responsiveLarge':'lg',
  'responsiveXLarge':'xl',
  'responsive2XLarge':'2xl'
}

class Regex {
  constructor() {
    this._styleVarRegex = /[A-Z0-9_]+/
    this._styleLiteralRegex = /"[a-z0-9-/]+"/
    this._stylePrefixCallRegex = this._getPrefixesRegexp()
    this._stylePrefixedCallStart = [ /StyleUtils/, /\./, this._stylePrefixCallRegex, /\(/ ]
    this._stylePrefixedCallEnd = [ /\)/ ]
  }

  _getPrefixesRegexp() {
    let regexpStringStart = '/('
    let regexpStringEnd = ')/'
    let regexpStringMidList = []

    for (const string of Object.keys(PREFIXES)) {
      regexpStringMidList.push(string)
    }

    let regexpString = regexpStringStart + regexpStringMidList.join('|') + regexpStringEnd

    return new RegExp(regexpString)
  }
}

function get() {
  return new Regex()
}

module.exports = { get }
