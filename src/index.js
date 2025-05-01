import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { store } from "./redux/store";
import { Provider } from "react-redux";
import "@progress/kendo-theme-default/dist/all.css";
import "semantic-ui-css/semantic.min.css";
import "devextreme/dist/css/dx.light.css";
import { ErrorBoundary } from "react-error-boundary";
import { ErrorFallback } from "./Components/ErrorFallback";
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://365a1ed35a29056f5f723bdfea3e2517@o4509139342327809.ingest.de.sentry.io/4509139345670224",
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false, // <--- dezactivează mascarea textului
      blockAllMedia: false, // <--- opțional: afișează și conținutul media
    }),
  ],
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0,
});
const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <Provider store={store}>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <App />
    </ErrorBoundary>
  </Provider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
