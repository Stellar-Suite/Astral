import { Dialog } from '../components/Dialog';
import { Wrapper } from '../components/Wrapper';
import React from 'react'
import { fetchApi, getApiUrl } from '../utils/api';
import { useLoaderData, useNavigate } from 'react-router-dom';
import { adjustedBackground } from '../utils/classes';

export async function appLoader({ params }) {   
    let resp = (await fetchApi("/api/v1/app/" + params.id));
    let appSpec = (await resp.json())["data"];
    return { appSpec };
}

export const AppLaunch = () => {
    let loaderData = useLoaderData();
    let appSpec = loaderData["appSpec"];
    let fullPosterUrl = new URL(appSpec.poster, getApiUrl()).href;
    let fullBackgroundUrl = new URL(appSpec.background, getApiUrl()).href;

    let [isLaunching, setLaunching] = React.useState(false);

    let navigate = useNavigate();

    function attemptLaunch(){
        setLaunching(true);
        fetchApi("/api/v1/session", {
            method: "POST",
            json:{
                app: appSpec.id
            }
        }).then(async resp => {
            if(resp.ok){
                let json = await resp.json();
                let sid = json["data"];
                console.log("new session at ",json["data"]);
                navigate("/player/?sid=" + encodeURIComponent(sid));
            }else if(resp.status == 409){
                // alert("You already have a session running. Stop it first to launch another. ");
                let json = await resp.json();
                setLaunching(false);
                let sid = json["data"];
                console.log("existing session ",json);
                navigate("/player/?sid=" + encodeURIComponent(sid)) + "&msg_dup=1";
            }else{
                alert("Error launching: " + (await resp.text()));
                setLaunching(false);
            }
        });
    }

    return <React.Fragment>
  <Wrapper>
    <div className={"w-100 transition-[height,filter] duration-1000 " + adjustedBackground + " " + (isLaunching ? "h-full": "h-2/5")} style={{
        backgroundImage: "url(" + fullBackgroundUrl + ")",
        filter: isLaunching ? "blur(16px)" : "blur(0px)"
    }}>
    
    </div>
    <div className="no-space-thing w-full h-0">
    <button className={"transition-all duration-1000 -my-12 mx-auto block relative lg:mx-96 w-64 text-4xl h-24 px-4 py-4 text-black " + (isLaunching ? "bg-yellow-500 opacity-0" : "bg-lime-500 opacity-100")} disabled={isLaunching} onClick={attemptLaunch}>
        Launch
    </button>
    </div>
    <div className="mt-2 px-8 bg-background">
        <br />
        <br />
        <br />
        <br />
        <h1 className="text-4xl text-bold">
            {appSpec.displayName}
        </h1>
        <p className="whitespace-pre-line">
            {appSpec.description}
        </p>
    </div>
  </Wrapper>
</React.Fragment>
};

export default AppLaunch;