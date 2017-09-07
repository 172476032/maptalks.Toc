var map1, map2;
var p1 = [114.37836004292352,30.523289453568303];
var p2 = [114.37933100258702,30.522984464982567];
var p3 = [114.37815083062033,30.522739549213195];
var p4 = [114.3790949681937, 30.522485390686704];
//九峰中学四个控制点
//x:114.4857610944505,y:30.498982022574285
//hot.js:229 x:114.48573963677838,y:30.499994276342736
//hot.js:229 x:114.48655502831902,y:30.49998965420335
//hot.js:229 x:114.4865335706469,y:30.498982022574285
//
//x:114.37850277877786,y:30.52304594380496
//hot.js:243 x:114.37916260219562,y:30.522958143938702
//hot.js:243 x:114.37902849174486,y:30.52263467006266
//hot.js:243 x:114.37844913459756,y:30.522745575512896
//var p1 = [114.37850277877786, 30.52304594380496];
//var p2 = [114.37916260219562, 30.522958143938702];
//var p3 = [114.37902849174486, 30.52263467006266];
//var p4 = [114.37844913459756, 30.522745575512896];
//var p1 = [114.372868283318,30.5249273333125];
//var p2 = [114.373563466649,30.5250657833121];
//var p3 = [114.373563466649,30.5252754666449];
//var p4 = [114.372923416651,30.5254920833111];
var playerground = {
    width: null,
    height: null
};
//地球长短半轴
var a = 6378137.0, b = 6356752.314245179;
var center = [114.48613809943413, 30.499472112848327]
function initMap() {
    map1 = new maptalks.Map('map1', {
        center: center,
        zoom: 18,
        minZoom: 1,
        maxZoom: 20,
        zoomable: true,
        draggable: true,
        baseLayer: new maptalks.TileLayer('base1', {
            urlTemplate: 'http://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
            subdomains: [1, 2, 3, 4]
        })
    });
    map2 = new maptalks.Map('map2', {
        center: center,
        zoom: 18,
        minZoom: 1,
        maxZoom: 20,
        zoomable: true,
        draggable: true,
        baseLayer: new maptalks.TileLayer('base2', {
            urlTemplate: 'http://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
            subdomains: [1, 2, 3, 4]
        })
    });
}
//计算数据点的地理中心
function calculateExtent(coordinates, map) {
    var extentLayer = new maptalks.VectorLayer('extentLayer').addTo(map).hide();
    coordinates.forEach(function (coord) {
        var point = new maptalks.Marker(coord).addTo(extentLayer);
    });
    var extent = extentLayer.getExtent();
    return extent.getCenter();
}
function checkDistance(point1, point2) {
    if (Math.abs(point1 - point2) > 0.05)
        return true;
    return false;
}

//道格拉斯—普克(Douglas一Peukcer)节点抽稀算法
function vacute(paths) {
    var _paths = [];
    for (var i = 0; i < paths.length; i ++) {
        _paths.push(paths[i]);
    }
    return _paths;
}
//计算marker的高宽
function calWithHeight(extent) {
    var lb = map1.coordinateToViewPoint(new maptalks.Coordinate(extent.xmin, extent.ymin));
    var rt = map1.coordinateToViewPoint(new maptalks.Coordinate(extent.xmax, extent.ymax));
    playerground.width = rt.x - lb.x;
    playerground.height = lb.y - rt.y;
}
function addplayground(extent) {
    var playerground1 = new maptalks.VectorLayer('playerground');
    var playerground2 = new maptalks.VectorLayer('playerground');
    map1.addLayer(playerground1);
    map2.addLayer(playerground2);
    var playerMarker1 = new maptalks.Marker(map1.getCenter(), {
        id: 'playerMarker',
        draggable: false,
        symbol: {
            'markerFile': '../images/playground.png',
            ///TODO
            'markerWidth': Width,
            'markerHeight': Height,
            'markerDy': Height / 2
        }
    }).addTo(playerground1);
    var playerMarker2 = new maptalks.Marker(map2.getCenter(), {
        id: 'playerMarker',
        draggable: false,
        symbol: {
            'markerFile': '../images/playground.png',
            ///TODO
            'markerWidth': Width,
            'markerHeight': Height,
            'markerDy': Height / 2
        }
    }).addTo(playerground2);
    center = extent.getCenter();
    playerMarker1.setCoordinates(center);
    playerMarker2.setCoordinates(center);
}
var checked = false;
var Width = 0, Height = 0;
var ruserid = PJ.Format.QueryString("ruserid");
var tpiid = PJ.Format.QueryString("tpid");
function initSize() {
    //九峰中学数据
    ruserid = 'a3505c34a0b346d8b1b2e6ba8f8e5c33';
    tpiid = '19c1830488db4dda8ec9e7c5709d5c2c';
    //武体数据
    //ruserid = '0576430c30a046e1aa2ef7fc9cbfae16';
    //tpiid = '7ed85d234ee24fcd83847561c3d116e1';
    //ruserid = 'a3505c34a0b346d8b1b2e6ba8f8e5c33';
    //tpiid = 'ca37a350ee38464ebc6ca77fc03ee1b9';
    if (parent.$("#MFrame").length > 0) {
        // 桌面端嵌入
        Height = parent.$("#MFrame").height();
        $("#map2").css("margin-left", "128px");
        //$("#map2").css("margin-left", "20px");
        Width = Math.floor((parent.$("#MFrame").width() - 30) / 2);
        $(".pbody").width(parent.$("#MFrame").width()).height(Height);
        //$(".pbody").width(954).height(287);
    } else {
        //  移动端嵌入;
        Width = 954;
        Height = 287;
        //$("#map2").css("margin-top", "30px");
        $("#map2").css("margin-left", "20px");
        $(".pbody").width(Width).height(Height);
    }
    Width = 462, Height = 287;
    $("#map1,#map2").width(Width).height(Height);
}
function testpoint(coords) {
    var l = new maptalks.VectorLayer('ll').addTo(map2);
    coords.forEach(function (_coord, i) {
        _coord = maptalks.CRSTransform.transform([_coord[0],_coord[1]], 'WGS84', 'GCJ02');
        new maptalks.Marker(_coord, {
            symbol: {
                'markerType': 'ellipse',
                'markerWidth': 10,
                'markerHeight': 10,
                'markerFill':'rgba('+i*60+',0,0,255)'
            }
        }).addTo(l);
    });
}

