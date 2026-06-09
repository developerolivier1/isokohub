const { expect } = require('chai');
const email = require('../../utils/email');

describe('Email Utility', function () {
  it('should export sendEmail function', () => {
    expect(email.sendEmail).to.be.a('function');
  });

  it('should export sendWelcomeEmail function', () => {
    expect(email.sendWelcomeEmail).to.be.a('function');
  });

  it('should export sendPasswordResetEmail function', () => {
    expect(email.sendPasswordResetEmail).to.be.a('function');
  });

  it('should export sendOrderConfirmationEmail function', () => {
    expect(email.sendOrderConfirmationEmail).to.be.a('function');
  });
});
