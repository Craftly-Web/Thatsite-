import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/contact.js';
import { validateContact, cleanInput } from '../src/assets/js/contact-validation.js';

function call(method, body, headers = { host: 'localhost' }) {
  return new Promise(resolve => {
    const res = {
      statusCode: 200, headers: {},
      setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
      end(data) { resolve({ status: this.statusCode, body: data ? JSON.parse(data) : null }); }
    };
    handler({ method, body, headers }, res);
  });
}

const valid = () => ({ name: 'Max Mustermann', email: 'max@example.de', subject: 'Allgemeine Anfrage', message: 'Guten Tag, eine Frage.', startedAt: String(Date.now() - 10000), website: '' });
const ENV = ['RESEND_API_KEY', 'CONTACT_TO', 'CONTACT_FROM'];
let realFetch;
beforeEach(() => { realFetch = globalThis.fetch; for (const k of ENV) delete process.env[k]; });
afterEach(() => { globalThis.fetch = realFetch; for (const k of ENV) delete process.env[k]; });
const configure = () => { process.env.RESEND_API_KEY = 'test'; process.env.CONTACT_TO = 'a@example.de'; process.env.CONTACT_FROM = 'Web <web@example.de>'; };

test('nur POST erlaubt', async () => {
  assert.equal((await call('GET')).status, 405);
});

test('ohne Konfiguration: 503 not_configured, kein Erfolg', async () => {
  const r = await call('POST', valid());
  assert.equal(r.status, 503);
  assert.equal(r.body.ok, false);
  assert.equal(r.body.code, 'not_configured');
});

test('Spamschutz lehnt ab statt Erfolg vorzutäuschen', async () => {
  configure();
  globalThis.fetch = async () => { throw new Error('darf nicht aufgerufen werden'); };
  assert.equal((await call('POST', { ...valid(), website: 'http://spam' })).body.ok, false);
  assert.equal((await call('POST', { ...valid(), startedAt: String(Date.now()) })).status, 400);
});

test('serverseitige Validierung liefert Feldfehler', async () => {
  configure();
  const r = await call('POST', { ...valid(), email: 'kaputt', subject: 'Erfunden' });
  assert.equal(r.status, 400);
  assert.ok(r.body.errors.email && r.body.errors.subject);
});

test('fremde Herkunft wird abgelehnt', async () => {
  configure();
  const r = await call('POST', valid(), { host: 'localhost', origin: 'https://evil.example' });
  assert.equal(r.status, 403);
});

test('Erfolg nur, wenn der E-Mail-Dienst den Versand bestätigt', async () => {
  configure();
  let sent;
  globalThis.fetch = async (url, opts) => { sent = JSON.parse(opts.body); return new Response('{}', { status: 200 }); };
  const ok = await call('POST', valid());
  assert.equal(ok.status, 200);
  assert.equal(ok.body.ok, true);
  assert.deepEqual(sent.to, ['a@example.de']);
  assert.equal(sent.reply_to, 'max@example.de');

  globalThis.fetch = async () => new Response('fail', { status: 500 });
  const fail = await call('POST', valid());
  assert.equal(fail.status, 502);
  assert.equal(fail.body.ok, false);
});

test('HTML in Eingaben wird in der E-Mail maskiert', async () => {
  configure();
  let sent;
  globalThis.fetch = async (url, opts) => { sent = JSON.parse(opts.body); return new Response('{}', { status: 200 }); };
  await call('POST', { ...valid(), message: '<script>alert(1)</script> Text' });
  assert.ok(!sent.html.includes('<script>'));
});

test('gemeinsame Prüfregeln', () => {
  assert.deepEqual(validateContact(cleanInput(valid())), {});
  const e = validateContact(cleanInput({ name: 'A', email: 'x', phone: 'abc', subject: '', message: 'kurz' }));
  assert.deepEqual(Object.keys(e).sort(), ['email', 'message', 'name', 'phone', 'subject']);
});
