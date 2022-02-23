function expressionToPrimary(ctx) {
  let node = ctx.children.ternaryExpression[0]
  console.log('--------------')
  console.log(node)

  node = node.children.binaryExpression[0]
  console.log('--------------')
  console.log(node)

  node = node.children.unaryExpression[0]
  console.log('--------------')
  console.log(node)

  let primary = node.children.primary[0]
  console.log('--------------')
  console.log(primary)

  return primary 
}

function suffixToIdentifier(ctx) {
  let node = ctx.children.methodInvocationSuffix[0]
  console.log('- - - - - - - ')
  console.log(node)
}

function prefixToIdentifier(ctx) {
  let node = ctx.children.fqnOrRefType[0]
  console.log('--------------')
  console.log(node)

  node = node.children.fqnOrRefTypePartFirst[0]
  console.log('--------------')
  console.log(node)

  node = node.children.fqnOrRefTypePartCommon[0]
  console.log('--------------')
  console.log(node)

  node = node.children.Identifier[0]
  console.log('--------------')
  console.log(node)

  return node
}

function traverse(cst) {
  let node = cst.children.ordinaryCompilationUnit[0]
  console.log('- - - - - - - ')
  console.log(node)
  node = node.children.typeDeclaration[0]
  console.log('- - - - - - - ')
  console.log(node)
  node = node.children.classDeclaration[0]
  console.log('- - - - - - - ')
  console.log(node)
  node = node.children.normalClassDeclaration[0]
  console.log('- - - - - - - ')
  console.log(node)
  node = node.children.classBody[0]
  console.log('- - - - - - - ')
  console.log(node)
  node = node.children.classBodyDeclaration[0]
  console.log('- - - - - - - ')
  console.log(node)
  node = node.children.classMemberDeclaration[0]
  console.log('- - - - - - - ')
  console.log(node)
  node = node.children.methodDeclaration[0]
  console.log('- - - - - - - ')
  console.log(node)
  node = node.children.methodBody[0]
  console.log('- - - - - - - ')
  console.log(node)
  node = node.children.block[0]
  console.log('- - - - - - - ')
  console.log(node)
  node = node.children.blockStatements[0]
  console.log('- - - - - - - ')
  console.log(node)
  node = node.children.blockStatement[0]
  console.log('- - - - - - - ')
  console.log(node)
  node = node.children.statement[0]
  console.log('- - - - - - - ')
  console.log(node)
  node = node.children.statementWithoutTrailingSubstatement[0]
  console.log('- - - - - - - ')
  console.log(node)
  node = node.children.returnStatement[0]
  console.log('- - - - - - - ')
  console.log(node)
  let expression = node.children.expression
  console.log('- - - - - - - ')
  console.log(expression)
  expression=expression[0]

  let primary = expressionToPrimary(expression)
  let prefix = primary.children.primaryPrefix[0]
  console.log('- - - - - - - ')
  console.log(prefix)
  prefixToIdentifier(prefix)
  //let suffixList = primary.children.primarySuffix
  //console.log('- - - - - - - ')
  //console.log(suffixList[1])

  //console.log('- - - - - - - ')

  //suffixToIdentifier(suffixList[1])

  //prefixOrSuffixToIdentifier(suffixList[0])
}


  /********************************/
 /* IGNORE EVERYTHING ABOVE HERE */
/********************************/

function getMethodCallClass(ctx) {
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

  let classNode = ctx.fqnOrRefTypePartFirst[0]
  classNode = classNode.children.fqnOrRefTypePartCommon[0]
  classNode = classNode.children.Identifier[0]

  return classNode
}

function getMethodCall(ctx) {
  let methodCall = ctx.fqnOrRefTypePartRest[0].children.fqnOrRefTypePartCommon[0]
  methodCall = methodCall.children.Identifier[0].image
  
  return methodCall
}

module.exports = { getMethodCallClass, getMethodCall }
