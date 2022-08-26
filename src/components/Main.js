import React, {Component} from 'react';
import { Row, Col } from 'antd';
import axios from 'axios';

import SatSetting from './SatSetting';
import SatelliteList from './SatelliteList';
import WorldMap from "./WorldMap";
import { SAT_API_KEY, BASE_URL, NEARBY_SATELLITE, STARLINK_CATEGORY } from "../constants";

class Main extends Component {
    state = {
        setting: {},
        satInfo: {},
        satList: [],
        isLoadingList: false
    }
    showMap = (selected) => {
        this.setState(preState => ({
            ...preState,
            satList: [...selected]//get a copy of selected satellites
        }));
    };

    //Main call SatSetting, in which will change setting, then here we have setting:
    showNearbySatellite = (setting) => {
        console.log('show nearby')
        this.setState({
           // isLoadingList: true,
            setting: setting
        })
        this.fetchSatellite(setting);
    }
    fetchSatellite = (setting) => {
        console.log("fetching")
        const { latitude, longitude, elevation, altitude } = setting;
        const url = `${BASE_URL}/${NEARBY_SATELLITE}/${latitude}/${longitude}/${elevation}/${altitude}/${STARLINK_CATEGORY}/&apiKey=${SAT_API_KEY}`;

        this.setState( { isLoadingList: true});
        axios.get(url)
            .then(res => {
                console.log(res.data);
                this.setState({
                    satInfo: res.data,
                    isLoadingList: false
                })
            })
            .catch(err => {
                console.log("err in fetching", err.message);
                this.setState({isLoadingList: true})
            })
    }

    render() {
        const { satInfo, isLoadingList, satList, setting } = this.state;
        return (
            <Row className='main'>
                <Col span={8} className="left-side">
                    <SatSetting onShow={this.showNearbySatellite} />
                    {/*change state when onShow was called, after that, pass new state to SatelliteList*/}
                    <SatelliteList satInfo = {satInfo}
                                   isLoad={isLoadingList}
                                    onShowMap={this.showMap}/>
                </Col>
                <Col span={16} className="right-side">
                    <WorldMap satData={satList} observerData={setting} />
                </Col>
            </Row>
        );
    }
}

export default Main;
