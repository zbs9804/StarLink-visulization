import React, {Component} from 'react';
import { List, Avatar, Button, Checkbox, Spin } from 'antd';
import satellite from "../assets/images/satellite-logo.svg";

class SatelliteList extends Component {
    constructor(){
        super();
        this.state = {
            selected: []
        };
    }

    onChange = e => {
        // step1: get the active sat info + get active status(check || uncheck)
        // step2: add or remove to/from the current selected sat array
        // step3: set state: selected
        const { dataInfo, checked } = e.target;
        const { selected } = this.state;
        const list = this.addOrRemove(dataInfo, checked, selected);
        this.setState({ selected: list })
    }

    addOrRemove = (item, status, list) => {
        //status => check
        // check is true
        //   -item not in the list => add it
        //   -item is in the list => do nothing
        // check is false
        //  - item is in the list => remove it
        //  - item not in the list => do nothing
        const found = list.some( entry => entry.satid === item.satid);
        //Method provided in Array e.g. {1,2,3,8,10}.some(item => item===10) -> true
        if(status && !found){
            list=[...list, item]
        }

        if(!status && found){
            list = list.filter( entry => {
                return entry.satid !== item.satid;
            });
        }
        return list;
    }

    onShowSatMap = () =>{
        this.props.onShowMap(this.state.selected);
    }

    render() {
        const satList = this.props.satInfo ? this.props.satInfo.above : [];
        const { isLoad } = this.props;
        const { selected } = this.state;

        return (
            <div className="sat-list-box">
                <Button className="sat-list-btn"
                        type="primary"
                        disabled={ this.state.selected.length === 0}
                        onClick={this.onShowSatMap}
                >Track</Button>
                <hr/>

                {
                    isLoad ?
                        <div className="spin-box">
                            <Spin tip="Loading..." size="large" />
                        </div>
                        :
                        <List
                            className="sat-list"
                            itemLayout="horizontal"
                            size="small"
                            dataSource={satList}
                            renderItem={item => (
                                <List.Item
                                    actions={[<Checkbox dataInfo={item} onChange={this.onChange}/>]}
                                >
                                    <List.Item.Meta
                                        avatar={<Avatar size={50} src={satellite} />}
                                        title={<p>{item.satname}</p>}
                                        description={`Launch Date: ${item.launchDate}`}
                                    />

                                </List.Item>
                            )}
                        />
                }
            </div>
        );
    }
}

export default SatelliteList;
