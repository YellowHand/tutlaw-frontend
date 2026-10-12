import { AppProviders } from "./app/providers";
import { Router } from "./app/router";

function App() {
  return (
    <AppProviders>
      <Router />
    </AppProviders>
  );
}

export default App;