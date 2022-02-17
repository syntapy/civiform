"use strict";
const chevrotain = require('chevrotain');
const xregexp = require("xregexp");

const Lexer = chevrotain.Lexer;
const createToken = chevrotain.createToken;

function MAKE_PATTERN(def, flags) {
  return xregexp.build(def, fragments, flags);
}

const Identifier = createToken({
  name: "Identifier",
  pattern: /[a-zA-Z_\\$][a-zA-Z_\\$0-9]*/
});

function createKeywordToken(options) {
  // A keyword 'like' token uses the "longer_alt" config option
  // to resolve ambiguities, see: http://sap.github.io/chevrotain/docs/features/token_alternative_matches.html
  options.longer_alt = Identifier;
  return createToken(options);
}

const WhiteSpace = createToken({
  name: "WhiteSpace",
  pattern: /\s+/,
  group: chevrotain.Lexer.SKIPPED,
  line_breaks: true
});

const LineBreak = createToken({
  name: "Linebreak",
  pattern: /\n/,
  group: chevrotain.Lexer.SKIPPED,
  line_breaks: true
});

const Public = createToken({
  name: "Public",
  pattern: /public/,
  group: chevrotain.Lexer.SKIPPED,
  label: "'public'"
});

const Static = createToken({
  name: "Static",
  pattern: /static/,
  group: chevrotain.Lexer.SKIPPED,
  label: "'static'"
});

const Final = createToken({
  name: "Final",
  pattern: /final/,
  group: chevrotain.Lexer.SKIPPED,
  label: "'final'"
});

const Class = createToken({
  name: "Class",
  pattern: /class/,
  group: chevrotain.Lexer.SKIPPED,
  label: "'class'"
});

const StringType = createToken({
  name: "String",
  pattern: /String/,
  group: chevrotain.Lexer.SKIPPED,
  label: "'string'"
});

const StyleClass = createToken({
  name: "StyleClass",
  pattern: /Styles/,
  group: chevrotain.Lexer.SKIPPED,
  label: "'StyleClass'"
});

const StyleIdentifier = createToken({
  name: "StyleIdentifier",
  pattern: /[A-Z0-9_]+/,
  label: "'StyleIdentifier'"
});

const Equals = createToken({
  name: "Equals",
  pattern: /=/,
  group: chevrotain.Lexer.SKIPPED,
  label: "'='"
});

const Dot = createToken({
  name: "Dot",
  pattern: /\./,
  group: chevrotain.Lexer.SKIPPED,
  label: "'.'"
});

const StyleLiteral = createToken({
  name: "StyleLiteral",
  //group: chevrotain.Lexer.SKIPPED,
  pattern: /"[a-z0-9-/]+"/,
});

const QuoteMark = createToken({
  name: "QuoteMark",
  pattern: /"/,
});

const LCurly = createToken({
  name: "LCurly",
  // using a string literal to get around a bug in regexp-to-ast
  // so lexer optimizations can be enabled.
  pattern: "{",
  group: chevrotain.Lexer.SKIPPED,
  label: "'{'"
});

const LineComment = createToken({
  name: "LineComment",
  pattern: /\/\/.*/,
  group: chevrotain.Lexer.SKIPPED,
  line_breaks: false,
  label: "'//'"
});

const RCurly = createToken({
  name: "RCurly",
  pattern: /}/,
  group: chevrotain.Lexer.SKIPPED,
  label: "'}'"
});

const SemiColon = createToken({
  name: "SemiColon",
  pattern: /;/,
  group: chevrotain.Lexer.SKIPPED,
  label: "';'"
});

const Select = createToken({
  name: "Select",
  pattern: /SELECT/,
  longer_alt: Identifier
});

const Other = createToken({
  name: "Other",
  pattern: /.+/,
  group: chevrotain.Lexer.SKIPPED,
  line_breaks: false
});

// For lexing the Styles.java file
const stylesDotJavaTokens = [
  WhiteSpace,
  LineBreak,
  Public,
  Static,
  Final,
  StringType,
  StyleIdentifier,
  Equals,
  StyleLiteral,
  SemiColon,
  LineComment,
  Other
]

// For lexing any java file with a call to Styles.XYZ
const baseStyleCallTokens = [
  WhiteSpace,
  StyleClass,
  Dot,
  StyleIdentifier
];

const exampleTokens = require("./sql_example")
module.exports = { stylesDotJavaTokens, exampleTokens };
