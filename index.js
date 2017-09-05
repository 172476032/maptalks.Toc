import * as maptalks from 'maptalks';

const options = {
    'position': 'top-left',
    'slider': true,
    'zoomLevel': false,
    'navPan': true
}


export class Toc extends maptalks.control.Control {
    // constructor(options) {
    //     super(options);
    // }
    buildOn(map){
           const dom = maptalks.DomUtil.createEl('div', 'maptalks-Toc');
           const layerDom = maptalks.DomUtil.createEl('div', 'maptalks-Layer');
           let html  ='';
           html = '<div>' + this._getLayers(map) + '</div>';
           layerDom.innerHTML =html;
           dom.appendChild(layerDom);



           return dom ;
    }
    _getLayers(map){
        let layers = map.getLayer();
        let baseLayer = map.getBaseLayer();
        let baseLayerName = baseLayer.getId() ;
        return baseLayerName
    }
}

Toc.mergeOptions(options);



