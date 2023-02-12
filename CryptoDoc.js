// basic auth is good enough
// db things:
// user docs... naming optional?
//
// how do I make my JS readable?
'use strict';
// do I really want to continue to use closure based objects?

// maybe this has safe guards against any old injection attacks...
const makeHtmlState = () => {
  let m_html;
  return Object.freeze({
    setHtml: html => { m_html = html },
    html: () => m_html
  });
};

// all connection things may need to be asynchronous
const makeFileConnection = fetch_ => Object.freeze({
  authenicate: ({ getPassword, getUserHandle }) =>
    fetch_('/authenication.json', {
      method: 'GET',
      body: JSON.stringify({
        password: getPassword(),
        user    : getUserHandle()
      })
    }),
  createFile: token =>
    fetch_('/documents.json', {
      method: 'POST',
      body  : JSON.stringify({ token })
    }),
  indexFiles: token =>
    fetch_('/documents.json', {
      method: 'GET',
      body  : JSON.stringify({ token })
    }),
  makeGetFile: token => filehandle =>
    fetch_(`/documents/${filehandle}.json`, {
      method: 'GET',
      body  : JSON.stringify({ token })
    }),
  makeUpdateFile: token => ({ filehandle, doc }) =>
    fetch_(`/documents/${filehandle}.json`, {
      method: 'PATCH',
      body  : JSON.stringify({ token, doc })
    }),
  makeDeleteFile: token => filehandle =>
    fetch_(`/documents/${filehandle}.json`, {
      method: 'DELETE',
      body  : JSON.stringify({ token })
    }),
});

// login
// enter creds ->
// onLoad
// index -> populate -> STOP
// open
// create
// delete
// save
// logoff

const makeConfirmMaker =
  targetEl =>
  ({ confirmed, cancelled }) =>
  () =>
{
  // show target element
  targetEl.toggleClass('hide');
  targetEl.children('.confirm').click(() => {
    confirmed();
    targetEl.toggleClass('hide');
  });
  targetEl.children('.cancel').click(() => {
    if (cancelled)
      { cancelled(); }
    targetEl.toggleClass('hide');
  });
};

const populateFileIndex = ({
  $, showIndexEl, files,
  makeOpenFileEvent, makeDeleteFileEvent, makeConfirm
}) => {
  showIndexEl.empty();
  files.forEach(fileInfo => {
    const newFileTile = $(```
      <div class="file">
        <div class="controls">
          <div class="open"></div>
          <div class="delete"></div>
        </div>
      </div>
    ```);
    showIndexEl.append(newFileTile);
    newFileTile.children('.open').
      click(makeOpenFileEvent(fileInfo.filehandle));
    newFileTile.children('.delete').
      click(makeConfirm({
        confirmed: makeDeleteFileEvent(fileInfo.filehandle)
      }));
  });
};

const makeEvents = ({ sjcl, $, htmlEl }) => {
  const connection = makeFileConnection(fetch);
  const htmlState = (() => ({
    html   : htmlEl.html,
    setHtml: content => htmlEl.html(content)
  }))();

  const documentController = (() => {
    const biserializer = makeDefaultBidirectionalCryptoSerializer({ sjcl });
    return makeCryptoDoc({ biserializer, connection, htmlState });
  })();

  const makeOpenFileEvent = documentStatusEl => filehandle =>
    () => documentController.loadFile(filehandle).
      then(() => {
        // indicate the file was loaded with no issue
        // where am I getting these strings from?!
        documentStatusEl.text('File loaded successfully');
      }).catch(error => {
        error;
        documentStatusEl;
      });

  const login =
    ({
       getPassword, getUserHandle,
       badCredsErrorEl, otherErrorEl, loginBoxEl, showIndexEl,
       documentStatusEl
    }) =>
    () =>
  {
    return connection.indexFiles({
      getPassword,
      getUserHandle
    }).then(response => {
      if (response.ok) {
        return response.json();
      } else if (response.status === 422) {
        // show: badCredsErrorEl
        badCredsErrorEl;
      } else {
        // show: otherErrorEl
        otherErrorEl;
      }
    }).then(json => {
      // hide loginBoxEl
      loginBoxEl;
      populateFileIndex({
        $, showIndexEl, files: json.files,
        makeOpenFileEvent, makeDeleteFileEvent, makeConfirm
      })
    }).catch(error => {
      error;
    });
  };
  const logout =
    ({ getPasswordEl, getUserHandleEl, loginBoxEl, showIndexEl }) =>
    () =>
  {
    ;
  };
  const create =
    () =>
    () =>
    {};
  return Object.freeze({ login, logout, create });
};

const events = makeEvents({ sjcl, $, htmlEl: $('#document') });

$('#login-button').click(events.login({
  getPassword: $('#login-box-pw').val,
  getUserHandle: $('#login-box-user-handle').val,
  badCredsErrorEl: $('#login-bad-creds')
}));

// routes html state between a connection and bidirectional serializer
const makeCryptoDoc = ({ biserializer, connection, htmlState }) => {
  const loadFile = filehandle =>
    connection.getFile(filehandle).
      then(data => biserializer.deserialize(data).toPromise()).
      then(setHtml);

  const saveFile = filehandle =>
    // a right here is a promise...
    biserializer.serialize(html()).
      toPromise().
      then(doc => connection.updateFile({ filehandle, doc }));

  const { html, setHtml } = htmlState;

  return Object.freeze({
    html,
    setHtml,
    loadFile,
    saveFile
  });
};

