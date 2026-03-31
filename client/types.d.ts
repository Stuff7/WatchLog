export type Result<T> = { data: T } | { err: Error };

export type Option<T> = T | null;

export type Tooltip = {
  text: string;
  id: string;
  left: number;
  top: number;
  element: HTMLElement;
  dropdown: boolean;
};

export type Profile = {
  id: string;
  name: string;
  open: boolean;
  list: Media[];
};

// -- EpisodeRef ----------------------------------------------------------------
export type EpisodeRef = {
  season: number;
  episode: number;
  name: string;
  air_date: Option<string>;
  overview: Option<string>;
  runtime: Option<number>;
  still: Option<string>;
};

// -- Media ---------------------------------------------------------------------
export type Media = {
  id: string;
  tmdb_id: number;
  name: string;
  language: string;
  genres: string[];
  status: Status;
  runtime: Option<number>;
  premiered: Option<string>;
  ended: Option<string>;
  rating: Option<number>;
  vote_count: Option<number>;
  network: Option<string>;
  overview: string;
  tagline: Option<string>;
  updated: number;
  poster: Option<string>;
  backdrop: Option<string>;
  media_type: "tv" | "movie";
  // TV only
  number_of_seasons: Option<number>;
  number_of_episodes: Option<number>;
  last_episode: Option<EpisodeRef>;
  next_episode: Option<EpisodeRef>;
  // Movie only
  release_date: Option<string>;
  watched: boolean;
};

export type Status =
  | "Returning Series"
  | "Ended"
  | "Canceled"
  | "In Production"
  | "Planned"
  | "Pilot"
  | "Released";

// -- MediaDetails --------------------------------------------------------------
export type MediaDetails = {
  media: Media;

  // Common
  cast: CastMember[];
  crew: CrewMember[];
  videos: Video[];
  images: {
    posters: DetailImage[];
    backdrops: DetailImage[];
    logos: DetailImage[];
  };
  similar: Media[];
  recommendations: Media[];
  keywords: string[];
  external_ids: ExternalIds;
  content_ratings: ContentRating[];

  // TV only
  seasons: SeasonDetails[];
  created_by: Person[];
  networks: NetworkInfo[];

  // Movie only
  collection: Option<Collection>;
  production_companies: ProductionCompany[];
  budget: Option<number>;
  revenue: Option<number>;
  watch_providers: WatchProviders;
};

export type CastMember = {
  id: number;
  name: string;
  character: string;
  cast_order: number;
  profile_photo: Option<string>;
  known_for: Option<string>;
};

export type CrewMember = {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_photo: Option<string>;
};

export type Person = {
  id: number;
  name: string;
  profile_photo: Option<string>;
};

export type Video = {
  id: string;
  name: string;
  key: string;
  site: string;
  type: VideoType;
  official: boolean;
  published_at: string;
};

export type VideoType =
  | "Trailer"
  | "Teaser"
  | "Clip"
  | "Featurette"
  | "Behind the Scenes"
  | "Bloopers";

export type DetailImage = {
  file_path: string;
  width: number;
  height: number;
  aspect_ratio: number;
  vote_average: number;
  language: Option<string>;
};

export type ExternalIds = {
  imdb_id: Option<string>;
  tvdb_id: Option<number>;
  instagram_id: Option<string>;
  twitter_id: Option<string>;
  facebook_id: Option<string>;
  wikidata_id: Option<string>;
};

export type ContentRating = {
  country: string;
  rating: string;
  descriptors: string[];
};

export type SeasonDetails = {
  id: number;
  season_number: number;
  name: string;
  overview: string;
  poster: Option<string>;
  air_date: Option<string>;
  episode_count: number;
  vote_average: number;
  episodes: EpisodeDetails[];
};

export type EpisodeDetails = {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  air_date: Option<string>;
  runtime: Option<number>;
  still: Option<string>;
  rating: Option<number>;
  vote_count: Option<number>;
  watched: boolean;
  directors: string[];
  writers: string[];
  guest_stars: CastMember[];
};

export type NetworkInfo = {
  id: number;
  name: string;
  logo: Option<string>;
  origin_country: string;
};

