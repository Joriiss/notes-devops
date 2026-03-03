const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { connectDB } = require('../src/config/db');
const { app } = require('../src/index');
const Note = require('../src/models/note');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  await connectDB();
}, 20000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('API /health', () => {
  it('GET /health returns 200 and status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('API /ressources — cas nominaux', () => {
  beforeEach(async () => {
    await Note.deleteMany({});
  });

  it('GET /ressources returns 200 and empty array when no notes', async () => {
    const res = await request(app).get('/ressources');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ items: [], total: 0, page: 1, limit: 10, totalPages: 1 });
    expect(res.body.items).toHaveLength(0);
  });

  it('POST /ressources creates a note and returns 201', async () => {
    const res = await request(app)
      .post('/ressources')
      .send({ title: 'Test note', content: 'Hello world' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ title: 'Test note', content: 'Hello world' });
    expect(res.body._id).toBeDefined();
  });

  it('GET /ressources returns paginated list', async () => {
    await request(app).post('/ressources').send({ title: 'A', content: 'a' });
    await request(app).post('/ressources').send({ title: 'B', content: 'b' });
    const res = await request(app).get('/ressources?page=1&limit=10');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ page: 1, limit: 10, total: 2, totalPages: 1 });
    expect(res.body.items).toHaveLength(2);
  });

  it('GET /ressources/:id returns 200 and the note', async () => {
    const created = await request(app)
      .post('/ressources')
      .send({ title: 'Get me', content: 'Content' });
    const id = created.body._id;
    const res = await request(app).get(`/ressources/${id}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ title: 'Get me', content: 'Content' });
  });

  it('PUT /ressources/:id updates and returns 200', async () => {
    const created = await request(app)
      .post('/ressources')
      .send({ title: 'Before', content: 'Old' });
    const id = created.body._id;
    const res = await request(app)
      .put(`/ressources/${id}`)
      .send({ title: 'After', content: 'New' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ title: 'After', content: 'New' });
  });

  it('DELETE /ressources/:id deletes and returns 200', async () => {
    const created = await request(app)
      .post('/ressources')
      .send({ title: 'To delete', content: 'Bye' });
    const id = created.body._id;
    const res = await request(app).delete(`/ressources/${id}`);
    expect(res.status).toBe(200);
    const getRes = await request(app).get(`/ressources/${id}`);
    expect(getRes.status).toBe(404);
  });
});

describe('API /ressources — cas d\'erreur', () => {
  it('POST /ressources with missing title returns 400', async () => {
    const res = await request(app)
      .post('/ressources')
      .send({ content: 'No title' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/title/);
  });

  it('POST /ressources with empty title returns 400', async () => {
    const res = await request(app)
      .post('/ressources')
      .send({ title: '  ', content: 'OK' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/title/);
  });

  it('POST /ressources with missing content returns 400', async () => {
    const res = await request(app)
      .post('/ressources')
      .send({ title: 'No content' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/content/);
  });

  it('GET /ressources/:id with invalid id returns 404', async () => {
    const res = await request(app).get('/ressources/invalid-id-123');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it('GET /ressources/:id with non-existent valid id returns 404', async () => {
    const fakeId = '507f1f77bcf86cd799439011';
    const res = await request(app).get(`/ressources/${fakeId}`);
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it('PUT /ressources/:id with non-existent id returns 404', async () => {
    const fakeId = '507f1f77bcf86cd799439012';
    const res = await request(app)
      .put(`/ressources/${fakeId}`)
      .send({ title: 'T', content: 'C' });
    expect(res.status).toBe(404);
  });
});
