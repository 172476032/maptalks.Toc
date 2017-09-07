/**
 * Created by Administrator on 2016/11/28 0028.
 */

(function (global) {

    $(function () {
        global.pfun.autoSize();

        global.pmap.init();
    });

    global.pfun = {
        // 自动计算弹性页面布局的高宽比例
        autoSize: function () {
            var pwidth = document.documentElement.clientWidth,
                pheight = document.documentElement.clientHeight;
            if(pwidth < 1920){ pwidth = 1920; }
            if(pheight < 1080){ pheight = 1080; }

            $("body").width(pwidth).height(pheight);
        }
    };

    global.clock
    // 创建地图pmap对象，操作地图相关操作
    global.pmap = {
        WHRoad: null,
        map: null,
        region: [
            {wn: [114.241531, 30.619673], es: [114.296723, 30.564711]},
            { wn: [114.328056, 30.588839], es: [114.353065, 30.500259] },
            { wn: [114.388997, 30.534108], es: [114.47121, 30.460421] },
            { wn: [114.145808, 30.508971], es: [114.178003, 30.454195] },
            {wn: [114.203874, 30.5769], es: [114.236645, 30.527886]},
            { wn: [114.354215, 30.610971], es: [114.376349, 30.580133] }
        ],
        init: function () {
            this.map = new maptalks.Map('map', {
                center: [114.39532134, 30.5423194867],
                zoom: 13,
                minZoom: 1,
                maxZoom: 19,
                view: {
                    projection: 'baidu'
                },
                baseLayer: new maptalks.TileLayer('base', {
                    urlTemplate: 'http://api{s}.map.bdimg.com/customimage/tile?&x={x}&y={y}&z={z}&udt=20161109&scale=1&styles=t%3Awater%7Ce%3Aall%7Cc%3A%23044161%2Ct%3Aland%7Ce%3Aall%7Cc%3A%23091934%2Ct%3Aboundary%7Ce%3Ag%7Cc%3A%23064f85%2Ct%3Arailway%7Ce%3Aall%7Cv%3Aoff%2Ct%3Ahighway%7Ce%3Ag%7Cc%3A%23004981%2Ct%3Ahighway%7Ce%3Ag.f%7Cc%3A%23005b96%7Cl%3A1%2Ct%3Ahighway%7Ce%3Al%7Cv%3Aon%2Ct%3Aarterial%7Ce%3Ag%7Cc%3A%23004981%7Cl%3A-39%2Ct%3Aarterial%7Ce%3Ag.f%7Cc%3A%2300508b%2Ct%3Agreen%7Ce%3Aall%7Cv%3Aoff%7Cc%3A%23056197%2Ct%3Asubway%7Ce%3Aall%7Cv%3Aoff%2Ct%3Amanmade%7Ce%3Aall%7Cv%3Aoff%2Ct%3Alocal%7Ce%3Aall%7Cv%3Aoff%2Ct%3Aarterial%7Ce%3Al%7Cv%3Aon%2Ct%3Aboundary%7Ce%3Ag.f%7Cc%3A%23029fd4%2Ct%3Abuilding%7Ce%3Aall%7Cc%3A%231a5787%2Ct%3Apoi%7Ce%3Aall%7Cv%3Aoff%2Ct%3Aall%7Ce%3Al.t.f%7Cc%3A%23e3dad9%2Ct%3Aall%7Ce%3Al.t.s%7Cc%3A%23000000',
                    subdomains: [2]
                })
            });
            pmap.addDistBoundary();
            //this.map.on('click', function (e) {
            //    if (e.domEvent.button == 1) {
            //        var coord = e.coordinate;
            //        console.log("x:" + coord.x + "......." + "y:" + coord.y);
            //    }
            //});
            //var whUrl = "http://202.114.148.206:6080/arcgis/rest/services/WH_KZC/MapServer/0";
            //this.WHRoad = new maptalks.FeatureLayer('whroad', whUrl).addTo(this.map);
            //图层数据加载完成后绘制荧光数据
            //this.WHRoad.on('loadend', function (geos) {
             
            //});
            pmap.addGPSLineLayer();
            pmap.addGPSPoints();
        },
        animations: [],
        //添加武汉区划边界
        addDistBoundary: function () {
            var districtLayer = new maptalks.VectorLayer("dist").addTo(pmap.map);
            regions.forEach(function (r) {
                var boundary = r.coordinates.split(";");
                var coordinates = boundary.map(function (item) {
                    var coord = item.split(",");
                    return [Number(coord[0]), Number(coord[1])];
                });
                var regionBound = new maptalks.Polygon(coordinates, {
                    symbol: {
                        "lineColor": "#FA8072",
                        "lineWidth": 2,
                        "polygonOpacity": 0,
                    }
                }).addTo(districtLayer);
            });
        },
        //画荧光线
        addGPSLineLayer: function () {
            var lineWidth = 0.05;
            var layerFeatures = pmap.WHRoad.layerData.features;
            if (layerFeatures) {
                var linelayer = new maptalks.CanvasdrawLayer('lines').addTo(pmap.map);
                linelayer.Draw(function () {
                    var ctx = this.context;
                    ctx.beginPath();
                    ctx.strokeStyle = "rgba(0,0,255,0.2)";
                    //ctx.strokeStyle = "rgba(103,147,255,0.2)";
                    ctx.globalCompositeOperation = "lighter";
                    ctx.fillStyle = "rgba(255,255,255,1)";
                    var len = layerFeatures.length;
                    for (var m = -3; m < 4; m++) {
                        for (var index = 0; index < 5; index++) {
                            for (var i = 0; i < len; i++) {
                                var paths = layerFeatures[i].geometry.paths;
                                for (var j = 0; j < paths.length; j++) {
                                    var path = paths[j];
                                    var firstPoint = path[0];
                                    var firstDomXY = pmap.map.coordinateToContainerPoint(new maptalks.Coordinate(firstPoint[0] + 0.01232, firstPoint[1] + 0.003));
                                    ctx.moveTo(firstDomXY.x + m, firstDomXY.y + m);
                                    //ctx.moveTo(firstDomXY.x, firstDomXY.y);
                                    for (var k = 0; k < path.length; k++) {
                                        var point = path[k];
                                        var domXY = pmap.map.coordinateToContainerPoint(new maptalks.Coordinate(point[0] + 0.01232, point[1] + 0.003));
                                        ctx.lineTo(domXY.x + m, domXY.y + m);
                                        ctx.lineTo(domXY.x, domXY.y);
                                    }
                                }
                            }
                        }
                    }
                    ctx.lineWidth = lineWidth;
                    ctx.stroke();
                    this.completeRender();
                });
            }
        },
        //画荧光点
        addGPSPoints: function () {
            var clayer = new maptalks.CanvasdrawLayer("c").addTo(pmap.map);
            var drawPoint = function (drawboard) {
                var that = drawboard;
                var animate = function () {
                    that.prepareCanvas();
                    var layerFeatures = pmap.WHRoad.layerData.features;
                    var len = layerFeatures.length;
                    for (var i = 0; i < len; i++) {
                        var paths = layerFeatures[i].geometry.paths;
                        for (var j = 0; j < paths.length; j++) {
                            var path = paths[j];
                            for (var k = 0; k < path.length; k++) {
                                var point = path[k];
                                var _point = path[k + 1] || path[k];
                                var domXY = pmap.map.coordinateToContainerPoint(new maptalks.Coordinate(point[0] + 0.01232, point[1] + 0.003));
                                var _domXY = pmap.map.coordinateToContainerPoint(new maptalks.Coordinate(_point[0] + 0.01232, _point[1] + 0.003));
                                var vect = { X: _domXY.x - domXY.x, Y: _domXY.y - _domXY.y };
                                var count = pmap.checkRegion(point) ? 2 : 1;
                                for (var m = 0; m < count; m++) {
                                    var ratio = Math.random() * (-4) + 2;
                                    that.context.fillRect(domXY.x + ratio * vect.X, domXY.y + ratio * vect.Y, 1, 1);
                                }
                            }
                        }
                    }
                    that.completeRender();
                    for (var index = 0; index < pmap.animations.length - 1; index++) {
                        clearInterval(pmap.animations[index]);                
                    }
                };
                var anim = setInterval(animate, 300);
                pmap.animations.push(anim);
                pmap.map.on('movestart', function () {
                    for (var index = 0; index < pmap.animations.length; index++) {
                        clearInterval(pmap.animations[index]);
                    }
                });

                pmap.map.on('moveend', function () {
                    var anim = setInterval(animate, 300);
                    pmap.animations.push(anim);
                });
            }
            
            ///////////////
            clayer.Draw(function () {
                this.context.fillStyle = "rgba(255, 255, 255, 1)";
                drawPoint(this);
            });
            clayer.bringToFront();
        },
        //范围检测
        checkRegion: function (point) {
            for (var i = 0; i < pmap.region.length; i++) {
                var region = pmap.region[i];
                if (region.wn[0] <= point[0] && point[0] <= region.es[0] && region.es[1] <= point[1] && point[1] <= region.wn[1]) {
                    return true;
                }
            }
            return false;
        }
    };

})(window);