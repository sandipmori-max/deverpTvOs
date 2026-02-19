export const isNetworkError = (error: any): boolean => {
  return (
    !error.response &&
    error.message &&
    (error.message.includes('Network Error') ||
      error.message.includes('No internet connection') ||
      error.message.includes('timeout'))
  );
};

export const isAuthError = (error: any): boolean => {
  return error.response?.status === 401 || error.response?.status === 403;
};

export const isServerError = (error: any): boolean => {
  return error.response?.status >= 500;
};

export const getErrorMessage = (error: any): string => {
  if (isNetworkError(error)) {
    return 'No internet connection. Please check your network and try again.';
  }

  if (isAuthError(error)) {
    return 'Your session has expired. Please login again.';
  }

  if (isServerError(error)) {
    return 'Server error. Please try again later.';
  }

  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.message) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
};

export const retryApiCall = async <T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
): Promise<T> => {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      if (isAuthError(error) || (error.response?.status >= 400 && error.response?.status < 500)) {
        throw error;
      }

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
  }

  throw lastError;
};

export const translateSingle = async (text) => {
  try {
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|gu`
    );

    const result = await response.json();
    const translated = result.responseData.translatedText;
console.log("translated", translated)
     return translated;

  } catch (error) {
    console.log("Translation failed");
  }
};
