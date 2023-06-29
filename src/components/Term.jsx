import React from 'react';

import { Terminal } from 'xterm';
import {FitAddon} from "xterm-addon-fit"

import socket from "../utils/socket";
import {subscribe, unsubscribe} from "../utils/socket";

import "xterm/css/xterm.css";

export function Term(props){
    let domElementRef = React.useRef(null);

    let channel = props.channel || "term";

    React.useEffect(() => {
        let term = new Terminal({
            cursorBlink: true,
            cursorStyle: "block"
        });
        let fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        // term.open(iframeElementRef.current.contentDocument.body);
        term.open(domElementRef.current);
        let xtermEl = domElementRef.current.children[0];
        /*console.log("Apply mods",xtermEl);
        xtermEl.classList.add("w-full");
        xtermEl.classList.add("h-full");
        xtermEl.classList.add("min-w-full");
        xtermEl.classList.add("min-h-full");*/
        fitAddon.fit();

        function onResize(){
            fitAddon.fit();
        }

        window.addEventListener("resize", onResize);

        function writeData(data){
            term.write(new Uint8Array(data));
        }

        subscribe(channel, writeData);

        return () => {
            window.removeEventListener("resize", onResize);
            unsubscribe(channel, writeData);
            term.dispose();
        }
    }, []);

    return <>
        <div className="xterm w-full h-full" ref={domElementRef}></div>
    </>
}