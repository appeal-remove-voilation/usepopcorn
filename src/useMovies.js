import { useState, useEffect } from "react";
export function useMovies(query) {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [movies, setMovies] = useState([]);
  const key = "e8dcccca";
  useEffect(
    function () {
      const controller = new AbortController();
      async function getMovie() {
        try {
          setError("");
          setIsLoading(true);
          if (query.length < 3) return;
          const res = await fetch(
            `http://www.omdbapi.com/?apikey=${key}&s=${query}`,
            { signal: controller.signal }
          );
          if (!res.ok) throw new Error("movie not found");

          const data = await res.json();

          if (data.Response === "False") throw new Error("movie not found");
          setMovies(data.Search);
          setError("");
        } catch (err) {
          if (err.name !== "AbortError") {
            setError(err.message);
          }
        } finally {
          setIsLoading(false);
        }
      }
      getMovie();
      return function () {
        controller.abort();
      };
    },
    [query]
  );
  return [error, isLoading, movies];
}
