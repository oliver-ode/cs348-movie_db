import React from 'react';

export default function Row({isCorrect, giveUp, guess, title, year, yearProximity, casts, genres, tags}) {
    return (
        <div className={isCorrect ? 'row correct' : giveUp ? 'row giveUp' : 'row'}>
            <div>{guess ? guess : ''}</div>
            <div>{title}</div>
            <div className={isCorrect||giveUp ? '' : yearProximity == 'correct' ? 'correctElement' : ''}>
                {yearProximity == 'high' || yearProximity == 'low' ? (yearProximity == 'high' ? '↓' : '↑') : ''} {year}
            </div>
            <div className="scrollable-container">
                {casts.map((c, index) => <p key={index} className={isCorrect||giveUp ? '' : c.proximity == 'same' ? 'correctElement' : c.proximity == 'adjacent' ? 'closeElement' : ''}>{c.actorName}</p>)}
            </div>
            <div>
                {genres.map((g, index) => <p key={index} className={isCorrect||giveUp ? '' : g.proximity == 'same' ? 'correctElement' : g.proximity == 'adjacent' ? 'closeElement' : ''}>{g.genre}</p>)}
            </div>
            <div>
                {tags.map((t, index) => <p key={index} className={isCorrect||giveUp ? '' : t.proximity == 'same' ? 'correctElement' : t.proximity == 'adjacent' ? 'closeElement' : ''}>{t.tagTitle}</p>)}
            </div>
        </div>
    );
}
