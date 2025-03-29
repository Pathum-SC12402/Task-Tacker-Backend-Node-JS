const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index'); // Ensure the correct path

describe('Express API Tests', () => {
  it('should return a success message from the root endpoint', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Hello from the server');
  });

  it('should return a 404 for unknown routes', async () => {
    const res = await request(app).get('/unknown');
    expect(res.statusCode).toEqual(404);
  });

  // Ensure database disconnects after tests
  afterAll(async () => {
    await mongoose.connection.close();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Ensures cleanup
  });
});