//计算旋转角度
function inverseAngle(point1, point2) {
    var $y = Math.abs(point2[0] - point1[0]);
    var $r = Math.pow(Math.pow(point2[0] - point1[0], 2) + Math.pow(point2[1] - point1[1], 2), 0.5);
    var cosAngle = $y / $r;
    return cosAngle;
}
//根据地球椭球体参数，算旋转后的坐标
function InverseCoords(coords, _center) {
    var cosA = inverseAngle(p1, p2);
    //sin角度值正负随第二个参考点的与第一个参考点的位置变化，第四象限为正，第一象限为负
    var sinA = (p2[1] > p1[1]) ? Math.pow(1 - Math.pow(cosA, 2), 0.5) : -Math.pow(1 - Math.pow(cosA, 2), 0.5);
    var e = b / a - 0.140867423;//椭圆偏心率系数，可调节
    for(var i=0;i<coords.length;i++){
        var coord = coords[i];
        var x = (1 / e) * (coord[1] - _center[1]) * sinA + (coord[0] - _center[0]) * cosA + _center[0];
        var y = (coord[1] - _center[1]) * cosA - e * (coord[0] - _center[0]) * sinA + _center[1];
        coords[i] = [x, y];
    }
    return coords;
}
$(function () {
    initSize();
    initMap();
    var checked = false;
    var proxyUrl = "../proxy/Map.ashx";
    maptalks.Ajax.post({ url: proxyUrl }, 'type=PROC_QTGZ_CCSJ&ruserid=' + ruserid + "&tpiid=" + tpiid, function (err, response) {
    //var proxyUrl = "../proxy/Map.ashx";
    //maptalks.Ajax.post({ url: proxyUrl }, 'type=PROC_QTGZ_CCSJ', function (err, response) {
        if (!err) {
            var data = PJ.Format.jsonUnEscape(maptalks.Util.parseJSON(response)).TABLE;
            var len = data.length;
            if (len && len > 0) {
                var path1 = [];
                var path2 = [];
                for (var i = 0; i < len; i++) {
                    //var coord = maptalks.CRSTransform.transform([Number(data[i].LON), Number(data[i].LAT)], 'WGS84', 'GCJ02');
                    //path1.push([coord[0], coord[1]]);
                    for (var i = 0; i < len; i++) {
                        if (i < len - 1 && checkDistance(Number(data[i].LON), Number(data[i + 1].LON)) && !checked) {
                            checked = true;
                        }
                        else if (!checked) {
                            var coord = maptalks.CRSTransform.transform([Number(data[i].LON), Number(data[i].LAT)], 'WGS84', 'GCJ02');
                            path1.push([coord[0], coord[1]]);
                        }
                        else if (checked) {
                            var coord = maptalks.CRSTransform.transform([Number(data[i].LON), Number(data[i].LAT)], 'WGS84', 'GCJ02');
                            path2.push([coord[0], coord[1]]);
                        }
                    }
                }
                testpoint([p1, p2, p3, p4]);
                var path = InverseCoords(path2, p1);
                //var path = path1;
                var heat = new maptalks.HeatLayer('heat', vacute(path)).addTo(map1);
                var layer = new maptalks.VectorLayer('vector').addTo(map2);
                var Path = new maptalks.LineString(path, {
                    symbol: {
                        'lineColor': 'rgba(230,176,62,255)',
                        'lineWidth': 1.5
                    }
                }).addTo(layer);
                var extent = layer.getExtent();
                var fitZoom = map2.getFitZoom(extent);
                addplayground(extent);
                heat.bringToFront();
                layer.bringToFront();
                center = extent.getCenter();
                map1.setCenterAndZoom(center, fitZoom-1 );
                map2.setCenterAndZoom(center, fitZoom-1);
                map1.options.zoomable = false;
                map2.options.zoomable = false;
            }
        }
    });
    map2.on('click', function (e){
        if (e.domEvent.button == 1) {
            console.log('x:' + e.coordinate.x + ',y:' + e.coordinate.y);
        }
    });
});