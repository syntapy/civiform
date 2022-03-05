const assert = require('assert')
const parser = require('java-parser')
const traverse = require('./traverse')
const cst_visitor = require('./cst_visitor')
var _ = require('lodash')

//const visitor = new CallsFinder()
const printer = require('./traverse')

class CssTrimmer {
  constructor() {
    this.stylesDictAggregator = cst_visitor.getStylesDictAggregator()
    this.stylesAggregator = null
  }

  parseForDict(code) {
    const cst = parser.parse(code)
    this.stylesDictAggregator.visit(cst)
  }

  getDict() {
    return this.stylesDictAggregator.get()
  }

  genStylesAggregator() {
    const stylesDict = this.stylesDictAggregator.get()
    this.stylesAggregator = cst_visitor.getStylesAggregator(stylesDict)
  }

  parseForStyles(code) {
    const cst = parser.parse(code)
    this.stylesAggregator.visit(cst)
  }

  getTrimmed() {
    return this.stylesAggregator.get()
  }
}

/* Small code snippets for testing
 * or manually traversing small syntax tree to discover
 * names of grammar rules
 */
const javaTestDict = `
package views.style;

// Taken from Styles.java
public final class Styles {

  public static final String W_3_5 = "w-3/5";
  public static final String W_2_3 = "w-2/3";
  public static final String _SKEW_Y_6 = "-skew-y-6";
  public static final String TEXT_XL = "text-xl";
  public static final String TEXT_2XL = "text-2xl";
  public static final String BG_SEATTLE_BLUE = "bg-seattle-blue";
  public static final String BG_BLUE_200 = "bg-blue-200";

  // Line clamp support via @tailwindcss/line-clamp
  public static final String LINE_CLAMP_1 = "line-clamp-1";
}
`

const javaTestCode = `
import static j2html.TagCreator.div;
import static j2html.TagCreator;

public class LoginForm extends BaseHtmlView {

  public ContainerTag mobilePage(Messages messages) {
    return div().withClasses(StyleUtils.responsiveSmall(Styles.TEXT_XL, Styles.W_2_3));
  }

  public ContainerTag mainContent(Messages messages) {
    return TagCreator.body().withClasses(BaseStyles.BG_SEATTLE_BLUE);
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
  const stylesTrimmer = new CssTrimmer()
  stylesTrimmer.parseForDict(javaTestDict)
  const stylesDict = stylesTrimmer.getDict()

  const keys = Object.keys(stylesDict)
  const vals = Object.values(stylesDict)
  const knownVals = ["w-3/5", "w-2/3", "-skew-y-6", "text-xl", "text-2xl", "bg-seattle-blue", "bg-blue-200", "line-clamp-1"]

  assert(keys.length === 8)
  assert(knownVals.every(function (element) {
    return vals.includes(element)
  }))

  assert(vals.every(function (element) {return knownVals.includes(element)}))

  stylesTrimmer.genStylesAggregator()
  stylesTrimmer.parseForStyles(javaTestCode)

  const finds = stylesTrimmer.getTrimmed()
  const knownFinds = ["w-2/3", "sm:w-2/3", "sm:text-xl", "text-2xl", "bg-blue-200"]


  for (const f of knownFinds) {
    if (!finds.includes(f)) {
      msg = 'Missing ' + f + ' from list of finds\n'
      msg += 'List of finds: ' + finds.toString()
      throw msg
    }
  }

  console.log('Parsing tests passed')
}

// Automated test
test()

module.exports = new CssTrimmer
