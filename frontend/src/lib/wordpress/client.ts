import { getEnv } from '../env';

/**
 * Custom error class for WordPress API errors
 * Handles network errors, HTTP errors, and GraphQL errors
 */
export class WordPressAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public graphqlErrors?: Array<{ message: string; locations?: Array<{ line: number; column: number }>; path?: string[] }>
  ) {
    super(message);
    this.name = 'WordPressAPIError';
    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WordPressAPIError);
    }
  }

  /**
   * Check if error is a network error
   */
  isNetworkError(): boolean {
    return this.statusCode === undefined && this.graphqlErrors === undefined;
  }

  /**
   * Check if error is an HTTP error
   */
  isHttpError(): boolean {
    return this.statusCode !== undefined && this.statusCode >= 400;
  }

  /**
   * Check if error is a GraphQL error
   */
  isGraphQLError(): boolean {
    return this.graphqlErrors !== undefined && this.graphqlErrors.length > 0;
  }
}

export interface FetchGraphQLOptions {
  /** Cache revalidation time in seconds (default: 60) */
  revalidate?: number;
  /** Cache tags for on-demand revalidation */
  tags?: string[];
}

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; locations?: Array<{ line: number; column: number }>; path?: string[] }>;
}


/**
 * Fetches data from WordPress GraphQL API
 * 
 * @param query - GraphQL query string
 * @param variables - Optional query variables
 * @param options - Fetch options including revalidate time and cache tags
 * @returns Promise resolving to typed data
 * @throws WordPressAPIError on network, HTTP, or GraphQL errors
 */
export async function fetchGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>,
  options?: FetchGraphQLOptions
): Promise<T> {
  const { revalidate = 60, tags = [] } = options || {};
  const endpoint = getEnv().WORDPRESS_GRAPHQL_ENDPOINT;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
      next: { revalidate, tags },
    });

    if (!response.ok) {
      throw new WordPressAPIError(
        `HTTP error: ${response.status} ${response.statusText}`,
        response.status
      );
    }

    const json: GraphQLResponse<T> = await response.json();

    if (json.errors && json.errors.length > 0) {
      throw new WordPressAPIError(
        json.errors[0].message,
        undefined,
        json.errors
      );
    }

    if (!json.data) {
      throw new WordPressAPIError('No data returned from GraphQL query');
    }

    return json.data;
  } catch (error) {
    // Re-throw WordPressAPIError as-is
    if (error instanceof WordPressAPIError) {
      throw error;
    }

    // Wrap other errors (network errors, JSON parse errors, etc.)
    if (error instanceof Error) {
      throw new WordPressAPIError(error.message);
    }

    throw new WordPressAPIError('Unknown error occurred while fetching data');
  }
}

/**
 * Creates a GraphQL client instance with pre-configured options
 */
export function createGraphQLClient(defaultOptions?: FetchGraphQLOptions) {
  return {
    fetch: <T>(
      query: string,
      variables?: Record<string, unknown>,
      options?: FetchGraphQLOptions
    ): Promise<T> => {
      return fetchGraphQL<T>(query, variables, {
        ...defaultOptions,
        ...options,
      });
    },
  };
}
