import React from 'react';
import Autosuggest from 'react-autosuggest';

// Teach Autosuggest how to calculate suggestions for any given input value.
const getSuggestions = async value => {
  const inputValue = value.trim().toLowerCase();
  const inputLength = inputValue.length;

  if (inputLength < 1) return [];
  return fetch('http://localhost:4000/titleSearch?' + new URLSearchParams({'title': inputValue}))
    .then((response) => response.json())
    .then((data) => {return(data['results'])})
    .catch((err) => {console.log(err)});
};

// When suggestion is clicked, Autosuggest needs to populate the input
// based on the clicked suggestion. Teach Autosuggest how to calculate the
// input value for every given suggestion.
const getSuggestionValue = suggestion => suggestion.mlTitle + ` (${suggestion.releaseYear})`;

// Use your imagination to render suggestions.
const renderSuggestion = suggestion => (
  <div>
    {suggestion.mlTitle + ` (${suggestion.releaseYear})`}
  </div>
);

export default class SearchBar extends React.Component {
  constructor(props) {
    super();

    // Autosuggest is a controlled component.
    // This means that you need to provide an input value
    // and an onChange handler that updates this value (see below).
    // Suggestions also need to be provided to the Autosuggest,
    // and they are initially empty because the Autosuggest is closed.
    this.state = {
      value: '',
      suggestions: [],
      setGuessMLID: props.setGuessMLID
    };
  }

  onChange = (event, { newValue }) => {
    this.setState({
      value: newValue
    });
  };

  // Autosuggest will call this function every time you need to update suggestions.
  // You already implemented this logic above, so just use it.
  onSuggestionsFetchRequested = async ({ value }) => {
    this.setState({
      suggestions: await getSuggestions(value)
    });
  };

  // Autosuggest will call this function every time you need to clear suggestions.
  onSuggestionsClearRequested = () => {
    this.setState({
      suggestions: []
    });
  };

  onSuggestionSelected = (event, { suggestion }) => {
    this.state.setGuessMLID(suggestion['mlID'])
    // console.log(suggestion)
  }

  render() {
    const { value, suggestions } = this.state;

    // Autosuggest will pass through all these props to the input.
    const inputProps = {
      placeholder: 'Guess a Movie',
      value,
      onChange: this.onChange
    };

    // Finally, render it!
    return (
      <Autosuggest
        suggestions={suggestions}
        onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
        onSuggestionsClearRequested={this.onSuggestionsClearRequested}
        getSuggestionValue={getSuggestionValue}
        renderSuggestion={renderSuggestion}
        inputProps={inputProps}
        onSuggestionSelected={this.onSuggestionSelected}
      />
    );
  }
}