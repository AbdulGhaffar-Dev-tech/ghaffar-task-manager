const request = require('supertest');
const app = require('../server'); // export app from server.js
describe('Tasks API', () => {
it('GET /api/tasks returns 200', async () => {
const res = await request(app).get('/api/tasks');
expect(res.statusCode).toBe(200);
expect(Array.isArray(res.body)).toBe(true);
});
it('POST /api/tasks creates a task', async () => {
const res = await request(app)
.post('/api/tasks')
.send({ title: 'Test Task', status: 'Pending' });
expect(res.statusCode).toBe(201);
expect(res.body.title).toBe('Test Task');
});
it('POST /api/tasks fails without title', async () => {
const res = await request(app).post('/api/tasks').send({});
expect(res.statusCode).toBe(400);
});
});