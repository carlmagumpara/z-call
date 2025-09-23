if (import.meta.env.DEV) {
  console.log('Running in development mode');
} else if (import.meta.env.PROD) {
  console.log('Running in production mode');
} else {
  console.log('Running in an unknown mode');
}

export const base_url = 'https://z-call.onrender.com';
// export const base_url = import.meta.env.PROD ? 'https://z-call.onrender.com' : 'http://localhost:4000';

export const api_url = `${base_url}/api`;