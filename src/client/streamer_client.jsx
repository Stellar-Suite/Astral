import { modifySdpHack } from "../@/lib/utils";
import { Socket, connect, io } from "socket.io-client";
import { getApiUrl } from "../utils/api";
import { getJwt } from "../utils/login";
import _ from "lodash";
import {nanoid} from "nanoid";
import { Database } from "lucide-react";

export const defaultRtcConfig = {
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

export class StreamerPeerConnection extends EventTarget {
    constructor(sid, options = {}, type = "video"){
        super();
        this.sid = sid;
        this.options = options;
        this.type = type;
        this.dataChannels = {};
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

    /**
     * @type {MediaStreamTrack[]}
     *
     * @memberof StreamerPeerConnection
     */
    tracks = [];
    /**
     * @type {MediaStream[]}
     *
     * @memberof StreamerPeerConnection
     */
    streams = [];

    onSocketFirstConnect() {
        /*if(getJwt()){
            this.socket.emit("jwt", getJwt());
        }else{
            console.warn("socket did not auth because we have no jwt creds");
        }*/
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

    onAuthenticateOk(data){
        console.warn("Authenticated, now requesting rtc session");
        this.sendToDaemon({
            rtc_provision_start: Date.now()
        });
    }

    async initPeerConnection(){
        this.peerConnection = new RTCPeerConnection(this.options.rtcConfig || defaultRtcConfig);
        this.peerConnection.addEventListener("icecandidate", this.onIceCandidate.bind(this));
        this.peerConnection.addEventListener("datachannel", this.onDataChannel.bind(this));
        this.peerConnection.addEventListener("connectionstatechange", this.onConnectionStateChange.bind(this));
        this.peerConnection.addEventListener("iceconnectionstatechange", this.onIceConnectionStateChange.bind(this));
        this.peerConnection.addEventListener("signalingstatechange", this.onSignalingStateChange.bind(this));
        this.peerConnection.addEventListener("negotiationneeded", this.onNegotiationNeeded.bind(this));
        this.peerConnection.addEventListener("track", this.onTrack.bind(this));
        // create data channels
        this.dataChannels = {
            /*reliable: this.peerConnection.createDataChannel("reliable", {
                ordered: true,
                negotiated: false
            }),
            unreliable: this.peerConnection.createDataChannel("reliable", {
                ordered: false,
                maxRetransmits: 0,
                negotiated: false
            }),*/
        };
        /*this.transciever = this.peerConnection.addTransceiver(this.type, {
            direction: "recvonly"
        });*/
        /*Object.values(this.dataChannels).forEach((channel) => {
            channel.addEventListener("message", this.onDataChannelMessage.bind(this));
            channel.addEventListener("open", this.onDataChannelOpen.bind(this));
            channel.addEventListener("error", this.onDataChannelError.bind(this));
        });*/
        // experiment
        // this.peerConnection.createOffer().then(console.log);
        
        // await this.startManualRenegotiate();
        this.requestManualOfferFromServer();
    }

    onError(event){

    }

     /**
     * Fired when a data channel is created
     *
     * @param {RTCDataChannelEvent} event
     * @memberof StreamerPeerConnection
     */
     onDataChannel(event){
        console.log("data channel created", event);
        this.dataChannels[event.channel.label] = event.channel;
        const channel = event.channel;
        event.channel.addEventListener("message", (event) => {
            this.onDataChannelMessage(event, channel);
        });
        event.channel.addEventListener("open", this.onDataChannelOpen.bind(this));
        event.channel.addEventListener("error", this.onDataChannelError.bind(this));
    }

    /**
     *
     * @param {MessageEvent} event
     * @memberof StreamerPeerConnection
     */
    onDataChannelMessage(event, channel){
        console.log("data channel message", event);
        this.dispatchEvent(new CustomEvent("data_channel_message", {
            detail: {
                channel: channel,
                data: event.data
            }
        }));

        if(this.parent){
            this.parent.dispatchEvent(new CustomEvent("data_channel_message", {
                detail: {
                    channel: channel,
                    data: event.data
                }
            }));
        }
    }

    onDataChannelError(event){
        console.warn("data channel error", event);
    }

   
    onDataChannelOpen(event){
        console.log("data channel open", event);
    }

    onDataChannelClose(event){
    }

    requestManualOfferFromServer(){
        console.log("starting manual offer");
        this.sendToDaemon({
            offer_request_source: "client"
        });
    }

    onIceCandidate(event){
        // noramlize
        let iceCandidate = event.candidate || {
            candidate: "",
            sdpMLineIndex: 0
        };
        if(iceCandidate.candidate == null){
            iceCandidate.candidate = "";
        }
        this.sendToDaemon(iceCandidate);
    }

    getStream(){
        return this.streams.find((stream) => stream.active);
    }

    onConnectionStateChange(event){
        console.log("connection state change", event);
    }

    onIceConnectionStateChange(event){
        console.log("ice connection state change", event);
    }

    onSignalingStateChange(event){
        console.log("signaling state change", event);
    }

    onNegotiationNeeded(event){
        console.log("negotiation needed", event);
        // this.startManualOffer();
        this.startManualRenegotiate();
    }

    async startManualRenegotiate(){
        await this.peerConnection.setLocalDescription();
        // let desc = this.peerConnection.localDescription;
        // this.sendToDaemon(desc);
        // let offer = await this.peerConnection.createOffer();
        let offer = this.peerConnection.localDescription;
        await this.peerConnection.setLocalDescription(offer);
        let desc = this.peerConnection.localDescription;
        console.log("manual local offer", desc, offer);
        // one of this will work
        this.sendToDaemon(offer);
        // this.sendToDaemon(desc);
    }

    /**
     *
     * @param {RTCTrackEvent} event
     * @memberof StreamerPeerConnection
     */
    onTrack(event){
        console.log("track", event);
        this.tracks.push(event.track);
        this.streams.push(...event.streams);
        this.dispatchEvent(new CustomEvent("track", {
            detail: {
                track: event.track,
                streams: event.streams
            }
        }));
        this.dispatchEvent(new CustomEvent("streams_changed", {
            detail: {
                track: event.track,
                streams: event.streams
            }
        }));
    }

    /**
     *
     * @return {RTCDataChannel} 
     * @memberof StreamerPeerConnection
     */
    getReliableDataChannel(){
        return this.dataChannels.reliable;
    }

    /**
     *
     * @return {RTCDataChannel} 
     * @memberof StreamerPeerConnection
     */
    getUnreliableDataChannel(){
        return this.dataChannels.unreliable;
    }

    async onRemoteCandidate(data){
        console.log("remote candidate",data.candidate);
        if(data.candidate == ""){
            console.warn("Empty candidate means no more");
        }
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(data));
    }

    async onRemoteSdp(data){
        if(this.processingSdp){
            console.warn("Already processing sdp...race detected.");
        }
        this.processingSdp = true;
        try{
            if(data.type == "offer"){
                data.sdp = modifySdpHack(data.sdp);
                console.log("Remote Offer")
                console.log(data.sdp);
                await this.peerConnection.setRemoteDescription(data);
                console.log("Creating answer");
                // let answer = await this.peerConnection.createAnswer();
                await this.peerConnection.setLocalDescription();
                let answer = this.peerConnection.localDescription;
                window["localAnswer"] = answer;
                console.log("Setting local desc",answer);
                // await this.peerConnection.setLocalDescription(answer);
                console.log("Sending answer");
                console.log(answer.sdp);
                this.sendToDaemon(answer); // already has sdp + type field
            }else if(data.type == "answer"){
                console.log("Remote answered", data);
                await this.peerConnection.setRemoteDescription(data);
                // await this.requestManualOfferFromServer();
            }
        }catch(ex){
            console.warn("SDP handling failed", ex);
        }
        this.processingSdp = false;
    }

    processingSdp = false;

    async handlePeerMessage(peerId, data){
        console.log("new peer message on connection",peerId, data);
        this.dispatchEvent(new CustomEvent("peer_message", {
            detail: {
                peerId,
                data
            }
        }));
        if(data.provision_ok) {
            if(!this.peerConnection){
                console.log("initalizing peer connection");
                this.initPeerConnection();
            } else {
                console.warn("Already have peer connection, ignoring provision_ok");
            }
        }else if("candidate" in data){
            await this.onRemoteCandidate(data);
        }else if("sdp" in data){
            await this.onRemoteSdp(data);
        }
    }

    start() {
        this.socket = io(getApiUrl());
        this.socket.on("peer_message", this.handlePeerMessage.bind(this));
        this.socket.on("authed", this.onAuthenticateOk.bind(this));
        this.socket.on("connect", () => {
            if(!this.socketConnectedOnce){
                this.onSocketFirstConnect();
            }
            this.onSocketConnect();
        });

        
    }

    stop() {
        this.socket.close();
        if(this.peerConnection){
            this.peerConnection.close();
        }
    }

    parent = null;
}

/**
 * Gamepad management helper that works outside of React
 * @export
 * @class GamepadHelper
 * @extends {EventTarget}
 */
export class GamepadHelper extends EventTarget {
    enabled = false;
    constructor(client) {
        super();
        this.enabled = false;
        /**
         * @type {Gamepad[]}
         */
        this.gamepads = [];
        /**
         * @type {StreamerClient}
         */
        this.client = client;
        this.onGamepadConnectedBinded = this.onGamepadConnected.bind(this);
        this.onGamepadDisconnectedBinded = this.onGamepadDisconnected.bind(this);
        this.gamepadMetadata = {};
        this.requestAnimationTickBinded = this.requestAnimationTick.bind(this);
        this.pendingGamepadPromiseResolves = {};
        this.onDataChannelMessageBinded = this.onDataChannelMessage.bind(this);
    }

    /**
     *
     * @param {GamepadEvent} event
     * @memberof GamepadHelper
     */
    onGamepadConnected(event){
        console.log("gamepad connected", event);
        this.gamepadMetadata[event.gamepad.index] = {
            gamepad: event.gamepad,
            id: event.gamepad.id,
            local_id: nanoid(),
            syncing: false,
            connecting: false,
            lastTick: 0,
            lastSent: {},
            product_type: this.guessVendor(event.gamepad)
        };
        this.gamepads.push(event.gamepad);
        this.dispatchEvent(new CustomEvent("gamepadMutation"));
    }

    attachToRemote(gamepadDesc){
        let metadata = this.gamepadMetadata[gamepadDesc.index];
        let gamepad = this.gamepads.find((gamepad) => gamepadDesc.index == gamepad.index);
        if(metadata.syncing || metadata.connecting){
            return;
        }
        metadata.connecting = true;
        this.client.sendReliable({
            "add_gamepad": {
                local_id: metadata.local_id,
                product_type: metadata.product_type,
                hats: 0,
                axes: gamepad.axes.length,
                buttons: gamepad.buttons.length
            }
        });
        // send to server
        return (new Promise((resolve, reject) => {
            this.pendingGamepadPromiseResolves[metadata.local_id] = resolve;
            setTimeout(() => {
                if(this.pendingGamepadPromiseResolves[metadata.local_id]){
                    console.log(metadata.local_id, " attach timeout reached.");
                    delete this.pendingGamepadPromiseResolves[metadata.local_id];
                    metadata.connecting = false;
                    metadata.syncing = false;
                    reject("Host timeout reached.");
                }
            }, 5000);
        }));
    }

    guessVendor(gamepad){
        if(gamepad.id.includes("Microsoft") || gamepad.id.toLowerCase().includes("xbox")){
            // TODO: add smarter detection
            // because Xbox one controllers exist and I have one
            return "Xbox360";
        }
        return "unknown";
    }

    /**
     *
     * @param {Gamepad} gamepad
     * @memberof GamepadHelper
     */
    serializeGamepad(gamepad, metadata){
        return {
            id: gamepad.id,
            remote_id: metadata.remote_id,
            index: gamepad.index,
            timestamp: gamepad.timestamp,
            axes: gamepad.axes.slice(),
            buttons: gamepad.buttons.map((button) => {
                return {
                    pressed: button.pressed,
                    touched: button.touched,
                    value: button.value
                }
            }),
            mapping: gamepad.mapping,
            connected: gamepad.connected,
            product_type: metadata.product_type
        }
    }

    /**
     *
     * @param {Gamepad} gamepad
     * @param {*} metadata
     * @return {*} 
     * @memberof GamepadHelper
     */
    serializeGamepadForServer(gamepad, metadata){
        let axes = gamepad.axes.slice();
        if(gamepad.buttons.length > 7 && axes.length < 4){
            // aritifcally add L2 and R2 triggers
            axes.push(gamepad.buttons[6].value, gamepad.buttons[7].value);
        }
        return {
            remote_id: metadata.remote_id,
            timestamp: gamepad.timestamp,
            axes: axes,
            buttons: gamepad.buttons.map((button) => {
                return button.pressed;
            }),
            hats: []
        }
    }

    // TODO: ask server to generate ids

    getLatestGamepads(){
        // navigator gamepad prepopulates with [null,null,null,null] which breaks our forEach.
        if(navigator.getGamepads){
            return navigator.getGamepads().filter((gamepad) => gamepad && gamepad.id);
        }
        if(navigator["webkitGetGamepads"]){
            return navigator["webkitGetGamepads"]().filter((gamepad) => gamepad && gamepad.id);
        }
        return [];
    }

    tick(){
        // check each gamepad for changes and send to server if needed
        this.gamepads = this.getLatestGamepads();
        this.gamepads.forEach((gamepad) => {
            // console.log("tick", gamepad);
            let metadata = this.gamepadMetadata[gamepad.index];
            // console.log(gamepad.timestamp, metadata.lastTick, metadata.syncing);
            if(gamepad.timestamp != metadata.lastTick){
                // console.log("Timestamp changed");
                metadata.lastTick = gamepad.timestamp;
                // send state regardless
                if(metadata.syncing){
                    let serialized = this.serializeGamepad(gamepad, metadata);
                    // TODO: optimize perf?
                    if(_.isEqual(metadata.lastSent, serialized)) {
                        // console.log("Not different enough");
                        return;
                    }
                    metadata.lastSent = serialized;
                    this.client.sendUnreliable({
                        "update_gamepad": this.serializeGamepadForServer(gamepad, metadata)
                    });
                }
            }
        });
    }

    requestAnimationTick(instant = true) {
        if(!this.enabled){
            return;
        }
        if(instant) this.tick();
        if(!this.enabled){
            return;
        }
        requestAnimationFrame(this.requestAnimationTickBinded);
    }

    detachFromRemote(gamepad){
        if(!this.gamepadMetadata[gamepad.index].syncing){
            return;
        }
        const metadata = this.gamepadMetadata[gamepad.index];
        // TODO: tell remote
        this.client.sendUnreliable({
            "remove_gamepad": {
                remote_id: metadata.remote_id
            }
        });
        return (new Promise((resolve, reject) => {
            this.pendingGamepadPromiseResolves[metadata.remote_id] = resolve;
            setTimeout(() => {
                if(this.pendingGamepadPromiseResolves[metadata.remote_id]){
                    console.log(metadata.local_id, " detach timeout reached.");
                    delete this.pendingGamepadPromiseResolves[metadata.remote_id];
                    reject("Host timeout reached.");
                }
            }, 5000);
        }));
        /*this.gamepadMetadata[gamepad.index].syncing = false;
        this.gamepadMetadata[gamepad.index].connecting = false;
        this.dispatchEvent(new CustomEvent("gamepadMutation"));
        this.dispatchEvent(new CustomEvent("gamepadRemoteMutation"));*/
    }

    /**
     *
     * @param {GamepadEvent} event
     * @memberof GamepadHelper
     */
    onGamepadDisconnected(event){
        console.log("gamepad disconnected", event);
        // delete metadata
        // TODO: does index still exist?
        delete this.gamepadMetadata[event.gamepad.index];
        // remove from gamepads
        this.gamepads = this.gamepads.filter((gamepad) => gamepad.index != event.gamepad.index);
        this.dispatchEvent(new CustomEvent("gamepadMutation"));
    }

    // literally reinvented the navigator one but whatever
    getGamepads(){
        return this.gamepads;
    }

    onDataChannelMessage(event){
        let {channel, data} = event.detail;
        console.log("dc message", data);
        if(typeof data == "string"){
            data = JSON.parse(data);
        }
        if(typeof data != "object"){
            return;
        }
        // handle externally typed enum
        const message_type = Object.keys(data)[0];
        const message_data = data[message_type];
        // TODO: cleanup our promise stacking system
        if(channel.label == "reliable"){
            if(message_type == "add_gamepad_reply") {
                if(message_data.success){
                    let [index,metadata] = Object.entries(this.gamepadMetadata).find((pair) => pair[1].local_id == message_data.local_id);
                    let gamepad = this.gamepads[index];
                    console.log("gamepad added", message_data, gamepad, this.gamepadMetadata);
                    if(metadata){
                        metadata.syncing = true;
                        metadata.connecting = false;
                        metadata.remote_id = message_data.remote_id;
                        this.pendingGamepadPromiseResolves[metadata.local_id](message_data);
                        delete this.pendingGamepadPromiseResolves[metadata.local_id];
                        this.dispatchEvent(new CustomEvent("gamepadMutation"));
                        this.dispatchEvent(new CustomEvent("gamepadRemoteMutation"));
                    }else{
                        console.log("accepted currently nonexistent gamepad", message_data);
                    }
                }else{
                    console.warn("gamepad add failed", data);
                    this.dispatchEvent(new CustomEvent("gamepadRemoteError", {
                        detail: {
                            data: data
                        }
                    }));
                }
            }else if(message_type == "remove_gamepad_reply"){
                let [index, metadata] = Object.entries(this.gamepadMetadata).find((pair) => pair[1].remote_id == message_data.remote_id);
                if(metadata){
                    metadata.syncing = false;
                    metadata.connecting = false;
                    this.dispatchEvent(new CustomEvent("gamepadMutation"));
                    this.dispatchEvent(new CustomEvent("gamepadRemoteMutation"));
                    this.pendingGamepadPromiseResolves[metadata.remote_id](message_data);
                    delete this.pendingGamepadPromiseResolves[metadata.remote_id];
                }else{
                    // this doesn't matter for us
                }
            }
        }else if(!channel.label){
            console.warn("Unknown channel label", channel);
        }
    }

    enable(){
        if(this.enabled) return;
        this.enabled = true;
        this.requestAnimationTick(false);
        console.log("enabling gamepads");
        window.addEventListener("gamepadconnected", this.onGamepadConnectedBinded);
        window.addEventListener("gamepaddisconnected", this.onGamepadDisconnectedBinded);
        this.client.addEventListener("data_channel_message", this.onDataChannelMessageBinded);
        // TODO: impl server side
        /*this.client.sendReliable({
            "perms_check": {}
        });*/
        
    }

    disable(){
        if(!this.enabled) return;
        console.log("disabling gamepads");
        window.removeEventListener("gamepadconnected", this.onGamepadConnectedBinded);
        window.removeEventListener("gamepaddisconnected", this.onGamepadDisconnectedBinded);
        this.client.removeEventListener("data_channel_message", this.onDataChannelMessageBinded);
        this.enabled = false;
    }
}

export class StreamerClient extends EventTarget {
    constructor(sid, options = {}){
        super();
        this.sid = sid;
        this.options = options;
        this.video = new StreamerPeerConnection(sid, options, "video");
        this.audio = new StreamerPeerConnection(sid, options, "audio");
        this.video.parent = this;
        this.audio.parent = this;
        this.gamepads = new GamepadHelper(this);
        if(!this.options.disableGamepads){
            this.gamepads.enable();
        }
    }

    getDefaultConnection(){
        return this.video;
    }

    start() {
        this.video.start();
    }

    stop() {
        this.video.stop();
    }

    sendUnreliable(data){
        console.log("sending unreliable", data);
        if(!this.video.getUnreliableDataChannel()) return false;
        this.video.getUnreliableDataChannel().send(JSON.stringify(data));
        return true;
    }

    sendReliable(data){
        console.log("sending reliable", data);
        if(!this.video.getReliableDataChannel()) return false;
        this.video.getReliableDataChannel().send(JSON.stringify(data));
        return true;
    }
}
// manages freeing things for react
export class StreamerClientManager extends EventTarget {

    clientRefCounter = new Map();

    constructor(options = {}){
        super();
        this.options = options;
        this.clients = new Map();
    }

    /**
     * 
     *
     * @param {string} sid
     * @param {*} options
     * @return {StreamerClient} 
     * @memberof StreamerClientManager
     */
    allocate(sid, options, refcount = true) {
        if(this.clients.has(sid)){
            if(refcount) this.clientRefCounter.set(sid, this.clientRefCounter.get(sid) + 1);
            return this.clients.get(sid);
        }
        let client = new StreamerClient(sid, options);
        this.clients.set(sid, client);
        this.clientRefCounter.set(sid, refcount ? 1 : 0);
        client.start();
        return client;
    }

    deallocate(sid) {
        let client = this.clients.get(sid);
        if(!client){
            return;
        }
        this.clientRefCounter.set(sid, this.clientRefCounter.get(sid) - 1);
        if(this.clientRefCounter.get(sid) <= 0){
            console.warn("Freeing client", sid);
            if(this.clientRefCounter.get(sid) < 0){
                console.warn("Ref counter is negative, double free? ", sid);
            }
            this.clientRefCounter.delete(sid);
            this.clients.delete(sid);
            client.stop();
            return true;
        }
        return false;
    }

    /**
     * 
     * @return {StreamerClient[]} 
     * @memberof StreamerClientManager
     */
    getAllClients(){
        return Array.from(this.clients.values());
    }
}


export const streamerClientManager = new StreamerClientManager();
window["streamerClientManager"] = streamerClientManager;
