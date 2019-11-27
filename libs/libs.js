import crypto from 'crypto';

export async function getRandomString(size = 16, format = 'hex') {
  const buffer = await crypto.randomBytes(size);
  return buffer.toString(format);
}

export function prettySerialize(data, replacer = null, space = 2) {
  return JSON.stringify(data, replacer, space);
}

export function checkToken(req, res, next) {
  const { tokens } = req.session;
  const access_token = tokens && tokens.access_token;
  if (!access_token) {
    next(new Error('No `access_token`'))
  } else {
    req.state = req.state || {};
    req.state.access_token = access_token;
    next();
  }
}