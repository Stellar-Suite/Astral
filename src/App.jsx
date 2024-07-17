import React from 'react';

import { Outlet } from "react-router-dom";
import { Toaster } from "./@/components/ui/sonner";

function App() {
	return (
		<div className="app">
				<Outlet />
				<Toaster />
		</div>
	);
}

export default App;