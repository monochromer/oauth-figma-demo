import dotenv from 'dotenv';

dotenv.config();
const env = process.env;

const session = {
  secret: env.SESSION_SECRET || 'some_secret_word_for_session'
};

const server = {
  protocol: env.PROTOCOL || 'http://',
  hostname: env.HOSTNAME || 'localhost',
  port: env.PORT || 3000,
  get origin() {
    return this.protocol + this.hostname + ':' + this.port;
  }
};

const figma = {
  client_id: env.FIGMA_CLIENT_ID,
  client_secret: env.FIGMA_CLIENT_SECRET,
  redirect_pathname: env.FIGMA_CLIENT_CALLBACK || '/auth/figma/callback',
  get redirect() {
    return server.origin + this.redirect_pathname;
  },
  oauth_login_url: 'https://www.figma.com/oauth',
  oauth_get_token_url: 'https://www.figma.com/api/oauth/token',
  oauth_get_refresh_token_url: 'https://www.figma.com/api/oauth/refresh',
  api_url: 'https://api.figma.com/v1'
};

const config = {
  server,
  figma,
  session
};

export default Object.freeze(config);