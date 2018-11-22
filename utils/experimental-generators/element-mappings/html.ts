export default {
  View: {
    name: 'div',
  },
  Text: {
    name: 'span',
    attrs: {
      static: '$attrs.dynamic',
    },
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
      target: '_blank',
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
