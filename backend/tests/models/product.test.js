const { expect } = require('chai');
const Product = require('../../models/Product');

describe('Product Model', function () {
  this.timeout(5000);

  it('should create a valid product', async () => {
    const product = await Product.create({
      tenantId: '507f1f77bcf86cd799439011',
      vendorId: '507f1f77bcf86cd799439012',
      name: 'Test Product',
      price: 10000,
      category: '507f1f77bcf86cd799439013',
    });
    expect(product).to.have.property('_id');
    expect(product.name).to.equal('Test Product');
    expect(product.status).to.equal('draft');
  });

  it('should require name and price', async () => {
    try {
      await Product.create({ tenantId: '507f1f77bcf86cd799439011' });
      expect.fail('Should have thrown validation error');
    } catch (err) {
      expect(err.name).to.equal('ValidationError');
    }
  });
});
