function getMethodCallClass(ctx, testLength=true) {
  // Make sure elements are in correct order
  let keys = Object.keys(ctx)

  if (testLength) {
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
  }

  let classNode = ctx.fqnOrRefTypePartFirst[0]
  classNode = classNode.children.fqnOrRefTypePartCommon[0]
  classNode = classNode.children.Identifier[0]

  return classNode
}

function getMethodCall(ctx, i, j, k) {
  let methodCall = ctx.fqnOrRefTypePartRest[i].children.fqnOrRefTypePartCommon[j]
  methodCall = methodCall.children.Identifier[k].image
  
  return methodCall
}

function getCalledIdentifier(ctx, i, j, k, debug=false) {
  if (debug) { console.log(ctx) }
  let identifier = ctx.fqnOrRefTypePartRest[i]
  if (debug) { console.log(identifier) }
  identifier = identifier.children.fqnOrRefTypePartCommon[j]
  if (debug) { console.log(identifier) }
  identifier = identifier.children.Identifier[k]
  if (debug) { console.log(identifier) }

  return identifier
}

module.exports = { getMethodCallClass, getMethodCall, getCalledIdentifier }
