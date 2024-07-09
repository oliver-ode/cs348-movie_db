import React from 'react';


export default function Row({isCorrect, guess, title, studio, year, yearProximity, casts, genres, tags}) {

    return (
        <div className={isCorrect?'row correct':'row'}>
            <div>{guess}</div>
            <div>{title}</div>
            <div>{studio}</div>
            <div className={isCorrect ? '' : yearProximity=='correct' ? 'correctElement' : ''}>{`${yearProximity=='high'||yearProximity=='low' ? (yearProximity=='high' ? '↑':'↓') : ''} ${year}`}</div>
            <div>
                {casts.map(c => <p className={isCorrect ? '' : c.proximity=='same' ? 'correctElement': c.proximity=='adjacent' ? 'closeElement' : ''}>{c.actorName}</p>)}
            </div>
            <div>
                {genres.map(g => <p>{g}</p>)}
            </div>
            <div>
                {tags.map(t => <p>{t}</p>)}
            </div>
        </div>
    );
}