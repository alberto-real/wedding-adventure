import axios from 'axios';

describe('GET /back', () => {
  it('should return a message', async () => {
    const res = await axios.get(`/back`);

    expect(res.status).toBe(200);
    expect(res.data).toEqual({ message: 'Hello back' });
  });
});
