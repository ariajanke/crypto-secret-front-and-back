const makeOrderer = () => {
  let m_calls = {};
  let m_call_count = 0;
  const makeFn = f => {
    const jestf = jest.fn((...args) => {
      m_calls[jestf.prototype.uniqueIdentifier].push(m_call_count);
      m_call_count++;
      return f(...args);
    });
    jestf.prototype.uniqueIdentifier = Symbol();
    m_calls[jestf.prototype.uniqueIdentifier] = [];
    return jestf;
  };
  const trackMocks = (...fnMocks) => {
    fnMocks.forEach(jestMockFn => {
      jestMockFn.prototype.uniqueIdentifier = Symbol();
      m_calls[jestMockFn.prototype.uniqueIdentifier] = [];
      const f = jestMockFn.getMockImplementation();
      jestMockFn.mockImplementation((...args) => {
        m_calls[jestf.prototype.uniqueIdentifier].push(m_call_count);
        m_call_count++;
        return f(...args);
      });
    });
  };
  const orderOf = a => b => {
    const aKey = a.prototype.uniqueIdentifier;
    const bKey = b.prototype.uniqueIdentifier;
    if (!m_calls[aKey] || !m_calls[bKey]) {
      throw 'Cannot use this matcher on functions not made with orderer';
    }

    if (m_calls[aKey].length === 0 ||
        m_calls[bKey].length === 0)
    { return false; }

    const aIdx = m_calls[aKey][0];
    const bIdx = m_calls[bKey][m_calls[bKey].length - 1];
    return aIdx < bIdx;
  };
  return { orderOf, makeFn, trackMocks };
};

const extendExpectWithToBeBefore = expect_ => {
  expect_.extend({ toBeBefore(before, after) {
    if (before(after)) {
      return {
        pass: true,
        message: () => `Expected a not to be called before b`
      }
    } else {
      return {
        pass: false,
        message: () => `Expected a to be called before b`
      }
    }
  } });
};

module.exports = {
  makeOrderer,
  extendExpectWithToBeBefore
};
