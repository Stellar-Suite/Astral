import React from 'react';
import ReactDOM from 'react-dom/client';
// styles
import './index.css';
// font
import "@fontsource/inter";
import App from './App';

import router from "./router";

import {
  createBrowserRouter,
  RouterProvider,
  Route
} from "react-router-dom";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<>
    <RouterProvider router={router} />
</>);
