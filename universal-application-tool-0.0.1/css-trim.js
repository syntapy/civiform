const parser = require('java-parser')
var _ = require('lodash')

const javaText = `
package views.style;

/**
 * Class to hold constants for Tailwind CSS class names. see https://tailwindcss.com/docs for more
 * info.
 */
public final class Styles {
  public static final String BG_SCROLL = "bg-scroll";
  public static final String _TRANSLATE_Y_1_2 = "-translate-y-1/2";

  // Line clamp support via @tailwindcss/line-clamp
  public static final String LINE_CLAMP_1 = "line-clamp-1";
}
`;

const stylesDictionary = {}
class StylesVisitor extends parser.BaseJavaCstVisitorWithDefaults {
  constructor() {
    super()
    if (_.has(this, 'stylesDictionary')) {
      throw "StylesVisitor already has property 'stylesDictionary'. Use a different property name to hold dictionary of styles."
    }
    this.stylesDictionary = {}
    this.validateVisitor()
  }

  fieldDeclaration(ctx) {
    let tmpNode = ctx.variableDeclaratorList[0].children
    let node = tmpNode.variableDeclarator[0].children

    let styleValueTraverserNode 
    let fieldNameTraverserNode 

    let fieldName = undefined
    let styleValue = undefined

    // Don't try to assign 
    try {
      styleValueTraverserNode = node.variableInitializer[0].children.expression[0].children
      styleValueTraverserNode = styleValueTraverserNode.ternaryExpression[0].children
      styleValueTraverserNode = styleValueTraverserNode.binaryExpression[0].children
      styleValueTraverserNode = styleValueTraverserNode.unaryExpression[0].children
      styleValueTraverserNode = styleValueTraverserNode.primary[0].children
      styleValueTraverserNode = styleValueTraverserNode.primaryPrefix[0].children
      styleValueTraverserNode = styleValueTraverserNode.literal[0].children

      fieldNameTraverserNode = node.variableDeclaratorId[0].children

      fieldName = fieldNameTraverserNode.Identifier[0].image
      styleValue = styleValueTraverserNode.StringLiteral[0].image

      console.log(fieldName, ' = ', styleValue)

      styleValue = styleValue.replace(/['"]+/g, '')
    } catch (error) {}

    if (fieldName && styleValue) {
      this.stylesDictionary[fieldName] = styleValue
    }
  }
}

const visitor = new StylesVisitor()

// To read Styles.java and BaseStyles.java
function parseForStyles(code) {
  const cst = parser.parse(code);
  visitor.visit(cst)
}

function getStyles() {
  return visitor.stylesDictionary
}

//parseForStyles(javaText)

module.exports = { parseForStyles, getStyles }
