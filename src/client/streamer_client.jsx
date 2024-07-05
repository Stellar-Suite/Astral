import { io } from "socket.io-client";
import { getApiUrl } from "utils/api";
import { getJwt } from "utils/login";

class StreamerPeerConnection {
    constructor(sid, options){
        this.sid = sid;
        this.options = options;
    }

    socketConnectedOnce = false;
    socket;

    onSocketFirstConnect() {
        if(getJwt()){
            this.socket.emit("jwt", getJwt());
        }else{
            console.warn("socket did not auth because we have no jwt creds");
        }
    }

    onSocketConnect() {
    }

    start() {
        this.socket = io(getApiUrl());
        this.socket.on("connect", () => {
            if(!this.socketConnectedOnce){
                this.onSocketFirstConnect();
            }
            this.onSocketConnect();
        });
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

    }

    stop() {
        
    }
}