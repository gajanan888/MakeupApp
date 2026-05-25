const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');

const servicePath = path.resolve(__dirname, '../src/services/artist.service.js');
const modelPath = path.resolve(__dirname, '../src/models/artist.model.js');

function createArtistRecord(data) {
  const record = {
    id: data.id,
    ...data,
    async update(updates) {
      Object.assign(record, updates);
      return record;
    },
    toJSON() {
      const { update, toJSON, ...json } = record;
      return { ...json };
    },
  };

  return record;
}

function createServiceHarness() {
  const records = [];
  let nextId = 1;

  const Artist = {
    async findOne({ where }) {
      const [field, value] = Object.entries(where)[0];
      return records.find((artist) => artist[field] === value) || null;
    },
    async findByPk(id) {
      return records.find((artist) => artist.id === id) || null;
    },
    async create(data) {
      const artist = createArtistRecord({ id: nextId++, ...data });
      records.push(artist);
      return artist;
    },
  };

  const bcrypt = {
    async hash(password, rounds) {
      assert.equal(rounds, 10);
      return `hashed:${password}`;
    },
    async compare(password, hash) {
      return hash === `hashed:${password}`;
    },
  };

  const jwt = {
    sign(payload, secret, options) {
      assert.equal(secret, 'test-secret');
      assert.deepEqual(options, { expiresIn: '7d' });
      return `token:${payload.id}`;
    },
  };

  const originalLoad = Module._load;
  Module._load = function mockLoad(request, parent, isMain) {
    const resolved = Module._resolveFilename(request, parent, isMain);

    if (resolved === modelPath) return Artist;
    if (request === 'bcrypt') return bcrypt;
    if (request === 'jsonwebtoken') return jwt;

    return originalLoad.call(this, request, parent, isMain);
  };

  delete require.cache[servicePath];
  process.env.JWT_SECRET = 'test-secret';
  const service = require(servicePath);
  Module._load = originalLoad;

  return { service, records };
}

test('artist setup supports signup, login, profile, and profile update', async () => {
  const { service, records } = createServiceHarness();
  const signupData = {
    name: 'Asha Artist',
    email: 'asha@example.com',
    phone: '9999999999',
    password: 'top-secret',
    experience_years: 5,
    certifications: ['bridal', 'airbrush'],
    portfolio_url: 'https://example.com/portfolio',
    bio: 'Bridal and editorial makeup artist',
    government_id_number: 'GOV12345',
  };

  const signup = await service.signup(signupData);

  assert.equal(signup.token, 'token:1');
  assert.equal(signup.artist.email, signupData.email);
  assert.deepEqual(signup.artist.certifications, signupData.certifications);
  assert.equal(signup.artist.password_hash, undefined);
  assert.equal(records[0].password_hash, 'hashed:top-secret');
  assert.equal(records[0].certifications, JSON.stringify(signupData.certifications));

  const login = await service.login(signupData.email, signupData.password);
  assert.equal(login.token, 'token:1');
  assert.deepEqual(login.artist.certifications, signupData.certifications);
  assert.equal(login.artist.password_hash, undefined);

  const profile = await service.getProfile(1);
  assert.equal(profile.name, signupData.name);
  assert.deepEqual(profile.certifications, signupData.certifications);
  assert.equal(profile.password_hash, undefined);

  const updated = await service.updateProfile(1, {
    bio: 'Luxury bridal specialist',
    certifications: ['bridal', 'editorial'],
  });

  assert.equal(updated.bio, 'Luxury bridal specialist');
  assert.deepEqual(updated.certifications, ['bridal', 'editorial']);
  assert.equal(records[0].certifications, JSON.stringify(['bridal', 'editorial']));
  assert.equal(updated.password_hash, undefined);
});

test('artist setup rejects duplicate email and phone signup', async () => {
  const { service } = createServiceHarness();
  const data = {
    name: 'Asha Artist',
    email: 'asha@example.com',
    phone: '9999999999',
    password: 'top-secret',
    experience_years: 5,
    certifications: ['bridal'],
    government_id_number: 'GOV12345',
  };

  await service.signup(data);
  await assert.rejects(() => service.signup({ ...data, phone: '8888888888' }), /Artist already exists/);
  await assert.rejects(() => service.signup({ ...data, email: 'new@example.com' }), /Phone already in use/);
});

test('artist setup rejects bad login and missing profiles', async () => {
  const { service } = createServiceHarness();
  const data = {
    name: 'Asha Artist',
    email: 'asha@example.com',
    phone: '9999999999',
    password: 'top-secret',
    experience_years: 5,
    certifications: ['bridal'],
    government_id_number: 'GOV12345',
  };

  await service.signup(data);

  await assert.rejects(() => service.login(data.email, 'wrong-password'), /Invalid email or password/);
  await assert.rejects(() => service.login('missing@example.com', data.password), /Invalid email or password/);
  await assert.rejects(() => service.getProfile(404), /Artist not found/);
  await assert.rejects(() => service.updateProfile(404, { bio: 'Missing' }), /Artist not found/);
});
