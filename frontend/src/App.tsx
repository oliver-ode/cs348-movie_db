import React, { useState, useEffect } from 'react';
import './App.css';
import Cookies from 'universal-cookie';
import { v4 as uuidv4 } from 'uuid';
import SearchBar from './SearchComp';
import logo from './assets/FlickFindLogo.png';
import Row from './Row'
import HelpModal from './HelpModal';

function App() {
  const cookies = new Cookies(null, { path: '/' });
  if (!cookies.get('userID'))
    cookies.set('userID', uuidv4(), {expires: new Date(new Date().setFullYear(new Date().getFullYear() + 50))});

  const [movieGuessFormat, setMovieGuessFormat] = useState([]);
  const [guessMLID, setGuessMLID] = useState(-1);
  const [guessRows, setGuessRows] = useState<React.ReactElement[]>([]);
  const [isSearchContainerHidden, setIsSearchContainerHidden] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isHelpModalVisible, setIsHelpModalVisible] = useState(false); // State for help modal visibility

  useEffect(() => {
    fetch('http://localhost:4000/getFormat')
      .then((response) => response.json())
      .then((data) => {setMovieGuessFormat(data['titleFormat'])})
      .catch((err) => {console.log(err)});
    fetch('http://localhost:4000/getExistingGuesses?' + new URLSearchParams({'userID': cookies.get('userID')}))
    .then((response) => response.json())
    .then((data) => {
      for (let i = 0; i < data.length; i++) {
        if (data[i]['isCorrect'] || data[i]['giveUp']) {
          setMovieGuessFormat(data[i]['title'].split('').join(' '));
          setIsSearchContainerHidden(true);
        }
        if (data[i]['maxGuessesReached'] == 1) {
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
      addGuessedRow(data);
      setSearchValue(''); // Clear the search bar after making a guess
      if (data['isCorrect'] == 1) {
        setMovieGuessFormat(data['title'].split('').join(' '));
        setIsSearchContainerHidden(true)
      }
      if (data['maxGuessesReached'] == 1) {
        setIsSearchContainerHidden(true);
        giveUpClick();
      }
    });
  };

  const giveUpClick = () => {
    setIsSearchContainerHidden(true);
    fetch('http://localhost:4000/giveUp?' + new URLSearchParams({'userID': cookies.get('userID')}))
      .then(response => response.json())
      .then((data) => {
        addGuessedRow(data);
        setMovieGuessFormat(data['title'].split('').join(' '));
      })
      .catch(err => {
        console.log(err);
      });
  };
  
  function addGuessedRow(data: {isCorrect: boolean; giveUp: boolean; guess: number; title: string; year: number; yearProximity: string; casts: []; genres: string; tags: []; }) {
    setGuessRows(oldRows => [Row(data), ...oldRows]);
  }

  function addGuessedRows(data: [{isCorrect: boolean; giveUp: boolean; guess: number; title: string; year: number; yearProximity: string; casts: []; genres: string; tags: []; }]) {
    setGuessRows(oldRows => [...data.sort((a, b) => !a.guess ? -1 : a.guess < b.guess ? 1 : -1).map((e) => Row(e)), ...guessRows]);
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="Flick Find Logo" />
        <button className="help-button" onClick={() => setIsHelpModalVisible(true)}>?</button>
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
      {isHelpModalVisible && <HelpModal onClose={() => setIsHelpModalVisible(false)} />} {/* Help Modal */}
    </div>
  );
}

export default App;
