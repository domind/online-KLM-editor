import React from 'react';
import { divIcon } from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';

const iconMarkup = renderToStaticMarkup(<i style={{ color: "green" }} className=" fa fa-map-marker-alt fa-3x" />);
export const greenMarker = divIcon({
  html: iconMarkup,
  iconAnchor: [13, 38],
});

const iconMarkup2 = renderToStaticMarkup(<i style={{ color: "red" }} className=" fa fa-map-marker-alt fa-3x" />);
export const redMarker = divIcon({
  html: iconMarkup2,
  iconAnchor: [13, 38],
});
const iconMarkup3 = renderToStaticMarkup(<i style={{ color: "red" }} className="fas fa-dot-circle" />);
export const circleMarker = divIcon({
  html: iconMarkup3,
  iconAnchor: [6, 8],
});
const iconMarkup4 = renderToStaticMarkup(<i style={{ color: "blue" }} className=" fa fa-map-marker-alt fa-3x" />);
export const blueMarker = divIcon({
  html: iconMarkup4,
  iconAnchor: [13, 38],
});

export function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }