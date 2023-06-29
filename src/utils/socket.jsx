import {io} from "socket.io-client";
import { getApiUrl } from "./api";
import { getJwt } from "./login";

export let socket;

export function recreateSocket(){
    socket = io(getApiUrl());
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

export default socket;