var map1, map2;
var playerground = {
    width: null,
    height: null
};
var region = {
    lb: { x: 114.48576460182875, y: 30.49893074184113 },
    rt: { x: 114.48653439581612, y: 30.499999617362743 }
}
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

//根据地球椭球体参数，算旋转后的坐标
function inverseCoord(coords, _center) {
    for (var i = 0; i < coords.length; i++) {
        var coord = coords[i];
        var e = b / a - 0.140867423;
        var x = (1 / e) * (coord[1] - _center.y) + _center.x;
        var y = e * (_center.x - coord[0]) + _center.y;
        coords[i] = [x, y + 0.00004];
    }
    return coords;
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
        draggable: true,
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
        draggable: true,
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
    ruserid = 'a3505c34a0b346d8b1b2e6ba8f8e5c33';
    tpiid = '19c1830488db4dda8ec9e7c5709d5c2c';
    if (parent.$("#MFrame").length > 0) {
        // 桌面端嵌入
        Height = parent.$("#MFrame").height();
        $("#map2").css("margin-left", "128px");
        //$("#map2").css("margin-left", "20px");
        Width = Math.floor((parent.$("#MFrame").width() - 30) / 2);
        $(".pbody").width(parent.$("#MFrame").width()).height(Height);
        //$(".pbody").width(954).height(287);
    } else {
        //  移动端嵌入
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
    coords.forEach(function (coord) {
        var _coord = maptalks.CRSTransform.transform([coord[0], coord[1]], 'WGS84', 'GCJ02');
        new maptalks.Marker(_coord).addTo(l);
    });
}
$(function () {
    initSize();
    initMap();
    var proxyUrl = "../ajax/Map.ashx";
    maptalks.Ajax.post({ url: proxyUrl }, 'type=PROC_QTGZ_CCSJ&ruserid=' + ruserid + "&tpiid=" + tpiid, function (err, response) {
        if (!err) {
            var data = PJ.Format.jsonUnEscape(maptalks.Util.parseJSON(response)).TABLE;
            var len = data.length;
            if (len && len > 0) {
                var path1 = [];
                var path2 = [];
                for (var i = 0; i < len; i++) {
                    var coord = maptalks.CRSTransform.transform([Number(data[i].LON), Number(data[i].LAT)], 'WGS84', 'GCJ02');
                    path1.push([coord[0], coord[1]]);
                }
                //计算旋转中心，根据给定的四个点坐标

                testpoint([p1, p2, p3, p4]);
                var inverseCenter = calculateExtent([p1, p2, p3, p4], map1);
                var heat = new maptalks.HeatLayer('heat', vacute(path1)).addTo(map1);
                var layer = new maptalks.VectorLayer('vector').addTo(map2);
                var Path = new maptalks.LineString(path1, {
                    symbol: {
                        'lineColor': 'rgba(230,176,62,255)',
                        'lineWidth': 1.5
                    }
                }).addTo(layer);
                var extent = layer.getExtent();
                addplayground(extent);
                heat.bringToFront();
                layer.bringToFront();
                center = extent.getCenter();
                map1.setCenter(center);
                map2.setCenter(center);
                console.log(map2.getExtent());
            }
        }
    });
    map1.on('click', function (e) {
        console.log('x:' + e.containerPoint.x + ',y:' + e.containerPoint.y);
        console.log('x:' + e.coordinate.x + ',y:' + e.coordinate.y);
        if (e.domEvent.button == 1) {
            console.log('x:' + e.containerPoint.x + ',y:' + e.containerPoint.y);
            console.log('x:' + e.coordinate.x + ',y:' + e.coordinate.y);
        }
    });
});