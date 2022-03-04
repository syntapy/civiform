const assert = require('assert')
const _ = require('lodash')
const regexPatterns = require('./regex')

class MatchChecker {
  isMatch(identifiers, definition, startOnly=false) {
    let validLength = identifiers.length === definition.length
    if (startOnly) {
      validLength = identifiers.length > definition.length
    }

    if (validLength) {
      for (const index in definition) {
        try {
          if (!definition[index].test(identifiers[index])) {
            return false
          }
        } catch(error) {
          throw error
        }
      }

      return true
    }

    return false
  }
}

// Yes, parsers to parse parsed results. But the first round of parsing 
// makes this a robust solution for trimming styles
// 
// These parser only need to worry about whether it encountered a match. And it starts its
// process of parsing / checking at every node in the tree during the visitor's traversal
// so it doesn't need to think about all the myriads of input that Java can throw at it
//
// Rather it just focuses on the stuff it knows about

// Parses for all possible styles in Styles.java and BaseStyles.java
class StylesDict extends MatchChecker {
  constructor(patterns) {
    super()

    this.patterns = patterns

    this._styleDefinition = [
      /^public$/, /^static$/, /^final$/, /^String$/, this.patterns._styleVarRegex, /^=$/, this.patterns._styleLiteralRegex, /^;$/
    ]

    this._styleCall = [
      /^Styles$/, /^\.$/, this.patterns._styleVarRegex
    ]

    this.stylesDict = {}
  }

  _extractKeyVal(identifiers) {
    const key = identifiers[4]
    const val = identifiers[6].replace(/"/g, "")

    this.add(key, val)
  }

  addBaseStyle(identifiers) {
    if (this.isMatch(identifiers, this._styleDefinition)) {
      this._extractKeyVal(identifiers)
    }
  }

  add(key, val) {
    this.stylesDict[key] = val
  }

  get(key) {
    return this.stylesDict[key]
  }
}

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

class StylesParser extends MatchChecker {
  constructor(patterns, stylesDict) {
    super()

    this.patterns = patterns
    this.stylesDict = stylesDict

    // html tag
    this._tagRegex = /^[a-z0-6]+$/

    this._importedTagDefinition = [/^import$/, /^static$/, /^j2html$/, /^\.$/, /^TagCreator$/, /^\.$/, this._tagRegex, /^;$/ ]
    this._calledTagDefinition = [/^TagCreator$/, /^\.$/, this._tagRegex ]
    this._styleCallDefinition = [/^(Styles|BaseStyles|ReferenceClasses)$/, /^\.$/, this.patterns._styleVarRegex ]

    // e.g. the 'StyleUtils.responsiveLarge' in 'Styleutils.responsiveLarge(Styles.XYZ, Styles.UVW)'
    let stylePrefixCallRegex = this._getPrefixedCallRegexp()
    this._stylePrefixedCallStart = [ /^StyleUtils$/, /^\.$/, stylePrefixCallRegex, /^\($/ ]
    this._stylePrefixedCallEnd = [ /^\)$/ ]

    this.stylesList = []
    this.stylesDict = stylesDict
  }

  add(styleOrTag) {
    this.stylesList.push(styleOrTag)
  }

  addImportedTag(identifiers) {
    if (this.isMatch(identifiers, this._importedTagDefinition)) {
      const tag = identifiers[6]
      this.add(tag)
    }
  }

  addCalledTag(identifiers) {
    const startOnly = true
    if (this.isMatch(identifiers, this._calledTagDefinition, startOnly)) {
      const tag = identifiers[2]
      this.add(tag)
    }
  }

  addBaseStyle(identifiers) {
    if (this.isMatch(identifiers, this._styleCallDefinition)) {
      const styleKey = identifiers[2]
      const styleVal = this.stylesDict.get(styleKey)

      this.add(styleVal)
    }
  }

  addPrefixedStyle(identifiers) {
    const startOnly = true
    if (this.isMatch(identifiers, this._stylePrefixedCallStart, startOnly)) {
      const length = identifiers.length
      let lastIndex = length-1 // skip the last ')' in StyleUtils.responsiveXYX(..)
      let firstIndex = 4

      const prefixCall = identifiers.slice(0, firstIndex)

      const prefixKey = prefixCall[2]
      const prefixVal = PREFIXES[prefixKey]
      const subIdentifiers = identifiers.slice(firstIndex, lastIndex)

      for (const styleCallMaybe of this._iterateBaseStyles(subIdentifiers)) {
        if (styleCallMaybe) {
          this.add(prefixVal+':'+styleCallMaybe)
        } else {
          break
        }
      }
    }
  }

  *_iterateBaseStyles(identifiers) {
    let index = 0

    while (index < identifiers.length) {
      if (identifiers[index] === ',') {
        index++
      }
      let styleClass = identifiers[index]; index++
      let dot = identifiers[index]; index++
      let styleCall = identifiers[index]; index++

      if (this.isMatch([styleClass, dot, styleCall], this._styleCallDefinition)) {
        yield this.stylesDict.get(styleCall)
      }
    }
  }

