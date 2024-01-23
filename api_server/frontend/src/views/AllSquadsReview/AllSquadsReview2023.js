import { Grid } from "@mui/material";

export default function AllSquadsReview2023() {
    return (
        <Grid container minHeight={'100%'} alignItems={'center'}>
            <Grid item xs={12}>
                <iframe
                    src="https://flo.uri.sh/visualisation/15671365/embed"
                    title="Interactive or visual content"
                    className="flourish-embed-iframe"
                    frameBorder={0}
                    scrolling="no"
                    style={{ width: "100%", height: 600 }}
                    sandbox="allow-same-origin allow-forms allow-scripts allow-downloads allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
                />

            </Grid>
        </Grid>
    )
}