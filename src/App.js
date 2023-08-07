import { useEffect, useRef, useState } from "react";
import StarRating from './StarRating';
import {useMovies} from './useMovies';
import { useLocalStorageState } from "./useLocalStorageState";
import { useKey } from "./useKey";

const average = (arr) =>arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

const KEY='64f46069';


export default function App() {
  const [query, setQuery] = useState("");
  const [selectedID,setSelectedID]=useState(null);
  const {movies,isLoading,error}=useMovies(query);
  const [watched,setWatched]=useLocalStorageState([],'watched');

  function handleSelect(id){
    setSelectedID(selectedID=>selectedID===id?null:id);
  }

  function handleClose(){
    setSelectedID(null);
  }

  function handleAddWatched(newWatchedMovie){
    setWatched(watched=>[...watched,newWatchedMovie])
  }

  function handleDeleteWatched(id){
    setWatched(watched=>watched.filter(movie=>movie.imdbID!==id));
  }
  
  return (
    <>
      <Navbar>
        <Search query={query} setQuery={setQuery}/>
        <NumResults movies={movies}/>
      </Navbar>
      <Main>
        <Box>
          {isLoading && <Loader/>}
          {!isLoading && !error && <MovieList movies={movies} onMovieSelect={handleSelect}/>}
          {error && <ErrorMessage message={error}/>}
        </Box>
        <Box>
          {selectedID ? <MovieDetails selectedID={selectedID}  onClose={handleClose} onAddWatched={handleAddWatched} watched={watched}/> :
           <>
            <WatchedSummary watched={watched}/>
            <WatchedMoviesList watched={watched} onDeleteWatched={handleDeleteWatched}/>
           </>}
        </Box>
      </Main>
    </>
  );
}

function Loader(){
  return <p className="loader">Loading...</p>
}

function ErrorMessage({message}){
  return (
  <p className="error">
    <span>⛔</span>{message}
  </p>
  );
}

// ****************************
// Navbar implementation

function Navbar({children}){ 

  return (
    <nav className="nav-bar">
      <Logo/>
      {children}  
    </nav>
  );
}

function Logo(){
  return (
    <div className="logo">
          <span role="img">🍿</span>
          <h1>usePopcorn</h1>
        </div>
  );
}

function Search({query,setQuery}){
  const inputEl=useRef(null);

  useEffect(function(){inputEl.current.focus()},[]);

  useKey('Enter',function(){
    if(document.activeElement===inputEl.current) return;
    inputEl.current.focus();
    setQuery('');
  })

  return (
    <input
          className="search"
          type="text"
          placeholder="Search movies..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          ref={inputEl}
    />
  );
}

function NumResults({movies}){
  return (
    <p className="num-results">
          {/* Found <strong>{movies.length}</strong> results */}
          Found <strong>{movies.length}</strong> results
    </p>
  );
}

// ****************************
// MAIN CONTENT - CONTAINS TWO LIST BOXES

function Main({children}){

  return (
    <main className="main">     
      {children}
    </main> 
  );
}

function Box({children}){
  const [isOpen, setIsOpen] = useState(true); 
  return (
    <div className="box">
          <button
            className="btn-toggle"
            onClick={() => setIsOpen((open) => !open)}
          >
            {isOpen ? "–" : "+"}
          </button>
          {isOpen && children}
    </div>
  );
}


function MovieList({movies,onMovieSelect}){

  return (
    <ul className="list list-movies">
          {movies?.map((movie) => <Movie key={movie.imdbID} movie={movie} onMovieSelect={onMovieSelect}/>)
          }
    </ul>
  );
}

function Movie({movie,onMovieSelect}){
  return (
    <li onClick={()=>onMovieSelect(movie.imdbID)}>
        <img src={movie.Poster} alt={`${movie.Title} poster`} />
        <h3>{movie.Title}</h3>
        <div>
          <p>
          <span>🗓</span>
          <span>{movie.Year}</span>
          </p>
        </div>
    </li>
  );
}