// const { asSerializer, isSerializer } = (() => {
//   const mustDefine = ['deserialize', 'serialize'];
//   const isSerializer = table => mustDefine.reduce((prev, cur) => prev && table[cur], true);
//   const asSerializer = table => {
//     if (isSerializer(table)) return;
//     throw 'Is not a serializer';
//   };
//   return { asSerializer, isSerializer };
// })();

// const makeUnprotectedSerializer = () => {
//   const serialize = htmlStr =>
//     JSON.stringify({ data: htmlStr.toString('base64') });
//   const deserialize = jsonObj =>
//     JSON.parse(jsonObj).data;
//   return asSerializer({ serialize, deserialize });
// };

// const kDefaultCipherSettings = Object.freeze({
//   keyStrengthenFactor: 1000,
//   keySize: 128,
//   cipherMode: 'ccm',
//   salt: {
//     words: 2,
//     paranoia: 0
//   },
//   iv: {
//     words: 4,
//     paranoia: 0
//   }
// });

// maybe serialize, deserialize is too much?

// const cryptoSerializerShared = ({ cipherSettings, sjcl }) => {
//   const makeKey = ({ getPassword, salt }) => {
//     let { key } = sjcl.misc.cachedPbkdf2(getPassword(), {
//       salt,
//       iter: cipherSettings.keyStrengthenFactor
//     });
//     key.slice(0, cipherSettings.keySize / 32);
//     return key;
//   };
//   return Object.freeze({ makeKey });
// };

// const makePasswordState = () => {
//   let m_password;
//   return Object.freeze({
//     hasPassword: () => !!m_password,
//     setPassword: pw => { m_password = pw; },
//     getPassword: () => m_password
//   });
// };

// const makeCryptoSerializer = ({ cipherSettings, sjcl, passwordState }) => {
//   const makeRandomWords = ({ words, paranoia }) =>
//     sjcl.random.randomWords(words, paranoia);

//   const makeSerializeParams = () => Object.freeze({
//     adata: '',
//     iter: cipherSettings.keyStrengthenFactor,
//     mode: cipherSettings.cipherMode,
//     ts  : 64,
//     ks  : cipherSettings.keySize,
//     iv  : makeRandomWords(cipherSettings.iv)
//   });

//   const { makeKey } = cryptoSerializerShared({ cipherSettings, sjcl });
//   const { errors, pushError } = makeErrorState();
//   const serialize = htmlStr => {
//     if (!m_password) {
//       return pushError('need a password to serialize');
//     }
//     const salt = makeRandomWords(cipherSettings.salt);
//     let outstr = sjcl.encrypt(
//       makeKey({ getPassword, salt }), htmlStr,
//       makeSerializeParams(), {});
//     return `${outstr.substr(0, outstr.length - 1)},"salt":"` +
//            `${sjcl.codec.base64.fromBits(salt)}"}`;
//   };

//   const { setPassword, hasPassword, getPassword } = passwordState;

//   return Object.freeze({
//     serialize,
//     setPassword,
//     hasPassword,
//     errors
//   });
// };

// const makeErrorState = () => {
//   let m_errors;

//   const pushError = errorTxt =>
//     { (m_errors ??= []).push(errorTxt); };

//   return Object.freeze({ errors: () => m_errors, pushError });
// };

// const makeCryptoDeserializer = ({ sjcl, passwordState }) => {
//   const { errors, pushError } = makeErrorState();

//   const initiallyVerifyJson = jsonTxt => {
//     const cipherObj = (() => {
//       try {
//         return JSON.parse(jsonTxt);
//       } catch(ex) {
//         pushError('Cannot parse JSON text');
//       }
//     })();
//     if (!cipherObj)
//       { return; }
//     if (typeof cipherObj !== 'object') {
//       return pushError('JSON text must represent an object');
//     } else if (typeof cipherObj.iv   !== 'string' ||
//                typeof cipherObj.salt !== 'string'   )
//     {
//       return pushError('JSON iv/salt must be strings');
//     }
//     return cipherObj;
//   };

//   const { setPassword, hasPassword, getPassword } = passwordState;

//   const deserialize = jsonTxt => {
//     // type checking params??
//     // this begs for TypeScript
//     const cipherObj = initiallyVerifyJson(jsonTxt);
//     const salt = sjcl.codec.base64.toBits(cipherObj.salt);
//     return sjcl.decrypt(makeKey({ getPassword, salt }), jsonTxt, {}, {});
//   };

//   return Object.freeze({
//     setPassword,
//     hasPassword,
//     deserialize,
//     errors
//   });
// };

// const makeBidirectionalCryptoSerializer = ({ serializer, deserializer }) => {
//   const { deserialize } = deserializer;
//   const { serialize, hasPassword } = serializer;
//   const bothSides = [serializer, deserializer];
//   const setPassword = (...args) =>
//     bothSides.forEach(s => s.setPassword(...args));

//   return asSerializer({
//     deserialize,
//     serialize,
//     hasPassword,
//     setPassword
//   });
// };

// const makeDefaultBidirectionalCryptoSerializer = ({ sjcl }) => {
//   const serializerParams = {
//     sjcl,
//     passwordState: makePasswordState(),
//     cipherSettings: kDefaultCipherSettings
//   };
//   return makeBidirectionalCryptoSerializer({
//     serializer  : makeCryptoSerializer  (serializerParams),
//     deserializer: makeCryptoDeserializer(serializerParams)
//   });
// };

module.exports = {
  makeHtmlState,
  makeCryptoDoc,
  makeCryptoDeserializer,
  makeCryptoSerializer,
  makeBidirectionalCryptoSerializer,
  makeDefaultBidirectionalCryptoSerializer
};
