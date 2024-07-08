import React, { useState, useEffect } from 'react';
import './App.css';
import Cookies from 'universal-cookie';
import { v4 as uuidv4 } from 'uuid';
import Example from './SearchComp';
import logo from './assets/FlickFindLogo.png';

function App() {
  const upArrow = '↑';
  const downArrow = '↓';

  const cookies = new Cookies(null, { path: '/' });
  if (!cookies.get('userID'))
    cookies.set('userID', uuidv4(), {expires: new Date(new Date().setFullYear(new Date().getFullYear() + 50))});

  const [movieGuessFormat, setMovieGuessFormat] = useState([]);
  useEffect(() => {
     fetch('http://localhost:4000/getFormat')
        .then((response) => response.json())
        .then((data) => {setMovieGuessFormat(data['titleFormat'])})
        .catch((err) => {console.log(err)});
  }, []);

  const [guessMLID, setGuessMLID] = useState(-1);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      searchClick();
    }
  };

  const searchClick = () => {
    fetch('http://localhost:4000/makeGuess', {
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userID: cookies.get('userID'),
        guessMLID: guessMLID,
        searchTerm: searchTerm
      })
    })
    .then((response) => response.json())
    .then((data) => {
      if (data['result'] === 'FAILED') {
        // Handle failure
      } else {
        // Handle success
      }
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="Flick Find Logo" />
      </header>
      <p style={{whiteSpace: 'pre'}}>{movieGuessFormat}</p>
      <div className="search-container">
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Search movies here"
            value={searchTerm}
            onChange={handleSearchInputChange}
            onKeyPress={handleKeyPress}
          />
          <span className="search-icon">&#128269;</span>
        </div>
        <button className="give-up-button">Give up</button>
      </div>
      <div className='table'>
        <div className='row'>
          <div>Guess #</div>
          <div>Title</div>
          <div>Studio</div>
          <div>Year</div>
          <div>Cast</div>
          <div>Genre</div>
          <div>Tags</div>
        </div>
        <div className='row correct'>
          <div>9</div>
          <div>The Maze Runner</div>
          <div>20th Century Fox</div>
          <div>2014</div>
          <div>
            <p>Dylan O'Brien</p>
            <p>Kaya Scodelario</p>
            <p>Will Poulter</p>
          </div>
          <div>
            <p>Action</p>
            <p>Mystery</p>
            <p>Sci-fi</p>
          </div>
          <div></div>
        </div>
        <div className='row'>
          <div>8</div>
          <div>The Lone Ranger</div>
          <div className='correctElement'>20th Century Fox</div>
          <div className='closeElement'>{upArrow} 2013</div>
          <div>
            <p>Johnny Depp</p>
            <p>Armie Hammer</p>
          </div>
          <div>
            <p>Horror</p>
          </div>
          <div className='correctElement'>
            <p>Aliens</p>
            <p>War</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
