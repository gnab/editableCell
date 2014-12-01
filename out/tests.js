(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
require('should');
require('./test/ko/editableCellBindingTest.js');
require('./test/ko/editableCellSelectionBindingTest.js');
require('./test/utils.js');
},{"./test/ko/editableCellBindingTest.js":45,"./test/ko/editableCellSelectionBindingTest.js":46,"./test/utils.js":47,"should":26}],2:[function(require,module,exports){
// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// when used in node, this will actually load the util module we depend on
// versus loading the builtin util module as happens otherwise
// this is a bug in node module loading as far as I am concerned
var util = require('util/');

var pSlice = Array.prototype.slice;
var hasOwn = Object.prototype.hasOwnProperty;

// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  }
  else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = stackStartFunction.name;
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function replacer(key, value) {
  if (util.isUndefined(value)) {
    return '' + value;
  }
  if (util.isNumber(value) && (isNaN(value) || !isFinite(value))) {
    return value.toString();
  }
  if (util.isFunction(value) || util.isRegExp(value)) {
    return value.toString();
  }
  return value;
}

function truncate(s, n) {
  if (util.isString(s)) {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}

function getMessage(self) {
  return truncate(JSON.stringify(self.actual, replacer), 128) + ' ' +
         self.operator + ' ' +
         truncate(JSON.stringify(self.expected, replacer), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

function _deepEqual(actual, expected) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (util.isBuffer(actual) && util.isBuffer(expected)) {
    if (actual.length != expected.length) return false;

    for (var i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) return false;
    }

    return true;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (!util.isObject(actual) && !util.isObject(expected)) {
    return actual == expected;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b) {
  if (util.isNullOrUndefined(a) || util.isNullOrUndefined(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b);
  }
  try {
    var ka = objectKeys(a),
        kb = objectKeys(b),
        key, i;
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  } else if (actual instanceof expected) {
    return true;
  } else if (expected.call({}, actual) === true) {
    return true;
  }

  return false;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (util.isString(expected)) {
    message = expected;
    expected = null;
  }

  try {
    block();
  } catch (e) {
    actual = e;
  }

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  if (!shouldThrow && expectedException(actual, expected)) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [true].concat(pSlice.call(arguments)));
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/message) {
  _throws.apply(this, [false].concat(pSlice.call(arguments)));
};

assert.ifError = function(err) { if (err) {throw err;}};

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

},{"util/":11}],3:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('is-array')

exports.Buffer = Buffer
exports.SlowBuffer = Buffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192 // not used by this implementation

var kMaxLength = 0x3fffffff

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Note:
 *
 * - Implementation must support adding new properties to `Uint8Array` instances.
 *   Firefox 4-29 lacked support, fixed in Firefox 30+.
 *   See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *  - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *  - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *    incorrect length in some situations.
 *
 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they will
 * get the Object implementation, which is slower but will work correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = (function () {
  try {
    var buf = new ArrayBuffer(0)
    var arr = new Uint8Array(buf)
    arr.foo = function () { return 42 }
    return 42 === arr.foo() && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        new Uint8Array(1).subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
})()

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (subject, encoding, noZero) {
  if (!(this instanceof Buffer))
    return new Buffer(subject, encoding, noZero)

  var type = typeof subject

  // Find the length
  var length
  if (type === 'number')
    length = subject > 0 ? subject >>> 0 : 0
  else if (type === 'string') {
    if (encoding === 'base64')
      subject = base64clean(subject)
    length = Buffer.byteLength(subject, encoding)
  } else if (type === 'object' && subject !== null) { // assume object is array-like
    if (subject.type === 'Buffer' && isArray(subject.data))
      subject = subject.data
    length = +subject.length > 0 ? Math.floor(+subject.length) : 0
  } else
    throw new TypeError('must start with number, buffer, array or string')

  if (this.length > kMaxLength)
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
      'size: 0x' + kMaxLength.toString(16) + ' bytes')

  var buf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Preferred: Return an augmented `Uint8Array` instance for best performance
    buf = Buffer._augment(new Uint8Array(length))
  } else {
    // Fallback: Return THIS instance of Buffer (created by `new`)
    buf = this
    buf.length = length
    buf._isBuffer = true
  }

  var i
  if (Buffer.TYPED_ARRAY_SUPPORT && typeof subject.byteLength === 'number') {
    // Speed optimization -- use set if we're copying from a typed array
    buf._set(subject)
  } else if (isArrayish(subject)) {
    // Treat array-ish objects as a byte array
    if (Buffer.isBuffer(subject)) {
      for (i = 0; i < length; i++)
        buf[i] = subject.readUInt8(i)
    } else {
      for (i = 0; i < length; i++)
        buf[i] = ((subject[i] % 256) + 256) % 256
    }
  } else if (type === 'string') {
    buf.write(subject, 0, encoding)
  } else if (type === 'number' && !Buffer.TYPED_ARRAY_SUPPORT && !noZero) {
    for (i = 0; i < length; i++) {
      buf[i] = 0
    }
  }

  return buf
}

Buffer.isBuffer = function (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b))
    throw new TypeError('Arguments must be Buffers')

  var x = a.length
  var y = b.length
  for (var i = 0, len = Math.min(x, y); i < len && a[i] === b[i]; i++) {}
  if (i !== len) {
    x = a[i]
    y = b[i]
  }
  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function (list, totalLength) {
  if (!isArray(list)) throw new TypeError('Usage: Buffer.concat(list[, length])')

  if (list.length === 0) {
    return new Buffer(0)
  } else if (list.length === 1) {
    return list[0]
  }

  var i
  if (totalLength === undefined) {
    totalLength = 0
    for (i = 0; i < list.length; i++) {
      totalLength += list[i].length
    }
  }

  var buf = new Buffer(totalLength)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

Buffer.byteLength = function (str, encoding) {
  var ret
  str = str + ''
  switch (encoding || 'utf8') {
    case 'ascii':
    case 'binary':
    case 'raw':
      ret = str.length
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = str.length * 2
      break
    case 'hex':
      ret = str.length >>> 1
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8ToBytes(str).length
      break
    case 'base64':
      ret = base64ToBytes(str).length
      break
    default:
      ret = str.length
  }
  return ret
}

// pre-set for values that may exist in the future
Buffer.prototype.length = undefined
Buffer.prototype.parent = undefined

// toString(encoding, start=0, end=buffer.length)
Buffer.prototype.toString = function (encoding, start, end) {
  var loweredCase = false

  start = start >>> 0
  end = end === undefined || end === Infinity ? this.length : end >>> 0

  if (!encoding) encoding = 'utf8'
  if (start < 0) start = 0
  if (end > this.length) end = this.length
  if (end <= start) return ''

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase)
          throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.equals = function (b) {
  if(!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max)
      str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  return Buffer.compare(this, b)
}

// `get` will be removed in Node 0.13+
Buffer.prototype.get = function (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` will be removed in Node 0.13+
Buffer.prototype.set = function (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var byte = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(byte)) throw new Error('Invalid hex string')
    buf[offset + i] = byte
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  var charsWritten = blitBuffer(utf8ToBytes(string), buf, offset, length)
  return charsWritten
}

function asciiWrite (buf, string, offset, length) {
  var charsWritten = blitBuffer(asciiToBytes(string), buf, offset, length)
  return charsWritten
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  var charsWritten = blitBuffer(base64ToBytes(string), buf, offset, length)
  return charsWritten
}

function utf16leWrite (buf, string, offset, length) {
  var charsWritten = blitBuffer(utf16leToBytes(string), buf, offset, length)
  return charsWritten
}

Buffer.prototype.write = function (string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length
      length = undefined
    }
  } else {  // legacy
    var swap = encoding
    encoding = offset
    offset = length
    length = swap
  }

  offset = Number(offset) || 0
  var remaining = this.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase()

  var ret
  switch (encoding) {
    case 'hex':
      ret = hexWrite(this, string, offset, length)
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8Write(this, string, offset, length)
      break
    case 'ascii':
      ret = asciiWrite(this, string, offset, length)
      break
    case 'binary':
      ret = binaryWrite(this, string, offset, length)
      break
    case 'base64':
      ret = base64Write(this, string, offset, length)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = utf16leWrite(this, string, offset, length)
      break
    default:
      throw new TypeError('Unknown encoding: ' + encoding)
  }
  return ret
}

Buffer.prototype.toJSON = function () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  var res = ''
  var tmp = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    if (buf[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
      tmp = ''
    } else {
      tmp += '%' + buf[i].toString(16)
    }
  }

  return res + decodeUtf8Char(tmp)
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function binarySlice (buf, start, end) {
  return asciiSlice(buf, start, end)
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len;
    if (start < 0)
      start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0)
      end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start)
    end = start

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    return Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    var newBuf = new Buffer(sliceLen, undefined, true)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
    return newBuf
  }
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0)
    throw new RangeError('offset is not uint')
  if (offset + ext > length)
    throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUInt8 = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
      ((this[offset + 1] << 16) |
      (this[offset + 2] << 8) |
      this[offset + 3])
}

Buffer.prototype.readInt8 = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80))
    return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)

  return (this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16) |
      (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
      (this[offset + 1] << 16) |
      (this[offset + 2] << 8) |
      (this[offset + 3])
}

Buffer.prototype.readFloatLE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
  if (value > max || value < min) throw new TypeError('value is out of bounds')
  if (offset + ext > buf.length) throw new TypeError('index out of range')
}

Buffer.prototype.writeUInt8 = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = value
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else objectWriteUInt16(this, value, offset, true)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else objectWriteUInt16(this, value, offset, false)
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = value
  } else objectWriteUInt32(this, value, offset, true)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else objectWriteUInt32(this, value, offset, false)
  return offset + 4
}

Buffer.prototype.writeInt8 = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = value
  return offset + 1
}

Buffer.prototype.writeInt16LE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else objectWriteUInt16(this, value, offset, true)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else objectWriteUInt16(this, value, offset, false)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else objectWriteUInt32(this, value, offset, true)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else objectWriteUInt32(this, value, offset, false)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (value > max || value < min) throw new TypeError('value is out of bounds')
  if (offset + ext > buf.length) throw new TypeError('index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert)
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert)
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function (target, target_start, start, end) {
  var source = this

  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (!target_start) target_start = 0

  // Copy 0 bytes; we're done
  if (end === start) return
  if (target.length === 0 || source.length === 0) return

  // Fatal error conditions
  if (end < start) throw new TypeError('sourceEnd < sourceStart')
  if (target_start < 0 || target_start >= target.length)
    throw new TypeError('targetStart out of bounds')
  if (start < 0 || start >= source.length) throw new TypeError('sourceStart out of bounds')
  if (end < 0 || end > source.length) throw new TypeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length)
    end = this.length
  if (target.length - target_start < end - start)
    end = target.length - target_start + start

  var len = end - start

  if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < len; i++) {
      target[i + target_start] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), target_start)
  }
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (end < start) throw new TypeError('end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  if (start < 0 || start >= this.length) throw new TypeError('start out of bounds')
  if (end < 0 || end > this.length) throw new TypeError('end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1) {
        buf[i] = this[i]
      }
      return buf.buffer
    }
  } else {
    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function (arr) {
  arr.constructor = Buffer
  arr._isBuffer = true

  // save reference to original Uint8Array get/set methods before overwriting
  arr._get = arr.get
  arr._set = arr.set

  // deprecated, will be removed in node 0.13+
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.equals = BP.equals
  arr.compare = BP.compare
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

var INVALID_BASE64_RE = /[^+\/0-9A-z]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function isArrayish (subject) {
  return isArray(subject) || Buffer.isBuffer(subject) ||
      subject && typeof subject === 'object' &&
      typeof subject.length === 'number'
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    var b = str.charCodeAt(i)
    if (b <= 0x7F) {
      byteArray.push(b)
    } else {
      var start = i
      if (b >= 0xD800 && b <= 0xDFFF) i++
      var h = encodeURIComponent(str.slice(start, i+1)).substr(1).split('%')
      for (var j = 0; j < h.length; j++) {
        byteArray.push(parseInt(h[j], 16))
      }
    }
  }
  return byteArray
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(str)
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length))
      break
    dst[i + offset] = src[i]
  }
  return i
}

function decodeUtf8Char (str) {
  try {
    return decodeURIComponent(str)
  } catch (err) {
    return String.fromCharCode(0xFFFD) // UTF 8 invalid char
  }
}

},{"base64-js":4,"ieee754":5,"is-array":6}],4:[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS)
			return 62 // '+'
		if (code === SLASH)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],5:[function(require,module,exports){
exports.read = function(buffer, offset, isLE, mLen, nBytes) {
  var e, m,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      nBits = -7,
      i = isLE ? (nBytes - 1) : 0,
      d = isLE ? -1 : 1,
      s = buffer[offset + i];

  i += d;

  e = s & ((1 << (-nBits)) - 1);
  s >>= (-nBits);
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8);

  m = e & ((1 << (-nBits)) - 1);
  e >>= (-nBits);
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8);

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity);
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
};

exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
      i = isLE ? 0 : (nBytes - 1),
      d = isLE ? 1 : -1,
      s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8);

  e = (e << mLen) | m;
  eLen += mLen;
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8);

  buffer[offset + i - d] |= s * 128;
};

},{}],6:[function(require,module,exports){

/**
 * isArray
 */

var isArray = Array.isArray;

/**
 * toString
 */

var str = Object.prototype.toString;

/**
 * Whether or not the given `val`
 * is an array.
 *
 * example:
 *
 *        isArray([]);
 *        // > true
 *        isArray(arguments);
 *        // > false
 *        isArray('');
 *        // > false
 *
 * @param {mixed} val
 * @return {bool}
 */

module.exports = isArray || function (val) {
  return !! val && '[object Array]' == str.call(val);
};

},{}],7:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],8:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],9:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canMutationObserver = typeof window !== 'undefined'
    && window.MutationObserver;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    var queue = [];

    if (canMutationObserver) {
        var hiddenDiv = document.createElement("div");
        var observer = new MutationObserver(function () {
            var queueList = queue.slice();
            queue.length = 0;
            queueList.forEach(function (fn) {
                fn();
            });
        });

        observer.observe(hiddenDiv, { attributes: true });

        return function nextTick(fn) {
            if (!queue.length) {
                hiddenDiv.setAttribute('yes', 'no');
            }
            queue.push(fn);
        };
    }

    if (canPost) {
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],10:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],11:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":10,"_process":9,"inherits":8}],12:[function(require,module,exports){
module.exports=require(8)
},{"/Users/john/repos/editableCell/node_modules/browserify/node_modules/inherits/inherits_browser.js":8}],13:[function(require,module,exports){
// copy that inside
module.exports = require('./util').AssertionError;
},{"./util":27}],14:[function(require,module,exports){
var AssertionError = require('./assertion-error');
var util = require('./util');

function Assertion(obj, format) {
  this.obj = obj;
  this.format = format;
}

/**
 Way to extend Assertion function. It uses some logic
 to define only positive assertions and itself rule with negative assertion.

 All actions happen in subcontext and this method take care about negation.
 Potentially we can add some more modifiers that does not depends from state of assertion.
 */
Assertion.add = function(name, f, isGetter) {
  var prop = {enumerable: true};
  prop[isGetter ? 'get' : 'value'] = function() {
    var context = new Assertion(this.obj, this.format);
    context.anyOne = this.anyOne;

    try {
      f.apply(context, arguments);
    } catch(e) {
      //copy data from sub context to this
      this.params = context.params;

      //check for fail
      if(e instanceof AssertionError) {
        //negative fail
        if(this.negate) {
          this.obj = context.obj;
          this.negate = false;
          return this;
        }

        this.nestedErrorMessage = e.message;
        //positive fail
        this.fail();
      }
      // throw if it is another exception
      throw e;
    }
    //copy data from sub context to this
    this.params = context.params;

    //negative pass
    if(this.negate) {

      context.negate = true;
      this.nestedErrorMessage = context.params.message ? context.params.message : context.getMessage();
      this.fail();
    }

    this.obj = context.obj;
    this.negate = false;

    //positive pass
    return this;
  };

  Object.defineProperty(Assertion.prototype, name, prop);
};

Assertion.alias = function(from, to) {
  var desc = Object.getOwnPropertyDescriptor(Assertion.prototype, from);
  if(!desc) throw new Error('Alias ' + from + ' -> ' + to + ' could not be created as ' + from + ' not defined');
  Object.defineProperty(Assertion.prototype, to, desc);
};

var indent = '    ';
function prependIndent(line) {
  return indent + line;
}

function indentLines(text) {
  return text.split('\n').map(prependIndent).join('\n');
}

Assertion.prototype = {
  constructor: Assertion,

  assert: function(expr) {
    if(expr) return this;

    var params = this.params;

    var msg = params.message, generatedMessage = false;
    if(!msg) {
      msg = this.getMessage();
      generatedMessage = true;
    }

    if(this.nestedErrorMessage && msg != this.nestedErrorMessage) {
      msg = msg + '\n' +indentLines(this.nestedErrorMessage);
    }

    var err = new AssertionError({
      message: msg,
      actual: this.obj,
      expected: params.expected,
      stackStartFunction: this.assert
    });

    err.showDiff = params.showDiff;
    err.operator = params.operator;
    err.generatedMessage = generatedMessage;

    throw err;
  },

  fail: function() {
    return this.assert(false);
  },

  getMessage: function() {
    var actual = 'obj' in this.params ? this.format(this.params.obj) : this.format(this.obj);
    var expected = 'expected' in this.params ? ' ' + this.format(this.params.expected) : '';
    var details = 'details' in this.params && this.params.details ? ' (' + this.params.details + ')': '';

    return 'expected ' + actual + (this.negate ? ' not ' : ' ') + this.params.operator + expected + details;
  },


  /**
   * Negation modifier.
   *
   * @api public
   */

  get not() {
    this.negate = !this.negate;
    return this;
  },

  /**
   * Any modifier - it affect on execution of sequenced assertion to do not check all, but any of
   *
   * @api public
   */
  get any() {
    this.anyOne = true;
    return this;
  }
};

module.exports = Assertion;
},{"./assertion-error":13,"./util":27}],15:[function(require,module,exports){
/*!
 * Should
 * Copyright(c) 2010-2014 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

var util = require('../util')
  , assert = require('assert')
  , AssertionError = assert.AssertionError;

module.exports = function(should) {
  var i = should.format;

  /**
   * Expose assert to should
   *
   * This allows you to do things like below
   * without require()ing the assert module.
   *
   *    should.equal(foo.bar, undefined);
   *
   */
  util.merge(should, assert);

  /**
   * Assert _obj_ exists, with optional message.
   *
   * @param {*} obj
   * @param {String} [msg]
   * @api public
   */
  should.exist = should.exists = function(obj, msg) {
    if(null == obj) {
      throw new AssertionError({
        message: msg || ('expected ' + i(obj) + ' to exist'), stackStartFunction: should.exist
      });
    }
  };

  /**
   * Asserts _obj_ does not exist, with optional message.
   *
   * @param {*} obj
   * @param {String} [msg]
   * @api public
   */

  should.not = {};
  should.not.exist = should.not.exists = function(obj, msg) {
    if(null != obj) {
      throw new AssertionError({
        message: msg || ('expected ' + i(obj) + ' to not exist'), stackStartFunction: should.not.exist
      });
    }
  };
};
},{"../util":27,"assert":2}],16:[function(require,module,exports){
/*!
 * Should
 * Copyright(c) 2010-2014 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

module.exports = function(should, Assertion) {
  Assertion.add('true', function() {
    this.is.exactly(true);
  }, true);

  Assertion.alias('true', 'True');

  Assertion.add('false', function() {
    this.is.exactly(false);
  }, true);

  Assertion.alias('false', 'False');

  Assertion.add('ok', function() {
    this.params = { operator: 'to be truthy' };

    this.assert(this.obj);
  }, true);
};
},{}],17:[function(require,module,exports){
/*!
 * Should
 * Copyright(c) 2010-2014 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

module.exports = function(should, Assertion) {

  function addLink(name) {
    Object.defineProperty(Assertion.prototype, name, {
      get: function() {
        return this;
      },
      enumerable: true
    });
  }

  ['an', 'of', 'a', 'and', 'be', 'have', 'with', 'is', 'which', 'the'].forEach(addLink);
};
},{}],18:[function(require,module,exports){
/*!
 * Should
 * Copyright(c) 2010-2014 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

var util = require('../util'),
  eql = require('should-equal');

module.exports = function(should, Assertion) {
  var i = should.format;

  Assertion.add('containEql', function(other) {
    this.params = { operator: 'to contain ' + i(other) };
    var obj = this.obj;
    if(util.isArray(obj)) {
      this.assert(obj.some(function(item) {
        return eql(item, other).result;
      }));
    } else if(util.isString(obj)) {
      // expect obj to be string
      this.assert(obj.indexOf(String(other)) >= 0);
    } else if(util.isObject(obj)) {
      // object contains object case
      util.forOwn(other, function(value, key) {
        obj.should.have.property(key, value);
      });
    } else {
      //other uncovered cases
      this.assert(false);
    }
  });

  Assertion.add('containDeepOrdered', function(other) {
    this.params = { operator: 'to contain ' + i(other) };

    var obj = this.obj;
    if(util.isArray(obj)) {
      if(util.isArray(other)) {
        var otherIdx = 0;
        obj.forEach(function(item) {
          try {
            should(item).not.be.Null.and.containDeep(other[otherIdx]);
            otherIdx++;
          } catch(e) {
            if(e instanceof should.AssertionError) {
              return;
            }
            throw e;
          }
        }, this);

        this.assert(otherIdx == other.length);
        //search array contain other as sub sequence
      } else {
        this.assert(false);
      }
    } else if(util.isString(obj)) {// expect other to be string
      this.assert(obj.indexOf(String(other)) >= 0);
    } else if(util.isObject(obj)) {// object contains object case
      if(util.isObject(other)) {
        util.forOwn(other, function(value, key) {
          should(obj[key]).not.be.Null.and.containDeep(value);
        });
      } else {//one of the properties contain value
        this.assert(false);
      }
    } else {
      this.eql(other);
    }
  });

  Assertion.add('containDeep', function(other) {
    this.params = { operator: 'to contain ' + i(other) };

    var obj = this.obj;
    if(util.isArray(obj)) {
      if(util.isArray(other)) {
        var usedKeys = {};
        other.forEach(function(otherItem) {
          this.assert(obj.some(function(item, index) {
            if(index in usedKeys) return false;

            try {
              should(item).not.be.Null.and.containDeep(otherItem);
              usedKeys[index] = true;
              return true;
            } catch(e) {
              if(e instanceof should.AssertionError) {
                return false;
              }
              throw e;
            }
          }));
        }, this);

      } else {
        this.assert(false);
      }
    } else if(util.isString(obj)) {// expect other to be string
      this.assert(obj.indexOf(String(other)) >= 0);
    } else if(util.isObject(obj)) {// object contains object case
      if(util.isObject(other)) {
        util.forOwn(other, function(value, key) {
          should(obj[key]).not.be.Null.and.containDeep(value);
        });
      } else {//one of the properties contain value
        this.assert(false);
      }
    } else {
      this.eql(other);
    }
  });

};

},{"../util":27,"should-equal":29}],19:[function(require,module,exports){
/*!
 * Should
 * Copyright(c) 2010-2014 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

var eql = require('should-equal');
var warn = require('../warn');

var util = require('../util');

module.exports = function(should, Assertion) {
  Assertion.add('eql', function(val, description) {
    this.params = {operator: 'to equal', expected: val, showDiff: true, message: description};

    var strictResult = eql(this.obj, val);

    if(!strictResult.result) {
      this.params.details = util.formatEqlResult(strictResult, this.obj, val, should.format);
    }

    this.assert(strictResult.result);
  });

  Assertion.add('equal', function(val, description) {
    this.params = {operator: 'to be', expected: val, showDiff: true, message: description};

    this.assert(val === this.obj);
  });

  Assertion.alias('equal', 'exactly');
};
},{"../util":27,"../warn":28,"should-equal":29}],20:[function(require,module,exports){
/*!
 * Should
 * Copyright(c) 2010-2014 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */
var util = require('../util');

module.exports = function(should, Assertion) {
  var i = should.format;

  Assertion.add('throw', function(message, properties) {
    var fn = this.obj
      , err = {}
      , errorInfo = ''
      , thrown = false;

    var errorMatched = true;

    try {
      fn();
    } catch(e) {
      thrown = true;
      err = e;
    }

    if(thrown) {
      if(message) {
        if('string' == typeof message) {
          errorMatched = message == err.message;
        } else if(message instanceof RegExp) {
          errorMatched = message.test(err.message);
        } else if('function' == typeof message) {
          errorMatched = err instanceof message;
        } else if(util.isObject(message)) {
          try {
            err.should.match(message);
          } catch(e) {
            if(e instanceof should.AssertionError) {
              errorInfo = ": " + e.message;
              errorMatched = false;
            } else {
              throw e;
            }
          }
        }

        if(!errorMatched) {
          if('string' == typeof message || message instanceof RegExp) {
            errorInfo = " with a message matching " + i(message) + ", but got '" + err.message + "'";
          } else if('function' == typeof message) {
            errorInfo = " of type " + util.functionName(message) + ", but got " + util.functionName(err.constructor);
          }
        } else if('function' == typeof message && properties) {
          try {
            err.should.match(properties);
          } catch(e) {
            if(e instanceof should.AssertionError) {
              errorInfo = ": " + e.message;
              errorMatched = false;
            } else {
              throw e;
            }
          }
        }
      } else {
        errorInfo = " (got " + i(err) + ")";
      }
    }

    this.params = { operator: 'to throw exception' + errorInfo };

    this.assert(thrown);
    this.assert(errorMatched);
  });

  Assertion.alias('throw', 'throwError');
};
},{"../util":27}],21:[function(require,module,exports){
/*!
 * Should
 * Copyright(c) 2010-2014 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

var util = require('../util'),
  eql = require('should-equal');

module.exports = function(should, Assertion) {
  var i = should.format;

  Assertion.add('match', function(other, description) {
    this.params = {operator: 'to match ' + i(other), message: description};

    if(!eql(this.obj, other).result) {
      if(util.isRegExp(other)) { // something - regex

        if(util.isString(this.obj)) {

          this.assert(other.exec(this.obj));
        } else if(util.isArray(this.obj)) {

          this.obj.forEach(function(item) {
            this.assert(other.exec(item));// should we try to convert to String and exec?
          }, this);
        } else if(util.isObject(this.obj)) {

          var notMatchedProps = [], matchedProps = [];
          util.forOwn(this.obj, function(value, name) {
            if(other.exec(value)) matchedProps.push(util.formatProp(name));
            else notMatchedProps.push(util.formatProp(name) + ' (' + i(value) + ')');
          }, this);

          if(notMatchedProps.length)
            this.params.operator += '\n    not matched properties: ' + notMatchedProps.join(', ');
          if(matchedProps.length)
            this.params.operator += '\n    matched properties: ' + matchedProps.join(', ');

          this.assert(notMatchedProps.length == 0);
        } // should we try to convert to String and exec?
      } else if(util.isFunction(other)) {
        var res;

        res = other(this.obj);

        if(res instanceof Assertion) {
          this.params.operator += '\n    ' + res.getMessage();
        }

        //if we throw exception ok - it is used .should inside
        if(util.isBoolean(res)) {
          this.assert(res); // if it is just boolean function assert on it
        }
      } else if(util.isObject(other)) { // try to match properties (for Object and Array)
        notMatchedProps = [];
        matchedProps = [];

        util.forOwn(other, function(value, key) {
          try {
            should(this.obj[key]).match(value);
            matchedProps.push(util.formatProp(key));
          } catch(e) {
            if(e instanceof should.AssertionError) {
              notMatchedProps.push(util.formatProp(key) + ' (' + i(this.obj[key]) + ')');
            } else {
              throw e;
            }
          }
        }, this);

        if(notMatchedProps.length)
          this.params.operator += '\n    not matched properties: ' + notMatchedProps.join(', ');
        if(matchedProps.length)
          this.params.operator += '\n    matched properties: ' + matchedProps.join(', ');

        this.assert(notMatchedProps.length == 0);
      } else {
        this.assert(false);
      }
    }
  });

  Assertion.add('matchEach', function(other, description) {
    this.params = {operator: 'to match each ' + i(other), message: description};

    var f = other;

    if(util.isRegExp(other))
      f = function(it) {
        return !!other.exec(it);
      };
    else if(!util.isFunction(other))
      f = function(it) {
        return eql(it, other).result;
      };

    util.forOwn(this.obj, function(value, key) {
      var res = f(value, key);

      //if we throw exception ok - it is used .should inside
      if(util.isBoolean(res)) {
        this.assert(res); // if it is just boolean function assert on it
      }
    }, this);
  });
};
},{"../util":27,"should-equal":29}],22:[function(require,module,exports){
/*!
 * Should
 * Copyright(c) 2010-2014 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

module.exports = function(should, Assertion) {
  Assertion.add('NaN', function() {
    this.params = { operator: 'to be NaN' };

    this.assert(this.obj !== this.obj);
  }, true);

  Assertion.add('Infinity', function() {
    this.params = { operator: 'to be Infinity' };

    this.obj.should.be.a.Number
      .and.not.a.NaN
      .and.assert(!isFinite(this.obj));
  }, true);

  Assertion.add('within', function(start, finish, description) {
    this.params = { operator: 'to be within ' + start + '..' + finish, message: description };

    this.assert(this.obj >= start && this.obj <= finish);
  });

  Assertion.add('approximately', function(value, delta, description) {
    this.params = { operator: 'to be approximately ' + value + " ±" + delta, message: description };

    this.assert(Math.abs(this.obj - value) <= delta);
  });

  Assertion.add('above', function(n, description) {
    this.params = { operator: 'to be above ' + n, message: description };

    this.assert(this.obj > n);
  });

  Assertion.add('below', function(n, description) {
    this.params = { operator: 'to be below ' + n, message: description };

    this.assert(this.obj < n);
  });

  Assertion.alias('above', 'greaterThan');
  Assertion.alias('below', 'lessThan');

};

},{}],23:[function(require,module,exports){
/*!
 * Should
 * Copyright(c) 2010-2014 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

var util = require('../util'),
  eql = require('should-equal');

var aSlice = Array.prototype.slice;

module.exports = function(should, Assertion) {
  var i = should.format;

  Assertion.add('enumerable', function(name, val) {
    name = String(name);

    this.params = {
      operator: "to have enumerable property " + util.formatProp(name)
    };

    this.assert(this.obj.propertyIsEnumerable(name));

    if(arguments.length > 1) {
      this.params.operator += " equal to " + i(val);
      this.assert(eql(val, this.obj[name]).result);
    }
  });

  Assertion.add('property', function(name, val) {
    name = String(name);
    if(arguments.length > 1) {
      var p = {};
      p[name] = val;
      this.have.properties(p);
    } else {
      this.have.properties(name);
    }
    this.obj = this.obj[name];
  });

  Assertion.add('properties', function(names) {
    var values = {};
    if(arguments.length > 1) {
      names = aSlice.call(arguments);
    } else if(!util.isArray(names)) {
      if(util.isString(names)) {
        names = [names];
      } else {
        values = names;
        names = Object.keys(names);
      }
    }

    var obj = Object(this.obj), missingProperties = [];

    //just enumerate properties and check if they all present
    names.forEach(function(name) {
      if(!(name in obj)) missingProperties.push(util.formatProp(name));
    });

    var props = missingProperties;
    if(props.length === 0) {
      props = names.map(util.formatProp);
    } else if(this.anyOne) {
      props = names.filter(function(name) {
        return missingProperties.indexOf(util.formatProp(name)) < 0;
      }).map(util.formatProp);
    }

    var operator = (props.length === 1 ?
        'to have property ' : 'to have ' + (this.anyOne ? 'any of ' : '') + 'properties ') + props.join(', ');

    this.params = {obj: this.obj, operator: operator};

    //check that all properties presented
    //or if we request one of them that at least one them presented
    this.assert(missingProperties.length === 0 || (this.anyOne && missingProperties.length != names.length));

    // check if values in object matched expected
    var valueCheckNames = Object.keys(values);
    if(valueCheckNames.length) {
      var wrongValues = [];
      props = [];

      // now check values, as there we have all properties
      valueCheckNames.forEach(function(name) {
        var value = values[name];
        if(!eql(obj[name], value).result) {
          wrongValues.push(util.formatProp(name) + ' of ' + i(value) + ' (got ' + i(obj[name]) + ')');
        } else {
          props.push(util.formatProp(name) + ' of ' + i(value));
        }
      });

      if((wrongValues.length !== 0 && !this.anyOne) || (this.anyOne && props.length === 0)) {
        props = wrongValues;
      }

      operator = (props.length === 1 ?
        'to have property ' : 'to have ' + (this.anyOne ? 'any of ' : '') + 'properties ') + props.join(', ');

      this.params = {obj: this.obj, operator: operator};

      //if there is no not matched values
      //or there is at least one matched
      this.assert(wrongValues.length === 0 || (this.anyOne && wrongValues.length != valueCheckNames.length));
    }
  });

  Assertion.add('length', function(n, description) {
    this.have.property('length', n, description);
  });

  Assertion.alias('length', 'lengthOf');

  var hasOwnProperty = Object.prototype.hasOwnProperty;

  Assertion.add('ownProperty', function(name, description) {
    name = String(name);
    this.params = {
      obj: this.obj,
      operator: 'to have own property ' + util.formatProp(name),
      message: description
    };

    this.assert(hasOwnProperty.call(this.obj, name));

    this.obj = this.obj[name];
  });

  Assertion.alias('ownProperty', 'hasOwnProperty');

  Assertion.add('empty', function() {
    this.params = {operator: 'to be empty'};

    if(util.isString(this.obj) || util.isArray(this.obj) || util.isArguments(this.obj)) {
      this.obj.should.have.property('length', 0);
    } else {
      var obj = Object(this.obj); // wrap to reference for booleans and numbers
      for(var prop in obj) {
        this.obj.should.not.ownProperty(prop);
      }
    }
  }, true);

  Assertion.add('keys', function(keys) {
    if(arguments.length > 1) keys = aSlice.call(arguments);
    else if(arguments.length === 1 && util.isString(keys)) keys = [keys];
    else if(arguments.length === 0) keys = [];

    keys = keys.map(String);

    var obj = Object(this.obj);

    // first check if some keys are missing
    var missingKeys = [];
    keys.forEach(function(key) {
      if(!hasOwnProperty.call(this.obj, key))
        missingKeys.push(util.formatProp(key));
    }, this);

    // second check for extra keys
    var extraKeys = [];
    Object.keys(obj).forEach(function(key) {
      if(keys.indexOf(key) < 0) {
        extraKeys.push(util.formatProp(key));
      }
    });

    var verb = keys.length === 0 ? 'to be empty' :
    'to have ' + (keys.length === 1 ? 'key ' : 'keys ');

    this.params = {operator: verb + keys.map(util.formatProp).join(', ')};

    if(missingKeys.length > 0)
      this.params.operator += '\n\tmissing keys: ' + missingKeys.join(', ');

    if(extraKeys.length > 0)
      this.params.operator += '\n\textra keys: ' + extraKeys.join(', ');

    this.assert(missingKeys.length === 0 && extraKeys.length === 0);
  });

  Assertion.alias("keys", "key");

  Assertion.add('propertyByPath', function(properties) {
    if(arguments.length > 1) properties = aSlice.call(arguments);
    else if(arguments.length === 1 && util.isString(properties)) properties = [properties];
    else if(arguments.length === 0) properties = [];

    var allProps = properties.map(util.formatProp);

    properties = properties.map(String);

    var obj = should(Object(this.obj));

    var foundProperties = [];

    var currentProperty;
    while(currentProperty = properties.shift()) {
      this.params = {operator: 'to have property by path ' + allProps.join(', ') + ' - failed on ' + util.formatProp(currentProperty)};
      obj = obj.have.property(currentProperty);
      foundProperties.push(currentProperty);
    }

    this.params = {obj: this.obj, operator: 'to have property by path ' + allProps.join(', ')};

    this.obj = obj.obj;
  });
};

},{"../util":27,"should-equal":29}],24:[function(require,module,exports){
/*!
 * Should
 * Copyright(c) 2010-2014 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

module.exports = function(should, Assertion) {
  Assertion.add('startWith', function(str, description) {
    this.params = { operator: 'to start with ' + should.format(str), message: description };

    this.assert(0 === this.obj.indexOf(str));
  });

  Assertion.add('endWith', function(str, description) {
    this.params = { operator: 'to end with ' + should.format(str), message: description };

    this.assert(this.obj.indexOf(str, this.obj.length - str.length) >= 0);
  });
};
},{}],25:[function(require,module,exports){
/*!
 * Should
 * Copyright(c) 2010-2014 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

var util = require('../util');

module.exports = function(should, Assertion) {
  Assertion.add('Number', function() {
    this.params = { operator: 'to be a number' };

    this.assert(util.isNumber(this.obj));
  }, true);

  Assertion.add('arguments', function() {
    this.params = { operator: 'to be arguments' };

    this.assert(util.isArguments(this.obj));
  }, true);

  Assertion.add('type', function(type, description) {
    this.params = { operator: 'to have type ' + type, message: description };

    (typeof this.obj).should.be.exactly(type, description);
  });

  Assertion.add('instanceof', function(constructor, description) {
    this.params = { operator: 'to be an instance of ' + util.functionName(constructor), message: description };

    this.assert(Object(this.obj) instanceof constructor);
  });

  Assertion.add('Function', function() {
    this.params = { operator: 'to be a function' };

    this.assert(util.isFunction(this.obj));
  }, true);

  Assertion.add('Object', function() {
    this.params = { operator: 'to be an object' };

    this.assert(util.isObject(this.obj));
  }, true);

  Assertion.add('String', function() {
    this.params = { operator: 'to be a string' };

    this.assert(util.isString(this.obj));
  }, true);

  Assertion.add('Array', function() {
    this.params = { operator: 'to be an array' };

    this.assert(util.isArray(this.obj));
  }, true);

  Assertion.add('Boolean', function() {
    this.params = { operator: 'to be a boolean' };

    this.assert(util.isBoolean(this.obj));
  }, true);

  Assertion.add('Error', function() {
    this.params = { operator: 'to be an error' };

    this.assert(util.isError(this.obj));
  }, true);

  Assertion.add('null', function() {
    this.params = { operator: 'to be null' };

    this.assert(this.obj === null);
  }, true);

  Assertion.alias('null', 'Null');

  Assertion.alias('instanceof', 'instanceOf');
};

},{"../util":27}],26:[function(require,module,exports){
(function (process){
/*!
 * Should
 * Copyright(c) 2010-2014 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */


var util = require('./util');
var inspect = require('should-format');
var warn = require('./warn');

/**
 * Our function should
 * @param obj
 * @returns {should.Assertion}
 */
var should = function should(obj) {
  warn.staticShouldUnWrap(util.isWrapperType(obj) && should.warn);

  var unwrappedObj = util.isWrapperType(obj) ? obj.valueOf() : obj;
  return new should.Assertion(unwrappedObj, should.format);
};

var envVarName = 'SHOULDJS_WARN';
var envVarResult = typeof process !== 'undefined' && process.env[envVarName] && process.env[envVarName] === 'true';
should.warn = typeof envVarResult == 'undefined' ? true: envVarResult;

should.AssertionError = require('./assertion-error');
should.Assertion = require('./assertion');

should.format = inspect;

/**
 * Expose should to external world.
 */
exports = module.exports = should;

should.extend = function(propertyName, proto) {
  propertyName = propertyName || 'should';
  proto = proto || Object.prototype;

  Object.defineProperty(proto, propertyName, {
    set: function() {
    },
    get: function() {
      return should(util.isWrapperType(this) ? this.valueOf() : this);
    },
    configurable: true
  });
};

/**
 * Expose api via `Object#should`.
 *
 * @api public
 */
should.extend('should', Object.prototype);

should.use = function(f) {
  f(this, this.Assertion);
  return this;
};

should
  .use(require('./ext/assert'))
  .use(require('./ext/chain'))
  .use(require('./ext/bool'))
  .use(require('./ext/number'))
  .use(require('./ext/eql'))
  .use(require('./ext/type'))
  .use(require('./ext/string'))
  .use(require('./ext/property'))
  .use(require('./ext/error'))
  .use(require('./ext/match'))
  .use(require('./ext/contain'));

}).call(this,require('_process'))
},{"./assertion":14,"./assertion-error":13,"./ext/assert":15,"./ext/bool":16,"./ext/chain":17,"./ext/contain":18,"./ext/eql":19,"./ext/error":20,"./ext/match":21,"./ext/number":22,"./ext/property":23,"./ext/string":24,"./ext/type":25,"./util":27,"./warn":28,"_process":9,"should-format":31}],27:[function(require,module,exports){
(function (Buffer){
/*!
 * Should
 * Copyright(c) 2010-2014 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Check if given obj just a primitive type wrapper
 * @param {Object} obj
 * @returns {boolean}
 * @api private
 */
exports.isWrapperType = function(obj) {
  return obj instanceof Number || obj instanceof String || obj instanceof Boolean;
};

/**
 * Merge object b with object a.
 *
 *     var a = { foo: 'bar' }
 *       , b = { bar: 'baz' };
 *
 *     utils.merge(a, b);
 *     // => { foo: 'bar', bar: 'baz' }
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Object}
 * @api private
 */

exports.merge = function(a, b) {
  if(a && b) {
    for(var key in b) {
      a[key] = b[key];
    }
  }
  return a;
};

function isArray(arr) {
  return isObject(arr) && (arr.__ArrayLike || Array.isArray(arr));
}

exports.isArray = isArray;

function isNumber(arg) {
  return typeof arg === 'number';
}

exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

exports.isString = isString;

function isBuffer(arg) {
  return typeof Buffer !== 'undefined' && arg instanceof Buffer;
}

exports.isBuffer = isBuffer;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}

exports.isDate = isDate;

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

exports.isObject = isObject;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}

exports.isRegExp = isRegExp;

function isNullOrUndefined(arg) {
  return arg == null;
}

exports.isNullOrUndefined = isNullOrUndefined;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isArguments(object) {
  return objectToString(object) === '[object Arguments]';
}

exports.isArguments = isArguments;

exports.isFunction = function(arg) {
  return typeof arg === 'function' || arg instanceof Function;
};

function isError(e) {
  return (isObject(e) && objectToString(e) === '[object Error]') || (e instanceof Error);
}
exports.isError = isError;

function isUndefined(arg) {
  return arg === void 0;
}

exports.isUndefined = isUndefined;

exports.AssertionError = require('assert').AssertionError;

var hasOwnProperty = Object.prototype.hasOwnProperty;

exports.forOwn = function(obj, f, context) {
  for(var prop in obj) {
    if(hasOwnProperty.call(obj, prop)) {
      f.call(context, obj[prop], prop);
    }
  }
};

var functionNameRE = /^\s*function\s*(\S*)\s*\(/;

exports.functionName = function(f) {
  if(f.name) {
    return f.name;
  }
  var name = f.toString().match(functionNameRE)[1];
  return name;
};

var formatPropertyName = require('should-format').formatPropertyName;

exports.formatProp = function(value) {
  return formatPropertyName(String(value));
};

exports.formatEqlResult = function(r, a, b, format) {
  return (r.path.length > 0 ? 'at ' + r.path.map(exports.formatProp).join(' -> ') : '') +
    (r.a === a ? '' : ', A has ' + format(r.a)) +
    (r.b === b ? '' : ' and B has ' + format(r.b));
};
}).call(this,require("buffer").Buffer)
},{"assert":2,"buffer":3,"should-format":31}],28:[function(require,module,exports){
var WARN = '\u001b[33mWARN\u001b[39m';

function generateDeprecated(lines) {
  return function(show) {
    if(!show) return;

    lines.concat(sharedPart).forEach(function(line) {
      console.warn(WARN, line);
    });
  }
}

var sharedPart = [
  'To disable any warnings add \u001b[33mshould.warn = false\u001b[39m',
  'If you think that is not right, raise issue on github https://github.com/shouldjs/should.js/issues'
];

exports.staticShouldUnWrap = generateDeprecated([
  'Static version of should was called with primitive type wrapper like should(new Number(10))',
  'current version will unwrap it to assert on primitive value for you',
  'but that will be changed in future versions, make sure you know what are you doing'
]);

},{}],29:[function(require,module,exports){
var getType = require('should-type');
var hasOwnProperty = Object.prototype.hasOwnProperty;

function makeResult(r, path, reason, a, b) {
  var o = {result: r};
  if(!r) {
    o.path = path;
    o.reason = reason;
    o.a = a;
    o.b = b;
  }
  return o;
}

var EQUALS = makeResult(true);

function format(msg) {
  var args = arguments;
  for(var i = 1, l = args.length; i < l; i++) {
    msg = msg.replace(/%s/, args[i]);
  }
  return msg;
}

var REASON = {
  PLUS_0_AND_MINUS_0: '+0 is not equal to -0',
  DIFFERENT_TYPES: 'A has type %s and B has type %s',
  NAN_NUMBER: 'NaN is not equal to any number',
  EQUALITY: 'A is not equal to B',
  WRAPPED_VALUE: 'A wrapped value is not equal to B wrapped value',
  FUNCTION_SOURCES: 'function A is not equal to B by source code value (via .toString call)',
  MISSING_KEY: '%s does not have key %s',
  CIRCULAR_VALUES: 'A has circular reference that was visited not in the same time as B'
};

var LENGTH = ['length'];
var NAME = ['name'];
var MESSAGE = ['message'];
var BYTE_LENGTH = ['byteLength'];
var PROTOTYPE = ['prototype'];

function eq(a, b, stackA, stackB, path) {
  path = path || [];
  // equal a and b exit early
  if(a === b) {
    // check for +0 !== -0;
    return makeResult(a !== 0 || (1 / a == 1 / b), path, REASON.PLUS_0_AND_MINUS_0, a, b);
  }

  var l;

  var typeA = getType(a),
    typeB = getType(b);

  // if objects has different types they are not equals
  if(typeA !== typeB) return makeResult(false, path, format(REASON.DIFFERENT_TYPES, typeA, typeB), a, b);

  switch(typeA) {
    case 'number':
      return (a !== a) ? makeResult(b !== b, path, REASON.NAN_NUMBER, a, b)
        // but treat `+0` vs. `-0` as not equal
        : (a === 0 ? makeResult((1 / a === 1 / b), path, REASON.PLUS_0_AND_MINUS_0, a, b) : makeResult(a === b, path, REASON.EQUALITY, a, b));

    case 'regexp':
      return makeResult(String(a) === String(b), path, REASON.EQUALITY, a, b);

    case 'boolean':
    case 'string':
      return makeResult(a === b, path, REASON.EQUALITY, a, b);

    case 'date':
      return makeResult(+a === +b, path, REASON.EQUALITY, a, b);

    case 'object-number':
    case 'object-boolean':
    case 'object-string':
      var isValueEqual = a.valueOf() === b.valueOf();
      if(isValueEqual) break;
      return makeResult(false, path, REASON.WRAPPED_VALUE, a.valueOf(), b.valueOf());

    case 'buffer':
      if(a.length !== b.length) return makeResult(false, path.concat(LENGTH), REASON.EQUALITY, a.length, b.length);

      l = a.length;
      while(l--) if(a[l] !== b[l]) return makeResult(false, path.concat([l]), REASON.EQUALITY, a[l], b[l]);

      return EQUALS;

    case 'error':
      //only check not enumerable properties, and check arrays later
      if(a.name !== b.name) return makeResult(false, path.concat(NAME), REASON.EQUALITY, a.name, b.name);
      if(a.message !== b.message) return makeResult(false, path.concat(MESSAGE), REASON.EQUALITY, a.message, b.message);

      break;

    //XXX check more in browsers
    case 'array-buffer':
      if(a.byteLength !== b.byteLength) return makeResult(false, path.concat(BYTE_LENGTH), REASON.EQUALITY, a.byteLength, b.byteLength);

      l = a.byteLength;
      while(l--) if(a[l] !== b[l]) return makeResult(false, path.concat([l]), REASON.EQUALITY, a[l], b[l]);

      return EQUALS;

  }

  // compare deep objects and arrays
  // stacks contain references only
  stackA || (stackA = []);
  stackB || (stackB = []);

  l = stackA.length;
  while(l--) {
    if(stackA[l] == a) {
      return makeResult(stackB[l] == b, path, REASON.CIRCULAR_VALUES, a, b);
    }
  }

  // add `a` and `b` to the stack of traversed objects
  stackA.push(a);
  stackB.push(b);

  var hasProperty,
    keysComparison,
    key;

  if(typeA === 'array' || typeA === 'arguments') {
    if(a.length !== b.length) return makeResult(false, path.concat(LENGTH), REASON.EQUALITY, a.length, b.length);
  }

  if(typeB === 'function') {
    var fA = a.toString(), fB = b.toString();
    if(fA !== fB) return makeResult(false, path, REASON.FUNCTION_SOURCES, fA, fB);
  }

  for(key in b) {
    if(hasOwnProperty.call(b, key)) {
      hasProperty = hasOwnProperty.call(a, key);
      if(!hasProperty) return makeResult(false, path, format(REASON.MISSING_KEY, 'A', key), a, b);

      keysComparison = eq(a[key], b[key], stackA, stackB, path.concat([key]));
      if(!keysComparison.result) return keysComparison;
    }
  }

  // ensure both objects have the same number of properties
  for(key in a) {
    if(hasOwnProperty.call(a, key)) {
      hasProperty = hasOwnProperty.call(b, key);
      if(!hasProperty) return makeResult(false, path, format(REASON.MISSING_KEY, 'B', key), a, b);
    }
  }

  stackA.pop();
  stackB.pop();

  if(typeB === 'function') {
    keysComparison = eq(a.prototype, b.prototype, stackA, stackB, path.concat(PROTOTYPE));
    if(!keysComparison.result) return keysComparison;
  }

  return EQUALS;
}


module.exports = eq;

},{"should-type":30}],30:[function(require,module,exports){
(function (Buffer){
var toString = Object.prototype.toString;

var isPromiseExist = typeof Promise !== 'undefined';
var isBufferExist = typeof Buffer !== 'undefined';

var NUMBER = 'number';//
var UNDEFINED = 'undefined';//
var STRING = 'string';//
var BOOLEAN = 'boolean';//
var OBJECT = 'object';
var FUNCTION = 'function';//
var NULL = 'null';//
var ARRAY = 'array';
var REGEXP = 'regexp';//
var DATE = 'date';//
var ERROR = 'error';//
var ARGUMENTS = 'arguments';//
var SYMBOL = 'symbol';
var ARRAY_BUFFER = 'array-buffer';//
var TYPED_ARRAY = 'typed-array';//
var DATA_VIEW = 'data-view';
var MAP = 'map';
var SET = 'set';
var WEAK_SET = 'weak-set';
var WEAK_MAP = 'weak-map';
var PROMISE = 'promise';//

var WRAPPER_NUMBER = 'object-number';//
var WRAPPER_BOOLEAN = 'object-boolean';//
var WRAPPER_STRING = 'object-string';//

// node buffer
var BUFFER = 'buffer';//

// dom html element
var HTML_ELEMENT = 'html-element';//
var HTML_ELEMENT_TEXT = 'html-element-text';//
var DOCUMENT = 'document';//
var WINDOW = 'window';//
var FILE = 'file';
var FILE_LIST = 'file-list';
var BLOB = 'blob';

var XHR = 'xhr';//

module.exports = function getType(instance) {
  var type = typeof instance;

  switch (type) {
    case NUMBER:
      return NUMBER;
    case UNDEFINED:
      return UNDEFINED;
    case STRING:
      return STRING;
    case BOOLEAN:
      return BOOLEAN;
    case FUNCTION:
      return FUNCTION;
    case SYMBOL:
      return SYMBOL;
    case OBJECT:
      if (instance === null) return NULL;

      var clazz = toString.call(instance);

      switch (clazz) {
        case '[object String]':
          return WRAPPER_STRING;
        case '[object Boolean]':
          return WRAPPER_BOOLEAN;
        case '[object Number]':
          return WRAPPER_NUMBER;
        case '[object Array]':
          return ARRAY;
        case '[object RegExp]':
          return REGEXP;
        case '[object Error]':
          return ERROR;
        case '[object Date]':
          return DATE;
        case '[object Arguments]':
          return ARGUMENTS;
        case '[object Math]':
          return OBJECT;
        case '[object JSON]':
          return OBJECT;
        case '[object ArrayBuffer]':
          return ARRAY_BUFFER;
        case '[object Int8Array]':
          return TYPED_ARRAY;
        case '[object Uint8Array]':
          return TYPED_ARRAY;
        case '[object Uint8ClampedArray]':
          return TYPED_ARRAY;
        case '[object Int16Array]':
          return TYPED_ARRAY;
        case '[object Uint16Array]':
          return TYPED_ARRAY;
        case '[object Int32Array]':
          return TYPED_ARRAY;
        case '[object Uint32Array]':
          return TYPED_ARRAY;
        case '[object Float32Array]':
          return TYPED_ARRAY;
        case '[object Float64Array]':
          return TYPED_ARRAY;
        case '[object DataView]':
          return DATA_VIEW;
        case '[object Map]':
          return MAP;
        case '[object WeakMap]':
          return WEAK_MAP;
        case '[object Set]':
          return SET;
        case '[object WeakSet]':
          return WEAK_SET;
        case '[object Promise]':
          return PROMISE;
        case '[object Window]':
          return WINDOW;
        case '[object HTMLDocument]':
          return DOCUMENT;
        case '[object Blob]':
          return BLOB;
        case '[object File]':
          return FILE;
        case '[object FileList]':
          return FILE_LIST;
        case '[object XMLHttpRequest]':
          return XHR;
        case '[object Text]':
          return HTML_ELEMENT_TEXT;
        default:
          if (isPromiseExist && instance instanceof Promise) return PROMISE;

          if (isBufferExist && instance instanceof Buffer) return BUFFER;

          if (/^\[object HTML\w+Element\]$/.test(clazz)) return HTML_ELEMENT;

          if (clazz === '[object Object]') return OBJECT;
      }
  }
};

}).call(this,require("buffer").Buffer)
},{"buffer":3}],31:[function(require,module,exports){
var getType = require('should-type');

function genKeysFunc(f) {
  return function(value) {
    var k = f(value);
    k.sort();
    return k;
  }
}

//XXX add ability to only inspect some paths
var format = function(value, opts) {
  opts = opts || {};

  if(!('seen' in opts)) opts.seen = [];
  opts.keys = genKeysFunc('keys' in opts && opts.keys === false ? Object.getOwnPropertyNames : Object.keys);

  if(!('maxLineLength' in opts)) opts.maxLineLength = 60;
  if(!('propSep' in opts)) opts.propSep = ',';

  var type = getType(value);
  return (format.formats[type] || format.formats['object'])(value, opts);
};

module.exports = format;

format.formats = {};

function add(t, f) {
  format.formats[t] = f;
}

[ 'undefined',  'boolean',  'null'].forEach(function(name) {
  add(name, String);
});

['number', 'boolean'].forEach(function(name) {
  var capName = name.substring(0, 1).toUpperCase() + name.substring(1);
  add('object-' + name, formatObjectWithPrefix(function(value) {
    return '[' + capName + ': ' + format(value.valueOf()) + ']';
  }));
});

add('object-string', function(value, opts) {
  var realValue = value.valueOf();
  var prefix = '[String: ' + format(realValue) + ']';
  var props = opts.keys(value);
  props = props.filter(function(p) {
    return !(p.match(/\d+/) && parseInt(p, 10) < realValue.length);
  });

  if(props.length == 0) return prefix;
  else return formatObject(value, opts, prefix, props);
});

add('regexp', formatObjectWithPrefix(String));

add('number', function(value) {
  if(value === 0 && 1 / value < 0) return '-0';
  return String(value);
});

add('string', function(value) {
  return '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
      .replace(/'/g, "\\'")
      .replace(/\\"/g, '"') + '\'';
});

add('object', formatObject);

add('array', function(value, opts) {
  var keys = opts.keys(value);
  var len = 0;

  opts.seen.push(value);

  var props = keys.map(function(prop) {
    var desc;
    try {
      desc = Object.getOwnPropertyDescriptor(value, prop) || {value: value[prop]};
    } catch(e) {
      desc = {value: e};
    }

    var f;
    if(prop.match(/\d+/)) {
      f = format(desc.value, opts);
    } else {
      f = formatProperty(desc.value, opts, prop)
    }
    len += f.length;
    return f;
  });

  opts.seen.pop();

  if(props.length === 0) return '[]';

  if(len <= opts.maxLineLength) {
    return '[ ' + props.join(opts.propSep + ' ') + ' ]';
  } else {
    return '[' + '\n' + props.map(addSpaces).join(opts.propSep + '\n') + '\n' + ']';
  }
});

function addSpaces(v) {
  return '  ' + v;
}

function formatObject(value, opts, prefix, props) {
  props = props || opts.keys(value);

  var len = 0;

  opts.seen.push(value);
  props = props.map(function(prop) {
    var f = formatProperty(value, opts, prop);
    len += f.length;
    return f;
  });
  opts.seen.pop();

  if(props.length === 0) return '{}';

  if(len <= opts.maxLineLength) {
    return '{ ' + (prefix ? prefix + ' ' : '') + props.join(opts.propSep + ' ') + ' }';
  } else {
    return '{' + '\n' + (prefix ? prefix + '\n' : '') + props.map(addSpaces).join(opts.propSep + '\n') + '\n' + '}';
  }
}

format.formatPropertyName = function(name, opts) {
  return name.match(/^[a-zA-Z_$][a-zA-Z_$0-9]*$/) ? name : format(name, opts)
};


function formatProperty(value, opts, prop) {
  var desc;
  try {
    desc = Object.getOwnPropertyDescriptor(value, prop) || {value: value[prop]};
  } catch(e) {
    desc = {value: e};
  }

  var propName = format.formatPropertyName(prop, opts);

  var propValue = desc.get && desc.set ?
    '[Getter/Setter]' : desc.get ?
    '[Getter]' : desc.set ?
    '[Setter]' : opts.seen.indexOf(desc.value) >= 0 ?
    '[Circular]' :
    format(desc.value, opts);

  return propName + ': ' + propValue;
}


function pad2Zero(n) {
  return n < 10 ? '0' + n : '' + n;
}

function pad3Zero(n) {
  return n < 100 ? '0' + pad2Zero(n) : '' + n;
}

function formatDate(value) {
  var to = value.getTimezoneOffset();
  var absTo = Math.abs(to);
  var hours = Math.floor(absTo / 60);
  var minutes = absTo - hours * 60;
  var tzFormat = 'GMT' + (to < 0 ? '+' : '-') + pad2Zero(hours) + pad2Zero(minutes);
  return value.toLocaleDateString() + ' ' + value.toLocaleTimeString() + '.' + pad3Zero(value.getMilliseconds()) + ' ' + tzFormat;
}

function formatObjectWithPrefix(f) {
  return function(value, opts) {
    var prefix = f(value);
    var props = opts.keys(value);
    if(props.length == 0) return prefix;
    else return formatObject(value, opts, prefix, props);
  }
}

add('date', formatObjectWithPrefix(formatDate));

var functionNameRE = /^\s*function\s*(\S*)\s*\(/;

function functionName(f) {
  if(f.name) {
    return f.name;
  }
  var name = f.toString().match(functionNameRE)[1];
  return name;
}

add('function', formatObjectWithPrefix(function(value) {
  var name = functionName(value);
  return '[Function' + (name ? ': ' + name : '') + ']';
}));

add('error', formatObjectWithPrefix(function(value) {
  var name = value.name;
  var message = value.message;
  return '[' + name + (message ? ': ' + message : '') + ']';
}));

function generateFunctionForIndexedArray(lengthProp, name) {
  return function(value) {
    var str = '';
    var max = 50;
    var len = value[lengthProp];
    if(len > 0) {
      for(var i = 0; i < max && i < len; i++) {
        var b = value[i] || 0;
        str += ' ' + pad2Zero(b.toString(16));
      }
      if(len > max)
        str += ' ... ';
    }
    return '[' + (value.constructor.name || name) + (str ? ':' + str : '') + ']';
  }
}

add('buffer', generateFunctionForIndexedArray('length', 'Buffer'));

add('array-buffer', generateFunctionForIndexedArray('byteLength'));

add('typed-array', generateFunctionForIndexedArray('byteLength'));

add('promise', function(value) {
  return '[Promise]';
});

add('xhr', function(value) {
  return '[XMLHttpRequest]';
});

add('html-element', function(value) {
  return value.outerHTML;
});

add('html-element-text', function(value) {
  return value.nodeValue;
});

add('document', function(value) {
  return value.documentElement.outerHTML;
});

add('window', function(value) {
  return '[Window]';
});
},{"should-type":32}],32:[function(require,module,exports){
module.exports=require(30)
},{"/Users/john/repos/editableCell/node_modules/should/node_modules/should-equal/node_modules/should-type/index.js":30,"buffer":3}],33:[function(require,module,exports){
var koBindingHandlers = require('./ko'),
    events = require('./events');

exports.selectCell = function (cell) {
    var table = cell.parentNode.parentNode.parentNode,
        selection = table._cellSelection;

    selection.setRange(cell, cell);
};

exports.getTableSelection = function (table) {
    var selection = table._cellSelection;

    return selection;
};

exports.setCellValue = function (cell, value) {
    var table = cell.parentNode.parentNode.parentNode,
        selection = table._cellSelection;

    selection.updateCellValue(cell, value);
};

// --------
// Eventing
// --------

exports.on = function (event, listener) {
    events.public.on(event, listener);
};

exports.removeListener = function () {
    events.public.removeListener.apply(events.public, arguments);
};

exports.removeAllListeners = function () {
    events.public.removeAllListeners.apply(events.public, arguments);
};

// Proxy internal events

var proxyEvents = ['cellValueChanged', 'beforeCopy'],
    eventName,
    i;

for (i = 0; i < proxyEvents.length; ++i) {
    eventName = proxyEvents[i];

    events.private.on(eventName, createProxy(eventName));    
}

function createProxy (eventName) {
    return function () {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(eventName);
        events.public.emit.apply(events.public, args);
    };
}
},{"./events":34,"./ko":38}],34:[function(require,module,exports){
var EventEmitter = require('events').EventEmitter,
	publicEvents = new EventEmitter(),
	privateEvents = new EventEmitter();

module.exports.public = publicEvents;
module.exports.private = privateEvents;
},{"events":7}],35:[function(require,module,exports){
var utils = require('./utils'),
    events = require('../events'),
    ko = require('./wrapper');

var editableCell = {
    init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        var table = $(element).parents('table')[0],
            selection = utils.initializeSelection(table),
            valueBindingName = 'editableCell';

        selection.registerCell(element);

        if (allBindings.has('cellValue')) {
            valueBindingName = 'cellValue';
            valueAccessor = function () { return allBindings.get('cellValue'); };
        }

        element._cellTemplated = element.innerHTML.trim() !== '';
        element._cellValue = valueAccessor;
        element._cellContent = function () { return allBindings.get('cellHTML') || allBindings.get('cellText') || this._cellValue(); };
        element._cellText = function () { return allBindings.get('cellText'); };
        element._cellHTML = function () { return allBindings.get('cellHTML'); };
        element._cellReadOnly = function () { return ko.utils.unwrapObservable(allBindings.get('cellReadOnly')); };
        element._cellValueUpdater = function (newValue) {
            utils.updateBindingValue(element, valueBindingName, this._cellValue, allBindings, newValue);

            if (!ko.isObservable(this._cellValue())) {
                ko.bindingHandlers.editableCell.update(element, valueAccessor, allBindings, viewModel, bindingContext);
            }
        };

        ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
            selection.unregisterCell(element);

            element._cellValue = null;
            element._cellContent = null;
            element._cellText = null;
            element._cellHTML = null;
            element._cellReadOnly = null;
            element._cellValueUpdater = null;
        });

        if (element._cellTemplated) {
            ko.utils.domData.set(element, 'editableCellTemplate', {});
            return { 'controlsDescendantBindings': true };
        }

        element.initialBind = true;
    },
    update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        var value = ko.utils.unwrapObservable(valueAccessor());

        if (element._cellTemplated) {
            var template = ko.utils.domData.get(element, 'editableCellTemplate');

            if (!template.savedNodes) {
                template.savedNodes = utils.cloneNodes(ko.virtualElements.childNodes(element), true /* shouldCleanNodes */);
            }
            else {
                ko.virtualElements.setDomNodeChildren(element, utils.cloneNodes(template.savedNodes));
            }

            ko.applyBindingsToDescendants(bindingContext.createChildContext(value), element);
        }
        else {
            if (element._cellHTML()) {
                element.innerHTML = ko.utils.unwrapObservable(element._cellHTML());
            }
            else {
                element.textContent = ko.utils.unwrapObservable(element._cellText() || element._cellValue());
            }
        }

        if (!element.initialBind) {
            events.private.emit('cellValueChanged', element);
        }

        if (element.initialBind) {
            element.initialBind = undefined;
        }
    }
};

module.exports = editableCell;

},{"../events":34,"./utils":39,"./wrapper":40}],36:[function(require,module,exports){
var utils = require('./utils'),
    ko = require('./wrapper');

var editableCellScrollHost = {
    init: function (element) {
        if (element.tagName !== 'TABLE') {
            throw new Error('editableCellScrollHost binding can only be applied to tables');
        }

        utils.initializeSelection(element);
    },
    update: function (element, valueAccessor) {
        var table = element,
            selection = table._cellSelection,
            scrollHost = ko.utils.unwrapObservable(valueAccessor());

        selection.setScrollHost(scrollHost);
    }
};

module.exports = editableCellScrollHost;

},{"./utils":39,"./wrapper":40}],37:[function(require,module,exports){
var utils = require('./utils'),
    ko = require('./wrapper');

var editableCellSelection = {
    _selectionMappings: [],

    init: function (element, valueAccessor, allBindingsAccessor) {
        if (element.tagName !== 'TABLE') {
            throw new Error('editableCellSelection binding can only be applied to tables');
        }

        var table = element,
            selection = utils.initializeSelection(table);

        // Update supplied observable array when selection range changes
        selection.on('change', rangeChanged);

        function rangeChanged (newSelection) {
            newSelection = ko.utils.arrayMap(newSelection, function (cell) {
                return {
                    cell: cell,
                    value: cell._cellValue(),
                    content: cell._cellContent()
                };
            });

            utils.updateBindingValue(element, 'editableCellSelection', valueAccessor, allBindingsAccessor, newSelection);
        }

        // Keep track of selections
        ko.bindingHandlers.editableCellSelection._selectionMappings.push([valueAccessor, table]);

        // Perform clean-up when table is removed from DOM
        ko.utils.domNodeDisposal.addDisposeCallback(table, function () {
            // Remove selection from list
            var selectionIndex = ko.utils.arrayFirst(ko.bindingHandlers.editableCellSelection._selectionMappings, function (tuple) {
                return tuple[0] === valueAccessor;
            });
            ko.bindingHandlers.editableCellSelection._selectionMappings.splice(selectionIndex, 1);

            // Remove event listener
            selection.removeListener('change', rangeChanged);
        });
    },
    update: function (element, valueAccessor, allBindingsAccessor) {
        var table = element,
            selection = table._cellSelection,
            newSelection = ko.utils.unwrapObservable(valueAccessor()) || [];

        // Empty selection, so simply clear it out
        if (newSelection.length === 0) {
            selection.clear();
            return;
        }

        var start = newSelection[0],
            end = newSelection[newSelection.length - 1];

        var isDirectUpdate = start.tagName === 'TD' || start.tagName === 'TH';

        // Notification of changed selection, either after programmatic
        // update or after changing current selection in user interface
        if (!isDirectUpdate) {
            start = start.cell;
            end = end.cell;
        }

        // Make sure selected cells belongs to current table, or else hide selection
        var parentRowHidden = !start.parentNode;
        var belongingToOtherTable = start.parentNode && start.parentNode.parentNode && start.parentNode.parentNode.parentNode !== table;

        if (parentRowHidden || belongingToOtherTable) {
            // Selection cannot be cleared, since that will affect selection in other table
            selection.view.hide();
            return;
        }

        // Programmatic update of selection, i.e. selection([startCell, endCell]);
        if (isDirectUpdate) {
            selection.setRange(start, end);
        }
    }
};

module.exports = editableCellSelection;

},{"./utils":39,"./wrapper":40}],38:[function(require,module,exports){
var polyfill = require('../polyfill');
var ko = require('./wrapper');

// Knockout binding handlers
var bindingHandlers = {
    editableCell: require('./editableCellBinding'),
    editableCellSelection: require('./editableCellSelectionBinding'),
    editableCellScrollHost: require('./editableCellScrollHostBinding')
};

// Register Knockout binding handlers if Knockout is loaded
if (typeof ko !== 'undefined') {
    for (var bindingHandler in bindingHandlers) {
        ko.bindingHandlers[bindingHandler] = bindingHandlers[bindingHandler];
    }
}

},{"../polyfill":41,"./editableCellBinding":35,"./editableCellScrollHostBinding":36,"./editableCellSelectionBinding":37,"./wrapper":40}],39:[function(require,module,exports){
var Selection = require('../selection'),
    ko = require('./wrapper');

module.exports = {
    initializeSelection: initializeSelection,
    updateBindingValue: updateBindingValue,
    cloneNodes: cloneNodes
};

function initializeSelection (table) {
    var selection = table._cellSelection;

    if (selection === undefined) {
        table._cellSelection = selection = new Selection(table, ko.bindingHandlers.editableCellSelection._selectionMappings);

        ko.utils.domNodeDisposal.addDisposeCallback(table, function () {
            table._cellSelection.destroy();
        });
    }

    return selection;
}

// `updateBindingValue` is a helper function borrowing private binding update functionality
// from Knockout.js for supporting updating of both observables and non-observables.
function updateBindingValue (element, bindingName, valueAccessor, allBindingsAccessor, newValue) {
    var options = {
        cell: element
    };

    if (ko.isWriteableObservable(valueAccessor())) {
        valueAccessor()(newValue, options);
        return;
    }

    var propertyWriters = allBindingsAccessor()._ko_property_writers;
    if (propertyWriters && propertyWriters[bindingName]) {
        propertyWriters[bindingName](newValue, options);
    }

    if (!ko.isObservable(valueAccessor())) {
        allBindingsAccessor()[bindingName] = newValue;
    }
}

// Borrowed from Knockout.js
function cloneNodes (nodesArray, shouldCleanNodes) {
    for (var i = 0, j = nodesArray.length, newNodesArray = []; i < j; i++) {
        var clonedNode = nodesArray[i].cloneNode(true);
        newNodesArray.push(shouldCleanNodes ? ko.cleanNode(clonedNode) : clonedNode);
    }
    return newNodesArray;
}

},{"../selection":42,"./wrapper":40}],40:[function(require,module,exports){
if (typeof ko !== 'undefined') {
  module.exports = ko;
}
else {
  module.exports = window.require('knockout');
}

},{}],41:[function(require,module,exports){
function forEach (list, f) {
  var i;

  for (i = 0; i < list.length; ++i) {
    f(list[i], i);
  }
}

forEach([Array, window.NodeList, window.HTMLCollection], extend);

function extend (object) {
  var prototype = object && object.prototype;

  if (!prototype) {
    return;
  }

  prototype.forEach = prototype.forEach || function (f) {
    forEach(this, f);
  };

  prototype.filter = prototype.filter || function (f) {
    var result = [];

    this.forEach(function (element) {
      if (f(element, result.length)) {
        result.push(element);
      }
    });

    return result;
  };

  prototype.map = prototype.map || function (f) {
    var result = [];

    this.forEach(function (element) {
      result.push(f(element, result.length));
    });

    return result;
  };
}
},{}],42:[function(require,module,exports){
var SelectionView = require('./selectionView'),
    SelectionRange = require('./selectionRange'),
    EventEmitter = require('events').EventEmitter,
    polyfill = require('./polyfill'),
    events = require('./events'),
    ko = require('./ko/wrapper'),
    inherits = require('inherits');

module.exports = Selection;

function Selection(table, selectionMappings) {
    this.table = table;
    this.selectionMappings = selectionMappings;

    this.range = new SelectionRange(this.getRowByIndex.bind(this), this.getCellByIndex.bind(this), this.cellIsSelectable.bind(this), this.cellIsVisible.bind(this));
    this.view = new SelectionView(this.table, this);

    this.range.on('change', this.onSelectionChange.bind(this));
}

inherits(Selection, EventEmitter);

Selection.prototype.onSelectionChange = function(newSelection) {
    this.emit('change', newSelection);
    if (newSelection.length === 0) {
        this.view.hide();
        return;
    }
    this.view.update(newSelection[0], newSelection[newSelection.length - 1]);
};

Selection.prototype.setRange = function(start, end) {
    this.range.setStart(start);
    this.range.setEnd(end);
};

Selection.prototype.getRange = function() {
    return {
        start: this.range.start,
        end: this.range.end
    };
};

Selection.prototype.clear = function() {
    this.range.clear();
};

Selection.prototype.getCells = function() {
    return this.range.selection;
};

Selection.prototype.destroy = function() {
    this.view.destroy();
    this.view = null;

    this.range.destroy();
    this.range = null;

    this.removeAllListeners();

    this.table._cellSelection = null;
    this.table = null;
};

Selection.prototype.focus = function() {
    this.view.focus();
};

Selection.prototype.setScrollHost = function(scrollHost) {
    this.view.scrollHost = scrollHost;
};

Selection.prototype.registerCell = function(cell) {
    cell.addEventListener("mousedown", this.onMouseDown.bind(this));
    cell.addEventListener("mouseover", this.onMouseOver.bind(this));
    cell.addEventListener("focus", this.onCellFocus.bind(this));
};

Selection.prototype.unregisterCell = function(cell) {
    cell.removeEventListener('mousedown', this.onMouseDown.bind(this));
    cell.removeEventListener('mouseover', this.onMouseOver.bind(this));
    cell.removeEventListener('focus', this.onCellFocus.bind(this));
};

Selection.prototype.onMouseDown = function(event) {
    var cell = event.target;
    if (this.isEditingCell(cell)) {
        return;
    }

    this.onCellMouseDown(cell, event.shiftKey);
    event.preventDefault();
};

Selection.prototype.updateCellValue = function(cell, newValue) {
    var value;

    if (!this.cellIsEditable(cell)) {
        return undefined;
    }

    if (newValue === undefined) {
        value = this.view.inputElement.value;
    } else {
        value = newValue;
    }

    cell._cellValueUpdater(value);

    return value;
};

Selection.prototype.startEditing = function() {
    this.startEditingCell(this.range.start);
};

Selection.prototype.startLockedEditing = function() {
    this.startEditingCell(this.range.start, true);
};

Selection.prototype.startEditingCell = function(cell, isLockedToCell) {
    if (!this.cellIsEditable(cell)) {
        return;
    }

    if (this.range.start !== cell) {
        this.range.setStart(cell);
    }

    this.view.inputElement.style.top = this.table.offsetTop + cell.offsetTop + 'px';
    this.view.inputElement.style.left = this.table.offsetLeft + cell.offsetLeft + 'px';
    this.view.inputElement.style.width = cell.offsetWidth + 'px';
    this.view.inputElement.style.height = cell.offsetHeight + 'px';
    this.view.inputElement.value = ko.utils.unwrapObservable(cell._cellValue());
    this.view.inputElement.style.display = 'block';
    this.view.inputElement.focus();
    this.view.isLockedToCell = isLockedToCell;

    document.execCommand('selectAll', false, null);
    this.view.element.style.pointerEvents = 'none';
};

Selection.prototype.isEditingCell = function(cell) {
    return this.view.inputElement.style.display === 'block';
};

Selection.prototype.cancelEditingCell = function(cell) {
    this.view.inputElement.style.display = 'none';
    this.view.element.style.pointerEvents = 'inherit';
};

Selection.prototype.endEditingCell = function(cell) {
    this.view.inputElement.style.display = 'none';
    this.view.element.style.pointerEvents = 'inherit';
    return this.updateCellValue(cell);
};

Selection.prototype.cellIsSelectable = function(cell) {
    return cell._cellValue !== undefined;
};

Selection.prototype.cellIsEditable = function(cell) {
    return cell._cellReadOnly() !== true;
};

Selection.prototype.cellIsVisible = function(cell) {
    return cell && cell.offsetHeight !== 0;
};

Selection.prototype.getRowByIndex = function(index, originTable) {
    var targetTable = originTable || this.table;

    // Check if we're moving out of table
    if (index === -1 || index === targetTable.rows.length) {
        // Find selection mapping for table
        var selectionMapping = this.getSelectionMappingForTable(targetTable);

        // We can only proceed check if mapping exists, i.e. that editableCellSelection binding is used
        if (selectionMapping) {
            // Find all selection mappings for selection, excluding the one for the current table
            var tableMappings = this.selectionMappings.filter(function(tuple) {
                return tuple[0]() === selectionMapping[0]() && tuple[1] !== targetTable;
            });

            var tables = tableMappings.map(function(tuple) {
                return tuple[1];
            });

            var beforeTables = tables.filter(function(t) {
                return t.getBoundingClientRect().bottom <= table.getBoundingClientRect().top;
            });

            var afterTables = tables.filter(function(t) {
                return t.getBoundingClientRect().top >= table.getBoundingClientRect().bottom;
            });

            // Moving upwards
            if (index === -1 && beforeTables.length) {
                targetTable = beforeTables[beforeTables.length - 1];
                index = targetTable.rows.length - 1;
            }
            // Moving downwards
            else if (index === targetTable.rows.length && afterTables.length) {
                targetTable = afterTables[0];
                index = 0;
            }
        }
    }

    return targetTable.rows[index];
};

Selection.prototype.getCellByIndex = function(row, index) {
    var i, colSpanSum = 0;

    for (i = 0; i < row.children.length; i++) {
        if (index < colSpanSum) {
            return row.children[i - 1];
        }
        if (index === colSpanSum) {
            return row.children[i];
        }

        colSpanSum += row.children[i].colSpan;
    }
};

Selection.prototype.getSelectionMappingForTable = function(table) {
    return this.selectionMappings.filter(function(tuple) {
        return tuple[1] === table;
    })[0];
};

Selection.prototype.updateSelectionMapping = function(newStartOrEnd) {
    var newTable = newStartOrEnd &&
                   newStartOrEnd.parentNode &&
                   newStartOrEnd.parentNode.parentNode &&
                   newStartOrEnd.parentNode.parentNode.parentNode;

    if (newTable !== this.table) {
        var mapping = this.getSelectionMappingForTable(newTable);
        if (mapping) {
            var selection = mapping[0]();
            selection([newStartOrEnd]);
        }
    }
};

Selection.prototype.onCellMouseDown = function(cell, shiftKey) {
    if (shiftKey) {
        this.range.setEnd(cell);
    } else {
        this.range.setStart(cell);
    }

    this.view.beginDrag();
    event.preventDefault();
};

Selection.prototype.onMouseOver = function(event) {
    var cell = event.target;

    if (!this.view.isDragging) {
        return;
    }

    while (cell && !(cell.tagName === 'TD' || cell.tagName === 'TH')) {
        cell = cell.parentNode;
    }

    if (cell && cell !== this.range.end) {
        this.range.setEnd(cell);
    }
};

Selection.prototype.onCellFocus = function(event) {
    var cell = event.target;

    if (cell === this.range.start) {
        return;
    }

    setTimeout(function() {
        this.range.setStart(cell);
    }, 0);
};

Selection.prototype.onReturn = function(event, preventMove) {
    if (preventMove !== true) {
        this.range.moveInDirection('Down');
    }
    event.preventDefault();
};

Selection.prototype.onArrows = function(event) {
    var newStartOrEnd, newTable;

    if (event.shiftKey && !event.ctrlKey) {
        newStartOrEnd = this.range.extendInDirection(this.keyCodeIdentifier[event.keyCode]);
    } else if (!event.ctrlKey) {
        newStartOrEnd = this.range.moveInDirection(this.keyCodeIdentifier[event.keyCode]);
        newTable = newStartOrEnd && newStartOrEnd.parentNode && newStartOrEnd.parentNode.parentNode.parentNode;

        this.updateSelectionMapping(newStartOrEnd);
    } else if (event.ctrlKey) {
        if (event.shiftKey) {
            // Extend selection all the way to the end.
            newStartOrEnd = this.range.extendInDirection(this.keyCodeIdentifier[event.keyCode], true);
        } else {
            // Move selection all the way to the end.
            newStartOrEnd = this.range.moveInDirection(this.keyCodeIdentifier[event.keyCode], true);
            this.updateSelectionMapping(newStartOrEnd);
        }
    }

    if (newStartOrEnd) {
        event.preventDefault();
    }
};

Selection.prototype.onCopy = function() {
    var cells = this.range.getCells(),
        cols = cells[cells.length - 1].cellIndex - cells[0].cellIndex + 1,
        rows = cells.length / cols,
        lines = [],
        i = 0,
        copyEventData = {
            text: ''
        };

    cells.forEach(function(cell) {
        var lineIndex = i % rows,
            rowIndex = Math.floor(i / rows);

        lines[lineIndex] = lines[lineIndex] || [];
        lines[lineIndex][rowIndex] = ko.utils.unwrapObservable(cell._cellValue());

        i++;
    });

    copyEventData.text = lines.map(function(line) {
        return line.join('\t');
    }).join('\r\n');


    events.private.emit('beforeCopy', copyEventData);

    return copyEventData.text;
};

Selection.prototype.onPaste = function(text) {
    var selStart = this.range.getCells()[0],
        cells,
        values = text.trim().split(/\r?\n/).map(function(line) {
            return line.split('\t');
        }),
        row = values.length,
        col = values[0].length,
        rows = 1,
        cols = 1,
        i = 0;

    this.range.setStart(selStart);

    while (row-- > 1 && this.range.extendInDirection('Down')) {
        rows++;
    }
    while (col-- > 1 && this.range.extendInDirection('Right')) {
        cols++;
    }

    cells = this.range.getCells();

    for (col = 0; col < cols; col++) {
        for (row = 0; row < rows; row++) {
            this.updateCellValue(cells[i], values[row][col]);
            i++;
        }
    }
};

Selection.prototype.onTab = function(event) {
    this.range.start.focus();
};

Selection.prototype.keyCodeIdentifier = {
    37: 'Left',
    38: 'Up',
    39: 'Right',
    40: 'Down'
};

},{"./events":34,"./ko/wrapper":40,"./polyfill":41,"./selectionRange":43,"./selectionView":44,"events":7,"inherits":12}],43:[function(require,module,exports){
var EventEmitter = require('events').EventEmitter,
    polyfill = require('./polyfill');

module.exports = SelectionRange;

SelectionRange.prototype = EventEmitter.prototype;

function SelectionRange (getRowByIndex, getCellByIndex, cellIsSelectable, cellIsVisible) {
    var self = this;

    self.start = undefined;
    self.end = undefined;
    self.selection = [];

    function setSelection (cells) {
        self.selection = cells;
        self.emit('change', cells);
    }

    self.moveInDirection = function (direction, toEnd) {
        var newStart = toEnd ? self.getLastSelectableCellInDirection(self.start, direction) : self.getSelectableCellInDirection(self.start, direction),
            startChanged = newStart !== self.start,
            belongingToOtherTable = newStart.parentNode.parentNode.parentNode !== self.start.parentNode.parentNode.parentNode;

        if (!belongingToOtherTable && (startChanged || self.start !== self.end)) {
            self.setStart(newStart);
        }

        if (startChanged) {
            return newStart;
        }
    };

    self.extendInDirection = function (direction, toEnd) {
        var newEnd = toEnd ? self.getLastSelectableCellInDirection(self.end, direction) : self.getCellInDirection(self.end, direction),
            endChanged = newEnd && newEnd !== self.end;

        if (newEnd) {
            self.setEnd(newEnd);
        }

        if (endChanged) {
            return newEnd;
        }
    };

    self.getCells = function () {
        return self.getCellsInArea(self.start, self.end);
    };

    self.clear = function () {
        self.start = undefined;
        self.end = undefined;
        setSelection([]);
    };

    self.destroy = function () {
        self.removeAllListeners('change');
        self.start = undefined;
        self.end = undefined;
        self.selection = null;
        self = null;
    };

    self.setStart = function (element) {
        self.start = element;
        self.end = element;
        setSelection(self.getCells());
    };
    self.setEnd = function (element) {
        if (element === self.end) {
            return;
        }
        self.start = self.start || element;

        var cellsInArea = self.getCellsInArea(self.start, element),
            allEditable = true;

        cellsInArea.forEach(function (cell) {
            allEditable = allEditable && cellIsSelectable(cell);
        });

        if (!allEditable) {
            return;
        }

        self.end = element;
        setSelection(self.getCells());
    };
    self.getCellInDirection = function (originCell, direction) {

        var rowIndex = originCell.parentNode.rowIndex;
        var cellIndex = getCellIndex(originCell);

        var table = originCell.parentNode.parentNode.parentNode,
            row = getRowByIndex(rowIndex + getDirectionYDelta(direction), table),
            cell = row && getCellByIndex(row, cellIndex + getDirectionXDelta(direction, originCell));

        if (direction === 'Left' && cell) {
            return cellIsVisible(cell) && cell || self.getCellInDirection(cell, direction);
        }
        if (direction === 'Up' && row && cell) {
            return cellIsVisible(cell) && cell || self.getCellInDirection(cell, direction);
        }
        if (direction === 'Right' && cell) {
            return cellIsVisible(cell) && cell || self.getCellInDirection(cell, direction);
        }
        if (direction === 'Down' && row && cell) {
            return cellIsVisible(cell) && cell || self.getCellInDirection(cell, direction);
        }

        return undefined;
    };
    self.getSelectableCellInDirection = function (originCell, direction) {
        var lastCell,
            cell = originCell;

        while (cell) {
            cell = self.getCellInDirection(cell, direction);

            if (cell && cellIsSelectable(cell)) {
                return cell;
            }
        }

        return originCell;
    };
    self.getLastSelectableCellInDirection = function (originCell, direction) {
        var nextCell = originCell;
        do {
            cell = nextCell;
            nextCell = self.getSelectableCellInDirection(cell, direction);
        } while(nextCell !== cell);

        return cell;
    };
    self.getCellsInArea = function (startCell, endCell) {
        var startX = Math.min(getCellIndex(startCell), getCellIndex(endCell)),
            startY = Math.min(startCell.parentNode.rowIndex, endCell.parentNode.rowIndex),
            endX = Math.max(getCellIndex(startCell), getCellIndex(endCell)),
            endY = Math.max(startCell.parentNode.rowIndex, endCell.parentNode.rowIndex),
            x, y,
            cell,
            cells = [];

        for (x = startX; x <= endX; ++x) {
            for (y = startY; y <= endY; ++y) {
                cell = getCellByIndex(getRowByIndex(y), x);
                if(cellIsVisible(cell)) {
                    cells.push(cell || {});
                }
            }
        }

        return cells;
    };

    function getDirectionXDelta (direction, cell) {
        if (direction === 'Left') {
            return -1;
        }

        if (direction === 'Right') {
            return cell.colSpan;
        }

        return 0;
    }

    function getDirectionYDelta (direction) {
        if (direction === 'Up') {
            return -1;
        }

        if (direction === 'Down') {
            return 1;
        }

        return 0;
    }

    function getCellIndex (cell) {
        var row = cell.parentNode,
            colSpanSum = 0,
            i;

        for (i = 0; i < row.children.length; i++) {
            if (row.children[i] === cell) {
                break;
            }

            colSpanSum += row.children[i].colSpan;
        }

        return colSpanSum;
    }
}

},{"./polyfill":41,"events":7}],44:[function(require,module,exports){
var polyfill = require('./polyfill');

module.exports = SelectionView;

SelectionView.prototype = {};

function SelectionView (table, selection) {
    var self = this,
        html = document.getElementsByTagName('html')[0];

    self.element = document.createElement('div');
    self.element.className = 'editable-cell-selection';
    self.element.style.position = 'absolute';
    self.element.style.display = 'none';
    self.element.tabIndex = -1;

    self.inputElement = document.createElement('input');
    self.inputElement.className = 'editable-cell-input';
    self.inputElement.style.position = 'absolute';
    self.inputElement.style.display = 'none';

    self.copyPasteElement = document.createElement('textarea');
    self.copyPasteElement.style.position = 'absolute';
    self.copyPasteElement.style.opacity = '0.0';
    self.copyPasteElement.style.display = 'none';

    table.parentNode.insertBefore(self.element, table.nextSibling);
    table.parentNode.insertBefore(self.inputElement, table.nextSibling);
    table.appendChild(self.copyPasteElement);

    self.destroy = function () {
        self.element.removeEventListener('mousedown', self.onMouseDown);
        self.element.removeEventListener('dblclick', self.onDblClick);
        self.element.removeEventListener('keypress', self.onKeyPress);
        self.element.removeEventListener('keydown', self.onKeyDown);

        self.inputElement.removeEventListener('keydown', self.onInputKeydown);
        self.inputElement.removeEventListener('blur', onInputBlur);

        html.removeEventListener('mouseup', self.onMouseUp);

        table.parentNode.removeChild(self.element);
        table.parentNode.removeChild(self.inputElement);
        table.removeChild(self.copyPasteElement);
        
        selection = null;
        self = null;
    };
    self.show = function () {
        self.element.style.display = 'block';
        self.element.focus();

        var rect = selection.getRange().end.getBoundingClientRect(),
            horizontalMargin = rect.width,
            verticalMargin = rect.height,
            scrollHost = self.scrollHost || document.body,
            viewport = scrollHost.getBoundingClientRect(),
            viewportTop = Math.max(viewport.top, 0),
            viewportLeft = Math.max(viewport.left, 0),
            viewportBottom = Math.min(viewport.bottom, window.innerHeight),
            viewportRight = Math.min(viewport.right, window.innerWidth),
            topOffset = rect.top - verticalMargin - viewportTop,
            bottomOffset = viewportBottom - rect.bottom - verticalMargin,
            leftOffset = rect.left - horizontalMargin - viewportLeft,
            rightOffset = viewportRight - rect.right - horizontalMargin;

        if (topOffset < 0) {
            scrollHost.scrollTop += topOffset;
        }
        if (bottomOffset < 0) {
            scrollHost.scrollTop -= bottomOffset;
        }
        if (leftOffset < 0) {
            scrollHost.scrollLeft += leftOffset;
        }
        if (rightOffset < 0) {
            scrollHost.scrollLeft -= rightOffset;
        }
    };
    
    function resolve (value) {
        if (typeof value === 'function') {
            return value();
        }

        return value;
    }

    self.hide = function () {
        self.element.style.display = 'none';
    };
    self.focus = function () {
        self.element.focus();
    };
    self.update = function (start, end) {
        var top = Math.min(start.offsetTop, end.offsetTop),
            left = Math.min(start.offsetLeft, end.offsetLeft),
            bottom = Math.max(start.offsetTop + start.offsetHeight,
                            end.offsetTop + end.offsetHeight),
            right = Math.max(start.offsetLeft + start.offsetWidth,
                            end.offsetLeft + end.offsetWidth);

        self.element.style.top = table.offsetTop + top + 1 + 'px';
        self.element.style.left = table.offsetLeft + left + 1 + 'px';
        self.element.style.height = bottom - top - 1 + 'px';
        self.element.style.width = right - left - 1 + 'px';
        self.element.style.backgroundColor = 'rgba(245, 142, 00, 0.15)';

        self.show();
    };
    self.beginDrag = function () {
        self.canDrag = true;
        self.element.addEventListener('mousemove', self.doBeginDrag);
    };
    self.doBeginDrag = function () {
        self.element.removeEventListener('mousemove', self.doBeginDrag);

        if (!self.canDrag) {
            return;
        }

        self.isDragging = true;
        self.element.style.pointerEvents = 'none';
    };
    self.endDrag = function () {
        self.element.removeEventListener('mousemove', self.doBeginDrag);
        self.isDragging = false;
        self.canDrag = false;
        self.element.style.pointerEvents = 'inherit';
    };

    self.onMouseUp = function (event) {
        self.endDrag();
    };
    self.onMouseDown = function (event) {
        if (event.button !== 0) {
            return;
        }

        self.hide();

        var cell = event.view.document.elementFromPoint(event.clientX, event.clientY);
        selection.onCellMouseDown(cell, event.shiftKey);

        event.preventDefault();
    };
    self.onDblClick = function (event) {
        selection.startLockedEditing();
    };
    self.onKeyPress = function (event) {
        selection.startEditing();
    };
    self.onKeyDown = function (event) {
        if (event.keyCode === 13) {
            selection.onReturn(event);
        } else if ([37, 38, 39, 40].indexOf(event.keyCode) !== -1) {
            selection.onArrows(event);
        } else if (event.keyCode === 86 && event.ctrlKey) {
            self.copyPasteElement.value = '';
            self.copyPasteElement.style.display = 'block';
            self.copyPasteElement.focus();
            setTimeout(function () {
                selection.onPaste(self.copyPasteElement.value);
                self.copyPasteElement.style.display = 'none';
                self.focus();
            }, 0);
        } else if (event.keyCode === 67 && event.ctrlKey) {
            self.copyPasteElement.value = selection.onCopy();
            self.copyPasteElement.style.display = 'block';
            self.copyPasteElement.focus();
            document.execCommand('selectAll', false, null);
            setTimeout(function () {
                self.copyPasteElement.style.display = 'none';
                self.focus();
            }, 0);
        } else if (event.keyCode === 9) {
            selection.onTab(event);
        } else if (event.keyCode === 46 || (event.keyCode === 8 && event.ctrlKey)) {
            // either DELETE key || CTRL + BACKSPACE
            var cell = selection.getRange().start;
            selection.updateCellValue(cell, null);
        }
    };
    self.onInputKeydown = function (event) {
        var cell = selection.getRange().start;

        if (event.keyCode === 13) { // Return
            var value = selection.endEditingCell(cell);

            if (event.ctrlKey) {
                selection.getCells().forEach(function (cellInSelection) {
                    if (cellInSelection !== cell) {
                        selection.updateCellValue(cellInSelection, value);
                    }
                });
            }

            selection.onReturn(event, event.ctrlKey);
            self.focus();
            event.preventDefault();
        }
        else if (event.keyCode === 27) { // Escape
            selection.cancelEditingCell(cell);
            self.focus();
        }
        else if ([37, 38, 39, 40].indexOf(event.keyCode) !== -1) { // Arrows
            if(!self.isLockedToCell) {
                self.focus();
                selection.onArrows(event);
                event.preventDefault();
            }
        }
    };
    function onInputBlur (event) {
        if (!selection.isEditingCell()) {
            return;
        }
        selection.endEditingCell(selection.getRange().start);
    }

    self.element.addEventListener("mousedown", self.onMouseDown);
    self.element.addEventListener("dblclick", self.onDblClick);
    self.element.addEventListener("keypress", self.onKeyPress);
    self.element.addEventListener("keydown", self.onKeyDown);

    self.inputElement.addEventListener("keydown", self.onInputKeydown);
    self.inputElement.addEventListener("blur", onInputBlur);

    html.addEventListener("mouseup", self.onMouseUp);
}
},{"./polyfill":41}],45:[function(require,module,exports){
var editableCell = require('../../src/editableCell');
var utils = require('../utils');

describe('editableCell binding', function () {
    it('should be registered with Knockout', function () {
        ko.bindingHandlers.should.have.property('editableCell');
    });

    describe('cell value initial assignment', function () {
        it('should assign constant value', function () {
            var cell = utils.createCell("editableCell: 'value'");

            ko.applyBindings({}, cell);

            cell.innerHTML.should.equal('value');
        });

        it('should assign variable value', function () {
            var cell = utils.createCell("editableCell: variable");

            ko.applyBindings({variable: 'value'}, cell);

            cell.innerHTML.should.equal('value');
        });

        it('should assign observable value', function () {
            var cell = utils.createCell("editableCell: observable");

            ko.applyBindings({observable: ko.observable('value')}, cell);

            cell.innerHTML.should.equal('value');
        });

        it('should prefer cellText helper binding', function () {
            var cell = utils.createCell("editableCell: 'value', cellText: 'text'");

            ko.applyBindings({}, cell);

            cell.innerHTML.should.equal('text');
        });

        it('should prefer template', function () {
            var cell = utils.createCell("editableCell: 'value'");
            cell.appendChild(utils.createElement('span', "text: 'template'"));

            ko.applyBindings({}, cell);

            cell.innerHTML.should.equal(
                '<span data-bind="text: \'template\'">template</span>');
        });
    });

    describe('cell value synchronization', function () {
        it('should reassign cell value when observable value changes', function () {
            var cell = utils.createCell("editableCell: observable");
            var observable = ko.observable('value');

            ko.applyBindings({observable: observable}, cell);

            observable('updated value');
            cell.innerHTML.should.equal('updated value');
        });

        it('should update observable value when cell value changes', function () {
            var cell = utils.createCell("editableCell: observable") ;
            var observable = ko.observable('value');

            ko.applyBindings({observable: observable}, cell);

            editableCell.setCellValue(cell, 'updated value');

            observable().should.equal('updated value');
        });
    });
});
},{"../../src/editableCell":33,"../utils":47}],46:[function(require,module,exports){
var editableCell = require('../../src/editableCell');
var utils = require('../utils');

describe('editableCellSelection binding', function () {
    it('should be registered with Knockout', function () {
        ko.bindingHandlers.should.have.property('editableCellSelection');
    });

    describe('selection synchronization', function () {
        it('should be empty initially', function () {
            var cell = utils.createCell("editableCell: 'value'");
            var table = cell.parentNode.parentNode.parentNode;
            var selection = ko.observableArray();

            table.setAttribute('data-bind', 'editableCellSelection: selection');
            document.body.appendChild(table);
            ko.applyBindings({selection: selection}, table);

            selection().should.eql([]);
        });

        it('should contain cell when selected', function () {
            var cell = utils.createCell("editableCell: 'value'");
            var table = cell.parentNode.parentNode.parentNode;
            var selection = ko.observableArray();

            table.setAttribute('data-bind', 'editableCellSelection: selection');
            document.body.appendChild(table);
            ko.applyBindings({selection: selection}, table);

            editableCell.selectCell(cell);

            selection().should.eql([{
                cell: cell,
                value: 'value',
                content: 'value'
            }]);
        });

        it('should select cell when updated', function () {
            var cell = utils.createCell("editableCell: 'value'");
            var table = cell.parentNode.parentNode.parentNode;
            var selection = ko.observableArray();

            table.setAttribute('data-bind', 'editableCellSelection: selection');
            document.body.appendChild(table);
            ko.applyBindings({selection: selection}, table);

            selection([cell]);

            editableCell.getTableSelection(table).getCells().should.eql([cell]);
        });

        it('should not contain hidden cells', function () {
            var aCell = utils.createCell("editableCell: 'a'");
            var row = aCell.parentNode;
            var table = row.parentNode.parentNode;
            
            var bCell = utils.addCell(row, "editableCell: 'b'");
            var cCell = utils.addCell(row, "editableCell: 'c'");
            bCell.style.display = 'none';

            document.body.appendChild(table);

            var selection = ko.observableArray();
            table.setAttribute('data-bind', 'editableCellSelection: selection');
            ko.applyBindings({selection: selection}, table);

            selection([aCell, cCell]);

            selection().should.eql([{
                cell: aCell,
                value: 'a',
                content: 'a'
            }, {
                cell: cCell,
                value: 'c',
                content: 'c'
            }]);
        });
    });
});
},{"../../src/editableCell":33,"../utils":47}],47:[function(require,module,exports){
module.exports = {
    createCell: createCell,
    createElement: createElement,
    addCell: addCell
};

function createCell (dataBind) {
    var container = document.createElement('div'),
        table = document.createElement('table'),
        tbody = document.createElement('tbody'),
        tr =  document.createElement('tr'),
        td = createElement('td', dataBind);

    container.appendChild(table);
    table.appendChild(tbody);
    tbody.appendChild(tr);
    tr.appendChild(td);

    return td;
}

function createElement (tag, dataBind) {
    var element = document.createElement(tag);

    element.setAttribute('data-bind', dataBind);

    return element;
}

function addCell (parentRow, dataBind) {
    var td = createElement('td', dataBind);
    parentRow.appendChild(td);
    return td;
}
},{}]},{},[1]);
