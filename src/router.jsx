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
        }
    ],
    errorElement: <NotFound></NotFound>
},
]);

export default router;