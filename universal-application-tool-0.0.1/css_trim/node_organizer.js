const _ = require('lodash')

function sortKey(o) {
  let rval
  try {
    rval = o.location.startOffset 
  } catch(errorA) {
    try {
      rval = o.startOffset
    } catch(errorB) {
      throw errorB
    }
  }
  return rval
}

class NodeOrganizer {

  getNodesSorted(ctx) {
    const attributesList = Object.keys(ctx)
    const nodesList = []
    for (const attribute of attributesList) {
      if (_.has(ctx, attribute)) {
        for (const node of ctx[attribute]) {
          nodesList.push(node)
        }
      }
    }

    let nodesSorted = []

    if (nodesList.length > 0) {
      nodesSorted = _.sortBy(nodesList, [sortKey])
    }

    return nodesSorted
  }

  isIdentifier(node) {
    if (_.has(node, 'image') && _.has(node, 'startOffset')) {
      return true
    }
    return false
  }
}

function getOrganizer() {
  const nodeOrganizer = new NodeOrganizer()

  return nodeOrganizer
}

module.exports = { getOrganizer }
