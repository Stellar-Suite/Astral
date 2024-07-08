import { unfuck } from "@/lib/utils";
import { streamerClientManager } from "client/streamer_client";
import React from "react";

export function InputFrame(props) {
  let extraClasses = props.className || "";
  
  let client = streamerClientManager.allocate(props.sid, props.options || {});
  
  /**
   * Send key state change
   *
   * @param {KeyboardEvent} ev
   * @param {boolean} state
   */
  function onKeyStateChange(ev, state){
    client.sendReliable({
      type: "keychange",
      key: ev.key,
      code: ev.code,
      composition: ev.isComposing,
      state: state,
    });
  }

  /**
   * Handles key down events (down)
   * @param {KeyboardEvent} ev
   */
  function onKeyDown(ev){
    ev.preventDefault();
    onKeyStateChange(ev, true);
  }

   /**
   * Handles key down events (up/release)
   * @param {KeyboardEvent} ev
   */
  function onKeyUp(ev){
    ev.preventDefault();
    onKeyStateChange(ev, false);
  }

  return (
    <div className={"w-auto h-auto" + extraClasses} style={props.style} onKeyDown={unfuck(onKeyDown)} onKeyUp={unfuck(onKeyUp)}>
       {props.children}
    </div>
  );
}