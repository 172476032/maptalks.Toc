function setDate(inputDate) {
    var pmImages = [];
    var date = new Date();
    var oneday, hour;
    if (!inputDate) {
        oneday = date.toLocaleDateString().split("/");
        hour = date.getHours();
    }
    else if (inputDate) {
        oneday = inputDate.split("/");
        var a1 = Number(oneday[0]);
        var a2 = Number(oneday[1]);
        var a3 = Number(oneday[2]);
        var b1 = Number(date.toLocaleDateString().split("/")[0]);
        var b2 = Number(date.toLocaleDateString().split("/")[1]);
        var b3 = Number(date.toLocaleDateString().split("/")[2]);
        if (a1 >= b1 && a2 >= b2 && a3 > b3) return;
        hour = 24;
    }
    var month = Number(oneday[1]);
    if (month < 10)
        month = "0" + month.toString();
    else
        month = month.toString();
    var day = Number(oneday[2]);
    if (day < 10)
        day = "0" + day.toString();
    else
        day = day.toString();
    oneday = oneday[0] + "-" + month + "-" + day;
    for (var i = 1; i <= hour; i++) {
        var beforeHour = hour - i;
        if (beforeHour >= 0 && beforeHour < 10)
            beforeHour = "0" + beforeHour.toString();
        else if (beforeHour >= 10 & beforeHour < 24)
            beforeHour = beforeHour.toString();
        var picUrl = baseUrl + oneday + " " + beforeHour + ":00:00.png";
        pmImages.push({
            time: oneday + " " + beforeHour + ":00:00",
            url: picUrl
        });
    }
    return pmImages;
}
function setEchartOption(mapdata) {
    var series = [];
    var testData = [1, 26, 65, 99];
    var cities = mapdata.rows;
    series.push({
        name: 'marker',
        type: 'effectScatter',
        coordinateSystem: 'geo',
        zlevel: 2,
        rippleEffect: {
            brushType: 'fill'
        },
        label: {
            normal: {
                show: true,
                position: "inside",
                formatter: function (item) {
                    return item.value[2];
                },
                textStyle: {
                    color: '#fff'
                }
            }
        },
        symbolSize: function (val) {
            var v = Number(val[2]);
            if (v < 25) return 15;
            return v / 3.5;
        },
        itemStyle: {
            normal: {
                color: "#EE7AE9"
            }
        },
        data: cities.map(function (item) {
            return {
                name: item.cityname,
                value: [item.point.lng, item.point.lat, item.pm2_5, testData[parseInt((Math.random() * 100) / 25)]]
            };
        })
    });
    return {
        tooltip: {
            trigger: 'item',
            backgroundColor: '#051127',
            borderWidth: 1,
            textStyle: { color: '#fff' },
            formatter: function (item) {
                if (item.value) {
                    var value = item.value[2];
                    return "<div><b>" + item.name + "</b></br>" + " pm2.5为：" + value + "</br>";
                }
            }
        },
        series: series
    };
}