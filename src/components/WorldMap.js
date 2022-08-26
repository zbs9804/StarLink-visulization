import React, { Component } from "react";
//OR, USE REACT-SIMPLE-MAPS AT https://www.react-simple-maps.io/examples/ to draw map
//github.com/d3/d3-geo#projections
import axios from "axios";
import { Spin } from "antd";
import { feature } from "topojson-client";
import { geoKavrayskiy7 } from "d3-geo-projection";
import { geoGraticule, geoPath } from "d3-geo";
import { select as d3Select } from "d3-selection";
import { schemeCategory10 } from "d3-scale-chromatic";
import * as d3Scale from "d3-scale";
import { timeFormat as d3TimeFormat } from "d3-time-format";

import {
    WORLD_MAP_URL,
    SATELLITE_POSITION_URL,
    SAT_API_KEY
} from "../constants";

const width = 960;
const height = 600;

class WorldMap extends Component {
    constructor() {
        super();
        this.state = {
            isLoading: false,
            isDrawing: false
        };
        this.map = null;
        this.color = d3Scale.scaleOrdinal(schemeCategory10);
        this.refMap = React.createRef();//for map
        this.refTrack = React.createRef();//for stars(drawer)
    }

    componentDidMount() {
        axios
            .get(WORLD_MAP_URL)
            .then(res => {
                const { data } = res;
                const land = feature(data, data.objects.countries).features;
                //feature(...)is an object(topology), .features to convert it to array
                this.generateMap(land);//generate map using land array
            })
            .catch(e => {
                console.log("err in fetch map data ", e.message);
            });
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.satData !== this.props.satData) {
            const {
                latitude,
                longitude,
                elevation,
                altitude,
                duration
            } = this.props.observerData;
            const endTime = duration * 60;//speed up 60 times to magnify difference, 10s duration means 600s data

            this.setState({
                isLoading: true
            });

            const urls = this.props.satData.map(sat => {
                const { satid } = sat;
                const url = `/api/${SATELLITE_POSITION_URL}/${satid}/${latitude}/${longitude}/${elevation}/${endTime}/&apiKey=${SAT_API_KEY}`;
                //use endtime to define the duration
                return axios.get(url);
            });

            Promise.all(urls)
                .then(res => {
                    const arr = res.map(sat => sat.data);
                    this.setState({//now we have data, next thing is starting to draw
                        isLoading: false,
                        isDrawing: true
                    });

                    if (!prevState.isDrawing) {//draw when the previous state is idle
                        this.track(arr);
                    } else {
                        const oHint = document.getElementsByClassName("hint")[0];
                        oHint.innerHTML =
                            "Please wait for these satellite animation to finish before selection new ones!";
                    }
                })
                .catch(e => {
                    console.log("err in fetch satellite position -> ", e.message);
                });
        }
    }

    track = data => {
        if (!data[0].hasOwnProperty("positions")) {
            throw new Error("no position data");
            return;
        }

        const len = data[0].positions.length;
        const { duration } = this.props.observerData;
        const { context2 } = this.map;

        let now = new Date();

        let i = 0;

        let timer = setInterval(() => {
            let ct = new Date();

            let timePassed = i === 0 ? 0 : ct - now;
            let time = new Date(now.getTime() + 60 * timePassed);//60 times speedup

            context2.clearRect(0, 0, width, height);

            context2.font = "bold 14px sans-serif";
            context2.fillStyle = "#333";
            context2.textAlign = "center";
            context2.fillText(d3TimeFormat(time), width / 2, 10);//set margin

            if (i >= len) {
                clearInterval(timer);
                this.setState({ isDrawing: false });
                const oHint = document.getElementsByClassName("hint")[0];
                oHint.innerHTML = "";
                return;
            }

            data.forEach(sat => {//draw dots
                const { info, positions } = sat;
                this.drawSat(info, positions[i]);
            });

            i += 60;//go to the next time point
        }, 1000);
    };

    drawSat = (sat, pos) => {
        const { satlongitude, satlatitude } = pos;

        if (!satlongitude || !satlatitude) return;

        const { satname } = sat;
        const nameWithNumber = satname.match(/\d+/g).join('');

        //real position <=> canvas <-> projection
        const { projection, context2 } = this.map;
        const xy = projection([satlongitude, satlatitude]);//convert real position to canvas coordinate using projection

        context2.fillStyle = this.color(nameWithNumber);
        context2.beginPath();
        context2.arc(xy[0], xy[1], 4, 0, 2 * Math.PI);//draw dot
        context2.fill();

        context2.font = "bold 11px sans-serif";
        context2.textAlign = "center";
        context2.fillText(nameWithNumber, xy[0], xy[1] + 14);//14 is the distance between text and dot
    };

    render() {
        const { isLoading } = this.state;
        return (
            <div className="map-box">
                {isLoading ? (
                    <div className="spinner">
                        <Spin tip="Loading..." size="large" />
                    </div>
                ) : null}
                <canvas className="map" ref={this.refMap} />
                <canvas className="track" ref={this.refTrack} />
                <div className="hint" />
            </div>
        );
    }

    generateMap = land => {//using html canvas to draw on map
        //define projection => real map data <-> dom
        //console.log(this.refMap);
        const projection = geoKavrayskiy7()
            .scale(170)
            .translate([width / 2, height / 2])//set initial offset
            .precision(.1);

        const graticule = geoGraticule();

        //define canvas on the dom there to draw the map
        const canvas = d3Select(this.refMap.current)//let d3 select canvas
            .attr("width", width)
            .attr("height", height);

        //define canvas2 on the dom where to track selected satellite
        const canvas2 = d3Select(this.refTrack.current)//let d3 select canvas
            .attr("width", width)
            .attr("height", height);

        const context = canvas.node().getContext("2d");
        const context2 = canvas2.node().getContext("2d");

        //define path to draw the map
        let path = geoPath()
            .projection(projection)//define pen
            .context(context);

        land.forEach(ele => {//set map attributions
            context.fillStyle = "#B3DDEF";
            context.strokeStyle = "#000";
            context.globalAlpha = 0.7;
            context.beginPath();
            path(ele);
            context.fill();
            context.stroke();

            context.strokeStyle = "rgba(220, 220, 220, 0.1)";
            context.beginPath();
            path(graticule());
            context.lineWidth = 0.1;
            context.stroke();

            context.beginPath();
            context.lineWidth = 0.5;
            path(graticule.outline());
            context.stroke();
        });

        this.map = {//use this to expose parameters:
            projection: projection,
            graticule: graticule,
            context: context,
            context2: context2
        };
    };
}

export default WorldMap;

