import { ThemeProvider } from "@emotion/react";
import { HelmetProvider } from '@dr.pogodin/react-helmet';
// import { AppProvider, useApp } from "./contexts/AppContext";
// import { AuthProvider } from "./providers/AuthProvider";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { SnackbarProvider, useSnackbar } from "notistack";
import { ReactNode, useEffect } from "react";
import { registerApiRequestCallback } from "./utils/axios";
import { theme } from "./theme";
import { AppProvider, useApp } from "./contexts/AppContext";
import useIntersectionObserver from "./hooks/useIntersectionProvider";
import { AuthProvider } from "./providers/AuthProvider";
// import useIntersectionObserver from "./hooks/useIntersectionObserver";
// import { LocalizationProvider } from "@mui/x-date-pickers";
// import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

const RouterWrapper = () => {
    const { enqueueSnackbar } = useSnackbar()

    useEffect(() => {
        registerApiRequestCallback((message, status) => {
            console.log('callback called', message, status)
            enqueueSnackbar(message, { variant: status });
        })
    }, [])

    return (
        <RouterProvider router={router} />
    )
}

const ThemeWrapper = ({ children }: { children: ReactNode }) => {
    const { lang } = useApp()

    console.log('lang is', lang)

    const _theme = theme(lang === 'en' ? 'ltr' : 'rtl')

    return (
        <ThemeProvider theme={_theme}>
            {children}
        </ThemeProvider>
    )
}

if (import.meta.env.MODE === 'production') {
    console.log = () => { }
}


export default function App() {

    useIntersectionObserver("slideOut", "slideIn", 0.6);
    useIntersectionObserver("fadeOut", "fadeIn", 0.6);
    useIntersectionObserver("slideLeftOut", "slideLeftIn", 0.6);
    useIntersectionObserver("slideRightOut", "slideRightIn", 0.6);
    useIntersectionObserver("slideTopOut", "slideTopIn", 0.6);
    useIntersectionObserver("slideBottomOut", "slideBottomIn", 0.6);
    useIntersectionObserver("scaleOut", "scaleIn", 0.6);
    useIntersectionObserver("rotateOut", "rotateIn", 0.6);
    useIntersectionObserver("flipOut", "flipIn", 0.6);
    useIntersectionObserver("zoomOut", "zoomIn", 0.6);
    useIntersectionObserver("bounceOut", "bounceIn", 0.6);
    useIntersectionObserver("swingOut", "swingIn", 0.6);
    useIntersectionObserver("rollOut", "rollIn", 0.6);
    useIntersectionObserver("skewOut", "skewIn", 0.6);
    useIntersectionObserver("wobbleOut", "wobbleIn", 0.6);
    useIntersectionObserver("pulseOut", "pulseIn", 0.6);
    useIntersectionObserver("shakeOut", "shakeIn", 0.6);
    useIntersectionObserver("blurOut", "blurIn", 0.6);
    useIntersectionObserver("expandOut", "expandIn", 0.6);
    useIntersectionObserver("contractOut", "contractIn", 0.6);

    // return (
    //   <AppProvider>
    //     <LocalizationProvider dateAdapter={AdapterDayjs}>
    //       <ThemeWrapper>
    //         <AuthProvider>
    //           <SnackbarProvider maxSnack={3} disableWindowBlurListener autoHideDuration={3000}>
    //             <RouterWrapper />
    //           </SnackbarProvider>
    //         </AuthProvider>
    //       </ThemeWrapper >
    //     </LocalizationProvider>
    //   </AppProvider>
    // )

    return (
        <HelmetProvider>
            <AppProvider>
                <ThemeWrapper>
                    <AuthProvider>
                        <SnackbarProvider maxSnack={3} disableWindowBlurListener autoHideDuration={3000}>
                            <RouterWrapper />
                        </SnackbarProvider>
                    </AuthProvider>
                </ThemeWrapper>
            </AppProvider>
        </HelmetProvider>
    )
}