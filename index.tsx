import React from "react";
import ReactDOM from "react-dom/client";

/* 
  IMPORTANTE:
  O AI Studio já gera o app direto aqui,
  então NÃO existe App.tsx
*/

const App = () => {
  return (
    <div id="app-root"></div>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
