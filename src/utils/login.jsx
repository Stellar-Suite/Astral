import Cookies from "js-cookie";

import jwt_decode from "jwt-decode";

export const getJwt = () => {
    return Cookies.get("jwt");
}

export const setJwt = (jwt) => {
    Cookies.set("jwt", jwt);
};

export const getCurrentUser = () => {
    const jwt = getJwt();
    if (!jwt) {
        return null;
    }
    return jwt_decode(jwt);
}