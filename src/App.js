import React from "react";
import { Map, TileLayer, Marker, Polyline } from "react-leaflet";
import Row from "react-bootstrap/Row";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Table from "react-bootstrap/Table";
import Col from "react-bootstrap/Col";
import { FilePond } from "react-filepond";
import { viewport_center_zoom_calc } from "./viewport_center_zoom_calc";
import { SketchPicker } from "react-color";
import {
  greenMarker,
  redMarker,
  circleMarker,
  blueMarker,
  getRandomColor,
  readColor
} from "./icons";

import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "filepond/dist/filepond.min.css";

const DEFAULT_VIEWPORT = {
  center: [34.6638506, 32.9142967],
  zoom: 13
};

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      viewport: DEFAULT_VIEWPORT,
      width: window.innerWidth,
      height: window.innerHeight,
      file: "",
      files: "",
      points: [],
      lineNames: [],
      lineColors: [],
      originalColors: [],
      selectedPoint: [],
      displayColorPicker: false,
      lineColorNew: "#000000"
    };
    this.handleSave = this.handleSave.bind(this);
    this.handleReverse = this.handleReverse.bind(this);
    this.handleDivide = this.handleDivide.bind(this);
    this.polylineClick = this.polylineClick.bind(this);
    this.pointClick = this.pointClick.bind(this);
    this.handleChangeComplete = this.handleChangeComplete.bind(this);
    this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
  }
  /*
  handleInit() {
    console.log("FilePond instance has initialised", this.pond);
  }
*/
  /*------Following window size-------------------------------------------*/
  componentDidMount() {
    this.updateWindowDimensions();
    window.addEventListener("resize", this.updateWindowDimensions);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateWindowDimensions);
  }
  updateWindowDimensions() {
    this.setState({ width: window.innerWidth, height: window.innerHeight });
  }
  /*------Following map changes-------------------------------------------*/

  onViewportChanged = viewport => {
    // The viewport got changed by the user, keep track in state
    this.setState({ viewport });
  };

  /*------Color picker-------------------------------------------*/
  handleChangeComplete = col => {
    this.setState({ lineColorNew: col.hex });
    let colors = this.state.originalColors;
    colors[this.state.lineColors.indexOf("selected")] = this.state.lineColorNew;
    this.setState({ originalColors: colors });
  };
  handleClick = () => {
    this.setState({ displayColorPicker: !this.state.displayColorPicker });
  };
  handleClose = () => {
    this.setState({ displayColorPicker: false });
  };

  /*------Parse KML file-------------------------------------------*/

  parseKML = e => {
    let parser = new DOMParser();
    let xarray = [];
    let xmlDoc = parser.parseFromString(e, "text/xml");
    let lineNamesRead = [];
    let colorRead = [];
    let placemarks = xmlDoc.querySelectorAll("Placemark LineString ");

    for (
      let x = 0;
      x < xmlDoc.querySelectorAll("Placemark  LineString").length;
      x++
    ) {
      let placemark;

      if (placemarks[x].parentElement.nodeName === "MultiGeometry") {
        placemark = placemarks[x].parentElement.parentElement;
      } else {
        placemark = placemarks[x].parentElement;
      }

      lineNamesRead.push(placemark.querySelector("name").firstChild.nodeValue);

      let styleCheck = xmlDoc
        .getElementById(
          placemark
            .querySelector("styleUrl")
            .firstChild.nodeValue.replace("#", "")
        )
        .querySelector("styleUrl")
        .firstChild.nodeValue.replace("#", "");
      colorRead.push(
        "#" +readColor(
          xmlDoc
            .getElementById(styleCheck)
            .querySelector("color")
            .firstChild.nodeValue.slice(2))
      );

      let myPoints = xmlDoc
        .querySelectorAll("LineString coordinates")[x].childNodes[0].nodeValue.replace(/(\r\n|\n|\r|\t)/gm, "");
      let arrPoints = myPoints.split(/[ ,]+/);
      xarray[x] = [];
      for (let i = 0; i < arrPoints.length / 3 - 1; i++) {
        xarray[x][i] = [Number(arrPoints[i * 3 + 1]), Number(arrPoints[i * 3])];
      }
    }
    this.setState({
      points: xarray,
      lineNames: lineNamesRead,
      lineColors: colorRead,
      originalColors: colorRead
    });
    this.setState({
      viewport: viewport_center_zoom_calc(
        xarray,
        this.state.height - 150,
        this.state.width / 2
      )
    });
  };
  /*------Read file-------------------------------------------*/
  showFile = async e => {
    let text = "";
    const reader = new FileReader();
    reader.onload = async e => {
      text = e.target.result;
      this.setState({ file: text }, () => {
        this.parseKML(this.state.file);
      });
    };
    reader.readAsText(e[0].file);
  };
  /*------Select path-------------------------------------------*/
  polylineClick(e) {
    const idName = e.target.options.idName;
    let selectedLineIndex = idName.slice(0, idName.indexOf("#"));
    if (this.state.lineColors[selectedLineIndex] === "selected") {
      this.setState({
        lineColors: this.state.originalColors,
        selectedPoint: [], //remove selection
        newLineColors: "white"
      });
    } else {
      let newColors = [...this.state.originalColors];
      newColors[selectedLineIndex] = "selected";
      this.setState({
        lineColors: newColors,
        lineColorNew: this.state.originalColors[selectedLineIndex] // set selection
      });
    }
  }
  /*------Select point-------------------------------------------*/
  pointClick(e) {
    let pointPositionArray = [e.target._latlng.lat, e.target._latlng.lng];
    let pointPosition;
    for (
      let i = 0;
      i < this.state.points[this.state.lineColors.indexOf("selected")].length;
      i++
    ) {
      if (
        this.state.points[this.state.lineColors.indexOf("selected")][i][1] ===
          pointPositionArray[1] &&
        this.state.points[this.state.lineColors.indexOf("selected")][i][0] ===
          pointPositionArray[0]
      ) {
        pointPosition = i;
        break;
      }
    }
    this.setState({
      selectedPoint: [this.state.lineColors.indexOf("selected"), pointPosition]
    });
  }
  /*------Divide path-------------------------------------------*/
  handleDivide = () => {
    if (!this.state.lineColors.includes("selected")) {
      alert("select path and division point");
    } else {
      if (this.state.selectedPoint.length === 0) {
        alert("select division point");
      } else {
        let allLines = this.state.points;
        const lineNumber = this.state.lineColors.indexOf("selected");
        const selectedLine = this.state.points[lineNumber];
        const selectedPointPosition = this.state.selectedPoint[1];
        let firstPart = selectedLine.slice(0, selectedPointPosition + 1);
        let secondPart = selectedLine.slice(selectedPointPosition);
        allLines[lineNumber] = firstPart;
        allLines.push(secondPart);
        let newLineNames = this.state.lineNames;
        newLineNames.push(this.state.lineNames[lineNumber] + "_2");
        let newLineColors = this.state.originalColors;
        newLineColors.push(getRandomColor()); //change color
        this.setState({
          points: allLines,
          lineNames: newLineNames,
          lineColors: newLineColors,
          originalColors: newLineColors,
          selectedPoint: []
        });
      }
    }
  };
  /*------Reverse path-------------------------------------------*/
  handleReverse = () => {
    if (this.state.lineColors.includes("selected")) {
      const pathNumber = this.state.lineColors.indexOf("selected");
      let x = this.state.points;
      x[pathNumber].reverse();
      this.setState({ points: x, selectedPoint: [] });
    } else {
      alert("Please select path");
    }
  };
  /*------Save path-------------------------------------------*/

  handleSave = () => {
    if (this.state.lineColors.includes("selected")) {
      const pathNumber = this.state.lineColors.indexOf("selected");
      let xml =
        '<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2" xmlns:kml="http://www.opengis.net/kml/2.2" xmlns:atom="http://www.w3.org/2005/Atom"><Document><name>' +
        this.state.lineNames[pathNumber] +
        '</name><StyleMap id="msn_ylw-pushpin92"><Pair><key>normal</key><styleUrl>#sn_ylw-pushpin10</styleUrl></Pair></StyleMap><Style id="sn_ylw-pushpin10"><LineStyle><color>ff' +
        readColor(this.state.originalColors[pathNumber].replace("#", "")) +
        "</color><width>4</width></LineStyle></Style><Placemark><name>" +
        this.state.lineNames[pathNumber] +
        "</name><open>1</open><styleUrl>#msn_ylw-pushpin92</styleUrl><LineString><tessellate>1</tessellate><coordinates>" +
        this.state.points[pathNumber]
          .map(x => x[1] + "," + x[0] + ",0 ")
          .toString()
          .replace(/0 ,/g, "0 ") +
        "</coordinates></LineString></Placemark></Document></kml>";
      const element = document.createElement("a");
      const file = new Blob([xml], { type: "xml/plain" });
      element.href = URL.createObjectURL(file);
      element.download = this.state.lineNames[pathNumber] + ".kml";
      document.body.appendChild(element); // Required for this to work in FireFox
      element.click();
    } else {
      alert("Please select path");
    }
  };

  render() {
    /*------For color picker-------------------------------------------*/
    const popover = {
      position: "absolute",
      zIndex: "2"
    };
    const cover = {
      position: "fixed",
      top: "0px",
      right: "0px",
      bottom: "0px",
      left: "0px"
    };

    /*------Create points path-------------------------------------------*/
    let pointsToDisplay;
    if (this.state.lineColors.includes("selected")) {
      const pathNumber = this.state.lineColors.indexOf("selected");
      pointsToDisplay = this.state.points[pathNumber].map((x, index) => (
        <Marker
          key={index}
          position={x}
          icon={circleMarker}
          onClick={this.pointClick}
        />
      ));

      pointsToDisplay[0] = (
        <Marker
          key={0}
          position={this.state.points[pathNumber][0]}
          icon={greenMarker}
        />
      );
      pointsToDisplay[pointsToDisplay.length - 1] = (
        <Marker
          key={pointsToDisplay.length - 1}
          position={this.state.points[pathNumber][pointsToDisplay.length - 1]}
          icon={redMarker}
        />
      );
    }

    return (
      <Container>
        <Row>
          <Col style={{ textAlign: "center" }}>
            <h1>KML path editor</h1>
          </Col>
        </Row>

        <Row>
          <Col xs={4}>
            <Row>
              <Col>
                Upload your klm file here
                <FilePond
                  ref={ref => (this.pond = ref)}
                  files={this.state.files}
                  allowMultiple={false}
                  maxFiles={1}
                  //oninit={() => this.handleInit()}
                  onupdatefiles={fileItems => {
                    if (fileItems.length === 0) {
                      console.log("empty");
                      this.setState({
                        file: "",
                        files: "",
                        points: [],
                        lineColors: [],
                        originalColors: [],
                        selectedPoint: [],
                        lineNames: []
                      });
                    } else {
                      this.showFile(fileItems);
                      // Set currently active file objects to this.state
                      this.setState({
                        files: fileItems.map(fileItem => fileItem.file)
                      });
                    }
                  }}
                />
              </Col>
            </Row>

            <Row>
              <br></br>
            </Row>
            {this.state.lineNames.length > 0 ? (
              <div>
                List of paths:
                <Row>
                  <Col>
                    <Table bordered>
                      <tbody>
                      {this.state.lineNames.map((x, index) => (
                        <tr key={index}>
                          <td
                            style={{
                              backgroundColor: this.state.originalColors[index]
                            }}
                            key={index}
                          />
                          <td>
                            {this.state.lineColors[index] === "selected" ? (
                              <b>{x}</b>
                            ) : (
                              x
                            )}
                          </td>
                        </tr>
                      ))}
                      </tbody>
                    </Table>
                  </Col>
                </Row>
                {!this.state.lineColors.includes("selected") ? (
                  "Select path you want to change or save"
                ) : (
                  <div>
                    Actions for selected line
                    <Row>
                      <Col xs={4}>
                        <div>
                          <Button
                            onClick={this.handleClick}
                            size="sm"
                            variant="outline-dark"
                          >
                            Pick Color
                          </Button>
                          {this.state.displayColorPicker ? (
                            <div style={popover}>
                              <div style={cover} onClick={this.handleClose} />
                              <SketchPicker
                                color={this.state.lineColorNew}
                                disableAlpha={true}
                                onChangeComplete={this.handleChangeComplete}
                              />
                            </div>
                          ) : null}
                        </div>
                      </Col>
                      <Col xs={2}></Col>
                      <Col xs={4}>
                        <Button
                          size="sm"
                          variant="outline-dark"
                          onClick={this.handleReverse}
                        >
                          Reverse
                        </Button>
                      </Col>
                    </Row>
                    <Row>
                      <Col>
                        <br />
                      </Col>
                    </Row>
                    <Row>
                      <Col xs={4}>
                        <Button
                          size="sm"
                          variant="outline-dark"
                          onClick={this.handleDivide}
                        >
                          Divide
                        </Button>
                      </Col>
                      <Col xs={2}></Col>
                      <Col xs={4}>
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={this.handleSave}
                        >
                          Save
                        </Button>
                      </Col>

                      <Col>
                        <br />
                      </Col>
                    </Row>
                    <Row></Row>
                  </div>
                )}
              </div>
            ) : (
              " "
            )}
          </Col>
          <Col xs={8}>
            <Map
              onViewportChanged={this.onViewportChanged}
              style={{
                height:
                  this.state.height - 150 > 150 ? this.state.height - 150 : 150,
                width: this.state.width / 2
              }}
              viewport={this.state.viewport}
            >
              <TileLayer
                attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <TileLayer
                attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {this.state.points.map((x, index) => (
                <div key={index}>
                  <Polyline
                    key={index}
                    color={this.state.originalColors[index]}
                    width={3}
                    idName={
                      index +
                      "#" +
                      this.state.lineNames[index].replace(/ /g, "")
                    }
                    positions={[...x]}
                    onClick={this.polylineClick}
                  ></Polyline>
                </div>
              ))}
              {pointsToDisplay}
              {this.state.selectedPoint.length !== 0 ? (
                <Marker
                  position={
                    this.state.points[this.state.selectedPoint[0]][
                      this.state.selectedPoint[1]
                    ]
                  }
                  icon={blueMarker}
                />
              ) : (
                ""
              )}
            </Map>
          </Col>
        </Row>
      </Container>
    );
  }
}

export default App;
