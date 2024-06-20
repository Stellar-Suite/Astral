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

        let peer_connection;

        const initHandler = (success) => {
            if(success){
                socket.emit("join_session", sid);
                socket.authed = true;
                doInit();
            }
            socket.on("error", (message) => {
                console.warn("Server sent an error: " + message);
            });
        };

        const peerHandler = (peerId, data) => {
            if(data.provision_ok) {
                peer_connection = new RTCPeerConnection({
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
                    });
                });
            }else if(data.canidate){
                console.log(data.canidate);
                peer_connection.addIceCandidate(new RTCIceCandidate(data.canidate))
            }else if(data.sdp){
                if(data.type == "offer"){
                    peer_connection.setRemoteDescription(data);
                }else if(data.type == "answer"){
                    peer_connection.setRemoteDescription(data);
                }
            }
        };

        if(socket.authed){
            doInit();
        }

        socket.on("authed", initHandler);
        socket.on("peer_message", peerHandler);
        return () => {
            socket.off("authed", initHandler);
            socket.off("peer_message", peerHandler);
        }
    }, []);
    if(type == "audio"){
        return <div className = "w-full h-full m-0 p-0 bg-green-800">
            <audio className="remote-audio w-full h-full" ref={domElementRef}></audio>
        </div>;
    }else{
        return <div className = "w-full h-full m-0 p-0 bg-green-800">
            <video className="remote-video w-full h-full" ref={domElementRef}></video>
        </div>;
    }
}

export default RemoteMedia;