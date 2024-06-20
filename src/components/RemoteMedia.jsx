import React from 'react';
import socket from "../utils/socket";
import {bulkSocketManager} from "../utils/socket";

export function RemoteMedia(props){
    let domElementRef = React.useRef(null);

    let type = props.type || "video";
    let sid = props.sid;
    let socket = bulkSocketManager.getSocket(sid + ":" + type);

    function send_to_daemon(data){
        socket.emit("send_to_session", sid, data);
    }

    React.useEffect(() => {

        function doInit(){
            send_to_daemon({
                rtc_provision_start: Date.now()
            });
        }

        let peer_connection = new RTCPeerConnection({
            iceServers: [
                {
                    urls: "stun:stun.l.google.com:19302"
                }
            ],
            bundlePolicy: "max-bundle"
        });

        peer_connection.addEventListener('icecandidate', (event) => {
            send_to_daemon({
                canidate: event.candidate.candidate,
                sdpMLineIndex: event.candidate.sdpMLineIndex,
                ...event.candidate
            })
        });

        

        let initHandler = (success) => {
            if(success){
                socket.emit("join_session", sid);
                socket.authed = true;
                doInit();
            }
        }

        if(socket.authed){
            doInit();
        }

        socket.on("authed", initHandler);
        return () => {
            socket.off("authed", initHandler);
        }
    }, []);
    if(type == "audio"){
        return <>
            <audio className="remote-audio w-full h-full" ref={domElementRef}></audio>
        </>
    }else{
        return <>
            <video className="remote-video w-full h-full" ref={domElementRef}></video>
        </>
    }
}

export default RemoteMedia;