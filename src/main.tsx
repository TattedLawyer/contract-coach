import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log("Starting React app...");

try {
  const rootElement = document.getElementById("root");
  console.log("Root element found:", rootElement);
  
  if (rootElement) {
    const root = createRoot(rootElement);
    console.log("Root created, rendering App...");
    root.render(<App />);
    console.log("App rendered successfully");
  } else {
    console.error("Root element not found!");
  }
} catch (error) {
  console.error("Error rendering app:", error);
}
