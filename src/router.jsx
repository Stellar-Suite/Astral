import App from "./App";
import {
    createBrowserRouter,
    RouterProvider,
    Route
} from "react-router-dom";

import React from "react";
import Home from "./views/Home";
import NotFound from "./views/NotFound";
import LoginPage from "./views/Login";
import Apps from "./views/Apps";
import AppLaunch, { appLoader } from "./views/AppLaunch";
import Player from "./views/Player";

const router = createBrowserRouter([
{
    path: "/",
    element: <App />,
    children: [
        {
            path: "/",
            element: <Home />
        },
        {
            path: "/login",
            element: <LoginPage />
        },
        {
            path: "/launcher",
            element: <Apps />
        },
        {
            path: "/app/:id",
            element: <AppLaunch />,
            loader: appLoader
        },
        {
            path: "/player",
            element: <Player />
        }
    ],
    errorElement: <NotFound></NotFound>
},
]);

export default router;