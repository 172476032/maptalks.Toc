/********************************************************************
模块名：PJtools
说  明：PJtools基于Jquery框架对基础类对象扩展函数方法及实现核心代码
版  本：v2.0.0
作  者：潘杰
修  改：-
版  权：2009-2013 (C) PJtools
备  注：兼容 IE6+、Firefox、Safari、Opera、Chrome
********************************************************************/

(function () {

    window.PJtools = window.PJtools || {};

    // 定义版本号
    PJtools.VERSION = "v2.0.0";

    //#region 获取Js脚本加载路径地址
    var _ScriptPath = (function () {
        var r = new RegExp("(^|(.*?\\/))(pjtools.js)(\\?|$)"),
                s = document.getElementsByTagName('script'),
                src, m, l = "";
        for (var i = 0, len = s.length; i < len; i++) {
            src = s[i].getAttribute('src');
            if (src) {
                m = src.match(r);
                if (m) {
                    l = m[1];
                    break;
                }
            }
        }
        return (function () { return l; });
    })();
    PJtools.ScriptPath = _ScriptPath();
    //#endregion

    //#region PJtools.Class -- 定义Class构造函数
    PJtools.utilExtend = function (destination, source) {
        destination = destination || {};
        if (source) {
            for (var property in source) {
                var value = source[property];
                if (value !== undefined) {
                    destination[property] = value;
                }
            }
            var sourceIsEvt = typeof window.Event == "function" && source instanceof window.Event;
            if (!sourceIsEvt && source.hasOwnProperty && source.hasOwnProperty("toString")) {
                destination.toString = source.toString;
            }
        }
        return destination;
    };

    PJtools.inherit = function (C, P) {
        var F = function () { };
        F.prototype = P.prototype;
        C.prototype = new F;
        var i, l, o;
        for (i = 2, l = arguments.length; i < l; i++) {
            o = arguments[i];
            if (typeof o === "function") {
                o = o.prototype;
            }
            PJtools.utilExtend(C.prototype, o);
        }
    };

    PJtools.Class = function () {
        var len = arguments.length;
        var P = arguments[0];
        var F = arguments[len - 1];
        var C = typeof F.initialize == "function" ? F.initialize : function () { P.prototype.initialize.apply(this, arguments); };
        if (len > 1) {
            var newArgs = [C, P].concat(Array.prototype.slice.call(arguments).slice(1, len - 1), F);
            

            PJtools.inherit.apply(null, newArgs);
        } else {
            C.prototype = F;
        }
        return C;
    };
    //#endregion

    //#region PJtools.Array -- 扩展Array类
    (function ($) {

        //#region 定义私有Array相关属性及方法
        var Native = Array.prototype,
            hasOwn = Object.prototype.hasOwnProperty,
            toString = Object.prototype.toString,
            slice = Native.slice,
            supportsForEach = 'forEach' in Native,
            supportsIndexOf = 'indexOf' in Native,
            supportsMap = 'map' in Native,
            supportsEvery = 'every' in Native,
            supportsSome = 'some' in Native,
            supportsFilter = 'filter' in Native,
            supportsSort = function () {
                var a = [1, 2, 3, 4, 5].sort(function () { return 0; });
                return a[0] === 1 && a[1] === 2 && a[2] === 3 && a[3] === 4 && a[4] === 5;
            }(),
            supportsSliceOnNodeList = true;

        try {
            if (typeof document !== 'undefined') {
                slice.call(document.getElementsByTagName('body'));
            }
        }
        catch (e) {
            supportsSliceOnNodeList = false;
        }

        var _private = {
            // 判断是否为数组Array类型
            isArray: Array.isArray || function (val) {
                return toString.call(val) === '[object Array]';
            },
            // 判断是否为空类型
            isEmpty: function (value, allowEmptyString) {
                return (value === null) || (value === undefined) || (!allowEmptyString ? value === '' : false) || (_private.isArray(value) && value.length === 0);
            }
        };
        //#endregion

        //#region 公共方法函数接口
        var _array = {
            isArray: function (array) {
                /// <summary>判断是否为数组Array对象</summary>
                /// <param name="array" type="Object">待判断对象</param>
                /// <returns type="Boolean" />

                return _private.isArray(array);
            },
            toArray: function (iterable, start, end) {
                /// <summary>将字符串或类似数据的对象创建成数组</summary>
                /// <param name="iterable" type="Object">待转换的字符串或类似数组的对象</param>
                /// <param name="start" type="Int">可选，开始的索引值</param>
                /// <param name="end" type="Int">可选，截止的索引值</param>
                /// <returns type="Array" />

                if (!iterable || !iterable.length) { return []; }

                if (typeof iterable === 'string') { return [iterable]; }

                if (supportsSliceOnNodeList) {
                    return slice.call(iterable, start || 0, end || iterable.length);
                }

                var array = [], i;
                start = start || 0;
                end = end ? ((end < 0) ? iterable.length + end : end) : iterable.length;

                for (i = start; i < end; i++) {
                    array.push(iterable[i]);
                }

                return array;
            },
            hash: function (keys, values) {
                /// <summary>返回键值对对象，将一个数组作为key名，第二个数组作为value值，当第二个数组不够时，则以true填充</summary>
                /// <param name="keys" type="Array">待处理的数组</param>
                /// <param name="values" type="Array">待处理的数组</param>
                /// <returns type="Object" />

                var hash = {}, vlen = (values && values.length) || 0, i, len;

                for (i = 0, len = keys.length; i < len; ++i) {
                    if (i in keys) {
                        hash[keys[i]] = vlen > i && i in values ? values[i] : true;
                    }
                }

                return hash;
            },
            indexOf: function (array, item, from) {
                /// <summary>检测指定项在数组中的索引值，如果不在数组中，则返回-1</summary>
                /// <param name="array" type="Array">待检测的数组</param>
                /// <param name="item" type="Object">待检测的指定项</param>
                /// <param name="from" type="Number">指定开始检测的索引值</param>
                /// <returns type="Int" />

                if (supportsIndexOf) { return array.indexOf(item, from); }

                var i, length = array.length;

                for (i = (from < 0) ? Math.max(0, length + from) : from || 0; i < length; i++) {
                    if (array[i] === item) { return i; }
                }

                return -1;
            },
            contains: function (array, item) {
                /// <summary>检测指定项是否在指定的数组中</summary>
                /// <param name="array" type="Array">待检测的数组</param>
                /// <param name="item" type="Object">待检测的指定项</param>
                /// <returns type="Boolean" />

                if (supportsIndexOf) { return array.indexOf(item) !== -1; }

                var i, ln;

                for (i = 0, ln = array.length; i < ln; i++) {
                    if (array[i] === item) { return true; }
                }

                return false;
            },
            from: function (value, newReference) {
                /// <summary>如果不是数组，则将一个值转换成数组</summary>
                /// <param name="value" type="Array/Object">待转换成数组的值</param>
                /// <param name="newReference" type="Boolean">可选，是否返回新的参考数组，默认为false</param>
                /// <returns type="Array" />

                if (value === undefined || value === null) {
                    return [];
                }

                if (_array.isArray(value)) {
                    return (newReference) ? slice.call(value) : value;
                }

                if (value && value.length !== undefined && typeof value !== 'string') {
                    return _array.toArray(value);
                }

                return [value];
            },
            each: function (array, fn, scope, reverse) {
                /// <summary>遍历数组</summary>
                /// <param name="array" type="Array">待处理的数组</param>
                /// <param name="fn" type="Function">数组项的回调的函数方法</param>
                /// <param name="scope" type="Object">指定回调函数中的上下文this</param>
                /// <param name="reverse" type="Boolean">是否进行倒叙遍历</param>
                /// <returns type="Boolean" />

                array = _array.from(array);

                var i, ln = array.length;

                if (reverse !== true) {
                    for (i = 0; i < ln; i++) {
                        if (fn.call(scope || array[i], array[i], i, array) === false) {
                            return i;
                        }
                    }
                }
                else {
                    for (i = ln - 1; i > -1; i--) {
                        if (fn.call(scope || array[i], array[i], i, array) === false) {
                            return i;
                        }
                    }
                }

                return true;
            },
            forEach: function (array, fn, scope) {
                /// <summary>遍历一个数组，为数组绑定回调函数</summary>
                /// <param name="array" type="Array">待处理的数组</param>
                /// <param name="fn" type="Function">数组项的回调的函数方法</param>
                /// <param name="scope" type="Object">指定回调函数中的上下文this</param>

                if (supportsForEach) { return array.forEach(fn, scope); }

                var i = 0, ln = array.length;

                for (; i < ln; i++) {
                    fn.call(scope, array[i], i, array);
                }
            },
            pluck: function (array, propertyName) {
                /// <summary>获取数组项中的指定属性值，返回获取属性值组成的新数值</summary>
                /// <param name="array" type="Array/NodeList">待处理的数组</param>
                /// <param name="propertyName" type="String">待检测的指定项</param>
                /// <returns type="Array" />

                var ret = [], i, ln, item;

                for (i = 0, ln = array.length; i < ln; i++) {
                    item = array[i];
                    ret.push(item[propertyName]);
                }

                return ret;
            },
            map: function (array, fn, scope) {
                /// <summary>创建一个新数组，此数组中的值为每个元素调用函数方法的结果</summary>
                /// <param name="array" type="Array">待处理的数组</param>
                /// <param name="fn" type="Function">数组项的回调的函数方法</param>
                /// <param name="scope" type="Object">指定回调函数中的上下文this</param>
                /// <returns type="Array" />

                if (supportsMap) { return array.map(fn, scope); }

                var results = [], i = 0, len = array.length;

                for (; i < len; i++) {
                    results[i] = fn.call(scope, array[i], i, array);
                }

                return results;
            },
            every: function (array, fn, scope) {
                /// <summary>检测数组中每项都是符合指定函数的判断，当所有项返回true时，则此数组符合特定指定函数判断</summary>
                /// <param name="array" type="Array">待处理的数组</param>
                /// <param name="fn" type="Function">数组项的回调的函数方法</param>
                /// <param name="scope" type="Object">指定回调函数中的上下文this</param>
                /// <returns type="Boolean" />

                if (!fn) { return false; }

                if (supportsEvery) { return array.every(fn, scope); }

                var i = 0, ln = array.length;

                for (; i < ln; ++i) {
                    if (!fn.call(scope, array[i], i, array)) {
                        return false;
                    }
                }

                return true;
            },
            some: function (array, fn, scope) {
                /// <summary>指定数组中是否含有符合指定条件的成员</summary>
                /// <param name="array" type="Array">待处理的数组</param>
                /// <param name="fn" type="Function">数组项的回调的函数方法</param>
                /// <param name="scope" type="Object">指定回调函数中的上下文this</param>
                /// <returns type="Boolean" />

                if (!fn) { return false; }

                if (supportsSome) { return array.some(fn, scope); }

                var i = 0, ln = array.length;

                for (; i < ln; ++i) {
                    if (fn.call(scope, array[i], i, array)) {
                        return true;
                    }
                }

                return false;
            },
            clean: function (array) {
                /// <summary>清除指定数值中的空项值，不包含空字符串</summary>
                /// <param name="array" type="Array">待处理的数组</param>
                /// <returns type="Array" />

                var results = [], i = 0, ln = array.length, item, _isEmpty;

                for (; i < ln; i++) {
                    item = array[i];

                    if (!_private.isEmpty(item)) {
                        results.push(item);
                    }
                }

                return results;
            },
            filter: function (array, fn, scope) {
                /// <summary>返回一个符合过滤条件的新数组，符合条件则将该项加入到新数组中</summary>
                /// <param name="array" type="Array">待处理的数组</param>
                /// <param name="fn" type="Function">数组项的回调的函数方法</param>
                /// <param name="scope" type="Object">指定回调函数中的上下文this</param>
                /// <returns type="Array" />

                if (supportsFilter) { return array.filter(fn, scope); }

                var results = [], i = 0, ln = array.length;

                for (; i < ln; i++) {
                    if (fn.call(scope, array[i], i, array)) {
                        results.push(array[i]);
                    }
                }

                return results;
            },
            remove: function (array, item) {
                /// <summary>移除数组中的指定项</summary>
                /// <param name="array" type="Array">待处理的数组</param>
                /// <param name="item" type="Object">待删除的数组项</param>
                /// <returns type="Array" />

                var index = _array.indexOf(array, item);

                if (index !== -1) {
                    array.splice(index, 1);
                }

                return array;
            },
            include: function (array, item) {
                /// <summary>如果指定项不存在，则添加到数组中</summary>
                /// <param name="array" type="Array">待处理的数组</param>
                /// <param name="item" type="Object">待添加的数组项</param>
                /// <returns type="Array" />

                if (!_array.contains(array, item)) {
                    array.push(item);
                }
            },
            clone: function (array) {
                /// <summary>复制指定数组</summary>
                /// <param name="array" type="Array">待处理的数组</param>
                /// <returns type="Array" />

                return slice.call(array);
            },
            unique: function (array) {
                /// <summary>删除数组中的重复项</summary>
                /// <param name="array" type="Array">待处理的数组</param>
                /// <returns type="Array" />

                var clone = [], n = 0, len = array.length, item;

                for (; n < len; n++) {
                    item = array[n];
                    if (_array.indexOf(clone, item) === -1) {
                        clone.push(item);
                    }
                }

                return clone;
            },
            merge: function () {
                /// <summary>合并多个数组项，并排除重复项</summary>
                /// <returns type="Array" />

                var args = slice.call(arguments), array = [], i, ln;

                for (i = 0, ln = args.length; i < ln; i++) {
                    array = array.concat(args[i]);
                }

                return _array.unique(array);
            },
            intersect: function () {
                /// <summary>返回两个或多个数组的交集数组</summary>
                /// <returns type="Array" />

                var intersect = [], arrays = slice.call(arguments),
                    i, j, k, minArray, array, x, y, ln, arraysLn, arrayLn;

                if (!arrays.length) { return intersect; }

                for (i = x = 0, ln = arrays.length; i < ln, array = arrays[i]; i++) {
                    if (!minArray || array.length < minArray.length) {
                        minArray = array;
                        x = i;
                    }
                }

                minArray = _array.unique(minArray);
                arrays.splice(x, 1);

                for (i = 0, ln = minArray.length; i < ln, x = minArray[i]; i++) {
                    var count = 0;

                    for (j = 0, arraysLn = arrays.length; j < arraysLn, array = arrays[j]; j++) {
                        for (k = 0, arrayLn = array.length; k < arrayLn, y = array[k]; k++) {
                            if (x === y) {
                                count++;
                                break;
                            }
                        }
                    }

                    if (count === arraysLn) {
                        intersect.push(x);
                    }
                }

                return intersect;
            },
            difference: function (arrayA, arrayB) {
                /// <summary>比较两个数组，返回第一个数组中不同于第两个数组的数组项</summary>
                /// <param name="arrayA" type="Array">待比较的数组</param>
                /// <param name="arrayB" type="Array">待比较的数组</param>
                /// <returns type="Array" />

                var clone = slice.call(arrayA), ln = clone.length, i, j, lnB;

                for (i = 0, lnB = arrayB.length; i < lnB; i++) {
                    for (j = 0; j < ln; j++) {
                        if (clone[j] === arrayB[i]) {
                            clone.splice(j, 1);
                            j--;
                            ln--;
                        }
                    }
                }

                return clone;
            },
            sort: function (array, sortFn) {
                /// <summary>将数组进行升序排列</summary>
                /// <param name="array" type="Array">待排序的数组</param>
                /// <param name="sortFn" type="Function">比较函数</param>
                /// <returns type="Array" />

                if (supportsSort) {
                    if (sortFn) { return array.sort(sortFn); }
                    else { return array.sort(); }
                }

                var length = array.length, i = 0, comparison, j, min, tmp;

                for (; i < length; i++) {
                    min = i;
                    for (j = i + 1; j < length; j++) {
                        if (sortFn) {
                            comparison = sortFn(array[j], array[min]);
                            if (comparison < 0) {
                                min = j;
                            }
                        }
                        else if (array[j] < array[min]) {
                            min = j;
                        }
                    }
                    if (min !== i) {
                        tmp = array[i];
                        array[i] = array[min];
                        array[min] = tmp;
                    }
                }

                return array;
            },
            flatten: function (array) {
                /// <summary>将复合数组转换成标准的一行一列数组</summary>
                /// <param name="array" type="Array">待处理的数组</param>
                /// <returns type="Array" />

                var worker = [];

                function rFlatten(a) {
                    var i, ln, v;

                    for (i = 0, ln = a.length; i < ln; i++) {
                        v = a[i];
                        if (_array.isArray(v)) { rFlatten(v); }
                        else { worker.push(v); }
                    }

                    return worker;
                }

                return rFlatten(array);
            },
            min: function (array, comparisonFn) {
                /// <summary>找出数组中的最小项</summary>
                /// <param name="array" type="Array">待比较的数组</param>
                /// <param name="comparisonFn" type="Function">待处理的数组</param>
                /// <returns type="Object" />

                var min = array[0], i, ln, item;

                for (i = 0, ln = array.length; i < ln; i++) {
                    item = array[i];

                    if (comparisonFn) {
                        if (comparisonFn(min, item) === 1) {
                            min = item;
                        }
                    }
                    else {
                        if (item < min) {
                            min = item;
                        }
                    }
                }

                return min;
            },
            max: function (array, comparisonFn) {
                /// <summary>找出数组中的最大项</summary>
                /// <param name="array" type="Array">待比较的数组</param>
                /// <param name="comparisonFn" type="Function">待处理的数组</param>
                /// <returns type="Object" />

                var max = array[0], i, ln, item;

                for (i = 0, ln = array.length; i < ln; i++) {
                    item = array[i];

                    if (comparisonFn) {
                        if (comparisonFn(max, item) === -1) {
                            max = item;
                        }
                    }
                    else {
                        if (item > max) {
                            max = item;
                        }
                    }
                }

                return max;
            },
            sum: function (array) {
                /// <summary>计算数组各项之和</summary>
                /// <param name="array" type="Array">待处理的数组</param>
                /// <returns type="Number" />

                var sum = 0, i, ln, item;

                for (i = 0, ln = array.length; i < ln; i++) {
                    item = array[i];
                    sum += item;
                }

                return sum;
            },
            mean: function (array) {
                /// <summary>计算数组项的平均值</summary>
                /// <param name="array" type="Array">待处理的数组</param>
                /// <returns type="Number" />

                return array.length > 0 ? _array.sum(array) / array.length : undefined;
            }
        };
        //#endregion

        // 模块传递给默认PJtools.Array命名空间
        PJtools.Array = _array;

    })(jQuery);
    //#endregion

    //#region PJtools.Date -- 扩展Date类
    (function ($) {

        //#region 定义私有Date相关属性
        var _format = {
            // 英文星期全称
            dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            // 英文星期简称
            daySNames: ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"],
            // 中文星期
            dayCNames: ["日", "一", "二", "三", "四", "五", "六"],
            // 英文月份全称
            monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
            // 英文月份简称
            monthSNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            // 中文月份名称
            monthCNames: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
            // 月份数字
            monthNumbers: { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 },
            // 季度数字英文简称
            quarterNumbers: ["1st", "2nd", "3rd", "4th"],
            // 上午/下午
            apmNames: ["am", "pm"],
            // 日期格式各段字符定义（注：区分大小写）
            formatChar: {
                yyyy: function (value, format) { // 全年份
                    return format.replace(/yyyy/, value.getFullYear());
                },
                yy: function (value, format) { // 2位简年份
                    return format.replace(/yy/, (value.getYear() % 100) > 9 ? (value.getYear() % 100).toString() : '0' + (value.getYear() % 100));
                },
                MM: function (value, format) { // 补0的月份
                    return format.replace(/MM/, (value.getMonth() + 1) > 9 ? (value.getMonth() + 1).toString() : '0' + (value.getMonth() + 1));
                },
                LM: function (value, format) { // 英文全称月份
                    return format.replace(/LM/, _format.monthNames[value.getMonth()]);
                },
                EM: function (value, format) { // 英文简称月份
                    return format.replace(/EM/, _format.monthSNames[value.getMonth()]);
                },
                CM: function (value, format) { // 中文月份
                    return format.replace(/CM/, _format.monthCNames[value.getMonth()]);
                },
                M: function (value, format) { // 月份（注：月份必需大写，与分钟区分）
                    return format.replace(/M/, value.getMonth() + 1);
                },
                dd: function (value, format) { // 补0的天数
                    return format.replace(/dd/, value.getDate() > 9 ? value.getDate().toString() : '0' + value.getDate());
                },
                d: function (value, format) { // 天数
                    return format.replace(/d/, value.getDate());
                },
                hh: function (value, format) { // 补0的24小时制
                    return format.replace(/hh/, value.getHours() > 9 ? value.getHours().toString() : '0' + value.getHours());
                },
                h: function (value, format) { // 24小时制
                    return format.replace(/h/, value.getHours());
                },
                mm: function (value, format) { // 补0的分钟
                    return format.replace(/mm/, value.getMinutes() > 9 ? value.getMinutes().toString() : '0' + value.getMinutes());
                },
                mi: function (value, format) { // 补0的分钟
                    return format.replace(/mi/, value.getMinutes() > 9 ? value.getMinutes().toString() : '0' + value.getMinutes());
                },
                m: function (value, format) { // 分钟
                    return format.replace(/m/, value.getMinutes());
                },
                ss: function (value, format) { // 补0的秒数
                    return format.replace(/ss/, value.getSeconds() > 9 ? value.getSeconds().toString() : '0' + value.getSeconds());
                },
                s: function (value, format) { // 秒数
                    return format.replace(/s/, value.getSeconds());
                },
                S: function (value, format) { // 毫秒（注：毫秒必需大写，与秒数区分）
                    return format.replace(/S/, value.getMilliseconds());
                },
                q: function (value, format) { // 季度
                    switch (value.getMonth() + 1) {
                        case 1: case 2: case 3:
                            return format.replace(/q/, _format.quarterNumbers[0]);
                            break;
                        case 4: case 5: case 6:
                            return format.replace(/q/, _format.quarterNumbers[1]);
                            break;
                        case 7: case 8: case 9:
                            return format.replace(/q/, _format.quarterNumbers[2]);
                            break;
                        case 10: case 11: case 12:
                            return format.replace(/q/, _format.quarterNumbers[3]);
                            break;
                    }
                },
                a: function (value, format) { // am/pm
                    return format.replace(/a/, value.getHours() >= 0 && value.getHours() < 12 ? _format.apmNames[0] : _format.apmNames[1]);
                },
                lw: function (value, format) { // 英文全称周
                    return format.replace(/lw/, _format.dayNames[value.getDay()]);
                },
                cw: function (value, format) { // 中文周
                    return format.replace(/cw/, _format.dayCNames[value.getDay()]);
                },
                w: function (value, format) { // 周
                    return format.replace(/w/, _format.daySNames[value.getDay()]);
                }
            }
        };
        //#endregion

        //#region 公共方法函数接口
        var _date = {
            isDate: function (date) {
                /// <summary>判断是否为日期Date对象</summary>
                /// <param name="date" type="String/Data">日期对象或字符串</param>
                /// <returns type="Boolean" />

                var toString = Object.prototype.toString;
                return toString.call(date) === '[object Date]' && date.toString() !== 'Invalid Date' && !isNaN(date);
            },
            toDate: function (date) {
                /// <summary>将日期字符串转换成日期对象</summary>
                /// <param name="date" type="String">日期字符串</param>
                /// <returns type="Date" />

                if (this.isDate(date)) { return date; }
                return new Date(Date.parse(date.replace(/\-/g, "/")));
            },
            dateFormat: function (date, format) {
                /// <summary>将日期格式转换成指定格式</summary>
                /// <param name="value" type="String/Data">日期对象或字符串</param>
                /// <param name="format" type="String">待转换的日期格式字符串</param>
                /// <returns type="String" />

                if (!this.isDate(date)) { date = this.toDate(date); }
                for (var key in _format.formatChar) {
                    format = _format.formatChar[key](date, format);
                }
                return format;
            },
            isLeapYear: function (date) {
                /// <summary>判断当前日期对象的年份是否为闰年</summary>
                /// <param name="date" type="String/Date">日期对象或字符串</param>
                /// <returns type="Boolean" />

                if (!this.isDate(date)) { date = this.toDate(date); }
                var year = date.getFullYear();
                return !!((year & 3) == 0 && (year % 100 || (year % 400 == 0 && year)));
            },
            getDaysOfYear: function (date) {
                /// <summary>获取当前日期对象的年份天数</summary>
                /// <param name="date" type="String/Date">日期对象或字符串</param>
                /// <returns type="Int" />

                return this.isLeapYear(date) ? 366 : 365;
            },
            getDayInYear: function (date) {
                /// <summary>获取当前日期对象为一年中的第几天</summary>
                /// <param name="date" type="String/Date">日期对象或字符串</param>
                /// <returns type="Int" />

                if (!this.isDate(date)) { date = this.toDate(date); }
                var num = 0, d = new Date(date.getTime()), m = date.getMonth(), i;
                for (i = 0, d.setDate(1), d.setMonth(0) ; i < m; d.setMonth(++i)) {
                    num += this.getDaysInMonth(d);
                }
                return num + date.getDate();
            },
            getDaysInMonth: function (date) {
                /// <summary>获取当前日期对象的月份天数</summary>
                /// <param name="date" type="String/Date">日期对象或字符串</param>
                /// <returns type="Int" />

                if (!this.isDate(date)) { date = this.toDate(date); }
                var daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
                var m = date.getMonth();
                return m == 1 && this.isLeapYear(date) ? 29 : daysInMonth[m];
            },
            getWeekInYear: function (date) {
                /// <summary>获取当前日期对象为一年中的第几周</summary>
                /// <param name="date" type="String/Date">日期对象或字符串</param>
                /// <returns type="Int" />

                if (!this.isDate(date)) { date = this.toDate(date); }
                var ms1d = 864e5, ms7d = 7 * ms1d;
                var DC3 = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate() + 3) / ms1d, AWN = Math.floor(DC3 / 7),
                    Wyr = new Date(AWN * ms7d).getUTCFullYear();
                return AWN - Math.floor(Date.UTC(Wyr, 0, 7) / ms7d) + 1;
            },
            getFirstDayOfMonth: function (date) {
                /// <summary>获取当前日期对象在月份的第一天是星期几</summary>
                /// <param name="date" type="String/Date">日期对象或字符串</param>
                /// <returns type="Int" />

                if (!this.isDate(date)) { date = this.toDate(date); }
                var day = (date.getDay() - (date.getDate() - 1)) % 7;
                return (day < 0) ? (day + 7) : day;
            },
            getLastDayOfMonth: function (date) {
                /// <summary>获取当前日期对象在月份的最后一天是星期几</summary>
                /// <param name="date" type="String/Date">日期对象或字符串</param>
                /// <returns type="Int" />

                return this.getLastDateOfMonth(date).getDay();
            },
            getFirstDateOfMonth: function (date) {
                /// <summary>获取当前日期对象月份的第一天的日期对象</summary>
                /// <param name="date" type="String/Date">日期对象或字符串</param>
                /// <returns type="Date" />

                if (!this.isDate(date)) { date = this.toDate(date); }
                return new Date(date.getFullYear(), date.getMonth(), 1);
            },
            getLastDateOfMonth: function (date) {
                /// <summary>获取当前日期对象月份的最后一天的日期对象</summary>
                /// <param name="date" type="String/Date">日期对象或字符串</param>
                /// <returns type="Date" />

                if (!this.isDate(date)) { date = this.toDate(date); }
                return new Date(date.getFullYear(), date.getMonth(), this.getDaysInMonth(date));
            },
            getElapsed: function (dateA, dateB) {
                /// <summary>获取两个时间对象相减的差值时间对象</summary>
                /// <param name="dateA" type="String/Date">日期对象或字符串</param>
                /// <param name="dateB" type="String/Date">日期对象或字符串</param>
                /// <returns type="Object" />

                if (!this.isDate(dateA)) { dateA = this.toDate(dateA); }
                if (dateB) { if (!this.isDate(dateB)) { dateB = this.toDate(dateB); } }
                var millisecond = Math.abs(dateA - (dateB || new Date()));
                var msec, second, minute, hour, day;
                day = parseInt(millisecond / 86400000);
                hour = parseInt((millisecond - day * 86400000) / 3600000);
                minute = parseInt((millisecond - day * 86400000 - hour * 3600000) / 60000);
                second = parseInt((millisecond - day * 86400000 - hour * 3600000 - minute * 60000) / 1000);
                msec = millisecond - day * 86400000 - hour * 3600000 - minute * 60000 - second * 1000;
                var _elaps = {
                    millisecond: millisecond,
                    msec: msec,
                    second: second,
                    minute: minute,
                    hour: hour,
                    day: day
                };
                return _elaps;
            },
            addYears: function (date, num) {
                /// <summary>获取当前日期对象年份的相加，正整数为相加，负整数为相减</summary>
                /// <param name="date" type="String/Date">日期对象或字符串</param>
                /// <param name="num" type="Int">待加减的年份整数</param>
                /// <returns type="Date" />

                if (!this.isDate(date)) { date = this.toDate(date); }
                var d = new Date(date.getTime());
                if (parseInt(num) === 0) { return d; }
                d.setFullYear(date.getFullYear() + parseInt(num));
                return d;
            },
            addMonths: function (date, num) {
                /// <summary>获取当前日期对象月份的相加，正整数为相加，负整数为相减</summary>
                /// <param name="date" type="String/Date">日期对象或字符串</param>
                /// <param name="num" type="Int">待加减的月份整数</param>
                /// <returns type="Date" />

                if (!this.isDate(date)) { date = this.toDate(date); }
                var d = new Date(date.getTime());
                if (parseInt(num) === 0) { return d; }
                var day = date.getDate();
                if (day > 28) {
                    day = Math.min(day, this.getLastDateOfMonth(this.addMonths(this.getFirstDateOfMonth(date), parseInt(num))).getDate());
                }
                d.setDate(day);
                d.setMonth(date.getMonth() + parseInt(num));
                return d;
            },
            addDays: function (date, num) {
                /// <summary>获取当前日期对象天数的相加，正整数为相加，负整数为相减</summary>
                /// <param name="date" type="String/Date">日期对象或字符串</param>
                /// <param name="num" type="Int">待加减的天数整数</param>
                /// <returns type="Date" />

                if (!this.isDate(date)) { date = this.toDate(date); }
                var d = new Date(date.getTime());
                if (parseInt(num) === 0) { return d; }
                d.setDate(date.getDate() + parseInt(num));
                return d;
            },
            addHours: function (date, num) {
                /// <summary>获取当前日期对象小时的相加，正整数为相加，负整数为相减</summary>
                /// <param name="date" type="String/Date">日期对象或字符串</param>
                /// <param name="num" type="Int">待加减的小时整数</param>
                /// <returns type="Date" />

                if (!this.isDate(date)) { date = this.toDate(date); }
                var d = new Date(date.getTime());
                if (parseInt(num) === 0) { return d; }
                d.setHours(date.getHours() + parseInt(num));
                return d;
            },
            addMinutes: function (date, num) {
                /// <summary>获取当前日期对象分钟的相加，正整数为相加，负整数为相减</summary>
                /// <param name="date" type="String/Date">日期对象或字符串</param>
                /// <param name="num" type="Int">待加减的分钟整数</param>
                /// <returns type="Date" />

                if (!this.isDate(date)) { date = this.toDate(date); }
                var d = new Date(date.getTime());
                if (parseInt(num) === 0) { return d; }
                d.setMinutes(date.getMinutes() + parseInt(num));
                return d;
            },
            addSeconds: function (date, num) {
                /// <summary>获取当前日期对象秒数的相加，正整数为相加，负整数为相减</summary>
                /// <param name="date" type="String/Date">日期对象或字符串</param>
                /// <param name="num" type="Int">待加减的秒数整数</param>
                /// <returns type="Date" />

                if (!this.isDate(date)) { date = this.toDate(date); }
                var d = new Date(date.getTime());
                if (parseInt(num) === 0) { return d; }
                d.setSeconds(date.getSeconds() + parseInt(num));
                return d;
            },
            addMilliseconds: function (date, num) {
                /// <summary>获取当前日期对象毫秒的相加，正整数为相加，负整数为相减</summary>
                /// <param name="date" type="String/Date">日期对象或字符串</param>
                /// <param name="num" type="Int">待加减的毫秒整数</param>
                /// <returns type="Date" />

                if (!this.isDate(date)) { date = this.toDate(date); }
                var d = new Date(date.getTime());
                if (parseInt(num) === 0) { return d; }
                d.setMilliseconds(date.getMilliseconds() + parseInt(num));
                return d;
            },
            isBetween: function (date, start, end) {
                /// <summary>比较当前日期对象是否在起始与截止时间段之间</summary>
                /// <param name="date" type="String/Date">待比较日期对象或字符串</param>
                /// <param name="start" type="String/Date">起始日期对象或字符串</param>
                /// <param name="end" type="String/Date">截止日期对象或字符串</param>
                /// <returns type="Boolean" />

                if (!this.isDate(date)) { date = this.toDate(date); }
                if (!this.isDate(start)) { start = this.toDate(start); }
                if (!this.isDate(end)) { end = this.toDate(end); }
                var t = date.getTime();
                return start.getTime() <= t && t <= end.getTime();
            }
        };
        //#endregion

        // 模块传递给默认PJtools.Date命名空间
        PJtools.Date = _date;

    })(jQuery);
    //#endregion

    //#region PJtools.Function -- 扩展Function类
    (function ($) {

        //#region 公共方法函数接口
        var _function = {
            isFunction: function (fn) {
                /// <summary>判断是否为函数Function对象</summary>
                /// <param name="fn" type="Object">待判断对象</param>
                /// <returns type="Boolean" />

                var toString = Object.prototype.toString;
                return toString.call(fn) === '[object Function]';
            },
            bind: function (fn, scope, args) {
                /// <summary>创建一个新函数，并返回函数对象</summary>
                /// <param name="fn" type="Function">匿名函数</param>
                /// <param name="scope" type="Object">指定函数中的上下文this</param>
                /// <param name="args" type="Array">指定函数的传参</param>
                /// <returns type="Function" />

                var method = fn, applyArgs;

                return function () {
                    var callArgs = args || arguments;
                    return method.apply(scope || window, callArgs);
                };
            },
            createInterceptor: function (origFn, newFn, scope, returnValue) {
                /// <summary>创建一个拦截器功能函数，当新判断函数为false则阻止原始函数触发执行</summary>
                /// <param name="origFn" type="Function">原始函数</param>
                /// <param name="newFn" type="Function">原始函数之前调用的函数</param>
                /// <param name="scope" type="Object">指定函数中的上下文this</param>
                /// <param name="returnValue" type="Object">当阻止原始函数返回值，默认为null</param>
                /// <returns type="Function" />

                var method = origFn;
                if (!_function.isFunction(newFn)) {
                    return origFn;
                }
                else {
                    return function () {
                        var me = this, args = arguments;
                        newFn.target = me;
                        newFn.method = origFn;
                        return (newFn.apply(scope || me || window, args) !== false) ? origFn.apply(me || window, args) : returnValue || null;
                    };
                }
            },
            createDelayed: function (fn, delay, scope, args) {
                /// <summary>创建一个延时功能函数</summary>
                /// <param name="fn" type="Function">待延时的函数</param>
                /// <param name="delay" type="Number">延时时长</param>
                /// <param name="scope" type="Object">指定函数中的上下文this</param>
                /// <param name="args" type="Array">指定函数的传参</param>
                /// <returns type="Function" />

                if (scope || args) {
                    fn = _function.bind(fn, scope, args);
                }
                return function () {
                    var me = this;
                    setTimeout(function () {
                        fn.apply(me, arguments);
                    }, delay);
                };
            },
            defer: function (fn, delay, scope, args) {
                /// <summary>设置函数在指定时间后执行，返回供clearTimeout删除的ID</summary>
                /// <param name="fn" type="Function">待延时的函数</param>
                /// <param name="delay" type="Number">延时时长</param>
                /// <param name="scope" type="Object">指定函数中的上下文this</param>
                /// <param name="args" type="Array">指定函数的传参</param>
                /// <returns type="Number" />

                fn = _function.bind(fn, scope, args);
                if (delay > 0) {
                    return setTimeout(fn, delay);
                }
                fn();
                return 0;
            },
            createTransfer: function (origFn, newFn, scope) {
                /// <summary>创建一个原始函数和传递函数的序列，先执行原始函数然后将原始函数的传参传递到传递函数，再执行传递函数</summary>
                /// <param name="origFn" type="Function">原始函数</param>
                /// <param name="newFn" type="Function">传递函数</param>
                /// <param name="scope" type="Object">指定函数中的上下文this</param>
                /// <returns type="Function" />

                if (!_function.isFunction(newFn)) {
                    return origFn;
                }
                else {
                    return function () {
                        var retval = origFn.apply(this || window, arguments);
                        newFn.apply(scope || this || window, arguments);
                        return retval;
                    };
                }
            },
            createThrottled: function (fn, interval, scope) {
                /// <summary>创建一个指定时间间隔的函数，多次调查之间，要经过指定的时长后才能执行下一次</summary>
                /// <param name="fn" type="Function">原始函数</param>
                /// <param name="interval" type="Number">间隔时长</param>
                /// <param name="scope" type="Object">指定函数中的上下文this</param>
                /// <returns type="Function" />

                var lastCallTime, elapsed, lastArgs, timer,
                    execute = function () {
                        fn.apply(scope || this, lastArgs);
                        lastCallTime = new Date().getTime();
                    };

                return function () {
                    elapsed = new Date().getTime() - lastCallTime;
                    lastArgs = arguments;

                    clearTimeout(timer);
                    if (!lastCallTime || (elapsed >= interval)) {
                        execute();
                    }
                    else {
                        timer = setTimeout(execute, interval - elapsed);
                    }
                };
            }
        };
        //#endregion

        // 模块传递给默认PJtools.Function命名空间
        PJtools.Function = _function;

    })(jQuery);
    //#endregion

    //#region PJtools.Number -- 扩展Number类
    (function ($) {

        //#region 定义私有Number相关属性及方法
        var _private = {
            // 判断是否为数值类型
            isNumber: function (number) {
                return Object.prototype.toString.call(number) === '[object Number]' && isFinite(number);
            },
            // 判断是否为数值类型
            isNumeric: function (value) {
                return !isNaN(parseFloat(value)) && isFinite(value);
            }
        };
        //#endregion

        //#region 公共方法函数接口
        var _number = {
            isNumber: function (number) {
                /// <summary>判断是否为数值Number对象</summary>
                /// <param name="number" type="Object">待判断对象</param>
                /// <returns type="Boolean" />

                return _private.isNumber(number);
            },
            toNumber: function (number, defaultValue) {
                /// <summary>转换为数值Number类型</summary>
                /// <param name="number" type="Object">待判断对象</param>
                /// <param name="defaultValue" type="Number">当转换数组类型失败后返回默认值，默认为0</param>
                /// <returns type="Number" />

                defaultValue = defaultValue || 0;
                if (isFinite(number)) {
                    number = parseFloat(number);
                }
                return !isNaN(number) ? number : defaultValue;
            },
            round: function (number, precision) {
                /// <summary>将浮动数值进行四舍五入</summary>
                /// <param name="number" type="Number">待处理的数值</param>
                /// <param name="precision" type="Int">精确度位数，默认为0</param>
                /// <returns type="Number" />

                if (!this.isNumber(number)) { number = this.toNumber(number); }
                if ((0.9).toFixed() !== '1') {
                    precision = precision || 0;
                    var pow = Math.pow(10, precision);
                    return (Math.round(number * pow) / pow).toFixed(precision);
                }
                return number.toFixed(precision);
            },
            constrain: function (number, min, max) {
                /// <summary>检查数值是否在指定范围内，如果超出范围则返回最大、最小值取决于超出范围最大、最小侧</summary>
                /// <param name="number" type="Number">待检查的数值</param>
                /// <param name="min" type="Number">最小值范围</param>
                /// <param name="max" type="Number">最大值范围</param>
                /// <returns type="Number" />

                if (!this.isNumber(number)) { number = this.toNumber(number); }
                if (!isNaN(min)) { number = Math.max(number, min); }
                if (!isNaN(max)) { number = Math.min(number, max); }
                return number;
            },
            toMoney: function (number, precision) {
                /// <summary>转换成金额货币格式</summary>
                /// <param name="number" type="Number">待处理的数值</param>
                /// <param name="precision" type="Int">精确度位数，默认为2</param>
                /// <returns type="String" />

                precision = precision || 2;
                number = this.round(number, precision);
                number = String(number);
                var ps = number.split('.'), whole = ps[0], sub = ps[1] ? '.' + ps[1] : '', r = /(\d+)(\d{3})/;
                while (r.test(whole)) {
                    whole = whole.replace(r, '$1' + ',' + '$2');
                }
                number = whole + sub;
                if (number.charAt(0) == '-') {
                    return '-' + number.substr(1);
                }
                return number;
            },
            toPercent: function (number) {
                /// <summary>转换成百分比格式</summary>
                /// <param name="value" type="Number">待处理的数值</param>
                /// <returns type="String" />

                return number.toString() + "%";
            }
        };
        //#endregion

        // 模块传递给默认PJtools.Number命名空间
        PJtools.Number = _number;

    })(jQuery);
    //#endregion

    //#region PJtools.Object -- 扩展Object类
    (function ($) {

        //#region 定义私有Object相关属性及方法
        var toString = Object.prototype.toString;

        var _private = {
            // 判断是否为对象Object类型
            isObject: function (val) {
                return val === Object(val);
            },
            // 判断是否为数组Array类型
            isArray: Array.isArray || function (val) {
                return toString.call(val) === '[object Array]';
            },
            // 判断是否为空类型
            isEmpty: function (value, allowEmptyString) {
                return (value === null) || (value === undefined) || (!allowEmptyString ? value === '' : false) || (_private.isArray(value) && value.length === 0);
            },
            // 判断是否为数值类型
            isNumeric: function (value) {
                return !isNaN(parseFloat(value)) && isFinite(value);
            },
            test: function (obj) {
                var result = 0;
                if (_private.isArray(obj)) { result = 1; }
                else if (_private.isObject(obj)) {
                    try {
                        if ('length' in obj && !obj.tagName && !obj.alert && !obj.apply) {
                            result = 2;
                        }
                    }
                    catch (ex) { }
                }
                return result;
            },
            toArray: function (thing, startIndex, force) {
                var len, result;
                startIndex || (startIndex = 0);

                if (force || _private.test(thing)) {
                    try {
                        return Array.prototype.slice.call(thing, startIndex);
                    }
                    catch (ex) {
                        result = [];
                        for (len = thing.length; startIndex < len; ++startIndex) {
                            result.push(thing[startIndex]);
                        }
                        return result;
                    }
                }
                return [thing];
            }
        };
        //#endregion

        //#region 公共方法函数接口
        var _object = {
            isObject: function (object) {
                /// <summary>判断是否为Object对象</summary>
                /// <param name="object" type="Object">待判断对象</param>
                /// <returns type="Boolean" />

                return _private.isObject(object);
            },
            toObject: function (name, value, recursive) {
                /// <summary>将数组、对象等转成Object对象</summary>
                /// <param name="name" type="String">对象Key键值名称</param>
                /// <param name="value" type="Array/Object">对象的Value值</param>
                /// <param name="recursive" type="Boolean">是否递归转换</param>
                /// <returns type="Object" />

                var self = _object.toObject, objects = [], i, ln;

                if (_private.isArray(value)) {
                    for (i = 0, ln = value.length; i < ln; i++) {
                        if (recursive) {
                            objects = objects.concat(self(name + '[' + i + ']', value[i], true));
                        }
                        else {
                            objects.push({ name: name, value: value[i] });
                        }
                    }
                }
                else if (_private.isObject(value)) {
                    for (i in value) {
                        if (value.hasOwnProperty(i)) {
                            if (recursive) {
                                objects = objects.concat(self(name + '[' + i + ']', value[i], true));
                            }
                            else {
                                objects.push({ name: name, value: value[i] });
                            }
                        }
                    }
                }
                else {
                    objects.push({ name: name, value: value });
                }

                return objects;
            },
            toQueryString: function (object, recursive) {
                /// <summary>将Object对象转换成键对值编码字符串</summary>
                /// <param name="object" type="Object">待转换的对象</param>
                /// <param name="recursive" type="Boolean">是否递归</param>
                /// <returns type="String" />

                var paramObjects = [], params = [], i, j, ln, paramObject, value;

                for (i in object) {
                    if (object.hasOwnProperty(i)) {
                        paramObjects = paramObjects.concat(_object.toObject(i, object[i], recursive));
                    }
                }

                for (j = 0, ln = paramObjects.length; j < ln; j++) {
                    paramObject = paramObjects[j];
                    value = paramObject.value;

                    if (_private.isEmpty(value)) { value = ''; }

                    params.push(encodeURIComponent(paramObject.name) + '=' + encodeURIComponent(String(value)));
                }

                return params.join('&');
            },
            fromQueryString: function (queryString, recursive) {
                /// <summary>将键对值编码字符串解析成Object对象</summary>
                /// <param name="queryString" type="String">待转换的编码字符串</param>
                /// <param name="recursive" type="Boolean">是否递归</param>
                /// <returns type="Object" />

                var parts = queryString.replace(/^\?/, '').split('&'),
                    object = {},
                    temp, components, name, value, i, ln,
                    part, j, subLn, matchedKeys, matchedName,
                    keys, key, nextKey;

                for (i = 0, ln = parts.length; i < ln; i++) {
                    part = parts[i];

                    if (part.length > 0) {
                        components = part.split('=');
                        name = decodeURIComponent(components[0]);
                        value = (components[1] !== undefined) ? decodeURIComponent(components[1]) : '';

                        if (!recursive) {
                            if (object.hasOwnProperty(name)) {
                                if (!_private.isArray(object[name])) {
                                    object[name] = [object[name]];
                                }

                                object[name].push(value);
                            }
                            else {
                                object[name] = value;
                            }
                        }
                        else {
                            matchedKeys = name.match(/(\[):?([^\]]*)\]/g);
                            matchedName = name.match(/^([^\[]+)/);

                            if (!matchedName) { return null; }

                            name = matchedName[0];
                            keys = [];

                            if (matchedKeys === null) {
                                object[name] = value;
                                continue;
                            }

                            for (j = 0, subLn = matchedKeys.length; j < subLn; j++) {
                                key = matchedKeys[j];
                                key = (key.length === 2) ? '' : key.substring(1, key.length - 1);
                                keys.push(key);
                            }

                            keys.unshift(name);

                            temp = object;

                            for (j = 0, subLn = keys.length; j < subLn; j++) {
                                key = keys[j];

                                if (j === subLn - 1) {
                                    if (_private.isArray(temp) && key === '') {
                                        temp.push(value);
                                    }
                                    else {
                                        temp[key] = value;
                                    }
                                }
                                else {
                                    if (temp[key] === undefined || typeof temp[key] === 'string') {
                                        nextKey = keys[j + 1];

                                        temp[key] = (_private.isNumeric(nextKey) || nextKey === '') ? [] : {};
                                    }

                                    temp = temp[key];
                                }
                            }
                        }
                    }
                }

                return object;
            },
            each: function (object, fn, scope) {
                /// <summary>遍历Object对象</summary>
                /// <param name="object" type="Object">待遍历的对象</param>
                /// <param name="fn" type="Function">对象项的回调的函数方法</param>
                /// <param name="scope" type="Object">指定回调函数中的上下文this</param>

                for (var property in object) {
                    if (object.hasOwnProperty(property)) {
                        if (fn.call(scope || object, property, object[property], object) === false) {
                            return;
                        }
                    }
                }
            },
            merge: function (source, key, value) {
                /// <summary>合并Object对象</summary>
                /// <param name="source" type="Object">待合并的源Object对象</param>
                /// <param name="key" type="String">待合并的key键名称</param>
                /// <param name="value" type="String">待合并的value值</param>
                /// <returns type="Object" />

                if (typeof key === 'string') {
                    if (value && value.constructor === Object) {
                        if (source[key] && source[key].constructor === Object) {
                            _object.merge(source[key], value);
                        }
                        else { source[key] = Ext.clone(value); }
                    }
                    else { source[key] = value; }

                    return source;
                }

                var i = 1, ln = arguments.length, object, property;

                for (; i < ln; i++) {
                    object = arguments[i];

                    for (property in object) {
                        if (object.hasOwnProperty(property)) {
                            _object.merge(source, property, object[property]);
                        }
                    }
                }

                return source;
            },
            getKey: function (object, value) {
                /// <summary>根据value值获取Object对象的key名</summary>
                /// <param name="object" type="Object">待处理的Object对象</param>
                /// <param name="value" type="Object">对象的value值</param>
                /// <returns type="Object" />

                for (var property in object) {
                    if (object.hasOwnProperty(property) && object[property] === value) {
                        return property;
                    }
                }

                return null;
            },
            getKeys: ('keys' in Object.prototype) ? Object.keys : function (object) {
                /// <summary>获取Object对象的key名数组</summary>
                /// <param name="object" type="Object">待处理的Object对象</param>
                /// <returns type="Array" />

                var keys = [], property;

                for (property in object) {
                    if (object.hasOwnProperty(property)) {
                        keys.push(property);
                    }
                }

                return keys;
            },
            getValue: function (object, key) {
                /// <summary>根据key名获取Object对象的value值</summary>
                /// <param name="object" type="Object">待处理的Object对象</param>
                /// <param name="key" type="String">对象的key键值名</param>
                /// <returns type="Array" />

                if (!_private.isObject(object)) { return undefined; }

                var i, p = _private.toArray(key), l = p.length;

                for (i = 0; object !== undefined && i < l; i++) {
                    object = object[p[i]];
                }

                return object;
            },
            getValues: function (object) {
                /// <summary>获取Object对象的value值</summary>
                /// <param name="object" type="Object">待处理的Object对象</param>
                /// <returns type="Array" />

                var values = [], property;

                for (property in object) {
                    if (object.hasOwnProperty(property)) {
                        values.push(object[property]);
                    }
                }

                return values;
            },
            setValue: function (object, key, value) {
                /// <summary>修改Object对象指定key名的value值</summary>
                /// <param name="object" type="Object">待处理的Object对象</param>
                /// <param name="key" type="String">Object对象键值key名</param>
                /// <param name="value" type="Object">待修改的value值</param>
                /// <returns type="Object" />

                var i, p = _private.toArray(key), leafIdx = p.length - 1, ref = object;

                if (leafIdx >= 0) {
                    for (i = 0; ref !== undefined && i < leafIdx; i++) {
                        ref = ref[p[i]];
                    }

                    if (ref !== undefined) {
                        ref[p[i]] = value;
                    }
                    else {
                        return undefined;
                    }
                }

                return object;
            },
            getSize: function (object) {
                /// <summary>获取Object对象length长度</summary>
                /// <param name="object" type="Object">待处理的Object对象</param>
                /// <returns type="Int" />

                var size = 0, property;

                for (property in object) {
                    if (object.hasOwnProperty(property)) {
                        size++;
                    }
                }

                return size;
            }
        };
        //#endregion

        // 模块传递给默认PJtools.Object命名空间
        PJtools.Object = _object;

    })(jQuery);
    //#endregion

    //#region PJtools.String -- 扩展String类
    (function ($) {

        //#region 定义私有String相关属性及方法
        var isBrowser = typeof window != "undefined" && typeof location != "undefined" && typeof document != "undefined" && window.location == location && window.document == document,
            global = this,
            doc = isBrowser && document,
            element = doc && doc.createElement("DiV"),
            toString = Object.prototype.toString,
            cache = {},
            _private = {
                _toArray: function (obj, offset, startWith) {
                    return (startWith || []).concat(Array.prototype.slice.call(obj, offset || 0));
                },
                // 判断是否为字符串String类型
                isString: function (val) {
                    return toString.call(val) === '[object String]';
                },
                _hitchArgs: function (scope, method) {
                    var pre = _private._toArray(arguments, 2);
                    var named = _private.isString(method);
                    return function () {
                        var args = _private._toArray(arguments);
                        var f = named ? (scope || window)[method] : method;
                        return f && f.apply(scope || this, pre.concat(args));
                    };
                },
                hitch: function (scope, method) {
                    if (arguments.length > 2) {
                        return _private._hitchArgs.apply(undefined, arguments);
                    }
                    if (!method) {
                        method = scope;
                        scope = null;
                    }
                    if (_private.isString(method)) {
                        scope = scope || global;
                        if (!scope[method]) { throw (['hitch: scope["', method, '"] is null (scope="', scope, '")'].join('')); }
                        return function () { return scope[method].apply(scope, arguments || []); };
                    }
                    return !scope ? method : function () { return method.apply(scope, arguments || []); };
                },
                getObject: function (name, create, context) {
                    return _private.getProp(name.split("."), create, context);
                },
                getProp: function (parts, create, context) {
                    var p, i = 0, dojoGlobal = global;
                    if (!context) {
                        if (!parts.length) { return dojoGlobal; }
                        else {
                            p = parts[i++];
                            context = (p in dojoGlobal ? dojoGlobal[p] : (create ? dojoGlobal[p] = {} : undefined));
                        }
                    }
                    while (context && (p = parts[i++])) {
                        context = (p in context ? context[p] : (create ? context[p] = {} : undefined));
                    }
                    return context;
                }
            };
        //#endregion

        //#region 公共方法函数接口
        var _string = {
            isString: function (val) {
                /// <summary>判断是否为字符串String对象</summary>
                /// <param name="val" type="Object">待判断对象</param>
                /// <returns type="Boolean" />

                return _private.isString(val);
            },
            undef: function (value) {
                /// <summary>判断值是否存为空值，如果为空值则返回空字符串</summary>
                /// <param name="value" type="String">待验证String字符串</param>
                /// <returns type="String" />

                return value !== undefined && value !== null && value.toString() !== "NaN" ? value : "";
            },
            defaultValue: function (value, defaultValue) {
                /// <summary>将空值替换为默认值</summary>
                /// <param name="value" type="String">待验证String字符串</param>
                /// <param name="defaultValue" type="String">默认值String字符串</param>
                /// <returns type="String" />

                return value !== undefined && value !== '' && value !== null && value.toString() !== "NaN" ? value : defaultValue;
            },
            replicate: function (value, num) {
                /// <summary>将字符串复制指定次数后，返回新字符串；如果设置次数小于0，则返回空字符串</summary>
                /// <param name="value" type="String">待复制字符串</param>
                /// <param name="num" type="Number">复制次数</param>
                /// <returns type="String" />

                if (num <= 0 || !value) { return ""; }

                var buf = [];
                for (; ;) {
                    if (num & 1) { buf.push(value); }
                    if (!(num >>= 1)) { break; }
                    value += value;
                }
                return buf.join("");
            },
            ellipsis: function (value, len, word) {
                /// <summary>转换成省略文本</summary>
                /// <param name="value" type="String">待截取String字符串</param>
                /// <param name="len" type="Int">截取的长度</param>
                /// <param name="word" type="Boolean">是否截取的为整句</param>
                /// <returns type="String" />

                if (value && value.length > len) {
                    if (word) {
                        var vs = value.substr(0, len - 2),
                            index = Math.max(vs.lastIndexOf(' '), vs.lastIndexOf('.'), vs.lastIndexOf('!'), vs.lastIndexOf('?'), vs.lastIndexOf('。'), vs.lastIndexOf('！'), vs.lastIndexOf('？'));
                        if (index == -1 || index < (len - 15)) {
                            return value.substr(0, len - 3) + "...";
                        } else {
                            return vs.substr(0, index) + "...";
                        }
                    }
                    else {
                        return value.substr(0, len - 3) + "...";
                    }
                }
                return value;
            },
            capitalize: function (value) {
                /// <summary>转换成首字母大写，其他字符小写</summary>
                /// <param name="value" type="String">String字符串</param>
                /// <returns type="String" />

                return !value ? value : value.charAt(0).toUpperCase() + value.substr(1).toLowerCase();
            },
            pad: function (value, size, ch, end) {
                /// <summary>填充指定字符直至指定字符串长度为止，默认填充到字符串开头</summary>
                /// <param name="value" type="String">待填充字符串</param>
                /// <param name="size" type="Int">字符串长度</param>
                /// <param name="ch" type="String">填充字符，默认为‘0’</param>
                /// <param name="end" type="Boolean">是否填充到末尾</param>
                /// <returns type="String" />

                if (!ch) { ch = '0'; }
                var out = String(value),
                    pad = this.replicate(ch, Math.ceil((size - out.length) / ch.length));
                return end ? out + pad : pad + out;
            },
            substitute: function (template, map, transform, thisObject) {
                /// <summary>将字符串参数模版进行替换</summary>
                /// <param name="template" type="String">待替换字符串</param>
                /// <param name="map" type="Object/Array">替换模版的数组或键值对</param>
                /// <param name="transform" type="Function">可选变量，处理替换模版前的函数</param>
                /// <param name="thisObject" type="Object">可选变量，定义替换模版处理对象，默认全局命名空间</param>
                /// <returns type="String" />

                thisObject = thisObject || global;
                transform = transform ? _private.hitch(thisObject, transform) : function (v) { return v; };

                return template.replace(/\$\{([^\s\:\}]+)(?:\:([^\s\:\}]+))?\}/g, function (match, key, format) {
                    var value = _private.getObject(key, false, map);
                    if (format) {
                        value = _private.getObject(format, false, thisObject).call(thisObject, value, key);
                    }
                    return transform(value, key).toString();
                });
            },
            trimLeft: String.prototype.trimLeft ? function (value) {
                /// <summary>去掉字符串左边首位空格</summary>
                /// <param name="value" type="String">待替换字符串</param>
                /// <returns type="String" />

                return value.trimLeft();
            } : function (value) {
                /// <summary>去掉字符串左边首位空格</summary>
                /// <param name="value" type="String">待替换字符串</param>
                /// <returns type="String" />

                return value.replace(/^\s+/, '');
            },
            trimRight: String.prototype.trimRight ? function (value) {
                /// <summary>去掉字符串右边尾部空格</summary>
                /// <param name="value" type="String">待替换字符串</param>
                /// <returns type="String" />

                return value.trimRight();
            } : function (value) {
                /// <summary>去掉字符串右边尾部空格</summary>
                /// <param name="value" type="String">待替换字符串</param>
                /// <returns type="String" />

                return value.replace(/\s+$/, '');
            }
        };
        //#endregion

        // 模块传递给默认PJtools.String命名空间
        PJtools.String = _string;

    })(jQuery);
    //#endregion

    //#region PJtools.Format -- 扩展Format类
    (function ($) {

        //#region 定义私有Format相关属性及方法
        var stripTagsRE = /<\/?[^>]+>/gi,
            stripScriptsRe = /(?:<script.*?>)((\n|\r|.)*?)(?:<\/script>)/ig,
            nl2brRe = /\r?\n/g;

        var toString = Object.prototype.toString;
        var _private = {
            // 判断是否为对象Object类型
            isObject: function (val) {
                return val === Object(val);
            },
            // 判断是否为数组Array类型
            isArray: Array.isArray || function (val) {
                return toString.call(val) === '[object Array]';
            },
            // 判断是否为空类型
            isEmpty: function (value, allowEmptyString) {
                return (value === null) || (value === undefined) || (!allowEmptyString ? value === '' : false) || (_private.isArray(value) && value.length === 0);
            }
        };
        //#endregion

        //#region 公共方法函数接口
        var _format = {
            QueryString: function (obj, url) {
                /// <summary>获取当前页地址栏传值</summary>
                /// <param name="obj" type="String">Key值</param>
                /// <param name="url" type="String">（可选）URL地址，当设置URL时，则不使用当前地址栏字符串</param>
                /// <returns type="String" />

                if (!url) { url = window.location.search; }
                var reg = new RegExp("[\?\&]" + obj + "=([^\&]+)", "i");
                return url.match(reg) ? url.match(reg)[1] : null;
            },
            stripTags: function (v) {
                /// <summary>获取剥去html标签的Text值</summary>
                /// <param name="v" type="String">Html字符串</param>
                /// <returns type="String" />

                return !v ? v : String(v).replace(stripTagsRE, "");
            },
            stripScripts: function (v) {
                /// <summary>获取JavaScript脚本</summary>
                /// <param name="v" type="String">Script字符串</param>
                /// <returns type="String" />

                return !v ? v : String(v).replace(stripScriptsRe, "");
            },
            fileSize: function (size) {
                /// <summary>转换最佳的文件大小</summary>
                /// <param name="size" type="Int">文件大小数值</param>
                /// <returns type="String" />

                if (size < 1024) {
                    return size + " bytes";
                } else if (size < 1048576) {
                    return (Math.round(((size * 10) / 1024)) / 10) + " KB";
                } else {
                    return (Math.round(((size * 10) / 1048576)) / 10) + " MB";
                }
            },
            defaultValue: function (value, defaultValue) {
                /// <summary>将空值替换为默认值</summary>
                /// <param name="value" type="String">待验证String字符串</param>
                /// <param name="defaultValue" type="String">默认值String字符串</param>
                /// <returns type="String" />

                return value !== undefined && value !== '' ? value : defaultValue;
            },
            locationDomain: function () {
                /// <summary>获取网站域名</summary>
                /// <returns type="String" />

                var _href = document.location.protocol + "//" + document.location.hostname + "/";
                $(document.location.pathname.split('/')).each(function () {
                    if (this.toString() != "") {
                        _href += this.toString() + "/";
                        return false;
                    }
                });
                return _href;
            },
            nl2br: function (v) {
                /// <summary>将字符串中的换行符转换成html标签中的<br /></summary>
                /// <param name="v" type="String">待转换的字符串</param>
                /// <returns type="String" />

                return _private.isEmpty(v) ? '' : v.replace(nl2brRe, '<br />');
            },
            htmlEncode: function (value) {
                /// <summary>html特殊符号转换成代码</summary>
                /// <param name="value" type="String">String字符串</param>
                /// <returns type="String" />

                return !value ? value : String(value).replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
            },
            htmlDecode: function (value) {
                /// <summary>html代码反转化成特殊符号</summary>
                /// <param name="value" type="String">String字符串</param>
                /// <returns type="String" />

                return !value ? value : String(value).replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
            },
            parseCssBox: function (element) {
                /// <summary>将CSS的Element对象解析对应的border，margin，padding，left，right，top，bottom</summary>
                /// <param name="element" type="Object">CSS的Element对象</param>
                /// <returns type="Object" />

                var xdata = {};

                xdata.border = {
                    top: element.style.borderTop != "" ? parseInt(element.style.borderTop, 10) : 0,
                    right: element.style.borderRight != "" ? parseInt(element.style.borderRight, 10) : 0,
                    bottom: element.style.borderBottom != "" ? parseInt(element.style.borderBottom, 10) : 0,
                    left: element.style.borderLeft != "" ? parseInt(element.style.borderLeft, 10) : 0
                };

                xdata.margin = {
                    top: element.style.marginTop != "" ? parseInt(element.style.marginTop, 10) : 0,
                    right: element.style.marginRight != "" ? parseInt(element.style.marginRight, 10) : 0,
                    bottom: element.style.marginBottom != "" ? parseInt(element.style.marginBottom, 10) : 0,
                    left: element.style.marginLeft != "" ? parseInt(element.style.marginLeft, 10) : 0
                };

                xdata.padding = {
                    top: element.style.paddingTop != "" ? parseInt(element.style.paddingTop, 10) : 0,
                    right: element.style.paddingRight != "" ? parseInt(element.style.paddingRight, 10) : 0,
                    bottom: element.style.paddingBottom != "" ? parseInt(element.style.paddingBottom, 10) : 0,
                    left: element.style.paddingLeft != "" ? parseInt(element.style.paddingLeft, 10) : 0
                };

                xdata.offset = {
                    top: element.style.top != "" ? parseInt(element.style.top, 10) : 0,
                    right: element.style.right != "" ? parseInt(element.style.right, 10) : 0,
                    bottom: element.style.bottom != "" ? parseInt(element.style.bottom, 10) : 0,
                    left: element.style.left != "" ? parseInt(element.style.left, 10) : 0
                };

                return xdata;
            },
            unescapeJson: function (json) {
                /// <summary>将escape方式加密json对象以unescape解密还原</summary>
                /// <param name="json" type="Object">待解密的json对象</param>
                /// <returns type="Object" />

                for (var key in json) {
                    if (_private.isObject(json[key])) {
                        _format.unescapeJson(json[key]);
                    }
                    else {
                        json[key] = unescape(json[key]);
                    }
                }
                return json;
            },
            jsonUnEscape: function (json) {
                /// <summary>Json对象解密编码</summary>
                /// <param name="json" type="Object">加密Json对象</param>
                /// <returns type="Object" />

                for (var name in json) {
                    if (typeof json[name] == 'string') {
                        json[name] = unescape(json[name]);
                    }
                    else {
                        for (var obj in json[name]) {
                            if (typeof json[name][obj] == "string") {
                                json[name][obj] = unescape(json[name][obj]);
                            }
                            else {
                                for (var key in json[name][obj]) {
                                    json[name][obj][key] = unescape(json[name][obj][key]);
                                }
                            }
                        }
                    }
                }
                return json;
            },
            usMoney: function (v) {
                /// <summary>转换成货币格式字符串</summary>
                /// <param name="v" type="String">Number数值/数值字符串</param>
                /// <returns type="String" />

                v = (Math.round((v - 0) * 100)) / 100;
                v = (v == Math.floor(v)) ? v + ".00" : ((v * 10 == Math.floor(v * 10)) ? v + "0" : v);
                v = String(v);
                var ps = v.split('.'),
                whole = ps[0],
                sub = ps[1] ? '.' + ps[1] : '.00',
                r = /(\d+)(\d{3})/;
                while (r.test(whole)) {
                    whole = whole.replace(r, '$1' + ',' + '$2');
                }
                v = whole + sub;
                if (v.charAt(0) == '-') {
                    return '￥-' + v.substr(1);
                }
                return "￥" + v;
            },
            usPrct: function (value) {
                /// <summary>转换成百分比格式</summary>
                /// <param name="value" type="String">Number数值/数值字符串</param>
                /// <returns type="String" />

                return value.toString() + "%";
            },
            usDate: function (value, format) {
                /// <summary>转换自定义时间格式</summary>
                /// <param name="value" type="String">日期字符串</param>
                /// <param name="format" type="String">待转换的日期格式</param>
                /// <returns type="String" />

                if (format == "" || format == null || format == undefined) { format = "yyyy-MM-dd"; } // 设置默认时间格式
                value = new Date(Date.parse(value.replace(/\-/g, "/")));
                if (value != "NaN") {
                    return new PJtools.Date().dateFormat(value, format);
                }
                return "";
            },
            cssElementToWH: function (element) {
                /// <summary>兼容浏览器获取对象margin，padding，border的宽高</summary>
                /// <param name="obj" type="String">Html的Element对象</param>
                /// <returns type="Object" />

                var _object = {
                    width: 0,
                    height: 0
                };
                // 宽度
                _object.width += parseInt(this.defaultValue($(element).css("border-left-width"), "0"));
                _object.width += parseInt(this.defaultValue($(element).css("border-right-width"), "0"));
                _object.width += parseInt(this.defaultValue($(element).css("margin-left"), "0"));
                _object.width += parseInt(this.defaultValue($(element).css("margin-right"), "0"));
                _object.width += parseInt(this.defaultValue($(element).css("padding-left"), "0"));
                _object.width += parseInt(this.defaultValue($(element).css("padding-right"), "0"));
                // 高度
                _object.height += parseInt(this.defaultValue($(element).css("border-top-width"), "0"));
                _object.height += parseInt(this.defaultValue($(element).css("border-bottom-width"), "0"));
                _object.height += parseInt(this.defaultValue($(element).css("margin-top"), "0"));
                _object.height += parseInt(this.defaultValue($(element).css("margin-bottom"), "0"));
                _object.height += parseInt(this.defaultValue($(element).css("padding-top"), "0"));
                _object.height += parseInt(this.defaultValue($(element).css("padding-bottom"), "0"));
                return _object;
            }
        };
        //#endregion

        // 模块传递给默认PJtools.Format命名空间
        PJtools.Format = _format;

    })(jQuery);
    //#endregion

    //#region PJtools.Event -- 扩展Jquery.Event类
    (function ($) {

        //#region 扩展Jquery模块的MouseWheel事件
        (function ($) {

            var types = ['DOMMouseScroll', 'mousewheel'];

            if ($.event.fixHooks) {
                for (var i = types.length; i;) {
                    $.event.fixHooks[types[--i]] = $.event.mouseHooks;
                }
            }

            $.event.special.mousewheel = {
                // 添加自定义mousewheel事件监听
                setup: function () {
                    if (this.addEventListener) {
                        for (var i = types.length; i;) {
                            this.addEventListener(types[--i], $.event.special.mousewheel.handler, false);
                        }
                    }
                    else {
                        this.onmousewheel = $.event.special.mousewheel.handler;
                    }
                },
                // 移除自定义mousewheel事件监听
                teardown: function () {
                    if (this.removeEventListener) {
                        for (var i = types.length; i;) {
                            this.removeEventListener(types[--i], $.event.special.mousewheel.handler, false);
                        }
                    }
                    else {
                        this.onmousewheel = null;
                    }
                },
                // 内部自定义mousewheel事件处理函数
                handler: function (evt) {
                    var orgEvent = evt || window.event,
                        args = [].slice.call(arguments, 1),
                        delta = 0,
                        returnValue = true,
                        deltaX = 0,
                        deltaY = 0;

                    evt = $.event.fix(orgEvent);
                    evt.type = "mousewheel";

                    if (orgEvent.wheelDelta) { delta = orgEvent.wheelDelta / 120; }
                    if (orgEvent.detail) { delta = -orgEvent.detail / 3; }

                    deltaY = delta;

                    // 兼容Gecko内核浏览器
                    if (orgEvent.axis !== undefined && orgEvent.axis === orgEvent.HORIZONTAL_AXIS) {
                        deltaY = 0;
                        deltaX = -1 * delta;
                    }

                    // 兼容Webkit内核浏览器
                    if (orgEvent.wheelDeltaY !== undefined) { deltaY = orgEvent.wheelDeltaY / 120; }
                    if (orgEvent.wheelDeltaX !== undefined) { deltaX = -1 * orgEvent.wheelDeltaX / 120; }

                    // 为事件的添加相关参数项
                    args.unshift(evt, delta, deltaX, deltaY);

                    return ($.event.dispatch || $.event.handle).apply(this, args);
                }
            };

            $.fn.extend({
                mousewheel: function (data, fn) {
                    return fn
                        ? data ? this.bind("mousewheel", data, fn) : this.bind("mousewheel", fn)
                        : this.trigger("mousewheel");
                }
            });

        })($);
        //#endregion

        //#region 扩展Jquery模块的ClickOut事件
        (function ($, elements) {

            var types = "clickout";

            if ($.event.fixHooks) {
                $.event.fixHooks[types] = $.event.mouseHooks;
            }

            $.event.special.clickout = {
                // 添加自定义clickout事件监听
                setup: function () {
                    var i = elements.length;
                    if (!i) {
                        $.event.add(document, 'click', $.event.special.clickout.handler);
                    }
                    if ($.inArray(this, elements) < 0) { elements[i] = this; }
                },
                // 移除自定义clickout事件监听
                teardown: function () {
                    var i = $.inArray(this, elements);
                    if (i >= 0) {
                        elements.splice(i, 1);
                        if (!elements.length) {
                            $.event.remove(document, 'click', $.event.special.clickout.handler);
                        }
                    }
                },
                // 内部自定义mousewheel事件处理函数
                handler: function (evt) {
                    var i = 0, len = elements.length, target = evt.target, elem;

                    for (; i < len; i++) {
                        elem = elements[i];
                        if (elem !== target && !(elem.contains ? elem.contains(target) : elem.compareDocumentPosition ? elem.compareDocumentPosition(target) & 16 : 1)) {
                            $.event.trigger(types, evt, elem);
                        }
                    }
                }
            };

            $.fn.extend({
                clickout: function (data, fn) {
                    return fn
                        ? data ? this.bind(types, data, fn) : this.bind(types, fn)
                        : this.trigger(types);
                }
            });

        })($, []);
        //#endregion

        //#region 扩展Jquery模块的RightClick事件
        (function ($) {

            var types = 'rightclick';

            if ($.event.fixHooks) {
                $.event.fixHooks[types] = $.event.mouseHooks;
            }

            $.event.special.rightclick = {
                // 添加自定义rightclick事件监听
                setup: function () {
                    if (this.addEventListener) {
                        this.addEventListener('mousedown', $.event.special.rightclick.handler, false);
                    }
                    else {
                        this.onrightclick = $.event.special.rightclick.handler;
                    }
                },
                // 移除自定义rightclick事件监听
                teardown: function () {
                    if (this.removeEventListener) {
                        this.removeEventListener('mousedown', $.event.special.rightclick.handler, false);
                    }
                    else {
                        this.onrightclick = null;
                    }
                },
                // 内部自定义rightclick事件处理函数
                handler: function (evt) {
                    // 禁止系统自带右键菜单
                    $(document).bind('contextmenu', function (e) {
                        return false;
                    });

                    // 判断是否为鼠标右键
                    if (3 == evt.which) {
                        var orgEvent = evt || window.event,
                            args = [].slice.call(arguments, 1);

                        evt = $.event.fix(orgEvent);
                        evt.type = types;
                        args.unshift(evt);

                        return ($.event.dispatch || $.event.handle).apply(this, args);
                    }
                }
            };

            $.fn.extend({
                rightclick: function (data, fn) {
                    return fn
                        ? data ? this.bind(types, data, fn) : this.bind(types, fn)
                        : this.trigger(types);
                }
            });

        })($);
        //#endregion

    })(jQuery);
    //#endregion

    //#region PJtools.Easing -- 扩展Jquery.Easing类
    (function ($) {

        //#region 扩展Jquery模块的Easing动画效果
        (function ($) {

            $.extend($.easing, {
                def: 'easeOutQuad',
                swing: function (x, t, b, c, d) {
                    return $.easing[$.easing.def](x, t, b, c, d);
                },
                easeInQuad: function (x, t, b, c, d) {
                    return c * (t /= d) * t + b;
                },
                easeOutQuad: function (x, t, b, c, d) {
                    return -c * (t /= d) * (t - 2) + b;
                },
                easeInOutQuad: function (x, t, b, c, d) {
                    if ((t /= d / 2) < 1) return c / 2 * t * t + b;
                    return -c / 2 * ((--t) * (t - 2) - 1) + b;
                },
                easeInCubic: function (x, t, b, c, d) {
                    return c * (t /= d) * t * t + b;
                },
                easeOutCubic: function (x, t, b, c, d) {
                    return c * ((t = t / d - 1) * t * t + 1) + b;
                },
                easeInOutCubic: function (x, t, b, c, d) {
                    if ((t /= d / 2) < 1) return c / 2 * t * t * t + b;
                    return c / 2 * ((t -= 2) * t * t + 2) + b;
                },
                easeInQuart: function (x, t, b, c, d) {
                    return c * (t /= d) * t * t * t + b;
                },
                easeOutQuart: function (x, t, b, c, d) {
                    return -c * ((t = t / d - 1) * t * t * t - 1) + b;
                },
                easeInOutQuart: function (x, t, b, c, d) {
                    if ((t /= d / 2) < 1) return c / 2 * t * t * t * t + b;
                    return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
                },
                easeInQuint: function (x, t, b, c, d) {
                    return c * (t /= d) * t * t * t * t + b;
                },
                easeOutQuint: function (x, t, b, c, d) {
                    return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
                },
                easeInOutQuint: function (x, t, b, c, d) {
                    if ((t /= d / 2) < 1) return c / 2 * t * t * t * t * t + b;
                    return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
                },
                easeInSine: function (x, t, b, c, d) {
                    return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
                },
                easeOutSine: function (x, t, b, c, d) {
                    return c * Math.sin(t / d * (Math.PI / 2)) + b;
                },
                easeInOutSine: function (x, t, b, c, d) {
                    return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
                },
                easeInExpo: function (x, t, b, c, d) {
                    return (t == 0) ? b : c * Math.pow(2, 10 * (t / d - 1)) + b;
                },
                easeOutExpo: function (x, t, b, c, d) {
                    return (t == d) ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
                },
                easeInOutExpo: function (x, t, b, c, d) {
                    if (t == 0) return b;
                    if (t == d) return b + c;
                    if ((t /= d / 2) < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
                    return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
                },
                easeInCirc: function (x, t, b, c, d) {
                    return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
                },
                easeOutCirc: function (x, t, b, c, d) {
                    return c * Math.sqrt(1 - (t = t / d - 1) * t) + b;
                },
                easeInOutCirc: function (x, t, b, c, d) {
                    if ((t /= d / 2) < 1) return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
                    return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b;
                },
                easeInElastic: function (x, t, b, c, d) {
                    var s = 1.70158; var p = 0; var a = c;
                    if (t == 0) return b; if ((t /= d) == 1) return b + c; if (!p) p = d * .3;
                    if (a < Math.abs(c)) { a = c; var s = p / 4; }
                    else var s = p / (2 * Math.PI) * Math.asin(c / a);
                    return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
                },
                easeOutElastic: function (x, t, b, c, d) {
                    var s = 1.70158; var p = 0; var a = c;
                    if (t == 0) return b; if ((t /= d) == 1) return b + c; if (!p) p = d * .3;
                    if (a < Math.abs(c)) { a = c; var s = p / 4; }
                    else var s = p / (2 * Math.PI) * Math.asin(c / a);
                    return a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b;
                },
                easeInOutElastic: function (x, t, b, c, d) {
                    var s = 1.70158; var p = 0; var a = c;
                    if (t == 0) return b; if ((t /= d / 2) == 2) return b + c; if (!p) p = d * (.3 * 1.5);
                    if (a < Math.abs(c)) { a = c; var s = p / 4; }
                    else var s = p / (2 * Math.PI) * Math.asin(c / a);
                    if (t < 1) return -.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
                    return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * .5 + c + b;
                },
                easeInBack: function (x, t, b, c, d, s) {
                    if (s == undefined) s = 1.70158;
                    return c * (t /= d) * t * ((s + 1) * t - s) + b;
                },
                easeOutBack: function (x, t, b, c, d, s) {
                    if (s == undefined) s = 1.70158;
                    return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
                },
                easeInOutBack: function (x, t, b, c, d, s) {
                    if (s == undefined) s = 1.70158;
                    if ((t /= d / 2) < 1) return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;
                    return c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
                },
                easeInBounce: function (x, t, b, c, d) {
                    return c - jQuery.easing.easeOutBounce(x, d - t, 0, c, d) + b;
                },
                easeOutBounce: function (x, t, b, c, d) {
                    if ((t /= d) < (1 / 2.75)) {
                        return c * (7.5625 * t * t) + b;
                    } else if (t < (2 / 2.75)) {
                        return c * (7.5625 * (t -= (1.5 / 2.75)) * t + .75) + b;
                    } else if (t < (2.5 / 2.75)) {
                        return c * (7.5625 * (t -= (2.25 / 2.75)) * t + .9375) + b;
                    } else {
                        return c * (7.5625 * (t -= (2.625 / 2.75)) * t + .984375) + b;
                    }
                },
                easeInOutBounce: function (x, t, b, c, d) {
                    if (t < d / 2) return $.easing.easeInBounce(x, t * 2, 0, c, d) * .5 + b;
                    return $.easing.easeOutBounce(x, t * 2 - d, 0, c, d) * .5 + c * .5 + b;
                }
            });

        })($);
        //#endregion

    })(jQuery);
    //#endregion

    //#region PJtools.Rotate -- 扩展Jquery.Rotate类
    (function ($) {

        var supportedCSS, supportedCSSOrigin, styles = document.getElementsByTagName("head")[0].style, toCheck = "transformProperty WebkitTransform OTransform msTransform MozTransform".split(" ");
        for (var a = 0; a < toCheck.length; a++) if (styles[toCheck[a]] !== undefined) { supportedCSS = toCheck[a]; }
        if (supportedCSS) {
            supportedCSSOrigin = supportedCSS.replace(/[tT]ransform/, "TransformOrigin");
            if (supportedCSSOrigin[0] == "T") supportedCSSOrigin[0] = "t";
        }
        eval('IE = "v"=="\v"');
        jQuery.fn.extend({
            rotate: function (parameters) {
                if (this.length === 0 || typeof parameters == "undefined") return;
                if (typeof parameters == "number") parameters = { angle: parameters };
                var returned = [];
                for (var i = 0, i0 = this.length; i < i0; i++) {
                    var element = this.get(i);
                    if (!element.Wilq32 || !element.Wilq32.PhotoEffect) {
                        var paramClone = $.extend(true, {}, parameters);
                        var newRotObject = new Wilq32.PhotoEffect(element, paramClone)._rootObj;
                        returned.push($(newRotObject));
                    }
                    else {
                        element.Wilq32.PhotoEffect._handleRotation(parameters);
                    }
                }
                return returned;
            },
            getRotateAngle: function () {
                var ret = [];
                for (var i = 0, i0 = this.length; i < i0; i++) {
                    var element = this.get(i);
                    if (element.Wilq32 && element.Wilq32.PhotoEffect) {
                        ret[i] = element.Wilq32.PhotoEffect._angle;
                    }
                }
                return ret;
            },
            stopRotate: function () {
                for (var i = 0, i0 = this.length; i < i0; i++) {
                    var element = this.get(i);
                    if (element.Wilq32 && element.Wilq32.PhotoEffect) {
                        clearTimeout(element.Wilq32.PhotoEffect._timer);
                    }
                }
            }
        });
        Wilq32 = window.Wilq32 || {};
        Wilq32.PhotoEffect = (function () {
            if (supportedCSS) {
                return function (img, parameters) {
                    img.Wilq32 = {
                        PhotoEffect: this
                    };
                    this._img = this._rootObj = this._eventObj = img;
                    this._handleRotation(parameters);
                }
            } else {
                return function (img, parameters) {
                    this._img = img;
                    this._onLoadDelegate = [parameters];
                    this._rootObj = document.createElement('span');
                    this._rootObj.style.display = "inline-block";
                    this._rootObj.Wilq32 = {
                        PhotoEffect: this
                    };
                    img.parentNode.insertBefore(this._rootObj, img);
                    if (img.complete) {
                        this._Loader();
                    } else {
                        var self = this;
                        jQuery(this._img).bind("load", function () { self._Loader(); });
                    }
                }
            }
        })();
        Wilq32.PhotoEffect.prototype = {
            _setupParameters: function (parameters) {
                this._parameters = this._parameters || {};
                if (typeof this._angle !== "number") { this._angle = 0; }
                if (typeof parameters.angle === "number") { this._angle = parameters.angle; }
                this._parameters.animateTo = (typeof parameters.animateTo === "number") ? (parameters.animateTo) : (this._angle);
                this._parameters.step = parameters.step || this._parameters.step || null;
                this._parameters.easing = parameters.easing || this._parameters.easing || this._defaultEasing;
                this._parameters.duration = parameters.duration || this._parameters.duration || 1000;
                this._parameters.callback = parameters.callback || this._parameters.callback || this._emptyFunction;
                this._parameters.center = parameters.center || this._parameters.center || ["50%", "50%"];
                if (typeof this._parameters.center[0] == "string") {
                    this._rotationCenterX = (parseInt(this._parameters.center[0], 10) / 100) * this._imgWidth * this._aspectW;
                } else {
                    this._rotationCenterX = this._parameters.center[0];
                }
                if (typeof this._parameters.center[1] == "string") {
                    this._rotationCenterY = (parseInt(this._parameters.center[1], 10) / 100) * this._imgHeight * this._aspectH;
                } else {
                    this._rotationCenterY = this._parameters.center[1];
                }
                if (parameters.bind && parameters.bind != this._parameters.bind) { this._BindEvents(parameters.bind); }
            },
            _emptyFunction: function () { },
            _defaultEasing: function (x, t, b, c, d) { return -c * ((t = t / d - 1) * t * t * t - 1) + b },
            _handleRotation: function (parameters, dontcheck) {
                if (!supportedCSS && !this._img.complete && !dontcheck) {
                    this._onLoadDelegate.push(parameters);
                    return;
                }
                this._setupParameters(parameters);
                if (this._angle == this._parameters.animateTo) {
                    this._rotate(this._angle);
                }
                else {
                    this._animateStart();
                }
            },
            _BindEvents: function (events) {
                if (events && this._eventObj) {
                    if (this._parameters.bind) {
                        var oldEvents = this._parameters.bind;
                        for (var a in oldEvents) if (oldEvents.hasOwnProperty(a))
                            jQuery(this._eventObj).unbind(a, oldEvents[a]);
                    }
                    this._parameters.bind = events;
                    for (var a in events) if (events.hasOwnProperty(a))
                        jQuery(this._eventObj).bind(a, events[a]);
                }
            },
            _Loader: (function () {
                if (IE)
                    return function () {
                        var width = this._img.width;
                        var height = this._img.height;
                        this._imgWidth = width;
                        this._imgHeight = height;
                        this._img.parentNode.removeChild(this._img);
                        this._vimage = this.createVMLNode('image');
                        this._vimage.src = this._img.src;
                        this._vimage.style.height = height + "px";
                        this._vimage.style.width = width + "px";
                        this._vimage.style.position = "absolute"; 
                        this._vimage.style.top = "0px";
                        this._vimage.style.left = "0px";
                        this._aspectW = this._aspectH = 1;
                        this._container = this.createVMLNode('group');
                        this._container.style.width = width;
                        this._container.style.height = height;
                        this._container.style.position = "absolute";
                        this._container.style.top = "0px";
                        this._container.style.left = "0px";
                        this._container.setAttribute('coordsize', width - 1 + ',' + (height - 1)); 
                        this._container.appendChild(this._vimage);
                        this._rootObj.appendChild(this._container);
                        this._rootObj.style.position = "relative"; 
                        this._rootObj.style.width = width + "px";
                        this._rootObj.style.height = height + "px";
                        this._rootObj.setAttribute('id', this._img.getAttribute('id'));
                        this._rootObj.className = this._img.className;
                        this._eventObj = this._rootObj;
                        var parameters;
                        while (parameters = this._onLoadDelegate.shift()) {
                            this._handleRotation(parameters, true);
                        }
                    }
                else return function () {
                    this._rootObj.setAttribute('id', this._img.getAttribute('id'));
                    this._rootObj.className = this._img.className;
                    this._imgWidth = this._img.naturalWidth;
                    this._imgHeight = this._img.naturalHeight;
                    var _widthMax = Math.sqrt((this._imgHeight) * (this._imgHeight) + (this._imgWidth) * (this._imgWidth));
                    this._width = _widthMax * 3;
                    this._height = _widthMax * 3;
                    this._aspectW = this._img.offsetWidth / this._img.naturalWidth;
                    this._aspectH = this._img.offsetHeight / this._img.naturalHeight;
                    this._img.parentNode.removeChild(this._img);
                    this._canvas = document.createElement('canvas');
                    this._canvas.setAttribute('width', this._width);
                    this._canvas.style.position = "relative";
                    this._canvas.style.left = -this._img.height * this._aspectW + "px";
                    this._canvas.style.top = -this._img.width * this._aspectH + "px";
                    this._canvas.Wilq32 = this._rootObj.Wilq32;
                    this._rootObj.appendChild(this._canvas);
                    this._rootObj.style.width = this._img.width * this._aspectW + "px";
                    this._rootObj.style.height = this._img.height * this._aspectH + "px";
                    this._eventObj = this._canvas;
                    this._cnv = this._canvas.getContext('2d');
                    var parameters;
                    while (parameters = this._onLoadDelegate.shift()) {
                        this._handleRotation(parameters, true);
                    }
                }
            })(),
            _animateStart: function () {
                if (this._timer) {
                    clearTimeout(this._timer);
                }
                this._animateStartTime = +new Date;
                this._animateStartAngle = this._angle;
                this._animate();
            },
            _animate: function () {
                var actualTime = +new Date;
                var checkEnd = actualTime - this._animateStartTime > this._parameters.duration;
                if (checkEnd && !this._parameters.animatedGif) {
                    clearTimeout(this._timer);
                }
                else {
                    if (this._canvas || this._vimage || this._img) {
                        var angle = this._parameters.easing(0, actualTime - this._animateStartTime, this._animateStartAngle, this._parameters.animateTo - this._animateStartAngle, this._parameters.duration);
                        this._rotate((~~(angle * 10)) / 10);
                    }
                    if (this._parameters.step) {
                        this._parameters.step(this._angle);
                    }
                    var self = this;
                    this._timer = setTimeout(function () {
                        self._animate.call(self);
                    }, 10);
                }
                if (this._parameters.callback && checkEnd) {
                    this._angle = this._parameters.animateTo;
                    this._rotate(this._angle);
                    this._parameters.callback.call(this._rootObj);
                }
            },
            _rotate: (function () {
                var rad = Math.PI / 180;
                if (IE)
                    return function (angle) {
                        this._angle = angle;
                        this._container.style.rotation = (angle % 360) + "deg";
                        this._vimage.style.top = -(this._rotationCenterY - this._imgHeight / 2) + "px";
                        this._vimage.style.left = -(this._rotationCenterX - this._imgWidth / 2) + "px";
                        this._container.style.top = this._rotationCenterY - this._imgHeight / 2 + "px";
                        this._container.style.left = this._rotationCenterX - this._imgWidth / 2 + "px";
                    }
                else if (supportedCSS)
                    return function (angle) {
                        this._angle = angle;
                        this._img.style[supportedCSS] = "rotate(" + (angle % 360) + "deg)";
                        this._img.style[supportedCSSOrigin] = this._parameters.center.join(" ");
                    }
                else
                    return function (angle) {
                        this._angle = angle;
                        angle = (angle % 360) * rad;
                        this._canvas.width = this._width;
                        this._canvas.height = this._height;
                        this._cnv.translate(this._imgWidth * this._aspectW, this._imgHeight * this._aspectH);
                        this._cnv.translate(this._rotationCenterX, this._rotationCenterY);
                        this._cnv.rotate(angle);
                        this._cnv.translate(-this._rotationCenterX, -this._rotationCenterY);
                        this._cnv.scale(this._aspectW, this._aspectH);
                        this._cnv.drawImage(this._img, 0, 0);
                    }
            })()
        }
        if (IE) {
            Wilq32.PhotoEffect.prototype.createVMLNode = (function () {
                document.createStyleSheet().addRule(".rvml", "behavior:url(#default#VML)");
                try {
                    !document.namespaces.rvml && document.namespaces.add("rvml", "urn:schemas-microsoft-com:vml");
                    return function (tagName) {
                        return document.createElement('<rvml:' + tagName + ' class="rvml">');
                    };
                } catch (e) {
                    return function (tagName) {
                        return document.createElement('<' + tagName + ' xmlns="urn:schemas-microsoft.com:vml" class="rvml">');
                    };
                }
            })();
        }

    })(jQuery);
    //#endregion

    (function ($) {
        var _remove = $.fn.remove;

        $.fn.remove = function (selector, keepData) {
            return this.each(function () {
                if (!keepData) {
                    if (!selector || $.filter(selector, [this]).length) {
                        $("*", this).add(this).each(function () {
                            $(this).triggerHandler("remove");
                        });
                    }
                }
                return _remove.call($(this), selector, keepData);
            });
        };

        // 创建插件工厂方法
        $.widget = function (name, base, prototype) {
            var namespace = name.split(".")[0], fullName;
            name = name.split(".")[1];
            fullName = namespace + "-" + name;

            if (!prototype) {
                prototype = base;
                base = $.Widget;
            }

            // 为插件创建选择器
            $.expr[":"][fullName] = function (elem) {
                return !!$.data(elem, name);
            };

            $[namespace] = $[namespace] || {};
            $[namespace][name] = function (options, element) {
                // 没有正在初始化时允许实例化与简单的继承
                if (arguments.length) {
                    this._createWidget(options, element);
                }
            };

            var basePrototype = new base();
            basePrototype.options = $.extend({}, basePrototype.options);
            $[namespace][name].prototype = $.extend(true, basePrototype, {
                namespace: namespace,
                widgetName: name,
                widgetEventPrefix: $[namespace][name].prototype.widgetEventPrefix || name,
                widgetBaseClass: fullName
            }, prototype);

            $.widget.bridge(name, $[namespace][name]);
        };

        $.widget.bridge = function (name, object) {
            $.fn[name] = function (options) {
                var isMethodCall = typeof options === "string",
                args = Array.prototype.slice.call(arguments, 1),
                returnValue = this;

                // 运行多重初始化方法
                options = !isMethodCall && args.length ? $.extend.apply(null, [true, options].concat(args)) : options;

                // 防止内部私有方法调用
                if (isMethodCall && options.substring(0, 1) === "_") {
                    return returnValue;
                }

                if (isMethodCall) {
                    this.each(function () {
                        var instance = $.data(this, name),
                        methodValue = instance && $.isFunction(instance[options]) ? instance[options].apply(instance, args) : instance;
                        if (methodValue !== instance && methodValue !== undefined) {
                            returnValue = methodValue;
                            return false;
                        }
                    });
                }
                else {
                    this.each(function () {
                        var instance = $.data(this, name);
                        if (instance) {
                            if (options) {
                                instance.option(options);
                            }
                            instance._init();
                        } else {
                            $.data(this, name, new object(options, this));
                        }
                    });
                }
                return returnValue;
            };
        };

        $.Widget = function (options, element) {
            // 没有正在初始化时允许实例化与简单的继承
            if (arguments.length) {
                this._createWidget(options, element);
            }
        };

        $.Widget.prototype = {
            widgetName: "widget",
            widgetEventPrefix: "",
            options: {
                version: '1.0.0',
                disabled: false
            },
            _createWidget: function (options, element) {
                this.element = $(element).data(this.widgetName, this);
                this.options = $.extend(true, {},
                this.options,
                $.metadata && $.metadata.get(element)[this.widgetName], options);

                var self = this;
                this.element.bind("remove." + this.widgetName, function () {
                    self.destroy();
                });

                this._create();
                this._init();
            },
            _create: function () { },
            _init: function () { },
            destroy: function () { // 将widget实例从dom对象上移除
                this.element.unbind("." + this.widgetName).removeData(this.widgetName);
                this.widget().unbind("." + this.widgetName).removeAttr("aria-disabled");
            },
            widget: function () {
                return this.element;
            },
            option: function (key, value) {
                var options = key,
                self = this;

                if (arguments.length === 0) {
                    return $.extend({}, self.options);
                }

                if (typeof key === "string") {
                    if (value === undefined) {
                        return this.options[key];
                    }
                    options = {};
                    options[key] = value;
                }

                $.each(options, function (key, value) {
                    self._setOption(key, value);
                });

                return self;
            },
            _setOption: function (key, value) { // 设置options的属性
                this.options[key] = value;

                if (key === "disabled") {
                    this.widget().attr("aria-disabled", value);
                }

                return this;
            },
            enable: function () { // 启动控件
                return this._setOption("disabled", false);
            },
            disable: function () { // 禁用控件
                return this._setOption("disabled", true);
            },
            _trigger: function (type, event, data) {
                var callback = this.options[type];

                event = $.Event(event);
                event.type = (type === this.widgetEventPrefix ? type : this.widgetEventPrefix + type).toLowerCase();
                data = data || {};

                if (event.originalEvent) {
                    for (var i = $.event.props.length, prop; i;) {
                        prop = $.event.props[--i];
                        event[prop] = event.originalEvent[prop];
                    }
                }

                this.element.trigger(event, data);

                return !($.isFunction(callback) && callback.call(this.element[0], event, data) === false || event.isDefaultPrevented());
            }
        };
    })(jQuery);

    /*************************************
        文件名：PJtools.ListTable.js
    *************************************/
    (function ($) {
        $.widget("PJtools.ListTable", {
            options: {
                id: '',                   // ListTable控件的ID，默认为空
                width: 'auto',            // ListTable控件的宽度，默认为自适应宽度
                height: 'auto',           // ListTable控件的高度，默认为自适应高度
                columns: [{
                    width: '50',          // 本列的宽度，默认为50像素
                    dataType: 'string',   // 本列绑定数据的类型，默认为string类型，其中选项为'string', 'float', 'int', 'date', 'bool'
                    dataIndex: '',        // 本列字段绑定数据字段名称，默认为空
                    template: null,       // 本列自定义简单的结构模版，默认为空，自定义模版dataIndex、align、render和switches属性失效，title属性无法使用'@dataIndex'项，dataType属性自动为string类型
                    render: '',           // 本列字段格式化数据文本格式，默认为空，其中选项为'money', 'percent', 'yyyy-MM-dd hh:mm:ss'等
                    switches: {},         // 本列字段转换自定义条件，默认为空，如：{'1': '<span>文本</span>', '2': '<a>文本</a>'}，dataType属性自动为string类型
                    title: null,          // 本列title文本，默认不显示，其中选项为'null', '@dataIndex', 'string'；'@dataIndex'：为绑定字段文本，'string'：为自定义文本
                    align: 'left'         // 本列水平对齐方式，默认为左对齐，其中选项为'left', 'center', 'right'，只有在element为默认文本格式才有效
                }],
                bbar: false,              // 是否启用分页状态栏，默认为禁用，加载模式为滚动条异步加载则自动禁用
                curpage: 1,               // 加载指定页码，加载模式为滚动条异步加载则自动失效
                pagesize: 10,             // 每次异步加载的行数
                method: 'scroll',         // 异步加载的方式，默认为滚动条异步加载，其中选项为'scroll', 'bbar'；滚动条异步加载默认当前页始终为首页开始
                url: '',                  // ajax地址，通过后台返回Json格式数据集
                paras: '',                // 其他过滤条件，默认为空，格式：'&key=value'
                ordercolums: '',          // 默认排序字段参数
                trHideContent: false,     // 是否创建用户自定义行隐藏内容框架box，默认不创建框架
                checks: false,            // 是否启用多选列，默认为不启用
                click: function () { },   // 自定义数据行单击事件
                dbclick: function () { }, // 自定义数据行双击事件
                success: function () { }, // 自定义执行完成功事件
                error: function () { },     // 自定义ajax的error事件
                logId: '',//日志网页     //李飞，自定义日志 2012年5月18日18:07:34
                temphtml: ''  //lifei 
            },
            isAjaxLoadData: true, // 判断是否可以继续加载数据
            _init: function () { // 初始化函数
                var _this = this;
                //   debugger;
                _this.options.temphtml = $("#" + _this.options.logId).html() + "<br>";
                $("#" + _this.options.logId).html(_this.options.temphtml + "初始化时间：" + PJ.Date.dateFormat(new Date(), "yyyy-MM-dd hh:mi:ss") + "<br>");
                // 初始化各列字段属性
                for (var i in _this.options.columns) {
                    for (var key in $.PJtools.ListTable.columns[0]) {
                        if (_this.options.columns[i][key] == undefined) { _this.options.columns[i][key] = $.PJtools.ListTable.columns[0][key] } //无自定义赋值，则赋初始值
                        if (key == "width" && _this.options.columns[i][key].indexOf("%") >= 0) { // 判断该列宽度是否为百分比，是百分比则计算实际宽度
                            _this.options.columns[i][key] = parseInt((parseInt(_this.options.columns[i][key]) / 100) * parseInt(_this.options.width));
                        }
                    }
                }
                _this.options.temphtml = $("#" + _this.options.logId).html();
                $("#" + _this.options.logId).html(_this.options.temphtml + "绑定列头时间：" + PJ.Date.dateFormat(new Date(), "yyyy-MM-dd hh:mi:ss") + "<br>");
                return this.element.each(function () {
                    // 绘制ListTable主框架
                    var htmls = ""; // 初始化htmls字符串变量
                    htmls += "<div class='pj_listtable' ";
                    if (_this.options.id != '' && _this.options.id != null) { htmls += "id='" + _this.options.id + "' "; }
                    htmls += "style=' ";
                    if (_this.options.width != 'auto') { htmls += "width: " + parseInt(_this.options.width) + "px; "; }
                    if (_this.options.height != 'auto') { htmls += "height: " + parseInt(_this.options.height) + "px; "; }
                    htmls += "'><div class='pj_loading'>数据加载中...</div><div class='pj_ltable_box'></div></div>";
                    _this.element.empty().html(htmls);
                    if (_this.options.method == 'bbar' && _this.options.bbar == true) { _this._CreatBBar(); } // 绘制分页栏
                    if (_this.element.data("data") != undefined && _this.element.data("data") != null) { _this.element.removeData("data"); }
                    //绑定数据行事件
                    if (_this.options.method == 'scroll') { _this.options.curpage = 1; _this.element.find(".pj_listtable").bind("mousewheel", { tobj: _this }, _this._ListMouseWheel); }
                    _this._DataBind(); // 绑定数据集
                });
            },
            _CreatBBar: function () { // 绘制分页状态栏
                var htmls = "", _this = this; // 初始化htmls字符串变量
                _this.options.temphtml = $("#" + _this.options.logId).html();
                $("#" + _this.options.logId).html(_this.options.temphtml + "开始绑定分页栏时间：" + PJ.Date.dateFormat(new Date(), "yyyy-MM-dd hh:mi:ss") + "<br>");

                htmls += "<div class='pj_lbbar' style='display: none;'>";
                if (_this.options.checks) { htmls += "<div class='pj_lbbar_btn pj_lbbar_btn_all'>全选</div><div class='pj_lbbar_btn pj_lbbar_btn_unall'>反选</div>"; }
                htmls += "<div class='pj_lbbar_btn pj_lbbar_btn_first'>|&lt;&nbsp;首页</div>";
                htmls += "<div class='pj_lbbar_btn pj_lbbar_btn_prev'>&lt;&lt;&nbsp;上一页</div><div class='pj_lbbar_txt'>&nbsp;</div>";
                htmls += "<div class='pj_lbbar_btn pj_lbbar_btn_next'>下一页&nbsp;&gt;&gt;</div>";
                htmls += "<div class='pj_lbbar_btn pj_lbbar_btn_last'>末页&nbsp;&gt;|</div><div class='pj_lbbar_txt'>&nbsp;&nbsp;&nbsp;页码:&nbsp;</div>";
                htmls += "<div class='pj_lbbar_txt pj_lbbar_pagenum'>" + _this.options.curpage + "</div><div class='pj_lbbar_txt'>&nbsp;页&nbsp;/&nbsp;共&nbsp;</div>";
                htmls += "<div class='pj_lbbar_txt pj_lbbar_allnum'>1</div><div class='pj_lbbar_txt'>&nbsp;页&nbsp;|</div>";

                //#region 页码跳转 李飞 杨炎 2013年3月28日11:24:21
                htmls += "<div class='pj_lbbar_btn'><input  id='page_go' type='text' class='curpage' style='width:20px;margin-top:2px;text-align:center;' value='" + this.options.curpage + "'  /></div>";
                htmls += "<div class='pj_lbbar_btn pj_lbbar_btn_go'>跳转</div><div class='pj_lbbar_txt'>&nbsp;|</div>";
                //#endregion

                htmls += "<div class='pj_lbbar_btn pj_lbbar_btn_refresh'>刷新</div><div class='pj_lbbar_pnum'><div class='pj_lbbar_txt'>显示：&nbsp;</div>";
                htmls += "<div class='pj_lbbar_txt pj_lbbar_curcount'>0-0</div><div class='pj_lbbar_txt'>&nbsp;|&nbsp;共&nbsp;</div>";
                htmls += "<div class='pj_lbbar_txt pj_lbbar_count'>0</div><div class='pj_lbbar_txt'>&nbsp;条</div>";
                htmls += "</div></div>";

                _this.element.find(".pj_listtable").append(htmls);
                _this.element.find(".pj_listtable .pj_lbbar").width(_this.element.find(".pj_listtable").width() - PJtools.Format.cssElementToWH(_this.element.find(".pj_listtable .pj_lbbar")).width);
                // 绑定相关事件
                _this.element.find(".pj_listtable .pj_lbbar").find(".pj_lbbar_btn_first").bind("click", function () { _this._FirstClick(this, _this); });
                _this.element.find(".pj_listtable .pj_lbbar").find(".pj_lbbar_btn_prev").bind("click", function () { _this._PrevClick(this, _this); });
                _this.element.find(".pj_listtable .pj_lbbar").find(".pj_lbbar_btn_next").bind("click", function () { _this._NextClick(this, _this); });
                _this.element.find(".pj_listtable .pj_lbbar").find(".pj_lbbar_btn_last").bind("click", function () { _this._LastClick(this, _this); });
                _this.element.find(".pj_listtable .pj_lbbar").find(".pj_lbbar_btn_refresh").bind("click", function () { _this._RefreshClick(this, _this); });

                //#region 页码跳转 李飞 杨炎 2013年3月28日11:24:21
                //onafterpaste='this.value=this.value.replace(/\D/g,'')'
                _this.element.find(".pj_listtable .pj_lbbar").find("#page_go").bind("keyup", function () { this.value = this.value.replace(/\D/g, '') });
                _this.element.find(".pj_listtable .pj_lbbar").find("#page_go").bind("afterpaste", function () { this.value = this.value.replace(/\D/g, '') });
                _this.element.find(".pj_listtable .pj_lbbar").find(".pj_lbbar_btn_go").bind("click", function () { _this.GoPage($("#page_go").val()); });
                //#endregion

                if (_this.options.checks) {
                    _this.element.find(".pj_listtable .pj_lbbar").find(".pj_lbbar_btn_all").bind("click", { tobj: _this }, _this._AllChecked);
                    _this.element.find(".pj_listtable .pj_lbbar").find(".pj_lbbar_btn_unall").bind("click", { tobj: _this }, _this._UnAllChecked);
                }
                _this.options.temphtml = $("#" + _this.options.logId).html();
                $("#" + _this.options.logId).html(_this.options.temphtml + "绑定分页栏完成时间：" + PJ.Date.dateFormat(new Date(), "yyyy-MM-dd hh:mi:ss") + "<br>");
            },
            _DataBind: function () { // 绑定数据集

                var _this = this, _paras = null;
                _this.options.temphtml = $("#" + _this.options.logId).html();
                $("#" + _this.options.logId).html(_this.options.temphtml + "开始绑定数据时间：" + PJ.Date.dateFormat(new Date(), "yyyy-MM-dd hh:mi:ss") + "<br>");

                if ($.trim(_this.options.url) != '' && $.trim(_this.options.url) != null) { // 判断是否执行Ajax数据绑定
                    _paras = "&curpage=" + _this.options.curpage + "&pagesize=" + _this.options.pagesize;
                    if (_this.options.ordercolums != '' && _this.options.ordercolums != null) { _paras += "&order=" + escape(_this.options.ordercolums); }
                    $.ajax({
                        type: "post",
                        url: _this.options.url,
                        data: _paras + _this.options.paras,
                        dataType: "json",
                        success: function (data) {
                            _this.options.temphtml = $("#" + _this.options.logId).html();
                            $("#" + _this.options.logId).html(_this.options.temphtml + "得到绑定数据时间：" + PJ.Date.dateFormat(new Date(), "yyyy-MM-dd hh:mi:ss") + "<br>");
                            if (_this.options.method == "scroll") { // 判断是否为滚动异步加载方式
                                if (data != "" && data != null) {
                                    data = PJtools.Format.unescapeJson(data); // 解密json格式数据
                                    _this._LoadDataList(data);
                                }
                            }
                            else {
                                if (data != "" && data != null) {
                                    data = PJtools.Format.unescapeJson(data); // 解密json格式数据
                                    _this._LoadDataList(data);
                                    if (_this.options.method == 'bbar' && _this.options.bbar == true) { // 绑定分页栏相关数据
                                        _this._BindBbarData(parseInt(data.COUNT));
                                    }
                                }
                                else {
                                    _this.element.find(".pj_listtable .pj_ltable_box").empty();
                                    if (_this.options.method == 'bbar' && _this.options.bbar == true) { // 绑定分页栏相关数据
                                        _this._BindBbarData(0);
                                    }
                                }
                            }
                            _this.options.temphtml = $("#" + _this.options.logId).html();
                            $("#" + _this.options.logId).html(_this.options.temphtml + "绑定数据完成时间：" + PJ.Date.dateFormat(new Date(), "yyyy-MM-dd hh:mi:ss") + "<br>");
                            _this.element.data("data", data); // 存储json数据集
                            _this.options.success(); // 成功自定义事件
                            _this._HideLoading();
                        },
                        error: function () {
                            _this._HideLoading();
                            _this.options.error(); // 错误自定义事件
                        }
                    });
                }
                else { _this._HideLoading(); }
            },
            _LoadDataList: function (data) { // 加载数据列表
                var _this = this, htmls = ""; // 初始化htmls字符串变量
                for (var i = 0; i < data.TABLE.length; i++) { // 循环每行数据
                    htmls += "<div class='pj_ltable_tr'><div class='pj_ltable_column'>";
                    if (_this.options.checks) { htmls += "<div class='pj_ltable_td pj_ltable_checkbox'></div>"; } // 判断是否加载多选checkbox列
                    for (var j = 0; j < _this.options.columns.length; j++) { // 循环该行每列数据
                        if (_this.options.columns[j].template != undefined && _this.options.columns[j].template != null) { // 判断是否使用自定义模版列
                            var _reg = /<\@(.+?)>/gi; // 匹配是否含有绑定数据字段
                            var _array = _this.options.columns[j].template.match(_reg);
                            if (_this.options.columns[j].title != null && _this.options.columns[j].title != undefined) {
                                htmls += "<div class='pj_ltable_td' style='width: " + _this.options.columns[j].width + "px;' title='" + _this.options.columns[j].title + "'>";
                            }
                            else { htmls += "<div class='pj_ltable_td' style='width: " + _this.options.columns[j].width + "px;'>"; }
                            if (_array != null && _array != undefined) { // 判断是否含有匹配字段
                                var _str = _this.options.columns[j].template;
                                for (var n = 0; n < _array.length; n++) {
                                    _str = _str.replace(_array[n], data.TABLE[i][_array[n].substring(2, _array[n].length - 1)]);
                                }
                                htmls += _str;
                            }
                            else { htmls += _this.options.columns[j].template; }
                        }
                        else {
                            if (_this.options.columns[j].title != null && _this.options.columns[j].title != undefined) { // 判断是否显示title
                                if (_this.options.columns[j].title == "@dataIndex") {
                                    htmls += "<div style='width: " + _this.options.columns[j].width + "px;' ";
                                    htmls += "title='" + _this._ChangeTypeData(data.TABLE[i][_this.options.columns[j].dataIndex], _this.options.columns[j].render) + "' ";
                                }
                                else {
                                    htmls += "<div style='width: " + _this.options.columns[j].width + "px;' title='" + _this.options.columns[j].title + "' ";
                                }
                            }
                            else { htmls += "<div style='width: " + _this.options.columns[j].width + "px;' "; }
                            switch (_this.options.columns[j].align) { // 判断文本对齐方式
                                case "center": htmls += "class='pj_ltable_td pj_center'>"; break;
                                case "right": htmls += "class='pj_ltable_td pj_right'>"; break;
                                default: htmls += "class='pj_ltable_td'>"; break;
                            }
                            if (!$.isEmptyObject(_this.options.columns[j].switches) && _this.options.columns[j].switches != undefined && _this.options.columns[j].switches != null) { // 判断是否有switch条件
                                if (_this.options.columns[j].switches[data.TABLE[i][_this.options.columns[j].dataIndex]] == undefined) {
                                    htmls += _this.options.columns[j].switches["default"];
                                }
                                else {
                                    htmls += _this.options.columns[j].switches[data.TABLE[i][_this.options.columns[j].dataIndex]];
                                }
                            }
                            else { htmls += _this._ChangeTypeData(data.TABLE[i][_this.options.columns[j].dataIndex], _this.options.columns[j].render); }
                        }
                        htmls += "</div>";
                    }
                    // 判断是否加载
                    if (_this.options.trHideContent) { htmls += "</div><div id='pj_ltable_content_unqid_" + i + "' class='pj_ltable_content'></div></div>"; }
                    else { htmls += "</div></div>"; }
                }
                if (_this.options.method == "scroll") { // 判断是否为滚动异步加载方式
                    _this.element.find(".pj_listtable .pj_ltable_box").append(htmls);
                    if (_this.element.data("data") != undefined && _this.element.data("data") != null) { data = _this._AddTableData(_this.element.data("data"), data); }
                    if (parseInt(data.COUNT) > data.TABLE.length) { // 判断数据是否加载完毕
                        _this.options.curpage++;
                        _this.isAjaxLoadData = true;
                    }
                }
                else {
                    _this.element.find(".pj_listtable .pj_ltable_box").empty().html(htmls);
                    if (this.options.method == 'bbar' && this.options.bbar == true) { _this._AutoBoxWidth(); }
                }
                // 绑定事件
                _this.element.find(".pj_listtable .pj_ltable_box").find(".pj_ltable_tr .pj_ltable_column").bind("click", function () { _this._trClick(this, _this); }).bind("click", _this.options.click);
                _this.element.find(".pj_listtable .pj_ltable_box").find(".pj_ltable_tr .pj_ltable_column").bind("dblclick", _this.options.dbclick);
                if (_this.options.checks) { _this.element.find(".pj_listtable .pj_ltable_box").find(".pj_ltable_tr .pj_ltable_checkbox").bind("click", _this._trCheckClick); }
            },
            _BindBbarData: function (count) { // 绑定分页栏相关数据
                this.element.find(".pj_listtable .pj_lbbar").find(".pj_lbbar_pagenum").text(this.options.curpage); // 当前页码
                var allpage = this._AutoPageNum(count, this.options.pagesize);
                this.element.find(".pj_listtable .pj_lbbar").find(".pj_lbbar_allnum").text(allpage); // 总页码
                this.element.find(".pj_listtable .pj_lbbar").find(".pj_lbbar_count").text(count); // 总条数
                var array = this._AutoStartToEndCount(count, this.options.curpage, this.options.pagesize, allpage);
                this.element.find(".pj_listtable .pj_lbbar").find(".pj_lbbar_curcount").text(array[0] + "-" + array[1]);
                // 翻页功能启/禁用
                this.element.find(".pj_listtable .pj_lbbar").find(".pj_lbbar_btn_first").removeClass("pj_lbbar_btn_disabled");
                this.element.find(".pj_listtable .pj_lbbar").find(".pj_lbbar_btn_prev").removeClass("pj_lbbar_btn_disabled");
                this.element.find(".pj_listtable .pj_lbbar").find(".pj_lbbar_btn_next").removeClass("pj_lbbar_btn_disabled");
                this.element.find(".pj_listtable .pj_lbbar").find(".pj_lbbar_btn_last").removeClass("pj_lbbar_btn_disabled");
                if (this.options.curpage == 1) {
                    this.element.find(".pj_listtable .pj_lbbar").find(".pj_lbbar_btn_first").addClass("pj_lbbar_btn_disabled");
                    this.element.find(".pj_listtable .pj_lbbar").find(".pj_lbbar_btn_prev").addClass("pj_lbbar_btn_disabled");
                }
                if (this.options.curpage == allpage) {
                    this.element.find(".pj_listtable .pj_lbbar").find(".pj_lbbar_btn_next").addClass("pj_lbbar_btn_disabled");
                    this.element.find(".pj_listtable .pj_lbbar").find(".pj_lbbar_btn_last").addClass("pj_lbbar_btn_disabled");
                }
            },
            _AutoBoxWidth: function () { // 计算控件主框架box的宽度
                var _height = 0, _width = this.element.find(".pj_listtable .pj_lbbar").parent().width();
                var _barW = this.element.find(".pj_listtable .pj_lbbar").width() + PJtools.Format.cssElementToWH(this.element.find(".pj_listtable .pj_lbbar")).width;
                _height += this.element.find(".pj_listtable .pj_ltable_box").height() + PJtools.Format.cssElementToWH(this.element.find(".pj_listtable .pj_ltable_box")).height; // 计算实际列表高度
                _height += this.element.find(".pj_listtable .pj_lbbar").height() + PJtools.Format.cssElementToWH(this.element.find(".pj_listtable .pj_lbbar")).height; // 计算分页栏高度
                if (this.element.find(".pj_listtable").height() >= _height) { // 判断实际内容高度是否超过主框架高度
                    if (_width != _barW) { this.element.find(".pj_listtable .pj_lbbar").width(this.element.find(".pj_listtable .pj_lbbar").width() + $.PJtools.ListTable.scrollWidth); }
                }
                else {
                    if (_width == _barW) { this.element.find(".pj_listtable .pj_lbbar").width(this.element.find(".pj_listtable .pj_lbbar").width() - $.PJtools.ListTable.scrollWidth); }
                }
            },
            _AutoPageNum: function (count, pagesize) { // 计算总页码数
                if (parseInt(count) <= 0) { return 1; }
                else if (parseInt(count) % pagesize == 0) { return parseInt(parseInt(count) / pagesize); }
                else { return (parseInt(parseInt(count) / pagesize) + 1); }
            },
            _AutoStartToEndCount: function (count, curpage, pagesize, allpage) { // 计算当前页加载的起始行数与截止行数
                var array = new Array();
                if (parseInt(count) <= 0) { array.push(0); array.push(0); }
                else {
                    if (allpage == 1) { array.push(1); array.push(count); } // 判断是否只有1页
                    else {
                        if (curpage == 1) { array.push(1); array.push(pagesize); } // 判断是否为首页
                        else if (curpage == allpage) { array.push(((curpage - 1) * pagesize + 1)); array.push(count); } // 判断是否为末页
                        else { array.push(((curpage - 1) * pagesize + 1)); array.push((curpage * pagesize)); }
                    }
                }
                return array;
            },
            _ChangeTypeData: function (value, type) { // 将内容转变成指定格式
                var format = "";
                if (new PJtools.Date().isDate(value)) { format = type; type = "date"; } // 判断是否为时间格式
                switch (type) {
                    case "money":
                        return new PJtools.Format.usMoney(value);
                        break;
                    case "percent":
                        return new PJtools.Format.usPrct(value);
                        break;
                    case "date":
                        return new PJtools.Format.usDate(value, format);
                        break;
                    default:
                        return value;
                        break;
                }
            },
            _FirstClick: function (obj, _this) { // 首页按钮单击事件
                if (!$(obj).hasClass("pj_lbbar_btn_disabled")) { // 判断是否禁用button
                    _this.options.curpage = 1;
                    $("#page_go").val(1);
                    _this._ShowLoading();
                    _this._DataBind();
                }
            },
            _PrevClick: function (obj, _this) { // 上一页按钮单击事件
                if (!$(obj).hasClass("pj_lbbar_btn_disabled")) { // 判断是否禁用button
                    _this.options.curpage -= 1;
                    $("#page_go").val(_this.options.curpage);
                    _this._ShowLoading();
                    _this._DataBind();
                }
            },
            _NextClick: function (obj, _this) { // 下一页按钮单击事件
                if (!$(obj).hasClass("pj_lbbar_btn_disabled")) { // 判断是否禁用button
                    _this.options.curpage += 1;
                    $("#page_go").val(_this.options.curpage);
                    _this._ShowLoading();
                    _this._DataBind();
                }
            },
            _LastClick: function (obj, _this) { // 末页按钮单击事件
                if (!$(obj).hasClass("pj_lbbar_btn_disabled")) { // 判断是否禁用button
                    _this.options.curpage = parseInt($.trim(_this.element.find(".pj_listtable .pj_lbbar").find(".pj_lbbar_allnum").text()));
                    $("#page_go").val(_this.options.curpage);
                    _this._ShowLoading();
                    _this._DataBind();
                }
            },
            _RefreshClick: function (obj, _this) { // 刷新按钮单击事件
                this._GoPageNum(this.options.curpage);
            },
            _GoPageNum: function (num) { // 跳转到指定页
                var data = this.element.data("data");
                if (data != null && data != undefined) {
                    var allpage = this._AutoPageNum(parseInt(data.COUNT), this.options.pagesize);
                    if (parseInt(num) > allpage) { this.options.curpage = allpage; }
                    else if (parseInt(num) < 1) { this.options.curpage = 1; }
                    else { this.options.curpage = parseInt(num); }
                    this._ShowLoading();
                    this._DataBind();
                }
            },
            _trClick: function (obj, _this) { // 单击数据列表行效果
                if (!_this.options.checks) { // 判断是否为单选
                    $(obj).parent().addClass("selected"); // 选中对应行
                    $(obj).parent().siblings().removeClass("selected"); // 移除对应行同级的选中效果
                    if (_this.options.trHideContent) { // 判断是否有隐藏内容框架
                        if ($(obj).parent().find(".pj_ltable_content").css("display") != "none") { $(obj).parent().find(".pj_ltable_content").hide(); }
                        else {
                            $(obj).parent().siblings().find(".pj_ltable_content").hide();
                            $(obj).parent().find(".pj_ltable_content").show();
                        }
                    }
                }
                else {
                    if (_this.options.trHideContent) { // 判断是否有隐藏内容框架
                        if ($(obj).parent().find(".pj_ltable_content").css("display") != "none") { $(obj).parent().find(".pj_ltable_content").hide(); }
                        else {
                            $(obj).parent().siblings().find(".pj_ltable_content").hide();
                            $(obj).parent().find(".pj_ltable_content").show();
                        }
                    }
                    else {
                        if (!$(obj).parent().hasClass("selected")) {
                            $(obj).parent().addClass("selected"); // 选中对应行
                            $(obj).parent().find(".pj_ltable_checkbox").addClass("selected");
                        }
                        else {
                            $(obj).parent().removeClass("selected");
                            $(obj).parent().find(".pj_ltable_checkbox").removeClass("selected");
                        }
                    }
                }
            },
            _trCheckClick: function (event) { // 各行checkbox控件相关单击事件
                if (!$(this).closest(".pj_ltable_tr").hasClass("selected")) {
                    $(this).closest(".pj_ltable_tr").addClass("selected"); // 选中对应行
                    $(this).addClass("selected");
                }
                else {
                    $(this).closest(".pj_ltable_tr").removeClass("selected");
                    $(this).removeClass("selected");
                }
                event.stopPropagation(); // 阻止事件冒泡
            },
            _AllChecked: function (event) { // checkbox全选单击事件
                var _this = event.data.tobj;
                _this.element.find(".pj_ltable_box .pj_ltable_checkbox").addClass("selected");
                _this.element.find(".pj_ltable_box .pj_ltable_tr").addClass("selected");
            },
            _UnAllChecked: function (event) { // checkbox反选单击事件
                var _this = event.data.tobj;
                _this.element.find(".pj_ltable_box .pj_ltable_checkbox").removeClass("selected");
                _this.element.find(".pj_ltable_box .pj_ltable_tr").removeClass("selected");
            },
            _ListMouseWheel: function (event, delta) { // 鼠标滚轮滚动事件
                if (delta < 0 && event.data.tobj.isAjaxLoadData) { // 判断是否向下滚动且上次数据已经加载完毕
                    var _this = event.data.tobj;
                    var _height = _this.element.find(".pj_listtable .pj_ltable_box").height() + PJtools.Format.cssElementToWH(_this.element.find(".pj_listtable .pj_ltable_box")).height;
                    if ((_height > $(this).outerHeight()) && ($(this).scrollTop() >= (_height - $(this).outerHeight()))) { // 判断鼠标滚轮是否到达最底部
                        _this.options.curpage += 1;
                        event.data.tobj.isAjaxLoadData = false;
                        _this._DataBind();
                    }
                }
            },
            _AddTableData: function (data, newData) { // 将新获取的数据集添加到老数据集中
                for (var i = 0; i < newData.TABLE.length; i++) { data.TABLE.push(newData.TABLE[i]); }
                data.COUNT = newData.COUNT; // 重新赋值总行数
                return data;
            },
            _ShowLoading: function () { // 显示加载Loading效果
                this.element.find(".pj_listtable .pj_ltable_box").hide(); // 隐藏数据列表
                if (this.options.method == 'bbar' && this.options.bbar == true) { this.element.find(".pj_listtable .pj_lbbar").hide(); } // 隐藏分页栏
                this.element.find(".pj_listtable .pj_loading").show(); // 显示Loading效果
            },
            _HideLoading: function () { // 隐藏加载Loading效果
                this.element.find(".pj_listtable .pj_loading").hide(); // 隐藏Loading效果
                this.element.find(".pj_listtable .pj_ltable_box").show(); // 显示数据列表
                if (this.options.method == 'bbar' && this.options.bbar == true) { this.element.find(".pj_listtable .pj_lbbar").show(); } // 显示分页栏
            },
            getSelectedItemsIndex: function () { // 获取当前页数据列表选中索引值，单选则返回单选索引值；多选则返回索引数字对象
                if (!this.options.checks) { // 单选索引
                    if (this.element.find(".pj_ltable_box > .selected").length > 0) { return this.element.find(".pj_ltable_box .pj_ltable_tr").index(this.element.find(".pj_ltable_box > .selected")[0]); }
                    else { return null; }
                }
                else {
                    if (this.element.find(".pj_ltable_box > .selected").length > 0) {
                        var _array = new Array(), _this = this;
                        this.element.find(".pj_ltable_box > .selected").each(function (i) {
                            _array[i] = _this.element.find(".pj_ltable_box .pj_ltable_tr").index(_this.element.find(".pj_ltable_box > .selected")[i]);
                        });
                        return _array;
                    }
                    else { return null; }
                }
            },
            getItemsIndex: function (trObj) { // 根据指定数据行对象获取该行索引值
                if ($(trObj).hasClass("pj_ltable_tr")) { return this.element.find(".pj_ltable_box .pj_ltable_tr").index(trObj); }
                else { return this.element.find(".pj_ltable_box .pj_ltable_tr").index($(trObj).closest(".pj_ltable_tr")[0]); }
            },
            getHideContentObj: function (index) { // 获取指定索引行隐藏内容框架对象
                if (this.options.trHideContent) { return this.element.find(".pj_ltable_box .pj_ltable_tr").eq(index).find(".pj_ltable_content"); }
                else { return null; }
            },
            ShowLoading: function () { // 显示加载Loading效果
                this._ShowLoading();
            },
            HideLoading: function () { // 隐藏加载Loading效果
                this._HideLoading();
            },
            AllChecked: function () { // checkbox全选单击事件
                this.element.find(".pj_ltable_box .pj_ltable_checkbox").addClass("selected");
                this.element.find(".pj_ltable_box .pj_ltable_tr").addClass("selected");
            },
            UnAllChecked: function () { // checkbox反选单击事件
                this.element.find(".pj_ltable_box .pj_ltable_checkbox").removeClass("selected");
                this.element.find(".pj_ltable_box .pj_ltable_tr").removeClass("selected");
            },
            OrderColumns: function (dataIndex) { // 执行全局排序
                if (this.options.ordercolums != '' && this.options.ordercolums != null) {
                    if (this.options.ordercolums.split(" ")[0].toString() == dataIndex.toString().toUpperCase()) {
                        if (this.options.ordercolums.split(" ")[1].toString().toUpperCase() == "ASC") { this.options.ordercolums = dataIndex.toString().toUpperCase() + " DESC"; }
                        else { this.options.ordercolums = dataIndex.toString().toUpperCase() + " ASC"; }
                    }
                    else { this.options.ordercolums = dataIndex.toString().toUpperCase() + " ASC"; }
                }
                else { this.options.ordercolums = dataIndex.toString().toUpperCase() + " ASC"; }
                this._ShowLoading();
                this._DataBind();
            },
            FirstPage: function () { // 执行首页
                this.options.curpage = 1;
                this._ShowLoading();
                this._DataBind();
            },
            PrevPage: function () { // 执行上一页
                if (this.options.curpage > 1) {
                    this.options.curpage -= 1;
                    this._ShowLoading();
                    this._DataBind();
                }
            },
            NextPage: function () { // 执行下一页
                var data = this.getDataJson();
                if (data != undefined && data != null) {
                    var allpage = this._AutoPageNum(parseInt(data.COUNT), this.options.pagesize); // 获取最后一页页码
                    if (this.options.curpage < allpage) {
                        this.options.curpage += 1;
                        this._ShowLoading();
                        this._DataBind();
                    }
                }
            },
            LastPage: function () { // 执行末页
                var data = this.getDataJson();
                if (data != undefined && data != null) {
                    var allpage = this._AutoPageNum(parseInt(data.COUNT), this.options.pagesize); // 获取最后一页页码
                    this.options.curpage = allpage;
                    this._ShowLoading();
                    this._DataBind();
                }
            },
            GoPage: function (num) { // 执行指定页
                this._GoPageNum(num);
            },
            Refresh: function () { // 刷新当前页面
                this.GoPage(this.options.curpage);
            },
            getCurPage: function () { // 获取当前页码
                return this.options.curpage;
            },
            getAllPageNum: function () { // 获取总页码
                var data = this.getDataJson();
                if (data != undefined && data != null) {
                    return this._AutoPageNum(parseInt(data.COUNT), this.options.pagesize);
                }
                else { return null; }
            },
            getDataJson: function () { // 获取整个json数据集
                if (this.element.data("data") != null && this.element.data("data") != undefined) { return this.element.data("data"); }
                else { return undefined; }
            },
            getCellHtml: function (row, col) { // 获取单元格Html代码(row：行号索引值;col：列号索引值)
                var obj = this.element.find(".pj_ltable_box .pj_ltable_tr");
                if (obj.length >= parseInt(row) && parseInt(row) >= 0 && obj.eq(0).find(".pj_ltable_column .pj_ltable_td").length >= parseInt(col) && parseInt(col) >= 0) {
                    return obj.eq(parseInt(row)).find(".pj_ltable_column .pj_ltable_td").eq(parseInt(col)).html();
                }
                else { return null; }
            },
            getCellValue: function (row, dataField) { // 获取单元格Value值(row：行号索引值;dataField：数据库字段名称)
                var data = this.getDataJson();
                if (data != undefined && data != null) {
                    if (parseInt(row) <= data.TABLE.length && parseInt(row) >= 0) {
                        return data.TABLE[parseInt(row)][dataField];
                    }
                    else { return null; }
                }
                else { return null; }
            },
            setItemsChecked: function (row, isChecked) { // 设置行checkbox控件选中状态
                if (this.options.checks) {
                    if ((isChecked && !this.element.find(".pj_ltable_box .pj_ltable_tr").eq(row).find(".pj_ltable_checkbox").hasClass("selected")) || (!isChecked && this.element.find(".pj_ltable_box .pj_ltable_tr").eq(row).find(".pj_ltable_checkbox").hasClass("selected"))) {
                        this.element.find(".pj_ltable_box .pj_ltable_tr").eq(row).find(".pj_ltable_checkbox").click();
                    }
                }
            },
            setCellValue: function (row, dataField, value) { // 设置数据集列字段的值
                var data = this.getDataJson();
                data.TABLE[row][dataField] = value;
                this.element.data("data", data);
                var rowObj = this.element.find(".pj_ltable_box .pj_ltable_tr").eq(row);
                for (var i = 0; i < this.options.columns.length; i++) { // 循环设置该行的数据html
                    if (this.options.columns[i].template != undefined && this.options.columns[i].template != null) { // 判断是否使用自定义模版列
                        var _reg = /<\@(.+?)>/gi; // 匹配是否含有绑定数据字段
                        var _array = this.options.columns[i].template.match(_reg);
                        if (_array != null && _array != undefined) { // 判断是否含有匹配字段
                            var newValue = this.options.columns[i].template;
                            for (var n = 0; n < _array.length; n++) {
                                newValue = newValue.replace(_array[n], data.TABLE[row][_array[n].substring(2, _array[n].length - 1)]);
                            }
                            rowObj.find(".pj_ltable_column .pj_ltable_td").eq(i).html(newValue);
                        }
                    }
                    else {
                        if (this.options.columns[i].dataIndex == dataField) { // 判断是否为待修改字段列
                            var newValue = null;
                            if (!$.isEmptyObject(this.options.columns[i].switches) && this.options.columns[i].switches != undefined && this.options.columns[i].switches != null) { // 判断是否有switch条件
                                newValue = this.options.columns[i].switches[data.TABLE[row][this.options.columns[i].dataIndex]];
                            }
                            else { newValue = this._ChangeTypeData(data.TABLE[row][this.options.columns[i].dataIndex], this.options.columns[i].render); }
                            rowObj.find(".pj_ltable_column .pj_ltable_td").eq(i).html(newValue);
                            if (this.options.columns[i].title == "@dataIndex") { rowObj.find(".pj_ltable_column .pj_ltable_td").eq(i).attr("title", newValue); }
                        }
                    }
                }
            }
        });

        $.extend($.PJtools.ListTable, {
            version: '1.0.0',
            scrollWidth: 17, // 系统滚动条宽度
            columns: [{ width: '50', dataType: 'string', dataIndex: '', template: null, render: '', switches: {}, title: null, align: 'left' }] // ListTable控件columns属性模板
        });
    })(jQuery);



    /*************************************
        文件名：PJtools.ComboBox.js    
    *************************************/
    (function ($) {
        $.widget("PJtools.ComboBox", {
            options: {
                id: '',                          // combobox控件ID，选填项
                readonly: false,                 // 是否为只读，文本框是否可以输入
                isRead: false,                    //为true就是什么都不能操作 李飞2012年4月28日13:49:41
                listNum: 5                       // combobox控件子项显示个数，默认值为5
            },
            _IsLeave: false,                     // 鼠标是否悬浮在combobox控件对象上
            _init: function () { // 初始化函数
                var _this = this;
                return this.element.each(function () {
                    if ($(this).find("select").length > 0) { // 判断该对象下是否含有select控件
                        $(this).find("select").hide(); // 隐藏select控件
                        _this._CreatComboBox($(this).find("select").outerWidth());
                        // 绑定初始选定值
                        $(_this.element).find("input[type='text']").val($(this).find("select > option:selected").text());
                        _this._InitList();
                        //为true就是什么都不能操作 李飞2012年4月28日13:49:41
                        if (_this.options.isRead) { return; }
                        //debugger;
                        // 绑定相关事件
                        $(_this.element).find(".pj_combobox_btn").bind("click", { obj: _this }, _this._ComboBoxClick);
                        if (_this.options.readonly) { $(_this.element).find(".pj_combobox_input > input[type='text']").bind("click", { obj: _this }, _this._ComboBoxClick); }
                        if (!_this.options.readonly) { $(_this.element).find(".pj_combobox_input > input[type='text']").bind("keyup", { obj: _this }, _this._QueryOptionItems); }
                        $(_this.element).find(".pj_combobox_input > input[type='text']").bind("keydown", { obj: _this }, _this._KeyDownOptionItem).bind("focusout", { obj: _this }, _this._ComboBoxFocusOut);
                        $(_this.element).find(".pj_combobox").bind("mouseover", { obj: _this }, _this._ComboBoxMouseOver).bind("mouseout", { obj: _this }, _this._ComboBoxMouseOut);
                        $(_this.element).find(".pj_combobox_box").bind("mouseover", function () { $(_this.element).find("input[type='text']").focus(); });
                    }
                });
            },
            _CreatComboBox: function (width) { // 创建ComboBox基本框架
                var htmls = ""; // 初始化htmls字符串变量
                if ($(this.element).find(".pj_combobox").length > 0) { $(this.element).find(".pj_combobox").remove(); CollectGarbage(); }
                if (this.options.id != "") {
                    htmls += "<div id='" + this.options.id + "' class='pj_combobox' style='width: " + width + "px;'>";
                }
                else {
                    htmls += "<div class='pj_combobox' style='width: " + width + "px;'>";
                }
                if (this.options.readonly) {
                    // htmls += "<div class='pj_combobox_input'><input type='text' value='' readonly='readonly' /></div><div class='pj_combobox_btn'></div>";
                    //李飞 二〇一二年二月十四日 16:09:17  修改的原因，如果为只读的话，每次选择下拉列表时，点击退格键就会返回到登录页面。
                    htmls += "<div class='pj_combobox_input'><input type='text' value='' onkeydown='return false' onkeyup='return false'  /></div><div class='pj_combobox_btn'></div>";
                }
                else {
                    htmls += "<div class='pj_combobox_input'><input type='text' value='' /></div><div class='pj_combobox_btn'></div>";
                }
                htmls += "<div class='pj_combobox_box' style='display: none;'>";
                htmls += "<ul><li><div class='loading'>数据加载中...</div></li></ul>";
                htmls += "</div>";
                htmls += "</div>";
                this.element.append(htmls);
                // 计算各对象宽高
                $(this.element).find(".pj_combobox .pj_combobox_input").width(width - $(this.element).find(".pj_combobox .pj_combobox_btn").width() - PJtools.Format.cssElementToWH($(this.element).find(".pj_combobox .pj_combobox_input")).width);
                $(this.element).find(".pj_combobox .pj_combobox_input > input[type='text']").width($(this.element).find(".pj_combobox .pj_combobox_input").width() - PJtools.Format.cssElementToWH($(this.element).find(".pj_combobox .pj_combobox_input > input[type='text']")).width);
                $(this.element).find(".pj_combobox .pj_combobox_box").width(width - PJtools.Format.cssElementToWH($(this.element).find(".pj_combobox .pj_combobox_box")).width);
                $(this.element).find(".pj_combobox .pj_combobox_box > ul").width(width - PJtools.Format.cssElementToWH($(this.element).find(".pj_combobox .pj_combobox_box")).width);
            },
            _InitList: function () { // 根据select控件选项添加option子项
                var htmls = ""; // 初始化htmls字符串变量
                $(this.element).find("select > option").each(function () { // 循环遍历添加子项
                    var _pyStr = PJtools.GB2312().TransformSpell($(this).text());
                    var _letterStr = PJtools.GB2312().TransformFirstLetter($(this).text());
                    if ($(this).attr("selected") == true || $(this).attr("selected") == "selected") {
                        htmls += "<li class='hover' py='" + _pyStr + "' letter='" + _letterStr + "'>" + $(this).text() + "</li>";
                    }
                    else {
                        htmls += "<li py='" + _pyStr + "' letter='" + _letterStr + "'>" + $(this).text() + "</li>";
                    }
                });
                $(this.element).find(".pj_combobox_box > ul").empty().html(htmls);
                // 计算子项宽高
                var _width = $(this.element).find(".pj_combobox").width() - PJtools.Format.cssElementToWH($(this.element).find(".pj_combobox .pj_combobox_box")).width;
                _width -= PJtools.Format.cssElementToWH($(this.element).find(".pj_combobox_box li").eq(0)).width;
                _height = parseInt($(this.element).find(".pj_combobox_box li").eq(0).css("height")) + PJtools.Format.cssElementToWH($(this.element).find(".pj_combobox_box li").eq(0)).height;
                if (this.options.listNum >= $(this.element).find("select > option").length) { // 无滚动条
                    $(this.element).find(".pj_combobox_box > ul").height($(this.element).find("select > option").length * _height);
                    $(this.element).find(".pj_combobox_box li").width(_width);
                }
                else {
                    $(this.element).find(".pj_combobox_box > ul").height(this.options.listNum * _height);
                    $(this.element).find(".pj_combobox_box li").width(_width - $.PJtools.ComboBox.scrollWidth);
                }
                // 绑定子项mouse事件
                $(this.element).find(".pj_combobox_box li").live("mouseover", function () {
                    if (!$(this).hasClass("hover")) {
                        $(this).addClass("hover");
                        $(this).siblings().removeClass("hover");
                    }
                }).live("click", { obj: this }, this._SelectedOptionItem);
            },
            _AutoComboBoxHeight: function () { // 根据选项数计算ComboBox-Box框高度
                var _width = $(this.element).find(".pj_combobox").width() - PJtools.Format.cssElementToWH($(this.element).find(".pj_combobox .pj_combobox_box")).width;
                _width -= PJtools.Format.cssElementToWH($(this.element).find(".pj_combobox_box li").eq(0)).width;
                _height = parseInt($(this.element).find(".pj_combobox_box li").eq(0).css("height")) + PJtools.Format.cssElementToWH($(this.element).find(".pj_combobox_box li").eq(0)).height;
                if ($(this.element).find(".pj_combobox_box").find("ul > li[filte='true']").length > 0) {
                    if (this.options.listNum >= $(this.element).find(".pj_combobox_box").find("ul > li[filte='true']").length) { // 无滚动条
                        $(this.element).find(".pj_combobox_box > ul").height($(this.element).find(".pj_combobox_box").find("ul > li[filte='true']").length * _height);
                        $(this.element).find(".pj_combobox_box li").width(_width);
                    }
                    else {
                        $(this.element).find(".pj_combobox_box > ul").height(this.options.listNum * _height);
                        $(this.element).find(".pj_combobox_box li").width(_width - $.PJtools.ComboBox.scrollWidth);
                    }
                }
                else {
                    if (this.options.listNum >= $(this.element).find(".pj_combobox_box").find("ul > li").length) { // 无滚动条
                        $(this.element).find(".pj_combobox_box > ul").height($(this.element).find(".pj_combobox_box").find("ul > li").length * _height);
                        $(this.element).find(".pj_combobox_box li").width(_width);
                    }
                    else {
                        $(this.element).find(".pj_combobox_box > ul").height(this.options.listNum * _height);
                        $(this.element).find(".pj_combobox_box li").width(_width - $.PJtools.ComboBox.scrollWidth);
                    }
                }
            },
            _AutoComboBoxOffset: function () { // 计算ComboBox-Box框显示的位置
                var _offset = $(this.element).find(".pj_combobox").position();
                var _top = _offset.top, _left = _offset.left;
                var _height = $(this.element).find(".pj_combobox_box").outerHeight();
                if ((document.documentElement.clientHeight - (_offset.top - $(document).scrollTop()) - $(this.element).find(".pj_combobox").outerHeight()) < _height) {
                    if ((_top - _height) >= 0) { // 向上显示
                        _top -= _height;
                        if ($.browser.msie) { _top += 6; _left -= 6; }
                    }
                    else {  // 默认向下
                        _top += $(this.element).find(".pj_combobox").outerHeight();
                        if ($.browser.msie) { _top -= 6; _left -= 6; }
                    }
                }
                else { // 默认向下
                    _top += $(this.element).find(".pj_combobox").outerHeight();
                    if ($.browser.msie) { _top -= 6; _left -= 6; }
                }
                $(this.element).find(".pj_combobox_box").css({ "top": _top + "px", "left": _left + "px" });
            },
            _AutoOptionScrollTop: function () { // 计算ComboBox选定项水平滚动范围
                if ($(this.element).find("select > option").length > 0) {
                    var _index = $(this.element).find("select > option").index($(this.element).find("select > option:selected")[0]);
                    var _tempIndex = $(this.element).find(".pj_combobox_box").find("ul > li").index($(this.element).find(".pj_combobox_box").find("ul > li.hover")[0]);
                    if (_index != _tempIndex) {
                        $(this.element).find(".pj_combobox_box").find("ul > li").eq(_index).addClass("hover");
                        $(this.element).find(".pj_combobox_box").find("ul > li").eq(_index).siblings().removeClass("hover");
                    }
                    if (($(this.element).find(".pj_combobox_box").find("ul > li.hover").position().top + $(this.element).find(".pj_combobox_box").find("ul > li.hover").outerHeight()) > $(this.element).find(".pj_combobox_box ul").height()) {
                        $(this.element).find(".pj_combobox_box ul").scrollTop($(this.element).find(".pj_combobox_box").find("ul > li.hover").position().top);
                    }
                }
            },
            _ComboBoxClick: function (event) { // ComboBox控件单击事件

                var _this = event.data.obj;
                if ($(_this.element).find(".pj_combobox_box").find("ul > li[filte='true']").length > 0) { _this._RecoverOptionItems(); }
                if ($(_this.element).find(".pj_combobox_box").css("display") != "none") { _this._HideListBox(); }
                else {
                    if ($(_this.element).find("select > option").length > 0) {
                        _this._AutoComboBoxOffset();
                        _this._ShowListBox();
                        _this._AutoOptionScrollTop();
                    }
                }
            },
            _ComboBoxMouseOver: function (event) { // ComboBox控件鼠标MouseOver事件
                var _this = event.data.obj;
                _this._IsLeave = true;
            },
            _ComboBoxMouseOut: function (event) { // ComboBox控件鼠标MouseOut事件
                var _this = event.data.obj;
                _this._IsLeave = false;
            },
            _ComboBoxFocusOut: function (event) { // ComboBox控件文本框失焦事件
                var _this = event.data.obj;
                if ($(_this.element).find(".pj_combobox .pj_combobox_input > input[type='text']").val() != $(_this.element).find("select > option:selected").text()) {
                    $(_this.element).find(".pj_combobox .pj_combobox_input > input[type='text']").val($(_this.element).find("select > option:selected").text());
                }
                if (!_this._IsLeave) {
                    _this._HideListBox();
                    if ($(_this.element).find(".pj_combobox_box").find("ul > li[filte='true']").length > 0) { _this._RecoverOptionItems(); }
                }
            },
            _ShowListBox: function () { // 显示子项Box框
                $(this.element).find(".pj_combobox").addClass("focus");
                $(this.element).find("input[type='text']").select().focus();
                $(this.element).find(".pj_combobox_box").show(); // 显示选项框
            },
            _HideListBox: function () { // 隐藏子项Box框
                $(this.element).find(".pj_combobox_box").hide();
                $(this.element).find(".pj_combobox").removeClass("focus");
                $(this.element).find("input[type='text']").blur();
            },
            _SelectedOptionItem: function (event) { // 选定ComboBox子项
                var _index = $(this).closest(".pj_combobox_box").find("ul > li").index($(this)[0]);
                if ($(this).closest(".pj_combobox").parent().find("select")[0].selectedIndex != _index) {
                    $(this).closest(".pj_combobox").parent().find("select")[0].selectedIndex = _index;
                    $(this).closest(".pj_combobox").parent().find("select").change();
                }
                $(this).closest(".pj_combobox").find("input[type='text']").val($(this).closest(".pj_combobox").parent().find("select option:selected").text()).select().focus();
                var _this = event.data.obj;
                _this._HideListBox();
            },
            _KeyDownOptionItem: function (event) { // 键盘操作ComboBox子项
                var _this = event.data.obj;
                switch (event.keyCode) {
                    case 13: // enter
                        if ($(_this.element).find(".pj_combobox_box").css("display") != "none") { $(_this.element).find(".pj_combobox_box li.hover").click(); }
                        break;
                    case 27: // esc
                        if ($(_this.element).find(".pj_combobox_box").css("display") != "none") { $(_this.element).find(".pj_combobox_btn").click(); }
                        break;
                    case 38: // up
                        if ($(_this.element).find(".pj_combobox_box").css("display") == "none") { $(_this.element).find(".pj_combobox_btn").click(); }
                        else { _this._PrevOption(); }
                        break;
                    case 40: // down
                        if ($(_this.element).find(".pj_combobox_box").css("display") == "none") { $(_this.element).find(".pj_combobox_btn").click(); }
                        else { _this._NextOption(); }
                        break;
                }
            },
            _PrevOption: function () { // 选择上一个ComboBox子项
                if ($(this.element).find(".pj_combobox_box").find("ul > li[filte='true']").length > 0) {
                    var _index = $(this.element).find(".pj_combobox_box").find("ul > li[filte='true']").index($(this.element).find(".pj_combobox_box").find("ul > li[filte='true'].hover")[0]);
                    if (_index > 0) {
                        $(this.element).find(".pj_combobox_box").find("ul > li[filte='true']").eq(_index - 1).addClass("hover");
                        $(this.element).find(".pj_combobox_box").find("ul > li[filte='true']").eq(_index - 1).siblings().removeClass("hover");
                        if ($(this.element).find(".pj_combobox_box").find("ul > li[filte='true'].hover").position().top <= 0) {
                            $(this.element).find(".pj_combobox_box ul").scrollTop($(this.element).find(".pj_combobox_box ul").scrollTop() + $(this.element).find(".pj_combobox_box").find("ul > li[filte='true'].hover").position().top);
                        }
                    }
                }
                else {
                    var _index = $(this.element).find(".pj_combobox_box").find("ul > li").index($(this.element).find(".pj_combobox_box").find("ul > li.hover")[0]);
                    if (_index > 0) {
                        $(this.element).find(".pj_combobox_box").find("ul > li").eq(_index - 1).addClass("hover");
                        $(this.element).find(".pj_combobox_box").find("ul > li").eq(_index - 1).siblings().removeClass("hover");
                        if ($(this.element).find(".pj_combobox_box").find("ul > li.hover").position().top <= 0) {
                            $(this.element).find(".pj_combobox_box ul").scrollTop($(this.element).find(".pj_combobox_box ul").scrollTop() + $(this.element).find(".pj_combobox_box").find("ul > li.hover").position().top);
                        }
                    }
                }
            },
            _NextOption: function () { // 选择下一个ComboBox子项
                if ($(this.element).find(".pj_combobox_box").find("ul > li[filte='true']").length > 0) {
                    var _index = $(this.element).find(".pj_combobox_box").find("ul > li[filte='true']").index($(this.element).find(".pj_combobox_box").find("ul > li[filte='true'].hover")[0]);
                    if (_index < $(this.element).find(".pj_combobox_box").find("ul > li[filte='true']").length) {
                        $(this.element).find(".pj_combobox_box").find("ul > li[filte='true']").eq(_index + 1).addClass("hover");
                        $(this.element).find(".pj_combobox_box").find("ul > li[filte='true']").eq(_index + 1).siblings().removeClass("hover");
                        if (($(this.element).find(".pj_combobox_box").find("ul > li[filte='true'].hover").position().top + $(this.element).find(".pj_combobox_box").find("ul > li[filte='true'].hover").outerHeight()) > $(this.element).find(".pj_combobox_box ul").height()) {
                            var _height = ($(this.element).find(".pj_combobox_box").find("ul > li[filte='true'].hover").position().top + $(this.element).find(".pj_combobox_box").find("ul > li[filte='true'].hover").outerHeight()) - $(this.element).find(".pj_combobox_box ul").height();
                            $(this.element).find(".pj_combobox_box ul").scrollTop($(this.element).find(".pj_combobox_box ul").scrollTop() + _height);
                        }
                    }
                }
                else {
                    var _index = $(this.element).find(".pj_combobox_box").find("ul > li").index($(this.element).find(".pj_combobox_box").find("ul > li.hover")[0]);
                    if (_index < $(this.element).find(".pj_combobox_box").find("ul > li").length) {
                        $(this.element).find(".pj_combobox_box").find("ul > li").eq(_index + 1).addClass("hover");
                        $(this.element).find(".pj_combobox_box").find("ul > li").eq(_index + 1).siblings().removeClass("hover");
                        if (($(this.element).find(".pj_combobox_box").find("ul > li.hover").position().top + $(this.element).find(".pj_combobox_box").find("ul > li.hover").outerHeight()) > $(this.element).find(".pj_combobox_box ul").height()) {
                            var _height = ($(this.element).find(".pj_combobox_box").find("ul > li.hover").position().top + $(this.element).find(".pj_combobox_box").find("ul > li.hover").outerHeight()) - $(this.element).find(".pj_combobox_box ul").height();
                            $(this.element).find(".pj_combobox_box ul").scrollTop($(this.element).find(".pj_combobox_box ul").scrollTop() + _height);
                        }
                    }
                }
            },
            _QueryOptionItems: function (event) { // 检索ComboBox子项
                var _this = event.data.obj;
                if (event.keyCode == 13 || event.keyCode == 27 || event.keyCode == 38 || event.keyCode == 40) { return false; }
                if ($.trim($(this).val()) != "" && $.trim($(this).val()) != null) {
                    var bool = _this._FilteOptionItems($(this).val());
                    if (bool) { // 无过滤选项
                        _this._RecoverOptionItems();
                        $(_this.element).find(".pj_combobox_box").hide();
                        $(_this.element).find(".pj_combobox").removeClass("focus");
                    }
                    else {
                        if ($(_this.element).find(".pj_combobox_box").css("display") == "none") {
                            _this._AutoComboBoxOffset();
                            $(_this.element).find(".pj_combobox").addClass("focus");
                            _this._AutoComboBoxHeight();
                            $(_this.element).find(".pj_combobox_box").show();
                        }
                        else { _this._AutoComboBoxHeight(); }
                    }
                }
                else if ($(_this.element).find(".pj_combobox_box").css("display") != "none") { _this._RecoverOptionItems(); }
            },
            _FilteOptionItems: function (Str) { // 过滤ComboBox显示的子项
                var len = $(this.element).find(".pj_combobox_box").find("ul > li").length;
                var bool = true;
                for (var i = 0; i < len; i++) {
                    var obj = $(this.element).find(".pj_combobox_box").find("ul > li").eq(i);
                    if (obj.text().substring(0, Str.length) == Str || obj.attr("py").substring(0, Str.length) == Str || obj.attr("letter").substring(0, Str.length) == Str) {
                        obj.attr("filte", true).show();
                        bool = false;
                    }
                    else { obj.removeAttr("filte").hide(); }
                }
                if (!bool) {
                    $(this.element).find(".pj_combobox_box").find("ul > li").removeClass("hover");
                    $(this.element).find(".pj_combobox_box").find("ul > li[filte='true']").eq(0).addClass("hover");
                    $(this.element).find(".pj_combobox_box ul").scrollTop(0);
                }
                return bool;
            },
            _RecoverOptionItems: function () { // 恢复ComboBox隐藏的子项
                $(this.element).find(".pj_combobox_box").find("ul > li").show().attr("filte", true);
                this._AutoComboBoxHeight();
                $(this.element).find(".pj_combobox_box").find("ul > li").removeAttr("filte");
            },
            getComboBoxText: function () { // 获取ComboBox选定项文本值
                return this.element.find("select > option:selected").text();
            },
            getComboBoxValue: function () { // 获取ComboBox选定项value值
                return this.element.find("select > option:selected").attr("value");
            },
            getComboBoxIndexText: function (index) { // 根据指定项索引获取文本Text值
                return this.element.find("select > option").eq(index).text();
            },
            getComboBoxIndexValue: function (index) { // 根据指定项索引获取value值
                return this.element.find("select > option").eq(index).attr("value");
            },
            setSelectOptionItem: function (index) { // 指定索引值选定ComboBox选项
                var _indexTemp = this.element.find("select > option").index(this.element.find("select > option:selected")[0]);
                if (_indexTemp != index) {
                    this.element.find(".pj_combobox_box").find("ul > li").eq(index).addClass("hover");
                    this.element.find(".pj_combobox_box").find("ul > li").eq(index).siblings().removeClass("hover");
                    this.element.find("select")[0].selectedIndex = index;
                    this.element.find(".pj_combobox").find("input[type='text']").val(this.element.find("select > option:selected").text()).select().focus();
                    this.element.find("select").change();
                }
            },
            setSelectOptionItemByValue: function (_value) {//李飞 指定value选定的ComboBox 二〇一二年四月十二日 13:46:38
                this.element.find("select").attr("value", _value).attr("selected", "selected");
                this.element.find("select > option:selected").addClass("hover");
                this.element.find("select > option:selected").siblings().removeClass("hover");
                this.element.find(".pj_combobox").find("input[type='text']").val(this.element.find("select > option:selected").text()).select().focus();
                this.element.find("select").change();
            },
            addOptionItem: function (text, value, index, isSelect) { // 添加一个新的子项（text：文本值；value：value值；index：插入指定索引值后面,其中-1为插入首项；isSelect：是否插入后选定）
                if ($.trim(text) != "" && text != null && text != undefined) {
                    var newOption = "<option";
                    if ($.trim(value) != "" && value != null && value != undefined) { newOption += " value='" + value + "'"; }
                    newOption += ">" + text + "</option>";
                    var _pyStr = PJtools.GB2312().TransformSpell(text);
                    var _letterStr = PJtools.GB2312().TransformFirstLetter(text);
                    var newli = "<li py='" + _pyStr + "' letter='" + _letterStr + "'>" + text + "</li>";
                    if (this.element.find("select > option").length > 0) {
                        if ($.trim(index) != "" && index != null && index != undefined) {
                            if (parseInt(index) == -1) { // 插入到首项
                                this.element.find("select").prepend(newOption);
                                this.element.find(".pj_combobox_box ul").prepend(newli);
                                if ($.trim(isSelect) != "" && isSelect != null && isSelect != undefined && isSelect == "true") { this.setSelectOptionItem(0); }
                            }
                            else if (parseInt(index) >= 0) { // 插入到指定位置后面
                                this.element.find("select > option").eq(parseInt(index)).after(newOption);
                                this.element.find(".pj_combobox_box").find("ul > li").eq(parseInt(index)).after(newli);
                                if ($.trim(isSelect) != "" && isSelect != null && isSelect != undefined && isSelect == "true") { this.setSelectOptionItem(parseInt(index) + 1); }
                            }
                            else { // 默认插入到最后
                                this.element.find("select").append(newOption);
                                this.element.find(".pj_combobox_box ul").append(newli);
                                if ($.trim(isSelect) != "" && isSelect != null && isSelect != undefined && isSelect == "true") { this.setSelectOptionItem(this.element.find(".pj_combobox_box").find("ul > li").length - 1); }
                            }
                        }
                        else { // 默认插入到最后
                            this.element.find("select").append(newOption);
                            this.element.find(".pj_combobox_box ul").append(newli);
                            if ($.trim(isSelect) != "" && isSelect != null && isSelect != undefined && isSelect == "true") { this.setSelectOptionItem(this.element.find(".pj_combobox_box").find("ul > li").length - 1); }
                        }
                    }
                    else {
                        this.element.find("select").prepend(newOption);
                        this.element.find(".pj_combobox_box ul").prepend(newli);
                        this.element.find(".pj_combobox_box").find("ul > li").eq(0).addClass("hover");
                        this.element.find(".pj_combobox_box").find("ul > li").eq(0).siblings().removeClass("hover");
                        this.element.find("select")[0].selectedIndex = 0;
                        this.element.find(".pj_combobox").find("input[type='text']").val(this.element.find("select > option:selected").text()).select();
                        this.element.find("select").change();
                    }
                    this._AutoComboBoxHeight();
                }
            },
            removeOptionItem: function (index) { // 移除指定子项
                var _indexTemp = this.element.find("select > option").index(this.element.find("select > option:selected")[0]);
                this.element.find("select > option").eq(parseInt(index)).remove();
                this.element.find(".pj_combobox_box").find("ul > li").eq(parseInt(index)).remove();
                if (this.element.find("select > option").length > 0) {
                    if (_indexTemp == index) { // 判断是否移除为选定项
                        this.element.find(".pj_combobox_box").find("ul > li").eq(0).addClass("hover");
                        this.element.find(".pj_combobox_box").find("ul > li").eq(0).siblings().removeClass("hover");
                        this.element.find("select")[0].selectedIndex = 0;
                        this.element.find(".pj_combobox").find("input[type='text']").val(this.element.find("select > option:selected").text()).select();
                        this.element.find("select").change();
                    }
                    this._AutoComboBoxHeight();
                }
                else { this.element.find(".pj_combobox").find("input[type='text']").val(""); }
            }
        });

        $.extend($.PJtools.ComboBox, {
            version: '1.0.0',
            scrollWidth: 17
        });
    })(jQuery);


    /*******************************
        文件名：PJtools.GB2312.js
    *******************************/
    (function ($) {
        PJtools.GB2312 = function () {
            var GBStr = "啊阿埃挨哎唉哀皑癌蔼矮艾碍爱隘鞍氨安俺按暗岸胺案肮昂盎凹敖熬翱袄傲奥懊澳芭捌扒叭吧笆八疤巴拔跋靶把耙坝霸罢爸白柏百摆佰败拜稗斑班搬扳般颁板版扮拌伴瓣半办绊邦帮梆榜膀绑棒磅蚌镑傍谤苞胞包褒剥薄雹保堡饱宝抱报暴豹鲍爆杯碑悲卑北辈背贝钡倍狈备惫焙被奔苯本笨崩绷甭泵蹦迸逼鼻比鄙笔彼碧蓖蔽毕毙毖币庇痹闭敝弊必辟壁臂避陛鞭边编贬扁便变卞辨辩辫遍标彪膘表鳖憋别瘪彬斌濒滨宾摈兵冰柄丙秉饼炳病并玻菠播拨钵波博勃搏铂箔伯帛舶脖膊渤泊驳捕卜哺补埠不布步簿部怖擦猜裁材才财睬踩采彩菜蔡餐参蚕残惭惨灿苍舱仓沧藏操糙槽曹草厕策侧册测层蹭插叉茬茶查碴搽察岔差诧拆柴豺搀掺蝉馋谗缠铲产阐颤昌猖场尝常长偿肠厂敞畅唱倡超抄钞朝嘲潮巢吵炒车扯撤掣彻澈郴臣辰尘晨忱沉陈趁衬撑称城橙成呈乘程惩澄诚承逞骋秤吃痴持匙池迟弛驰耻齿侈尺赤翅斥炽充冲虫崇宠抽酬畴踌稠愁筹仇绸瞅丑臭初出橱厨躇锄雏滁除楚础储矗搐触处揣川穿椽传船喘串疮窗幢床闯创吹炊捶锤垂春椿醇唇淳纯蠢戳绰疵茨磁雌辞慈瓷词此刺赐次聪葱囱匆从丛凑粗醋簇促蹿篡窜摧崔催脆瘁粹淬翠村存寸磋撮搓措挫错搭达答瘩打大呆歹傣戴带殆代贷袋待逮怠耽担丹单郸掸胆旦氮但惮淡诞弹蛋当挡党荡档刀捣蹈倒岛祷导到稻悼道盗德得的蹬灯登等瞪凳邓堤低滴迪敌笛狄涤翟嫡抵底地蒂第帝弟递缔颠掂滇碘点典靛垫电佃甸店惦奠淀殿碉叼雕凋刁掉吊钓调跌爹碟蝶迭谍叠丁盯叮钉顶鼎锭定订丢东冬董懂动栋侗恫冻洞兜抖斗陡豆逗痘都督毒犊独读堵睹赌杜镀肚度渡妒端短锻段断缎堆兑队对墩吨蹲敦顿囤钝盾遁掇哆多夺垛躲朵跺舵剁惰堕蛾峨鹅俄额讹娥恶厄扼遏鄂饿恩而儿耳尔饵洱二贰发罚筏伐乏阀法珐藩帆番翻樊矾钒繁凡烦反返范贩犯饭泛坊芳方肪房防妨仿访纺放菲非啡飞肥匪诽吠肺废沸费芬酚吩氛分纷坟焚汾粉奋份忿愤粪丰封枫蜂峰锋风疯烽逢冯缝讽奉凤佛否夫敷肤孵扶拂辐幅氟符伏俘服浮涪福袱弗甫抚辅俯釜斧脯腑府腐赴副覆赋复傅付阜父腹负富讣附妇缚咐噶嘎该改概钙盖溉干甘杆柑竿肝赶感秆敢赣冈刚钢缸肛纲岗港杠篙皋高膏羔糕搞镐稿告哥歌搁戈鸽胳疙割革葛格蛤阁隔铬个各给根跟耕更庚羹埂耿梗工攻功恭龚供躬公宫弓巩汞拱贡共钩勾沟苟狗垢构购够辜菇咕箍估沽孤姑鼓古蛊骨谷股故顾固雇刮瓜剐寡挂褂乖拐怪棺关官冠观管馆罐惯灌贯光广逛瑰规圭硅归龟闺轨鬼诡癸桂柜跪贵刽辊滚棍锅郭国果裹过哈骸孩海氦亥害骇酣憨邯韩含涵寒函喊罕翰撼捍旱憾悍焊汗汉夯杭航壕嚎豪毫郝好耗号浩呵喝荷菏核禾和何合盒貉阂河涸赫褐鹤贺嘿黑痕很狠恨哼亨横衡恒轰哄烘虹鸿洪宏弘红喉侯猴吼厚候后呼乎忽瑚壶葫胡蝴狐糊湖弧虎唬护互沪户花哗华猾滑画划化话槐徊怀淮坏欢环桓还缓换患唤痪豢焕涣宦幻荒慌黄磺蝗簧皇凰惶煌晃幌恍谎灰挥辉徽恢蛔回毁悔慧卉惠晦贿秽会烩汇讳诲绘荤昏婚魂浑混豁活伙火获或惑霍货祸击圾基机畸稽积箕肌饥迹激讥鸡姬绩缉吉极棘辑籍集及急疾汲即嫉级挤几脊己蓟技冀季伎祭剂悸济寄寂计记既忌际妓继纪嘉枷夹佳家加荚颊贾甲钾假稼价架驾嫁歼监坚尖笺间煎兼肩艰奸缄茧检柬碱硷拣捡简俭剪减荐槛鉴践贱见键箭件健舰剑饯渐溅涧建僵姜将浆江疆蒋桨奖讲匠酱降蕉椒礁焦胶交郊浇骄娇嚼搅铰矫侥脚狡角饺缴绞剿教酵轿较叫窖揭接皆秸街阶截劫节桔杰捷睫竭洁结解姐戒藉芥界借介疥诫届巾筋斤金今津襟紧锦仅谨进靳晋禁近烬浸尽劲荆兢茎睛晶鲸京惊精粳经井警景颈静境敬镜径痉靖竟竞净炯窘揪究纠玖韭久灸九酒厩救旧臼舅咎就疚鞠拘狙疽居驹菊局咀矩举沮聚拒据巨具距踞锯俱句惧炬剧捐鹃娟倦眷卷绢撅攫抉掘倔爵觉决诀绝均菌钧军君峻俊竣浚郡骏喀咖卡咯开揩楷凯慨刊堪勘坎砍看康慷糠扛抗亢炕考拷烤靠坷苛柯棵磕颗科壳咳可渴克刻客课肯啃垦恳坑吭空恐孔控抠口扣寇枯哭窟苦酷库裤夸垮挎跨胯块筷侩快宽款匡筐狂框矿眶旷况亏盔岿窥葵奎魁傀馈愧溃坤昆捆困括扩廓阔垃拉喇蜡腊辣啦莱来赖蓝婪栏拦篮阑兰澜谰揽览懒缆烂滥琅榔狼廊郎朗浪捞劳牢老佬姥酪烙涝勒乐雷镭蕾磊累儡垒擂肋类泪棱楞冷厘梨犁黎篱狸离漓理李里鲤礼莉荔吏栗丽厉励砾历利傈例俐痢立粒沥隶力璃哩俩联莲连镰廉怜涟帘敛脸链恋炼练粮凉梁粱良两辆量晾亮谅撩聊僚疗燎寥辽潦了撂镣廖料列裂烈劣猎琳林磷霖临邻鳞淋凛赁吝拎玲菱零龄铃伶羚凌灵陵岭领另令溜琉榴硫馏留刘瘤流柳六龙聋咙笼窿隆垄拢陇楼娄搂篓漏陋芦卢颅庐炉掳卤虏鲁麓碌露路赂鹿潞禄录陆戮驴吕铝侣旅履屡缕虑氯律率滤绿峦挛孪滦卵乱掠略抡轮伦仑沦纶论萝螺罗逻锣箩骡裸落洛骆络妈麻玛码蚂马骂嘛吗埋买麦卖迈脉瞒馒蛮满蔓曼慢漫谩芒茫盲氓忙莽猫茅锚毛矛铆卯茂冒帽貌贸么玫枚梅酶霉煤没眉媒镁每美昧寐妹媚门闷们萌蒙檬盟锰猛梦孟眯醚靡糜迷谜弥米秘觅泌蜜密幂棉眠绵冕免勉娩缅面苗描瞄藐秒渺庙妙蔑灭民抿皿敏悯闽明螟鸣铭名命谬摸摹蘑模膜磨摩魔抹末莫墨默沫漠寞陌谋牟某拇牡亩姆母墓暮幕募慕木目睦牧穆拿哪呐钠那娜纳氖乃奶耐奈南男难囊挠脑恼闹淖呢馁内嫩能妮霓倪泥尼拟你匿腻逆溺蔫拈年碾撵捻念娘酿鸟尿捏聂孽啮镊镍涅您柠狞凝宁拧泞牛扭钮纽脓浓农弄奴努怒女暖虐疟挪懦糯诺哦欧鸥殴藕呕偶沤啪趴爬帕怕琶拍排牌徘湃派攀潘盘磐盼畔判叛乓庞旁耪胖抛咆刨炮袍跑泡呸胚培裴赔陪配佩沛喷盆砰抨烹澎彭蓬棚硼篷膨朋鹏捧碰坯砒霹批披劈琵毗啤脾疲皮匹痞僻屁譬篇偏片骗飘漂瓢票撇瞥拼频贫品聘乒坪苹萍平凭瓶评屏坡泼颇婆破魄迫粕剖扑铺仆莆葡菩蒲埔朴圃普浦谱曝瀑期欺栖戚妻七凄漆柒沏其棋奇歧畦崎脐齐旗祈祁骑起岂乞企启契砌器气迄弃汽泣讫掐恰洽牵扦钎铅千迁签仟谦乾黔钱钳前潜遣浅谴堑嵌欠歉枪呛腔羌墙蔷强抢橇锹敲悄桥瞧乔侨巧鞘撬翘峭俏窍切茄且怯窃钦侵亲秦琴勤芹擒禽寝沁青轻氢倾卿清擎晴氰情顷请庆琼穷秋丘邱球求囚酋泅趋区蛆曲躯屈驱渠取娶龋趣去圈颧权醛泉全痊拳犬券劝缺炔瘸却鹊榷确雀裙群然燃冉染瓤壤攘嚷让饶扰绕惹热壬仁人忍韧任认刃妊纫扔仍日戎茸蓉荣融熔溶容绒冗揉柔肉茹蠕儒孺如辱乳汝入褥软阮蕊瑞锐闰润若弱撒洒萨腮鳃塞赛三叁伞散桑嗓丧搔骚扫嫂瑟色涩森僧莎砂杀刹沙纱傻啥煞筛晒珊苫杉山删煽衫闪陕擅赡膳善汕扇缮墒伤商赏晌上尚裳梢捎稍烧芍勺韶少哨邵绍奢赊蛇舌舍赦摄射慑涉社设砷申呻伸身深娠绅神沈审婶甚肾慎渗声生甥牲升绳省盛剩胜圣师失狮施湿诗尸虱十石拾时什食蚀实识史矢使屎驶始式示士世柿事拭誓逝势是嗜噬适仕侍释饰氏市恃室视试收手首守寿授售受瘦兽蔬枢梳殊抒输叔舒淑疏书赎孰熟薯暑曙署蜀黍鼠属术述树束戍竖墅庶数漱恕刷耍摔衰甩帅栓拴霜双爽谁水睡税吮瞬顺舜说硕朔烁斯撕嘶思私司丝死肆寺嗣四伺似饲巳松耸怂颂送宋讼诵搜艘擞嗽苏酥俗素速粟僳塑溯宿诉肃酸蒜算虽隋随绥髓碎岁穗遂隧祟孙损笋蓑梭唆缩琐索锁所塌他它她塔獭挞蹋踏胎苔抬台泰酞太态汰坍摊贪瘫滩坛檀痰潭谭谈坦毯袒碳探叹炭汤塘搪堂棠膛唐糖倘躺淌趟烫掏涛滔绦萄桃逃淘陶讨套特藤腾疼誊梯剔踢锑提题蹄啼体替嚏惕涕剃屉天添填田甜恬舔腆挑条迢眺跳贴铁帖厅听烃汀廷停亭庭挺艇通桐酮瞳同铜彤童桶捅筒统痛偷投头透凸秃突图徒途涂屠土吐兔湍团推颓腿蜕褪退吞屯臀拖托脱鸵陀驮驼椭妥拓唾挖哇蛙洼娃瓦袜歪外豌弯湾玩顽丸烷完碗挽晚皖惋宛婉万腕汪王亡枉网往旺望忘妄威巍微危韦违桅围唯惟为潍维苇萎委伟伪尾纬未蔚味畏胃喂魏位渭谓尉慰卫瘟温蚊文闻纹吻稳紊问嗡翁瓮挝蜗涡窝我斡卧握沃巫呜钨乌污诬屋无芜梧吾吴毋武五捂午舞伍侮坞戊雾晤物勿务悟误昔熙析西硒矽晰嘻吸锡牺稀息希悉膝夕惜熄烯溪汐犀檄袭席习媳喜铣洗系隙戏细瞎虾匣霞辖暇峡侠狭下厦夏吓掀锨先仙鲜纤咸贤衔舷闲涎弦嫌显险现献县腺馅羡宪陷限线相厢镶香箱襄湘乡翔祥详想响享项巷橡像向象萧硝霄削哮嚣销消宵淆晓小孝校肖啸笑效楔些歇蝎鞋协挟携邪斜胁谐写械卸蟹懈泄泻谢屑薪芯锌欣辛新忻心信衅星腥猩惺兴刑型形邢行醒幸杏性姓兄凶胸匈汹雄熊休修羞朽嗅锈秀袖绣墟戌需虚嘘须徐许蓄酗叙旭序畜恤絮婿绪续轩喧宣悬旋玄选癣眩绚靴薛学穴雪血勋熏循旬询寻驯巡殉汛训讯逊迅压押鸦鸭呀丫芽牙蚜崖衙涯雅哑亚讶焉咽阉烟淹盐严研蜒岩延言颜阎炎沿奄掩眼衍演艳堰燕厌砚雁唁彦焰宴谚验殃央鸯秧杨扬佯疡羊洋阳氧仰痒养样漾邀腰妖瑶摇尧遥窑谣姚咬舀药要耀椰噎耶爷野冶也页掖业叶曳腋夜液一壹医揖铱依伊衣颐夷遗移仪胰疑沂宜姨彝椅蚁倚已乙矣以艺抑易邑屹亿役臆逸肄疫亦裔意毅忆义益溢诣议谊译异翼翌绎茵荫因殷音阴姻吟银淫寅饮尹引隐印英樱婴鹰应缨莹萤营荧蝇迎赢盈影颖硬映哟拥佣臃痈庸雍踊蛹咏泳涌永恿勇用幽优悠忧尤由邮铀犹油游酉有友右佑釉诱又幼迂淤于盂榆虞愚舆余俞逾鱼愉渝渔隅予娱雨与屿禹宇语羽玉域芋郁吁遇喻峪御愈欲狱育誉浴寓裕预豫驭鸳渊冤元垣袁原援辕园员圆猿源缘远苑愿怨院曰约越跃钥岳粤月悦阅耘云郧匀陨允运蕴酝晕韵孕匝砸杂栽哉灾宰载再在咱攒暂赞赃脏葬遭糟凿藻枣早澡蚤躁噪造皂灶燥责择则泽贼怎增憎曾赠扎喳渣札轧铡闸眨栅榨咋乍炸诈摘斋宅窄债寨瞻毡詹粘沾盏斩辗崭展蘸栈占战站湛绽樟章彰漳张掌涨杖丈帐账仗胀瘴障招昭找沼赵照罩兆肇召遮折哲蛰辙者锗蔗这浙珍斟真甄砧臻贞针侦枕疹诊震振镇阵蒸挣睁征狰争怔整拯正政帧症郑证芝枝支吱蜘知肢脂汁之织职直植殖执值侄址指止趾只旨纸志挚掷至致置帜峙制智秩稚质炙痔滞治窒中盅忠钟衷终种肿重仲众舟周州洲诌粥轴肘帚咒皱宙昼骤珠株蛛朱猪诸诛逐竹烛煮拄瞩嘱主著柱助蛀贮铸筑住注祝驻抓爪拽专砖转撰赚篆桩庄装妆撞壮状椎锥追赘坠缀谆准捉拙卓桌琢茁酌啄着灼浊兹咨资姿滋淄孜紫仔籽滓子自渍字鬃棕踪宗综总纵邹走奏揍租足卒族祖诅阻组钻纂嘴醉最罪尊遵昨左佐柞做作坐座亍丌兀丐廿卅丕亘丞鬲孬噩丨禺丿匕乇夭爻卮氐囟胤馗毓睾鼗丶亟鼐乜乩亓芈孛啬嘏仄厍厝厣厥厮靥赝匚叵匦匮匾赜卦卣刂刈刎刭刳刿剀剌剞剡剜蒯剽劂劁劐劓冂罔亻仃仉仂仨仡仫仞伛仳伢佤仵伥伧伉伫佞佧攸佚佝佟佗伲伽佶佴侑侉侃侏佾佻侪佼侬侔俦俨俪俅俚俣俜俑俟俸倩偌俳倬倏倮倭俾倜倌倥倨偾偃偕偈偎偬偻傥傧傩傺僖儆僭僬僦僮儇儋仝氽佘佥俎龠汆籴兮巽黉馘冁夔勹匍訇匐凫夙兕亠兖亳衮袤亵脔裒禀嬴蠃羸冫冱冽冼凇冖冢冥讠讦讧讪讴讵讷诂诃诋诏诎诒诓诔诖诘诙诜诟诠诤诨诩诮诰诳诶诹诼诿谀谂谄谇谌谏谑谒谔谕谖谙谛谘谝谟谠谡谥谧谪谫谮谯谲谳谵谶卩卺阝阢阡阱阪阽阼陂陉陔陟陧陬陲陴隈隍隗隰邗邛邝邙邬邡邴邳邶邺邸邰郏郅邾郐郄郇郓郦郢郜郗郛郫郯郾鄄鄢鄞鄣鄱鄯鄹酃酆刍奂劢劬劭劾哿勐勖勰叟燮矍廴凵凼鬯厶弁畚巯坌垩垡塾墼壅壑圩圬圪圳圹圮圯坜圻坂坩垅坫垆坼坻坨坭坶坳垭垤垌垲埏垧垴垓垠埕埘埚埙埒垸埴埯埸埤埝堋堍埽埭堀堞堙塄堠塥塬墁墉墚墀馨鼙懿艹艽艿芏芊芨芄芎芑芗芙芫芸芾芰苈苊苣芘芷芮苋苌苁芩芴芡芪芟苄苎芤苡茉苷苤茏茇苜苴苒苘茌苻苓茑茚茆茔茕苠苕茜荑荛荜茈莒茼茴茱莛荞茯荏荇荃荟荀茗荠茭茺茳荦荥荨茛荩荬荪荭荮莰荸莳莴莠莪莓莜莅荼莶莩荽莸荻莘莞莨莺莼菁萁菥菘堇萘萋菝菽菖萜萸萑萆菔菟萏萃菸菹菪菅菀萦菰菡葜葑葚葙葳蒇蒈葺蒉葸萼葆葩葶蒌蒎萱葭蓁蓍蓐蓦蒽蓓蓊蒿蒺蓠蒡蒹蒴蒗蓥蓣蔌甍蔸蓰蔹蔟蔺蕖蔻蓿蓼蕙蕈蕨蕤蕞蕺瞢蕃蕲蕻薤薨薇薏蕹薮薜薅薹薷薰藓藁藜藿蘧蘅蘩蘖蘼廾弈夼奁耷奕奚奘匏尢尥尬尴扌扪抟抻拊拚拗拮挢拶挹捋捃掭揶捱捺掎掴捭掬掊捩掮掼揲揸揠揿揄揞揎摒揆掾摅摁搋搛搠搌搦搡摞撄摭撖摺撷撸撙撺擀擐擗擤擢攉攥攮弋忒甙弑卟叱叽叩叨叻吒吖吆呋呒呓呔呖呃吡呗呙吣吲咂咔呷呱呤咚咛咄呶呦咝哐咭哂咴哒咧咦哓哔呲咣哕咻咿哌哙哚哜咩咪咤哝哏哞唛哧唠哽唔哳唢唣唏唑唧唪啧喏喵啉啭啁啕唿啐唼唷啖啵啶啷唳唰啜喋嗒喃喱喹喈喁喟啾嗖喑啻嗟喽喾喔喙嗪嗷嗉嘟嗑嗫嗬嗔嗦嗝嗄嗯嗥嗲嗳嗌嗍嗨嗵嗤辔嘞嘈嘌嘁嘤嘣嗾嘀嘧嘭噘嘹噗嘬噍噢噙噜噌噔嚆噤噱噫噻噼嚅嚓嚯囔囗囝囡囵囫囹囿圄圊圉圜帏帙帔帑帱帻帼帷幄幔幛幞幡岌屺岍岐岖岈岘岙岑岚岜岵岢岽岬岫岱岣峁岷峄峒峤峋峥崂崃崧崦崮崤崞崆崛嵘崾崴崽嵬嵛嵯嵝嵫嵋嵊嵩嵴嶂嶙嶝豳嶷巅彳彷徂徇徉後徕徙徜徨徭徵徼衢彡犭犰犴犷犸狃狁狎狍狒狨狯狩狲狴狷猁狳猃狺狻猗猓猡猊猞猝猕猢猹猥猬猸猱獐獍獗獠獬獯獾舛夥飧夤夂饣饧饨饩饪饫饬饴饷饽馀馄馇馊馍馐馑馓馔馕庀庑庋庖庥庠庹庵庾庳赓廒廑廛廨廪膺忄忉忖忏怃忮怄忡忤忾怅怆忪忭忸怙怵怦怛怏怍怩怫怊怿怡恸恹恻恺恂恪恽悖悚悭悝悃悒悌悛惬悻悱惝惘惆惚悴愠愦愕愣惴愀愎愫慊慵憬憔憧憷懔懵忝隳闩闫闱闳闵闶闼闾阃阄阆阈阊阋阌阍阏阒阕阖阗阙阚丬爿戕氵汔汜汊沣沅沐沔沌汨汩汴汶沆沩泐泔沭泷泸泱泗沲泠泖泺泫泮沱泓泯泾洹洧洌浃浈洇洄洙洎洫浍洮洵洚浏浒浔洳涑浯涞涠浞涓涔浜浠浼浣渚淇淅淞渎涿淠渑淦淝淙渖涫渌涮渫湮湎湫溲湟溆湓湔渲渥湄滟溱溘滠漭滢溥溧溽溻溷滗溴滏溏滂溟潢潆潇漤漕滹漯漶潋潴漪漉漩澉澍澌潸潲潼潺濑濉澧澹澶濂濡濮濞濠濯瀚瀣瀛瀹瀵灏灞宀宄宕宓宥宸甯骞搴寤寮褰寰蹇謇辶迓迕迥迮迤迩迦迳迨逅逄逋逦逑逍逖逡逵逶逭逯遄遑遒遐遨遘遢遛暹遴遽邂邈邃邋彐彗彖彘尻咫屐屙孱屣屦羼弪弩弭艴弼鬻屮妁妃妍妩妪妣妗姊妫妞妤姒妲妯姗妾娅娆姝娈姣姘姹娌娉娲娴娑娣娓婀婧婊婕娼婢婵胬媪媛婷婺媾嫫媲嫒嫔媸嫠嫣嫱嫖嫦嫘嫜嬉嬗嬖嬲嬷孀尕尜孚孥孳孑孓孢驵驷驸驺驿驽骀骁骅骈骊骐骒骓骖骘骛骜骝骟骠骢骣骥骧纟纡纣纥纨纩纭纰纾绀绁绂绉绋绌绐绔绗绛绠绡绨绫绮绯绱绲缍绶绺绻绾缁缂缃缇缈缋缌缏缑缒缗缙缜缛缟缡缢缣缤缥缦缧缪缫缬缭缯缰缱缲缳缵幺畿巛甾邕玎玑玮玢玟珏珂珑玷玳珀珉珈珥珙顼琊珩珧珞玺珲琏琪瑛琦琥琨琰琮琬琛琚瑁瑜瑗瑕瑙瑷瑭瑾璜璎璀璁璇璋璞璨璩璐璧瓒璺韪韫韬杌杓杞杈杩枥枇杪杳枘枧杵枨枞枭枋杷杼柰栉柘栊柩枰栌柙枵柚枳柝栀柃枸柢栎柁柽栲栳桠桡桎桢桄桤梃栝桕桦桁桧桀栾桊桉栩梵梏桴桷梓桫棂楮棼椟椠棹椤棰椋椁楗棣椐楱椹楠楂楝榄楫榀榘楸椴槌榇榈槎榉楦楣楹榛榧榻榫榭槔榱槁槊槟榕槠榍槿樯槭樗樘橥槲橄樾檠橐橛樵檎橹樽樨橘橼檑檐檩檗檫猷獒殁殂殇殄殒殓殍殚殛殡殪轫轭轱轲轳轵轶轸轷轹轺轼轾辁辂辄辇辋辍辎辏辘辚軎戋戗戛戟戢戡戥戤戬臧瓯瓴瓿甏甑甓攴旮旯旰昊昙杲昃昕昀炅曷昝昴昱昶昵耆晟晔晁晏晖晡晗晷暄暌暧暝暾曛曜曦曩贲贳贶贻贽赀赅赆赈赉赇赍赕赙觇觊觋觌觎觏觐觑牮犟牝牦牯牾牿犄犋犍犏犒挈挲掰搿擘耄毪毳毽毵毹氅氇氆氍氕氘氙氚氡氩氤氪氲攵敕敫牍牒牖爰虢刖肟肜肓肼朊肽肱肫肭肴肷胧胨胩胪胛胂胄胙胍胗朐胝胫胱胴胭脍脎胲胼朕脒豚脶脞脬脘脲腈腌腓腴腙腚腱腠腩腼腽腭腧塍媵膈膂膑滕膣膪臌朦臊膻臁膦欤欷欹歃歆歙飑飒飓飕飙飚殳彀毂觳斐齑斓於旆旄旃旌旎旒旖炀炜炖炝炻烀炷炫炱烨烊焐焓焖焯焱煳煜煨煅煲煊煸煺熘熳熵熨熠燠燔燧燹爝爨灬焘煦熹戾戽扃扈扉礻祀祆祉祛祜祓祚祢祗祠祯祧祺禅禊禚禧禳忑忐怼恝恚恧恁恙恣悫愆愍慝憩憝懋懑戆肀聿沓泶淼矶矸砀砉砗砘砑斫砭砜砝砹砺砻砟砼砥砬砣砩硎硭硖硗砦硐硇硌硪碛碓碚碇碜碡碣碲碹碥磔磙磉磬磲礅磴礓礤礞礴龛黹黻黼盱眄眍盹眇眈眚眢眙眭眦眵眸睐睑睇睃睚睨睢睥睿瞍睽瞀瞌瞑瞟瞠瞰瞵瞽町畀畎畋畈畛畲畹疃罘罡罟詈罨罴罱罹羁罾盍盥蠲钅钆钇钋钊钌钍钏钐钔钗钕钚钛钜钣钤钫钪钭钬钯钰钲钴钶钷钸钹钺钼钽钿铄铈铉铊铋铌铍铎铐铑铒铕铖铗铙铘铛铞铟铠铢铤铥铧铨铪铩铫铮铯铳铴铵铷铹铼铽铿锃锂锆锇锉锊锍锎锏锒锓锔锕锖锘锛锝锞锟锢锪锫锩锬锱锲锴锶锷锸锼锾锿镂锵镄镅镆镉镌镎镏镒镓镔镖镗镘镙镛镞镟镝镡镢镤镥镦镧镨镩镪镫镬镯镱镲镳锺矧矬雉秕秭秣秫稆嵇稃稂稞稔稹稷穑黏馥穰皈皎皓皙皤瓞瓠甬鸠鸢鸨鸩鸪鸫鸬鸲鸱鸶鸸鸷鸹鸺鸾鹁鹂鹄鹆鹇鹈鹉鹋鹌鹎鹑鹕鹗鹚鹛鹜鹞鹣鹦鹧鹨鹩鹪鹫鹬鹱鹭鹳疒疔疖疠疝疬疣疳疴疸痄疱疰痃痂痖痍痣痨痦痤痫痧瘃痱痼痿瘐瘀瘅瘌瘗瘊瘥瘘瘕瘙瘛瘼瘢瘠癀瘭瘰瘿瘵癃瘾瘳癍癞癔癜癖癫癯翊竦穸穹窀窆窈窕窦窠窬窨窭窳衤衩衲衽衿袂袢裆袷袼裉裢裎裣裥裱褚裼裨裾裰褡褙褓褛褊褴褫褶襁襦襻疋胥皲皴矜耒耔耖耜耠耢耥耦耧耩耨耱耋耵聃聆聍聒聩聱覃顸颀颃颉颌颍颏颔颚颛颞颟颡颢颥颦虍虔虬虮虿虺虼虻蚨蚍蚋蚬蚝蚧蚣蚪蚓蚩蚶蛄蚵蛎蚰蚺蚱蚯蛉蛏蚴蛩蛱蛲蛭蛳蛐蜓蛞蛴蛟蛘蛑蜃蜇蛸蜈蜊蜍蜉蜣蜻蜞蜥蜮蜚蜾蝈蜴蜱蜩蜷蜿螂蜢蝽蝾蝻蝠蝰蝌蝮螋蝓蝣蝼蝤蝙蝥螓螯螨蟒蟆螈螅螭螗螃螫蟥螬螵螳蟋蟓螽蟑蟀蟊蟛蟪蟠蟮蠖蠓蟾蠊蠛蠡蠹蠼缶罂罄罅舐竺竽笈笃笄笕笊笫笏筇笸笪笙笮笱笠笥笤笳笾笞筘筚筅筵筌筝筠筮筻筢筲筱箐箦箧箸箬箝箨箅箪箜箢箫箴篑篁篌篝篚篥篦篪簌篾篼簏簖簋簟簪簦簸籁籀臾舁舂舄臬衄舡舢舣舭舯舨舫舸舻舳舴舾艄艉艋艏艚艟艨衾袅袈裘裟襞羝羟羧羯羰羲籼敉粑粝粜粞粢粲粼粽糁糇糌糍糈糅糗糨艮暨羿翎翕翥翡翦翩翮翳糸絷綦綮繇纛麸麴赳趄趔趑趱赧赭豇豉酊酐酎酏酤酢酡酰酩酯酽酾酲酴酹醌醅醐醍醑醢醣醪醭醮醯醵醴醺豕鹾趸跫踅蹙蹩趵趿趼趺跄跖跗跚跞跎跏跛跆跬跷跸跣跹跻跤踉跽踔踝踟踬踮踣踯踺蹀踹踵踽踱蹉蹁蹂蹑蹒蹊蹰蹶蹼蹯蹴躅躏躔躐躜躞豸貂貊貅貘貔斛觖觞觚觜觥觫觯訾謦靓雩雳雯霆霁霈霏霎霪霭霰霾龀龃龅龆龇龈龉龊龌黾鼋鼍隹隼隽雎雒瞿雠銎銮鋈錾鍪鏊鎏鐾鑫鱿鲂鲅鲆鲇鲈稣鲋鲎鲐鲑鲒鲔鲕鲚鲛鲞鲟鲠鲡鲢鲣鲥鲦鲧鲨鲩鲫鲭鲮鲰鲱鲲鲳鲴鲵鲶鲷鲺鲻鲼鲽鳄鳅鳆鳇鳊鳋鳌鳍鳎鳏鳐鳓鳔鳕鳗鳘鳙鳜鳝鳟鳢靼鞅鞑鞒鞔鞯鞫鞣鞲鞴骱骰骷鹘骶骺骼髁髀髅髂髋髌髑魅魃魇魉魈魍魑飨餍餮饕饔髟髡髦髯髫髻髭髹鬈鬏鬓鬟鬣麽麾縻麂麇麈麋麒鏖麝麟黛黜黝黠黟黢黩黧黥黪黯鼢鼬鼯鼹鼷鼽鼾齄";
            var GBSpell = ["a", 0, "ai", 2, "an", 15, "ang", 24, "ao", 27, "ba", 36, "bai", 54, "ban", 62, "bang", 77, "bao", 89, "bei", 106, "ben", 121, "beng", 125, "bi", 131, "bian", 155, "biao", 167, "bie", 171, "bin", 175, "bing", 181, "bo", 190, "bu", 211, "ca", 220, "cai", 221, "can", 232, "cang", 239, "cao", 244, "ce", 249, "ceng", 254, "cha", 256, "chai", 267, "chan", 270, "chang", 280, "chao", 293, "che", 302, "chen", 308, "cheng", 318, "chi", 333, "chong", 349, "chou", 354, "chu", 366, "chuai", 382, "chuan", 383, "chuang", 390, "chui", 396, "chun", 401, "chuo", 408, "ci", 410, "cong", 422, "cou", 428, "cu", 429, "cuan", 433, "cui", 436, "cun", 444, "cuo", 447, "da", 453, "dai", 459, "dan", 471, "dang", 486, "dao", 491, "de", 503, "deng", 506, "di", 513, "dian", 532, "diao", 548, "die", 557, "ding", 564, "diu", 573, "dong", 574, "dou", 584, "du", 591, "duan", 606, "dui", 612, "dun", 616, "duo", 625, "e", 637, "en", 650, "er", 651, "fa", 659, "fan", 667, "fang", 684, "fei", 695, "fen", 707, "feng", 722, "fo", 737, "fou", 738, "fu", 739, "ga", 784, "gai", 786, "gan", 792, "gang", 803, "gao", 812, "ge", 822, "gei", 839, "gen", 840, "geng", 842, "gong", 849, "gou", 864, "gu", 873, "gua", 891, "guai", 897, "guan", 900, "guang", 911, "gui", 914, "gun", 930, "guo", 933, "ha", 939, "hai", 940, "han", 947, "hang", 966, "hao", 969, "he", 978, "hei", 996, "hen", 998, "heng", 1002, "hong", 1007, "hou", 1016, "hu", 1023, "hua", 1041, "huai", 1050, "huan", 1055, "huang", 1069, "hui", 1083, "hun", 1104, "huo", 1110, "ji", 1120, "jia", 1173, "jian", 1190, "jiang", 1230, "jiao", 1243, "jie", 1271, "jin", 1298, "jing", 1318, "jiong", 1343, "jiu", 1345, "ju", 1362, "juan", 1387, "jue", 1394, "jun", 1404, "ka", 1415, "kai", 1419, "kan", 1424, "kang", 1430, "kao", 1437, "ke", 1441, "ken", 1456, "keng", 1460, "kong", 1462, "kou", 1466, "ku", 1470, "kua", 1477, "kuai", 1482, "kuan", 1486, "kuang", 1488, "kui", 1496, "kun", 1507, "kuo", 1511, "la", 1515, "lai", 1522, "lan", 1525, "lang", 1540, "lao", 1547, "le", 1556, "lei", 1558, "leng", 1569, "li", 1572, "lia", 1606, "lian", 1607, "liang", 1621, "liao", 1632, "lie", 1645, "lin", 1650, "ling", 1662, "liu", 1676, "long", 1687, "lou", 1696, "lu", 1702, "lv", 1722, "luan", 1736, "lue", 1742, "lun", 1744, "luo", 1751, "ma", 1763, "mai", 1772, "man", 1778, "mang", 1787, "mao", 1793, "me", 1805, "mei", 1806, "men", 1822, "meng", 1825, "mi", 1833, "mian", 1847, "miao", 1856, "mie", 1864, "min", 1866, "ming", 1872, "miu", 1878, "mo", 1879, "mou", 1896, "mu", 1899, "na", 1914, "nai", 1921, "nan", 1926, "nang", 1929, "nao", 1930, "ne", 1935, "nei", 1936, "nen", 1938, "neng", 1939, "ni", 1940, "nian", 1951, "niang", 1958, "niao", 1960, "nie", 1962, "nin", 1969, "ning", 1970, "niu", 1976, "nong", 1980, "nu", 1984, "nv", 1987, "nuan", 1988, "nue", 1989, "nuo", 1991, "o", 1995, "ou", 1996, "pa", 2003, "pai", 2009, "pan", 2015, "pang", 2023, "pao", 2028, "pei", 2035, "pen", 2044, "peng", 2046, "pi", 2060, "pian", 2077, "piao", 2081, "pie", 2085, "pin", 2087, "ping", 2092, "po", 2101, "pu", 2110, "qi", 2125, "qia", 2161, "qian", 2164, "qiang", 2186, "qiao", 2194, "qie", 2209, "qin", 2214, "qing", 2225, "qiong", 2238, "qiu", 2240, "qu", 2248, "quan", 2261, "que", 2272, "qun", 2280, "ran", 2282, "rang", 2286, "rao", 2291, "re", 2294, "ren", 2296, "reng", 2306, "ri", 2308, "rong", 2309, "rou", 2319, "ru", 2322, "ruan", 2332, "rui", 2334, "run", 2337, "ruo", 2339, "sa", 2341, "sai", 2344, "san", 2348, "sang", 2352, "sao", 2355, "se", 2359, "sen", 2362, "seng", 2363, "sha", 2364, "shai", 2373, "shan", 2375, "shang", 2391, "shao", 2399, "she", 2410, "shen", 2422, "sheng", 2438, "shi", 2449, "shou", 2496, "shu", 2506, "shua", 2539, "shuai", 2541, "shuan", 2545, "shuang", 2547, "shui", 2550, "shun", 2554, "shuo", 2558, "si", 2562, "song", 2578, "sou", 2586, "su", 2589, "suan", 2602, "sui", 2605, "sun", 2616, "suo", 2619, "ta", 2627, "tai", 2636, "tan", 2645, "tang", 2663, "tao", 2676, "te", 2687, "teng", 2688, "ti", 2692, "tian", 2707, "tiao", 2715, "tie", 2720, "ting", 2723, "tong", 2733, "tou", 2746, "tu", 2750, "tuan", 2761, "tui", 2763, "tun", 2769, "tuo", 2772, "wa", 2783, "wai", 2790, "wan", 2792, "wang", 2809, "wei", 2819, "wen", 2852, "weng", 2862, "wo", 2865, "wu", 2874, "xi", 2903, "xia", 2938, "xian", 2951, "xiang", 2977, "xiao", 2997, "xie", 3015, "xin", 3036, "xing", 3046, "xiong", 3061, "xiu", 3068, "xu", 3077, "xuan", 3096, "xue", 3106, "xun", 3112, "ya", 3126, "yan", 3142, "yang", 3175, "yao", 3192, "ye", 3207, "yi", 3222, "yin", 3275, "ying", 3291, "yo", 3309, "yong", 3310, "you", 3325, "yu", 3346, "yuan", 3390, "yue", 3410, "yun", 3420, "za", 3432, "zai", 3435, "zan", 3442, "zang", 3446, "zao", 3449, "ze", 3463, "zei", 3467, "zen", 3468, "zeng", 3469, "zha", 3473, "zhai", 3487, "zhan", 3493, "zhang", 3510, "zhao", 3525, "zhe", 3535, "zhen", 3545, "zheng", 3561, "zhi", 3576, "zhong", 3619, "zhou", 3630, "zhu", 3644, "zhua", 3670, "zhuai", 3672, "zhuan", 3673, "zhuang", 3679, "zhui", 3686, "zhun", 3692, "zhuo", 3694, "zi", 3705, "zong", 3720, "zou", 3727, "zu", 3731, "zuan", 3739, "zui", 3741, "zun", 3745, "zuo", 3747];

            return {
                UrlEncode: function (str) {
                    /// <summary>UrlEncode编码</summary>
                    /// <param name="str" type="String">待转码的字符串</param>
                    /// <returns type="String" />

                    var strSpecial = "!\"#$%&'()*+,/:;<=>?@[\]^`{|}~%"; // 特殊字符
                    var ret = "";
                    for (var i = 0; i < str.length; i++) {
                        if (str.charCodeAt(i) >= 0x4e00) {
                            var temp = GBStr.indexOf(str.charAt(i));
                            if (temp >= 0) {
                                var q = temp % 94;
                                temp = (temp - q) / 94;
                                ret += ("%" + (0xB0 + temp).toString(16) + "%" + (0xA1 + q).toString(16)).toUpperCase();
                            }
                        }
                        else {
                            var c = str.charAt(i);
                            if (c == " ") { ret += "+"; }
                            else if (strSpecial.indexOf(c) != -1) { ret += "%" + str.charCodeAt(i).toString(16); }
                            else { ret += c; }
                        }
                    }
                    return ret;
                },
                TransformSpell: function (str, split) {
                    /// <summary>常见汉字转码拼音</summary>
                    /// <param name="str" type="String">待转码的字符串</param>
                    /// <param name="split" type="String">字符间的分割字符</param>
                    /// <returns type="String" />

                    var t = null, ret = "";
                    if (split == "" || split == undefined) { split = ""; }
                    for (var i = 0; i < str.length; i++) {
                        if (str.charCodeAt(i) >= 0x4e00) {
                            var temp = GBStr.indexOf(str.charAt(i));
                            if (temp > -1 && temp < 3755) {
                                for (t = GBSpell.length - 1; t > 0; t = t - 2) { if (GBSpell[t] <= temp) { break; } }
                                if (t > 0) { ret += GBSpell[t - 1] + split; }
                            }
                        }
                        else { ret += str[i] + split; }
                    }
                    ret = ret.toLocaleLowerCase(); // 转换成小写字母
                    return ret.substr(0, ret.length - split.length);
                },
                TransformFirstLetter: function (str, split) {
                    /// <summary>常见汉字转码拼音首字母</summary>
                    /// <param name="str" type="String">待转码的字符串</param>
                    /// <param name="split" type="String">字符间的分割字符</param>
                    /// <returns type="String" />

                    var t = null, ret = "";
                    if (split == "" || split == undefined) { split = ""; }
                    for (var i = 0; i < str.length; i++) {
                        if (str.charCodeAt(i) >= 0x4e00) {
                            var temp = GBStr.indexOf(str.charAt(i));
                            if (temp > -1 && temp < 3755) {
                                for (t = GBSpell.length - 1; t > 0; t = t - 2) { if (GBSpell[t] <= temp) { break; } }
                                if (t > 0) { for (var n = 0; n < GBSpell[t - 1].length; n++) { ret += GBSpell[t - 1][0] + split; break; } }
                            }
                        }
                        else { ret += str[i] + split; }
                    }
                    ret = ret.toLocaleLowerCase(); // 转换成小写字母
                    return ret.substr(0, ret.length - split.length);
                }
            }
        };
    })(jQuery);


    window.PJ = window.PJ || PJtools; // 设置全局简称名称

})();