import React from 'react';

export function Input(props){
    /* this makes a full screen div with the children centered */
    const outlineClass = props.outline || "outline-primary";
    return (
        <input {...props} className={(props.className || "") + " h-12 bg-secondary text-foreground text-lg w-full lg:w-96 " + outlineClass}></input>
    )
}