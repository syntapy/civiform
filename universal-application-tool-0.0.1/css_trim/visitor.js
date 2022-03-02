const parser = require('java-parser')
const traverse = require('./traverse')
const visualizer = require('./visualizer')
const node_organizer = require('./node_organizer')
var _ = require('lodash')

class CallsFinder extends parser.BaseJavaCstVisitorWithDefaults {
  constructor(graphVisualizer, nodeOrganizer) {
    super()

    // Just make sure we're not overwriting anything from super class
    this._assertPropertyAvailable('graphVisualizer')
    this._assertPropertyAvailable('nodeOrganizer')
    this._assertPropertyAvailable('callRegex')
    this._assertPropertyAvailable('tagRegex')
    this._assertPropertyAvailable('styleList')
    this._assertPropertyAvailable('tagList')

    this.graphVisualizer = graphVisualizer
    this.nodeOrganizer = nodeOrganizer
    this.callRegex = /[0-9A-Z_]+/
    this.tagRegex = /[0-6a-z:]+/
    this.styleList = []
    this.tagList = []
    this.validateVisitor()
  }

  _assertPropertyAvailable(property, msgPortion) {
    const msg = "CallsFinder already has property 'prefixList'. Use a different property name to hold " + msgPortion
    if (_.has(this, property)) { throw  "property not available" }
  }

  _getExpression(identifiersList) {
    let expression = ''

    for (const identifier of identifiersList) {
      expression += identifier
    }

    return expression
  }

  // Core routine to traverse the concrete syntax tree and 
  // retrieve all leaf node identifiers before current node ctx
  _getIdentifiers(ctx, grammarRule, printCode=false) {
    const subNodesSorted = this.nodeOrganizer.getNodesSorted(ctx)
    const numChildren = subNodesSorted.length
    this.graphVisualizer.pushGrammarRule(grammarRule, numChildren)

    const identifierList = []
    let  tmpArray

    for (const node of subNodesSorted) {
      if (this.nodeOrganizer.isIdentifier(node)) {
        this.graphVisualizer.pushIdentifier(node.image)
        identifierList.push(node.image)
        this.graphVisualizer.pop()
      } else {
        tmpArray = this.visit(node)
        identifierList.concat(tmpArray)
      }
    }

    //this.graphVisualizer.maybePrintCode(grammarRule, identifierList)
    this.graphVisualizer.pop(grammarRule)

    return identifierList
  }

  // All directly imported tags (from e.g. import j2html.TagCreator.<tag>) 
  // will get added to tailwind.css
  /*packageOrTypeName(ctx) {
    super.packageOrTypeName(ctx)
    let tag = ""

    try {
      let identifiers = ctx.Identifier

      if (identifiers.length !== 3) { throw "Wrong identifier length. The j2html import we want here has length 3" }
      if (identifiers[0].image !== "j2html") { throw "Not a j2thml import" }
      if (identifiers[1].image !== "TagCreator") { throw "Not the right j2hml tag" }
      if (identifiers[2].image === "each" || identifiers[2].image === "text") { throw "Not an html tag" }

      tag = identifiers[2].image

    } catch (error) {}

    if (typeof(tag) === 'string') {
      if (tag.length > 0) {
        if (this.tagRegex.test(tag) === true) {
          this.tagList.push(tag)
        }
      }
    }
  }*/

  // This is where most of the decision making in regards whether it encountered
  // e.g. a StyleUtils.uvwXY(..), a Styles.XYZ, or a BaseStyles.UVW
  // Need to chain together the visitor methods so that all nodes are visited
  // See: https://chevrotain.io/docs/guide/concrete_syntax_tree.html#traversing
  primary(ctx) {
    const identifiers = this._getIdentifiers(ctx, "primary")
    return identifiers
  }

  primaryPrefix(ctx) {
    const identifiers = this._getIdentifiers(ctx, "primaryPrefix")
    return identifiers
  }

  unaryExpression(ctx) {
    const identifiers = this._getIdentifiers(ctx, "unaryExpression")
    return identifiers
  }

  binaryExpression(ctx) {
    const identifiers = this._getIdentifiers(ctx, "binaryExpression")
    return identifiers
  }

  ternaryExpression(ctx) {
    const identifiers = this._getIdentifiers(ctx, "ternaryExpression")
    return identifiers
  }

  expression(ctx) {
    const identifiers = this._getIdentifiers(ctx, "expression")
    return identifiers
  }

  argumentList(ctx) {
    const identifiers = this._getIdentifiers(ctx, "argumentList")
    return identifiers
  }

  methodInvocationSuffix(ctx) {
    const identifiers = this._getIdentifiers(ctx, "methodInvocationSuffix")
    return identifiers
  }

  primarySuffix(ctx) {
    const identifiers = this._getIdentifiers(ctx, "primarySuffix")
    return identifiers
  }

  fqnOrRefType(ctx) {
    const identifiers = this._getIdentifiers(ctx, "fqnOrRefType")
    return identifiers
  }

  fqnOrRefTypePartFirst(ctx) {
    const identifiers = this._getIdentifiers(ctx, "fqnOrRefTypePartFirst")
    return identifiers
  }

  fqnOrRefTypePartRest(ctx) {
    const identifiers = this._getIdentifiers(ctx, "fqnOrRefTypePartRest")
    return identifiers
  }

  // Forms similar to the base case in recursive
  fqnOrRefTypePartCommon(ctx) {
    const identifiers = this._getIdentifiers(ctx, "fqnOrRefTypePartCommon")
    return identifiers
  }
}

function getCallsFinder() {
  const graphVisualizer = visualizer.getVisualizer()
  const nodeOrganizer = node_organizer.getOrganizer()
  const visitor = new CallsFinder(graphVisualizer, nodeOrganizer)

  return visitor
}

module.exports = getCallsFinder()
