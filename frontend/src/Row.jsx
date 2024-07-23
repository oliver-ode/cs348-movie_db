import React from 'react';

export default function Row({isCorrect, guess, title, year, yearProximity, casts, genres, tags}) {
    return (
        <div className={isCorrect?'row correct':'row'}>
            <div>{guess}</div>
            <div>{title}</div>
            <div className={isCorrect ? '' : yearProximity=='correct' ? 'correctElement' : ''}>
                {`${yearProximity=='high'||yearProximity=='low' ? (yearProximity=='high' ? '↓':'↑') : ''} ${year}`}
            </div>
            <div className="scrollable-container">
                {casts.map(c => <p className={isCorrect ? '' : c.proximity=='same' ? 'correctElement': c.proximity=='adjacent' ? 'closeElement' : ''}>{c.actorName}</p>)}
            </div>
            <div>
                {genres.map(g => <p className={isCorrect ? '' : g.proximity=='same' ? 'correctElement': g.proximity=='adjacent' ? 'closeElement' : ''}>{g.genre}</p>)}
            </div>
            <div>
                {tags.map(t => <p className={isCorrect ? '' : t.proximity=='same' ? 'correctElement': t.proximity=='adjacent' ? 'closeElement' : ''}>{t.tagTitle}</p>)}
            </div>
        </div>
    );
}
