"use strict"
const chevrotain = require("chevrotain")
const stylesDotJavaLexer = require('./lexer')
const { stylesDotJavaTokens, stylesDotJavaTokensDictionary, exampleTokens } = require("./tokens")

class StylesDotJavaParser extends chevrotain.CstParser {
  constructor() {
    super(stylesDotJavaTokens);

    const $ = this

    $.RULE("stylePair", () => {
      //$.AT_LEAST_ONE_SEP({
      //  SEP: stylesDotJavaTokensDictionary['Equals'],
      //    DEF: () => {
            $.CONSUME(stylesDotJavaTokensDictionary['StyleIdentifier'])
            $.CONSUME(stylesDotJavaTokensDictionary['Equals'])
            $.CONSUME(stylesDotJavaTokensDictionary['StyleLiteral'])
      //    }
      //  })
    })

    $.performSelfAnalysis()
  }
}

const stylesParser = new StylesDotJavaParser()

function parseStyles(code) {
  const lexingResult = stylesDotJavaLexer.tokenize(code)
  stylesParser.input = lexingResult.tokens

  return stylesParser.stylePair()
}

function test_1() {
  console.log('parser test 1')
  const code = ' public static final String RING_OFFSET_PINK_200 = "ring-offset-pink-200";'
  parseStyles(code)
  parseStyles(code)
  parseStyles(code)
  parseStyles(code)
  console.log(stylesParser)
}

function test_2() {
  console.log('parser test 2')
  const code_a = 'RING_OFFSET_PINK_200 = "ring-offset-pink-200";'
  const code_b = 'RING_OFFSET_PINK_100 = "ring-offset-pink-100";'
  const code = code_a + code_b
  let a = parseStyles(code)
  console.log(a.children)
}

test_2()

module.exports = { parseStyles }
