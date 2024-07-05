import React from 'react';
import socket, { bulkPeerConnectionManager } from "../utils/socket";
import {bulkSocketManager} from "../utils/socket";
import adapter from 'webrtc-adapter';
import { streamerClientManager } from '../client/streamer_client';

export function RemoteMedia(props){
    let domElementRef = React.useRef(null);

    let type = props.type || "video";
    let sid = props.sid;
    let key = props.key || (sid + ":" + type);
    let socket = bulkSocketManager.getSocket(key);

    function forcePlay(){
        domElementRef.current.play();
    }

    React.useEffect(() => {
        
        const client = streamerClientManager.allocate(sid, props.options);
        const conn = props.type == "audio" ? client.audio : client.video;
        // TODO: handle audio
        conn.addEventListener("streams_changed", (ev) => {
            console.log("streams changed", ev);
            domElementRef.current.srcObject = conn.getStream();
        });

        if(client.video.getStream()){
            domElementRef.current.srcObject = conn.getStream();
        } else {
            console.log("No stream yet");
        }

        return () => {
            streamerClientManager.deallocate(sid);
        }
    }, []);
    if(type == "audio"){
        return <div className = "w-full h-full m-0 p-0 bg-green-800" onClick = {forcePlay}>
            <audio className="remote-audio w-full h-full" ref={domElementRef}></audio>
        </div>;
    }else{
        return <div className = "w-full h-full m-0 p-0 bg-green-800" onClick = {forcePlay}>
            <video className="remote-video w-full h-full" ref={domElementRef} controls></video>
        </div>;
    }
}

export default RemoteMedia;