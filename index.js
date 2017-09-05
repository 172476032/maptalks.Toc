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
        const layerUl = maptalks.DomUtil.createEl('ul', 'maptalks-layerUl');
        let html  = '';
        let layerNames = this._getLayerNames(map);
        for (let i = 0; i < layerNames.length; i++) {
            html = html + '<li class="maptalks-layerLi"><input class="maptalks-layerInput" value="' + layerNames[i] + '" type="checkbox" checked><p class="maptalks-layerName">' + layerNames[i] + '</p></li>';
        }
        layerUl.innerHTML = html;
        dom.appendChild(layerUl);
        //
        //this._event(map);
        map.on('addlayer',function (e) {
            this._showLayer(e.target);

        },this);
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
    _showLayer(map){
        let inputBtns = document.getElementsByClassName("maptalks-layerInput");
        if(inputBtns.length > 0){
        alert('as');
        for(let i=0;i<inputBtns.length;i++){
            inputBtns[i].onclick = function (e) {
                if(!e.target.checked){
                    let layerName = e.target.value;
                    map.getBaseLayer(layerName).hide()
                }
           }
        }
       } else {
        alert('No Layers');
}
    }
    // _event(map){
    //     document.getElementById('maptalks-layerInput'),onclick =function () {
    //         this._showLayer(map);
    //     }.bind(this)
    // }

}

Toc.mergeOptions(options);



