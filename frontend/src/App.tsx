import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';

function App() {
  const [movies, setMovies] = useState([]);
  useEffect(() => {
     fetch('http://localhost:4000')
        .then((response) => response.json())
        .then((data) => {
           console.log(data);
           setMovies(data);
        })
        .catch((err) => {
           console.log(err);
        });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <p>
          Movies in DB currently are:
        </p>
        {movies.map(movie => {
          return (
            <h2>{JSON.stringify(movie)}</h2>
          );
        })}
      </header>
    </div>
  );
}

export default App;
