import { Dialog } from "../components/Dialog";
import { Wrapper } from "../components/Wrapper";
import React from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import { adjustedBackground } from "../utils/classes";
import { fetchApi, getApiUrl } from "../utils/api";
import { Term } from "../components/Term";
import _ from "lodash";

function useQuery() {
  const search = useLocation().search;
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

const Player = () => {
  let query = useQuery();
  let navigate = useNavigate();

  let [session, setSession] = React.useState(null);
  let [sid, setSid] = React.useState(query.get("sid"));

  function updateSessionInfo() {
    let sid = query.get("sid");
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

  function getReadyText(session) {
    return "Establishing realtime connection...";
  }

  React.useEffect(() => {
    let sid = query.get("sid");
    if (!sid) {
      navigate("/");
    }
    updateSessionInfo();
    let interval = setInterval(updateSessionInfo, 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  if (session) {
    let backgroundUrl = new URL(session.appSpecs.background, getApiUrl()).href;
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
          >
            {[
              !session.ready && (
                <>
                  <div className="loading h-full w-full px-12 pt-12 pb-9 lg:px-24 lg:pt-24 lg:pb-18">
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
                </>
              ),
              session.ready && (
                <>
                  <div className="h-full w-full m-0">
                    <div
                      className="grid grid-cols-12 gap-8 h-full p-8"
                      aria-busy="true"
                      aria-describedby="loader"
                    >
                      <div className="col-span-10 bg-background-lighter"></div>
                      <div className="col-span-2 bg-background-lighter"></div>
                    </div>
                  </div>
                </>
              ),
            ]}
          </div>
        </Wrapper>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <Wrapper className={adjustedBackground}></Wrapper>
    </React.Fragment>
  );
};

export default Player;
