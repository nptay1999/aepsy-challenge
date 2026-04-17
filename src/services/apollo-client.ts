import { ApolloClient, InMemoryCache } from '@apollo/client'
import { HttpLink } from '@apollo/client/link/http'

const apolloClient = new ApolloClient({
  link: new HttpLink({ uri: 'https://api-dev.aepsy.com/graphql' }),
  cache: new InMemoryCache(),
})

export default apolloClient
