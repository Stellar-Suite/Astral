import React from 'react';

export function Button(props){
    let myClasses = "";
    if(props.variant == "primary"){
        myClasses += "bg-primary text-background ";
    }
    if(props.variant == "success"){
        myClasses += "bg-lime-500 text-background "; // bright is less readable
    }

    if(props.variant == "warning"){
        myClasses += "bg-yellow-500 text-background "; // bright is less readable
    }

    if(!props.customSizing){
        myClasses += "h-12 w-36 text-lg";
    }
    return (
        <button {...props} className={myClasses + " " + ("" || props.className)}>{props.children}</button>
    )
}