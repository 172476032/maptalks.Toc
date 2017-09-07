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
        count: 0,
        map: null,
        colors: ['#ebbc4f','#ebda4f','#c29425','#f2a867','#f4dda6','#fff7e3'],
        region: [
            {wn: [114.241531, 30.619673], es: [114.296723, 30.564711]},
            { wn: [114.328056, 30.588839], es: [114.353065, 30.500259] },
            { wn: [114.388997, 30.534108], es: [114.47121, 30.460421] },
            { wn: [114.145808, 30.508971], es: [114.178003, 30.454195] },
            {wn: [114.203874, 30.5769], es: [114.236645, 30.527886]},
            { wn: [114.354215, 30.610971], es: [114.376349, 30.580133] }
        ],
        extent: { wn: [114.255042, 30.618181], es: [114.380086, 30.511958] },
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
            this.map.on('click', function (e) {
                if (e.domEvent.button == 1) {
                    console.log("[" + e.coordinate.x + "," + e.coordinate.y + "],");
                }
            });
            this.processData();
        },
        checkExtent: function (path) {
            var extent = this.extent;
            for (var i = 0; i < path.length; i++) {
                var point = path[i];
                if (extent.wn[0] <= point[0] && point[0] <= extent.es[0] && extent.es[1] <= point[1] && point[1] <= extent.wn[1]) {
                    return true;
                }
            }
            return false;
        },
        colonePath:function(path){
            var _path=[];
            var len=path.length;
            for(var i=len-1;i>=0;i--){
                _path.push(path[i]);
            }
            return _path;
        },
        setOption:function(json){
            var transportLines = [];
            var len = json.features.length;
            var hStep = 300 / (len - 1);
            for (var i = 0; i < len; i++) {
                var fea = json.features[i];
                var line = [];
                for (var j = 0; j < fea.geometry.paths.length; j++) {
                    var path = fea.geometry.paths[j];
                    if (i < 221) {
                        for (var k = 0; k < path.length; k++) {
                            path[k][0] += 0.01232;
                            path[k][1] += 0.003;
                        }
                    }
                    line = line.concat(path);

                    this.count += 1;
                }
                var color = this.colors[Math.floor(Math.random() * this.colors.length)];
                    transportLines.push({
                        coords: line,
                        lineStyle: {
                            normal: {
                                color: echarts.color.modifyHSL('#ebbc4f', Math.round(hStep * i))
                                //color:'rgba(255,255,255,1)'
                                //color: color
                            }
                        }
                    });
            }
            transportLines = this.coloneData(transportLines);
            return transportLines;
        },
        coloneData: function (transportLines) {
            var len = transportLines.length;
            for (var m = 0; m <len; m++) {
                var color = this.colors[Math.floor(Math.random() * this.colors.length)];
                var _line = transportLines[m].coords;
                if (this.checkExtent(_line)) {
                    var _path = this.colonePath(_line);
                    transportLines.push({
                        coords: _path,
                        lineStyle: {
                            normal: {
                                color: color
                            }
                        }
                    })
                    this.count += 1;
                }
            }
            return transportLines;
        },
        processData: function () {
            var that = this;
            $.ajax({
                url: '../test_data/wuhan.json',
                type: 'GET',
                success: function (data) {
                    var json = data;
                    var transportLines = that.setOption(json);
                    var option = {
                        series: [{
                            type: 'lines',
                            coordinateSystem: 'bmap',
                            polyline: true,
                            data: transportLines,
                            silent: true,
                            lineStyle: {
                                normal: {
                                    //color: '#c23531',
                                    //color: 'rgb(200, 35, 45)',
                                    opacity: 0,
                                    width: 0
                                }
                            },
                            progressiveThreshold:
                                500,
                            progressive: 200
                        },
                        {
                            type: 'lines',
                            coordinateSystem: 'bmap',
                            polyline: true,
                            data: transportLines,
                            lineStyle: {
                                normal: {
                                    width: 0.01,
                                }
                            },
                            effect: {
                                constantSpeed: 30,
                                show: true,
                                trailLength: 0.8,
                                symbolSize: 2,
                                //symbol: "image://../images/568.png",
                            },
                            zlevel: 1
                        }]
                    };
                    var e2Layer = new maptalks.E3Layer('e3', option).addTo(pmap.map);
                    console.log("路径数量:" + that.count);
                },
                error: function () {
                    
                }
            });
        }
    };
})(window);