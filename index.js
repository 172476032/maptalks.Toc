/* eslint-disable no-undef,comma-spacing */
import * as maptalks from 'maptalks';

const options = {
    'position':{
        top:'100',
        left:'200'
    },
    'draggable': true,
    'styles':{
        width:'800',
        height:'800'
    }
};

export class Toc extends maptalks.control.Control {
    constructor(options) {
        super();
        this.options = options;
    }
    buildOn(map) {
        this.map = map;
        const domToc = maptalks.DomUtil.createEl('div', 'maptalks-Toc');
        const layerUl = maptalks.DomUtil.createEl('ul', 'maptalks-layerUl');
        let html  = '';
        let layersInfo = this._getLayerIds(map);
        for (let i = layersInfo.length - 1; i >= 0; i--) {
            let checked;
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
        map.on('addlayer',this._addLayers,this);//对新增图层进行监听
        this._layerDomMousedown(this._domToc);
        this._registerDomEvent();//注册dom事件
        return domToc;
    }
    _addLayers(event){
        const map = this.map;
        let html  = '';
        let layersInfo = this._getLayerIds(map);
        for (let i = layersInfo.length - 1; i >= 0; i--) {
            let checked;
            if (layersInfo[i].visible == true) {
                checked = 'checked';
                html = html + '<li class="maptalks-layerLi" id="' + layersInfo[i].id + '"><input class="maptalks-layerInput" id="' + layersInfo[i].id + '" type="checkbox"  checked="' + checked + '"><p class="maptalks-layerName">' + layersInfo[i].id + '</p></li>';
            } else {
                html = html + '<li class="maptalks-layerLi" id="' + layersInfo[i].id + '"><input class="maptalks-layerInput" id="' + layersInfo[i].id + '" type="checkbox" ><p class="maptalks-layerName">' + layersInfo[i].id + '</p></li>';
            }
        }
        const layerNewUl = maptalks.DomUtil.createEl('Ul', 'maptalks-layerNewUl');
        layerNewUl.innerHTML = html;
        let layerolderUL = document.getElementsByClassName('maptalks-Toc')[0].firstChild;
        console.log(layerolderUL);
        document.getElementsByClassName('maptalks-Toc')[0].replaceChild(layerNewUl,layerolderUL);
    }
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
    _getLayerIds(map) {
        let layersInfo = [];
        //矢量图
        let vectorLayers = map.getLayers();
        for (let i = 0; i < vectorLayers.length; i++) {
            let layer = {};
            layer.id = vectorLayers[i].getId();
            layer.visible = vectorLayers[i].isVisible();
            layer.zindex = vectorLayers[i].getZIndex();
            layersInfo.push(layer);
        }
      //底图
        let baseLayer = {};
        baseLayer.id = map.getBaseLayer().getId();
        baseLayer.visible = map.getBaseLayer().isVisible();
        baseLayer.zindex = map.getBaseLayer().getZIndex();
        layersInfo.push(baseLayer);
        layersInfo = this._layerZindexSort(layersInfo,'zindex');
        console.log(layersInfo);
        return layersInfo;
    }
    _layerZindexSort(layersInfo,zindex) {
        layersInfo = layersInfo.sort(this._layerZindexCompare(zindex));
        return layersInfo;
    }
    _layerZindexCompare(layerZindex) {
        return function (obj1, obj2) {
            var layerZindex1 = obj1[layerZindex];
            var layerZindex2 = obj2[layerZindex];
            return layerZindex1 - layerZindex2;     // 升序
        };
    }
    _switchLayer() {
        this.map = this.getMap();
        let inputBtns = document.getElementsByClassName('maptalks-layerInput');
        if (inputBtns.length > 0) {
            for (let i = 0; i < inputBtns.length; i++) {
                inputBtns[i].onclick = function (e) {
                    let layerId = e.target.id;
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
    }
    _registerDomEvent() {
        if (this._domToc) {
            maptalks.DomUtil.addDomEvent(this._domToc, 'mouseover', this._switchLayer, this);
        }
    }
    _setstyle(dom, options) {
        for (let p in options['styles']) {
            dom.style[p] = options['styles'][p];
        }
    }
    _layerDomMousedown(dom) {
        let lis = document.getElementsByTagName('maptalks-layerLi');
        let id;
        for (let i = 0; i < lis.length; i++) {
            lis[i].onmousedown = function (e) {
                id = e.target.id;
            };
            lis[i].onmouseup = function (e) {
                var oldId = e.target.id;
                var newNode = document.getElementById(id);
                var oldNode = document.getElementById(oldId);
                dom.insertBefore(newNode,oldNode);
            };
        }
    }
}

Toc.mergeOptions(options);



