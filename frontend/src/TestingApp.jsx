import React, { useState, useEffect } from 'react';
import './App.css';
import Cookies from 'universal-cookie';
import { v4 as uuidv4 } from 'uuid';
import Example from './SearchComp'

function TestingApp() {
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

  // const [textInput, setTextInput] = useState('');
  // const [testing, setTesting] = useState([]);
  // const handleClick = () => {
  //   fetch('http://localhost:4000/titleSearch?' + new URLSearchParams({'title': textInput}))
  //        .then((response) => response.json())
  //        .then((data) => {setTesting(data['results'])})
  //        .catch((err) => {console.log(err)})
  // }
  // const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   setTextInput(event.target.value);
  // }

  return (
    <div className="App">
      <p style={{whiteSpace: 'pre'}}>{movieGuessFormat}</p>
      <Example />
      {/* <div>
        <input onChange={handleChange} placeholder={"Search movies here"}/>
        <button onClick={handleClick}>Search</button>
      </div>
      <p>{JSON.stringify(testing)}</p> */}
    </div>
  );
}

export default TestingApp;
