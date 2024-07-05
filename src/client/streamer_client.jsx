import { Socket, io } from "socket.io-client";
import { getApiUrl } from "utils/api";
import { getJwt } from "utils/login";

const defaultRtcConfig = {
    // if more are needed
    // https://github.com/adrigardi90/video-chat/blob/master/src/utils/ICEServers.js
    iceServers: [
       {
            urls: "stun:stun.l.google.com:19302"
        }
        // TODO: add turn server for puiblic beta
    ],
    // bundlePolicy: "max-bundle",
    // iceTransportPolicy: "all",
};

class StreamerPeerConnection {
    constructor(sid, options){
        this.sid = sid;
        this.options = options;
    }

    socketConnectedOnce = false;
    /**
     * @type {Socket}
     *
     * @memberof StreamerPeerConnection
     */
    socket;
    /**
     * @type {RTCPeerConnection}
     *
     * @memberof StreamerPeerConnection
     */
    peerConnection;

    onSocketFirstConnect() {
        if(getJwt()){
            this.socket.emit("jwt", getJwt());
        }else{
            console.warn("socket did not auth because we have no jwt creds");
        }
    }

    onSocketConnect() {
        // redundant mb?
        if(getJwt()){
            this.socket.emit("jwt", getJwt());
        }else{
            console.warn("socket did not auth because we have no jwt creds");
        }
    }

    sendToDaemon(data){
        this.socket.emit("send_to_session", this.sid, data);
    }

    onAuthenticateOk(){
        this.sendToDaemon({
            rtc_provision_start: Date.now()
        });
    }

    initPeerConnection(){
        this.peerConnection = new RTCPeerConnection(this.options.rtcConfig || defaultRtcConfig);
        
    }

    handlePeerMessage(peerId, data){
        console.log("peer message",peerId, data);
        if(data.provision_ok) {
            if(!this.peerConnection){
                this.initPeerConnection();
            }
        }
    }

    start() {
        this.socket = io(getApiUrl());
        this.socket.on("connect", () => {
            if(!this.socketConnectedOnce){
                this.onSocketFirstConnect();
            }
            this.onSocketConnect();
        });

        this.socket.on("peer_message", this.handlePeerMessage.bind(this));
    }

    parent = null;
}

class StreamerClient {
    constructor(sid, options){
        this.sid = sid;
        this.options = options;
        this.video = new StreamerPeerConnection(sid, options);
        this.audio = new StreamerPeerConnection(sid, options);
    }

    start() {
        this.video.start();
    }

    stop() {
        this.video.stop();
    }
}