import React from "react";

export function InputFrame(props) {
  let extraClasses = props.className || "";
  return (
    <div className={"w-auto h-auto" + extraClasses} style={props.style}>
       {props.children}
    </div>
  );
}