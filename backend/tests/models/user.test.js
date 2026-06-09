const { expect } = require('chai');
const User = require('../../models/User');

describe('User Model', function () {
  this.timeout(5000);

  const validUserData = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'TestPass123!',
    phone: '+250788000000',
    role: 'customer',
  };

  it('should create a valid user', async () => {
    const user = await User.create(validUserData);
    expect(user).to.have.property('_id');
    expect(user.name).to.equal('Test User');
    expect(user.email).to.equal('test@example.com');
    expect(user.role).to.equal('customer');
  });

  it('should hash password before saving', async () => {
    const user = await User.create(validUserData);
    expect(user.password).to.not.equal('TestPass123!');
  });

  it('should validate password correctly', async () => {
    const user = await User.create(validUserData);
    const isMatch = await user.comparePassword('TestPass123!');
    expect(isMatch).to.be.true;
  });

  it('should reject wrong password', async () => {
    const user = await User.create(validUserData);
    const isMatch = await user.comparePassword('WrongPass123!');
    expect(isMatch).to.be.false;
  });

  it('should reject duplicate email', async () => {
    await User.create(validUserData);
    try {
      await User.create({ ...validUserData, phone: '+250788000001' });
      expect.fail('Should have thrown duplicate key error');
    } catch (err) {
      expect(err.code).to.equal(11000);
    }
  });

  it('should require name and email', async () => {
    try {
      await User.create({ password: 'TestPass123!' });
      expect.fail('Should have thrown validation error');
    } catch (err) {
      expect(err.name).to.equal('ValidationError');
    }
  });
});
