import {io} from "socket.io-client";
import { getApiUrl } from "./api";
import { getJwt, logout } from "./login";

export let socket;

export function recreateSocket(){
    socket = io(getApiUrl());
    socket.on("invalidToken", (shouldLogout) => {
        if(shouldLogout){
            logout();
        }
    });
    socket.on("connect", () => {
        console.log("socket connected");
        if(getJwt()){
            socket.emit("jwt", getJwt());
        }
    });
}

recreateSocket();

export function joinChannels(...channels){
    socket.emit("join_channel", channels);
}

export function leaveChannels(...channels){
    socket.emit("leave_channel", channels);
}

export function subscribe(channel, cb){
    joinChannels(channel);
    socket.on(channel, cb);
}

export function unsubscribe(channel, cb){
    leaveChannels(channel);
    socket.off(channel, cb);
}

class BulkSocketManager {
    sockets = new Map();
    constructor(){

    }

    getSocket(name){
        if(!this.sockets.has(name)){
            this.sockets.set(name, io(getApiUrl()));
            this.sockets.get(name).on("connect", () => {
                console.log("new socket connected", name);
                if(getJwt()){
                    this.sockets.get(name).emit("jwt", getJwt());
                }
            });
        }
        return this.sockets.get(name);
    }
}

// screw react context for now, why context when you can global variable

export const bulkSocketManager = new BulkSocketManager();

export default socket;

export class BulkPeerConnectionManager {
    peerConnections = new Map();
    dataChannels = new Map();
    constructor(){

    }

    closeAll(){
        for(let [name, peerConnection] of this.peerConnections){
            peerConnection.close();
        }
        this.peerConnections.clear();
        this.dataChannels.clear();
    }

    /**
     * 
     * @param {string} name
     * @param {RTCPeerConnection} peerConnection
     * @return {RTCPeerConnection} 
     * @memberof BulkPeerConnectionManager
     */
    setPeerConnection(name, peerConnection){
        if(this.peerConnections.has(name)){
            console.log("closing old peer connection for", name);
            this.peerConnections.get(name).close();
        }
        this.peerConnections.set(name, peerConnection);
        this.dataChannels.set(name, []);
        // delete on close
        peerConnection.addEventListener("connectionstatechange", (ev) => {
            if(peerConnection.connectionState === "closed" || peerConnection.connectionState == "failed" || peerConnection.connectionState == "disconnected"){
                this.peerConnections.delete(name);
                this.dataChannels.delete(name);
            }
        });
        return peerConnection;
    }

    pushDataChannel(name, dataChannel){
        if(!this.dataChannels.has(name)){
            this.dataChannels.set(name, []);
        }
        this.dataChannels.get(name).push(dataChannel);
    }

    /**
     * 
     *
     * @param {string} name
     * @return {RTCDataChannel} 
     * @memberof BulkPeerConnectionManager
     */
    ensureDataChannel(name) {
        if(this.dataChannels.get(name).length === 0){
            let dataChannel = this.peerConnections.get(name).createDataChannel("dataChannel");
            this.pushDataChannel(name, dataChannel);
        }
        return this.dataChannels.get(name)[0];
    }

    getPeerConnection(name){
        return this.peerConnections.get(name);
    }
}

export const bulkPeerConnectionManager = new BulkPeerConnectionManager();