import path from 'path';
import { URLSearchParams } from 'url';

import fetch from 'node-fetch';
import express from 'express';
import session from 'express-session';
import nunjucks from 'nunjucks';

import config from './config/config.js';
import { getRandomString, prettySerialize, checkToken } from './libs/libs.js';

const app = express();

app.set('views', path.join(process.cwd(), 'views'));
app.set('view engine', 'njk');
nunjucks.configure(app.get('views'), {
  autoescape: true,
  express: app
});

app.use(
  session({
    secret: config.session.secret,
    cookie: { maxAge: 1000 * 60 * 5}, // ms
    resave: false,
    saveUninitialized: false
  })
);

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/auth/figma', async (req, res) => {
  const CSRF = await getRandomString();

  const redirectURL = `${config.figma.oauth_login_url}?${new URLSearchParams({
    response_type: 'code',
    scope: 'file_read',
    client_id: config.figma.client_id,
    redirect_uri: config.figma.redirect,
    state: CSRF
  })}`;

  req.session.csrf = CSRF;
  res.redirect(redirectURL);
});

app.get(config.figma.redirect_pathname, async (req, res, next) => {
  const { code, state } = req.query;

  if (state !== req.session.csrf) {
    return next(new Error('Forbidden'));
  }

  // get token
  const tokenData = await fetch(
    `${config.figma.oauth_get_token_url}?${new URLSearchParams({
      'grant_type': 'authorization_code',
      'client_id': config.figma.client_id,
      'client_secret': config.figma.client_secret,
      'redirect_uri': config.figma.redirect,
      'code': code
    })}`,
    {
      method: 'POST'
    })
    .then(res => res.json());

  // save token
  req.session.tokens = tokenData;

  res.render('index', {
    data: prettySerialize(tokenData)
  });
});

app.get('/refresh', async (req, res, next) => {
  const { tokens } = req.session;
  const refresh_token = tokens && tokens.refresh_token;

  if (!refresh_token) {
    return next(new Error('No `refresh_token`'))
  }

  const newTokenData = await fetch(
    `${config.figma.oauth_get_refresh_token_url}?${new URLSearchParams({
      'client_id': config.figma.client_id,
      'client_secret': config.figma.client_secret,
      'refresh_token': refresh_token
    })}`,
    {
      method: 'POST'
    }
  ).then(res => res.json());

  req.session.tokens = {
    ...req.session.tokens,
    ...newTokenData
  }

  res.render('index', {
    data: prettySerialize(newTokenData)
  });
});

app.get('/me', checkToken, async (req, res, next) => {
  const userData = await fetch(`${config.figma.api_url}/me`, {
    headers: {
      'Authorization': `Bearer ${req.state.access_token}`
    }
  })
  .then(res => res.json())

  res.render('index', {
    data: prettySerialize(userData),
    user: userData
  });
});

app.get('/projects/', checkToken, async (req, res, next) => {
  const { team_id } = req.query;

  const projectsData = await fetch(`${config.figma.api_url}/teams/${team_id}/projects`, {
    headers: {
      'Authorization': `Bearer ${req.state.access_token}`
    }
  })
  .then(res => res.json())

  res.render('index', {
    data: prettySerialize(projectsData)
  });
})

app.use((error, req, res, next) => {
  res.status(500).render('index', {
    error: prettySerialize(error.message)
  });
});

app.listen(config.server.port, () => {
  console.log(config.server.origin)
});