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

  useEffect(() => {
     fetch('http://localhost:4000/getFormat')
        .then((response) => response.json())
        .then((data) => {setMovieGuessFormat(data['titleFormat'])})
        .catch((err) => {console.log(err)});
  }, []);

  const makeGuess = () => {
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
      if (data['result'] === 'FAILED') {
        // popup showing that guess was not added due to error
      } else {
        // show if guess was correct or wrong
      }
    });
  };

  function addGuessedRow() {
    setGuessRows([Row(
      {
        "isCorrect": true,
        "guess": "5",
        "title": "Jumanji",
        "studio": {
            "name": "20th Century Fox",
            "isCorrect": true
        },
        "year": 2010,
        "yearProximity": "correct",
        "casts": [
            {
                "name": "First Actor Name",
                "relativity": "same_movie"
            },
            {
                "name": "Second Actor Name",
                "relativity": "adjacent_movie"
            },
            {
              "name": "Third Actor Name",
              "relativity": "no"
          }
        ],
        "genres": [
            "Genre 1",
            "Genre 2",
            "Genre 3"
        ],
        "tags": [
            "Tag 1",
            "Tag 2",
            "Tag 3"
        ]
    }
    ), ...guessRows]);
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="Flick Find Logo" />
      </header>
      <p style={{whiteSpace: 'pre'}}>{movieGuessFormat}</p>
      <div className="search-container">
        <div className="search-input-wrapper">
          <SearchBar setGuessMLID={setGuessMLID}/>
          <span className="search-icon" onClick={makeGuess}>&#128269;</span>
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
        {guessRows}
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
          <div className='closeElement'>2013</div>
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