export type ProductionCompany = {
  id: number;
  name: string;
  logo: Option<string>;
  origin_country: string;
};

export type Collection = {
  id: number;
  name: string;
  poster: Option<string>;
  backdrop: Option<string>;
  parts: Media[];
};

export type WatchProviders = {
  [country: string]: {
    link: string;
    flatrate: WatchProvider[];
    rent: WatchProvider[];
    buy: WatchProvider[];
    free: WatchProvider[];
    ads: WatchProvider[];
  };
};

export type WatchProvider = {
  id: number;
  name: string;
  logo: Option<string>;
  display_priority: number;
};

// -- TMDB API response types ---------------------------------------------------
// Raw shapes returned by the TMDB API before mapping to internal types.
export namespace TMDB {
  export type Genre = {
    id: number;
    name: string;
  };

  export type ProductionCompany = {
    id: number;
    logo_path: Option<string>;
    name: string;
    origin_country: string;
  };

  export type ProductionCountry = {
    iso_3166_1: string;
    name: string;
  };

  export type SpokenLanguage = {
    english_name: string;
    iso_639_1: string;
    name: string;
  };

  export type Network = {
    id: number;
    logo_path: Option<string>;
    name: string;
    origin_country: string;
  };

  export type CreatedBy = {
    id: number;
    credit_id: string;
    name: string;
    gender: number;
    profile_path: Option<string>;
  };

  export type Season = {
    air_date: Option<string>;
    episode_count: number;
    id: number;
    name: string;
    overview: string;
    poster_path: Option<string>;
    season_number: number;
    vote_average: number;
  };

  export type EpisodeToAir = {
    id: number;
    name: string;
    overview: string;
    vote_average: number;
    vote_count: number;
    air_date: string;
    episode_number: number;
    episode_type: string;
    production_code: string;
    runtime: Option<number>;
    season_number: number;
    show_id: number;
    still_path: Option<string>;
  };

  export type TVStatus =
    | "Returning Series"
    | "Ended"
    | "Canceled"
    | "In Production"
    | "Planned"
    | "Pilot";

  export type TVSeries = {
    id: number;
    name: string;
    original_name: string;
    overview: string;
    poster_path: Option<string>;
    backdrop_path: Option<string>;
    adult: boolean;
    created_by: CreatedBy[];
    episode_run_time: number[];
    first_air_date: string;
    last_air_date: Option<string>;
    genres: Genre[];
    homepage: string;
    in_production: boolean;
    languages: string[];
    networks: Network[];
    number_of_episodes: number;
    number_of_seasons: number;
    origin_country: string[];
    original_language: string;
    popularity: number;
    production_companies: ProductionCompany[];
    production_countries: ProductionCountry[];
    seasons: Season[];
    spoken_languages: SpokenLanguage[];
    status: TVStatus;
    tagline: string;
    type: string;
    vote_average: number;
    vote_count: number;
    last_episode_to_air: Option<EpisodeToAir>;
    next_episode_to_air: Option<EpisodeToAir>;
  };

  export type MovieStatus =
    | "Rumored"
    | "Planned"
    | "In Production"
    | "Post Production"
    | "Released"
    | "Canceled";

  export type Movie = {
    id: number;
    title: string;
    original_title: string;
    overview: string;
    poster_path: Option<string>;
    backdrop_path: Option<string>;
    adult: boolean;
    belongs_to_collection: Option<{
      id: number;
      name: string;
      poster_path: Option<string>;
      backdrop_path: Option<string>;
    }>;
    budget: number;
    genres: Genre[];
    homepage: string;
    imdb_id: Option<string>;
    original_language: string;
    popularity: number;
    production_companies: ProductionCompany[];
    production_countries: ProductionCountry[];
    release_date: string;
    revenue: number;
    runtime: Option<number>;
    spoken_languages: SpokenLanguage[];
    status: MovieStatus;
    tagline: string;
    video: boolean;
    vote_average: number;
    vote_count: number;
  };

  export type SearchResult = {
    page: number;
    results: SearchResultItem[];
    total_pages: number;
    total_results: number;
  };

