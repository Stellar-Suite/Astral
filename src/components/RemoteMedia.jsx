import React from 'react';
import socket, { bulkPeerConnectionManager } from "../utils/socket";
import {bulkSocketManager} from "../utils/socket";
import adapter from 'webrtc-adapter';

function modifySdp(sdp){
    const banned = [
     //   "a=framerate",
        "a=fmtp",
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
    });
    return lines.join("\r\n");
}

export function RemoteMedia(props){
    let domElementRef = React.useRef(null);

    let type = props.type || "video";
    let sid = props.sid;
    let key = props.key || (sid + ":" + type);
    let socket = bulkSocketManager.getSocket(key);

    function send_to_daemon(data){
        socket.emit("send_to_session", sid, data);
    }
    // for debugging
    window["send_to_daemon"] = send_to_daemon;

    console.log("Rendering remote media", type, sid);
    function startManualOffer(){
        send_to_daemon({
            offer_request_source: "client"
        });
    }

    function forcePlay(){
        domElementRef.current.play();
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
        let sent_ice_canidates = 0;
        let recv_ice_canidates = 0;

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

        const updateStatus = async () => {
            let report = "Realtime connection not established yet.";
            if(peer_connection){
                let stats = await peer_connection.getStats();
                // console.log("Stats", stats);
                report = `Current ICE Connection State: ${peer_connection.iceConnectionState}\n`;
                report += `ICE Gathering State: ${peer_connection.iceGatheringState}\n`;
                report += `ICE Selection State: ${peer_connection.iceConnectionState}\n`;
                report += `Signaling State: ${peer_connection.signalingState}\n`;
                report += `Peer Connection State: ${peer_connection.connectionState}\n`;
                if(peer_connection.localDescription){
                    report += `Local Description: ${peer_connection.localDescription.sdp}\n`;
                }else{
                    report += `Local Description: null\n`;
                }
                if(peer_connection.remoteDescription){
                    report += `Remote Description: ${peer_connection.remoteDescription.sdp}\n`;
                }else{
                    report += `Remote Description: null\n`;
                }
                report += "Stats:\n";
                stats.forEach((stat) => {
                    // self-note: the key here shadows the actual key
                    Object.keys(stat).forEach((key) => {
                        report += `${key}: ${stat[key]}\n`;
                    });
                });    
            }
            
            // console.log(props);
            if(props.onStatusUpdate){
                props.onStatusUpdate(report);
            }
            // console.log(report);
        }
        
        let updateInterval = setInterval(updateStatus, 100);

        const peerHandler = async (peerId, data) => {
            console.log("peer message",peerId, data);
            if(data.provision_ok) {
                console.log("Provision ok making rtcpeerconnection");
               
                peer_connection = bulkPeerConnectionManager.setPeerConnection(key, new RTCPeerConnection({
                    // if more are needed
                    // https://github.com/adrigardi90/video-chat/blob/master/src/utils/ICEServers.js
                    iceServers: [
                       {
                            urls: "stun:stun.l.google.com:19302"
                        }
                        // TODO: add turn server for puiblic beta
                    ],
                    // bundlePolicy: "max-bundle",
                    iceTransportPolicy: "all",
                }));

                const dataChannel = bulkPeerConnectionManager.ensureDataChannel(key);
                dataChannel.addEventListener("open", () => {
                    console.log("Data channel open");
                });

                if(props.onPeerConnection){
                    props.onPeerConnection(peer_connection);
                }
                

                peer_connection.addEventListener('icecandidate', (event) => {
                    console.log("local icecandidate", event);
                    let candidate = event.candidate;
                    sent_ice_canidates ++;
                    if(!candidate){
                        // @ts-ignore
                        candidate = {
                            candidate: "",
                            sdpMLineIndex: 0
                        }
                    }else if(candidate.candidate == "" || candidate.candidate == null){
                        // @ts-ignore
                        candidate = {
                            candidate: "",
                            sdpMLineIndex: 0
                        }
                    }
                    if(candidate.candidate == ""){
                        console.warn("Empty candidate means no more from client");
                    }
                    send_to_daemon({
                        ...candidate
                    });
                    
                    updateStatus();
                });

                peer_connection.addEventListener('iceconnectionstatechange', (event) => {
                    console.log("iceconnectionstatechange", event);
                    updateStatus();
                });

                peer_connection.addEventListener('connectionstatechange', (event) => {
                    console.log("connectionstatechange", event);
                    updateStatus();
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
                    updateStatus();
                });

                peer_connection.addEventListener("signalingstatechange", (event) => {
                    console.log("signalingstatechange", event);
                    updateStatus();
                });

                peer_connection.addEventListener("close", (ev) => {
                    console.log("Peer connection closed...", ev);
                    peer_connection = null;
                });

                // TODO: client make offer? not sure if useful?
                
                // old race condition testing code
                /*setTimeout(() => {
                    startManualOffer()
                }, 1000);*/

                startManualOffer();

                // starts stuff
                

            }else if("candidate" in data){
                console.log("remote candidate",data.candidate);
                if(data.candidate == ""){
                    console.warn("Empty candidate means no more");
                }
                recv_ice_canidates ++;
                peer_connection.addIceCandidate(new RTCIceCandidate(data));
                updateStatus();
            }else if("sdp" in data){
                try{
                    if(data.type == "offer"){
                        data.sdp = modifySdp(data.sdp);
                        window["remoteOffer"] = data;
                        await peer_connection.setRemoteDescription(data);
                        console.log("Creating answer");
                        let answer = await peer_connection.createAnswer();
                        window["localAnswer"] = answer;
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
            if(peer_connection){
                console.log("Closing peer connection");
                peer_connection.close();
            }
            console.log("Removing event listeners");
            socket.off("authed", initHandler);
            socket.off("peer_message", peerHandler);
            clearInterval(updateInterval);
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