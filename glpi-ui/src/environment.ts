export const environment = {
  glpi: {
    v1ApiUrl: '/api.php/v1',
    v2ApiUrl: '/api.php/v2',
    graphqlUrl: '/api.php/GraphQL',
    tokenUrl: '/api.php/token',
    // userToken: 'uzxpifgX6UyYjLXRkAzW4CrmC23QIyDCP0F0HBlp',
    userToken: '37k3cRq108AAlJ0duz8Dd4qJgR2WtUj2Quot3yds',

    oauth: {
      //clientId: 'f9367e59643cc96ed0f6d5ad6ed0387bad683bcdd3f38008288d46dbdc96161c',
      clientId: '4ba8eb4ef8cdf767f8cf1373c039732d0ad287cdb9a5b0e27d708121e213ec3b',
      clientSecret: '5f1331b3a1a0275911f2c685c4077d4553d206c63c8bc83adffbb04bc6e62e21',
      username: 'glpi',
      password: 'glpi',
      scope: 'api graphql'
    }
  },
  coreApiUrl: 'http://localhost:8080/api',
  backOfficePassword: 'admin1234',
};
