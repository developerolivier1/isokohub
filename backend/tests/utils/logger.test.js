const { expect } = require('chai');
const logger = require('../../utils/logger');

describe('Logger Utility', function () {
  it('should export info, warn, error, debug functions', () => {
    expect(logger.info).to.be.a('function');
    expect(logger.warn).to.be.a('function');
    expect(logger.error).to.be.a('function');
    expect(logger.debug).to.be.a('function');
  });

  it('should export stream object for morgan', () => {
    expect(logger.stream).to.have.property('write');
    expect(logger.stream.write).to.be.a('function');
  });
});
