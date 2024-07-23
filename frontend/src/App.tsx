import React, { useState, useEffect } from 'react';
import './App.css';
import Cookies from 'universal-cookie';
import { v4 as uuidv4 } from 'uuid';
import SearchBar from './SearchComp';
import logo from './assets/FlickFindLogo.png';
import Row from './Row'

function App() {
  const cookies = new Cookies(null, { path: '/' });
  if (!cookies.get('userID'))
    cookies.set('userID', uuidv4(), {expires: new Date(new Date().setFullYear(new Date().getFullYear() + 50))});

  const [movieGuessFormat, setMovieGuessFormat] = useState([]);
  const [guessMLID, setGuessMLID] = useState(-1);
  const [guessRows, setGuessRows] = useState<React.ReactElement[]>([]);
  const [isSearchContainerHidden, setIsSearchContainerHidden] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    fetch('http://localhost:4000/getFormat')
      .then((response) => response.json())
      .then((data) => {setMovieGuessFormat(data['titleFormat'])})
      .catch((err) => {console.log(err)});
    fetch('http://localhost:4000/getExistingGuesses?' + new URLSearchParams({'userID': cookies.get('userID')}))
    .then((response) => response.json())
    .then((data) => {
      for (let i = 0; i < data.length; i++) {
        if (data[i]['isCorrect']) {
          setMovieGuessFormat(data[i]['title'].split('').join(' '));
          setIsSearchContainerHidden(true);
        }
      }
      addGuessedRows(data);
    })
    .catch((err) => {console.log(err)});
  }, []);

  const makeGuess = () => {
    if (!searchValue.trim()) return; // Prevent search if search bar is blank
    fetch('http://localhost:4000/makeGuess', {method: 'post', headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userID: cookies.get('userID'),
        guessMLID: guessMLID
      })
    })
    .then((response) => response.json())
    .then((data) => {
      if (data['result'] === 'over10') {
        setIsSearchContainerHidden(true);
        //alert('failed to insert - probably over ')
      } else {
        if (data['isCorrect'] == 1) {
          setMovieGuessFormat(data['title'].split('').join(' '));
          setIsSearchContainerHidden(true)
        }
        addGuessedRow(data);
      }
      setSearchValue(''); // Clear the search bar after making a guess
    });
  };
  

  const giveUpClick = () => {
    setIsSearchContainerHidden(true);
    fetch('http://localhost:4000/giveUp?' + new URLSearchParams({'userID': cookies.get('userID')}))
    .then(response => response.json())
    .then((data) => {
      console.log(data);
    })
    .catch(err => {
      console.log(err);
    });

  };
  
  function addGuessedRow(data: {isCorrect: boolean; guess: number; title: string; year: number; yearProximity: string; casts: []; genres: string; tags: []; }) {
      setGuessRows([Row(data), ...guessRows]);
  }

  function addGuessedRows(data: [{isCorrect: boolean; guess: number; title: string; year: number; yearProximity: string; casts: []; genres: string; tags: []; }]) {
    setGuessRows([...data.sort((a, b) => a.guess < b.guess ? 1 : -1).map((e) => Row(e)), ...guessRows]);
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="Flick Find Logo" />
      </header>
      <p style={{whiteSpace: 'pre'}}>{movieGuessFormat}</p>
      <div className="search-container" style={{ display: isSearchContainerHidden ? 'none' : 'block' }}>
        <div className="search-input-wrapper">
          <SearchBar setGuessMLID={setGuessMLID}searchValue={searchValue} setSearchValue={setSearchValue} />
          <span className="search-icon" onClick={makeGuess}>&#128269;</span>
          <button className="give-up-button" onClick={giveUpClick}>Give up</button>
        </div>
        
      </div>
      <div className='table'>
        <div className='row'>
          <div>Guess #</div>
          <div>Title</div>
          <div>Year</div>
          <div>Cast</div>
          <div>Genre</div>
          <div>Tags</div>
        </div>
        {guessRows}
      </div>
    </div>
  );
}

export default App;
