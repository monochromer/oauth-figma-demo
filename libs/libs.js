import crypto from 'crypto';

export async function getRandomString(size = 16, format = 'hex') {
  const buffer = await crypto.randomBytes(size);
  return buffer.toString(format);
}

export function prettySerialize(data, replacer = null, space = 2) {
  return JSON.stringify(data, replacer, space);
}