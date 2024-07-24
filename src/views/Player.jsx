import _ from "lodash";
import React from "react";
import { useLocation, useNavigate } from "react-router";
import { Term } from "../components/Term";
import { Wrapper } from "../components/Wrapper";
import { fetchApi, getApiUrl } from "../utils/api";
import { adjustedBackground } from "../utils/classes";
import { unfuck } from "../@/lib/utils";

// ui comps
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../@/components/ui/tabs";


import { SESSION_STATE } from "../shared/protocol";
import { Button } from "../@/components/ui/button";
import RemoteMedia from "../components/RemoteMedia";
import socket from "../utils/socket";
import { InputFrame } from "../components/InputFrame";
import { SettingsTrigger } from "../components/SettingsTrigger";
import { GamepadPanel } from "../components/GamepadPanel";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "../@/components/ui/resizable";
import { useDrag, useGesture } from "@use-gesture/react";
import { SettingsDrawerControlled } from "../components/SettingsDrawerControlled";

function useQuery() {
  const search = useLocation().search;
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

// stole this from my local instance, and modified a bit
const mockSession = {
    "admin": {
        "id": "test",
        "name": "Test User"
    },
    "appSpecs": {
        "displayName": "Supertuxkart",
        "binary": "supertuxkart",
        "id": "stk",
        "poster": "/assets/stk.png",
        "background": "/assets/stk_bg.jpg",
        "description": "Karts. Nitro. Action! SuperTuxKart is a 3D open-source arcade racer with a variety of characters, tracks, and modes to play. Our aim is to create a game that is more fun than realistic, and provide an enjoyable experience for all ages.\n\nIn Story mode, you must face the evil Nolok, and defeat him in order to make the Mascot Kingdom safe once again! You can race by yourself against the computer, compete in several Grand Prix cups, or try to beat your fastest time in Time Trial mode. You can also race, battle or play soccer with up to eight friends on a single computer, play on a local network or play online with other players all over the world.\n",
        "rewriteHome": true,
        "rewriteDataDirs": true,
        "args": []
    },
    "sid": "12be36d4-0610-424d-a388-0804b253749d",
    "ready": true,
    "state": 2, // test ready state
    "state_enum": "Ready",
    "acls": {}
};
/* eslint-disable react/prop-types */
const Player = () => {
  let query = useQuery();
  let navigate = useNavigate();

  let [session, setSession] = React.useState(null);
  let [sid, setSid] = React.useState(query.get("sid"));
  let [test, setTest] = React.useState(query.get("test"));
  let [debugText, setDebugText] = React.useState("Debug text not set yet.");
  let [reportText, setReportText] = React.useState("Connection Status Report will appear here.");
  let [globalSettingsDrawerOpen, setGlobalSettingsDrawerOpen] = React.useState(false);

  let sidePanelRef = React.useRef(null); // ImperativePanelRef

  function onStatusReport(report){
    setReportText(report);
  }

  function updateSessionInfo() {
    let sid = query.get("sid");
    if(query.get("test")){
      return; // don't update in test mode
    }
    fetchApi("/api/v1/session/" + sid).then(async (resp) => {
      if (resp.ok) {
        let json = await resp.json();
        let changed = session == null;
        if (!changed) {
          for (let pair of Object.entries(json["data"])) {
            if (!_.isEqual(session[pair[0]], pair[1])) {
              console.log(pair[0], " prop changed ");
              changed = true;
            }
          }
        }
        if (changed) {
          setSession((oldSession) => {
            return {
              ...oldSession,
              ...json["data"],
            };
          });
        }
      } else if (resp.status == 404) {
        if (!session) {
          alert("Session not found. ");
          navigate("/");
        } else {
          setSession(null);
        }
      }
    });
  }

  function endSession(){
    // todo
    
  }

  function getReadyText(session) {
    if(session.state == SESSION_STATE.Ready){
      return "Loading streaming ui...";
    }else if(session.state == SESSION_STATE.Disconnecting){
      return "Disconnecting...";
    }else if(session.state == SESSION_STATE.Handshaking){
      return "Waiting for streamer daemon handshake...";
    }else if(session.state == SESSION_STATE.Initalizing){
      return "Initializing application and streamer daemon...";
    }
    // prob not getting used
    return "Establishing realtime connection...";
  }

  React.useEffect(() => {
    let sid = query.get("sid");
    let test = query.get("test");
    if (!sid && !test) {
      navigate("/");
    }
    updateSessionInfo();
    let interval = setInterval(updateSessionInfo, 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  React.useEffect(() => {
    let peerMessageHandler = (source_socket_id, data) => {
      console.log("peer message", data);
      if(data.debug){
        alert(data.debug);
      }
    };
    socket.on("peer_message", peerMessageHandler);
    return () => {
      socket.off("peer_message", peerMessageHandler);
    };
  }, []);

  function debugSession(){
    console.log("Sent debug request");
    socket.emit("send_to_session", session.sid, {
      debug_info_request: Date.now()
    });
  }

  session = test ? mockSession : session;

  if (session) {
    let backgroundUrl = new URL(session.appSpecs.background, getApiUrl()).href;

    const bind = unfuck(useDrag(({movement, velocity, active, cancel, down, last}) => {
      setDebugText(active + " " + JSON.stringify(movement) + " " + JSON.stringify(velocity) + " " + down + " " + Date.now() + " ");
      if(active && movement[0] < window.innerWidth / 2){
        // document.title = JSON.stringify(movement) + " " + JSON.stringify(velocity);
        // console.log("dragging canceled");
        // cancel();
      }
      if(movement[0] < -window.innerWidth / 3 && last){
        if(sidePanelRef.current){
          sidePanelRef.current.expand();
          if(movement[0] < -(2 * window.innerWidth) / 3){
            sidePanelRef.current.resize(100);
          }
        }
      }else if(movement[0] > window.innerWidth / 2 && last){
        if(sidePanelRef.current){
          sidePanelRef.current.collapse();
        }
      }else if(movement[1] < -window.innerHeight / 2 && last){
        if(!globalSettingsDrawerOpen){
          setGlobalSettingsDrawerOpen(true);
        }
      }else if(movement[1] > window.innerHeight / 2 && last){
        if(globalSettingsDrawerOpen){
          setGlobalSettingsDrawerOpen(false);
        }
      }
      console.log(movement);
    }));

    const innerComponent = (session && session.ready) ? <>
      <div className="h-full w-full m-0 touch-none" key = "player">
        <ResizablePanelGroup direction="horizontal" className="">
          <ResizablePanel defaultSize={80}>
            <InputFrame sid={session.sid} mouse mousebutton>
              <RemoteMedia sid = {session.sid} onStatusUpdate={onStatusReport} />
            </InputFrame>
          </ResizablePanel>
          <ResizableHandle withHandle={true} className="" />
          <ResizablePanel defaultSize={20} collapsible={true} collapsedSize={0} minSize={10} className="touch-pan-y bg-background-lighter" ref={sidePanelRef}>
            <Tabs defaultValue="session" className="w-full p-4">
              <TabsList className = "w-full">
                <TabsTrigger value="session">Session</TabsTrigger>
                <TabsTrigger value="social">Social</TabsTrigger>
              </TabsList>
              <TabsContent value="session" className="p-4">
                <SettingsTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 w-full mb-4">Settings</SettingsTrigger>
                <Button variant = "secondary" onClick={debugSession} className="w-full mb-4">Debug Session</Button>
                <Button variant = "destructive" onClick={endSession} className="w-full">End Session</Button>
                <GamepadPanel sid={session.sid} />
                <pre className="max-h-64 overflow-y-scroll">
                {debugText}
                {reportText}
                </pre>
              </TabsContent>
              <TabsContent value="social"  className="p-4">
              <Button variant = "primary" onClick={console.log} className="w-full mb-4">Share Session</Button>
              </TabsContent>
            </Tabs>
          </ResizablePanel>
        </ResizablePanelGroup>
        <SettingsDrawerControlled open={globalSettingsDrawerOpen} setOpen={setGlobalSettingsDrawerOpen} />
      </div>
    </>:<>
      <div className="loading h-full w-full px-12 pt-12 pb-9 lg:px-24 lg:pt-24 lg:pb-18" key="loading">
        <div
          className="grid grid-cols-4 gap-8 h-5/6 p-8"
          aria-busy="true"
          aria-describedby="loader"
        >
          <div className="col-span-4 lg:col-span-2 bg-background-lighter">
            <Term channel={sid + ":stdout"}></Term>
          </div>
          <div className="hidden lg:block lg:col-span-2 bg-background-lighter">
            <Term channel={sid + ":streamer_stdout"}></Term>
          </div>
        </div>
        <div
          className="h-1/6 p-8"
          id="loader"
          aria-label="Starting application..."
        >
          <div className="bg-slate-300 relative h-2 overflow-hidden">
            <div className="animate-loading w-1/3 min-w-w-1/3 overflow-hidden h-2 bg-lime-500 absolute"></div>
          </div>
          <p>{getReadyText(session)}</p>
        </div>
      </div>
    </>;

    return (
      <React.Fragment>
        <Wrapper
          className={adjustedBackground}
          style={{
            backgroundImage: "url(" + backgroundUrl + ")",
          }}
        >
          <div
            className="w-full h-full m-0"
            style={{
              backdropFilter: "blur(16px)",
            }}
            {...bind()}
          >
            {innerComponent}
          </div>
        </Wrapper>
      </React.Fragment>
    );
  } else if (test) {

  }

  return (
    <React.Fragment>
      <Wrapper className={adjustedBackground}></Wrapper>
    </React.Fragment>
  );
};

export default Player;
