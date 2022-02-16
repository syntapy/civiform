"use strict";
const chevrotain = require('chevrotain');
const xregexp = require("xregexp");

const Lexer = chevrotain.Lexer;
const createToken = chevrotain.createToken;

function MAKE_PATTERN(def, flags) {
  return xregexp.build(def, fragments, flags);
}

const WhiteSpace = createToken({
  name: "WhiteSpace",
  pattern: /\s+/,
  group: chevrotain.Lexer.SKIPPED,
  line_breaks: true
});

const Public = createKeywordToken({
  name: "Public",
  pattern: /public/,
  label: "'public'"
});

const Static = createKeywordToken({
  name: "Static",
  pattern: /static/,
  label: "'static'"
});

const Final = createKeywordToken({
  name: "Final",
  pattern: /final/,
  label: "'final'"
});

const Class = createKeywordToken({
  name: "Class",
  pattern: /class/,
  label: "'class'"
});

const StringType = createToken({
  name: "String",
  pattern: /String/,
  label: "'string'"
});

const StyleClass = createToken({
  name: "StyleClass",
  pattern: /Styles/,
  label: "'StyleClass'"
});

const StyleIdentifier = createToken({
  name: "StyleIdentifier",
  pattern: /[A-Z_]+/,
  label: "'StyleIdentifier'"
});

const Equals = createToken({
  name: "Equals",
  pattern: /=/,
  label: "'='"
});

const StyleLiteral = createToken({
  name: "StyleLiteral",
  pattern: /"[a-z0-9-/]+"/,
});

const LCurly = createToken({
  name: "LCurly",
  // using a string literal to get around a bug in regexp-to-ast
  // so lexer optimizations can be enabled.
  pattern: "{",
  label: "'{'"
});

const RCurly = createToken({
  name: "RCurly",
  pattern: /}/,
  label: "'}'"
});

const SemiColonWithFollowEmptyLine = createToken({
  name: "SemiColonWithFollowEmptyLine",
  pattern: /;[ \t]*(\r\n|\r[^\n]|\n)[ \t]*(\r\n|\r|\n)/,
  label: "';'",
  line_breaks: true
});

const SemiColon = createToken({
  name: "SemiColon",
  pattern: /;/,
  label: "';'"
});

// For lexing the Styles.java file
const stylesDotJavaTokens = [
  WhiteSpace,
  Public,
  Static,
  Final,
  StringType,
  StyleIdentifier,
  Equals,
  StyleLiteral,
  SemiColon,
  SemiColonWithFollowEmptyLine
]

// For lexing any java file with a call to Styles.XYZ
const baseStyleCallTokens = [
  WhiteSpace,
  StyleClass,
  Dot,
  StyleIdentifier
]
