class NodeOrganizer {

  getNodesSorted(ctx, attributesList) {
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

}
