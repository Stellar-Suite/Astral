import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

import React from "react";

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * I will no longeer waste time on typescript gaslighting me on a project which I asked to use jsx on
 * I am a human and do not like fighting with things outside my control
 * github issue: https://github.com/radix-ui/primitives/issues/2309
 * @export
 * @param {any} inp
 * @return {any} 
 */
export function unfuck(inp){
  return inp;
}

export function modifySdpHack(sdp){
  const banned = [
   //   "a=framerate",
   //   "a=fmtp",
   //   "a=ssrc",
  ];
  let lines = sdp.split("\r\n");
  lines = lines.filter((line) => {
      for(let bannedSeq of banned){
          if(line.startsWith(bannedSeq)){
              return false;
          }
      }
      return true;
  }).map((line) => {
    if(line.startsWith("a=fmtp")){
      // parse in ugly way
      const split = line.split(" ");
      const props = split[1].split(";");
      const newProps = props.filter((prop) => {
        if(prop.startsWith("sprop-parameter-sets")){
          return false;
        }else if(prop.startsWith("profile-level-id")){
          return false;
        }
        return true;
      });
      split[1] = newProps.join(";");
      line = split.join(" ");
    }
    return line;
  });
  return lines.join("\r\n");
}