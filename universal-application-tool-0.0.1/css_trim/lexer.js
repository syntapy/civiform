"use strict";
const chevrotain = require("chevrotain");
const { stylesDotJavaTokens, baseStyleCallTokens } = require("./tokens");

const Lexer = chevrotain.Lexer;

const StylesLexer = new Lexer(allTokens, { ensureOptimizations: true });

module.exports = StylesLexer;
