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