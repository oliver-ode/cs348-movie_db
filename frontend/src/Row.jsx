import React from 'react';


export default function Row({isCorrect, guess, title, studio, year, yearProximity, casts, genres, tags}) {

    return (
        <div className={isCorrect?'row correct':'row'}>
            <div>{guess}</div>
            <div>{title}</div>
            <div>{studio.name}</div>
            <div className={isCorrect ? '' : yearProximity=='correct' ? 'correctElement' : ''}>{`${yearProximity=='high'||yearProximity=='low' ? (yearProximity=='high' ? '↑':'↓') : ''} ${year}`}</div>
            <div>
                {casts.map(c => <p className={isCorrect ? '' : c.relativity=='same_movie' ? 'correctElement': c.relativity=='adjacent_movie' ? 'closeElement' : ''}>{c.name}</p>)}
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