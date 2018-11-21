export default {
  View: {
    name: 'div',
  },
  Text: {
    name: 'span',
  },
  Image: {
    name: 'img',
    attrs: {
      src: '$attrs.url',
    },
  },
  TextInput: {
    name: 'input',
    attrs: {
      type: 'text',
    },
  },
  Link: {
    name: 'Link',
    attrs: {
      href: '$attrs.url',
      target: ({ url }: any = {}) => (url && url.startsWith('http') ? '_blank' : null),
      rel: 'nofollow noreferrer',
    },
    dependency: {
      type: 'library',
      meta: {
        path: 'next/link',
        namedImport: true,
        originalName: 'Blabla',
      },
    },
  },
}
