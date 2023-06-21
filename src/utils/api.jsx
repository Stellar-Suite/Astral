import Cookies from "js-cookie";

import {getCurrentUser, getJwt, setJwt} from "./login";

export function getDefaultUrl(){
    return location.origin;
}

export function getApiUrl(){
    return Cookies.get("apiUrl") || getDefaultUrl();
}

export function setApiUrl(url){
    console.log("set", url)
    Cookies.set("apiUrl", url);
}

export function fetchApi(url, options = {}){
    if(!options.headers){
        options.headers = {};
    }
    if(getJwt()){
        options.headers["Authorization"] = "Bearer " + getJwt();
    }
    if(options.json){
        options.headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(options.json);
        if(!options.method) options.method = "POST";
        delete options.json;
    }
    return fetch(getApiUrl() + url, options);
}

export async function checkHasBackend(){
    try{
        let resp = await fetchApi("/api/v1/check"); // no auth endpoint
        if(resp.status != 200) return false;
        let data = await resp.json();
        return data.ok;
    }catch(ex){
        console.log("backend check failed " + ex);
        return false;
    }
}

export async function tryLogin(password){
    try{
        let resp = await fetchApi("/api/v1/try_login",{
            json: {
                accessToken: password
            }
        }); // no auth endpoint
        if(resp.status != 200) return false;
        let data = await resp.json();
        if(!data.ok) return false;
        setJwt(data.jwt);
        return true;
    }catch(ex){
        console.log("backend check failed " + ex);
        return false;
    }
}