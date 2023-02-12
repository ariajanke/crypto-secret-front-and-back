/****************************************************************************

    MIT License

    Copyright (c) 2023 Aria Janke

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.

*****************************************************************************/

import { extendExpectWithToBeBefore } from './orderer';
import {
  cryptoSerializerShared,
  makeDefaultBidirectionalCryptoSerializer,
  makePasswordState,
  makeCryptoSerializer,
  makeCryptoDeserializer,
  makeBidirectionalCryptoSerializer
} from './serializers';

const kDefaultCipherSettings = Object.freeze({
  keyStrengthenFactor: Symbol(),
  keySize: Symbol(),
  cipherMode: Symbol(),
  salt: {
    words: Symbol(),
    paranoia: Symbol()
  },
  iv: {
    words: Symbol(),
    paranoia: Symbol()
  }
});

const mustBe = (name, expected) => is => {
if (expected === is) return is;
  throw `mustBe: is not ${name}`;
};

describe('cryptoSerializerShared', () => {
  it('returns an object', () => {
    const sjcl = Symbol();
    const cipherSettings = Symbol();
    const rv = cryptoSerializerShared({ cipherSettings, sjcl });
    expect(typeof rv).toEqual('object');
  });

  describe('{ makeKey }', () => {
    const key = { slice: jest.fn(() => {}) };
    const password = Symbol();
    const getPassword = () => password;
    const salt = Symbol();
    const mustBeSalt = mustBe('salt', salt);
    const mustBePassword = mustBe('password', password);
    const cipherSettings = Object.freeze({
      keyStrengthenFactor: Symbol(),
      keySize: 32 // <- freaking operators
    });
    const mustBeStrengthenFactor = mustBe('key strengthen factor',
                                          cipherSettings.keyStrengthenFactor);
    const sjcl = {
      misc: {
        cachedPbkdf2: jest.fn((key_, { salt, iter }) => {
          mustBeSalt(salt);
          mustBePassword(key_);
          mustBeStrengthenFactor(iter);
          return { key };
        })
      }
    };
    const { makeKey } = cryptoSerializerShared({ cipherSettings, sjcl });

    it('returns a sliced key', () => {
      expect(makeKey({ getPassword, salt })).toBe(key);
      expect(key.slice).toHaveBeenCalledWith(0, cipherSettings.keySize / 32);
    });
  });
});

describe('makePasswordState', () => {
  it('returns an object', () => {
    expect(typeof makePasswordState()).toEqual('object');
  });
  describe('{ setPassword }', () => {
    const { setPassword } = makePasswordState();
    const password = Symbol();
    it('returns nothing', () => {
      expect(setPassword(password)).toBeUndefined();
    });
  });
  describe('{ hasPassword } with { setPassword }', () => {
    const { hasPassword, setPassword } = makePasswordState();
    it('is falsey by default', () => {
      expect(hasPassword()).not.toBeTruthy();
    });
    it('is truthy after calling setPassword', () => {
      setPassword(Symbol());
      expect(hasPassword()).toBeTruthy();
    });
  });
  describe('{ getPassword } with { setPassword }', () => {
    const password = Symbol();
    const { getPassword, setPassword } = makePasswordState();
    it('is undefined by default', () => {
      expect(getPassword()).toBeUndefined();
    });
    it('is the password set with setPassword', () => {
      setPassword(password);
      expect(getPassword()).toBe(password);
    });
  });
});

// I don't see a nice way to handle dependancies here
// lots of tight coupling of stuff
describe('makeCryptoSerializer', () => {
  let cipherSettings = {
    keyStrengthenFactor: Symbol(),
    keySize: Symbol(),
    cipherMode: Symbol(),
    iv: {
      words: Symbol(),
      paranoia: Symbol()
    }
  };
  let randomWordsMapping = {
    [cipherSettings.iv.words]: {
      [cipherSettings.iv.paranoia]: Symbol()
    }
  };
  const randomWords = (words, paranoia) => {
    const defaultCase = () => {
      throw '';
    };
    return randomWordsMapping[words][paranoia] || defaultCase();
  };
  let sjcl = { random: { randomWords } };
  let passwordState = {
    setPassword: Symbol(),
    hasPassword: Symbol(),
    getPassword: Symbol()
  };

  it('returns an object', () => {
    const params = { cipherSettings, sjcl, passwordState };
    expect(typeof makeCryptoSerializer(params)).
      toEqual('object');
  });
  describe('{ hasPassword }', () => {
    it("is password state's hasPassword", () => {
      const { hasPassword } = makeCryptoSerializer({ cipherSettings, sjcl, passwordState });
      expect(hasPassword).toBe(passwordState.hasPassword);
    });
  });
  describe('{ serialize }', () => {
    // mutating leaks to other cases...
    makeCryptoSerializer({
      cipherSettings: Object.assign({}, cipherSettings, {
        salt: {
          words   : Symbol(),
          paranoia: Symbol()
        }
      }),
      sjcl: Object.assign({}, sjcl, {
        encrypt: (key, htmlStr, serializeParams, blank) => {

        },
        codec: { base64: { fromBits: salt => { ; return 'salt'; } }}
      }),
      passwordState: {
        hasPassword: true,
        getPassword: () => Symbol()
      }
    });
  });
  describe('{ setPassword }', () => {
    it("is password state's setPassword", () => {
      const { setPassword } = makeCryptoSerializer({ cipherSettings, sjcl, passwordState });
      expect(setPassword).toBe(passwordState.setPassword);
    });
  });
  // time to think about mocks a bit??
  // I miss rspec's let statements

});

describe('makeCryptoDeserializer', () => {

});

describe('makeBidirectionalCryptoSerializer', () => {

});

// not sure if the following is testable (though it's not really made to be)
// makeDefaultBidirectionalCryptoSerializer
