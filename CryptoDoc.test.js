const { makeHtmlState, makeCryptoDoc } = require('./CryptoDoc.js');

describe('makeHtmlState', () => {
  let state = makeHtmlState();
  it('setHtml passes content through html', () => {
    const content = Symbol();
    state.setHtml(content);
    expect(state.html()).toBe(content);
  });
  it('setHtml returns nothing', () => {
    const content = Symbol();
    const rv = state.setHtml(content);
    expect(rv).not.toBe(content);
  });
});

describe('makeCryptoDoc', () => {
  describe('.loadFile', () => {
    const biserializer = Object.freeze({
      deserialize: jest.fn(() => {})
    });
    const connection = Object.freeze({
      getFile: jest.fn(filehandle => {})
    });
    const htmlState = Object.freeze({
      setHtml: jest.fn(() => {})
    });
    it('calls getFile before deserialize', () => {
      // nice things I can do without type checking...
      const subject = makeCryptoDoc({ biserializer, connection, htmlState });
      subject.loadFile(Symbol());

      //expect(connection.getFile).toHaveBeenCalledBefore(biserializer.deserialize);
    });
  });
  describe('.saveFile', () => {
    const biserializer = Object.freeze({
      serialize: jest.fn(() => {})
    });
    const connection = Object.freeze({
      updateFile: jest.fn(({ filehandle, html }) => {})
    });
    const htmlState = Object.freeze({
      html: jest.fn(() => {})
    });
  });
});
