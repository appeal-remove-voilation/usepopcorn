import { useEffect, useRef, useState } from "react";
import StarRating from "./StarRating";
import { useKey } from "./useKey";
import { useLocalStorageState } from "./useLocalStorageState";
import { useMovies } from "./useMovies";

const average = arr =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

export default function App() {
  const [query, setQuery] = useState("");

  const [selectedId, setSelectedId] = useState(null);
  const [rating, setRating] = useState(null);
  const [watched, setWatched] = useLocalStorageState([], "watched");
  const [error, isLoading, movies] = useMovies(query);

  function setId(selectedId) {
    setSelectedId(id => (id === selectedId ? null : selectedId));
  }
  function handleClose() {
    setSelectedId(null);
  }
  function handleWatch(movie) {
    setWatched(mov => [...mov, movie]);
    setSelectedId(null);
    setRating(null);
  }

  function deleteWatched(id) {
    setWatched(w => w.filter(mov => mov.imdbID !== id));
  }
  return (
    <>
      <Nav>
        <Logo />
        <SearchInput query={query} setQuery={setQuery} />
        <NumResults movies={movies} />
      </Nav>
      <Main>
        <Box>
          {isLoading ? (
            <Loading />
          ) : (
            <>
              {error ? (
                <ErrorMessage error={error} />
              ) : (
                <MovieList movies={movies} setId={setId} />
              )}
            </>
          )}
        </Box>
        <Box>
          {selectedId ? (
            <MovieDetail
              onClose={handleClose}
              setWatch={handleWatch}
              id={selectedId}
              rating={rating}
              setRating={setRating}
              watched={watched}
            />
          ) : (
            <>
              <WatchedSummary watched={watched} />
              <WatchedMoviesList
                deleteWatched={deleteWatched}
                rating={rating}
                watched={watched}
              />
            </>
          )}
        </Box>
      </Main>
    </>
  );
}
function Nav({ children }) {
  return <nav className="nav-bar">{children}</nav>;
}

function Logo() {
  return (
    <div className="logo">
      <span role="img">🍿</span>
      <h1>usePopcorn</h1>
    </div>
  );
}

function SearchInput({ query, setQuery }) {
  const inpulEl = useRef(null);
  useKey("enter", function () {
    if (document.activeElement === inpulEl.current) return;
    inpulEl.current.focus();
    setQuery("");
  });
  return (
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      onChange={e => setQuery(e.target.value)}
      ref={inpulEl}
    />
  );
}

function NumResults({ movies }) {
  return (
    <p className="num-results">
      Found <strong>{movies.length}</strong> results
    </p>
  );
}

function Main({ children }) {
  return <main className="main">{children}</main>;
}
function ErrorMessage({ error }) {
  return (
    <div className="error">
      <p>⛔️ {error}</p>
    </div>
  );
}
function Loading() {
  return (
    <div className="loader">
      <span>Loading ...</span>
    </div>
  );
}
function Box({ children }) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="box">
      <Button handleClick={() => setIsOpen(open => !open)}>
        <span>{isOpen ? "–" : "+"}</span>
      </Button>
      {isOpen && children}
    </div>
  );
}

function MovieList({ movies, setId }) {
  return (
    <ul className="list list-movies">
      {movies?.map(movie => (
        <Movie key={movie.imdbID} setId={setId} movie={movie} />
      ))}
    </ul>
  );
}

function Movie({ movie, setId }) {
  return (
    <li onClick={() => setId(movie.imdbID)}>
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

function WatchedSummary({ watched }) {
  const avgImdbRating = average(watched?.map(movie => movie.imdbRating));
  const avgUserRating = average(watched?.map(movie => movie.userRating));

  const avgRuntime = average(
    watched
      ?.map(movie => {
        if (movie.Runtime.length > 4) {
          return +movie.Runtime.split(" ").shift();
        } else {
          return NaN; // Return NaN for movies with runtimes <= 4 characters
        }
      })
      .filter(runtime => !isNaN(runtime)) // Remove NaN values
  );

  return (
    <div className="summary">
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched?.length} movies</span>
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

function WatchedMoviesList({ watched, rating, deleteWatched }) {
  return (
    <ul className="list">
      {watched?.map(movie => (
        <WatchedMovies
          deleteWatched={deleteWatched}
          rating={rating}
          movie={movie}
          key={movie.imdbID}
        />
      ))}
    </ul>
  );
}

function WatchedMovies({ movie, deleteWatched }) {
  return (
    <li>
      <button
        onClick={() => deleteWatched(movie.imdbID)}
        className="btn-delete"
      >
        &times;
      </button>
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
          <span>{movie.Runtime}</span>
        </p>
      </div>
    </li>
  );
}

function MovieDetail({ id, onClose, watched, setWatch, rating, setRating }) {
  const [isLoading, setIsLoading] = useState(false);

  const key = "e8dcccca";
  const [movie, setMovie] = useState({});
  const [ratedMovie] = watched?.filter(movie => movie.imdbID === id);

  useEffect(
    function () {
      async function getMovie() {
        try {
          setIsLoading(true);
          const res = await fetch(
            `http://www.omdbapi.com/?apikey=${key}&i=${id}`
          );
          if (!res.ok) throw new Error("movie not found");

          const data = await res.json();

          if (data.Response === "False") throw new Error("movie not found");
          setMovie(data);
        } catch (err) {
          console.log(err.message);
        } finally {
          setIsLoading(false);
        }
      }
      getMovie();
    },
    [id]
  );
  useEffect(() => {
    if (!movie.Title) return;
    document.title = `Movie | ${movie.Title}`;
    return function () {
      document.title = "usePopcorn";
    };
  }, [movie.Title]);
  useKey("escape", onClose);
  return isLoading ? (
    <Loading />
  ) : (
    <>
      <div className="details">
        <button className="btn-back" onClick={onClose}>
          &larr;{" "}
        </button>
        <header>
          <img src={movie.Poster} alt={movie.Title}></img>
          <div className="details-overview">
            <h2>{movie.Title}</h2>
            <p>
              {movie.Released} {movie.Runtime}
            </p>
            <p>{movie.Genre}</p>
            <p>{movie.imdbRating} imdb Rating</p>
          </div>
        </header>
        <section>
          {ratedMovie ? (
            <span className="rating">
              You rated this movie 🌟{ratedMovie.userRating}{" "}
            </span>
          ) : (
            <span className="rating">
              <StarRating size={24} maxRating={10} onSetRating={setRating} />
              {rating && (
                <button
                  className="btn-add"
                  onClick={() => setWatch({ ...movie, userRating: rating })}
                >
                  + Add to list
                </button>
              )}
            </span>
          )}
          <p>{movie.Plot}</p>
          <p>{movie.Actors}</p>
          <p>Directed by {movie.Director}</p>
        </section>
      </div>
    </>
  );
}

function Button({ handleClick, children }) {
  return (
    <button className="btn-toggle" onClick={handleClick}>
      {children}
    </button>
  );
}
