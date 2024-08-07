import { unfuck } from "../@/lib/utils";
import { streamerClientManager } from "../client/streamer_client";
import React from "react";

export function InputFrame(props) {
  let extraClasses = props.className || "";
  
  let client = streamerClientManager.allocate(props.sid, props.options || {}, false);

  let selfRef = React.useRef(null);
  
  /**
   * Send key state change
   *
   * @param {KeyboardEvent} ev
   * @param {boolean} state
   */
  function onKeyStateChange(ev, state){
    console.log("key state change send",client.sendReliable({
      "keychange": {
        key: ev.key,
        code: ev.code,
        composition: ev.isComposing || false,
        state: state,
        timestamp: Date.now()
      }
    }));
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

  function onMouseMotion(ev){
    console.log("mouse motion",ev);
    let streamSettings = null;
    if(!client.video || !client.video.tracks || !client.video.tracks[0]){
      console.warn("no video track for mouse input calculations");
    }else{
      streamSettings = client.video.tracks[0].getSettings();
    }
    // TODO: add mouse lock logic
    // taken from ZW (private repo of personal project)
    if(selfRef.current){
      let offsetLeft = selfRef.current.offsetLeft;
      let offsetTop = selfRef.current.offsetTop;
      let x = ev.clientX - offsetLeft;
      let y = ev.clientY - offsetTop;

      // pov people like to use the browser zoom tools
      if(streamSettings && !props.disableAutoScaling){
        x = x * (streamSettings.width / selfRef.current.clientWidth);
        y = y * (streamSettings.height / selfRef.current.clientHeight);
      }

      const isLocked = document.pointerLockElement ? true : false;
      // TODO: if it's locked start sending relative
      if(isLocked){
        client.sendUnreliable({
          "mouse_rel": {
            x: Math.floor(ev.movementX),
            y: Math.floor(ev.movementY),
            timestamp: Date.now(),
            absolute_x: Math.floor(x),
            absolute_y: Math.floor(y)
          }
        });
      }else{
        client.sendUnreliable({
          "mouse_abs": {
            x: Math.floor(x),
            y: Math.floor(y),
            timestamp: Date.now()
          }
        });
      }

    }else{
      console.warn("mouse motion without ref to self");
    }
  }

  // TODO: lock useEffect

  function onMouseButton(ev, state){
    console.log("mouse button",ev, state);
    client.sendReliable({
      "mouse_btn": {
        change: 1 << ev.button,
        buttons: ev.buttons,
        state: state,
        timestamp: Date.now()
      }
    });
  }

  const listeners = {}

  if(props.mousebutton || "mousebutton" in props){
    listeners.onMouseDown = unfuck((ev) => {
      onMouseButton(ev, true);
    });
    listeners.onMouseUp = unfuck((ev) => {
      onMouseButton(ev, false);
    });
  }
  if(props.mouse || "mouse" in props){
    listeners.onMouseMove = unfuck(onMouseMotion);
    listeners.onMouseLeave = unfuck(onMouseMotion);
    listeners.onMouseEnter = unfuck(onMouseMotion);
    // listeners.onMouseOver = unfuck(onMouseMotion);
    // listeners.onMouseOut = unfuck(onMouseMotion);
  }

  return (
    <div className={"w-auto h-auto input-frame " + extraClasses} style={props.style} onKeyDown={unfuck(onKeyDown)} onKeyUp={unfuck(onKeyUp)} tabIndex={0} {...listeners} ref={selfRef}>
       {props.children}
    </div>
  );
}