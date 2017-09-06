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
        const domToc = maptalks.DomUtil.createEl('div', 'maptalks-Toc');
        const layerUl = maptalks.DomUtil.createEl('ul', 'maptalks-layerUl');
        let html  = '';
        let layerNames = this._getLayerNames(map);
        for (let i = 0; i < layerNames.length; i++) {
            html = html + '<li class="maptalks-layerLi"><input class="maptalks-layerInput" value="' + layerNames[i] + '" type="checkbox" checked><p class="maptalks-layerName">' + layerNames[i] + '</p></li>';
        }
        layerUl.innerHTML = html;
        this._setstyle(domToc, this.options);
        domToc.appendChild(layerUl);
        this._domToc = domToc;
        this._registerDomEvent();
        return domToc;
    }
    _getLayerNames(map) {
        let layerNames = [];
        let vectorLayers = map.getLayers();
        for (let i = 0; i < vectorLayers.length; i++) {
            layerNames.push(vectorLayers[i].getId());
        }
        let baseLayer = map.getBaseLayer();
        let baseLayerName = baseLayer.getId();
        layerNames.push(baseLayerName);
        return layerNames;
    }
    _switchLayer() {
        this.map = this.getMap();
        let inputBtns = document.getElementsByClassName('maptalks-layerInput');
        if (inputBtns.length > 0) {
            for (let i = 0; i < inputBtns.length; i++) {
                inputBtns[i].onclick = function (e) {
                    if (!e.target.checked) {
                        let layerName = e.target.value;
                        if (this.map.getBaseLayer() instanceof maptalks.TileLayer) { //instanceof maptalks.TileLayer
                            this.map.getBaseLayer().hide();
                        } else {
                            this.map.getLayer(layerName).hide();
                        }
                    } else {
                        let layerName = e.target.value;
                        if (this.map.getBaseLayer() instanceof maptalks.TileLayer) { //instanceof maptalks.TileLayer
                            this.map.getBaseLayer().show();
                        } else {
                            this.map.getLayer(layerName).show();
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
        let inputBtns = document.getElementsByClassName('maptalks-layerInput');
        if (inputBtns.length > 0) {
            for (let i = 0; i < inputBtns.length; i++) {
                maptalks.DomUtil.addDomEvent(inputBtns[i], 'mouseover', this._switchLayer, this);
            }
        }
    }
    _setstyle(dom, options) {
        for (let p in options['styles']) {
            dom.style[p] = options['styles'][p];
        }
    }
}

Toc.mergeOptions(options);



