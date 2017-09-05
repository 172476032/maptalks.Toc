/*!
 * maptalks.Toc v0.1.2
 * LICENSE : MIT
 * (c) 2016-2017 maptalks.org
 */
/*!
 * requires maptalks@^0.16.0 
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('maptalks')) :
	typeof define === 'function' && define.amd ? define(['exports', 'maptalks'], factory) :
	(factory((global.maptalks = global.maptalks || {}),global.maptalks));
}(this, (function (exports,maptalks) { 'use strict';

function _defaults(obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : _defaults(subClass, superClass); }

var options = {
    'position': {
        top: '20',
        left: '20'
    },
    'draggable': true
};

var Toc = function (_maptalks$control$Con) {
    _inherits(Toc, _maptalks$control$Con);

    function Toc() {
        _classCallCheck(this, Toc);

        return _possibleConstructorReturn(this, _maptalks$control$Con.apply(this, arguments));
    }

    // constructor(options) {
    //     super(options);
    // }
    Toc.prototype.buildOn = function buildOn(map) {
        var dom = maptalks.DomUtil.createEl('div', 'maptalks-Toc');
        var layerUl = maptalks.DomUtil.createEl('ul', 'maptalks-ul');
        var html = '';
        var layerNames = this._getLayerNames(map);
        for (var i = 0; i < layerNames.length; i++) {
            html = html + '<li><input  type="checkbox"><p class="maptalks-name">' + layerNames[i] + '</p></li>';
        }
        layerUl.innerHTML = html;
        dom.appendChild(layerUl);
        return dom;
    };

    Toc.prototype._getLayerNames = function _getLayerNames(map) {
        var layerNames = [];
        var vectorLayers = map.getLayers();
        for (var i = 0; i < vectorLayers.length; i++) {
            layerNames.push(vectorLayers[i].getId());
        }
        var baseLayer = map.getBaseLayer();
        var baseLayerName = baseLayer.getId();
        layerNames.push(baseLayerName);
        return layerNames;
    };

    return Toc;
}(maptalks.control.Control);

Toc.mergeOptions(options);

exports.Toc = Toc;

Object.defineProperty(exports, '__esModule', { value: true });

typeof console !== 'undefined' && console.log('maptalks.Toc v0.1.2, requires maptalks@^0.16.0.');

})));
