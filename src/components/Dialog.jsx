import React from 'react';

const curved = "rounded-lg";

export function Dialog(props){
    /* this makes a full screen div with the children centered */
    return (
        <div className = "center-xy">
            <div className = {"w-full md:w-1/2 h-full md:h-1/2 bg-background-lighter " + curved}>
                {props.children}
            </div>
        </div>
    )
}