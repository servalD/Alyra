import React, { Component } from 'react'
import Row from './Row'
import "./Table.css"

class Table extends Component {
    // --Callbacks:
    // onSelectionChanged
    // --Properties:
    // data; columnsHandler; title
    // -Data should be an array of object that must contains members (as columns cells) specified in columnsHandler
    // -columnsHandler can be a list of needed columns names to be displayed or 
    // an object that members are needed columns names and their corresponding value is a callback tacking original cell value of each row and returning his formated value
    // A title can be specified and will be displayed at the top of the table
    constructor(props) {
        super(props)
    
        this.state = {
             currentRow: 0,
        }
    }
    render() {
        let tableHeader;
        const onSelectedCB = this.props.onSelectionChanged ? this.props.onSelectionChanged : () =>{};
        const tableRows = this.props.data.map((vote => <Row columnsHandler={this.props.columnsHandler} 
                                                            selected={this.state.currentRow===vote.id && !this.props.fixedSelection}
                                                            fixedSelection={this.props.fixedSelection===vote.id}
                                                            key={vote.id} 
                                                            data={vote} 
                                                            onClick={(row) => {if (this.state.currentRow!==vote.id && !this.props.fixedSelection){this.setState({currentRow:vote.id});onSelectedCB(vote.id)}}}/>))
        if (this.props.columnsHandler.map){
            tableHeader = this.props.columnsHandler.map(((header, index) => <th key={index}>{header}</th>))
        }else{
            tableHeader = Object.keys(this.props.columnsHandler).map(((header, index) => <th key={index}>{header}</th>))
        }
        
        return (
            <table className={this.props.visible ? 'visible' : 'hidden'}>
                <tbody id={this.props.id} style={{maxHeight: this.props.maxHeight, maxWidth: this.props.maxWidth}} width={this.props.width} height={this.props.height}>
                    <tr>
                        {tableHeader}
                    </tr>
                    {tableRows}
                </tbody>
                {this.props.title ? <caption>{this.props.title}</caption> : null}
            </table>
        )
    }
}

export default Table
