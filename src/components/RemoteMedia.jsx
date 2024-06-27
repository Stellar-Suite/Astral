import React from 'react';
import socket from "../utils/socket";
import {bulkSocketManager} from "../utils/socket";
import adapter from 'webrtc-adapter';

export function RemoteMedia(props){
    let domElementRef = React.useRef(null);

    let type = props.type || "video";
    let sid = props.sid;
    let socket = bulkSocketManager.getSocket(sid + ":" + type);

    function send_to_daemon(data){
        socket.emit("send_to_session", sid, data);
    }

    console.log("Rendering remote media", type, sid);

    function forcePlay(){
        domElementRef.current.play();
    }

    function startManualOffer(){
        send_to_daemon({
            offer_request_source: "client"
        });
    }

    React.useEffect(() => {
        function doInit(){
            console.log("provisioning rtc");
            send_to_daemon({
                rtc_provision_start: Date.now()
            });
        }

        /** @type {RTCPeerConnection} */
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

        const peerHandler = async (peerId, data) => {
            console.log("peer message",peerId, data);
            if(data.provision_ok) {
                console.log("Provision ok making rtcpeerconnection");
                peer_connection = new RTCPeerConnection({
                    iceServers: [
                        {
                            urls: "stun:stun.l.google.com:19302"
                        }
                    ],
                    iceTransportPolicy: "all",
                });

                peer_connection.addEventListener('icecandidate', (event) => {
                    console.log("icecandidate", event);
                    send_to_daemon({
                        ...event.candidate
                    });
                   
                });

                peer_connection.addEventListener('iceconnectionstatechange', (event) => {
                    console.log("iceconnectionstatechange", event);
                });

                peer_connection.addEventListener('connectionstatechange', (event) => {
                    console.log("connectionstatechange", event);
                });

                peer_connection.addEventListener('datachannel', (event) => {
                    console.log("datachannel", event);
                });

                peer_connection.addEventListener('track', (event) => {
                    console.log("track", event);
                    // TODO: filter by audio/video
                    domElementRef.current.srcObject = event.streams[0];
                    try{
                        domElementRef.current.play();
                    }catch(ex){
                        console.warn("Error playing stream", ex);
                        // prompt for manual click
                    }
                });

                // TODO: client make offer? not sure if useful?
                startManualOffer();

                // starts stuff
                

            }else if(data.candidate){
                console.log(data.candidate);
                peer_connection.addIceCandidate(new RTCIceCandidate(data));
            }else if(data.sdp){
                try{
                    if(data.type == "offer"){
                        await peer_connection.setRemoteDescription(data);
                        console.log("Creating answer");
                        let answer = await peer_connection.createAnswer()
                        console.log("Setting local desc",answer);
                        await peer_connection.setLocalDescription(answer);
                        console.log("Sending answer",answer);
                        send_to_daemon(answer); // already has sdp + type field
                    }else if(data.type == "answer"){
                        peer_connection.setRemoteDescription(data);
                    }
                }catch(ex){
                    console.warn("SDP handling failed", ex);
                }
            }
        };

        if(socket.authed){
            doInit();
        }
        console.log("Adding event listeners");
        socket.on("authed", initHandler);
        socket.on("peer_message", peerHandler);
        return () => {
            console.log("Removing event listeners");
            socket.off("authed", initHandler);
            socket.off("peer_message", peerHandler);
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