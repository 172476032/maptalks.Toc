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

/* eslint-disable no-undef,comma-spacing */
var options = {
    'position': {
        top: '100',
        left: '200'
    },
    'draggable': true,
    'styles': {
        width: '800',
        height: '800'
    }
};

var Toc = function (_maptalks$control$Con) {
    _inherits(Toc, _maptalks$control$Con);

    function Toc(options) {
        _classCallCheck(this, Toc);

        var _this = _possibleConstructorReturn(this, _maptalks$control$Con.call(this));

        _this.options = options;
        return _this;
    }

    Toc.prototype.buildOn = function buildOn(map) {
        var domToc = maptalks.DomUtil.createEl('div', 'maptalks-Toc');
        var layerUl = maptalks.DomUtil.createEl('ul', 'maptalks-layerUl');
        var html = '';
        var layersInfo = this._getLayerIds(map);
        for (var i = layersInfo.length - 1; i >= 0; i--) {
            var checked = void 0;
            if (layersInfo[i].visible == true) {
                checked = 'checked';
                html = html + '<li class="maptalks-layerLi" id="' + layersInfo[i].id + '"><input class="maptalks-layerInput" id="' + layersInfo[i].id + '" type="checkbox"  checked="' + checked + '"><p class="maptalks-layerName">' + layersInfo[i].id + '</p></li>';
            } else {
                html = html + '<li class="maptalks-layerLi" id="' + layersInfo[i].id + '"><input class="maptalks-layerInput" id="' + layersInfo[i].id + '" type="checkbox" ><p class="maptalks-layerName">' + layersInfo[i].id + '</p></li>';
            }
        }
        layerUl.innerHTML = html;
        this._setstyle(domToc, this.options);
        domToc.appendChild(layerUl);
        this._domToc = domToc;
        map.on('addlayer', this._addLayers, this); //对新增图层进行监听
        this._layerDomMousedown(this._domToc);
        this._registerDomEvent(); //注册dom事件
        return domToc;
    };

    Toc.prototype._addLayers = function _addLayers(event) {
        var html = '';
        var layersInfo = this._getLayerIds(map);
        for (var i = layersInfo.length - 1; i >= 0; i--) {
            var checked = void 0;
            if (layersInfo[i].visible == true) {
                checked = 'checked';
                html = html + '<li class="maptalks-layerLi" id="' + layersInfo[i].id + '"><input class="maptalks-layerInput" id="' + layersInfo[i].id + '" type="checkbox"  checked="' + checked + '"><p class="maptalks-layerName">' + layersInfo[i].id + '</p></li>';
            } else {
                html = html + '<li class="maptalks-layerLi" id="' + layersInfo[i].id + '"><input class="maptalks-layerInput" id="' + layersInfo[i].id + '" type="checkbox" ><p class="maptalks-layerName">' + layersInfo[i].id + '</p></li>';
            }
        }
        var layerNewUl = maptalks.DomUtil.createEl('newUl', 'maptalks-layerNewUl');
        layerNewUl.innerHTML = html;
        var layerolderUL = document.getElementsByClassName('maptalks-layerUl')[0];
        document.getElementsByClassName('maptalks-Toc')[0].replaceChild(layerNewUl, layerolderUL);
    };
    //监听加载后图层，并融合
    // _addLayerIds(event) {
    //     let currentLayersInfo = this._getLayerIds(map);
    //     let layersInfo = [];
    //     let layers = event.layers;
    //     for (let i = 0; i < layers.length; i++) {
    //         let layer = {};
    //         layer.id = layers[i].getId();
    //         layer.visible = layers[i].isVisible();
    //         layer.zindex = layers[i].getZIndex();
    //         layersInfo.push(layer);
    //     }
    //     layersInfo = this._layerZindexSort(layersInfo,'zindex'); //对对象数组按zindex进行排序
    //     currentLayersInfo.push.apply(currentLayersInfo,layersInfo); //把新增图层数组合并到已存在的数组内
    //     console.log(currentLayersInfo);
    //     return currentLayersInfo;
    // }


    Toc.prototype._getLayerIds = function _getLayerIds(map) {
        var layersInfo = [];
        //矢量图
        var vectorLayers = map.getLayers();
        for (var i = 0; i < vectorLayers.length; i++) {
            var layer = {};
            layer.id = vectorLayers[i].getId();
            layer.visible = vectorLayers[i].isVisible();
            layer.zindex = vectorLayers[i].getZIndex();
            layersInfo.push(layer);
        }
        //底图
        var baseLayer = {};
        baseLayer.id = map.getBaseLayer().getId();
        baseLayer.visible = map.getBaseLayer().isVisible();
        baseLayer.zindex = map.getBaseLayer().getZIndex();
        layersInfo.push(baseLayer);
        layersInfo = this._layerZindexSort(layersInfo, 'zindex');
        console.log(layersInfo);
        return layersInfo;
    };

    Toc.prototype._layerZindexSort = function _layerZindexSort(layersInfo, zindex) {
        layersInfo = layersInfo.sort(this._layerZindexCompare(zindex));
        return layersInfo;
    };

    Toc.prototype._layerZindexCompare = function _layerZindexCompare(layerZindex) {
        return function (obj1, obj2) {
            var layerZindex1 = obj1[layerZindex];
            var layerZindex2 = obj2[layerZindex];
            return layerZindex1 - layerZindex2; // 升序
        };
    };

    Toc.prototype._switchLayer = function _switchLayer() {
        this.map = this.getMap();
        var inputBtns = document.getElementsByClassName('maptalks-layerInput');
        if (inputBtns.length > 0) {
            for (var i = 0; i < inputBtns.length; i++) {
                inputBtns[i].onclick = function (e) {
                    var layerId = e.target.id;
                    if (!e.target.checked) {
                        if (this.map.getLayer(layerId)) {
                            this.map.getLayer(layerId).hide();
                        } else {
                            this.map.getBaseLayer().hide();
                        }
                    } else {
                        if (this.map.getLayer(layerId)) {
                            this.map.getLayer(layerId).show();
                        } else {
                            this.map.getBaseLayer().show();
                        }
                    }
                }.bind(this);
            }
        } else {
            alert('No Layers');
        }
    };

    Toc.prototype._registerDomEvent = function _registerDomEvent() {
        if (this._domToc) {
            maptalks.DomUtil.addDomEvent(this._domToc, 'mouseover', this._switchLayer, this);
        }
    };

    Toc.prototype._setstyle = function _setstyle(dom, options) {
        for (var p in options['styles']) {
            dom.style[p] = options['styles'][p];
        }
    };

    Toc.prototype._layerDomMousedown = function _layerDomMousedown(dom) {
        var lis = document.getElementsByTagName('maptalks-layerLi');
        var id = void 0;
        for (var i = 0; i < lis.length; i++) {
            lis[i].onmousedown = function (e) {
                id = e.target.id;
            };
            lis[i].onmouseup = function (e) {
                var oldId = e.target.id;
                var newNode = document.getElementById(id);
                var oldNode = document.getElementById(oldId);
                dom.insertBefore(newNode, oldNode);
            };
        }
    };

    return Toc;
}(maptalks.control.Control);

Toc.mergeOptions(options);

exports.Toc = Toc;

Object.defineProperty(exports, '__esModule', { value: true });

typeof console !== 'undefined' && console.log('maptalks.Toc v0.1.2, requires maptalks@^0.16.0.');

})));
