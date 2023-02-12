## List of Libraries

### Frontend
- Monet.js (Either)
- Stanford Encryption JavaScript Library (sjcl)
- jQuery

### Backend
- Passport
- Passport basic HTTP
- Monet.js (Either)

## Library Dependancy Injections
Some libraries are "injected". In particular jQuery and sjcl. This is done to better enable mocking, as it maybe important to test the when and whats of calling to these library functions.

Monet's Either is different, as it would be too difficult/not helpful enough to inject everywhere. In particular the 'Right' and 'Left' function constructors.
