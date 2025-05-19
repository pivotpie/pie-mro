
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add some styles to ensure the root takes full height and width
const rootElement = document.getElementById("root");
if (rootElement) {
  rootElement.style.height = "100%";
  rootElement.style.width = "100%";
  rootElement.style.overflow = "hidden";
}

createRoot(rootElement!).render(<App />);
