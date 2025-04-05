import { createBrowserRouter, Navigate, RouteObject } from "react-router-dom";
import Home from "./pages/LandingPage/Home/Home";
import AppLayout from "./layouts/AppLayout";

export const routes: RouteObject[] = [
    {
        path: '/',
        element: <AppLayout />,
        children: [
            { path: '', element: <Home /> },
        ]
    }
]

// TODO: add routes

export const router = createBrowserRouter(routes);