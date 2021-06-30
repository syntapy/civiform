const { Provider } = require('oidc-provider');
const configuration = {
  clients: [{
    client_id: 'user',
    client_secret: 'foo',
    response_types: ['id_token'],
    response_mode: ['form_post'],
    grant_types: ['implicit'],
    // "web" because we're on simulated network in docker.
    application_type: 'web',
    scopes: ['openid', 'profile'],
    redirect_uris: ['https://civiform:9000/callback/OidcClient'],
  }
  ],
  async findAccount(ctx, id) {
    return {
      accountId: id,
      async claims() {
        return {
          sub: id,
          // pretend to be IDCS which uses this key for user email.
          user_emailid: id + "@example.com",
          // lie about verification for tests.
          email_verified: true,
          user_displayname: "first middle last"
        };
      },
    };
  },
  claims: {
    openid: ['sub'],
    email: ['user_emailid', 'email_verified', 'user_displayname'],
  }
};

const oidc = new Provider('http://localhost:3380', configuration);

var process = require('process');
process.on('SIGINT', () => {
  console.info("Interrupted")
  process.exit(0)
});

const server = oidc.listen(3380, () => {
  console.log('oidc-provider listening on port 3380, check http://localhost:3380/.well-known/openid-configuration');
});
