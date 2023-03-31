import React from 'react';
import { Router } from './navigation/Router';
import { PersistGate } from 'redux-persist/integration/react';
import { Provider } from 'react-redux';
import { persistor, store } from './app/store';

function App() {
  return (
    <React.StrictMode>
      <Provider store={store}>
        <PersistGate persistor={persistor} loading={<p>Loading...</p>}>
          <Router />
        </PersistGate>
      </Provider>
    </React.StrictMode>
  );
}

export default App;
