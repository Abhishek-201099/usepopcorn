import {useState,useEffect} from 'react';

const KEY='64f46069';

export function useMovies(query){
  const [movies, setMovies] = useState([]);
  const [isLoading,setIsLoading]=useState(false);
  const [error,setError]=useState('');


  useEffect(function(){
    const controller=new AbortController();
    async function fetchMovieList(){
      try{
      setIsLoading(true);
      setError('');
      const res=await fetch(`https://www.omdbapi.com/?apikey=${KEY}&s=${query}`,{signal:controller.signal});
      // if(!res.ok) throw new Error('Issue with the network')
      const data=await res.json();
      if(data.Response==='False') throw new Error('Movie not found')
      setMovies(data.Search);
      }catch(err){
        if(err.name!=='AbortError')
        setError(err.message);
      }finally{
        setIsLoading(false);
      }
    }

    if(query.length<3){
      setError('');
      setMovies([])
      return;
    }

    // handleClose(); not implemented.
    fetchMovieList();

    return function(){
      controller.abort();
    };
  },[query]);

  return {movies,isLoading,error};
}