const assert = require('assert')
const _ = require('lodash')
const regexPatterns = require('./regex')

// Yes, parsers to parse parsed results. But the first round of parsing 
// makes this a robust solution for trimming styles
// 
// These parser only need to worry about whether it encountered a match. And it starts its
// process of parsing / checking at every node in the tree during the visitor's traversal
// so it doesn't need to think about all the myriads of input that Java can throw at it
//
// Rather it just focuses on the stuff it knows about

// Parses for all possible styles in Styles.java and BaseStyles.java
class BaseStylesParser {
  constructor(patterns) {
    this.patterns = patterns

    this._styleDefinition = [
      /public/, /static/, /final/, /String/, this.patterns._styleVarRegex, /=/, this.patterns._styleLiteralRegex, /;/
    ]

    this._styleCall = [
      /Styles/, /\./, this.patterns._styleVarRegex
    ]

    this.stylesDict = {}
  }

  _extractKeyVal(identifiers) {
    const key = identifiers[4]
    const val = identifiers[6].replace(/"/g, "")

    this.stylesDict[key] = val
  }

  maybeProcessBaseStyle(identifiers) {
    if (identifiers.length === this._styleDefinition.length) {
      for (const index in this._styleDefinition) {
        let pattern = this._styleDefinition[index]
        let id = identifiers[index]

        if (!pattern.test(id)) {
          // Does not match
          return null
        }
      }

      // Its a match, so we can add it as a style
      // in our dictionary of all possible styles
      this._extractKeyVal(identifiers)
    }
  }
}

// Parses for style calls and html tags
class TagsAndStylesParser {
  constructor() {
    this.callRegex = /[0-9A-Z_]+/
    this.tagRegex = /[0-6a-z:]+/
    this.styleList = []
    this.tagList = []
  }

  process(identifiers) {
  }

  _maybeGetBaseStyleCall(identifiers) {
  }

  _maybeGetPrefixedStyleCall(identifiers) {
  }

  _maybeGetImportedTag(identifiers) {
  }

  _maybeGetCalledTag(identifiers) {
  }
}

function getBaseStylesParser() {
  const patterns = regexPatterns.get()
  return new BaseStylesParser(patterns)
}

function test() {
  const baseStylesParser = getBaseStylesParser()

  let identifiers = ['public', 'static', 'final', 'String', 'BG_SCROLL', '=', '"bg-scroll"', ';']
  baseStylesParser.maybeProcessBaseStyle(identifiers)

  assert(_.has(baseStylesParser.stylesDict, 'BG_SCROLL'))
  assert(baseStylesParser.stylesDict['BG_SCROLL'] == 'bg-scroll')

  identifiers = ['Styles', '.', 'BG_SCROLL']
  baseStylesParser.maybeProcessBaseStyle(identifiers)

  assert(Object.keys(baseStylesParser.stylesDict).length === 1)
}

test()

module.exports = { getBaseStylesParser }
