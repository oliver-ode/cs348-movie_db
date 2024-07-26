import React from 'react';
import './App.css';

interface HelpModalProps {
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="help-modal">
      <div className="help-modal-content">
        <span className="close-button" onClick={onClose}>&times;</span>
        <h2>How to Play</h2>
        <p>Guess the movie title in as few attempts as possible.</p>
        <p>Each guess must be a valid movie title.</p>
        <p>After each guess, the proximity of each element (year, cast, genre, tags) will be shown.</p>
        <h3>Indicators</h3>
        <p><span className="correctElement">Correct</span>: The guessed element is correct.</p>
        <p><span className="closeElement">Adjacent</span>: The guessed element is close to the element in today's secret movie. For actors, this means that they aren't in the MOTD, but have acted with an actor in the MOTD. For tags/genres, this means that the tag/genre is slightly relateed to the movie, but only has a relevancy score of .5-.7</p>
      </div>
    </div>
  );
};

export default HelpModal;
