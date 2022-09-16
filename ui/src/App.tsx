import React from "react";
import Snake from "./components/Snake";
import "./App.css";
import { store } from "./state/store";
import { Provider } from "react-redux";

function App() {
  return (
    <Provider store={store}>
      <div className="App">
        <Snake />
      </div>
    </Provider>
  );
}

export default App;