  _getPrefixedCallRegexp() {
    let regexpStringStart = '^('
    let regexpStringEnd = ')$'
    let regexpStringMidList = []

    for (const string of Object.keys(PREFIXES)) {
      regexpStringMidList.push(string)
    }

    let regexpString = regexpStringStart + regexpStringMidList.join('|') + regexpStringEnd
    return new RegExp(regexpString)
  }
}

// TODO: Turn into singleton maybe?
function getStylesDict() {
  const patterns = regexPatterns.get()
  return new StylesDict(patterns)
}

function getStylesParser(stylesDict) {
  const patterns = regexPatterns.get()
  return new StylesParser(patterns, stylesDict)
}

function getMockStylesDict() {
  const stylesDict = getStylesDict()

  let identifiers = ['public', 'static', 'final', 'String', 'BG_SCROLL', '=', '"bg-scroll"', ';']
  stylesDict.addBaseStyle(identifiers)
  assert(_.has(stylesDict.stylesDict, 'BG_SCROLL'))
  assert(stylesDict.stylesDict['BG_SCROLL'] == 'bg-scroll')
  assert(Object.keys(stylesDict.stylesDict).length === 1)

  identifiers = ['Styles', '.', 'BG_SCROLL']
  stylesDict.addBaseStyle(identifiers)
  assert(!_.has(stylesDict.stylesDict, 'PLACEHOLDER_INDIGO_600'))
  assert(Object.keys(stylesDict.stylesDict).length === 1)

  identifiers = ['public', 'static', 'final', 'String', 'PLACEHOLDER_INDIGO_600', '=', '"placeholder-indigo-600"', ';']
  stylesDict.addBaseStyle(identifiers)
  assert(_.has(stylesDict.stylesDict, 'PLACEHOLDER_INDIGO_600'))
  assert(stylesDict.stylesDict['PLACEHOLDER_INDIGO_600'] == 'placeholder-indigo-600')
  assert(Object.keys(stylesDict.stylesDict).length === 2)

  identifiers = ['public', 'static', 'final', 'String', 'TOP_1_2', '=', '"top-1/2"', ';']
  stylesDict.addBaseStyle(identifiers)
  assert(_.has(stylesDict.stylesDict, 'TOP_1_2'))
  assert(stylesDict.stylesDict['TOP_1_2'] == 'top-1/2')
  assert(Object.keys(stylesDict.stylesDict).length === 3)

  identifiers = ['public', 'static', 'final', 'String', 'BG_BLUE_200', '=', '"bg-blue-200"', ';']
  stylesDict.addBaseStyle(identifiers)
  assert(_.has(stylesDict.stylesDict, 'BG_BLUE_200'))
  assert(stylesDict.stylesDict['BG_BLUE_200'] == 'bg-blue-200')
  assert(Object.keys(stylesDict.stylesDict).length === 4)

  return stylesDict
}

function testImportedTagParser() {
  const stylesDict = getStylesDict()
  const stylesParser = getStylesParser()

  let identifiers = ['import', 'static', 'j2html', '.', 'TagCreator', '.', 'div', ';']
  stylesParser.addImportedTag(identifiers)
  assert(stylesParser.stylesList.length === 1)
  assert(stylesParser.stylesList[0] === 'div')

  identifiers = ['import', 'static', 'j2html', '.', 'TagCreator', '.', 'dIv', ';']
  stylesParser.addImportedTag(identifiers)
  assert(stylesParser.stylesList.length === 1)

  identifiers = ['Styles', '.', 'BG_BLUE_300']
  stylesParser.addImportedTag(identifiers)
  assert(stylesParser.stylesList.length === 1)

  identifiers = ['import', 'static', 'j2html', '.', 'TagCreator', '.', 'h6', ';']
  stylesParser.addImportedTag(identifiers)
  assert(stylesParser.stylesList.length === 2)
  assert(stylesParser.stylesList[1] === 'h6')
}

function testCalledTagParser() {
  const stylesDict = getStylesDict()
  const stylesParser = getStylesParser(stylesDict)

  let identifiers = ['TagCreator', '.', 'body', '(', ')']
  stylesParser.addCalledTag(identifiers)
  assert(stylesParser.stylesList.length === 1)
  assert(stylesParser.stylesList[0] === 'body')

  identifiers = ['TagCreator', '.', 'button', '(', 'text', '(', '"', 'Upload to Azure Blob Storage', '"', ')', ')']
  stylesParser.addCalledTag(identifiers)
  assert(stylesParser.stylesList.length === 2)
  assert(stylesParser.stylesList[1] === 'button')
}

function testBaseStyleParser() {
  const stylesDict = getMockStylesDict()
  const stylesParser = getStylesParser(stylesDict)

  let identifiers = ['Styles', '.', 'BG_BLUE_200']
  stylesParser.addBaseStyle(identifiers)
  assert(stylesParser.stylesList.includes('bg-blue-200'))

  identifiers = ['BaseStyles', '.', 'PLACEHOLDER_INDIGO_600']
  stylesParser.addBaseStyle(identifiers)
  assert(stylesParser.stylesList.includes('placeholder-indigo-600'))

  identifiers = ['Styles', '.', 'TOP_1_2']
  stylesParser.addBaseStyle(identifiers)
  assert(stylesParser.stylesList.includes('top-1/2'))
}

function testPrefixedStyleParser() {
  const stylesDict = getMockStylesDict()
  const stylesParser = getStylesParser(stylesDict)

  let identifiers = ['StyleUtils', '.', 'responsiveMedium', '(', 'Styles', '.', 'BG_SCROLL', ')']
  stylesParser.addPrefixedStyle(identifiers)
  assert(stylesParser.stylesList.length === 1)
  assert(stylesParser.stylesList.includes('md:bg-scroll'))

  // Cannot have spaces in identifiers. e.g. the ',' identifier
  identifiers = ['StyleUtils', '.', 'focusWithin', '(', 'Styles', '.', 'TOP_1_2', ',', 'BaseStyles', '.', 'BG_BLUE_200', ')']
  stylesParser.addPrefixedStyle(identifiers)
  assert(stylesParser.stylesList.length === 3)
  assert(stylesParser.stylesList.includes('focus-within:top-1/2'))
  assert(stylesParser.stylesList.includes('focus-within:bg-blue-200'))
}

testImportedTagParser()
testCalledTagParser()
testBaseStyleParser()
testPrefixedStyleParser()

module.exports = { getStylesDict, getStylesParser }
