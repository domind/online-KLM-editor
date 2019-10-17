function getBaseLog(x, y) {
    return Math.log(y) / Math.log(x);
}

export function viewport_center_zoom_calc(pointsArray, map_height, map_width) {
    let points=[];
    for (let i=0; i<pointsArray.length; i++){
      points=points.concat(pointsArray[i])
    }


    let min_lat = Math.min.apply(Math, points.map(function (i) { return i[0]; }))
    let max_lat = Math.max.apply(Math, points.map(function (i) { return i[0]; }))
    let min_lng = Math.min.apply(Math, points.map(function (i) { return i[1]; }))
    let max_lng = Math.max.apply(Math, points.map(function (i) { return i[1]; }))
    let lat = (min_lat + max_lat) / 2
    let lng = (min_lng + max_lng) / 2

    let diff_lat = (min_lat - max_lat) * 1852 * 60 / map_height
    let zoom_calc_lat = getBaseLog(2, 156412 / Math.abs(diff_lat))

    let diff_lng =  Math.cos(lat * Math.PI / 180)*(min_lng - max_lng) * 1852 * 60 / map_width 
    let zoom_calc_lng = getBaseLog(2, 156412 / Math.abs(diff_lng))

    let zoom_calc = Math.trunc(zoom_calc_lat > zoom_calc_lng ? zoom_calc_lng : zoom_calc_lat-1)
    if (zoom_calc>20) { zoom_calc=20}
    if (zoom_calc<0) {zoom_calc=0 }
    return { center: [lat, lng], zoom: zoom_calc }
}