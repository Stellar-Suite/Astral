import Cookies from "js-cookie";

import {getCurrentUser, getJwt} from "./login";

export function getDefaultUrl(){
    return location.origin;
}

export function getApiUrl(){
    return Cookies.get("apiUrl") || getDefaultUrl();
}

export function setApiUrl(url){
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
    let resp = await fetchApi("/api/v1/");
}