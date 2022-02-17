"use strict";
const chevrotain = require("chevrotain");
const { stylesDotJavaTokens } = require("./tokens");
const tests = require("./test_lexer");

console.log("running lexer tests")
tests.test_1()
tests.test_2()
tests.test_3()
tests.test_4()
console.log("done")

const Lexer = chevrotain.Lexer;
const StylesDotJavaLexer = new Lexer(stylesDotJavaTokens);

module.exports = StylesDotJavaLexer;
