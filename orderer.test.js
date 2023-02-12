const {
  makeOrderer,
  extendExpectWithToBeBefore
} = require('./orderer');

extendExpectWithToBeBefore(expect);

describe('makeOrderer', () => {
  it('detects when one function is ever called before another', () => {
    const { orderOf, makeFn } = makeOrderer();
    const a = makeFn(() => {});
    const b = makeFn(() => {});
    a();
    b();
    expect(orderOf(a)).toBeBefore(b);
  });
});
