import { resolveAemAccessToken } from '../packages/aem/dist/index.js';

async function testAuth() {
  try {
    console.log('Testing resolveAemAccessToken...');
    const token = await resolveAemAccessToken(process.env);
    console.log('Token result:', token ? { ...token, accessToken: token.accessToken.slice(0, 20) + '...' } : null);
  } catch (err) {
    console.error('Auth error:', err);
  }
}

testAuth();