function MovieDetails({selectedID,onClose,onAddWatched,watched}){
  const [movie,setMovie]=useState({});
  const [isLoading,setIsLoading]=useState(false);
  const [userRating,setUserRating]=useState('');
  const countRef=useRef(0);

  const isWatched=watched.map(movie=>movie.imdbID).includes(selectedID);

  const watchedUserRating=watched.find(movie=>movie.imdbID===selectedID)?.userRating;

  useEffect(function(){
    if(userRating) countRef.current++;
  },[userRating]);

  function handleAdd(){
    onAddWatched({
      imdbID:selectedID,
      Poster:movie.Poster,
      Title:movie.Title,
      imdbRating:Number(movie.imdbRating),
      runtime:Number(movie.Runtime.split(' ')[0]),
      userRating,
      countRatingDescisions:countRef.current
    });
    onClose();
  }

  useEffect(function(){
    async function fetchMovieDetails(){
      setIsLoading(true);
      const res=await fetch(`http://www.omdbapi.com/?apikey=${KEY}&i=${selectedID}`);
      const data= await res.json();
      setMovie(data);
      setIsLoading(false);
    }
    fetchMovieDetails();
  },[selectedID])

  useEffect(function(){
    if(!movie.Title) return;
    document.title=`Movie | ${movie.Title}`;

    return function(){
      document.title='usepopcorn';
    }
  },[movie.Title]);

  useKey('Escape',onClose);

 return (
  <div className="details">
    {isLoading ? <Loader/> : 
     <>
      <header>
        <button className="btn-back" onClick={onClose}>&larr;</button>
        <img src={movie.Poster} alt={`Poster of ${movie.Title} movie`}/>
        <div className="details-overview">
          <h2>{movie.Title}</h2>
          <p>{movie.Released} &bull; {movie.Runtime}</p>
          <p><span>⭐</span>{movie.imdbRating}</p>
        </div>
      </header>
      <section>
        <div className="rating">
          { !isWatched ?
          <>
            <StarRating maxRating={10} size={24} onSetRating={setUserRating}/>
            {userRating>0 && <button className="btn-add" onClick={handleAdd}>+ Add to list</button>} 
          </>
          : <p>You have rated this movie <span>⭐</span>{watchedUserRating}</p>
          }
        </div>
        <p><em>{movie.Plot}</em></p>
        <p>Starring : {movie.Actors}</p>
        <p>Directed by {movie.Director}</p>
      </section>
     </>
    }
  </div>  
);
}

function WatchedSummary({watched}){
  const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
  const avgUserRating = average(watched.map((movie) => movie.userRating));
  const avgRuntime = average(watched.map((movie) => movie.runtime));

  return (
    <div className="summary">
       <h2>Movies you watched</h2>
        <div>
           <p>
              <span>#️⃣</span>
              <span>{watched.length} movies</span>
           </p>
           <p>
             <span>⭐️</span>
             <span>{avgImdbRating.toFixed(2)}</span>
          </p>
          <p>
            <span>🌟</span>
            <span>{avgUserRating.toFixed(2)}</span>
          </p>
          <p>
           <span>⏳</span>
           <span>{avgRuntime.toFixed(2)} min</span>
          </p>
        </div>
     </div>
  );
}

function WatchedMoviesList({watched,onDeleteWatched}){
  return (
    <ul className="list">
                {watched.map((movie) => <WatchedMovie movie={movie} key={movie.imdbID} onDeleteWatched={onDeleteWatched}/>)}
      </ul>
  );
}

function WatchedMovie({movie,onDeleteWatched}){
  return (
    <li >
          <img src={movie.Poster} alt={`${movie.Title} poster`} />
            <h3>{movie.Title}</h3>
              <div>
                <p>
                  <span>⭐️</span>
                  <span>{movie.imdbRating}</span>
                </p>
                <p>
                <span>🌟</span>
                <span>{movie.userRating}</span>
                </p>
                <p>
                <span>⏳</span>
                <span>{movie.runtime} min</span>
                </p>
                <button className='btn-delete' onClick={()=>onDeleteWatched(movie.imdbID)} >X</button>
              </div>
     </li>
  );
}
 
// ****************************
