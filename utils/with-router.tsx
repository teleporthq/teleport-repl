import queryString from 'query-string'
import { withRouter } from 'next/router'

export const withCustomRouter = (ReplCode: any) => {
  return withRouter(({ router, ...props }: any): any => {
    if (router && router.asPath) {
      const query = router.asPath
        .split('/?')
        .reduce((acc: Record<string, string>, param: string) => {
          if (param) {
            const parsed = queryString.parse(param) as Record<string, string>
            acc = { ...acc, ...parsed }
          }
          return acc
        }, {})
      router = { ...router, query }
      return <ReplCode router={router} {...props} />
    }
  })
}
