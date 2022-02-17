const chevrotain = require("chevrotain");
const { stylesDotJavaTokens, exampleTokens } = require("./tokens");

const Lexer = chevrotain.Lexer;

const StylesDotJavaLexer = new Lexer(stylesDotJavaTokens)
const ExampleLexer = new Lexer(exampleTokens)


function test_1() {
  let code = 'SELECT'
  let tokens = ExampleLexer.tokenize(code)
}

function test_2() {
  let code = ' public static final String TO_GRAY_700 = "to-gray-700";'
  let tokens = StylesDotJavaLexer.tokenize(code)
}

function test_3() {
  let code = 'public static final String INSET_FULL = "inset-full";' +
             'public static final String _INSET_FULL = "-inset-full";' +
             'public static final String INSET_Y_0 = "inset-y-0";' +
             'public static final String INSET_X_0 = "inset-x-0";' +
             'public static final String INSET_Y_1 = "inset-y-1";' +
             'public static final String INSET_X_1 = "inset-x-1";' +
             'public static final String INSET_Y_2 = "inset-y-2";' +
             'public static final String INSET_X_2 = "inset-x-2";'

  let tokens = StylesDotJavaLexer.tokenize(code)
  //console.log(tokens)
}

function test_4() {
  let code = 'public static public static'
  let tokens = StylesDotJavaLexer.tokenize(code)
  //console.log(tokens)
}

module.exports = { test_1, test_2, test_3, test_4 }
