import React from 'react'

function Row(props) {
    let cells;
    if (props.columnsHandler.map){// If columnsHandler is a list so display raw data replacing bolean values by "yes" or "no" because otherwise they are not displayed
        cells = props.columnsHandler.map((header, index) => <td style={{wordWrap: "break-word"}} key={index}>{typeof(props.data[header])==='boolean' ? props.data[header]===true ? 'Yes' : 'No' : props.data[header]}</td>)
    }else{// If columnsHandler is an object but not an array (or a list) then call his associated data handler
        cells = Object.keys(props.columnsHandler).map((header, index) => <td style={{wordWrap: "break-word"}} key={index}>{props.columnsHandler[header] ? props.columnsHandler[header](props.data[header]) : props.data[header]}</td>)
    }
    
    return (
        <tr className={props.fixedSelection ? 'fixedSelection' : props.selected ? 'selected' : ''} onClick={(event) => {event.currentTarget.scrollIntoView({behavior: "smooth",block: "nearest", inline: "nearest"});props.onClick(event.currentTarget, event.currentTarget.rowIndex-1)}}>
            {cells}
        </tr>
    )
}

export default React.memo(Row)
