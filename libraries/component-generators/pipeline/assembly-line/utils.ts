import {
  ComponentContent,
  ComponentDependency,
  ElementsMapping,
  ElementMapping,
} from '../../../uidl-definitions/types'

export const mergeAttributes = (mappedElement: ElementMapping, uidlAttrs: any) => {
  // We gather the results here uniting the mapped attributes and the uidl attributes.
  const resolvedAttrs: { [key: string]: any } = {}

  // This will gather all the attributes from the UIDL which are mapped using the elements-mapping
  // These attributes will not be added on the tag as they are, but using the elements-mapping
  // Such an example is the url attribute on the Link tag, which needs to be mapped in the case of html to href
  const mappedAttributes: string[] = []

  const attrs: Record<string, any> = mappedElement.attrs || {}
  // First we iterate through the mapping attributes and we add them to the result
  Object.keys(attrs).forEach((key) => {
    const value = attrs[key]
    if (!value) {
      return
    }

    if (typeof value === 'string' && value.startsWith('$attrs.')) {
      // we lookup for the attributes in the UIDL and use the element-mapping key to set them on the tag
      // (ex: Link has an url attribute in the UIDL, but it needs to be mapped to href in the case of HTML)
      const uidlAttributeKey = value.replace('$attrs.', '')
      if (uidlAttrs && uidlAttrs[uidlAttributeKey]) {
        resolvedAttrs[key] = uidlAttrs[uidlAttributeKey]
        mappedAttributes.push(uidlAttributeKey)
      }

      // in the case of mapped reference attributes ($attrs) we don't write them unless they are specified in the uidl
      return
    }

    resolvedAttrs[key] = attrs[key]
  })

  // The UIDL attributes can override the mapped attributes, so they come last
  if (uidlAttrs) {
    Object.keys(uidlAttrs).forEach((key) => {
      // Skip the attributes that were mapped from $attrs
      if (!mappedAttributes.includes(key)) {
        resolvedAttrs[key] = uidlAttrs[key]
      }
    })
  }

  return resolvedAttrs
}

export const resolveDependency = (
  mappedElement: ElementMapping,
  uidlDependency?: ComponentDependency,
  localDependenciesPrefix = './'
) => {
  // If dependency is specified at UIDL level it will have priority over the mapping one
  const nodeDependency = uidlDependency || mappedElement.dependency
  if (nodeDependency && nodeDependency.type === 'local') {
    // When a dependency is specified without a path, we infer it is a local import.
    // This might be removed at a later point
    nodeDependency.path =
      nodeDependency.path || localDependenciesPrefix + mappedElement.type
  }

  return nodeDependency
}

// Traverses the mapped elements children and inserts the original children of the node being mapped.
export const insertChildrenIntoNode = (
  node: ComponentContent,
  originalChildren: Array<ComponentContent | string>
) => {
  if (!node.children) {
    return
  }

  const initialValue: Array<ComponentContent | string> = []
  node.children = node.children.reduce((acc, child) => {
    if (typeof child === 'string') {
      if (child === '$children') {
        // When $children is encountered it is replaced by all the children of the original node from the UIDL
        acc.push(...originalChildren)
        return acc
      }

      // String nodes are just pushed the way they are
      acc.push(child)
      return acc
    }

    // The child node is pushed after the $children token was replaced
    insertChildrenIntoNode(child, originalChildren)
    acc.push(child)
    return acc
  }, initialValue)
}

export const resolveUIDLNode = (
  node: ComponentContent,
  elementsMapping: ElementsMapping,
  localDependenciesPrefix: string
) => {
  const mappedElement = elementsMapping[node.type] || { type: node.type }

  node.type = mappedElement.type

  // Resolve dependency with the UIDL having priority
  if (node.dependency || mappedElement.dependency) {
    node.dependency = resolveDependency(
      mappedElement,
      node.dependency,
      localDependenciesPrefix
    )
  }

  // Merge UIDL attributes to the attributes coming from the mapping object
  if (mappedElement.attrs) {
    node.attrs = mergeAttributes(mappedElement, node.attrs)
  }

  // If the mapping contains children, insert that structure into the UIDL
  if (mappedElement.children) {
    const originalNodeChildren = node.children || []
    const replacingNode = {
      ...node,
      children: [...mappedElement.children],
    }

    insertChildrenIntoNode(replacingNode, originalNodeChildren)
    node.children = replacingNode.children
  }

  // If the node has multiple state branches, each content needs to be resolved
  if (node.type === 'state' && node.states) {
    node.states = node.states.map((stateBranch) => {
      if (typeof stateBranch.content === 'string') {
        return stateBranch
      } else {
        return {
          ...stateBranch,
          content: resolveUIDLNode(
            stateBranch.content,
            elementsMapping,
            localDependenciesPrefix
          ),
        }
      }
    })
  }

  // Traverse the UIDL
  if (node.children) {
    node.children = node.children.map((child) => {
      if (typeof child === 'string') {
        return child
      } else {
        return resolveUIDLNode(child, elementsMapping, localDependenciesPrefix)
      }
    })
  }

  return node
}
