const parser = require('java-parser')
const traverse = require('./traverse')
const visitor = require('./visitor')
var _ = require('lodash')

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
};

//const visitor = new CallsFinder()
const printer = require('./traverse')

// To read Styles.java and BaseStyles.java
function parse(code) {
  const cst = parser.parse(code);
  visitor.styleList = []
  visitor.tagList = []
  visitor.prefixList = []

  visitor.visit(cst)
}

function getCalls() {
  return visitor.styleList
}

function getTags() {
  return visitor.tagList
}

/* Small code snippets for testing
 * or manually traversing small syntax tree to discover
 *names of grammar rules
 */
const javaTestCode = `
import static j2html.TagCreator.div;
import static j2html.TagCreator;

public class LoginForm extends BaseHtmlView {

  public ContainerTag mobilePage(Messages messages) {
    return div().withClasses(StyleUtils.responsiveSmall(Styles.TEXT_XL, Styles.W_2_3));
  }

  public ContainerTag mainContent(Messages messages) {
    return TagCreator.body().withClasses(BaseStyles.LOGIN_PAGE);
  }

  public ContainerTag header(Messages messages) {
    return TagCreator.h1().withClasses(Styles.BG_BLUE_200, Styles.TEXT_2XL);
  }
}
`

// Small code snippets to uncomment for debugging
// or manually traversing small syntax tree to discover
// names of grammar rules
function test() {
  console.log("Testing parser for CSS trimming")
  parse(javaTestCode)
  const calls = _.sortBy(getCalls())
  const tags = _.sortBy(getTags())

  const knownCalls = _.sortBy(["TEXT_XL", "W_2_3", "LOGIN_PAGE", "BG_BLUE_200", "TEXT_2XL"])
  const knownTags = _.sortBy(["div", "body", "h1"])

  let hasError = false

  let msgCalls = ""
  let msgTags = ""

  if (!_.isEqual(calls, knownCalls)) {
    msgCalls = "Problem finding style calls in test code snippet: \n"
    msgCalls += "Style calls found:    " + calls.toString() + "\n"
    msgCalls += "Style calls expected: " + knownCalls.toString() + "\n"
    hasError = true
  }

  if (!_.isEqual(tags, knownTags)) {
    msgTags = "Problem finding HTML tags in test code snippet: \n"
    msgTags += "HTML tags found:    " + tags.toString() + "\n"
    msgTags += "HTML tags expected: " + knownTags.toString() + "\n"
    hasError = true
  }

  if (hasError) {
    let msg = msgCalls + "\n" + msgTags
    throw msg
  } else {
    console.log("Parsing tests passed!")
  }
}

// Automated test
test()

throw "Can I have a HELL Yeah?"
module.exports = { parse, getCalls, getTags }
