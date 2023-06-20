import Cookies from "js-cookie";

import {decode} from "jsonwebtoken";

export const getJwt = () => {
    return Cookies.get("jwt");
}

export const getCurrentUser = () => {
    const jwt = getJwt();
    if (!jwt) {
        return null;
    }
    return decode(jwt);
}