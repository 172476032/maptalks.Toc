(function () {
'use strict';
'0.15.0';

/**
 * @namespace
 */
var maptalks = {};

/**
 * From https://github.com/abhirathore2006/detect-is-node/
 *
 * @property {boolean} node - whether running in nodejs.
 * @global
 * @name node
 * @static
 */
maptalks.node = (function () {
    return new Function('try { return this === global; } catch(e) { return false; }')();
})();

if (!maptalks.node) {
    (function () {

        var ua = navigator.userAgent.toLowerCase(),
            doc = document.documentElement,

            ie = 'ActiveXObject' in window,

            webkit    = ua.indexOf('webkit') !== -1,
            phantomjs = ua.indexOf('phantom') !== -1,
            android23 = ua.search('android [23]') !== -1,
            chrome    = ua.indexOf('chrome') !== -1,
            gecko     = ua.indexOf('gecko') !== -1  && !webkit && !window.opera && !ie,

            mobile = typeof orientation !== 'undefined' || ua.indexOf('mobile') !== -1,
            msPointer = !window.PointerEvent && window.MSPointerEvent,
            pointer = (window.PointerEvent && navigator.pointerEnabled) || msPointer,

            ie3d = ie && ('transition' in doc.style),
            webkit3d = ('WebKitCSSMatrix' in window) && ('m11' in new window.WebKitCSSMatrix()) && !android23,
            gecko3d = 'MozPerspective' in doc.style,
            opera12 = 'OTransition' in doc.style,
            any3d = (ie3d || webkit3d || gecko3d) && !opera12 && !phantomjs;

        var touch = !phantomjs && (pointer || 'ontouchstart' in window ||
                (window.DocumentTouch && document instanceof window.DocumentTouch));

        maptalks.Browser = {
            ie: ie,
            ielt9: ie && !document.addEventListener,
            edge: 'msLaunchUri' in navigator && !('documentMode' in document),
            webkit: webkit,
            gecko: gecko,
            android: ua.indexOf('android') !== -1,
            android23: android23,
            chrome: chrome,
            safari: !chrome && ua.indexOf('safari') !== -1,
            phantomjs : phantomjs,

            ie3d: ie3d,
            webkit3d: webkit3d,
            gecko3d: gecko3d,
            opera12: opera12,
            any3d: any3d,

            mobile: mobile,
            mobileWebkit: mobile && webkit,
            mobileWebkit3d: mobile && webkit3d,
            mobileOpera: mobile && window.opera,
            mobileGecko: mobile && gecko,

            touch: !!touch,
            msPointer: !!msPointer,
            pointer: !!pointer,

            retina: (window.devicePixelRatio || (window.screen.deviceXDPI / window.screen.logicalXDPI)) > 1,

            language: navigator.browserLanguage ? navigator.browserLanguage : navigator.language,
            ie9: (ie && document.documentMode === 9),
            ie10: (ie && document.documentMode === 10),
            canvas: (!!document.createElement('canvas').getContext)
        };
    }());
} else {
    //usually in node
    maptalks.Browser = {
        canvas:true
    };
}


if (!maptalks.node) {
    (function () {
        //解析host地址，插入css和vml定义
        var head = document.getElementsByTagName('head')[0];

        var headChildren = head.childNodes;
        var viewPortMeta = null;
        for (var i = 0, len = headChildren.length; i < len; i++) {
            if (headChildren[i].nodeName.toLowerCase() === 'meta') {
                var metaName = (headChildren[i].getAttribute ? headChildren[i].getAttribute('name') : null);
                if (metaName === 'viewport') {
                    viewPortMeta = headChildren[i];
                }
            }
        }

        if (maptalks.Browser.mobile) {
            if (viewPortMeta === null) {
                viewPortMeta = document.createElement('meta');
                viewPortMeta.setAttribute('name', 'viewport');
                viewPortMeta.setAttribute('content', 'user-scalable=no');
                head.appendChild(viewPortMeta);
            } else {
                var viewPortContent = viewPortMeta.getAttribute('content');
                if (viewPortContent.indexOf('user-scalable=no') < 0) {
                    viewPortMeta.setAttribute('content', viewPortContent + ',user-scalable=no');
                }
            }
        }

        if (maptalks.Browser.ielt9) {
            //chrome frame meta标签
            var cfMeta = document.createElement('meta');
            cfMeta.setAttribute('http-equiv', 'X-UA-Compatible');
            cfMeta.setAttribute('content', 'IE=edge,chrome=1');
            head.appendChild(cfMeta);
        }
    })();
}

//internal constants.
maptalks.internalLayerPrefix = '_maptalks__internal_layer_';

/**
 * Misc utilities used internally
 * @class
 * @category core
 * @protected
 */
maptalks.Util = {
    /**
     * @property {Number} uid
     * @static
     */
    uid: 0,

    now:function () {
        if (!Date.now) {
            return new Date().getTime();
        }
        return Date.now();
    },

    /**
     * Extend a object with one or more source objects.
     * @param  {Object} dest   - object to extend
     * @param  {...Object} src - sources
     * @return {Object}
     */
    extend: function (dest) { // (Object[, Object, ...]) ->
        for (var i = 1; i < arguments.length; i++) {
            var src = arguments[i];
            for (var k in src) {
                dest[k] = src[k];
            }
        }
        return dest;
    },

    /**
     * Set options to a object, extends its options member.
     * @param {Object} obj      - object to set options to
     * @param {Object} options  - options to set
     * @returns {Object} options set
     */
    setOptions: function (obj, options) {
        if (!obj.hasOwnProperty('options')) {
            obj.options = obj.options ? maptalks.Util.create(obj.options) : {};
        }
        for (var i in options) {
            obj.options[i] = options[i];
        }
        return obj.options;
    },

    isSVG:function (url) {
        var prefix = 'data:image/svg+xml';
        if (url.length > 4 && url.slice(-4) === '.svg') {
            return 1;
        } else if (url.slice(0, prefix.length) === prefix) {
            return 2;
        }
        return 0;
    },

    /**
     * Load a image, can be a remote one or a local file. <br>
     * If in node, a SVG image will be converted to a png file by [svg2img]{@link https://github.com/FuZhenn/node-svg2img}<br>
     * @param  {Image} img  - the image object to load.
     * @param  {Object[]} imgDesc - image's descriptor, it's a array. imgUrl[0] is the url string, imgUrl[1] is the width, imgUrl[2] is the height.
     * @return maptalks.Util
     */
    loadImage:function (img, imgDesc) {
        if (!maptalks.node) {
            img.src = imgDesc[0];
            return this;
        }
        function onError(err) {
            if (err) {
                console.error(err);
                console.error(err.stack);
            }
            var onerrorFn = img.onerror;
            if (onerrorFn) {
                onerrorFn.call(img);
            }
        }
        function onLoadComplete(err, data) {
            if (err) {
                onError(err);
                return;
            }
            var onloadFn = img.onload;
            if (onloadFn) {
                img.onload = function () {
                    onloadFn.call(img);
                };
            }
            img.src = data;
        }
        var url = imgDesc[0],
            w   = imgDesc[1],
            h   = imgDesc[2];
        try {
            if (maptalks.Util.isSVG(url) && maptalks.Util.convertSVG) {
                maptalks.Util.convertSVG(url, w, h, onLoadComplete);
            } else if (maptalks.Util.isURL(url)) {
                //canvas-node的Image对象
                this._loadRemoteImage(img, url, onLoadComplete);
            } else {
                this._loadLocalImage(img, url, onLoadComplete);
            }
        } catch (error) {
            onError(error);
        }
        return this;
    },

    _loadRemoteImage:function (img, url, onComplete) {
        //http
        var loader;
        if (url.indexOf('https://') === 0) {
            loader = require('https');
        } else {
            loader = require('http');
        }
        var urlObj = require('url').parse(url);
        //mimic the browser to prevent server blocking.
        urlObj.headers = {
            'Accept':'image/*,*/*;q=0.8',
            'Accept-Encoding':'gzip, deflate',
            'Cache-Control':'no-cache',
            'Connection':'keep-alive',
            'Host':urlObj.host,
            'Pragma':'no-cache',
            'User-Agent':'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.94 Safari/537.36'
        };
        loader.request(urlObj, function (res) {
            var data = [];
            res.on('data', function (chunk) {
                data.push(chunk);
            });
            res.on('end', function () {
                onComplete(null, Buffer.concat(data));
            });
        }).on('error', onComplete).end();
    },

    _loadLocalImage:function (img, url, onComplete) {
        //local file
        require('fs').readFile(url, onComplete);
    },

    fixPNG:function () {

    },

    /**
     * Generate a global UID, not a real UUID, just a auto increment key with a prefix.
     * @return {Number}
     */
    UID: function () {
        return maptalks.Util.uid++;
    },

    /**
     * Parse a JSON string to a object
     * @param {String} str      - a JSON string
     * @return {Object}
     */
    parseJSON:function (str) {
        if (!str || !maptalks.Util.isString(str)) {
            return str;
        }
        return JSON.parse(str);
    },

    /**
     * Object.create or a polyfill in old browsers.
     * @function
     * @param {Object} proto - the proto to create on.
     * @return {Object}
     */
    create: Object.create || (function () {
        function F() {}
        return function (proto) {
            F.prototype = proto;
            return new F();
        };
    })(),

    /**
     * Function.bind or a polyfill in old browsers.
     * @param {Function} fn     - function to bind
     * @param {Object} obj      - context to bind
     * @return {Function} function binded.
     */
    bind: function (fn, obj) {
        var slice = Array.prototype.slice;
        if (fn.bind) {
            return fn.bind.apply(fn, slice.call(arguments, 1));
        }
        var args = slice.call(arguments, 2);
        return function () {
            return fn.apply(obj, args.length ? args.concat(slice.call(arguments)) : arguments);
        };
    },

    /**
     * from leaflet <br>
     * return a function that won't be called more often than the given interval
     *
     * @param  {Function} fn      - function to call
     * @param  {Number}   time    - interval to throttle
     * @param  {Object}   context - function's context
     * @return {Function} the throttled function
     */
    throttle: function (fn, time, context) {
        var lock, args, wrapperFn, later;

        later = function () {
            // reset lock and call if queued
            lock = false;
            if (args) {
                wrapperFn.apply(context, args);
                args = false;
            }
        };

        wrapperFn = function () {
            if (lock) {
                // called too soon, queue to call later
                args = arguments;

            } else {
                // call and lock until later
                fn.apply(context, arguments);
                setTimeout(later, time);
                lock = true;
            }
        };

        return wrapperFn;
    },

    executeWhen: function (fn, when) {
        var exe = function () {
            if (when()) {
                fn();
            } else {
                maptalks.Util.requestAnimFrame(exe);
            }
        };

        exe();
        return this;
    },

    removeFromArray:function (obj, array) {
        for (var i = array.length - 1; i >= 0; i--) {
            if (array[i] === obj) {
                return array.splice(i, 1);
            }
        }
        return null;
    },


    mapArrayRecursively:function (arr, fn, context) {
        if (!this.isArray(arr)) {
            return null;
        }
        var result = [],
            p, pp;
        for (var i = 0, len = arr.length; i < len; i++) {
            p = arr[i];
            if (maptalks.Util.isNil(p)) {
                result.push(null);
                continue;
            }
            if (maptalks.Util.isArray(p)) {
                result.push(maptalks.Util.mapArrayRecursively(p, fn, context));
            } else {
                pp = context ? fn.call(context, p) : fn(p);
                result.push(pp);
            }

        }
        return result;
    },


    mapArray: function (array, fn, context) {
        if (!this.isArray(array)) {
            return null;
        }
        var result = [],
            p, pp;
        for (var i = 0, len = array.length; i < len; i++) {
            p = array[i];
            if (maptalks.Util.isNil(p)) {
                result.push(null);
                continue;
            }
            pp = context ? fn.call(context, p) : fn(p);
            result.push(pp);
        }
        return result;
    },

    indexOfArray:function (obj, arr) {
        if (!maptalks.Util.isArrayHasData(arr)) {
            return -1;
        }
        for (var i = 0, len = arr.length; i < len; i++) {
            if (arr[i] === obj) {
                return i;
            }
        }
        return -1;
    },

    getValueOrDefault: function (v, d) {
        return v === undefined ? d : v;
    },

    /**
     * Shallow comparison of two objects <br>
     * borrowed from expect.js
     * @param  {Object} a
     * @param  {Object} b
     * @return {Boolean}
     */
    objEqual:function (a, b) {
        return maptalks.Util._objEqual(a, b);
    },

    /**
     * Deep comparison of two objects <br>
     * borrowed from expect.js
     * @param  {Object} a
     * @param  {Object} b
     * @return {Boolean}
     */
    objDeepEqual:function (a, b) {
        return maptalks.Util._objEqual(a, b, true);
    },

    _objEqual:function (a, b, isDeep) {
        function getKeys(obj) {
            if (Object.keys) {
                return Object.keys(obj);
            }
            var keys = [];
            for (var i in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, i)) {
                    keys.push(i);
                }
            }
            return keys;
        }
        if (maptalks.Util.isNil(a) || maptalks.Util.isNil(b)) {
            return false;
        }
        // an identical "prototype" property.
        if (a.prototype !== b.prototype) { return false; }
        var ka, kb, key, i;
        try {
            ka = getKeys(a);
            kb = getKeys(b);
        } catch (e) { //happens when one is a string literal and the other isn't
            return false;
        }
        // having the same number of owned properties (keys incorporates hasOwnProperty)
        if (ka.length !== kb.length) {
            return false;
        }
        //~~~cheap key test
        for (i = ka.length - 1; i >= 0; i--) {
            if (ka[i] !== kb[i]) {
                return false;
            }
        }
        //equivalent values for every corresponding key, and
        //~~~possibly expensive deep test
        if (isDeep) {
            for (i = ka.length - 1; i >= 0; i--) {
                key = ka[i];
                if (!maptalks.Util.objEqual(a[key], b[key])) {
                    return false;
                }
            }
        }
        return true;
    },

    /*
     * round a number, more efficient one.
     * @param  {Number} num - num to round
     * @return {Number}
     */
    round:function (num) {
        if (num > 0) {
            return (0.5 + num) << 0;
        } else {
            return (num - 0.5) << 0;
        }
    },
    /*
     * Whether the object is a coordinate
     * @param  {Object} obj     - object
     * @return {Boolean}
     */
    isCoordinate:function (obj) {
        if (obj instanceof maptalks.Coordinate) {
            return true;
        }
        /*if (obj && !maptalks.Util.isNil(obj.x) && !maptalks.Util.isNil(obj.y)) {
            return true;
        }*/
        return false;
    },
    /*
     * Whether the object is null or undefined.
     * @param  {Object}  obj - object
     * @return {Boolean}
     */
    isNil:function (obj) {
        return obj == null;
    },

    /*
     * Whether val is a number and not a NaN.
     * @param  {Object}  val - val
     * @return {Boolean}
     */
    isNumber:function (val) {
        return (typeof val === 'number') && !isNaN(val);
    },

    /*
     * Whether the obj is a javascript object.
     * @param  {*}  obj     - object to check
     * @return {Boolean}
     */
    isObject: function (obj) {
        return typeof obj === 'object' && !!obj;
    },

    /*
     * 判断数组中是否包含obj
     * @param {Object} obj
     * @return {Boolean} true|false
     */
    isArrayHasData:function (obj) {
        return this.isArray(obj) && obj.length > 0;
    },
    /*
     * 判断是否数组
     * @param {Object} obj
     * @return {Boolean} true|false
     */
    isArray:function (obj) {
        if (!obj) { return false; }
        if (Array.isArray) {
            return Array.isArray(obj);
        }
        return Object.prototype.toString.call(obj) === '[object Array]';
    },
    /**
     * 判断是否字符串
     * @param {Object} _str
     * @return {Boolean} true|false
     */
    isString:function (_str) {
        if (maptalks.Util.isNil(_str)) { return false; }
        return typeof _str === 'string' || (_str.constructor !== null && _str.constructor === String);
    },
    /*
     * 判断是否函数
     * @param {Object} _func
     * @return {Boolean} true|false
     */
    isFunction:function (_func) {
        if (this.isNil(_func)) {
            return false;
        }
        return typeof _func === 'function' || (_func.constructor !== null && _func.constructor === Function);
    },
    /**
     * Whether the input string is a valid url.
     * @param  {String}  url - url to check
     * @return {Boolean}
     */
    isURL:function (url) {
        if (!url) {
            return false;
        }
        var head = url.slice(0, 6);
        if (head === 'http:/' || head === 'https:') {
            return true;
        }
        return false;
    },
    //改原先的regex名字为xWithQuote；不带引号的regex，/^url\(([^\'\"].*[^\'\"])\)$/i，为xWithoutQuote。然后在is函数里||测试，extract函数里if...else处理。没引号的匹配后，取matches[1]
    // match: url('x'), url("x").
    // TODO: url(x)
    cssUrlReWithQuote: /^url\(([\'\"])(.+)\1\)$/i,

    cssUrlRe:/^url\(([^\'\"].*[^\'\"])\)$/i,

    isCssUrl: function (str) {
        if (!maptalks.Util.isString(str)) {
            return 0;
        }
        var head = str.slice(0, 6);
        if (head === 'http:/' || head === 'https:') {
            return 3;
        }
        if (maptalks.Util.cssUrlRe.test(str)) {
            return 1;
        }
        if (maptalks.Util.cssUrlReWithQuote.test(str)) {
            return 2;
        }
        return 0;
    },

    extractCssUrl: function (str) {
        var test = maptalks.Util.isCssUrl(str), matches;
        if (test === 3) {
            return str;
        }
        if (test === 1) {
            matches = maptalks.Util.cssUrlRe.exec(str);
            return matches[1];
        } else if (test === 2) {
            matches = maptalks.Util.cssUrlReWithQuote.exec(str);
            return matches[2];
        } else {
            // return as is if not an css url
            return str;
        }
    },

    b64chrs : 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',

    /**
     * btoa or a polyfill in old browsers. <br>
     * Creates a base-64 encoded ASCII string from a String object in which each character in the string is treated as a byte of binary data.<br>
     * From https://github.com/davidchambers/Base64.js
     * @param  {Buffer} input - input string to convert
     * @return {String} ascii
     * @example
     *     var encodedData = maptalks.Util.btoa(stringToEncode);
     */
    btoa:function (input) {
        if ((typeof window !== 'undefined') && window.btoa) {
            return window.btoa(input);
        }
        var str = String(input);
        for (
          // initialize result and counter
          var block, charCode, idx = 0, map = maptalks.Util.b64chrs, output = '';
          // if the next str index does not exist:
          //   change the mapping table to "="
          //   check if d has no fractional digits
          str.charAt(idx | 0) || (map = '=', idx % 1);
          // "8 - idx % 1 * 8" generates the sequence 2, 4, 6, 8
          output += map.charAt(63 & block >> 8 - idx % 1 * 8)
        ) {
            charCode = str.charCodeAt(idx += 3 / 4);
            if (charCode > 0xFF) {
                throw new Error('\'btoa\' failed: The string to be encoded contains characters outside of the Latin1 range.');
            }
            block = block << 8 | charCode;
        }
        return output;
    },

    /**
     * Borrowed from jquery, evaluates a javascript snippet in a global context
     * @param {String} code
     */
    globalEval: function (code) {
        var script = document.createElement('script');
        script.text = code;
        document.head.appendChild(script).parentNode.removeChild(script);
    },

    /**
     * Borrowed from jquery, evaluates a script in a global context.
     * @param  {String} file    - javascript file to eval
     */
    globalScript: function (file) {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = file;
        document.head.appendChild(script);
    },

    lowerSymbolOpacity:function (symbol, ratio) {
        function s(_symbol, _ratio) {
            var op = _symbol['opacity'];
            if (maptalks.Util.isNil(op)) {
                _symbol['opacity'] = _ratio;
            } else {
                _symbol['opacity'] *= _ratio;
            }
        }
        var lower;
        if (maptalks.Util.isArray(symbol)) {
            lower = [];
            for (var i = 0; i < symbol.length; i++) {
                var d = maptalks.Util.extend({}, symbol[i]);
                s(d, ratio);
                lower.push(d);
            }
        } else {
            lower = maptalks.Util.extend({}, symbol);
            s(lower, ratio);
        }
        return lower;
    },

    extendSymbol:function (symbol) {
        var sources = Array.prototype.slice.call(arguments, 1);
        if (!sources || !sources.length) {
            sources = [{}];
        }
        if (maptalks.Util.isArray(symbol)) {
            var s, dest, i, ii, l, ll;
            var result = [];
            for (i = 0, l = symbol.length; i < l; i++) {
                s = symbol[i];
                dest = {};
                for (ii = 0, ll = sources.length; ii < ll; ii++) {
                    if (!maptalks.Util.isArray(sources[ii])) {
                        maptalks.Util.extend(dest, s, sources[ii] ? sources[ii] : {});
                    } else if (!maptalks.Util.isNil(sources[ii][i])) {
                        maptalks.Util.extend(dest, s, sources[ii][i]);
                    } else {
                        maptalks.Util.extend(dest, s ? s : {});
                    }
                }
                result.push(dest);
            }
            return result;
        } else {
            var args = [{}, symbol];
            args.push.apply(args, sources);
            return maptalks.Util.extend.apply(maptalks.Util, args);
        }
    },

    computeDegree: function (p1, p2) {
        var dx = p2.x - p1.x;
        var dy = p2.y - p1.y;
        return Math.atan2(dy, dx);
    },

    isGradient: function (g) {
        return g && g['colorStops'];
    },

    getGradientStamp: function (g) {
        var keys = [g['type']];
        if (g['places']) {
            keys.push(g['places'].join());
        }
        if (g['colorStops']) {
            var stops = [];
            for (var i = g['colorStops'].length - 1; i >= 0; i--) {
                stops.push(g['colorStops'][i].join());
            }
            keys.push(stops.join(','));
        }
        return keys.join('_');
    },

    getSymbolStamp: function (symbol) {
        var keys = [];
        if (maptalks.Util.isArray(symbol)) {
            for (var i = 0; i < symbol.length; i++) {
                keys.push(maptalks.Util.getSymbolStamp(symbol[i]));
            }
            return '[ ' + keys.join(' , ') + ' ]';
        }
        for (var p in symbol) {
            if (symbol.hasOwnProperty(p)) {
                if (!maptalks.Util.isFunction(symbol[p])) {
                    if (maptalks.Util.isGradient(symbol[p])) {
                        keys.push(p + '=' + maptalks.Util.getGradientStamp(symbol[p]));
                    } else {
                        keys.push(p + '=' + symbol[p]);
                    }
                }
            }
        }
        return keys.join(';');
    },

    /**
     * Get external resources from the given symbol
     * @param  {Object} symbol      - symbol
     * @param  {Boolean} toAbsolute - whether convert url to aboslute
     * @return {String[]}           - resource urls
     */
    getExternalResources: function (symbol, toAbsolute) {
        if (!symbol) {
            return null;
        }
        var symbols = symbol;
        if (!maptalks.Util.isArray(symbol)) {
            symbols = [symbol];
        }
        var resources = [];
        var props = maptalks.Symbolizer.resourceProperties,
            i, ii, iii, res, resSizeProp;
        var w, h;
        for (i = symbols.length - 1; i >= 0; i--) {
            symbol = symbols[i];
            if (!symbol) {
                continue;
            }
            if (toAbsolute) {
                symbol = maptalks.Util.convertResourceUrl(symbol);
            }
            for (ii = 0; ii < props.length; ii++) {
                res = symbol[props[ii]];
                if (maptalks.Util.isFunctionDefinition(res)) {
                    res = maptalks.Util.getFunctionTypeResources(res);
                }
                if (!res) {
                    continue;
                }
                if (!maptalks.Util.isArray(res)) {
                    res = [res];
                }
                for (iii = 0; iii < res.length; iii++) {
                    if (res[iii].slice(0, 4) === 'url(') {
                        res[iii] = maptalks.Util.extractCssUrl(res[iii]);
                    }
                    resSizeProp = maptalks.Symbolizer.resourceSizeProperties[ii];
                    resources.push([res[iii], symbol[resSizeProp[0]], symbol[resSizeProp[1]]]);
                }
            }
            if (symbol['markerType'] === 'path' && symbol['markerPath']) {
                w = maptalks.Util.isFunctionDefinition(symbol['markerWidth']) ? 200 : symbol['markerWidth'];
                h = maptalks.Util.isFunctionDefinition(symbol['markerHeight']) ? 200 : symbol['markerHeight'];
                if (maptalks.Util.isFunctionDefinition(symbol['markerPath'])) {
                    res = maptalks.Util.getFunctionTypeResources(symbol['markerPath']);
                    var path = symbol['markerPath'];
                    for (iii = 0; iii < res.length; iii++) {
                        symbol['markerPath'] = res[iii];
                        resources.push([maptalks.Geometry.getMarkerPathBase64(symbol), w, h]);
                    }
                    symbol['markerPath'] = path;
                } else {
                    resources.push([maptalks.Geometry.getMarkerPathBase64(symbol), w, h]);
                }
            }
        }
        return resources;
    },

     /**
     * Convert symbol's resources' urls from relative path to an absolute path.
     * @param  {Object} symbol
     * @private
     */
    convertResourceUrl: function (symbol) {
        if (!symbol) {
            return null;
        }

        var s = symbol;
        if (maptalks.node) {
            return s;
        }
        var props = maptalks.Symbolizer.resourceProperties;
        var res;
        for (var ii = 0, len = props.length; ii < len; ii++) {
            res = s[props[ii]];
            if (!res) {
                continue;
            }
            s[props[ii]] = this._convertUrlToAbsolute(res);
        }
        return s;
    },

    _convertUrlToAbsolute: function (res) {
        if (maptalks.Util.isFunctionDefinition(res)) {
            var stops = res.stops;
            for (var i = 0; i < stops.length; i++) {
                stops[i][1] = maptalks.Util._convertUrlToAbsolute(stops[i][1]);
            }
            return res;
        }
        var embed = 'data:';
        if (res.slice(0, 4) === 'url(') {
            res = maptalks.Util.extractCssUrl(res);
        }
        if (!maptalks.Util.isURL(res) &&
            (res.length <= embed.length || res.substring(0, embed.length) !== embed)) {
            res = this._absolute(location.href, res);
        }
        return res;
    },

    _absolute: function (base, relative) {
        var stack = base.split('/'),
            parts = relative.split('/');
        if (relative.slice(0, 1) === 0) {
            return stack.slice(0, 3).join('/') + relative;
        } else {
            stack.pop(); // remove current file name (or empty string)
                         // (omit if "base" is the current folder without trailing slash)
            for (var i = 0; i < parts.length; i++) {
                if (parts[i] === '.')
                    continue;
                if (parts[i] === '..')
                    stack.pop();
                else
                    stack.push(parts[i]);
            }
            return stack.join('/');
        }
    },

    /**
     * Compile layer's style, styles to symbolize layer's geometries, e.g.<br>
     * <pre>
     * [
     *   {
     *     'filter' : ['==', 'foo', 'val'],
     *     'symbol' : {'markerFile':'foo.png'}
     *   }
     * ]
     * </pre>
     * @param  {Object|Object[]} styles - style to compile
     * @return {Object[]}       compiled styles
     */
    compileStyle: function (styles) {
        if (!maptalks.Util.isArray(styles)) {
            return maptalks.Util.compileStyle([styles]);
        }
        var compiled = [];
        for (var i = 0; i < styles.length; i++) {
            if (styles[i]['filter'] === true) {
                compiled.push({
                    'filter' : function () { return true; },
                    'symbol' : styles[i].symbol
                });
            } else {
                compiled.push({
                    'filter' : maptalks.Util.createFilter(styles[i]['filter']),
                    'symbol' : styles[i].symbol
                });
            }
        }
        return compiled;
    }

};

maptalks.Util.GUID = maptalks.Util.UID;


    //RequestAnimationFrame, inspired by Leaflet
(function () {
    if (maptalks.node) {
        maptalks.Util.requestAnimFrame = function (fn) {
            return setTimeout(fn, 16);
        };

        maptalks.Util.cancelAnimFrame = clearTimeout;
        return;
    }

    var requestFn, cancelFn;
    var lastTime = 0;


        // fallback for IE 7-8
    function timeoutDefer(fn) {
        var time = +new Date(),
            timeToCall = Math.max(0, 16 - (time - lastTime));

        lastTime = time + timeToCall;
        return setTimeout(fn, timeToCall);
    }
    function getPrefixed(name) {
        return window['webkit' + name] || window['moz' + name] || window['ms' + name];
    }
    if (typeof (window) != 'undefined') {
            // inspired by http://paulirish.com/2011/requestanimationframe-for-smart-animating/

        requestFn = window['requestAnimationFrame'] || getPrefixed('RequestAnimationFrame') || timeoutDefer;
        cancelFn = window['cancelAnimationFrame'] || getPrefixed('CancelAnimationFrame') ||
                           getPrefixed('CancelRequestAnimationFrame') || function (id) { window.clearTimeout(id); };
    } else {
        requestFn = timeoutDefer;
        cancelFn =  function (id) { clearTimeout(id); };
    }
    maptalks.Util.requestAnimFrame = function (fn) {
        return requestFn(fn);
    };

    maptalks.Util.cancelAnimFrame = function (id) {
        if (id) {
            cancelFn(id);
        }
    };
})();

/**
 * String utilities  used internally
 * @class
 * @category core
 * @protected
 */
maptalks.StringUtil = {

    /**
     * Trim the string
     * @param {String} str
     * @return {String}
     */
    trim: function (str) {
        return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
    },

    /**
     * Split string by specified char
     * @param {String} chr - char to split
     * @return {String[]}
     */
    splitWords: function (chr) {
        return maptalks.StringUtil.trim(chr).split(/\s+/);
    },

    /**
     * Gets size in pixel of the text with a certain font.
     * @param {String} text - text to measure
     * @param {String} font - font of the text, same as the CSS font.
     * @return {maptalks.Size}
     */
    stringLength:function (text, font) {
        var ruler = maptalks.DomUtil._getDomRuler('span');
        ruler.style.font = font;
        ruler.innerHTML = text;
        var result = new maptalks.Size(ruler.clientWidth, ruler.clientHeight);
        //if not removed, the canvas container on chrome will turn to unexpected blue background.
        //Reason is unknown.
        maptalks.DomUtil.removeDomNode(ruler);
        return result;

    },

    /**
     * Split content by wrapLength 根据长度分割文本
     * @param {String} content      - text to split
     * @param {Number} textLength   - width of the text, provided to prevent expensive repeated text measuring
     * @param {Number} wrapWidth    - width to wrap
     * @return {String[]}
     */
    splitContent: function (content, textLength, wrapWidth) {
        var rowNum = Math.ceil(textLength / wrapWidth);
        var avgLen = textLength / content.length;
        var approxLen =  Math.floor(wrapWidth / avgLen);
        var result = [];
        for (var i = 0; i < rowNum; i++) {
            if (i < rowNum - 1) {
                result.push(content.substring(i * approxLen, (i + 1) * approxLen));
            } else {
                result.push(content.substring(i * approxLen));
            }
        }
        return result;
    },
    /**
     * Replace variables wrapped by square brackets ({foo}) with actual values in props.
     * @example
     *     // will returns 'John is awesome'
     *     var actual = maptalks.StringUtil.replaceVariable('{foo} is awesome', {'foo' : 'John'});
     * @param {String} str      - string to replace
     * @param {Object} props    - variable value properties
     * @return {String}
     */
    replaceVariable: function (str, props) {
        if (!maptalks.Util.isObject(props) || !maptalks.Util.isString(str)) {
            return str;
        }
        return str.replace(maptalks.StringUtil._contentExpRe, function (str, key) {
            var value = props[key];
            if (maptalks.Util.isNil(value)) {
                return str;
            }
            return value;
        });
    },

    _contentExpRe: /\{([\w_]+)\}/g,

    /**
     * Split a text to multiple rows according to the style.<br>
     * Style is generated in [TextMarkerSymbolizer]{@link maptalks.symbolizer.TextMarkerSymbolizer}
     * @param {String} text     - text to split
     * @param {Object} style    - text style
     * @return {Object[]} the object's structure: {rowNum: rowNum, textSize: textSize, rows: textRows}
     */
    splitTextToRow: function (text, style) {
        var font = maptalks.symbolizer.TextMarkerSymbolizer.getFont(style),
            lineSpacing = style['textLineSpacing'] || 0,
            rawTextSize = maptalks.StringUtil.stringLength(text, font),
            textWidth = rawTextSize['width'],
            textHeight = rawTextSize['height'],
            wrapChar = style['textWrapCharacter'],
            wrapWidth = style['textWrapWidth'],
            textRows = [];
        if (!wrapWidth || wrapWidth > textWidth) { wrapWidth = textWidth; }
        if (!maptalks.Util.isString(text)) {
            text += '';
        }
        var actualWidth = 0, size, i, l;
        if (wrapChar && text.indexOf(wrapChar) >= 0) {
            var texts = text.split(wrapChar),
                t, tSize, tWidth, contents, ii, ll;
            for (i = 0, l = texts.length; i < l; i++) {
                t = texts[i];
                //TODO stringLength is expensive, should be reduced here.
                tSize = maptalks.StringUtil.stringLength(t, font);
                tWidth = tSize['width'];
                if (tWidth > wrapWidth) {
                    contents = maptalks.StringUtil.splitContent(t, tWidth, wrapWidth);
                    for (ii = 0, ll = contents.length; ii < ll; ii++) {
                        size = maptalks.StringUtil.stringLength(contents[ii], font);
                        if (size['width'] > actualWidth) { actualWidth = size['width']; }
                        textRows.push({'text':contents[ii], 'size':size});
                    }
                } else {
                    if (tSize['width'] > actualWidth) { actualWidth = tSize['width']; }
                    textRows.push({'text':t, 'size':tSize});
                }
            }
        } else if (textWidth > wrapWidth) {
            var splitted = maptalks.StringUtil.splitContent(text, textWidth, wrapWidth);
            for (i = 0; i < splitted.length; i++) {
                size = maptalks.StringUtil.stringLength(splitted[i], font);
                if (size['width'] > actualWidth) { actualWidth = size['width']; }
                textRows.push({'text':splitted[i], 'size':size});
            }
        } else {
            if (rawTextSize['width'] > actualWidth) {
                actualWidth = rawTextSize['width'];
            }
            textRows.push({'text':text, 'size':rawTextSize});
        }

        var rowNum = textRows.length;
        var textSize = new maptalks.Size(actualWidth, textHeight * rowNum + lineSpacing * (rowNum - 1));
        return {'total': rowNum, 'size': textSize, 'rows': textRows, 'rawSize':rawTextSize};
    },

    /**
     * Gets text's align point according to the horizontalAlignment and verticalAlignment
     * @param  {maptalks.Size} size                  - text size
     * @param  {String} horizontalAlignment - horizontalAlignment: left/middle/right
     * @param  {String} verticalAlignment   - verticalAlignment: top/middle/bottom
     * @return {maptalks.Point}
     */
    getAlignPoint:function (size, horizontalAlignment, verticalAlignment) {
        var width = size['width'], height = size['height'];
        var alignW, alignH;
        if (horizontalAlignment === 'left') {
            alignW = -width;
        } else if (horizontalAlignment === 'middle') {
            alignW = -width / 2;
        } else if (horizontalAlignment === 'right') {
            alignW = 0;
        }
        if (verticalAlignment === 'top') {
            alignH = -height;
        } else if (verticalAlignment === 'middle') {
            alignH = -height / 2;
        } else if (verticalAlignment === 'bottom') {
            alignH = 0;
        }
        return new maptalks.Point(alignW, alignH);
    }
};


/**
 * DOM utilities used internally.
 * Learned a lot from Leaflet.DomUtil
 * @class
 * @category core
 * @protected
 * @memberOf maptalks
 * @name DomUtil
 */
maptalks.DomUtil = {

    /**
     * Create a html element.
     * @param {String} tagName
     * @returns {HTMLElement}
     */
    createEl:function (tagName, className) {
        var el = document.createElement(tagName);
        if (className) {
            maptalks.DomUtil.setClass(el, className);
        }
        return el;
    },

    /**
     * Create a html element on the specified container
     * @param {String} tagName
     * @param {String} style - css styles
     * @param {HTMLElement} container
     * @return {HTMLElement}
     */
    createElOn:function (tagName, style, container) {
        var el = this.createEl(tagName);
        if (style) {
            this.setStyle(el, style);
        }
        if (container) {
            container.appendChild(el);
        }
        return el;
    },

    /**
     * Removes a html element.
     * @param {HTMLElement} node
     */
    removeDomNode:function (node) {
        if (!node) { return; }
        if (maptalks.Browser.ielt9 || maptalks.Browser.ie9) {
            //fix memory leak in IE9-
            //http://com.hemiola.com/2009/11/23/memory-leaks-in-ie8/
            var d = maptalks.DomUtil.createEl('div');
            d.appendChild(node);
            d.innerHTML = '';
            d = null;
        } else if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    },

    /**
     * Adds a event listener to the dom element.
     * @param {HTMLElement} obj     - dom element to listen on
     * @param {String} typeArr      - event types, seperated by space
     * @param {Function} handler    - listener function
     * @param {Object} context      - function context
     * @return {maptalks.DomUtil}
     */
    addDomEvent:function (obj, typeArr, handler, context) {
        if (!obj || !typeArr || !handler) { return maptalks.DomUtil; }
        var eventHandler = function (e) {
            if (!e) {
                e = window.event;
            }
            return handler.call(context || obj, e);
        };
        var types = typeArr.split(' ');
        for (var i = types.length - 1; i >= 0; i--) {
            var type = types[i];
            if (!type) {
                continue;
            }

            if (!obj['Z__' + type]) {
                obj['Z__' + type] = [];

            }
            var hit = maptalks.DomUtil.listensDomEvent(obj, type, handler);
            if (hit >= 0) {
                maptalks.DomUtil.removeDomEvent(obj, type, handler);
            }
            obj['Z__' + type].push({callback:eventHandler, src:handler});
            if ('addEventListener' in obj) {
                //滚轮事件的特殊处理
                if (type === 'mousewheel' && document['mozHidden'] !== undefined) {
                    type = 'DOMMouseScroll';
                }
                obj.addEventListener(type, eventHandler, false);
            } else if ('attachEvent' in obj) {
                obj.attachEvent('on' + type, eventHandler);
            }
        }
        return maptalks.DomUtil;
    },

    /**
     * Removes event listener from a dom element
     * @param {HTMLElement} obj         - dom element
     * @param {String} typeArr          - event types, separated by space
     * @param {Function} handler        - listening function
     * @return {maptalks.DomUtil}
     */
    removeDomEvent:function (obj, typeArr, handler) {
        function doRemove(type, callback) {
            if ('removeEventListener' in obj) {
                //mouse wheel in firefox
                if (type === 'mousewheel' && document['mozHidden'] !== undefined) {
                    type = 'DOMMouseScroll';
                }
                obj.removeEventListener(type, callback, false);
            } else if ('detachEvent' in obj) {
                obj.detachEvent('on' + type, callback);
            }
        }
        if (!obj || !typeArr) { return this; }
        var types = typeArr.split(' ');
        for (var i = types.length - 1; i >= 0; i--) {
            var type = types[i];
            if (!type) {
                continue;
            }
            //remove all the listeners if handler is not given.
            if (!handler && obj['Z__' + type]) {
                var handlers = obj['Z__' + type];
                for (var j = 0, jlen = handlers.length; j < jlen; j++) {
                    doRemove(handlers[j].callback);
                }
                delete obj['Z__' + type];
                return this;
            }
            var hit = this.listensDomEvent(obj, type, handler);
            if (hit < 0) {
                return this;
            }
            var hitHandler = obj['Z__' + type][hit];
            doRemove(type, hitHandler.callback);
            obj['Z__' + type].splice(hit, 1);
        }
        return this;
    },

    /**
     * Check if event type of the dom is listened by the handler
     * @param {HTMLElement} obj     - dom element to check
     * @param {String} typeArr      - event
     * @param {Function} handler    - the listening function
     * @return {Number} - the handler's index in the listener chain, returns -1 if not.
     */
    listensDomEvent:function (obj, type, handler) {
        if (!obj || !obj['Z__' + type] || !handler) {
            return -1;
        }
        var handlers = obj['Z__' + type];
        for (var i = 0, len = handlers.length; i < len; i++) {
            if (handlers[i].src === handler) {
                return i;
            }
        }
        return -1;
    },

    /**
     * Prevent default behavior of the browser. <br/>
     * preventDefault Cancels the event if it is cancelable, without stopping further propagation of the event.
     * @param {Event} event - browser event
     */
    preventDefault: function (event) {
        if (event.preventDefault) {
            event.preventDefault();
        } else {
            event.returnValue = false;
        }
    },

    /**
     * Stop browser event propagation
     * @param  {Event} e - browser event.
     */
    stopPropagation: function (e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        } else {
            e.cancelBubble = true;
        }
        return this;
    },

    preventSelection: function (dom) {
        dom.onselectstart = function () {
            return false;
        };
        dom.ondragstart = function () { return false; };
        dom.setAttribute('unselectable', 'on');
        return this;
    },

    /**
     * Get the dom element's current position or offset its position by offset
     * @param  {HTMLElement} dom - HTMLElement
     * @param  {maptalks.Point} [offset=null] - position to set.
     * @return {maptalks.Point} - dom element's current position if offset is null.
     */
    offsetDom: function (dom, offset) {
        if (!dom) { return null; }

        if (maptalks.Browser.any3d) {
            maptalks.DomUtil.setTransform(dom, offset);
        } else {
            dom.style.left = offset.x + 'px';
            dom.style.top = offset.y + 'px';
        }
        return offset;
    },

    /**
     * 获取dom对象在页面上的屏幕坐标
     * @param  {HTMLElement} obj Dom对象
     * @return {Object}     屏幕坐标
     */
    getPagePosition:function (obj) {
        var docEl = document.documentElement;
        var rect = obj.getBoundingClientRect();
        return new maptalks.Point(rect['left'] + docEl['scrollLeft'], rect['top'] + docEl['scrollTop']);
    },


    /**
     * 获取鼠标在容器上相对容器左上角的坐标值
     * @param {Event} ev  触发的事件
     * @return {maptalks.Point} left:鼠标在页面上的横向位置, top:鼠标在页面上的纵向位置
     */
    getEventContainerPoint:function (ev, dom) {
        if (!ev) {
            ev = window.event;
        }
        var rect = dom.getBoundingClientRect();

        return new maptalks.Point(
            ev.clientX - rect.left - dom.clientLeft,
            ev.clientY - rect.top - dom.clientTop);
    },

    /**
     * 为dom设置样式
     * @param {HTMLElement} dom dom节点
     * @param {String} strCss 样式字符串
     */
    setStyle : function (dom, strCss) {
        function endsWith(str, suffix) {
            var l = str.length - suffix.length;
            return l >= 0 && str.indexOf(suffix, l) === l;
        }
        var style = dom.style,
            cssText = style.cssText;
        if (!endsWith(cssText, ';')) {
            cssText += ';';
        }
        dom.style.cssText = cssText + strCss;
    },

    /**
     * 清空dom样式
     * @param {HTMLElement} dom dom节点
     */
    removeStyle: function (dom) {
        dom.style.cssText = '';
    },

    /**
     * 为dom添加样式
     * @param {HTMLElement} dom dom节点
     * @param {String} attr 样式标签
     * @param {String} value 样式值
     */
    addStyle: function (dom, attr, value) {
        var css = dom.style.cssText;
        if (attr && value) {
            var newStyle = attr + ':' + value + ';';
            dom.style.cssText = css + newStyle;
        }
    },

    /**
     * 判断元素是否包含class
     * @param {HTMLElement} el html元素
     * @param {String} name class名称
     */
    hasClass: function (el, name) {
        if (el.classList !== undefined) {
            return el.classList.contains(name);
        }
        var className = maptalks.DomUtil.getClass(el);
        return className.length > 0 && new RegExp('(^|\\s)' + name + '(\\s|$)').test(className);
    },

    /**
     * 为dom添加class
     * @param {HTMLElement} el html元素
     * @param {String} name class名称
     */
    addClass: function (el, name) {
        if (el.classList !== undefined) {
            var classes = maptalks.StringUtil.splitWords(name);
            for (var i = 0, len = classes.length; i < len; i++) {
                el.classList.add(classes[i]);
            }
        } else if (!maptalks.DomUtil.hasClass(el, name)) {
            var className = maptalks.DomUtil.getClass(el);
            maptalks.DomUtil.setClass(el, (className ? className + ' ' : '') + name);
        }
    },

    /**
     * 移除dom class
     * @param {HTMLElement} el html元素
     * @param {String} name class名称
     */
    removeClass: function (el, name) {
        if (el.classList !== undefined) {
            el.classList.remove(name);
        } else {
            maptalks.DomUtil.setClass(el, maptalks.StringUtil.trim((' ' + maptalks.DomUtil.getClass(el) + ' ').replace(' ' + name + ' ', ' ')));
        }
    },

    /**
     * 设置dom class
     * @param {HTMLElement} el html元素
     * @param {String} name class名称
     */
    setClass: function (el, name) {
        if (maptalks.Util.isNil(el.className.baseVal)) {
            el.className = name;
        } else {
            el.className.baseVal = name;
        }
    },

    /**
     * 获取dom class
     * @param {String} name class名称
     * @retrun {String} class字符串
     */
    getClass: function (el) {
        return maptalks.Util.isNil(el.className.baseVal) ? el.className : el.className.baseVal;
    },

    // Borrowed from Leaflet
    // @function setOpacity(el: HTMLElement, opacity: Number)
    // Set the opacity of an element (including old IE support).
    // `opacity` must be a number from `0` to `1`.
    setOpacity: function (el, value) {

        if ('opacity' in el.style) {
            el.style.opacity = value;

        } else if ('filter' in el.style) {
            maptalks.DomUtil._setOpacityIE(el, value);
        }
    },

    _setOpacityIE: function (el, value) {
        var filter = false,
            filterName = 'DXImageTransform.Microsoft.Alpha';

        // filters collection throws an error if we try to retrieve a filter that doesn't exist
        try {
            filter = el.filters.item(filterName);
        } catch (e) {
            // don't set opacity to 1 if we haven't already set an opacity,
            // it isn't needed and breaks transparent pngs.
            if (value === 1) { return; }
        }

        value = Math.round(value * 100);

        if (filter) {
            filter.Enabled = (value !== 100);
            filter.Opacity = value;
        } else {
            el.style.filter += ' progid:' + filterName + '(opacity=' + value + ')';
        }
    },

    /**
     * Copy the source canvas
     * @param  {Element|Canvas} src - source canvas
     * @return {Element|Canvas}     target canvas
     */
    copyCanvas:function (src) {
        if (maptalks.node) {
            return null;
        }
        var target = maptalks.DomUtil.createEl('canvas');
        target.width = src.width;
        target.height = src.height;
        target.getContext('2d').drawImage(src, 0, 0);
        return target;
    },

    /**
     * Test if the size of canvas is valid.
     * @function
     * @param  {maptalks.Size} - size
     * @return {Boolean}
     */
    testCanvasSize: (function () {
        if (maptalks.node) {
            return function () { return true; };
        }
          /**
           * @type {CanvasRenderingContext2D}
           */
        var context = null;

          /**
           * @type {ImageData}
           */
        var imageData = null;

        return function (size) {
            if (!context) {
                var _canvas = maptalks.DomUtil.createEl('canvas');
                _canvas.width = 1;
                _canvas.height = 1;
                context = _canvas.getContext('2d');
                imageData = context.createImageData(1, 1);
                var data = imageData.data;
                data[0] = 42;
                data[1] = 84;
                data[2] = 126;
                data[3] = 255;
            }
            var canvas = context.canvas;
            var good = size['width'] <= canvas.width && size['height'] <= canvas.height;
            if (!good) {
                canvas.width = size['width'];
                canvas.height = size['height'];
                var x = size['width'] - 1;
                var y = size['height'] - 1;
                context.putImageData(imageData, x, y);
                var result = context.getImageData(x, y, 1, 1);
                var arrEqual = true;
                for (var i = result.data.length - 1; i >= 0; i--) {
                    if (result.data[i] !== imageData.data[i]) {
                        arrEqual = false;
                        break;
                    }
                }
                good = arrEqual;
            }
            return good;
        };
    })(),


    /**
     * From Leaflet.DomUtil
     * Goes through the array of style names and returns the first name
     * that is a valid style name for an element. If no such name is found,
     * it returns false. Useful for vendor-prefixed styles like `transform`.
     * @param  {String[]} props
     * @return {Boolean}
     */
    testProp: function (props) {

        var style = document.documentElement.style;

        for (var i = 0; i < props.length; i++) {
            if (props[i] in style) {
                return props[i];
            }
        }
        return false;
    },


    /**
     * Based on Leaflet.DomUtil.
     * Resets the 3D CSS transform of `el` so it is translated by `offset` pixels
     * and optionally scaled by `scale`. Does not have an effect if the browser doesn't support 3D CSS transforms.
     * Also support set a transform matrix.
     * @param {HTMLElement} el
     * @param {maptalks.Point} offset
     * @param {Number} scale
     */
    setTransform: function (el, offset, scale) {

        var pos = offset || new maptalks.Point(0, 0);
        el.style[maptalks.DomUtil.TRANSFORM] =
            (maptalks.Browser.ie3d ?
                'translate(' + pos.x + 'px,' + pos.y + 'px)' + (scale ? ' scale(' + scale + ')' : '') :
                'translate3d(' + pos.x + 'px,' + pos.y + 'px,0)') + (scale ? ' scale(' + scale + ')' : '');

        return this;
    },

    setTransformMatrix: function (el, m) {
        el.style[maptalks.DomUtil.TRANSFORM] =  m.toCSS();
        return this;
    },

    removeTransform: function (el) {
        el.style[maptalks.DomUtil.TRANSFORM] =  null;
        return this;
    },

    isHTML: function (str) {
        return /<[a-z\][\s\S]*>/i.test(str);
    },

    measureDom: function (parentTag, dom) {
        var ruler = maptalks.DomUtil._getDomRuler(parentTag);
        if (maptalks.Util.isString(dom)) {
            ruler.innerHTML = dom;
        } else {
            ruler.appendChild(dom);
        }
        var result = new maptalks.Size(ruler.clientWidth, ruler.clientHeight);
        maptalks.DomUtil.removeDomNode(ruler);
        return result;
    },

    _getDomRuler:function (tag) {
        var span = document.createElement(tag);
        span.style.cssText = 'position:absolute;left:-10000px;top:-10000px;';
        document.body.appendChild(span);
        return span;
    }

};

/**
 * Alias for [addDomEvent]{@link maptalks.DomUtil.addDomEvent}
 * @param {HTMLElement} obj     - dom element to listen on
 * @param {String} typeArr      - event types, seperated by space
 * @param {Function} handler    - listener function
 * @param {Object} context      - function context
 * @static
 * @function
 * @return {maptalks.DomUtil}
 */
maptalks.DomUtil.on = maptalks.DomUtil.addDomEvent;

/**
* Alias for [removeDomEvent]{@link maptalks.DomUtil.removeDomEvent}
* @param {HTMLElement} obj         - dom element
* @param {String} typeArr          - event types, separated by space
* @param {Function} handler        - listening function
* @static
* @function
* @return {maptalks.DomUtil}
*/
maptalks.DomUtil.off = maptalks.DomUtil.removeDomEvent;

(function () {
    if (maptalks.node) {
        return;
    }
    // Borrowed from Leaflet.DomUtil

    // prefix style property names

    /**
     * Vendor-prefixed fransform style name (e.g. `'webkitTransform'` for WebKit).
     * @property {String} TRANSFORM
     * @memberOf maptalks.DomUtil
     * @type {String}
     */
    maptalks.DomUtil.TRANSFORM = maptalks.DomUtil.testProp(
            ['transform', 'WebkitTransform', 'OTransform', 'MozTransform', 'msTransform']);

    /**
     * Vendor-prefixed tfransform-origin name (e.g. `'webkitTransformOrigin'` for WebKit).
     * @property {String} TRANSFORMORIGIN
     * @memberOf maptalks.DomUtil
     * @type {String}
     */
    maptalks.DomUtil.TRANSFORMORIGIN = maptalks.DomUtil.testProp(
            ['transformOrigin', 'WebkitTransformOrigin', 'OTransformOrigin', 'MozTransformOrigin', 'msTransformOrigin']);

    /**
     * Vendor-prefixed transition name (e.g. `'WebkitTransition'` for WebKit).
     * @property {String} TRANSITION
     * @memberOf maptalks.DomUtil
     * @type {String}
     */
    maptalks.DomUtil.TRANSITION = maptalks.DomUtil.testProp(
            ['transition', 'WebkitTransition', 'OTransition', 'MozTransition', 'msTransition']);

    /**
     * Vendor-prefixed filter name (e.g. `'WebkitFilter'` for WebKit).
     * @property {String} FILTER
     * @memberOf maptalks.DomUtil
     * @type {String}
     */
    maptalks.DomUtil.CSSFILTER = maptalks.DomUtil.testProp(
            ['filter', 'WebkitFilter', 'OFilter', 'MozFilter', 'msFilter']);

})();



/**
 * This provides methods used for event handling. It's a mixin and not meant to be used directly.
 * @mixin
 * @memberOf maptalks
 * @name Eventable
 */
maptalks.Eventable = {
    /**
     * Register a handler function to be called whenever this event is fired.
     *
     * @param {String} eventsOn                  - event types to register, seperated by space if more than one.
     * @param {Function} handler                 - handler function to be called
     * @param {Object} [context=null]            - the context of the handler
     * @return {*} this
     * @example
     * foo.on('mousedown mousemove mouseup', onMouseEvent, foo);
     */
    on: function (eventsOn, handler, context) {
        if (!eventsOn || !handler) { return this; }
        if (!maptalks.Util.isString(eventsOn)) {
            return this._switch('on', eventsOn, handler);
        }
        if (!this._eventMap) {
            this._eventMap = {};
        }
        var eventTypes = eventsOn.toLowerCase().split(' ');
        var evtType;
        if (!context) { context = this; }
        var handlerChain, i, l;
        for (var ii = 0, ll = eventTypes.length; ii < ll; ii++) {
            evtType = eventTypes[ii];
            handlerChain = this._eventMap[evtType];
            if (!handlerChain) {
                handlerChain = [];
                this._eventMap[evtType] = handlerChain;
            }
            l = handlerChain.length;
            if (l > 0) {
                for (i = 0; i < l; i++) {
                    if (handler === handlerChain[i].handler && handlerChain[i].context === context) {
                        return this;
                    }
                }
            }
            handlerChain.push({
                handler:handler,
                context:context
            });
        }
        return this;
    },

    /**
     * Same as on, except the listener will only get fired once and then removed.
     *
     * @param {String} eventTypes                - event types to register, seperated by space if more than one.
     * @param {Function} handler                 - listener handler
     * @param {Object} [context=null]            - the context of the handler
     * @return {*} this
     * @example
     * foo.once('mousedown mousemove mouseup', onMouseEvent, foo);
     */
    once: function (eventTypes, handler, context) {
        if (!maptalks.Util.isString(eventTypes)) {
            var once = {};
            for (var p in eventTypes) {
                if (eventTypes.hasOwnProperty(p)) {
                    once[p] = this._wrapOnceHandler(p, eventTypes[p], context);
                }
            }
            return this._switch('on', once);
        }
        var evetTypes = eventTypes.split(' ');
        for (var i = 0, l = evetTypes.length; i < l; i++) {
            this.on(evetTypes[i], this._wrapOnceHandler(evetTypes[i], handler, context));
        }
        return this;
    },

    _wrapOnceHandler: function (evtType, handler, context) {
        var me = this;
        var called = false;
        return function onceHandler() {
            if (called) {
                return;
            }
            called = true;
            if (context) {
                handler.apply(context, arguments);
            } else {
                handler.apply(this, arguments);
            }
            me.off(evtType, onceHandler, this);
        };
    },

    /**
     * Unregister the event handler for the specified event types.
     *
     * @param {String} eventsOff                - event types to unregister, seperated by space if more than one.
     * @param {Function} handler                - listener handler
     * @param {Object} [context=null]           - the context of the handler
     * @return {*} this
     * @example
     * foo.off('mousedown mousemove mouseup', onMouseEvent, foo);
     */
    off:function (eventsOff, handler, context) {
        if (!eventsOff || !this._eventMap || !handler) { return this; }
        if (!maptalks.Util.isString(eventsOff)) {
            return this._switch('off', eventsOff, handler);
        }
        var eventTypes = eventsOff.split(' ');
        var eventType, handlerChain;
        if (!context) { context = this; }
        var i;
        for (var j = 0, jl = eventTypes.length; j < jl; j++) {
            eventType = eventTypes[j].toLowerCase();
            handlerChain =  this._eventMap[eventType];
            if (!handlerChain) { return this; }
            for (i = handlerChain.length - 1; i >= 0; i--) {
                if (handler === handlerChain[i].handler && handlerChain[i].context === context) {
                    handlerChain.splice(i, 1);
                }
            }
        }
        return this;
    },

    _switch: function (to, eventKeys, context) {
        for (var p in eventKeys) {
            if (eventKeys.hasOwnProperty(p)) {
                this[to](p, eventKeys[p], context);
            }
        }
        return this;
    },

    _clearListeners:function (eventType) {
        if (!this._eventMap || !maptalks.Util.isString(eventType)) { return; }
        var handlerChain =  this._eventMap[eventType.toLowerCase()];
        if (!handlerChain) { return; }
        this._eventMap[eventType] = null;
    },

    _clearAllListeners:function () {
        this._eventMap = null;
    },

    /**
     * Returns listener's count registered for the event type.
     *
     * @param {String} eventType        - an event type
     * @param {Function} [hanlder=null] - listener function
     * @param {Object} [context=null]   - the context of the handler
     * @return {Number}
     */
    listens:function (eventType, handler, context) {
        if (!this._eventMap || !maptalks.Util.isString(eventType)) { return 0; }
        var handlerChain =  this._eventMap[eventType.toLowerCase()];
        if (!handlerChain || handlerChain.length === 0) { return 0; }
        var count = 0;
        for (var i = 0, len = handlerChain.length; i < len; i++) {
            if (handler) {
                if (handler === handlerChain[i].handler &&
                    (maptalks.Util.isNil(context) || handlerChain[i].context === context)) {
                    return 1;
                }
            } else {
                count++;
            }
        }
        return count;
    },

   /**
    * Copy all the event listener to the target object
    * @param {Object} target - target object to copy to.
    * @return {*} this
    */
    copyEventListeners: function (target) {
        var eventMap = target._eventMap;
        if (!eventMap) { return this; }
        var handlerChain, i, len;
        for (var eventType in eventMap) {
            handlerChain = eventMap[eventType];
            for (i = 0, len = handlerChain.length; i < len; i++) {
                this.on(eventType, handlerChain[i].handler, handlerChain[i].context);
            }
        }
        return this;
    },

    /**
     * Fire an event, causing all handlers for that event name to run.
     *
     * @param  {String} eventType - an event type to fire
     * @param  {Object} param     - parameters for the listener function.
     * @return {*} this
     */
    fire:function () {
        if (this._eventParent) {
            return this._eventParent.fire.apply(this._eventParent, arguments);
        }
        return this._fire.apply(this, arguments);
    },

    /**
     * Set a event parent to handle all the events
     * @param {Any} parent - event parent
     * @return {Any} this
     * @private
     */
    _setEventParent:function (parent) {
        this._eventParent = parent;
        return this;
    },


    _fire:function (eventType, param) {
        if (!this._eventMap) { return this; }
        var handlerChain = this._eventMap[eventType.toLowerCase()];
        if (!handlerChain) { return this; }
        if (!param) {
            param = {};
        }
        param['type'] = eventType;
        param['target'] = this;
        //in case of deleting a listener in a execution, copy the handlerChain to execute.
        var queue = handlerChain.slice(0),
            context, bubble, passed;
        for (var i = 0, len = queue.length; i < len; i++) {
            if (!queue[i]) { continue; }
            context = queue[i].context;
            bubble = true;
            passed = maptalks.Util.extend({}, param);
            if (context) {
                bubble = queue[i].handler.call(context, passed);
            } else {
                bubble = queue[i].handler(passed);
            }
            //stops the event propagation if the handler returns false.
            if (bubble === false) {
                if (param['domEvent']) {
                    maptalks.DomUtil.stopPropagation(param['domEvent']);
                }
            }
        }
        return this;
    }
};

/**
* Alias for [on]{@link maptalks.Eventable.on}
*
* @param {String} eventTypes     - event types to register, seperated by space if more than one.
* @param {Function} handler                 - handler function to be called
* @param {Object} [context=null]            - the context of the handler
* @return {*} this
* @function
* @memberOf maptalks.Eventable
* @name addEventListener
*/
maptalks.Eventable.addEventListener = maptalks.Eventable.on;
/**
 * Alias for [off]{@link maptalks.Eventable.off}
 *
 * @param {String} eventTypes    - event types to unregister, seperated by space if more than one.
 * @param {Function} handler                - listener handler
 * @param {Object} [context=null]           - the context of the handler
 * @return {*} this
 * @function
 * @memberOf maptalks.Eventable
 * @name removeEventListener
 */
maptalks.Eventable.removeEventListener = maptalks.Eventable.off;

/**
 * OOP facilities of the library. <br/>
 * Thanks to Leaflet's inspiration (http://www.leafletjs.com)
 * @see  [Original explanation by Leaflet]{@link http://leafletjs.com/reference.html#class}
 *
 * @class
 * @category core
 * @abstract
 */
maptalks.Class = function () {

};
/**
 * Extend a class with a prototype object with instance methods and properties.
 *
 * @param  {object} props - a literal object with instance properties or methods.
 * @return {maptalks.Class}
 * @static
 * @example
 *  var MyClass = maptalks.Class.extend({
        initialize: function (greeter) {
            this.greeter = greeter;
            // class constructor
        },

        greet: function (name) {
            alert(this.greeter + ', ' + name)
        }
    });

    // create instance of MyClass, passing "Hello" to the constructor
    var a = new MyClass("Hello");

    // call greet method, alerting "Hello, World"
    a.greet("World");
 */
maptalks.Class.extend = function (props) {

    // extended class with the new prototype
    var NewClass = function () {
        var self = this;
        if (!(this instanceof NewClass)) {
            // fix consructing without new silently
            self = maptalks.Util.create(NewClass.prototype);
        }

        // call the constructor
        if (self.initialize) {
            self.initialize.apply(self, arguments);
        }

        // call all constructor hooks
        if (self._initHooks) {
            self.callInitHooks();
        }

        return self;
    };

    var parentProto = NewClass.__super__ = this.prototype;

    /** @lends maptalks.Class.prototype */
    var proto = maptalks.Util.create(parentProto);

    proto.constructor = NewClass;

    NewClass.prototype = proto;

    // inherit parent's statics
    for (var i in this) {
        if (i[0] !== '_' && this.hasOwnProperty(i) && i !== 'prototype' && !(this[i] instanceof maptalks.Class)) {
            NewClass[i] = this[i];
        }
    }

    // mix static properties into the class
    if (props.statics) {
        maptalks.Util.extend(NewClass, props.statics);
        delete props.statics;
    }

    // mix includes into the prototype
    if (props.includes) {
        maptalks.Util.extend.apply(null, [proto].concat(props.includes));
        delete props.includes;
    }

    // merge options
    if (proto.options) {
        props.options = maptalks.Util.extend(maptalks.Util.create(proto.options), props.options);
    }

    // mix given properties into the prototype
    maptalks.Util.extend(proto, props);

    proto._initHooks = [];

    // add method for calling all hooks
    proto.callInitHooks = function () {

        if (this._initHooksCalled) { return; }

        if (parentProto.callInitHooks) {
            parentProto.callInitHooks.call(this);
        }

        this._initHooksCalled = true;

        for (var i = 0, len = proto._initHooks.length; i < len; i++) {
            proto._initHooks[i].call(this);
        }
    };

    /**
     * Get a shallow copy of or update Class's options.<br>
     * If the instance has a handler of the same name with the given option key, the handler will be enabled or disabled when the option is updated.
     * @param  {object|string} options - options to update, leave empty to get a shallow copy of options.
     * @return {object|this}
     */
    proto.config = function (conf) {
        if (!conf) {
            var config = {};
            for (var p in this.options) {
                if (this.options.hasOwnProperty(p)) {
                    config[p] = this.options[p];
                }
            }
            return config;
        } else {
            if (arguments.length === 2) {
                var t = {};
                t[conf] = arguments[1];
                conf = t;
            }
            for (var i in conf) {
                if (conf.hasOwnProperty(i)) {
                    this.options[i] = conf[i];
                    // enable/disable handler
                    if (this[i] && (this[i] instanceof maptalks.Handler)) {
                        if (conf[i]) {
                            this[i].enable();
                        } else {
                            this[i].disable();
                        }
                    }
                }
            }
            //callback when set config
            if (this.onConfig) {
                this.onConfig(conf);
            }
        }
        return this;
    };

    return NewClass;
};


/**
 * method for adding properties to prototype
 * @param  {object} props - additional instance methods or properties
 * @static
 */
maptalks.Class.include = function () {
    var sources = arguments;
    for (var j = 0, len = sources.length; j < len; j++) {
        maptalks.Util.extend(this.prototype, sources[j]);
    }
    return this;
};

/**
 * merge new default options to the Class
 * @param  {object} options - default options.
 * @static
 */
maptalks.Class.mergeOptions = function (options) {
    maptalks.Util.extend(this.prototype.options, options);
    return this;
};

/**
 * add a constructor hook
 * @param {string|function} fn - a hook function or name of the hook function and arguments
 * @static
 */
maptalks.Class.addInitHook = function (fn) { // (Function) || (String, args...)
    var args = Array.prototype.slice.call(arguments, 1);

    var init = typeof fn === 'function' ? fn : function () {
        this[fn].apply(this, args);
    };

    this.prototype._initHooks = this.prototype._initHooks || [];
    this.prototype._initHooks.push(init);
    return this;
};

/*!
    2D Transformation Matrix v2.0

    (c) Epistemex 2014-2015
    www.epistemex.com
    By Ken Nilsen
    Contributions by leeoniya.
    License: MIT, header required.
*/

/**
 * 2D transformation matrix object initialized with identity matrix.<br>
 *
 * The matrix can synchronize a canvas context by supplying the context
 * as an argument, or later apply current absolute transform to an
 * existing context.<br>
 *
 * All values are handled as floating point values.<br>
 *
 * @param {CanvasRenderingContext2D} [context] - Optional context to sync with Matrix
 * @prop {number} a - scale x
 * @prop {number} b - shear y
 * @prop {number} c - shear x
 * @prop {number} d - scale y
 * @prop {number} e - translate x
 * @prop {number} f - translate y
 * @prop {CanvasRenderingContext2D|null} [context=null] - set or get current canvas context
 * @protected
 * @constructor
 */
maptalks.Matrix = function(context) {

    var me = this;
    me._t = me.transform;

    me.a = me.d = 1;
    me.b = me.c = me.e = me.f = 0;

    me.context = context;

    // reset canvas transformations (if any) to enable 100% sync.
    if (context) context.setTransform(1, 0, 0, 1, 0, 0);
};

var Matrix = maptalks.Matrix;

maptalks.Matrix.prototype = {

    /**
     * Concatenates transforms of this matrix onto the given child matrix and
     * returns a new matrix. This instance is used on left side.
     *
     * @param {Matrix} cm - child matrix to apply concatenation to
     * @returns {Matrix}
     */
    concat: function(cm) {
        return this.clone()._t(cm.a, cm.b, cm.c, cm.d, cm.e, cm.f);
    },

    /**
     * Flips the horizontal values.
     */
    flipX: function() {
        return this._t(-1, 0, 0, 1, 0, 0);
    },

    /**
     * Flips the vertical values.
     */
    flipY: function() {
        return this._t(1, 0, 0, -1, 0, 0);
    },

    /**
     * Reflects incoming (velocity) vector on the normal which will be the
     * current transformed x axis. Call when a trigger condition is met.
     *
     * NOTE: BETA, simple implementation
     *
     * @param {number} x - vector end point for x (start = 0)
     * @param {number} y - vector end point for y (start = 0)
     * @returns {{x: number, y: number}}
     */
    reflectVector: function(x, y) {

        var v = this.applyToPoint(0, 1),
            d = 2 * (v.x * x + v.y * y);

        x -= d * v.x;
        y -= d * v.y;

        return {x:x, y:y};
    },

    /**
     * Short-hand to reset current matrix to an identity matrix.
     */
    reset: function() {
        return this.setTransform(1, 0, 0, 1, 0, 0);
    },

    /**
     * Rotates current matrix accumulative by angle.
     * @param {number} angle - angle in radians
     */
    rotate: function(angle) {
        var cos = Math.cos(angle),
            sin = Math.sin(angle);
        return this._t(cos, sin, -sin, cos, 0, 0);
    },

    /**
     * Converts a vector given as x and y to angle, and
     * rotates (accumulative).
     * @param x
     * @param y
     * @returns {*}
     */
    rotateFromVector: function(x, y) {
        return this.rotate(Math.atan2(y, x));
    },

    /**
     * Helper method to make a rotation based on an angle in degrees.
     * @param {number} angle - angle in degrees
     */
    rotateDeg: function(angle) {
        return this.rotate(angle * Math.PI / 180);
    },

    /**
     * Scales current matrix uniformly and accumulative.
     * @param {number} f - scale factor for both x and y (1 does nothing)
     */
    scaleU: function(f) {
        if (f === 1) {
            return this;
        }
        return this._t(f, 0, 0, f, 0, 0);
    },

    /**
     * Scales current matrix accumulative.
     * @param {number} sx - scale factor x (1 does nothing)
     * @param {number} sy - scale factor y (1 does nothing)
     */
    scale: function(sx, sy) {
        return this._t(sx, 0, 0, sy, 0, 0);
    },

    /**
     * Scales current matrix on x axis accumulative.
     * @param {number} sx - scale factor x (1 does nothing)
     */
    scaleX: function(sx) {
        return this._t(sx, 0, 0, 1, 0, 0);
    },

    /**
     * Scales current matrix on y axis accumulative.
     * @param {number} sy - scale factor y (1 does nothing)
     */
    scaleY: function(sy) {
        return this._t(1, 0, 0, sy, 0, 0);
    },

    /**
     * Apply shear to the current matrix accumulative.
     * @param {number} sx - amount of shear for x
     * @param {number} sy - amount of shear for y
     */
    shear: function(sx, sy) {
        return this._t(1, sy, sx, 1, 0, 0);
    },

    /**
     * Apply shear for x to the current matrix accumulative.
     * @param {number} sx - amount of shear for x
     */
    shearX: function(sx) {
        return this._t(1, 0, sx, 1, 0, 0);
    },

    /**
     * Apply shear for y to the current matrix accumulative.
     * @param {number} sy - amount of shear for y
     */
    shearY: function(sy) {
        return this._t(1, sy, 0, 1, 0, 0);
    },

    /**
     * Apply skew to the current matrix accumulative.
     * @param {number} ax - angle of skew for x
     * @param {number} ay - angle of skew for y
     */
    skew: function(ax, ay) {
        return this.shear(Math.tan(ax), Math.tan(ay));
    },

    /**
     * Apply skew for x to the current matrix accumulative.
     * @param {number} ax - angle of skew for x
     */
    skewX: function(ax) {
        return this.shearX(Math.tan(ax));
    },

    /**
     * Apply skew for y to the current matrix accumulative.
     * @param {number} ay - angle of skew for y
     */
    skewY: function(ay) {
        return this.shearY(Math.tan(ay));
    },

    /**
     * Set current matrix to new absolute matrix.
     * @param {number} a - scale x
     * @param {number} b - shear y
     * @param {number} c - shear x
     * @param {number} d - scale y
     * @param {number} e - translate x
     * @param {number} f - translate y
     */
    setTransform: function(a, b, c, d, e, f) {
        var me = this;
        me.a = a;
        me.b = b;
        me.c = c;
        me.d = d;
        me.e = e;
        me.f = f;
        return me._x();
    },

    /**
     * Translate current matrix accumulative.
     * @param {number} tx - translation for x
     * @param {number} ty - translation for y
     */
    translate: function(tx, ty) {
        return this._t(1, 0, 0, 1, tx, ty);
    },

    /**
     * Translate current matrix on x axis accumulative.
     * @param {number} tx - translation for x
     */
    translateX: function(tx) {
        return this._t(1, 0, 0, 1, tx, 0);
    },

    /**
     * Translate current matrix on y axis accumulative.
     * @param {number} ty - translation for y
     */
    translateY: function(ty) {
        return this._t(1, 0, 0, 1, 0, ty);
    },

    /**
     * Multiplies current matrix with new matrix values.
     * @param {number} a2 - scale x
     * @param {number} b2 - shear y
     * @param {number} c2 - shear x
     * @param {number} d2 - scale y
     * @param {number} e2 - translate x
     * @param {number} f2 - translate y
     */
    transform: function(a2, b2, c2, d2, e2, f2) {

        var me = this,
            a1 = me.a,
            b1 = me.b,
            c1 = me.c,
            d1 = me.d,
            e1 = me.e,
            f1 = me.f;

        /* matrix order (canvas compatible):
        * ace
        * bdf
        * 001
        */
        me.a = a1 * a2 + c1 * b2;
        me.b = b1 * a2 + d1 * b2;
        me.c = a1 * c2 + c1 * d2;
        me.d = b1 * c2 + d1 * d2;
        me.e = a1 * e2 + c1 * f2 + e1;
        me.f = b1 * e2 + d1 * f2 + f1;

        return me._x();
    },

    /**
     * Divide this matrix on input matrix which must be invertible.
     * @param {Matrix} m - matrix to divide on (divisor)
     * @returns {Matrix}
     */
    divide: function(m) {

        if (!m.isInvertible())
            throw "Input matrix is not invertible";

        var im = m.inverse();

        return this._t(im.a, im.b, im.c, im.d, im.e, im.f);
    },

    /**
     * Divide current matrix on scalar value != 0.
     * @param {number} d - divisor (can not be 0)
     * @returns {Matrix}
     */
    divideScalar: function(d) {

        var me = this;
        me.a /= d;
        me.b /= d;
        me.c /= d;
        me.d /= d;
        me.e /= d;
        me.f /= d;

        return me._x();
    },

    /**
     * Get an inverse matrix of current matrix. The method returns a new
     * matrix with values you need to use to get to an identity matrix.
     * Context from parent matrix is not applied to the returned matrix.
     * @returns {Matrix}
     */
    inverse: function() {

        if (this.isIdentity()) {
            return new Matrix();
        }
        else if (!this.isInvertible()) {
            throw "Matrix is not invertible.";
        }
        else {
            var me = this,
                a = me.a,
                b = me.b,
                c = me.c,
                d = me.d,
                e = me.e,
                f = me.f,

                m = new Matrix(),
                dt = a * d - b * c; // determinant(), skip DRY here...

            m.a = d / dt;
            m.b = -b / dt;
            m.c = -c / dt;
            m.d = a / dt;
            m.e = (c * f - d * e) / dt;
            m.f = -(a * f - b * e) / dt;

            return m;
        }
    },

    /**
     * Interpolate this matrix with another and produce a new matrix.
     * t is a value in the range [0.0, 1.0] where 0 is this instance and
     * 1 is equal to the second matrix. The t value is not constrained.
     *
     * Context from parent matrix is not applied to the returned matrix.
     *
     * Note: this interpolation is naive. For animation use the
     * intrpolateAnim() method instead.
     *
     * @param {Matrix} m2 - the matrix to interpolate with.
     * @param {number} t - interpolation [0.0, 1.0]
     * @param {CanvasRenderingContext2D} [context] - optional context to affect
     * @returns {Matrix} - new instance with the interpolated result
     */
    interpolate: function(m2, t, context) {

        var me = this,
            m = context ? new Matrix(context) : new Matrix();

        m.a = me.a + (m2.a - me.a) * t;
        m.b = me.b + (m2.b - me.b) * t;
        m.c = me.c + (m2.c - me.c) * t;
        m.d = me.d + (m2.d - me.d) * t;
        m.e = me.e + (m2.e - me.e) * t;
        m.f = me.f + (m2.f - me.f) * t;

        return m._x();
    },

    /**
     * Interpolate this matrix with another and produce a new matrix.
     * t is a value in the range [0.0, 1.0] where 0 is this instance and
     * 1 is equal to the second matrix. The t value is not constrained.
     *
     * Context from parent matrix is not applied to the returned matrix.
     *
     * Note: this interpolation method uses decomposition which makes
     * it suitable for animations (in particular where rotation takes
     * places).
     *
     * @param {Matrix} m2 - the matrix to interpolate with.
     * @param {number} t - interpolation [0.0, 1.0]
     * @param {CanvasRenderingContext2D} [context] - optional context to affect
     * @returns {Matrix} - new instance with the interpolated result
     */
    interpolateAnim: function(m2, t, context) {

        var me = this,
            m = context ? new Matrix(context) : new Matrix(),
            d1 = me.decompose(),
            d2 = m2.decompose(),
            rotation = d1.rotation + (d2.rotation - d1.rotation) * t,
            translateX = d1.translate.x + (d2.translate.x - d1.translate.x) * t,
            translateY = d1.translate.y + (d2.translate.y - d1.translate.y) * t,
            scaleX = d1.scale.x + (d2.scale.x - d1.scale.x) * t,
            scaleY = d1.scale.y + (d2.scale.y - d1.scale.y) * t
            ;

        m.translate(translateX, translateY);
        m.rotate(rotation);
        m.scale(scaleX, scaleY);

        return m._x();
    },

    /**
     * Decompose the current matrix into simple transforms using either
     * QR (default) or LU decomposition. Code adapted from
     * http://www.maths-informatique-jeux.com/blog/frederic/?post/2013/12/01/Decomposition-of-2D-transform-matrices
     *
     * The result must be applied in the following order to reproduce the current matrix:
     *
     *     QR: translate -> rotate -> scale -> skewX
     *     LU: translate -> skewY  -> scale -> skewX
     *
     * @param {boolean} [useLU=false] - set to true to use LU rather than QR algorithm
     * @returns {*} - an object containing current decomposed values (rotate, skew, scale, translate)
     */
    decompose: function(useLU) {

        var me = this,
            a = me.a,
            b = me.b,
            c = me.c,
            d = me.d,
            acos = Math.acos,
            atan = Math.atan,
            sqrt = Math.sqrt,
            pi = Math.PI,

            translate = {x: me.e, y: me.f},
            rotation  = 0,
            scale     = {x: 1, y: 1},
            skew      = {x: 0, y: 0},

            determ = a * d - b * c; // determinant(), skip DRY here...

        if (useLU) {
            if (a) {
                skew = {x:atan(c/a), y:atan(b/a)};
                scale = {x:a, y:determ/a};
            }
            else if (b) {
                rotation = pi * 0.5;
                scale = {x:b, y:determ/b};
                skew.x = atan(d/b);
            }
            else { // a = b = 0
                scale = {x:c, y:d};
                skew.x = pi * 0.25;
            }
        }
        else {
            // Apply the QR-like decomposition.
            if (a || b) {
                var r = sqrt(a*a + b*b);
                rotation = b > 0 ? acos(a/r) : -acos(a/r);
                scale = {x:r, y:determ/r};
                skew.x = atan((a*c + b*d) / (r*r));
            }
            else if (c || d) {
                var s = sqrt(c*c + d*d);
                rotation = pi * 0.5 - (d > 0 ? acos(-c/s) : -acos(c/s));
                scale = {x:determ/s, y:s};
                skew.y = atan((a*c + b*d) / (s*s));
            }
            else { // a = b = c = d = 0
                scale = {x:0, y:0};     // = invalid matrix
            }
        }

        return {
            scale    : scale,
            translate: translate,
            rotation : rotation,
            skew     : skew
        };
    },

    /**
     * Returns the determinant of the current matrix.
     * @returns {number}
     */
    determinant : function() {
        return this.a * this.d - this.b * this.c;
    },

    /**
     * Apply current matrix to x and y point.
     * Returns a point object.
     *
     * @param {number} x - value for x
     * @param {number} y - value for y
     * @returns {{x: number, y: number}} A new transformed point object
     */
    applyToPoint: function(x, y) {

        var me = this;

        return {
            x: x * me.a + y * me.c + me.e,
            y: x * me.b + y * me.d + me.f
        };
    },

    applyToPointInstance:function(point) {
        var p = this.applyToPoint(point.x, point.y);
        return new maptalks.Point(p);
    },

    /**
     * Apply current matrix to array with point objects or point pairs.
     * Returns a new array with points in the same format as the input array.
     *
     * A point object is an object literal:
     *
     * {x: x, y: y}
     *
     * so an array would contain either:
     *
     * [{x: x1, y: y1}, {x: x2, y: y2}, ... {x: xn, y: yn}]
     *
     * or
     * [x1, y1, x2, y2, ... xn, yn]
     *
     * @param {Array} points - array with point objects or pairs
     * @returns {Array} A new array with transformed points
     */
    applyToArray: function(points) {

        var i = 0, p, l,
            mxPoints = [];

        if (typeof points[0] === 'number') {

            l = points.length;

            while(i < l) {
                p = this.applyToPoint(points[i++], points[i++]);
                mxPoints.push(p.x, p.y);
            }
        }
        else {
            for(; p = points[i]; i++) {
                mxPoints.push(new maptalks.Point(this.applyToPoint(p.x, p.y)));
            }
        }

        return mxPoints;
    },

    /**
     * Apply current matrix to a typed array with point pairs. Although
     * the input array may be an ordinary array, this method is intended
     * for more performant use where typed arrays are used. The returned
     * array is regardless always returned as a Float32Array.
     *
     * @param {*} points - (typed) array with point pairs
     * @param {boolean} [use64=false] - use Float64Array instead of Float32Array
     * @returns {*} A new typed array with transformed points
     */
    applyToTypedArray: function(points, use64) {

        var i = 0, p,
            l = points.length,
            mxPoints = use64 ? new Float64Array(l) : new Float32Array(l);

        while(i < l) {
            p = this.applyToPoint(points[i], points[i+1]);
            mxPoints[i++] = p.x;
            mxPoints[i++] = p.y;
        }

        return mxPoints;
    },

    /**
     * Apply to any canvas 2D context object. This does not affect the
     * context that optionally was referenced in constructor unless it is
     * the same context.
     * @param {CanvasRenderingContext2D} context
     */
    applyToContext: function(context) {
        var me = this;
        context.setTransform(me.a, me.b, me.c, me.d, me.e, me.f);
        return me;
    },

    /**
     * Returns true if matrix is an identity matrix (no transforms applied).
     * @returns {boolean} True if identity (not transformed)
     */
    isIdentity: function() {
        var me = this;
        return (me._q(me.a, 1) &&
                me._q(me.b, 0) &&
                me._q(me.c, 0) &&
                me._q(me.d, 1) &&
                me._q(me.e, 0) &&
                me._q(me.f, 0));
    },

    /**
     * Returns true if matrix is invertible
     * @returns {boolean}
     */
    isInvertible: function() {
        return !this._q(this.determinant(), 0)
    },

    /**
     * Test if matrix is valid.
     */
    isValid : function() {
        return !this._q(this.a * this.d, 0);
    },

    /**
     * Clones current instance and returning a new matrix.
     * @param {boolean} [noContext=false] don't clone context reference if true
     * @returns {Matrix}
     */
    clone : function(noContext) {
        var me = this,
            m = new Matrix();
        m.a = me.a;
        m.b = me.b;
        m.c = me.c;
        m.d = me.d;
        m.e = me.e;
        m.f = me.f;
        if (!noContext) m.context = me.context;

        return m;
    },

    /**
     * Compares current matrix with another matrix. Returns true if equal
     * (within epsilon tolerance).
     * @param {Matrix} m - matrix to compare this matrix with
     * @returns {boolean}
     */
    isEqual: function(m) {
        if (!m) {
            return false;
        }

        var me = this,
            q = me._q;

        return (q(me.a, m.a) &&
                q(me.b, m.b) &&
                q(me.c, m.c) &&
                q(me.d, m.d) &&
                q(me.e, m.e) &&
                q(me.f, m.f));
    },

    /**
     * Returns an array with current matrix values.
     * @returns {Array}
     */
    toArray: function() {
        var me = this;
        return [me.a, me.b, me.c, me.d, me.e, me.f];
    },

    /**
     * Generates a string that can be used with CSS `transform:`.
     * @returns {string}
     */
    toCSS: function() {
        return "matrix(" + this.toArray() + ")";
    },

    /**
     * Returns a JSON compatible string of current matrix.
     * @returns {string}
     */
    toJSON: function() {
        var me = this;
        return '{"a":' + me.a + ',"b":' + me.b + ',"c":' + me.c + ',"d":' + me.d + ',"e":' + me.e + ',"f":' + me.f + '}';
    },

    /**
     * Returns a string with current matrix as comma-separated list.
     * @returns {string}
     */
    toString: function() {
        return "" + this.toArray();
    },

    /**
     * Compares floating point values with some tolerance (epsilon)
     * @param {number} f1 - float 1
     * @param {number} f2 - float 2
     * @returns {boolean}
     * @private
     */
    _q: function(f1, f2) {
        return Math.abs(f1 - f2) < 1e-14;
    },

    /**
     * Apply current absolute matrix to context if defined, to sync it.
     * @private
     */
    _x: function() {
        var me = this;
        if (me.context)
            me.context.setTransform(me.a, me.b, me.c, me.d, me.e, me.f);
        return me;
    }
};

maptalks.Matrix.prototype.multi = function(s) {
    var matrix = this;
    var copy = matrix.clone();
        copy.a = matrix.a * s;
        copy.b = matrix.b * s;
        copy.c = matrix.c * s;
        copy.d = matrix.d * s;
        copy.e = matrix.e * s;
        copy.f = matrix.f * s;
    return copy;
}

//@namespace
maptalks.animation = {};

/**
 * @classdesc
 * Utilities for animation
 * @class
 * @category animation
 */
maptalks.Animation = {
    /**
     * @property {Object} speed         - predefined animation speed
     * @property {Number} speed.slow    - 2000ms
     * @property {Number} speed.normal  - 1000ms
     * @property {Number} speed.fast    - 500ms
     */
    speed:{
        'slow'   : 2000,
        'normal' : 1000,
        'fast'   : 500
    },



    /**
     * resolve styles for animation, get a style group of start style, styles to animate and end styles.
     * @param  {Object} styles - styles to resolve
     * @return {Object[]}  styles resolved
     * @private
     */
    _resolveStyles:function (styles) {
        if (!styles) {
            return null;
        }
        //resolve a child styles.
        function resolveChild(child) {
            if (!maptalks.Util.isArray(child)) {
                return maptalks.Animation._resolveStyles(child);
            }
            var start = [], d = [], dest = [];
            for (var i = 0; i < child.length; i++) {
                var styles = maptalks.Animation._resolveStyles(child[i]);
                if (styles) {
                    start.push(styles[0]);
                    d.push(styles[1]);
                    dest.push(styles[2]);
                }
            }
            if (start.length === 0) {
                return null;
            } else {
                return [start, d, dest];
            }
        }
        // resolve a style value.
        function resolveVal(val) {
            var values = val,
                clazz;
            //val is just a destination value, so we set start value to 0 or a 0-point or a 0-coordinate.
            if (!maptalks.Util.isArray(val)) {
                if (maptalks.Util.isNumber(val)) {
                    values = [0, val];
                } else if (val instanceof maptalks.Point || val instanceof maptalks.Coordinate) {
                    clazz = val.constructor;
                    values = [new clazz(0, 0), val];
                } else {
                    values = [val, val];
                }
            }
            //val is a array and val[0] is the start value and val[1] is the destination value.
            var v1 = values[0],
                v2 = values[1];
            if (maptalks.Util.isNumber(v1) && maptalks.Util.isNumber(v2)) {
                if (v1 === v2) {
                    return null;
                }
                return [v1, v2 - v1, v2];
            } else if (maptalks.Util.isArray(v1) || v1 instanceof maptalks.Coordinate || v1 instanceof maptalks.Point) {
                // is a coordinate (array or a coordinate) or a point
                if (maptalks.Util.isArray(v1)) {
                    v1 = new maptalks.Coordinate(v1);
                    v2 = new maptalks.Coordinate(v2);
                } else {
                    clazz = v1.constructor;
                    v1 = new clazz(v1);
                    v2 = new clazz(v2);
                }
                if (v1.equals(v2)) {
                    //a Coordinate or a Point to be eql with each other
                    return null;
                }
                return [v1, v2.substract(v1), v2];
            } else {
                return [v1, 0, v2];
            }
        }

        function isChild(val) {
            if (!maptalks.Util.isArray(val) && val.constructor === Object) {
                return true;
            } else if (maptalks.Util.isArray(val) && val[0].constructor === Object) {
                return true;
            }
            return false;
        }

        var d = {}, start = {}, dest = {};
        for (var p in styles) {
            if (styles.hasOwnProperty(p)) {
                var values = styles[p];
                var childStyles;
                if (isChild(values)) {
                    childStyles = resolveChild(values);
                } else {
                    childStyles = resolveVal(values);
                }
                if (childStyles) {
                    start[p] = childStyles[0];
                    d[p] = childStyles[1];
                    dest[p] = childStyles[2];
                }
            }
        }
        return [start, d, dest];
    },

    /**
     * Generate a framing function
     * @param  {Object[]} styles        - animation style group
     * @param  {Object} [options=null]  - options
     * @param  {Object} [options.easing=null]  - animation easing
     * @return {Function} framing function helps to generate animation frames.
     */
    framing:function (styles, options) {
        if (!options) {
            options = {};
        }
        var easing = options['easing'] ? maptalks.animation.Easing[options['easing']] : maptalks.animation.Easing.linear;
        if (!easing) { easing = maptalks.animation.Easing.linear; }
        var dStyles, startStyles, destStyles;
        styles = maptalks.Animation._resolveStyles(styles);
        if (styles) {
            startStyles = styles[0];
            dStyles = styles[1];
            destStyles = styles[2];
        }
        var deltaStyles = function (delta, _startStyles, _dStyles) {
            if (!_startStyles || !_dStyles) {
                return null;
            }
            var result = {};
            for (var p in _dStyles) {
                if (_dStyles.hasOwnProperty(p)) {
                    if (_startStyles[p] === destStyles[p]) {
                        result[p] = _startStyles[p];
                        continue;
                    }
                    var s = _startStyles[p], d = _dStyles[p];
                    if (maptalks.Util.isNumber(d)) {
                        //e.g. radius, width, height
                        result[p] = s + delta * d;
                    } else if (maptalks.Util.isArray(d)) {
                        //e.g. a composite symbol, element in array can only be a object.
                        var children = [];
                        for (var i = 0; i < d.length; i++) {
                            children.push(deltaStyles(delta, s[i], d[i]));
                        }
                        result[p] = children;
                    } else {
                        //e.g. translate or a child
                        var clazz = d.constructor;
                        if (clazz === Object) {
                            result[p] = deltaStyles(delta, s, d);
                        } else if (s instanceof maptalks.Point || s instanceof maptalks.Coordinate) {
                            result[p] = s.add(d.multi(delta));
                        }
                    }
                }
            }
            return result;
        };
        return function (elapsed, duration) {
            var state, d;
            if (elapsed < 0) {
                state = {
                    'playState' : 'idle',
                    'delta'   : 0
                };
                d = startStyles;
            } else if (elapsed <  duration) {
                var delta = easing(elapsed / duration);
                state = {
                    'playState' : 'running',
                    'delta' : delta
                };
                d = deltaStyles(delta, startStyles, dStyles);
            } else {
                state = {
                    'playState' : 'finished',
                    'delta' : 1
                };
                d = destStyles;
            }
            state['startStyles'] = startStyles;
            state['destStyles'] = destStyles;
            return new maptalks.animation.Frame(state, d);
        };

    },

    _requestAnimFrame:function (fn) {
        if (!this._frameQueue) {
            this._frameQueue = [];
        }
        this._frameQueue.push(fn);
        this._a();
    },

    _a:function () {
        if (!this._animationFrameId) {
            this._animationFrameId = maptalks.Util.requestAnimFrame(maptalks.Util.bind(maptalks.Animation._run, maptalks.Animation));
        }
    },

    _run:function () {
        if (this._frameQueue.length) {
            var running = this._frameQueue;
            this._frameQueue = [];
            for (var i = 0, len = running.length; i < len; i++) {
                running[i]();
            }
            if (this._frameQueue.length) {
                this._animationFrameId = maptalks.Util.requestAnimFrame(maptalks.Util.bind(maptalks.Animation._run, maptalks.Animation));
            } else {
                delete this._animationFrameId;
            }
        }
    },

    /**
     * Get a animation player
     * @param  {Object} styles  - styles to animate
     * @param  {Object} options - animation options
     * @param  {Function} step  - callback function for animation steps
     * @return {maptalks.animation.Player} player
     */
    animate : function (styles, options, step) {
        if (!options) {
            options = {};
        }
        var animation = maptalks.Animation.framing(styles, options);
        return new maptalks.animation.Player(animation, options, step);
    }
};

/**
 * @classdesc
 * [Web Animation API]{@link https://developer.mozilla.org/zh-CN/docs/Web/API/Animation} style animation player
 * @param {Function} animation - animation [framing]{@link maptalks.Animation.framing} function
 * @param {Object} options     - animation options
 * @param  {Function} step  - callback function for animation steps
 * @class
 * @category animation
 * @memberOf maptalks.animation
 * @name Player
 */
maptalks.animation.Player = function (animation, options, step) {
    this._animation = animation;
    this._options = options;
    this._stepFn = step;
    this.playState = 'idle';
    this.ready = true;
    this.finished = false;
};

maptalks.Util.extend(maptalks.animation.Player.prototype, /** @lends maptalks.animation.Player.prototype */{
    _prepare:function () {
        var options = this._options;
        var duration = options['speed'];
        if (maptalks.Util.isString(duration)) { duration = maptalks.Animation.speed[duration]; }
        if (!duration) { duration = maptalks.Animation.speed['normal']; }
        this.duration = duration;
    },
    /**
     * Start or resume the animation
     * @return {maptalks.animation.Player} this
     */
    play:function () {
        if (this.playState !== 'idle' && this.playState !== 'paused') {
            return this;
        }
        if (this.playState === 'idle') {
            this.currentTime = 0;
            this._prepare();
        }
        var now = maptalks.Util.now();
        if (!this.startTime) {
            var options = this._options;
            this.startTime = options['startTime'] ? options['startTime'] : now;
        }
        this._playStartTime = Math.max(now, this.startTime);
        if (this.playState === 'paused') {
            this._playStartTime -= this.currentTime;
        }
        this.playState = 'running';
        this._run();
        return this;
    },
    /**
     * Pause the animation
     * @return {maptalks.animation.Player} this
     */
    pause:function () {
        this.playState = 'paused';
        //this.duration = this.duration - this.currentTime;
        return this;
    },
    /**
     * Cancel the animation play and ready to play again
     * @return {maptalks.animation.Player} this
     */
    cancel:function () {
        this.playState = 'idle';
        this.finished = false;
        return this;
    },
    /**
     * Finish the animation play, and can't be played any more.
     * @return {maptalks.animation.Player} this
     */
    finish:function () {
        this.playState = 'finished';
        this.finished = true;
        return this;
    },
    reverse:function () {

    },
    _run:function () {
        if (this.playState === 'finished' || this.playState === 'paused') {
            return;
        }
        var me = this;
        var now = maptalks.Util.now();
        var elapsed = now - this._playStartTime;
        if (this._options['repeat'] && elapsed >= this.duration) {
            this._playStartTime = now;
            elapsed = 0;
        }
        //elapsed, duration
        var frame = this._animation(elapsed, this.duration);
        this.playState = frame.state['playState'];
        var step = this._stepFn;
        if (this.playState === 'idle') {
            setTimeout(maptalks.Util.bind(this._run, this), this.startTime - now);
        } else if (this.playState === 'running') {
            this._animeFrameId = maptalks.Animation._requestAnimFrame(function () {
                if (me.playState !== 'running') {
                    return;
                }
                me.currentTime = now - me._playStartTime;
                if (step) {
                    step(frame);
                }
                me._run();
            });
        } else if (this.playState === 'finished') {
            this.finished = true;
            //finished
            if (step) {
                maptalks.Util.requestAnimFrame(function () {
                    step(frame);
                });
            }
        }

    }
});

/**
 * @classdesc
 * Easing functions for anmation, from openlayers 3
 * @class
 * @category animation
 * @memberOf maptalks.animation
 * @name Easing
 * @protected
 */
maptalks.animation.Easing = {
        /**
         * Start slow and speed up.
         * @param {number} t Input between 0 and 1.
         * @return {number} Output between 0 and 1.
         */
    in : function (t) {
        return Math.pow(t, 2);
    },


        /**
         * Start fast and slow down.
         * @param {number} t Input between 0 and 1.
         * @return {number} Output between 0 and 1.
         */
    out : function (t) {
        return 1 - maptalks.animation.Easing.in(1 - t);
    },


        /**
         * Start slow, speed up, and then slow down again.
         * @param {number} t Input between 0 and 1.
         * @return {number} Output between 0 and 1.
         */
    inAndOut : function (t) {
        return 3 * t * t - 2 * t * t * t;
    },


        /**
         * Maintain a constant speed over time.
         * @param {number} t Input between 0 and 1.
         * @return {number} Output between 0 and 1.
         */
    linear : function (t) {
        return t;
    },


        /**
         * Start slow, speed up, and at the very end slow down again.  This has the
         * same general behavior as {@link inAndOut}, but the final slowdown
         * is delayed.
         * @param {number} t Input between 0 and 1.
         * @return {number} Output between 0 and 1.
         */
    upAndDown : function (t) {
        if (t < 0.5) {
            return maptalks.animation.Easing.inAndOut(2 * t);
        } else {
            return 1 - maptalks.animation.Easing.inAndOut(2 * (t - 0.5));
        }
    }
};

/**
 * @classdesc
 * Animation Frame used internally n animation player.
 * @class
 * @category animation
 * @memberOf maptalks.animation
 * @name Frame
 * @protected
 * @param {Object} state  - animation state
 * @param {Object} styles - styles to animate
 */
maptalks.animation.Frame = function (state, styles) {
    this.state = state;
    this.styles = styles;
};

maptalks.Canvas = {

    createCanvas:function (width, height, canvasClass) {
        var canvas;
        if (!maptalks.node) {
            canvas = maptalks.DomUtil.createEl('canvas');
            canvas.width = width;
            canvas.height = height;
        } else {
            //can be node-canvas or any other canvas mock
            canvas = new canvasClass(width, height);
        }
        return canvas;
    },

    setDefaultCanvasSetting:function (ctx) {
        ctx.lineWidth = 1;
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'miter';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.fillStyle = 'rgba(255,255,255,0)';
        ctx.textAlign = 'start';
        ctx.textBaseline = 'top';
        var fontSize = 11;
        ctx.font = fontSize + 'px monospace';
        ctx.shadowBlur = null;
        ctx.shadowColor = null;
        if (ctx.setLineDash) {
            ctx.setLineDash([]);
        }
        ctx.globalAlpha = 1;
    },

    prepareCanvasFont:function (ctx, style) {
        ctx.textBaseline = 'top';
        ctx.font = maptalks.symbolizer.TextMarkerSymbolizer.getFont(style);
        var fill = style['textFill'];
        if (!fill) { fill = maptalks.Symbolizer.DEFAULT_TEXT_COLOR; }
        ctx.fillStyle = maptalks.Canvas.getRgba(fill, style['textOpacity']);
    },

    prepareCanvas:function (ctx, style, resources) {
        if (!style) {
            return;
        }
        var strokeWidth = style['lineWidth'];
        if (!maptalks.Util.isNil(strokeWidth) && ctx.lineWidth !== strokeWidth) {
            ctx.lineWidth = strokeWidth;
        }
        var strokeColor = style['linePatternFile'] || style['lineColor'] || maptalks.Symbolizer.DEFAULT_STROKE_COLOR;
        if (maptalks.Util.isCssUrl(strokeColor) && resources) {
            maptalks.Canvas._setStrokePattern(ctx, strokeColor, strokeWidth, resources);
            //line pattern will override stroke-dasharray
            style['lineDasharray'] = [];
        } else if (maptalks.Util.isGradient(strokeColor)) {
            if (style['lineGradientExtent']) {
                ctx.strokeStyle = maptalks.Canvas._createGradient(ctx, strokeColor, style['lineGradientExtent']);
            } else {
                ctx.strokeStyle = 'rgba(0,0,0,1)';
            }
        } else /*if (ctx.strokeStyle !== strokeColor)*/ {
            ctx.strokeStyle = strokeColor;
        }
        if (style['lineJoin']) {
            ctx.lineJoin = style['lineJoin'];
        }
        if (style['lineCap']) {
            ctx.lineCap = style['lineCap'];
        }
        if (ctx.setLineDash && maptalks.Util.isArrayHasData(style['lineDasharray'])) {
            ctx.setLineDash(style['lineDasharray']);
        }
        var fill = style['polygonPatternFile'] || style['polygonFill'] || maptalks.Symbolizer.DEFAULT_FILL_COLOR;
        if (maptalks.Util.isCssUrl(fill)) {
            var fillImgUrl = maptalks.Util.extractCssUrl(fill);
            var fillTexture = resources.getImage([fillImgUrl, null, null]);
            if (!fillTexture) {
                //if the linestring has a arrow and a linePatternFile, polygonPatternFile will be set with the linePatternFile.
                fillTexture = resources.getImage([fillImgUrl + '-texture', null, strokeWidth]);
            }
            if (maptalks.Util.isSVG(fillImgUrl) && (fillTexture instanceof Image) && (maptalks.Browser.edge || maptalks.Browser.ie)) {
                //opacity of svg img painted on canvas is always 1, so we paint svg on a canvas at first.
                var w = fillTexture.width || 20,
                    h = fillTexture.height || 20;
                var canvas = maptalks.Canvas.createCanvas(w, h);
                maptalks.Canvas.image(canvas.getContext('2d'), fillTexture, 0, 0, w, h);
                fillTexture = canvas;
            }
            if (!fillTexture) {
                if (!maptalks.Browser.phantomjs && console) {
                    console.warn('img not found for', fillImgUrl);
                }
            } else {
                ctx.fillStyle = ctx.createPattern(fillTexture, 'repeat');
            }

        } else if (maptalks.Util.isGradient(fill)) {
            if (style['polygonGradientExtent']) {
                ctx.fillStyle = maptalks.Canvas._createGradient(ctx, fill, style['polygonGradientExtent']);
            } else {
                ctx.fillStyle = 'rgba(255,255,255,0)';
            }
        } else /*if (ctx.fillStyle !== fill)*/ {
            ctx.fillStyle = fill;
        }
    },

    _createGradient: function (ctx, g, extent) {
        var gradient = null, places = g['places'],
            min = extent.getMin(),
            max = extent.getMax(),
            width = extent.getWidth(),
            height = extent.getHeight();
        if (!g['type'] || g['type'] === 'linear') {
            if (!places) {
                places = [min.x, min.y, max.x, min.y];
            } else {
                if (places.length !== 4) {
                    throw new Error('A linear gradient\'s places should have 4 numbers.');
                }
                places = [
                    min.x + places[0] * width, min.y + places[1] * height,
                    min.x + places[2] * width, min.y + places[3] * height
                ];
            }
            gradient = ctx.createLinearGradient.apply(ctx, places);
        } else if (g['type'] === 'radial') {
            if (!places) {
                var c = extent.getCenter()._round();
                places = [c.x, c.y, Math.abs(c.x - min.x), c.x, c.y, 0];
            } else {
                if (places.length !== 6) {
                    throw new Error('A radial gradient\'s places should have 6 numbers.');
                }
                places = [
                    min.x + places[0] * width, min.y + places[1] * height, width * places[2],
                    min.x + places[3] * width, min.y + places[4] * height, width * places[5]
                ];
            }
            gradient = ctx.createRadialGradient.apply(ctx, places);
        }
        g['colorStops'].forEach(function (stop) {
            gradient.addColorStop.apply(gradient, stop);
        });
        return gradient;
    },

    _setStrokePattern: function (ctx, strokePattern, strokeWidth, resources) {
        var imgUrl = maptalks.Util.extractCssUrl(strokePattern);
        var imageTexture;
        if (maptalks.node) {
            imageTexture = resources.getImage([imgUrl, null, strokeWidth]);
        } else {
            var key = imgUrl + '-texture-' + strokeWidth;
            imageTexture = resources.getImage(key);
            if (!imageTexture) {
                var imageRes = resources.getImage([imgUrl, null, null]);
                if (imageRes) {
                    var w;
                    if (!imageRes.width || !imageRes.height) {
                        w = strokeWidth;
                    } else {
                        w = maptalks.Util.round(imageRes.width * strokeWidth / imageRes.height);
                    }
                    var patternCanvas = maptalks.Canvas.createCanvas(w, strokeWidth, ctx.canvas.constructor);
                    maptalks.Canvas.image(patternCanvas.getContext('2d'), imageRes, 0, 0, w, strokeWidth);
                    resources.addResource([key, null, strokeWidth], patternCanvas);
                    imageTexture = patternCanvas;
                }
            }
        }
        if (imageTexture) {
            ctx.strokeStyle = ctx.createPattern(imageTexture, 'repeat');
        } else if (!maptalks.Browser.phantomjs && console) {
            console.warn('img not found for', imgUrl);
        }
    },

    clearRect:function (ctx, x1, y1, x2, y2) {
        ctx.clearRect(x1, y1, x2, y2);
    },

    fillCanvas:function (ctx, fillOpacity, x, y) {
        if (fillOpacity === 0) {
            return;
        }
        var isPattern = maptalks.Canvas._isPattern(ctx.fillStyle);
        if (maptalks.Util.isNil(fillOpacity)) {
            fillOpacity = 1;
        }
        var alpha;
        if (fillOpacity < 1) {
            alpha = ctx.globalAlpha;
            ctx.globalAlpha *= fillOpacity;
        }
        if (isPattern) {
            // x = maptalks.Util.round(x);
            // y = maptalks.Util.round(y);
            ctx.translate(x, y);
        }
        ctx.fill();
        if (isPattern) {
            ctx.translate(-x, -y);
        }
        if (fillOpacity < 1) {
            ctx.globalAlpha = alpha;
        }
    },

    // hexColorRe: /^#([0-9a-f]{6}|[0-9a-f]{3})$/i,

    // support #RRGGBB/#RGB now.
    // if color was like [red, orange...]/rgb(a)/hsl(a), op will not combined to result
    getRgba:function (color, op) {
        if (maptalks.Util.isNil(op)) {
            op = 1;
        }
        if (color[0] !== '#') {
            return color;
        }
        var r, g, b;
        if (color.length === 7) {
            r = parseInt(color.substring(1, 3), 16);
            g = parseInt(color.substring(3, 5), 16);
            b = parseInt(color.substring(5, 7), 16);
        } else {
            r = parseInt(color.substring(1, 2), 16) * 17;
            g = parseInt(color.substring(2, 3), 16) * 17;
            b = parseInt(color.substring(3, 4), 16) * 17;
        }
        return 'rgba(' + r + ',' + g + ',' + b + ',' + op + ')';
    },

    image:function (ctx, img, x, y, width, height) {
        // x = maptalks.Util.round(x);
        // y = maptalks.Util.round(y);
        try {
            if (maptalks.Util.isNumber(width) && maptalks.Util.isNumber(height)) {
                ctx.drawImage(img, x, y, width, height);
            } else {
                ctx.drawImage(img, x, y);
            }
        } catch (error) {
            if (console) {
                console.warn('error when drawing image on canvas:', error);
                console.warn(img);
            }
        }
    },

    text:function (ctx, text, pt, style, textDesc) {
        // pt = pt.add(new maptalks.Point(style['textDx'], style['textDy']));
        maptalks.Canvas._textOnMultiRow(ctx, textDesc['rows'], style, pt, textDesc['size'], textDesc['rawSize']);
    },

    _textOnMultiRow: function (ctx, texts, style, point, splitTextSize, textSize) {
        var ptAlign = maptalks.StringUtil.getAlignPoint(splitTextSize, style['textHorizontalAlignment'], style['textVerticalAlignment']);
        var lineHeight = textSize['height'] + style['textLineSpacing'];
        var basePoint = point.add(0, ptAlign.y);
        var text, rowAlign;
        for (var i = 0, len = texts.length; i < len; i++) {
            text = texts[i]['text'];
            rowAlign = maptalks.StringUtil.getAlignPoint(texts[i]['size'], style['textHorizontalAlignment'], style['textVerticalAlignment']);
            maptalks.Canvas._textOnLine(ctx, text, basePoint.add(rowAlign.x, i * lineHeight), style['textHaloRadius'], style['textHaloFill'], style['textHaloOpacity']);
        }
    },

    _textOnLine: function (ctx, text, pt, textHaloRadius, textHaloFill, textHaloOp) {
        // pt = pt._round();
        ctx.textBaseline = 'top';
        if (textHaloOp !== 0 && textHaloRadius !== 0) {
            //http://stackoverflow.com/questions/14126298/create-text-outline-on-canvas-in-javascript
            //根据text-horizontal-alignment和text-vertical-alignment计算绘制起始点偏移量
            if (textHaloOp) {
                var alpha = ctx.globalAlpha;
                ctx.globalAlpha *= textHaloOp;
            }


            if (textHaloRadius) {
                ctx.miterLimit = 2;
                ctx.lineJoin = 'round';
                ctx.lineCap = 'round';
                ctx.lineWidth = (textHaloRadius * 2 - 1);
                ctx.strokeStyle = textHaloFill;
                ctx.strokeText(text, pt.x, pt.y);
                ctx.lineWidth = 1;
                ctx.miterLimit = 10; //default
            }

            if (textHaloOp) {
                ctx.globalAlpha = alpha;
            }
        }
        ctx.fillText(text, pt.x, pt.y);
    },

    fillText:function (ctx, text, point, rgba) {
        if (rgba) {
            ctx.fillStyle = rgba;
        }
        ctx.fillText(text, point.x, point.y);
    },

    _stroke:function (ctx, strokeOpacity, x, y) {
        var isPattern = maptalks.Canvas._isPattern(ctx.strokeStyle) && !maptalks.Util.isNil(x) && !maptalks.Util.isNil(y);
        if (maptalks.Util.isNil(strokeOpacity)) {
            strokeOpacity = 1;
        }
        var alpha;
        if (strokeOpacity < 1) {
            alpha = ctx.globalAlpha;
            ctx.globalAlpha *= strokeOpacity;
        }
        if (isPattern) {
            // x = maptalks.Util.round(x);
            // y = maptalks.Util.round(y);
            ctx.translate(x, y);
        }
        ctx.stroke();
        if (isPattern) {
            ctx.translate(-x, -y);
        }
        if (strokeOpacity < 1) {
            ctx.globalAlpha = alpha;
        }
    },

    _path:function (ctx, points, lineDashArray, lineOpacity, ignoreStrokePattern) {
        function fillWithPattern(p1, p2) {
            var degree = maptalks.Util.computeDegree(p1, p2);
            ctx.save();
            ctx.translate(p1.x, p1.y - ctx.lineWidth / 2 / Math.cos(degree));
            ctx.rotate(degree);
            maptalks.Canvas._stroke(ctx, lineOpacity);
            ctx.restore();
        }
        function drawDashLine(startPoint, endPoint, dashArray) {
          //https://davidowens.wordpress.com/2010/09/07/html-5-canvas-and-dashed-lines/
          //
          // Our growth rate for our line can be one of the following:
          //   (+,+), (+,-), (-,+), (-,-)
          // Because of this, our algorithm needs to understand if the x-coord and
          // y-coord should be getting smaller or larger and properly cap the values
          // based on (x,y).
            var fromX = startPoint.x, fromY = startPoint.y,
                toX = endPoint.x, toY = endPoint.y;
            var pattern = dashArray;
            var lt = function (a, b) { return a <= b; };
            var gt = function (a, b) { return a >= b; };
            var capmin = function (a, b) { return Math.min(a, b); };
            var capmax = function (a, b) { return Math.max(a, b); };

            var checkX = {thereYet: gt, cap: capmin};
            var checkY = {thereYet: gt, cap: capmin};

            if (fromY - toY > 0) {
                checkY.thereYet = lt;
                checkY.cap = capmax;
            }
            if (fromX - toX > 0) {
                checkX.thereYet = lt;
                checkX.cap = capmax;
            }

            ctx.moveTo(fromX, fromY);
            var offsetX = fromX;
            var offsetY = fromY;
            var idx = 0, dash = true;
            var ang, len;
            while (!(checkX.thereYet(offsetX, toX) && checkY.thereYet(offsetY, toY))) {
                ang = Math.atan2(toY - fromY, toX - fromX);
                len = pattern[idx];

                offsetX = checkX.cap(toX, offsetX + (Math.cos(ang) * len));
                offsetY = checkY.cap(toY, offsetY + (Math.sin(ang) * len));

                if (dash) {
                    ctx.lineTo(offsetX, offsetY);
                } else {
                    ctx.moveTo(offsetX, offsetY);
                }

                idx = (idx + 1) % pattern.length;
                dash = !dash;
            }
        }
        if (!maptalks.Util.isArrayHasData(points)) { return; }

        var isDashed = maptalks.Util.isArrayHasData(lineDashArray);
        var isPatternLine = (ignoreStrokePattern === true ? false : maptalks.Canvas._isPattern(ctx.strokeStyle));
        var point, prePoint, nextPoint;
        for (var i = 0, len = points.length; i < len; i++) {
            point = points[i]/*._round()*/;
            if (!isDashed || ctx.setLineDash) { //IE9+
                ctx.lineTo(point.x, point.y);
                if (isPatternLine && i > 0) {
                    prePoint = points[i - 1]/*._round()*/;
                    fillWithPattern(prePoint, point);
                    ctx.beginPath();
                    ctx.moveTo(point.x, point.y);
                }
            } else if (isDashed) {
                if (i === len - 1) {
                    break;
                }
                nextPoint = points[i + 1]/*._round()*/;
                drawDashLine(point, nextPoint, lineDashArray, isPatternLine);
            }
        }
    },

    path:function (ctx, points, lineOpacity, fillOpacity, lineDashArray) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        maptalks.Canvas._path(ctx, points, lineDashArray, lineOpacity);
        maptalks.Canvas._stroke(ctx, lineOpacity);
    },

    polygon:function (ctx, points, lineOpacity, fillOpacity, lineDashArray) {
        function fillPolygon(points, i, op) {
            maptalks.Canvas.fillCanvas(ctx, op, points[i][0].x, points[i][0].y);
        }
        var isPatternLine = maptalks.Canvas._isPattern(ctx.strokeStyle),
            fillFirst = (maptalks.Util.isArrayHasData(lineDashArray) && !ctx.setLineDash) || isPatternLine;
        if (!maptalks.Util.isArrayHasData(points[0])) {
            points = [points];
        }
        var op, i, len;
        if (fillFirst) {
            //因为canvas只填充moveto,lineto,lineto的空间, 而dashline的moveto不再构成封闭空间, 所以重新绘制图形轮廓用于填充
            ctx.save();
            for (i = 0, len = points.length; i < len; i++) {
                maptalks.Canvas._ring(ctx, points[i], null, 0, true);
                op = fillOpacity;
                if (i > 0) {
                    ctx.globalCompositeOperation = 'destination-out';
                    op = 1;
                }
                fillPolygon(points, i, op);
                if (i > 0) {
                    ctx.globalCompositeOperation = 'source-over';
                } else {
                    ctx.fillStyle = '#fff';
                }
                maptalks.Canvas._stroke(ctx, 0);
            }
            ctx.restore();
        }
        for (i = 0, len = points.length; i < len; i++) {

            maptalks.Canvas._ring(ctx, points[i], lineDashArray, lineOpacity);

            if (!fillFirst) {
                op = fillOpacity;
                if (i > 0) {
                    ctx.globalCompositeOperation = 'destination-out';
                    op = 1;
                }
                fillPolygon(points, i, op);
                if (i > 0) {
                    //return to default compositeOperation to display strokes.
                    ctx.globalCompositeOperation = 'source-over';
                } else {
                    ctx.fillStyle = '#fff';
                }
            }
            maptalks.Canvas._stroke(ctx, lineOpacity);
        }

    },

    _ring:function (ctx, ring, lineDashArray, lineOpacity, ignoreStrokePattern) {
        var isPatternLine = (ignoreStrokePattern === true ? false : maptalks.Canvas._isPattern(ctx.strokeStyle));
        if (isPatternLine && !ring[0].equals(ring[ring.length - 1])) {
            ring = ring.concat([ring[0]]);
        }
        ctx.beginPath();
        ctx.moveTo(ring[0].x, ring[0].y);
        maptalks.Canvas._path(ctx, ring, lineDashArray, lineOpacity, ignoreStrokePattern);
        if (!isPatternLine) {
            ctx.closePath();
        }
    },

    /**
     * draw an arc from p1 to p2 with degree of (p1, center) and (p2, center)
     * @param  {Context} ctx    canvas context
     * @param  {Point} p1      point 1
     * @param  {Point} p2      point 2
     * @param  {Number} degree arc degree between p1 and p2
     */
    _arcBetween : function (ctx, p1, p2, degree) {
        var a = degree,
            dist = p1.distanceTo(p2),
            //radius of circle
            r = dist / 2 / Math.sin(a / 2);
        //angle between p1 and p2
        var p1p2 = Math.asin((p2.y - p1.y) / dist);
        if (p1.x > p2.x) {
            p1p2 = Math.PI - p1p2;
        }
        //angle between circle center and p2
        var cp2 = 90 * Math.PI / 180 - a / 2,
            da = p1p2 - cp2;

        var dx = Math.cos(da) * r,
            dy = Math.sin(da) * r,
            cx = p1.x + dx,
            cy = p1.y + dy;

        var startAngle = Math.asin((p2.y - cy) / r);
        if (cx > p2.x) {
            startAngle = Math.PI - startAngle;
        }
        var endAngle = startAngle + a;

        ctx.beginPath();
        ctx.arc(cx, cy, r, startAngle, endAngle);
    },

    _lineTo:function (ctx, p) {
        ctx.lineTo(p.x, p.y);
    },

    bezierCurveAndFill:function (ctx, points, lineOpacity, fillOpacity) {
        ctx.beginPath();
        var start = points[0]/*._round()*/;
        ctx.moveTo(start.x, start.y);
        maptalks.Canvas._bezierCurveTo.apply(maptalks.Canvas, [ctx].concat(points.splice(1)));
        maptalks.Canvas.fillCanvas(ctx, fillOpacity);
        maptalks.Canvas._stroke(ctx, lineOpacity);
    },

    _bezierCurveTo:function (ctx, p1, p2, p3) {
        ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    },


    //各种图形的绘制方法
    ellipse:function (ctx, pt, width, height, lineOpacity, fillOpacity) {
        function bezierEllipse(x, y, a, b) {
            var k = 0.5522848,
                ox = a * k, // 水平控制点偏移量
                oy = b * k; // 垂直控制点偏移量
            ctx.beginPath();
           //从椭圆的左端点开始顺时针绘制四条三次贝塞尔曲线
            ctx.moveTo(x - a, y);
            ctx.bezierCurveTo(x - a, y - oy, x - ox, y - b, x, y - b);
            ctx.bezierCurveTo(x + ox, y - b, x + a, y - oy, x + a, y);
            ctx.bezierCurveTo(x + a, y + oy, x + ox, y + b, x, y + b);
            ctx.bezierCurveTo(x - ox, y + b, x - a, y + oy, x - a, y);
            ctx.closePath();
            maptalks.Canvas.fillCanvas(ctx, fillOpacity, pt.x - width, pt.y - height);
            maptalks.Canvas._stroke(ctx, lineOpacity, pt.x - width, pt.y - height);
        }
        // pt = pt._round();
        if (width === height) {
            //如果高宽相同,则直接绘制圆形, 提高效率
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, width, 0, 2 * Math.PI);
            maptalks.Canvas.fillCanvas(ctx, fillOpacity, pt.x - width, pt.y - height);
            maptalks.Canvas._stroke(ctx, lineOpacity, pt.x - width, pt.y - height);
        } else {
            bezierEllipse(pt.x, pt.y, width, height);
        }

    },

    rectangle:function (ctx, pt, size, lineOpacity, fillOpacity) {
        // pt = pt._round();
        ctx.beginPath();
        ctx.rect(pt.x, pt.y, size['width'], size['height']);
        maptalks.Canvas.fillCanvas(ctx, fillOpacity, pt.x, pt.y);
        maptalks.Canvas._stroke(ctx, lineOpacity, pt.x, pt.y);
    },

    sector:function (ctx, pt, size, angles, lineOpacity, fillOpacity) {
        var startAngle = angles[0],
            endAngle = angles[1];
        function sector(ctx, x, y, radius, startAngle, endAngle) {
            var rad = Math.PI / 180;
            var sDeg = rad * -endAngle;
            var eDeg = rad * -startAngle;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.arc(x, y, radius, sDeg, eDeg);
            ctx.lineTo(x, y);
            maptalks.Canvas.fillCanvas(ctx, fillOpacity, x - radius, y - radius);
            maptalks.Canvas._stroke(ctx, lineOpacity, x - radius, y - radius);
        }
        // pt = pt._round();
        sector(ctx, pt.x, pt.y, size, startAngle, endAngle);
    },

    _isPattern : function (style) {
        return !maptalks.Util.isString(style) && !('addColorStop' in style);
    },

    // reference:
    // http://stackoverflow.com/questions/7054272/how-to-draw-smooth-curve-through-n-points-using-javascript-html5-canvas
    quadraticCurve: function (ctx, points) {
        if (!points || points.length <= 2) {
            return;
        }
        var xc = (points[0].x + points[1].x) / 2,
            yc = (points[0].y + points[1].y) / 2;
        ctx.lineTo(xc, yc);
        var ctrlPts = maptalks.Canvas._getQuadCurvePoints(points);
        var i, len = ctrlPts.length;
        for (i = 0; i < len; i += 4) {
            ctx.quadraticCurveTo(ctrlPts[i], ctrlPts[i + 1], ctrlPts[i + 2], ctrlPts[i + 3]);
        }
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    },

    _getQuadCurvePoints : function (points) {
        var ctrlPts = [];
        var i, len = points.length;
        var xc, yc;
        for (i = 1; i < len - 1; i++) {
            xc = (points[i].x + points[i + 1].x) / 2;
            yc = (points[i].y + points[i + 1].y) / 2;
            ctrlPts.push(points[i].x, points[i].y, xc, yc);
        }
        return ctrlPts;
    }
};

(function () {
    var Ajax;
    if (maptalks.node) {
        var urlParser = require('url'),
            http = require('http'),
            https = require('https');

        Ajax = {
            get: function (url, cb) {
                var parsed = urlParser.parse(url);
                this._getClient(parsed.protocol)
                    .get(url, this._wrapCallback(cb))
                    .on('error', cb);
                return this;
            },

            post: function (options, postData, cb) {
                var reqOpts = urlParser.parse(options.url);
                reqOpts.method = 'POST';
                if (!options.headers) {
                    options.headers = {};
                }
                if (!options.headers['Content-Type']) {
                    options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
                }
                reqOpts.headers = options.headers;

                var req = this._getClient(reqOpts.protocol).request(reqOpts, this._wrapCallback(cb));

                req.on('error', cb);

                if (!maptalks.Util.isString(postData)) {
                    postData = JSON.stringify(postData);
                }

                req.write(postData);
                req.end();
                return this;
            },

            _wrapCallback : function (cb) {
                return function (res) {
                    var data = [],
                        isBuffer = false;
                    res.setEncoding('utf8');
                    res.on('data', function (chunk) {
                        if (chunk instanceof Buffer) {
                            isBuffer = true;
                        }
                        data.push(chunk);
                    });
                    res.on('end', function () {
                        cb(null, isBuffer ? Buffer.concat(data).toString('utf8') : data.join(''));
                    });
                };
            },

            _getClient: function (protocol) {
                if (!this._client) {
                    this._client = (protocol && protocol === 'https:') ? https : http;
                }
                return this._client;
            }
        };
    } else {
        Ajax = {
            get: function (url, cb) {
                var client = this._getClient(cb);
                client.open('GET', url, true);
                client.send(null);
                return this;
            },

            post: function (options, postData, cb) {
                var client = this._getClient(cb);
                client.open('POST', options.url, true);
                if (!options.headers) {
                    options.headers = {};
                }
                if (!options.headers['Content-Type']) {
                    options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
                }
                if ('setRequestHeader' in client) {
                    for (var p in options.headers) {
                        if (options.headers.hasOwnProperty(p)) {
                            client.setRequestHeader(p, options.headers[p]);
                        }
                    }
                }
                if (!maptalks.Util.isString(postData)) {
                    postData = JSON.stringify(postData);
                }
                client.send(postData);
                return this;
            },

            _wrapCallback: function (client, cb) {
                var me = this;
                return function () {
                    if (client.withCredentials !== undefined || me._isIE8()) {
                        cb(null, client.responseText);
                    } else if (client.readyState === 4) {
                        if (client.status === 200) {
                            cb(null, client.responseText);
                        } else {
                            if (client.status === 0) {
                                return;
                            }
                            cb(null, '{"success":false,"error":\"Status:' + client.status + ',' + client.statusText + '\"}');
                        }
                    }
                };
            },

            _isIE8: function () {
                return maptalks.Browser.ie && document.documentMode === 8;
            },

            _getClient: function (cb) {
                /*eslint-disable no-empty, no-undef*/
                var client;
                if (this._isIE8()) {
                    try {
                        client = new XDomainRequest();
                    } catch (e) {}
                }
                try { client = new XMLHttpRequest(); } catch (e) {}
                try { client = new ActiveXObject('Msxml2.XMLHTTP'); } catch (e) {}
                try { client = new ActiveXObject('Microsoft.XMLHTTP'); } catch (e) {}

                if (this._isIE8() || client.withCredentials !== undefined) {
                    //Cross Domain request in IE 8
                    client.onload = this._wrapCallback(client, cb);
                } else {
                    client.onreadystatechange = this._wrapCallback(client, cb);
                }

                return client;
                /*eslint-enable no-empty, no-undef*/
            }
        };
    }

    /**
     * Load a resource
     * @param {String} url          - resource url
     * @param {Function} callback   - callback function when completed.
     * @static
     */
    Ajax.getResource = function (url, cb) {
        return this.get(url, cb);
    };


    /**
     * Load a json.
     * @param {String} url          - json's url
     * @param {Function} callback   - callback function when completed.
     * @static
     */
    Ajax.getJSON = function (url, cb) {
        var callback = function (err, resp) {
            var data = resp ? maptalks.Util.parseJSON(resp) : null;
            cb(err, data);
        };
        return Ajax.getResource(url, callback);
    };

    maptalks.Util.getJSON = Ajax.getJSON;

    maptalks.Ajax = Ajax;
})();

/*!
    Feature Filter by

    (c) mapbox 2016
    www.mapbox.com
    License: MIT, header required.
*/
(function () {
    var types = ['Unknown', 'Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon', 'GeometryCollection'];

    /**
     * Given a filter expressed as nested arrays, return a new function
     * that evaluates whether a given feature (with a .properties or .tags property)
     * passes its test.
     *
     * @param {Array} filter mapbox gl filter
     * @returns {Function} filter-evaluating function
     */
    function createFilter(filter) {
        return new Function('f', 'var p = (f && f.properties || {}); return ' + compile(filter));
    }

    function compile(filter) {
        if (!filter) return 'true';
        var op = filter[0];
        if (filter.length <= 1) return op === 'any' ? 'false' : 'true';
        var str =
            op === '==' ? compileComparisonOp(filter[1], filter[2], '===', false) :
            op === '!=' ? compileComparisonOp(filter[1], filter[2], '!==', false) :
            op === '<' ||
            op === '>' ||
            op === '<=' ||
            op === '>=' ? compileComparisonOp(filter[1], filter[2], op, true) :
            op === 'any' ? compileLogicalOp(filter.slice(1), '||') :
            op === 'all' ? compileLogicalOp(filter.slice(1), '&&') :
            op === 'none' ? compileNegation(compileLogicalOp(filter.slice(1), '||')) :
            op === 'in' ? compileInOp(filter[1], filter.slice(2)) :
            op === '!in' ? compileNegation(compileInOp(filter[1], filter.slice(2))) :
            op === 'has' ? compileHasOp(filter[1]) :
            op === '!has' ? compileNegation(compileHasOp([filter[1]])) :
            'true';
        return '(' + str + ')';
    }

    function compilePropertyReference(property) {
        return property[0] === '$' ? 'f.' + property.substring(1) : 'p[' + JSON.stringify(property) + ']';
    }

    function compileComparisonOp(property, value, op, checkType) {
        var left = compilePropertyReference(property);
        var right = property === '$type' ? maptalks.Util.indexOfArray(value, types) : JSON.stringify(value);
        return (checkType ? 'typeof ' + left + '=== typeof ' + right + '&&' : '') + left + op + right;
    }

    function compileLogicalOp(expressions, op) {
        return maptalks.Util.mapArray(expressions, compile).join(op);
    }

    function compileInOp(property, values) {
        if (property === '$type') values = maptalks.Util.mapArray(values, function (value) { return maptalks.Util.indexOfArray(value, types); });
        var left = JSON.stringify(values.sort(compare));
        var right = compilePropertyReference(property);

        if (values.length <= 200) return 'maptalks.Util.indexOfArray(' + right + ', ' + left + ') !== -1';
        return 'function(v, a, i, j) {' +
            'while (i <= j) { var m = (i + j) >> 1;' +
            '    if (a[m] === v) return true; if (a[m] > v) j = m - 1; else i = m + 1;' +
            '}' +
        'return false; }(' + right + ', ' + left + ',0,' + (values.length - 1) + ')';
    }

    function compileHasOp(property) {
        return JSON.stringify(property) + ' in p';
    }

    function compileNegation(expression) {
        return '!(' + expression + ')';
    }

    // Comparison function to sort numbers and strings
    function compare(a, b) {
        return a < b ? -1 : a > b ? 1 : 0;
    }

    maptalks.Util.createFilter = createFilter;

    maptalks.Util.getFilterFeature = function (geometry) {
        var json = geometry._toJSON(),
            g = json['feature'];
        g['type'] = maptalks.Util.indexOfArray(g['geometry']['type'], types);
        g['subType'] = json['subType'];
        return g;
    };
})();



(function ()  {

    function createFunction(parameters, defaultType) {
        var fun;

        if (!isFunctionDefinition(parameters)) {
            fun = function() { return parameters; };
            fun.isFeatureConstant = true;
            fun.isZoomConstant = true;

        } else {
            var zoomAndFeatureDependent = typeof parameters.stops[0][0] === 'object';
            var featureDependent = zoomAndFeatureDependent || parameters.property !== undefined;
            var zoomDependent = zoomAndFeatureDependent || !featureDependent;
            var type = parameters.type || defaultType || 'exponential';

            var innerFun;
            if (type === 'exponential') {
                innerFun = evaluateExponentialFunction;
            } else if (type === 'interval') {
                innerFun = evaluateIntervalFunction;
            } else if (type === 'categorical') {
                innerFun = evaluateCategoricalFunction;
            } else {
                throw new Error('Unknown function type "' + type + '"');
            }

            if (zoomAndFeatureDependent) {
                var featureFunctions = {};
                var featureFunctionStops = [];
                for (var s = 0; s < parameters.stops.length; s++) {
                    var stop = parameters.stops[s];
                    if (featureFunctions[stop[0].zoom] === undefined) {
                        featureFunctions[stop[0].zoom] = {
                            zoom: stop[0].zoom,
                            type: parameters.type,
                            property: parameters.property,
                            stops: []
                        };
                    }
                    featureFunctions[stop[0].zoom].stops.push([stop[0].value, stop[1]]);
                }

                for (var z in featureFunctions) {
                    featureFunctionStops.push([featureFunctions[z].zoom, createFunction(featureFunctions[z])]);
                }
                fun = function(zoom, feature) {
                    return evaluateExponentialFunction({ stops: featureFunctionStops, base: parameters.base }, zoom)(zoom, feature);
                };
                fun.isFeatureConstant = false;
                fun.isZoomConstant = false;

            } else if (zoomDependent) {
                fun = function(zoom) {
                    return innerFun(parameters, zoom);
                };
                fun.isFeatureConstant = true;
                fun.isZoomConstant = false;
            } else {
                fun = function(zoom, feature) {
                    return innerFun(parameters, feature[parameters.property]);
                };
                fun.isFeatureConstant = false;
                fun.isZoomConstant = true;
            }
        }

        return fun;
    }

    function evaluateCategoricalFunction(parameters, input) {
        for (var i = 0; i < parameters.stops.length; i++) {
            if (input === parameters.stops[i][0]) {
                return parameters.stops[i][1];
            }
        }
        return parameters.stops[0][1];
    }

    function evaluateIntervalFunction(parameters, input) {
        for (var i = 0; i < parameters.stops.length; i++) {
            if (input < parameters.stops[i][0]) break;
        }
        return parameters.stops[Math.max(i - 1, 0)][1];
    }

    function evaluateExponentialFunction(parameters, input) {
        var base = parameters.base !== undefined ? parameters.base : 1;

        var i = 0;
        while (true) {
            if (i >= parameters.stops.length) break;
            else if (input <= parameters.stops[i][0]) break;
            else i++;
        }

        if (i === 0) {
            return parameters.stops[i][1];

        } else if (i === parameters.stops.length) {
            return parameters.stops[i - 1][1];

        } else {
            return interpolate(
                input,
                base,
                parameters.stops[i - 1][0],
                parameters.stops[i][0],
                parameters.stops[i - 1][1],
                parameters.stops[i][1]
            );
        }
    }


    function interpolate(input, base, inputLower, inputUpper, outputLower, outputUpper) {
        if (typeof outputLower === 'function') {
            return function() {
                var evaluatedLower = outputLower.apply(undefined, arguments);
                var evaluatedUpper = outputUpper.apply(undefined, arguments);
                return interpolate(input, base, inputLower, inputUpper, evaluatedLower, evaluatedUpper);
            };
        } else if (outputLower.length) {
            return interpolateArray(input, base, inputLower, inputUpper, outputLower, outputUpper);
        } else {
            return interpolateNumber(input, base, inputLower, inputUpper, outputLower, outputUpper);
        }
    }

    function interpolateNumber(input, base, inputLower, inputUpper, outputLower, outputUpper) {
        var difference =  inputUpper - inputLower;
        var progress = input - inputLower;

        var ratio;
        if (base === 1) {
            ratio = progress / difference;
        } else {
            ratio = (Math.pow(base, progress) - 1) / (Math.pow(base, difference) - 1);
        }

        return (outputLower * (1 - ratio)) + (outputUpper * ratio);
    }

    function interpolateArray(input, base, inputLower, inputUpper, outputLower, outputUpper) {
        var output = [];
        for (var i = 0; i < outputLower.length; i++) {
            output[i] = interpolateNumber(input, base, inputLower, inputUpper, outputLower[i], outputUpper[i]);
        }
        return output;
    }

    function isFunctionDefinition(value) {
        return value && typeof value === 'object' && value.stops;
    }


    maptalks.Util.isFunctionDefinition = isFunctionDefinition;

    maptalks.Util.interpolated = function(parameters) {
        return createFunction(parameters, 'exponential');
    };

    maptalks.Util['piecewise-constant'] = function(parameters) {
        return createFunction(parameters, 'interval');
    };

    maptalks.Util.loadFunctionTypes = function (obj, argFn) {
        if (!obj) {
            return null;
        }
        if (maptalks.Util.isArray(obj)) {
            var multResult = [];
            for (var i = 0; i < obj.length; i++) {
                multResult.push(maptalks.Util.loadFunctionTypes(obj[i], argFn));
            }
            return multResult;
        }
        var result = {},
            props = [], p;
        for (p in obj) {
            if (obj.hasOwnProperty(p)) {
                props.push(p);
            }
        }
        for (var i = 0, len = props.length; i < len; i++) {
            p = props[i];
            if (maptalks.Util.isFunctionDefinition(obj[p])) {
                result['_' + p] = obj[p];
                (function (_p) {
                    Object.defineProperty(result, _p, {
                        get: function () {
                            if (!this['__fn_' + _p]) {
                                this['__fn_' + _p] = maptalks.Util.interpolated(this['_' + _p]);
                            }
                            return this['__fn_' + _p].apply(this, argFn());
                        },
                        set: function (v) {
                            this['_' + _p] = v;
                        },
                        configurable : true,
                        enumerable : true
                    });
                })(p);
            } else {
                result[p] = obj[p];
            }
        }
        return result;
    };

    maptalks.Util.getFunctionTypeResources = function (t) {
        if (!t || !t.stops) {
            return null;
        }
        var res = [];
        for (var i = 0, l = t.stops.length; i < l; i++) {
            res.push(t.stops[i][1]);
        }
        return res;
    }

})();

if (typeof Promise !== 'undefined') {
    //built in Promise
    maptalks.Promise = Promise;
} else {
// zousan - A Lightning Fast, Yet Very Small Promise A+ Compliant Implementation
// https://github.com/bluejava/zousan
// Version 2.2.2

/* jshint asi: true, browser: true */
/* global setImmediate, console */
(function(_global){

        "use strict";

        var
            STATE_PENDING,                  // These are the three possible states (PENDING remains undefined - as intended)
            STATE_FULFILLED = "fulfilled",      // a promise can be in.  The state is stored
            STATE_REJECTED = "rejected",        // in this.state as read-only

            _undefined,                     // let the obfiscator compress these down
            _undefinedString = "undefined";     // by assigning them to variables (debatable "optimization")

        // See http://www.bluejava.com/4NS/Speed-up-your-Websites-with-a-Faster-setTimeout-using-soon
        // This is a very fast "asynchronous" flow control - i.e. it yields the thread and executes later,
        // but not much later. It is far faster and lighter than using setTimeout(fn,0) for yielding threads.
        // Its also faster than other setImmediate shims, as it uses Mutation Observer and "mainlines" successive
        // calls internally.
        // WARNING: This does not yield to the browser UI loop, so by using this repeatedly
        //      you can starve the UI and be unresponsive to the user.
        // This is an even FASTER version of https://gist.github.com/bluejava/9b9542d1da2a164d0456 that gives up
        // passing context and arguments, in exchange for a 25x speed increase. (Use anon function to pass context/args)
        var soon = (function() {

                var fq = [], // function queue;
                    fqStart = 0, // avoid using shift() by maintaining a start pointer - and remove items in chunks of 1024 (bufferSize)
                    bufferSize = 1024

                function callQueue()
                {
                    while(fq.length - fqStart) // this approach allows new yields to pile on during the execution of these
                    {
                        fq[fqStart](); // no context or args..
                        fq[fqStart++] = _undefined  // increase start pointer and dereference function just called
                        if(fqStart == bufferSize)
                        {
                            fq.splice(0,bufferSize);
                            fqStart = 0;
                        }
                    }
                }

                // run the callQueue function asyncrhonously, as fast as possible
                var cqYield = (function() {

                        // This is the fastest way browsers have to yield processing
                        if(typeof MutationObserver !== _undefinedString)
                        {
                            // first, create a div not attached to DOM to "observe"
                            var dd = document.createElement("div");
                            var mo = new MutationObserver(callQueue);
                            mo.observe(dd, { attributes: true });

                            return function() { dd.setAttribute("a",0); } // trigger callback to
                        }

                        // if No MutationObserver - this is the next best thing - handles Node and MSIE
                        if(typeof setImmediate !== _undefinedString)
                            return function() { setImmediate(callQueue) }

                        // final fallback - shouldn't be used for much except very old browsers
                        return function() { setTimeout(callQueue,0) }
                    })();

                // this is the function that will be assigned to soon
                // it takes the function to call and examines all arguments
                return function(fn) {

                        // push the function and any remaining arguments along with context
                        fq.push(fn);

                        if((fq.length - fqStart) == 1) // upon adding our first entry, kick off the callback
                            cqYield();
                    };

            })();

        // -------- BEGIN our main "class" definition here -------------

        function Zousan(func)
        {
            //  this.state = STATE_PENDING; // Inital state (PENDING is undefined, so no need to actually have this assignment)
            //this.c = [];          // clients added while pending.   <Since 1.0.2 this is lazy instantiation>

            // If a function was specified, call it back with the resolve/reject functions bound to this context
            if(func)
            {
                var me = this;
                func(
                    function(arg) { me.resolve(arg) },  // the resolve function bound to this context.
                    function(arg) { me.reject(arg) })   // the reject function bound to this context
            }
        }

        Zousan.prototype = {    // Add 6 functions to our prototype: "resolve", "reject", "then", "catch", "finally" and "timeout"

                resolve: function(value)
                {
                    if(this.state !== STATE_PENDING)
                        return;

                    if(value === this)
                        return this.reject(new TypeError("Attempt to resolve promise with self"));

                    var me = this; // preserve this

                    if(value && (typeof value === "function" || typeof value === "object"))
                    {
                        try
                        {
                            var first = true; // first time through?
                            var then = value.then;
                            if(typeof then === "function")
                            {
                                // and call the value.then (which is now in "then") with value as the context and the resolve/reject functions per thenable spec
                                then.call(value,
                                    function(ra) { if(first) { first=false; me.resolve(ra);}  },
                                    function(rr) { if(first) { first=false; me.reject(rr); } });
                                return;
                            }
                        }
                        catch(e)
                        {
                            if(first)
                                this.reject(e);
                            return;
                        }
                    }

                    this.state = STATE_FULFILLED;
                    this.v = value;

                    if(me.c)
                        soon(function() {
                                for(var n=0, l=me.c.length;n<l;n++)
                                    resolveClient(me.c[n],value);
                            });
                },

                reject: function(reason)
                {
                    if(this.state !== STATE_PENDING)
                        return;

                    this.state = STATE_REJECTED;
                    this.v = reason;

                    var clients = this.c;
                    if(clients)
                        soon(function() {
                                for(var n=0, l=clients.length;n<l;n++)
                                    rejectClient(clients[n],reason);
                            });
                    else
                        if(!Zousan.suppressUncaughtRejectionError)
                            console.log("You upset Zousan. Please catch rejections: ",reason,reason.stack);
                },

                then: function(onF,onR)
                {
                    var p = new Zousan();
                    var client = {y:onF,n:onR,p:p};

                    if(this.state === STATE_PENDING)
                    {
                         // we are pending, so client must wait - so push client to end of this.c array (create if necessary for efficiency)
                        if(this.c)
                            this.c.push(client);
                        else
                            this.c = [client];
                    }
                    else // if state was NOT pending, then we can just immediately (soon) call the resolve/reject handler
                    {
                        var s = this.state, a = this.v;
                        soon(function() { // we are not pending, so yield script and resolve/reject as needed
                                if(s === STATE_FULFILLED)
                                    resolveClient(client,a);
                                else
                                    rejectClient(client,a);
                            });
                    }

                    return p;
                },

                "catch": function(cfn) { return this.then(null,cfn); }, // convenience method
                "finally": function(cfn) { return this.then(cfn,cfn); }, // convenience method

                // new for 1.2  - this returns a new promise that times out if original promise does not resolve/reject before the time specified.
                // Note: this has no effect on the original promise - which may still resolve/reject at a later time.
                "timeout" : function(ms,timeoutMsg)
                {
                    timeoutMsg = timeoutMsg || "Timeout"
                    var me = this;
                    return new Zousan(function(resolve,reject) {

                            setTimeout(function() {
                                    reject(Error(timeoutMsg));  // This will fail silently if promise already resolved or rejected
                                }, ms);

                            me.then(function(v) { resolve(v) },     // This will fail silently if promise already timed out
                                    function(er) { reject(er) });       // This will fail silently if promise already timed out

                        })
                }

            }; // END of prototype function list

        function resolveClient(c,arg)
        {
            if(typeof c.y === "function")
            {
                try {
                        var yret = c.y.call(_undefined,arg);
                        c.p.resolve(yret);
                    }
                catch(err) { c.p.reject(err) }
            }
            else
                c.p.resolve(arg); // pass this along...
        }

        function rejectClient(c,reason)
        {
            if(typeof c.n === "function")
            {
                try
                {
                    var yret = c.n.call(_undefined,reason);
                    c.p.resolve(yret);
                }
                catch(err) { c.p.reject(err) }
            }
            else
                c.p.reject(reason); // pass this along...
        }

        // "Class" functions follow (utility functions that live on the Zousan function object itself)

        Zousan.resolve = function(val) { var z = new Zousan(); z.resolve(val); return z; }

        Zousan.reject = function(err) { var z = new Zousan(); z.reject(err); return z; }

        Zousan.all = function(pa)
        {
            var results = [ ], rc = 0, retP = new Zousan(); // results and resolved count

            function rp(p,i)
            {
                if(typeof p.then !== "function")
                    p = Zousan.resolve(p);
                p.then(
                        function(yv) { results[i] = yv; rc++; if(rc == pa.length) retP.resolve(results); },
                        function(nv) { retP.reject(nv); }
                    );
            }

            for(var x=0;x<pa.length;x++)
                rp(pa[x],x);

            // For zero length arrays, resolve immediately
            if(!pa.length)
                retP.resolve(results);

            return retP;
        }

        // If this appears to be a commonJS environment, assign Zousan as the module export
        // if(typeof module != _undefinedString && module.exports)     // jshint ignore:line
        //     module.exports = Zousan;    // jshint ignore:line

        // If this appears to be an AMD environment, define Zousan as the module export (commented out until confirmed works with r.js)
        //if(global.define && global.define.amd)
        //  global.define([], function() { return Zousan });

        // Make Zousan a global variable in all environments
        // global.Zousan = Zousan;

        // make soon accessable from Zousan
        // Zousan.soon = soon;

        //by maptalks
        _global.Promise = Zousan;

        // make soon accessable from Zousan
        // Zousan.soon = soon;

    })(/*typeof global != "undefined" ? global : this*//* by maptalks*/maptalks);   // jshint ignore:line
}

/**
 * Represents a coordinate point <br>
 * e.g. <br>
 * a geographical point with a certain latitude and longitude <br>
 * a point in a indoor room
 * @example
 * var coord = new maptalks.Coordinate(0, 0);
 * @example
 * var coord = new maptalks.Coordinate([0,0]);
 * @example
 * var coord = new maptalks.Coordinate({x:0, y:0});
 * @class
 * @category basic types
 * @param {Number} x - x value
 * @param {Number} y - y value
 */
maptalks.Coordinate = function (x, y) {
    if (!maptalks.Util.isNil(x) && !maptalks.Util.isNil(y)) {
        /**
         * @property {Number} x - value on X-Axis or longitude in degrees
         */
        this.x = +(x);
        /**
         * @property {Number} y - value on Y-Axis or Latitude in degrees
         */
        this.y = +(y);
    } else if (maptalks.Util.isArray(x)) {
        //数组
        this.x = +(x[0]);
        this.y = +(x[1]);
    } else if (!maptalks.Util.isNil(x['x']) && !maptalks.Util.isNil(x['y'])) {
        //对象
        this.x = +(x['x']);
        this.y = +(x['y']);
    }
    if (this.isNaN()) {
        throw new Error('coordinate is NaN');
    }
};

maptalks.Util.extend(maptalks.Coordinate.prototype, /** @lends maptalks.Coordinate.prototype */{
    /**
     * Returns a copy of the coordinate
     * @return {maptalks.Coordinate} copy
     */
    copy:function () {
        return new maptalks.Coordinate(this.x, this.y);
    },

    //destructive add, to improve performance in some circumstances.
    _add: function (x, y) {
        if (x instanceof maptalks.Coordinate) {
            this.x += x.x;
            this.y += x.y;
        } else {
            this.x += x;
            this.y += y;
        }
        return this;
    },
    /**
     * Returns the result of addition of another coordinate.
     * @param {maptalks.Coordinate} coordinate - coordinate to add
     * @return {maptalks.Coordinate} result
     */
    add:function (x, y) {
        var nx, ny;
        if (x instanceof maptalks.Coordinate) {
            nx = this.x + x.x;
            ny = this.y + x.y;
        } else {
            nx = this.x + x;
            ny = this.y + y;
        }
        return new maptalks.Coordinate(nx, ny);
    },

    //destructive substract
    _substract: function (x, y) {
        if (x instanceof maptalks.Coordinate) {
            this.x -= x.x;
            this.y -= x.y;
        } else {
            this.x -= x;
            this.y -= y;
        }
        return this;
    },

    /**
     * Returns the result of subtraction of another coordinate.
     * @param {maptalks.Coordinate} coordinate - coordinate to substract
     * @return {maptalks.Coordinate} result
     */
    substract:function (x, y) {
        var nx, ny;
        if (x instanceof maptalks.Coordinate) {
            nx = this.x - x.x;
            ny = this.y - x.y;
        } else {
            nx = this.x - x;
            ny = this.y - y;
        }
        return new maptalks.Coordinate(nx, ny);
    },

    /**
     * Returns the result of multiplication of the current coordinate by the given number.
     * @param {Number} ratio - ratio to multi
     * @return {maptalks.Coordinate} result
     */
    multi: function (ratio) {
        return new maptalks.Coordinate(this.x * ratio, this.y * ratio);
    },

    _multi: function (ratio) {
        this.x *= ratio;
        this.y *= ratio;
        return this;
    },

    /**
     * Compare with another coordinate to see whether they are equal.
     * @param {maptalks.Coordinate} c2 - coordinate to compare
     * @return {Boolean}
     */
    equals:function (c2) {
        if (!maptalks.Util.isCoordinate(c2)) {
            return false;
        }
        return this.x === c2.x && this.y === c2.y;
    },

    /**
     * Whether the coordinate is NaN
     * @return {Boolean}
     */
    isNaN:function () {
        return isNaN(this.x) || isNaN(this.y);
    },

    /**
     * Convert the coordinate to a number array [x, y]
     * @return {Number[]} number array
     */
    toArray:function () {
        return [this.x, this.y];
    },

    /**
     * Convert the coordinate to a json object {x : .., y : ..}
     * @return {Object} json
     */
    toJSON: function () {
        return {
            x : this.x,
            y : this.y
        };
    }
});

/**
 * Represents a 2d point.<br>
 * Can be created in serveral ways:
 * @example
 * var point = new maptalks.Point(1000, 1000);
 * @example
 * var point = new maptalks.Point([1000,1000]);
 * @example
 * var point = new maptalks.Point({x:1000, y:1000});
 * @class
 * @category basic types
 * @param {Number} x - x value
 * @param {Number} y - y value
 */
maptalks.Point = function (x, y) {
    if (!maptalks.Util.isNil(x) && !maptalks.Util.isNil(y)) {
        /**
         * @property x {Number} - x value
         */
        this.x = x;
        /**
         * @property y {Number} - y value
         */
        this.y = y;
    } else if (!maptalks.Util.isNil(x.x) && !maptalks.Util.isNil(x.y)) {
        //对象
        this.x = x.x;
        this.y = x.y;
    } else if (maptalks.Util.isArrayHasData(x)) {
        this.x = x[0];
        this.y = x[1];
    }
    if (this.isNaN()) {
        throw new Error('point is NaN');
    }
};

maptalks.Util.extend(maptalks.Point.prototype, /** @lends maptalks.Point.prototype */{
    abs: function () {
        return new maptalks.Point(Math.abs(this.x), Math.abs(this.y));
    },

    _abs:function () {
        this.x = Math.abs(this.x);
        this.y = Math.abs(this.y);
        return this;
    },
    /**
     * Returns a copy of the point
     * @return {maptalks.Point} copy
     */
    copy:function () {
        return new maptalks.Point(this.x, this.y);
    },

    _round:function () {
        this.x = maptalks.Util.round(this.x);
        this.y = maptalks.Util.round(this.y);
        return this;
    },

    /**
     * Like math.round, rounding the point's xy.
     * @return {maptalks.Point} rounded point
     */
    round:function () {
        return new maptalks.Point(maptalks.Util.round(this.x), maptalks.Util.round(this.y));
    },

    /**
     * Compare with another point to see whether they are equal.
     * @param {maptalks.Point} c2 - point to compare
     * @return {Boolean}
     */
    equals:function (p) {
        return this.x === p.x && this.y === p.y;
    },

    /**
     * Returns the distance between the current and the given point.
     * @param  {maptalks.Point} point - another point
     * @return {Number} distance
     */
    distanceTo: function (point) {
        var x = point.x - this.x,
            y = point.y - this.y;
        return Math.sqrt(x * x + y * y);
    },

    //Destructive add
    _add: function (x, y) {
        if (x instanceof maptalks.Point) {
            this.x += x.x;
            this.y += x.y;
        } else {
            this.x += x;
            this.y += y;
        }
        return this;
    },

    /**
     * Returns the result of addition of another point.
     * @param {maptalks.Point} point - point to add
     * @return {maptalks.Point} result
     */
    add: function (x, y) {
        var nx, ny;
        if (x instanceof maptalks.Point) {
            nx = this.x + x.x;
            ny = this.y + x.y;
        } else {
            nx = this.x + x;
            ny = this.y + y;
        }
        return new maptalks.Point(nx, ny);
    },

    _substract: function (x, y) {
        if (x instanceof maptalks.Point) {
            this.x -= x.x;
            this.y -= x.y;
        } else {
            this.x -= x;
            this.y -= y;
        }
        return this;
    },

    /**
     * Returns the result of subtraction of another point.
     * @param {maptalks.Point} point - point to substract
     * @return {maptalks.Point} result
     */
    substract: function (x, y) {
        var nx, ny;
        if (x instanceof maptalks.Point) {
            nx = this.x - x.x;
            ny = this.y - x.y;
        } else {
            nx = this.x - x;
            ny = this.y - y;
        }
        return new maptalks.Point(nx, ny);
    },

    //破坏性方法
    _multi: function (n) {
        this.x *= n;
        this.y *= n;
        return this;
    },

    /**
     * Returns the result of multiplication of the current point by the given number.
     * @param {Number} n - number to multi
     * @return {maptalks.Point} result
     */
    multi: function (n) {
        return new maptalks.Point(this.x * n, this.y * n);
    },

    /**
     * Returns the result of division of the current point by the given number.
     * @param {Number} n - number to div
     * @return {maptalks.Point} result
     */
    div: function (n) {
        return this.multi(1 / n);
    },

    _div: function (n) {
        return this._multi(1 / n);
    },

    /**
     * Whether the point is NaN
     * @return {Boolean}
     */
    isNaN:function () {
        return isNaN(this.x) || isNaN(this.y);
    },

    /**
     * Convert the point to a number array [x, y]
     * @return {Number[]} number array
     */
    toArray:function () {
        return [this.x, this.y];
    },

    /**
     * Convert the point to a json object {x : .., y : ..}
     * @return {Object} json
     */
    toJSON: function () {
        return {
            x : this.x,
            y : this.y
        };
    },

    /**
     * Return the magitude of this point: this is the Euclidean
     * distance from the 0, 0 coordinate to this point's x and y
     * coordinates.
     * @return {Number} magnitude
     */
    mag: function () {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    },

    /**
     * Calculate this point but as a unit vector from 0, 0, meaning
     * that the distance from the resulting point to the 0, 0
     * coordinate will be equal to 1 and the angle from the resulting
     * point to the 0, 0 coordinate will be the same as before.
     * @return {maptalks.Point} unit vector point
     */
    unit: function () { return this.copy()._unit(); },

    _unit: function () {
        this._div(this.mag());
        return this;
    },

    /**
     * Compute a perpendicular point, where the new y coordinate
     * is the old x coordinate and the new x coordinate is the old y
     * coordinate multiplied by -1
     * @return {maptalks.Point} perpendicular point
     */
    perp: function () { return this.copy()._perp(); },

    _perp: function () {
        var y = this.y;
        this.y = this.x;
        this.x = -y;
        return this;
    }
});

/**
 * Represents a size.
 * @class
 * @category basic types
 * @param {Number} width - width value
 * @param {Number} height - height value
 */
maptalks.Size = function (width, height) {
    /**
     * @property {Number} width - width
     */
    this.width = width;
    /**
     * @property {Number} height - height
     */
    this.height = height;
};

maptalks.Util.extend(maptalks.Size.prototype, /** @lends maptalks.Size.prototype */{
    /**
     * Returns a copy of the size
     * @return {maptalks.Size} copy
     */
    copy:function () {
        return new maptalks.Size(this['width'], this['height']);
    },
    /**
     * Returns the result of addition of another size.
     * @param {maptalks.Size} size - size to add
     * @return {maptalks.Size} result
     */
    add:function (size) {
        return new maptalks.Size(this['width'] + size['width'], this['height'] + size['height']);
    },
    /**
     * Compare with another size to see whether they are equal.
     * @param {maptalks.Size} size - size to compare
     * @return {Boolean}
     */
    equals:function (size) {
        return this['width'] === size['width'] && this['height'] === size['height'];
    },
    /**
     * Returns the result of multiplication of the current size by the given number.
     * @param {Number} ratio - ratio to multi
     * @return {maptalks.Size} result
     */
    multi:function (ratio) {
        return new maptalks.Size(this['width'] * ratio, this['height'] * ratio);
    },
    _multi:function (ratio) {
        this['width'] *= ratio;
        this['height'] *= ratio;
        return this;
    },
    _round:function () {
        this['width'] = maptalks.Util.round(this['width']);
        this['height'] = maptalks.Util.round(this['height']);
        return this;
    },

    /**
     * Converts the size object to a [maptalks.Point]{maptalks.Point}
     * @return {maptalks.Point} point
     */
    toPoint:function () {
        return new maptalks.Point(this['width'], this['height']);
    },

    /**
     * Converts the size object to a array [width, height]
     * @return {Number[]}
     */
    toArray: function () {
        return [this['width'], this['height']];
    },

    /**
     * Convert the size object to a json object {width : .., height : ..}
     * @return {Object} json
     */
    toJSON: function () {
        return {
            'width' : this['width'],
            'height': this['height']
        };
    }
});


/**
 * Represent CRS defined by [GeoJSON]{@link http://geojson.org/geojson-spec.html#coordinate-reference-system-objects}
 *
 * @class
 * @category geo
 * @param {String} type          - type of the CRS
 * @param {Object} properties    - CRS's properties
 */
maptalks.CRS = function (type, properties) {
    this.type = type;
    this.properties = properties;
};

/**
 * Create a [proj4]{@link https://github.com/OSGeo/proj.4} style CRS used by maptalks <br>
 * @example
 * {
 *     "type"       : "proj4",
 *     "properties" : {
 *         "proj"   : "+proj=longlat +datum=WGS84 +no_defs"
 *     }
 * }
 * var crs_wgs84 = maptalks.CRS.createProj4("+proj=longlat +datum=WGS84 +no_defs");
 * @static
 * @param  {String} proj - a proj4 projection string.
 * @return {maptalks.CRS}
 */
maptalks.CRS.createProj4 = function (proj) {
    return new maptalks.CRS('proj4', {
        'proj': proj
    });
};

//some common CRS definitions
/**
 * Predefined CRS of well-known WGS84 (aka EPSG:4326)
 * @type {maptalks.CRS}
 * @static
 * @constant
 */
maptalks.CRS.WGS84 = maptalks.CRS.createProj4('+proj=longlat +datum=WGS84 +no_defs');
/**
 * Alias for maptalks.CRS.WGS84
 * @type {maptalks.CRS}
 * @static
 * @constant
 */
maptalks.CRS.EPSG4326 = maptalks.CRS.WGS84;
/**
 * Projected Coordinate System used by google maps that has the following alias: 'EPSG:3785', 'GOOGLE', 'EPSG:900913'
 * @type {maptalks.CRS}
 * @static
 * @constant
 */
maptalks.CRS.EPSG3857 = maptalks.CRS.createProj4('+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs');
/**
 * A CRS represents a simple Cartesian coordinate system. <br>
 * Maps x, y directly, is useful for maps of flat surfaces (e.g. indoor maps, game maps).
 * @type {maptalks.CRS}
 * @static
 * @constant
 */
maptalks.CRS.IDENTITY = maptalks.CRS.createProj4('+proj=identity +no_defs');
/**
 * Official coordinate system in China (aka EPSG:4490), in most cases, it can be considered the same with WGS84.
 * @type {maptalks.CRS}
 * @see  {@link http://spatialreference.org/ref/sr-org/7408/}
 * @static
 * @constant
 */
maptalks.CRS.CGCS2000 = maptalks.CRS.createProj4('+proj=longlat +datum=CGCS2000');
/**
 * Alias for maptalks.CRS.CGCS2000
 * @type {maptalks.CRS}
 * @static
 * @constant
 */
maptalks.CRS.EPSG4490 = maptalks.CRS.CGCS2000;
/**
 * Projection used by [Baidu Map]{@link http://map.baidu.com}, a popular web map service in China.
 * @type {maptalks.CRS}
 * @static
 * @constant
 */
maptalks.CRS.BD09LL = maptalks.CRS.createProj4('+proj=longlat +datum=BD09');
/**
 * A encrypted CRS usded in the most online map services in China..
 * @type {maptalks.CRS}
 * @see {@link https://en.wikipedia.org/wiki/Restrictions_on_geographic_data_in_China}
 * @static
 * @constant
 */
maptalks.CRS.GCJ02 = maptalks.CRS.createProj4('+proj=longlat +datum=GCJ02');

/**
 * Represent a bounding box on the map, a rectangular geographical area with minimum and maximum coordinates. <br>
 * There are serveral ways to create a extent:
 * @class
 * @category basic types
 * @param {Number} x1   - x of coordinate 1
 * @param {Number} y1   - y of coordinate 1
 * @param {Number} x2   - x of coordinate 2
 * @param {Number} y2   - y of coordinate 2
 * @example
 * //with 4 numbers
 * var extent = new maptalks.Extent(100, 10, 120, 20);
 * @example
 * //with 2 coordinates
 * var extent = new maptalks.Extent(new maptalks.Coordinate(100, 10), new maptalks.Coordinate(120, 20));
 * @example
 * //with a json object containing xmin, ymin, xmax and ymax
 * var extent = new maptalks.Extent({xmin : 100, ymin: 10, xmax: 120, ymax:20});
 * @example
 * var extent1 = new maptalks.Extent(100, 10, 120, 20);
 * //with another extent
 * var extent2 = new maptalks.Extent(extent1);
 */
maptalks.Extent = function (p1, p2, p3, p4) {
    this._clazz = maptalks.Coordinate;
    this._initialize(p1, p2, p3, p4);
};

maptalks.Util.extend(maptalks.Extent.prototype, /** @lends maptalks.Extent.prototype */{
    _initialize:function (p1, p2, p3, p4) {
        /**
         * @property {Number} xmin - minimum x
         */
        this.xmin = null;
        /**
         * @property {Number} xmax - maximum x
         */
        this.xmax = null;
        /**
         * @property {Number} ymin - minimum y
         */
        this.ymin = null;
        /**
         * @property {Number} ymax - maximum y
         */
        this.ymax = null;
        if (maptalks.Util.isNil(p1)) {
            return;
        }
        //Constructor 1: all numbers
        if (maptalks.Util.isNumber(p1) &&
            maptalks.Util.isNumber(p2) &&
            maptalks.Util.isNumber(p3) &&
            maptalks.Util.isNumber(p4)) {
            this['xmin'] = Math.min(p1, p3);
            this['ymin'] = Math.min(p2, p4);
            this['xmax'] = Math.max(p1, p3);
            this['ymax'] = Math.max(p2, p4);
            return;
        } else if (maptalks.Util.isNumber(p1.x) &&
            maptalks.Util.isNumber(p2.x) &&
            maptalks.Util.isNumber(p1.y) &&
            maptalks.Util.isNumber(p2.y)) {
            //Constructor 2: two coordinates
            if (p1.x > p2.x) {
                this['xmin'] = p2.x;
                this['xmax'] = p1.x;
            } else {
                this['xmin'] = p1.x;
                this['xmax'] = p2.x;
            }
            if (p1.y > p2.y) {
                this['ymin'] = p2.y;
                this['ymax'] = p1.y;
            } else {
                this['ymin'] = p1.y;
                this['ymax'] = p2.y;
            }
            //constructor 3: another extent or a object containing xmin, ymin, xmax and ymax
        } else if (maptalks.Util.isNumber(p1['xmin']) &&
                maptalks.Util.isNumber(p1['xmax']) &&
                maptalks.Util.isNumber(p1['ymin']) &&
                maptalks.Util.isNumber(p1['ymax'])) {
            this['xmin'] = p1['xmin'];
            this['ymin'] = p1['ymin'];
            this['xmax'] = p1['xmax'];
            this['ymax'] = p1['ymax'];
        }
    },

    _add: function (p) {
        this['xmin'] += p.x;
        this['ymin'] += p.y;
        this['xmax'] += p.x;
        this['ymax'] += p.y;
        return this;
    },

    /**
     * Add the extent with a coordinate or a point.
     * @param {maptalks.Coordinate|maptalks.Point} p - point or coordinate to add
     * @returns {maptalks.Extent} a new extent
     */
    add: function (p) {
        return new this.constructor(this['xmin'] + p.x, this['ymin'] + p.y, this['xmax'] + p.x, this['ymax'] + p.y);
    },

    _substract: function (p) {
        this['xmin'] -= p.x;
        this['ymin'] -= p.y;
        this['xmax'] -= p.x;
        this['ymax'] -= p.y;
        return this;
    },

    /**
     * Substract the extent with a coordinate or a point.
     * @param {maptalks.Coordinate|maptalks.Point} p - point or coordinate to substract
     * @returns {maptalks.Extent} a new extent
     */
    substract: function (p) {
        return new this.constructor(this['xmin'] - p.x, this['ymin'] - p.y, this['xmax'] - p.x, this['ymax'] - p.y);
    },

    /**
     * Round the extent
     * @return {maptalks.Extent} rounded extent
     */
    round:function () {
        return new this.constructor(maptalks.Util.round(this['xmin']), maptalks.Util.round(this['ymin']),
            maptalks.Util.round(this['xmax']), maptalks.Util.round(this['ymax']));
    },

    _round:function () {
        this['xmin'] = maptalks.Util.round(this['xmin']);
        this['ymin'] = maptalks.Util.round(this['ymin']);
        this['xmax'] = maptalks.Util.round(this['xmax']);
        this['ymax'] = maptalks.Util.round(this['ymax']);
        return this;
    },

    /**
     * Get the minimum point
     * @return {maptalks.Coordinate}
     */
    getMin:function () {
        return new this._clazz(this['xmin'], this['ymin']);
    },

    /**
     * Get the maximum point
     * @return {maptalks.Coordinate}
     */
    getMax:function () {
        return new this._clazz(this['xmax'], this['ymax']);
    },


    /**
     * Get center of the extent.
     * @return {maptalks.Coordinate}
     */
    getCenter:function () {
        return new this._clazz((this['xmin'] + this['xmax']) / 2, (this['ymin'] + this['ymax']) / 2);
    },

    /**
     * Whether the extent is valid
     * @protected
     * @return {Boolean}
     */
    isValid:function () {
        return maptalks.Util.isNumber(this['xmin']) &&
                maptalks.Util.isNumber(this['ymin']) &&
                maptalks.Util.isNumber(this['xmax']) &&
                maptalks.Util.isNumber(this['ymax']);
    },


    /**
     * Compare with another extent to see whether they are equal.
     * @param  {maptalks.Extent}  ext2 - extent to compare
     * @return {Boolean}
     */
    equals:function (ext2) {
        return (this['xmin'] === ext2['xmin'] &&
            this['xmax'] === ext2['xmax'] &&
            this['ymin'] === ext2['ymin'] &&
            this['ymax'] === ext2['ymax']);
    },

    /**
     * Whether it intersects with another extent
     * @param  {maptalks.Extent}  ext2 - another extent
     * @return {Boolean}
     */
    intersects:function (ext2) {
        var rxmin = Math.max(this['xmin'], ext2['xmin']);
        var rymin = Math.max(this['ymin'], ext2['ymin']);
        var rxmax = Math.min(this['xmax'], ext2['xmax']);
        var rymax = Math.min(this['ymax'], ext2['ymax']);
        var intersects = !((rxmin > rxmax) || (rymin > rymax));
        return intersects;
    },

    /**
     * Whether the extent contains the input point.
     * @param  {maptalks.Coordinate|Number[]} coordinate - input point
     * @returns {Boolean}
     */
    contains: function (c) {
        return (c.x >= this.xmin) &&
            (c.x <= this.xmax) &&
            (c.y >= this.ymin) &&
            (c.y <= this.ymax);
    },

    /**
     * Get the width of the Extent
     * @return {Number}
     */
    getWidth:function () {
        return this['xmax'] - this['xmin'];
    },

    /**
     * Get the height of the Extent
     * @return {Number}
     */
    getHeight:function () {
        return this['ymax'] - this['ymin'];
    },


    __combine:function (extent) {
        if (extent instanceof maptalks.Point) {
            extent = {
                'xmin' : extent.x,
                'xmax' : extent.x,
                'ymin' : extent.y,
                'ymax' : extent.y
            };
        }
        var xmin = this['xmin'];
        if (!maptalks.Util.isNumber(xmin)) {
            xmin = extent['xmin'];
        } else if (maptalks.Util.isNumber(extent['xmin'])) {
            if (xmin > extent['xmin']) {
                xmin = extent['xmin'];
            }
        }

        var xmax = this['xmax'];
        if (!maptalks.Util.isNumber(xmax)) {
            xmax = extent['xmax'];
        } else if (maptalks.Util.isNumber(extent['xmax'])) {
            if (xmax < extent['xmax']) {
                xmax = extent['xmax'];
            }
        }

        var ymin = this['ymin'];
        if (!maptalks.Util.isNumber(ymin)) {
            ymin = extent['ymin'];
        } else if (maptalks.Util.isNumber(extent['ymin'])) {
            if (ymin > extent['ymin']) {
                ymin = extent['ymin'];
            }
        }

        var ymax = this['ymax'];
        if (!maptalks.Util.isNumber(ymax)) {
            ymax = extent['ymax'];
        } else if (maptalks.Util.isNumber(extent['ymax'])) {
            if (ymax < extent['ymax']) {
                ymax = extent['ymax'];
            }
        }
        return [xmin, ymin, xmax, ymax];
    },

    _combine:function (extent) {
        if (!extent) {
            return this;
        }
        var ext = this.__combine(extent);
        this['xmin'] = ext[0];
        this['ymin'] = ext[1];
        this['xmax'] = ext[2];
        this['ymax'] = ext[3];
        return this;
    },

    /**
     * Combine it with another extent to a larger extent.
     * @param  {maptalks.Extent} extent - another extent
     * @returns {maptalks.Extent} extent combined
     */
    combine:function (extent) {
        if (!extent) {
            return this;
        }
        var ext = this.__combine(extent);
        return new this.constructor(ext[0], ext[1], ext[2], ext[3]);
    },

    /**
     * Gets the intersection extent of this and another extent.
     * @param  {maptalks.Extent} extent - another extent
     * @return {maptalks.Extent} intersection extent
     */
    intersection:function (extent) {
        if (!this.intersects(extent)) {
            return null;
        }
        return new this.constructor(Math.max(this['xmin'], extent['xmin']), Math.max(this['ymin'], extent['ymin']),
            Math.min(this['xmax'], extent['xmax']), Math.min(this['ymax'], extent['ymax'])
            );
    },

    /**
     * Expand the extent by distance
     * @param  {maptalks.Size|Number} distance  - distance to expand
     * @returns {maptalks.Extent} a new extent expanded from
     */
    expand:function (distance) {
        if (distance instanceof maptalks.Size) {
            return new this.constructor(this['xmin'] - distance['width'], this['ymin'] - distance['height'], this['xmax'] + distance['width'], this['ymax'] + distance['height']);
        } else {
            return new this.constructor(this['xmin'] - distance, this['ymin'] - distance, this['xmax'] + distance, this['ymax'] + distance);
        }
    },

    _expand:function (distance) {
        if (distance instanceof maptalks.Size) {
            this['xmin'] -= distance['width'];
            this['ymin'] -= distance['height'];
            this['xmax'] += distance['width'];
            this['ymax'] += distance['height'];
        } else {
            this['xmin'] -= distance;
            this['ymin'] -= distance;
            this['xmax'] += distance;
            this['ymax'] += distance;
        }
        return this;
    },

    /**
     * Get extent's JSON object.
     * @return {Object} jsonObject
     * @example
     * // {xmin : 100, ymin: 10, xmax: 120, ymax:20}
     * var json = extent.toJSON();
     */
    toJSON:function () {
        return {
            'xmin':this['xmin'],
            'ymin':this['ymin'],
            'xmax':this['xmax'],
            'ymax':this['ymax']
        };
    },

    /**
     * Get a coordinate array of extent's rectangle area, containing 5 coordinates in which the first equals with the last.
     * @return {maptalks.Coordinate[]} coordinates array
     */
    toArray:function () {
        var xmin = this['xmin'],
            ymin = this['ymin'],
            xmax = this['xmax'],
            ymax = this['ymax'];
        return [
            new this._clazz([xmin, ymax]), new this._clazz([xmax, ymax]),
            new this._clazz([xmax, ymin]), new this._clazz([xmin, ymin]),
            new this._clazz([xmin, ymax])
        ];
    },

    /**
     * Get a copy of the extent.
     * @return {maptalks.Extent} copy
     */
    copy:function () {
        return new this.constructor(this['xmin'], this['ymin'], this['xmax'], this['ymax']);
    }
});

/**
 * Represent a bounding box on 2d surface , a rectangular area with minimum and maximum points. <br>
 * There are serveral ways to create a PointExtent:
 * @class
 * @category basic types
 * @param {Number} x1   - x of point 1
 * @param {Number} y1   - y of point 1
 * @param {Number} x2   - x of point 2
 * @param {Number} y2   - y of point 2
 * @extends {maptalks.Extent}
 * @example
 * //with 4 numbers
 * var extent = new maptalks.PointExtent(100, 10, 120, 20);
 * @example
 * //with 2 points
 * var extent = new maptalks.PointExtent(new maptalks.Point(100, 10), new maptalks.Point(120, 20));
 * @example
 * //with a json object containing xmin, ymin, xmax and ymax
 * var extent = new maptalks.PointExtent({xmin : 100, ymin: 10, xmax: 120, ymax:20});
 * @example
 * var extent1 = new maptalks.PointExtent(100, 10, 120, 20);
 * //with another extent
 * var extent2 = new maptalks.PointExtent(extent1);
 */
maptalks.PointExtent = function (p1, p2, p3, p4) {
    this._clazz = maptalks.Point;
    this._initialize(p1, p2, p3, p4);
};

maptalks.Util.extend(maptalks.PointExtent.prototype, maptalks.Extent.prototype, /** @lends maptalks.PointExtent.prototype */{
    /**
     * Get size of the PointExtent
     * @return {maptalks.Size}
     */
    getSize:function () {
        return new maptalks.Size(this.getWidth(), this.getHeight());
    }
});

/**
 * Transformation between projected coordinates and base 2d point system.
 * @class
 * @category geo
 * @protected
 * @classdesc
 * A core class used internally for mapping map's (usually geographical) coordinates to 2d points to view stuffs on a map.<br>
 * The base 2d point system is a fixed system that is consistent with HTML coordinate system: on X-Axis, left is smaller and right is larger; on Y-Axis, top is smaller and bottom is larger. <br>
 * As map's coordinates may not be in the same order(e.g. on a mercator projected earth, top is larger and bottom is smaller), <br>
 * transformation provides mapping functions to map arbitrary coordinates system to the fixed 2d point system. <br>
 * How to transform is decided by the constructor parameters which is a 4 number array [a, b, c, d]:<br>
 * a : the order scale of X-axis values 1 means right is larger and -1 means the reverse, left is larger;<br>
 * b : the order scale of Y-axis values 1 means bottom is larger and -1 means the reverse, top is larger;<br>
 * c : x of the origin point of the projected coordinate system <br>
 * d : y of the origin point of the projected coordinate system <br>
 * <br>
 * e.g.: Transformation parameters for Google map: [1, -1, -20037508.34, 20037508.34] <br>
 * <br>
 * Parameter scale in transform/untransform method is used to scale the result 2d points on map's different zoom levels.
 */
maptalks.Transformation = function (matrix) {
    this.matrix = matrix;
};

maptalks.Util.extend(maptalks.Transformation.prototype,  /** @lends maptalks.Transformation.prototype */{

    /**
     * Transform a projected coordinate to a 2d point.
     * @param  {Number[]|maptalks.Coordinate} coordinates - projected coordinate to transform
     * @param  {Number} scale                              - transform scale
     * @return {maptalks.Point} 2d point.
     */
    transform : function (coordinates, scale) {
        return new maptalks.Point(
            this.matrix[0] * (coordinates.x - this.matrix[2]) / scale,
            this.matrix[1] * (coordinates.y - this.matrix[3]) / scale
            );
    },

    /**
     * Transform a 2d point to a projected coordinate.
     * @param  {maptalks.Point} point   - 2d point
     * @param  {Number} scale           - transform scale
     * @return {maptalks.Coordinate}  projected coordinate.
     */
    untransform : function (point, scale) {
        return new maptalks.Coordinate(
            point.x * scale / this.matrix[0] + this.matrix[2],
            point.y * scale / this.matrix[1] + this.matrix[3]
            );
    }
});

/**
 * @namespace
 * @protected
 */
maptalks.measurer = {};

/**
 * Utilities with measurers.<br>
 * Measurer is a object containing methods for geographical computations such as length and area measuring, etc.
 * @class
 * @category geo
 * @protected
 */
maptalks.MeasurerUtil = {
    /**
     * Get a measurer instance.
     * @param  {String} name - code of the measurer: 'EPSG:4326', 'Identity', 'BAIDU'
     * @return {Object} a measurer object
     */
    getInstance:function (name) {
        if (!name) {
            return maptalks.MeasurerUtil.DEFAULT;
        }
        for (var p in maptalks.measurer) {
            if (maptalks.measurer.hasOwnProperty(p)) {
                var mName = maptalks.measurer[p]['measure'];
                if (!mName) {
                    continue;
                }
                if (name.toLowerCase() === mName.toLowerCase()) {
                    return maptalks.measurer[p];
                }
            }
        }
        return null;
    },

    /**
     * Whether the measurer is based on earth sphere
     * @param  {Object}  measurer
     * @return {Boolean}
     */
    isSphere: function (measurer) {
        return !maptalks.Util.isNil(measurer.sphere);
    },

    /**
     * The default measurer: WGS84Sphere
     * @type {Object}
     */
    DEFAULT: maptalks.measurer.WGS84Sphere
};

maptalks.measurer.Sphere = function (radius) {
    this.radius = radius;
};

maptalks.Util.extend(maptalks.measurer.Sphere.prototype, {
    rad: function (a) { return a * Math.PI / 180; },

    measureLength:function (c1, c2) {
        if (!c1 || !c2) { return 0; }
        var b = this.rad(c1.y), d = this.rad(c2.y), e = b - d, f = this.rad(c1.x) - this.rad(c2.x);
        b = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(e / 2), 2) + Math.cos(b) * Math.cos(d) * Math.pow(Math.sin(f / 2), 2))); b *= this.radius;
        return Math.round(b * 1E5) / 1E5;
    },
    measureArea:function (coordinates) {
        var a = this.radius * Math.PI / 180,
            b = 0,
            c = coordinates,
            d = c.length;
        if (d < 3) { return 0; }
        for (var i = 0; i < d - 1; i++) {
            var e = c[i],
                f = c[i + 1];
            b += e.x * a * Math.cos(e.y * Math.PI / 180) * f.y * a - f.x * a * Math.cos(f.y * Math.PI / 180) * e.y * a;
        }
        d = c[i];
        c = c[0];
        b += d.x * a * Math.cos(d.y * Math.PI / 180) * c.y * a - c.x * a * Math.cos(c.y * Math.PI / 180) * d.y * a;
        return 0.5 * Math.abs(b);
    },
    locate:function (c, xDist, yDist) {
        if (!c) { return null; }
        if (!xDist) { xDist = 0; }
        if (!yDist) { yDist = 0; }
        if (!xDist && !yDist) { return c; }
        var dx = Math.abs(xDist);
        var dy = Math.abs(yDist);
        var ry = this.rad(c.y);
        var rx = this.rad(c.x);
        var sy = Math.sin(dy / (2 * this.radius)) * 2;
        ry = ry + sy * (yDist > 0 ? 1 : -1);
        var sx = 2 * Math.sqrt(Math.pow(Math.sin(dx / (2 * this.radius)), 2) / Math.pow(Math.cos(ry), 2));
        rx = rx + sx * (xDist > 0 ? 1 : -1);
        return new maptalks.Coordinate(rx * 180 / Math.PI, ry * 180 / Math.PI);
    }
});

/**
 * WGS84 Sphere measurer.
 * @class
 * @category geo
 * @protected
 * @memberOf maptalks.measurer
 * @name WGS84Sphere
 */
maptalks.measurer.WGS84Sphere = {
    'measure' : 'EPSG:4326',
    sphere : new maptalks.measurer.Sphere(6378137),
    /**
     * Measure the length between 2 coordinates.
     * @param  {maptalks.Coordinate} c1
     * @param  {maptalks.Coordinate} c2
     * @return {Number}
     */
    measureLength: function () {
        return this.sphere.measureLength.apply(this.sphere, arguments);
    },
    /**
     * Measure the area closed by the given coordinates.
     * @param  {maptalks.Coordinate[]} coordinates
     * @return {number}
     */
    measureArea: function () {
        return this.sphere.measureArea.apply(this.sphere, arguments);
    },
    /**
     * Locate a coordinate from the given source coordinate with a x-axis distance and a y-axis distance.
     * @param  {maptalks.Coordinate} c     - source coordinate
     * @param  {Number} xDist              - x-axis distance
     * @param  {Number} yDist              - y-axis distance
     * @return {maptalks.Coordinate}
     */
    locate: function () {
        return this.sphere.locate.apply(this.sphere, arguments);
    }
};

/**
 * Baidu sphere measurer
 * @class
 * @category geo
 * @protected
 * @memberOf maptalks.measurer
 * @name BaiduSphere
 */
maptalks.measurer.BaiduSphere = {
    'measure' : 'BAIDU',
    sphere : new maptalks.measurer.Sphere(6370996.81),
    /**
     * Measure the length between 2 coordinates.
     * @param  {maptalks.Coordinate} c1
     * @param  {maptalks.Coordinate} c2
     * @return {Number}
     */
    measureLength: function () {
        return this.sphere.measureLength.apply(this.sphere, arguments);
    },
    /**
     * Measure the area closed by the given coordinates.
     * @param  {maptalks.Coordinate[]} coordinates
     * @return {number}
     */
    measureArea: function () {
        return this.sphere.measureArea.apply(this.sphere, arguments);
    },
    /**
     * Locate a coordinate from the given source coordinate with a x-axis distance and a y-axis distance.
     * @param  {maptalks.Coordinate} c     - source coordinate
     * @param  {Number} xDist              - x-axis distance
     * @param  {Number} yDist              - y-axis distance
     * @return {maptalks.Coordinate}
     */
    locate: function () {
        return this.sphere.locate.apply(this.sphere, arguments);
    }
};

/**
 * Identity measurer, a measurer for Cartesian coordinate system.
 *
 * @class
 * @category geo
 * @protected
 * @memberOf maptalks.measurer
 * @name Identity
 */
maptalks.measurer.Identity = {
    /**
     * the code of the measurer, used by [MeasurerUtil]{@link maptalks.MeasurerUtil} to as its key get measurer instance.
     * @static
     * @type {String}
     */
    'measure' : 'IDENTITY',
    /**
     * Measure the length between 2 coordinates.
     * @param  {maptalks.Coordinate} c1
     * @param  {maptalks.Coordinate} c2
     * @return {Number}
     * @static
     */
    measureLength:function (c1, c2) {
        if (!c1 || !c2) { return 0; }
        try {
            return Math.sqrt(Math.pow(c1.x - c2.x, 2) + Math.pow(c1.y - c2.y, 2));
        } catch (err) {
            return 0;
        }
    },
    /**
     * Measure the area closed by the given coordinates.
     * @param  {maptalks.Coordinate[]} coordinates
     * @return {number}
     * @static
     */
    measureArea:function (coordinates) {
        if (!maptalks.Util.isArrayHasData(coordinates)) {
            return 0;
        }
        var area = 0;
        for (var i = 0, len = coordinates.length; i < len; i++) {
            var c1 = coordinates[i];
            var c2 = null;
            if (i === len - 1) {
                c2 = coordinates[0];
            } else {
                c2 = coordinates[i + 1];
            }
            area += c1.x * c2.y - c1.y * c2.x;
        }
        return Math.abs(area / 2);
    },

    /**
     * Locate a coordinate from the given source coordinate with a x-axis distance and a y-axis distance.
     * @param  {maptalks.Coordinate} c     - source coordinate
     * @param  {Number} xDist              - x-axis distance
     * @param  {Number} yDist              - y-axis distance
     * @return {maptalks.Coordinate}
     * @static
     */
    locate:function (c, xDist, yDist) {
        if (!c) { return null; }
        if (!xDist) { xDist = 0; }
        if (!yDist) { yDist = 0; }
        if (!xDist && !yDist) { return c; }
        return new maptalks.Coordinate(c.x + xDist, c.y + yDist);
    }
};

/**
 * @namespace
 */
maptalks.projection = {};

/**
 * Common Methods of Projections.
 * @mixin
 * @protected
 * @memberOf maptalks.projection
 * @name Common
 */
maptalks.projection.Common = {
    /**
     * Project a geographical coordinate to a projected coordinate (2d coordinate)
     * @param  {maptalks.Coordinate} p - coordinate to project
     * @return {maptalks.Coordinate}
     * @static
     */
    project:function () {},
    /**
     * Unproject a projected coordinate to a geographical coordinate (2d coordinate)
     * @param  {maptalks.Coordinate} p - coordinate to project
     * @return {maptalks.Coordinate}
     * @static
     */
    unproject:function () {},
    /**
     * Project a group of geographical coordinates to projected coordinates.
     * @param  {maptalks.Coordinate[]|maptalks.Coordinate[][]|maptalks.Coordinate[][][]} coordinates - coordinates to project
     * @return {maptalks.Coordinate[]|maptalks.Coordinate[][]|maptalks.Coordinate[][][]}
     * @static
     */
    projectCoords:function (coordinates) {
        return maptalks.Util.mapArrayRecursively(coordinates, this.project, this);
    },

    /**
     * Unproject a group of projected coordinates to geographical coordinates.
     * @param  {maptalks.Coordinate[]|maptalks.Coordinate[][]|maptalks.Coordinate[][][]} projCoords - projected coordinates to unproject
     * @return {maptalks.Coordinate[]|maptalks.Coordinate[][]|maptalks.Coordinate[][][]}
     * @static
     */
    unprojectCoords:function (projCoords) {
        return maptalks.Util.mapArrayRecursively(projCoords, this.unproject, this);
    }
};

/**
 * Well-known projection used by Google maps or Open Street Maps, aka Mercator Projection.<br>
 * It is map's default projection.
 * @class
 * @category geo
 * @protected
 * @memberOf maptalks.projection
 * @name EPSG3857
 * @mixes maptalks.projection.Common
 * @mixes maptalks.measurer.WGS84Sphere
 */
maptalks.projection.EPSG3857 = maptalks.Util.extend({}, maptalks.projection.Common, /** @lends maptalks.projection.EPSG3857 */{
    /**
     * "EPSG:3857", Code of the projection, used by [View]{@link maptalks.View} to get projection instance.
     * @type {String}
     * @constant
     */
    code : 'EPSG:3857',
    rad : Math.PI / 180,
    metersPerDegree : 2.003750834E7 / 180,
    maxLatitude : 85.0511287798,

    project: function (lnglat) {
        var rad = this.rad,
            metersPerDegree = this.metersPerDegree,
            max = this.maxLatitude;
        var lng = lnglat.x, lat = Math.max(Math.min(max, lnglat.y), -max);
        var c;
        if (lat === 0) {
            c = 0;
        } else {
            c = Math.log(Math.tan((90 + lat) * rad / 2)) / rad;
        }
        return new maptalks.Coordinate(lng * metersPerDegree, c * metersPerDegree);
    },

    unproject: function (pLnglat) {
        var x = pLnglat.x,
            y = pLnglat.y;
        var rad = this.rad,
            metersPerDegree = this.metersPerDegree;
        var c;
        if (y === 0) {
            c = 0;
        } else {
            c = y / metersPerDegree;
            c = (2 * Math.atan(Math.exp(c * rad)) - Math.PI / 2) / rad;
        }
        return new maptalks.Coordinate(x / metersPerDegree, c);
    }
}, maptalks.measurer.WGS84Sphere);

maptalks.projection.DEFAULT = maptalks.projection.EPSG3857;

/**
 * A common CRS among GIS enthusiasts. Uses simple Equirectangular projection.
 *
 * @class
 * @category geo
 * @protected
 * @memberOf maptalks.projection
 * @name EPSG4326
 * @mixes maptalks.projection.Common
 * @mixes maptalks.measurer.WGS84Sphere
 */
maptalks.projection.EPSG4326 = maptalks.Util.extend({}, maptalks.projection.Common, /** @lends maptalks.projection.EPSG4326 */{
    /**
     * "EPSG:4326", Code of the projection, used by [View]{@link maptalks.View} to get projection instance.
     * @type {String}
     * @constant
     */
    code : 'EPSG:4326',
    project:function (p) {
        return new maptalks.Coordinate(p);
    },
    unproject:function (p) {
        return new maptalks.Coordinate(p);
    }
}, maptalks.measurer.WGS84Sphere);

/**
 * Projection used by [Baidu Map]{@link http://map.baidu.com}
 * @class
 * @category geo
 * @protected
 * @memberOf maptalks.projection
 * @name BAIDU
 * @mixes maptalks.projection.Common
 * @mixes maptalks.measurer.BaiduSphere
 */
maptalks.projection.BAIDU = maptalks.Util.extend({}, maptalks.projection.Common, /** @lends maptalks.projection.BAIDU */{
    /**
     * "BAIDU", Code of the projection, used by [View]{@link maptalks.View} to get projection instance.
     * @type {String}
     * @constant
     */
    code : 'BAIDU',

    project:function (p) {
        return this.convertLL2MC(p);
    },

    unproject:function (p) {
        return this.convertMC2LL(p);
    }
}, maptalks.measurer.BaiduSphere, {
    EARTHRADIUS: 6370996.81,
    MCBAND: [12890594.86, 8362377.87, 5591021, 3481989.83, 1678043.12, 0],
    LLBAND: [75, 60, 45, 30, 15, 0],
    MC2LL: [[1.410526172116255e-8, 0.00000898305509648872, -1.9939833816331, 200.9824383106796, -187.2403703815547, 91.6087516669843, -23.38765649603339, 2.57121317296198, -0.03801003308653, 17337981.2], [-7.435856389565537e-9, 0.000008983055097726239, -0.78625201886289, 96.32687599759846, -1.85204757529826, -59.36935905485877, 47.40033549296737, -16.50741931063887, 2.28786674699375, 10260144.86], [-3.030883460898826e-8, 0.00000898305509983578, 0.30071316287616, 59.74293618442277, 7.357984074871, -25.38371002664745, 13.45380521110908, -3.29883767235584, 0.32710905363475, 6856817.37], [-1.981981304930552e-8, 0.000008983055099779535, 0.03278182852591, 40.31678527705744, 0.65659298677277, -4.44255534477492, 0.85341911805263, 0.12923347998204, -0.04625736007561, 4482777.06], [3.09191371068437e-9, 0.000008983055096812155, 0.00006995724062, 23.10934304144901, -0.00023663490511, -0.6321817810242, -0.00663494467273, 0.03430082397953, -0.00466043876332, 2555164.4], [2.890871144776878e-9, 0.000008983055095805407, -3.068298e-8, 7.47137025468032, -0.00000353937994, -0.02145144861037, -0.00001234426596, 0.00010322952773, -0.00000323890364, 826088.5]],
    LL2MC: [[-0.0015702102444, 111320.7020616939, 1704480524535203, -10338987376042340, 26112667856603880, -35149669176653700, 26595700718403920, -10725012454188240, 1800819912950474, 82.5], [0.0008277824516172526, 111320.7020463578, 647795574.6671607, -4082003173.641316, 10774905663.51142, -15171875531.51559, 12053065338.62167, -5124939663.577472, 913311935.9512032, 67.5], [0.00337398766765, 111320.7020202162, 4481351.045890365, -23393751.19931662, 79682215.47186455, -115964993.2797253, 97236711.15602145, -43661946.33752821, 8477230.501135234, 52.5], [0.00220636496208, 111320.7020209128, 51751.86112841131, 3796837.749470245, 992013.7397791013, -1221952.21711287, 1340652.697009075, -620943.6990984312, 144416.9293806241, 37.5], [-0.0003441963504368392, 111320.7020576856, 278.2353980772752, 2485758.690035394, 6070.750963243378, 54821.18345352118, 9540.606633304236, -2710.55326746645, 1405.483844121726, 22.5], [-0.0003218135878613132, 111320.7020701615, 0.00369383431289, 823725.6402795718, 0.46104986909093, 2351.343141331292, 1.58060784298199, 8.77738589078284, 0.37238884252424, 7.45]],

    convertMC2LL: function (cB) {
        var cC, cE;
        cC = {x:Math.abs(cB.x), y:Math.abs(cB.y)};
        for (var cD = 0, len = this.MCBAND.length; cD < len; cD++) {
            if (cC.y >= this.MCBAND[cD]) {
                cE = this.MC2LL[cD];
                break;
            }
        }
        var T = this.convertor(cB, cE);
        var result = new maptalks.Coordinate(T.x.toFixed(6), T.y.toFixed(6));
        return result;
    },
    convertLL2MC: function (T) {
        var cB, cD, cC, len;
        T.x = this.getLoop(T.x, -180, 180);
        T.y = this.getRange(T.y, -74, 74);
        cB = new maptalks.Coordinate(T.x, T.y);
        for (cC = 0, len = this.LLBAND.length; cC < len; cC++) {
            if (cB.y >= this.LLBAND[cC]) {
                cD = this.LL2MC[cC];
                break;
            }
        }
        if (!cD) {
            for (cC = this.LLBAND.length - 1; cC >= 0; cC--) {
                if (cB.y <= -this.LLBAND[cC]) {
                    cD = this.LL2MC[cC];
                    break;
                }
            }
        }
        var cE = this.convertor(T, cD);
        var result = new maptalks.Coordinate(cE.x.toFixed(2), cE.y.toFixed(2));
        return result;
    },
    convertor: function (cC, cD) {
        if (!cC || !cD) {
            return null;
        }
        var T = cD[0] + cD[1] * Math.abs(cC.x);
        var cB = Math.abs(cC.y) / cD[9];
        var cE = cD[2] + cD[3] * cB + cD[4] * cB * cB +
                cD[5] * cB * cB * cB + cD[6] * cB * cB * cB * cB +
                cD[7] * cB * cB * cB * cB * cB +
                cD[8] * cB * cB * cB * cB * cB * cB;
        T *= (cC.x < 0 ? -1 : 1);
        cE *= (cC.y < 0 ? -1 : 1);
        return new maptalks.Coordinate(T, cE);
    },
    toRadians: function (T) {
        return Math.PI * T / 180;
    },
    toDegrees: function (T) {
        return (180 * T) / Math.PI;
    },
    getRange: function (cC, cB, T) {
        if (cB != null) {
            cC = Math.max(cC, cB);
        }
        if (T != null) {
            cC = Math.min(cC, T);
        }
        return cC;
    },
    getLoop: function (cC, cB, T) {
        while (cC > T) {
            cC -= T - cB;
        }
        while (cC < cB) {
            cC += T - cB;
        }
        return cC;
    }
});

/**
 * A projection based on Cartesian coordinate system.<br>
 * This projection maps x, y directly, it is useful for maps of flat surfaces (e.g. indoor maps, game maps).
 * @class
 * @category geo
 * @protected
 * @memberOf maptalks.projection
 * @name IDENTITY
 * @mixes maptalks.projection.Common
 * @mixes maptalks.measurer.Identity
 */
maptalks.projection.IDENTITY = maptalks.Util.extend({}, maptalks.projection.Common, /** @lends maptalks.projection.IDENTITY */{
    /**
     * "IDENTITY", Code of the projection, used by [View]{@link maptalks.View} to get projection instance.
     * @type {String}
     * @constant
     */
    code : 'IDENTITY',
    project:function (p) {
        return p.copy();
    },
    unproject:function (p) {
        return p.copy();
    }
}, maptalks.measurer.Identity);

/**
 * Utilities for geo
 * @class
 * @protected
 */
maptalks.GeoUtil = {
    /**
     * caculate the distance from a point to a segment.
     * @param {maptalks.Point} p
     * @param {maptalks.Point} p1
     * @param {maptalks.Point} p2
     */
    distanceToSegment: function (p, p1, p2) {
        var x = p.x,
            y = p.y,
            x1 = p1.x,
            y1 = p1.y,
            x2 = p2.x,
            y2 = p2.y;

        var cross = (x2 - x1) * (x - x1) + (y2 - y1) * (y - y1);
        if (cross <= 0) {
            // P->P1
            return Math.sqrt((x - x1) * (x - x1) + (y - y1) * (y - y1));
        }
        var d2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
        if (cross >= d2) {
            // P->P2
            return Math.sqrt((x - x2) * (x - x2) + (y - y2) * (y - y2));
        }
        var r = cross / d2;
        var px = x1 + (x2 - x1) * r;
        var py = y1 + (y2 - y1) * r;
        // P->P(px,py)
        return Math.sqrt((x - px) * (x - px) + (y - py) * (y - py));
    },

    /**
     * 判断点坐标是否在面中
     * @param {maptalks.Polygon} 面对象
     * @param {maptalks.Coordinate} 点对象
     * @return {Boolean} true：点在面中
     */
    pointInsidePolygon: function (p, points) {
        var i, j, p1, p2,
            len = points.length;
        var c = false;

        for (i = 0, j = len - 1; i < len; j = i++) {
            p1 = points[i];
            p2 = points[j];
            if (((p1.y > p.y) !== (p2.y > p.y)) &&
                (p.x < (p2.x - p1.x) * (p.y - p1.y) / (p2.y - p1.y) + p1.x)) {
                c = !c;
            }
        }

        return c;
    },

    _computeLength:function (coordinates, measurer) {
        var result = 0;
        for (var i = 0, len = coordinates.length; i < len - 1; i++) {
            result += measurer.measureLength(coordinates[i], coordinates[i + 1]);
        }
        return result;
    },

    _computeArea:function (coordinates, measurer) {
        return measurer.measureArea(coordinates);
    }
};

/**
 * A high-performance JavaScript polyline simplification library by Vladimir Agafonkin
 * @class
 * @protected
 * @author mourner
 * @link https://github.com/mourner/simplify-js
 */
maptalks.Simplify = {
	// square distance between 2 points
    getSqDist:function (p1, p2) {

        var dx = p1.x - p2.x,
            dy = p1.y - p2.y;

        return dx * dx + dy * dy;
    },

    // square distance from a point to a segment
    getSqSegDist:function (p, p1, p2) {

        var x = p1.x,
            y = p1.y,
            dx = p2.x - x,
            dy = p2.y - y;

        if (dx !== 0 || dy !== 0) {

            var t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);

            if (t > 1) {
                x = p2.x;
                y = p2.y;

            } else if (t > 0) {
                x += dx * t;
                y += dy * t;
            }
        }
        dx = p.x - x;
        dy = p.y - y;

        return dx * dx + dy * dy;
    },
    // rest of the code doesn't care about point format

    // basic distance-based simplification
    simplifyRadialDist:function (points, sqTolerance) {

        var prevPoint = points[0],
            newPoints = [prevPoint],
            point;

        for (var i = 1, len = points.length; i < len; i++) {
            point = points[i];

            if (this.getSqDist(point, prevPoint) > sqTolerance) {
                newPoints.push(point);
                prevPoint = point;
            }
        }

        if (prevPoint !== point) newPoints.push(point);

        return newPoints;
    },

    simplifyDPStep:function (points, first, last, sqTolerance, simplified) {
        var maxSqDist = sqTolerance,
            index;

        for (var i = first + 1; i < last; i++) {
            var sqDist = this.getSqSegDist(points[i], points[first], points[last]);

            if (sqDist > maxSqDist) {
                index = i;
                maxSqDist = sqDist;
            }
        }

        if (maxSqDist > sqTolerance) {
            if (index - first > 1) this.simplifyDPStep(points, first, index, sqTolerance, simplified);
            simplified.push(points[index]);
            if (last - index > 1) this.simplifyDPStep(points, index, last, sqTolerance, simplified);
        }
    },

    // simplification using Ramer-Douglas-Peucker algorithm
    simplifyDouglasPeucker:function (points, sqTolerance) {
        var last = points.length - 1;

        var simplified = [points[0]];
        this.simplifyDPStep(points, 0, last, sqTolerance, simplified);
        simplified.push(points[last]);

        return simplified;
    },

    // both algorithms combined for awesome performance
    simplify:function (points, tolerance, highestQuality) {

        if (points.length <= 2) return points;

        var sqTolerance = tolerance !== undefined ? tolerance * tolerance : 1;

        points = highestQuality ? points : this.simplifyRadialDist(points, sqTolerance);
        points = this.simplifyDouglasPeucker(points, sqTolerance);

        return points;
    }
};

/**
 * Base class for all the interaction handlers
 * @class
 * @category handler
 * @extends maptalks.Class
 * @mixins maptalks.Eventable
 * @abstract
 * @protected
 */
maptalks.Handler = maptalks.Class.extend(/** @lends maptalks.Handler.prototype */{
    includes: maptalks.Eventable,

    initialize: function (target) {
        this.target = target;
    },

    /**
     * Enables the handler
     * @return {maptalks.Handler} this
     */
    enable: function () {
        if (this._enabled) { return this; }
        this._enabled = true;
        this.addHooks();
        return this;
    },

    /**
     * Disablesthe handler
     * @return {maptalks.Handler} this
     */
    disable: function () {
        if (!this._enabled) { return this; }
        this._enabled = false;
        this.removeHooks();
        return this;
    },

    /**
     * Returns true if the handler is enabled.
     * @return {Boolean}
     */
    enabled: function () {
        return !!this._enabled;
    },

    remove: function () {
        this.disable();
        delete this.target;
        delete this.dom;
    }
});

/**
 * A mixin, to enable a class with [interaction handlers]{@link maptalks.Handler}
 * @protected
 * @mixin
 */
maptalks.Handlerable = {
    /**
     * Register a handler
     * @param {String} name       - name of the handler
     * @param {maptalks.Handler}  - handler class
     * @return {*} this
     * @protected
     */
    addHandler: function (name, handlerClass) {
        if (!handlerClass) { return this; }
        if (!this._handlers) {
            this._handlers = [];
        }
        //handler已经存在
        if (this[name]) {
            this[name].enable();
            return this;
        }

        var handler = this[name] = new handlerClass(this);

        this._handlers.push(handler);

        if (this.options[name]) {
            handler.enable();
        }
        return this;
    },

    /**
     * Removes a handler
     * @param {String} name       - name of the handler
     * @return {*} this
     * @protected
     */
    removeHandler: function (name) {
        if (!name) { return this; }
        var handler = this[name];
        if (handler) {
            //handler registered
            var hit = maptalks.Util.indexOfArray(handler, this._handlers);
            if (hit >= 0) {
                this._handlers.splice(hit, 1);
            }
            this[name].remove();
            delete this[name];
        }
        return this;
    },

    _clearHandlers: function () {
        for (var i = 0, len = this._handlers.length; i < len; i++) {
            this._handlers[i].remove();
        }
        this._handlers = [];
    }
};

/**
 * Drag handler
 * @class
 * @category handler
 * @protected
 * @extends maptalks.Handler
 */
maptalks.Handler.Drag = maptalks.Handler.extend(/** @lends maptalks.Handler.Drag.prototype */{

    START: maptalks.Browser.touch ? ['touchstart', 'mousedown'] : ['mousedown'],
    END: {
        mousedown: 'mouseup',
        touchstart: 'touchend',
        pointerdown: 'touchend',
        MSPointerDown: 'touchend'
    },
    MOVE: {
        mousedown: 'mousemove',
        touchstart: 'touchmove',
        pointerdown: 'touchmove',
        MSPointerDown: 'touchmove'
    },

    initialize:function (dom, options) {
        this.dom = dom;
        this.options = options;
    },

    enable:function () {
        if (!this.dom) { return; }
        maptalks.DomUtil.on(this.dom, this.START.join(' '), this.onMouseDown, this);
    },


    disable:function () {
        if (!this.dom) { return; }
        maptalks.DomUtil.off(this.dom, this.START.join(' '), this.onMouseDown);
    },

    onMouseDown:function (event) {
        if (maptalks.Util.isNumber(event.button) && event.button === 2) {
            //不响应右键事件
            return;
        }
        if (this.options && this.options['cancelOn'] && this.options['cancelOn'](event) === true) {
            return;
        }
        var dom = this.dom;
        if (dom.setCapture) {
            dom.setCapture();
        } else if (window.captureEvents) {
            window.captureEvents(window['Event'].MOUSEMOVE | window['Event'].MOUSEUP);
        }
        dom['ondragstart'] = function () { return false; };
        this.moved = false;
        var actual = event.touches ? event.touches[0] : event;
        this.startPos = new maptalks.Point(actual.clientX, actual.clientY);
        //2015-10-26 fuzhen 改为document, 解决鼠标移出地图容器后的不可控现象
        maptalks.DomUtil.on(document, this.MOVE[event.type], this.onMouseMove, this)
            .on(document, this.END[event.type], this.onMouseUp, this);
        this.fire('mousedown', {
            'domEvent' : event,
            'mousePos': new maptalks.Point(actual.clientX, actual.clientY)
        });
    },

    onMouseMove:function (event) {
        if (event.touches && event.touches.length > 1) {
            return;
        }
        var actual = event.touches ? event.touches[0] : event;

        var newPos = new maptalks.Point(actual.clientX, actual.clientY),
            offset = newPos.substract(this.startPos);
        if (!offset.x && !offset.y) {
            return;
        }
        if (!this.moved) {
            /**
             * 触发dragstart事件
             * @event dragstart
             * @return {Object} mousePos: {'left': 0px, 'top': 0px}
             */
            this.fire('dragstart', {
                'domEvent' : event,
                'mousePos':this.startPos.copy()
            });
            this.moved = true;
        } else {
             /**
             * 触发dragging事件
             * @event dragging
             * @return {Object} mousePos: {'left': 0px, 'top': 0px}
             */
            this.fire('dragging', {
                'domEvent' : event,
                'mousePos': new maptalks.Point(actual.clientX, actual.clientY)
            });
        }
    },

    onMouseUp:function (event) {
        var dom = this.dom;
        var actual = event.changedTouches ? event.changedTouches[0] : event;
        for (var i in this.MOVE) {
            maptalks.DomUtil
                .off(document, this.MOVE[i], this.onMouseMove, this)
                .off(document, this.END[i], this.onMouseUp, this);
        }
        if (dom['releaseCapture']) {
            dom['releaseCapture']();
        } else if (window.captureEvents) {
            window.captureEvents(window['Event'].MOUSEMOVE | window['Event'].MOUSEUP);
        }
        var param = {
            'domEvent' : event
        };
        if (maptalks.Util.isNumber(actual.clientX)) {
            param['mousePos'] = new maptalks.Point(parseInt(actual.clientX, 0), parseInt(actual.clientY, 0));
        }
        if (this.moved/* && this.moving*/) {
            /**
             * 触发dragend事件
             * @event dragend
             * @return {Object} mousePos: {'left': 0px, 'top': 0px}
             */
            this.fire('dragend', param);
        }

        this.fire('mouseup', param);
    }
});

/**
 * @classdesc
 * <pre>
 * The parent class for all the map tools.
 * It is abstract and not intended to be instantiated.
 * Some interface methods to implement:
 * 1. onAdd: optional, a callback method to do some prepares before enabled when the map tool is added to a map
 * 2. onEnable: optional, called when the map tool is enabled, used to setup the context such as adding more event listeners other than the map, disabling map's default handlers (draggable, scrollWheelZoom, etc) and creating temporary layers.
 * 3. getEvents: required, provide an event map to register event listeners on the map.
 * 4. onDisable: optional, called when the map tool is disabled, used to cleanup such as unregistering event listeners, enable map's original handlers and remove temporary layers.
 * </pre>
 * @class
 * @abstract
 * @category maptool
 * @extends maptalks.Class
 * @mixins maptalks.Eventable
 */
maptalks.MapTool = maptalks.Class.extend(/** @lends maptalks.MapTool.prototype */{
    includes: [maptalks.Eventable],

    /**
     * Adds the map tool to a map.
     * @param {maptalks.Map} map
     * @return {maptalks.MapTool} this
     * @fires maptalks.MapTool#add
     */
    addTo: function (map) {
        if (!map) {
            return this;
        }
        this._map = map;
        var key = '_tool' + this.name;
        if (map[key]) {
            map[key].disable();
        }
        if (this.onAdd) {
            this.onAdd();
        }
        this.enable();
        map[key] = this;

        /**
         * add event.
         *
         * @event maptalks.MapTool#add
         * @type {Object}
         * @property {String} type - add
         * @property {maptalks.MapTool} target - map tool
         */
        this._fireEvent('add');
        return this;
    },

    /**
     * Gets the map it added to.
     * @return {maptalks.Map} map
     */
    getMap:function () {
        return this._map;
    },

    /**
     * Enable the map tool.
     * @return {maptalks.MapTool} this
     * @fires maptalks.MapTool#enable
     */
    enable:function () {
        var map = this._map;
        if (!map || this._enabled) { return this; }
        this._enabled = true;
        this._switchEvents('off');

        this._registerEvents();
        if (this.onEnable) {
            this.onEnable();
        }
        /**
         * enable event.
         *
         * @event maptalks.MapTool#enable
         * @type {Object}
         * @property {String} type - enable
         * @property {maptalks.MapTool} target - map tool
         */
        this._fireEvent('enable');
        return this;
    },

    /**
     * Disable the map tool
     * @return {maptalks.MapTool} this
     * @fires maptalks.MapTool#disable
     */
    disable:function () {
        if (!this._enabled || !this._map) {
            return this;
        }
        this._enabled = false;
        this._switchEvents('off');
        if (this.onDisable) {
            this.onDisable();
        }
        /**
         * disable event.
         *
         * @event maptalks.MapTool#disable
         * @type {Object}
         * @property {String} type - disable
         * @property {maptalks.MapTool} target - map tool
         */
        this._fireEvent('disable');
        return this;
    },

    /**
     * Returns whether the tool is enabled
     * @return {Boolean} true | false
     */
    isEnabled: function () {
        if (!this._enabled) {
            return false;
        }
        return true;
    },

    _registerEvents: function () {
        this._switchEvents('on');
    },

    _switchEvents: function (to) {
        var events = this.getEvents();
        if (events) {
            this._map[to](events, this);
        }
    },

    _fireEvent:function (eventName, param) {
        if (!param) {
            param = {};
        }
        this.fire(eventName, param);
    }
});

/**
 * @classdesc
 * A map tool to help draw geometries
 * @class
 * @category maptool
 * @extends maptalks.MapTool
 * @mixins maptalks.Eventable
 * @param {Object} [options=null] - construct options
 * @param {String} [options.mode=null]   - mode of the draw tool: Point, LineString, Polygon, Circle, Ellipse, Rectangle
 * @param {Object} [options.symbol=null] - symbol of the geometries drawn
 * @param {Boolean} [options.once=null]  - whether disable immediately once drawn a geometry.
 * @example
 * var drawTool = new maptalks.DrawTool({
 *     mode : 'Polygon',
 *     symbol : {
 *         'lineColor' : '#000',
 *         'lineWidth' : 5
 *     },
 *     once : true
 * }).addTo(map);
 */
maptalks.DrawTool = maptalks.MapTool.extend(/** @lends maptalks.DrawTool.prototype */{

    /**
     * @property {Object} [options=null] - construct options
     * @property {String} [options.mode=null]   - mode of the draw tool: Point, LineString, Polygon, Circle, Ellipse, Rectangle
     * @property {Object} [options.symbol=null] - symbol of the geometries drawn
     * @property {Boolean} [options.once=null]  - whether disable immediately once drawn a geometry.
     */
    options:{
        'symbol' : {
            'lineColor':'#000',
            'lineWidth':2,
            'lineOpacity':1,
            'polygonFill' : '#fff',
            'polygonOpacity' : 0.3
        },
        'mode' : null,
        'once' : false
    },

    initialize: function (options) {
        maptalks.Util.setOptions(this, options);
        this._checkMode();
    },

    /**
     * Get current mode of draw tool
     * @return {String} mode
     */
    getMode: function () {
        if (this.options['mode']) {
            return this.options['mode'].toLowerCase();
        }
        return null;
    },

    /**
     * Set mode of the draw tool
     * @param {String} mode - mode of the draw tool: Point, LineString, Polygon, Circle, Ellipse, Rectangle
     * @expose
     */
    setMode:function (mode) {
        if (this._geometry) {
            this._geometry.remove();
            delete this._geometry;
        }
        this._clearStage();
        this._switchEvents('off');
        this.options['mode'] = mode;
        this._checkMode();
        if (this.isEnabled()) {
            this._switchEvents('on');
        }
        return this;
    },

    /**
     * Get symbol of the draw tool
     * @return {Object} symbol
     */
    getSymbol:function () {
        var symbol = this.options['symbol'];
        if (symbol) {
            return maptalks.Util.extendSymbol(symbol);
        } else {
            return maptalks.Util.extendSymbol(this.options['symbol']);
        }
    },

    /**
     * Set draw tool's symbol
     * @param {Object} symbol - symbol set
     * @returns {maptalks.DrawTool} this
     */
    setSymbol:function (symbol) {
        if (!symbol) {
            return this;
        }
        this.options['symbol'] = symbol;
        if (this._geometry) {
            this._geometry.setSymbol(symbol);
        }
        return this;
    },

    onAdd: function () {
        this._checkMode();
    },

    onEnable:function () {
        var map = this.getMap();
        this._mapDraggable = map.options['draggable'];
        this._mapDoubleClickZoom = map.options['doubleClickZoom'];
        this._autoBorderPanning = map.options['autoBorderPanning'];
        map.config({
            'autoBorderPanning' : true,
            'draggable': false,
            'doubleClickZoom':false
        });
        this._drawToolLayer = this._getDrawLayer();
        this._clearStage();
        this._loadResources();
        return this;
    },

    _checkMode: function () {
        this._getRegisterMode();
    },

    onDisable:function () {
        var map = this.getMap();
        map.config({
            'autoBorderPanning' : this._autoBorderPanning,
            'draggable': this._mapDraggable,
            'doubleClickZoom' : this._mapDoubleClickZoom
        });
        delete this._autoBorderPanning;
        delete this._mapDraggable;
        delete this._mapDoubleClickZoom;
        this._endDraw();
        map.removeLayer(this._getDrawLayer());
        return this;
    },


    _loadResources:function () {
        var symbol = this.getSymbol();
        var resources = maptalks.Util.getExternalResources(symbol);
        if (maptalks.Util.isArrayHasData(resources)) {
            //load external resources at first
            this._drawToolLayer._getRenderer().loadResources(resources);
        }
    },

    _getProjection:function () {
        return this._map.getProjection();
    },

    _getRegisterMode: function () {
        var mode = this.getMode();
        var registerMode = maptalks.DrawTool.getRegisterMode(mode);
        if (!registerMode) {
            throw new Error(mode + ' is not a valid mode of maptalks.DrawTool.');
        }
        return registerMode;
    },

    getEvents: function () {
        var action = this._getRegisterMode()['action'];
        if (action === 'clickDblclick') {
            return {
                'click' : this._clickForPath,
                'mousemove' : this._mousemoveForPath,
                'dblclick'  : this._dblclickForPath
            };
        } else if (action === 'click') {
            return {
                'click' : this._clickForPoint
            };
        } else if (action === 'drag') {
            return {
                'mousedown' : this._mousedownToDraw
            };
        }
        return null;
    },

    _addGeometryToStage:function (geometry) {
        var drawLayer = this._getDrawLayer();
        drawLayer.addGeometry(geometry);
    },

    _clickForPoint: function (param) {
        var registerMode = this._getRegisterMode();
        this._geometry = registerMode['create'](param['coordinate']);
        if (this.options['symbol'] && this.options.hasOwnProperty('symbol')) {
            this._geometry.setSymbol(this.options['symbol']);
        }
        this._endDraw();
    },

    _clickForPath:function (param) {
        var registerMode = this._getRegisterMode();
        var coordinate = param['coordinate'];
        var symbol = this.getSymbol();
        if (!this._geometry) {
            this._clickCoords = [coordinate];
            this._geometry = registerMode['create'](this._clickCoords);
            if (symbol) {
                this._geometry.setSymbol(symbol);
            }
            this._addGeometryToStage(this._geometry);
            /**
             * drawstart event.
             *
             * @event maptalks.DrawTool#drawstart
             * @type {Object}
             * @property {String} type - drawstart
             * @property {maptalks.DrawTool} target - draw tool
             * @property {maptalks.Coordinate} coordinate - coordinate of the event
             * @property {maptalks.Point} containerPoint  - container point of the event
             * @property {maptalks.Point} viewPoint       - view point of the event
             * @property {Event} domEvent                 - dom event
             */
            this._fireEvent('drawstart', param);
        } else {
            this._clickCoords.push(coordinate);
            registerMode['update'](this._clickCoords, this._geometry);
            /**
             * drawvertex event.
             *
             * @event maptalks.DrawTool#drawvertex
             * @type {Object}
             * @property {String} type - drawvertex
             * @property {maptalks.DrawTool} target - draw tool
             * @property {maptalks.Geometry} geometry - geometry drawn
             * @property {maptalks.Coordinate} coordinate - coordinate of the event
             * @property {maptalks.Point} containerPoint  - container point of the event
             * @property {maptalks.Point} viewPoint       - view point of the event
             * @property {Event} domEvent                 - dom event
             */
            this._fireEvent('drawvertex', param);

        }
    },

    _mousemoveForPath : function (param) {
        if (!this._geometry) { return; }
        var containerPoint = this._getMouseContainerPoint(param);
        if (!this._isValidContainerPoint(containerPoint)) { return; }
        var coordinate = param['coordinate'];
        var registerMode = this._getRegisterMode();
        var path = this._clickCoords;
        if (path && path.length > 0 && coordinate.equals(path[path.length - 1])) {
            return;
        }
        registerMode['update'](path.concat([coordinate]), this._geometry);
        /**
         * mousemove event.
         *
         * @event maptalks.DrawTool#mousemove
         * @type {Object}
         * @property {String} type - mousemove
         * @property {maptalks.DrawTool} target - draw tool
         * @property {maptalks.Geometry} geometry - geometry drawn
         * @property {maptalks.Coordinate} coordinate - coordinate of the event
         * @property {maptalks.Point} containerPoint  - container point of the event
         * @property {maptalks.Point} viewPoint       - view point of the event
         * @property {Event} domEvent                 - dom event
         */
        this._fireEvent('mousemove', param);
    },

    _dblclickForPath:function (param) {
        if (!this._geometry) { return; }
        var containerPoint = this._getMouseContainerPoint(param);
        if (!this._isValidContainerPoint(containerPoint)) { return; }
        var registerMode = this._getRegisterMode();
        var coordinate = param['coordinate'];
        var path = this._clickCoords;
        path.push(coordinate);
        if (path.length < 2) { return; }
        //去除重复的端点
        var nIndexes = [];
        var i, len;
        for (i = 1, len = path.length; i < len; i++) {
            if (path[i].x === path[i - 1].x && path[i].y === path[i - 1].y) {
                nIndexes.push(i);
            }
        }
        for (i = nIndexes.length - 1; i >= 0; i--) {
            path.splice(nIndexes[i], 1);
        }

        if (path.length < 2 || (this._geometry && (this._geometry instanceof maptalks.Polygon) && path.length < 3)) {
            return;
        }
        registerMode['update'](path, this._geometry);
        this._endDraw(param);
    },

    _mousedownToDraw : function (param) {
        var registerMode = this._getRegisterMode();
        var me = this,
            firstPoint = this._getMouseContainerPoint(param);
        if (!this._isValidContainerPoint(firstPoint)) { return false; }
        var firstCoord = param['coordinate'];

        function genGeometry(coordinate) {
            var symbol = me.getSymbol(),
                geometry = me._geometry;
            if (!geometry) {
                geometry = registerMode['create'](coordinate);
                geometry.setSymbol(symbol);
                me._addGeometryToStage(geometry);
                me._geometry = geometry;
            } else {
                registerMode['update'](coordinate, geometry);
            }
        }
        function onMouseMove(_event) {
            if (!this._geometry) {
                return false;
            }
            var current = this._getMouseContainerPoint(_event);
            if (!this._isValidContainerPoint(current)) { return false; }
            var coordinate = _event['coordinate'];
            genGeometry(coordinate);
            this._fireEvent('mousemove', param);
            return false;
        }
        var onMouseUp = function (_event) {
            if (!this._geometry) {
                return false;
            }
            var current = this._getMouseContainerPoint(_event);
            if (this._isValidContainerPoint(current)) {
                var coordinate = _event['coordinate'];
                genGeometry(coordinate);
            }
            this._map.off('mousemove', onMouseMove, this);
            this._map.off('mouseup', onMouseUp, this);
            this._endDraw(param);
            return false;
        };

        this._fireEvent('drawstart', param);
        genGeometry(firstCoord);
        this._map.on('mousemove', onMouseMove, this);
        this._map.on('mouseup', onMouseUp, this);
        return false;
    },

    _endDraw: function (param) {
        if (!this._geometry || this._ending) {
            return;
        }
        this._ending = true;
        var geometry = this._geometry;
        this._clearStage();
        if (!param) {
            param = {};
        }
        this._geometry = geometry;
        /**
         * drawend event.
         *
         * @event maptalks.DrawTool#drawend
         * @type {Object}
         * @property {String} type - drawend
         * @property {maptalks.DrawTool} target - draw tool
         * @property {maptalks.Geometry} geometry - geometry drawn
         * @property {maptalks.Coordinate} coordinate - coordinate of the event
         * @property {maptalks.Point} containerPoint  - container point of the event
         * @property {maptalks.Point} viewPoint       - view point of the event
         * @property {Event} domEvent                 - dom event
         */
        this._fireEvent('drawend', param);
        delete this._geometry;
        if (this.options['once']) {
            this.disable();
        }
        delete this._ending;
    },

    _clearStage: function () {
        this._getDrawLayer().clear();
        delete this._geometry;
        delete this._clickCoords;
    },

    /**
     * Get container point of the mouse event
     * @param  {Event} event -  mouse event
     * @return {maptalks.Point}
     * @private
     */
    _getMouseContainerPoint:function (event) {
        maptalks.DomUtil.stopPropagation(event['domEvent']);
        var result = event['containerPoint'];
        return result;
    },

    _isValidContainerPoint:function (containerPoint) {
        var mapSize = this._map.getSize();
        var w = mapSize['width'],
            h = mapSize['height'];
        if (containerPoint.x < 0 || containerPoint.y < 0) {
            return false;
        } else if (containerPoint.x > w || containerPoint.y > h) {
            return false;
        }
        return true;
    },

    _getDrawLayer:function () {
        var drawLayerId = maptalks.internalLayerPrefix + 'drawtool';
        var drawToolLayer = this._map.getLayer(drawLayerId);
        if (!drawToolLayer) {
            drawToolLayer = new maptalks.VectorLayer(drawLayerId, {'enableSimplify' : false});
            this._map.addLayer(drawToolLayer);
        }
        return drawToolLayer;
    },

    _fireEvent:function (eventName, param) {
        if (!param) {
            param = {};
        }
        if (this._geometry) {
            param['geometry'] = this._getRegisterMode()['generate'](this._geometry).copy();
        }
        maptalks.MapTool.prototype._fireEvent.call(this, eventName, param);
    }

});

maptalks.DrawTool.registerMode = function (name, modeAction) {
    if (!maptalks.DrawTool._registeredMode) {
        maptalks.DrawTool._registeredMode = {};
    }
    maptalks.DrawTool._registeredMode[name.toLowerCase()] = modeAction;
};

maptalks.DrawTool.getRegisterMode = function (name) {
    if (maptalks.DrawTool._registeredMode) {
        return maptalks.DrawTool._registeredMode[name.toLowerCase()];
    }
    return null;
};

maptalks.DrawTool.registerMode('circle', {
    'action' : 'drag',
    'geometryClass' : maptalks.Circle,
    'create' : function (coordinate) {
        return new maptalks.Circle(coordinate, 0);
    },
    'update' : function (coordinate, geometry) {
        var map = geometry.getMap();
        var center = geometry.getCenter();
        var radius = map.computeLength(center, coordinate);
        geometry.setRadius(radius);
    },
    'generate' : function (geometry) {
        return geometry;
    }
});

maptalks.DrawTool.registerMode('ellipse', {
    'action' : 'drag',
    'geometryClass' : maptalks.Ellipse,
    'create' : function (coordinate) {
        return maptalks.Ellipse(coordinate, 0, 0);
    },
    'update' : function (coordinate, geometry) {
        var map = geometry.getMap();
        var center = geometry.getCenter();
        var rx = map.computeLength(center, new maptalks.Coordinate({x:coordinate.x, y:center.y}));
        var ry = map.computeLength(center, new maptalks.Coordinate({x:center.x, y:coordinate.y}));
        geometry.setWidth(rx * 2);
        geometry.setHeight(ry * 2);
    },
    'generate' : function (geometry) {
        return geometry;
    }
});

maptalks.DrawTool.registerMode('rectangle', {
    'action' : 'drag',
    'geometryClass' : maptalks.Rectangle,
    'create' : function (coordinate) {
        var rect = maptalks.Rectangle(coordinate, 0, 0);
        rect._firstClick = coordinate;
        return rect;
    },
    'update' : function (coordinate, geometry) {
        var firstCoord = geometry._firstClick;
        var map = geometry.getMap();
        var width = map.computeLength(firstCoord, new maptalks.Coordinate(coordinate.x, firstCoord.y)),
            height = map.computeLength(firstCoord, new maptalks.Coordinate(firstCoord.x, coordinate.y));
        var cnw = map.coordinateToContainerPoint(firstCoord),
            cc = map.coordinateToContainerPoint(coordinate);
        var x = Math.min(cnw.x, cc.x),
            y = Math.min(cnw.y, cc.y);
        geometry.setCoordinates(map.containerPointToCoordinate(new maptalks.Point(x, y)));
        geometry.setWidth(width);
        geometry.setHeight(height);
    },
    'generate' : function (geometry) {
        return geometry;
    }
});

maptalks.DrawTool.registerMode('point', {
    'action' : 'click',
    'create' : function (coordinate) {
        return new maptalks.Marker(coordinate);
    },
    'generate' : function (geometry) {
        return geometry;
    }
});

maptalks.DrawTool.registerMode('polygon', {
    'action' : 'clickDblclick',
    'create' : function (path) {
        return new maptalks.LineString(path);
    },
    'update' : function (path, geometry) {
        var symbol = geometry.getSymbol();
        geometry.setCoordinates(path);
        if (path.length >= 3) {
            var layer = geometry.getLayer();
            if (layer) {
                var polygon = layer.getGeometryById('polygon');
                if (!polygon) {
                    polygon = new maptalks.Polygon([path], {
                        'id' : 'polygon'
                    });
                    if (symbol) {
                        var pSymbol = maptalks.Util.extendSymbol(symbol, {'lineOpacity':0});
                        polygon.setSymbol(pSymbol);
                    }
                    polygon.addTo(layer);
                }
                polygon.setCoordinates(path);
            }
        }
    },
    'generate' : function (geometry) {
        return new maptalks.Polygon(geometry.getCoordinates(), {
            'symbol' : geometry.getSymbol()
        });
    }
});

maptalks.DrawTool.registerMode('linestring', {
    'action' : 'clickDblclick',
    'create' : function (path) {
        return new maptalks.LineString(path);
    },
    'update' : function (path, geometry) {
        geometry.setCoordinates(path);
    },
    'generate' : function (geometry) {
        return geometry;
    }
});

maptalks.DrawTool.registerMode('arccurve', {
    'action' : 'clickDblclick',
    'create' : function (path) {
        return new maptalks.ArcCurve(path);
    },
    'update' : function (path, geometry) {
        geometry.setCoordinates(path);
    },
    'generate' : function (geometry) {
        return geometry;
    }
});

maptalks.DrawTool.registerMode('quadbeziercurve', {
    'action' : 'clickDblclick',
    'create' : function (path) {
        return new maptalks.QuadBezierCurve(path);
    },
    'update' : function (path, geometry) {
        geometry.setCoordinates(path);
    },
    'generate' : function (geometry) {
        return geometry;
    }
});

maptalks.DrawTool.registerMode('cubicbeziercurve', {
    'action' : 'clickDblclick',
    'create' : function (path) {
        return new maptalks.CubicBezierCurve(path);
    },
    'update' : function (path, geometry) {
        geometry.setCoordinates(path);
    },
    'generate' : function (geometry) {
        return geometry;
    }
});

/**
 * @classdesc
 * A map tool to help measure distance on the map
 * @class
 * @category maptool
 * @extends maptalks.DrawTool
 * @mixins maptalks.Eventable
 * @param {options} [options=null] - construct options
 * @param {String} [options.language=zh-CN]         - language of the distance tool, zh-CN or en-US
 * @param {Boolean} [options.metric=true]           - display result in metric system
 * @param {Boolean} [options.imperial=false]        - display result in imperial system.
 * @param {Object}  [options.symbol=null]           - symbol of the line
 * @param {Object}  [options.vertexSymbol=null]     - symbol of the vertice
 * @param {Object}  [options.labelOptions=null]     - construct options of the vertice labels.
 * @example
 * var distanceTool = new maptalks.DistanceTool({
 *     'once' : true,
 *     'symbol': {
 *       'lineColor' : '#34495e',
 *       'lineWidth' : 2
 *     },
 *     'vertexSymbol' : {
 *       'markerType'        : 'ellipse',
 *       'markerFill'        : '#1bbc9b',
 *       'markerLineColor'   : '#000',
 *       'markerLineWidth'   : 3,
 *       'markerWidth'       : 10,
 *      'markerHeight'      : 10
 *    },
 *    'language' : 'en-US'
 *  }).addTo(map);
 *
 */
maptalks.DistanceTool = maptalks.DrawTool.extend(/** @lends maptalks.DistanceTool.prototype */{

    /**
     * @property {options} options
     * @property {String}  options.language         - language of the distance tool, zh-CN or en-US
     * @property {Boolean} options.metric           - display result in metric system
     * @property {Boolean} options.imperial         - display result in imperial system.
     * @property {Object}  options.symbol           - symbol of the line
     * @property {Object}  options.vertexSymbol     - symbol of the vertice
     * @property {Object}  options.labelOptions     - construct options of the vertice labels.
     */
    options:{
        'mode' : 'LineString',
        'language' : 'zh-CN', //'en-US'
        'metric': true,
        'imperial': false,
        'symbol' : {
            'lineColor':'#000', //'#3388ff',
            'lineWidth':3,
            'lineOpacity':1
        },
        'vertexSymbol' : {
            'markerType'        : 'ellipse',
            'markerFill'        : '#fff', //"#d0d2d6",
            'markerLineColor'   : '#000',
            'markerLineWidth'   : 3,
            'markerWidth'       : 10,
            'markerHeight'      : 10
        },
        'labelOptions' : {
            'symbol':{
                'textWrapCharacter' : '\n',
                'textFaceName' : 'monospace',
                'textLineSpacing' : 1,
                'textHorizontalAlignment' : 'right',
                'markerLineColor' : '#b4b3b3',
                'textDx' : 15
            },
            'boxPadding'   :   {'width' : 6, 'height' : 4}
        }
    },

    initialize: function (options) {
        maptalks.Util.setOptions(this, options);
        this.on('enable', this._afterEnable, this)
            .on('disable', this._afterDisable, this);
        this._measureLayers = [];
    },

    /**
     * Clear the measurements
     * @return {maptalks.DistanceTool} this
     */
    clear:function () {
        if (maptalks.Util.isArrayHasData(this._measureLayers)) {
            for (var i = 0; i < this._measureLayers.length; i++) {
                this._measureLayers[i].remove();
            }
        }
        delete this._lastMeasure;
        delete this._lastVertex;
        this._measureLayers = [];
        return this;
    },

    /**
     * Get the VectorLayers with the geometries drawn on the map during measuring.
     * @return {maptalks.Layer[]}
     */
    getMeasureLayers:function () {
        return this._measureLayers;
    },

    /**
     * Get last measuring result
     * @return {Number}
     */
    getLastMeasure:function () {
        if (!this._lastMeasure) {
            return 0;
        }
        return this._lastMeasure;
    },

    _measure:function (toMeasure) {
        var map = this.getMap();
        var length;
        if (toMeasure instanceof maptalks.Geometry) {
            length = map.computeGeometryLength(toMeasure);
        } else if (maptalks.Util.isArray(toMeasure)) {
            length = maptalks.GeoUtil._computeLength(toMeasure, map.getProjection());
        }
        this._lastMeasure = length;
        var units;
        if (this.options['language'] === 'zh-CN') {
            units = [' 米', ' 公里', ' 英尺', ' 英里'];
        } else {
            units = [' m', ' km', ' feet', ' mile'];
        }
        var content = '';
        if (this.options['metric']) {
            content += length < 1000 ? length.toFixed(0) + units[0] : (length / 1000).toFixed(2) + units[1];
        }
        if (this.options['imperial']) {
            length *= 3.2808399;
            if (content.length > 0) {
                content += '\n';
            }
            content += length < 5280 ? length.toFixed(0) + units[2] : (length / 5280).toFixed(2) + units[3];
        }
        return content;
    },

    _registerMeasureEvents:function () {
        this.on('drawstart', this._msOnDrawStart, this)
            .on('drawvertex', this._msOnDrawVertex, this)
            .on('mousemove', this._msOnMouseMove, this)
            .on('drawend', this._msOnDrawEnd, this);
    },

    _afterEnable:function () {
        this._registerMeasureEvents();
    },

    _afterDisable:function () {
        this.off('drawstart', this._msOnDrawStart, this)
            .off('drawvertex', this._msOnDrawVertex, this)
            .off('mousemove', this._msOnMouseMove, this)
            .off('drawend', this._msOnDrawEnd, this);
    },

    _msOnDrawStart:function (param) {
        var map = this.getMap();
        var uid = maptalks.Util.UID();
        var layerId = 'distancetool_' + uid;
        var markerLayerId = 'distancetool_markers_' + uid;
        if (!map.getLayer(layerId)) {
            this._measureLineLayer = new maptalks.VectorLayer(layerId, {'drawImmediate' : true}).addTo(map);
            this._measureMarkerLayer = new maptalks.VectorLayer(markerLayerId, {'drawImmediate' : true}).addTo(map);
        } else {
            this._measureLineLayer = map.getLayer(layerId);
            this._measureMarkerLayer = map.getLayer(markerLayerId);
        }
        this._measureLayers.push(this._measureLineLayer);
        this._measureLayers.push(this._measureMarkerLayer);
        //start marker
        new maptalks.Marker(param['coordinate'], {
            'symbol' : this.options['vertexSymbol']
        }).addTo(this._measureMarkerLayer);
        var content = (this.options['language'] === 'zh-CN' ? '起点' : 'start');
        var startLabel = new maptalks.Label(content, param['coordinate'], this.options['labelOptions']);
        this._measureMarkerLayer.addGeometry(startLabel);
    },

    _msOnMouseMove:function (param) {
        var ms = this._measure(param['geometry'].getCoordinates().concat([param['coordinate']]));
        if (!this._tailMarker) {
            var symbol = maptalks.Util.extendSymbol(this.options['vertexSymbol']);
            symbol['markerWidth'] /= 2;
            symbol['markerHeight'] /= 2;
            this._tailMarker = new maptalks.Marker(param['coordinate'], {
                'symbol' : symbol
            }).addTo(this._measureMarkerLayer);
            this._tailLabel = new maptalks.Label(ms, param['coordinate'], this.options['labelOptions'])
                .addTo(this._measureMarkerLayer);
        }
        this._tailMarker.setCoordinates(param['coordinate']);
        this._tailLabel.setContent(ms);
        this._tailLabel.setCoordinates(param['coordinate']);

    },

    _msOnDrawVertex:function (param) {
        var geometry = param['geometry'];
        //vertex marker
        new maptalks.Marker(param['coordinate'], {
            'symbol' : this.options['vertexSymbol']
        }).addTo(this._measureMarkerLayer);
        var length = this._measure(geometry);
        var vertexLabel = new maptalks.Label(length, param['coordinate'], this.options['labelOptions']);
        this._measureMarkerLayer.addGeometry(vertexLabel);
        this._lastVertex = vertexLabel;
    },

    _msOnDrawEnd:function (param) {
        this._clearTailMarker();
        var size = this._lastVertex.getSize();
        if (!size) {
            size = new maptalks.Size(10, 10);
        }
        this._addClearMarker(this._lastVertex.getCoordinates(), size['width']);
        var geo = param['geometry'].copy();
        geo.addTo(this._measureLineLayer);
        this._lastMeasure = geo.getLength();
    },

    _addClearMarker:function (coordinates, dx) {
        var endMarker = new maptalks.Marker(coordinates, {
            'symbol' : [
                {
                    'markerType' : 'square',
                    'markerFill' : '#ffffff',
                    'markerLineColor' : '#b4b3b3',
                    'markerLineWidth' : 2,
                    'markerWidth' : 15,
                    'markerHeight' : 15,
                    'markerDx' : 20 + dx
                },
                {
                    'markerType' : 'x',
                    'markerWidth' : 10,
                    'markerHeight' : 10,
                    'markerDx' : 20 + dx
                }
            ]
        });
        var measureLineLayer = this._measureLineLayer,
            measureMarkerLayer = this._measureMarkerLayer;
        endMarker.on('click', function () {
            measureLineLayer.remove();
            measureMarkerLayer.remove();
            //return false to stop propagation of event.
            return false;
        }, this);
        endMarker.addTo(this._measureMarkerLayer);
    },

    _clearTailMarker:function () {
        if (this._tailMarker) {
            this._tailMarker.remove();
            delete this._tailMarker;
        }
        if (this._tailLabel) {
            this._tailLabel.remove();
            delete this._tailLabel;
        }
    }

});


/**
 * @classdesc
 * A map tool to help measure area on the map
 * @class
 * @category maptool
 * @extends maptalks.DistanceTool
 * @param {options} [options=null] - construct options
 * @param {String} [options.language=zh-CN]         - language of the distance tool, zh-CN or en-US
 * @param {Boolean} [options.metric=true]           - display result in metric system
 * @param {Boolean} [options.imperial=false]        - display result in imperial system.
 * @param {Object}  [options.symbol=null]           - symbol of the line
 * @param {Object}  [options.vertexSymbol=null]     - symbol of the vertice
 * @param {Object}  [options.labelOptions=null]     - construct options of the vertice labels.
 * @example
 * var areaTool = new maptalks.AreaTool({
 *     'once' : true,
 *     'symbol': {
 *       'lineColor' : '#34495e',
 *       'lineWidth' : 2
 *     },
 *     'vertexSymbol' : {
 *       'markerType'        : 'ellipse',
 *       'markerFill'        : '#1bbc9b',
 *       'markerLineColor'   : '#000',
 *       'markerLineWidth'   : 3,
 *       'markerWidth'       : 10,
 *      'markerHeight'      : 10
 *    },
 *    'language' : 'en-US'
 *  }).addTo(map);
 */
maptalks.AreaTool = maptalks.DistanceTool.extend(/** @lends maptalks.AreaTool.prototype */{
    /**
     * @property {options} options
     * @property {String}  options.language         - language of the distance tool, zh-CN or en-US
     * @property {Boolean} options.metric           - display result in metric system
     * @property {Boolean} options.imperial         - display result in imperial system.
     * @property {Object}  options.symbol           - symbol of the line
     * @property {Object}  options.vertexSymbol     - symbol of the vertice
     * @property {Object}  options.labelOptions     - construct options of the vertice labels.
     */
    options:{
        'mode' : 'Polygon',
        'symbol' : {
            'lineColor':'#000000',
            'lineWidth':2,
            'lineOpacity':1,
            'lineDasharray': '',
            'polygonFill' : '#ffffff',
            'polygonOpacity' : 0.5
        }
    },

    initialize: function (options) {
        maptalks.Util.setOptions(this, options);
        this.on('enable', this._afterEnable, this)
            .on('disable', this._afterDisable, this);
        this._measureLayers = [];
    },

    _measure:function (toMeasure) {
        var map = this.getMap();
        var area;
        if (toMeasure instanceof maptalks.Geometry) {
            area = map.computeGeometryArea(toMeasure);
        } else if (maptalks.Util.isArray(toMeasure)) {
            area = maptalks.GeoUtil._computeArea(toMeasure, map.getProjection());
        }
        this._lastMeasure = area;
        var units;
        if (this.options['language'] === 'zh-CN') {
            units = [' 平方米', ' 平方公里', ' 平方英尺', ' 平方英里'];
        } else {
            units = [' sq.m', ' sq.km', ' sq.ft', ' sq.mi'];
        }
        var content = '';
        if (this.options['metric']) {
            content += area < 1E6 ? area.toFixed(0) + units[0] : (area / 1E6).toFixed(2) + units[1];
        }
        if (this.options['imperial']) {
            area *= 3.2808399;
            if (content.length > 0) {
                content += '\n';
            }
            var sqmi = 5280 * 5280;
            content += area < sqmi ? area.toFixed(0) + units[2] : (area / sqmi).toFixed(2) + units[3];
        }
        return content;
    },

    _msOnDrawVertex:function (param) {
        var vertexMarker = new maptalks.Marker(param['coordinate'], {
            'symbol' : this.options['vertexSymbol']
        }).addTo(this._measureMarkerLayer);

        this._lastVertex = vertexMarker;
    },

    _msOnDrawEnd:function (param) {
        this._clearTailMarker();

        var ms = this._measure(param['geometry']);
        var endLabel = new maptalks.Label(ms, param['coordinate'], this.options['labelOptions'])
                        .addTo(this._measureMarkerLayer);
        var size = endLabel.getSize();
        if (!size) {
            size = new maptalks.Size(10, 10);
        }
        this._addClearMarker(param['coordinate'], size['width']);
        var geo = param['geometry'].copy();
        geo.addTo(this._measureLineLayer);
        this._lastMeasure = geo.getArea();
    }
});

/**
 * @classdesc
 * A class internally used by tile layer helps to descibe tile system used by different tile services.<br>
 * Similar with [transformation]{@link maptalks.Transformation}, it contains 4 numbers: <br>
 * sx : the order of X-axis tile index, 1 means right is larger and -1 means the reverse, left is larger;<br>
 * sy : the order of Y-axis tile index, 1 means top is larger and -1 means the reverse, bottom is larger;<br>
 * ox : x of the origin point of the world's projected coordinate system <br>
 * oy : y of the origin point of the world's projected coordinate system <br>
 * @see {@link http://wiki.osgeo.org/wiki/Tile_Map_Service_Specification}
 * @class
 * @category geo
 * @example
 * var ts = new maptalks.TileSystem([1, -1, -20037508.34, 20037508.34]);
 */
maptalks.TileSystem = function (sx, sy, ox, oy) {
    if (maptalks.Util.isArray(sx)) {
        this.scale =  {x : sx[0], y : sx[1]};
        this.origin = {x : sx[2], y : sx[3]};
    } else {
        this.scale =  {x : sx, y : sy};
        this.origin = {x : ox, y : oy};
    }
};

maptalks.Util.extend(maptalks.TileSystem, /** @lends maptalks.TileSystem */{
    /**
     * The most common used tile system, used by google maps, bing maps and amap, soso maps in China.
     * @see {@link https://en.wikipedia.org/wiki/Web_Mercator}
     * @constant
     * @static
     */
    'web-mercator' : new maptalks.TileSystem([1, -1, -20037508.34, 20037508.34]),

    /**
     * Predefined tile system for TMS tile system, A tile system published by [OSGEO]{@link http://www.osgeo.org/}. <br>
     * Also used by mapbox's [mbtiles]{@link https://github.com/mapbox/mbtiles-spec} specification.
     * @see {@link http://wiki.osgeo.org/wiki/Tile_Map_Service_Specification}
     * @constant
     * @static
     */
    'tms-global-mercator' : new maptalks.TileSystem([1, 1, -20037508.34, -20037508.34]),

    /**
     * Another tile system published by [OSGEO]{@link http://www.osgeo.org/}, based on EPSG:4326 SRS.
     * @see {@link http://wiki.osgeo.org/wiki/Tile_Map_Service_Specification#global-geodetic}
     * @constant
     * @static
     */
    'tms-global-geodetic' : new maptalks.TileSystem([1, 1, -180, -90]),

    /**
     * Tile system used by [baidu]{@link http://map.baidu.com}
     * @constant
     * @static
     */
    'baidu' : new maptalks.TileSystem([1, 1, 0, 0])
});

/**
 * Get the default tile system's code for the projection.
 * @function
 * @static
 * @memberOf maptalks.TileSystem
 * @name  getDefault
 * @param  {Object} projection      - a projection object
 * @return {String} tile system code
 */
maptalks.TileSystem.getDefault = function (projection) {
    if (projection['code'].toLowerCase() === 'baidu') {
        return 'baidu';
    } else if (projection['code'].toLowerCase() === 'EPSG:4326'.toLowerCase()) {
        return 'tms-global-geodetic';
    } else if (projection['code'].toLowerCase() === 'identity') {
        return [1, -1, 0, 0];
    } else {
        return 'web-mercator';
    }
};

/**
 * Tile config for tile layers, a utilities class for tile layers to render tiles
 * @class
 * @category layer
 * @extends {maptalks.Class}
 * @protected
 * @param {maptalks.TileSystem} tileSystem  - tileSystem
 * @param {maptalks.Extent} fullExtent      - fullExtent of the tile layer
 * @param {maptalks.Size} tileSize          - tile size
 */
maptalks.TileConfig = maptalks.Class.extend(/** @lends maptalks.TileConfig.prototype */{


    initialize:function (tileSystem, fullExtent, tileSize) {
        this.tileSize = tileSize;
        this.fullExtent = fullExtent;
        this.prepareTileInfo(tileSystem, fullExtent);
    },

    prepareTileInfo:function (tileSystem, fullExtent) {
        if (maptalks.Util.isString(tileSystem)) {
            tileSystem = maptalks.TileSystem[tileSystem.toLowerCase()];
        } else if (maptalks.Util.isArray(tileSystem)) {
            tileSystem = new maptalks.TileSystem(tileSystem);
        }

        if (!tileSystem) {
            throw new Error('Invalid TileSystem');
        }
        this.tileSystem = tileSystem;

            //自动计算transformation
        var a = fullExtent['right'] > fullExtent['left'] ? 1 : -1,
            b = fullExtent['top'] > fullExtent['bottom'] ? -1 : 1,
            c = tileSystem['origin']['x'],
            d = tileSystem['origin']['y'];
        this.transformation = new maptalks.Transformation([a, b, c, d]);
            //计算transform后的以像素为单位的原点
        tileSystem['transOrigin'] = this.transformation.transform(tileSystem['origin'], 1);
    },

    getTileIndex:function (point, res) {
        var tileSystem = this.tileSystem, tileSize = this['tileSize'],
            transOrigin = tileSystem['transOrigin'],
            delta = 1E-7;

        var tileX = Math.floor(delta + (point.x - transOrigin.x) / (tileSize['width'] * res));
        var tileY = -Math.floor(delta + (point.y - transOrigin.y) / (tileSize['height'] * res));

        return {'x':tileSystem['scale']['x'] * tileX, 'y':tileSystem['scale']['y'] * tileY};
    },

    /**
     * 根据中心点投影坐标, 计算中心点对应的瓦片和瓦片内偏移量
     * @param  {*} pLonlat   [description]
     * @param  {*} res [description]
     * @return {*}           [description]
     */
    getCenterTile:function (pLonlat, res) {
        var tileSystem = this.tileSystem,
            tileSize = this['tileSize'];
        var point = this.transformation.transform(pLonlat, 1);
        var tileIndex = this.getTileIndex(point, res);

        var tileLeft = tileIndex['x'] * tileSize['width'];
        var tileTop = tileIndex['y'] * tileSize['height'];

        var offsetLeft = point.x / res - tileSystem['scale']['x'] * tileLeft;
        var offsetTop = point.y / res + tileSystem['scale']['y'] * tileTop;

            //如果x方向为左大右小
        if (tileSystem['scale']['x'] < 0) {
            tileIndex['x'] -= 1;
        }
            //如果y方向上大下小
        if (tileSystem['scale']['y'] > 0) {
            tileIndex['y'] -= 1;
        }

            //有可能tileIndex超出世界范围
        tileIndex = this.getNeighorTileIndex(tileIndex['y'], tileIndex['x'], 0, 0, true);

        return {'x':tileIndex['x'], 'y':tileIndex['y'], 'offsetLeft':offsetLeft, 'offsetTop':offsetTop};
    },

    /**
     * 根据给定的瓦片编号,和坐标编号偏移量,计算指定的瓦片编号
     * @param  {*} tileY   [description]
     * @param  {*} tileX   [description]
     * @param  {*} offsetY [description]
     * @param  {*} offsetX [description]
     * @param  {*} zoomLevel [description]
     * @return {*}         [description]
     */
    getNeighorTileIndex:function (tileY, tileX, offsetY, offsetX, res, isRepeatWorld) {
        var tileSystem = this.tileSystem;
        var x = (tileX + tileSystem['scale']['x'] * offsetX);
        var y = (tileY - tileSystem['scale']['y'] * offsetY);
            //连续世界瓦片计算
        if (isRepeatWorld) {
            var ext = this._getTileFullIndex(res);
            if (x < ext['xmin']) {
                x = ext['xmax'] - (ext['xmin'] - x) % (ext['xmax'] - ext['xmin']);
                if (x === ext['xmax']) {
                    x = ext['xmin'];
                }
            } else if (x >= ext['xmax']) {
                x = ext['xmin'] + (x - ext['xmin']) % (ext['xmax'] - ext['xmin']);
            }

            if (y >= ext['ymax']) {
                y = ext['ymin'] + (y - ext['ymin']) % (ext['ymax'] - ext['ymin']);
            } else if (y < ext['ymin']) {
                y = ext['ymax'] - (ext['ymin'] - y) % (ext['ymax'] - ext['ymin']);
                if (y === ext['ymax']) {
                    y = ext['ymin'];
                }
            }
        }
        return {'x':x, 'y':y};
    },

    _getTileFullIndex:function (res) {
        var ext = this.fullExtent;
        var transformation = this.transformation;
        var nwIndex = this.getTileIndex(transformation.transform(new maptalks.Coordinate(ext['left'], ext['top']), 1), res);
        var seIndex = this.getTileIndex(transformation.transform(new maptalks.Coordinate(ext['right'], ext['bottom']), 1), res);
        return new maptalks.Extent(nwIndex, seIndex);
    },

    /**
     * 计算瓦片左下角的大地投影坐标
     * @param  {*} tileY     [description]
     * @param  {*} tileX     [description]
     * @param  {*} res       [description]
     * @return {*}           [description]
     */
    getTileProjectedSw: function (tileY, tileX, res) {
        var tileSystem = this.tileSystem;
        var tileSize = this['tileSize'];
        var y = tileSystem['origin']['y'] + tileSystem['scale']['y'] * (tileY + (tileSystem['scale']['y'] === 1 ? 0 : 1)) * (res * tileSize['height']);
        var x = tileSystem['scale']['x'] * (tileX + (tileSystem['scale']['x'] === 1 ? 0 : 1)) * res * tileSize['width'] + tileSystem['origin']['x'];
        return [x, y];
    }


});

/**
 * Common methods for classes can be rendered, e.g. Map, Layers
 * @mixin
 * @protected
 */
maptalks.Renderable = {
    /**
     * Register a renderer class with the given name.
     * @param  {String} name  - renderer's register key
     * @param  {Function} clazz - renderer's class, a function (not necessarily a [maptalks.Class]{@link maptalks.Class}).
     * @static
     * @return {*} this
     */
    registerRenderer : function (name, clazz) {
        if (!this._regRenderers) {
            this._regRenderers = {};
        }
        this._regRenderers[name.toLowerCase()] = clazz;
        return this;
    },

    /**
     * Get the registered renderer class by the given name
     * @param  {String} name  - renderer's register key
     * @return {Function} renderer's class
     * @static
     */
    getRendererClass : function (name) {
        if (!this._regRenderers) {
            return null;
        }
        return this._regRenderers[name.toLowerCase()];
    }
};

/**
 * @classdesc
 * Base class for all the layers, defines common methods that all the layer classes share. <br>
 * It is abstract and not intended to be instantiated.
 *
 * @class
 * @category layer
 * @abstract
 * @extends maptalks.Class
 * @mixes maptalks.Eventable
 */
maptalks.Layer = maptalks.Class.extend(/** @lends maptalks.Layer.prototype */{

    includes: maptalks.Eventable,

    /**
     * @property {Object}  [options=null] - base options of layer.
     * @property {Number}  [options.minZoom=-1] - the minimum zoom to display the layer, set to -1 to unlimit it.
     * @property {Number}  [options.maxZoom=-1] - the maximum zoom to display the layer, set to -1 to unlimit it.
     * @property {Boolean} [options.visible=true] - whether to display the layer.
     * @property {Number}  [options.opacity=1] - opacity of the layer, from 0 to 1.
     * @property {String}  [options.renderer=canvas] - renderer type. Don't change it if you are not sure about it. About renderer, see [TODO]{@link tutorial.renderer}.
     */
    options:{
        //最大最小可视范围, null表示不受限制
        'minZoom': null,
        'maxZoom': null,
        //图层是否可见
        'visible': true,
        'opacity': 1,
        'drawImmediate' : false,
        // context.globalCompositeOperation, 'source-in' in default
        'globalCompositeOperation' : null,
        'renderer' : 'canvas',
        'dx'       : 0,
        'dy'       : 0
    },

    initialize:function (id, opts) {
        this.setId(id);
        maptalks.Util.setOptions(this, opts);
    },


     /**
     * load the tile layer, can't be overrided by sub-classes
     */
    load:function () {
        if (!this.getMap()) { return this; }
        this._initRenderer();
        var zIndex = this.getZIndex();
        if (this.onAdd()) {
            if (!maptalks.Util.isNil(zIndex)) {
                this._renderer.setZIndex(zIndex);
            }
            this._renderer.render(true);
        }
        return this;
    },

    /**
     * Get the layer id
     * @returns {String} id
     */
    getId:function () {
        return this._id;
    },

    /**
     * Set a new id to the layer
     * @param {String} id - new layer id
     * @return {maptalks.Layer} this
     * @fires maptalks.Layer#idchange
     */
    setId:function (id) {
        //TODO 设置id可能造成map无法找到layer
        var old = this._id;
        if (!maptalks.Util.isNil(id)) {
            id = id + '';
        }
        this._id = id;
        /**
         * idchange event.
         *
         * @event maptalks.Layer#idchange
         * @type {Object}
         * @property {String} type - idchange
         * @property {maptalks.Layer} target    - the layer fires the event
         * @property {String} old        - value of the old id
         * @property {String} new        - value of the new id
         */
        this.fire('idchange', {'old':old, 'new':id});
        return this;
    },

    /**
     * Adds itself to a map.
     * @param {maptalks.Map} map - map added to
     * @return {maptalks.Layer} this
     */
    addTo:function (map) {
        map.addLayer(this);
        return this;
    },

    /**
     * Set a z-index to the layer
     * @param {Number} zIndex - layer's z-index
     * @return {maptalks.Layer} this
     */
    setZIndex:function (zIndex) {
        this._zIndex = zIndex;
        if (this.map) {
            var layerList = this._getLayerList();
            this.map._sortLayersByZIndex(layerList);
        }
        if (this._renderer) {
            this._renderer.setZIndex(zIndex);
        }
        return this;
    },

    /**
     * Get the layer's z-index
     * @return {Number}
     */
    getZIndex:function () {
        return this._zIndex;
    },

    /**
     * If the layer is rendered by HTML5 Canvas 2d.
     * @return {Boolean}
     * @protected
     */
    isCanvasRender:function () {
        var renderer = this._getRenderer();
        if (renderer) {
            return renderer.isCanvasRender();
        }
        return false;
    },

    /**
     * Get the map that the layer added to
     * @returns {maptalks.Map}
     */
    getMap:function () {
        if (this.map) {
            return this.map;
        }
        return null;
    },


    /**
     * Brings the layer to the top of all the layers
     * @returns {maptalks.Layer} this
     */
    bringToFront:function () {
        var layers = this._getLayerList();
        if (!layers) {
            return this;
        }
        var topLayer = layers[layers.length - 1];
        if (layers.length === 1 || topLayer === this) {
            return this;
        }
        var max = topLayer.getZIndex();
        this.setZIndex(max + 1);
        return this;
    },

    /**
     * Brings the layer under the bottom of all the layers
     * @returns {maptalks.Layer} this
     */
    bringToBack:function () {
        var layers = this._getLayerList();
        if (!layers) {
            return this;
        }
        var bottomLayer = layers[0];
        if (layers.length === 1 || bottomLayer === this) {
            return this;
        }
        var min = bottomLayer.getZIndex();
        this.setZIndex(min - 1);
        return this;
    },

    /**
     * Show the layer
     * @returns {maptalks.Layer} this
     */
    show:function () {
        if (!this.options['visible']) {
            this.options['visible'] = true;
            if (this._getRenderer()) {
                this._getRenderer().show();
            }
        }
        this.fire('show');
        return this;
    },

    /**
     * Hide the layer
     * @returns {maptalks.Layer} this
     */
    hide:function () {
        if (this.options['visible']) {
            this.options['visible'] = false;
            if (this._getRenderer()) {
                this._getRenderer().hide();
            }
        }
        this.fire('hide');
        return this;
    },

    isLoaded:function () {
        if (!this._renderer) {
            return false;
        }
        return this._renderer.isLoaded();
    },

    /**
     * Whether the layer is visible now.
     * @return {Boolean}
     */
    isVisible:function () {
        if (maptalks.Util.isNumber(this.options['opacity']) && this.options['opacity'] <= 0) {
            return false;
        }
        var map = this.getMap();
        if (map) {
            var zoom = map.getZoom();
            if ((!maptalks.Util.isNil(this.options['maxZoom']) && this.options['maxZoom'] < zoom) ||
                    (!maptalks.Util.isNil(this.options['minZoom']) && this.options['minZoom'] > zoom)) {
                return false;
            }
        }

        if (maptalks.Util.isNil(this.options['visible'])) {
            this.options['visible'] = true;
        }
        return this.options['visible'];
    },

    /**
     * Remove itself from the map added to.
     * @returns {maptalks.Layer} this
     */
    remove:function () {
        if (this.map) {
            this.map.removeLayer(this);
        }
        return this;
    },

    /**
     * Get the mask geometry of the layer
     * @return {maptalks.Geometry}
     */
    getMask:function () {
        return this._mask;
    },

    /**
     * Set a mask geometry on the layer, only the area in the mask will be displayed.
     * @param {maptalks.Geometry} mask - mask geometry, can only be a Marker with vector symbol, a Polygon or a MultiPolygon
     * @returns {maptalks.Layer} this
     */
    setMask:function (mask) {
        if (!((mask instanceof maptalks.Marker && maptalks.symbolizer.VectorMarkerSymbolizer.test(mask.getSymbol())) ||
                mask instanceof maptalks.Polygon)) {
            throw new Error('Mask for a layer must be either a marker with vector marker symbol, a Polygon or a MultiPolygon.');
        }

        if (mask instanceof maptalks.Marker) {
            mask.updateSymbol({
                'markerLineColor'   : 'rgba(0, 0, 0, 0)',
                'markerFillOpacity' : 0
            });
        } else {
            mask.setSymbol({
                'lineColor'    : 'rgba(0, 0, 0, 0)',
                'polygonOpacity' : 0
            });
        }
        mask._bindLayer(this);
        this._mask = mask;
        if (!this.getMap() || this.getMap()._isBusy()) {
            return this;
        }
        if (this._getRenderer()) {
            this._getRenderer().render();
        }
        return this;
    },

    /**
     * Remove the mask
     * @returns {maptalks.Layer} this
     */
    removeMask:function () {
        delete this._mask;
        if (!this.getMap() || this.getMap()._isBusy()) {
            return this;
        }
        if (this._getRenderer()) {
            this._getRenderer().render();
        }
        return this;
    },

    /**
     * Prepare Layer's loading, this is a method intended to be overrided by subclasses.
     * @return {Boolean} true to continue loading, false to cease.
     * @protected
     */
    onAdd:function () {
        return true;
    },

    _refreshMask: function () {
        if (this._mask) {
            this._mask.onZoomEnd();
        }
    },

    _bindMap:function (map, zIndex) {
        if (!map) { return; }
        this.map = map;
        this.setZIndex(zIndex);
        this._registerEvents();
        this._switchEvents('on', this);

        this.fire('add');
    },

    _initRenderer:function () {
        var renderer = this.options['renderer'];
        if (!this.constructor.getRendererClass) {
            return;
        }
        var clazz = this.constructor.getRendererClass(renderer);
        if (!clazz) {
            throw new Error('Invalid renderer for Layer(' + this.getId() + '):' + renderer);
        }
        this._renderer = new clazz(this);
        this._renderer.layer = this;
        this._renderer.setZIndex(this.getZIndex());
        this._switchEvents('on', this._renderer);
    },

    _doRemove:function () {
        if (this.onRemove) {
            this.onRemove();
        }
        this._switchEvents('off', this);
        this._removeEvents();
        if (this._renderer) {
            this._switchEvents('off', this._renderer);
            this._renderer.remove();
            delete this._renderer;
        }
        delete this._mask;
        delete this.map;
    },

    _switchEvents: function (to, emitter) {
        if (emitter && emitter.getEvents) {
            this.getMap()[to](emitter.getEvents(), emitter);
        }
    },

    _registerEvents: function () {
        this.getMap().on('_zoomend', this._refreshMask, this);
    },

    _removeEvents: function () {
        this.getMap().off('_zoomend', this._refreshMask, this);
    },

    _getRenderer:function () {
        return this._renderer;
    },

    _getLayerList:function () {
        if (!this.map) { return null; }
        return this.map._layers;
    }
});

maptalks.Util.extend(maptalks.Layer, maptalks.Renderable);

maptalks.Layer.extend = function (props) {
    var NewLayer = maptalks.Class.extend.call(this, props);
    if (this._regRenderers) {
        NewLayer._regRenderers = maptalks.Util.extend({}, this._regRenderers);
    }
    return NewLayer;
};

/**
 * @classdesc
 * A layer used to display tiled map services, such as [google maps]{@link http://maps.google.com}, [open street maps]{@link http://www.osm.org}
 * @class
 * @category layer
 * @extends maptalks.Layer
 * @param {String|Number} id - tile layer's id
 * @param {Object} [options=null] - options defined in [maptalks.TileLayer]{@link maptalks.TileLayer#options}
 * @example
 * new maptalks.TileLayer("tile",{
        urlTemplate : 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        subdomains:['a','b','c']
    })
 */
maptalks.TileLayer = maptalks.Layer.extend(/** @lends maptalks.TileLayer.prototype */{

    /**
     * @property {Object}              options                     - TileLayer's options
     * @property {String}              [options.errorTileUrl=null] - tile's url when error
     * @property {String}              options.urlTemplate         - url templates
     * @property {String[]|Number[]}   [options.subdomains=null]   - subdomains to replace '{s}' in urlTemplate
     * @property {Boolean}             [options.repeatWorld=true]  - tiles will be loaded repeatedly outside the world.
     * @property {String}              [options.crossOrigin=null]  - tile Image's corssOrigin
     * @property {Object}              [options.tileSize={'width':256, 'height':256}] - size of the tile image
     * @property {Number[]}            [options.tileSystem=null]   - tile system number arrays
     * @property {Boolean}             [options.debug=false]       - if set to true, tiles will have borders and a title of its coordinates.
     */
    options: {
        'errorTileUrl'  : null,
        'urlTemplate'   : null,
        'subdomains'    : null,

        'gradualLoading' : true,

        'repeatWorld'   : true,

        'renderWhenPanning' : false,
        //移图时地图的更新间隔, 默认为0即实时更新, -1表示不更新.如果效率较慢则可改为适当的值
        'updateInterval' : (function () { return maptalks.Browser.mobile ? -1 : 200; })(),

        'cssFilter' : null,

        'crossOrigin' : null,

        'tileSize' : {
            'width'   : 256,
            'height'  : 256
        },

        'tileSystem' : null,
        'debug'      : false,

        'cacheTiles' : true,

        'keepBuffer' : 0,

        'baseLayerRenderer' : (function () { return maptalks.node ? 'canvas' : 'dom'; })()
    },


    /**
     * Get tile size of the tile layer
     * @return {maptalks.Size}
     */
    getTileSize:function () {
        var size = this.options['tileSize'];
        return new maptalks.Size(size['width'], size['height']);
    },

    /**
     * Clear the layer
     * @return {maptalks.TileLayer} this
     */
    clear:function () {
        if (this._renderer) {
            this._renderer.clear();
        }
        /**
         * clear event, fired when tile layer is cleared.
         *
         * @event maptalks.TileLayer#clear
         * @type {Object}
         * @property {String} type - clear
         * @property {maptalks.TileLayer} target - tile layer
         */
        this.fire('clear');
        return this;
    },

    _initRenderer:function () {
        var renderer = this.options['renderer'];
        if (this.getMap().getBaseLayer() === this) {
            renderer = this.options['baseLayerRenderer'];
            if (this.getMap()._getRenderer()._isCanvasContainer) {
                renderer = 'canvas';
            }
        }
        if (!this.constructor.getRendererClass) {
            return;
        }
        var clazz = this.constructor.getRendererClass(renderer);
        if (!clazz) {
            return;
        }
        this._renderer = new clazz(this);
        this._renderer.setZIndex(this.getZIndex());
        this._switchEvents('on', this._renderer);
    },

    /**
     * initialize [tileConfig]{@link maptalks.TileConfig} for the tilelayer
     * @private
     */
    _initTileConfig:function () {
        var map = this.getMap();
        this._defaultTileConfig = new maptalks.TileConfig(maptalks.TileSystem.getDefault(map.getProjection()), map.getFullExtent(), this.getTileSize());
        if (this.options['tileSystem']) {
            this._tileConfig = new maptalks.TileConfig(this.options['tileSystem'], map.getFullExtent(), this.getTileSize());
        }
    },

    _getTileConfig:function () {
        if (!this._defaultTileConfig) {
            this._initTileConfig();
        }
        var tileConfig = this._tileConfig;
        if (tileConfig) { return tileConfig; }
        var map = this.getMap();
        //inherit baselayer's tileconfig
        if (map && map.getBaseLayer() && map.getBaseLayer()._getTileConfig) {
            return map.getBaseLayer()._getTileConfig();
        }
        return this._defaultTileConfig;
    },

    _getTiles:function () {
        // rendWhenReady = false;
        var map = this.getMap();
        if (!map) {
            return null;
        }
        if (!this.isVisible()) {
            return null;
        }

        var tileConfig = this._getTileConfig();
        if (!tileConfig) { return null; }

        var tileSize = this.getTileSize(),
            zoom = map.getZoom(),
            res = map._getResolution(),
            mapViewPoint = map.offsetPlatform();

        var mapW = map.width,
            mapH = map.height,
            containerCenter = new maptalks.Point(mapW / 2, mapH / 2),
            containerExtent = map.getContainerExtent();

        //中心瓦片信息,包括瓦片编号,和中心点在瓦片上相对左上角的位置
        var centerTile =  tileConfig.getCenterTile(map._getPrjCenter(), res),
         //计算中心瓦片的top和left偏移值
            centerPoint = new maptalks.Point(mapW / 2 - centerTile['offsetLeft'],
                                                mapH / 2 - centerTile['offsetTop']);

        var keepBuffer = this.options['keepBuffer'] || 0;
        //中心瓦片上下左右的瓦片数
        var top = Math.ceil(Math.abs(containerCenter.y - containerExtent['ymin'] - centerTile['offsetTop']) / tileSize['height']) + keepBuffer,
            left = Math.ceil(Math.abs(containerCenter.x - containerExtent['xmin'] - centerTile['offsetLeft']) / tileSize['width']) + keepBuffer,
            bottom = Math.ceil(Math.abs(containerExtent['ymax'] - containerCenter.y + centerTile['offsetTop']) / tileSize['height']) + keepBuffer,
            right = Math.ceil(Math.abs(containerExtent['xmax'] - containerCenter.x + centerTile['offsetLeft']) / tileSize['width']) + keepBuffer;


        centerPoint._substract(mapViewPoint)._round();

        var tiles = [],
            viewExtent = new maptalks.PointExtent(),
            fullExtent = new maptalks.PointExtent();

        for (var i = -(left); i < right; i++) {
            for (var j = -(top); j < bottom; j++) {
                var tileIndex = tileConfig.getNeighorTileIndex(centerTile['y'], centerTile['x'], j, i, res, this.options['repeatWorld']),
                    tileUrl = this._getTileUrl(tileIndex['x'], tileIndex['y'], zoom),
                    tileLeft = centerPoint.x + tileSize['width'] * i,
                    tileTop = centerPoint.y + tileSize['height'] * j,
                    tileId = [tileIndex['y'], tileIndex['x'], zoom, tileLeft, tileTop].join('__'),
                    tileViewPoint = new maptalks.Point(tileLeft, tileTop),
                    tileDesc = {
                        'url' : tileUrl,
                        'viewPoint': tileViewPoint,
                        '2dPoint' : map._viewPointToPoint(tileViewPoint),
                        'id'  : tileId,
                        'zoom' : zoom
                    };
                tiles.push(tileDesc);
                viewExtent = viewExtent.combine(new maptalks.PointExtent(
                        tileDesc['viewPoint'],
                        tileDesc['viewPoint'].add(tileSize['width'], tileSize['height'])
                        )
                    );
                fullExtent = fullExtent.combine(new maptalks.PointExtent(
                        tileDesc['2dPoint'],
                        tileDesc['2dPoint'].add(tileSize['width'], tileSize['height'])
                        )
                    );
            }
        }

        //sort tiles according to tile's distance to center
        tiles.sort(function (a, b) {
            return (b['viewPoint'].distanceTo(centerPoint) - a['viewPoint'].distanceTo(centerPoint));
        });
        return {
            'tiles' : tiles,
            'fullExtent' : fullExtent,
            'viewExtent' : viewExtent
        };
    },

    _getTileUrl:function (x, y, z) {
        if (!this.options['urlTemplate']) {
            return this.options['errorTileUrl'];
        }
        var urlTemplate = this.options['urlTemplate'];
        var domain = '';
        if (this.options['subdomains']) {
            var subdomains = this.options['subdomains'];
            if (maptalks.Util.isArrayHasData(subdomains)) {
                var length = subdomains.length;
                var s = (x + y) % length;
                if (s < 0) {
                    s = 0;
                }
                domain = subdomains[s];
            }
        }
        if (maptalks.Util.isFunction(urlTemplate)) {
            return urlTemplate(x, y, z, domain);
        }
        var data = {
            'x' : x,
            'y' : y,
            'z' : z,
            's' : domain
        };
        return urlTemplate.replace(/\{ *([\w_]+) *\}/g, function (str, key) {
            var value = data[key];

            if (value === undefined) {
                throw new Error('No value provided for variable ' + str);

            } else if (typeof value === 'function') {
                value = value(data);
            }
            return value;
        });
    }
});

/**
 * Export the tile layer's profile json. <br>
 * Layer's profile is a snapshot of the layer in JSON format. <br>
 * It can be used to reproduce the instance by [fromJSON]{@link maptalks.Layer#fromJSON} method
 * @return {Object} layer's profile JSON
 */
maptalks.TileLayer.prototype.toJSON = function () {
    var profile = {
        'type':'TileLayer',
        'id':this.getId(),
        'options' : this.config()
    };
    return profile;
};

/**
 * Reproduce a TileLayer from layer's profile JSON.
 * @param  {Object} layerJSON - layer's profile JSON
 * @return {maptalks.TileLayer}
 * @static
 * @private
 * @function
 */
maptalks.TileLayer.fromJSON = function (layerJSON) {
    if (!layerJSON || layerJSON['type'] !== 'TileLayer') { return null; }
    return new maptalks.TileLayer(layerJSON['id'], layerJSON['options']);
};

maptalks.CanvasTileLayer = maptalks.TileLayer.extend({
});

/**
 * Export the CanvasTileLayer's profile json. <br>
 * Layer's profile is a snapshot of the layer in JSON format. <br>
 * It can be used to reproduce the instance by [fromJSON]{@link maptalks.Layer#fromJSON} method
 * @return {Object} layer's profile JSON
 */
maptalks.CanvasTileLayer.prototype.toJSON = function () {
    var profile = {
        'type':'CanvasTileLayer',
        'id':this.getId(),
        'options' : this.config()
    };
    return profile;
};

/**
 * Reproduce a CanvasTileLayer from layer's profile JSON.
 * @param  {Object} layerJSON - layer's profile JSON
 * @return {maptalks.TileLayer}
 * @static
 * @private
 * @function
 */
maptalks.CanvasTileLayer.fromJSON = function (layerJSON) {
    if (!layerJSON || layerJSON['type'] !== 'CanvasTileLayer') { return null; }
    return new maptalks.CanvasTileLayer(layerJSON['id'], layerJSON['options']);
};

/**
 * @classdesc
 * Base class of all the layers that can add/remove geometries. <br>
 * It is abstract and not intended to be instantiated.
 * @class
 * @category layer
 * @abstract
 * @extends {maptalks.Layer}
 */
maptalks.OverlayLayer = maptalks.Layer.extend(/** @lends maptalks.OverlayLayer.prototype */{

    /**
     * Get a geometry by its id
     * @param  {String|Number} id   - id of the geometry
     * @return {maptalks.Geometry}
     */
    getGeometryById:function (id) {
        if (maptalks.Util.isNil(id) || id === '') {
            return null;
        }
        if (!this._geoMap[id]) {
            return null;
        }
        return this._geoMap[id];
    },

    /**
     * Get all the geometries or the ones filtered if a filter function is provided.
     * @param {Function} [filter=undefined]  - a function to filter the geometries
     * @param {Object} [context=undefined]   - context of the filter function, value to use as this when executing filter.
     * @return {maptalks.Geometry[]}
     */
    getGeometries:function (filter, context) {
        if (!filter) {
            return this._geoList.slice(0);
        }
        var result = [],
            geometry, filtered;
        for (var i = 0, l = this._geoList.length; i < l; i++) {
            geometry = this._geoList[i];
            if (context) {
                filtered = filter.call(context, geometry);
            } else {
                filtered = filter(geometry);
            }
            if (filtered) {
                result.push(geometry);
            }
        }
        return result;
    },

    /**
     * Get the first geometry, the geometry at the bottom.
     * @return {maptalks.Geometry} first geometry
     */
    getFirstGeometry: function () {
        if (this._geoList.length === 0) {
            return null;
        }
        return this._geoList[0];
    },

    /**
     * Get the last geometry, the geometry on the top
     * @return {maptalks.Geometry} last geometry
     */
    getLastGeometry: function () {
        var len = this._geoList.length;
        if (len === 0) {
            return null;
        }
        return this._geoList[len - 1];
    },

    /**
     * Get count of the geometries
     * @return {Number} count
     */
    getCount: function () {
        return this._geoList.length;
    },

    /**
     * Get extent of all the geometries in the layer, return null if the layer is empty.
     * @return {maptalks.Extent} - extent of the layer
     */
    getExtent: function () {
        if (this.getCount() === 0) {
            return null;
        }
        var extent = new maptalks.Extent();
        this.forEach(function (g) {
            extent._combine(g.getExtent());
        });
        return extent;
    },

    /**
     * Executes the provided callback once for each geometry present in the layer in order.
     * @param  {Function} fn - a callback function
     * @param  {*} [context=undefined]   - callback's context, value to use as this when executing callback.
     * @return {maptalks.OverlayLayer} this
     */
    forEach:function (fn, context) {
        var copyOnWrite = this._geoList.slice(0);
        for (var i = 0, l = copyOnWrite.length; i < l; i++) {
            if (!context) {
                fn(copyOnWrite[i], i);
            } else {
                fn.call(context, copyOnWrite[i], i);
            }
        }
        return this;
    },

    /**
     * Creates a GeometryCollection with all the geometries that pass the test implemented by the provided function.
     * @param  {Function} fn      - Function to test each geometry
     * @param  {*} [context=undefined]  - Function's context, value to use as this when executing function.
     * @return {maptalks.GeometryCollection} A GeometryCollection with all the geometries that pass the test
     */
    filter: function (fn, context) {
        var selected = [];
        if (maptalks.Util.isFunction(fn)) {
            if (fn) {
                this.forEach(function (geometry) {
                    if (context ? fn.call(context, geometry) : fn(geometry)) {
                        selected.push(geometry);
                    }
                });
            }
        } else {
            var filter = maptalks.Util.createFilter(fn);
            this.forEach(function (geometry) {
                var g = maptalks.Util.getFilterFeature(geometry);
                if (filter(g)) {
                    selected.push(geometry);
                }
            }, this);
        }
        return selected.length > 0 ? new maptalks.GeometryCollection(selected) : null;
    },

    /**
     * Whether the layer is empty.
     * @return {Boolean}
     */
    isEmpty:function () {
        return this._geoList.length === 0;
    },

    /**
     * Adds one or more geometries to the layer
     * @param {maptalks.Geometry|maptalks.Geometry[]} geometries - one or more geometries
     * @param {Boolean} [fitView=false]  - automatically set the map to a fit center and zoom for the geometries
     * @return {maptalks.OverlayLayer} this
     */
    addGeometry:function (geometries, fitView) {
        if (!geometries) { return this; }
        if (!maptalks.Util.isArray(geometries)) {
            var count = arguments.length;
            var last = arguments[count - 1];
            geometries = Array.prototype.slice.call(arguments, 0, count - 1);
            fitView = last;
            if (last instanceof maptalks.Geometry) {
                geometries.push(last);
                fitView = false;
            }
            return this.addGeometry(geometries, fitView);
        } else if (!maptalks.Util.isArrayHasData(geometries)) {
            return this;
        }
        this._initCache();
        var fitCounter = 0;
        var centerSum = new maptalks.Coordinate(0, 0);
        var extent = null,
            geo, geoId, internalId, geoCenter, geoExtent;
        for (var i = 0, len = geometries.length; i < len; i++) {
            geo = geometries[i];
            if (!geo) {
                throw new Error('Invalid geometry to add to layer(' + this.getId() + ') at index:' + i);
            }
            if (!(geo instanceof maptalks.Geometry)) {
                geo = maptalks.Geometry.fromJSON(geo);
            }
            geoId = geo.getId();
            if (!maptalks.Util.isNil(geoId)) {
                if (!maptalks.Util.isNil(this._geoMap[geoId])) {
                    throw new Error('Duplicate geometry id in layer(' + this.getId() + '):' + geoId + ', at index:' + i);
                }
                this._geoMap[geoId] = geo;
            }
            internalId = maptalks.Util.UID();
            //内部全局唯一的id
            geo._setInternalId(internalId);
            this._geoList.push(geo);


            if (fitView === true) {
                geoCenter = geo.getCenter();
                geoExtent = geo.getExtent();
                if (geoCenter && geoExtent) {
                    centerSum._add(geoCenter);
                    if (extent == null) {
                        extent = geoExtent;
                    } else {
                        extent = extent._combine(geoExtent);
                    }
                    fitCounter++;
                }
            }
            if (this.onAddGeometry) {
                this.onAddGeometry(geo);
            }
            geo._bindLayer(this);
            /**
             * add event.
             *
             * @event maptalks.Geometry#add
             * @type {Object}
             * @property {String} type - add
             * @property {maptalks.Geometry} target - geometry
             * @property {maptalks.Layer} layer - the layer added to.
             */
            geo._fireEvent('add', {'layer':this});
        }
        this._sortGeometries();
        var map = this.getMap();
        if (map) {
            this._getRenderer().onGeometryAdd(geometries);
            if (fitView && extent) {
                var z = map.getFitZoom(extent);
                var center = centerSum._multi(1 / fitCounter);
                map.setCenterAndZoom(center, z);
            }
        }
        /**
         * addgeo event.
         *
         * @event maptalks.OverlayLayer#addgeo
         * @type {Object}
         * @property {String} type - addgeo
         * @property {maptalks.OverlayLayer} target - layer
         * @property {maptalks.Geometry[]} geometries - the geometries to add
         */
        this.fire('addgeo', {'geometries':geometries});
        return this;
    },

    /**
     * Removes one or more geometries from the layer
     * @param  {String|String[]|maptalks.Geometry|maptalks.Geometry[]} geometries - geometry ids or geometries to remove
     * @returns {maptalks.OverlayLayer} this
     */
    removeGeometry:function (geometries) {
        if (!maptalks.Util.isArray(geometries)) {
            return this.removeGeometry([geometries]);
        }
        for (var i = geometries.length - 1; i >= 0; i--) {
            if (!(geometries[i] instanceof maptalks.Geometry)) {
                geometries[i] = this.getGeometryById(geometries[i]);
            }
            if (!geometries[i] || this !== geometries[i].getLayer()) continue;
            geometries[i].remove();
        }
        /**
         * removegeo event.
         *
         * @event maptalks.OverlayLayer#removegeo
         * @type {Object}
         * @property {String} type - removegeo
         * @property {maptalks.OverlayLayer} target - layer
         * @property {maptalks.Geometry[]} geometries - the geometries to remove
         */
        this.fire('removegeo', {'geometries':geometries});
        return this;
    },

    /**
     * Clear all geometries in this layer
     * @returns {maptalks.OverlayLayer} this
     */
    clear:function () {
        this._clearing = true;
        this.forEach(function (geo) {
            geo.remove();
        });
        this._geoMap = {};
        this._geoList = [];
        this._clearing = false;
        /**
         * clear event.
         *
         * @event maptalks.OverlayLayer#clear
         * @type {Object}
         * @property {String} type - clear
         * @property {maptalks.OverlayLayer} target - layer
         */
        this.fire('clear');
        return this;
    },

    /**
     * Called when geometry is being removed to clear the context concerned.
     * @param  {maptalks.Geometry} geometry - the geometry instance to remove
     * @protected
     */
    onRemoveGeometry:function (geometry) {
        if (!geometry) { return; }
        //考察geometry是否属于该图层
        if (this !== geometry.getLayer()) {
            return;
        }
        var internalId = geometry._getInternalId();
        if (maptalks.Util.isNil(internalId)) {
            return;
        }
        var geoId = geometry.getId();
        if (!maptalks.Util.isNil(geoId)) {
            delete this._geoMap[geoId];
        }
        if (!this._clearing) {
            var idx = this._findInList(geometry);
            if (idx >= 0) {
                this._geoList.splice(idx, 1);
            }
        }

        if (this._getRenderer()) {
            this._getRenderer().onGeometryRemove([geometry]);
        }
    },

    hide: function () {
        for (var i = 0, l = this._geoList.length; i < l; i++) {
            this._geoList[i].onHide();
        }
        return maptalks.Layer.prototype.hide.call(this);
    },

    /**
     * Identify the geometries on the given container point
     * @param  {maptalks.Point} point   - container point
     * @param  {Object} [options=null]  - options
     * @param  {Object} [options.count=null] - result count
     * @return {maptalks.Geometry[]} geometries identified
     */
    identify: function (point, options) {
        var geometries = this._geoList,
            filter = options ? options.filter : null,
            extent2d,
            hits = [];
        for (var i = geometries.length - 1; i >= 0; i--) {
            var geo = geometries[i];
            if (!geo || !geo.isVisible() || !geo._getPainter()) {
                continue;
            }
            if (!(geo instanceof maptalks.LineString) || !geo._getArrowStyle()) {
                // Except for LineString with arrows
                extent2d = geo._getPainter().get2DExtent();
                if (!extent2d || !extent2d.contains(point)) {
                    continue;
                }
            }
            if (geo._containsPoint(point) && (!filter || filter(geo))) {
                hits.push(geo);
                if (options['count']) {
                    if (hits.length >= options['count']) {
                        break;
                    }
                }
            }
        }
        return hits;
    },

    _initCache: function () {
        if (!this._geoList) {
            this._geoList = [];
            this._geoMap = {};
        }
    },

    _sortGeometries: function () {
        var me = this;
        this._geoList.sort(function (a, b) {
            return me._compare(a, b);
        });
    },

    _compare: function (a, b) {
        if (a._zIndex === b._zIndex) {
            return a._getInternalId() - b._getInternalId();
        }
        return a._zIndex - b._zIndex;
    },

    //binarySearch
    _findInList: function (geo) {
        var len = this._geoList.length;
        if (len === 0) {
            return -1;
        }
        var low = 0, high = len - 1, middle;
        while (low <= high) {
            middle = Math.floor((low + high) / 2);
            if (this._geoList[middle] === geo) {
                return middle;
            } else if (this._compare(this._geoList[middle], geo) > 0) {
                high = middle - 1;
            } else {
                low = middle + 1;
            }
        }
        return -1;
    },

    _onGeometryEvent: function (param) {
        if (!param || !param['target']) {
            return;
        }
        var type = param['type'];
        if (type === 'idchange') {
            this._onGeometryIdChange(param);
        } else if (type === 'zindexchange') {
            this._onGeometryZIndexChange(param);
        } else if (type === 'positionchange') {
            this._onGeometryPositionChange(param);
        } else if (type === 'shapechange') {
            this._onGeometryShapeChange(param);
        } else if (type === 'symbolchange') {
            this._onGeometrySymbolChange(param);
        } else if (type === 'show') {
            this._onGeometryShow(param);
        } else if (type === 'hide') {
            this._onGeometryHide(param);
        } else if (type === 'propertieschange') {
            this._onGeometryPropertiesChange(param);
        }
    },

    _onGeometryIdChange: function (param) {
        if (param['new'] === param['old']) {
            if (this._geoMap[param['old']] && this._geoMap[param['old']] === param['target']) {
                return;
            }
        }
        if (!maptalks.Util.isNil(param['new'])) {
            if (this._geoMap[param['new']]) {
                throw new Error('Duplicate geometry id in layer(' + this.getId() + '):' + param['new']);
            }
            this._geoMap[param['new']] = param['target'];
        }
        if (!maptalks.Util.isNil(param['old']) && param['new'] !== param['old']) {
            delete this._geoMap[param['old']];
        }

    },

    _onGeometryZIndexChange: function (param) {
        if (param['old'] !== param['new']) {
            this._sortGeometries();
            if (this._getRenderer()) {
                this._getRenderer().onGeometryZIndexChange(param);
            }
        }
    },

    _onGeometryPositionChange: function (param) {
        if (this._getRenderer()) {
            this._getRenderer().onGeometryPositionChange(param);
        }
    },

    _onGeometryShapeChange: function (param) {
        if (this._getRenderer()) {
            this._getRenderer().onGeometryShapeChange(param);
        }
    },

    _onGeometrySymbolChange: function (param) {
        if (this._getRenderer()) {
            this._getRenderer().onGeometrySymbolChange(param);
        }
    },

    _onGeometryShow: function (param) {
        if (this._getRenderer()) {
            this._getRenderer().onGeometryShow(param);
        }
    },

    _onGeometryHide: function (param) {
        if (this._getRenderer()) {
            this._getRenderer().onGeometryHide(param);
        }
    },

    _onGeometryPropertiesChange: function (param) {
        if (this._getRenderer()) {
            this._getRenderer().onGeometryPropertiesChange(param);
        }
    }
});

maptalks.OverlayLayer.addInitHook(function () {
    this._initCache();
});

/**
 * @classdesc
 * A layer for managing and rendering geometries.
 * @class
 * @category layer
 * @extends {maptalks.OverlayLayer}
 * @param {String|Number} id - layer's id
 * @param {maptalks.Geometry|maptalks.Geometry[]} [geometries=null] - geometries to add
 * @param {Object}  [options=null]          - construct options
 * @param {Object}  [options.style=null]    - vectorlayer's style
 * @param {*}  [options.*=null]             - options defined in [maptalks.VectorLayer]{@link maptalks.VectorLayer#options}
 */
maptalks.VectorLayer = maptalks.OverlayLayer.extend(/** @lends maptalks.VectorLayer.prototype */{
    /**
     * @property {Object}  options - VectorLayer's options
     * @property {Boolean} options.debug=false           - whether the geometries on the layer is in debug mode.
     * @property {Boolean} options.enableSimplify=true   - whether to simplify geometries before rendering.
     * @property {String}  options.cursor=default        - the cursor style of the layer
     * @property {Boolean} options.geometryEvents=true   - enable/disable firing geometry events
     * @property {Number}  options.thresholdOfTransforming=50 - threshold of geometry count to update while transforming.
     * @property {Boolean} options.defaultIconSize=[20, 20] - default size of a marker's icon
     * @property {Boolean} [options.cacheVectorOnCanvas=true] - whether to cache vector markers on a canvas, this will improve performance.
     */
    options:{
        'debug'                     : false,
        'enableSimplify'            : true,
        'cursor'                    : 'pointer',
        'geometryEvents'            : true,
        'thresholdOfTransforming'    : 150,
        'defaultIconSize'           : [20, 20],
        'cacheVectorOnCanvas'       : true,
        'cacheSvgOnCanvas'          : false
    },

    initialize:function (id, geometries, opts) {
        if (geometries && (!(geometries instanceof maptalks.Geometry) && !(maptalks.Util.isArray(geometries)))) {
            opts = geometries;
            geometries = null;
        }
        var options = maptalks.Util.extend({}, opts);
        if (options['style']) {
            this.setStyle(options['style']);
            delete options['style'];
        }
        maptalks.Layer.prototype.initialize.call(this, id, options);
        if (geometries) {
            this.addGeometry(geometries);
        }
    },

    /**
     * Gets layer's style.
     * @return {Object|Object[]} layer's style
     */
    getStyle: function () {
        if (!this._style) {
            return null;
        }
        return this._style;
    },

    /**
     * Sets style to the layer, styling the geometries satisfying the condition with style's symbol
     *
     * @param {Object|Object[]} style - layer's style
     * @returns {maptalks.VectorLayer} this
     * @fires maptalks.VectorLayer#setstyle
     * @example
     * layer.setStyle([
        {
          'filter': ['==', 'count', 100],
          'symbol': {'markerFile' : 'foo1.png'}
        },
        {
          'filter': ['==', 'count', 200],
          'symbol': {'markerFile' : 'foo2.png'}
        }
      ]);
     */
    setStyle: function (style) {
        this._style = style;
        this._cookedStyles = maptalks.Util.compileStyle(style);
        this.forEach(function (geometry) {
            this._styleGeometry(geometry);
        }, this);
        /**
         * setstyle event.
         *
         * @event maptalks.VectorLayer#setstyle
         * @type {Object}
         * @property {String} type - setstyle
         * @property {maptalks.VectorLayer} target - layer
         * @property {Object|Object[]}       style - style to set
         */
        this.fire('setstyle', {'style' : style});
        return this;
    },

    /**
     * Removes layers' style
     * @returns {maptalks.VectorLayer} this
     * @fires maptalks.VectorLayer#removestyle
     */
    removeStyle: function () {
        if (!this._style) {
            return this;
        }
        delete this._style;
        delete this._cookedStyles;
        this.forEach(function (geometry) {
            geometry._setExternSymbol(null);
        }, this);
        /**
         * removestyle event.
         *
         * @event maptalks.VectorLayer#removestyle
         * @type {Object}
         * @property {String} type - removestyle
         * @property {maptalks.VectorLayer} target - layer
         */
        this.fire('removestyle');
        return this;
    },

    onAddGeometry: function (geo) {
        var style = this.getStyle();
        if (style) {
            this._styleGeometry(geo);
        }
    },

    _styleGeometry: function (geometry) {
        if (!this._cookedStyles) {
            return false;
        }
        var g = maptalks.Util.getFilterFeature(geometry);
        for (var i = 0, len = this._cookedStyles.length; i < len; i++) {
            if (this._cookedStyles[i]['filter'](g) === true) {
                geometry._setExternSymbol(this._cookedStyles[i]['symbol']);
                return true;
            }
        }
        return false;
    },

    /**
     * Export the vector layer's profile json. <br>
     * @param  {Object} [options=null] - export options
     * @param  {Object} [options.geometries=null] - If not null and the layer is a [OverlayerLayer]{@link maptalks.OverlayLayer},
     *                                            the layer's geometries will be exported with the given "options.geometries" as a parameter of geometry's toJSON.
     * @param  {maptalks.Extent} [options.clipExtent=null] - if set, only the geometries intersectes with the extent will be exported.
     * @return {Object} layer's profile JSON
     */
    toJSON: function (options) {
        if (!options) {
            options = {};
        }
        var profile = {
            'type'    : 'VectorLayer',
            'id'      : this.getId(),
            'options' : this.config()
        };
        if ((maptalks.Util.isNil(options['style']) || options['style']) && this.getStyle()) {
            profile['style'] = this.getStyle();
        }
        if (maptalks.Util.isNil(options['geometries']) || options['geometries']) {
            var clipExtent;
            if (options['clipExtent']) {
                clipExtent = new maptalks.Extent(options['clipExtent']);
            }
            var geoJSONs = [];
            var geometries = this.getGeometries(),
                geoExt,
                json;
            for (var i = 0, len = geometries.length; i < len; i++) {
                geoExt = geometries[i].getExtent();
                if (!geoExt || (clipExtent && !clipExtent.intersects(geoExt))) {
                    continue;
                }
                json = geometries[i].toJSON(options['geometries']);
                if (json['symbol'] && this.getStyle()) {
                    json['symbol'] = geometries[i]._symbolBeforeStyle ? maptalks.Util.extend({}, geometries[i]._symbolBeforeStyle) : null;
                }
                geoJSONs.push(json);
            }
            profile['geometries'] = geoJSONs;
        }
        return profile;
    }
});



/**
 * Reproduce a VectorLayer from layer's profile JSON.
 * @param  {Object} layerJSON - layer's profile JSON
 * @return {maptalks.VectorLayer}
 * @static
 * @private
 * @function
 */
maptalks.VectorLayer.fromJSON = function (profile) {
    if (!profile || profile['type'] !== 'VectorLayer') { return null; }
    var layer = new maptalks.VectorLayer(profile['id'], profile['options']);
    var geoJSONs = profile['geometries'];
    var geometries = [],
        geo;
    for (var i = 0; i < geoJSONs.length; i++) {
        geo = maptalks.Geometry.fromJSON(geoJSONs[i]);
        if (geo) {
            geometries.push(geo);
        }
    }
    layer.addGeometry(geometries);
    if (profile['style']) {
        layer.setStyle(profile['style']);
    }
    return layer;
};

/**
 * @classdesc
 * Base class for all the geometries, it is not intended to be instantiated but extended. <br/>
 * It defines common methods that all the geometry classes share. <br>
 * It is abstract and not intended to be instantiated.
 *
 * @class
 * @category geometry
 * @abstract
 * @extends maptalks.Class
 * @mixes maptalks.Eventable
 * @mixes maptalks.Handlerable
 * @mixes maptalks.ui.Menu.Mixin
 */
maptalks.Geometry = maptalks.Class.extend(/** @lends maptalks.Geometry.prototype */{
    includes: [maptalks.Eventable, maptalks.Handlerable],

    /** @lends maptalks.Geometry */
    statics:{
        /**
         * Type of [Point]{@link http://geojson.org/geojson-spec.html#point}
         * @constant
         */
        'TYPE_POINT' : 'Point',
        /**
         * Type of [LineString]{@link http://geojson.org/geojson-spec.html#linestring}
         * @constant
         */
        'TYPE_LINESTRING' : 'LineString',
        /**
         * Type of [Polygon]{@link http://geojson.org/geojson-spec.html#polygon}
         * @constant
         */
        'TYPE_POLYGON' : 'Polygon',
        /**
         * Type of [MultiPoint]{@link http://geojson.org/geojson-spec.html#multipoint}
         * @constant
         */
        'TYPE_MULTIPOINT' : 'MultiPoint',
        /**
         * Type of [MultiLineString]{@link http://geojson.org/geojson-spec.html#multilinestring}
         * @constant
         */
        'TYPE_MULTILINESTRING' : 'MultiLineString',
        /**
         * Type of [MultiPolygon]{@link http://geojson.org/geojson-spec.html#multipolygon}
         * @constant
         */
        'TYPE_MULTIPOLYGON' : 'MultiPolygon',
        /**
         * Type of [GeometryCollection]{@link http://geojson.org/geojson-spec.html#geometrycollection}
         * @constant
         */
        'TYPE_GEOMETRYCOLLECTION' : 'GeometryCollection'
    },

    /**
     * @property {Object} options                       - geometry options
     * @property {Boolean} [options.id=null]            - id of the geometry
     * @property {Boolean} [options.visible=true]       - whether the geometry is visible.
     * @property {Boolean} [options.editable=true]      - whether the geometry can be edited.
     * @property {String} [options.cursor=null]         - cursor style when mouseover the geometry, same as the definition in CSS.
     * @property {Number} [options.shadowBlur=0]        - level of the shadow around the geometry, see [MDN's explanation]{@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/shadowBlur}
     * @property {String} [options.shadowColor=black]   - color of the shadow around the geometry, a CSS style color
     * @property {String} [options.measure=EPSG:4326]   - the measure code for the geometry, defines {@tutorial measureGeometry how it can be measured}.
     * @property {Boolean} [options.draggable=false]    - whether the geometry can be dragged.
     * @property {Boolean} [options.dragShadow=false]   - if true, during geometry dragging, a shadow will be dragged before geometry was moved.
     * @property {Boolean} [options.dragOnAxis=null]    - if set, geometry can only be dragged along the specified axis, possible values: x, y
     */
    options:{
        'id'        : null,
        'visible'   : true,
        'editable'  : true,
        'cursor'    : null,
        'shadowBlur' : 0,
        'shadowColor' : 'black',
        'measure' : 'EPSG:4326' // BAIDU, IDENTITY
    },

    /**
     * Returns the first coordinate of the geometry.
     *
     * @return {maptalks.Coordinate} First Coordinate
     */
    getFirstCoordinate:function () {
        if (this instanceof maptalks.GeometryCollection) {
            var geometries = this.getGeometries();
            if (!geometries || !maptalks.Util.isArrayHasData(geometries)) {
                return null;
            }
            return geometries[0].getFirstCoordinate();
        }
        var coordinates = this.getCoordinates();
        if (!maptalks.Util.isArray(coordinates)) {
            return coordinates;
        }
        var first = coordinates;
        do {
            first = first[0];
        } while (maptalks.Util.isArray(first));
        return first;
    },

    /**
     * Returns the last coordinate of the geometry.
     *
     * @return {maptalks.Coordinate} Last Coordinate
     */
    getLastCoordinate:function () {
        if (this instanceof maptalks.GeometryCollection) {
            var geometries = this.getGeometries();
            if (!geometries || !maptalks.Util.isArrayHasData(geometries)) {
                return null;
            }
            return geometries[geometries.length - 1].getLastCoordinate();
        }
        var coordinates = this.getCoordinates();
        if (!maptalks.Util.isArray(coordinates)) {
            return coordinates;
        }
        var last = coordinates;
        do {
            last = last[last.length - 1];
        } while (maptalks.Util.isArray(last));
        return last;
    },

    /**
     * Adds the geometry to a layer
     * @param {maptalks.Layer} layer    - layer add to
     * @param {Boolean} [fitview=false] - automatically set the map to a fit center and zoom for the geometry
     * @return {maptalks.Geometry} this
     * @fires maptalks.Geometry#add
     */
    addTo:function (layer, fitview) {
        layer.addGeometry(this, fitview);
        return this;
    },

    /**
     * Get the layer which this geometry added to.
     * @returns {maptalks.Layer} - layer added to
     */
    getLayer:function () {
        if (!this._layer) { return null; }
        return this._layer;
    },

    /**
     * Get the map which this geometry added to
     * @returns {maptalks.Map} - map added to
     */
    getMap:function () {
        if (!this._layer) { return null; }
        return this._layer.getMap();
    },

    /**
     * Gets geometry's id. Id is set by setId or constructor options.
     * @returns {String|Number} geometry的id
     */
    getId:function () {
        return this._id;
    },

    /**
     * Set geometry's id.
     * @param {String} id - new id
     * @returns {maptalks.Geometry} this
     * @fires maptalks.Geometry#idchange
     */
    setId:function (id) {
        var oldId = this.getId();
        this._id = id;
        /**
         * idchange event.
         *
         * @event maptalks.Geometry#idchange
         * @type {Object}
         * @property {String} type - idchange
         * @property {maptalks.Geometry} target - the geometry fires the event
         * @property {String|Number} old        - value of the old id
         * @property {String|Number} new        - value of the new id
         */
        this._fireEvent('idchange', {'old':oldId, 'new':id});
        return this;
    },

    /**
     * Get geometry's properties. Defined by GeoJSON as [feature's properties]{@link http://geojson.org/geojson-spec.html#feature-objects}.
     *
     * @returns {Object} properties
     */
    getProperties:function () {
        if (!this.properties) {
            if (this._getParent()) {
                return this._getParent().getProperties();
            }
            return null;
        }
        return this.properties;
    },

    /**
     * Set a new properties to geometry.
     * @param {Object} properties - new properties
     * @returns {maptalks.Geometry} this
     * @fires maptalks.Geometry#propertieschange
     */
    setProperties:function (properties) {
        var old = this.properties;
        this.properties = maptalks.Util.isObject(properties) ? maptalks.Util.extend({}, properties) : properties;
        /**
         * propertieschange event, thrown when geometry's properties is changed.
         *
         * @event maptalks.Geometry#propertieschange
         * @type {Object}
         * @property {String} type - propertieschange
         * @property {maptalks.Geometry} target - the geometry fires the event
         * @property {String|Number} old        - value of the old properties
         * @property {String|Number} new        - value of the new properties
         */
        this._fireEvent('propertieschange', {'old':old, 'new':properties});
        return this;
    },

    /**
     * Get type of the geometry, e.g. "Point", "LineString"
     * @returns {String} type of the geometry
     */
    getType:function () {
        return this.type;
    },


    /**
     * Get symbol of the geometry
     * @returns {Object} geometry's symbol
     */
    getSymbol:function () {
        var s = this._symbol;
        if (s) {
            if (!maptalks.Util.isArray(s)) {
                return maptalks.Util.extend({}, s);
            } else {
                return maptalks.Util.extendSymbol(s);
            }
        }
        return null;
    },

    /**
     * Set a new symbol to style the geometry.
     * @param {Object} symbol - new symbol
     * @see {@tutorial symbol Style a geometry with symbols}
     * @return {maptalks.Geometry} this
     * @fires maptalks.Geometry#symbolchange
     */
    setSymbol:function (symbol) {
        this._symbol = this._prepareSymbol(symbol);
        this.onSymbolChanged();
        return this;
    },

    /**
     * Update geometry's current symbol.
     *
     * @param  {Object} props - symbol properties to update
     * @return {maptalks.Geometry} this
     * @fires maptalks.Geometry#symbolchange
     * @example
     * var marker = new maptalks.Marker([0, 0], {
     *    symbol : {
     *       markerType : 'ellipse',
     *       markerWidth : 20,
     *       markerHeight : 30
     *    }
     * });
     * // update symbol's markerWidth to 40
     * marker.updateSymbol({
     *     markerWidth : 40
     * });
     */
    updateSymbol: function (props) {
        if (!props) {
            return this;
        }
        var s = this.getSymbol();
        if (s) {
            s = maptalks.Util.extendSymbol(s, props);
        } else {
            s = maptalks.Util.extendSymbol(this._getInternalSymbol(), props);
        }
        return this.setSymbol(s);
    },

    /**
     * Get the geographical center of the geometry.
     *
     * @returns {maptalks.Coordinate}
     */
    getCenter:function () {
        return this._computeCenter(this._getMeasurer()).copy();
    },

    /**
     * Get the geometry's geographical extent
     *
     * @returns {maptalks.Extent} geometry's extent
     */
    getExtent:function () {
        var prjExt = this._getPrjExtent();
        if (prjExt) {
            var p = this._getProjection();
            return new maptalks.Extent(p.unproject(new maptalks.Coordinate(prjExt['xmin'], prjExt['ymin'])), p.unproject(new maptalks.Coordinate(prjExt['xmax'], prjExt['ymax'])));
        } else {
            return this._computeExtent(this._getMeasurer());
        }
    },

    /**
     * Get pixel size of the geometry, which may vary in different zoom levels.
     *
     * @returns {maptalks.Size}
     */
    getSize: function () {
        var map = this.getMap();
        if (!map) {
            return null;
        }
        var pxExtent = this._getPainter().get2DExtent();
        return pxExtent.getSize();
    },

    /**
     * Whehter the geometry contains the input container point.
     *
     * @param  {maptalks.Point|maptalks.Coordinate} point - input container point or coordinate
     * @param  {Number} [t=undefined] - tolerance in pixel
     * @return {Boolean}
     * @example
     * var circle = new maptalks.Circle([0, 0], 1000)
     *     .addTo(layer);
     * var contains = circle.containsPoint([400, 300]);
     */
    containsPoint: function (containerPoint, t) {
        if (!this.getMap()) {
            throw new Error('The geometry is required to be added on a map to perform "containsPoint".');
        }
        if (containerPoint instanceof maptalks.Coordinate) {
            containerPoint = this.getMap().coordinateToContainerPoint(containerPoint);
        }
        return this._containsPoint(this.getMap()._containerPointToPoint(new maptalks.Point(containerPoint)), t);
    },

    /**
     * Show the geometry.
     *
     * @return {maptalks.Geometry} this
     * @fires maptalks.Geometry#show
     */
    show:function () {
        this.options['visible'] = true;
        if (this.getMap()) {
            var painter = this._getPainter();
            if (painter) {
                painter.show();
            }
            /**
             * show event
             *
             * @event maptalks.Geometry#show
             * @type {Object}
             * @property {String} type - show
             * @property {maptalks.Geometry} target - the geometry fires the event
             */
            this._fireEvent('show');
        }
        return this;
    },

    /**
     * Hide the geometry
     *
     * @return {maptalks.Geometry} this
     * @fires maptalks.Geometry#hide
     */
    hide:function () {
        this.options['visible'] = false;
        if (this.getMap()) {
            this.onHide();
            var painter = this._getPainter();
            if (painter) {
                painter.hide();
            }
            /**
             * hide event
             *
             * @event maptalks.Geometry#hide
             * @type {Object}
             * @property {String} type - hide
             * @property {maptalks.Geometry} target - the geometry fires the event
             */
            this._fireEvent('hide');
        }
        return this;
    },

    /**
     * Whether the geometry is visible
     *
     * @returns {Boolean}
     */
    isVisible:function () {
        if (!this.options['visible']) {
            return false;
        }
        var symbol = this._getInternalSymbol();
        if (!symbol) {
            return true;
        }
        if (maptalks.Util.isArray(symbol)) {
            if (symbol.length === 0) {
                return true;
            }
            for (var i = 0, len = symbol.length; i < len; i++) {
                if (maptalks.Util.isNil(symbol[i]['opacity']) || symbol[i]['opacity'] > 0) {
                    return true;
                }
            }
            return false;
        } else {
            return (maptalks.Util.isNil(symbol['opacity']) || (maptalks.Util.isNumber(symbol['opacity']) && symbol['opacity'] > 0));
        }
    },

    /**
     * Get zIndex of the geometry, default is 0
     * @return {Number} zIndex
     */
    getZIndex: function () {
        return this._zIndex;
    },

    /**
     * Set a new zIndex to Geometry and fire zindexchange event (will cause layer to sort geometries and render)
     * @param {Number} zIndex - new zIndex
     * @return {maptalks.Geometry} this
     * @fires maptalks.Geometry#zindexchange
     */
    setZIndex: function (zIndex) {
        var old = this._zIndex;
        this._zIndex = zIndex;
        /**
         * zindexchange event, fired when geometry's zIndex is changed.
         *
         * @event maptalks.Geometry#zindexchange
         * @type {Object}
         * @property {String} type - zindexchange
         * @property {maptalks.Geometry} target - the geometry fires the event
         * @property {Number} old        - old zIndex
         * @property {Number} new        - new zIndex
         */
        this._fireEvent('zindexchange', {'old':old, 'new':zIndex});
        return this;
    },

    /**
     * Only set a new zIndex to Geometry without firing zindexchange event. <br>
     * Can be useful to improve perf when a lot of geometries' zIndex need to be updated. <br>
     * When updated N geometries, You can use setZIndexSilently with (N-1) geometries and use setZIndex with the last geometry for layer to sort and render.
     * @param {Number} zIndex - new zIndex
     * @return {maptalks.Geometry} this
     */
    setZIndexSilently: function (zIndex) {
        this._zIndex = zIndex;
        return this;
    },

    /**
     * Bring the geometry on the top
     * @return {maptalks.Geometry} this
     * @fires maptalks.Geometry#zindexchange
     */
    bringToFront: function () {
        var layer = this.getLayer();
        if (!layer || !(layer instanceof maptalks.OverlayLayer)) {
            return this;
        }
        var topZ = layer.getLastGeometry().getZIndex();
        this.setZIndex(topZ + 1);
        return this;
    },

    /**
     * Bring the geometry to the back
     * @return {maptalks.Geometry} this
     * @fires maptalks.Geometry#zindexchange
     */
    bringToBack: function () {
        var layer = this.getLayer();
        if (!layer || !(layer instanceof maptalks.OverlayLayer)) {
            return this;
        }
        var bottomZ = layer.getFirstGeometry().getZIndex();
        this.setZIndex(bottomZ - 1);
        return this;
    },

    /**
     * Translate or move the geometry by the given offset.
     *
     * @param  {maptalks.Coordinate} offset - translate offset
     * @return {maptalks.Geometry} this
     * @fires maptalks.Geometry#positionchange
     * @fires maptalks.Geometry#shapechange
     */
    translate:function (offset) {
        if (!offset) {
            return this;
        }
        offset = new maptalks.Coordinate(offset);
        if (offset.x === 0 && offset.y === 0) {
            return this;
        }
        var coordinates = this.getCoordinates();
        if (coordinates) {
            if (maptalks.Util.isArray(coordinates)) {
                var translated = maptalks.Util.mapArrayRecursively(coordinates, function (coord) {
                    return coord.add(offset);
                });
                this.setCoordinates(translated);
            } else {
                this.setCoordinates(coordinates.add(offset));
            }
        }
        return this;
    },

    /**
     * Flash the geometry, show and hide by certain internal for times of count.
     *
     * @param {Number} [interval=100]     - interval of flash, in millisecond (ms)
     * @param {Number} [count=4]          - flash times
     * @param {Function} [cb=null]        - callback function when flash ended
     * @param {*} [context=null]          - callback context
     * @return {maptalks.Geometry} this
     */
    flash: function (interval, count, cb, context) {
        if (!interval) {
            interval = 100;
        }
        if (!count) {
            count = 4;
        }
        var me = this;
        count *= 2;
        if (this._flashTimeout) {
            clearTimeout(this._flashTimeout);
        }
        function flashGeo() {
            if (count === 0) {
                me.show();
                if (cb) {
                    if (context) {
                        cb.call(context);
                    } else {
                        cb();
                    }
                }
                return;
            }

            if (count % 2 === 0) {
                me.hide();
            } else {
                me.show();
            }
            count--;
            me._flashTimeout = setTimeout(flashGeo, interval);
        }
        this._flashTimeout = setTimeout(flashGeo, interval);
        return this;
    },

    /**
     * Returns a copy of the geometry without the event listeners.
     * @returns {maptalks.Geometry} copy
     */
    copy:function () {
        var json = this.toJSON();
        var ret = maptalks.Geometry.fromJSON(json);
        //restore visibility
        ret.options['visible'] = true;
        return ret;
    },


    /**
     * remove itself from the layer if any.
     * @returns {maptalks.Geometry} this
     * @fires maptalks.Geometry#removestart
     * @fires maptalks.Geometry#remove
     */
    remove:function () {
        var layer = this.getLayer();
        if (!layer) {
            return this;
        }
        /**
         * removestart event.
         *
         * @event maptalks.Geometry#removestart
         * @type {Object}
         * @property {String} type - removestart
         * @property {maptalks.Geometry} target - the geometry fires the event
         */
        this._fireEvent('removestart');

        this._unbind();
        /**
         * removeend event.
         *
         * @event maptalks.Geometry#removeend
         * @type {Object}
         * @property {String} type - removeend
         * @property {maptalks.Geometry} target - the geometry fires the event
         */
        this._fireEvent('removeend');
        /**
         * remove event.
         *
         * @event maptalks.Geometry#remove
         * @type {Object}
         * @property {String} type - remove
         * @property {maptalks.Geometry} target - the geometry fires the event
         */
        this._fireEvent('remove');
        return this;
    },

    /**
     * Exports [geometry]{@link http://geojson.org/geojson-spec.html#feature-objects} out of a GeoJSON feature.
     * @return {Object} GeoJSON Geometry
     */
    toGeoJSONGeometry:function () {
        var gJson = this._exportGeoJSONGeometry();
        return gJson;
    },

    /**
     * Exports a GeoJSON feature.
     * @param {Object} [opts=null]              - export options
     * @param {Boolean} [opts.geometry=true]    - whether export geometry
     * @param {Boolean} [opts.properties=true]  - whether export properties
     * @returns {Object} GeoJSON Feature
     */
    toGeoJSON:function (opts) {
        if (!opts) {
            opts = {};
        }
        var feature = {
            'type':'Feature',
            'geometry':null
        };
        if (maptalks.Util.isNil(opts['geometry']) || opts['geometry']) {
            var geoJSON = this._exportGeoJSONGeometry();
            feature['geometry'] = geoJSON;
        }
        var id = this.getId();
        if (!maptalks.Util.isNil(id)) {
            feature['id'] = id;
        }
        var properties;
        if (maptalks.Util.isNil(opts['properties']) || opts['properties']) {
            properties = this._exportProperties();
        }
        feature['properties'] = properties;
        return feature;
    },

    /**
     * Export a profile json out of the geometry. <br>
     * Besides exporting the feature object, a profile json also contains symbol, construct options and infowindow info.<br>
     * The profile json can be stored somewhere else and be used to reproduce the geometry later.<br>
     * Due to the problem of serialization for functions, event listeners and contextmenu are not included in profile json.
     * @example
     *     // an example of a profile json.
     * var profile = {
            "feature": {
                  "type": "Feature",
                  "id" : "point1",
                  "geometry": {"type": "Point", "coordinates": [102.0, 0.5]},
                  "properties": {"prop0": "value0"}
            },
            //construct options.
            "options":{
                "draggable" : true
            },
            //symbol
            "symbol":{
                "markerFile"  : "http://foo.com/icon.png",
                "markerWidth" : 20,
                "markerHeight": 20
            },
            //infowindow info
            "infowindow" : {
                "options" : {
                    "style" : "black"
                },
                "title" : "this is a infowindow title",
                "content" : "this is a infowindow content"
            }
        };
     * @param {Object}  [options=null]          - export options
     * @param {Boolean} [opts.geometry=true]    - whether export feature's geometry
     * @param {Boolean} [opts.properties=true]  - whether export feature's properties
     * @param {Boolean} [opts.options=true]     - whether export construct options
     * @param {Boolean} [opts.symbol=true]      - whether export symbol
     * @param {Boolean} [opts.infoWindow=true]  - whether export infowindow
     * @return {Object} profile json object
     */
    toJSON:function (options) {
        //一个Graphic的profile
        /*
            //因为响应函数无法被序列化, 所以menu, 事件listener等无法被包含在graphic中
        }*/
        if (!options) {
            options = {};
        }
        var json = this._toJSON(options);
        var other = this._exportGraphicOptions(options);
        maptalks.Util.extend(json, other);
        return json;
    },

    /**
     * Get the geographic length of the geometry.
     * @returns {Number} geographic length, unit is meter
     */
    getLength:function () {
        return this._computeGeodesicLength(this._getMeasurer());
    },

    /**
     * Get the geographic area of the geometry.
     * @returns {Number} geographic area, unit is sq.meter
     */
    getArea:function () {
        return this._computeGeodesicArea(this._getMeasurer());
    },

    /**
     * Get the connect points for [ConnectorLine]{@link maptalks.ConnectorLine}
     * @return {maptalks.Coordinate[]} connect points
     * @private
     */
    _getConnectPoints: function () {
        return [this.getCenter()];
    },

    //options initializing
    _initOptions:function (opts) {
        if (!opts) {
            opts = {};
        }
        var symbol = opts['symbol'];
        var properties = opts['properties'];
        var id = opts['id'];
        maptalks.Util.setOptions(this, opts);
        delete this.options['symbol'];
        delete this.options['id'];
        delete this.options['properties'];
        if (symbol) {
            this.setSymbol(symbol);
        }
        if (properties) {
            this.setProperties(properties);
        }
        if (!maptalks.Util.isNil(id)) {
            this.setId(id);
        }
        this._zIndex = 0;
    },

    //bind the geometry to a layer
    _bindLayer:function (layer) {
        //check dupliaction
        if (this.getLayer()) {
            throw new Error('Geometry cannot be added to two or more layers at the same time.');
        }
        this._layer = layer;
        this._clearProjection();
        // this.callInitHooks();
    },

    _prepareSymbol:function (symbol) {
        if (maptalks.Util.isArray(symbol)) {
            var cookedSymbols = [];
            for (var i = 0; i < symbol.length; i++) {
                cookedSymbols.push(maptalks.Util.convertResourceUrl(maptalks.Util.extend({}, symbol[i])));
            }
            return cookedSymbols;
        } else if (symbol) {
            symbol = maptalks.Util.extend({}, symbol);
            return maptalks.Util.convertResourceUrl(symbol);
        }
        return null;
    },

    /**
     * Sets a external symbol to the geometry, e.g. style from VectorLayer's setStyle
     * @private
     * @param {Object} symbol - external symbol
     */
    _setExternSymbol: function (symbol) {
        this._externSymbol = this._prepareSymbol(symbol);
        this.onSymbolChanged();
        return this;
    },

    _getInternalSymbol:function () {
        if (this._symbol) {
            return this._symbol;
        } else if (this._externSymbol) {
            return this._externSymbol;
        } else if (this.options['symbol']) {
            return this.options['symbol'];
        }
        return null;
    },


    _getPrjExtent:function () {
        var p = this._getProjection();
        if (!this._extent && p) {
            var ext = this._computeExtent(p);
            if (ext) {
                var isAntiMeridian = this.options['antiMeridian'] && maptalks.MeasurerUtil.isSphere(p);
                if (isAntiMeridian && isAntiMeridian !== 'default') {
                    var firstCoordinate = this.getFirstCoordinate();
                    if (isAntiMeridian === 'continuous') {
                        if (ext['xmax'] - ext['xmin'] > 180) {
                            if (firstCoordinate.x > 0) {
                                ext['xmin'] += 360;
                            } else {
                                ext['xmax'] -= 360;
                            }
                        }
                    }
                    if (ext['xmax'] < ext['xmin']) {
                        var tmp = ext['xmax'];
                        ext['xmax'] = ext['xmin'];
                        ext['xmin'] = tmp;
                    }
                }
                this._extent = new maptalks.Extent(p.project(new maptalks.Coordinate(ext['xmin'], ext['ymin'])),
                    p.project(new maptalks.Coordinate(ext['xmax'], ext['ymax'])));
            }

        }
        return this._extent;
    },

    _unbind:function () {
        var layer = this.getLayer();
        if (!layer) {
            return;
        }

        if (this._animPlayer) {
            this._animPlayer.finish();
            return;
        }

        //contextmenu
        this._unbindMenu();
        //infowindow
        this._unbindInfoWindow();

        if (this.isEditing()) {
            this.endEdit();
        }
        this._removePainter();
        if (this.onRemove) {
            this.onRemove();
        }
        if (layer.onRemoveGeometry) {
            layer.onRemoveGeometry(this);
        }
        delete this._layer;
        delete this._internalId;
        delete this._extent;
    },

    _getInternalId:function () {
        return this._internalId;
    },

    //只能被图层调用
    _setInternalId:function (id) {
        this._internalId = id;
    },

    _getMeasurer:function () {
        if (this._getProjection()) {
            return this._getProjection();
        }
        return maptalks.MeasurerUtil.getInstance(this.options['measure']);
    },

    _getProjection:function () {
        var map = this.getMap();
        if (map && map.getProjection()) {
            return map.getProjection();
        }
        return null;
    },

    //获取geometry样式中依赖的外部图片资源
    _getExternalResources:function () {
        var geometry = this;
        var symbol = geometry._getInternalSymbol();
        var resources = maptalks.Util.getExternalResources(symbol);
        return resources;
    },

    _getPainter:function () {
        if (!this._painter && this.getMap()) {
            if (this instanceof maptalks.GeometryCollection) {
                this._painter = new maptalks.CollectionPainter(this);
            } else {
                this._painter = new maptalks.Painter(this);
            }
        }
        return this._painter;
    },

    _removePainter:function () {
        if (this._painter) {
            this._painter.remove();
        }
        delete this._painter;
    },

    onHide: function () {
        this.closeMenu();
        this.closeInfoWindow();
    },

    onZoomEnd:function () {
        if (this._painter) {
            this._painter.onZoomEnd();
        }
    },

    onShapeChanged:function () {
        this._extent = null;
        var painter = this._getPainter();
        if (painter) {
            painter.repaint();
        }
        /**
         * shapechange event.
         *
         * @event maptalks.Geometry#shapechange
         * @type {Object}
         * @property {String} type - shapechange
         * @property {maptalks.Geometry} target - the geometry fires the event
         */
        this._fireEvent('shapechange');
    },

    onPositionChanged:function () {
        this._extent = null;
        var painter = this._getPainter();
        if (painter) {
            painter.repaint();
        }
        /**
         * positionchange event.
         *
         * @event maptalks.Geometry#positionchange
         * @type {Object}
         * @property {String} type - positionchange
         * @property {maptalks.Geometry} target - the geometry fires the event
         */
        this._fireEvent('positionchange');
    },

    onSymbolChanged:function () {
        var painter = this._getPainter();
        if (painter) {
            painter.refreshSymbol();
        }
        /**
         * symbolchange event.
         *
         * @event maptalks.Geometry#symbolchange
         * @type {Object}
         * @property {String} type - symbolchange
         * @property {maptalks.Geometry} target - the geometry fires the event
         */
        this._fireEvent('symbolchange');
    },

    onConfig: function (conf) {
        var needRepaint = false;
        for (var p in conf) {
            if (conf.hasOwnProperty(p)) {
                var prefix = p.slice(0, 5);
                if (prefix === 'arrow' || prefix === 'shado') {
                    needRepaint = true;
                    break;
                }
            }
        }
        if (needRepaint) {
            this.onShapeChanged();
        }
    },

    /**
     * Set a parent to the geometry, which is usually a MultiPolygon, GeometryCollection, etc
     * @param {maptalks.GeometryCollection} geometry - parent geometry
     * @private
     */
    _setParent:function (geometry) {
        if (geometry) {
            this._parent = geometry;
        }
    },

    _getParent:function () {
        return this._parent;
    },

    _fireEvent:function (eventName, param) {
        if (this.getLayer() && this.getLayer()._onGeometryEvent) {
            if (!param) {
                param = {};
            }
            param['type'] = eventName;
            param['target'] = this;
            this.getLayer()._onGeometryEvent(param);
        }
        this.fire(eventName, param);
    },

    _toJSON: function (options) {
        return {
            'feature' : this.toGeoJSON(options)
        };
    },

    _exportGraphicOptions:function (options) {
        var json = {};
        if (maptalks.Util.isNil(options['options']) || options['options']) {
            json['options'] = this.config();
        }
        if (maptalks.Util.isNil(options['symbol']) || options['symbol']) {
            json['symbol'] = this.getSymbol();
        }
        if (maptalks.Util.isNil(options['infoWindow']) || options['infoWindow']) {
            if (this._infoWinOptions) {
                json['infoWindow'] = this._infoWinOptions;
            }
        }
        return json;
    },

    _exportGeoJSONGeometry:function () {
        var points = this.getCoordinates();
        var coordinates = maptalks.GeoJSON.toNumberArrays(points);
        return {
            'type'        : this.getType(),
            'coordinates' : coordinates
        };
    },

    _exportProperties: function () {
        var properties = null;
        var geoProperties = this.getProperties();
        if (geoProperties) {
            if (maptalks.Util.isObject(geoProperties)) {
                properties = maptalks.Util.extend({}, geoProperties);
            } else {
                geoProperties = properties;
            }
        }
        return properties;
    }

});

/**
 * Produce a geometry from one or more [profile json]{@link maptalks.Geometry#toJSON} or GeoJSON.
 * @static
 * @param  {Object} json - a geometry's profile json or a geojson
 * @return {maptalks.Geometry} geometry
 * @example
 * var profile = {
        "feature": {
              "type": "Feature",
              "id" : "point1",
              "geometry": {"type": "Point", "coordinates": [102.0, 0.5]},
              "properties": {"prop0": "value0"}
        },
        //construct options.
        "options":{
            "draggable" : true
        },
        //symbol
        "symbol":{
            "markerFile"  : "http://foo.com/icon.png",
            "markerWidth" : 20,
            "markerHeight": 20
        }
    };
    var marker = maptalks.Geometry.fromJSON(profile);
 */
maptalks.Geometry.fromJSON = function (json) {
    if (maptalks.Util.isArray(json)) {
        var result = [], c;
        for (var i = 0, len = json.length; i < len; i++) {
            c = maptalks.Geometry.fromJSON(json[i]);
            if (maptalks.Util.isArray(json)) {
                result = result.concat(c);
            } else {
                result.push(c);
            }
        }
        return result;
    }

    if (json && !json['feature']) {
        return maptalks.GeoJSON.toGeometry(json);
    }
    var geometry;
    if (json['subType']) {
        geometry = maptalks[json['subType']].fromJSON(json);
        if (!maptalks.Util.isNil(json['feature']['id'])) {
            geometry.setId(json['feature']['id']);
        }
    } else {
        var feature = json['feature'];
        geometry = maptalks.GeoJSON.toGeometry(feature);
        if (json['options']) {
            geometry.config(json['options']);
        }
    }
    if (json['symbol']) {
        geometry.setSymbol(json['symbol']);
    }
    if (json['infoWindow']) {
        geometry.setInfoWindow(json['infoWindow']);
    }
    return geometry;
};


maptalks.Geometry.getMarkerPathBase64 = function (symbol) {
    if (!symbol['markerPath']) {
        return null;
    }
    var op = 1, styles =  maptalks.symbolizer.VectorMarkerSymbolizer.translateToSVGStyles(symbol);
    //context.globalAlpha doesn't take effect with drawing SVG in IE9/10/11 and EGDE, so set opacity in SVG element.
    if (maptalks.Util.isNumber(symbol['markerOpacity'])) {
        op = symbol['markerOpacity'];
    }
    if (maptalks.Util.isNumber(symbol['opacity'])) {
        op *= symbol['opacity'];
    }
    var p, svgStyles = {};
    if (styles) {
        for (p in styles['stroke']) {
            if (styles['stroke'].hasOwnProperty(p)) {
                if (!maptalks.Util.isNil(styles['stroke'][p])) {
                    svgStyles[p] = styles['stroke'][p];
                }
            }
        }
        for (p in styles['fill']) {
            if (styles['fill'].hasOwnProperty(p)) {
                if (!maptalks.Util.isNil(styles['fill'][p])) {
                    svgStyles[p] = styles['fill'][p];
                }
            }
        }
    }

    var pathes = maptalks.Util.isArray(symbol['markerPath']) ? symbol['markerPath'] : [symbol['markerPath']];
    var i, path, pathesToRender = [];
    for (i = 0; i < pathes.length; i++) {
        path = maptalks.Util.isString(pathes[i]) ? {'path' : pathes[i]} : pathes[i];
        path = maptalks.Util.extend({}, path, svgStyles);
        path['d'] = path['path'];
        delete path['path'];
        pathesToRender.push(path);
    }
    var svg = ['<svg version="1.1"', 'xmlns="http://www.w3.org/2000/svg"'];
    if (op < 1) {
        svg.push('opacity="' + op + '"');
    }
    // if (symbol['markerWidth'] && symbol['markerHeight']) {
    //     svg.push('height="' + symbol['markerHeight'] + '" width="' + symbol['markerWidth'] + '"');
    // }
    if (symbol['markerPathWidth'] && symbol['markerPathHeight']) {
        svg.push('viewBox="0 0 ' + symbol['markerPathWidth'] + ' ' + symbol['markerPathHeight'] + '"');
    }
    svg.push('preserveAspectRatio="none"');
    svg.push('><defs></defs>');

    for (i = 0; i < pathesToRender.length; i++) {
        var strPath = '<path ';
        for (p in pathesToRender[i]) {
            if (pathesToRender[i].hasOwnProperty(p)) {
                strPath += ' ' + p + '="' + pathesToRender[i][p] + '"';
            }
        }
        strPath += '></path>';
        svg.push(strPath);
    }
    svg.push('</svg>');
    var b64 = 'data:image/svg+xml;base64,' + maptalks.Util.btoa(svg.join(' '));
    return b64;
};

maptalks.Geometry.include(/** @lends maptalks.Geometry.prototype */{
    /**
     * Start to edit
     * @param {Object} [options=null]        - edit options
     * @param {Object} [options.symbol=null] - symbol for the geometry during editing
     * @return {maptalks.Geometry} this
     */
    startEdit: function (opts) {
        if (!this.getMap() || !this.options['editable']) {
            return this;
        }
        this.endEdit();
        this._editor = new maptalks.Geometry.Editor(this, opts);
        this._editor.start();
        this.fire('editstart');
        return this;
    },

    /**
     * End editing.
     * @return {maptalks.Geometry} this
     */
    endEdit: function () {
        if (this._editor) {
            this._editor.stop();
            delete this._editor;
            this.fire('editend');
        }
        return this;
    },

    /**
     * Whether the geometry is being edited.
     * @return {Boolean}
     */
    isEditing: function () {
        if (this._editor) {
            return this._editor.isEditing();
        }
        return false;
    }

});

maptalks.Geometry.mergeOptions({

    'draggable': false,

    'dragShadow' : true,

    'dragOnAxis' : null
});

/**
 * Drag handler for geometries.
 * @class
 * @category handler
 * @protected
 * @extends {maptalks.Handler}
 */
maptalks.Geometry.Drag = maptalks.Handler.extend(/** @lends maptalks.Geometry.Drag.prototype */{
    dragStageLayerId : maptalks.internalLayerPrefix + '_drag_stage',

    START: maptalks.Browser.touch ? ['touchstart', 'mousedown'] : ['mousedown'],

    addHooks: function () {
        this.target.on(this.START.join(' '), this._startDrag, this);

    },
    removeHooks: function () {
        this.target.off(this.START.join(' '), this._startDrag, this);

    },

    _startDrag: function (param) {
        var map = this.target.getMap();
        if (!map) {
            return;
        }
        var parent = this.target._getParent();
        if (parent) {
            return;
        }
        if (this.isDragging()) {
            return;
        }
        var domEvent = param['domEvent'];
        if (domEvent.touches && domEvent.touches.length > 1) {
            return;
        }
        this.target.on('click', this._endDrag, this);
        this._lastPos = param['coordinate'];
        this._prepareMap();
        this._prepareDragHandler();
        this._dragHandler.onMouseDown(param['domEvent']);
        this._moved = false;
        /**
         * drag start event
         * @event maptalks.Geometry#dragstart
         * @type {Object}
         * @property {String} type                    - dragstart
         * @property {maptalks.Geometry} target       - the geometry fires event
         * @property {maptalks.Coordinate} coordinate - coordinate of the event
         * @property {maptalks.Point} containerPoint  - container point of the event
         * @property {maptalks.Point} viewPoint       - view point of the event
         * @property {Event} domEvent                 - dom event
         */
        this.target._fireEvent('dragstart', param);
    },

    _prepareMap:function () {
        var map = this.target.getMap();
        this._mapDraggable = map.options['draggable'];
        this._mapHitDetect = map.options['hitDetect'];
        map._trySetCursor('move');
        map.config({
            'hitDetect' : false,
            'draggable' : false
        });
    },

    _prepareDragHandler:function () {
        var map = this.target.getMap();
        this._dragHandler = new maptalks.Handler.Drag(map._panels.mapWrapper || map._containerDOM);
        this._dragHandler.on('dragging', this._dragging, this);
        this._dragHandler.on('mouseup', this._endDrag, this);
        this._dragHandler.enable();
    },

    _prepareShadow:function () {
        var target = this.target;
        this._prepareDragStageLayer();
        var resources = this._dragStageLayer._getRenderer().resources;
        if (this._shadow) {
            this._shadow.remove();
        }

        this._shadow = target.copy();
        this._shadow.setSymbol(target._getInternalSymbol());
        var shadow = this._shadow;
        if (target.options['dragShadow']) {
            var symbol = maptalks.Util.lowerSymbolOpacity(shadow._getInternalSymbol(), 0.5);
            shadow.setSymbol(symbol);
        }
        shadow.setId(null);
        //copy connectors
        var shadowConnectors = [];
        if (maptalks.ConnectorLine._hasConnectors(target)) {
            var connectors = maptalks.ConnectorLine._getConnectors(target);

            for (var i = 0; i < connectors.length; i++) {
                var targetConn = connectors[i];
                var connOptions = targetConn.config(),
                    connSymbol = targetConn._getInternalSymbol();
                connOptions['symbol'] = maptalks.Util.lowerSymbolOpacity(connSymbol, 0.5);
                var conn;
                if (targetConn.getConnectSource() === target) {
                    conn = new maptalks.ConnectorLine(shadow, targetConn.getConnectTarget(), connOptions);
                } else {
                    conn = new maptalks.ConnectorLine(targetConn.getConnectSource(), shadow, connOptions);
                }
                shadowConnectors.push(conn);
                if (targetConn.getLayer() && targetConn.getLayer()._getRenderer()) {
                    resources.merge(targetConn.getLayer()._getRenderer().resources);
                }

            }
        }
        this._shadowConnectors = shadowConnectors;
        shadowConnectors.push(shadow);
        this._dragStageLayer.bringToFront().addGeometry(shadowConnectors);
    },

    _onTargetUpdated:function () {
        if (this._shadow) {
            this._shadow.setSymbol(this.target.getSymbol());
        }
    },

    _prepareDragStageLayer:function () {
        var map = this.target.getMap(),
            layer = this.target.getLayer();
        this._dragStageLayer = map.getLayer(this.dragStageLayerId);
        if (!this._dragStageLayer) {
            this._dragStageLayer = new maptalks.VectorLayer(this.dragStageLayerId, {'drawImmediate' : true});
            map.addLayer(this._dragStageLayer);
        }
        //copy resources to avoid repeat resource loading.
        var resources = new maptalks.renderer.Canvas.Resources();
        resources.merge(layer._getRenderer().resources);
        this._dragStageLayer._getRenderer().resources = resources;
    },

    _dragging: function (param) {
        var target = this.target;
        var map = target.getMap(),
            eventParam = map._parseEvent(param['domEvent']);

        var domEvent = eventParam['domEvent'];
        if (domEvent.touches && domEvent.touches.length > 1) {
            return;
        }

        if (!this._moved) {
            this._moved = true;
            target.on('symbolchange', this._onTargetUpdated, this);
            // this._prepareMap();
            this._isDragging = true;
            this._prepareShadow();
            if (!target.options['dragShadow']) {
                target.hide();
            }
            this._shadow._fireEvent('dragstart', eventParam);
            return;
        }
        if (!this._shadow) {
            return;
        }
        var axis = this._shadow.options['dragOnAxis'];
        var currentPos = eventParam['coordinate'];
        if (!this._lastPos) {
            this._lastPos = currentPos;
        }
        var dragOffset = currentPos.substract(this._lastPos);
        if (axis === 'x') {
            dragOffset.y = 0;
        } else if (axis === 'y') {
            dragOffset.x = 0;
        }
        this._lastPos = currentPos;
        this._shadow.translate(dragOffset);
        if (!target.options['dragShadow']) {
            target.translate(dragOffset);
        }
        eventParam['dragOffset'] = dragOffset;
        this._shadow._fireEvent('dragging', eventParam);

        /**
         * dragging event
         * @event maptalks.Geometry#dragging
         * @type {Object}
         * @property {String} type                    - dragging
         * @property {maptalks.Geometry} target       - the geometry fires event
         * @property {maptalks.Coordinate} coordinate - coordinate of the event
         * @property {maptalks.Point} containerPoint  - container point of the event
         * @property {maptalks.Point} viewPoint       - view point of the event
         * @property {Event} domEvent                 - dom event
         */
        target._fireEvent('dragging', eventParam);

    },

    _endDrag: function (param) {
        var target = this.target,
            map = target.getMap();
        if (this._dragHandler) {
            target.off('click', this._endDrag, this);
            this._dragHandler.disable();
            delete this._dragHandler;
        }
        if (!map) {
            return;
        }
        var eventParam;
        if (map) {
            eventParam = map._parseEvent(param['domEvent']);
        }
        target.off('symbolchange', this._onTargetUpdated, this);

        if (!target.options['dragShadow']) {
            target.show();
        }
        var shadow = this._shadow;
        if (shadow) {
            if (target.options['dragShadow']) {
                target.setCoordinates(shadow.getCoordinates());
            }
            shadow._fireEvent('dragend', eventParam);
            shadow.remove();
            delete this._shadow;
        }
        if (this._shadowConnectors) {
            map.getLayer(this.dragStageLayerId).removeGeometry(this._shadowConnectors);
            delete this._shadowConnectors;
        }
        delete this._lastPos;

        //restore map status
        map._trySetCursor('default');
        if (maptalks.Util.isNil(this._mapDraggable)) {
            this._mapDraggable = true;
        }
        map.config({
            'hitDetect': this._mapHitDetect,
            'draggable': this._mapDraggable
        });

        delete this._autoBorderPanning;
        delete this._mapDraggable;
        if (this._dragStageLayer) {
            this._dragStageLayer.remove();
        }
        this._isDragging = false;
        /**
         * dragend event
         * @event maptalks.Geometry#dragend
         * @type {Object}
         * @property {String} type                    - dragend
         * @property {maptalks.Geometry} target       - the geometry fires event
         * @property {maptalks.Coordinate} coordinate - coordinate of the event
         * @property {maptalks.Point} containerPoint  - container point of the event
         * @property {maptalks.Point} viewPoint       - view point of the event
         * @property {Event} domEvent                 - dom event
         */
        target._fireEvent('dragend', eventParam);

    },

    isDragging:function () {
        if (!this._isDragging) {
            return false;
        }
        return true;
    }


});

maptalks.Geometry.addInitHook('addHandler', 'draggable', maptalks.Geometry.Drag);

maptalks.Geometry.include(/** @lends maptalks.Geometry.prototype */{
    /**
     * Whether the geometry is being dragged.
     * @reutrn {Boolean}
     */
    isDragging: function () {
        if (this._getParent()) {
            return this._getParent().isDragging();
        }
        if (this['draggable']) {
            return this['draggable'].isDragging();
        }
        return false;
    }
});

maptalks.Geometry.include(/** @lends maptalks.Geometry.prototype */{
    /**
     * The event handler for all the events.
     * @param  {Event} event - dom event
     * @private
     */
    _onEvent: function (event) {
        if (!this.getMap()) {
            return;
        }
        var eventType = this._getEventTypeToFire(event);
        if (eventType === 'contextmenu' && this.listens('contextmenu')) {
            maptalks.DomUtil.stopPropagation(event);
            maptalks.DomUtil.preventDefault(event);
        }
        var params = this._getEventParams(event);
        this._fireEvent(eventType, params);
    },

    _getEventTypeToFire:function (originalEvent) {
        var eventType = originalEvent.type;
        //change event type to contextmenu
        if (eventType === 'click' || eventType === 'mousedown') {
            if (originalEvent.button === 2) {
                eventType = 'contextmenu';
            }
        }
        return eventType;
    },

    /**
     * Generate event parameters
     * @param  {Event} event - dom event
     * @return {Object}
     * @private
     */
    _getEventParams: function (e) {
        var map = this.getMap();
        var eventParam = {
            'domEvent':e
        };
        var actual = e.touches ? e.touches[0] : e;
        if (actual) {
            var containerPoint = maptalks.DomUtil.getEventContainerPoint(actual, map._containerDOM);
            eventParam['coordinate'] = map.containerPointToCoordinate(containerPoint);
            eventParam['containerPoint'] = containerPoint;
            eventParam['viewPoint'] = map.containerPointToViewPoint(containerPoint);
            eventParam['pont2d'] = map._containerPointToPoint(containerPoint);
        }
        return eventParam;
    },

    /**
     * mouse over event handler
     * @param  {Event} event - mouseover dom event
     * @private
     */
    _onMouseOver: function (event) {
        if (!this.getMap()) {
            return;
        }
        var originalEvent = event;
        var params = this._getEventParams(originalEvent);
        /**
         * mouseover event for geometry
         * @event maptalks.Geometry#mouseover
         * @type {Object}
         * @property {String} type                    - mouseover
         * @property {maptalks.Geometry} target       - the geometry fires mouseover
         * @property {maptalks.Coordinate} coordinate - coordinate of the event
         * @property {maptalks.Point} containerPoint  - container point of the event
         * @property {maptalks.Point} viewPoint       - view point of the event
         * @property {Event} domEvent                 - dom event
         */
        this._fireEvent('mouseover', params);
    },

    /**
     * mouse out event handler
     * @param  {Event} event - mouseout dom event
     * @private
     */
    _onMouseOut: function (event) {
        if (!this.getMap()) {
            return;
        }
        var originalEvent = event;
        var params = this._getEventParams(originalEvent);
        /**
         * mouseout event for geometry
         * @event maptalks.Geometry#mouseout
         * @type {Object}
         * @property {String} type                    - mouseout
         * @property {maptalks.Geometry} target       - the geometry fires mouseout
         * @property {maptalks.Coordinate} coordinate - coordinate of the event
         * @property {maptalks.Point} containerPoint  - container point of the event
         * @property {maptalks.Point} viewPoint       - view point of the event
         * @property {Event} domEvent                 - dom event
         */
        this._fireEvent('mouseout', params);
    }
});

maptalks.Geometry.include(/** @lends maptalks.Geometry.prototype */{
    /**
     * Animate the geometry
     *
     * @param  {Object}   styles          - styles to animate
     * @param  {Object}   [options=null]  - animation options
     * @param  {Object}   [options.speed=1000]      - duration
     * @param  {Object}   [options.startTime=null]  - time to start animation in ms
     * @param  {Object}   [options.easing=linear]   - animation easing: in, out, inAndOut, linear, upAndDown
     * @param  {Function} [step=null]               - step function when animating
     * @return {maptalks.animation.Player} animation player
     * @example
     * var player = marker.animate({
     *     'symbol': {
     *         'markerHeight': 82
     *      }
     * }, {
     *     'speed': 2000
     * }, function (frame) {
     *     console.log(frame);
     * });
     * player.pause();
     */
    animate:function (styles, options, step) {
        if (this._animPlayer) {
            this._animPlayer.finish();
        }
        if (maptalks.Util.isFunction(options)) {
            step = options;
            options = null;
        }
        var map = this.getMap(),
            projection = this._getProjection(),
            symbol = this._getInternalSymbol(),
            stylesToAnimate = this._prepareAnimationStyles(styles),
            preTranslate, isFocusing;

        if (options) { isFocusing = options['focus']; }
        delete this._animationStarted;

        var player = maptalks.Animation.animate(stylesToAnimate, options, maptalks.Util.bind(function (frame) {
            if (!this._animationStarted && isFocusing) {
                map.onMoveStart();
            }
            var styles = frame.styles;
            for (var p in styles) {
                if (p !== 'symbol' && p !== 'translate' && styles.hasOwnProperty(p)) {
                    var fnName = 'set' + p[0].toUpperCase() + p.slice(1);
                    this[fnName](styles[p]);
                }
            }
            var translate = styles['translate'];
            if (translate) {
                var toTranslate = translate;
                if (preTranslate) {
                    toTranslate = translate.substract(preTranslate);
                }
                preTranslate = translate;
                this.translate(toTranslate);
            }
            var dSymbol = styles['symbol'];
            if (dSymbol) {
                this.setSymbol(maptalks.Util.extendSymbol(symbol, dSymbol));
            }
            if (isFocusing) {
                var pcenter = projection.project(this.getCenter());
                map._setPrjCenterAndMove(pcenter);
                if (player.playState !== 'running') {
                    map.onMoveEnd();
                } else {
                    map.onMoving();
                }
            }
            this._fireAnimateEvent(player.playState);
            if (step) {
                step(frame);
            }
        }, this));
        this._animPlayer = player;
        return this._animPlayer.play();
    },
    /**
     * Prepare styles for animation
     * @return {Object} styles
     * @private
     */
    _prepareAnimationStyles:function (styles) {
        var symbol = this._getInternalSymbol();
        var stylesToAnimate = {};
        for (var p in styles) {
            if (styles.hasOwnProperty(p)) {
                var v = styles[p],
                    sp;
                if (p !== 'translate' && p !== 'symbol') {
                    //this.getRadius() / this.getWidth(), etc.
                    var fnName = 'get' + p[0].toUpperCase() + p.substring(1);
                    var current = this[fnName]();
                    stylesToAnimate[p] = [current, v];
                } else if (p === 'symbol') {
                    var symbolToAnimate;
                    if (maptalks.Util.isArray(styles['symbol'])) {
                        if (!maptalks.Util.isArray(symbol)) {
                            throw new Error('geometry\'symbol isn\'t a composite symbol, while the symbol in styles is.');
                        }
                        symbolToAnimate = [];
                        var symbolInStyles = styles['symbol'];
                        for (var i = 0; i < symbolInStyles.length; i++) {
                            if (!symbolInStyles[i]) {
                                symbolToAnimate.push(null);
                                continue;
                            }
                            var a = {};
                            for (sp in symbolInStyles[i]) {
                                if (symbolInStyles[i].hasOwnProperty(sp)) {
                                    a[sp] = [symbol[i][sp], symbolInStyles[i][sp]];
                                }
                            }
                            symbolToAnimate.push(a);
                        }
                    } else {
                        if (maptalks.Util.isArray(symbol)) {
                            throw new Error('geometry\'symbol is a composite symbol, while the symbol in styles isn\'t.');
                        }
                        symbolToAnimate = {};
                        for (sp in v) {
                            if (v.hasOwnProperty(sp)) {
                                symbolToAnimate[sp] = [symbol[sp], v[sp]];
                            }
                        }
                    }
                    stylesToAnimate['symbol'] = symbolToAnimate;
                } else if (p === 'translate') {
                    stylesToAnimate['translate'] = new maptalks.Coordinate(v);
                }
            }
        }
        return stylesToAnimate;
    },

    _fireAnimateEvent:function (playState) {
        if (playState === 'finished') {
            delete this._animationStarted;
            this._fireEvent('animateend');
        } else if (playState === 'running') {
            if (this._animationStarted) {
                this._fireEvent('animating');
            } else {
                this._fireEvent('animatestart');
                this._animationStarted = true;
            }

        }
    }
});

/**
 * @classdesc
 * Base class for all the geometry classes besides [maptalks.Marker]{@link maptalks.Marker}. <br/>
 * It is abstract and not intended to be instantiated.
 * @class
 * @category geometry
 * @abstract
 * @extends maptalks.Geometry
 */
maptalks.Vector = maptalks.Geometry.extend(/** @lends maptalks.Vector.prototype */{
    /**
     * @property {Object} options - Vector's options
     * @property {Object} options.symbol - Vector's default symbol
     */
    options:{
        'symbol':{
            'lineColor' : '#000',
            'lineWidth' : 2,
            'lineOpacity' : 1,

            'polygonFill' : '#fff', //default color in cartoCSS
            'polygonOpacity' : 1,
            'opacity' : 1
        }
    },

    _hitTestTolerance: function () {
        var symbol = this._getInternalSymbol();
        var w;
        if (maptalks.Util.isArray(symbol)) {
            w = 0;
            for (var i = 0; i < symbol.length; i++) {
                if (maptalks.Util.isNumber(symbol[i]['lineWidth'])) {
                    if (symbol[i]['lineWidth'] > w) {
                        w = symbol[i]['lineWidth'];
                    }
                }
            }
        } else {
            w = symbol['lineWidth'];
        }
        return w ? w / 2 : 1.5;
    }
});

/**
 * Common methods for geometry classes that base on a center, e.g. Marker, Circle, Ellipse , etc
 * @mixin
 */
maptalks.Geometry.Center = {
    /**
     * Get geometry's center
     * @return {maptalks.Coordinate} - center of the geometry
     */
    getCoordinates:function () {
        return this._coordinates;
    },

    /**
     * Set a new center to the geometry
     * @param {maptalks.Coordinate|Number[]} coordinates - new center
     * @return {maptalks.Geometry} this
     * @fires maptalks.Geometry#positionchange
     */
    setCoordinates:function (coordinates) {
        var center = new maptalks.Coordinate(coordinates);
        if (center.equals(this._coordinates)) {
            return this;
        }
        this._coordinates = center;
        if (!this.getMap()) {
            this.onPositionChanged();
            return this;
        }
        var projection = this._getProjection();
        this._setPrjCoordinates(projection.project(this._coordinates));
        return this;
    },

    //Gets view point of the geometry's center
    _getCenter2DPoint:function () {
        var pcenter = this._getPrjCoordinates();
        if (!pcenter) { return null; }
        var map = this.getMap();
        if (!map) {
            return null;
        }
        return map._prjToPoint(pcenter);
    },

    _getPrjCoordinates:function () {
        var projection = this._getProjection();
        if (!projection) { return null; }
        if (!this._pcenter) {
            if (this._coordinates) {
                this._pcenter = projection.project(this._coordinates);
            }
        }
        return this._pcenter;
    },

    //Set center by projected coordinates
    _setPrjCoordinates:function (pcenter) {
        this._pcenter = pcenter;
        this.onPositionChanged();
    },

    //update cached variables if geometry is updated.
    _updateCache:function () {
        delete this._extent;
        var projection = this._getProjection();
        if (this._pcenter && projection) {
            this._coordinates = projection.unproject(this._pcenter);
        }
    },

    _clearProjection:function () {
        this._pcenter = null;
    },

    _computeCenter:function () {
        return this._coordinates;
    }
};

/**
 * Common methods for geometry classes based on coordinates arrays, e.g. LineString, Polygon
 * @mixin maptalks.Geometry.Poly
 */
maptalks.Geometry.Poly = {
    /**
     * Transform projected coordinates to view points
     * @param  {maptalks.Coordinate[]} prjCoords  - projected coordinates
     * @returns {maptalks.Point[]}
     * @private
     */
    _getPath2DPoints:function (prjCoords, disableSimplify) {
        var result = [];
        if (!maptalks.Util.isArrayHasData(prjCoords)) {
            return result;
        }
        var map = this.getMap(),
            fullExtent = map.getFullExtent(),
            projection = this._getProjection();
        var anti = this.options['antiMeridian'] && maptalks.MeasurerUtil.isSphere(projection),
            isClip = map.options['clipFullExtent'],
            isSimplify = !disableSimplify && this.getLayer() && this.getLayer().options['enableSimplify'],
            tolerance = 2 * map._getResolution(),
            isMulti = maptalks.Util.isArray(prjCoords[0]);
        if (isSimplify && !isMulti) {
            prjCoords = maptalks.Simplify.simplify(prjCoords, tolerance, false);
        }
        var i, len, p, pre, current, dx, dy, my,
            part1 = [], part2 = [], part = part1;
        for (i = 0, len = prjCoords.length; i < len; i++) {
            p = prjCoords[i];
            if (isMulti) {
                part.push(this._getPath2DPoints(p));
                continue;
            }
            if (maptalks.Util.isNil(p) || (isClip && !fullExtent.contains(p))) {
                continue;
            }
            if (i > 0 && (anti === 'continuous' || anti === 'split')) {
                current = projection.unproject(p);
                if (anti === 'split' || !pre) {
                    pre = projection.unproject(prjCoords[i - 1]);
                }
                if (pre && current) {
                    dx = current.x - pre.x;
                    dy = current.y - pre.y;
                    if (Math.abs(dx) > 180) {
                        if (anti === 'continuous') {
                            current = this._anti(current, dx);
                            pre = current;
                            p = projection.project(current);
                        } else if (anti === 'split') {
                            if (dx > 0) {
                                my = pre.y + dy * (pre.x - (-180)) / (360 - dx) * (pre.y > current.y ? -1 : 1);
                                part.push(map.coordinateToPoint(new maptalks.Coordinate(-180, my)));
                                part = part === part1 ? part2 : part1;
                                part.push(map.coordinateToPoint(new maptalks.Coordinate(180, my)));

                            } else {
                                my = pre.y + dy * (180 - pre.x) / (360 + dx) * (pre.y > current.y ? 1 : -1);
                                part.push(map.coordinateToPoint(new maptalks.Coordinate(180, my)));
                                part = part === part1 ? part2 : part1;
                                part.push(map.coordinateToPoint(new maptalks.Coordinate(-180, my)));

                            }
                        }
                    }
                }
            }
            part.push(map._prjToPoint(p));
        }
        if (part2.length > 0) {
            result = [part1, part2];
        } else {
            result = part;
        }
        return result;
    },

    _anti: function (c, dx) {
        if (dx > 0) {
            return c.substract(180 * 2, 0);
        } else {
            return c.add(180 * 2, 0);
        }
    },

    _setPrjCoordinates:function (prjPoints) {
        this._prjCoords = prjPoints;
        this.onShapeChanged();
    },

    _getPrjCoordinates:function () {
        if (!this._prjCoords) {
            var points = this._coordinates;
            this._prjCoords = this._projectCoords(points);
        }
        return this._prjCoords;
    },

    //update cached variables if geometry is updated.
    _updateCache:function () {
        delete this._extent;
        var projection = this._getProjection();
        if (!projection) {
            return;
        }
        if (this._prjCoords) {
            this._coordinates = this._unprojectCoords(this._getPrjCoordinates());
        }
        if (this._prjHoles) {
            this._holes = this._unprojectCoords(this._getPrjHoles());
        }
    },

    _clearProjection:function () {
        this._prjCoords = null;
        if (this._prjHoles) {
            this._prjHoles = null;
        }
    },

    _projectCoords:function (points) {
        var projection = this._getProjection();
        if (projection) {
            return projection.projectCoords(points);
        }
        return null;
    },

    _unprojectCoords:function (prjPoints) {
        var projection = this._getProjection();
        if (projection) {
            return projection.unprojectCoords(prjPoints);
        }
        return null;
    },

    _computeCenter:function () {
        var ring = this._coordinates;
        if (!maptalks.Util.isArrayHasData(ring)) {
            return null;
        }
        var sumx = 0, sumy = 0;
        var counter = 0;
        var size = ring.length;
        for (var i = 0; i < size; i++) {
            if (ring[i]) {
                if (maptalks.Util.isNumber(ring[i].x) && maptalks.Util.isNumber(ring[i].y)) {
                    sumx += ring[i].x;
                    sumy += ring[i].y;
                    counter++;
                }
            }
        }
        return new maptalks.Coordinate(sumx / counter, sumy / counter);
    },

    _computeExtent:function () {
        var ring = this._coordinates;
        if (!maptalks.Util.isArrayHasData(ring)) {
            return null;
        }
        var rings = [ring];
        if (this.hasHoles && this.hasHoles()) {
            rings = rings.concat(this.getHoles());
        }
        return this._computeCoordsExtent(rings);
    },

     /**
      * Compute extent of a group of coordinates
      * @param  {maptalks.Coordinate[]} coords  - coordinates
      * @returns {maptalks.Extent}
      * @private
      */
    _computeCoordsExtent: function (coords) {
        var result = null,
            anti = this.options['antiMeridian'];
        var ext, p, dx, pre;
        for (var i = 0, len = coords.length; i < len; i++) {
            for (var j = 0, jlen = coords[i].length; j < jlen; j++) {
                p = coords[i][j];
                if (j > 0 && anti) {
                    if (!pre) {
                        pre = coords[i][j - 1];
                    }
                    dx = p.x - pre.x;
                    if (Math.abs(dx) > 180) {
                        p = this._anti(p, dx);
                        pre = p;
                    }
                }
                ext = new maptalks.Extent(p, p);
                result = ext.combine(result);
            }

        }
        return result;
    },

    _get2DLength: function () {
        var vertexes = this._getPath2DPoints(this._getPrjCoordinates());
        var len = 0;
        for (var i = 1, l = vertexes.length; i < l; i++) {
            len += vertexes[i].distanceTo(vertexes[i - 1]);
        }
        return len;
    }
};

/**
 * @classdesc
 * Represents a Point type Geometry.
 * @class
 * @category geometry
 * @extends maptalks.Geometry
 * @mixes maptalks.Geometry.Center
 * @param {maptalks.Coordinate} center      - center of the marker
 * @param {Object} [options=null]           - construct options defined in [maptalks.Marker]{@link maptalks.Marker#options}
 * @example
 * var marker = new maptalks.Marker([100, 0], {
 *     'id' : 'marker0',
 *     'symbol' : {
 *         'markerFile'  : 'foo.png',
 *         'markerWidth' : 20,
 *         'markerHeight': 20,
 *     },
 *     'properties' : {
 *         'foo' : 'value'
 *     }
 * });
 */
maptalks.Marker = maptalks.Geometry.extend(/** @lends maptalks.Marker.prototype */{
    includes:[maptalks.Geometry.Center],

    type: maptalks.Geometry['TYPE_POINT'],

    options:{
        'symbol': {
            'markerType'    : 'path',
            'markerPath'    : [
                {
                    'path' : 'M8 23l0 0 0 0 0 0 0 0 0 0c-4,-5 -8,-10 -8,-14 0,-5 4,-9 8,-9l0 0 0 0c4,0 8,4 8,9 0,4 -4,9 -8,14z M5,9 a3,3 0,1,0,0,-0.9Z',
                    'fill' : '#DE3333'
                }
            ],
            'markerPathWidth' : 16,
            'markerPathHeight' : 23,
            'markerWidth'   : 24,
            'markerHeight'  : 34
        }
    },

    initialize:function (coordinates, opts) {
        if (coordinates && !(coordinates instanceof maptalks.Coordinate)) {
            coordinates = new maptalks.Coordinate(coordinates);
        }
        this._coordinates = coordinates;
        this._initOptions(opts);
    },

    /**
     * Can be edited, only marker with a vector symbol, vector path symbol or a image symbol can be edited.
     * @return {Boolean}
     * @private
     */
    _canEdit:function () {
        var symbol = this._getInternalSymbol();
        if (maptalks.Util.isArray(symbol)) {
            return false;
        }
        return maptalks.symbolizer.VectorMarkerSymbolizer.test(symbol) || maptalks.symbolizer.VectorPathMarkerSymbolizer.test(symbol) ||
                    maptalks.symbolizer.ImageMarkerSymbolizer.test(symbol);
    },

    _containsPoint: function (point) {
        var pxExtent = this._getPainter().get2DExtent();
        return pxExtent.contains(point);
    },

    _computeExtent: function () {
        var coordinates = this.getCenter();
        if (!coordinates) { return null; }
        return new maptalks.Extent(coordinates, coordinates);
    },

    _computeGeodesicLength:function () {
        return 0;
    },

    _computeGeodesicArea:function () {
        return 0;
    },

    _getSprite: function (resources) {
        if (this._getPainter()) {
            return this._getPainter().getSprite(resources);
        }
        return new maptalks.Painter(this).getSprite(resources);
    }
});

/**
 * @classdesc
 * Base class for  the Text marker classes, a marker which has text and background box. <br>
 * It is abstract and not intended to be instantiated.
 *
 * @class
 * @category geometry
 * @abstract
 * @extends maptalks.Marker
 */
maptalks.TextMarker = maptalks.Marker.extend(/** @lends maptalks.TextMarker.prototype */{

    options : {
        'box' : true,
    },

    defaultSymbol : {
        'textFaceName'  : 'monospace',
        'textSize': 12,
        'textWrapBefore': false,
        'textWrapCharacter': '\n',
        'textLineSpacing': 8,
        'textHorizontalAlignment': 'middle', //left middle right
        'textVerticalAlignment': 'middle', //top middle bottom
        'textOpacity' : 1,
        'textDx' : 0,
        'textDy' : 0
    },

    defaultBoxSymbol:{
        'markerType':'square',
        'markerLineColor': '#000',
        'markerLineWidth': 2,
        'markerLineOpacity': 1,
        'markerFill': '#fff',
        'markerOpacity' : 1
    },


    initialize: function (content, coordinates, options) {
        this._content = content;
        this._coordinates = new maptalks.Coordinate(coordinates);
        this._initOptions(options);
        this._registerEvents();
        this._refresh();
    },

    /**
     * Get text content of the label
     * @returns {String}
     */
    getContent: function () {
        return this._content;
    },

    /**
     * Set a new text content to the label
     * @return {maptalks.Label} this
     * @fires maptalks.Label#contentchange
     */
    setContent: function (content) {
        var old = this._content;
        this._content = content;
        this._refresh();
        /**
         * an event when changing label's text content
         * @event maptalks.Label#contentchange
         * @type {Object}
         * @property {String} type - contentchange
         * @property {maptalks.Label} target - label fires the event
         * @property {String} old - old content
         * @property {String} new - new content
         */
        this._fireEvent('contentchange', {'old':old, 'new':content});
        return this;
    },

    getSymbol: function () {
        if (this._textSymbolChanged) {
            return maptalks.Geometry.prototype.getSymbol.call(this);
        }
        return null;
    },

    setSymbol:function (symbol) {
        if (!symbol || symbol === this.options['symbol']) {
            this._textSymbolChanged = false;
            symbol = {};
        } else {
            this._textSymbolChanged = true;
        }
        var cooked = this._prepareSymbol(symbol);
        var s = this._getDefaultTextSymbol();
        maptalks.Util.extend(s, cooked);
        this._symbol = s;
        this._refresh();
        return this;
    },

    onConfig:function (conf) {
        var needRepaint = false;
        for (var p in conf) {
            if (conf.hasOwnProperty(p)) {
                if (p.slice(0, 3) === 'box') {
                    needRepaint = true;
                    break;
                }
            }
        }
        if (needRepaint) {
            this._refresh();
        }
        return maptalks.Marker.prototype.onConfig.apply(this, arguments);
    },

    _getBoxSize: function (symbol) {
        if (!symbol['markerType']) {
            symbol['markerType'] = 'square';
        }
        var size = maptalks.StringUtil.splitTextToRow(this._content, symbol)['size'],
            width, height;
        if (this.options['boxAutoSize']) {
            var padding = this.options['boxPadding'];
            width = size['width'] + padding['width'] * 2;
            height = size['height'] + padding['height'] * 2;
        }
        if (this.options['boxMinWidth']) {
            if (!width || width < this.options['boxMinWidth']) {
                width = this.options['boxMinWidth'];
            }
        }
        if (this.options['boxMinHeight']) {
            if (!height || height < this.options['boxMinHeight']) {
                height = this.options['boxMinHeight'];
            }
        }
        return [width && height ? new maptalks.Size(width, height) : null, size];
    },

    _getInternalSymbol:function () {
        return this._symbol;
    },

    _getDefaultTextSymbol: function () {
        var s = {};
        maptalks.Util.extend(s, this.defaultSymbol);
        if (this.options['box']) {
            maptalks.Util.extend(s, this.defaultBoxSymbol);
        }
        return s;
    },

    _registerEvents: function () {
        this.on('shapechange', this._refresh, this);
    },

    onRemove:function () {
        this.off('shapechange', this._refresh, this);
    }
});

/**
 * @classdesc
 * Represents point type geometry for text labels.<br>
 * A label is used to draw text (with a box background if specified) on a particular coordinate.
 * @class
 * @category geometry
 * @extends maptalks.TextMarker
 * @mixes maptalks.TextMarker.Editor
 * @param {String} content                          - Label's text content
 * @param {maptalks.Coordinate} coordinates         - center
 * @param {Object} [options=null]                   - construct options defined in [maptalks.Label]{@link maptalks.Label#options}
 * @example
 * var label = new maptalks.Label('This is a label',[100,0])
 *     .addTo(layer);
 */
maptalks.Label = maptalks.TextMarker.extend(/** @lends maptalks.Label.prototype */{

    /**
     * @property {Object} [options=null]                   - label's options, also including options of [Marker]{@link maptalks.Marker#options}
     * @property {Boolean} [options.box=true]              - whether to display a background box wrapping the label text.
     * @property {Boolean} [options.boxAutoSize=true]      - whether to set the size of the background box automatically to fit for the label text.
     * @property {Boolean} [options.boxMinWidth=0]         - the minimum width of the background box.
     * @property {Boolean} [options.boxMinHeight=0]        - the minimum height of the background box.
     * @property {Boolean} [options.boxPadding={'width' : 12, 'height' : 8}] - padding of the label text to the border of the background box.
     * @property {Boolean} [options.boxTextAlign=middle]   - text align in the box, possible values:left, middle, right
     */
    options: {
        'boxAutoSize'  :   true,
        'boxMinWidth'  :   0,
        'boxMinHeight' :   0,
        'boxPadding'   :   {'width' : 12, 'height' : 8},
        'boxTextAlign' :   'middle'
    },

    _toJSON:function (options) {
        return {
            'feature' : this.toGeoJSON(options),
            'subType' : 'Label',
            'content' : this._content
        };
    },

    _refresh:function () {
        var symbol = this.getSymbol() || this._getDefaultTextSymbol();
        symbol['textName'] = this._content;
        if (this.options['box']) {
            var sizes = this._getBoxSize(symbol),
                boxSize = sizes[0],
                textSize = sizes[1],
                padding = this.options['boxPadding'];

            //if no boxSize then use text's size in default
            if (!boxSize && !symbol['markerWidth'] && !symbol['markerHeight']) {
                var width = textSize['width'] + padding['width'] * 2,
                    height = textSize['height'] + padding['height'] * 2;
                boxSize = new maptalks.Size(width, height);
                symbol['markerWidth'] = boxSize['width'];
                symbol['markerHeight'] = boxSize['height'];
            } else if (boxSize) {
                symbol['markerWidth'] = boxSize['width'];
                symbol['markerHeight'] = boxSize['height'];
            }

            var align = this.options['boxTextAlign'];
            if (align) {
                var textAlignPoint = maptalks.StringUtil.getAlignPoint(textSize, symbol['textHorizontalAlignment'], symbol['textVerticalAlignment']),
                    dx = symbol['textDx'] || 0,
                    dy = symbol['textDy'] || 0;
                textAlignPoint = textAlignPoint._add(dx, dy);
                symbol['markerDx'] = textAlignPoint.x;
                symbol['markerDy'] = textAlignPoint.y + textSize['height'] / 2;
                if (align === 'left') {
                    symbol['markerDx'] += symbol['markerWidth'] / 2 - padding['width'];
                } else if (align === 'right') {
                    symbol['markerDx'] -= symbol['markerWidth'] / 2 - textSize['width'] - padding['width'];
                } else {
                    symbol['markerDx'] += textSize['width'] / 2;
                }
            }
        }
        this._symbol = symbol;
        this.onSymbolChanged();
    }
});

maptalks.Label.fromJSON = function (json) {
    var feature = json['feature'];
    var label = new maptalks.Label(json['content'], feature['geometry']['coordinates'], json['options']);
    label.setProperties(feature['properties']);
    label.setId(feature['id']);
    return label;
};

/**
 * @classdesc
 * Represents point type geometry for text boxes.<br>
 * A TextBox is used to draw a box with text inside on a particular coordinate.
 * @class
 * @category geometry
 * @extends maptalks.TextMarker
 * @mixes maptalks.TextMarker.Editor
 * @param {String} content                          - TextBox's text content
 * @param {maptalks.Coordinate} coordinates         - center
 * @param {Object} [options=null]                   - construct options defined in [maptalks.TextBox]{@link maptalks.TextBox#options}
 * @example
 * var textBox = new maptalks.TextBox('This is a textBox',[100,0])
 *     .addTo(layer);
 */
maptalks.TextBox = maptalks.TextMarker.extend(/** @lends maptalks.TextBox.prototype */{

    /**
     * @property {Object} [options=null]                   - textbox's options, also including options of [Marker]{@link maptalks.Marker#options}
     * @property {Boolean} [options.boxAutoSize=false]     - whether to set the size of the box automatically to fit for the textbox's text.
     * @property {Boolean} [options.boxMinWidth=0]         - the minimum width of the box.
     * @property {Boolean} [options.boxMinHeight=0]        - the minimum height of the box.
     * @property {Boolean} [options.boxPadding={'width' : 12, 'height' : 8}] - padding of the text to the border of the box.
     */
    options: {
        'boxAutoSize'  :   false,
        'boxMinWidth'  :   0,
        'boxMinHeight' :   0,
        'boxPadding'   :   {'width' : 12, 'height' : 8}
    },

    _toJSON:function (options) {
        return {
            'feature' : this.toGeoJSON(options),
            'subType' : 'TextBox',
            'content' : this._content
        };
    },

    _refresh:function () {
        var symbol = this.getSymbol() || this._getDefaultTextSymbol();
        symbol['textName'] = this._content;

        var sizes = this._getBoxSize(symbol),
            boxSize = sizes[0],
            textSize = sizes[1];

        //if no boxSize then use text's size in default
        if (!boxSize && !symbol['markerWidth'] && !symbol['markerHeight']) {
            var padding = this.options['boxPadding'];
            var width = textSize['width'] + padding['width'] * 2,
                height = textSize['height'] + padding['height'] * 2;
            boxSize = new maptalks.Size(width, height);
            symbol['markerWidth'] = boxSize['width'];
            symbol['markerHeight'] = boxSize['height'];
        }  else if (boxSize) {
            symbol['markerWidth'] = boxSize['width'];
            symbol['markerHeight'] = boxSize['height'];
        }


        var textAlign = symbol['textHorizontalAlignment'];
        if (textAlign) {
            symbol['textDx'] = symbol['markerDx'] || 0;
            if (textAlign === 'left') {
                symbol['textDx'] -= symbol['markerWidth'] / 2;
            } else if (textAlign === 'right') {
                symbol['textDx'] += symbol['markerWidth'] / 2;
            }
        }

        var vAlign = symbol['textVerticalAlignment'];
        if (vAlign) {
            symbol['textDy'] = symbol['markerDy'] || 0;
            if (vAlign === 'top') {
                symbol['textDy'] -= symbol['markerHeight'] / 2;
            } else if (vAlign === 'bottom') {
                symbol['textDy'] += symbol['markerHeight'] / 2;
            }
        }

        this._symbol = symbol;
        this.onSymbolChanged();
    },

    _getInternalSymbol: function () {
        //In TextBox, textHorizontalAlignment's meaning is textAlign in the box which is reversed from original textHorizontalAlignment.
        var textSymbol = maptalks.Util.extend({}, this._symbol);
        if (textSymbol['textHorizontalAlignment'] === 'left') {
            textSymbol['textHorizontalAlignment'] = 'right';
        } else if (textSymbol['textHorizontalAlignment'] === 'right') {
            textSymbol['textHorizontalAlignment'] = 'left';
        }
        if (textSymbol['textVerticalAlignment'] === 'top') {
            textSymbol['textVerticalAlignment'] = 'bottom';
        } else if (textSymbol['textVerticalAlignment'] === 'bottom') {
            textSymbol['textVerticalAlignment'] = 'top';
        }
        return textSymbol;
    }
});

maptalks.TextBox.fromJSON = function (json) {
    var feature = json['feature'];
    var textBox = new maptalks.TextBox(json['content'], feature['geometry']['coordinates'], json['options']);
    textBox.setProperties(feature['properties']);
    textBox.setId(feature['id']);
    return textBox;
};

 /**
 * @classdesc
 *     Geometry class for polygon type
 * @class
 * @category geometry
 * @extends maptalks.Vector
 * @mixins maptalks.Geometry.Poly
 * @param {Number[][]|Number[][][]|maptalks.Coordinate[]|maptalks.Coordinate[][]} coordinates - coordinates, shell coordinates or all the rings.
 * @param {Object} [options=null] - construct options defined in [maptalks.Polygon]{@link maptalks.Polygon#options}
 * @example
 * var polygon = new maptalks.Polygon(
 *      [
 *          [
 *              [121.48053653961283, 31.24244899384889],
 *              [121.48049362426856, 31.238559229494186],
 *              [121.49032123809872, 31.236210614999653],
 *              [121.49366863494917, 31.242926029397037],
 *              [121.48577221160967, 31.243880093267567],
 *              [121.48053653961283, 31.24244899384889]
 *          ]
 *      ]
 *  ).addTo(layer);
 */
maptalks.Polygon = maptalks.Vector.extend(/** @lends maptalks.Polygon.prototype */{

    includes:[maptalks.Geometry.Poly],

    type:maptalks.Geometry['TYPE_POLYGON'],

    /**
     * @property {String} [options.antiMeridian=continuous] - continue | split, how to deal with the anti-meridian problem, split or continue the polygon when it cross the 180 or -180 longtitude line.
     */
    options:{
        'antiMeridian' : 'continuous'
    },

    initialize:function (coordinates, opts) {
        this.setCoordinates(coordinates);
        this._initOptions(opts);
    },

    /**
     * Set coordinates to the polygon
     *
     * @param {Number[][]|Number[][][]|maptalks.Coordinate[]|maptalks.Coordinate[][]} coordinates - new coordinates
     * @return {maptalks.Polygon} this
     * @fires maptalks.Polygon#shapechange
     */
    setCoordinates:function (coordinates) {
        if (!coordinates) {
            this._coordinates = null;
            this._holes = null;
            this._projectRings();
            return this;
        }
        var rings = maptalks.GeoJSON.toCoordinates(coordinates);
        var len = rings.length;
        if (!maptalks.Util.isArray(rings[0])) {
            this._coordinates = this._trimRing(rings);
        } else {
            this._coordinates = this._trimRing(rings[0]);
            if (len > 1) {
                var holes = [];
                for (var i = 1; i < len; i++) {
                    if (!rings[i]) {
                        continue;
                    }
                    holes.push(this._trimRing(rings[i]));
                }
                this._holes = holes;
            }
        }

        this._projectRings();
        return this;
    },

    /**
     * Gets polygons's coordinates
     *
     * @returns {maptalks.Coordinate[][]}
     */
    getCoordinates:function () {
        if (!this._coordinates) {
            return [];
        }
        if (maptalks.Util.isArrayHasData(this._holes)) {
            var holes = [];
            for (var i = 0; i < this._holes.length; i++) {
                holes.push(this._closeRing(this._holes[i]));
            }
            return [this._closeRing(this._coordinates)].concat(holes);
        }
        return [this._closeRing(this._coordinates)];
    },

    /**
     * Gets shell's coordinates of the polygon
     *
     * @returns {maptalks.Coordinate[]}
     */
    getShell:function () {
        return this._coordinates;
    },


    /**
     * Gets holes' coordinates of the polygon if it has.
     * @returns {maptalks.Coordinate[][]}
     */
    getHoles:function () {
        if (this.hasHoles()) {
            return this._holes;
        }
        return null;
    },

    /**
     * Whether the polygon has any holes inside.
     *
     * @returns {Boolean}
     */
    hasHoles:function () {
        if (maptalks.Util.isArrayHasData(this._holes)) {
            if (maptalks.Util.isArrayHasData(this._holes[0])) {
                return true;
            }
        }
        return false;
    },

    _projectRings:function () {
        if (!this.getMap()) {
            this.onShapeChanged();
            return;
        }
        this._prjCoords = this._projectCoords(this._coordinates);
        this._prjHoles = this._projectCoords(this._holes);
        this.onShapeChanged();
    },

    _cleanRing:function (ring) {
        for (var i = ring.length - 1; i >= 0; i--) {
            if (!ring[i]) {
                ring.splice(i, 1);
            }
        }
    },

    /**
     * 检查ring是否合法, 并返回ring是否闭合
     * @param  {*} ring [description]
     * @private
     */
    _checkRing:function (ring) {
        this._cleanRing(ring);
        if (!ring || !maptalks.Util.isArrayHasData(ring)) {
            return false;
        }
        var lastPoint = ring[ring.length - 1];
        var isClose = true;
        if (ring[0].x !== lastPoint.x || ring[0].y !== lastPoint.y) {
            isClose = false;
        }
        return isClose;
    },

    /**
     * 如果最后一个端点与第一个端点相同, 则去掉最后一个端点
     * @private
     */
    _trimRing:function (ring) {
        var isClose = this._checkRing(ring);
        if (maptalks.Util.isArrayHasData(ring) && isClose) {
            return ring.slice(0, ring.length - 1);
        } else {
            return ring;
        }
    },

    /**
     * 如果最后一个端点与第一个端点不同, 则在最后增加与第一个端点相同的点
     * @private
     */
    _closeRing:function (ring) {
        var isClose = this._checkRing(ring);
        if (maptalks.Util.isArrayHasData(ring) && !isClose) {
            return ring.concat([new maptalks.Coordinate(ring[0].x, ring[0].y)]);
        } else {
            return ring;
        }
    },


    _getPrjHoles:function () {
        if (!this._prjHoles) {
            this._prjHoles = this._projectCoords(this._holes);
        }
        return this._prjHoles;
    },

    _computeGeodesicLength:function (measurer) {
        var rings = this.getCoordinates();
        if (!maptalks.Util.isArrayHasData(rings)) {
            return 0;
        }
        var result = 0;
        for (var i = 0, len = rings.length; i < len; i++) {
            result += maptalks.GeoUtil._computeLength(rings[i], measurer);
        }
        return result;
    },

    _computeGeodesicArea:function (measurer) {
        var rings = this.getCoordinates();
        if (!maptalks.Util.isArrayHasData(rings)) {
            return 0;
        }
        var result = measurer.measureArea(rings[0]);
        //holes
        for (var i = 1, len = rings.length; i < len; i++) {
            result -= measurer.measureArea(rings[i]);

        }
        return result;
    },

    _containsPoint: function (point, tolerance) {
        var t = maptalks.Util.isNil(tolerance) ? this._hitTestTolerance() : tolerance,
            pxExtent = this._getPainter().get2DExtent().expand(t);
        function isContains(points) {
            var c = maptalks.GeoUtil.pointInsidePolygon(point, points);
            if (c) {
                return c;
            }

            var i, j, p1, p2,
                len = points.length;

            for (i = 0, j = len - 1; i < len; j = i++) {
                p1 = points[i];
                p2 = points[j];

                if (maptalks.GeoUtil.distanceToSegment(point, p1, p2) <= t) {
                    return true;
                }
            }

            return false;
        }

        if (!pxExtent.contains(point)) { return false; }

        // screen points
        var points = this._getPath2DPoints(this._getPrjCoordinates()),
            isSplitted = maptalks.Util.isArray(points[0]);
        if (isSplitted) {
            for (var i = 0; i < points.length; i++) {
                if (isContains(points[i])) {
                    return true;
                }
            }
            return false;
        } else {
            return isContains(points);
        }

    }
});

/**
 * @classdesc Represents a LineString type Geometry.
 * @class
 * @category geometry
 * @extends {maptalks.Vector}
 * @mixes   {maptalks.Geometry.Poly}
 * @param {maptalks.Coordinate[]|Number[][]} coordinates - coordinates of the line string
 * @param {Object} [options=null] - construct options defined in [maptalks.LineString]{@link maptalks.LineString#options}
 * @example
 * var line = new maptalks.LineString(
 *     [
 *         [121.4594221902467, 31.241237891628657],
 *         [121.46371372467041, 31.242265291152066],
 *         [121.46727569824205, 31.238706037961997],
 *         [121.47019394165014, 31.24145804961012]
 *     ]
 * ).addTo(layer);
 */
maptalks.LineString = maptalks.Polyline = maptalks.Vector.extend(/** @lends maptalks.LineString.prototype */{
    includes:[maptalks.Geometry.Poly],

    type:maptalks.Geometry['TYPE_LINESTRING'],

    /**
    * @property {Object} [options=null]
    * @property {String} [options.antiMeridian=continuous] - how to deal with the anti-meridian problem, split or continue the linestring when it cross the 180 or -180 longtitude line.
    * @property {String} [options.arrowStyle=null]                 - style of arrow, if not null, arrows will be drawn, possible values: classic
    * @property {String} [options.arrowPlacement=vertex-last]      - arrow's placement: vertex-first, vertex-last, vertex-firstlast, point
    */
    options:{
        'antiMeridian' : 'continuous',
        'arrowStyle' : null,
        'arrowPlacement' : 'vertex-last' //vertex-first, vertex-last, vertex-firstlast, point
    },

    initialize:function (coordinates, opts) {
        this.setCoordinates(coordinates);
        this._initOptions(opts);
    },

    /**
     * Set new coordinates to the line string
     * @param {maptalks.Coordinate[]|Number[][]} coordinates - new coordinates
     * @fires maptalks.LineString#shapechange
     * @return {maptalks.LineString} this
     */
    setCoordinates:function (coordinates) {
        if (!coordinates) {
            this._coordinates = null;
            this._setPrjCoordinates(null);
            return this;
        }
        this._coordinates = maptalks.GeoJSON.toCoordinates(coordinates);
        if (this.getMap()) {
            this._setPrjCoordinates(this._projectCoords(this._coordinates));
        } else {
            this.onShapeChanged();
        }
        return this;
    },

    /**
     * Get coordinates of the line string
     * @return {maptalks.Coordinate[]|Number[][]} coordinates
     */
    getCoordinates:function () {
        if (!this._coordinates) {
            return [];
        }
        return this._coordinates;
    },

    animateShow: function (options) {
        if (!options) {
            options = {};
        }
        var coordinates = this.getCoordinates();
        var duration = options['duration'] || 1000;
        var length = this.getLength();
        var easing = options['easing'] || 'out';
        this.setCoordinates([]);
        var player = maptalks.Animation.animate({'t' : duration}, {'speed' : duration, 'easing' : easing}, maptalks.Util.bind(function (frame) {
            if (!this.getMap()) {
                player.finish();
                this.setCoordinates(coordinates);
                return;
            }
            this._drawAnimFrame(frame.styles.t, duration, length, coordinates);
        }, this));
        player.play();
        return this;
    },

    _drawAnimFrame: function (t, duration, length, coordinates) {
        if (t === 0) {
            this.setCoordinates([]);
            return;
        }
        var map = this.getMap();
        var targetLength = t / duration * length;
        if (!this._animIdx) {
            this._animIdx = 0;
            this._animLenSoFar = 0;
            this.show();
        }
        var i, l;
        var segLen = 0;
        for (i = this._animIdx, l = coordinates.length; i < l - 1; i++) {
            segLen = map.computeLength(coordinates[i], coordinates[i + 1]);
            if (this._animLenSoFar + segLen > targetLength) {
                break;
            }
            this._animLenSoFar += segLen;
        }
        this._animIdx = i;
        if (this._animIdx >= l - 1) {
            this.setCoordinates(coordinates);
            return;
        }
        var idx = this._animIdx;
        var p1 = coordinates[idx], p2 = coordinates[idx + 1],
            span = targetLength - this._animLenSoFar,
            r = span / segLen;
        var x = p1.x + (p2.x - p1.x) * r,
            y = p1.y + (p2.y - p1.y) * r,
            targetCoord = new maptalks.Coordinate(x, y);
        var animCoords = coordinates.slice(0, this._animIdx + 1);
        animCoords.push(targetCoord);

        this.setCoordinates(animCoords);
    },

    _computeGeodesicLength:function (measurer) {
        return maptalks.GeoUtil._computeLength(this.getCoordinates(), measurer);
    },

    _computeGeodesicArea:function () {
        return 0;
    },

    _containsPoint: function (point, tolerance) {
        var t = maptalks.Util.isNil(tolerance) ? this._hitTestTolerance() : tolerance;
        function isContains(points) {
            var i, p1, p2,
                len = points.length;

            for (i = 0, len = points.length; i < len - 1; i++) {
                p1 = points[i];
                p2 = points[i + 1];

                if (maptalks.GeoUtil.distanceToSegment(point, p1, p2) <= t) {
                    return true;
                }
            }
            return false;
        }

        if (t < 2) {
            t = 2;
        }

        var arrowStyle = this._getArrowStyle();
        var lineWidth = this._getInternalSymbol()['lineWidth'];

        var map = this.getMap(),
            extent = this._getPrjExtent(),
            nw = new maptalks.Coordinate(extent.xmin, extent.ymax),
            se = new maptalks.Coordinate(extent.xmax, extent.ymin),
            pxMin = map._prjToPoint(nw),
            pxMax = map._prjToPoint(se),
            pxExtent = new maptalks.PointExtent(pxMin.x - t, pxMin.y - t,
                                    pxMax.x + t, pxMax.y + t);
        if (arrowStyle) {
            pxExtent._expand(Math.max(arrowStyle[0] * lineWidth, arrowStyle[1] * lineWidth));
        }
        if (!pxExtent.contains(point)) { return false; }

        // check arrow
        var points;
        if (this._getArrowStyle()) {
            points = this._getPath2DPoints(this._getPrjCoordinates(), true);
            var arrows = this._getArrows(points, lineWidth, (tolerance ? tolerance : 2) + lineWidth / 2);
            for (var ii = arrows.length - 1; ii >= 0; ii--) {
                if (maptalks.GeoUtil.pointInsidePolygon(point, arrows[ii])) {
                    return true;
                }
            }
        }

        points = points || this._getPath2DPoints(this._getPrjCoordinates());
        var isSplitted = points.length > 0 && maptalks.Util.isArray(points[0]);
        if (isSplitted) {
            for (var i = 0, l = points.length; i < l; i++) {
                if (isContains(points[i])) {
                    return true;
                }
            }
            return false;
        } else {
            return isContains(points);
        }

    }

});

/**
 * @classdesc Curve style LineString, an abstract parent class for all the curves.
 * @class
 * @category geometry
 * @extends {maptalks.LineString}
 */
maptalks.Curve = maptalks.LineString.extend(/** @lends maptalks.Curve.prototype */{

    _arc: function (ctx, points, lineOpacity) {
        var degree = this.options['arcDegree']  * Math.PI / 180;
        for (var i = 1, l = points.length; i < l; i++) {
            maptalks.Canvas._arcBetween(ctx, points[i - 1], points[i], degree);
            maptalks.Canvas._stroke(ctx, lineOpacity);
        }
    },

    _quadraticCurve: function (ctx, points) {
        if (points.length <= 2) {
            maptalks.Canvas._path(ctx, points);
            return;
        }
        maptalks.Canvas.quadraticCurve(ctx, points);
    },

    _getCubicCurvePoints: function (points) {
        var ctrlPts = [];
        var f = 0.3;
        var t = 0.6;

        var m = 0;
        var dx1 = 0;
        var dy1 = 0;
        var dx2, dy2;
        var curP, nexP;
        var preP = points[0];
        for (var i = 1, len = points.length; i < len; i++) {
            curP = points[i];
            nexP = points[i + 1];
            if (nexP) {
                m = (nexP.y - preP.y) / (nexP.x - preP.x);
                dx2 = (nexP.x - curP.x) * -f;
                dy2 = dx2 * m * t;
            } else {
                dx2 = 0;
                dy2 = 0;
            }
            // ctx.bezierCurveTo(preP.x - dx1, preP.y - dy1, curP.x + dx2, curP.y + dy2, curP.x, curP.y);
            ctrlPts.push(preP.x - dx1, preP.y - dy1, curP.x + dx2, curP.y + dy2, curP.x, curP.y);
            dx1 = dx2;
            dy1 = dy2;
            preP = curP;
        }
        return ctrlPts;
    },

    _bezierCurve: function (ctx, points) {

        if (points.length <= 2) {
            maptalks.Canvas._path(ctx, points);
            return;
        }
        var ctrlPts = this._getCubicCurvePoints(points);
        var i, len = ctrlPts.length;
        for (i = 0; i < len; i += 6) {
            ctx.bezierCurveTo(ctrlPts[i], ctrlPts[i + 1], ctrlPts[i + 2], ctrlPts[i + 3], ctrlPts[i + 4], ctrlPts[i + 5]);
        }
    }
});

/**
 * @classdesc Circle Arc Curve
 * @class
 * @category geometry
 * @extends {maptalks.Curve}
 * @param {maptalks.Coordinate[]|Number[][]} coordinates - coordinates of the curve
 * @param {Object} [options=null]   - construct options defined in [maptalks.ArcCurve]{@link maptalks.ArcCurve#options}
 * @example
 * var curve = new maptalks.ArcCurve(
 *     [
 *         [121.47083767181408,31.214448123476995],
 *         [121.4751292062378,31.215475523000404],
 *         [121.47869117980943,31.211916269810335]
 *     ],
 *     {
 *         arcDegree : 120,
 *         symbol : {
 *             'lineWidth' : 5
 *         }
 *     }
 * ).addTo(layer);
 */
maptalks.ArcCurve = maptalks.Curve.extend(/** @lends maptalks.ArcCurve.prototype */{
    /**
     * @property {Object} options
     * @property {Number} [options.arcDegree=90]           - circle arc's degree.
     */
    options:{
        'arcDegree'     : 90
    },

    _toJSON: function (options) {
        return {
            'feature' : this.toGeoJSON(options),
            'subType' : 'ArcCurve'
        };
    },

    // paint method on canvas
    _paintOn: function (ctx, points, lineOpacity) {
        ctx.beginPath();
        this._arc(ctx, points, lineOpacity);
        maptalks.Canvas._stroke(ctx, lineOpacity);
        this._paintArrow(ctx, points, lineOpacity);
    }
});

maptalks.ArcCurve.fromJSON = function (json) {
    var feature = json['feature'];
    var arc = new maptalks.ArcCurve(feature['geometry']['coordinates'], json['options']);
    arc.setProperties(feature['properties']);
    return arc;
};

/**
 * @classdesc Quadratic Bezier Curve
 * @class
 * @category geometry
 * @extends {maptalks.Curve}
 * @param {maptalks.Coordinate[]|Number[][]} coordinates - coordinates of the curve
 * @example
 * var curve = new maptalks.QuadBezierCurve(
 *     [
 *         [121.47083767181408,31.214448123476995],
 *         [121.4751292062378,31.215475523000404],
 *         [121.47869117980943,31.211916269810335]
 *     ],
 *     {
 *         symbol : {
 *             'lineWidth' : 5
 *         }
 *     }
 * ).addTo(layer);
 */
maptalks.QuadBezierCurve = maptalks.Curve.extend(/** @lends maptalks.QuadBezierCurve.prototype */{

    _toJSON: function (options) {
        return {
            'feature' : this.toGeoJSON(options),
            'subType' : 'QuadBezierCurve'
        };
    },

    // paint method on canvas
    _paintOn: function (ctx, points, lineOpacity) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        this._quadraticCurve(ctx, points, lineOpacity);
        maptalks.Canvas._stroke(ctx, lineOpacity);

        this._paintArrow(ctx, points, lineOpacity);
    },

    _getArrowPlacement: function () {
        var placement = this.options['arrowPlacement'];
        // bezier curves doesn't support point arrows.
        if (placement === 'point') {
            placement = 'vertex-last';
        }
        return placement;
    }
});

maptalks.QuadBezierCurve.fromJSON = function (json) {
    var feature = json['feature'];
    var curve = new maptalks.QuadBezierCurve(feature['geometry']['coordinates'], json['options']);
    curve.setProperties(feature['properties']);
    return curve;
};

/**
 * @classdesc Cubic Bezier Curve
 * @class
 * @category geometry
 * @extends {maptalks.Curve}
 * @param {maptalks.Coordinate[]|Number[][]} coordinates - coordinates of the curve
 * @param {Object} [options=null]   - construct options defined in [maptalks.CubicBezierCurve]{@link maptalks.CubicBezierCurve#options}
 * @example
 * var curve = new maptalks.CubicBezierCurve(
 *     [
 *         [121.47083767181408,31.214448123476995],
 *         [121.4751292062378,31.215475523000404],
 *         [121.47869117980943,31.211916269810335]
 *     ],
 *     {
 *         symbol : {
 *             'lineWidth' : 5
 *         }
 *     }
 * ).addTo(layer);
 */
maptalks.CubicBezierCurve = maptalks.Curve.extend(/** @lends maptalks.CubicBezierCurve.prototype */{

    _toJSON: function (options) {
        return {
            'feature' : this.toGeoJSON(options),
            'subType' : 'CubicBezierCurve'
        };
    },

    // paint method on canvas
    _paintOn: function (ctx, points, lineOpacity) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        this._bezierCurve(ctx, points, lineOpacity);
        maptalks.Canvas._stroke(ctx, lineOpacity);
        this._paintArrow(ctx, points, lineOpacity);
    }
});

maptalks.CubicBezierCurve.fromJSON = function (json) {
    var feature = json['feature'];
    var curve = new maptalks.CubicBezierCurve(feature['geometry']['coordinates'], json['options']);
    curve.setProperties(feature['properties']);
    return curve;
};

(function () {
    /**
     * Mixin of connector line methods.
     * @mixin
     * @name connectorLineMixin
     */
    var connectorLineMixin = {

        initialize: function (src, target, options) {
            if (arguments.length === 1) {
                options = src;
                src = null;
                target = null;
            }
            this._connSource = src;
            this._connTarget = target;
            this._initOptions(options);
            this._registEvents();
        },

        /**
         * Gets the source of the connector line.
         * @return {maptalks.Geometry|maptalks.control.Control|maptalks.UIComponent}
         */
        getConnectSource:function () {
            return this._connSource;
        },

        /**
         * Sets the source to the connector line.
         * @param {maptalks.Geometry|maptalks.control.Control|maptalks.UIComponent} src
         * @return {maptalks.ConnectorLine} this
         */
        setConnectSource:function (src) {
            var target = this._connTarget;
            this.onRemove();
            this._connSource = src;
            this._connTarget = target;
            this._updateCoordinates();
            this._registEvents();
            return this;
        },

        /**
         * Gets the target of the connector line.
         * @return {maptalks.Geometry|maptalks.control.Control|maptalks.UIComponent}
         */
        getConnectTarget:function () {
            return this._connTarget;
        },

        /**
         * Sets the target to the connector line.
         * @param {maptalks.Geometry|maptalks.control.Control|maptalks.UIComponent} target
         * @return {maptalks.ConnectorLine} this
         */
        setConnectTarget:function (target) {
            var src = this._connSource;
            this.onRemove();
            this._connSource = src;
            this._connTarget = target;
            this._updateCoordinates();
            this._registEvents();
            return this;
        },

        _updateCoordinates:function () {
            var map = this.getMap();
            if (!map && this._connSource) {
                map = this._connSource.getMap();
            }
            if (!map && this._connTarget) {
                map = this._connTarget.getMap();
            }
            if (!map) {
                return;
            }
            if (!this._connSource || !this._connTarget) {
                return;
            }
            var srcPoints = this._connSource._getConnectPoints();
            var targetPoints = this._connTarget._getConnectPoints();
            var minDist = 0;
            var oldCoordinates = this.getCoordinates();
            var c1, c2;
            for (var i = 0, len = srcPoints.length; i < len; i++) {
                var p1 = srcPoints[i];
                for (var j = 0, length = targetPoints.length; j < length; j++) {
                    var p2 = targetPoints[j];
                    var dist = map.computeLength(p1, p2);
                    if (i === 0 && j === 0) {
                        c1 = p1;
                        c2 = p2;
                        minDist = dist;
                    } else if (dist < minDist) {
                        c1 = p1;
                        c2 = p2;
                    }
                }
            }
            if (!maptalks.Util.isArrayHasData(oldCoordinates) || (!oldCoordinates[0].equals(c1) || !oldCoordinates[1].equals(c2))) {
                this.setCoordinates([c1, c2]);
            }
        },

        onRemove: function () {
            if (this._connSource) {
                if (this._connSource.__connectors) {
                    maptalks.Util.removeFromArray(this, this._connSource.__connectors);
                }
                this._connSource.off('dragging positionchange', this._updateCoordinates, this)
                                .off('remove', this.onRemove, this);
                this._connSource.off('dragstart mousedown mouseover', this._showConnect, this);
                this._connSource.off('dragend mouseup mouseout', this.hide, this);
                this._connSource.off('show', this._showConnect, this).off('hide', this.hide, this);
                delete this._connSource;
            }
            if (this._connTarget) {
                maptalks.Util.removeFromArray(this, this._connTarget.__connectors);
                this._connTarget.off('dragging positionchange', this._updateCoordinates, this)
                                .off('remove', this.onRemove, this);
                this._connTarget.off('show', this._showConnect, this).off('hide', this.hide, this);
                delete this._connTarget;
            }
        },

        _showConnect:function () {
            if (!this._connSource || !this._connTarget) {
                return;
            }
            if ((this._connSource instanceof maptalks.control.Control || this._connSource.isVisible()) &&
                (this._connTarget instanceof maptalks.control.Control || this._connTarget.isVisible())) {
                this._updateCoordinates();
                this.show();
            }
        },

        _registEvents: function () {
            if (!this._connSource || !this._connTarget) {
                return;
            }
            if (!this._connSource.__connectors) {
                this._connSource.__connectors = [];
            }
            if (!this._connTarget.__connectors) {
                this._connTarget.__connectors = [];
            }
            this._connSource.__connectors.push(this);
            this._connTarget.__connectors.push(this);
            this._connSource.on('dragging positionchange', this._updateCoordinates, this)
                            .on('remove', this.remove, this);
            this._connTarget.on('dragging positionchange', this._updateCoordinates, this)
                            .on('remove', this.remove, this);
            this._connSource.on('show', this._showConnect, this).on('hide', this.hide, this);
            this._connTarget.on('show', this._showConnect, this).on('hide', this.hide, this);
            var trigger = this.options['showOn'];
            this.hide();
            if (trigger === 'moving') {
                this._connSource.on('dragstart', this._showConnect, this).on('dragend', this.hide, this);
                this._connTarget.on('dragstart', this._showConnect, this).on('dragend', this.hide, this);
            } else if (trigger === 'click') {
                this._connSource.on('mousedown', this._showConnect, this).on('mouseup', this.hide, this);
                this._connTarget.on('mousedown', this._showConnect, this).on('mouseup', this.hide, this);
            } else if (trigger === 'mouseover') {
                this._connSource.on('mouseover', this._showConnect, this).on('mouseout', this.hide, this);
                this._connTarget.on('mouseover', this._showConnect, this).on('mouseout', this.hide, this);
            } else {
                this._showConnect();
            }
        }
    };

    /**
     * A straight connector line geometry can connect geometries or ui components with each other. <br>
     *
     * @class
     * @category geometry
     * @extends maptalks.LineString
     * @param {maptalks.Geometry|maptalks.control.Control|maptalks.UIComponent} src     - source to connect
     * @param {maptalks.Geometry|maptalks.control.Control|maptalks.UIComponent} target  - target to connect
     * @param {Object} [options=null]                   - construct options defined in [maptalks.ConnectorLine]{@link maptalks.ConnectorLine#options}
     * @example
     * var src = new maptalks.Marker([0,0]).addTo(layer),
     *     dst = new maptalks.Marker([1,0]).addTo(layer),
     *     line = new maptalks.ConnectorLine(src, dst, {
     *         showOn : 'always', //'moving', 'click', 'mouseover', 'always'
     *         arrowStyle : 'classic',
     *         arrowPlacement : 'vertex-last', //vertex-first, vertex-last, vertex-firstlast, point
     *         symbol: {
     *           lineColor: '#34495e',
     *           lineWidth: 2
     *        }
     *     }).addTo(layer);
     * @mixes connectorLineMixin
     */
    maptalks.ConnectorLine = maptalks.LineString.extend({
        includes : [connectorLineMixin],
        /**
         * @property {Object} options - ConnectorLine's options
         * @property {String} [options.showOn=always]          - when to show the connector line, possible values: 'moving', 'click', 'mouseover', 'always'
         */
        options: {
            showOn : 'always'
        }
    });


    maptalks.Util.extend(maptalks.ConnectorLine, {
        _hasConnectors:function (geometry) {
            return (!maptalks.Util.isNil(geometry.__connectors) && geometry.__connectors.length > 0);
        },

        _getConnectors:function (geometry) {
            return geometry.__connectors;
        }
    });

    /**
     * An arc curve connector line geometry can connect geometries or ui components with each other. <br>
     *
     * @class
     * @category geometry
     * @extends maptalks.ArcCurve
     * @param {maptalks.Geometry|maptalks.control.Control|maptalks.UIComponent} src     - source to connect
     * @param {maptalks.Geometry|maptalks.control.Control|maptalks.UIComponent} target  - target to connect
     * @param {Object} [options=null]                   - construct options defined in [maptalks.ConnectorLine]{@link maptalks.ConnectorLine#options}
     * @example
     * var src = new maptalks.Marker([0,0]).addTo(layer),
     *     dst = new maptalks.Marker([1,0]).addTo(layer),
     *     line = new maptalks.ArcConnectorLine(src, dst, {
     *         arcDegree : 120,
     *         showOn : 'always', //'moving', 'click', 'mouseover', 'always'
     *         arrowStyle : 'classic',
     *         arrowPlacement : 'vertex-last', //vertex-first, vertex-last, vertex-firstlast, point
     *         symbol: {
     *           lineColor: '#34495e',
     *           lineWidth: 2
     *        }
     *     }).addTo(layer);
     * @mixes connectorLineMixin
     */
    maptalks.ArcConnectorLine = maptalks.ArcCurve.extend({
        includes : [connectorLineMixin],

        /**
         * @property {Object} options - ConnectorLine's options
         * @property {String} [options.showOn=always]          - when to show the connector line, possible values: 'moving', 'click', 'mouseover', 'always'
         */
        options: {
            showOn : 'always'
        }
    });
})();

/**
 * @classdesc
 * Represents a Ellipse Geometry, a child class of [maptalks.Polygon]{@link maptalks.Polygon}. <br>
 *     It means it shares all the methods defined in [maptalks.Polygon]{@link maptalks.Polygon} besides some overrided ones.
 * @class
 * @category geometry
 * @extends maptalks.Polygon
 * @mixes maptalks.Geometry.Center
 * @param {maptalks.Coordinate} center  - center of the ellipse
 * @param {Number} width                - width of the ellipse
 * @param {Number} height                - height of the ellipse
 * @param {Object}  [options=null] - construct options defined in [maptalks.Ellipse]{@link maptalks.Ellipse#options}
 * @example
 * var ellipse = new maptalks.Ellipse([100, 0], 1000, 500, {
 *     id : 'ellipse0'
 * });
 */
maptalks.Ellipse = maptalks.Polygon.extend(/** @lends maptalks.Ellipse.prototype */{
    includes:[maptalks.Geometry.Center],

    /**
     * @property {Object} [options=null]
     * @property {Number} [options.numberOfShellPoints=60]   - number of shell points when exporting the ellipse's shell coordinates as a polygon.
     */
    options:{
        'numberOfShellPoints':60
    },


    initialize:function (coordinates, width, height, opts) {
        this._coordinates = new maptalks.Coordinate(coordinates);
        this.width = width;
        this.height = height;
        this._initOptions(opts);
    },

    /**
     * Get ellipse's width
     * @return {Number}
     */
    getWidth:function () {
        return this.width;
    },

    /**
     * Set new width to ellipse
     * @param {Number} width - new width
     * @fires maptalks.Ellipse#shapechange
     * @return {maptalks.Ellipse} this
     */
    setWidth:function (width) {
        this.width = width;
        this.onShapeChanged();
        return this;
    },

    /**
     * Get ellipse's height
     * @return {Number}
     */
    getHeight:function () {
        return this.height;
    },

    /**
     * Set new height to ellipse
     * @param {Number} height - new height
     * @fires maptalks.Ellipse#shapechange
     * @return {maptalks.Ellipse} this
     */
    setHeight:function (height) {
        this.height = height;
        this.onShapeChanged();
        return this;
    },

    /**
     * Gets the shell of the ellipse as a polygon, number of the shell points is decided by [options.numberOfShellPoints]{@link maptalks.Circle#options}
     * @return {maptalks.Coordinate[]} - shell coordinates
     */
    getShell:function () {
        var measurer = this._getMeasurer(),
            center = this.getCoordinates(),
            numberOfPoints = this.options['numberOfShellPoints'],
            width = this.getWidth(),
            height = this.getHeight();
        var shell = [];
        var s = Math.pow(width / 2, 2) * Math.pow(height / 2, 2),
            sx = Math.pow(width / 2, 2),
            sy = Math.pow(height / 2, 2);
        var deg, rad, dx, dy;
        for (var i = 0; i < numberOfPoints; i++) {
            deg = 360 * i / numberOfPoints;
            rad = deg * Math.PI / 180;
            dx = Math.sqrt(s / (sx * Math.pow(Math.tan(rad), 2) + sy));
            dy = Math.sqrt(s / (sy * Math.pow(1 / Math.tan(rad), 2) + sx));
            if (deg > 90 && deg < 270) {
                dx *= -1;
            }
            if (deg > 180 && deg < 360) {
                dy *= -1;
            }
            var vertex = measurer.locate(center, dx, dy);
            shell.push(vertex);
        }
        return shell;
    },

    /**
     * Ellipse won't have any holes, always returns null
     * @return {null}
     */
    getHoles:function () {
        return null;
    },

    _containsPoint: function (point, tolerance) {
        var map = this.getMap(),
            t = maptalks.Util.isNil(tolerance) ? this._hitTestTolerance() : tolerance,
            pa = map.distanceToPixel(this.width / 2, 0),
            pb = map.distanceToPixel(0, this.height / 2),
            a = pa.width,
            b = pb.height,
            c = Math.sqrt(Math.abs(a * a - b * b)),
            xfocus = a >= b;
        var center = this._getCenter2DPoint();
        var f1, f2, d;
        if (xfocus) {
            f1 = new maptalks.Point(center.x - c, center.y);
            f2 = new maptalks.Point(center.x + c, center.y);
            d = a * 2;
        } else {
            f1 = new maptalks.Point(center.x, center.y - c);
            f2 = new maptalks.Point(center.x, center.y + c);
            d = b * 2;
        }
        point = new maptalks.Point(point.x, point.y);

        /*
         L1 + L2 = D
         L1 + t >= L1'
         L2 + t >= L2'
         D + 2t >= L1' + L2'
         */
        return point.distanceTo(f1) + point.distanceTo(f2) <= d + 2 * t;
    },

    _computeExtent:function (measurer) {
        if (!measurer || !this._coordinates || maptalks.Util.isNil(this.width) || maptalks.Util.isNil(this.height)) {
            return null;
        }
        var width = this.getWidth(),
            height = this.getHeight();
        var p1 = measurer.locate(this._coordinates, width / 2, height / 2);
        var p2 = measurer.locate(this._coordinates, -width / 2, -height / 2);
        return new maptalks.Extent(p1, p2);
    },

    _computeGeodesicLength:function () {
        if (maptalks.Util.isNil(this.width) || maptalks.Util.isNil(this.height)) {
            return 0;
        }
        //L=2πb+4(a-b)
        //近似值
        var longer = (this.width > this.height ? this.width : this.height);
        return 2 * Math.PI * longer / 2 - 4 * Math.abs(this.width - this.height);
    },

    _computeGeodesicArea:function () {
        if (maptalks.Util.isNil(this.width) || maptalks.Util.isNil(this.height)) {
            return 0;
        }
        return Math.PI * this.width * this.height / 4;
    },

    _exportGeoJSONGeometry: function () {
        var coordinates = maptalks.GeoJSON.toNumberArrays([this.getShell()]);
        return {
            'type' : 'Polygon',
            'coordinates' : coordinates
        };
    },

    _toJSON:function (options) {
        var opts = maptalks.Util.extend({}, options);
        var center = this.getCenter();
        opts.geometry = false;
        var feature = this.toGeoJSON(opts);
        feature['geometry'] = {
            'type' : 'Polygon'
        };
        return {
            'feature'   : feature,
            'subType'   : 'Ellipse',
            'coordinates'  : [center.x, center.y],
            'width'     : this.getWidth(),
            'height'    : this.getHeight()
        };
    }

});

maptalks.Ellipse.fromJSON = function (json) {
    var feature = json['feature'];
    var ellipse = new maptalks.Ellipse(json['coordinates'], json['width'], json['height'], json['options']);
    ellipse.setProperties(feature['properties']);
    return ellipse;
};

/**
 * @classdesc
 * Represents a Circle Geometry, a child class of [maptalks.Polygon]{@link maptalks.Polygon}. <br>
 *     It means it shares all the methods defined in [maptalks.Polygon]{@link maptalks.Polygon} besides some overrided ones.
 * @class
 * @category geometry
 * @extends maptalks.Polygon
 * @mixes maptalks.Geometry.Center
 * @param {maptalks.Coordinate} center - center of the circle
 * @param {Number} radius           - radius of the circle
 * @param {Object} [options=null]   - construct options defined in [maptalks.Circle]{@link maptalks.Circle#options}
 * @example
 * var circle = new maptalks.Circle([100, 0], 1000, {
 *     id : 'circle0'
 * });
 */
maptalks.Circle = maptalks.Polygon.extend(/** @lends maptalks.Circle.prototype */{
    includes:[maptalks.Geometry.Center],

    /**
     * @property {Object} options
     * @property {Number} [options.numberOfShellPoints=60]   - number of shell points when converting the circle to a polygon.
     */
    options:{
        'numberOfShellPoints':60
    },

    initialize:function (coordinates, radius, opts) {
        this._coordinates = new maptalks.Coordinate(coordinates);
        this._radius = radius;
        this._initOptions(opts);
    },

    /**
     * Get radius of the circle
     * @return {Number}
     */
    getRadius:function () {
        return this._radius;
    },

    /**
     * Set a new radius to the circle
     * @param {Number} radius - new radius
     * @return {maptalks.Circle} this
     * @fires maptalks.Circle#shapechange
     */
    setRadius:function (radius) {
        this._radius = radius;
        this.onShapeChanged();
        return this;
    },

    /**
     * Gets the shell of the circle as a polygon, number of the shell points is decided by [options.numberOfShellPoints]{@link maptalks.Circle#options}
     * @return {maptalks.Coordinate[]} - shell coordinates
     */
    getShell:function () {
        var measurer = this._getMeasurer(),
            center = this.getCoordinates(),
            numberOfPoints = this.options['numberOfShellPoints'],
            radius = this.getRadius();
        var shell = [],
            rad, dx, dy;
        for (var i = 0; i < numberOfPoints; i++) {
            rad = (360 * i / numberOfPoints) * Math.PI / 180;
            dx = radius * Math.cos(rad);
            dy = radius * Math.sin(rad);
            var vertex = measurer.locate(center, dx, dy);
            shell.push(vertex);
        }
        return shell;
    },

    /**
     * Circle won't have any holes, always returns null
     * @return {null}
     */
    getHoles:function () {
        return null;
    },

    _containsPoint: function (point, tolerance) {
        var center = this._getCenter2DPoint(),
            size = this.getSize(),
            t = maptalks.Util.isNil(tolerance) ? this._hitTestTolerance() : tolerance;
        return center.distanceTo(point) <= size.width / 2 + t;
    },

    _computeExtent:function (measurer) {
        if (!measurer || !this._coordinates || maptalks.Util.isNil(this._radius)) {
            return null;
        }

        var radius = this._radius;
        var p1 = measurer.locate(this._coordinates, radius, radius);
        var p2 = measurer.locate(this._coordinates, -radius, -radius);
        return new maptalks.Extent(p1, p2);
    },

    _computeGeodesicLength:function () {
        if (maptalks.Util.isNil(this._radius)) {
            return 0;
        }
        return Math.PI * 2 * this._radius;
    },

    _computeGeodesicArea:function () {
        if (maptalks.Util.isNil(this._radius)) {
            return 0;
        }
        return Math.PI * Math.pow(this._radius, 2);
    },

    _exportGeoJSONGeometry: function () {
        var coordinates = maptalks.GeoJSON.toNumberArrays([this.getShell()]);
        return {
            'type' : 'Polygon',
            'coordinates' : coordinates
        };
    },

    _toJSON:function (options) {
        var center = this.getCenter();
        var opts = maptalks.Util.extend({}, options);
        opts.geometry = false;
        var feature = this.toGeoJSON(opts);
        feature['geometry'] = {
            'type' : 'Polygon'
        };
        return {
            'feature' : feature,
            'subType' : 'Circle',
            'coordinates'  : [center.x, center.y],
            'radius'  : this.getRadius()
        };
    }

});

maptalks.Circle.fromJSON = function (json) {
    var feature = json['feature'];
    var circle = new maptalks.Circle(json['coordinates'], json['radius'], json['options']);
    circle.setProperties(feature['properties']);
    return circle;
};

/**
 * @classdesc
 * Represents a sector Geometry, a child class of [maptalks.Polygon]{@link maptalks.Polygon}. <br>
 *     It means it shares all the methods defined in [maptalks.Polygon]{@link maptalks.Polygon} besides some overrided ones.
 * @class
 * @category geometry
 * @extends maptalks.Polygon
 * @mixes maptalks.Geometry.Center
 * @param {maptalks.Coordinate} center - center of the sector
 * @param {Number} radius           - radius of the sector
 * @param {Number} startAngle       - start angle of the sector
 * @param {Number} endAngle         - end angle of the sector
 * @param {Object} [options=null]   - construct options defined in [maptalks.Sector]{@link maptalks.Sector#options}
 * @example
 * var sector = new maptalks.Sector([100, 0], 1000, 30, 120, {
 *     id : 'sector0'
 * });
 */
maptalks.Sector = maptalks.Polygon.extend(/** @lends maptalks.Sector.prototype */{
    includes:[maptalks.Geometry.Center],

    /**
     * @property {Object} options -
     * @property {Number} [options.numberOfShellPoints=60]   - number of shell points when converting the sector to a polygon.
     */
    options:{
        'numberOfShellPoints':60
    },


    initialize:function (coordinates, radius, startAngle, endAngle, opts) {
        this._coordinates = new maptalks.Coordinate(coordinates);
        this._radius = radius;
        this.startAngle = startAngle;
        this.endAngle = endAngle;
        this._initOptions(opts);
    },

    /**
     * Get radius of the sector
     * @return {Number}
     */
    getRadius:function () {
        return this._radius;
    },

    /**
     * Set a new radius to the sector
     * @param {Number} radius - new radius
     * @return {maptalks.Sector} this
     * @fires maptalks.Sector#shapechange
     */
    setRadius:function (radius) {
        this._radius = radius;
        this.onShapeChanged();
        return this;
    },

    /**
     * Get the sector's start angle
     * @return {Number}
     */
    getStartAngle:function () {
        return this.startAngle;
    },

    /**
     * Set a new start angle to the sector
     * @param {Number} startAngle
     * @return {maptalks.Sector} this
     * @fires maptalks.Sector#shapechange
     */
    setStartAngle:function (startAngle) {
        this.startAngle = startAngle;
        this.onShapeChanged();
        return this;
    },

    /**
     * Get the sector's end angle
     * @return {Number}
     */
    getEndAngle:function () {
        return this.endAngle;
    },

    /**
     * Set a new end angle to the sector
     * @param {Number} endAngle
     * @return {maptalks.Sector} this
     * @fires maptalks.Sector#shapechange
     */
    setEndAngle:function (endAngle) {
        this.endAngle = endAngle;
        this.onShapeChanged();
        return this;
    },

    /**
     * Gets the shell of the sector as a polygon, number of the shell points is decided by [options.numberOfShellPoints]{@link maptalks.Sector#options}
     * @return {maptalks.Coordinate[]} - shell coordinates
     */
    getShell:function () {
        var measurer = this._getMeasurer(),
            center = this.getCoordinates(),
            numberOfPoints = this.options['numberOfShellPoints'],
            radius = this.getRadius(),
            shell = [],
            angle = this.getEndAngle() - this.getStartAngle();
        var rad, dx, dy;
        for (var i = 0; i < numberOfPoints; i++) {
            rad = (angle * i / (numberOfPoints - 1) + this.getStartAngle()) * Math.PI / 180;
            dx = radius * Math.cos(rad);
            dy = radius * Math.sin(rad);
            var vertex = measurer.locate(center, dx, dy);
            shell.push(vertex);
        }
        return shell;

    },

    /**
     * Sector won't have any holes, always returns null
     * @return {null}
     */
    getHoles:function () {
        return null;
    },

    _containsPoint: function (point, tolerance) {
        var center = this._getCenter2DPoint(),
            t = maptalks.Util.isNil(tolerance) ? this._hitTestTolerance() : tolerance,
            size = this.getSize(),
            pc = center,
            pp = point,
            x = pp.x - pc.x,
            y = pc.y - pp.y,
            atan2 = Math.atan2(y, x),
            // [0.0, 360.0)
            angle = atan2 < 0 ? (atan2 + 2 * Math.PI) * 360 / (2 * Math.PI) :
                atan2 * 360 / (2 * Math.PI);
        var sAngle = this.startAngle % 360,
            eAngle = this.endAngle % 360;
        var between = false;
        if (sAngle > eAngle) {
            between = !(angle > eAngle && angle < sAngle);
        } else {
            between = (angle >= sAngle && angle <= eAngle);
        }

        // TODO: tolerance
        return pp.distanceTo(pc) <= (size.width / 2 + t) && between;
    },

    _computeExtent:function (measurer) {
        if (!measurer || !this._coordinates || maptalks.Util.isNil(this._radius)) {
            return null;
        }

        var radius = this._radius;
        var p1 = measurer.locate(this._coordinates, radius, radius);
        var p2 = measurer.locate(this._coordinates, -radius, -radius);
        return new maptalks.Extent(p1, p2);
    },

    _computeGeodesicLength:function () {
        if (maptalks.Util.isNil(this._radius)) {
            return 0;
        }
        return Math.PI * 2 * this._radius * Math.abs(this.startAngle - this.endAngle) / 360 + 2 * this._radius;
    },

    _computeGeodesicArea:function () {
        if (maptalks.Util.isNil(this._radius)) {
            return 0;
        }
        return Math.PI * Math.pow(this._radius, 2) * Math.abs(this.startAngle - this.endAngle) / 360;
    },

    _exportGeoJSONGeometry: function () {
        var coordinates = maptalks.GeoJSON.toNumberArrays([this.getShell()]);
        return {
            'type' : 'Polygon',
            'coordinates' : coordinates
        };
    },

    _toJSON:function (options) {
        var opts = maptalks.Util.extend({}, options);
        var center = this.getCenter();
        opts.geometry = false;
        var feature = this.toGeoJSON(opts);
        feature['geometry'] = {
            'type' : 'Polygon'
        };
        return {
            'feature'   :  feature,
            'subType'   :  'Sector',
            'coordinates'  :  [center.x, center.y],
            'radius'    :  this.getRadius(),
            'startAngle':  this.getStartAngle(),
            'endAngle'  :  this.getEndAngle()
        };
    }

});

maptalks.Sector.fromJSON = function (json) {
    var feature = json['feature'];
    var sector = new maptalks.Sector(json['coordinates'], json['radius'], json['startAngle'], json['endAngle'], json['options']);
    sector.setProperties(feature['properties']);
    return sector;
};

/**
 * @classdesc
 * Represents a Rectangle geometry, a child class of [maptalks.Polygon]{@link maptalks.Polygon}. <br>
 *     It means it shares all the methods defined in [maptalks.Polygon]{@link maptalks.Polygon} besides some overrided ones.
 * @class
 * @category geometry
 * @extends {maptalks.Polygon}
 * @param {maptalks.Coordinate} coordinates  - northwest of the rectangle
 * @param {Number} width                     - width of the rectangle
 * @param {Number} height                    - height of the rectangle
 * @param {Object} [options=null]            - options defined in [maptalks.Rectangle]{@link maptalks.Rectangle#options}
 * @example
 * var rectangle = new maptalks.Rectangle([100, 0], 1000, 500, {
 *     id : 'rectangle0'
 * });
 */
maptalks.Rectangle = maptalks.Polygon.extend(/** @lends maptalks.Rectangle.prototype */{

    initialize:function (coordinates, width, height, opts) {
        this._coordinates = new maptalks.Coordinate(coordinates);
        this._width = width;
        this._height = height;
        this._initOptions(opts);
    },


    /**
     * Get coordinates of rectangle's northwest
     * @return {maptalks.Coordinate}
     */
    getCoordinates:function () {
        return this._coordinates;
    },

    /**
     * Set a new coordinate for northwest of the rectangle
     * @param {maptalks.Coordinate} nw - coordinates of new northwest
     * @return {maptalks.Rectangle} this
     * @fires maptalks.Rectangle#positionchange
     */
    setCoordinates:function (nw) {
        this._coordinates = new maptalks.Coordinate(nw);

        if (!this._coordinates || !this.getMap()) {
            this.onPositionChanged();
            return this;
        }
        var projection = this._getProjection();
        this._setPrjCoordinates(projection.project(this._coordinates));
        return this;
    },

    /**
     * Get rectangle's width
     * @return {Number}
     */
    getWidth:function () {
        return this._width;
    },

    /**
     * Set new width to the rectangle
     * @param {Number} width - new width
     * @fires maptalks.Rectangle#shapechange
     * @return {maptalks.Rectangle} this
     */
    setWidth:function (width) {
        this._width = width;
        this.onShapeChanged();
        return this;
    },

    /**
     * Get rectangle's height
     * @return {Number}
     */
    getHeight:function () {
        return this._height;
    },

    /**
     * Set new height to rectangle
     * @param {Number} height - new height
     * @fires maptalks.Rectangle#shapechange
     * @return {maptalks.Rectangle} this
     */
    setHeight:function (height) {
        this._height = height;
        this.onShapeChanged();
        return this;
    },

   /**
     * Gets the shell of the rectangle as a polygon
     * @return {maptalks.Coordinate[]} - shell coordinates
     */
    getShell:function () {
        var measurer = this._getMeasurer();
        var nw = this._coordinates;
        var map = this.getMap();
        var r = -1;
        if (map) {
            var fExt = map.getFullExtent();
            if (fExt['bottom'] > fExt['top']) {
                r = 1;
            }
        }
        var points = [];
        points.push(nw);
        points.push(measurer.locate(nw, this._width, 0));
        points.push(measurer.locate(nw, this._width, r * this._height));
        points.push(measurer.locate(nw, 0, r * this._height));
        points.push(nw);
        return points;

    },

    /**
     * Rectangle won't have any holes, always returns null
     * @return {null}
     */
    getHoles:function () {
        return null;
    },

    _getPrjCoordinates:function () {
        var projection = this._getProjection();
        if (!projection) { return null; }
        if (!this._pnw) {
            if (this._coordinates) {
                this._pnw = projection.project(this._coordinates);
            }
        }
        return this._pnw;
    },


    _setPrjCoordinates:function (pnw) {
        this._pnw = pnw;
        this.onPositionChanged();
    },


    //update cached variables if geometry is updated.
    _updateCache:function () {
        delete this._extent;
        var projection = this._getProjection();
        if (this._pnw && projection) {
            this._coordinates = projection.unproject(this._pnw);
        }
    },

    _clearProjection:function () {
        this._pnw = null;
    },

    _computeCenter:function (measurer) {
        return measurer.locate(this._coordinates, this._width / 2, -this._height / 2);
    },

    _containsPoint: function (point, tolerance) {
        var map = this.getMap(),
            t = maptalks.Util.isNil(tolerance) ? this._hitTestTolerance() : tolerance,
            sp = map.coordinateToPoint(this._coordinates),
            pxSize = map.distanceToPixel(this._width, this._height);

        var pxMin = new maptalks.Point(sp.x, sp.y),
            pxMax = new maptalks.Point(sp.x + pxSize.width, sp.y + pxSize.height),
            pxExtent = new maptalks.PointExtent(pxMin.x - t, pxMin.y - t,
                                    pxMax.x + t, pxMax.y + t);

        point = new maptalks.Point(point.x, point.y);

        return pxExtent.contains(point);
    },

    _computeExtent:function (measurer) {
        if (!measurer || !this._coordinates || maptalks.Util.isNil(this._width) || maptalks.Util.isNil(this._height)) {
            return null;
        }
        var width = this.getWidth(),
            height = this.getHeight();
        var p1 = measurer.locate(this._coordinates, width, -height);
        return new maptalks.Extent(p1, this._coordinates);
    },

    _computeGeodesicLength:function () {
        if (maptalks.Util.isNil(this._width) || maptalks.Util.isNil(this._height)) {
            return 0;
        }
        return 2 * (this._width + this._height);
    },

    _computeGeodesicArea:function () {
        if (maptalks.Util.isNil(this._width) || maptalks.Util.isNil(this._height)) {
            return 0;
        }
        return this._width * this._height;
    },

    _exportGeoJSONGeometry: function () {
        var coordinates = maptalks.GeoJSON.toNumberArrays([this.getShell()]);
        return {
            'type' : 'Polygon',
            'coordinates' : coordinates
        };
    },

    _toJSON:function (options) {
        var opts = maptalks.Util.extend({}, options);
        var nw = this.getCoordinates();
        opts.geometry = false;
        var feature = this.toGeoJSON(opts);
        feature['geometry'] = {
            'type' : 'Polygon'
        };
        return {
            'feature'    :  feature,
            'subType'    :  'Rectangle',
            'coordinates': [nw.x, nw.y],
            'width'      : this.getWidth(),
            'height'     : this.getHeight()
        };
    }

});

maptalks.Rectangle.fromJSON = function (json) {
    var feature = json['feature'];
    var rect = new maptalks.Rectangle(json['coordinates'], json['width'], json['height'], json['options']);
    rect.setProperties(feature['properties']);
    return rect;
};

/**
 * @classdesc
 * Represents a GeometryCollection.
 * @class
 * @category geometry
 * @extends maptalks.Geometry
 * @param {maptalks.Geometry[]} geometries - GeometryCollection's geometries
 * @param {Object} [options=null] - options defined in [nmaptalks.GeometryCollection]{@link maptalks.GeometryCollection#options}
 * @example
 * var marker = new maptalks.Marker([0, 0]),
 *     line = new maptalks.LineString([[0, 0], [0, 1]]),
 *     polygon = new maptalks.Polygon([[0, 0], [0, 1], [1, 3]]);
 * var collection = new maptalks.GeometryCollection([marker, line, polygon])
 *     .addTo(layer);
 */
maptalks.GeometryCollection = maptalks.Geometry.extend(/** @lends maptalks.GeometryCollection.prototype */{
    type:maptalks.Geometry['TYPE_GEOMETRYCOLLECTION'],

    initialize:function (geometries, opts) {
        this._initOptions(opts);
        this.setGeometries(geometries);
    },

    /**
     * Set new geometries to the geometry collection
     * @param {maptalks.Geometry[]} geometries
     * @return {maptalks.GeometryCollection} this
     * @fires maptalks.GeometryCollection#shapechange
     */
    setGeometries:function (_geometries) {
        var geometries = this._checkGeometries(_geometries);
        //Set the collection as child geometries' parent.
        if (maptalks.Util.isArray(geometries)) {
            for (var i = geometries.length - 1; i >= 0; i--) {
                geometries[i]._initOptions(this.config());
                geometries[i]._setParent(this);
                geometries[i]._setEventParent(this);
                geometries[i].setSymbol(this.getSymbol());
            }
        }
        this._geometries = geometries;
        if (this.getLayer()) {
            this._bindGeometriesToLayer();
            this.onShapeChanged();
        }
        return this;
    },

    /**
     * Get geometries of the geometry collection
     * @return {maptalks.Geometry[]} geometries
     */
    getGeometries:function () {
        if (!this._geometries) {
            return [];
        }
        return this._geometries;
    },

    /**
     * Executes the provided callback once for each geometry present in the collection in order.
     * @param  {Function} fn             - a callback function
     * @param  {*} [context=undefined]   - callback's context
     * @return {maptalks.GeometryCollection} this
     */
    forEach: function (fn, context) {
        var geometries = this.getGeometries();
        for (var i = 0, len = geometries.length; i < len; i++) {
            if (!geometries[i]) {
                continue;
            }
            if (!context) {
                fn(geometries[i], i);
            } else {
                fn.call(context, geometries[i], i);
            }
        }
        return this;
    },

    /**
     * Creates a GeometryCollection with all elements that pass the test implemented by the provided function.
     * @param  {Function} fn      - Function to test each geometry
     * @param  {*} [context=undefined]    - Function's context
     * @return {maptalks.GeometryCollection} A GeometryCollection with all elements that pass the test
     */
    filter: function () {
        return maptalks.VectorLayer.prototype.filter.apply(this, arguments);
    },

    /**
     * Translate or move the geometry collection by the given offset.
     * @param  {maptalks.Coordinate} offset - translate offset
     * @return {maptalks.GeometryCollection} this
     */
    translate:function (offset) {
        if (!offset) {
            return this;
        }
        if (this.isEmpty()) {
            return this;
        }
        this.forEach(function (geometry) {
            if (geometry && geometry.translate) {
                geometry.translate(offset);
            }
        });
        return this;
    },

    /**
     * Whether the geometry collection is empty
     * @return {Boolean}
     */
    isEmpty:function () {
        return !maptalks.Util.isArrayHasData(this.getGeometries());
    },

    /**
     * remove itself from the layer if any.
     * @returns {maptalks.Geometry} this
     * @fires maptalks.GeometryCollection#removestart
     * @fires maptalks.GeometryCollection#remove
     * @fires maptalks.GeometryCollection#removeend
     */
    remove:function () {
        this.forEach(function (geometry) {
            geometry._unbind();
        });
        return maptalks.Geometry.prototype.remove.apply(this, arguments);
    },

    /**
     * Show the geometry collection.
     * @return {maptalks.GeometryCollection} this
     * @fires maptalks.GeometryCollection#show
     */
    show:function () {
        this.options['visible'] = true;
        this.forEach(function (geometry) {
            geometry.show();
        });
        return this;
    },

    /**
     * Hide the geometry collection.
     * @return {maptalks.GeometryCollection} this
     * @fires maptalks.GeometryCollection#hide
     */
    hide:function () {
        this.options['visible'] = false;
        this.forEach(function (geometry) {
            geometry.hide();
        });
        return this;
    },

    setSymbol:function (symbol) {
        symbol = this._prepareSymbol(symbol);
        this._symbol = symbol;
        this.forEach(function (geometry) {
            geometry.setSymbol(symbol);
        });
        this.onSymbolChanged();
        return this;
    },

    updateSymbol: function (symbol) {
        this.forEach(function (geometry) {
            geometry.updateSymbol(symbol);
        });
        this.onSymbolChanged();
        return this;
    },

    onConfig:function (config) {
        this.forEach(function (geometry) {
            geometry.config(config);
        });
    },

    _setExternSymbol:function (symbol) {
        symbol = this._prepareSymbol(symbol);
        this._externSymbol = symbol;
        this.forEach(function (geometry) {
            geometry._setExternSymbol(symbol);
        });
        this.onSymbolChanged();
        return this;
    },

    /**
     * bind this geometry collection to a layer
     * @param  {maptalks.Layer} layer
     * @private
     */
    _bindLayer:function () {
        maptalks.Geometry.prototype._bindLayer.apply(this, arguments);
        this._bindGeometriesToLayer();
    },

    _bindGeometriesToLayer:function () {
        var layer = this.getLayer();
        this.forEach(function (geometry) {
            geometry._bindLayer(layer);
        });
    },

    /**
     * Check whether the type of geometries is valid
     * @param  {maptalks.Geometry[]} geometries - geometries to check
     * @private
     */
    _checkGeometries:function (geometries) {
        var invalidGeoError = 'The geometry added to collection is invalid.';
        if (geometries && !maptalks.Util.isArray(geometries)) {
            if (geometries instanceof maptalks.Geometry) {
                return [geometries];
            } else {
                throw new Error(invalidGeoError);
            }
        } else if (maptalks.Util.isArray(geometries)) {
            for (var i = 0, len = geometries.length; i < len; i++) {
                if (!(geometries[i] instanceof maptalks.Geometry)) {
                    throw new Error(invalidGeoError + ' Index: ' + i);
                }
            }
            return geometries;
        }
        return null;
    },

    _updateCache:function () {
        delete this._extent;
        if (this.isEmpty()) {
            return;
        }
        this.forEach(function (geometry) {
            if (geometry && geometry._updateCache) {
                geometry._updateCache();
            }
        });
    },

    _removePainter:function () {
        if (this._painter) {
            this._painter.remove();
        }
        delete this._painter;
        this.forEach(function (geometry) {
            geometry._removePainter();
        });
    },

    _computeCenter:function (projection) {
        if (!projection || this.isEmpty()) {
            return null;
        }
        var sumX = 0, sumY = 0, counter = 0;
        var geometries = this.getGeometries();
        for (var i = 0, len = geometries.length; i < len; i++) {
            if (!geometries[i]) {
                continue;
            }
            var center = geometries[i]._computeCenter(projection);
            if (center) {
                sumX += center.x;
                sumY += center.y;
                counter++;
            }
        }
        if (counter === 0) {
            return null;
        }
        return new maptalks.Coordinate(sumX / counter, sumY / counter);
    },

    _containsPoint: function (point, t) {
        if (this.isEmpty()) {
            return false;
        }
        var i, len;
        var geometries = this.getGeometries();
        for (i = 0, len = geometries.length; i < len; i++) {
            if (geometries[i]._containsPoint(point, t)) {
                return true;
            }
        }

        return false;
    },

    _computeExtent:function (projection) {
        if (this.isEmpty()) {
            return null;
        }
        var geometries = this.getGeometries();
        var result = null;
        for (var i = 0, len = geometries.length; i < len; i++) {
            if (!geometries[i]) {
                continue;
            }
            var geoExtent = geometries[i]._computeExtent(projection);
            if (geoExtent) {
                result = geoExtent.combine(result);
            }
        }
        return result;
    },



    _computeGeodesicLength:function (projection) {
        if (!projection || this.isEmpty()) {
            return 0;
        }
        var geometries = this.getGeometries();
        var result = 0;
        for (var i = 0, len = geometries.length; i < len; i++) {
            if (!geometries[i]) {
                continue;
            }
            result += geometries[i]._computeGeodesicLength(projection);
        }
        return result;
    },

    _computeGeodesicArea:function (projection) {
        if (!projection || this.isEmpty()) {
            return 0;
        }
        var geometries = this.getGeometries();
        var result = 0;
        for (var i = 0, len = geometries.length; i < len; i++) {
            if (!geometries[i]) {
                continue;
            }
            result += geometries[i]._computeGeodesicArea(projection);
        }
        return result;
    },


    _exportGeoJSONGeometry:function () {
        var geoJSON = [];
        if (!this.isEmpty()) {
            var geometries = this.getGeometries();
            for (var i = 0, len = geometries.length; i < len; i++) {
                if (!geometries[i]) {
                    continue;
                }
                geoJSON.push(geometries[i]._exportGeoJSONGeometry());
            }
        }
        return {
            'type':         'GeometryCollection',
            'geometries':   geoJSON
        };
    },

    _clearProjection:function () {
        if (this.isEmpty()) {
            return;
        }
        var geometries = this.getGeometries();
        for (var i = 0, len = geometries.length; i < len; i++) {
            if (!geometries[i]) {
                continue;
            }
            geometries[i]._clearProjection();
        }

    },

    /**
     * Get connect points if being connected by [ConnectorLine]{@link maptalks.ConnectorLine}
     * @private
     * @return {maptalks.Coordinate[]}
     */
    _getConnectPoints: function () {
        var extent = this.getExtent();
        var anchors = [
            new maptalks.Coordinate(extent.xmin, extent.ymax),
            new maptalks.Coordinate(extent.xmax, extent.ymin),
            new maptalks.Coordinate(extent.xmin, extent.ymin),
            new maptalks.Coordinate(extent.xmax, extent.ymax)
        ];
        return anchors;
    },

    _getExternalResources:function () {
        if (this.isEmpty()) {
            return null;
        }
        var i, l, ii, ll;
        var geometries = this.getGeometries(),
            resources = [], symbol, res, cache = {}, key;
        for (i = 0, l = geometries.length; i < l; i++) {
            if (!geometries[i]) {
                continue;
            }
            symbol = geometries[i]._getInternalSymbol();
            res = maptalks.Util.getExternalResources(symbol);
            if (!res) {
                continue;
            }
            for (ii = 0, ll = res.length; ii < ll; ii++) {
                key = res[ii].join();
                if (!cache[key]) {
                    resources.push(res[ii]);
                    cache[key] = 1;
                }
            }
        }
        return resources;
    },

//----------覆盖Geometry中的编辑相关方法-----------------


    startEdit:function (opts) {
        if (this.isEmpty()) {
            return this;
        }
        if (!opts) {
            opts = {};
        }
        if (opts['symbol']) {
            this._originalSymbol = this.getSymbol();
            this.setSymbol(opts['symbol']);
        }
        this._draggbleBeforeEdit = this.options['draggable'];
        this.config('draggable', false);
        var geometries = this.getGeometries();
        for (var i = 0, len = geometries.length; i < len; i++) {
            geometries[i].startEdit(opts);
        }
        this._editing = true;
        this.hide();
        var me = this;
        setTimeout(function () {
            me.fire('editstart');
        }, 1);
        return this;
    },


    endEdit:function () {
        if (this.isEmpty()) {
            return this;
        }
        var geometries = this.getGeometries();
        for (var i = 0, len = geometries.length; i < len; i++) {
            geometries[i].endEdit();
        }
        if (this._originalSymbol) {
            this.setSymbol(this._originalSymbol);
            delete this._originalSymbol;
        }
        this._editing = false;
        this.show();
        this.config('draggable', this._draggbleBeforeEdit);
        this.fire('editend');
        return this;
    },


    isEditing:function () {
        if (!this._editing) {
            return false;
        }
        return true;
    }
});

/**
 * Common methods for MultiPoint, MultiLineString and MultiPolygon
 * @mixin maptalks.Geometry.MultiPoly
 */
maptalks.Geometry.MultiPoly = {
    /**
     * Get coordinates of the collection
     * @return {maptalks.Coordinate[]|maptalks.Coordinate[][]|maptalks.Coordinate[][][]} coordinates
     */
    getCoordinates:function () {
        var coordinates = [];
        var geometries = this.getGeometries();
        if (!maptalks.Util.isArray(geometries)) {
            return null;
        }
        for (var i = 0, len = geometries.length; i < len; i++) {
            coordinates.push(geometries[i].getCoordinates());
        }
        return coordinates;
    },

    /**
     * Set new coordinates to the collection
     * @param {maptalks.Coordinate[]|maptalks.Coordinate[][]|maptalks.Coordinate[][][]} coordinates
     * @returns {maptalks.Geometry} this
     * @fires maptalk.Geometry#shapechange
     */
    setCoordinates:function (coordinates) {
        if (maptalks.Util.isArrayHasData(coordinates)) {
            var geometries = [];
            for (var i = 0, len = coordinates.length; i < len; i++) {
                var p = new this.GeometryType(coordinates[i], this.config());
                geometries.push(p);
            }
            this.setGeometries(geometries);
        } else {
            this.setGeometries([]);
        }
        return this;
    },

    _initData:function (data) {
        if (maptalks.Util.isArrayHasData(data)) {
            if (data[0] instanceof this.GeometryType) {
                this.setGeometries(data);
            } else {
                this.setCoordinates(data);
            }
        }
    },

    _checkGeometries:function (geometries) {
        if (maptalks.Util.isArray(geometries)) {
            for (var i = 0, len = geometries.length; i < len; i++) {
                if (geometries[i] && !(geometries[i] instanceof this.GeometryType)) {
                    throw new Error('Geometry is not valid for collection, index:' + i);
                }
            }
        }
        return geometries;
    },

    //override _exportGeoJSONGeometry in GeometryCollection
    _exportGeoJSONGeometry:function () {
        var points = this.getCoordinates();
        var coordinates = maptalks.GeoJSON.toNumberArrays(points);
        return {
            'type':this.getType(),
            'coordinates': coordinates
        };
    }
};

/**
 * @classdesc
 * Represents a Geometry type of MultiPoint.
 * @class
 * @category geometry
 * @extends maptalks.GeometryCollection
 * @mixes maptalks.Geometry.MultiPoly
 * @param {Number[][]|maptalks.Coordinate[]|maptalks.Marker[]} data - construct data, coordinates or a array of markers
 * @param {Object} [options=null] - options defined in [nmaptalks.MultiPoint]{@link maptalks.MultiPoint#options}
 * @example
 * var multiPoint = new maptalks.MultiPoint(
 *     [
 *         [121.5080881906138, 31.241128104458117],
 *         [121.50804527526954, 31.237238340103413],
 *         [121.5103728890997, 31.23888972560888]
 *     ]
 * ).addTo(layer);
 */
maptalks.MultiPoint = maptalks.GeometryCollection.extend(/** @lends maptalks.MultiPoint.prototype */{
    includes:[maptalks.Geometry.MultiPoly],

    GeometryType:maptalks.Marker,

    type:maptalks.Geometry['TYPE_MULTIPOINT'],

    initialize:function (data, opts) {
        this._initOptions(opts);
        this._initData(data);
    }
});

/**
 * @classdesc
 * Represents a Geometry type of MultiLineString
 * @class
 * @category geometry
 * @extends maptalks.GeometryCollection
 * @mixes maptalks.Geometry.MultiPoly
 * @param {Number[][][]|maptalks.Coordinate[][]|maptalks.LineString[]} data - construct data, coordinates or a array of linestrings
 * @param {Object} [options=null]           - options defined in [maptalks.MultiLineString]{@link maptalks.MultiLineString#options}
 * @example
 * var multiLineString = new maptalks.MultiLineString(
 *      [
 *          [
 *              [121.5289450479131, 31.2420083925986],
 *              [121.52860172515919, 31.238926401171824]
 *          ],
 *          [
 *              [121.53091915374796, 31.241898323208233],
 *              [121.53104789978069, 31.23859618183896]
 *          ],
 *          [
 *               [121.5324641061405, 31.241898323208233],
 *               [121.53242119079626, 31.239146546752256]
 *           ]
 *       ],
 *       {
 *           symbol:{
 *               'lineColor' : '#000000',
 *               'lineWidth' : 5,
 *               'lineOpacity' : 1
 *           },
 *          draggable:true
 *      }
 * ).addTo(layer);
 */
maptalks.MultiLineString = maptalks.MultiPolyline = maptalks.GeometryCollection.extend(/** @lends maptalks.MultiLineString.prototype */{

    includes:[maptalks.Geometry.MultiPoly],

    GeometryType:maptalks.Polyline,

    type:maptalks.Geometry['TYPE_MULTILINESTRING'],

    initialize:function (data, opts) {
        this._initOptions(opts);
        this._initData(data);
    }
});

/**
 * @classdesc
 * Represents a Geometry type of MultiPolygon
 * @class
 * @category geometry
 * @category geometry
 * @extends maptalks.GeometryCollection
 * @mixes maptalks.Geometry.MultiPoly
 * @param {Number[][][][]|maptalks.Coordinate[][][]|maptalks.Polygon[]} data - construct data, coordinates or a array of polygons
 * @param {Object} [options=null]           - options defined in [maptalks.MultiPolygon]{@link maptalks.MultiPolygon#options}
 * @example
 * var multiPolygon = new maptalks.MultiPolygon(
 *       [
 *           [
 *               [
 *                   [121.55074604278596, 31.242008515751614],
 *                   [121.55074604278596, 31.23914637638951],
 *                   [121.55349262481711, 31.23914637638951],
 *                   [121.55349262481711, 31.24134802974913],
 *                   [121.5518618417361, 31.241384723537074],
 *                   [121.55074604278596, 31.242008515751614]
 *               ]
 *           ],
 *           [
 *               [
 *                   [121.5543080163576, 31.241054478932387],
 *                   [121.5543938470461, 31.240100432478293],
 *                   [121.55555256134048, 31.240173821009137],
 *                   [121.55542381530773, 31.240981091085693],
 *                   [121.5543080163576, 31.241054478932387]
 *               ]
 *           ]
 *
 *       ],
 *       {
 *           symbol:{
 *               'lineColor' : '#000000',
 *               'lineWidth' : 2,
 *               'lineDasharray' : null,//线形
 *               'lineOpacity' : 1,
 *               'polygonFill' : 'rgb(255, 0, 0)',
 *               'polygonOpacity' : 0.8
 *           },
 *           draggable:true
 * }).addTo(layer);
 */
maptalks.MultiPolygon = maptalks.GeometryCollection.extend(/** @lends maptalks.MultiPolygon.prototype */{
    includes:[maptalks.Geometry.MultiPoly],
    GeometryType:maptalks.Polygon,

    type:maptalks.Geometry['TYPE_MULTIPOLYGON'],

    initialize:function (data, opts) {
        this._initOptions(opts);
        this._initData(data);
    }
});

/**
 * @classdesc
 * GeoJSON utilities
 * @class
 * @category geometry
*  @memberOf maptalks
 * @name GeoJSON
 */
maptalks.GeoJSON = {

    /**
     * Convert one or more GeoJSON objects to a geometry
     * @param  {String|Object|Object[]} json - json objects or json string
     * @return {maptalks.Geometry|maptalks.Geometry[]} a geometry array when input is a FeatureCollection
     * @example
     * var collection = {
     *      "type": "FeatureCollection",
     *      "features": [
     *          { "type": "Feature",
     *            "geometry": {"type": "Point", "coordinates": [102.0, 0.5]},
     *            "properties": {"prop0": "value0"}
     *           },
     *           { "type": "Feature",
     *             "geometry": {
     *                 "type": "LineString",
     *                 "coordinates": [
     *                     [102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0]
     *                 ]
     *             },
     *             "properties": {
     *                 "prop0": "value0",
     *                 "prop1": 0.0
     *             }
     *           },
     *           { "type": "Feature",
     *             "geometry": {
     *                 "type": "Polygon",
     *                 "coordinates": [
     *                     [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0],
     *                       [100.0, 1.0], [100.0, 0.0] ]
     *                 ]
     *             },
     *             "properties": {
     *                 "prop0": "value0",
     *                 "prop1": {"this": "that"}
     *             }
     *          }
     *      ]
     *  }
     *  // a geometry array.
     *  var geometries = maptalks.GeoJSON.toGeometry(collection);
     */
    toGeometry:function (geoJSON) {
        if (maptalks.Util.isString(geoJSON)) {
            geoJSON = maptalks.Util.parseJSON(geoJSON);
        }
        if (maptalks.Util.isArray(geoJSON)) {
            var resultGeos = [];
            for (var i = 0, len = geoJSON.length; i < len; i++) {
                var geo = this._convert(geoJSON[i]);
                if (maptalks.Util.isArray(geo)) {
                    resultGeos = resultGeos.concat(geo);
                } else {
                    resultGeos.push(geo);
                }
            }
            return resultGeos;
        } else {
            var resultGeo = this._convert(geoJSON);
            return resultGeo;
        }

    },

    /**
     * Convert one or more maptalks.Coordinate objects to GeoJSON style coordinates
     * @param  {maptalks.Coordinate|maptalks.Coordinate[]} coordinates - coordinates to convert
     * @return {Number[]|Number[][]}
     * @example
     * // result is [[100,0], [101,1]]
     * var numCoords = maptalks.GeoJSON.toNumberArrays([new maptalks.Coordinate(100,0), new maptalks.Coordinate(101,1)]);
     */
    toNumberArrays:function (coordinates) {
        if (!maptalks.Util.isArray(coordinates)) {
            return [coordinates.x, coordinates.y];
        }
        return maptalks.Util.mapArrayRecursively(coordinates, function (coord) {
            return [coord.x, coord.y];
        });
    },

    /**
     * Convert one or more GeoJSON style coordiantes to maptalks.Coordinate objects
     * @param  {Number[]|Number[][]} coordinates - coordinates to convert
     * @return {maptalks.Coordinate|maptalks.Coordinate[]}
     * @example
     * var coordinates = maptalks.GeoJSON.toCoordinates([[100,0], [101,1]]);
     */
    toCoordinates:function (coordinates) {
        if (maptalks.Util.isNumber(coordinates[0]) && maptalks.Util.isNumber(coordinates[1])) {
            return new maptalks.Coordinate(coordinates);
        }
        var result = [];
        for (var i = 0, len = coordinates.length; i < len; i++) {
            var child = coordinates[i];
            if (maptalks.Util.isArray(child)) {
                if (maptalks.Util.isNumber(child[0])) {
                    result.push(new maptalks.Coordinate(child));
                } else {
                    result.push(this.toCoordinates(child));
                }
            } else {
                result.push(new maptalks.Coordinate(child));
            }
        }
        return result;
    },

    /**
     * Convert single GeoJSON object
     * @param  {Object} geoJSONObj - a GeoJSON object
     * @return {maptalks.Geometry}
     * @private
     */
    _convert:function (json) {
        if (!json || maptalks.Util.isNil(json['type'])) {
            return null;
        }
        var options = {};

        var type = json['type'];
        if (type === 'Feature') {
            var g = json['geometry'];
            var geometry = this._convert(g);
            if (!geometry) {
                return null;
            }
            geometry.setId(json['id']);
            geometry.setProperties(json['properties']);
            return geometry;
        } else if (type === 'FeatureCollection') {
            var features = json['features'];
            if (!features) {
                return null;
            }
            //返回geometry数组
            var result = maptalks.GeoJSON.toGeometry(features);
            return result;
        } else if (maptalks.Util.indexOfArray(type,
            ['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon']) >= 0) {
            var clazz = (type === 'Point' ? 'Marker' : type);
            return new maptalks[clazz](json['coordinates'], options);
        } else if (type === 'GeometryCollection') {
            var geometries = json['geometries'];
            if (!maptalks.Util.isArrayHasData(geometries)) {
                return new maptalks.GeometryCollection();
            }
            var mGeos = [];
            var size = geometries.length;
            for (var i = 0; i < size; i++) {
                mGeos.push(this._convert(geometries[i]));
            }
            return new maptalks.GeometryCollection(mGeos, options);
        } else if (type === 'Circle') {
            return new maptalks.Circle(json['coordinates'], json['radius'], options);
        } else if (type === 'Ellipse' || type === 'Rectangle') {
            return new maptalks[type](json['coordinates'], json['width'], json['height'], options);
        } else if (type === 'Sector') {
            return new maptalks.Sector(json['coordinates'], json['radius'], json['startAngle'], json['endAngle'], options);
        }
        return null;
    }
};

/**
 * Geometry editor used internally for geometry editing.
 * @class
 * @category geometry
 * @protected
 * @extends maptalks.Class
 * @mixes maptalks.Eventable
 * @param {maptalks._shadow} geometry 待编辑图形
 * @param {Object} opts 属性
 */
maptalks.Geometry.Editor = maptalks.Class.extend(/** @lends maptalks.Geometry.Editor.prototype */{
    includes: [maptalks.Eventable],

    editStageLayerIdPrefix : maptalks.internalLayerPrefix + '_edit_stage_',

    initialize:function (geometry, opts) {
        this._geometry = geometry;
        if (!this._geometry) { return; }
        maptalks.Util.setOptions(this, opts);
    },

    getMap:function () {
        return this._geometry.getMap();
    },

    prepare:function () {
        var map = this.getMap();
        if (!map) { return; }
        /**
         * 保存原有的symbol
         */
        if (this.options['symbol']) {
            this._originalSymbol = this._geometry.getSymbol();
            this._geometry.setSymbol(this.options['symbol']);
        }

        this._prepareEditStageLayer();
    },

    _prepareEditStageLayer:function () {
        var map = this.getMap();
        var uid = maptalks.Util.UID();
        this._editStageLayer = map.getLayer(this.editStageLayerIdPrefix + uid);
        if (!this._editStageLayer) {
            this._editStageLayer = new maptalks.VectorLayer(this.editStageLayerIdPrefix + uid);
            map.addLayer(this._editStageLayer);
        }
    },

    /**
     * 开始编辑
     */
    start:function () {
        if (!this._geometry || !this._geometry.getMap() || this._geometry.editing) { return; }
        this.editing = true;
        var geometry = this._geometry;
        this._geometryDraggble = geometry.options['draggable'];
        geometry.config('draggable', false);
        this.prepare();
        //edits are applied to a shadow of geometry to improve performance.
        var shadow = geometry.copy();
        shadow.setSymbol(geometry._getInternalSymbol());
        //geometry copy没有将event复制到新建的geometry,对于编辑这个功能会存在一些问题
        //原geometry上可能绑定了其它监听其click/dragging的事件,在编辑时就无法响应了.
        shadow.copyEventListeners(geometry);
        if (geometry._getParent()) {
            shadow.copyEventListeners(geometry._getParent());
        }
        //drag shadow by center handle instead.
        shadow.setId(null).config({'draggable': false});

        this._shadow = shadow;

        this._switchGeometryEvents('on');

        geometry.hide();
        if (geometry instanceof maptalks.Marker ||
                geometry instanceof maptalks.Circle ||
                geometry instanceof maptalks.Rectangle ||
                geometry instanceof maptalks.Ellipse) {
            //ouline has to be added before shadow to let shadow on top of it, otherwise shadow's events will be overrided by outline
            this._createOrRefreshOutline();
        }
        this._editStageLayer.bringToFront().addGeometry(shadow);
        if (!(geometry instanceof maptalks.Marker)) {
            this._createCenterHandle();
        } else {
            shadow.config('draggable', true);
            shadow.on('dragend', this._onShadowDragEnd, this);
        }
        if (geometry instanceof maptalks.Marker) {
            this.createMarkerEditor();
        } else if (geometry instanceof maptalks.Circle) {
            this.createCircleEditor();
        } else if (geometry instanceof maptalks.Rectangle) {
            this.createEllipseOrRectEditor();
        } else if (geometry instanceof maptalks.Ellipse) {
            this.createEllipseOrRectEditor();
        } else if (geometry instanceof maptalks.Sector) {
            // TODO: createSectorEditor
        } else if ((geometry instanceof maptalks.Polygon) ||
                   (geometry instanceof maptalks.Polyline)) {
            this.createPolygonEditor();
        }

    },

    /**
     * 结束编辑
     * @return {*} [description]
     */
    stop:function () {
        this._switchGeometryEvents('off');
        var map = this.getMap();
        if (!map) {
            return;
        }
        if (this._shadow) {
            this._update();
            this._shadow._clearAllListeners();
            this._shadow.remove();
            delete this._shadow;
        }
        this._geometry.config('draggable', this._geometryDraggble);
        delete this._geometryDraggble;
        this._geometry.show();

        this._editStageLayer.remove();
        if (maptalks.Util.isArrayHasData(this._eventListeners)) {
            for (var i = this._eventListeners.length - 1; i >= 0; i--) {
                var listener = this._eventListeners[i];
                listener[0].off(listener[1], listener[2], this);
            }
            this._eventListeners = [];
        }
        this._refreshHooks = [];
        if (this.options['symbol']) {
            this._geometry.setSymbol(this._originalSymbol);
            delete this._originalSymbol;
        }
        this.editing = false;
    },

    isEditing:function () {
        if (maptalks.Util.isNil(this.editing)) {
            return false;
        }
        return this.editing;
    },

    _getGeometryEvents: function () {
        return {
            'symbolchange' : this._onGeometrySymbolChange
        };
    },

    _switchGeometryEvents: function (oper) {
        if (this._geometry) {
            var events = this._getGeometryEvents();
            for (var p in events) {
                this._geometry[oper](p, events[p], this);
            }
        }
    },

    _onGeometrySymbolChange: function (param) {
        if (this._shadow) {
            this._shadow.setSymbol(param['target']._getInternalSymbol());
        }
    },

    _onShadowDragEnd:function () {
        this._update();
        this._refresh();
    },

    _update:function () {
        //update geographical properties from shadow to geometry
        this._geometry.setCoordinates(this._shadow.getCoordinates());
        if (this._geometry.getRadius) {
            this._geometry.setRadius(this._shadow.getRadius());
        }
        if (this._geometry.getWidth) {
            this._geometry.setWidth(this._shadow.getWidth());
        }
        if (this._geometry.getHeight) {
            this._geometry.setHeight(this._shadow.getHeight());
        }
        if (this._geometry.getStartAngle) {
            this._geometry.setStartAngle(this._shadow.getStartAngle());
        }
        if (this._geometry.getEndAngle) {
            this._geometry.setEndAngle(this._shadow.getEndAngle());
        }
    },

    _updateAndFireEvent:function (eventName) {
        if (!this._shadow) {
            return;
        }
        this._update();
        this._geometry.fire(eventName);
    },

    /**
     * create rectangle outline of the geometry
     */
    _createOrRefreshOutline:function () {
        var geometry = this._geometry,
            map = this.getMap(),
            outline = this._editOutline;
        var pixelExtent = geometry._getPainter().get2DExtent(),
            size = pixelExtent.getSize();
        var nw = map.pointToCoordinate(pixelExtent.getMin());
        var width = map.pixelToDistance(size['width'], 0),
            height = map.pixelToDistance(0, size['height']);
        if (!outline) {
            outline = new maptalks.Rectangle(nw, width, height, {
                'symbol':{
                    'lineWidth' : 1,
                    'lineColor' : '6b707b'
                }
            });
            this._editStageLayer.addGeometry(outline);
            this._editOutline = outline;
            this._addRefreshHook(this._createOrRefreshOutline);
        } else {
            outline.setCoordinates(nw);
            outline.setWidth(width);
            outline.setHeight(height);
        }

        return outline;
    },


    _createCenterHandle:function () {
        var me = this;
        var center = this._shadow.getCenter();
        var shadow;
        var handle = me.createHandle(center, {
            'markerType' : 'ellipse',
            'dxdy'       : new maptalks.Point(0, 0),
            'cursor'     : 'move',
            onDown:function () {
                shadow = this._shadow.copy();
                var symbol = maptalks.Util.lowerSymbolOpacity(shadow._getInternalSymbol(), 0.5);
                shadow.setSymbol(symbol).addTo(this._editStageLayer);
            },
            onMove:function (v, param) {
                var dragOffset = param['dragOffset'];
                if (shadow) {
                    shadow.translate(dragOffset);
                    this._geometry.translate(dragOffset);
                }
            },
            onUp:function () {
                if (shadow) {
                    this._shadow.setCoordinates(this._geometry.getCoordinates());
                    shadow.remove();
                    me._refresh();
                }
            }
        });
        this._addRefreshHook(function () {
            var center = this._shadow.getCenter();
            handle.setCoordinates(center);
        });
    },

    _createHandleInstance:function (coordinate, opts) {
        var symbol = {
            'markerType'        : opts['markerType'],
            'markerFill'        : '#ffffff', //"#d0d2d6",
            'markerLineColor'   : '#000000',
            'markerLineWidth'   : 2,
            'markerWidth'       : 10,
            'markerHeight'      : 10,
            'markerDx'          : opts['dxdy'].x,
            'markerDy'          : opts['dxdy'].y
        };
        if (opts['symbol']) {
            maptalks.Util.extend(symbol, opts['symbol']);
        }
        var handle = new maptalks.Marker(coordinate, {
            'draggable' : true,
            'dragShadow' : false,
            'dragOnAxis' : opts['axis'],
            'cursor'    : opts['cursor'],
            'symbol'    : symbol
        });
        return handle;
    },

    createHandle:function (coordinate, opts) {
        if (!opts) {
            opts = {};
        }
        var map = this.getMap();
        var handle = this._createHandleInstance(coordinate, opts);
        var me = this;
        function onHandleDragstart(param) {
            if (opts.onDown) {
                opts.onDown.call(me, param['viewPoint'], param);
            }
        }
        function onHandleDragging(param) {
            me._hideContext();
            var viewPoint = map._prjToViewPoint(handle._getPrjCoordinates());
            if (opts.onMove) {
                opts.onMove.call(me, viewPoint, param);
            }
        }
        function onHandleDragEnd(ev) {
            if (opts.onUp) {
                opts.onUp.call(me, ev);
            }
        }
        handle.on('dragstart', onHandleDragstart, this);
        handle.on('dragging', onHandleDragging, this);
        handle.on('dragend', onHandleDragEnd, this);
        //拖动移图
        if (opts.onRefresh) {
            handle['maptalks--editor-refresh-fn'] = opts.onRefresh;
        }
        this._editStageLayer.addGeometry(handle);
        return handle;
    },

    /**
     * create resize handles for geometry that can resize.
     * @param {Array} blackList handle indexes that doesn't display, to prevent change a geometry's coordinates
     * @param {fn} onHandleMove callback
     */
    _createResizeHandles:function (blackList, onHandleMove) {
        //cursor styles.
        var cursors = [
            'nw-resize', 'n-resize', 'ne-resize',
            'w-resize',            'e-resize',
            'sw-resize', 's-resize', 'se-resize'
        ];
        //defines dragOnAxis of resize handle
        var axis = [
            null, 'y', null,
            'x',       'x',
            null, 'y', null
        ];
        var geometry = this._geometry;
        function getResizeAnchors(ext) {
            return [
                ext.getMin(),
                new maptalks.Point((ext['xmax'] + ext['xmin']) / 2, ext['ymin']),
                new maptalks.Point(ext['xmax'], ext['ymin']),
                new maptalks.Point(ext['xmin'], (ext['ymax'] + ext['ymin']) / 2),
                new maptalks.Point(ext['xmax'], (ext['ymax'] + ext['ymin']) / 2),
                new maptalks.Point(ext['xmin'], ext['ymax']),
                new maptalks.Point((ext['xmax'] + ext['xmin']) / 2, ext['ymax']),
                ext.getMax()
            ];
        }
        if (!blackList) {
            blackList = [];
        }
        var resizeHandles = [];
        var anchorIndexes = {};
        var me = this, map = this.getMap();
        var fnLocateHandles = function () {
            var pExt = geometry._getPainter().get2DExtent(),
                anchors = getResizeAnchors(pExt);
            for (var i = 0; i < anchors.length; i++) {
                //ignore anchors in blacklist
                if (maptalks.Util.isArrayHasData(blackList)) {
                    var isBlack = false;
                    for (var ii = blackList.length - 1; ii >= 0; ii--) {
                        if (blackList[ii] === i) {
                            isBlack = true;
                            break;
                        }
                    }
                    if (isBlack) {
                        continue;
                    }
                }
                var anchor = anchors[i],
                    coordinate = map.pointToCoordinate(anchor);
                if (resizeHandles.length < anchors.length - blackList.length) {
                    var handle = me.createHandle(coordinate, {
                        'markerType' : 'square',
                        'dxdy'       : new maptalks.Point(0, 0),
                        'cursor'     : cursors[i],
                        'axis'       : axis[i],
                        onMove:(function (_index) {
                            return function (handleViewPoint) {
                                onHandleMove(handleViewPoint, _index);
                            };
                        })(i),
                        onUp:function () {
                            me._refresh();
                        }
                    });
                    handle.setId(i);
                    anchorIndexes[i] = resizeHandles.length;
                    resizeHandles.push(handle);
                } else {
                    resizeHandles[anchorIndexes[i]].setCoordinates(coordinate);
                }
            }

        };

        fnLocateHandles();
        //refresh hooks to refresh handles' coordinates
        this._addRefreshHook(fnLocateHandles);
        return resizeHandles;
    },

    /**
     * 标注和自定义标注编辑器
     */
    createMarkerEditor:function () {
        var me = this;
        var marker = this._shadow,
            geometryToEdit = this._geometry,
            map = this.getMap(),
            resizeHandles;
        function onZoomStart() {
            if (maptalks.Util.isArrayHasData(resizeHandles)) {
                for (var i = resizeHandles.length - 1; i >= 0; i--) {
                    resizeHandles[i].hide();
                }
            }
            if (this._editOutline) {
                this._editOutline.hide();
            }
        }
        function onZoomEnd() {
            this._refresh();
            if (maptalks.Util.isArrayHasData(resizeHandles)) {
                for (var i = resizeHandles.length - 1; i >= 0; i--) {
                    resizeHandles[i].show();
                }
            }
            if (this._editOutline) {
                this._editOutline.show();
            }
        }
        if (!marker._canEdit()) {
            if (console) {
                console.warn('A marker can\'t be resized with symbol:', marker.getSymbol());
            }
            return;
        }
        //only image marker and vector marker can be edited now.

        var symbol = marker._getInternalSymbol();
        var dxdy = new maptalks.Point(0, 0);
        if (maptalks.Util.isNumber(symbol['markerDx'])) {
            dxdy.x = symbol['markerDx'];
        }
        if (maptalks.Util.isNumber(symbol['markerDy'])) {
            dxdy.y = symbol['markerDy'];
        }

        var blackList = null;

        if (maptalks.symbolizer.VectorMarkerSymbolizer.test(symbol)) {
            if (symbol['markerType'] === 'pin' || symbol['markerType'] === 'pie' || symbol['markerType'] === 'bar') {
                //as these types of markers' anchor stands on its bottom
                blackList = [5, 6, 7];
            }
        } else if (maptalks.symbolizer.ImageMarkerSymbolizer.test(symbol) ||
                    maptalks.symbolizer.VectorPathMarkerSymbolizer.test(symbol)) {
            blackList = [5, 6, 7];
        }

        //defines what can be resized by the handle
        //0: resize width; 1: resize height; 2: resize both width and height.
        var resizeAbilities = [
            2, 1, 2,
            0,    0,
            2, 1, 2
        ];

        resizeHandles = this._createResizeHandles(null, function (handleViewPoint, i) {
            if (blackList && maptalks.Util.indexOfArray(i, blackList) >= 0) {
                //need to change marker's coordinates
                var newCoordinates = map.viewPointToCoordinate(handleViewPoint.substract(dxdy));
                var coordinates = marker.getCoordinates();
                newCoordinates.x = coordinates.x;
                marker.setCoordinates(newCoordinates);
                geometryToEdit.setCoordinates(newCoordinates);
                //coordinates changed, and use mirror handle instead to caculate width and height
                var mirrorHandle = resizeHandles[resizeHandles.length - 1 - i];
                var mirrorViewPoint = map.coordinateToViewPoint(mirrorHandle.getCoordinates());
                handleViewPoint = mirrorViewPoint;
            }

            //caculate width and height
            var viewCenter = map._pointToViewPoint(marker._getCenter2DPoint()).add(dxdy),
                symbol = marker._getInternalSymbol();
            var wh = handleViewPoint.substract(viewCenter);
            if (blackList && handleViewPoint.y > viewCenter.y) {
                wh.y = 0;
            }

            var aspectRatio;
            if (me.options['fixAspectRatio']) {
                var size = marker.getSize();
                aspectRatio = size.width / size.height;
            }

            //if this marker's anchor is on its bottom, height doesn't need to multiply by 2.
            var r = blackList ? 1 : 2;
            var width = Math.abs(wh.x) * 2,
                height = Math.abs(wh.y) * r;
            if (aspectRatio) {
                width = Math.max(width, height * aspectRatio);
                height = width / aspectRatio;
            }
            var ability = resizeAbilities[i];
            if (!(marker instanceof maptalks.TextMarker)) {
                if (aspectRatio || ability === 0 || ability === 2) {
                    symbol['markerWidth'] = width;
                }
                if (aspectRatio || ability === 1 || ability === 2) {
                    symbol['markerHeight'] = height;
                }
                marker.setSymbol(symbol);
                geometryToEdit.setSymbol(symbol);
            } else {
                if (aspectRatio || ability === 0 || ability === 2) {
                    geometryToEdit.config('boxMinWidth', width);
                    marker.config('boxMinWidth', width);
                }
                if (aspectRatio || ability === 1 || ability === 2) {
                    geometryToEdit.config('boxMinHeight', height);
                    marker.config('boxMinHeight', height);
                }
            }
        });
        this._addListener([map, 'zoomstart', onZoomStart]);
        this._addListener([map, 'zoomend', onZoomEnd]);

    },

    /**
     * 圆形编辑器
     * @return {*} [description]
     */
    createCircleEditor:function () {
        var shadow = this._shadow,
            circle = this._geometry;
        var map = this.getMap();
        this._createResizeHandles(null, function (handleViewPoint) {
            var viewCenter = map._pointToViewPoint(shadow._getCenter2DPoint());
            var wh = handleViewPoint.substract(viewCenter);
            var w = Math.abs(wh.x),
                h = Math.abs(wh.y);
            var r;
            if (w > h) {
                r = map.pixelToDistance(w, 0);
            } else {
                r = map.pixelToDistance(0, h);
            }
            shadow.setRadius(r);
            circle.setRadius(r);
        });
    },

    /**
     * editor of ellipse or rectangle
     * @return {*} [description]
     */
    createEllipseOrRectEditor:function () {
        var me = this;
        //defines what can be resized by the handle
        //0: resize width; 1: resize height; 2: resize both width and height.
        var resizeAbilities = [
            2, 1, 2,
            0,    0,
            2, 1, 2
        ];
        var shadow = this._shadow,
            geometryToEdit = this._geometry;
        var map = this.getMap();
        var isRect = this._geometry instanceof maptalks.Rectangle;
        var resizeHandles = this._createResizeHandles(null, function (handleViewPoint, i) {
            //ratio of width and height
            var r;
            var wh, w, h;
            var aspectRatio;
            if (me.options['fixAspectRatio']) {
                aspectRatio = geometryToEdit.getWidth() / geometryToEdit.getHeight();
            }
            if (isRect) {
                var anchorHandle = resizeHandles[7 - i];
                var anchorViewPoint = map.coordinateToViewPoint(anchorHandle.getCoordinates());
                var currentSize = geometryToEdit.getSize();
                if (aspectRatio) {
                    wh = handleViewPoint.substract(anchorViewPoint);

                    var awh = wh.abs();
                    if (wh.x !== 0 && wh.y !== 0) {
                        w = Math.max(awh.x, awh.y * aspectRatio);
                        h = w / aspectRatio;
                    } else if (wh.x === 0) {
                        h = awh.y;
                        w = h * aspectRatio;
                    } else if (wh.y === 0) {
                        w = awh.x;
                        h = w / aspectRatio;
                    }
                    handleViewPoint.x = anchorViewPoint.x + (wh.x === 0 ? -currentSize.width / 2 : wh.x / awh.x * w);
                    handleViewPoint.y = anchorViewPoint.y + (wh.y === 0 ? -currentSize.height / 2 : wh.y / awh.y * h);
                    wh = new maptalks.Point(w, h);
                } else {
                    wh = handleViewPoint.substract(anchorViewPoint)._abs();
                    if (wh.x === 0) {
                        handleViewPoint.x = anchorViewPoint.x - currentSize.width / 2;
                    }
                    if (wh.y === 0) {
                        handleViewPoint.y = anchorViewPoint.y - currentSize.height / 2;
                    }
                }
                //change rectangle's coordinates
                var newCoordinates = map.viewPointToCoordinate(new maptalks.Point(Math.min(handleViewPoint.x, anchorViewPoint.x), Math.min(handleViewPoint.y, anchorViewPoint.y)));
                shadow.setCoordinates(newCoordinates);
                geometryToEdit.setCoordinates(newCoordinates);
                r = 1;
            } else {
                r = 2;
                var viewCenter = map.coordinateToViewPoint(geometryToEdit.getCenter());
                if (aspectRatio) {
                    wh = viewCenter.substract(handleViewPoint)._abs();
                    w = Math.max(wh.x, wh.y * aspectRatio);
                    h = w / aspectRatio;
                    wh.x = w;
                    wh.y = h;
                } else {
                    wh = viewCenter.substract(handleViewPoint)._abs();
                }
            }

            var ability = resizeAbilities[i];
            w = map.pixelToDistance(wh.x, 0);
            h = map.pixelToDistance(0, wh.y);
            if (aspectRatio || ability === 0 || ability === 2) {
                shadow.setWidth(w * r);
                geometryToEdit.setWidth(w * r);
            }
            if (aspectRatio || ability === 1 || ability === 2) {
                shadow.setHeight(h * r);
                geometryToEdit.setHeight(h * r);
            }
            // me._updateAndFireEvent('shapechange');
        });
    },

    /**
     * 多边形和多折线的编辑器
     * @return {*} [description]
     */
    createPolygonEditor:function () {

        var map = this.getMap(),
            shadow = this._shadow,
            me = this,
            projection = map.getProjection();
        var verticeLimit = shadow instanceof maptalks.Polygon ? 3 : 2;
        var propertyOfVertexRefreshFn = 'maptalks--editor-refresh-fn',
            propertyOfVertexIndex = 'maptalks--editor-vertex-index';
        var vertexHandles = [],
            newVertexHandles = [];
        function getVertexCoordinates() {
            if (shadow instanceof maptalks.Polygon) {
                var coordinates = shadow.getCoordinates()[0];
                return coordinates.slice(0, coordinates.length - 1);
            } else {
                return shadow.getCoordinates();
            }

        }
        function getVertexPrjCoordinates() {
            return shadow._getPrjCoordinates();
        }
        function onVertexAddOrRemove() {
            //restore index property of each handles.
            var i;
            for (i = vertexHandles.length - 1; i >= 0; i--) {
                vertexHandles[i][propertyOfVertexIndex] = i;
            }
            for (i = newVertexHandles.length - 1; i >= 0; i--) {
                newVertexHandles[i][propertyOfVertexIndex] = i;
            }
        }

        function removeVertex(param) {
            var handle = param['target'],
                index = handle[propertyOfVertexIndex];
            var prjCoordinates = getVertexPrjCoordinates();
            if (prjCoordinates.length <= verticeLimit) {
                return;
            }
            prjCoordinates.splice(index, 1);
            shadow._setPrjCoordinates(prjCoordinates);
            shadow._updateCache();
            //remove vertex handle
            vertexHandles.splice(index, 1)[0].remove();
            //remove two neighbor "new vertex" handles
            if (index < newVertexHandles.length) {
                newVertexHandles.splice(index, 1)[0].remove();
            }
            var nextIndex;
            if (index === 0) {
                nextIndex = newVertexHandles.length - 1;
            } else {
                nextIndex = index - 1;
            }
            newVertexHandles.splice(nextIndex, 1)[0].remove();
            //add a new "new vertex" handle.
            newVertexHandles.splice(nextIndex, 0, createNewVertexHandle.call(me, nextIndex));
            onVertexAddOrRemove();
        }
        function moveVertexHandle(handleViewPoint, index) {
            var vertice = getVertexPrjCoordinates();
            var nVertex = map._viewPointToPrj(handleViewPoint);
            var pVertex = vertice[index];
            pVertex.x = nVertex.x;
            pVertex.y = nVertex.y;
            shadow._updateCache();
            shadow.onShapeChanged();
            var nextIndex;
            if (index === 0) {
                nextIndex = newVertexHandles.length - 1;
            } else {
                nextIndex = index - 1;
            }
            //refresh two neighbor "new vertex" handles.
            if (newVertexHandles[index]) {
                newVertexHandles[index][propertyOfVertexRefreshFn]();
            }
            if (newVertexHandles[nextIndex]) {
                newVertexHandles[nextIndex][propertyOfVertexRefreshFn]();
            }

            me._updateAndFireEvent('shapechange');
        }
        function createVertexHandle(index) {
            var vertex = getVertexCoordinates()[index];
            var handle = me.createHandle(vertex, {
                'markerType' : 'square',
                'dxdy'       : new maptalks.Point(0, 0),
                'cursor'     : 'pointer',
                'axis'       : null,
                onMove:function (handleViewPoint) {
                    moveVertexHandle(handleViewPoint, handle[propertyOfVertexIndex]);
                },
                onRefresh:function () {
                    vertex = getVertexCoordinates()[handle[propertyOfVertexIndex]];
                    handle.setCoordinates(vertex);
                },
                onUp:function () {
                    me._refresh();
                }
            });
            handle[propertyOfVertexIndex] = index;
            handle.on('contextmenu', removeVertex);
            return handle;
        }
        function createNewVertexHandle(index) {
            var vertexCoordinates = getVertexCoordinates();
            var nextVertex;
            if (index + 1 >= vertexCoordinates.length) {
                nextVertex = vertexCoordinates[0];
            } else {
                nextVertex = vertexCoordinates[index + 1];
            }
            var vertex = vertexCoordinates[index].add(nextVertex).multi(1 / 2);
            var handle = me.createHandle(vertex, {
                'markerType' : 'square',
                'symbol'     : {'opacity' : 0.4},
                'dxdy'       : new maptalks.Point(0, 0),
                'cursor'     : 'pointer',
                'axis'       : null,
                onDown:function () {
                    var prjCoordinates = getVertexPrjCoordinates();
                    var vertexIndex = handle[propertyOfVertexIndex];
                    //add a new vertex
                    var pVertex = projection.project(handle.getCoordinates());
                    //update shadow's vertice
                    prjCoordinates.splice(vertexIndex + 1, 0, pVertex);
                    shadow._setPrjCoordinates(prjCoordinates);
                    shadow._updateCache();

                    var symbol = handle.getSymbol();
                    delete symbol['opacity'];
                    handle.setSymbol(symbol);

                    //add two "new vertex" handles
                    newVertexHandles.splice(vertexIndex, 0, createNewVertexHandle.call(me, vertexIndex), createNewVertexHandle.call(me, vertexIndex + 1));
                    me._updateAndFireEvent('shapechange');
                },
                onMove:function (handleViewPoint) {
                    moveVertexHandle(handleViewPoint, handle[propertyOfVertexIndex] + 1);
                },
                onUp:function () {
                    var vertexIndex = handle[propertyOfVertexIndex];
                    //remove this handle
                    maptalks.Util.removeFromArray(handle, newVertexHandles);
                    handle.remove();
                    //add a new vertex handle
                    vertexHandles.splice(vertexIndex + 1, 0, createVertexHandle.call(me, vertexIndex + 1));
                    onVertexAddOrRemove();
                },
                onRefresh:function () {
                    vertexCoordinates = getVertexCoordinates();
                    var vertexIndex = handle[propertyOfVertexIndex];
                    var nextIndex;
                    if (vertexIndex === vertexCoordinates.length - 1) {
                        nextIndex = 0;
                    } else {
                        nextIndex = vertexIndex + 1;
                    }
                    var refreshVertex = vertexCoordinates[vertexIndex].add(vertexCoordinates[nextIndex]).multi(1 / 2);
                    handle.setCoordinates(refreshVertex);
                }
            });
            handle[propertyOfVertexIndex] = index;
            return handle;
        }
        var vertexCoordinates = getVertexCoordinates();
        for (var i = 0, len = vertexCoordinates.length; i < len; i++) {
            vertexHandles.push(createVertexHandle.call(this, i));
            if (i < len - 1) {
                newVertexHandles.push(createNewVertexHandle.call(this, i));
            }
        }
        if (shadow instanceof maptalks.Polygon) {
            //1 more vertex handle for polygon
            newVertexHandles.push(createNewVertexHandle.call(this, vertexCoordinates.length - 1));
        }
        this._addRefreshHook(function () {
            var i;
            for (i = newVertexHandles.length - 1; i >= 0; i--) {
                newVertexHandles[i][propertyOfVertexRefreshFn]();
            }
            for (i = vertexHandles.length - 1; i >= 0; i--) {
                vertexHandles[i][propertyOfVertexRefreshFn]();
            }
        });
    },

    _refresh:function () {
        if (this._refreshHooks) {
            for (var i = this._refreshHooks.length - 1; i >= 0; i--) {
                this._refreshHooks[i].call(this);
            }
        }
    },

    _hideContext:function () {
        if (this._geometry) {
            this._geometry.closeMenu();
            this._geometry.closeInfoWindow();
        }
    },

    _addListener:function (listener) {
        if (!this._eventListeners) {
            this._eventListeners = [];
        }
        this._eventListeners.push(listener);
        listener[0].on(listener[1], listener[2], this);
    },

    _addRefreshHook:function (fn) {
        if (!fn) {
            return;
        }
        if (!this._refreshHooks) {
            this._refreshHooks = [];
        }
        this._refreshHooks.push(fn);
    }

});


/**
 * @mixin maptalks.TextMarker.Edit
 */
maptalks.TextMarker.Editor = {
    /**
     * Start to edit the text, editing will be ended automatically whenever map is clicked.
     *
     * @return {maptalks.TextMarker} this
     * @fires maptalks.TextMarker#edittextstart
     */
    startEditText: function () {
        if (!this.getMap()) {
            return this;
        }
        this.hide();
        this.endEditText();
        this._prepareEditor();
        /**
         * edittextstart when starting to edit text content
         * @event maptalks.TextMarker#edittextstart
         * @type {Object}
         * @property {String} type - edittextstart
         * @property {maptalks.TextMarker} target - fires the event
         */
        this._fireEvent('edittextstart');
        return this;
    },

    /**
     * End text edit.
     *
     * @return {maptalks.TextMarker} this
     * @fires maptalks.TextMarker#edittextend
     */
    endEditText: function () {
        if (this._textEditor) {
            var content = this._textEditor.innerText;
            content = this._filterContent(content);
            this.setContent(content);
            this.show();
            maptalks.DomUtil.off(this._textEditor, 'mousedown dblclick', maptalks.DomUtil.stopPropagation);
            this.getMap().off('mousedown', this.endEditText, this);
            this._editUIMarker.remove();
            delete this._editUIMarker;
            this._textEditor.onkeyup = null;
            delete this._textEditor;
            /**
             * edittextend when ended editing text content
             * @event maptalks.TextMarker#edittextend
             * @type {Object}
             * @property {String} type - edittextend
             * @property {maptalks.TextMarker} target - textMarker fires the event
             */
            this._fireEvent('edittextend');
        }
        return this;
    },

    /**
     * Whether the text is being edited.
     *
     * @return {Boolean}
     */
    isEditingText: function () {
        if (this._textEditor) {
            return true;
        }
        return false;
    },

    /**
     * Get the text editor which is a [maptalks.ui.UIMarker]{@link maptalks.ui.UIMarker}
     * @return {maptalks.ui.UIMarker} text editor
     */
    getTextEditor: function () {
        return this._editUIMarker;
    },

    _prepareEditor:function () {
        var map = this.getMap();
        var editContainer = this._createEditor();
        this._textEditor = editContainer;
        map.on('mousedown',  this.endEditText, this);
        var offset = this._getEditorOffset();
        this._editUIMarker = new maptalks.ui.UIMarker(this.getCoordinates(), {
            'content' : editContainer,
            'dx' : offset.dx,
            'dy' : offset.dy
        }).addTo(map).show();
        this._setCursorToLast(this._textEditor);
    },

    _getEditorOffset: function () {
        var symbol = this._getInternalSymbol() || {}, dx = 0, dy = 0;
        var textAlign = symbol['textHorizontalAlignment'];
        if (textAlign === 'middle') {
            dx = symbol['textDx'] - 2 || 0;
            dy = symbol['textDy'] - 2 || 0;
        } else if (textAlign === 'left') {
            dx = symbol['markerDx'] - 2 || 0;
            dy = symbol['markerDy'] - 2 || 0;
        } else {
            dx = symbol['markerDx'] - 2 || 0;
            dy = symbol['markerDy'] - 2 || 0;
        }
        return {'dx' : dx, 'dy' : dy};
    },

    _createEditor: function () {
        var content = this.getContent();
        var labelSize = this.getSize(),
            symbol = this._getInternalSymbol() || {},
            width = (content && content.length > 0) ? (Math.max(labelSize['width'], this.options['boxMinWidth']) || 100) : 100,
            textColor = symbol['textFill'] || '#000000',
            textSize = symbol['textSize'] || 12,
            height = Math.max(labelSize['height'], this.options['boxMinHeight']) || textSize * 1.5,
            lineColor = symbol['markerLineColor'] || '#000',
            fill = symbol['markerFill'] || '#3398CC',
            spacing = symbol['textLineSpacing'] || 0;
            // opacity = symbol['markerFillOpacity'];
        var editor = maptalks.DomUtil.createEl('div');
        editor.contentEditable = true;
        editor.style.cssText = 'background: ' + fill + ';' +
            'border: 1px solid ' + lineColor + ';' +
            'color: ' + textColor + ';' +
            'font-size: ' + textSize + 'px;' +
            'width: ' + (width - 2) + 'px;' +
            'height: ' + (height - 2) + 'px;' +
            'margin-left: auto;' +
            'margin-right: auto;' +
            'line-height: ' + (textSize + spacing) + 'px;' +
            'outline: 0;' +
            'word-wrap: break-word;' +
            'overflow-x: hidden;' +
            'overflow-y: hidden;' +
            '-webkit-user-modify: read-write-plaintext-only;';

        editor.innerText = content;
        maptalks.DomUtil.on(editor, 'mousedown dblclick', maptalks.DomUtil.stopPropagation);
        editor.onkeyup =  function (event) {
            var h = editor.style.height;
            if (!h) {
                h = 0;
            }
            if (event.keyCode === 13) {
                editor.style.height = (parseInt(h) + textSize) + 'px';
            }
        };
        return editor;
    },

    _setCursorToLast: function (obj) {
        var range;
        if (window.getSelection) {
            obj.focus();
            range = window.getSelection();
            range.selectAllChildren(obj);
            range.collapseToEnd();
        } else if (document.selection) {
            range = document.selection.createRange();
            range.moveToElementText(obj);
            range.collapse(false);
            range.select();
        }
    },

    _filterContent: function (content) {
        var pattern = /\\[v f t b]{1}/gi;
        var enterPattern = /[\r\n]+$/gi;
        var result = content.replace(pattern, '');
        result = result.replace(enterPattern, '');
        return result;
    }
};

maptalks.TextBox.include(maptalks.TextMarker.Editor);
maptalks.Label.include(maptalks.TextMarker.Editor);

maptalks.View = function (options) {
    if (!options) {
        options = {};
    }
    this.options = options;
    this._initView();
};

maptalks.Util.extend(maptalks.View.prototype, {
    defaultView: {
        'EPSG:3857' : {
            'resolutions' : (function () {
                var resolutions = [];
                var d = 2 * 6378137 * Math.PI;
                for (var i = 0; i < 21; i++) {
                    resolutions[i] = d / (256 * Math.pow(2, i));
                }
                return resolutions;
            })(),
            'fullExtent': {
                'top'   : 6378137 * Math.PI,
                'left'  : -6378137 * Math.PI,
                'bottom': -6378137 * Math.PI,
                'right' : 6378137 * Math.PI
            }
        },
        'EPSG:4326' : {
            'fullExtent': {
                'top':90,
                'left':-180,
                'bottom':-90,
                'right':180
            },
            'resolutions' : (function () {
                var resolutions = [];
                for (var i = 0; i < 21; i++) {
                    resolutions[i] = 180 / (Math.pow(2, i) * 128);
                }
                return resolutions;
            })()
        },
        'BAIDU' : {
            'resolutions' : (function () {
                var res = Math.pow(2, 18);
                var resolutions = [];
                for (var i = 0; i < 20; i++) {
                    resolutions[i] = res;
                    res *= 0.5;
                }
                resolutions[0] = null;
                resolutions[1] = null;
                resolutions[2] = null;
                return resolutions;
            })(),
            'fullExtent' : {
                'top':33554432,
                'left':-33554432,
                'bottom':-33554432,
                'right':33554432
            }
        }

    },

    _initView : function () {
        var projection = this.options['projection'];
        if (projection) {
            if (maptalks.Util.isString(projection)) {
                for (var p in maptalks.projection) {
                    if (maptalks.projection.hasOwnProperty(p)) {
                        var regName = maptalks.projection[p]['code'];
                        if (regName && regName.toLowerCase() === projection.toLowerCase()) {
                            projection = maptalks.projection[p];
                            break;
                        }
                    }
                }
            }
        } else {
            projection = maptalks.projection.DEFAULT;
        }
        if (!projection || maptalks.Util.isString(projection)) {
            throw new Error('must provide a valid projection in map\'s view.');
        }
        projection = maptalks.Util.extend({}, maptalks.projection.Common, projection);
        if (!projection.measureLength) {
            maptalks.Util.extend(projection, maptalks.MeasurerUtil.DEFAULT);
        }
        this._projection = projection;
        var defaultView,
            resolutions = this.options['resolutions'];
        if (!resolutions) {
            if (projection['code']) {
                defaultView = this.defaultView[projection['code']];
                if (defaultView) {
                    resolutions = defaultView['resolutions'];
                }
            }
            if (!resolutions) {
                throw new Error('must provide valid resolutions in map\'s view.');
            }
        }
        this._resolutions = resolutions;
        var fullExtent = this.options['fullExtent'];
        if (!fullExtent) {
            if (projection['code']) {
                defaultView = this.defaultView[projection['code']];
                if (defaultView) {
                    fullExtent = defaultView['fullExtent'];
                }
            }
            if (!fullExtent) {
                throw new Error('must provide a valid fullExtent in map\'s view.');
            }
        }
        if (!maptalks.Util.isNil(fullExtent['left'])) {
            this._fullExtent = new maptalks.Extent(new maptalks.Coordinate(fullExtent['left'], fullExtent['top']),
                            new maptalks.Coordinate(fullExtent['right'], fullExtent['bottom']));
        } else {
            //xmin, ymin, xmax, ymax
            this._fullExtent = new maptalks.Extent(fullExtent);
            fullExtent['left'] = fullExtent['xmin'];
            fullExtent['right'] = fullExtent['xmax'];
            fullExtent['top'] = fullExtent['ymax'];
            fullExtent['bottom'] = fullExtent['ymin'];
        }

        //set left, right, top, bottom value
        maptalks.Util.extend(this._fullExtent, fullExtent);

        var a = fullExtent['right'] >= fullExtent['left'] ? 1 : -1,
            b = fullExtent['top'] >= fullExtent['bottom'] ? -1 : 1;
        this._transformation = new maptalks.Transformation([a, b, 0, 0]);
    },

    getResolutions:function () {
        return this._resolutions;
    },

    getResolution:function (z) {
        if (z < 0) {
            z = 0;
        } else if (z > this._resolutions.length - 1) {
            z = this._resolutions.length - 1;
        }
        return this._resolutions[z];
    },

    getProjection:function () {
        return this._projection;
    },

    getFullExtent:function () {
        return this._fullExtent;
    },

    getTransformation:function () {
        return this._transformation;
    },

    getMinZoom:function () {
        for (var i = 0; i < this._resolutions.length; i++) {
            if (!maptalks.Util.isNil(this._resolutions[i])) {
                return i;
            }
        }
        return 0;
    },

    getMaxZoom:function () {
        for (var i = this._resolutions.length - 1; i >= 0; i--) {
            if (!maptalks.Util.isNil(this._resolutions[i])) {
                return i;
            }
        }
        return this._resolutions.length - 1;
    }

});


(function () {
    function parse(arcConf) {
        var tileInfo = arcConf['tileInfo'],
            tileSize = {'width' : tileInfo['cols'], 'height' : tileInfo['rows']},
            resolutions = [],
            lods = tileInfo['lods'];
        for (var i = 0, len = lods.length; i < len; i++) {
            resolutions.push(lods[i]['resolution']);
        }
        var fullExtent = arcConf['fullExtent'],

            origin = tileInfo['origin'],
            tileSystem = [1, -1, origin['x'], origin['y']];
        delete fullExtent['spatialReference'];
        return {
            'view' : {
                'resolutions' : resolutions,
                'fullExtent' : fullExtent
            },
            'tileSystem' : tileSystem,
            'tileSize' : tileSize
        };
    }

    maptalks.View.loadArcgis = function (url, cb, context) {
        if (maptalks.Util.isString(url) && url.substring(0, 1) !== '{') {
            maptalks.Ajax.getJSON(url, function (err, json) {
                if (err) {
                    if (context) {
                        cb.call(context, err);
                    } else {
                        cb(err);
                    }
                    return;
                }
                var view = parse(json);
                if (context) {
                    cb.call(context, null, view);
                } else {
                    cb(null, view);
                }
            });
        } else {
            if (maptalks.Util.isString(url)) {
                url = maptalks.Util.parseJSON(url);
            }
            var view = parse(url);
            if (context) {
                cb.call(context, null, view);
            } else {
                cb(null, view);
            }

        }
        return this;
    };

})();

/**
 *
 * @class
 * @category map
 * @extends {maptalks.Class}
 *
 * @param {(string|HTMLElement|object)} container - The container to create the map on, can be:<br>
 *                                          1. A HTMLElement container.<br/>
 *                                          2. ID of a HTMLElement container.<br/>
 *                                          3. A canvas compatible container in node,
 *                                          e.g. [node-canvas]{@link https://github.com/Automattic/node-canvas},
 *                                              [canvas2svg]{@link https://github.com/gliffy/canvas2svg}
 * @param {Object} options - construct options
 * @param {(Number[]|maptalks.Coordinate)} options.center - initial center of the map.
 * @param {Number} options.zoom - initial zoom of the map.
 * @param {Object} [options.view=null] - map's view config, default is using projection EPSG:3857 with resolutions used by google map/osm.
 * @param {maptalks.Layer} [options.baseLayer=null] - base layer that will be set to map initially.
 * @param {maptalks.Layer[]} [options.layers=null] - layers that will be added to map initially.
 * @param {*} options.* - any other option defined in [Map.options]{@link maptalks.Map#options}
 *
 * @mixes maptalks.Eventable
 * @mixes maptalks.Handlerable
 * @mixes maptalks.ui.Menu.Mixin
 *
 * @classdesc
 * The central class of the library, to create a map on a container.
 * @example
 * var map = new maptalks.Map("map",{
        center:     [180,0],
        zoom:  4,
        baseLayer : new maptalks.TileLayer("base",{
            urlTemplate:'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            subdomains:['a','b','c']
        }),
        layers : [
            new VectorLayer('v')
            .addGeometry(new maptalks.Marker([180, 0]))
        ]
    });
 */
maptalks.Map = maptalks.Class.extend(/** @lends maptalks.Map.prototype */{

    includes: [maptalks.Eventable, maptalks.Handlerable],

    /**
     * @property {Object} options                                   - map's options, options must be updated by config method:<br> map.config('zoomAnimation', false);
     * @property {Boolean} [options.centerCross=false]              - Display a red cross in the center of map
     * @property {Boolean} [options.clipFullExtent=false]           - clip geometries outside map's full extent
     * @property {Boolean} [options.zoomAnimation=true]             - enable zooming animation
     * @property {Number}  [options.zoomAnimationDuration=330]      - zoom animation duration.
     * @property {Boolean} [options.zoomBackground=true]            - leaves a background after zooming.
     * @property {Boolean} [options.layerZoomAnimation=true]        - also animate layers when zooming.
     * @property {Boolean} [options.layerTransforming=true]         - update points when transforming (e.g. zoom animation), this may bring drastic low performance when rendering a large number of points.
     * @property {Boolean} [options.panAnimation=true]              - continue to animate panning when draging or touching ended.
     * @property {Boolean} [options.panAnimationDuration=600]       - duration of pan animation.
     * @property {Boolean} [options.zoomable=true]                  - whether to enable map zooming.
     * @property {Boolean} [options.enableInfoWindow=true]          - whether to enable infowindow on this map.
     * @property {Boolean} [options.hitDetect=true]                 - whether to enable hit detecting of layers for cursor style on this map, disable it to improve performance.
     * @property {Number}  [options.maxZoom=null]                   - the maximum zoom the map can be zooming to.
     * @property {Number}  [options.minZoom=null]                   - the minimum zoom the map can be zooming to.
     * @property {maptalks.Extent} [options.maxExtent=null]         - when maxExtent is set, map will be restricted to the give max extent and bouncing back when user trying to pan ouside the extent.
     *
     * @property {Boolean} [options.draggable=true]                         - disable the map dragging if set to false.
     * @property {Boolean} [options.doublClickZoom=true]                    - whether to allow map to zoom by double click events.
     * @property {Boolean} [options.scrollWheelZoom=true]                   - whether to allow map to zoom by scroll wheel events.
     * @property {Boolean} [options.touchZoom=true]                         - whether to allow map to zoom by touch events.
     * @property {Boolean} [options.autoBorderPanning=false]                - whether to pan the map automatically if mouse moves on the border of the map
     * @property {Boolean} [options.geometryEvents=true]                    - enable/disable firing geometry events
     *
     * @property {Boolean}        [options.control=true]                    - whether allow map to add controls.
     * @property {Boolean|Object} [options.attributionControl=false]        - display the attribution control on the map if set to true or a object as the control construct option.
     * @property {Boolean|Object} [options.zoomControl=false]               - display the zoom control on the map if set to true or a object as the control construct option.
     * @property {Boolean|Object} [options.scaleControl=false]              - display the scale control on the map if set to true or a object as the control construct option.
     * @property {Boolean|Object} [options.overviewControl=false]           - display the overview control on the map if set to true or a object as the control construct option.
     *
     * @property {String} [options.renderer=canvas]                 - renderer type. Don't change it if you are not sure about it. About renderer, see [TODO]{@link tutorial.renderer}.
     */
    options:{
        'centerCross' : false,

        'clipFullExtent' : false,

        'zoomAnimation' : (function () {return maptalks.node ? false : true})(),
        'zoomAnimationDuration' : 330,
        //still leave background after zooming, set it to false if baseLayer is a transparent layer
        'zoomBackground' : true,
        //controls whether other layers than base tilelayer will show during zoom animation.
        'layerZoomAnimation' : true,

        //economically transform, whether point symbolizers transforms during transformation (e.g. zoom animation)
        //set to true can prevent drastic low performance when number of point symbolizers is large.
        'layerTransforming' : true,

        'panAnimation': (function () {return maptalks.node ? false : true})(),
        //default pan animation duration
        'panAnimationDuration' : 600,

        'zoomable':true,
        'enableInfoWindow':true,

        'hitDetect' : (function () { return !maptalks.Browser.mobile; })(),

        'maxZoom' : null,
        'minZoom' : null,
        'maxExtent' : null,

        'checkSize' : true,

        'renderer' : 'canvas'
    },


    initialize:function (container, options) {

        if (!options) {
            throw new Error('Invalid options when creating map.');
        }

        this._loaded = false;

        if (maptalks.Util.isString(container)) {
            this._containerDOM = document.getElementById(container);
            if (!this._containerDOM) {
                throw new Error('invalid container when creating map: \'' + container + '\'');
            }
        } else {
            this._containerDOM = container;
            if (maptalks.node) {
                //Reserve container's constructor in node for canvas creating.
                this.CanvasClass = this._containerDOM.constructor;
            }
        }

        if (!maptalks.node) {
            if (this._containerDOM.childNodes && this._containerDOM.childNodes.length > 0) {
                if (this._containerDOM.childNodes[0].className === 'maptalks-wrapper') {
                    throw new Error('Container is already loaded with another map instance, use map.remove() to clear it.');
                }
            }
        }

        if (!options['center']) {
            throw new Error('Invalid center when creating map.');
        }

        this._panels = {};

        //Layers
        this._baseLayer = null;
        this._layers = [];

        //shallow copy options
        var opts = maptalks.Util.extend({}, options);

        this._zoomLevel = opts['zoom'];
        delete opts['zoom'];
        this._center = new maptalks.Coordinate(opts['center']);
        delete opts['center'];

        var baseLayer = opts['baseLayer'];
        delete opts['baseLayer'];
        var layers = opts['layers'];
        delete opts['layers'];

        maptalks.Util.setOptions(this, opts);
        this.setView(opts['view']);

        if (baseLayer) {
            this.setBaseLayer(baseLayer);
        }
        if (layers) {
            this.addLayer(layers);
        }

        this._mapViewPoint = new maptalks.Point(0, 0);

        this._initRenderer();
        this._getRenderer().initContainer();
        this._updateMapSize(this._getContainerDomSize());

        this._Load();
    },

    /**
     * Whether the map is loaded or not.
     * @return {Boolean}
     */
    isLoaded:function () {
        return this._loaded;
    },

    /**
     * Whether the map is rendered by canvas
     * @return {Boolean}
     * @protected
     * @example
     * var isCanvas = map.isCanvasRender();
     */
    isCanvasRender:function () {
        var renderer = this._getRenderer();
        if (renderer) {
            return renderer.isCanvasRender();
        }
        return false;
    },

    /**
     * Get the view of the Map.
     * @return {maptalks.View} map's view
     */
    getView: function () {
        if (!this._view) {
            return null;
        }
        return this._view;
    },

    /**
     * Change the view of the map. <br>
     * A view is a series of settings to decide the map presentation:<br>
     * 1. the projection.<br>
     * 2. zoom levels and resolutions. <br>
     * 3. full extent.<br>
     * There are some [predefined views]{@link http://www.foo.com}, and surely you can [define a custom one.]{@link http://www.foo.com}.<br>
     * View can also be set by map.config('view', view);
     * @param {maptalks.View} view - view settings
     * @returns {maptalks.Map} this
     * @fires maptalks.Map#viewchange
     * @example
     *  map.setView({
            projection:'EPSG:4326',
            resolutions: (function() {
                var resolutions = [];
                for (var i=0; i < 19; i++) {
                    resolutions[i] = 180/(Math.pow(2, i)*128);
                }
                return resolutions;
            })()
        });
     */
    setView:function (view) {
        var oldView = this.options['view'];
        if (oldView && !view) {
            return this;
        }
        this._center = this.getCenter();
        this.options['view'] =  view;
        this._view = new maptalks.View(view);
        if (this.options['view'] && maptalks.Util.isFunction(this.options['view']['projection'])) {
            var projection = this._view.getProjection();
            //save projection code for map profiling (toJSON/fromJSON)
            this.options['view']['projection'] = projection['code'];
        }
        this._resetMapStatus();
        /**
         * viewchange event, fired when map's view is updated.
         *
         * @event maptalks.Map#viewchange
         * @type {Object}
         * @property {String} type - viewchange
         * @property {maptalks.Map} target - map
         * @property {maptalks.Map} old - the old view
         * @property {maptalks.Map} new - the new view changed to
         */
        this._fireEvent('viewchange', {'old' : oldView, 'new' : maptalks.Util.extend({}, this.options['view'])});
        return this;
    },

    /**
     * Callback when any option is updated
     * @private
     * @param  {Object} conf - options to update
     * @return {maptalks.Map}   this
     */
    onConfig:function (conf) {
        if (!maptalks.Util.isNil(conf['view'])) {
            this.setView(conf['view']);
        }
        return this;
    },

    /**
     * Get the projection of the map. <br>
     * Projection is an algorithm for map projection, e.g. well-known [Mercator Projection]{@link https://en.wikipedia.org/wiki/Mercator_projection} <br>
     * A projection must have 2 methods: <br>
     * 1. project(coordinate) - project the input coordinate <br>
     * 2. unproject(coordinate) - unproject the input coordinate <br>
     * Projection also contains measuring method usually extended from a measurer: <br>
     * 1. measureLength(coord1, coord2) - compute length between 2 coordinates.  <br>
     * 2. measureArea(coords[]) - compute area of the input coordinates. <br>
     * 3. locate(coord, distx, disty) - compute the coordinate from the coord with xdist on axis x and ydist on axis y.
     * @return {Object}
     */
    getProjection:function () {
        return this._view.getProjection();
    },

    /**
     * Get map's full extent, which is defined in map's view. <br>
     * eg: {'left': -180, 'right' : 180, 'top' : 90, 'bottom' : -90}
     * @return {maptalks.Extent}
     */
    getFullExtent:function () {
        return this._view.getFullExtent();
    },

    /**
     * Set map's cursor style, cursor style is same with CSS.
     * @param {String} cursor - cursor style
     * @returns {maptalks.Map} this
     * @example
     * map.setCursor('url(cursor.png) 4 12, auto');
     */
    setCursor:function (cursor) {
        delete this._cursor;
        this._trySetCursor(cursor);
        this._cursor = cursor;
        return this;
    },

    /**
     * Get center of the map.
     * @return {maptalks.Coordinate}
     */
    getCenter:function () {
        if (!this._loaded || !this._prjCenter) { return this._center; }
        var projection = this.getProjection();
        return projection.unproject(this._prjCenter);
    },

    /**
     * Set a new center to the map.
     * @param {maptalks.Coordinate} center
     * @return {maptalks.Map} this
     */
    setCenter:function (center) {
        if (!center) {
            return this;
        }
        center = new maptalks.Coordinate(center);
        if (!this._verifyExtent(center)) {
            return this;
        }
        if (!this._loaded) {
            this._center = center;
            return this;
        }
        this.onMoveStart();
        var projection = this.getProjection();
        var _pcenter = projection.project(center);
        this._setPrjCenterAndMove(_pcenter);
        this.onMoveEnd();
        return this;
    },

    /**
     * Get map's size (width and height) in pixel.
     * @return {maptalks.Size}
     */
    getSize:function () {
        if (maptalks.Util.isNil(this.width) || maptalks.Util.isNil(this.height)) {
            return this._getContainerDomSize();
        }
        return new maptalks.Size(this.width, this.height);
    },

    /**
     * Get container extent of the map
     * @return {maptalks.PointExtent}
     */
    getContainerExtent: function () {
        return new maptalks.PointExtent(0, 0, this.width, this.height);
    },

    /**
     * Get the geographical extent of map's current view extent.
     *
     * @return {maptalks.Extent}
     */
    getExtent:function () {
        return this._pointToExtent(this._get2DExtent());
    },

    /**
     * Get the projected geographical extent of map's current view extent.
     *
     * @return {maptalks.Extent}
     */
    getProjExtent: function () {
        var extent2D = this._get2DExtent();
        return new maptalks.Extent(
            this._pointToPrj(extent2D.getMin()),
            this._pointToPrj(extent2D.getMax())
        );
    },

    /**
     * Get the max extent that the map is restricted to.
     * @return {maptalks.Extent}
     */
    getMaxExtent:function () {
        if (!this.options['maxExtent']) {
            return null;
        }
        return new maptalks.Extent(this.options['maxExtent']);
    },

    /**
     * Sets the max extent that the map is restricted to.
     * @param {maptalks.Extent}
     * @return {maptalks.Map} this
     * @example
     * map.setMaxExtent(map.getExtent());
     */
    setMaxExtent:function (extent) {
        if (extent) {
            var maxExt = new maptalks.Extent(extent);
            this.options['maxExtent'] = maxExt;
            var center = this.getCenter();
            if (!this._verifyExtent(center)) {
                this.panTo(maxExt.getCenter());
            }
        } else {
            delete this.options['maxExtent'];
        }
        return this;
    },

    /**
     * Get map's current zoom.
     * @return {Number}
     */
    getZoom:function () {
        return this._zoomLevel;
    },

    /**
     * Caculate the target zoom if scaling from "fromZoom" by "scale"
     * @param  {Number} scale
     * @param  {Number} fromZoom
     * @return {Number} zoom fit for scale starting from fromZoom
     */
    getZoomForScale:function (scale, fromZoom) {
        if (maptalks.Util.isNil(fromZoom)) {
            fromZoom = this.getZoom();
        }
        var res = this._getResolution(fromZoom),
            resolutions = this._getResolutions(),
            minZoom = this.getMinZoom(),
            maxZoom = this.getMaxZoom(),
            min = Number.MAX_VALUE,
            hit = -1;
        for (var i = resolutions.length - 1; i >= 0; i--) {
            var test = Math.abs(res / resolutions[i] - scale);
            if (test < min) {
                min = test;
                hit = i;
            }
        }
        if (maptalks.Util.isNumber(minZoom) && hit < minZoom) {
            hit = minZoom;
        }
        if (maptalks.Util.isNumber(maxZoom) && hit > maxZoom) {
            hit = maxZoom;
        }
        return hit;
    },

    /**
     * Sets zoom of the map
     * @param {Number} zoom
     * @returns {maptalks.Map} this
     */
    setZoom:function (zoom) {
        var me = this;
        maptalks.Util.executeWhen(function () {
            if (me._loaded && me.options['zoomAnimation']) {
                me._zoomAnimation(zoom);
            } else {
                me._zoom(zoom);
            }
        }, function () {
            return  !me._zooming;
        });
        return this;
    },

    /**
     * Get the max zoom that the map can be zoom to.
     * @return {Number}
     */
    getMaxZoom:function () {
        if (!maptalks.Util.isNil(this.options['maxZoom'])) {
            return this.options['maxZoom'];
        }
        var view = this.getView();
        if (!view) {
            return null;
        }
        return view.getResolutions().length - 1;
    },

    /**
     * Sets the max zoom that the map can be zoom to.
     * @param {Number} maxZoom
     * @returns {maptalks.Map} this
     */
    setMaxZoom:function (maxZoom) {
        var viewMaxZoom = this._view.getMaxZoom();
        if (maxZoom > viewMaxZoom) {
            maxZoom = viewMaxZoom;
        }
        if (maxZoom < this._zoomLevel) {
            this.setZoom(maxZoom);
        }
        this.options['maxZoom'] = maxZoom;
        return this;
    },

    /**
     * Get the min zoom that the map can be zoom to.
     * @return {Number}
     */
    getMinZoom:function () {
        if (!maptalks.Util.isNil(this.options['minZoom'])) {
            return this.options['minZoom'];
        }
        return 0;
    },

    /**
     * Sets the min zoom that the map can be zoom to.
     * @param {Number} minZoom
     * @return {maptalks.Map} this
     */
    setMinZoom:function (minZoom) {
        var viewMinZoom = this._view.getMinZoom();
        if (minZoom < viewMinZoom) {
            minZoom = viewMinZoom;
        }
        this.options['minZoom'] = minZoom;
        return this;
    },

    /**
     * zoom in
     * @return {maptalks.Map} this
     */
    zoomIn: function () {
        var me = this;
        maptalks.Util.executeWhen(function () {
            me.setZoom(me.getZoom() + 1);
        }, function () {
            return !me._zooming;
        });
        return this;
    },

    /**
     * zoom out
     * @return {maptalks.Map} this
     */
    zoomOut: function () {
        var me = this;
        maptalks.Util.executeWhen(function () {
            me.setZoom(me.getZoom() - 1);
        }, function () {
            return !me._zooming;
        });
        return this;
    },

    /**
     * Sets the center and zoom at the same time.
     * @param {maptalks.Coordinate} center
     * @param {Number} zoom
     * @return {maptalks.Map} this
     */
    setCenterAndZoom:function (center, zoom) {
        if (this._zoomLevel !== zoom) {
            this.setCenter(center);
            if (!maptalks.Util.isNil(zoom)) {
                this.setZoom(zoom);
            }
        } else {
            this.setCenter(center);
        }
        return this;
    },


    /**
     * Caculate the zoom level that contains the given extent with the maximum zoom level possible.
     * @param {maptalks.Extent} extent
     * @return {Number} zoom fit for the extent
     */
    getFitZoom: function (extent) {
        if (!extent || !(extent instanceof maptalks.Extent)) {
            return this._zoomLevel;
        }
        //It's a point
        if (extent['xmin'] === extent['xmax'] && extent['ymin'] === extent['ymax']) {
            return this.getMaxZoom();
        }
        var projection = this.getProjection(),
            x = Math.abs(extent['xmin'] - extent['xmax']),
            y = Math.abs(extent['ymin'] - extent['ymax']),
            projectedExtent = projection.project({x:x, y:y}),
            resolutions = this._getResolutions(),
            xz = -1,
            yz = -1;
        for (var i = this.getMinZoom(), len = this.getMaxZoom(); i < len; i++) {
            if (maptalks.Util.round(projectedExtent.x / resolutions[i]) >= this.width) {
                if (xz === -1) {
                    xz = i;
                }
            }
            if (maptalks.Util.round(projectedExtent.y / resolutions[i]) >= this.height) {
                if (yz === -1) {
                    yz = i;
                }
            }
            if (xz > -1 && yz > -1) {
                break;
            }
        }
        var ret = xz < yz ? xz : yz;
        if (ret === -1) {
            ret = xz < yz ? yz : xz;
        }
        if (ret === -1) {
            return this.getMaxZoom();
        }
        return ret;
    },

    /**
     * Get map's resolution
     * @param {Number} zoom - zoom or current zoom if not given
     * @return {Number} resolution
     */
    getResolution:function (zoom) {
        return this._getResolution(zoom);
    },

    /**
     * Get scale of resolutions from zoom to max zoom
     * @param {Number} zoom - zoom or current zoom if not given
     * @return {Number} scale
     */
    getScale: function (zoom) {
        var z = (zoom === undefined ? this.getZoom() : zoom);
        var max = this._getResolution(this.getMaxZoom()),
            res = this._getResolution(z);
        return res / max;
    },

    /**
     * Set the map to be fit for the given extent with the max zoom level possible.
     * @param  {maptalks.Extent} extent - extent
     * @param  {Number} zoomOffset - zoom offset
     * @return {maptalks.Map} - this
     */
    fitExtent: function (extent, zoomOffset) {
        if (!extent) {
            return this;
        }
        zoomOffset = zoomOffset || 0;
        var zoom = this.getFitZoom(extent);
        zoom += zoomOffset;
        var center = new maptalks.Extent(extent).getCenter();
        return this.setCenterAndZoom(center, zoom);
    },

    /**
     * Get the base layer of the map.
     * @return {maptalks.Layer}
     */
    getBaseLayer:function () {
        return this._baseLayer;
    },

    /**
     * Sets a new base layer to the map.<br>
     * Some events will be thrown such as baselayerchangestart, baselayerload, baselayerchangeend.
     * @param  {maptalks.Layer} baseLayer - new base layer
     * @return {maptalks.Map} this
     * @fires maptalks.Map#setbaselayer
     * @fires maptalks.Map#baselayerchangestart
     * @fires maptalks.Map#baselayerchangeend
     */
    setBaseLayer:function (baseLayer) {
        var isChange = false;
        if (this._baseLayer) {
            isChange = true;
            /**
             * baselayerchangestart event, fired when base layer is changed.
             *
             * @event maptalks.Map#baselayerchangestart
             * @type {Object}
             * @property {String} type - baselayerchangestart
             * @property {maptalks.Map} target - map
             */
            this._fireEvent('baselayerchangestart');
            this._baseLayer.remove();
        }
        if (!baseLayer) {
            delete this._baseLayer;
            /**
             * baselayerchangeend event, fired when base layer is changed.
             *
             * @event maptalks.Map#baselayerchangeend
             * @type {Object}
             * @property {String} type - baselayerchangeend
             * @property {maptalks.Map} target - map
             */
            this._fireEvent('baselayerchangeend');
            /**
             * setbaselayer event, fired when base layer is set.
             *
             * @event maptalks.Map#setbaselayer
             * @type {Object}
             * @property {String} type - setbaselayer
             * @property {maptalks.Map} target - map
             */
            this._fireEvent('setbaselayer');
            return this;
        }
        if (baseLayer instanceof maptalks.TileLayer) {
            baseLayer.config({
                'renderWhenPanning':true
            });
            if (!baseLayer.options['tileSystem']) {
                baseLayer.config('tileSystem', maptalks.TileSystem.getDefault(this.getProjection()));
            }
        }
        baseLayer._bindMap(this, -1);
        this._baseLayer = baseLayer;
        function onbaseLayerload() {
            /**
             * baselayerload event, fired when base layer is loaded.
             *
             * @event maptalks.Map#baselayerload
             * @type {Object}
             * @property {String} type - baselayerload
             * @property {maptalks.Map} target - map
             */
            this._fireEvent('baselayerload');
            if (isChange) {
                isChange = false;
                this._fireEvent('baselayerchangeend');
            }
        }
        this._baseLayer.on('layerload', onbaseLayerload, this);
        if (this._loaded) {
            this._baseLayer.load();
        }
        this._fireEvent('setbaselayer');
        return this;
    },

    /**
     * Remove the base layer from the map
     * @return {maptalks.Map} this
     * @fires maptalks.Map#baselayerremove
     */
    removeBaseLayer: function ()  {
        if (this._baseLayer) {
            this._baseLayer.remove();
            delete this._baseLayer;
            /**
             * baselayerremove event, fired when base layer is removed.
             *
             * @event maptalks.Map#baselayerremove
             * @type {Object}
             * @property {String} type - baselayerremove
             * @property {maptalks.Map} target - map
             */
            this._fireEvent('baselayerremove');
        }
        return this;
    },

    /**
     * Get the layers of the map, except base layer (which should be by getBaseLayer). <br>
     * A filter function can be given to filter layers, e.g. exclude all the VectorLayers.
     * @param {Function} [filter=undefined] - a filter function of layers, return false to exclude the given layer.
     * @return {maptalks.Layer[]}
     * @example
     * var vectorLayers = map.getLayers(function (layer) {
     *     return (layer instanceof maptalks.VectorLayer);
     * });
     */
    getLayers:function (filter) {
        return this._getLayers(function (layer) {
            if (layer === this._baseLayer || layer.getId().indexOf(maptalks.internalLayerPrefix) >= 0) {
                return false;
            }
            if (filter) {
                return filter(layer);
            }
            return true;
        });
    },

    /**
     * Get the layer with the given id.
     * @param  {String} id - layer id
     * @return {maptalks.Layer}
     */
    getLayer:function (id) {
        if (!id || !this._layerCache || !this._layerCache[id]) {
            return null;
        }
        return this._layerCache[id];
    },

    /**
     * Add a new layer on the top of the map.
     * @param  {maptalks.Layer|maptalks.Layer[]} layer - one or more layers to add
     * @return {maptalks.Map} this
     * @fires maptalks.Map#addlayer
     */
    addLayer:function (layers) {
        if (!layers) {
            return this;
        }
        if (!maptalks.Util.isArray(layers)) {
            return this.addLayer([layers]);
        }
        if (!this._layerCache) {
            this._layerCache = {};
        }
        for (var i = 0, len = layers.length; i < len; i++) {
            var layer = layers[i];
            var id = layer.getId();
            if (maptalks.Util.isNil(id)) {
                throw new Error('Invalid id for the layer: ' + id);
            }
            if (this._layerCache[id]) {
                throw new Error('Duplicate layer id in the map: ' + id);
            }
            this._layerCache[id] = layer;
            layer._bindMap(this, this._layers.length);
            this._layers.push(layer);
            if (this._loaded) {
                layer.load();
            }
        }
        /**
         * addlayer event, fired when adding layers.
         *
         * @event maptalks.Map#addlayer
         * @type {Object}
         * @property {String} type - addlayer
         * @property {maptalks.Map} target - map
         * @property {maptalks.Layer[]} layers - layers to add
         */
        this._fireEvent('addlayer', {'layers' : layers});
        return this;
    },

    /**
     * Remove a layer from the map
     * @param  {String|String[]|maptalks.Layer|maptalks.Layer[]} layer - one or more layers or layer ids
     * @return {maptalks.Map} this
     * @fires maptalks.Map#removelayer
     */
    removeLayer: function (layers) {
        if (!layers) {
            return this;
        }
        if (!maptalks.Util.isArray(layers)) {
            return this.removeLayer([layers]);
        }
        for (var i = 0, len = layers.length; i < len; i++) {
            var layer = layers[i];
            if (!(layer instanceof maptalks.Layer)) {
                layer = this.getLayer(layer);
            }
            if (!layer) {
                continue;
            }
            var map = layer.getMap();
            if (!map || map !== this) {
                continue;
            }
            this._removeLayer(layer, this._layers);
            if (this._loaded) {
                layer._doRemove();
            }
            var id = layer.getId();
            if (this._layerCache) {
                delete this._layerCache[id];
            }
            layer.fire('remove');
        }
        /**
         * removelayer event, fired when removing layers.
         *
         * @event maptalks.Map#removelayer
         * @type {Object}
         * @property {String} type - removelayer
         * @property {maptalks.Map} target - map
         * @property {maptalks.Layer[]} layers - layers to remove
         */
        this._fireEvent('removelayer', {'layers' : layers});
        return this;
    },

    /**
     * Sort layers according to the order provided, the last will be on the top.
     * @param  {string[]|maptalks.Layer[]} layers - layers or layer ids to sort
     * @return {maptalks.Map} this
     * @example
     * map.addLayer([layer1, layer2, layer3]);
     * map.sortLayers([layer2, layer3, layer1]);
     * map.sortLayers(['3', '2', '1']); // sort by layer ids.
     */
    sortLayers:function (layers) {
        if (!layers || !maptalks.Util.isArray(layers)) {
            return this;
        }
        var layersToOrder = [];
        var minZ = Number.MAX_VALUE;
        for (var i = 0; i < layers.length; i++) {
            var layer = layers[i];
            if (maptalks.Util.isString(layers[i])) {
                layer = this.getLayer(layer);
            }
            if (!(layer instanceof maptalks.Layer) || !layer.getMap() || layer.getMap() !== this) {
                throw new Error('It must be a layer added to this map to order.');
            }
            if (layer.getZIndex() < minZ) {
                minZ = layer.getZIndex();
            }
            layersToOrder.push(layer);
        }
        for (var ii = 0; ii < layersToOrder.length; ii++) {
            layersToOrder[ii].setZIndex(minZ + ii);
        }
        return this;
    },

    /**
     * Exports image from the map's canvas.
     * @param {Object} [options=undefined] - options
     * @param {String} [options.mimeType=image/png] - mime type of the image
     * @param {Boolean} [options.save=false] - whether pop a file save dialog to save the export image.
     * @param {String} [options.filename=export] - specify the file name, if options.save is true.
     * @return {String} image of base64 format.
     */
    toDataURL: function (options) {
        if (!options) {
            options = {};
        }
        var mimeType = options['mimeType'];
        if (!mimeType) {
            mimeType = 'image/png';
        }
        var save = options['save'];
        var renderer = this._getRenderer();
        if (renderer && renderer.toDataURL) {
            var file = options['filename'];
            if (!file) {
                file = 'export';
            }
            var dataURL =  renderer.toDataURL(mimeType);
            if (save && dataURL) {
                var imgURL = dataURL;

                var dlLink = document.createElement('a');
                dlLink.download = file;
                dlLink.href = imgURL;
                dlLink.dataset.downloadurl = [mimeType, dlLink.download, dlLink.href].join(':');

                document.body.appendChild(dlLink);
                dlLink.click();
                document.body.removeChild(dlLink);
            }
            return dataURL;
        }
        return null;
    },


    /**
     * Converts a coordinate to the 2D point in current zoom or in the specific zoom. <br>
     * The 2D point's coordinate system's origin is the same with map's origin.
     * @param  {maptalks.Coordinate} coordinate - coordinate
     * @param  {Number} [zoom=undefined]       - zoom level
     * @return {maptalks.Point}  2D point
     * @example
     * var point = map.coordinateToPoint(new maptalks.Coordinate(121.3, 29.1));
     */
    coordinateToPoint: function (coordinate, zoom) {
        var prjCoord = this.getProjection().project(coordinate);
        return this._prjToPoint(prjCoord, zoom);
    },

    /**
     * Converts a 2D point in current zoom or a specific zoom to a coordinate.
     * @param  {maptalks.Point} point - 2D point
     * @param  {Number} zoom  - zoom level
     * @return {maptalks.Coordinate} coordinate
     * @example
     * var coord = map.pointToCoordinate(new maptalks.Point(4E6, 3E4));
     */
    pointToCoordinate: function (point, zoom) {
        var prjCoord = this._pointToPrj(point, zoom);
        return this.getProjection().unproject(prjCoord);
    },

    /**
     * Converts a geographical coordinate to view point.<br>
     * A view point is a point relative to map's mapPlatform panel's position. <br>
     * @param {maptalks.Coordinate} coordinate
     * @return {maptalks.Point}
     */
    coordinateToViewPoint: function (coordinate) {
        return this._prjToViewPoint(this.getProjection().project(coordinate));
    },

    /**
     * Converts a view point to the geographical coordinate.
     * @param {maptalks.Point} viewPoint
     * @return {maptalks.Coordinate}
     */
    viewPointToCoordinate: function (viewPoint) {
        return this.getProjection().unproject(this._viewPointToPrj(viewPoint));
    },

    /**
     * Convert a geographical coordinate to the container point. <br>
     *  A container point is a point relative to map container's top-left corner. <br>
     * @param {maptalks.Coordinate}
     * @return {maptalks.Point}
     */
    coordinateToContainerPoint: function (coordinate) {
        var pCoordinate = this.getProjection().project(coordinate);
        return this._prjToContainerPoint(pCoordinate);
    },

    /**
     * Converts a container point to geographical coordinate.
     * @param {maptalks.Point}
     * @return {maptalks.Coordinate}
     */
    containerPointToCoordinate: function (containerPoint) {
        var pCoordinate = this._containerPointToPrj(containerPoint);
        return this.getProjection().unproject(pCoordinate);
    },

    /**
     * Converts a container point to the view point.
     *
     * @param {maptalks.Point}
     * @returns {maptalks.Point}
     */
    containerPointToViewPoint: function (containerPoint) {
        return containerPoint.substract(this.offsetPlatform());
    },

    /**
     * Converts a view point to the container point.
     *
     * @param {maptalks.Point}
     * @returns {maptalks.Point}
     */
    viewPointToContainerPoint: function (viewPoint) {
        return viewPoint.add(this.offsetPlatform());
    },

    /**
     * Converts a container point extent to the geographic extent.
     * @param  {maptalks.PointExtent} containerExtent - containeproints extent
     * @return {maptalks.Extent}  geographic extent
     */
    containerToExtent:function (containerExtent) {
        var extent2D = new maptalks.PointExtent(
                this._containerPointToPoint(containerExtent.getMin()),
                this._containerPointToPoint(containerExtent.getMax())
            );
        return this._pointToExtent(extent2D);
    },

    /**
     * Checks if the map container size changed and updates the map if so.
     * @return {maptalks.Map} this
     * @fires maptalks.Map#resize
     */
    checkSize:function () {
        var justStart = ((maptalks.Util.now() - this._initTime) < 1500) && this.width === 0 || this.height === 0;

        var watched = this._getContainerDomSize(),
            oldHeight = this.height,
            oldWidth = this.width;
        if (watched['width'] === oldWidth && watched['height'] === oldHeight) {
            return this;
        }
        var center = this.getCenter();
        this._updateMapSize(watched);
        var resizeOffset = new maptalks.Point((oldWidth - watched.width) / 2, (oldHeight - watched.height) / 2);
        this._offsetCenterByPixel(resizeOffset);
        if (justStart) {
            this._eventSuppressed = true;
            this.setCenter(center);
            this._eventSuppressed = false;
        }
        /**
         * resize event when map container's size changes
         * @event maptalks.Map#resize
         * @type {Object}
         * @property {String} type - resize
         * @property {maptalks.Map} target - map fires the event
         */
        this._fireEvent('resize');

        return this;
    },

    /**
     * Converts geographical distances to the pixel length.<br>
     * The value varis with difference zoom level.
     *
     * @param  {Number} xDist - distance on X axis.
     * @param  {Number} yDist - distance on Y axis.
     * @return {maptalks.Size} result.width: pixel length on X axis; result.height: pixel length on Y axis
     */
    distanceToPixel: function (xDist, yDist) {
        var projection = this.getProjection();
        if (!projection) {
            return null;
        }
        var center = this.getCenter(),
            target = projection.locate(center, xDist, yDist),
            res = this._getResolution();

        var width = !xDist ? 0 : (projection.project(new maptalks.Coordinate(target.x, center.y)).x - projection.project(center).x) / res;
        var height = !yDist ? 0 : (projection.project(new maptalks.Coordinate(center.x, target.y)).y - projection.project(center).y) / res;
        return new maptalks.Size(Math.abs(width), Math.abs(height));
    },

    /**
     * Converts pixel size to geographical distance.
     *
     * @param  {Number} width - pixel width
     * @param  {Number} height - pixel height
     * @return {Number}  distance - Geographical distance
     */
    pixelToDistance:function (width, height) {
        var projection = this.getProjection();
        if (!projection) {
            return null;
        }
        //����ǰˢ��scales
        var center = this.getCenter(),
            pcenter = this._getPrjCenter(),
            res = this._getResolution();
        var pTarget = new maptalks.Coordinate(pcenter.x + width * res, pcenter.y + height * res);
        var target = projection.unproject(pTarget);
        return projection.measureLength(target, center);
    },

    /**
     * Computes the coordinate from the given coordinate with xdist on axis x and ydist on axis y.
     * @param  {maptalks.Coordinate} coordinate - source coordinate
     * @param  {Number} dx           - distance on X axis from the source coordinate
     * @param  {Number} dy           - distance on Y axis from the source coordinate
     * @return {maptalks.Coordinate} Result coordinate
     */
    locate:function (coordinate, dx, dy) {
        return this.getProjection().locate(new maptalks.Coordinate(coordinate), dx, dy);
    },

    /**
    * Return map's main panel
    * @returns {HTMLElement}
    */
    getMainPanel: function () {
        return this._getRenderer().getMainPanel();
    },

    /**
     * Returns map panels.
     * @return {Object}
     */
    getPanels: function () {
        return this._panels;
    },

    remove: function () {
        this._registerDomEvents(true);
        this._clearHandlers();
        this.removeBaseLayer();
        var layers = this.getLayers();
        for (var i = 0; i < layers.length; i++) {
            layers[i].remove();
        }
        if (this._getRenderer()) {
            this._getRenderer().remove();
        }
        this._clearAllListeners();
        if (this._containerDOM && this._containerDOM.innerHTML) {
            this._containerDOM.innerHTML = '';
        }
        delete this._panels;
        delete this._containerDOM;
        return this;
    },

    /**
     * The callback function when move started
     * @private
     * @fires maptalks.Map#movestart
     */
    onMoveStart:function (param) {
        this._originCenter = this.getCenter();
        this._enablePanAnimation = false;
        this._moving = true;
        this._trySetCursor('move');
        /**
         * movestart event
         * @event maptalks.Map#movestart
         * @type {Object}
         * @property {String} type - movestart
         * @property {maptalks.Map} target - map fires the event
         * @property {maptalks.Coordinate} coordinate - coordinate of the event
         * @property {maptalks.Point} containerPoint  - container point of the event
         * @property {maptalks.Point} viewPoint       - view point of the event
         * @property {Event} domEvent                 - dom event
         */
        this._fireEvent('movestart', this._parseEvent(param ? param['domEvent'] : null, 'movestart'));
    },

    onMoving:function (param) {
        /**
         * moving event
         * @event maptalks.Map#moving
         * @type {Object}
         * @property {String} type - moving
         * @property {maptalks.Map} target - map fires the event
         * @property {maptalks.Coordinate} coordinate - coordinate of the event
         * @property {maptalks.Point} containerPoint  - container point of the event
         * @property {maptalks.Point} viewPoint       - view point of the event
         * @property {Event} domEvent                 - dom event
         */
        this._fireEvent('moving', this._parseEvent(param ? param['domEvent'] : null, 'moving'));
    },

    onMoveEnd:function (param) {
        this._moving = false;
        this._trySetCursor('default');
        /**
         * moveend event
         * @event maptalks.Map#moveend
         * @type {Object}
         * @property {String} type - moveend
         * @property {maptalks.Map} target - map fires the event
         * @property {maptalks.Coordinate} coordinate - coordinate of the event
         * @property {maptalks.Point} containerPoint  - container point of the event
         * @property {maptalks.Point} viewPoint       - view point of the event
         * @property {Event} domEvent                 - dom event
         */
        this._fireEvent('moveend', this._parseEvent(param ? param['domEvent'] : null, 'moveend'));
        if (!this._verifyExtent(this.getCenter())) {
            var moveTo = this._originCenter;
            if (!this._verifyExtent(moveTo)) {
                moveTo = this.getMaxExtent().getCenter();
            }
            this.panTo(moveTo);
        }
    },

//-----------------------------------------------------------

    /**
     * whether map is busy
     * @private
     * @return {Boolean}
     */
    _isBusy:function () {
        return this._zooming/* || this._moving*/;
    },

    /**
     * try to change cursor when map is not setCursored
     * @private
     * @param  {String} cursor css cursor
     */
    _trySetCursor:function (cursor) {
        if (!this._cursor && !this._priorityCursor) {
            if (!cursor) {
                cursor = 'default';
            }
            this._setCursorToPanel(cursor);
        }
        return this;
    },

    _setPriorityCursor:function (cursor) {
        if (!cursor) {
            var hasCursor = false;
            if (this._priorityCursor) {
                hasCursor = true;
            }
            delete this._priorityCursor;
            if (hasCursor) {
                this.setCursor(this._cursor);
            }
        } else {
            this._priorityCursor = cursor;
            this._setCursorToPanel(cursor);
        }
        return this;
    },

    _setCursorToPanel:function (cursor) {
        var panel = this.getMainPanel();
        if (panel && panel.style) {
            panel.style.cursor = cursor;
        }
    },

     /**
     * Get map's extent in view points.
     * @param {Number} zoom - zoom
     * @return {maptalks.PointExtent}
     * @private
     */
    _get2DExtent:function (zoom) {
        var c1 = this._containerPointToPoint(new maptalks.Point(0, 0), zoom),
            c2 = this._containerPointToPoint(new maptalks.Point(this.width, 0), zoom),
            c3 = this._containerPointToPoint(new maptalks.Point(this.width, this.height), zoom),
            c4 = this._containerPointToPoint(new maptalks.Point(0, this.height), zoom);
        var xmin = Math.min(c1.x, c2.x, c3.x, c4.x),
            xmax = Math.max(c1.x, c2.x, c3.x, c4.x),
            ymin = Math.min(c1.y, c2.y, c3.y, c4.y),
            ymax = Math.max(c1.y, c2.y, c3.y, c4.y);
        return new maptalks.PointExtent(xmin, ymin, xmax, ymax);
    },

    /**
     * Converts a view point extent to the geographic extent.
     * @param  {maptalks.PointExtent} extent2D - view points extent
     * @return {maptalks.Extent}  geographic extent
     * @protected
     */
    _pointToExtent:function (extent2D) {
        return new maptalks.Extent(
            this.pointToCoordinate(extent2D.getMin()),
            this.pointToCoordinate(extent2D.getMax())
        );
    },

    _setPrjCenterAndMove:function (pcenter) {
        var offset = this._getPixelDistance(pcenter);
        this._setPrjCenter(pcenter);
        this.offsetPlatform(offset);
    },

    //remove a layer from the layerList
    _removeLayer:function (layer, layerList) {
        if (!layer || !layerList) { return; }
        var index = maptalks.Util.indexOfArray(layer, layerList);
        if (index > -1) {
            layerList.splice(index, 1);

            for (var j = 0, jlen = layerList.length; j < jlen; j++) {
                if (layerList[j].setZIndex) {
                    layerList[j].setZIndex(j);
                }
            }
        }
    },

    _sortLayersByZIndex:function (layerList) {
        layerList.sort(function (a, b) {
            return a.getZIndex() - b.getZIndex();
        });
    },


    _genViewMatrix : function (origin, scale, rotate) {
        if (!rotate) {
            rotate = 0;
        }
        this._generatingMatrix = true;
        if (origin instanceof maptalks.Coordinate) {
            origin = this.coordinateToContainerPoint(origin);
        }
        var point = this._containerPointToPoint(origin),
            viewPoint = this.containerPointToViewPoint(origin);

        var matrices = {
            '2dPoint' : point,
            'view' : new maptalks.Matrix().translate(viewPoint.x, viewPoint.y)
                    .scaleU(scale).rotate(rotate).translate(-viewPoint.x, -viewPoint.y),
            '2d' : new maptalks.Matrix().translate(point.x, point.y)
                    .scaleU(scale).rotate(rotate).translate(-point.x, -point.y)
        };
        matrices['inverse'] = {
            '2d' : matrices['2d'].inverse(),
            'view' : matrices['view'].inverse()
        };
        this._generatingMatrix = false;
        return matrices;
    },

    _fillMatrices: function (matrix, scale, rotate) {
        if (!rotate) {
            rotate = 0;
        }
        this._generatingMatrix = true;
        var origin = this._pointToContainerPoint(matrix['2dPoint']);
        //matrix for layers to transform
        // var view = origin.substract(mapViewPoint);
        matrix['container'] = new maptalks.Matrix().translate(origin.x, origin.y)
                        .scaleU(scale).rotate(rotate).translate(-origin.x, -origin.y);

        origin = origin.multi(2);
        matrix['retina'] = new maptalks.Matrix().translate(origin.x, origin.y)
                    .scaleU(scale).rotate(rotate).translate(-origin.x, -origin.y);
        matrix['inverse']['container'] = matrix['container'].inverse();
        matrix['inverse']['retina'] = matrix['retina'].inverse();
        // var scale = matrix['container'].decompose()['scale'];
        matrix['scale'] = {x:scale, y:scale};
        this._generatingMatrix = false;
    },

    /**
     * get Transform Matrix for zooming
     * @param  {Number} scale  scale
     * @param  {Point} origin Transform Origin
     * @private
     */
    _generateMatrices:function (origin, scale, rotate) {
        var viewMatrix = this._genViewMatrix(origin, scale, rotate);
        this._fillMatrices(viewMatrix, scale, rotate);
        return viewMatrix;
    },

    /**
     * Gets pixel lenth from pcenter to map's current center.
     * @param  {maptalks.Coordinate} pcenter - a projected coordinate
     * @return {maptalks.Point}
     * @private
     */
    _getPixelDistance:function (pCoord) {
        var center = this._getPrjCenter();
        var pxCenter = this._prjToContainerPoint(center);
        var pxCoord = this._prjToContainerPoint(pCoord);
        var dist = new maptalks.Point(-pxCoord.x + pxCenter.x, pxCenter.y - pxCoord.y);
        return dist;
    },

    _fireEvent:function (eventName, param) {
        if (this._eventSuppressed) {
            return;
        }
        //fire internal events at first
        this.fire('_' + eventName, param);
        this.fire(eventName, param);
    },

    _Load:function () {
        this._resetMapStatus();
        this._registerDomEvents();
        this._loadAllLayers();
        this._getRenderer().onLoad();
        this._loaded = true;
        this._callOnLoadHooks();
        this._initTime = maptalks.Util.now();
        /**
         * load event, fired when the map completes loading.
         *
         * @event maptalks.Map#load
         * @type {Object}
         * @property {String} type - load
         * @property {maptalks.Map} target - map
         */
        this._fireEvent('load');
    },

    _initRenderer:function () {
        var renderer = this.options['renderer'];
        var clazz = maptalks.Map.getRendererClass(renderer);
        this._renderer = new clazz(this);
    },

    _getRenderer:function () {
        return this._renderer;
    },

    _loadAllLayers:function () {
        function loadLayer(layer) {
            if (layer) {
                layer.load();
            }
        }
        if (this._baseLayer) { this._baseLayer.load(); }
        this._eachLayer(loadLayer, this.getLayers());
    },



    /**
     * Gets layers that fits for the filter
     * @param  {fn} filter - filter function
     * @return {maptalks.Layer[]}
     * @private
     */
    _getLayers:function (filter) {
        var layers = this._baseLayer ? [this._baseLayer].concat(this._layers) : this._layers;
        var result = [];
        for (var i = 0; i < layers.length; i++) {
            if (!filter || filter.call(this, layers[i])) {
                result.push(layers[i]);
            }
        }
        return result;
    },

    _eachLayer:function (fn) {
        if (arguments.length < 2) { return; }
        var layerLists = Array.prototype.slice.call(arguments, 1);
        if (layerLists && !maptalks.Util.isArray(layerLists)) {
            layerLists = [layerLists];
        }
        var layers = [];
        for (var i = 0, len = layerLists.length; i < len; i++) {
            layers = layers.concat(layerLists[i]);
        }
        for (var j = 0, jlen = layers.length; j < jlen; j++) {
            fn.call(fn, layers[j]);
        }
    },

    //Check and reset map's status when map'sview is changed.
    _resetMapStatus:function () {
        var maxZoom = this.getMaxZoom(),
            minZoom = this.getMinZoom();
        var viewMaxZoom = this._view.getMaxZoom(),
            viewMinZoom = this._view.getMinZoom();
        if (!maxZoom || maxZoom === -1 || maxZoom > viewMaxZoom) {
            this.setMaxZoom(viewMaxZoom);
        }
        if (!minZoom || minZoom === -1 || minZoom < viewMinZoom) {
            this.setMinZoom(viewMinZoom);
        }
        maxZoom = this.getMaxZoom();
        minZoom = this.getMinZoom();
        if (maxZoom < minZoom) {
            this.setMaxZoom(minZoom);
        }
        if (!this._zoomLevel || this._zoomLevel > maxZoom) {
            this._zoomLevel = maxZoom;
        }
        if (this._zoomLevel < minZoom) {
            this._zoomLevel = minZoom;
        }
        delete this._prjCenter;
        var projection = this.getProjection();
        this._prjCenter = projection.project(this._center);
    },

    _getContainerDomSize:function () {
        if (!this._containerDOM) { return null; }
        var containerDOM = this._containerDOM,
            width, height;
        if (!maptalks.Util.isNil(containerDOM.width) && !maptalks.Util.isNil(containerDOM.height)) {
            width = containerDOM.width;
            height = containerDOM.height;
            if (maptalks.Browser.retina && containerDOM[maptalks.renderer.tilelayer.Canvas.prototype.propertyOfTileId]) {
                //is a canvas tile of CanvasTileLayer
                width /= 2;
                height /= 2;
            }
        } else if (!maptalks.Util.isNil(containerDOM.clientWidth) && !maptalks.Util.isNil(containerDOM.clientHeight)) {
            width = parseInt(containerDOM.clientWidth, 0);
            height = parseInt(containerDOM.clientHeight, 0);
        } else {
            throw new Error('can not get size of container');
        }
        return new maptalks.Size(width, height);
    },

    _updateMapSize:function (mSize) {
        this.width = mSize['width'];
        this.height = mSize['height'];
        this._getRenderer().updateMapSize(mSize);
        return this;
    },

    /**
     * Gets projected center of the map
     * @return {maptalks.Coordinate}
     * @private
     */
    _getPrjCenter:function () {
        return this._prjCenter;
    },

    _setPrjCenter:function (pcenter) {
        this._prjCenter = pcenter;
    },

    _verifyExtent:function (center) {
        if (!center) {
            return false;
        }
        var maxExt = this.getMaxExtent();
        if (!maxExt) {
            return true;
        }
        return maxExt.contains(center);
    },

    /**
     * Move map's center by pixels.
     * @param  {maptalks.Point} pixel - pixels to move, the relation between value and direction is as:
     * -1,1 | 1,1
     * ------------
     *-1,-1 | 1,-1
     * @private
     * @returns {maptalks.Coordinate} the new projected center.
     */
    _offsetCenterByPixel:function (pixel) {
        var pos = new maptalks.Point(this.width / 2 - pixel.x, this.height / 2 - pixel.y);
        var pCenter = this._containerPointToPrj(pos);
        this._setPrjCenter(pCenter);
        return pCenter;
    },

    /**
     * offset map platform panel.
     *
     * @param  {maptalks.Point} offset - offset in pixel to move
     * @return {maptalks.Map} this
     */
    /**
     * Gets map platform panel's current view point.
     * @return {maptalks.Point}
     */
    offsetPlatform:function (offset) {
        if (!offset) {
            return this._mapViewPoint;
        } else {
            this._getRenderer().offsetPlatform(offset);
            this._mapViewPoint = this._mapViewPoint.add(offset);
            return this;
        }
    },

    _resetMapViewPoint:function () {
        this._mapViewPoint = new maptalks.Point(0, 0);
    },

    /**
     * Get map's current resolution
     * @return {Number} resolution
     * @private
     */
    _getResolution:function (zoom) {
        if (maptalks.Util.isNil(zoom)) {
            zoom = this.getZoom();
        }
        return this._view.getResolution(zoom);
    },

    _getResolutions:function () {
        return this._view.getResolutions();
    },

    /**
     * Converts the projected coordinate to a 2D point in the specific zoom
     * @param  {maptalks.Coordinate} pCoord - projected Coordinate
     * @param  {Number} zoom   - zoom level
     * @return {maptalks.Point} 2D point
     * @private
     */
    _prjToPoint:function (pCoord, zoom) {
        zoom = (zoom === undefined ? this.getZoom() : zoom);
        return this._view.getTransformation().transform(pCoord, this._getResolution(zoom));
    },

    /**
     * Converts the 2D point to projected coordinate
     * @param  {maptalks.Point} point - 2D point
     * @param  {Number} zoom   - zoom level
     * @return {maptalks.Coordinate} projected coordinate
     * @private
     */
    _pointToPrj:function (point, zoom) {
        zoom = (zoom === undefined ? this.getZoom() : zoom);
        return this._view.getTransformation().untransform(point, this._getResolution(zoom));
    },

    /**
     * transform container point to geographical projected coordinate
     *
     * @param  {maptalks.Point} containerPoint
     * @return {maptalks.Coordinate}
     * @private
     */
    _containerPointToPrj:function (containerPoint) {
        return this._pointToPrj(this._containerPointToPoint(containerPoint));
    },

    /**
     * transform view point to geographical projected coordinate
     * @param  {maptalks.Point} viewPoint
     * @return {maptalks.Coordinate}
     * @private
     */
    _viewPointToPrj:function (viewPoint) {
        return this._containerPointToPrj(this.viewPointToContainerPoint(viewPoint));
    },

    /**
     * transform geographical projected coordinate to container point
     * @param  {maptalks.Coordinate} pCoordinate
     * @return {maptalks.Point}
     * @private
     */
    _prjToContainerPoint:function (pCoordinate) {
        return this._pointToContainerPoint(this._prjToPoint(pCoordinate));
    },

    /**
     * transform geographical projected coordinate to view point
     * @param  {maptalks.Coordinate} pCoordinate
     * @return {maptalks.Point}
     * @private
     */
    _prjToViewPoint:function (pCoordinate) {
        var containerPoint = this._prjToContainerPoint(pCoordinate);
        return this._containerPointToViewPoint(containerPoint);
    },

    //destructive containerPointToViewPoint
    _containerPointToViewPoint: function (containerPoint) {
        if (!containerPoint) { return null; }
        var platformOffset = this.offsetPlatform();
        return containerPoint._substract(platformOffset);
    },

    _pointToContainerPoint: function (point) {
        var centerPoint = this._prjToPoint(this._getPrjCenter());
        return new maptalks.Point(
            this.width / 2 + point.x - centerPoint.x,
            this.height / 2 + point.y - centerPoint.y
        );
    },

    _containerPointToPoint: function (containerPoint, zoom) {
        var centerPoint = this._prjToPoint(this._getPrjCenter(), zoom),
            scale = (zoom !== undefined ? this._getResolution() / this._getResolution(zoom) : 1);

        //�������������귽���ǹ̶�������, ��html��׼һ��, ��������������, ���ϵ�������

        return new maptalks.Point(centerPoint.x + scale * (containerPoint.x - this.width / 2), centerPoint.y + scale * (containerPoint.y - this.height / 2));
    },

    _viewPointToPoint: function (viewPoint) {
        return this._containerPointToPoint(this.viewPointToContainerPoint(viewPoint));
    },

    _pointToViewPoint: function (point) {
        return this._prjToViewPoint(this._pointToPrj(point));
    },
});




//--------------hooks after map loaded----------------
maptalks.Map.prototype._callOnLoadHooks = function () {
    var proto = maptalks.Map.prototype;
    for (var i = 0, len = proto._onLoadHooks.length; i < len; i++) {
        proto._onLoadHooks[i].call(this);
    }
};

/**
 * Add hooks for additional codes when map's loading complete, useful for plugin developping.
 * @param {function} fn
 * @returns {maptalks.Map}
 * @static
 * @protected
 */
maptalks.Map.addOnLoadHook = function (fn) { // (Function) || (String, args...)
    var args = Array.prototype.slice.call(arguments, 1);

    var onload = typeof fn === 'function' ? fn : function () {
        this[fn].apply(this, args);
    };

    this.prototype._onLoadHooks = this.prototype._onLoadHooks || [];
    this.prototype._onLoadHooks.push(onload);
    return this;
};


maptalks.Util.extend(maptalks.Map, maptalks.Renderable);

maptalks.Map.include(/** @lends maptalks.Map.prototype */{
    /**
     * Pan to the given coordinate
     * @param {maptalks.Coordinate} coordinate - coordinate to pan to
     * @param {Object} [options=null] - pan options
     * @param {Boolean} [options.animation=null] - whether pan with animation
     * @param {Boolean} [options.duration=600] - pan animation duration
     * @return {maptalks.Map} this
     */
    panTo:function (coordinate, options) {
        if (!coordinate) {
            return this;
        }
        var map = this;
        coordinate = new maptalks.Coordinate(coordinate);
        var dest = this.coordinateToContainerPoint(coordinate),
            current = this.coordinateToContainerPoint(this.getCenter());
        return this._panBy(dest.substract(current), options, function () {
            var c = map.getProjection().project(coordinate);
            map._setPrjCenterAndMove(c);
        });
    },

    /**
     * Pan the map by the give point
     * @param  {maptalks.Point} point - distance to pan, in pixel
     * @param {Object} [options=null] - pan options
     * @param {Boolean} [options.animation=null] - whether pan with animation
     * @param {Boolean} [options.duration=600] - pan animation duration
     * @return {maptalks.Map} this
     */
    panBy:function (offset, options) {
        return this._panBy(offset, options);
    },

    _panBy: function (offset, options, cb) {
        if (!offset) {
            return this;
        }
        offset = new maptalks.Point(offset).multi(-1);
        this.onMoveStart();
        if (!options) {
            options = {};
        }
        if (typeof (options['animation']) === 'undefined' || options['animation']) {
            this._panAnimation(offset, options['duration'], cb);
        } else {
            this.offsetPlatform(offset);
            this._offsetCenterByPixel(offset);
            this.onMoving();
            if (cb) {
                cb();
            }
            this.onMoveEnd();
        }
        return this;
    },

    _panAnimation:function (offset, t, onFinish) {
        this._getRenderer().panAnimation(offset, t, onFinish);
    }

});

maptalks.Map.include(/** @lends maptalks.Map.prototype */{
    _zoom:function (nextZoomLevel, origin, startScale) {
        if (!this.options['zoomable'] || this._zooming) { return; }
        this._originZoomLevel = this.getZoom();
        nextZoomLevel = this._checkZoomLevel(nextZoomLevel);
        this.onZoomStart(nextZoomLevel);
        var zoomOffset;
        if (origin) {
            origin = new maptalks.Point(this.width / 2, this.height / 2);
            zoomOffset = this._getZoomCenterOffset(nextZoomLevel, origin, startScale);
        }
        this.onZoomEnd(nextZoomLevel, zoomOffset);
    },

    _zoomAnimation:function (nextZoomLevel, origin, startScale) {
        if (!this.options['zoomable'] || this._zooming) { return; }
        if (maptalks.Util.isNil(startScale)) {
            startScale = 1;
        }
        if (maptalks.Util.isNil(this._originZoomLevel)) {
            this._originZoomLevel = this.getZoom();
        }
        nextZoomLevel = this._checkZoomLevel(nextZoomLevel);
        if (this._originZoomLevel === nextZoomLevel) {
            return;
        }

        this.onZoomStart(nextZoomLevel);
        if (!origin) {
            origin = new maptalks.Point(this.width / 2, this.height / 2);
        }
        this._startZoomAnimation(startScale, origin, nextZoomLevel);
    },

    _startZoomAnimation:function (startScale, transOrigin, nextZoomLevel) {
        var me = this;
        var resolutions = this._getResolutions();
        var endScale = resolutions[this._originZoomLevel] / resolutions[nextZoomLevel];
        var zoomOffset = this._getZoomCenterOffset(nextZoomLevel, transOrigin, startScale);
        if (zoomOffset.x === 0 && zoomOffset.y === 0) {
            //center is out of maxExtent
            transOrigin = new maptalks.Point(this.width / 2, this.height / 2);
        }
        var duration = this.options['zoomAnimationDuration'] * Math.abs(endScale - startScale) / Math.abs(endScale - 1);
        this._getRenderer().animateZoom(
            {
                startScale : startScale,
                endScale : endScale,
                origin : transOrigin,
                duration : duration
            },
            function () {
                me.onZoomEnd(nextZoomLevel, zoomOffset);
            }
        );
    },

    onZoomStart: function (nextZoomLevel) {
        this._zooming = true;
        this._enablePanAnimation = false;
        /**
          * zoomstart event
          * @event maptalks.Map#zoomstart
          * @type {Object}
          * @property {String} type                    - zoomstart
          * @property {maptalks.Map} target            - the map fires event
          * @property {Number} from                    - zoom level zooming from
          * @property {Number} to                      - zoom level zooming to
          */
        this._fireEvent('zoomstart', {'from' : this._originZoomLevel, 'to': nextZoomLevel});
    },

    onZoomEnd:function (nextZoomLevel, zoomOffset) {
        this._zoomLevel = nextZoomLevel;
        if (zoomOffset && (zoomOffset.x !== 0 || zoomOffset.y !== 0)) {
            this._offsetCenterByPixel(zoomOffset._multi(-1));
        }
        var _originZoomLevel = this._originZoomLevel;
        this._originZoomLevel = nextZoomLevel;
        this._getRenderer().onZoomEnd();
        this._zooming = false;
        /**
          * zoomend event
          * @event maptalks.Map#zoomend
          * @type {Object}
          * @property {String} type                    - zoomend
          * @property {maptalks.Map} target            - the map fires event
          * @property {Number} from                    - zoom level zooming from
          * @property {Number} to                      - zoom level zooming to
          */
        this._fireEvent('zoomend', {'from' : _originZoomLevel, 'to': nextZoomLevel});
    },


    _checkZoomLevel:function (nextZoomLevel) {
        var maxZoom = this.getMaxZoom(),
            minZoom = this.getMinZoom();
        if (nextZoomLevel < minZoom) {
            nextZoomLevel = minZoom;
        }
        if (nextZoomLevel > maxZoom) {
            nextZoomLevel = maxZoom;
        }
        return nextZoomLevel;
    },

    _getZoomCenterOffset:function (nextZoomLevel, origin, startScale) {
        if (maptalks.Util.isNil(startScale)) {
            startScale = 1;
        }
        var resolutions = this._getResolutions();
        var zScale;
        var zoomOffset;
        if (nextZoomLevel < this._originZoomLevel) {
            zScale = resolutions[nextZoomLevel + 1] / resolutions[nextZoomLevel];
            zoomOffset = new maptalks.Point(
                    -(origin.x - this.width / 2) * (startScale - zScale),
                    -(origin.y - this.height / 2) * (startScale - zScale)
                );
        } else {
            zScale = resolutions[nextZoomLevel - 1] / resolutions[nextZoomLevel];
            zoomOffset = new maptalks.Point(
                    (origin.x - this.width / 2) * (zScale - startScale),
                    (origin.y - this.height / 2) * (zScale - startScale)
                );
        }

        var newCenter = this.containerPointToCoordinate(new maptalks.Point(this.width / 2 + zoomOffset.x, this.height / 2 + zoomOffset.y));
        if (!this._verifyExtent(newCenter)) {
            return new maptalks.Point(0, 0);
        }

        return zoomOffset;
    },

    _getZoomMillisecs:function () {
        return 600;
    }
});

/**
 * Methods of topo computations
 */
maptalks.Map.include(/** @lends maptalks.Map.prototype */{
    /**
     * Caculate distance of two coordinates.
     * @param {Number[]|maptalks.Coordinate} coord1 - coordinate 1
     * @param {Number[]|maptalks.Coordinate} coord2 - coordinate 2
     * @return {Number} distance, unit is meter
     * @example
     * var distance = map.computeLength([0, 0], [0, 20]);
     */
    computeLength: function (coord1, coord2) {
        if (!this.getProjection()) { return null; }
        var p1 = new maptalks.Coordinate(coord1),
            p2 = new maptalks.Coordinate(coord2);
        if (p1.equals(p2)) { return 0; }
        return this.getProjection().measureLength(p1, p2);
    },

    /**
     * Caculate a geometry's length.
     * @param {maptalks.Geometry} geometry - geometry to caculate
     * @return {Number} length, unit is meter
     */
    computeGeometryLength:function (geometry) {
        return geometry._computeGeodesicLength(this.getProjection());
    },

    /**
     * Caculate a geometry's area.
     * @param  {maptalks.Geometry} geometry - geometry to caculate
     * @return {Number} area, unit is sq.meter
     */
    computeGeometryArea:function (geometry) {
        return geometry._computeGeodesicArea(this.getProjection());
    },

    /**
     * Identify the geometries on the given coordinate.
     * @param {Object} opts - the identify options
     * @param {maptalks.Coordinate} opts.coordinate - coordinate to identify
     * @param {Object}   opts.layers        - the layers to perform identify on.
     * @param {Function} [opts.filter=null] - filter function of the result geometries, return false to exclude.
     * @param {Number}   [opts.count=null]  - limit of the result count.
     * @param {Boolean}  [opts.includeInternals=false] - whether to identify the internal layers.
     * @param {Function} callback           - the callback function using the result geometries as the parameter.
     * @return {maptalks.Map} this
     * @example
     * map.identify({
     *      coordinate: [0, 0],
     *      layers: [layer],
     *      success: function(geos){
     *          console.log(geos);
     *      }
     *  });
     */
    identify: function (opts, callback) {
        if (!opts) {
            return this;
        }
        var reqLayers = opts['layers'];
        if (!maptalks.Util.isArrayHasData(reqLayers)) {
            return this;
        }
        var layers = [];
        var i, len;
        for (i = 0, len = reqLayers.length; i < len; i++) {
            if (maptalks.Util.isString(reqLayers[i])) {
                layers.push(this.getLayer(reqLayers[i]));
            } else {
                layers.push(reqLayers[i]);
            }
        }
        var point = this.coordinateToPoint(new maptalks.Coordinate(opts['coordinate']));
        var options = maptalks.Util.extend({}, opts);
        var hits = [];
        for (i = layers.length - 1; i >= 0; i--) {
            if (opts['count'] && hits.length >= opts['count']) {
                break;
            }
            var layer = layers[i];
            if (!layer || !layer.getMap() || (!opts['includeInternals'] && layer.getId().indexOf(maptalks.internalLayerPrefix) >= 0)) {
                continue;
            }
            var layerHits = layer.identify(point, options);
            if (layerHits) {
                if (maptalks.Util.isArray(layerHits)) {
                    hits = hits.concat(layerHits);
                } else {
                    hits.push(layerHits);
                }
            }
        }
        callback.call(this, hits);
        return this;
    }

});

maptalks.Map.include(/** @lends maptalks.Map.prototype */{
    _registerDomEvents: function (remove) {
        var events = /**
                      * mousedown event
                      * @event maptalks.Map#mousedown
                      * @type {Object}
                      * @property {String} type                    - mousedown
                      * @property {maptalks.Map} target            - the map fires event
                      * @property {maptalks.Coordinate} coordinate - coordinate of the event
                      * @property {maptalks.Point} containerPoint  - container point of the event
                      * @property {maptalks.Point} viewPoint       - view point of the event
                      * @property {Event} domEvent                 - dom event
                      */
                     'mousedown ' +
                     /**
                      * mouseup event
                      * @event maptalks.Map#mouseup
                      * @type {Object}
                      * @property {String} type                    - mouseup
                      * @property {maptalks.Map} target            - the map fires event
                      * @property {maptalks.Coordinate} coordinate - coordinate of the event
                      * @property {maptalks.Point} containerPoint  - container point of the event
                      * @property {maptalks.Point} viewPoint       - view point of the event
                      * @property {Event} domEvent                 - dom event
                      */
                     'mouseup ' +
                     /**
                      * mouseover event
                      * @event maptalks.Map#mouseover
                      * @type {Object}
                      * @property {String} type                    - mouseover
                      * @property {maptalks.Map} target            - the map fires event
                      * @property {maptalks.Coordinate} coordinate - coordinate of the event
                      * @property {maptalks.Point} containerPoint  - container point of the event
                      * @property {maptalks.Point} viewPoint       - view point of the event
                      * @property {Event} domEvent                 - dom event
                      */
                     'mouseover ' +
                     /**
                      * mouseout event
                      * @event maptalks.Map#mouseout
                      * @type {Object}
                      * @property {String} type                    - mouseout
                      * @property {maptalks.Map} target            - the map fires event
                      * @property {maptalks.Coordinate} coordinate - coordinate of the event
                      * @property {maptalks.Point} containerPoint  - container point of the event
                      * @property {maptalks.Point} viewPoint       - view point of the event
                      * @property {Event} domEvent                 - dom event
                      */
                     'mouseout ' +
                     /**
                      * mousemove event
                      * @event maptalks.Map#mousemove
                      * @type {Object}
                      * @property {String} type                    - mousemove
                      * @property {maptalks.Map} target            - the map fires event
                      * @property {maptalks.Coordinate} coordinate - coordinate of the event
                      * @property {maptalks.Point} containerPoint  - container point of the event
                      * @property {maptalks.Point} viewPoint       - view point of the event
                      * @property {Event} domEvent                 - dom event
                      */
                     'mousemove ' +
                     /**
                      * click event
                      * @event maptalks.Map#click
                      * @type {Object}
                      * @property {String} type                    - click
                      * @property {maptalks.Map} target            - the map fires event
                      * @property {maptalks.Coordinate} coordinate - coordinate of the event
                      * @property {maptalks.Point} containerPoint  - container point of the event
                      * @property {maptalks.Point} viewPoint       - view point of the event
                      * @property {Event} domEvent                 - dom event
                      */
                     'click ' +
                     /**
                      * dblclick event
                      * @event maptalks.Map#dblclick
                      * @type {Object}
                      * @property {String} type                    - dblclick
                      * @property {maptalks.Map} target            - the map fires event
                      * @property {maptalks.Coordinate} coordinate - coordinate of the event
                      * @property {maptalks.Point} containerPoint  - container point of the event
                      * @property {maptalks.Point} viewPoint       - view point of the event
                      * @property {Event} domEvent                 - dom event
                      */
                     'dblclick ' +
                     /**
                      * contextmenu event
                      * @event maptalks.Map#contextmenu
                      * @type {Object}
                      * @property {String} type                    - contextmenu
                      * @property {maptalks.Map} target            - the map fires event
                      * @property {maptalks.Coordinate} coordinate - coordinate of the event
                      * @property {maptalks.Point} containerPoint  - container point of the event
                      * @property {maptalks.Point} viewPoint       - view point of the event
                      * @property {Event} domEvent                 - dom event
                      */
                     'contextmenu ' +
                     /**
                      * keypress event
                      * @event maptalks.Map#keypress
                      * @type {Object}
                      * @property {String} type                    - keypress
                      * @property {maptalks.Map} target            - the map fires event
                      * @property {maptalks.Coordinate} coordinate - coordinate of the event
                      * @property {maptalks.Point} containerPoint  - container point of the event
                      * @property {maptalks.Point} viewPoint       - view point of the event
                      * @property {Event} domEvent                 - dom event
                      */
                     'keypress ' +
                     /**
                      * touchstart event
                      * @event maptalks.Map#touchstart
                      * @type {Object}
                      * @property {String} type                    - touchstart
                      * @property {maptalks.Map} target            - the map fires event
                      * @property {maptalks.Coordinate} coordinate - coordinate of the event
                      * @property {maptalks.Point} containerPoint  - container point of the event
                      * @property {maptalks.Point} viewPoint       - view point of the event
                      * @property {Event} domEvent                 - dom event
                      */
                     'touchstart ' +
                     /**
                      * touchmove event
                      * @event maptalks.Map#touchmove
                      * @type {Object}
                      * @property {String} type                    - touchmove
                      * @property {maptalks.Map} target            - the map fires event
                      * @property {maptalks.Coordinate} coordinate - coordinate of the event
                      * @property {maptalks.Point} containerPoint  - container point of the event
                      * @property {maptalks.Point} viewPoint       - view point of the event
                      * @property {Event} domEvent                 - dom event
                      */
                     'touchmove ' +
                     /**
                      * touchend event
                      * @event maptalks.Map#touchend
                      * @type {Object}
                      * @property {String} type                    - touchend
                      * @property {maptalks.Map} target            - the map fires event
                      * @property {maptalks.Coordinate} coordinate - coordinate of the event
                      * @property {maptalks.Point} containerPoint  - container point of the event
                      * @property {maptalks.Point} viewPoint       - view point of the event
                      * @property {Event} domEvent                 - dom event
                      */
                     'touchend ';
        //phantomjs will crash when registering events on canvasContainer
        var dom = this._panels.mapWrapper || this._containerDOM;
        if (remove) {
            maptalks.DomUtil.removeDomEvent(dom, events, this._handleDOMEvent, this);
        } else {
            maptalks.DomUtil.addDomEvent(dom, events, this._handleDOMEvent, this);
        }

    },

    _handleDOMEvent: function (e) {
        var type = e.type;
        if (type === 'mousedown' || type === 'click') {
            var button = e.button;
            if (button === 2) {
                type = 'contextmenu';
            }
        }
        // prevent default contextmenu
        if (type === 'contextmenu') {
            maptalks.DomUtil.preventDefault(e);
        }
        if (this._ignoreEvent(e)) {
            return;
        }
        // ignore click lasted for more than 300ms.
        if (type === 'mousedown') {
            this._mouseDownTime = maptalks.Util.now();
        } else if (type === 'click' && this._mouseDownTime) {
            var now = maptalks.Util.now();
            if (now - this._mouseDownTime > 300) {
                return;
            }
        }
        this._fireDOMEvent(this, e, type);
    },

    _ignoreEvent: function (domEvent) {
        //ignore events originated from control and ui doms.
        if (!domEvent || !this._panels.control) {
            return false;
        }
        var target = domEvent.srcElement || domEvent.target;
        if (target) {
            while (target && target !== this._containerDOM) {
                if (target.className && target.className.indexOf &&
                    (target.className.indexOf('maptalks-control') >= 0 || target.className.indexOf('maptalks-ui') >= 0)) {
                    return true;
                }
                target = target.parentNode;
            }

        }
        return false;
    },

    _parseEvent:function (e, type) {
        if (!e) {
            return null;
        }
        var eventParam = {
            'domEvent': e
        };
        if (type !== 'keypress') {
            var actual = e.touches && e.touches.length > 0 ?
                e.touches[0] : e.changedTouches && e.changedTouches.length > 0 ?
                e.changedTouches[0] : e;
            if (actual) {
                var containerPoint = maptalks.DomUtil.getEventContainerPoint(actual, this._containerDOM);
                eventParam['coordinate'] = this.containerPointToCoordinate(containerPoint);
                eventParam['containerPoint'] = containerPoint;
                eventParam['viewPoint'] = this.containerPointToViewPoint(containerPoint);
                eventParam['point2d'] = this._containerPointToPoint(containerPoint);
            }
        }
        return eventParam;
    },

    _fireDOMEvent: function (target, e, type) {
        var eventParam = this._parseEvent(e, type);
        this._fireEvent(type, eventParam);
    }
});

maptalks.Map.include(/** @lends maptalks.Map.prototype */{
    /**
     * Request for the full screen
     * @return {maptalks.Map} this
     */
    requestFullScreen: function () {
        /**
          * fullscreenstart event
          * @event maptalks.Map#fullscreenstart
          * @type {Object}
          * @property {String} type                    - fullscreenstart
          * @property {maptalks.Map} target            - the map fires event
          */
        this._fireEvent('fullscreenstart');
        this._requestFullScreen(this._containerDOM);
        /**
          * fullscreenend event
          * @event maptalks.Map#fullscreenend
          * @type {Object}
          * @property {String} type                    - fullscreenend
          * @property {maptalks.Map} target            - the map fires event
          */
        this._fireEvent('fullscreenend');
        return this;
    },

    /**
     * Cancel full screen
     * @return {maptalks.Map} this
     */
    cancelFullScreen: function () {
        this._cancelFullScreen(this._containerDOM);
        /**
          * cancelfullscreen event
          * @event maptalks.Map#cancelfullscreen
          * @type {Object}
          * @property {String} type                    - cancelfullscreen
          * @property {maptalks.Map} target            - the map fires event
          */
        this._fireEvent('cancelfullscreen');
        return this;
    },

    _requestFullScreen: function (dom) {
        if (dom.requestFullScreen) {
            dom.requestFullScreen();
        } else if (dom.mozRequestFullScreen) {
            dom.mozRequestFullScreen();
        } else if (dom.webkitRequestFullScreen) {
            dom.webkitRequestFullScreen();
        } else if (dom.msRequestFullScreen) {
            dom.msRequestFullScreen();
        } else {
            var features = 'fullscreen=1,status=no,resizable=yes,top=0,left=0,scrollbars=no,' +
                'titlebar=no,menubar=no,location=no,toolbar=no,z-look=yes,' +
                'width=' + (screen.availWidth - 8) + ',height=' + (screen.availHeight - 45);
            var newWin = window.open(location.href, '_blank', features);
            if (newWin !== null) {
                window.opener = null;
                //关闭父窗口
                window.close();
            }
        }
    },

    _cancelFullScreen: function () {
        if (document.cancelFullScreen) {
            document.cancelFullScreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitCancelFullScreen) {
            document.webkitCancelFullScreen();
        } else {
            var features = 'fullscreen=no,status=yes,resizable=yes,scrollbars=no,' +
                'titlebar=no,menubar=yes,location=yes,toolbar=yes,z-look=yes';
            var newWin = window.open(location.href, '_blank', features);
            if (newWin !== null) {
                window.opener = null;
                //关闭父窗口
                window.close();
            }
        }
    }
});

/** Profile **/

/**
 * Reproduce a Layer from layer's profile JSON.
 * @param  {Object} layerJSON - layer's profile JSON
 * @return {maptalks.Layer}
 * @static
 * @function
 */
maptalks.Layer.fromJSON = function (layerJSON) {
    if (!layerJSON) { return null; }
    var layerType = layerJSON['type'];
    if (layerType === 'vector') {
        layerType = layerJSON['type'] = 'VectorLayer';
    } else if (layerType === 'dynamic') {
        layerType = layerJSON['type'] = 'DynamicLayer';
    } else if (layerType === 'tile') {
        layerType = layerJSON['type'] = 'TileLayer';
    }
    if (typeof maptalks[layerType] === 'undefined' || !maptalks[layerType].fromJSON) {
        throw new Error('unsupported layer type:' + layerType);
    }
    return maptalks[layerType].fromJSON(layerJSON);
};

maptalks.Map.include(/** @lends maptalks.Map.prototype */{
    /**
     * @property {String}  - Version of the [profile]{@link maptalks.Map#toJSON} JSON schema.
     * @constant
     * @static
     */
    'PROFILE_VERSION' : '1.0',
    /**
     * Export the map's profile json. <br>
     * Map's profile is a snapshot of the map in JSON format. <br>
     * It can be used to reproduce the instance by [fromJSON]{@link maptalks.Map#fromJSON} method
     * @param  {Object} [options=null] - export options
     * @param  {Boolean|Object} [options.baseLayer=null] - whether to export base layer's profile, if yes, it will be used as layer's toJSON options.
     * @param  {Boolean|maptalks.Extent} [options.clipExtent=null] - if set with an extent instance, only the geometries intersectes with the extent will be exported.
     *                                                             If set to true, map's current extent will be used.
     * @param  {Boolean|Object|Object[]} [options.layers=null] - whether to export other layers' profile, if yes, it will be used as layer's toJSON options.
     *                                                        It can also be a array of layer export options with a "id" attribute to filter the layers to export.
     * @return {Object} layer's profile JSON
     */
    toJSON:function (options) {
        if (!options) {
            options = {};
        }
        var profile = {
            'version': this['PROFILE_VERSION'],
            'extent' : this.getExtent().toJSON()
        };
        profile['options'] = this.config();
        profile['options']['center'] = this.getCenter();
        profile['options']['zoom'] = this.getZoom();

        var baseLayer = this.getBaseLayer();
        if ((maptalks.Util.isNil(options['baseLayer']) || options['baseLayer']) && baseLayer) {
            profile['baseLayer'] = baseLayer.toJSON(options['baseLayer']);
        }
        var extraLayerOptions = {};
        if (options['clipExtent']) {
            //if clipExtent is set, only geometries intersecting with extent will be exported.
            //clipExtent's value can be an extent or true (map's current extent)
            if (options['clipExtent'] === true)  {
                extraLayerOptions['clipExtent'] = this.getExtent();
            } else {
                extraLayerOptions['clipExtent'] = options['clipExtent'];
            }
        }
        var i, len, layers, opts,
            layersJSON = [];
        if (maptalks.Util.isNil(options['layers']) || (options['layers'] && !maptalks.Util.isArray(options['layers']))) {
            layers = this.getLayers();
            for (i = 0, len = layers.length; i < len; i++) {
                if (!layers[i].toJSON) {
                    continue;
                }
                opts = maptalks.Util.extend({}, maptalks.Util.isObject(options['layers']) ? options['layers'] : {}, extraLayerOptions);
                layersJSON.push(layers[i].toJSON(opts));
            }
            profile['layers'] = layersJSON;
        } else if (maptalks.Util.isArrayHasData(options['layers'])) {
            layers = options['layers'];
            for (i = 0; i < layers.length; i++) {
                var exportOption = layers[i];
                var layer = this.getLayer(exportOption['id']);
                if (!layer.toJSON) {
                    continue;
                }
                opts = maptalks.Util.extend({}, exportOption['options'], extraLayerOptions);
                layersJSON.push(layer.toJSON(opts));
            }
            profile['layers'] = layersJSON;
        } else {
            profile['layers'] = [];
        }
        return profile;
    }
});

/**
 * Reproduce a map from map's profile JSON.
 * @param {(string|HTMLElement|object)} container - The container to create the map on, can be:<br>
 *                                          1. A HTMLElement container.<br/>
 *                                          2. ID of a HTMLElement container.<br/>
 *                                          3. A canvas compatible container in node,
 *                                          e.g. [node-canvas]{@link https://github.com/Automattic/node-canvas},
 *                                              [canvas2svg]{@link https://github.com/gliffy/canvas2svg}
 * @param  {Object} mapJSON - map's profile JSON
 * @param  {Object} [options=null] - options
 * @param  {Object} [options.baseLayer=null] - whether to import the baseLayer
 * @param  {Object} [options.layers=null]    - whether to import the layers
 * @return {maptalks.Map}
 * @static
 * @function
 * @example
 * var map = maptalks.Map.fromJSON('map', mapProfile);
 */
maptalks.Map.fromJSON = function (container, profile, options) {
    if (!container || !profile) {
        return null;
    }
    if (!options) {
        options = {};
    }
    var map = new maptalks.Map(container, profile['options']);
    if (maptalks.Util.isNil(options['baseLayer']) || options['baseLayer']) {
        var baseLayer = maptalks.Layer.fromJSON(profile['baseLayer']);
        if (baseLayer) {
            map.setBaseLayer(baseLayer);
        }
    }
    if (maptalks.Util.isNil(options['layers']) || options['layers']) {
        var layers = [];
        var layerJSONs = profile['layers'];
        for (var i = 0; i < layerJSONs.length; i++) {
            var layer = maptalks.Layer.fromJSON(layerJSONs[i]);
            layers.push(layer);
        }
        map.addLayer(layers);
    }

    return map;
};

maptalks.Map.mergeOptions({
    'draggable': true
});

maptalks.Map.Drag = maptalks.Handler.extend({
    addHooks: function () {
        var map = this.target;
        if (!map) { return; }
        var dom = map._panels.mapWrapper || map._containerDOM;
        this._dragHandler = new maptalks.Handler.Drag(dom, {
            'cancelOn' : maptalks.Util.bind(this._cancelOn, this)
        });
        this._dragHandler.on('mousedown', this._onMouseDown, this)
            .on('dragstart', this._onDragStart, this)
            .on('dragging', this._onDragging, this)
            .on('dragend', this._onDragEnd, this)
            .enable();
    },

    removeHooks: function () {
        this._dragHandler.off('mousedown', this._onMouseDown, this)
                .off('dragstart', this._onDragStart, this)
                .off('dragging', this._onDragging, this)
                .off('dragend', this._onDragEnd, this)
                .disable();
        this._dragHandler.remove();
        delete this._dragHandler;
    },

    _cancelOn: function (domEvent) {
        if (this._ignore(domEvent)) {
            return true;
        }
        return false;
    },

    _ignore: function (param) {
        if (!param) {
            return false;
        }
        if (param.domEvent) {
            param = param.domEvent;
        }
        return this.target._ignoreEvent(param);
    },


    _onMouseDown:function (param) {
        if (this.target._panAnimating) {
            this.target._enablePanAnimation = false;
        }
        maptalks.DomUtil.preventDefault(param['domEvent']);
    },

    _onDragStart:function (param) {
        var map = this.target;
        this.startDragTime = maptalks.Util.now();
        var domOffset = map.offsetPlatform();
        this.startLeft = domOffset.x;
        this.startTop = domOffset.y;
        this.preX = param['mousePos'].x;
        this.preY = param['mousePos'].y;
        this.startX = this.preX;
        this.startY = this.preY;
        map.onMoveStart(param);
    },

    _onDragging:function (param) {
        //maptalks.DomUtil.preventDefault(param['domEvent']);
        if (this.startLeft === undefined) {
            return;
        }
        var map = this.target;
        var mx = param['mousePos'].x,
            my = param['mousePos'].y;
        var nextLeft = (this.startLeft + mx - this.startX);
        var nextTop = (this.startTop + my - this.startY);
        var mapPos = map.offsetPlatform();
        var offset = new maptalks.Point(nextLeft, nextTop)._substract(mapPos);
        map.offsetPlatform(offset);
        map._offsetCenterByPixel(offset);
        map.onMoving(param);
    },

    _onDragEnd:function (param) {
        //maptalks.DomUtil.preventDefault(param['domEvent']);
        if (this.startLeft === undefined) {
            return;
        }
        var map = this.target;
        var t = maptalks.Util.now() - this.startDragTime;
        var domOffset = map.offsetPlatform();
        var xSpan =  domOffset.x - this.startLeft;
        var ySpan =  domOffset.y - this.startTop;

        delete this.startLeft;
        delete this.startTop;
        delete this.preX;
        delete this.preY;
        delete this.startX;
        delete this.startY;

        if (t < 280 && Math.abs(ySpan) + Math.abs(xSpan) > 5) {
            // var distance = new maptalks.Point(xSpan * Math.ceil(500 / t), ySpan * Math.ceil(500 / t))._multi(0.5);
            var distance = new maptalks.Point(xSpan, ySpan);
            t = 5 * t * (Math.abs(distance.x) + Math.abs(distance.y)) / 500;
            map._panAnimation(distance, t);
        } else {
            map.onMoveEnd(param);
        }
    }
});

maptalks.Map.addInitHook('addHandler', 'draggable', maptalks.Map.Drag);

maptalks.Map.mergeOptions({
    'autoBorderPanning': false
});

maptalks.Map.AutoBorderPanning = maptalks.Handler.extend({
    //threshold to trigger panning, in px
    threshold : 10,
    //number of px to move when panning is triggered
    step : 4,

    addHooks: function () {
        this.dom = this.target._containerDOM;
        maptalks.DomUtil.on(this.dom, 'mousemove', this._onMouseMove, this);
        maptalks.DomUtil.on(this.dom, 'mouseout', this._onMouseOut, this);
    },

    removeHooks: function () {
        this._cancelPan();
        maptalks.DomUtil.off(this.dom, 'mousemove', this._onMouseMove, this);
        maptalks.DomUtil.off(this.dom, 'mouseout', this._onMouseOut, this);
    },

    _onMouseMove: function (event) {
        var eventParam = this.target._parseEvent(event);
        var mousePos = eventParam['containerPoint'];
        var size = this.target.getSize();
        var tests = [mousePos.x, size['width'] - mousePos.x,
                mousePos.y, size['height'] - mousePos.y];

        var min = Math.min.apply(Math, tests),
            absMin = Math.abs(min);

        if (absMin === 0 || absMin > this.threshold) {
            this._cancelPan();
            return;
        }
        var step = this.step;
        var offset = new maptalks.Point(0, 0);
        if (tests[0] === min) {
            offset.x = -step;
        } else if (tests[1] === min) {
            offset.x = step;
        }
        if (tests[2] === min) {
            offset.y = -step;
        } else if (tests[3] === min) {
            offset.y = step;
        }
        this._stepOffset = offset;
        this._pan();
    },

    _onMouseOut: function () {
        this._cancelPan();
    },

    _cancelPan:function () {
        delete this._stepOffset;
        if (this._animationId) {
            maptalks.Util.cancelAnimFrame(this._animationId);
            delete this._animationId;
        }
    },

    _pan:function () {
        if (this._stepOffset) {
            this.target.panBy(this._stepOffset, {
                'animation':false
            });
            this._animationId = maptalks.Util.requestAnimFrame(maptalks.Util.bind(this._pan, this));
        }
    }
});

maptalks.Map.addInitHook('addHandler', 'autoBorderPanning', maptalks.Map.AutoBorderPanning);

maptalks.Map.mergeOptions({
    'doubleClickZoom': true
});

maptalks.Map.DoubleClickZoom = maptalks.Handler.extend({
    addHooks: function () {
        this.target.on('_dblclick', this._onDoubleClick, this);
    },

    removeHooks: function () {
        this.target.off('_dblclick', this._onDoubleClick, this);
    },

    _onDoubleClick: function (param) {
        var map = this.target;
        if (map.options['doubleClickZoom']) {
            var oldZoom = map.getZoom(),
                zoom = param['domEvent']['shiftKey'] ? Math.ceil(oldZoom) - 1 : Math.floor(oldZoom) + 1;
            map._zoomAnimation(zoom, param['containerPoint']);
        }

    }
});

maptalks.Map.addInitHook('addHandler', 'doubleClickZoom', maptalks.Map.DoubleClickZoom);

maptalks.Map.mergeOptions({
    'scrollWheelZoom': true
});

maptalks.Map.ScrollWheelZoom = maptalks.Handler.extend({
    addHooks: function () {
        maptalks.DomUtil.addDomEvent(this.target._containerDOM, 'mousewheel', this._onWheelScroll, this);
    },

    removeHooks: function () {
        maptalks.DomUtil.removeDomEvent(this.target._containerDOM, 'mousewheel', this._onWheelScroll);
    },

    _onWheelScroll: function (evt) {
        var map = this.target;
        var _containerDOM = map._containerDOM;
        maptalks.DomUtil.preventDefault(evt);
        maptalks.DomUtil.stopPropagation(evt);
        if (map._zooming) { return false; }
        var _levelValue = 0;
        _levelValue += (evt.wheelDelta ? evt.wheelDelta : evt.detail) > 0 ? 1 : -1;
        if (evt.detail) {
            _levelValue *= -1;
        }
        var mouseOffset = maptalks.DomUtil.getEventContainerPoint(evt, _containerDOM);
        if (this._wheelExecutor) {
            clearTimeout(this._wheelExecutor);
        }
        this._wheelExecutor = setTimeout(function () {
            map._zoomAnimation(map.getZoom() + _levelValue, mouseOffset);
        }, 40);

        return false;
    }
    /*_onWheelScroll: function (evt) {
        var map = this.target;
        var containerDOM = map._containerDOM;
        maptalks.DomUtil.preventDefault(evt);
        maptalks.DomUtil.stopPropagation(evt);

        if (map._zooming || this._scaling) {return;}
        if (this._wheelExecutor) {
            clearTimeout(this._wheelExecutor);
        }
        this._scaling = true;
        var level = 0;
        level += (evt.wheelDelta?evt.wheelDelta:evt.detail) > 0 ? 1 : -1;
        if (evt.detail) {
            level *= -1;
        }
        var zoomPoint = maptalks.DomUtil.getEventContainerPoint(evt, containerDOM);
        if (maptalks.Util.isNil(this._targetZoom)) {
            this._targetZoom = map.getZoom();
        }
        var preZoom = this._targetZoom;
        this._targetZoom += level;
        this._targetZoom = map._checkZoomLevel(this._targetZoom);
        var scale = map._getResolution(map.getZoom())/map._getResolution(this._targetZoom);
        var preScale = map._getResolution(map.getZoom())/map._getResolution(preZoom);
        var render = map._getRenderer();
        var me = this;
        render.animateZoom(preScale, scale, zoomPoint, 100, function() {
            me._scaling = false;
            map._zoom(me._targetZoom, zoomPoint);
            me._wheelExecutor = setTimeout(function () {
                map.onZoomEnd(me._targetZoom);
                delete me._targetZoom;
            },100);
        });
        return false;
    }*/
});

maptalks.Map.addInitHook('addHandler', 'scrollWheelZoom', maptalks.Map.ScrollWheelZoom);

maptalks.Map.mergeOptions({
    'touchZoom': true,
    'touchZoomOrigin' : 'center'
});

//handler to zoom map by pinching
maptalks.Map.TouchZoom = maptalks.Handler.extend({
    addHooks: function () {
        maptalks.DomUtil.addDomEvent(this.target._containerDOM, 'touchstart', this._onTouchStart, this);
    },

    removeHooks: function () {
        maptalks.DomUtil.removeDomEvent(this.target._containerDOM, 'touchstart', this._onTouchStart);
    },

    _onTouchStart:function (event) {
        var map = this.target;
        if (!event.touches || event.touches.length !== 2 || map._zooming) { return; }
        var container = map._containerDOM;
        var p1 = maptalks.DomUtil.getEventContainerPoint(event.touches[0], container),
            p2 = maptalks.DomUtil.getEventContainerPoint(event.touches[1], container);

        this._startDist = p1.distanceTo(p2);
        this._startZoom = map.getZoom();
        if (map.options['touchZoomOrigin'] === 'pinch') {
            this._preOrigin = p1.add(p2)._multi(1 / 2);
        } else {
            var size = map.getSize();
            this._preOrigin = new maptalks.Point(size['width'] / 2, size['height'] / 2);
        }


        map._zooming = true;

        maptalks.DomUtil.addDomEvent(document, 'touchmove', this._onTouchMove, this)
            .addDomEvent(document, 'touchend', this._onTouchEnd, this);

        maptalks.DomUtil.preventDefault(event);
        /**
          * touchzoomstart event
          * @event maptalks.Map#touchzoomstart
          * @type {Object}
          * @property {String} type                    - touchzoomstart
          * @property {maptalks.Map} target            - the map fires event
          */
        map._fireEvent('touchzoomstart');
    },

    _onTouchMove:function (event) {
        var map = this.target;
        if (!event.touches || event.touches.length !== 2 || !map._zooming) { return; }
        var container = map._containerDOM,
            p1 = maptalks.DomUtil.getEventContainerPoint(event.touches[0], container),
            p2 = maptalks.DomUtil.getEventContainerPoint(event.touches[1], container),
            scale = p1.distanceTo(p2) / this._startDist;
        var origin;
        if (map.options['touchZoomOrigin'] === 'pinch') {
            origin = p1.add(p2)._multi(1 / 2);
        } else {
            var size = map.getSize();
            origin = new maptalks.Point(size['width'] / 2, size['height'] / 2);
        }
        var offset = this._preOrigin.substract(origin);
        map.offsetPlatform(offset);
        map._offsetCenterByPixel(offset);
        this._preOrigin = origin;
        this._scale = scale;

        var renderer = map._getRenderer();

        var matrix = map._generateMatrices(origin, scale);
        renderer.transform(matrix);
        /**
          * touchzooming event
          * @event maptalks.Map#touchzooming
          * @type {Object}
          * @property {String} type                    - touchzooming
          * @property {maptalks.Map} target            - the map fires event
          * @property {Matrix} matrix                  - transforming matrix
          */
        map._fireEvent('touchzooming', {'matrix': matrix});
        // maptalks.DomUtil.preventDefault(event);
    },

    _onTouchEnd:function () {
        var map = this.target;
        if (!map._zooming) {
            map._zooming = false;
            return;
        }
        map._zooming = false;

        maptalks.DomUtil
            .off(document, 'touchmove', this._onTouchMove, this)
            .off(document, 'touchend', this._onTouchEnd, this);

        var scale = this._scale;
        var zoom = map.getZoomForScale(scale);
        if (zoom === -1) {
            zoom = map.getZoom();
        }
        /**
          * touchzoomend event
          * @event maptalks.Map#touchzoomend
          * @type {Object}
          * @property {String} type                    - touchzoomend
          * @property {maptalks.Map} target            - the map fires event
          */
        map._fireEvent('touchzoomend');
        if (zoom === map.getZoom()) {
            //remove scale transform
            map._getRenderer().transform(null);
        } else {
            map._zoomAnimation(zoom, this._preOrigin, this._scale);
        }
    }
});


maptalks.Map.addInitHook('addHandler', 'touchZoom', maptalks.Map.TouchZoom);

maptalks.Map.mergeOptions({
    'geometryEvents': true
});

maptalks.Map.GeometryEvents = maptalks.Handler.extend({
    EVENTS: 'mousedown mouseup mousemove click dblclick contextmenu touchstart touchmove touchend',

    addHooks: function () {
        var map = this.target;
        var dom = map._panels.allLayers || map._containerDOM;
        if (dom) {
            maptalks.DomUtil.on(dom, this.EVENTS, this._identifyGeometryEvents, this);
        }

    },

    removeHooks: function () {
        var map = this.target;
        var dom = map._panels.allLayers || map._containerDOM;
        if (dom) {
            maptalks.DomUtil.off(dom, this.EVENTS, this._identifyGeometryEvents, this);
        }
    },

    _identifyGeometryEvents: function (domEvent) {
        var map = this.target;
        var vectorLayers = map._getLayers(function (layer) {
            if (layer instanceof maptalks.VectorLayer) {
                return true;
            }
            return false;
        });
        if (map._isBusy() || !vectorLayers || vectorLayers.length === 0) {
            return;
        }
        var eventType = domEvent.type;
        // ignore click lasted for more than 300ms.
        if (eventType === 'mousedown') {
            this._mouseDownTime = maptalks.Util.now();
        } else if (eventType === 'click' && this._mouseDownTime) {
            var now = maptalks.Util.now();
            if (now - this._mouseDownTime > 300) {
                return;
            }
        }
        var layers = [];
        for (var i = 0; i < vectorLayers.length; i++) {
            if (vectorLayers[i].options['geometryEvents']) {
                layers.push(vectorLayers[i]);
            }
        }
        if (layers.length === 0) {
            return;
        }

        var actual = domEvent.touches && domEvent.touches.length > 0 ?
            domEvent.touches[0] : domEvent.changedTouches && domEvent.changedTouches.length > 0 ?
            domEvent.changedTouches[0] : domEvent;
        if (!actual) {
            return;
        }
        var containerPoint = maptalks.DomUtil.getEventContainerPoint(actual, map._containerDOM),
            coordinate = map.containerPointToCoordinate(containerPoint);
        if (eventType === 'touchstart') {
            maptalks.DomUtil.preventDefault(domEvent);
        }
        var geometryCursorStyle = null;
        var identifyOptions = {
            'includeInternals' : true,
            //return only one geometry on top,
            'filter':function (geometry) {
                var eventToFire = geometry._getEventTypeToFire(domEvent);
                if (eventType === 'mousemove') {
                    if (!geometryCursorStyle && geometry.options['cursor']) {
                        geometryCursorStyle = geometry.options['cursor'];
                    }
                    if (!geometry.listens('mousemove') && !geometry.listens('mouseover')) {
                        return false;
                    }
                } else if (!geometry.listens(eventToFire)) {
                    return false;
                }

                return true;
            },
            'count' : 1,
            'coordinate' : coordinate,
            'layers': layers
        };
        var callback = maptalks.Util.bind(fireGeometryEvent, this);
        var me = this;
        if (this._queryIdentifyTimeout) {
            maptalks.Util.cancelAnimFrame(this._queryIdentifyTimeout);
        }
        if (eventType === 'mousemove'  || eventType === 'touchmove') {
            this._queryIdentifyTimeout = maptalks.Util.requestAnimFrame(function () {
                map.identify(identifyOptions, callback);
            });
        } else {
            map.identify(identifyOptions, callback);
        }

        function fireGeometryEvent(geometries) {
            var propagation = true;
            var i;
            if (eventType === 'mousemove') {
                var geoMap = {};
                if (maptalks.Util.isArrayHasData(geometries)) {
                    for (i = geometries.length - 1; i >= 0; i--) {
                        geoMap[geometries[i]._getInternalId()] = geometries[i];
                        geometries[i]._onEvent(domEvent);
                        //the first geometry is on the top, so ignore the latter cursors.
                        propagation = geometries[i]._onMouseOver(domEvent);
                    }
                }

                map._setPriorityCursor(geometryCursorStyle);

                var oldTargets = me._prevMouseOverTargets;
                me._prevMouseOverTargets = geometries;
                if (maptalks.Util.isArrayHasData(oldTargets)) {
                    for (i = oldTargets.length - 1; i >= 0; i--) {
                        var oldTarget = oldTargets[i];
                        var oldTargetId = oldTargets[i]._getInternalId();
                        if (geometries && geometries.length > 0) {
                            var mouseout = true;
                            /**
                            * 鼠标经过的新位置中不包含老的目标geometry
                            */
                            if (geoMap[oldTargetId]) {
                                mouseout = false;
                            }
                            if (mouseout) {
                                oldTarget._onMouseOut(domEvent);
                            }
                        } else { //鼠标新的位置不包含任何geometry，将触发之前target的mouseOut事件
                            oldTarget._onMouseOut(domEvent);
                        }
                    }
                }

            } else {
                if (!geometries || geometries.length === 0) { return; }
                propagation = geometries[geometries.length - 1]._onEvent(domEvent);
            }
            if (propagation === false) {
                maptalks.DomUtil.stopPropagation(domEvent);
            }
        }

    }
});

maptalks.Map.addInitHook('addHandler', 'geometryEvents', maptalks.Map.GeometryEvents);

/**
 * @namespace
 * @protected
 */
maptalks.renderer = {};


/**
 * @classdesc
 * Base Class for all the renderer based on HTML5 Canvas2D
 * @abstract
 * @class
 * @protected
 * @memberOf maptalks.renderer
 * @name Canvas
 * @extends {maptalks.Class}
 */
maptalks.renderer.Canvas = maptalks.Class.extend(/** @lends maptalks.renderer.Canvas.prototype */{

    isCanvasRender:function () {
        return true;
    },

    render:function (isCheckRes) {
        this.prepareRender();
        if (!this.getMap()) {
            return;
        }
        if (!this.layer.isVisible()) {
            this.completeRender();
            return;
        }
        if (!this.resources) {
            this.resources = new maptalks.renderer.Canvas.Resources();
        }
        if (this.checkResources && isCheckRes) {
            var me = this, args = arguments;
            var resources = this.checkResources.apply(this, args);
            if (maptalks.Util.isArrayHasData(resources)) {
                this.loadResources(resources).then(function () {
                    if (me.layer) {
                        /**
                         * resourceload event, fired when external resources of the layer complete loading.
                         *
                         * @event maptalks.Layer#resourceload
                         * @type {Object}
                         * @property {String} type              - resourceload
                         * @property {maptalks.Layer} target    - layer
                         */
                        me.layer.fire('resourceload');
                        me._tryToDraw.apply(me, args);
                    }
                });
            } else {
                this._tryToDraw.apply(this, args);
            }
        } else {
            this._tryToDraw.apply(this, arguments);
        }
    },

    _tryToDraw:function () {
        this._clearTimeout();
        if (!this.canvas && this.layer.isEmpty && this.layer.isEmpty()) {
            this.completeRender();
            return;
        }
        var me = this, args = arguments;
        if (this.layer.options['drawImmediate']) {
            this.draw.apply(this, args);
        } else {
            this._animReqId = maptalks.Util.requestAnimFrame(function () {
                if (me.layer) {
                    me.draw.apply(me, args);
                }
            });
        }
    },

    remove: function () {
        this._clearTimeout();
        if (this.onRemove) {
            this.onRemove();
        }
        delete this.canvas;
        delete this.context;
        delete this._extent2D;
        delete this.resources;
        // requestMapToRender may be overrided, e.g. renderer.TileLayer.Canvas
        maptalks.renderer.Canvas.prototype.requestMapToRender.call(this);
        delete this.layer;
    },

    getMap: function () {
        if (!this.layer) {
            return null;
        }
        return this.layer.getMap();
    },

    getCanvasImage:function () {
        if (!this.canvas) {
            return null;
        }
        if ((this.layer.isEmpty && this.layer.isEmpty()) || !this._extent2D) {
            return null;
        }
        if (this.isBlank && this.isBlank()) {
            return null;
        }
        var map = this.getMap(),
            size = this._extent2D.getSize(),
            point = this._extent2D.getMin(),
            containerPoint = map._pointToContainerPoint(point);

        return {'image':this.canvas, 'layer':this.layer, 'point': containerPoint, 'size':size};
    },

    isLoaded:function () {
        if (this._loaded) {
            return true;
        }
        return false;
    },

    /**
     * 显示图层
     */
    show: function () {
        var mask = this.layer.getMask();
        if (mask) {
            mask.onZoomEnd();
        }
        this.render(true);
    },

    /**
     * 隐藏图层
     */
    hide: function () {
        this.clearCanvas();
        this.requestMapToRender();
    },

    setZIndex: function () {
        this.requestMapToRender();
    },

    getRenderZoom: function () {
        return this._renderZoom;
    },

    /**
     *
     * @param  {ViewPoint} point ViewPoint
     * @return {Boolean}       true|false
     */
    hitDetect:function (point) {
        if (!this.context || (this.layer.isEmpty && this.layer.isEmpty()) || this._errorThrown) {
            return false;
        }
        var extent2D = this.getMap()._get2DExtent();
        var size = extent2D.getSize();
        var leftTop = extent2D.getMin();
        var detectPoint = point.substract(leftTop);
        if (detectPoint.x < 0 || detectPoint.x > size['width'] || detectPoint.y < 0 || detectPoint.y > size['height']) {
            return false;
        }
        try {
            var imgData = this.context.getImageData(detectPoint.x, detectPoint.y, 1, 1).data;
            if (imgData[3] > 0) {
                return true;
            }
        } catch (error) {
            if (!this._errorThrown) {
                if (console) { console.warn('hit detect failed with tainted canvas, some geometries have external resources in another domain:\n', error); }
                this._errorThrown = true;
            }
            //usually a CORS error will be thrown if the canvas uses resources from other domain.
            //this may happen when a geometry is filled with pattern file.
            return false;
        }
        return false;

    },

    /**
     * loadResource from resourceUrls
     * @param  {String[]} resourceUrls    - Array of urls to load
     * @param  {Function} onComplete          - callback after loading complete
     * @param  {Object} context         - callback's context
     */
    loadResources:function (resourceUrls) {
        var resources = this.resources,
            promises = [];
        if (maptalks.Util.isArrayHasData(resourceUrls)) {
            var cache = {}, url;
            for (var i = resourceUrls.length - 1; i >= 0; i--) {
                url = resourceUrls[i];
                if (!url || cache[url.join('-')]) {
                    continue;
                }
                cache[url.join('-')] = 1;
                if (!resources.isResourceLoaded(url, true)) {
                    //closure it to preserve url's value
                    promises.push(new maptalks.Promise(this._promiseResource(url)));
                }
            }
        }
        return maptalks.Promise.all(promises);
    },

    _promiseResource: function (url) {
        var me = this, resources = this.resources,
            crossOrigin = this.layer.options['crossOrigin'];
        return function (resolve) {
            if (resources.isResourceLoaded(url, true)) {
                resolve(url);
                return;
            }
            var img = new Image();
            if (crossOrigin) {
                img['crossOrigin'] = crossOrigin;
            }
            if (maptalks.Util.isSVG(url[0]) && !maptalks.node) {
                //amplify the svg image to reduce loading.
                if (url[1]) { url[1] *= 2; }
                if (url[2]) { url[2] *= 2; }
            }
            img.onload = function () {
                me._cacheResource(url, img);
                resolve(url);
            };
            img.onabort = function (err) {
                if (console) { console.warn('image loading aborted: ' + url[0]); }
                if (err) {
                    if (console) { console.warn(err); }
                }
                resolve(url);
            };
            img.onerror = function (err) {
                // if (console) { console.warn('image loading failed: ' + url[0]); }
                if (err && !maptalks.Browser.phantomjs) {
                    if (console) { console.warn(err); }
                }
                resources.markErrorResource(url);
                resolve(url);
            };
            maptalks.Util.loadImage(img,  url);
        };

    },

    _cacheResource: function (url, img) {
        if (!this.layer || !this.resources) {
            return;
        }
        var w = url[1], h = url[2];
        if (this.layer.options['cacheSvgOnCanvas'] && maptalks.Util.isSVG(url[0]) === 1 && (maptalks.Browser.edge || maptalks.Browser.ie)) {
            //opacity of svg img painted on canvas is always 1, so we paint svg on a canvas at first.
            if (maptalks.Util.isNil(w)) {
                w = img.width || this.layer.options['defaultIconSize'][0];
            }
            if (maptalks.Util.isNil(h)) {
                h = img.height || this.layer.options['defaultIconSize'][1];
            }
            var canvas = maptalks.Canvas.createCanvas(w, h);
            maptalks.Canvas.image(canvas.getContext('2d'), img, 0, 0, w, h);
            img = canvas;
        }
        this.resources.addResource(url, img);
    },

    prepareRender: function () {
        this._renderZoom = this.getMap().getZoom();
        this._extent2D = this.getMap()._get2DExtent();
        this._loaded = false;
    },

    createCanvas:function () {
        if (this.canvas) {
            return;
        }
        var map = this.getMap();
        var size = map.getSize();
        var r = maptalks.Browser.retina ? 2 : 1;
        this.canvas = maptalks.Canvas.createCanvas(r * size['width'], r * size['height'], map.CanvasClass);
        this.context = this.canvas.getContext('2d');
        if (this.layer.options['globalCompositeOperation']) {
            this.context.globalCompositeOperation = this.layer.options['globalCompositeOperation'];
        }
        if (maptalks.Browser.retina) {
            this.context.scale(2, 2);
        }
        maptalks.Canvas.setDefaultCanvasSetting(this.context);
        if (this.onCanvasCreate) {
            this.onCanvasCreate();
        }
    },

    resizeCanvas:function (canvasSize) {
        if (!this.canvas) {
            return;
        }
        var size;
        if (!canvasSize) {
            var map = this.getMap();
            size = map.getSize();
        } else {
            size = canvasSize;
        }
        var r = maptalks.Browser.retina ? 2 : 1;
        //only make canvas bigger, never smaller
        if (this.canvas.width >= r * size['width'] && this.canvas.height >= r * size['height']) {
            return;
        }
        //retina support
        this.canvas.height = r * size['height'];
        this.canvas.width = r * size['width'];
        if (maptalks.Browser.retina) {
            this.context.scale(2, 2);
        }
    },

    clearCanvas:function () {
        if (!this.canvas) {
            return;
        }
        maptalks.Canvas.clearRect(this.context, 0, 0, this.canvas.width, this.canvas.height);
    },

    prepareCanvas:function () {
        if (this._clipped) {
            this.context.restore();
            this._clipped = false;
        }
        if (!this.canvas) {
            this.createCanvas();
        } else {
            this.clearCanvas();
        }
        var mask = this.layer.getMask();
        if (!mask) {
            this.layer.fire('renderstart', {'context' : this.context});
            return null;
        }
        var maskExtent2D = mask._getPainter().get2DExtent();
        if (!maskExtent2D.intersects(this._extent2D)) {
            this.layer.fire('renderstart', {'context' : this.context});
            return maskExtent2D;
        }
        this.context.save();
        mask._getPainter().paint();
        this.context.clip();
        this._clipped = true;
        /**
         * renderstart event, fired when layer starts to render.
         *
         * @event maptalks.Layer#renderstart
         * @type {Object}
         * @property {String} type              - renderstart
         * @property {maptalks.Layer} target    - layer
         * @property {CanvasRenderingContext2D} context - canvas's context
         */
        this.layer.fire('renderstart', {'context' : this.context});
        return maskExtent2D;
    },

    get2DExtent: function () {
        return this._extent2D;
    },

    requestMapToRender: function () {
        if (this.getMap()) {
            if (this.context) {
                /**
                 * renderend event, fired when layer ends rendering.
                 *
                 * @event maptalks.Layer#renderend
                 * @type {Object}
                 * @property {String} type              - renderend
                 * @property {maptalks.Layer} target    - layer
                 * @property {CanvasRenderingContext2D} context - canvas's context
                 */
                this.layer.fire('renderend', {'context' : this.context});
            }
            this.getMap()._getRenderer().render();
        }
    },

    fireLoadedEvent: function () {
        this._loaded = true;
        if (this.layer) {
            /**
             * layerload event, fired when layer is loaded.
             *
             * @event maptalks.Layer#layerload
             * @type {Object}
             * @property {String} type - layerload
             * @property {maptalks.Layer} target - layer
             */
            this.layer.fire('layerload');
        }
    },

    completeRender: function () {
        this.requestMapToRender();
        this.fireLoadedEvent();
    },

    getPaintContext:function () {
        if (!this.context) {
            return null;
        }
        return [this.context, this.resources];
    },

    getEvents: function () {
        return {
            '_zoomstart' : this.onZoomStart,
            '_zoomend' : this.onZoomEnd,
            '_resize'  : this.onResize,
            '_movestart' : this.onMoveStart,
            '_moving' : this.onMoving,
            '_moveend' : this.onMoveEnd
        };
    },

    onZoomStart: function () {

    },

    onZoomEnd: function () {
        this._drawOnEvent();
    },

    onMoveStart: function () {

    },

    onMoving: function () {

    },

    onMoveEnd: function () {
        this._drawOnEvent();
    },

    onResize: function () {
        this.resizeCanvas();
        this._drawOnEvent();
    },

    _drawOnEvent: function () {
        this.prepareRender();
        if (this.layer.isVisible()) {
            this.draw();
        }
    },

    _clearTimeout:function () {
        if (this._animReqId) {
            //clearTimeout(this._animReqId);
            maptalks.Util.cancelAnimFrame(this._animReqId);
        }
    }
});

maptalks.renderer.Canvas.Resources = function () {
    this.resources = {};
    this._errors = {};
};

maptalks.Util.extend(maptalks.renderer.Canvas.Resources.prototype, {
    addResource:function (url, img) {
        this.resources[url[0]] = {
            image : img,
            width : +url[1],
            height : +url[2]
        };
    },

    isResourceLoaded:function (url, checkSVG) {
        if (!url) {
            return false;
        }
        if (this._errors[this._getImgUrl(url)]) {
            return true;
        }
        var img = this.resources[this._getImgUrl(url)];
        if (!img) {
            return false;
        }
        if (checkSVG && maptalks.Util.isSVG(url[0]) && (+url[1] > img.width || +url[2] > img.height)) {
            return false;
        }
        return true;
    },

    getImage:function (url) {
        if (!this.isResourceLoaded(url) || this._errors[this._getImgUrl(url)]) {
            return null;
        }
        return this.resources[this._getImgUrl(url)].image;
    },

    markErrorResource:function (url) {
        this._errors[this._getImgUrl(url)] = 1;
    },

    merge: function (res) {
        if (!res) {
            return this;
        }
        for (var p in res.resources) {
            var img = res.resources[p];
            this.addResource([p, img.width, img.height], img.image);
        }
        return this;
    },

    _getImgUrl: function (url) {
        if (!maptalks.Util.isArray(url)) {
            return url;
        }
        return url[0];
    }
});

/**
 * @namespace
 * @protected
 */
maptalks.renderer.map = {};

/**
 * @classdesc
 * Base class for all the map renderers.
 * @class
 * @abstract
 * @protected
 * @memberOf maptalks.renderer.map
 * @name Renderer
 * @extends {maptalks.Class}
 */
maptalks.renderer.map.Renderer = maptalks.Class.extend(/** @lends maptalks.renderer.map.Renderer.prototype */{

    panAnimation:function (distance, t, onFinish) {
        distance = new maptalks.Point(distance);
        var map = this.map;
        if (map.options['panAnimation']) {
            var duration;
            if (!t) {
                duration = map.options['panAnimationDuration'];
            } else {
                duration = t;
            }
            map._enablePanAnimation = true;
            map._panAnimating = true;
            var preDist = null;
            var player = maptalks.Animation.animate({
                'distance' : distance
            }, {
                'easing' : 'out',
                'speed' : duration
            }, function (frame) {
                if (!map._enablePanAnimation) {
                    player.finish();
                    map._panAnimating = false;
                    map.onMoveEnd();
                    return;
                }

                if (player.playState === 'running' && frame.styles['distance']) {
                    var dist = frame.styles['distance'];
                    if (!preDist) {
                        preDist = dist;
                    }
                    var offset = dist.substract(preDist);
                    map.offsetPlatform(offset);
                    map._offsetCenterByPixel(offset);
                    preDist = dist;
                    map.onMoving();
                } else if (player.playState === 'finished') {
                    map._panAnimating = false;
                    if (onFinish) {
                        onFinish();
                    }
                    map.onMoveEnd();
                }
            });
            player.play();
        } else {
            map.onMoveEnd();
        }
    },

    /**
     * 获取地图容器偏移量或更新地图容器偏移量
     * @param  {Point} offset 偏移量
     * @return {this | Point}
     */
    offsetPlatform:function (offset) {
        if (!this.map._panels.mapPlatform) {
            return this;
        }
        var pos = this.map.offsetPlatform().add(offset)._round();
        maptalks.DomUtil.offsetDom(this.map._panels.mapPlatform, pos);
        maptalks.DomUtil.offsetDom(this.map._panels.canvasContainer, pos.multi(-1));
        if (maptalks.Browser.mobile) {
            maptalks.DomUtil.offsetDom(this.map._panels.canvasContainer, pos);
        }
        return this;
    },

    resetContainer:function () {
        this.map._resetMapViewPoint();
        if (this.map._panels.mapPlatform) {
            var pos = new maptalks.Point(0, 0);
            maptalks.DomUtil.offsetDom(this.map._panels.mapPlatform, pos);
            maptalks.DomUtil.offsetDom(this.map._panels.canvasContainer, pos);
            if (maptalks.Browser.mobile) {
                maptalks.DomUtil.offsetDom(this.map._panels.canvasContainer, pos);
            }
        }
    },

    onZoomEnd:function () {
        this.resetContainer();
    },

    onLoad: function () {
        this.render();
    }
});

/**
 * @classdesc
 * Renderer class based on HTML5 Canvas2d for maps.
 * @class
 * @protected
 * @memberOf maptalks.renderer.map
 * @name Canvas
 * @extends {maptalks.renderer.map.Renderer}
 * @param {maptalks.Map} map - map for the renderer
 */
maptalks.renderer.map.Canvas = maptalks.renderer.map.Renderer.extend(/** @lends maptalks.renderer.map.Canvas.prototype */{
    initialize:function (map) {
        this.map = map;
        //container is a <canvas> element
        this._isCanvasContainer = !!map._containerDOM.getContext;
        this._registerEvents();
    },

    isCanvasRender:function () {
        return true;
    },

    /**
     * Renders the layers
     */
    render:function () {
         /**
          * renderstart event, an event fired when map starts to render.
          * @event maptalks.Map#renderstart
          * @type {Object}
          * @property {String} type                    - renderstart
          * @property {maptalks.Map} target            - the map fires event
          * @property {CanvasRenderingContext2D} context  - canvas context
          */
        this.map._fireEvent('renderstart', {'context' : this.context});
        if (!this.canvas) {
            this.createCanvas();
        }
        var zoom = this.map.getZoom();
        var layers = this._getAllLayerToTransform();

        if (!this._updateCanvasSize()) {
            this.clearCanvas();
        }

        this._drawBackground();

        for (var i = 0, len = layers.length; i < len; i++) {
            if (!layers[i].isVisible() || !layers[i].isCanvasRender()) {
                continue;
            }
            var renderer = layers[i]._getRenderer();
            if (renderer && renderer.getRenderZoom() === zoom) {
                var layerImage = this._getLayerImage(layers[i]);
                if (layerImage && layerImage['image']) {
                    this._drawLayerCanvasImage(layers[i], layerImage);
                }
            }
        }

        this._drawCenterCross();
        /**
          * renderend event, an event fired when map ends rendering.
          * @event maptalks.Map#renderend
          * @type {Object}
          * @property {String} type                      - renderend
          * @property {maptalks.Map} target              - the map fires event
          * @property {CanvasRenderingContext2D} context - canvas context
          */
        this.map._fireEvent('renderend', {'context' : this.context});
    },

    animateZoom:function (options, fn) {
        if (maptalks.Browser.ielt9) {
            fn.call(this);
            return;
        }
        var map = this.map;
        this.clearCanvas();
        if (!map.options['zoomAnimation']) {
            fn.call(this);
            return;
        }
        var baseLayer = map.getBaseLayer(),
            baseLayerImage = this._getLayerImage(baseLayer);
        if (baseLayerImage) {
            this._storeBackground(baseLayerImage);
        }
        var layersToTransform = map.options['layerZoomAnimation'] ? null : [baseLayer],
            matrix;
        if (options.startScale === 1) {
            this._beforeTransform();
        }

        var player = maptalks.Animation.animate(
            {
                'scale'  : [options.startScale, options.endScale]
            },
            {
                'easing' : 'out',
                'speed'  : options.duration
            },
            maptalks.Util.bind(function (frame) {
                if (player.playState === 'finished') {
                    this._afterTransform(matrix);
                    this._drawCenterCross();
                    fn.call(this);
                } else if (player.playState === 'running') {
                    matrix = this._transformZooming(options.origin, frame.styles['scale'], layersToTransform);
                    /**
                      * zooming event
                      * @event maptalks.Map#zooming
                      * @type {Object}
                      * @property {String} type                    - zooming
                      * @property {maptalks.Map} target            - the map fires event
                      * @property {Matrix} matrix                  - transforming matrix
                      */
                    map._fireEvent('zooming', {'matrix' : matrix});
                }
            }, this)
        ).play();
    },

    /**
     * 对图层进行仿射变换
     * @param  {Matrix} matrix 变换矩阵
     * @param  {maptalks.Layer[]} layersToTransform 参与变换和绘制的图层
     */
    transform:function (matrix, layersToTransform) {
        this.map._fireEvent('renderstart', {'context' : this.context});

        var layers = layersToTransform || this._getAllLayerToTransform();
        this.clearCanvas();
        //automatically disable layerTransforming with mobile browsers.
        var transformLayers = !maptalks.Browser.mobile && this.map.options['layerTransforming'];
        if (!transformLayers) {
            this.context.save();
            this._applyTransform(matrix);
        }

        for (var i = 0, len = layers.length; i < len; i++) {
            if (!layers[i].isVisible()) {
                continue;
            }
            var renderer = layers[i]._getRenderer();
            if (renderer) {
                if (renderer.isCanvasRender && renderer.isCanvasRender()) {
                    var transformed = false;
                    if (transformLayers && renderer.transform) {
                        transformed = renderer.transform(matrix);
                    }
                    if (transformLayers && !transformed) {
                        this.context.save();
                        this._applyTransform(matrix);
                    }

                    var layerImage = this._getLayerImage(layers[i]);
                    if (layerImage && layerImage['image']) {
                        this._drawLayerCanvasImage(layers[i], layerImage);
                    }
                    if (transformLayers && !transformed) {
                        this.context.restore();
                    }
                } else if (renderer.transform) {
                    //e.g. baseTileLayer renderered by DOM
                    renderer.transform(matrix);
                }

            }
        }
        if (!transformLayers) {
            this.context.restore();
        }

        this._drawCenterCross();
        this.map._fireEvent('renderend', {'context' : this.context});
    },

    updateMapSize:function (mSize) {
        if (!mSize || this._isCanvasContainer) { return; }
        var width = mSize['width'],
            height = mSize['height'];
        var panels = this.map._panels;
        panels.mapWrapper.style.width = width + 'px';
        panels.mapWrapper.style.height = height + 'px';
        // panels.mapPlatform.style.width = width + 'px';
        // panels.mapPlatform.style.height = height + 'px';
        panels.canvasContainer.style.width = width + 'px';
        panels.canvasContainer.style.height = height + 'px';
        // panels.control.style.width = width + 'px';
        // panels.control.style.height = height + 'px';
        this._updateCanvasSize();
    },

    getMainPanel: function () {
        if (!this.map) {
            return null;
        }
        if (this._isCanvasContainer) {
            return this.map._containerDOM;
        }
        if (this.map._panels) {
            return this.map._panels.mapWrapper;
        }
        return null;
    },

    toDataURL:function (mimeType) {
        if (!this.canvas) {
            return null;
        }
        return this.canvas.toDataURL(mimeType);
    },

    remove: function () {
        if (this._resizeInterval) {
            clearInterval(this._resizeInterval);
        }
        if (this._resizeFrame) {
            maptalks.Util.cancelAnimFrame(this._resizeFrame);
        }
        delete this.context;
        delete this.canvas;
        delete this.map;
        delete this._canvasBgRes;
        delete this._canvasBgCoord;
        delete this._canvasBg;
        delete this._zoomingMatrix;
    },

    _getLayerImage: function (layer) {
        if (layer && layer._getRenderer() && layer._getRenderer().getCanvasImage) {
            return layer._getRenderer().getCanvasImage();
        }
        return null;
    },

    _transformZooming: function (origin, scale, layersToTransform) {
        var matrix = this.map._generateMatrices(origin, scale);
        this._zoomingMatrix = matrix;
        this.transform(matrix, layersToTransform);
        return matrix;
    },

    _beforeTransform: function () {
        var map = this.map;
        // redraw the map to prepare for zoom transforming.
        // if startScale is not 1 (usually by touchZoom on mobiles), it means map is already transformed and doesn't need redraw
        if (!map.options['layerZoomAnimation']) {
            var baseLayer = map.getBaseLayer(),
                baseLayerImage = this._getLayerImage(baseLayer);
            //zoom animation with better performance, only animate baseLayer, ignore other layers.
            if (baseLayerImage) {
                this._drawLayerCanvasImage(baseLayer, baseLayerImage);
            }
        } else {
            //default zoom animation, animate all the layers.
            this.render();
        }
    },

    _afterTransform: function (matrix) {
        this.clearCanvas();
        this._applyTransform(matrix);
        this._drawBackground();
        this.context.setTransform(1, 0, 0, 1, 0, 0);
    },

    _applyTransform : function (matrix) {
        if (!matrix) {
            return;
        }
        matrix = maptalks.Browser.retina ? matrix['retina'] : matrix['container'];
        matrix.applyToContext(this.context);
    },

    _getCountOfGeosToDraw: function () {
        var layers = this._getAllLayerToTransform(),
            geos, renderer,
            total = 0;
        for (var i = layers.length - 1; i >= 0; i--) {
            renderer = layers[i]._getRenderer();
            if ((layers[i] instanceof maptalks.VectorLayer) &&
                layers[i].isVisible() && !layers[i].isEmpty() && renderer._hasPointSymbolizer) {
                geos = renderer._geosToDraw;
                if (geos) {
                    total += renderer._geosToDraw.length;
                }
            }
        }
        return total;
    },

    /**
     * initialize container DOM of panels
     */
    initContainer:function () {
        var panels = this.map._panels;
        function createContainer(name, className, cssText, enableSelect) {
            var c = maptalks.DomUtil.createEl('div', className);
            if (cssText) {
                c.style.cssText = cssText;
            }
            panels[name] = c;
            if (!enableSelect) {
                maptalks.DomUtil.preventSelection(c);
            }
            return c;
        }
        var containerDOM = this.map._containerDOM;

        if (this._isCanvasContainer) {
            //container is a <canvas> element.
            return;
        }

        containerDOM.innerHTML = '';

        var control = createContainer('control', 'maptalks-control', null, true);
        var mapWrapper = createContainer('mapWrapper', 'maptalks-wrapper', 'position:absolute;overflow:hidden;', true);
        var mapPlatform = createContainer('mapPlatform', 'maptalks-platform', 'position:absolute;top:0px;left:0px;will-change:transform;', true);
        var ui = createContainer('ui', 'maptalks-ui', 'position:absolute;top:0px;left:0px;border:none;', true);
        var mapAllLayers = createContainer('allLayers', 'maptalks-all-layers', 'position:absolute;top:0px;left:0px;');
        var layer = createContainer('layer', 'maptalks-layer', 'position:absolute;left:0px;top:0px;');
        var frontLayer = createContainer('frontLayer', 'maptalks-front-layer', 'position:absolute;left:0px;top:0px;');
        var canvasContainer = createContainer('canvasContainer', 'maptalks-layer-canvas', 'position:absolute;top:0px;left:0px;border:none;will-change:transform;');

        containerDOM.appendChild(mapWrapper);

        mapPlatform.appendChild(mapAllLayers);
        mapPlatform.appendChild(ui);
        mapWrapper.appendChild(mapPlatform);
        mapAllLayers.appendChild(layer);
        mapAllLayers.appendChild(canvasContainer);
        mapAllLayers.appendChild(frontLayer);

        mapWrapper.appendChild(control);

        this.createCanvas();

        this.resetContainer();
        var mapSize = this.map._getContainerDomSize();
        this.updateMapSize(mapSize);
    },

    _drawLayerCanvasImage:function (layer, layerImage) {
        if (!layer || !layerImage) {
            return;
        }
        var point = layerImage['point'].multi(maptalks.Browser.retina ? 2 : 1);
        var canvasImage = layerImage['image'];
        if (point.x + canvasImage.width <= 0 || point.y + canvasImage.height <= 0) {
            return;
        }
        //opacity of the layer image
        var op = layer.options['opacity'];
        if (!maptalks.Util.isNumber(op)) {
            op = 1;
        }
        if (op <= 0) {
            return;
        }
        var imgOp = layerImage['opacity'];
        if (!maptalks.Util.isNumber(imgOp)) {
            imgOp = 1;
        }
        if (imgOp <= 0) {
            return;
        }
        var alpha = this.context.globalAlpha;

        if (op < 1) {
            this.context.globalAlpha *= op;
        }
        if (imgOp < 1) {
            this.context.globalAlpha *= imgOp;
        }

        if (layer.options['cssFilter']) {
            this.context.filter = layer.options['cssFilter'];
        }

        if (maptalks.node) {
            var context = canvasImage.getContext('2d');
            if (context.getSvg) {
                 //canvas2svg
                canvasImage = context;
            }
        }
        if (layer.options['dx'] || layer.options['dy']) {
            point._add(layer.options['dx'], layer.options['dy']);
        }
        this.context.drawImage(canvasImage, point.x, point.y);
        this.context.globalAlpha = alpha;
        if (this.context.filter !== 'none') {
            this.context.filter = 'none';
        }
    },

    _storeBackground: function (baseLayerImage) {
        if (baseLayerImage) {
            var map = this.map;
            this._canvasBg = maptalks.DomUtil.copyCanvas(baseLayerImage['image']);
            this._canvasBgRes = map._getResolution();
            this._canvasBgCoord = map.containerPointToCoordinate(baseLayerImage['point']);
        }
    },

    _drawBackground:function () {
        var map = this.map;
        if (this._canvasBg) {
            var baseLayer = this.map.getBaseLayer();
            if (baseLayer.options['cssFilter']) {
                this.context.filter = baseLayer.options['cssFilter'];
            }
            var scale = this._canvasBgRes / map._getResolution();
            var p = map.coordinateToContainerPoint(this._canvasBgCoord)._multi(maptalks.Browser.retina ? 2 : 1);
            maptalks.Canvas.image(this.context, this._canvasBg, p.x, p.y, this._canvasBg.width * scale, this._canvasBg.height * scale);
            if (this.context.filter !== 'none') {
                this.context.filter = 'none';
            }
        }
    },

    _drawCenterCross: function () {
        if (this.map.options['centerCross']) {
            var p = new maptalks.Point(this.canvas.width / 2, this.canvas.height / 2);
            this.context.strokeStyle = '#ff0000';
            this.context.lineWidth = 2;
            this.context.beginPath();
            this.context.moveTo(p.x - 5, p.y);
            this.context.lineTo(p.x + 5, p.y);
            this.context.moveTo(p.x, p.y - 5);
            this.context.lineTo(p.x, p.y + 5);
            this.context.stroke();
        }
    },

    _getAllLayerToTransform:function () {
        return this.map._getLayers();
    },

    clearCanvas:function () {
        if (!this.canvas) {
            return;
        }
        maptalks.Canvas.clearRect(this.context, 0, 0, this.canvas.width, this.canvas.height);
    },

    _updateCanvasSize: function () {
        if (!this.canvas || this._isCanvasContainer) {
            return false;
        }
        var map = this.map;
        var mapSize = map.getSize();
        var canvas = this.canvas;
        var r = maptalks.Browser.retina ? 2 : 1;
        if (mapSize['width'] * r === canvas.width && mapSize['height'] * r === canvas.height) {
            return false;
        }
        //retina屏支持

        canvas.height = r * mapSize['height'];
        canvas.width = r * mapSize['width'];
        if (canvas.style) {
            canvas.style.width = mapSize['width'] + 'px';
            canvas.style.height = mapSize['height'] + 'px';
        }

        return true;
    },

    createCanvas:function () {
        if (this._isCanvasContainer) {
            this.canvas = this.map._containerDOM;
        } else {
            this.canvas = maptalks.DomUtil.createEl('canvas');
            this._updateCanvasSize();
            this.map._panels.canvasContainer.appendChild(this.canvas);
        }
        this.context = this.canvas.getContext('2d');
    },

    _checkSize:function () {
        maptalks.Util.cancelAnimFrame(this._resizeFrame);
        if (this.map._zooming || this.map._moving || this.map._panAnimating) {
            return;
        }
        this._resizeFrame = maptalks.Util.requestAnimFrame(
            maptalks.Util.bind(function () {
                if (this.map._moving || this.map._isBusy()) {
                    return;
                }
                this.map.checkSize();
            }, this)
        );
    },

    _registerEvents:function () {
        var map = this.map;
        map.on('_baselayerchangestart', function () {
            delete this._canvasBg;
        }, this);
        map.on('_baselayerload', function () {
            var baseLayer = map.getBaseLayer();
            if (!map.options['zoomBackground'] || baseLayer.getMask()) {
                delete this._canvasBg;
            }
        }, this);
        map.on('_resize', function () {
            delete this._canvasBg;
        }, this);
        map.on('_zoomstart', function () {
            delete this._canvasBg;
            this.clearCanvas();
        }, this);
        if (map.options['checkSize'] && !maptalks.node && (typeof window !== 'undefined')) {
            // maptalks.DomUtil.on(window, 'resize', this._checkSize, this);
            this._resizeInterval = setInterval(maptalks.Util.bind(function () {
                if (!map._containerDOM.parentNode) {
                    //is deleted
                    clearInterval(this._resizeInterval);
                } else {
                    this._checkSize();
                }
            }, this), 1000);
        }
        if (!maptalks.Browser.mobile && maptalks.Browser.canvas) {
            this._onMapMouseMove = function (param) {
                if (map._isBusy() || map._moving || !map.options['hitDetect']) {
                    return;
                }
                if (this._hitDetectTimeout) {
                    maptalks.Util.cancelAnimFrame(this._hitDetectTimeout);
                }
                this._hitDetectTimeout = maptalks.Util.requestAnimFrame(function () {
                    var vp = param['point2d'];
                    var layers = map._getLayers();
                    var hit = false,
                        cursor;
                    for (var i = layers.length - 1; i >= 0; i--) {
                        var layer = layers[i];
                        if (layer._getRenderer() && layer._getRenderer().hitDetect) {
                            if (layer.options['cursor'] !== 'default' && layer._getRenderer().hitDetect(vp)) {
                                cursor = layer.options['cursor'];
                                hit = true;
                                break;
                            }
                        }
                    }
                    if (hit) {
                        map._trySetCursor(cursor);
                    } else {
                        map._trySetCursor('default');
                    }
                });

            };
            map.on('_mousemove', this._onMapMouseMove, this);
        }
        map.on('_moveend', function () {
            if (maptalks.Browser.mobile) {
                maptalks.DomUtil.offsetDom(this.canvas, map.offsetPlatform().multi(-1));
            }
            this.render();
        }, this);
        if (!maptalks.Browser.mobile) {
            map.on('_moving', function () {
                this.render();
            }, this);
        } else {
            map.on('_zoomend', function () {
                maptalks.DomUtil.offsetDom(this.canvas, new maptalks.Point(0, 0));
            }, this);
        }
    }
});

maptalks.Map.registerRenderer('canvas', maptalks.renderer.map.Canvas);

maptalks.TileLayer.TileCache = function (capacity) {
    this._queue = [];
    this._cache = {};
    if (!capacity) {
        capacity = 128;
    }
    this.capacity = capacity;
};

maptalks.Util.extend(maptalks.TileLayer.TileCache.prototype, {
    add:function (key, tile) {
        this._cache[key] = tile;
        this._queue.push(key);
        this._expireCache();
    },

    get:function (key) {
        return this._cache[key];
    },

    remove:function (key) {
        delete this._cache[key];
    },

    _expireCache:function () {
        if (this._expTimeout) {
            clearTimeout(this._expTimeout);
        }
        var me = this;
        this._expTimeout = setTimeout(function () {
            var len = me._queue.length;
            if (len > me.capacity) {
                var expir = me._queue.splice(0, len - me.capacity);
                for (var i = expir.length - 1; i >= 0; i--) {
                    delete me._cache[expir[i]];
                }
            }
        }, 1000);

    }
});

/**
 * @namespace
 * @protected
 */
maptalks.renderer.tilelayer = {};

/**
 * @classdesc
 * Renderer class based on HTML5 Canvas2D for TileLayers
 * @class
 * @protected
 * @memberOf maptalks.renderer.tilelayer
 * @name Canvas
 * @extends {maptalks.renderer.Canvas}
 * @param {maptalks.TileLayer} layer - layer of the renderer
 */
maptalks.renderer.tilelayer.Canvas = maptalks.renderer.Canvas.extend(/** @lends maptalks.renderer.tilelayer.Canvas.prototype */{

    propertyOfPointOnTile   : '--maptalks-tile-point',
    propertyOfTileId        : '--maptalks-tile-id',
    propertyOfTileZoom      : '--maptalks-tile-zoom',

    initialize:function (layer) {
        this.layer = layer;
        this._mapRender = layer.getMap()._getRenderer();
        if (!maptalks.node || !this.layer.options['cacheTiles']) {
            this._tileCache = new maptalks.TileLayer.TileCache();
        }
        this._tileQueue = {};
    },

    clear:function () {
        this.clearCanvas();
        this.requestMapToRender();
    },

    clearExecutors:function () {
        clearTimeout(this._loadQueueTimeout);
    },

    draw:function () {
        var layer = this.layer;
        var tileGrid = layer._getTiles();
        if (!tileGrid) {
            this.completeRender();
            return;
        }
        if (!this._tileRended) {
            this._tileRended = {};
        }
        var tileRended = this._tileRended;
        this._tileRended = {};

        var tiles = tileGrid['tiles'],
            tileCache = this._tileCache,
            tileSize = layer.getTileSize();

        this._extent2D = tileGrid['fullExtent'];
        this._viewExtent = tileGrid['viewExtent'];
        if (!this.canvas) {
            this.createCanvas();
        }
        this.resizeCanvas(tileGrid['fullExtent'].getSize());
        var mask2DExtent = this.prepareCanvas();
        if (mask2DExtent && !mask2DExtent.intersects(this._extent2D)) {
            this.completeRender();
            return;
        }

        //遍历瓦片
        this._totalTileToLoad = this._tileToLoadCounter = 0;
        var tile, tileId, cached, tile2DExtent;
        for (var i = tiles.length - 1; i >= 0; i--) {
            tile = tiles[i];
            tileId = tiles[i]['id'];
            //如果缓存中已存有瓦片, 则从不再请求而从缓存中读取.
            cached = tileRended[tileId] || tileCache ? tileCache.get(tileId) : null;
            tile2DExtent = new maptalks.PointExtent(tile['2dPoint'],
                                tile['2dPoint'].add(tileSize.toPoint()));
            if (!this._extent2D.intersects(tile2DExtent)) {
                continue;
            }
            this._totalTileToLoad++;
            if (cached) {
                this._drawTile(tile['viewPoint'], cached);
                this._tileRended[tileId] = cached;
            } else {

                this._tileToLoadCounter++;
                this._tileQueue[tileId + '@' + tile['viewPoint'].toString()] = tile;
            }
        }

        if (this._tileToLoadCounter === 0) {
            this.completeRender();
        } else {
            if (this._tileToLoadCounter < this._totalTileToLoad) {
                this.requestMapToRender();
            }
            this._scheduleLoadTileQueue();
        }
    },

    getCanvasImage:function () {
        if (this._renderZoom !== this.getMap().getZoom() || !this.canvas) {
            return null;
        }
        var gradualOpacity = null;
        if (this._gradualLoading && this._totalTileToLoad && this.layer.options['gradualLoading']) {
            gradualOpacity = ((this._totalTileToLoad - this._tileToLoadCounter) / this._totalTileToLoad) * 1.5;
            if (gradualOpacity > 1) {
                gradualOpacity = 1;
            }
        }
        var canvasImage = maptalks.renderer.Canvas.prototype.getCanvasImage.apply(this, arguments);
        canvasImage['opacity'] = gradualOpacity;
        return canvasImage;
        // var size = this._extent2D.getSize();
        // var point = this._extent2D.getMin();
        // return {'image':this.canvas, 'layer':this.layer, 'point':this.getMap()._pointToContainerPoint(point), 'size':size, 'opacity':gradualOpacity};
    },

    _scheduleLoadTileQueue:function () {

        if (this._loadQueueTimeout) {
            maptalks.Util.cancelAnimFrame(this._loadQueueTimeout);
        }

        var me = this;
        this._loadQueueTimeout = maptalks.Util.requestAnimFrame(function () { me._loadTileQueue(); });
    },

    _loadTileQueue:function () {
        var me = this;
        function onTileLoad() {
            if (!maptalks.node) {
                if (me._tileCache) { me._tileCache.add(this[me.propertyOfTileId], this); }
                me._tileRended[this[me.propertyOfTileId]] = this;
            }
            me._drawTileAndRequest(this);
        }
        function onTileError() {
            me._clearTileRectAndRequest(this);
        }
        var tileId, tile;
        for (var p in this._tileQueue) {
            if (this._tileQueue.hasOwnProperty(p)) {
                tileId = p.split('@')[0];
                tile = this._tileQueue[p];
                delete this._tileQueue[p];
                if (!this._tileCache || !this._tileCache[tileId]) {
                    this._loadTile(tileId, tile, onTileLoad, onTileError);
                } else {
                    this._drawTileAndRequest(this._tileCache[tileId]);
                }

            }
        }

    },


    _loadTile:function (tileId, tile, onTileLoad, onTileError) {
        var crossOrigin = this.layer.options['crossOrigin'];
        var tileSize = this.layer.getTileSize();
        var tileImage = new Image();
        tileImage.width = tileSize['width'];
        tileImage.height = tileSize['height'];
        tileImage[this.propertyOfTileId] = tileId;
        tileImage[this.propertyOfPointOnTile] = {
            'viewPoint' : tile['viewPoint'],
            '2dPoint' : tile['2dPoint']
        };
        tileImage[this.propertyOfTileZoom] = tile['zoom'];
        tileImage.onload = onTileLoad;
        tileImage.onabort = onTileError;
        tileImage.onerror = onTileError;
        if (crossOrigin) {
            tileImage.crossOrigin = crossOrigin;
        }
        maptalks.Util.loadImage(tileImage, [tile['url']]);
    },


    _drawTile:function (point, tileImage) {
        if (!point) {
            return;
        }
        var tileSize = this.layer.getTileSize();
        var leftTop = this._viewExtent.getMin();
        maptalks.Canvas.image(this.context, tileImage,
            point.x - leftTop.x, point.y - leftTop.y,
            tileSize['width'], tileSize['height']);
        if (this.layer.options['debug']) {
            var p = point.substract(leftTop);
            this.context.save();
            this.context.strokeStyle = 'rgb(0,0,0)';
            this.context.fillStyle = 'rgb(0,0,0)';
            this.context.strokeWidth = 10;
            this.context.font = '15px monospace';
            maptalks.Canvas.rectangle(this.context, p, tileSize, 1, 0);
            var xyz = tileImage[this.propertyOfTileId].split('__');
            maptalks.Canvas.fillText(this.context, 'x:' + xyz[1] + ',y:' + xyz[0] + ',z:' + xyz[2], p.add(10, 20), 'rgb(0,0,0)');
            this.context.restore();
        }
        tileImage = null;
    },

    /**
     * 绘制瓦片, 并请求地图重绘
     * @param  {Point} point        瓦片左上角坐标
     * @param  {Image} tileImage 瓦片图片对象
     */
    _drawTileAndRequest:function (tileImage) {
        //sometimes, layer may be removed from map here.
        if (!this.getMap()) {
            return;
        }
        var zoom = this.getMap().getZoom();
        if (zoom !== tileImage[this.propertyOfTileZoom]) {
            return;
        }
        this._tileToLoadCounter--;
        var point = tileImage[this.propertyOfPointOnTile];
        this._drawTile(point['viewPoint'], tileImage);

        if (!maptalks.node) {
            var tileSize = this.layer.getTileSize();
            var mapExtent = this.getMap()._get2DExtent();
            if (mapExtent.intersects(new maptalks.PointExtent(point['2dPoint'], point['2dPoint'].add(tileSize['width'], tileSize['height'])))) {
                this.requestMapToRender();
            }
        }
        if (this._tileToLoadCounter === 0) {
            this._onTileLoadComplete();
        }
    },

    _onTileLoadComplete:function () {
        //In browser, map will be requested to render once a tile was loaded.
        //but in node, map will be requested to render when the layer is loaded.
        if (maptalks.node) {
            this.requestMapToRender();
        }
        this.fireLoadedEvent();
    },

    /**
     * 清除瓦片区域, 并请求地图重绘
     * @param  {Point} point        瓦片左上角坐标
     */
    _clearTileRectAndRequest:function (tileImage) {
        if (!this.getMap()) {
            return;
        }
        var zoom = this.getMap().getZoom();
        if (zoom !== tileImage[this.propertyOfTileZoom]) {
            return;
        }
        if (!maptalks.node) {
            this.requestMapToRender();
        }
        this._tileToLoadCounter--;
        if (this._tileToLoadCounter === 0) {
            this._onTileLoadComplete();
        }
    },

    /**
     * @override
     */
    requestMapToRender:function () {
        if (maptalks.node) {
            if (this.getMap() && !this.getMap()._isBusy()) {
                this._mapRender.render();
            }
            return;
        }
        if (this._mapRenderRequest) {
            maptalks.Util.cancelAnimFrame(this._mapRenderRequest);
        }
        var me = this;
        this._mapRenderRequest = maptalks.Util.requestAnimFrame(function () {
            if (me.getMap() && !me.getMap()._isBusy()) {
                me._mapRender.render();
            }
        });
    },

    onMoveEnd: function () {
        this._gradualLoading = false;
        maptalks.renderer.Canvas.prototype.onMoveEnd.apply(this, arguments);
    },

    onZoomEnd: function () {
        this._gradualLoading = true;
        maptalks.renderer.Canvas.prototype.onZoomEnd.apply(this, arguments);
    },

    onRemove: function () {
        delete this._viewExtent;
        delete this._mapRender;
        delete this._tileCache;
        delete this._tileRended;
        delete this._tileQueue;
    }
});

maptalks.TileLayer.registerRenderer('canvas', maptalks.renderer.tilelayer.Canvas);

/**
 * @classdesc
 * A renderer based on HTML Doms for TileLayers.
 * It is implemented based on Leaflet's GridLayer, and all the credits belongs to Leaflet.
 * @class
 * @protected
 * @memberOf maptalks.renderer.tilelayer
 * @name Dom
 * @extends {maptalks.Class}
 * @param {maptalks.TileLayer} layer - layer of the renderer
 */
maptalks.renderer.tilelayer.Dom = maptalks.Class.extend(/** @lends maptalks.renderer.tilelayer.Dom.prototype */{

    initialize:function (layer) {
        this.layer = layer;
        this._tiles = {};
        this._fadeAnimated = !maptalks.Browser.mobile && true;
    },

    getMap:function () {
        return this.layer.getMap();
    },

    show: function () {
        if (this._container) {
            this.render();
            this._container.style.display = '';
        }
    },

    hide: function () {
        if (this._container) {
            this._container.style.display = 'none';
            this.clear();
        }
    },

    remove:function () {
        delete this._tiles;
        delete this.layer;
        this._removeLayerContainer();
    },

    clear:function () {
        this._removeAllTiles();
        this._clearLayerContainer();
    },

    setZIndex: function (z) {
        this._zIndex = z;
        if (this._container) {
            this._container.style.zIndex = z;
        }
    },

    isCanvasRender: function () {
        return false;
    },

    render:function () {
        var layer = this.layer;
        if (!this._container) {
            this._createLayerContainer();
        }
        var tileGrid = layer._getTiles();
        if (!tileGrid) {
            return;
        }
        var tiles = tileGrid['tiles'],
            queue = [];


        if (this._tiles) {
            for (var p in this._tiles) {
                this._tiles[p].current = false;
            }
        }
        var i, l;
        var tile;
        for (i = tiles.length - 1; i >= 0; i--) {
            tile = tiles[i];
            if (this._tiles[tile['id']]) {
                //tile is already added
                this._tiles[tile['id']].current = true;
                continue;
            }
            tile.current = true;
            queue.push(tile);
        }
        var container = this._getTileContainer();
        // maptalks.DomUtil.removeTransform(container);
        if (queue.length > 0) {
            var fragment = document.createDocumentFragment();
            for (i = 0, l = queue.length; i < l; i++) {
                fragment.appendChild(this._loadTile(queue[i]));
            }
            container.appendChild(fragment);
        }
    },

    transform: function (matrices) {
        if (!this._canTransform()) {
            return false;
        }
        var zoom = this.getMap().getZoom();
        if (this._levelContainers[zoom]) {
            if (matrices) {
                maptalks.DomUtil.setTransformMatrix(this._levelContainers[zoom], matrices['view']);
            } else {
                maptalks.DomUtil.removeTransform(this._levelContainers[zoom]);
            }
            // maptalks.DomUtil.setTransform(this._levelContainers[zoom], new maptalks.Point(matrices['view'].e, matrices['view'].f), matrices.scale.x);
        }
        return false;
    },

    _loadTile: function (tile) {
        this._tiles[tile['id']] = tile;
        return this._createTile(tile, maptalks.Util.bind(this._tileReady, this));
    },

    _createTile: function (tile, done) {
        var tileSize = this.layer.getTileSize();
        var tileImage = maptalks.DomUtil.createEl('img');

        tile['el'] = tileImage;

        maptalks.DomUtil.on(tileImage, 'load', maptalks.Util.bind(this._tileOnLoad, this, done, tile));
        maptalks.DomUtil.on(tileImage, 'error', maptalks.Util.bind(this._tileOnError, this, done, tile));

        if (this.layer.options['crossOrigin']) {
            tile.crossOrigin = this.layer.options['crossOrigin'];
        }

        tileImage.style.position = 'absolute';
        tileImage.style.left = Math.floor(tile['viewPoint'].x) + 'px';
        tileImage.style.top  = Math.floor(tile['viewPoint'].y) + 'px';

        tileImage.alt = '';
        tileImage.width = tileSize['width'];
        tileImage.height = tileSize['height'];

        maptalks.DomUtil.setOpacity(tileImage, 0);

        if (this.layer.options['cssFilter']) {
            tileImage.style[maptalks.DomUtil.CSSFILTER] = this.layer.options['cssFilter'];
        }

        tileImage.src = tile['url'];

        return tileImage;
    },

    _tileReady: function (err, tile) {
        if (!this.layer) {
            return;
        }
        if (err) {
            /**
             * tileerror event, fired when layer is 'dom' rendered and a tile errors
             *
             * @event maptalks.TileLayer#tileerror
             * @type {Object}
             * @property {String} type - tileerror
             * @property {maptalks.TileLayer} target - tile layer
             * @property {String} err  - error message
             * @property {Object} tile - tile
             */
            this.layer.fire('tileerror', {
                error: err,
                tile: tile
            });
        }

        tile.loaded = maptalks.Util.now();

        var map = this.getMap();

        if (this._fadeAnimated) {
            maptalks.Util.cancelAnimFrame(this._fadeFrame);
            this._fadeFrame = maptalks.Util.requestAnimFrame(maptalks.Util.bind(this._updateOpacity, this));
        } else {
            maptalks.DomUtil.setOpacity(tile['el'], 1);
            tile.active = true;
            // this._pruneTiles();
        }

        /**
         * tileload event, fired when layer is 'dom' rendered and a tile is loaded
         *
         * @event maptalks.TileLayer#tileload
         * @type {Object}
         * @property {String} type - tileload
         * @property {maptalks.TileLayer} target - tile layer
         * @property {Object} tile - tile
         */
        this.layer.fire('tileload', {
            tile: tile
        });

        if (this._noTilesToLoad()) {
            this.layer.fire('layerload');

            if (maptalks.Browser.ielt9) {
                maptalks.Util.requestAnimFrame(this._pruneTiles, this);
            } else {
                if (this._pruneTimeout) {
                    clearTimeout(this._pruneTimeout);
                }
                var timeout = map ? map.options['zoomAnimationDuration'] : 250,
                    pruneLevels = (map && this.layer === map.getBaseLayer()) ? !map.options['zoomBackground'] : true;
                // Wait a bit more than 0.2 secs (the duration of the tile fade-in)
                // to trigger a pruning.
                this._pruneTimeout = setTimeout(maptalks.Util.bind(this._pruneTiles, this, pruneLevels), timeout + 100);
            }
        }
    },

    _tileOnLoad: function (done, tile) {
        // For https://github.com/Leaflet/Leaflet/issues/3332
        if (maptalks.Browser.ielt9) {
            setTimeout(maptalks.Util.bind(done, this, null, tile), 0);
        } else {
            done.call(this, null, tile);
        }
    },

    _tileOnError: function (done, tile) {
        var errorUrl = this.layer.options['errorTileUrl'];
        if (errorUrl) {
            tile['el'].src = errorUrl;
        } else {
            tile['el'].style.display = 'none';
        }
        done.call(this, 'error', tile);
    },

    _updateOpacity: function () {
        if (!this.getMap()) { return; }

        // IE doesn't inherit filter opacity properly, so we're forced to set it on tiles
        if (maptalks.Browser.ielt9) {
            return;
        }

        maptalks.DomUtil.setOpacity(this._container, this.layer.options['opacity']);

        var now = maptalks.Util.now(),
            nextFrame = false;
        var tile, fade;
        for (var key in this._tiles) {
            tile = this._tiles[key];
            if (!tile.current || !tile.loaded) { continue; }

            fade = Math.min(1, (now - tile.loaded) / 200);

            maptalks.DomUtil.setOpacity(tile['el'], fade);
            if (!nextFrame && fade < 1) {
                nextFrame = true;
            }
        }

        if (nextFrame) {
            maptalks.Util.cancelAnimFrame(this._fadeFrame);
            this._fadeFrame = maptalks.Util.requestAnimFrame(maptalks.Util.bind(this._updateOpacity, this));
        }
    },

    _noTilesToLoad: function () {
        for (var key in this._tiles) {
            if (!this._tiles[key].loaded) { return false; }
        }
        return true;
    },

    _pruneTiles: function (pruneLevels) {
        var map = this.getMap();
        if (!map) {
            return;
        }

        var key,
            zoom = map.getZoom();

        if (!this.layer.isVisible()) {
            this._removeAllTiles();
            return;
        }

        for (key in this._tiles) {
            if (this._tiles[key].zoom === zoom && !this._tiles[key].current) {
                this._removeTile(key);
            }
        }

        if (pruneLevels) {
            for (key in this._tiles) {
                if (this._tiles[key].zoom !== zoom) {
                    this._removeTile(key);
                }
            }
            for (var z in this._levelContainers) {
                if (+z !== zoom) {
                    maptalks.DomUtil.removeDomNode(this._levelContainers[z]);
                    this._removeTilesAtZoom(z);
                    delete this._levelContainers[z];
                }
            }
        }

    },

    _removeTile: function (key) {
        var tile = this._tiles[key];
        if (!tile) { return; }

        maptalks.DomUtil.removeDomNode(tile.el);

        delete this._tiles[key];

        /**
         * tileunload event, fired when layer is 'dom' rendered and a tile is removed
         *
         * @event maptalks.TileLayer#tileunload
         * @type {Object}
         * @property {String} type - tileunload
         * @property {maptalks.TileLayer} target - tile layer
         * @property {Object} tile - tile
         */
        this.layer.fire('tileunload', {
            tile: tile
        });
    },

    _removeTilesAtZoom: function (zoom) {
        for (var key in this._tiles) {
            if (+this._tiles[key]['zoom'] !== +zoom) {
                continue;
            }
            this._removeTile(key);
        }
    },

    _removeAllTiles: function () {
        for (var key in this._tiles) {
            this._removeTile(key);
        }
    },

    _getTileContainer: function () {
        if (!this._levelContainers) {
            this._levelContainers = {};
        }
        var zoom = this.getMap().getZoom();
        if (!this._levelContainers[zoom]) {
            var container = this._levelContainers[zoom] = maptalks.DomUtil.createEl('div', 'maptalks-tilelayer-level');
            container.style.cssText = 'position:absolute;left:0px;top:0px;';
            container.style.willChange = 'transform';
            this._container.appendChild(container);
        }
        return this._levelContainers[zoom];
    },

    _createLayerContainer: function () {
        var container = this._container = maptalks.DomUtil.createEl('div', 'maptalks-tilelayer');
        container.style.cssText = 'position:absolute;left:0px;top:0px;';
        if (this._zIndex) {
            container.style.zIndex = this._zIndex;
        }
        this.getMap()._panels['layer'].appendChild(container);
    },

    _clearLayerContainer:function () {
        if (this._container) {
            this._container.innerHTML = '';
        }
        delete this._levelContainers;
    },

    _removeLayerContainer:function () {
        if (this._container) {
            maptalks.DomUtil.removeDomNode(this._container);
        }
        delete this._container;
        delete this._levelContainers;
    },

    getEvents:function () {
        var events = {
            '_zoomstart'    : this.onZoomStart,
            '_touchzoomstart' : this._onTouchZoomStart,
            '_zoomend'      : this.onZoomEnd,
            '_moveend _resize' : this.render,
            '_movestart'    : this.onMoveStart
        };
        if (!this._onMapMoving && this.layer.options['renderWhenPanning']) {
            var interval = this.layer.options['updateInterval'];
            if (maptalks.Util.isNumber(interval) && interval >= 0) {
                if (interval > 0) {
                    this._onMapMoving = maptalks.Util.throttle(function () {
                        this.render();
                    }, interval, this);
                } else {
                    this._onMapMoving = function () {
                        this.render();
                    };
                }
            }
        }
        if (this._onMapMoving) {
            events['_moving'] = this._onMapMoving;
        }
        return events;
    },

    _canTransform: function () {
        return maptalks.Browser.any3d || maptalks.Browser.ie9;
    },

    onMoveStart: function () {
        // this._fadeAnimated = false;
    },

    _onTouchZoomStart: function () {
        this._pruneTiles(true);
    },

    onZoomStart: function () {
        this._fadeAnimated = !maptalks.Browser.mobile && true;
        this._pruneTiles(true);
        this._zoomStartPos = this.getMap().offsetPlatform();
        if (!this._canTransform()) {
            this._container.style.display = 'none';
        }
    },

    onZoomEnd: function (param) {
        if (this._pruneTimeout) {
            clearTimeout(this._pruneTimeout);
        }
        this.render();
        if (this._levelContainers) {
            if (this._canTransform()) {
                if (this._levelContainers[param.from] && this._zoomStartPos) {
                    this._levelContainers[param.from].style.left = this._zoomStartPos.x + 'px';
                    this._levelContainers[param.from].style.top = this._zoomStartPos.y + 'px';
                }
            } else {
                if (this._levelContainers[param.from]) {
                    this._levelContainers[param.from].style.display = 'none';
                }
                this._container.style.display = '';
            }
        }
    }
});

maptalks.TileLayer.registerRenderer('dom', maptalks.renderer.tilelayer.Dom);

maptalks.renderer.canvastilelayer = {};

maptalks.renderer.canvastilelayer.Canvas = maptalks.renderer.tilelayer.Canvas.extend({
    _loadTile:function (tileId, tile, onTileLoad, onTileError) {
        var tileSize = this.layer.getTileSize(),
            canvasClass = this.canvas.constructor,
            map = this.getMap();
        var r = maptalks.Browser.retina ? 2 : 1;
        var tileCanvas = maptalks.Canvas.createCanvas(tileSize['width'] * r, tileSize['height'] * r, canvasClass);

        tileCanvas[this.propertyOfTileId] = tileId;
        tileCanvas[this.propertyOfPointOnTile] = tile['viewPoint'];
        tileCanvas[this.propertyOfTileZoom] = tile['zoom'];
        this.layer.drawTile(tileCanvas, {
            'url' : tile['url'],
            'viewPoint' : tile['viewPoint'],
            'zoom' : tile['zoom'],
            'extent' : map._pointToExtent(new maptalks.PointExtent(tile['2dPoint'], tile['2dPoint'].add(tileSize.toPoint())))
        }, function (error) {
            if (error) {
                onTileError.call(tileCanvas);
                return;
            }
            onTileLoad.call(tileCanvas);
        });
    }
});

maptalks.CanvasTileLayer.registerRenderer('canvas', maptalks.renderer.canvastilelayer.Canvas);

/**
 * @namespace
 * @protected
 */
maptalks.renderer.vectorlayer = {};
maptalks.renderer.overlaylayer = {};


/**
 * @classdesc
 * A parent renderer class for OverlayLayer to inherit by OverlayLayer's subclasses.
 * @class
 * @protected
 * @memberOf maptalks.renderer.overlaylayer
 * @name Canvas
 * @extends {maptalks.renderer.Canvas}
 */
maptalks.renderer.overlaylayer.Canvas = maptalks.renderer.Canvas.extend({

    // geometries can be: true | [geometries] | null
    // true: check layer's all geometries if the checking is the first time.
    // [geometries] : the additional geometries needs to be checked.
    // null : no checking.
    //
    // possible memory leaks:
    // 1. if geometries' symbols with external resources change frequently,
    // resources of old symbols will still be stored.
    // 2. removed geometries' resources won't be removed.
    checkResources:function (geometries) {
        if (!this._resourceChecked && !maptalks.Util.isArray(geometries)) {
            geometries = this.layer._geoList;
        }
        if (!geometries || !maptalks.Util.isArrayHasData(geometries)) {
            return [];
        }
        var me = this,
            resources = [];
        var res;
        function checkGeo(geo) {
            res = geo._getExternalResources();
            if (!maptalks.Util.isArrayHasData(res)) {
                return;
            }
            if (!me.resources) {
                resources = resources.concat(res);
            } else {
                for (var ii = 0; ii < res.length; ii++) {
                    if (!me.resources.isResourceLoaded(res[ii])) {
                        resources.push(res[ii]);
                    }
                }
            }
        }

        for (var i = geometries.length - 1; i >= 0; i--) {
            checkGeo(geometries[i]);
        }
        this._resourceChecked = true;
        return resources;
    },

    onGeometryAdd: function (geometries) {
        this.render(geometries);
    },

    onGeometryRemove: function () {
        this.render();
    },

    onGeometrySymbolChange: function (geometries) {
        this.render(geometries);
    },

    onGeometryShapeChange: function () {
        this.render();
    },

    onGeometryPositionChange: function () {
        this.render();
    },

    onGeometryZIndexChange: function () {
        this.render();
    },

    onGeometryShow: function () {
        this.render();
    },

    onGeometryHide: function () {
        this.render();
    },

    onGeometryPropertiesChange: function () {
        this.render();
    }
});


/**
 * @classdesc
 * Renderer class based on HTML5 Canvas2D for VectorLayers
 * @class
 * @protected
 * @memberOf maptalks.renderer.vectorlayer
 * @name Canvas
 * @extends {maptalks.renderer.overlaylayer.Canvas}
 * @param {maptalks.VectorLayer} layer - layer of the renderer
 */
maptalks.renderer.vectorlayer.Canvas = maptalks.renderer.overlaylayer.Canvas.extend(/** @lends maptalks.renderer.vectorlayer.Canvas.prototype */{

    initialize:function (layer) {
        this.layer = layer;
        this._painted = false;
    },

    checkResources: function () {
        var me = this;
        var resources = maptalks.renderer.overlaylayer.Canvas.prototype.checkResources.apply(this, arguments);
        var style = this.layer.getStyle();
        if (style) {
            if (!maptalks.Util.isArray(style)) {
                style = [style];
            }
            style.forEach(function (s) {
                var res = maptalks.Util.getExternalResources(s['symbol'], true);
                if (res) {
                    for (var ii = 0; ii < res.length; ii++) {
                        if (!me.resources.isResourceLoaded(res[ii])) {
                            resources.push(res[ii]);
                        }
                    }
                }
            });
        }
        return resources;
    },

    /**
     * render layer
     * @param  {maptalks.Geometry[]} geometries   geometries to render
     * @param  {Boolean} ignorePromise   whether escape step of promise
     */
    draw:function () {
        if (!this.getMap()) {
            return;
        }
        if (!this.layer.isVisible() || this.layer.isEmpty()) {
            this.clearCanvas();
            this.completeRender();
            return;
        }

        this._drawGeos();

        this.completeRender();
    },

    //redraw all the geometries with transform matrix
    //this may bring low performance if number of geometries is large.
    transform: function (matrix) {
        if (maptalks.Browser.mobile || this.layer.getMask()) {
            return false;
        }
        //determin whether this layer should be transformed.
        //if all the geometries to render are vectors including polygons and linestrings,
        //disable transforming won't reduce user experience.
        if (!this._hasPointSymbolizer ||
            this.getMap()._getRenderer()._getCountOfGeosToDraw() > this.layer.options['thresholdOfTransforming']) {
            return false;
        }
        this._drawGeos(matrix);
        return true;
    },




    isBlank: function () {
        return this._isBlank;
    },

    /**
     * Show and render
     * @override
     */
    show: function () {
        this.layer.forEach(function (geo) {
            geo.onZoomEnd();
        });
        maptalks.renderer.Canvas.prototype.show.apply(this, arguments);
    },

    _drawGeos:function (matrix) {
        var map = this.getMap();
        if (!map) {
            return;
        }
        var layer = this.layer;
        if (layer.isEmpty()) {
            this.fireLoadedEvent();
            return;
        }
        if (!layer.isVisible()) {
            this.fireLoadedEvent();
            return;
        }
        this._prepareToDraw();
        var extent2D = this._extent2D,
            maskExtent2D = this.prepareCanvas();
        if (maskExtent2D) {
            if (!maskExtent2D.intersects(extent2D)) {
                this.fireLoadedEvent();
                return;
            }
            extent2D = extent2D.intersection(maskExtent2D);
        }
        this._displayExtent = extent2D;
        this._forEachGeo(this._checkGeo, this);
        for (var i = 0, len = this._geosToDraw.length; i < len; i++) {
            this._geosToDraw[i]._getPainter().paint(matrix);
        }
    },

    _prepareToDraw: function () {
        this._isBlank = true;
        this._painted = true;
        this._hasPointSymbolizer = false;
        this._geosToDraw = [];
    },

    _checkGeo: function (geo) {
        if (!geo || !geo.isVisible() || !geo.getMap() ||
            !geo.getLayer() || (!geo.getLayer().isCanvasRender())) {
            return;
        }
        var painter = geo._getPainter(),
            extent2D = painter.get2DExtent(this.resources);
        if (!extent2D || !extent2D.intersects(this._displayExtent)) {
            return;
        }
        this._isBlank = false;
        if (painter.hasPointSymbolizer()) {
            this._hasPointSymbolizer = true;
        }
        this._geosToDraw.push(geo);
    },


    _forEachGeo: function (fn, context) {
        this.layer.forEach(fn, context);
    },

    onZoomEnd: function () {
        delete this._extent2D;
        if (this.layer.isVisible()) {
            this.layer.forEach(function (geo) {
                geo.onZoomEnd();
            });
        }
        if (!this._painted) {
            this.render(true);
        } else {
            //prepareRender is called in render not in draw.
            //Thus prepareRender needs to be called here
            this.prepareRender();
            this.draw();
        }
    },

    onMoveEnd: function () {
        if (!this._painted) {
            this.render(true);
        } else {
            this.prepareRender();
            this.draw();
        }
    },

    onResize: function () {
        this.resizeCanvas();
        if (!this._painted) {
            this.render(true);
        } else {
            delete this._extent2D;
            this.prepareRender();
            this.draw();
        }
    },

    onRemove:function () {
        this._forEachGeo(function (g) {
            g.onHide();
        });
        delete this._geosToDraw;
    },

    onGeometryPropertiesChange: function (param) {
        if (param) {
            this.layer._styleGeometry(param['target']);
        }
    }
});


maptalks.VectorLayer.registerRenderer('canvas', maptalks.renderer.vectorlayer.Canvas);

/**
 * @namespace
 * @protected
 */
maptalks.symbolizer = {};
/**
 * @classdesc
 * Base class for all the symbolilzers, a symbolizers contains the following methods:
 * refresh: 刷新逻辑, 例如地图放大缩小时需要刷新像素坐标时
 * svg:     在svg/vml上的绘制逻辑
 * canvas:  在canvas上的绘制逻辑
 * show:    显示
 * hide:    隐藏
 * setZIndex:设置ZIndex
 * remove:  删除逻辑
 * test: 定义在类上, 测试传入的geometry和symbol是否应由该Symbolizer渲染
 * @class
 * @extends maptalks.Class
 * @abstract
 * @protected
 */
maptalks.Symbolizer = maptalks.Class.extend(/** @lends maptalks.Symbolizer.prototype */{
    getMap:function () {
        return this.geometry.getMap();
    },

    getPainter: function () {
        return this.painter;
    }
});


maptalks.Symbolizer.resourceProperties = [
    'markerFile', 'polygonPatternFile', 'linePatternFile', 'markerFillPatternFile', 'markerLinePatternFile'
];

maptalks.Symbolizer.resourceSizeProperties = [
    ['markerWidth', 'markerHeight'], [], [null, 'lineWidth'], [], [null, 'markerLineWidth']
];

/**
 * @property {String[]} colorProperties - Symbol properties related with coloring
 * @static
 * @constant
 */
maptalks.Symbolizer.colorProperties = [
    'lineColor', 'polygonFill', 'markerFill', 'markerLineColor', 'textFill'
];

maptalks.Symbolizer.DEFAULT_STROKE_COLOR = '#000';
maptalks.Symbolizer.DEFAULT_FILL_COLOR = 'rgba(255,255,255,0)';
maptalks.Symbolizer.DEFAULT_TEXT_COLOR = '#000';

/**
 * Test if the property is a property related with coloring
 * @param {String} prop - property name to test
 * @static
 * @function
 * @return {Boolean}
 */
maptalks.Symbolizer.testColor = function (prop) {
    if (!prop || !maptalks.Util.isString(prop)) { return false; }
    if (maptalks.Util.indexOfArray(prop, maptalks.Symbolizer.colorProperties) >= 0) {
        return true;
    }
    return false;
};

/**
 * @classdesc
 * Base symbolizer class for all the symbolizers base on HTML5 Canvas2D
 * @abstract
 * @class
 * @protected
 * @memberOf maptalks.symbolizer
 * @name CanvasSymbolizer
 * @extends {maptalks.Symbolizer}
 */
maptalks.symbolizer.CanvasSymbolizer = maptalks.Symbolizer.extend(/** @lends maptalks.symbolizer.CanvasSymbolizer.prototype */{
    _prepareContext:function (ctx) {
        if (maptalks.Util.isNumber(this.symbol['opacity'])) {
            if (ctx.globalAlpha !== this.symbol['opacity']) {
                ctx.globalAlpha = this.symbol['opacity'];
            }
        } else if (ctx.globalAlpha !== 1) {
            ctx.globalAlpha = 1;
        }
    },

    refresh:function () {
    },

    //所有point symbolizer的共同的remove方法
    remove:function () {
    },

    setZIndex:function () {
    },

    show:function () {
    },

    hide:function () {
    },

    _defineStyle: function (style) {
        var me = this;
        var argFn = function () {
            return [me.getMap().getZoom(), me.geometry.getProperties()];
        };

        return maptalks.Util.loadFunctionTypes(style, argFn);
    }
});

maptalks.symbolizer.StrokeAndFillSymbolizer = maptalks.symbolizer.CanvasSymbolizer.extend({

    initialize:function (symbol, geometry, painter) {
        this.symbol = symbol;
        this.geometry = geometry;
        this.painter = painter;
        if (geometry instanceof maptalks.Marker) {
            return;
        }
        this.style = this._defineStyle(this.translate());
    },

    symbolize:function (ctx, resources) {
        if (this.geometry instanceof maptalks.Marker) {
            return;
        }
        var style = this.style;
        if (style['polygonOpacity'] === 0 && style['lineOpacity'] === 0) {
            return;
        }
        var paintParams = this._getPaintParams();
        if (!paintParams) {
            return;
        }
        this._prepareContext(ctx);
        var isGradient = maptalks.Util.isGradient(style['lineColor']),
            isPath = (this.geometry.constructor === maptalks.Polygon) || (this.geometry instanceof maptalks.LineString);
        if (isGradient && (style['lineColor']['places'] || !isPath)) {
            style['lineGradientExtent'] = this.getPainter().getContainerExtent()._expand(style['lineWidth']);
        }
        if (maptalks.Util.isGradient(style['polygonFill'])) {
            style['polygonGradientExtent'] = this.getPainter().getContainerExtent();
        }

        var points = paintParams[0],
            isSplitted = (this.geometry instanceof maptalks.Polygon && points.length > 1 && maptalks.Util.isArray(points[0][0])) ||
                        (this.geometry instanceof maptalks.LineString  && points.length > 1 && maptalks.Util.isArray(points[0]));
        var params;
        if (isSplitted) {
            for (var i = 0; i < points.length; i++) {
                maptalks.Canvas.prepareCanvas(ctx, style, resources);
                if (isGradient && isPath && !style['lineColor']['places']) {
                    this._createGradient(ctx, points[i], style['lineColor']);
                }
                params = [ctx, points[i]];
                if (paintParams.length > 1) {
                    params.push.apply(params, paintParams.slice(1));
                }
                params.push(style['lineOpacity'], style['polygonOpacity'], style['lineDasharray']);
                this.geometry._paintOn.apply(this.geometry, params);
            }
        } else {
            maptalks.Canvas.prepareCanvas(ctx, style, resources);
            if (isGradient && isPath && !style['lineColor']['places']) {
                this._createGradient(ctx, points, style['lineColor']);
            }
            params = [ctx];
            params.push.apply(params, paintParams);
            params.push(style['lineOpacity'], style['polygonOpacity'], style['lineDasharray']);
            this.geometry._paintOn.apply(this.geometry, params);
        }

        if (ctx.setLineDash && maptalks.Util.isArrayHasData(style['lineDasharray'])) {
            ctx.setLineDash([]);
        }
    },

    get2DExtent:function () {
        if (this.geometry instanceof maptalks.Marker) {
            return null;
        }
        var map = this.getMap();
        var extent = this.geometry._getPrjExtent();
        if (!extent) {
            return null;
        }
        // this ugly implementation is to improve perf as we can
        // it tries to avoid creating instances to save cpu consumption.
        if (!this._extMin || !this._extMax) {
            this._extMin = new maptalks.Coordinate(0, 0);
            this._extMax = new maptalks.Coordinate(0, 0);
        }
        this._extMin.x = extent['xmin'];
        this._extMin.y = extent['ymin'];
        this._extMax.x = extent['xmax'];
        this._extMax.y = extent['ymax'];
        var min = map._prjToPoint(this._extMin),
            max = map._prjToPoint(this._extMax);
        if (!this._pxExtent) {
            this._pxExtent = new maptalks.PointExtent(min, max);
        } else {
            if (min.x < max.x) {
                this._pxExtent['xmin'] = min.x;
                this._pxExtent['xmax'] = max.x;
            } else {
                this._pxExtent['xmax'] = min.x;
                this._pxExtent['xmin'] = max.x;
            }
            if (min.y < max.y) {
                this._pxExtent['ymin'] = min.y;
                this._pxExtent['ymax'] = max.y;
            } else {
                this._pxExtent['ymax'] = min.y;
                this._pxExtent['ymin'] = max.y;
            }
        }
        return this._pxExtent._expand(this.style['lineWidth'] / 2);
    },

    _getPaintParams:function () {
        return this.getPainter().getPaintParams();
    },

    translate:function () {
        var s = this.symbol;
        var result = {
            'lineColor'         : maptalks.Util.getValueOrDefault(s['lineColor'], '#000'),
            'lineWidth'         : maptalks.Util.getValueOrDefault(s['lineWidth'], 2),
            'lineOpacity'       : maptalks.Util.getValueOrDefault(s['lineOpacity'], 1),
            'lineDasharray'     : maptalks.Util.getValueOrDefault(s['lineDasharray'], []),
            'lineCap'           : maptalks.Util.getValueOrDefault(s['lineCap'], 'butt'), //“butt”, “square”, “round”
            'lineJoin'          : maptalks.Util.getValueOrDefault(s['lineJoin'], 'miter'), //“bevel”, “round”, “miter”
            'linePatternFile'   : maptalks.Util.getValueOrDefault(s['linePatternFile'], null),
            'polygonFill'       : maptalks.Util.getValueOrDefault(s['polygonFill'], null),
            'polygonOpacity'    : maptalks.Util.getValueOrDefault(s['polygonOpacity'], 1),
            'polygonPatternFile': maptalks.Util.getValueOrDefault(s['polygonPatternFile'], null)
        };
        if (result['lineWidth'] === 0) {
            result['lineOpacity'] = 0;
        }
        // fill of arrow
        if ((this.geometry instanceof maptalks.LineString) && !result['polygonFill']) {
            result['polygonFill'] = result['lineColor'];
        }
        return result;
    },

    _createGradient: function (ctx, points, lineColor) {
        var len = points.length;
        var grad = ctx.createLinearGradient(points[0].x, points[0].y, points[len - 1].x, points[len - 1].y);
        lineColor['colorStops'].forEach(function (stop) {
            grad.addColorStop.apply(grad, stop);
        });
        ctx.strokeStyle = grad;
    }

});

maptalks.symbolizer.StrokeAndFillSymbolizer.test = function (symbol, geometry) {
    if (!symbol) {
        return false;
    }
    if (geometry && (geometry instanceof maptalks.Marker)) {
        return false;
    }
    for (var p in symbol) {
        var f = p.slice(0, 4);
        if (f === 'line' || f === 'poly') {
            return true;
        }
    }
    return false;
};

/**
 * @classdesc
 * Base symbolizer class for all the point type symbol styles.
 * @abstract
 * @class
 * @protected
 * @memberOf maptalks.symbolizer
 * @name PointSymbolizer
 * @extends {maptalks.symbolizer.CanvasSymbolizer}
 */
maptalks.symbolizer.PointSymbolizer = maptalks.symbolizer.CanvasSymbolizer.extend(/** @lends maptalks.symbolizer.PointSymbolizer */{
    get2DExtent: function (resources) {
        var extent = new maptalks.PointExtent(),
            m = this.getMarkerExtent(resources);
        var renderPoints = this._getRenderPoints()[0];
        for (var i = renderPoints.length - 1; i >= 0; i--) {
            extent._combine(renderPoints[i]);
        }
        extent['xmin'] += m['xmin'];
        extent['ymin'] += m['ymin'];
        extent['xmax'] += m['xmax'];
        extent['ymax'] += m['ymax'];
        return extent;
    },

    _getRenderPoints: function () {
        return this.getPainter().getRenderPoints(this.getPlacement());
    },

    /**
     * Get container points to draw on Canvas
     * @return {maptalks.Point[]}
     */
    _getRenderContainerPoints: function () {
        var painter = this.getPainter(),
            points = this._getRenderPoints()[0];
        if (painter.isSpriting()) {
            return points;
        }
        var matrices = painter.getTransformMatrix(),
            matrix = matrices ? matrices['container'] : null,
            scale = matrices ? matrices['scale'] : null,
            dxdy = this.getDxDy(),
            layerPoint = this.geometry.getLayer()._getRenderer()._extent2D.getMin();
        if (matrix) {
            dxdy = new maptalks.Point(dxdy.x / scale.x, dxdy.y / scale.y);
        }

        var containerPoints = maptalks.Util.mapArrayRecursively(points, function (point) {
            return point.substract(layerPoint)._add(dxdy);
        });
        if (matrix) {
            return matrix.applyToArray(containerPoints);
        }
        return containerPoints;
    },

    _getRotationAt: function (i) {
        var r = this.getRotation(),
            rotations = this._getRenderPoints()[1];
        if (!rotations) {
            return r;
        }
        if (!r) {
            r = 0;
        }
        return rotations[i] + r;
    },

    _rotate: function (ctx, origin, rotation) {
        if (!maptalks.Util.isNil(rotation)) {
            ctx.save();
            ctx.translate(origin.x, origin.y);
            ctx.rotate(rotation);
            return new maptalks.Point(0, 0);
        }
        return null;
    }
});

maptalks.symbolizer.ImageMarkerSymbolizer = maptalks.symbolizer.PointSymbolizer.extend({

    initialize:function (symbol, geometry, painter) {
        this.symbol = symbol;
        this.geometry = geometry;
        this.painter = painter;
        this.style = this._defineStyle(this.translate());
    },


    symbolize:function (ctx, resources) {
        var style = this.style;
        if (style['markerWidth'] === 0 || style['markerHeight'] === 0 || style['markerOpacity'] === 0) {
            return;
        }
        var cookedPoints = this._getRenderContainerPoints();
        if (!maptalks.Util.isArrayHasData(cookedPoints)) {
            return;
        }

        var img = this._getImage(resources);
        if (!img) {
            if (!maptalks.Browser.phantomjs && console) {
                console.warn('no img found for ' + (this.style['markerFile'] || this._url[0]));
            }
            return;
        }
        this._prepareContext(ctx);
        var width = style['markerWidth'];
        var height = style['markerHeight'];
        if (!maptalks.Util.isNumber(width) || !maptalks.Util.isNumber(height)) {
            width = img.width;
            height = img.height;
            style['markerWidth'] = width;
            style['markerHeight'] = height;
            var imgURL = [style['markerFile'], style['markerWidth'], style['markerHeight']];
            if (!resources.isResourceLoaded(imgURL)) {
                resources.addResource(imgURL, img);
            }
            var painter = this.getPainter();
            if (!painter.isSpriting()) {
                painter.removeCache();
            }
        }
        var alpha;
        if (!(this instanceof maptalks.symbolizer.VectorPathMarkerSymbolizer) &&
            maptalks.Util.isNumber(style['markerOpacity']) && style['markerOpacity'] < 1)  {
            alpha = ctx.globalAlpha;
            ctx.globalAlpha *= style['markerOpacity'];
        }
        var p;
        for (var i = 0, len = cookedPoints.length; i < len; i++) {
            p = cookedPoints[i];
            var origin = this._rotate(ctx, p, this._getRotationAt(i));
            if (origin) {
                p = origin;
            }
            //图片定位到中心底部
            maptalks.Canvas.image(ctx, img,
                p.x - width / 2,
                p.y - height,
                width, height);
            if (origin) {
                ctx.restore();
            }
        }
        if (alpha !== undefined) {
            ctx.globalAlpha = alpha;
        }
    },

    _getImage:function (resources) {
        var img = !resources ? null : resources.getImage([this.style['markerFile'], this.style['markerWidth'], this.style['markerHeight']]);
        return img;
    },

    getPlacement:function () {
        return this.symbol['markerPlacement'];
    },

    getRotation: function () {
        var r = this.style['markerRotation'];
        if (!maptalks.Util.isNumber(r)) {
            return null;
        }
        //to radian
        return r * Math.PI / 180;
    },

    getDxDy:function () {
        var s = this.style;
        var dx = s['markerDx'] || 0,
            dy = s['markerDy'] || 0;
        return new maptalks.Point(dx, dy);
    },

    getMarkerExtent:function (resources) {
        var url = this.style['markerFile'],
            img = resources ? resources.getImage(url) : null;
        var width = this.style['markerWidth'] || (img ? img.width : 0),
            height = this.style['markerHeight'] || (img ? img.height : 0);
        var dxdy = this.getDxDy();
        return new maptalks.PointExtent(dxdy.add(-width / 2, 0), dxdy.add(width / 2, -height));
    },

    translate:function () {
        var s = this.symbol;
        return {
            'markerFile'    : s['markerFile'],
            'markerOpacity' : maptalks.Util.getValueOrDefault(s['markerOpacity'], 1),
            'markerWidth'   : maptalks.Util.getValueOrDefault(s['markerWidth'], null),
            'markerHeight'  : maptalks.Util.getValueOrDefault(s['markerHeight'], null),
            'markerDx'      : maptalks.Util.getValueOrDefault(s['markerDx'], 0),
            'markerDy'      : maptalks.Util.getValueOrDefault(s['markerDy'], 0)
        };
    }
});


maptalks.symbolizer.ImageMarkerSymbolizer.test = function (symbol) {
    if (!symbol) {
        return false;
    }
    if (!maptalks.Util.isNil(symbol['markerFile'])) {
        return true;
    }
    return false;
};

maptalks.symbolizer.VectorMarkerSymbolizer = maptalks.symbolizer.PointSymbolizer.extend({

    padding : [2, 2],

    initialize:function (symbol, geometry, painter) {
        this.symbol = symbol;
        this.geometry = geometry;
        this.painter = painter;
        var style = this.translate();
        this.style = this._defineStyle(style);
        this.strokeAndFill = this._defineStyle(maptalks.symbolizer.VectorMarkerSymbolizer.translateLineAndFill(style));
    },

    symbolize:function (ctx, resources) {
        var style = this.style;
        if (style['markerWidth'] === 0 || style['markerHeight'] === 0 ||
            (style['polygonOpacity'] === 0 && style['lineOpacity'] === 0)) {
            return;
        }
        var cookedPoints = this._getRenderContainerPoints();
        if (!maptalks.Util.isArrayHasData(cookedPoints)) {
            return;
        }
        this._prepareContext(ctx);
        if (this.getPainter().isSpriting() || this.geometry.getLayer().getMask() === this.geometry ||
            this.geometry.getLayer().options['cacheVectorOnCanvas'] === false) {
            this._drawMarkers(ctx, cookedPoints, resources);
        } else {
            this._drawMarkersWithCache(ctx, cookedPoints, resources);
        }

    },

    _drawMarkers: function (ctx, cookedPoints, resources) {

        var strokeAndFill = this.strokeAndFill,
            point, origin;
        var gradient = maptalks.Util.isGradient(strokeAndFill['lineColor']) || maptalks.Util.isGradient(strokeAndFill['polygonFill']);
        if (!gradient) {
            maptalks.Canvas.prepareCanvas(ctx, strokeAndFill, resources);
        }
        for (var i = cookedPoints.length - 1; i >= 0; i--) {
            point = cookedPoints[i];
            origin = this._rotate(ctx, point, this._getRotationAt(i));
            if (origin) {
                point = origin;
            }

            this._drawVectorMarker(ctx, point, resources);
            if (origin) {
                ctx.restore();
            }
        }
    },

    _drawMarkersWithCache: function (ctx, cookedPoints, resources) {
        var stamp = this._stampSymbol(),
            lineWidth = this.strokeAndFill['lineWidth'] ? this.strokeAndFill['lineWidth'] : 0,
            shadow = this.geometry.options['shadowBlur'],
            w = this.style['markerWidth'] + lineWidth + 2 * shadow + this.padding[0],
            h = this.style['markerHeight'] + lineWidth + 2 * shadow + this.padding[1];
        var image = resources.getImage(stamp);
        if (!image) {
            image = this._createMarkerImage(ctx, resources);
            resources.addResource([stamp, w, h], image);
        }
        var point, origin,
            anchor = this._getAnchor();
        for (var i = cookedPoints.length - 1; i >= 0; i--) {
            point = cookedPoints[i].substract(anchor);
            origin = this._rotate(ctx, point, this._getRotationAt(i));
            if (origin) {
                point = origin;
            }
            maptalks.Canvas.image(ctx, image, point.x, point.y, w, h);
            if (origin) {
                ctx.restore();
            }
        }
    },

    _createMarkerImage: function (ctx, resources) {
        var canvasClass = ctx.canvas.constructor,
            lineWidth = this.strokeAndFill['lineWidth'] ? this.strokeAndFill['lineWidth'] : 0,
            shadow = this.geometry.options['shadowBlur'],
            w = this.style['markerWidth'] + lineWidth + 2 * shadow + this.padding[0],
            h = this.style['markerHeight'] + lineWidth + 2 * shadow + this.padding[1],
            canvas = maptalks.Canvas.createCanvas(w, h, canvasClass),
            point = this._getAnchor();
        var context = canvas.getContext('2d');
        var gradient = maptalks.Util.isGradient(this.strokeAndFill['lineColor']) || maptalks.Util.isGradient(this.strokeAndFill['polygonFill']);
        if (!gradient) {
            maptalks.Canvas.prepareCanvas(context, this.strokeAndFill, resources);
        }
        this._drawVectorMarker(context, point, resources);
        // context.strokeStyle = '#f00';
        // context.strokeWidth = 10;
        // context.strokeRect(0, 0, w, h);
        return canvas;
    },

    _stampSymbol: function () {
        if (!this._stamp) {
            this._stamp =  [
                this.style['markerType'],
                maptalks.Util.isGradient(this.style['markerFill']) ? maptalks.Util.getGradientStamp(this.style['markerFill']) : this.style['markerFill'],
                this.style['markerFillOpacity'],
                this.style['markerFillPatternFile'],
                maptalks.Util.isGradient(this.style['markerLineColor']) ? maptalks.Util.getGradientStamp(this.style['markerLineColor']) : this.style['markerLineColor'],
                this.style['markerLineWidth'],
                this.style['markerLineOpacity'],
                this.style['markerLineDasharray'] ? this.style['markerLineDasharray'].join(',') : '',
                this.style['markerLinePatternFile'],
                this.style['markerWidth'],
                this.style['markerHeight']
            ].join('_');
        }
        return this._stamp;
    },

    _getAnchor: function () {
        var markerType = this.style['markerType'].toLowerCase(),
            lineWidth = this.strokeAndFill['lineWidth'] ? this.strokeAndFill['lineWidth'] : 0,
            shadow = this.geometry.options['shadowBlur'],
            w = this.style['markerWidth'],
            h = this.style['markerHeight'];
        if (markerType  === 'bar' || markerType  === 'pie' || markerType  === 'pin') {
            return new maptalks.Point(w / 2 + lineWidth / 2 + shadow + this.padding[0] / 2, h + lineWidth / 2 + shadow + this.padding[1]);
        } else {
            return new maptalks.Point(w / 2  + lineWidth / 2 + shadow + this.padding[0] / 2, h / 2  + lineWidth / 2 + shadow + this.padding[1] / 2);
        }
    },

    _getGraidentExtent: function (points) {
        var e = new maptalks.PointExtent(),
            m = this.getMarkerExtent();
        if (maptalks.Util.isArray(points)) {
            for (var i = points.length - 1; i >= 0; i--) {
                e._combine(points[i]);
            }
        } else {
            e._combine(points);
        }
        e['xmin'] += m['xmin'];
        e['ymin'] += m['ymin'];
        e['xmax'] += m['xmax'];
        e['ymax'] += m['ymax'];
        return e;
    },

    _drawVectorMarker: function (ctx, point, resources) {
        var style = this.style, strokeAndFill = this.strokeAndFill,
            markerType = style['markerType'].toLowerCase(),
            vectorArray = maptalks.symbolizer.VectorMarkerSymbolizer._getVectorPoints(markerType, style['markerWidth'], style['markerHeight']),
            lineOpacity = strokeAndFill['lineOpacity'], fillOpacity = strokeAndFill['polygonOpacity'],
            j, lineCap, angle, gradientExtent;
        var gradient = maptalks.Util.isGradient(strokeAndFill['lineColor']) || maptalks.Util.isGradient(strokeAndFill['polygonFill']);
        if (gradient) {
            if (maptalks.Util.isGradient(strokeAndFill['lineColor'])) {
                gradientExtent = this._getGraidentExtent(point);
                strokeAndFill['lineGradientExtent'] = gradientExtent.expand(strokeAndFill['lineWidth']);
            }
            if (maptalks.Util.isGradient(strokeAndFill['polygonFill'])) {
                if (!gradientExtent) {
                    gradientExtent = this._getGraidentExtent(point);
                }
                strokeAndFill['polygonGradientExtent'] = gradientExtent;
            }
            maptalks.Canvas.prepareCanvas(ctx, strokeAndFill, resources);
        }


        var width = style['markerWidth'],
            height = style['markerHeight'];
        if (markerType === 'ellipse') {
             //ellipse default
            maptalks.Canvas.ellipse(ctx, point, width / 2, height / 2, lineOpacity, fillOpacity);
        } else if (markerType === 'cross' || markerType === 'x') {
            for (j = vectorArray.length - 1; j >= 0; j--) {
                vectorArray[j]._add(point);
            }
            //线类型
            maptalks.Canvas.path(ctx, vectorArray.slice(0, 2), lineOpacity);
            maptalks.Canvas.path(ctx, vectorArray.slice(2, 4), lineOpacity);
        } else if (markerType === 'diamond' || markerType === 'bar' || markerType === 'square' || markerType === 'triangle') {
            if (markerType === 'bar') {
                point = point.add(0, -style['markerLineWidth'] / 2);
            }
            for (j = vectorArray.length - 1; j >= 0; j--) {
                vectorArray[j]._add(point);
            }
            //面类型
            maptalks.Canvas.polygon(ctx, vectorArray, lineOpacity, fillOpacity);
        } else if (markerType === 'pin') {
            point = point.add(0, -style['markerLineWidth'] / 2);
            for (j = vectorArray.length - 1; j >= 0; j--) {
                vectorArray[j]._add(point);
            }
            lineCap = ctx.lineCap;
            ctx.lineCap = 'round'; //set line cap to round to close the pin bottom
            maptalks.Canvas.bezierCurveAndFill(ctx, vectorArray, lineOpacity, fillOpacity);
            ctx.lineCap = lineCap;
        } else if (markerType === 'pie') {
            point = point.add(0, -style['markerLineWidth'] / 2);
            angle = Math.atan(width / 2 / height) * 180 / Math.PI;
            lineCap = ctx.lineCap;
            ctx.lineCap = 'round';
            maptalks.Canvas.sector(ctx, point, height, [90 - angle, 90 + angle], lineOpacity, fillOpacity);
            ctx.lineCap = lineCap;
        } else {
            throw new Error('unsupported markerType: ' + markerType);
        }
    },

    getPlacement:function () {
        return this.symbol['markerPlacement'];
    },

    getRotation: function () {
        var r = this.style['markerRotation'];
        if (!maptalks.Util.isNumber(r)) {
            return null;
        }
        //to radian
        return r * Math.PI / 180;
    },

    getDxDy:function () {
        var s = this.style;
        var dx = s['markerDx'],
            dy = s['markerDy'];
        return new maptalks.Point(dx, dy);
    },

    getMarkerExtent:function () {
        var dxdy = this.getDxDy(),
            style = this.style;
        var markerType = style['markerType'].toLowerCase();
        var width = style['markerWidth'],
            height = style['markerHeight'];
        var result;
        if (markerType  === 'bar' || markerType  === 'pie' || markerType  === 'pin') {
            result = new maptalks.PointExtent(dxdy.add(-width / 2, -height), dxdy.add(width / 2, 0));
        } else {
            result = new maptalks.PointExtent(dxdy.add(-width / 2, -height / 2), dxdy.add(width / 2, height / 2));
        }
        if (this.style['markerLineWidth']) {
            result._expand(this.style['markerLineWidth'] / 2);
        }
        return result;
    },

    translate: function () {
        var s = this.symbol;
        var result = {
            'markerType'            : maptalks.Util.getValueOrDefault(s['markerType'], 'ellipse'), //<----- ellipse | cross | x | triangle | diamond | square | bar | pin等,默认ellipse
            'markerFill'            : maptalks.Util.getValueOrDefault(s['markerFill'], '#00f'), //blue as cartoCSS
            'markerFillOpacity'     : maptalks.Util.getValueOrDefault(s['markerFillOpacity'], 1),
            'markerFillPatternFile' : maptalks.Util.getValueOrDefault(s['markerFillPatternFile'], null),
            'markerLineColor'       : maptalks.Util.getValueOrDefault(s['markerLineColor'], '#000'), //black
            'markerLineWidth'       : maptalks.Util.getValueOrDefault(s['markerLineWidth'], 1),
            'markerLineOpacity'     : maptalks.Util.getValueOrDefault(s['markerLineOpacity'], 1),
            'markerLineDasharray'   : maptalks.Util.getValueOrDefault(s['markerLineDasharray'], []),
            'markerLinePatternFile' : maptalks.Util.getValueOrDefault(s['markerLinePatternFile'], null),

            'markerWidth'           : maptalks.Util.getValueOrDefault(s['markerWidth'], 10),
            'markerHeight'          : maptalks.Util.getValueOrDefault(s['markerHeight'], 10),

            'markerDx'              : maptalks.Util.getValueOrDefault(s['markerDx'], 0),
            'markerDy'              : maptalks.Util.getValueOrDefault(s['markerDy'], 0)
        };
        //markerOpacity覆盖fillOpacity和lineOpacity
        if (maptalks.Util.isNumber(s['markerOpacity'])) {
            result['markerFillOpacity'] *= s['markerOpacity'];
            result['markerLineOpacity'] *= s['markerOpacity'];
        }
        return result;
    }
});


maptalks.symbolizer.VectorMarkerSymbolizer.translateLineAndFill = function (s) {
    var result = {
        'lineColor' : s['markerLineColor'],
        'linePatternFile' : s['markerLinePatternFile'],
        'lineWidth' : s['markerLineWidth'],
        'lineOpacity' : s['markerLineOpacity'],
        'lineDasharray': null,
        'lineCap' : 'butt',
        'lineJoin' : 'round',
        'polygonFill' : s['markerFill'],
        'polygonPatternFile' : s['markerFillPatternFile'],
        'polygonOpacity' : s['markerFillOpacity']
    };
    if (result['lineWidth'] === 0) {
        result['lineOpacity'] = 0;
    }
    return result;
};

maptalks.symbolizer.VectorMarkerSymbolizer.test = function (symbol) {
    if (!symbol) {
        return false;
    }
    if (maptalks.Util.isNil(symbol['markerFile']) && !maptalks.Util.isNil(symbol['markerType']) && (symbol['markerType'] !== 'path')) {
        return true;
    }
    return false;
};

maptalks.symbolizer.VectorMarkerSymbolizer.translateToSVGStyles = function (s) {
    var result = {
        'stroke' :{
            'stroke' : s['markerLineColor'],
            'stroke-width' : s['markerLineWidth'],
            'stroke-opacity' : s['markerLineOpacity'],
            'stroke-dasharray': null,
            'stroke-linecap' : 'butt',
            'stroke-linejoin' : 'round'
        },

        'fill' : {
            'fill'          : s['markerFill' ],
            'fill-opacity'  : s['markerFillOpacity']
        }
    };
    //vml和svg对linecap的定义不同
    if (result['stroke']['stroke-linecap'] === 'butt') {
        if (maptalks.Browser.vml) {
            result['stroke']['stroke-linecap'] = 'flat';
        }
    }
    if (result['stroke']['stroke-width'] === 0) {
        result['stroke']['stroke-opacity'] = 0;
    }
    return result;
};

maptalks.symbolizer.VectorMarkerSymbolizer._getVectorPoints = function (markerType, width, height) {
        //half height and half width
    var hh = height / 2,
        hw = width / 2;
    var left = 0, top = 0;
    var v0, v1, v2, v3;
    if (markerType === 'triangle') {
        v0 = new maptalks.Point(left, top - hh);
        v1 = new maptalks.Point(left - hw, top + hh);
        v2 = new maptalks.Point(left + hw, top + hh);
        return [v0, v1, v2];
    } else if (markerType === 'cross') {
        v0 = new maptalks.Point((left - hw), top);
        v1 = new maptalks.Point((left + hw), top);
        v2 = new maptalks.Point((left), (top - hh));
        v3 = new maptalks.Point((left), (top + hh));
        return [v0, v1, v2, v3];
    } else if (markerType === 'diamond') {
        v0 = new maptalks.Point((left - hw), top);
        v1 = new maptalks.Point(left, (top - hh));
        v2 = new maptalks.Point((left + hw), top);
        v3 = new maptalks.Point((left), (top + hh));
        return [v0, v1, v2, v3];
    } else if (markerType === 'square') {
        v0 = new maptalks.Point((left - hw), (top + hh));
        v1 = new maptalks.Point((left + hw), (top + hh));
        v2 = new maptalks.Point((left + hw), (top - hh));
        v3 = new maptalks.Point((left - hw), (top - hh));
        return [v0, v1, v2, v3];
    } else if (markerType === 'x') {
        v0 = new maptalks.Point(left - hw, top + hh);
        v1 = new maptalks.Point(left + hw, top - hh);
        v2 = new maptalks.Point(left + hw, top + hh);
        v3 = new maptalks.Point(left - hw, top - hh);
        return [v0, v1, v2, v3];
    } else if (markerType === 'bar') {
        v0 = new maptalks.Point((left - hw), (top - height));
        v1 = new maptalks.Point((left + hw), (top - height));
        v2 = new maptalks.Point((left + hw), top);
        v3 = new maptalks.Point((left - hw), top);
        return [v0, v1, v2, v3];
    } else if (markerType === 'pin') {
        var extWidth = height * Math.atan(hw / hh);
        v0 = new maptalks.Point(left, top);
        v1 = new maptalks.Point(left - extWidth, top - height);
        v2 = new maptalks.Point(left + extWidth, top - height);
        v3 = new maptalks.Point(left, top);
        return [v0, v1, v2, v3];
    }
    return null;
};

maptalks.symbolizer.VectorPathMarkerSymbolizer = maptalks.symbolizer.ImageMarkerSymbolizer.extend({

    initialize:function (symbol, geometry, painter) {
        this.symbol = symbol;
        this.geometry = geometry;
        this.painter = painter;
        this._url = [maptalks.Geometry.getMarkerPathBase64(symbol), symbol['markerWidth'], symbol['markerHeight']];
        this.style = this._defineStyle(this.translate());
        //IE must have a valid width and height to draw a svg image
        //otherwise, error will be thrown
        if (maptalks.Util.isNil(this.style['markerWidth'])) {
            this.style['markerWidth'] = 80;
        }
        if (maptalks.Util.isNil(this.style['markerHeight'])) {
            this.style['markerHeight'] = 80;
        }
    },

    _prepareContext: function () {
        //for VectorPathMarkerSymbolizer, opacity is already added into SVG element.
    },

    _getImage:function (resources) {
        if (resources && resources.isResourceLoaded(this._url)) {
            return resources.getImage(this._url);
        }
        var image = new Image();
        image.src = this._url[0];
        if (resources) {
            resources.addResource(this._url, image);
        }
        return image;
        // return resources ? resources.getImage(this._url) : null;
    }
});


maptalks.symbolizer.VectorPathMarkerSymbolizer.test = function (symbol) {
    if (!symbol) {
        return false;
    }
    if (maptalks.Util.isNil(symbol['markerFile']) && symbol['markerType'] === 'path') {
        return true;
    }
    return false;
};

maptalks.symbolizer.TextMarkerSymbolizer = maptalks.symbolizer.PointSymbolizer.extend({

    initialize:function (symbol, geometry, painter) {
        this.symbol = symbol;
        this.geometry = geometry;
        this.painter = painter;
        var style = this.translate();
        this.style = this._defineStyle(style);
        this.strokeAndFill = this._defineStyle(this.translateLineAndFill(style));
        var textContent = maptalks.StringUtil.replaceVariable(this.style['textName'], this.geometry.getProperties());
        this._descText(textContent);
    },

    symbolize:function (ctx, resources) {
        if (this.style['textSize'] === 0 || this.style['textOpacity'] === 0) {
            return;
        }
        var cookedPoints = this._getRenderContainerPoints();
        if (!maptalks.Util.isArrayHasData(cookedPoints)) {
            return;
        }
        var style = this.style,
            strokeAndFill = this.strokeAndFill;
        var textContent = maptalks.StringUtil.replaceVariable(this.style['textName'], this.geometry.getProperties());
        this._descText(textContent);
        this._prepareContext(ctx);
        maptalks.Canvas.prepareCanvas(ctx, strokeAndFill, resources);
        maptalks.Canvas.prepareCanvasFont(ctx, style);
        var p;
        for (var i = 0, len = cookedPoints.length; i < len; i++) {
            p = cookedPoints[i];
            var origin = this._rotate(ctx, p, this._getRotationAt(i));
            if (origin) {
                p = origin;
            }
            maptalks.Canvas.text(ctx, textContent, p, style, this.textDesc);
            if (origin) {
                ctx.restore();
            }
        }
    },

    getPlacement:function () {
        return this.symbol['textPlacement'];
    },

    getRotation: function () {
        var r = this.style['textRotation'];
        if (!maptalks.Util.isNumber(r)) {
            return null;
        }
        //to radian
        return r * Math.PI / 180;
    },

    getDxDy:function () {
        var s = this.style;
        var dx = s['textDx'],
            dy = s['textDy'];
        return new maptalks.Point(dx, dy);
    },

    getMarkerExtent:function () {
        var dxdy = this.getDxDy(),
            style = this.style,
            size = this.textDesc['size'];
        var alignPoint = maptalks.StringUtil.getAlignPoint(size, style['textHorizontalAlignment'], style['textVerticalAlignment']);
        var alignW = alignPoint.x, alignH = alignPoint.y;
        return new maptalks.PointExtent(
            dxdy.add(alignW, alignH),
            dxdy.add(alignW + size['width'], alignH + size['height'])
        );
    },

    translate:function () {
        var s = this.symbol;
        var result = {
            'textName'          : s['textName'],
            'textFaceName'      : maptalks.Util.getValueOrDefault(s['textFaceName'], 'monospace'),
            'textWeight'        : maptalks.Util.getValueOrDefault(s['textWeight'], 'normal'), //'bold', 'bolder'
            'textStyle'         : maptalks.Util.getValueOrDefault(s['textStyle'], 'normal'), //'italic', 'oblique'
            'textSize'          : maptalks.Util.getValueOrDefault(s['textSize'], 10),
            'textFont'          : maptalks.Util.getValueOrDefault(s['textFont'], null),
            'textFill'          : maptalks.Util.getValueOrDefault(s['textFill'], '#000'),
            'textOpacity'       : maptalks.Util.getValueOrDefault(s['textOpacity'], 1),

            'textHaloFill'      : maptalks.Util.getValueOrDefault(s['textHaloFill'], '#ffffff'),
            'textHaloRadius'    : maptalks.Util.getValueOrDefault(s['textHaloRadius'], 0),
            'textHaloOpacity'   : maptalks.Util.getValueOrDefault(s['textHaloOpacity'], 1),

            'textWrapWidth'     : maptalks.Util.getValueOrDefault(s['textWrapWidth'], null),
            'textWrapBefore'    : maptalks.Util.getValueOrDefault(s['textWrapBefore'], false),
            'textWrapCharacter' : maptalks.Util.getValueOrDefault(s['textWrapCharacter'], null),
            'textLineSpacing'   : maptalks.Util.getValueOrDefault(s['textLineSpacing'], 0),

            'textDx'            : maptalks.Util.getValueOrDefault(s['textDx'], 0),
            'textDy'            : maptalks.Util.getValueOrDefault(s['textDy'], 0),

            'textHorizontalAlignment' : maptalks.Util.getValueOrDefault(s['textHorizontalAlignment'], 'middle'), //left | middle | right | auto
            'textVerticalAlignment'   : maptalks.Util.getValueOrDefault(s['textVerticalAlignment'], 'middle'),   // top | middle | bottom | auto
            'textAlign'               : maptalks.Util.getValueOrDefault(s['textAlign'], 'center') //left | right | center | auto
        };

        return result;
    },

    translateLineAndFill:function (s) {
        return {
            'lineColor' : s['textHaloRadius'] ? s['textHaloFill'] : s['textFill'],
            'lineWidth' : s['textHaloRadius'],
            'lineOpacity' : s['textOpacity'],
            'lineDasharray' : null,
            'lineCap' : 'butt',
            'lineJoin' : 'round',
            'polygonFill' : s['textFill'],
            'polygonOpacity' : s['textOpacity']
        };
    },

    _descText : function (textContent) {
        this.textDesc = this._loadFromCache(textContent, this.style);
        if (!this.textDesc) {
            this.textDesc = maptalks.StringUtil.splitTextToRow(textContent, this.style);
            this._storeToCache(textContent, this.style, this.textDesc);
        }
    },

    _storeToCache: function (textContent, style, textDesc) {
        if (maptalks.node) {
            return;
        }
        if (!this.geometry['___text_symbol_cache']) {
            this.geometry['___text_symbol_cache'] = {};
        }
        this.geometry['___text_symbol_cache'][this._genCacheKey(style)] = textDesc;
    },

    _loadFromCache:function (textContent, style) {
        if (!this.geometry['___text_symbol_cache']) {
            return null;
        }
        return this.geometry['___text_symbol_cache'][this._genCacheKey(textContent, style)];
    },

    _genCacheKey: function (textContent, style) {
        var key = [textContent];
        for (var p in style) {
            if (style.hasOwnProperty(p) && p.length > 4 && p.substring(0, 4) === 'text') {
                key.push(p + '=' + style[p]);
            }
        }
        return key.join('-');
    }
});



maptalks.symbolizer.TextMarkerSymbolizer.test = function (symbol) {
    if (!symbol) {
        return false;
    }
    if (!maptalks.Util.isNil(symbol['textName'])) {
        return true;
    }
    return false;
};

maptalks.symbolizer.TextMarkerSymbolizer.getFont = function (style) {
    if (style['textFont']) {
        return style['textFont'];
    } else {
        return (style['textStyle'] ? style['textStyle'] + ' ' : '') +
            (style['textWeight'] ? style['textWeight'] + ' ' : '') +
            style['textSize'] + 'px ' +
            (style['textFaceName'][0] === '"' ? style['textFaceName'] : '"' + style['textFaceName'] + '"');
    }
};

maptalks.symbolizer.DebugSymbolizer = maptalks.symbolizer.PointSymbolizer.extend({

    styles:{
        'lineColor':'#000',
        'lineOpacity' : 1,
        'lineWidth' : 1
    },

    initialize:function (symbol, geometry, painter) {
        this.symbol = symbol;
        this.geometry = geometry;
        this.painter = painter;
    },

    getPlacement:function () {
        return 'point';
    },

    getDxDy:function () {
        return new maptalks.Point(0, 0);
    },

    symbolize:function (ctx) {
        var geometry = this.geometry,
            layer = geometry.getLayer();
        if (!geometry.options['debug'] && (layer && !layer.options['debug'])) {
            return;
        }
        var map = this.getMap();
        if (!map || map._zooming) {
            return;
        }
        maptalks.Canvas.prepareCanvas(ctx, this.styles);
        var op = this.styles['lineOpacity'];

        //outline
        var pixelExtent = this.getPainter().getContainerExtent();
        var nw = pixelExtent.getMin(),
            size = pixelExtent.getSize();
        maptalks.Canvas.rectangle(ctx, nw, size, op, 0);

        //center cross and id if have any.
        var points = this._getRenderContainerPoints();

        var id = this.geometry.getId();
        var cross = maptalks.symbolizer.VectorMarkerSymbolizer._getVectorPoints('cross', 10, 10);
        for (var i = 0; i < points.length; i++) {
            var p = points[i];
            if (!maptalks.Util.isNil(id)) {
                maptalks.Canvas.fillText(ctx, id, p.add(8, -4), 'rgba(0,0,0,1)');
            }
            var c = [];
            for (var ii = 0; ii < cross.length; ii++) {
                c.push(cross[ii].add(p));
            }
            maptalks.Canvas.path(ctx, c.slice(0, 2), op);
            maptalks.Canvas.path(ctx, c.slice(2, 4), op);
        }
    }

});

var Symboling = {};
//有中心点的图形的共同方法
Symboling.Center = {
    _getRenderPoints:function () {
        return [[this._getCenter2DPoint()], null];
    }
};
/**
 * 获取symbolizer所需的数据
 */
maptalks.Marker.include(Symboling.Center);

maptalks.Ellipse.include(Symboling.Center, {
    _getRenderSize:function () {
        var w = this.getWidth(),
            h = this.getHeight();
        var map = this.getMap();
        return map.distanceToPixel(w / 2, h / 2);
    }
});

maptalks.Circle.include(Symboling.Center, {
    _getRenderSize:function () {
        var radius = this.getRadius();
        var map = this.getMap();
        return map.distanceToPixel(radius, radius);
    }
});
//----------------------------------------------------
maptalks.Sector.include(Symboling.Center, {
    _getRenderSize:function () {
        var radius = this.getRadius();
        var map = this.getMap();
        return map.distanceToPixel(radius, radius);
    }
});
//----------------------------------------------------
maptalks.Rectangle.include({
    _getRenderPoints:function (placement) {
        if (placement === 'vertex') {
            var shell = this.getShell();
            var points = [];
            for (var i = 0, len = shell.length; i < len; i++) {
                points.push(this.getMap().coordinateToPoint(shell[i]));
            }
            return [points, null];
        } else {
            var c = this.getMap().coordinateToPoint(this.getCenter());
            return [[c], null];
        }
    },

    _getRenderSize:function () {
        var w = this.getWidth(),
            h = this.getHeight();
        var map = this.getMap();
        return map.distanceToPixel(w, h);
    }
});
//----------------------------------------------------
Symboling.Poly = {
    _getRenderPoints:function (placement) {
        var map = this.getMap();
        var points, rotations = null;
        if (placement === 'vertex') {
            points = this._getPath2DPoints(this._getPrjCoordinates());
            if (points && points.length > 0 && maptalks.Util.isArray(points[0])) {
                //anti-meridian
                points = points[0].concat(points[1]);
            }
        } else if (placement === 'line') {
            points = [];
            rotations = [];
            var vertice = this._getPath2DPoints(this._getPrjCoordinates()),
                isSplitted =  vertice.length > 0 && maptalks.Util.isArray(vertice[0]);
            var i, len;
            if (isSplitted) {
                //anti-meridian splitted
                var ring, ii, ilen;
                for (i = 1, len = vertice.length; i < len; i++) {
                    ring = vertice[i];
                    if (this instanceof maptalks.Polygon && ring.length > 0 && !ring[0].equals(ring[ring.length - 1])) {
                        ring.push(ring[0]);
                    }
                    for (ii = 1, ilen = ring.length; ii < ilen; ii++) {
                        points.push(ring[ii].add(ring[ii - 1])._multi(0.5));
                        rotations.push(maptalks.Util.computeDegree(ring[ii - 1], ring[ii]));
                    }
                }
            } else {
                if (this instanceof maptalks.Polygon && vertice.length > 0 && !vertice[0].equals(vertice[vertice.length - 1])) {
                    vertice.push(vertice[0]);
                }
                for (i = 1, len = vertice.length; i < len; i++) {
                    points.push(vertice[i].add(vertice[i - 1])._multi(0.5));
                    rotations.push(maptalks.Util.computeDegree(vertice[i - 1], vertice[i]));
                }
            }

        } else if (placement === 'vertex-first') {
            var first = this._getPrjCoordinates()[0];
            points = [map._prjToPoint(first)];
        } else if (placement === 'vertex-last') {
            var last = this._getPrjCoordinates()[this._getPrjCoordinates().length - 1];
            points = [map._prjToPoint(last)];
        } else {
            var pcenter = this._getProjection().project(this.getCenter());
            points = [map._prjToPoint(pcenter)];
        }
        return [points, rotations];
    }
};

maptalks.Polyline.include(Symboling.Poly);

maptalks.Polygon.include(Symboling.Poly);

//如果不支持canvas, 则不载入canvas的绘制逻辑
if (maptalks.Browser.canvas) {

    var ellipseReources = {
        _getPaintParams: function () {
            var map = this.getMap();
            var pcenter = this._getPrjCoordinates();
            var pt = map._prjToPoint(pcenter);
            var size = this._getRenderSize();
            return [pt, size['width'], size['height']];
        },

        _paintOn: maptalks.Canvas.ellipse
    };

    maptalks.Ellipse.include(ellipseReources);

    maptalks.Circle.include(ellipseReources);
    //----------------------------------------------------
    maptalks.Rectangle.include({
        _getPaintParams: function () {
            var map = this.getMap();
            var pt = map._prjToPoint(this._getPrjCoordinates());
            var size = this._getRenderSize();
            return [pt, size];
        },
        _paintOn: maptalks.Canvas.rectangle
    });
    //----------------------------------------------------
    maptalks.Sector.include({
        _getPaintParams: function () {
            var map = this.getMap();
            var pt = map._prjToPoint(this._getPrjCoordinates());
            var size = this._getRenderSize();
            return [pt, size['width'], [this.getStartAngle(), this.getEndAngle()]];
        },
        _paintOn: maptalks.Canvas.sector

    });
    //----------------------------------------------------

    maptalks.LineString.include({
        arrowStyles : {
            'classic' : [3, 4]
        },

        _getArrowPoints: function (prePoint, point, lineWidth, arrowStyle, tolerance) {
            if (!tolerance) {
                tolerance = 0;
            }
            var width = lineWidth * arrowStyle[0],
                height = lineWidth * arrowStyle[1] + tolerance,
                hw = width / 2 + tolerance;

            var normal = point.substract(prePoint)._unit();
            var p1 = point.add(normal.multi(height));
            normal._perp();
            var p0 = point.add(normal.multi(hw));
            normal._multi(-1);
            var p2 = point.add(normal.multi(hw));
            return [p0, p1, p2, p0];
        },

        _getPaintParams: function () {
            var prjVertexes = this._getPrjCoordinates();
            var points = this._getPath2DPoints(prjVertexes);
            return [points];
        },

        _paintOn:function (ctx, points, lineOpacity, fillOpacity, dasharray) {
            maptalks.Canvas.path(ctx, points, lineOpacity, null, dasharray);
            this._paintArrow(ctx, points, lineOpacity);
        },

        _getArrowPlacement: function () {
            return this.options['arrowPlacement'];
        },

        _getArrowStyle: function () {
            var arrowStyle = this.options['arrowStyle'];
            if (arrowStyle) {
                return maptalks.Util.isArray(arrowStyle) ? arrowStyle : this.arrowStyles[arrowStyle];
            }
            return null;
        },

        _getArrows: function (points, lineWidth, tolerance) {
            var arrowStyle = this._getArrowStyle();
            if (!arrowStyle || points.length < 2) {
                return null;
            }
            var isSplitted = points.length > 0 && maptalks.Util.isArray(points[0]);
            var segments = isSplitted ? points : [points];
            var placement = this._getArrowPlacement();
            var arrows = [];
            for (var i = segments.length - 1; i >= 0; i--) {
                if (placement === 'vertex-first' || placement === 'vertex-firstlast') {
                    arrows.push(this._getArrowPoints(segments[i][1], segments[i][0], lineWidth, arrowStyle, tolerance));
                }
                if (placement === 'vertex-last' || placement === 'vertex-firstlast') {
                    arrows.push(this._getArrowPoints(segments[i][segments[i].length - 2], segments[i][segments[i].length - 1], lineWidth, arrowStyle, tolerance));
                } else if (placement === 'point') {
                    for (var ii = 0, ll = segments[i].length - 1; ii < ll; ii++) {
                        arrows.push(this._getArrowPoints(segments[i][ii], segments[i][ii + 1], lineWidth, arrowStyle, tolerance));
                    }
                }
            }
            return arrows.length > 0 ? arrows : null;
        },

        _paintArrow: function (ctx, points, lineOpacity) {
            var lineWidth = this._getInternalSymbol()['lineWidth'];
            if (!lineWidth || lineWidth < 3) {
                lineWidth = 3;
            }
            var arrows = this._getArrows(points, lineWidth);
            if (!arrows) {
                return;
            }
            if (arrows) {
                if (ctx.setLineDash) {
                    //remove line dash effect if any
                    ctx.setLineDash([]);
                }
                for (var i = arrows.length - 1; i >= 0; i--) {
                    ctx.fillStyle = ctx.strokeStyle;
                    maptalks.Canvas.polygon(ctx, arrows[i], lineOpacity, lineOpacity);
                }
            }
        }
    });

    maptalks.Polygon.include({
        _getPaintParams: function () {
            var prjVertexes = this._getPrjCoordinates(),
                points = this._getPath2DPoints(prjVertexes),
                //splitted by anti-meridian
                isSplitted = points.length > 0 && maptalks.Util.isArray(points[0]);
            if (isSplitted) {
                points = [[points[0]], [points[1]]];
            }
            var prjHoles = this._getPrjHoles();
            var holePoints = [];
            if (maptalks.Util.isArrayHasData(prjHoles)) {
                var hole;
                for (var i = 0; i < prjHoles.length; i++) {
                    hole = this._getPath2DPoints(prjHoles[i]);
                    if (isSplitted) {
                        if (maptalks.Util.isArray(hole)) {
                            points[0].push(hole[0]);
                            points[1].push(hole[1]);
                        } else {
                            points[0].push(hole);
                        }
                    } else {
                        holePoints.push(hole);
                    }

                }
            }
            return [isSplitted ? points : [points].concat(holePoints)];
        },
        _paintOn: maptalks.Canvas.polygon
    });
}

/**
 * @classdesc
 * Painter class for all geometry types except the collection types.
 * @class
 * @protected
 * @param {maptalks.Geometry} geometry - geometry to paint
 */
maptalks.Painter = maptalks.Class.extend(/** @lends maptalks.Painter.prototype */{


    initialize:function (geometry) {
        this.geometry = geometry;
        this.symbolizers = this._createSymbolizers();
    },

    getMap:function () {
        return this.geometry.getMap();
    },

    /**
     * 构造symbolizers
     * @return {*} [description]
     */
    _createSymbolizers:function () {
        var geoSymbol = this.getSymbol(),
            symbolizers = [],
            regSymbolizers = maptalks.Painter.registerSymbolizers,
            symbols = geoSymbol;
        if (!maptalks.Util.isArray(geoSymbol)) {
            symbols = [geoSymbol];
        }
        var symbol, symbolizer;
        for (var ii = symbols.length - 1; ii >= 0; ii--) {
            symbol = symbols[ii];
            for (var i = regSymbolizers.length - 1; i >= 0; i--) {
                if (regSymbolizers[i].test(symbol, this.geometry)) {
                    symbolizer = new regSymbolizers[i](symbol, this.geometry, this);
                    symbolizers.push(symbolizer);
                    if (symbolizer instanceof maptalks.symbolizer.PointSymbolizer) {
                        this._hasPointSymbolizer = true;
                    }
                }
            }
        }
        if (symbolizers.length === 0) {
            if (console) {
                console.warn('invalid symbol for geometry(' + (this.geometry ? this.geometry.getType() + (this.geometry.getId() ? ':' + this.geometry.getId() : '') : '') + ') to draw : ' + JSON.stringify(geoSymbol));
            }
            // throw new Error('no symbolizers can be created to draw, check the validity of the symbol.');
        }
        this._debugSymbolizer = new maptalks.symbolizer.DebugSymbolizer(symbol, this.geometry, this);
        this._hasShadow = this.geometry.options['shadowBlur'] > 0;
        return symbolizers;
    },

    hasPointSymbolizer:function () {
        return this._hasPointSymbolizer;
    },

    getTransformMatrix: function () {
        if (this._matrix) {
            return this._matrix;
        }
        return null;
    },

    /**
     * for point symbolizers
     * @return {maptalks.Point[]} points to render
     */
    getRenderPoints:function (placement) {
        if (!this._renderPoints) {
            this._renderPoints = {};
        }
        if (!placement) {
            placement = 'point';
        }
        if (!this._renderPoints[placement]) {
            this._renderPoints[placement] = this.geometry._getRenderPoints(placement);
        }
        return this._renderPoints[placement];
    },

    /**
     * for strokeAndFillSymbolizer
     * @return {Object[]} resources to render vector
     */
    getPaintParams:function () {
        if (!this._paintParams) {
            //render resources geometry returned are based on 2d points.
            this._paintParams = this.geometry._getPaintParams();
        }
        if (!this._paintParams) {
            return null;
        }
        var matrices = this.getTransformMatrix(),
            matrix = matrices ? matrices['container'] : null,
            scale = matrices ? matrices['scale'] : null;
        var layerPoint = this.geometry.getLayer()._getRenderer()._extent2D.getMin(),
            paintParams = this._paintParams,
            tPaintParams = [], // transformed params
        //refer to Geometry.Canvas
            points = paintParams[0],
            containerPoints;
        //convert view points to container points needed by canvas
        if (maptalks.Util.isArray(points)) {
            containerPoints = maptalks.Util.mapArrayRecursively(points, function (point) {
                var cp = point.substract(layerPoint);
                if (matrix) {
                    return matrix.applyToPointInstance(cp);
                }
                return cp;
            });
        } else if (points instanceof maptalks.Point) {
            containerPoints = points.substract(layerPoint);
            if (matrix) {
                containerPoints = matrix.applyToPointInstance(containerPoints);
            }
        }
        tPaintParams.push(containerPoints);

        //scale width ,height or radius if geometry has
        for (var i = 1, len = paintParams.length; i < len; i++) {
            if (matrix) {
                if (maptalks.Util.isNumber(paintParams[i]) || (paintParams[i] instanceof maptalks.Size)) {
                    if (maptalks.Util.isNumber(paintParams[i])) {
                        tPaintParams.push(scale.x * paintParams[i]);
                    } else {
                        tPaintParams.push(new maptalks.Size(paintParams[i].width * scale.x, paintParams[i].height * scale.y));
                    }
                } else {
                    tPaintParams.push(paintParams[i]);
                }
            } else {
                tPaintParams.push(paintParams[i]);
            }
        }

        return tPaintParams;
    },

    getSymbol:function () {
        return this.geometry._getInternalSymbol();
    },

    /**
     * 绘制图形
     */
    paint: function (matrix) {
          var contexts = this.geometry.getLayer()._getRenderer().getPaintContext();
        if (!contexts || !this.symbolizers) {
            return;
        }

        this._matrix = matrix;
        this._prepareShadow(contexts[0]);
        for (var i = this.symbolizers.length - 1; i >= 0; i--) {
            this.symbolizers[i].symbolize.apply(this.symbolizers[i], contexts);
        }
        this._painted = true;
        this._debugSymbolizer.symbolize.apply(this._debugSymbolizer, contexts);
    },

    symbolize: function (matrix, contexts) {
        this._prepareShadow(contexts[0]);
        for (var i = this.symbolizers.length - 1; i >= 0; i--) {
            this.symbolizers[i].symbolize.apply(this.symbolizers[i], contexts);
        }
        this._painted = true;
        this._debugSymbolizer.symbolize.apply(this._debugSymbolizer, contexts);
    },

    getSprite: function (resources) {
        if (!(this.geometry instanceof maptalks.Marker)) {
            return null;
        }
        this._genSprite = true;
        if (!this._sprite && this.symbolizers.length > 0) {
            var extent = new maptalks.PointExtent();
            this.symbolizers.forEach(function (s) {
                var markerExtent = s.getMarkerExtent(resources);
                extent._combine(markerExtent);
            });
            var origin = extent.getMin().multi(-1);
            var canvas = maptalks.Canvas.createCanvas(extent.getWidth(), extent.getHeight(), this.getMap() ? this.getMap().CanvasClass : null);
            var bak;
            if (this._renderPoints) {
                bak = this._renderPoints;
            }
            var contexts = [canvas.getContext('2d'), resources];
            this._prepareShadow(canvas.getContext('2d'));
            for (var i = this.symbolizers.length - 1; i >= 0; i--) {
                var dxdy = this.symbolizers[i].getDxDy();
                this._renderPoints = {'point' : [[origin.add(dxdy)]]};
                this.symbolizers[i].symbolize.apply(this.symbolizers[i], contexts);
            }
            if (bak) {
                this._renderPoints = bak;
            }
            this._sprite = {
                'canvas' : canvas,
                'offset' : extent.getCenter()
            };
        }
        this._genSprite = false;
        return this._sprite;
    },

    isSpriting: function () {
        return this._genSprite;
    },

    _prepareShadow: function (ctx) {
        if (this._hasShadow) {
            ctx.shadowBlur = this.geometry.options['shadowBlur'];
            ctx.shadowColor = this.geometry.options['shadowColor'];
        } else if (ctx.shadowBlur) {
            ctx.shadowBlur = null;
            ctx.shadowColor = null;
        }
    },

    _eachSymbolizer:function (fn, context) {
        if (!this.symbolizers) {
            return;
        }
        if (!context) {
            context = this;
        }
        for (var i = this.symbolizers.length - 1; i >= 0; i--) {
            fn.apply(context, [this.symbolizers[i]]);
        }
    },

    //需要实现的接口方法
    get2DExtent:function (resources) {
        if (!this._extent2D) {
            if (this.symbolizers) {
                var _extent2D = new maptalks.PointExtent();
                var len = this.symbolizers.length - 1;
                for (var i = len; i >= 0; i--) {
                    _extent2D._combine(this.symbolizers[i].get2DExtent(resources));
                }
                this._extent2D = _extent2D;
            }
        }
        return this._extent2D;
    },

    getContainerExtent : function () {
        var map = this.getMap(),
            matrix = this.getTransformMatrix(),
            extent2D = this.get2DExtent(this.resources);
        var containerExtent = new maptalks.PointExtent(map._pointToContainerPoint(extent2D.getMin()), map._pointToContainerPoint(extent2D.getMax()));
        if (matrix) {
            //FIXME not right for markers
            var min = matrix['container'].applyToPointInstance(containerExtent.getMin());
            var max = matrix['container'].applyToPointInstance(containerExtent.getMax());
            containerExtent = new maptalks.PointExtent(min, max);
        }
        return containerExtent;
    },

    setZIndex:function (change) {
        this._eachSymbolizer(function (symbolizer) {
            symbolizer.setZIndex(change);
        });
    },

    show:function () {
        if (!this._painted) {
            var layer = this.geometry.getLayer();
            if (!layer.isCanvasRender()) {
                this.paint();
            }
        } else {
            this.removeCache();
            this._refreshSymbolizers();
            this._eachSymbolizer(function (symbolizer) {
                symbolizer.show();
            });
        }
    },

    hide:function () {
        this._eachSymbolizer(function (symbolizer) {
            symbolizer.hide();
        });
    },

    onZoomEnd:function () {
        this.removeCache();
        this._refreshSymbolizers();
    },

    repaint:function () {
        this.removeCache();
        this._refreshSymbolizers();
    },

    _refreshSymbolizers:function () {
        this._eachSymbolizer(function (symbolizer) {
            symbolizer.refresh();
        });
    },

    /**
     * symbol发生变化后, 刷新symbol
     */
    refreshSymbol:function () {
        this.removeCache();
        this._removeSymbolizers();
        this.symbolizers = this._createSymbolizers();
        if (!this.getMap()) {
            return;
        }
        var layer = this.geometry.getLayer();
        if (this.geometry.isVisible() && (layer instanceof maptalks.VectorLayer)) {
            if (!layer.isCanvasRender()) {
                this.paint();
            }
        }
    },

    remove:function () {
        this.removeCache();
        this._removeSymbolizers();
    },

    _removeSymbolizers:function () {
        this._eachSymbolizer(function (symbolizer) {
            delete symbolizer.painter;
            symbolizer.remove();
        });
        delete this.symbolizers;
    },

    /**
     * delete painter's caches
     */
    removeCache:function () {
        delete this._renderPoints;
        delete this._paintParams;
        delete this._extent2D;
        delete this._sprite;
    }
});

//注册的symbolizer
maptalks.Painter.registerSymbolizers = [
    maptalks.symbolizer.StrokeAndFillSymbolizer,
    maptalks.symbolizer.ImageMarkerSymbolizer,
    maptalks.symbolizer.VectorPathMarkerSymbolizer,
    maptalks.symbolizer.VectorMarkerSymbolizer,
    maptalks.symbolizer.TextMarkerSymbolizer
];

/**
 * @classdesc
 * Painter for collection type geometries
 * @class
 * @protected
 * @param {maptalks.GeometryCollection} geometry - geometry to paint
 */
maptalks.CollectionPainter = maptalks.Class.extend(/** @lends maptalks.CollectionPainter.prototype */{
    initialize:function (geometry) {
        this.geometry = geometry;
    },

    _eachPainter:function (fn) {
        var geometries = this.geometry.getGeometries();
        var painter;
        for (var i = 0, len = geometries.length; i < len; i++) {
            painter = geometries[i]._getPainter();
            if (!painter) {
                continue;
            }
            if (painter) {
                if (fn.call(this, painter) === false) {
                    break;
                }
            }
        }
    },

    paint:function (matrix) {
        if (!this.geometry) {
            return;
        }
        this._eachPainter(function (painter) {
            painter.paint(matrix);
        });
    },

    get2DExtent:function (resources) {
        var  extent = new maptalks.PointExtent();
        this._eachPainter(function (painter) {
            extent = extent.combine(painter.get2DExtent(resources));
        });
        return extent;
    },

    remove:function () {
        var args = arguments;
        this._eachPainter(function (painter) {
            painter.remove.apply(painter, args);
        });
    },

    setZIndex:function () {
        var args = arguments;
        this._eachPainter(function (painter) {
            painter.setZIndex.apply(painter, args);
        });
    },

    show:function () {
        var args = arguments;
        this._eachPainter(function (painter) {
            painter.show.apply(painter, args);
        });
    },

    hide:function () {
        var args = arguments;
        this._eachPainter(function (painter) {
            painter.hide.apply(painter, args);
        });
    },

    onZoomEnd:function () {
        var args = arguments;
        this._eachPainter(function (painter) {
            painter.onZoomEnd.apply(painter, args);
        });
    },

    repaint:function () {
        var args = arguments;
        this._eachPainter(function (painter) {
            painter.repaint.apply(painter, args);
        });
    },

    refreshSymbol:function () {
        var args = arguments;
        this._eachPainter(function (painter) {
            painter.refreshSymbol.apply(painter, args);
        });
    },

    hasPointSymbolizer:function () {
        var result = false;
        this._eachPainter(function (painter) {
            if (painter.hasPointSymbolizer()) {
                result = true;
                return false;
            }
            return true;
        });
        return result;
    }
});

/**
 * @classdesc
 * A sub class of maptalks.VectorLayer supports GeoJSON.
 * @class
 * @category layer
 * @extends {maptalks.VectorLayer}
 * @param {String|Number} id        - layer's id
 * @param {Object}        json      - GeoJSON objects
 * @param {Object} [options=null]   - construct options defined in [maptalks.GeoJSONLayer]{@link maptalks.GeoJSONLayer#options}
 */
maptalks.GeoJSONLayer = maptalks.VectorLayer.extend(/** @lends maptalks.GeoJSONLayer.prototype */{

    initialize: function (id, json, options) {
        this.setId(id);
        if (json && !maptalks.Util.isArray(json)) {
            if (!json['type']) {
                //is options
                options = json;
                json = null;
            }
        }
        maptalks.Util.setOptions(this, options);
        if (json) {
            var geometries = this._parse(json);
            this.addGeometry(geometries);
        }
    },

    /**
     * Add geojson data to the layer
     * @param {Object|Object[]} json - GeoJSON data
     * @return {maptalks.GeoJSONLayer} this
     */
    addData: function (json) {
        var geometries = this._parse(json);
        this.addGeometry(geometries);
        return this;
    },

    _parse: function (json) {
        json = maptalks.Util.parseJSON(json);
        return maptalks.Geometry.fromJSON(json);
    },

    /**
     * Export the GeoJSONLayer's profile json. <br>
     * @param  {Object} [options=null] - export options
     * @param  {Object} [options.geometries=null] - If not null and the layer is a [OverlayerLayer]{@link maptalks.OverlayLayer},
     *                                            the layer's geometries will be exported with the given "options.geometries" as a parameter of geometry's toJSON.
     * @param  {maptalks.Extent} [options.clipExtent=null] - if set, only the geometries intersectes with the extent will be exported.
     * @return {Object} layer's profile JSON
     */
    toJSON: function (options) {
        var profile = maptalks.VectorLayer.prototype.toJSON.call(this, options);
        profile['type'] = 'GeoJSONLayer';
        var json = [];
        if (profile['geometries']) {
            var g;
            for (var i = 0, len = profile['geometries'].length; i < len; i++) {
                g = profile['geometries'][i]['feature'];
                if (!g['id'] && !g['properties']) {
                    g = g['geometry'];
                }
                json.push(g);
            }
            delete profile['geometries'];
        }
        profile['geojson'] = json;
        return profile;
    }
});

/**
 * Reproduce a GeoJSONLayer from layer's profile JSON.
 * @param  {Object} layerJSON - layer's profile JSON
 * @return {maptalks.GeoJSONLayer}
 * @static
 * @private
 * @function
 */
maptalks.GeoJSONLayer.fromJSON = function (profile) {
    if (!profile || profile['type'] !== 'GeoJSONLayer') { return null; }
    var layer = new maptalks.GeoJSONLayer(profile['id'], profile['geojson'], profile['options']);
    if (profile['style']) {
        layer.setStyle(profile['style']);
    }
    return layer;
};

/**
 * CanvasLayer provides some interface methods for canvas context operations. <br>
 * You can use it directly, but can't ser/dser a CanvasLayer with json in this way. <br>
 * It is more recommended to extend it with a subclass and implement canvas paintings inside the subclass.
 * @classdesc
 * A layer with a HTML5 2D canvas context.
 * @example
 *  var layer = new maptalks.CanvasLayer('canvas');
 *
 *  layer.prepareToDraw = function (context) {
 *      var size = map.getSize();
 *      return [size.width, size.height]
 *  };
 *
 *  layer.draw = function (context, width, height) {
 *      context.fillStyle = "#f00";
 *      context.fillRect(0, 0, w, h);
 *  };
 *  layer.addTo(map);
 * @class
 * @category layer
 * @extends {maptalks.Layer}
 * @param {String|Number} id - layer's id
 * @param {Object} options - options defined in [options]{@link maptalks.CanvasLayer#options}
 */
maptalks.CanvasLayer = maptalks.Layer.extend(/** @lends maptalks.CanvasLayer.prototype */{

    options: {
        'doubleBuffer'  : false,
        'animation'     : false,
        'fps'           : 70
    },

    /**
     * An optional interface function called only once before the first draw, useful for preparing your canvas operations.
     * @param  {CanvasRenderingContext2D } context - CanvasRenderingContext2D of the layer canvas.
     * @return {Object[]} objects that will be passed to function draw(context, ..) as parameters.
     */
    prepareToDraw: function () {},

    /**
     * The required interface function to draw things on the layer canvas.
     * @param  {CanvasRenderingContext2D} context - CanvasRenderingContext2D of the layer canvas.
     * @param  {*} params.. - parameters returned by function prepareToDraw(context).
     */
    draw: function () {},

    play: function () {
        if (this._getRenderer()) {
            this._getRenderer().startAnim();
        }
        return this;
    },

    pause: function () {
        if (this._getRenderer()) {
            this._getRenderer().pauseAnim();
        }
        return this;
    },

    isPlaying : function () {
        if (this._getRenderer()) {
            return this._getRenderer().isPlaying();
        }
        return false;
    },

    clearCanvas: function () {
        if (this._getRenderer()) {
            this._getRenderer().clearCanvas();
        }
        return this;
    },

    /**
     * Ask the map to redraw the layer canvas without firing any event.
     * @return {maptalks.CanvasLayer} this
     */
    requestMapToRender: function () {
        if (this._getRenderer()) {
            this._getRenderer().requestMapToRender();
        }
        return this;
    },

    /**
     * Ask the map to redraw the layer canvas and fire layerload event
     * @return {maptalks.CanvasLayer} this
     */
    completeRender: function () {
        if (this._getRenderer()) {
            this._getRenderer().completeRender();
        }
        return this;
    },

    onCanvasCreate: function () {
        return this;
    },

    /**
     * The event callback for map's zoomstart event.
     * @param  {Object} param - event parameter
     */
    onZoomStart: function () {},

    /**
     * The event callback for map's zoomend event.
     * @param  {Object} param - event parameter
     */
    onZoomEnd: function () {},

    /**
     * The event callback for map's movestart event.
     * @param  {Object} param - event parameter
     */
    onMoveStart: function () {},

    /**
     * The event callback for map's moveend event.
     * @param  {Object} param - event parameter
     */
    onMoveEnd: function () {},

    /**
     * The event callback for map's resize event.
     * @param  {Object} param - event parameter
     */
    onResize: function () {},

    doubleBuffer: function (ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        return this;
    }

});

maptalks.CanvasLayer.registerRenderer('canvas', maptalks.renderer.Canvas.extend({

    onCanvasCreate: function () {
        if (this.canvas && this.layer.options['doubleBuffer']) {
            var map = this.getMap();
            this.buffer = maptalks.Canvas.createCanvas(this.canvas.width, this.canvas.height, map.CanvasClass);
        }
    },

    draw: function () {
        if (!this._predrawed) {
            this._drawContext = this.layer.prepareToDraw(this.context);
            if (!this._drawContext) {
                this._drawContext = [];
            }
            if (!Array.isArray(this._drawContext)) {
                this._drawContext = [this._drawContext];
            }
            this._predrawed = true;
        }
        this.prepareCanvas();
        this._drawLayer();
    },

    _drawLayer: function () {
        var args = [this.context];
        if (this._animTime) {
            args.push(maptalks.Util.now() - this._animTime);
        }
        args.push.apply(args, this._drawContext);
        this.layer.draw.apply(this.layer, args);
        this.completeRender();
        this._play();
    },

    getCanvasImage: function () {
        var canvasImg = maptalks.renderer.Canvas.prototype.getCanvasImage.apply(this, arguments);
        if (canvasImg && canvasImg.image && this.layer.options['doubleBuffer']) {
            var canvas = canvasImg.image;
            if (this.buffer.width !== canvas.width || this.buffer.height !== canvas.height) {
                this.buffer.width = canvas.width;
                this.buffer.height = canvas.height;
            }
            var bufferContext = this.buffer.getContext('2d');
            this.layer.doubleBuffer(bufferContext, this.context);
            bufferContext.drawImage(canvas, 0, 0);
            canvasImg.image = this.buffer;
        }
        return canvasImg;
    },

    startAnim: function () {
        this._animTime = maptalks.Util.now();
        this._paused = false;
        this._play();
    },

    pauseAnim: function () {
        this._pause();
        this._paused = true;
        delete this._animTime;
    },

    isPlaying : function () {
        return !maptalks.Util.isNil(this._frame);
    },

    hide: function () {
        this._pause();
        return maptalks.renderer.Canvas.prototype.hide.call(this);
    },

    show: function () {
        return maptalks.renderer.Canvas.prototype.show.call(this);
    },

    remove: function () {
        this._pause();
        delete this._drawContext;
        return maptalks.renderer.Canvas.prototype.remove.call(this);
    },

    onZoomStart: function (param) {
        this._pause();
        this.layer.onZoomStart(param);
        maptalks.renderer.Canvas.prototype.onZoomStart.call(this);
    },

    onZoomEnd: function (param) {
        this.layer.onZoomEnd(param);
        maptalks.renderer.Canvas.prototype.onZoomEnd.call(this);
    },

    onMoveStart: function (param) {
        this._pause();
        this.layer.onMoveStart(param);
        maptalks.renderer.Canvas.prototype.onMoveStart.call(this);
    },

    onMoveEnd: function (param) {
        this.layer.onMoveEnd(param);
        maptalks.renderer.Canvas.prototype.onMoveEnd.call(this);
    },

    onResize: function (param) {
        this.layer.onResize(param);
        maptalks.renderer.Canvas.prototype.onResize.call(this);
    },

    _pause : function () {
        if (this._frame) {
            maptalks.Util.cancelAnimFrame(this._frame);
            delete this._frame;
        }
        if (this._animTimeout) {
            clearTimeout(this._animTimeout);
            delete this._animTimeout;
        }
    },

    _play : function () {
        if (this._paused || !this.layer || !this.layer.options['animation']) {
            return;
        }
        if (!this._animTime) {
            this._animTime = maptalks.Util.now();
        }
        var frameFn = maptalks.Util.bind(this._drawLayer, this);
        this._pause();
        var fps = this.layer.options['fps'];
        if (fps >= 1000 / 16) {
            this._frame = maptalks.Util.requestAnimFrame(frameFn);
        } else {
            this._animTimeout = setTimeout(function () {
                if (maptalks.Browser.ie9) {
                    // ie9 doesn't support RAF
                    frameFn();
                    this._frame = 1;
                } else {
                    this._frame = maptalks.Util.requestAnimFrame(frameFn);
                }
            }.bind(this), 1000 / this.layer.options['fps']);
        }
    }
}));

/**
 * A Layer to render with THREE.JS (http://threejs.org), the most popular library for WebGL. <br>
 *
 * @classdesc
 * A layer to render with THREE.JS
 * @example
 *  var layer = new maptalks.ThreeLayer('three');
 *
 *  layer.prepareToDraw = function (context) {
 *      var size = map.getSize();
 *      return [size.width, size.height]
 *  };
 *
 *  layer.draw = function (context, width, height) {
 *      context.fillStyle = "#f00";
 *      context.fillRect(0, 0, w, h);
 *  };
 *  layer.addTo(map);
 * @class
 * @category layer
 * @extends {maptalks.Layer}
 * @param {String|Number} id - layer's id
 * @param {Object} options - options defined in [options]{@link maptalks.ThreeLayer#options}
 */
maptalks.ThreeLayer = maptalks.CanvasLayer.extend(/** @lends maptalks.ThreeLayer.prototype */{
    options: {
        'renderWhenPanning' : true,
        'camera'   : 'perspective', //orth, perspective
        'renderer' : 'webgl'
    },

    coordinateToVector: function (coordinate) {
        var map = this.getMap();
        if (!map) {
            return null;
        }
        return map.coordinateToPoint(coordinate, map.getMaxZoom());
    },

    distanceToVector: function (w, h) {
        var map = this.getMap();
        var scale = map.getScale();
        var size = map.distanceToPixel(w, h)._multi(scale);
        return new THREE.Vector2(size.width, size.height);
    },

    toShape: function (polygon) {
        if (!polygon) {
            return null;
        }
        var me = this;
        if (polygon instanceof maptalks.MultiPolygon) {
            return polygon.getGeometries().map(function (c) {
                return me.toShape(c);
            });
        }
        var center = polygon.getCenter();
        var centerPt = this.coordinateToVector(center);
        var shell = polygon.getShell();
        var outer = shell.map(function (c) {
            var p = me.coordinateToVector(c)._substract(centerPt);
            return new THREE.Vector2(p.x, p.y);
        });
        var shape = new THREE.Shape(outer);
        var holes = polygon.getHoles();

        if (holes && holes.length > 0) {
            shape.holes = holes.map(function (item) {
                var pts = item.map(function (c) {
                    var p = me.coordinateToVector(c)._substract(centerPt);
                    return new THREE.Vector2(p.x, p.y);
                });
                return new THREE.Shape(pts);
            });
        }

        return shape;
    },

    toExtrudeGeometry: function (polygon, amount, material) {
        if (!polygon) {
            return null;
        }
        var me = this;
        if (polygon instanceof maptalks.MultiPolygon) {
            return polygon.getGeometries().map(function (c) {
                return me.toExtrudeGeometry(c, amount, material);
            });
        }
        var shape = this.toShape(polygon);
        var center = this.coordinateToVector(polygon.getCenter());
        amount = this.distanceToVector(amount, amount).x;
        //{ amount: extrudeH, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };
        var geom = new THREE.ExtrudeGeometry(shape, {'amount': amount, 'bevelEnabled': true});
        var mesh = new THREE.Mesh(geom, material);
        // mesh.translateZ(-amount - 1);
        // mesh.translateX(center.x);
        // mesh.translateY(center.y);
        mesh.position.set(center.x, center.y, -amount);
        return mesh;
    },

    lookAt: function (vector) {
        var renderer = this._getRenderer();
        if (renderer) {
            renderer.context.lookAt(vector);
        }
        return this;
    },

    getCamera: function () {
        var renderer = this._getRenderer();
        if (renderer) {
            return renderer.camera;
        }
        return null;
    },

    getScene: function () {
        var renderer = this._getRenderer();
        if (renderer) {
            return renderer.scene;
        }
        return null;
    },

    renderScene: function () {
        var renderer = this._getRenderer();
        if (renderer) {
            return renderer.renderScene();
        }
        return this;
    },

    getThreeRenderer: function () {
        var renderer = this._getRenderer();
        if (renderer) {
            return renderer.context;
        }
        return null;
    }
});

(function () {

    var ThreeRenderer = maptalks.CanvasLayer.getRendererClass('canvas').extend({
        initialize: function (layer) {
            this.layer = layer;
        },

        hitDetect: function () {
            return false;
        },

        createCanvas: function () {
            if (this.canvas) {
                return;
            }
            var map = this.getMap();
            var size = map.getSize();
            var r = maptalks.Browser.retina ? 2 : 1;
            this.canvas = maptalks.Canvas.createCanvas(r * size['width'], r * size['height']);
            var renderer = this.layer.options['renderer'];
            var gl;
            if (renderer === 'webgl') {
                gl = new THREE.WebGLRenderer({
                    'canvas' : this.canvas,
                    'alpha' : true,
                    'preserveDrawingBuffer' : true
                });
                gl.autoClear = false;
                gl.clear();
            } else if (renderer === 'canvas') {
                gl = new THREE.CanvasRenderer({
                    'canvas' : this.canvas,
                    'alpha' : true
                });
            }
            gl.setSize(this.canvas.width, this.canvas.height);
            gl.setClearColor(new THREE.Color(1, 1, 1), 0);
            gl.canvas = this.canvas;
            this.context = gl;
            var maxScale = map.getScale(map.getMinZoom()) / map.getScale(map.getMaxZoom());
            // scene
            var scene = this.scene = new THREE.Scene();
            //TODO can be orth or perspective camera
            var camera = this.camera =  new THREE.PerspectiveCamera(90, size.width / size.height, 1, maxScale * 10000);
            this.onCanvasCreate();
            this.layer.onCanvasCreate(this.context, this.scene, this.camera);
            scene.add(camera);
        },

        resizeCanvas: function (canvasSize) {
            if (!this.canvas) {
                return;
            }
            var size;
            if (!canvasSize) {
                var map = this.getMap();
                size = map.getSize();
            } else {
                size = canvasSize;
            }
            var r = maptalks.Browser.retina ? 2 : 1;
            //retina support
            this.canvas.height = r * size['height'];
            this.canvas.width = r * size['width'];
            this.camera.aspect = this.canvas.width / this.canvas.height;
            this.camera.updateProjectionMatrix();
            this.context.setSize(this.canvas.width, this.canvas.height);
        },

        clearCanvas: function () {
            if (!this.canvas) {
                return;
            }

            this.context.clear();
        },

        prepareCanvas: function () {
            if (!this.canvas) {
                this.createCanvas();
            } else {
                this.clearCanvas();
            }
            this.layer.fire('renderstart', {'context' : this.context});
            return null;
        },

        draw: function () {
            this.prepareCanvas();
            if (!this._predrawed) {
                this._drawContext = this.layer.prepareToDraw(this.context, this.scene, this. camera);
                if (!this._drawContext) {
                    this._drawContext = [];
                }
                if (!Array.isArray(this._drawContext)) {
                    this._drawContext = [this._drawContext];
                }
                this._predrawed = true;
            }
            this._drawLayer();
        },

        _drawLayer: function () {
            this.layer.draw.apply(this.layer, [this.context, this.scene, this.camera].concat(this._drawContext));
            this.renderScene();
            this._play();
        },

        renderScene: function () {
            this._locateCamera();
            this.context.clear();
            this.context.render(this.scene, this.camera);
            this.completeRender();
        },

        remove: function () {
            delete this._drawContext;
            maptalks.renderer.Canvas.prototype.remove.call(this);
        },

        onZoomStart: function (param) {
            this.layer.onZoomStart(this.scene, this.camera, param);
            maptalks.renderer.Canvas.prototype.onZoomStart.call(this);
        },

        onZoomEnd: function (param) {
            this.layer.onZoomEnd(this.scene, this.camera, param);
            maptalks.renderer.Canvas.prototype.onZoomEnd.call(this);
        },

        onMoveStart: function (param) {
            this.layer.onMoveStart(this.scene, this.camera, param);
            maptalks.renderer.Canvas.prototype.onMoveStart.call(this);
        },

        onMoving: function () {
            if (this.layer.options['renderWhenPanning']) {
                this.prepareRender();
                this.draw();
            }
        },

        onMoveEnd: function (param) {
            this.layer.onMoveEnd(this.scene, this.camera, param);
            maptalks.renderer.Canvas.prototype.onMoveEnd.call(this);
        },

        onResize: function (param) {
            this.layer.onResize(this.scene, this.camera, param);
            maptalks.renderer.Canvas.prototype.onResize.call(this);
        },

        _locateCamera: function () {
            var map = this.getMap();
            var fullExtent = map.getFullExtent();
            var size = map.getSize();
            var scale = map.getScale();
            var camera = this.camera;
            var center = map.getCenter();
            var center2D = map.coordinateToPoint(center, map.getMaxZoom());
            var z = scale * size.height / 2;
            camera.position.set(center2D.x, center2D.y, -z);
            camera.up.set(0, (fullExtent['top'] >= fullExtent['bottom'] ? -1 : 1), 0);
            camera.lookAt(new THREE.Vector3(center2D.x, center2D.y, 0));
            this.camera.updateProjectionMatrix();
        }
    });

    maptalks.ThreeLayer.registerRenderer('canvas', ThreeRenderer);
    maptalks.ThreeLayer.registerRenderer('webgl', ThreeRenderer);

})();

/**
 * ParticleLayer provides some interface methods to render particles. <br>
 * You can use it directly, but can't ser/dser a ParticleLayer with json in this way. <br>
 * It is more recommended to extend it with a subclass.
 * @classdesc
 * A layer to draw particles.
 * @example
 *  var layer = new maptalks.ParticleLayer('particle');
 *
 *  layer.getParticles = function (t) {
 *      return particles[t];
 *  };
 *  layer.addTo(map);
 * @class
 * @category layer
 * @extends {maptalks.Layer}
 * @param {String|Number} id - layer's id
 * @param {Object} options - options defined in [options]{@link maptalks.CanvasLayer#options}
 */
maptalks.ParticleLayer = maptalks.CanvasLayer.extend({
    options : {
        'animation' : true,
        'fps' : 70
    },

    /**
     * Interface method to get particles's position at time t.
     * @param  {Number} t - current time in milliseconds
     */
    getParticles: function () {

    },

    draw: function (context) {
        var map = this.getMap(),
            extent = map.getContainerExtent();
        var points = this.getParticles(maptalks.Util.now());
        if (!points) {
            return;
        }
        var pos;
        for (var i = 0, l = points.length; i < l; i++) {
            pos = points[i].point;
            if (extent.contains(pos)) {
                if (context.fillStyle !== points[i].color) {
                    context.fillStyle = points[i].color || this.options['lineColor'] || '#fff';
                }
                context.fillRect(pos.x - points[i].r / 2, pos.y - points[i].r / 2, points[i].r, points[i].r);
            }
        }
        this._fillCanvas(context);
    },

    _fillCanvas: function (context) {
        var g = context.globalCompositeOperation;
        context.globalCompositeOperation = 'destination-out';
        var trail = this.options['trail'] || 30;
        context.fillStyle = 'rgba(0, 0, 0, ' + (1 / trail) + ')';
        context.fillRect(0, 0, context.canvas.width, context.canvas.height);
        context.globalCompositeOperation = g;
    }
});

/**
 * @namespace
 */
maptalks.ui = {};
/**
 * Some instance methods subclasses needs to implement:  <br>
 *  <br>
 * 1. Optional, returns the Dom element's position offset  <br>
 * function getOffset : maptalks.Point  <br>
 *  <br>
 * 2. Method to create UI's Dom element  <br>
 * function buildOn : HTMLElement  <br>
 *  <br>
 * 3 Optional, to provide an event map to register event listeners.  <br>
 * function getEvents : void  <br>
 * 4 Optional, a callback when dom is removed.  <br>
 * function onDomRemove : void  <br>
 * 5 Optional, a callback when UI Component is removed.  <br>
 * function onRemove : void  <br>
 * @classdesc
 * Base class for all the UI component classes, a UI component is a HTMLElement positioned with geographic coordinate. <br>
 * It is abstract and not intended to be instantiated.
 *
 * @class
 * @category ui
 * @abstract
 * @mixes maptalks.Eventable
 * @memberOf maptalks.ui
 * @name UIComponent
 */
maptalks.ui.UIComponent = maptalks.Class.extend(/** @lends maptalks.ui.UIComponent.prototype */{
    includes: [maptalks.Eventable],

    /**
     * @property {Object} options
     * @property {Boolean} [options.eventsToStop='mousedown dblclick']  - UI's dom events to stop propagation.
     * @property {Number}  [options.dx=0]     - pixel offset on x axis
     * @property {Number}  [options.dy=0]     - pixel offset on y axis
     * @property {Boolean} [options.autoPan=false]  - set it to false if you don't want the map to do panning animation to fit the opened UI.
     * @property {Boolean} [options.single=true]    - whether the UI is a global single one, only one UI will be shown at the same time if set to true.
     * @property {Boolean} [options.animation=null]         - fade | scale | fade,scale, add animation effect when showing and hiding.
     * @property {Number}  [options.animationDuration=300]  - animation duration, in milliseconds.
     * @property {Number}  [options.animationDelay=0]       - time delay for animation, in milliseconds.
     */
    options:{
        'eventsToStop' : 'mousedown dblclick',
        'dx'     : 0,
        'dy'     : 0,
        'autoPan' : false,
        'single' : true,
        'animation' : 'scale',
        'animationOnHide' : true,
        'animationDuration' : 500,
        'animationDelay' : 0
    },

    initialize: function (options) {
        maptalks.Util.setOptions(this, options);
    },

    /**
     * Adds the UI Component to a geometry or a map
     * @param {maptalks.Geometry|maptalks.Map} owner - geometry or map to addto.
     * @returns {maptalks.ui.UIComponent} this
     * @fires maptalks.ui.UIComponent#add
     */
    addTo:function (owner) {
        this._owner = owner;
        /**
         * add event.
         *
         * @event maptalks.ui.UIComponent#add
         * @type {Object}
         * @property {String} type - add
         * @property {maptalks.ui.UIComponent} target - UIComponent
         */
        this.fire('add');
        return this;
    },

    /**
     * Get the map it added to
     * @return {maptalks.Map} map instance
     * @override
     */
    getMap:function () {
        if (!this._owner) {
            return null;
        }
        if (this._owner instanceof maptalks.Map) {
            return this._owner;
        }
        return this._owner.getMap();
    },

    /**
     * Show the UI Component, if it is a global single one, it will close previous one.
     * @param {maptalks.Coordinate} coordinate - coordinate to show
     * @return {maptalks.ui.UIComponent} this
     * @fires maptalks.ui.UIComponent#showstart
     * @fires maptalks.ui.UIComponent#showend
     */
    show: function (coordinate) {
        var map = this.getMap();
        if (!map) {
            return this;
        }
        if (!coordinate) {
            if (this._coordinate) {
                coordinate = this._coordinate;
            } else {
                throw new Error('UI\'s show coordinate is invalid');
            }
        }
        /**
         * showstart event.
         *
         * @event maptalks.ui.UIComponent#showstart
         * @type {Object}
         * @property {String} type - showstart
         * @property {maptalks.ui.UIComponent} target - UIComponent
         */
        this.fire('showstart');
        var container = this._getUIContainer();
        if (!this.__uiDOM) {
            // first time
            this._switchEvents('on');
        }
        this._coordinate = coordinate;
        this._removePrevDOM();
        var dom = this.__uiDOM = this.buildOn(map);

        if (!dom) {
            /**
             * showend event.
             *
             * @event maptalks.ui.UIComponent#showend
             * @type {Object}
             * @property {String} type - showend
             * @property {maptalks.ui.UIComponent} target - UIComponent
             */
            this.fire('showend');
            return this;
        }

        this._measureSize(dom);

        if (this._singleton()) {
            map[this._uiDomKey()] = dom;
        }

        var point = this.getPosition();

        dom.style.position = 'absolute';
        dom.style.left = point.x + 'px';
        dom.style.top  = point.y + 'px';

        dom.style[maptalks.DomUtil.TRANSITION] = null;

        container.appendChild(dom);


        var anim = this._getAnimation();

        if (anim.fade) {
            dom.style.opacity = 0;
        }
        if (anim.scale) {
            if (this.getTransformOrigin) {
                var origin = this.getTransformOrigin();
                dom.style[maptalks.DomUtil.TRANSFORMORIGIN] = origin.x + 'px ' + origin.y + 'px';
            }
            dom.style[maptalks.DomUtil.TRANSFORM] = 'scale(0)';
        }

        dom.style.display = '';

        if (this.options['eventsToStop']) {
            maptalks.DomUtil.on(dom, this.options['eventsToStop'], maptalks.DomUtil.stopPropagation);
        }

        //autoPan
        if (this.options['autoPan']) {
            this._autoPan();
        }


        var transition = anim.transition;
        if (transition) {
            var animFn = function () {
                if (transition) {
                    dom.style[maptalks.DomUtil.TRANSITION] = transition;
                }
                if (anim.fade) {
                    dom.style.opacity = 1;
                }
                if (anim.scale) {
                    dom.style[maptalks.DomUtil.TRANSFORM] = 'scale(1)';
                }
            };
            if (this.options['animationDelay']) {
                setTimeout(animFn, this.options['animationDelay']);
            } else {
                animFn();
            }
        }

        this.fire('showend');
        return this;
    },

    /**
     * Hide the UI Component.
     * @return {maptalks.ui.UIComponent} this
     * @fires maptalks.ui.UIComponent#hide
     */
    hide:function () {
        if (!this.getDOM() || !this.getMap()) {
            return this;
        }

        var anim = this._getAnimation(),
            dom = this.getDOM();
        if (!this.options['animationOnHide']) {
            anim.anim = false;
        }
        if (anim.fade) {
            dom.style.opacity = 0;
        }
        if (anim.scale) {
            dom.style[maptalks.DomUtil.TRANSFORM] = 'scale(0)';
        }

        if (!anim.anim) {
            dom.style.display = 'none';
        } else {
            setTimeout(function () {
                dom.style.display = 'none';
            }, this.options['animationDuration']);
        }

        /**
         * hide event.
         *
         * @event maptalks.ui.UIComponent#hide
         * @type {Object}
         * @property {String} type - hide
         * @property {maptalks.ui.UIComponent} target - UIComponent
         */
        this.fire('hide');
        return this;
    },

    /**
     * Decide whether the ui component is open
     * @returns {Boolean} true|false
     */
    isVisible:function () {
        return this.getDOM() && this.getDOM().style.display !== 'none';
    },

    /**
     * Remove the UI Component
     * @return {maptalks.ui.UIComponent} this
     * @fires maptalks.ui.UIComponent#hide
     * @fires maptalks.ui.UIComponent#remove
     */
    remove: function () {
        if (!this._owner) {
            return this;
        }
        this.hide();
        this._switchEvents('off');
        if (this.onRemove) {
            this.onRemove();
        }
        if (!this._singleton() && this.__uiDOM) {
            this._removePrevDOM();
        }
        delete this._owner;
        /**
         * remove event.
         *
         * @event maptalks.ui.UIComponent#remove
         * @type {Object}
         * @property {String} type - remove
         * @property {maptalks.ui.UIComponent} target - UIComponent
         */
        this.fire('remove');
        return this;
    },

    /**
     * Get pixel size of the UI Component.
     * @return {maptalks.Size} size
     */
    getSize:function () {
        if (this._size) {
            return this._size.copy();
        } else {
            return null;
        }
    },

    getOwner: function () {
        return this._owner;
    },

    getDOM : function () {
        return this.__uiDOM;
    },

    getPosition : function () {
        if (!this.getMap()) {
            return null;
        }
        var p = this._getViewPoint();
        if (this.getOffset) {
            var o = this.getOffset();
            if (o) { p._add(o); }
        }
        return p;
    },

    _getAnimation: function () {
        var anim = {
            'fade' : false,
            'scale': false
        };
        var animations = this.options['animation'] ? this.options['animation'].split(',') : [];
        for (var i = 0; i < animations.length; i++) {
            var trim = maptalks.StringUtil.trim(animations[i]);
            if (trim === 'fade') {
                anim.fade = true;
            } else if (trim === 'scale') {
                anim.scale = true;
            }
        }
        var transition = null;
        if (anim.fade) {
            transition = 'opacity ' + this.options['animationDuration'] + 'ms';
        }
        if (anim.scale) {
            transition = transition ? transition + ',' : '';
            transition += 'transform ' + this.options['animationDuration'] + 'ms';
        }
        anim.transition = transition;
        anim.anim = (transition !== null);
        return anim;
    },

    _getViewPoint : function () {
        return this.getMap().coordinateToViewPoint(this._coordinate)
                    ._add(this.options['dx'], this.options['dy']);
    },

    _autoPan : function () {
        var map = this.getMap(),
            dom = this.getDOM();
        if (map._moving || map._panAnimating) {
            return;
        }
        var point = new maptalks.Point(parseInt(dom.style.left), parseInt(dom.style.top));
        var mapSize = map.getSize(),
            mapWidth = mapSize['width'],
            mapHeight = mapSize['height'];

        var containerPoint = map.viewPointToContainerPoint(point);
        var clientWidth = parseInt(dom.clientWidth),
            clientHeight = parseInt(dom.clientHeight);
        var left = 0, top = 0;
        if ((containerPoint.x) < 0) {
            left = -(containerPoint.x - clientWidth / 2);
        } else if ((containerPoint.x + clientWidth - 35) > mapWidth) {
            left = (mapWidth - (containerPoint.x + clientWidth * 3 / 2));
        }
        if (containerPoint.y < 0) {
            top = -containerPoint.y + 50;
        } else if (containerPoint.y > mapHeight) {
            top = (mapHeight - containerPoint.y - clientHeight) - 30;
        }
        if (top !== 0 || left !== 0) {
            map._panAnimation(new maptalks.Point(left, top), 600);
        }
    },

    /**
     * Measure dom's size
     * @param  {HTMLElement} dom - element to measure
     * @return {maptalks.Size} size
     * @private
     */
    _measureSize:function (dom) {
        var container = this._getUIContainer();
        dom.style.position = 'absolute';
        dom.style.left = -99999 + 'px';
        dom.style.top = -99999 + 'px';
        dom.style.display = '';
        container.appendChild(dom);
        this._size = new maptalks.Size(dom.clientWidth, dom.clientHeight);
        dom.style.display = 'none';
        return this._size;
    },

    /**
     * Remove previous UI DOM if it has.
     *
     * @private
     */
    _removePrevDOM:function () {
        if (this.onDomRemove) {
            this.onDomRemove();
        }
        if (this._singleton()) {
            var map = this.getMap(),
                key = this._uiDomKey();
            if (map[key]) {
                maptalks.DomUtil.removeDomNode(map[key]);
                delete map[key];
            }
            delete this.__uiDOM;
        } else if (this.__uiDOM) {
            maptalks.DomUtil.removeDomNode(this.__uiDOM);
            delete this.__uiDOM;
        }
    },

    /**
     * generate the cache key to store the singletong UI DOM
     * @private
     * @return {String} cache key
     */
    _uiDomKey:function () {
        return '__ui_' + this._getClassName();
    },

    _singleton:function () {
        return this.options['single'];
    },

    _getUIContainer : function () {
        return this.getMap()._panels['ui'];
    },

    _getClassName:function () {
        for (var p in maptalks.ui) {
            if (maptalks.ui.hasOwnProperty(p)) {
                if (p === 'UIComponent') {
                    continue;
                }
                if (this instanceof (maptalks.ui[p])) {
                    return p;
                }
            }
        }
        return null;
    },

    _switchEvents: function (to) {
        var events = this._getDefaultEvents();
        if (this.getEvents) {
            maptalks.Util.extend(events, this.getEvents());
        }
        var p;
        if (events) {
            var map = this.getMap();
            for (p in events) {
                if (events.hasOwnProperty(p)) {
                    map[to](p, events[p], this);
                }
            }
        }
        var ownerEvents = this._getOwnerEvents();
        if (this._owner && ownerEvents) {
            for (p in ownerEvents) {
                if (ownerEvents.hasOwnProperty(p)) {
                    this._owner[to](p, ownerEvents[p], this);
                }
            }
        }
    },

    _getDefaultEvents: function () {
        return {
            'zooming' : this.onZooming,
            'zoomend' : this.onZoomEnd
        };
    },

    _getOwnerEvents: function () {
        if (this._owner && (this._owner instanceof maptalks.Geometry)) {
            return {
                'positionchange' : this.onGeometryPositionChange
            };
        }
        return null;
    },

    onGeometryPositionChange: function (param) {
        if (this._owner && this.getDOM() && this.isVisible()) {
            this.show(param['target'].getCenter());
        }
    },

    onZooming : function (param) {
        if (!this.isVisible() || !this.getDOM() || !this.getMap()) {
            return;
        }
        var dom = this.getDOM(),
            point = this.getMap().coordinateToViewPoint(this._coordinate),
            matrix = param['matrix']['view'];
        var p = matrix.applyToPointInstance(point)._add(this.options['dx'], this.options['dy']);
        if (this.getOffset) {
            var o = this.getOffset();
            if (o) { p._add(o); }
        }
        dom.style.left = p.x + 'px';
        dom.style.top  = p.y + 'px';
    },

    onZoomEnd : function () {
        if (!this.isVisible() || !this.getDOM() || !this.getMap()) {
            return;
        }
        var dom = this.getDOM(),
            p = this.getPosition();
        dom.style.left = p.x + 'px';
        dom.style.top  = p.y + 'px';
    }
});

/**
 * As it's renderered by HTMLElement such as a DIV, it: <br>
 * 1. always on the top of all the map layers <br>
 * 2. can't be snapped as it's not drawn on the canvas. <br>
 *
 * @classdesc
 * Class for UI Marker, a html based marker positioned by geographic coordinate. <br>
 *
 * @class
 * @category ui
 * @extends maptalks.ui.UIComponent
 * @param {Object} options - options defined in [maptalks.ui.UIMarker]{@link maptalks.ui.UIMarker#options}
 * @memberOf maptalks.ui
 * @name UIMarker
 * @example
 * var dom = document.createElement('div');
 * dom.innerHTML = 'hello ui marker';
 * var marker = new maptalks.ui.UIMarker([0, 0], {
 *      draggable : true,
 *      content : dom
 *  }).addTo(map);
 */
maptalks.ui.UIMarker = maptalks.ui.UIComponent.extend(/** @lends maptalks.ui.UIMarker.prototype */{

    includes: [maptalks.Handlerable],

    /**
     * @property {Object} options - construct options
     * @property {Boolean} [options.draggable=false]  - if the marker can be dragged.
     * @property {Number}  [options.single=false]     - if the marker is a global single one.
     * @property {String|HTMLElement}  options.content - content of the marker, can be a string type HTML code or a HTMLElement.
     */
    options : {
        'draggable': false,
        'single' : false,
        'content' : null
    },

    initialize: function (coordinate, options) {
        this._markerCoord = new maptalks.Coordinate(coordinate);
        maptalks.Util.setOptions(this, options);
    },

    /**
     * Sets the coordinates
     * @param {maptalks.Coordinate} coordinates - UIMarker's coordinate
     * @returns {maptalks.ui.UIMarker} this
     * @fires maptalks.ui.UIMarker#positionchange
     */
    setCoordinates: function (coordinates) {
        this._markerCoord = coordinates;
        /**
         * positionchange event.
         *
         * @event maptalks.ui.UIMarker#positionchange
         * @type {Object}
         * @property {String} type - positionchange
         * @property {maptalks.ui.UIMarker} target - ui marker
         */
        this.fire('positionchange');
        if (this.isVisible()) {
            this.show();
        }
        return this;
    },

    /**
     * Gets the coordinates
     * @return {maptalks.Coordinate} coordinates
     */
    getCoordinates: function () {
        return this._markerCoord;
    },

    /**
     * Sets the content of the UIMarker
     * @param {String|HTMLElement} content - UIMarker's content
     * @returns {maptalks.ui.UIMarker} this
     * @fires maptalks.ui.UIMarker#contentchange
     */
    setContent: function (content) {
        var old = this.options['content'];
        this.options['content'] = content;
        /**
         * contentchange event.
         *
         * @event maptalks.ui.UIMarker#contentchange
         * @type {Object}
         * @property {String} type - contentchange
         * @property {maptalks.ui.UIMarker} target - ui marker
         * @property {String|HTMLElement} old      - old content
         * @property {String|HTMLElement} new      - new content
         */
        this.fire('contentchange', {'old' : old, 'new' : content});
        if (this.isVisible()) {
            this.show();
        }
        return this;
    },

    /**
     * Gets the content of the UIMarker
     * @return {String|HTMLElement} content
     */
    getContent: function () {
        return this.options['content'];
    },

    /**
     * Show the UIMarker
     * @returns {maptalks.ui.UIMarker} this
     * @fires maptalks.ui.UIMarker#showstart
     * @fires maptalks.ui.UIMarker#showend
     */
    show: function () {
        return maptalks.ui.UIComponent.prototype.show.call(this, this._markerCoord);
    },

    /**
     * A callback method to build UIMarker's HTMLElement
     * @protected
     * @param {maptalks.Map} map - map to be built on
     * @return {HTMLElement} UIMarker's HTMLElement
     */
    buildOn: function () {
        var dom;
        if (maptalks.Util.isString(this.options['content'])) {
            dom = maptalks.DomUtil.createEl('div');
            dom.innerHTML = this.options['content'];
        } else {
            dom = this.options['content'];
        }
        this._registerDOMEvents(dom);
        return dom;
    },

    /**
     * Gets UIMarker's HTMLElement's position offset, it's caculated dynamically accordiing to its actual size.
     * @protected
     * @return {maptalks.Point} offset
     */
    getOffset: function () {
        var size = this.getSize();
        return new maptalks.Point(-size['width'] / 2, -size['height'] / 2);
    },

    /**
     * Gets UIMarker's transform origin for animation transform
     * @protected
     * @return {maptalks.Point} transform origin
     */
    getTransformOrigin: function () {
        var size = this.getSize();
        return new maptalks.Point(size['width'] / 2, size['height'] / 2);
    },

    onDomRemove: function () {
        var dom = this.getDOM();
        this._removeDOMEvents(dom);
    },

    _domEvents : /**
                  * mousedown event
                  * @event maptalks.ui.UIMarker#mousedown
                  * @type {Object}
                  * @property {String} type                    - mousedown
                  * @property {maptalks.ui.UIMarker} target    - the uimarker fires event
                  * @property {maptalks.Coordinate} coordinate - coordinate of the event
                  * @property {maptalks.Point} containerPoint  - container point of the event
                  * @property {maptalks.Point} viewPoint       - view point of the event
                  * @property {Event} domEvent                 - dom event
                  */
                 'mousedown ' +
                 /**
                  * mouseup event
                  * @event maptalks.ui.UIMarker#mouseup
                  * @type {Object}
                  * @property {String} type                    - mouseup
                  * @property {maptalks.ui.UIMarker} target    - the uimarker fires event
                  * @property {maptalks.Coordinate} coordinate - coordinate of the event
                  * @property {maptalks.Point} containerPoint  - container point of the event
                  * @property {maptalks.Point} viewPoint       - view point of the event
                  * @property {Event} domEvent                 - dom event
                  */
                 'mouseup ' +
                 /**
                  * mouseover event
                  * @event maptalks.ui.UIMarker#mouseover
                  * @type {Object}
                  * @property {String} type                    - mouseover
                  * @property {maptalks.ui.UIMarker} target    - the uimarker fires event
                  * @property {maptalks.Coordinate} coordinate - coordinate of the event
                  * @property {maptalks.Point} containerPoint  - container point of the event
                  * @property {maptalks.Point} viewPoint       - view point of the event
                  * @property {Event} domEvent                 - dom event
                  */
                 'mouseover ' +
                 /**
                  * mouseout event
                  * @event maptalks.ui.UIMarker#mouseout
                  * @type {Object}
                  * @property {String} type                    - mouseout
                  * @property {maptalks.ui.UIMarker} target    - the uimarker fires event
                  * @property {maptalks.Coordinate} coordinate - coordinate of the event
                  * @property {maptalks.Point} containerPoint  - container point of the event
                  * @property {maptalks.Point} viewPoint       - view point of the event
                  * @property {Event} domEvent                 - dom event
                  */
                 'mouseout ' +
                 /**
                  * mousemove event
                  * @event maptalks.ui.UIMarker#mousemove
                  * @type {Object}
                  * @property {String} type                    - mousemove
                  * @property {maptalks.ui.UIMarker} target    - the uimarker fires event
                  * @property {maptalks.Coordinate} coordinate - coordinate of the event
                  * @property {maptalks.Point} containerPoint  - container point of the event
                  * @property {maptalks.Point} viewPoint       - view point of the event
                  * @property {Event} domEvent                 - dom event
                  */
                 'mousemove ' +
                 /**
                  * click event
                  * @event maptalks.ui.UIMarker#click
                  * @type {Object}
                  * @property {String} type                    - click
                  * @property {maptalks.ui.UIMarker} target    - the uimarker fires event
                  * @property {maptalks.Coordinate} coordinate - coordinate of the event
                  * @property {maptalks.Point} containerPoint  - container point of the event
                  * @property {maptalks.Point} viewPoint       - view point of the event
                  * @property {Event} domEvent                 - dom event
                  */
                 'click ' +
                 /**
                  * dblclick event
                  * @event maptalks.ui.UIMarker#dblclick
                  * @type {Object}
                  * @property {String} type                    - dblclick
                  * @property {maptalks.ui.UIMarker} target    - the uimarker fires event
                  * @property {maptalks.Coordinate} coordinate - coordinate of the event
                  * @property {maptalks.Point} containerPoint  - container point of the event
                  * @property {maptalks.Point} viewPoint       - view point of the event
                  * @property {Event} domEvent                 - dom event
                  */
                 'dblclick ' +
                 /**
                  * contextmenu event
                  * @event maptalks.ui.UIMarker#contextmenu
                  * @type {Object}
                  * @property {String} type                    - contextmenu
                  * @property {maptalks.ui.UIMarker} target    - the uimarker fires event
                  * @property {maptalks.Coordinate} coordinate - coordinate of the event
                  * @property {maptalks.Point} containerPoint  - container point of the event
                  * @property {maptalks.Point} viewPoint       - view point of the event
                  * @property {Event} domEvent                 - dom event
                  */
                 'contextmenu ' +
                 /**
                  * keypress event
                  * @event maptalks.ui.UIMarker#keypress
                  * @type {Object}
                  * @property {String} type                    - keypress
                  * @property {maptalks.ui.UIMarker} target    - the uimarker fires event
                  * @property {maptalks.Coordinate} coordinate - coordinate of the event
                  * @property {maptalks.Point} containerPoint  - container point of the event
                  * @property {maptalks.Point} viewPoint       - view point of the event
                  * @property {Event} domEvent                 - dom event
                  */
                 'keypress ' +
                 /**
                  * touchstart event
                  * @event maptalks.ui.UIMarker#touchstart
                  * @type {Object}
                  * @property {String} type                    - touchstart
                  * @property {maptalks.ui.UIMarker} target    - the uimarker fires event
                  * @property {maptalks.Coordinate} coordinate - coordinate of the event
                  * @property {maptalks.Point} containerPoint  - container point of the event
                  * @property {maptalks.Point} viewPoint       - view point of the event
                  * @property {Event} domEvent                 - dom event
                  */
                 'touchstart ' +
                 /**
                  * touchmove event
                  * @event maptalks.ui.UIMarker#touchmove
                  * @type {Object}
                  * @property {String} type                    - touchmove
                  * @property {maptalks.ui.UIMarker} target    - the uimarker fires event
                  * @property {maptalks.Coordinate} coordinate - coordinate of the event
                  * @property {maptalks.Point} containerPoint  - container point of the event
                  * @property {maptalks.Point} viewPoint       - view point of the event
                  * @property {Event} domEvent                 - dom event
                  */
                 'touchmove ' +
                 /**
                  * touchend event
                  * @event maptalks.ui.UIMarker#touchend
                  * @type {Object}
                  * @property {String} type                    - touchend
                  * @property {maptalks.ui.UIMarker} target    - the uimarker fires event
                  * @property {maptalks.Coordinate} coordinate - coordinate of the event
                  * @property {maptalks.Point} containerPoint  - container point of the event
                  * @property {maptalks.Point} viewPoint       - view point of the event
                  * @property {Event} domEvent                 - dom event
                  */
                 'touchend',

    _registerDOMEvents: function (dom) {
        maptalks.DomUtil.on(dom, this._domEvents, this._onDomEvents, this);
    },

    _onDomEvents: function (e) {
        var event = this.getMap()._parseEvent(e, e.type);
        this.fire(e.type, event);
    },

    _removeDOMEvents: function (dom) {
        maptalks.DomUtil.off(dom, this._domEvents, this._onDomEvents, this);
    }

});

/**
 * Drag handler for maptalks.ui.UIMarker.
 * @class
 * @category handler
 * @protected
 * @extends {maptalks.Handler}
 */
maptalks.ui.UIMarker.Drag = maptalks.Handler.extend(/** @lends maptalks.ui.UIMarker.Drag.prototype */{

    START: maptalks.Browser.touch ? ['touchstart', 'mousedown'] : ['mousedown'],

    addHooks: function () {
        this.target.on(this.START.join(' '), this._startDrag, this);

    },

    removeHooks: function () {
        this.target.off(this.START.join(' '), this._startDrag, this);
    },

    _startDrag: function (param) {
        var domEvent = param['domEvent'];
        if (domEvent.touches && domEvent.touches.length > 1) {
            return;
        }
        if (this.isDragging()) {
            return;
        }
        this.target.on('click', this._endDrag, this);
        this._lastPos = param['coordinate'];

        this._prepareDragHandler();
        this._dragHandler.onMouseDown(param['domEvent']);
        /**
         * drag start event
         * @event maptalks.ui.UIMarker#dragstart
         * @type {Object}
         * @property {String} type                    - dragstart
         * @property {maptalks.ui.UIMarker} target    - the uimarker fires event
         * @property {maptalks.Coordinate} coordinate - coordinate of the event
         * @property {maptalks.Point} containerPoint  - container point of the event
         * @property {maptalks.Point} viewPoint       - view point of the event
         * @property {Event} domEvent                 - dom event
         */
        this.target.fire('dragstart', param);
    },

    _prepareDragHandler:function () {
        this._dragHandler = new maptalks.Handler.Drag(this.target.getDOM(), {
            'cancelOn' : maptalks.Util.bind(this._cancelOn, this)
        });
        this._dragHandler.on('mousedown', this._onMouseDown, this);
        this._dragHandler.on('dragging', this._dragging, this);
        this._dragHandler.on('mouseup', this._endDrag, this);
        this._dragHandler.enable();
    },

    _cancelOn: function (domEvent) {
        var target = domEvent.srcElement || domEvent.target,
            tagName = target.tagName.toLowerCase();
        if (tagName === 'button' ||
            tagName === 'input' ||
            tagName === 'select' ||
            tagName === 'option' ||
            tagName === 'textarea') {
            return true;
        }
        return false;
    },

    _onMouseDown: function (param) {
        maptalks.DomUtil.stopPropagation(param['domEvent']);
    },

    _dragging: function (param) {
        var target = this.target,
            map = target.getMap(),
            eventParam = map._parseEvent(param['domEvent']),
            domEvent = eventParam['domEvent'];
        if (domEvent.touches && domEvent.touches.length > 1) {
            return;
        }
        if (!this._isDragging) {
            this._isDragging = true;
            return;
        }
        var currentPos = eventParam['coordinate'];
        if (!this._lastPos) {
            this._lastPos = currentPos;
        }
        var dragOffset = currentPos.substract(this._lastPos);
        this._lastPos = currentPos;
        this.target.setCoordinates(this.target.getCoordinates().add(dragOffset));
        eventParam['dragOffset'] = dragOffset;

        /**
         * dragging event
         * @event maptalks.ui.UIMarker#dragging
         * @type {Object}
         * @property {String} type                    - dragging
         * @property {maptalks.ui.UIMarker} target    - the uimarker fires event
         * @property {maptalks.Coordinate} coordinate - coordinate of the event
         * @property {maptalks.Point} containerPoint  - container point of the event
         * @property {maptalks.Point} viewPoint       - view point of the event
         * @property {Event} domEvent                 - dom event
         */
        target.fire('dragging', eventParam);

    },

    _endDrag: function (param) {
        var target = this.target,
            map = target.getMap();
        if (this._dragHandler) {
            target.off('click', this._endDrag, this);
            this._dragHandler.disable();
            delete this._dragHandler;
        }
        delete this._lastPos;
        this._isDragging = false;
        if (!map) {
            return;
        }
        var eventParam = map._parseEvent(param['domEvent']);
        /**
         * dragend event
         * @event maptalks.ui.UIMarker#dragend
         * @type {Object}
         * @property {String} type                    - dragend
         * @property {maptalks.ui.UIMarker} target    - the uimarker fires event
         * @property {maptalks.Coordinate} coordinate - coordinate of the event
         * @property {maptalks.Point} containerPoint  - container point of the event
         * @property {maptalks.Point} viewPoint       - view point of the event
         * @property {Event} domEvent                 - dom event
         */
        target.fire('dragend', eventParam);

    },

    isDragging:function () {
        if (!this._isDragging) {
            return false;
        }
        return true;
    }
});

maptalks.ui.UIMarker.addInitHook('addHandler', 'draggable', maptalks.ui.UIMarker.Drag);

maptalks.ui.UIMarker.include(/** @lends maptalks.ui.UIMarker.prototype */{
    /**
     * Whether the uimarker is being dragged.
     * @returns {Boolean}
     */
    isDragging: function () {
        if (this['draggable']) {
            return this['draggable'].isDragging();
        }
        return false;
    }
});

/**
 * @classdesc
 * Class for info window, a popup on the map to display any useful infomation you wanted.
 * @class
 * @category ui
 * @extends maptalks.ui.UIComponent
 * @param {Object} options - options defined in [maptalks.ui.InfoWindow]{@link maptalks.ui.InfoWindow#options}
 * @memberOf maptalks.ui
 * @name InfoWindow
 */
maptalks.ui.InfoWindow = maptalks.ui.UIComponent.extend(/** @lends maptalks.ui.InfoWindow.prototype */{

    /**
     * @property {Object} options
     * @property {Boolean} [options.autoPan=true]  - set it to false if you don't want the map to do panning animation to fit the opened window.
     * @property {Number}  [options.width=300]     - default width
     * @property {Number}  [options.minHeight=120] - minimun height
     * @property {Boolean} [options.custom=false]  - set it to true if you want a customized infowindow, customized html codes or a HTMLElement is set to content.
     * @property {String}  [options.title=null]    - title of the infowindow.
     * @property {String|HTMLElement}  options.content - content of the infowindow.
     */
    options: {
        'autoPan'   : true,
        'width'     : 300,
        'minHeight' : 120,
        'custom'    : false,
        'title'     : null,
        'content'   : null
    },

    /**
     * Adds the UI Component to a geometry or a map
     * @param {maptalks.Geometry|maptalks.Map} owner - geometry or map to addto.
     * @returns {maptalks.ui.UIComponent} this
     * @fires maptalks.ui.UIComponent#add
     */
    addTo:function (owner) {
        if (owner instanceof maptalks.Geometry) {
            if (owner.getInfoWindow() && owner.getInfoWindow() !== this) {
                owner.removeInfoWindow();
            }
            owner._infoWindow = this;
        }
        return maptalks.ui.UIComponent.prototype.addTo.apply(this, arguments);
    },

    /**
     * Set the content of the infowindow.
     * @param {String|HTMLElement} content - content of the infowindow.
     * return {maptalks.ui.InfoWindow} this
     * @fires maptalks.ui.InfoWindow#contentchange
     */
    setContent:function (content) {
        var old = this.options['content'];
        this.options['content'] = content;
        /**
         * contentchange event.
         *
         * @event maptalks.ui.InfoWindow#contentchange
         * @type {Object}
         * @property {String} type - contentchange
         * @property {maptalks.ui.InfoWindow} target - InfoWindow
         * @property {String|HTMLElement} old      - old content
         * @property {String|HTMLElement} new      - new content
         */
        this.fire('contentchange', {'old' : old, 'new' : content});
        if (this.isVisible()) {
            this.show(this._coordinate);
        }
        return this;
    },

    /**
     * Get content of  the infowindow.
     * @return {String|HTMLElement} - content of the infowindow
     */
    getContent:function () {
        return this.options['content'];
    },

    /**
     * Set the title of the infowindow.
     * @param {String|HTMLElement} title - title of the infowindow.
     * return {maptalks.ui.InfoWindow} this
     * @fires maptalks.ui.InfoWindow#titlechange
     */
    setTitle:function (title) {
        var old = title;
        this.options['title'] = title;
        /**
         * titlechange event.
         *
         * @event maptalks.ui.InfoWindow#titlechange
         * @type {Object}
         * @property {String} type - titlechange
         * @property {maptalks.ui.InfoWindow} target - InfoWindow
         * @property {String} old      - old content
         * @property {String} new      - new content
         */
        this.fire('contentchange', {'old' : old, 'new' : title});
        if (this.isVisible()) {
            this.show(this._coordinate);
        }
        return this;
    },

    /**
     * Get title of  the infowindow.
     * @return {String|HTMLElement} - content of the infowindow
     */
    getTitle:function () {
        return this.options['title'];
    },

    buildOn: function () {
        var dom;
        if (this.options['custom']) {
            if (maptalks.Util.isString(this.options['content'])) {
                dom = maptalks.DomUtil.createEl('div');
                dom.innerHTML = this.options['content'];
                return dom;
            } else {
                return this.options['content'];
            }
        } else {
            dom = maptalks.DomUtil.createEl('div');
            dom.className = 'maptalks-msgBox';
            dom.style.width = this._getWindowWidth() + 'px';
            var content = '<em class="maptalks-ico"></em>';
            if (this.options['title']) {
                content += '<h2>' + this.options['title'] + '</h2>';
            }
            content += '<a href="javascript:void(0);" onclick="this.parentNode.style.display=\'none\';return false;" ' +
            ' class="maptalks-close"></a><div class="maptalks-msgContent">' + this.options['content'] + '</div>';
            dom.innerHTML = content;
            return dom;
        }
    },

    /**
     * Gets InfoWindow's transform origin for animation transform
     * @protected
     * @return {maptalks.Point} transform origin
     */
    getTransformOrigin: function () {
        var size = this.getSize();
        var o = new maptalks.Point(size['width'] / 2, size['height']);
        if (!this.options['custom']) {
            o._add(4, 12);
        }
        return o;
    },

    getOffset:function () {
        var size = this.getSize();
        var o = new maptalks.Point(-size['width'] / 2, -size['height']);
        if (!this.options['custom']) {
            o._substract(4, 12);
        }
        if (this.getOwner() instanceof maptalks.Marker) {
            var markerSize = this.getOwner().getSize();
            if (markerSize) {
                o._add(0,  -markerSize['height']);
            }
        }
        return o;
    },

    show: function () {
        if (!this.getMap()) {
            return this;
        }
        if (!this.getMap().options['enableInfoWindow']) {
            return this;
        }
        return maptalks.ui.UIComponent.prototype.show.apply(this, arguments);
    },

    _getWindowWidth:function () {
        var defaultWidth = 300;
        var width = this.options['width'];
        if (!width) {
            width = defaultWidth;
        }
        return width;
    }
});

(function () {
    var defaultOptions = {
        'animation' : null,
        'animationDelay' : 10,
        'animationOnHide' : false,
        'eventsToStop' : 'mousedown dblclick click',
        'autoPan': false,
        'width'  : 160,
        'custom' : false,
        'items'  : []
    };

    /**
     * Menu items is set to options.items or by setItems method. <br>
     * <br>
     * Normally items is a object array, containing: <br>
     * 1. item object: {'item': 'This is a menu text', 'click': function() {alert('oops! You clicked!');)}} <br>
     * 2. minus string "-", which will draw a splitor line on the menu. <br>
     * <br>
     * If options.custom is set to true, the menu is considered as a customized one. Then items is the customized html codes or HTMLElement. <br>
     *
     * @classdesc
     * Class for context menu, useful for interactions with right clicks on the map.
     * @class
     * @category ui
     * @extends maptalks.ui.UIComponent
     * @param {Object} options - options defined in [maptalks.ui.Menu]{@link maptalks.ui.Menu#options}
     * @memberOf maptalks.ui
     * @name Menu
     */
    maptalks.ui.Menu = maptalks.ui.UIComponent.extend(/** @lends maptalks.ui.Menu.prototype */{

        /**
         * @property {Object} options
         * @property {Boolean} [options.autoPan=false]  - set it to false if you don't want the map to do panning animation to fit the opened menu.
         * @property {Number}  [options.width=160]      - default width
         * @property {String|HTMLElement} [options.custom=false]  - set it to true if you want a customized menu, customized html codes or a HTMLElement is set to items.
         * @property {Object[]|String|HTMLElement}  options.items   - html code or a html element is options.custom is true. Or a menu items array, containing: item objects, "-" as a splitor line
         */
        options: defaultOptions,

        addTo:function (owner) {
            if (owner._menu && owner._menu !== this) {
                owner.removeMenu();
            }
            owner._menu = this;
            return maptalks.ui.UIComponent.prototype.addTo.apply(this, arguments);
        },

        /**
         * Set the items of the menu.
         * @param {Object[]|String|HTMLElement} items - items of the menu
         * return {maptalks.ui.Menu} this
         * @example
         * menu.setItems([
         *      //return false to prevent event propagation
         *     {'item': 'Query', 'click': function() {alert('Query Clicked!'); return false;}},
         *     '-',
         *     {'item': 'Edit', 'click': function() {alert('Edit Clicked!')}},
         *     {'item': 'About', 'click': function() {alert('About Clicked!')}}
         * ]);
         */
        setItems: function (items) {
            this.options['items'] = items;
            return this;
        },

        /**
         * Get items of  the menu.
         * @return {Object[]|String|HTMLElement} - items of the menu
         */
        getItems:function () {
            return this.options['items'];
        },

        /**
         * Create the menu DOM.
         * @protected
         * @return {HTMLElement} menu's DOM
         */
        buildOn:function () {
            if (this.options['custom']) {
                if (maptalks.Util.isString(this.options['items'])) {
                    var container = maptalks.DomUtil.createEl('div');
                    container.innerHTML = this.options['items'];
                    return container;
                } else {
                    return this.options['items'];
                }
            } else {
                var dom = maptalks.DomUtil.createEl('div');
                maptalks.DomUtil.addClass(dom, 'maptalks-menu');
                dom.style.width = this._getMenuWidth() + 'px';
                /*var arrow = maptalks.DomUtil.createEl('em');
                maptalks.DomUtil.addClass(arrow, 'maptalks-ico');*/
                var menuItems = this._createMenuItemDom();
                // dom.appendChild(arrow);
                dom.appendChild(menuItems);
                return dom;
            }
        },

        /**
         * Offset of the menu DOM to fit the click position.
         * @return {maptalks.Point} offset
         * @private
         */
        getOffset:function () {
            if (!this.getMap()) {
                return null;
            }
            var mapSize = this.getMap().getSize(),
                p = this.getMap().viewPointToContainerPoint(this._getViewPoint()),
                size = this.getSize();
            var dx = 0, dy = 0;
            if (p.x + size['width'] > mapSize['width']) {
                dx = -size['width'];
            }
            if (p.y + size['height'] > mapSize['height']) {
                dy = -size['height'];
            }
            return new maptalks.Point(dx, dy);
        },

        getTransformOrigin: function () {
            return this.getOffset()._multi(-1);
        },

        getEvents: function () {
            return {
                '_zoomstart _zoomend _movestart _dblclick _click' : this.hide
            };
        },

        _createMenuItemDom: function () {
            var me = this;
            var map = this.getMap();
            var ul = maptalks.DomUtil.createEl('ul');
            maptalks.DomUtil.addClass(ul, 'maptalks-menu-items');
            var items = this.getItems();
            function onMenuClick(index) {
                return function (e) {
                    var param = map._parseEvent(e, 'click');
                    param['target'] = me;
                    param['owner']  = me._owner;
                    param['index']  = index;
                    var result = this._callback(param);
                    if (result === false) {
                        return;
                    }
                    me.hide();
                };
            }
            var item, itemDOM;
            for (var i = 0, len = items.length; i < len; i++) {
                item = items[i];
                if (item === '-' || item === '_') {
                    itemDOM = maptalks.DomUtil.createEl('li');
                    maptalks.DomUtil.addClass(itemDOM, 'maptalks-menu-splitter');
                } else {
                    itemDOM = maptalks.DomUtil.createEl('li');
                    var itemTitle = item['item'];
                    if (maptalks.Util.isFunction(itemTitle)) {
                        itemTitle = itemTitle({'owner' : this._owner, 'index' : i});
                    }
                    itemDOM.innerHTML = itemTitle;
                    itemDOM._callback = item['click'];
                    maptalks.DomUtil.on(itemDOM, 'click', (onMenuClick)(i));
                }
                ul.appendChild(itemDOM);
            }
            return ul;
        },

        _getMenuWidth:function () {
            var defaultWidth = 160;
            var width = this.options['width'];
            if (!width) {
                width = defaultWidth;
            }
            return width;
        }
    });

    /**
     * Mixin of the context menu methods.
     * @mixin
     * @memberOf maptalks.ui
     * @name Menu.Mixin
     */
    maptalks.ui.Menu.Mixin = {
        /**
        * Set a context menu
        * @param {Object} options - menu options
        * @return {*} this
        * @example
        * foo.setMenu({
        *  'width'  : 160,
        *  'custom' : false,
        *  'items' : [
        *      //return false to prevent event propagation
        *     {'item': 'Query', 'click': function() {alert('Query Clicked!'); return false;}},
        *     '-',
        *     {'item': 'Edit', 'click': function() {alert('Edit Clicked!')}},
        *     {'item': 'About', 'click': function() {alert('About Clicked!')}}
        *    ]
        *});
        */
        setMenu: function (options) {
            this._menuOptions = options;

            if (this._menu) {
                maptalks.Util.setOptions(this._menu, maptalks.Util.extend(defaultOptions, options));
            } else {
                this.on('contextmenu', this._defaultOpenMenu, this);
            }
            return this;
        },

        /**
        * Open the context menu, default on the center of the geometry or map.
        * @param {maptalks.Coordinate} [coordinate=null] - coordinate to open the context menu
        * @return {*} this
        */
        openMenu: function (coordinate) {
            var map = (this instanceof maptalks.Map) ? this : this.getMap();
            if (!coordinate) {
                coordinate = this.getCenter();
            }
            if (!this._menu) {
                if (this._menuOptions && map) {
                    this._bindMenu(this._menuOptions);
                    this._menu.show(coordinate);
                }
            } else {
                this._menu.show(coordinate);
            }
            return this;
        },

        /**
        * Set menu items to the context menu
        * @param {Object[]} items - menu items
        * @return {*} this
        */
        setMenuItems: function (items) {
            if (!this._menuOptions) {
                this._menuOptions = {};
            }
            if (maptalks.Util.isArray(items)) {
                this._menuOptions['custom'] = false;
            }
            this._menuOptions['items'] = items;
            this.setMenu(this._menuOptions);
            return this;
        },

        /**
         * Get the context menu items
         * @return {Object[]}
         */
        getMenuItems:function () {
            if (this._menu) {
                return this._menu.getItems();
            } else if (this._menuOptions) {
                return this._menuOptions['items'];
            }
            return null;
        },

        /**
        * Close the contexnt menu
        * @return {*} this
        */
        closeMenu: function () {
            if (this._menu) {
                this._menu.hide();
            }
            return this;
        },

        /**
         * Remove the context menu
         * @return {*} this
         */
        removeMenu:function () {
            this.off('contextmenu', this._defaultOpenMenu, this);
            this._unbindMenu();
            delete this._menuOptions;
            return this;
        },

        _bindMenu: function (options) {
            this._menu = new maptalks.ui.Menu(options);
            this._menu.addTo(this);

            return this;
        },

        _unbindMenu:function () {
            if (this._menu) {
                this.closeMenu();
                this._menu.remove();
                delete this._menu;
            }
            return this;
        },

         /**
         * 应用没有注册contextmenu事件时, 默认在contextmenu事件时打开右键菜单
         * 如果注册过contextmenu事件, 则不做任何操作
         * @param  {Object} param - event parameter
         * @return {Boolean} true | false to stop event propagation
         * @private
         */
        _defaultOpenMenu:function (param) {
            if (this.listens('contextmenu') > 1) {
                return true;
            } else {
                this.openMenu(param['coordinate']);
                return false;
            }
        }
    };
})();

maptalks.Map.include(maptalks.ui.Menu.Mixin);

maptalks.Geometry.include(maptalks.ui.Menu.Mixin);

maptalks.Geometry.include(/** @lends maptalks.Geometry.prototype */{
    /**
     * Set an InfoWindow to the geometry
     * @param {Object} options - construct [options]{@link maptalks.ui.InfoWindow#options} for the InfoWindow
     * @return {maptalks.Geometry} this
     * @example
     * geometry.setInfoWindow({
     *     title    : 'This is a title',
     *     content  : '<div style="color:#f00">This is content of the InfoWindow</div>'
     * });
     */
    setInfoWindow:function (options) {
        this._infoWinOptions = maptalks.Util.extend({}, options);
        if (this._infoWindow) {
            maptalks.Util.setOptions(this._infoWindow, options);
        } else if (this.getMap()) {
            this._bindInfoWindow(this._infoWinOptions);
        }

        return this;
    },

    /**
     * Get the InfoWindow instance.
     * @return {maptalks.ui.InfoWindow}
     */
    getInfoWindow:function () {
        if (!this._infoWindow) {
            return null;
        }
        return this._infoWindow;
    },

    /**
     * Open the InfoWindow, default on the center of the geometry.
     * @param  {maptalks.Coordinate} [coordinate=null] - coordinate to open the InfoWindow
     * @return {maptalks.Geometry} this
     */
    openInfoWindow:function (coordinate) {
        if (!this.getMap()) {
            return this;
        }
        if (!coordinate) {
            coordinate = this.getCenter();
        }
        if (!this._infoWindow) {
            if (this._infoWinOptions && this.getMap()) {
                this._bindInfoWindow(this._infoWinOptions);
                this._infoWindow.show(coordinate);
            }
        } else {
            this._infoWindow.show(coordinate);
        }
        return this;
    },

    /**
     * Close the InfoWindow
     * @return {maptalks.Geometry} this
     */
    closeInfoWindow:function () {
        if (this._infoWindow) {
            this._infoWindow.hide();
        }
        return this;
    },

    /**
     * Remove the InfoWindow
     * @return {maptalks.Geometry} this
     */
    removeInfoWindow:function () {
        this._unbindInfoWindow();
        delete this._infoWinOptions;
        delete this._infoWindow;
        return this;
    },

    _bindInfoWindow: function (options) {
        this._infoWindow = new maptalks.ui.InfoWindow(options);
        this._infoWindow.addTo(this);

        return this;
    },

    _unbindInfoWindow:function () {
        if (this._infoWindow) {
            this.closeInfoWindow();
            this._infoWindow.remove();
            delete this._infoWindow;
        }
        return this;
    }

});

/**
 * @namespace
 */
maptalks.control = {};

/**
 * Base class for all the map controls, you can extend it to build your own customized Control.
 * It is abstract and not intended to be instantiated.
 * @class
 * @category control
 * @abstract
 * @extends maptalks.Class
 * @memberOf maptalks.control
 * @name  Control
 *
 * @mixes maptalks.Eventable
 */
maptalks.control.Control = maptalks.Class.extend(/** @lends maptalks.control.Control.prototype */{
    includes: [maptalks.Eventable],

    statics : {
        'positions' : {
            'top-left' : {'top': '20', 'left': '20'},
            'top-right' : {'top': '40', 'right': '60'},
            'bottom-left' : {'bottom': '20', 'left': '60'},
            'bottom-right' : {'bottom': '20', 'right': '60'}
        }
    },

    initialize: function (options) {
        if (options && options['position'] && !maptalks.Util.isString(options['position'])) {
            options['position'] = maptalks.Util.extend({}, options['position']);
        }
        maptalks.Util.setOptions(this, options);
    },

    /**
     * Adds the control to a map.
     * @param {maptalks.Map} map
     * @returns {maptalks.control.Control} this
     * @fires maptalks.control.Control#add
     */
    addTo: function (map) {
        this.remove();
        this._map = map;
        var controlContainer = map._panels.control;
        this.__ctrlContainer = maptalks.DomUtil.createEl('div');
        maptalks.DomUtil.setStyle(this.__ctrlContainer, 'position:absolute');
        maptalks.DomUtil.addStyle(this.__ctrlContainer, 'z-index', controlContainer.style.zIndex);
        // maptalks.DomUtil.on(this.__ctrlContainer, 'mousedown mousemove click dblclick contextmenu', maptalks.DomUtil.stopPropagation)
        this.update();
        controlContainer.appendChild(this.__ctrlContainer);
        /**
         * add event.
         *
         * @event maptalks.control.Control#add
         * @type {Object}
         * @property {String} type - add
         * @property {maptalks.control.Control} target - the control instance
         */
        this.fire('add', {'dom' : controlContainer});
        return this;
    },

    /**
     * update control container
     * @return {maptalks.control.Control} this
     */
    update: function () {
        this.__ctrlContainer.innerHTML = '';
        this._controlDom = this.buildOn(this.getMap());
        if (this._controlDom) {
            this._updatePosition();
            this.__ctrlContainer.appendChild(this._controlDom);
        }
        return this;
    },

    /**
     * Get the map that the control is added to.
     * @return {maptalks.Map}
     */
    getMap:function () {
        return this._map;
    },

    /**
     * Get the position of the control
     * @return {Object}
     */
    getPosition: function () {
        return maptalks.Util.extend({}, this._parse(this.options['position']));
    },

    /**
     * update the control's position
     * @param {String|Object} position - can be one of 'top-left', 'top-right', 'bottom-left', 'bottom-right' or a position object like {'top': 40,'left': 60}
     * @return {maptalks.control.Control} this
     * @fires maptalks.control.Control#positionchange
     */
    setPosition: function (position) {
        if (maptalks.Util.isString(position)) {
            this.options['position'] = position;
        } else {
            this.options['position'] = maptalks.Util.extend({}, position);
        }
        this._updatePosition();
        return this;
    },

    /**
     * Get the container point of the control.
     * @return {maptalks.Point}
     */
    getContainerPoint:function () {
        var position = this.getPosition();

        var size = this.getMap().getSize();
        var x, y;
        if (!maptalks.Util.isNil(position['top'])) {
            x = position['top'];
        } else if (!maptalks.Util.isNil(position['bottom'])) {
            x = size['height'] - position['bottom'];
        }
        if (!maptalks.Util.isNil(position['left'])) {
            y = position['left'];
        } else if (!maptalks.Util.isNil(position['right'])) {
            y = size['width'] - position['right'];
        }
        return new maptalks.Point(x, y);
    },

    /**
     * Get the control's container.
     * Container is a div element wrapping the control's dom and decides the control's position and display.
     * @return {HTMLElement}
     */
    getContainer: function () {
        return this.__ctrlContainer;
    },

    /**
     * Get html dom element of the control
     * @return {HTMLElement}
     */
    getDOM: function () {
        return this._controlDom;
    },

    /**
     * Show
     * @return {maptalks.control.Control} this
     */
    show: function () {
        this.__ctrlContainer.style.display = '';
        return this;
    },

    /**
     * Hide
     * @return {maptalks.control.Control} this
     */
    hide: function () {
        this.__ctrlContainer.style.display = 'none';
        return this;
    },

    /**
     * Whether the control is visible
     * @return {Boolean}
     */
    isVisible:function () {
        return (this.__ctrlContainer && this.__ctrlContainer.style.display === '');
    },

    /**
     * Remove itself from the map
     * @return {maptalks.control.Control} this
     * @fires maptalks.control.Control#remove
     */
    remove: function () {
        if (!this._map) {
            return this;
        }
        maptalks.DomUtil.removeDomNode(this.__ctrlContainer);
        if (this.onRemove) {
            this.onRemove();
        }
        delete this._map;
        delete this.__ctrlContainer;
        delete this._controlDom;
        /**
         * remove event.
         *
         * @event maptalks.control.Control#remove
         * @type {Object}
         * @property {String} type - remove
         * @property {maptalks.control.Control} target - the control instance
         */
        this.fire('remove');
        return this;
    },

    _parse: function (position) {
        var p = position;
        if (maptalks.Util.isString(position)) {
            p = maptalks.control.Control['positions'][p];
        }
        return p;
    },

    _updatePosition: function () {
        var position = this.getPosition();
        if (!position) {
            //default one
            position = {'top': 20, 'left': 20};
        }
        for (var p in position) {
            if (position.hasOwnProperty(p)) {
                position[p] = parseInt(position[p]);
                this.__ctrlContainer.style[p] = position[p] + 'px';
            }
        }
        /**
         * Control's position update event.
         *
         * @event maptalks.control.Control#positionchange
         * @type {Object}
         * @property {String} type - positionchange
         * @property {maptalks.control.Control} target - the control instance
         * @property {Object} position - Position of the control, eg:{"top" : 100, "left" : 50}
         */
        this.fire('positionchange', {
            'position' : maptalks.Util.extend({}, position)
        });
    }

});

maptalks.Map.mergeOptions({

    'control' : true
});

maptalks.Map.include(/** @lends maptalks.Map.prototype */{
    /**
     * Add a control on the map.
     * @param {maptalks.control.Control} control - contorl to add
     * @return {maptalks.Map} this
     */
    addControl: function (control) {
        //map container is a canvas, can't add control on it.
        if (!this.options['control'] || this._containerDOM.getContext) {
            return this;
        }
        control.addTo(this);
        return this;
    },

    /**
     * Remove a control from the map.
     * @param {maptalks.control.Control} control - control to remove
     * @return {maptalks.Map} this
     */
    removeControl: function (control) {
        if (!control || control.getMap() !== this) {
            return this;
        }
        control.remove();
        return this;
    }

});

/**
 * @classdesc
 * A zoom control with buttons to zoomin/zoomout and a slider indicator for the zoom level.
 * @class
 * @category control
 * @extends maptalks.control.Control
 * @memberOf maptalks.control
 * @name Zoom
 * @param {Object} [options=null] - options defined in [maptalks.control.Zoom]{@link maptalks.control.Zoom#options}
 * @example
 * var zoomControl = new maptalks.control.Zoom({
 *     position : 'top-left',
 *     slider : true,
 *     zoomLevel : false
 * }).addTo(map);
 */
maptalks.control.Zoom = maptalks.control.Control.extend(/** @lends maptalks.control.Zoom.prototype */{

    /**
     * @property {Object}   options - options
     * @property {String|Object}   [options.position="top-left"]  - position of the zoom control.
     * @property {Boolean}  [options.slider=true]                         - Whether to display the slider
     * @property {Boolean}  [options.zoomLevel=true]                      - Whether to display the text box of zoom level
     */
    options:{
        'position'  : 'top-left',
        'slider'    : true,
        'zoomLevel' : true
    },

    buildOn: function (map) {
        this._map = map;
        var options = this.options;

        var dom = maptalks.DomUtil.createEl('div', 'maptalks-zoom');

        if (options['zoomLevel']) {
            var levelDOM = maptalks.DomUtil.createEl('span', 'maptalks-zoom-zoomlevel');
            dom.appendChild(levelDOM);
            this._levelDOM = levelDOM;
        }

        var zoomDOM = maptalks.DomUtil.createEl('div', 'maptalks-zoom-slider');

        var zoomInButton = maptalks.DomUtil.createEl('a', 'maptalks-zoom-zoomin');
        zoomInButton.href = 'javascript:;';
        zoomInButton.innerHTML = '+';
        zoomDOM.appendChild(zoomInButton);
        this._zoomInButton = zoomInButton;

        if (options['slider']) {
            var sliderDOM = maptalks.DomUtil.createEl('div', 'maptalks-zoom-slider-box');
            var ruler = maptalks.DomUtil.createEl('div', 'maptalks-zoom-slider-ruler');
            var reading = maptalks.DomUtil.createEl('span', 'maptalks-zoom-slider-reading');
            var dot = maptalks.DomUtil.createEl('span', 'maptalks-zoom-slider-dot');
            ruler.appendChild(reading);
            ruler.appendChild(dot);
            sliderDOM.appendChild(ruler);
            zoomDOM.appendChild(sliderDOM);
            this._sliderBox = sliderDOM;
            this._sliderRuler = ruler;
            this._sliderReading = reading;
            this._sliderDot = dot;
        }

        var zoomOutButton = maptalks.DomUtil.createEl('a', 'maptalks-zoom-zoomout');
        zoomOutButton.href = 'javascript:;';
        zoomOutButton.innerHTML = '-';
        zoomDOM.appendChild(zoomOutButton);
        this._zoomOutButton = zoomOutButton;

        dom.appendChild(zoomDOM);

        map.on('_zoomend _zoomstart _viewchange', this._update, this);

        this._update();
        this._registerDomEvents();

        return dom;
    },

    _update:function () {
        var map = this.getMap();
        if (this._sliderBox) {
            var pxUnit = 10;
            var totalRange = (map.getMaxZoom() - map.getMinZoom()) * pxUnit;
            this._sliderBox.style.height = totalRange + 6 + 'px';
            this._sliderRuler.style.height = totalRange + 'px';
            var zoomRange = (map.getZoom() - map.getMinZoom()) * pxUnit;
            this._sliderReading.style.height = zoomRange + 'px';
            this._sliderDot.style.bottom = zoomRange + 'px';
        }
        if (this._levelDOM) {
            this._levelDOM.innerHTML = map.getZoom();
        }
    },

    _registerDomEvents:function () {
        var map = this.getMap();
        if (this._zoomInButton) {
            maptalks.DomUtil.on(this._zoomInButton, 'click', map.zoomIn, map);
        }
        if (this._zoomOutButton) {
            maptalks.DomUtil.on(this._zoomOutButton, 'click', map.zoomOut, map);
        }
        //TODO slider dot拖放缩放逻辑还没有实现
    },

    onRemove: function () {
        var map = this.getMap();
        if (this._zoomInButton) {
            maptalks.DomUtil.off(this._zoomInButton, 'click', map.zoomIn, map);
        }
        if (this._zoomOutButton) {
            maptalks.DomUtil.off(this._zoomOutButton, 'click', map.zoomOut, map);
        }
    }
});

maptalks.Map.mergeOptions({
    'zoomControl': false
});

maptalks.Map.addOnLoadHook(function () {
    if (this.options['zoomControl']) {
        this.zoomControl = new maptalks.control.Zoom(this.options['zoomControl']);
        this.addControl(this.zoomControl);
    }
});

/**
 * @classdesc
 * A control to allows to display attribution content in a small text box on the map.
 * @class
 * @category control
 * @extends maptalks.control.Control
 * @memberOf maptalks.control
 * @name Attribution
 * @param {Object} [options=null] - options defined in [maptalks.control.Attribution]{@link maptalks.control.Attribution#options}
 * @example
 * var attribution = new maptalks.control.Attribution({
 *     position : 'bottom-left',
 *     content : 'hello maptalks'
 * }).addTo(map);
 */
maptalks.control.Attribution = maptalks.control.Control.extend(/** @lends maptalks.control.Attribution.prototype */{

    /**
     * @property {Object} options - options
     * @property {Object} [options.position='bottom-left'] - position of the control
     * @property {String} [options.content='Powered By <a href="http://www.maptalks.org" target="_blank">MapTalks</a>']  - content of the attribution control, HTML format
     */
    options:{
        'position' : 'bottom-left',
        'content' : 'Powered By <a href="http://www.maptalks.org" target="_blank">MapTalks</a>'
    },

    buildOn: function () {
        this._attributionContainer = maptalks.DomUtil.createEl('div', 'maptalks-attribution');
        this._update();
        return this._attributionContainer;
    },

    /**
     * Set content of the attribution
     * @param {String} content - attribution content
     * @return {maptalks.control.Attribution} this
     */
    setContent: function (content) {
        this.options['content'] = content;
        this._update();
        return this;
    },

    _update: function () {
        if (!this.getMap()) { return; }
        this._attributionContainer.innerHTML = this.options['content'];
    }
});

maptalks.Map.mergeOptions({

    'attributionControl' : false
});

maptalks.Map.addOnLoadHook(function () {
    if (this.options['attributionControl']) {
        this.attributionControl = new maptalks.control.Attribution(this.options['attributionControl']);
        this.addControl(this.attributionControl);
    }
});

/**
 * @classdesc
 * Based on the implementation in Leaflet, a simple scale control that shows the scale of the current center of screen in metric (m/km) and imperial (mi/ft) systems.
 * @class
 * @category control
 * @extends maptalks.control.Control
 * @memberOf maptalks.control
 * @name Scale
 * @param {Object} [options=null] - options defined in [maptalks.control.Scale]{@link maptalks.control.Scale#options}
 * @example
 * var scale = new maptalks.control.Scale({
 *     position : 'bottom-left',
 *     maxWidth : 160,
 *     metric : true,
 *     imperial : true
 * }).addTo(map);
 */
maptalks.control.Scale = maptalks.control.Control.extend(/** @lends maptalks.control.Scale.prototype */{

    /**
     * @property {Object} [options=null] - options
     * @property {String|Object}   [options.position="bottom-left"]  - position of the scale control.
     * @property {Number} [options.maxWidth=100]               - max width of the scale control.
     * @property {Boolean} [options.metric=true]               - Whether to show the metric scale line (m/km).
     * @property {Boolean} [options.imperial=false]            - Whether to show the imperial scale line (mi/ft).
     */
    options:{
        'position' : 'bottom-left',
        'maxWidth': 100,
        'metric': true,
        'imperial': false
    },

    buildOn: function (map) {
        this._map = map;
        this._scaleContainer = maptalks.DomUtil.createEl('div');
        this._addScales();
        map.on('zoomend', this._update, this);
        if (this._map._loaded) {
            this._update();
        }
        return this._scaleContainer;
    },

    onRemove: function () {
        this.getMap().off('zoomend', this._update, this);
    },

    _addScales: function () {
        var css = 'border: 2px solid #000000;border-top: none;line-height: 1.1;padding: 2px 5px 1px;' +
                          'color: #000000;font-size: 11px;text-align:center;white-space: nowrap;overflow: hidden' +
                          ';-moz-box-sizing: content-box;box-sizing: content-box;background: #fff; background: rgba(255, 255, 255, 0);';
        if (this.options['metric']) {
            this._mScale = maptalks.DomUtil.createElOn('div', css, this._scaleContainer);
        }
        if (this.options['imperial']) {
            this._iScale = maptalks.DomUtil.createElOn('div', css, this._scaleContainer);
        }
    },

    _update: function () {
        var map = this._map;
        var maxMeters = map.pixelToDistance(this.options['maxWidth'], 0);
        this._updateScales(maxMeters);
    },

    _updateScales: function (maxMeters) {
        if (this.options['metric'] && maxMeters) {
            this._updateMetric(maxMeters);
        }
        if (this.options['imperial'] && maxMeters) {
            this._updateImperial(maxMeters);
        }
    },

    _updateMetric: function (maxMeters) {
        var meters = this._getRoundNum(maxMeters),
            label = meters < 1000 ? meters + ' m' : (meters / 1000) + ' km';

        this._updateScale(this._mScale, label, meters / maxMeters);
    },

    _updateImperial: function (maxMeters) {
        var maxFeet = maxMeters * 3.2808399,
            maxMiles, miles, feet;

        if (maxFeet > 5280) {
            maxMiles = maxFeet / 5280;
            miles = this._getRoundNum(maxMiles);
            this._updateScale(this._iScale, miles + ' mile', miles / maxMiles);

        } else {
            feet = this._getRoundNum(maxFeet);
            this._updateScale(this._iScale, feet + ' feet', feet / maxFeet);
        }
    },

    _updateScale: function (scale, text, ratio) {
        scale['style']['width'] = Math.round(this.options['maxWidth'] * ratio) + 'px';
        scale['innerHTML'] = text;
    },

    _getRoundNum: function (num) {
        var pow10 = Math.pow(10, (Math.floor(num) + '').length - 1),
            d = num / pow10;

        d = d >= 10 ? 10 :
            d >= 5 ? 5 :
            d >= 3 ? 3 :
            d >= 2 ? 2 : 1;

        return pow10 * d;
    }
});

maptalks.Map.mergeOptions({
    'scaleControl' : false
});

maptalks.Map.addOnLoadHook(function () {
    if (this.options['scaleControl']) {
        this.scaleControl = new maptalks.control.Scale(this.options['scaleControl']);
        this.addControl(this.scaleControl);
    }
});

/**
 * @classdesc
 * Class for panel controls.
 * @class
 * @category control
 * @extends maptalks.control.Control
 * @memberOf maptalks.control
 * @name Panel
 * @param {Object} [options=null] - options defined in [maptalks.control.Panel]{@link maptalks.control.Panel#options}
 * @example
 * var panel = new maptalks.control.Panel({
 *     position : {'bottom': '0', 'right': '0'},
 *     draggable : true,
 *     custom : false,
 *     content : '<div class="map-panel">hello maptalks.</div>',
 *     closeButton : true
 * }).addTo(map);
 */
maptalks.control.Panel = maptalks.control.Control.extend(/** @lends maptalks.control.Panel.prototype */{

    /**
     * @property {Object} options - options
     * @property {Object} [options.position='top-right']       - position of the control
     * @property {Boolean} [options.draggable=true]            - whether the panel can be dragged
     * @property {Boolean} [options.custom=false]              - whether the panel's content is customized .
     * @property {String|HTMLElement} options.content          - panel's content, can be a dom element or a string.
     * @property {Boolean} [options.closeButton=true]          - whether to display the close button on the panel.
     */
    options:{
        'position'      : 'top-right',
        'draggable'     : true,
        'custom'        : false,
        'content'       : '',
        'closeButton'   : true
    },

    buildOn: function () {
        var dom;
        if (this.options['custom']) {
            if (maptalks.Util.isString(this.options['content'])) {
                dom = maptalks.DomUtil.createEl('div');
                dom.innerHTML = this.options['content'];
            } else {
                dom = this.options['content'];
            }
        } else {
            dom = maptalks.DomUtil.createEl('div', 'maptalks-panel');
            if (this.options['closeButton']) {
                var closeButton = maptalks.DomUtil.createEl('a', 'maptalks-close');
                closeButton.href = 'javascript:;';
                closeButton.onclick = function () {
                    dom.style.display = 'none';
                };
                dom.appendChild(closeButton);
            }

            var panelContent = maptalks.DomUtil.createEl('div', 'maptalks-panel-content');
            panelContent.innerHTML = this.options['content'];
            dom.appendChild(panelContent);
        }

        this.draggable = new maptalks.Handler.Drag(dom, {
            'cancelOn' : maptalks.Util.bind(this._cancelOn, this)
        });

        this.draggable.on('dragstart', this._onDragStart, this)
            .on('dragging', this._onDragging, this)
            .on('dragend', this._onDragEnd, this);

        if (this.options['draggable']) {
            this.draggable.enable();
        }

        return dom;
    },

    /**
     * update control container
     * @return {maptalks.control.Panel} this
     */
    update: function () {
        if (this.draggable) {
            this.draggable.disable();
            delete this.draggable;
        }
        return maptalks.control.Control.prototype.update.call(this);
    },

    /**
     * Set the content of the Panel.
     * @param {String|HTMLElement} content - content of the infowindow.
     * return {maptalks.control.Panel} this
     * @fires maptalks.control.Panel#contentchange
     */
    setContent:function (content) {
        var old = this.options['content'];
        this.options['content'] = content;
        /**
         * contentchange event.
         *
         * @event maptalks.control.Panel#contentchange
         * @type {Object}
         * @property {String} type - contentchange
         * @property {maptalks.control.Panel} target - Panel
         * @property {String|HTMLElement} old      - old content
         * @property {String|HTMLElement} new      - new content
         */
        this.fire('contentchange', {'old' : old, 'new' : content});
        if (this.isVisible()) {
            this.update();
        }
        return this;
    },

    /**
     * Get content of  the infowindow.
     * @return {String|HTMLElement} - content of the infowindow
     */
    getContent:function () {
        return this.options['content'];
    },

    _cancelOn: function (domEvent) {
        var target = domEvent.srcElement || domEvent.target,
            tagName = target.tagName.toLowerCase();
        if (tagName === 'button' ||
            tagName === 'input' ||
            tagName === 'select' ||
            tagName === 'option' ||
            tagName === 'textarea') {
            return true;
        }
        return false;
    },

    _onDragStart:function (param) {
        this._startPos = param['mousePos'];
        this._startPosition = maptalks.Util.extend({}, this.getPosition());
    },

    _onDragging:function (param) {
        var pos = param['mousePos'];
        var offset = pos.substract(this._startPos);

        var startPosition = this._startPosition;
        var position = this.getPosition();
        if (!maptalks.Util.isNil(position['top'])) {
            position['top'] = +startPosition['top'] + offset.y;
        }
        if (!maptalks.Util.isNil(position['bottom'])) {
            position['bottom'] = +startPosition['bottom'] - offset.y;
        }
        if (!maptalks.Util.isNil(position['left'])) {
            position['left'] = +startPosition['left'] + offset.x;
        }
        if (!maptalks.Util.isNil(position['right'])) {
            position['right'] = +startPosition['right'] - offset.x;
        }
        this.setPosition(position);
    },

    _onDragEnd:function () {
        delete this._startPos;
        delete this._startPosition;
    },

    /**
     * Get the connect points of panel for connector lines.
     * @private
     */
    _getConnectPoints: function () {
        var map = this._map;
        var containerPoint = this.getContainerPoint();
        var dom = this.getDOM(),
            width = dom.clientWidth,
            height = dom.clientHeight;

        var anchors = [
            //top center
            map.containerPointToCoordinate(
                containerPoint.add(new maptalks.Point(Math.round(width / 2), 0))
            ),
            //middle right
            map.containerPointToCoordinate(
                containerPoint.add(new maptalks.Point(width, Math.round(height / 2)))
            ),
            //bottom center
            map.containerPointToCoordinate(
                containerPoint.add(new maptalks.Point(Math.round(width / 2), height))
            ),
            //middle left
            map.containerPointToCoordinate(
                containerPoint.add(new maptalks.Point(0, Math.round(height / 2)))
            )

        ];
        return anchors;
    }

});

/**
 * @classdesc
 * A toolbar control of the map.
 * @class
 * @category control
 * @extends maptalks.control.Control
 * @memberOf maptalks.control
 * @name Toolbar
 * @param {Object} [options=null] - options defined in [maptalks.control.Toolbar]{@link maptalks.control.Toolbar#options}
 * @example
 * var toolbar = new maptalks.control.Toolbar({
 *     position : 'top-right',
 *     items: [
 *          {
 *            item: 'item1',
 *            click: function () {
 *              alert('item1 clicked');
 *            }
 *          },
 *          {
 *            item: 'item2',
 *            click: function () {
 *              alert('item2 clicked');
 *            }
 *          }
 *      ]
 * }).addTo(map);
 */
maptalks.control.Toolbar = maptalks.control.Control.extend(/** @lends maptalks.control.Toolbar.prototype */{

    /**
     * @property {Object}   options - options
     * @property {String|Object}   [options.position="top-right"]          - position of the toolbar control.
     * @property {Boolean}  [options.vertical=true]                        - Whether the toolbar is a vertical one.
     * @property {Object[]} options.items                                  - items on the toolbar
     */
    options:{
        'height' : 28,
        'vertical' : false,
        'position' : 'top-right',
        'items'     : {
            //default buttons
        }
    },

    buildOn: function (map) {
        this._map = map;
        var dom = maptalks.DomUtil.createEl('div');
        var ul = maptalks.DomUtil.createEl('ul', 'maptalks-toolbar-hx');
        dom.appendChild(ul);

        if (this.options['vertical']) {
            maptalks.DomUtil.addClass(dom, 'maptalks-toolbar-vertical');
        } else {
            maptalks.DomUtil.addClass(dom, 'maptalks-toolbar-horizonal');
        }
        var me = this;
        function onButtonClick(fn, index, childIndex, targetDom) {
            var item = me._getItems()[index];
            return function (e) {
                maptalks.DomUtil.stopPropagation(e);
                return fn({'target':item, 'index':index, 'childIndex': childIndex, 'dom': targetDom});
            };
        }

        var items = this.options['items'];
        if (maptalks.Util.isArrayHasData(items)) {
            for (var i = 0, len = items.length; i < len; i++) {
                var item = items[i];
                var li = maptalks.DomUtil.createEl('li');
                if (this.options['height'] !== 28) {
                    li.style.lineHeight = this.options['height'] + 'px';
                }
                li.style.height = this.options['height'] + 'px';
                li.style.cursor = 'pointer';
                if (maptalks.DomUtil.isHTML(item['item'])) {
                    li.style.textAlign = 'center';
                    var itemSize = maptalks.DomUtil.measureDom('div', item['item']);
                    //vertical-middle
                    li.innerHTML = '<div style="margin-top:' + (this.options['height'] - itemSize['height']) / 2 + 'px;">' + item['item'] + '</div>';
                } else {
                    li.innerHTML = item['item'];
                }
                if (item['click']) {
                    maptalks.DomUtil.on(li, 'click', (onButtonClick)(item['click'], i, null, li));
                }
                if (maptalks.Util.isArrayHasData(item['children'])) {
                    var dropMenu = this._createDropMenu(i);
                    li.appendChild(dropMenu);
                    li._menu = dropMenu;
                    maptalks.DomUtil.on(li, 'mouseover', function () {
                        this._menu.style.display = '';
                    });
                    maptalks.DomUtil.on(li, 'mouseout', function () {
                        this._menu.style.display = 'none';
                    });
                }
                ul.appendChild(li);
            }
        }
        return dom;
    },

    _createDropMenu:function (index) {
        var me = this;
        function onButtonClick(fn, index, childIndex) {
            var item = me._getItems()[index]['children'][childIndex];
            return function (e) {
                maptalks.DomUtil.stopPropagation(e);
                return fn({'target':item, 'index':index, 'childIndex': childIndex});
            };
        }
        var menuDom = maptalks.DomUtil.createEl('div', 'maptalks-dropMenu');
        menuDom.style.display = 'none';
        menuDom.appendChild(maptalks.DomUtil.createEl('em', 'maptalks-ico'));
        var menuUL = maptalks.DomUtil.createEl('ul');
        menuDom.appendChild(menuUL);
        var children = this._getItems()[index]['children'];
        var liWidth = 0, i, len;
        for (i = 0, len = children.length; i < len; i++) {
            var size = maptalks.StringUtil.stringLength(children[i]['item'], '12px');
            if (size.width > liWidth) {
                liWidth = size.width;
            }
        }
        for (i = 0, len = children.length; i < len; i++) {
            var child = children[i];
            var li = maptalks.DomUtil.createEl('li');
            li.innerHTML = '<a href="javascript:;">' + child['item'] + '</a>';
            li.style.cursor = 'pointer';
            li.style.width = (liWidth + 24) + 'px';// 20 for text-intent
            maptalks.DomUtil.on(li.childNodes[0], 'click', (onButtonClick)(child['click'], index, i));
            menuUL.appendChild(li);
        }
        return menuDom;
    },

    _getItems:function () {
        return this.options['items'];
    }
});

/**
 * @classdesc
 * An overview control for the map.
 * @class
 * @category control
 * @extends maptalks.control.Control
 * @memberOf maptalks.control
 * @name Overview
 * @param {Object} [options=null] - options defined in [maptalks.control.Overview]{@link maptalks.control.Overview#options}
 * @example
 * var overview = new maptalks.control.Overview({
 *     position : {'bottom': '0', 'right': '0'},
 *     size : {'width' : 300,'height' : 200}
 * }).addTo(map);
 */
maptalks.control.Overview = maptalks.control.Control.extend(/** @lends maptalks.control.Overview.prototype */{

    loadDelay : 1600,

    /**
     * @property {Object} options - options
     * @property {Object} [options.position='bottom-right'] - position of the control
     * @property {Number} [options.level=4]  - the zoom level of the overview
     * @property {Object} [options.size={"width":300, "height":200}  - size of the Control
     * @property {Object} [options.style={"color":"#1bbc9b"}] - style of the control, color is the overview rectangle's color
     */
    options:{
        'level' : 4,
        'position' : 'bottom-right',
        'size' : {
            'width' : 300,
            'height' : 200
        },
        'style' : {
            'color' : '#1bbc9b'
        }
    },

    buildOn: function (map) {
        var container = maptalks.DomUtil.createEl('div');
        container.style.cssText = 'border:1px solid #000;width:' + this.options['size']['width'] + 'px;height:' + this.options['size']['height'] + 'px;';
        if (map.isLoaded()) {
            this._initOverview();
        } else {
            map.on('load', this._initOverview, this);
        }
        return container;
    },

    _initOverview : function () {
        var me = this;
        setTimeout(function () {
            me._createOverview();
        }, this.loadDelay);
    },

    _createOverview : function (container) {
        var map = this.getMap(),
            dom = container || this.getDOM(),
            extent = map.getExtent();
        var options = map.config();
        maptalks.Util.extend(options, {
            'center' : map.getCenter(),
            'zoom'   : this._getOverviewZoom(),
            'scrollWheelZoom' : false,
            'checkSize' : false,
            'doubleClickZoom' : false,
            'touchZoom' : false,
            'control' : false
        });
        this._overview = new maptalks.Map(dom, options);
        this._updateBaseLayer();
        this._perspective = new maptalks.Polygon(extent.toArray(), {
            'draggable' : true,
            'cursor' : 'move',
            'symbol' : {
                'lineWidth' : 3,
                'lineColor' : this.options['style']['color'],
                'polygonFill' : this.options['style']['color'],
                'polygonOpacity' : 0.4,
            }
        })
        .on('dragstart', this._onDragStart, this)
        .on('dragend', this._onDragEnd, this);
        map.on('resize moveend zoomend', this._update, this)
            .on('setbaselayer', this._updateBaseLayer, this);
        new maptalks.VectorLayer('v').addGeometry(this._perspective).addTo(this._overview);
        this.fire('load');
    },

    onRemove : function () {
        this.getMap().off('load', this._initOverview, this)
            .off('resize moveend zoomend', this._update, this)
            .off('setbaselayer', this._updateBaseLayer, this);
    },

    _getOverviewZoom : function () {
        var map = this.getMap(),
            zoom = map.getZoom(),
            minZoom = map.getMinZoom(),
            level = this.options['level'];
        var i;
        if (level > 0) {
            for (i = level; i > 0; i--) {
                if (zoom - i >= minZoom) {
                    return zoom - i;
                }
            }
        } else {
            for (i = level; i < 0; i++) {
                if (zoom - i >= minZoom) {
                    return zoom - i;
                }
            }
        }

        return zoom;
    },

    _onDragStart: function () {
        this._origDraggable = this.getMap().options['draggable'];
        this.getMap().config('draggable', false);
    },

    _onDragEnd : function () {
        var center = this._perspective.getCenter();
        this._overview.setCenter(center);
        this.getMap().panTo(center);
        this.getMap().config('draggable', this._origDraggable);
    },

    _update : function () {
        this._perspective.setCoordinates(this.getMap().getExtent().toArray());
        this._overview.setCenterAndZoom(this.getMap().getCenter(), this._getOverviewZoom());
    },

    _updateBaseLayer: function () {
        var map = this.getMap();
        if (map.getBaseLayer()) {
            this._overview.setBaseLayer(maptalks.Layer.fromJSON(map.getBaseLayer().toJSON()));
        } else {
            this._overview.setBaseLayer(null);
        }
    }

});

maptalks.Map.mergeOptions({
    'overviewControl' : false
});

maptalks.Map.addOnLoadHook(function () {
    if (this.options['overviewControl']) {
        this.overviewControl = new maptalks.control.Overview(this.options['overviewControl']);
        this.addControl(this.overviewControl);
    }
});


function exportMaptalks() {
    var old = window['maptalks'];

    maptalks.noConflict = function () {
        window['maptalks'] = old;
        return this;
    };

    window['maptalks'] = maptalks;
}

if (typeof module !== 'undefined' && module.exports) {
    exports = module.exports = maptalks;
} else if (typeof define === 'function' && define.amd) {
    define(maptalks);
}

if (typeof window !== 'undefined') {
    exportMaptalks(maptalks);
}


})();