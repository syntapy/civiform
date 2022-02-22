const parser = require('java-parser')
const fs = require('fs')
var _ = require('lodash')

class CallsFinder extends parser.BaseJavaCstVisitorWithDefaults {
  constructor() {
    super()

    // Just make sure we're not overwriting anything from super class
    if (_.has(this, 'styleCallList')) {
      throw "StylesVisitor already has property 'styleCallList'. Use a different property name to hold dictionary of styles."
    }
    if (_.has(this, 'styleRegex')) {
      throw "StylesVisitor already has property 'styleRegex'. Use a different property name to hold dictionary of styles."
    }

    this.callRegex = /[0-9A-Z_]+/
    this.styleCallList = []
    this.validateVisitor()
  }

  fqnOrRefType(ctx) {
    let styleCall = ""

    // Errors here will fail silently, thus preventing an invalid style call
    // from being pushed to tailwind
    try {
      // Make sure elements are in correct order
      let keys = Object.keys(ctx)

      if (keys.length !== 3) {
        throw "incorect expression length"
      }

      if (keys[0] !== "fqnOrRefTypePartFirst") {
        throw "expression does not start correctly"
      }

      if (keys[1] !== "Dot") {
        throw "no dot in expression 2nd place"
      }

      if (keys[2] !== "fqnOrRefTypePartRest") {
        throw "expression does not end correctly"
      }

      let styleClass = ctx.fqnOrRefTypePartFirst[0]
      if (styleClass.image !== "Styles" && styleClass.image !== "BaseStyles" && styleClass.image) {
        throw "not a valid style call"
      }

      let dot = ctx.Dot[0]
      if (dot.image !== ".") {
        throw "not a valid dot token"
      }

      let tmpNode = ctx.fqnOrRefTypePartRest[0].children.fqnOrRefTypePartCommon[0]
      styleCall = tmpNode.children.Identifier[0].image
    } catch(error) {}

    if (typeof(styleCall) === 'string') {
      if (styleCall.length > 0) {
        if (this.callRegex.test(styleCall) === true) {
          this.styleCallList.push(styleCall)
        }
      }
    }
  }
}

const visitor = new CallsFinder()

// To read Styles.java and BaseStyles.java
function parseForCalls(code) {
  const cst = parser.parse(code);
  visitor.styleCallList = []
  visitor.visit(cst)
}

function getCalls() {
  return visitor.styleCallList
}

// Small code snippet to uncomment for debugging
const javaCode = `

public class LoginForm extends BaseHtmlView {

  private ContainerTag mainContent(Messages messages) {
    return div().withClasses(BaseStyles.LOGIN_PAGE);
  }
}
`
//parseForCalls(javaCode)
//console.log(visitor.styleCallList)

module.exports = { parseForCalls, getCalls }
