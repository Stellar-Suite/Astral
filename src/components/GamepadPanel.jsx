import { unfuck } from "../@/lib/utils";
import { streamerClientManager } from "../client/streamer_client";
import React from "react";

export function GamepadPanel(props) {
  return (
    <div className="">
       {props.children}
    </div>
  );
}