"use strict"
const chevrotain = require("chevrotain")
const stylesDotJavaLexer = require('./lexer')
const { stylesDotJavaTokens, stylesDotJavaTokensDictionary, exampleTokens } = require("./tokens")

class StylesDotJavaParser extends chevrotain.EmbeddedActionsParser {
  constructor() {
    super(stylesDotJavaTokens)

    const $ = this

    $.RULE("stylePair", () => {
      $.MANY(() => {
        const styleId = $.CONSUME(stylesDotJavaTokensDictionary['StyleIdentifier'])
        const op = $.CONSUME(stylesDotJavaTokensDictionary['Equals'])
        const styleLiteral = $.CONSUME(stylesDotJavaTokensDictionary['StyleLiteral'])
        //const semiColon = $.CONSUME(stylesDotJavaTokensDictionary['SemiColon'])
        console.log(styleId.image, op.image, styleLiteral.image)
      })
    })

    $.performSelfAnalysis()
  }
}

const stylesParser = new StylesDotJavaParser()

function parseStyles(code) {
  const lexingResult = stylesDotJavaLexer.tokenize(code)
  console.log(lexingResult.tokens)
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
  const code_blargh = 'yar = good;'
  const code_a = 'RING_OFFSET_PINK_200 = "ring-offset-pink-200";'
  const code_b = 'RING_OFFSET_PINK_100 = "ring-offset-pink-100";'
  const code = code_blargh + code_a + code_b
  parseStyles(code)
  //console.log(a)
}

test_2()

module.exports = { parseStyles }
