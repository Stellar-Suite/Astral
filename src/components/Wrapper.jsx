import React from "react";

export function Wrapper(props) {
  let extraClasses = ""
  if(props.extended){
    extraClasses += "h-auto ";
  }else{
    extraClasses += "h-screen ";
  }

  return (
    <div className={"wrapper w-auto bg-background text-foreground " + extraClasses}>
       {props.children}
    </div>
  );
}