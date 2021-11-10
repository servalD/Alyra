import React from 'react'
// import "../styles/Table.css"

function Row(props) {
    let cells;
    if (props.columnsHandler.map){
        cells = props.columnsHandler.map((header, index) => <td style={{wordWrap: "break-word"}} key={index}>{typeof(props.data[header])==='boolean' ? props.data[header]===true ? 'Yes' : 'No' : props.data[header]}</td>)
    }else{
        cells = Object.keys(props.columnsHandler).map((header, index) => <td style={{wordWrap: "break-word"}} key={index}>{props.columnsHandler[header] ? props.columnsHandler[header](props.data[header]) : props.data[header]}</td>)
    }
    
    return (
        <tr className={props.fixedSelection ? 'fixedSelection' : props.selected ? 'selected' : ''} onClick={(event) => {event.currentTarget.scrollIntoView({behavior: "smooth",block: "nearest", inline: "nearest"});props.onClick(event.currentTarget, event.currentTarget.rowIndex-1)}}>
            {cells}
        </tr>
    )
}

export default React.memo(Row)
