import { FC } from "react";
import { Provider } from "react-redux";
import { Game, actions as gameActions } from "morpheus/game";
import storeFactory from "../store";
import "../service/firebase";
const store = storeFactory();

const App: FC = () => {
  return (
    <Provider store={store}>
      {/* <NewGame sceneData={sceneData} /> */}
      <Game id="root" className="game" />
    </Provider>
  );
};

export default App;
