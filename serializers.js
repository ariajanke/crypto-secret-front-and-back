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

(ex => {
  const onNode = typeof module !== 'undefined';
  const target = onNode ? module.exports : window;
  for (const [k, v] of Object.entries(Object.assign({}, onNode ? ex.back : {}, ex.front))) { target[k] = v; }
})((() => {

'use strict';

const kDefaultCipherSettings = Object.freeze({
  keyStrengthenFactor: 1000,
  keySize: 128,
  cipherMode: 'ccm',
  salt: {
    words: 2,
    paranoia: 0
  },
  iv: {
    words: 4,
    paranoia: 0
  }
});

const cryptoSerializerShared = ({ cipherSettings, sjcl }) => {
  const makeKey = ({ getPassword, salt }) => {
    const { key } = sjcl.misc.cachedPbkdf2(getPassword(), {
      salt,
      iter: cipherSettings.keyStrengthenFactor
    });
    key.slice(0, cipherSettings.keySize / 32);
    return key;
  };
  return Object.freeze({ makeKey });
};

const makePasswordState = () => {
  let m_password;
  return Object.freeze({
    hasPassword: () => !!m_password,
    setPassword: pw => { m_password = pw; },
    getPassword: () => m_password
  });
};

// const makeRandomWordsMaker =
//   sjcl =>
//   ({ words, paranoia }) =>
//   sjcl.random.randomWords(words, paranoia);

// const makeSerializeParams =
//   ({ makeRandomWords, cipherSettings }) =>
// Object.freeze({
//   adata: '',
//   iter: cipherSettings.keyStrengthenFactor,
//   mode: cipherSettings.cipherMode,
//   ts  : 64,
//   ks  : cipherSettings.keySize,
//   iv  : makeRandomWords(cipherSettings.iv)
// });

const makeCryptoSerializer = ({ cipherSettings, sjcl, passwordState }) => {
  const makeRandomWords = ({ words, paranoia }) =>
    sjcl.random.randomWords(words, paranoia);

  const m_serializeParams = Object.freeze({
    adata: '',
    iter: cipherSettings.keyStrengthenFactor,
    mode: cipherSettings.cipherMode,
    ts  : 64,
    ks  : cipherSettings.keySize,
    iv  : makeRandomWords(cipherSettings.iv)
  });

  const { makeKey } = cryptoSerializerShared({ cipherSettings, sjcl });
  const serialize = htmlStr => {
    if (!hasPassword()) {
      return Left('No password was set.');
    }
    const salt = makeRandomWords(cipherSettings.salt);
    const outstr = sjcl.encrypt(
      makeKey({ getPassword, salt }), htmlStr, m_serializeParams, {});
    return Right(`${outstr.substr(0, outstr.length - 1)},"salt":"` +
                 `${sjcl.codec.base64.fromBits(salt)}"}`           );
  };

  const { setPassword, hasPassword, getPassword } = passwordState;

  return Object.freeze({
    hasPassword,
    serialize,
    setPassword
  });
};

const makeCryptoDeserializer = ({ sjcl, passwordState }) => {
  const initiallyVerifyJson = jsonTxt =>
    (() => {
      try {
        return Right(JSON.parse(jsonTxt));
      } catch(ex) {
        return Left('Cannot parse JSON text');
      }
    })().chain(cipherObj => {
      if (typeof cipherObj !== 'object') {
        return Left('JSON text must represent an object');
      } else if (typeof cipherObj.iv   !== 'string' ||
                 typeof cipherObj.salt !== 'string'   )
      {
        return Left('JSON iv/salt must be strings');
      }
      return Right(cipherObj);
    });

  const { setPassword, hasPassword, getPassword } = passwordState;

  const deserialize = jsonTxt =>
    initiallyVerifyJson(jsonTxt).map(cipherObj => {
      const salt = sjcl.codec.base64.toBits(cipherObj.salt);
      return sjcl.decrypt(makeKey({ getPassword, salt }), jsonTxt, {}, {});
    });

  return Object.freeze({
    setPassword,
    hasPassword,
    deserialize
  });
};

const makeBidirectionalCryptoSerializer = ({ serializer, deserializer }) => {
  const { deserialize } = deserializer;
  const { serialize, hasPassword } = serializer;
  const bothSides = [serializer, deserializer];
  const setPassword = (...args) =>
    bothSides.forEach(s => s.setPassword(...args));

  return Object.freeze({
    deserialize,
    serialize,
    hasPassword,
    setPassword
  });
};

const makeDefaultBidirectionalCryptoSerializer = ({ sjcl }) => {
  const serializerParams = {
    sjcl,
    passwordState: makePasswordState(),
    cipherSettings: kDefaultCipherSettings
  };
  return makeBidirectionalCryptoSerializer({
    serializer  : makeCryptoSerializer  (serializerParams),
    deserializer: makeCryptoDeserializer(serializerParams)
  });
};

return {
  front: {
    makeDefaultBidirectionalCryptoSerializer
  },
  back: {
    cryptoSerializerShared,
    makePasswordState,
    makeCryptoSerializer,
    makeCryptoDeserializer,
    makeBidirectionalCryptoSerializer,
  }
}

}) ());