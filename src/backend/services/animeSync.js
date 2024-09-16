import { print, setVerbose } from "../utils/logger.js";
import configLoader from "../utils/configLoader.js";
import imaget from "../utils/imaget.js";
import mal from "../utils/mal.js";

const CONCURRENCY_LIMIT = 20;

async function fetchAnimeList(username, order, status) {
  const animes = [];
  const animelist = await mal.getAnimeList({ username, order, status });

  const queue = [...animelist];
  const workers = Array(CONCURRENCY_LIMIT)
    .fill(null)
    .map(() => processQueue(queue, animes, animelist.length));

  await Promise.all(workers);

  return animes;
}

async function processQueue(queue, animes, total) {
  while (queue.length > 0) {
    const anime = queue.shift();
    try {
      const img = await imaget.save({
        url: anime.image,
        id: anime.id,
        location: "src/assets/img/covers",
      });
      animes.push({ ...anime, image: img.path.replace("src", "") });
      const progress = (animes.length / total) * 100;

      if (img.new) {
        print(
          `%SA  %Y•% saving covers ${animes.length}/${total} ${progress.toFixed(
            2
          )}%`
        );
      }
    } catch (error) {
      print(`  %R✗% anime ${anime.id}: ${error.message}`);
    }
  }
}

export default class animeSync {
  static start = async (cache) => {
    print(`%Y↺% loading anime sync...`);
    while (true) {
      const { user, animeSync } = configLoader();
      const { username } = user.accounts.myanimelist;
      setVerbose(animeSync.verbose);
      if (!animeSync.enabled) {
        print("%SA  %R✗% animeSync %Rdisabled%");
        await new Promise((resolve) =>
          setTimeout(resolve, animeSync.syncInterval)
        );
        continue;
      }

      try {
        const animes = await fetchAnimeList(username, "last_updated", 7);
        cache.set(username.toLowerCase(), animes);
        print("%SA  %G✓% done");
      } catch (error) {
        print(error);
      }
      await new Promise((resolve) =>
        setTimeout(resolve, animeSync.syncInterval)
      );
    }
  };
}
