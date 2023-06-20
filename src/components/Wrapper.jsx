import React from "react";

export function Wrapper(props) {
  return (
    <div className="wrapper w-screen h-screen bg-background text-foreground">
       {props.children}
    </div>
  );
}