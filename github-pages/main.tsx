import React from "react";
import { createRoot } from "react-dom/client";
import ShinobigamiConsole from "../app/components/ShinobigamiConsole";
import "../app/globals.css";
import "../app/components/tutorial/tutorial.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Missing application root");
}

createRoot(root).render(
  <React.StrictMode>
    <ShinobigamiConsole />
  </React.StrictMode>,
);
