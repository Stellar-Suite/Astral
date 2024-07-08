import { modifySdpHack } from "../@/lib/utils";
import { Socket, io } from "socket.io-client";
import { getApiUrl } from "../utils/api";
import { getJwt } from "../utils/login";

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
        event.channel.addEventListener("message", this.onDataChannelMessage.bind(this));
        event.channel.addEventListener("open", this.onDataChannelOpen.bind(this));
        event.channel.addEventListener("error", this.onDataChannelError.bind(this));
    }

    onDataChannelMessage(event){
        console.log("data channel message", event);
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

export class StreamerClient extends EventTarget {
    constructor(sid, options = {}){
        super();
        this.sid = sid;
        this.options = options;
        this.video = new StreamerPeerConnection(sid, options, "video");
        this.audio = new StreamerPeerConnection(sid, options, "audio");
        this.video.parent = this;
        this.audio.parent = this;
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
        if(!this.video.getUnreliableDataChannel()) return false;
        this.video.getUnreliableDataChannel().send(data);
        return true;
    }

    sendReliable(data){
        if(!this.video.getReliableDataChannel()) return false;
        this.video.getReliableDataChannel().send(data);
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
    allocate(sid, options) {
        if(this.clients.has(sid)){
            return this.clients.get(sid);
        }
        let client = new StreamerClient(sid, options);
        this.clients.set(sid, client);
        this.clientRefCounter.set(sid, 1);
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
}

export const streamerClientManager = new StreamerClientManager();
window["streamerClientManager"] = streamerClientManager;