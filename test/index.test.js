import { expect } from 'chai';
import FaviconsWebpackPlugin from '../src';

/* eslint prefer-arrow-callback: 0, func-names: 0, no-unused-expressions: 0 */
describe('Initialize Plugin', function () {
  it('should be a function', function () {
    expect(typeof FaviconsWebpackPlugin).to.be.equal('function');
  });
});
