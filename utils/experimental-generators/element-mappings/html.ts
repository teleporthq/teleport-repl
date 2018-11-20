export default {
  View: {
    name: 'div',
  },
  Text: {
    name: 'span',
  },
  Image: {
    name: 'img',
  },
  TextInput: {
    name: 'input',
    attrs: {
      type: 'text',
    },
  },
  Link: {
    name: 'a',
    attrs: {
      href: '$attrs.url',
      target: ({ url }: any = {}) => (url && url.startsWith('http') ? '_blank' : null),
      rel: 'nofollow noreferrer',
    },
    dependency: {
      namedImport: true,
      type: 'npm',
      path: 'react-link',
    },
  },
}
