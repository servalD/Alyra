import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import detectEthereumProvider from '@metamask/detect-provider';

async function DEP (){
  return await detectEthereumProvider()
};
DEP().then((provider) => {
ReactDOM.render(
  <React.StrictMode>
    <App provider={provider}/>
  </React.StrictMode>,
  document.getElementById('root')
);

reportWebVitals();
})