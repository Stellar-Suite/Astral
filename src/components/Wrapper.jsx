import React from "react";

export function Wrapper(props) {
  let extraClasses = props.className || "";
  if(props.extended == "100"){
    extraClasses += "h-full ";
  }else if(props.extended){
    extraClasses += "h-100 ";
  }else{
    extraClasses += "min-h-screen h-screen max-h-full ";
  }

  return (
    <div className={"wrapper w-auto bg-background text-foreground " + extraClasses} style={props.style}>
       {props.children}
    </div>
  );
}