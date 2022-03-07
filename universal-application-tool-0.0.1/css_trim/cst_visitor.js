const parser = require('java-parser')
const traverse = require('./traverse')
const visualizer = require('./visualizer')
const node_organizer = require('./node_organizer')
const identifiers = require('./identifiers')
var _ = require('lodash')

class CstVisitorBase extends parser.BaseJavaCstVisitorWithDefaults {
  constructor(graphVisualizer, nodeOrganizer, identifiersParser) {
    super()

    // Just make sure we're not overwriting anything from super class
    this._assertPropertyAvailable('graphVisualizer')
    this._assertPropertyAvailable('nodeOrganizer')
    this._assertPropertyAvailable('callRegex')
    this._assertPropertyAvailable('tagRegex')
    this._assertPropertyAvailable('styleList')
    this._assertPropertyAvailable('tagList')
    this._assertPropertyAvailable('identifiersParser')

    this.identifiersParser = identifiersParser
    this.graphVisualizer = graphVisualizer
    this.nodeOrganizer = nodeOrganizer
    this.validateVisitor()
  }

  // keep
  _assertPropertyAvailable(property, msgPortion) {
    const msg = "CallsFinder already has property 'prefixList'. Use a different property name to hold " + msgPortion
    if (_.has(this, property)) { 
      throw  "property not available"
    }
  }

  // keep
  _getExpression(identifiersList) {
    let expression = ''

    for (const identifier of identifiersList) {
      expression += identifier
    }

    return expression
  }

  // keep
  // Core routine to traverse the concrete syntax tree and 
  // retrieve all leaf node identifiers before current node ctx
  _getIdentifiers(ctx, grammarRule, printCode=false) {
    const subNodesSorted = this.nodeOrganizer.getNodesSorted(ctx)
    const numChildren = subNodesSorted.length
    this.graphVisualizer.pushGrammarRule(grammarRule, numChildren)

    let identifierList = []
    let identifierSublist

    for (const node of subNodesSorted) {
      if (this.nodeOrganizer.isIdentifier(node)) {
        this.graphVisualizer.pushIdentifier(node.image)
        identifierList.push(node.image)
        this.graphVisualizer.pop()
      } else {
        identifierSublist = this.visit(node)
        if (identifierSublist) {
          identifierList.push(...identifierSublist)
        }
      }
    }

    this.graphVisualizer.pop(grammarRule)

    return identifierList
  }

  fieldDeclaration(ctx) {
    const identifiers = this._getIdentifiers(ctx, "fieldDeclaration")
    return identifiers
  }

  fieldModifier(ctx) {
    const identifiers = this._getIdentifiers(ctx, "fieldModifier")
    return identifiers
  }

  unannType(ctx) {
    const identifiers = this._getIdentifiers(ctx, "unannType")
    return identifiers
  }

  unannReferenceType(ctx) {
    const identifiers = this._getIdentifiers(ctx, "unannReferenceType")
    return identifiers
  }

  unannClassOrInterfaceType(ctx) {
    const identifiers = this._getIdentifiers(ctx, "unannClassOrInterfaceType")
    return identifiers
  }

  unannClassType(ctx) {
    const identifiers = this._getIdentifiers(ctx, "unannClassType")
    return identifiers
  }

  variableDeclaratorList(ctx) {
    const identifiers = this._getIdentifiers(ctx, "variableDeclaratorList")
    return identifiers
  }

  variableDeclarator(ctx) {
    const identifiers = this._getIdentifiers(ctx, "variableDeclarator")
    return identifiers
  }

  variableDeclaratorId(ctx) {
    const identifiers = this._getIdentifiers(ctx, "variableDeclaratorId")
    return identifiers
  }

  variableInitializer(ctx) {
    const identifiers = this._getIdentifiers(ctx, "variableInitializer")
    return identifiers
  }

  packageOrTypeName(ctx) {
    const identifiers = this._getIdentifiers(ctx, "packageOrTypeName")
    return identifiers
  }

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

  fqnOrRefTypePartCommon(ctx) {
    const identifiers = this._getIdentifiers(ctx, "fqnOrRefTypePartCommon")
    return identifiers
  }

  literal(ctx) {
    const identifiers = this._getIdentifiers(ctx, "literal")
    return identifiers
  }

  literal(ctx) {
    const identifiers = this._getIdentifiers(ctx, "literal")
    return identifiers
  }

}

// Used for parsing Styles.java and the like to create a dictionary of styles
class StylesDictAggregator extends CstVisitorBase {

  constructor(graphVisualizer, nodeOrganizer, identifiersParser) {
    super(graphVisualizer, nodeOrganizer, identifiersParser)
  }

  get() {
    return this.identifiersParser.getDict()
  }

  fieldDeclaration(ctx) {
    const identifiers = this._getIdentifiers(ctx, "fieldDeclaration")
    this.identifiersParser.addBaseStyle(identifiers)
    return identifiers
  }
}

// Used for parsing regular java files under app/views/**/*.java
// for calls to Styles.java, BaseStyles.java, ReferenceClasses.java, and StyleUtils.java
class StylesAggregator extends CstVisitorBase {

  constructor(graphVisualizer, nodeOrganizer, identifiersParser) {
    super(graphVisualizer, nodeOrganizer, identifiersParser)
  }

  get() {
    return this.identifiersParser.getStyles()
  }

  reset() {
    this.identifiersParser.reset()
  }

  packageOrTypeName(ctx) {
    const identifiers = this._getIdentifiers(ctx, "packageOrTypeName")
    this.identifiersParser.addImportedTag(identifiers)
    return identifiers
  }

  // This is where most of the decision making in regards whether it encountered
  // e.g. a StyleUtils.uvwXY(..), a Styles.XYZ, or a BaseStyles.UVW
  // Need to chain together the visitor methods so that all nodes are visited
  // See: https://chevrotain.io/docs/guide/concrete_syntax_tree.html#traversing
  primary(ctx) {
    const identifiers = this._getIdentifiers(ctx, "primary")
    this.identifiersParser.addCalledTag(identifiers)
    this.identifiersParser.addBaseStyle(identifiers)
    this.identifiersParser.addPrefixedStyle(identifiers)
    return identifiers
  }
}

function getStylesDictAggregator() {
  const graphVisualizer = visualizer.getVisualizer()
  const nodeOrganizer = node_organizer.getOrganizer()
  const identifierParser = identifiers.getStylesDictAggregator()
  return new StylesDictAggregator(graphVisualizer, nodeOrganizer, identifierParser)
}

function getStylesAggregator(stylesDict) {
  const graphVisualizer = visualizer.getVisualizer()
  const nodeOrganizer = node_organizer.getOrganizer()
  const stylesParser = identifiers.getStylesAggregator(stylesDict)
  return new StylesAggregator(graphVisualizer, nodeOrganizer, stylesParser)
}

module.exports = { getStylesDictAggregator, getStylesAggregator }
