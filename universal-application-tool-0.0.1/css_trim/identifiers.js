const assert = require('assert')
const _ = require('lodash')
const regexPatterns = require('./regex')

// Checks if a list of identifers matches a definition
// The startOnly variable is for cases where we want to check
// only the beginning of the list of identifiers
//
// E.g., if we come to a node in the CST where we have Styles.XYZ
// that will have 3 identifiers in the list:
//
//   identifiers = ['Styles', '.', 'XYZ']
// 
// In that case we check the whole thing
//
// But in a call like 'StyleUtils.responsiveMedium(Styles.UVW, Styles.XYZ)'
// we will have identifiers be (notice theres no spaces)
//
//   identifiers = ['StyleUtils', '.', 'repsonsiveMedium', '(', 'Styles', '.', 'UVW', ',', 'Styles', '.', 'XYZ', ')']
//
// In this case we only  check that its the beginning of a StyleUtils method call
// and determine which method it was to decide on the prefix. The parent caller for this
// would then parse the Styles.UVW and Styles.XYZ to identify which styles to attach
// that prefix to
class MatchChecker {
  isMatch(identifiers, definition, startOnly=false) {
    let validLength = identifiers.length === definition.length
    if (startOnly) {
      validLength = identifiers.length >= definition.length
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

// Parses for all possible styles in Styles.java and ReferenceClasses.java
// This is then used as a lookup dictionary to identify calls to e.g. 
// Styles.XYZ throughout the code and match them with the tailwind class
class StylesDictAggregator extends MatchChecker {
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

  getDict() {
    return this.stylesDict
  }

  _extractKeyVal(identifiers) {
    // This would be 'XYZ' in 
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

// This uses the above to match calls to Styles.XYZ to the tailwind class
//
// It also gets all the HTML tags used, as well as calls to 'StyleUtils.mediaQueryMethod(args..)'
//
// The styles dict above must be created first
class StylesAggregator extends MatchChecker {
  constructor(patterns, stylesDict) {
    super()

    this.patterns = patterns
    this.stylesDict = stylesDict

    this.prefixes = {
      'even':'even',
      'focus':'focus',
      'focusWithin':'focus-within',
      'hover':'hover',
      'disabled':'disabled',
      'responsiveSmall':'sm',
      'responsiveMedium':'md',
      'responsiveLarge':'lg',
      'responsiveXLarge':'xl',
      'responsive2XLarge':'2xl'
    }

    // html tag
    this._tagRegex = /^[a-z0-6]+$/

    this._importedTagDefinition = [/^j2html$/, /^\.$/, /^TagCreator$/, /^\.$/, this._tagRegex]
    this._tagCreatorCallDefinition = [/^TagCreator$/, /^\.$/, this._tagRegex ]
    this._j2htmlCallDefinition = [/^j2html$/, /^\.$/, /^TagCreator$/, /^\.$/, this._tagRegex ]
    this._styleCallDefinition = [/^(Styles|BaseStyles|ReferenceClasses)$/, /^\.$/, this.patterns._styleVarRegex ]

    // e.g. the 'StyleUtils.responsiveLarge' in 'Styleutils.responsiveLarge(Styles.XYZ, Styles.UVW)'
    let stylePrefixCallRegex = this._getPrefixedCallRegexp()
    this._stylePrefixedCallStart = [ /^StyleUtils$/, /^\.$/, stylePrefixCallRegex, /^\($/ ]
    this._stylePrefixedCallEnd = [ /^\)$/ ]

    this.reset()
    this.stylesDict = stylesDict
  }

  reset() {
    this.stylesList = []
  }

  getStyles() {
    return this.stylesList
  }

  add(styleOrTag) {
    this.stylesList.push(styleOrTag)
  }

  // Gets HTML tag matching e.g. 'import static j2hmlt.TagCreator.h1'
  addImportedTag(identifiers) {
    if (this.isMatch(identifiers, this._importedTagDefinition)) {
      const tag = identifiers[4]
      this.add(tag)
    }
  }

  // Gets HTML tag matching e.g. 'TagCreator.h1(args..)'
  // of 'j2html.TagCreator.h1(args...)'
  addCalledTag(identifiers) {
    const startOnly = true
    if (this.isMatch(identifiers, this._tagCreatorCallDefinition, startOnly)) {
      const tag = identifiers[2]
      this.add(tag)
    } else if (this.isMatch(identifiers, this._j2htmlCallDefinition, startOnly)) {
      const tag = identifiers[4]
      this.add(tag)
    }
  }

  // Adds tailwind class from a basic call to a 'Styles.XYZ' or a 'ReferenceClasses.XYZ'
  addBaseStyle(identifiers) {
    if (this.isMatch(identifiers, this._styleCallDefinition)) {
      const styleKey = identifiers[2]
      const styleVal = this.stylesDict[styleKey]

      if (styleVal) {
        this.add(styleVal)
      }
    }
  }

  // For processing media queries refernced by e.g. 'Styleutils.responsiveMedium(Styles.XYZ, Styles.UVW)'
  addPrefixedStyle(identifiers) {
    const startOnly = true

    // Checks if the begining matches 'StyleUtils.someMediaQueryMethod'
    if (this.isMatch(identifiers, this._stylePrefixedCallStart, startOnly)) {
      const length = identifiers.length
      let lastIndex = length-1 // skip the last ')' in StyleUtils.responsiveXYX(..)
      let firstIndex = 4

      const prefixCall = identifiers.slice(0, firstIndex)

      const prefixKey = prefixCall[2]
      const prefixVal = this.prefixes[prefixKey]
      const subIdentifiers = identifiers.slice(firstIndex, lastIndex)

      // Look at each Styles.XYZ passed to the media query method
      for (const styleCallMaybe of this._iterateBaseStyles(subIdentifiers)) {
        if (styleCallMaybe) {
          const prefixedStyle = prefixVal+':'+styleCallMaybe
          this.add(prefixedStyle)
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
        let value = this.stylesDict[styleCall]
        if (value) {
          yield value
        }
      }
    }
  }

  _getPrefixedCallRegexp() {
    let regexpStringStart = '^('
    let regexpStringEnd = ')$'
    let regexpStringMidList = []

    for (const string of Object.keys(this.prefixes)) {
      regexpStringMidList.push(string)
    }

    let regexpString = regexpStringStart + regexpStringMidList.join('|') + regexpStringEnd
    return new RegExp(regexpString)
  }
}

// TODO: Turn into singleton maybe?
function getStylesDictAggregator() {
  const patterns = regexPatterns.get()
  return new StylesDictAggregator(patterns)
}

function getStylesAggregator(stylesDict) {
  const patterns = regexPatterns.get()
  return new StylesAggregator(patterns, stylesDict)
}

function getMockStylesDict() {
  const stylesDict = getStylesDictAggregator()

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

  return stylesDict.getDict()
}

/*  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S
 *  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S
 *  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S
 *  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S
 *  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S
 *  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S
 *  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S
 *  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S  T E S T S
 */



function testImportedTagParser() {
  // Don't need anything in stylesDict for these tests
  const stylesDict = {}
  const stylesParser = getStylesAggregator(stylesDict)

  let identifiers = ['j2html', '.', 'TagCreator', '.', 'div']
  stylesParser.addImportedTag(identifiers)
  assert(stylesParser.stylesList.length === 1)
  assert(stylesParser.stylesList[0] === 'div')

  identifiers = ['import', 'static', 'j2html', '.', 'TagCreator', '.', 'dIv', ';']
  stylesParser.addImportedTag(identifiers)
  assert(stylesParser.stylesList.length === 1)

  identifiers = ['Styles', '.', 'BG_BLUE_300']
  stylesParser.addImportedTag(identifiers)
  assert(stylesParser.stylesList.length === 1)

  identifiers = ['j2html', '.', 'TagCreator', '.', 'h6']
  stylesParser.addImportedTag(identifiers)
  assert(stylesParser.stylesList.length === 2)
  assert(stylesParser.stylesList[1] === 'h6')

  identifiers = ['j2html', '.', 'TagCreator', '.', 'p']
  stylesParser.addImportedTag(identifiers)
  assert(stylesParser.stylesList.length === 3)
  assert(stylesParser.stylesList[2] === 'p')
}

function testCalledTagParser() {
  // Don't need anything in stylesDict for these tests
  const stylesDict = {}
  const stylesParser = getStylesAggregator(stylesDict)

  let identifiers = ['TagCreator', '.', 'body', '(', ')']
  stylesParser.addCalledTag(identifiers)
  assert(stylesParser.stylesList.length === 1)
  assert(stylesParser.stylesList[0] === 'body')

  identifiers = ['TagCreator', '.', 'button', '(', 'text', '(', '"', 'Upload to Azure Blob Storage', '"', ')', ')']
  stylesParser.addCalledTag(identifiers)
  assert(stylesParser.stylesList.length === 2)
  assert(stylesParser.stylesList[1] === 'button')

  identifiers = ['j2html', '.', 'TagCreator', '.', 'body', '(', ')', '.', 'with', '(', 'renderHeader', '(', ')', ')', '.', 'with', '(', 'renderMain', '(', ')', ')', ';']
  stylesParser.addCalledTag(identifiers)
  assert(stylesParser.stylesList.length === 3)
  assert(stylesParser.stylesList[2] === 'body')
}

function testBaseStyleParser() {
  const stylesDict = getMockStylesDict()
  const stylesParser = getStylesAggregator(stylesDict)

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
  const stylesParser = getStylesAggregator(stylesDict)

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

module.exports = { getStylesDictAggregator, getStylesAggregator }
