class StreamerPeerConnection {
    constructor(sid, options){
        this.sid = sid;
        this.options = options;
    }

    start() {
        
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