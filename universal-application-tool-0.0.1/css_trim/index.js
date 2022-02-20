const parser = require('java-parser')

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

const cst = parser.parse(javaText);
//console.log(cst)

const result = []
class TestVisitor extends parser.BaseJavaCstVisitorWithDefaults {
  constructor() {
    super()
    this.customResult = []
    this.validateVisitor()
  }

  fieldDeclaration(ctx) {
    let tmpNode = ctx.variableDeclaratorList[0].children
    let node = tmpNode.variableDeclarator[0].children

    let fieldNameTraverserNode = node.variableDeclaratorId[0].children


    let styleValueTraverserNode = node.variableInitializer[0].children.expression[0].children.ternaryExpression[0].children
    styleValueTraverserNode = styleValueTraverserNode.binaryExpression[0].children
    styleValueTraverserNode = styleValueTraverserNode.unaryExpression[0].children
    styleValueTraverserNode = styleValueTraverserNode.primary[0].children
    styleValueTraverserNode = styleValueTraverserNode.primaryPrefix[0].children
    styleValueTraverserNode = styleValueTraverserNode.literal[0].children

    let fieldName = fieldNameTraverserNode.Identifier[0].image
    let styleValue = styleValueTraverserNode.StringLiteral[0].image

    let resultItem = {key: fieldName, val: styleValue}

    result.push(resultItem)
  }
}

visitor = new TestVisitor()
visitor.visit(cst)
