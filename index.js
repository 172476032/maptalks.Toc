import * as maptalks from 'maptalks';

const options = {
    'position':{
        top:'20',
        left:'20'
    },
    'draggable': true
};


export class Toc extends maptalks.control.Control {
    // constructor(options) {
    //     super(options);
    // }
    buildOn(map) {
        const dom = maptalks.DomUtil.createEl('div', 'maptalks-Toc');
        const layerUl = maptalks.DomUtil.createEl('ul', 'maptalks-ul');
        let html  = '';
        let layerNames = this._getLayerNames(map);
        for (let i = 0; i < layerNames.length; i++) {
            html = html + '<li><input  type="checkbox"><p class="maptalks-name">' + layerNames[i] + '</p></li>';
        }
        layerUl.innerHTML = html;
        dom.appendChild(layerUl);
        return dom;
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
}

Toc.mergeOptions(options);



