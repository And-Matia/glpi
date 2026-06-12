export const environment = {
  glpi: {
    v1ApiUrl: '/api.php/v1',
    v2ApiUrl: '/api.php/v2',
    graphqlUrl: '/api.php/GraphQL',
    tokenUrl: '/api.php/token',
    userToken: 'QLV91TGY0bOkEF9TiSXxABVzuU23fuce1byEwfIR',
    // userToken: '37k3cRq108AAlJ0duz8Dd4qJgR2WtUj2Quot3yds',

    oauth: {
      //clientId: 'f9367e59643cc96ed0f6d5ad6ed0387bad683bcdd3f38008288d46dbdc96161c',
      clientId: 'ac5039f90c21e33830dcf953aa5baf4648bd0464e2fde8e12fe046dba7d320d4',
      //clientSecret: '7e64a42fead8532d28762cde4d7f19a2d5b80dbfe8943163a03f4b195187b9c0',
      clientSecret: '8f15fcdfac673c432f2e9670dc2dfd19683ccc0cdeb1c84e831c0bb608bd088d',
      username: 'glpi',
      password: 'glpi',
      scope: 'api graphql'
    }
  },
  coreApiUrl: 'http://localhost:8080/api',
  backOfficePassword: 'admin1234',
};
