import React from 'react';

export function Dialog(props){
    /* this makes a full screen div with the children centered */
    return (
        <div className = "center-xy">
            <div className = "w-1/2 h-1/2 bg-background-lighter">
                {props.children}
            </div>
        </div>
    )
}