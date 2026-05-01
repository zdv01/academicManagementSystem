declare module '*.png';
declare module '*.svg';
declare module '*.jpeg';
declare module '*.jpg';

interface ImportMetaEnv {
	readonly VITE_API_URL?: string;
	readonly VITE_COUNTRY_API_URL?: string;
	readonly VITE_API_URL_SECURITY?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}