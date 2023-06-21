import { Dialog } from '../components/Dialog';
import { Wrapper } from '../components/Wrapper';
import React from 'react'

import {getCurrentUser} from "../utils/login";
import { useNavigate } from 'react-router-dom';
import { fetchApi, getApiUrl } from '../utils/api';

const Apps = () => {
    let navigate = useNavigate();
    React.useEffect(() => {
        if(!getCurrentUser()){
            console.log("redirecting...")
            navigate("/login?ref=redirect");
        }  
    });

    let [appSpecs, setAppsSpecs] = React.useState([]); 

    function refreshAppSpecs(){
        fetchApi("/api/v1/apps").then(async resp => {
            let json = await resp.json();
            let testInflation = [];
            // test code, directly return the json when we are ready to ship with real data
            // this duplicates the first app 69 times
            for(let i = 0; i < 69; i++){
                testInflation.push(Object.assign({}, json.data[0]));
                testInflation[i].id = "test" + i;
                if(i == 0){
                    testInflation[i].id = "tetris_worlds";
                }
            }
            setAppsSpecs(testInflation);  
        });
    }

    function launchApp(appId){
        navigate("/app/" + appId);
    }

    React.useEffect(() => {
        refreshAppSpecs();
    }, []);

    let user = getCurrentUser();

    return <React.Fragment>
        <Wrapper extended={true}>
            <div className="h-16 md:h-12 w-full bg-background-lighter flex flex-row shadow text-xl md:text-lg">
                <span className = "inline-block my-auto pl-4 font-extrabold">
                    Astral
                </span>
                <div className="grow">

                </div>
                <span className = "inline-block my-auto pr-8">
                    {
                        user ? user["name"] : "Not logged in?"
                    }
                </span>
            </div>
            <br />
            {/* TODO make components */}
            <div className="grid grid-cols-8 gap-8 w-11/12 max-11/12 mx-auto">
            {
                appSpecs.map((appSpec) => {
                    let fullPosterUrl = new URL(appSpec.poster, getApiUrl()).href;
                    return <div className="cursor-pointer">
                        <img src={fullPosterUrl} onClick={() => launchApp(appSpec["id"])} className="w-auto h-auto rounded-lg shadow"></img>
                    </div>
                })
            }
            </div>
            <br />
            <br />
            <br />
            <br />
        </Wrapper>
    </React.Fragment>;
};

export default Apps;