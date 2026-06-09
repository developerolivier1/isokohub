const { expect } = require('chai');
const http = require('http');
const { app } = require('../../server');

describe('Auth API', function () {
  this.timeout(10000);

  it('should return health check', (done) => {
    const request = http.request(app, { path: '/api/v1/health', method: 'GET' }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        const data = JSON.parse(body);
        expect(res.statusCode).to.equal(200);
        expect(data.success).to.be.true;
        done();
      });
    });
    request.end();
  });
});