  export type SearchResultItem = {
    id: number;
    media_type: "tv" | "movie" | "person";
    name?: string;
    title?: string;
    original_name?: string;
    original_title?: string;
    overview: string;
    poster_path: Option<string>;
    backdrop_path: Option<string>;
    genre_ids: number[];
    original_language: string;
    popularity: number;
    vote_average: number;
    vote_count: number;
    first_air_date?: string;
    release_date?: string;
    adult: boolean;
  };

  export type Episode = {
    id: number;
    name: string;
    overview: string;
    air_date: Option<string>;
    episode_number: number;
    season_number: number;
    still_path: Option<string>;
    vote_average: number;
    vote_count: number;
    runtime: Option<number>;
    production_code: string;
    crew: EpisodeCrew[];
    guest_stars: EpisodeCastMember[];
  };

  export type EpisodeCrew = {
    id: number;
    credit_id: string;
    name: string;
    department: string;
    job: string;
    profile_path: Option<string>;
  };

  export type EpisodeCastMember = {
    id: number;
    credit_id: string;
    name: string;
    character: string;
    order: number;
    profile_path: Option<string>;
  };

  export type CastMember = {
    id: number;
    name: string;
    original_name: string;
    character: string;
    order: number;
    profile_path: Option<string>;
    known_for_department: string;
    popularity: number;
    credit_id: string;
    cast_id: number;
    adult: boolean;
    gender: number;
  };

  export type CrewMember = {
    id: number;
    name: string;
    original_name: string;
    department: string;
    job: string;
    profile_path: Option<string>;
    popularity: number;
    credit_id: string;
    adult: boolean;
    gender: number;
    known_for_department: string;
  };

  export type Credits = {
    cast: CastMember[];
    crew: CrewMember[];
  };

  export type Video = {
    id: string;
    iso_639_1: string;
    iso_3166_1: string;
    name: string;
    key: string;
    site: string;
    size: number;
    type: string;
    official: boolean;
    published_at: string;
  };

  export type VideosResponse = {
    results: Video[];
  };

  export type Images = {
    backdrops: Image[];
    posters: Image[];
    logos: Image[];
  };

  export type Image = {
    aspect_ratio: number;
    file_path: string;
    height: number;
    width: number;
    vote_average: number;
    vote_count: number;
    iso_639_1: Option<string>;
  };

  export type KeywordsResponse = {
    // TV uses "results", movie uses "keywords"
    results?: Keyword[];
    keywords?: Keyword[];
  };

  export type Keyword = {
    id: number;
    name: string;
  };

  export type ExternalIds = {
    id: number;
    imdb_id: Option<string>;
    tvdb_id: Option<number>;
    instagram_id: Option<string>;
    twitter_id: Option<string>;
    facebook_id: Option<string>;
    wikidata_id: Option<string>;
  };

  export type ContentRatingsResponse = {
    results: ContentRatingResult[];
  };

  export type ContentRatingResult = {
    iso_3166_1: string;
    rating: string; // TV: "TV-MA" etc.
    descriptors: string[];
  };

  export type ReleaseDatesResponse = {
    results: ReleaseDateCountry[];
  };

  export type ReleaseDateCountry = {
    iso_3166_1: string;
    release_dates: ReleaseDate[];
  };

  export type ReleaseDate = {
    certification: string; // Movie: "R", "PG-13" etc.
    descriptors: string[];
    iso_639_1: string;
    note: string;
    release_date: string;
    type: number; // 1=Premiere 2=Limited 3=Theatrical 4=Digital 5=Physical 6=TV
  };

  export type SeasonDetails = {
    _id: string;
    air_date: Option<string>;
    episodes: Episode[];
    name: string;
    overview: string;
    id: number;
    poster_path: Option<string>;
    season_number: number;
    vote_average: number;
  };

  export type WatchProvidersResponse = {
    results: {
      [country: string]: {
        link: string;
        flatrate?: WatchProvider[];
        rent?: WatchProvider[];
        buy?: WatchProvider[];
        free?: WatchProvider[];
        ads?: WatchProvider[];
      };
    };
  };

  export type WatchProvider = {
    logo_path: string;
    provider_id: number;
    provider_name: string;
    display_priority: number;
  };
}
