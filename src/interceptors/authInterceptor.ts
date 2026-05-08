    import axios, {
    AxiosInstance,
    InternalAxiosRequestConfig,
    } from "axios";

    import AuthService from "../services/firebase/authService";
    import { LocalStorageProvider } from "../storage/LocalStorageProvider";
    import { StorageProvider } from "../storage/StorageProvider";

    export class AuthInterceptor {

    private api: AxiosInstance;

    private storage: StorageProvider;

    /**
     * Rutas públicas
     */
    private EXCLUDED_ROUTES = [
        "/login",
        "/register",
    ];

    constructor() {

        this.storage =
        new LocalStorageProvider();

        this.api = axios.create({
        baseURL: import.meta.env.VITE_API_URL,
        headers: {
            "Content-Type": "application/json",
        },
        });

        this.initializeInterceptors();
    }

    /**
     * Interceptor Request
     * - Soporta Firebase
     * - Soporta login tradicional
     */
    private async handleRequest(
        config: InternalAxiosRequestConfig
    ) {

        /**
         * No agregar token
         * en rutas públicas
         */
        if (
        this.EXCLUDED_ROUTES.some(
            (route) => config.url?.includes(route)
        )
        ) {
        return config;
        }

        try {

        let token: string | null = null;

        /**
         * 1. Intentar obtener token Firebase
         */
        token =
            await AuthService.getToken();

        /**
         * 2. Si no existe Firebase,
         * usar token clásico
         */
        if (!token) {

            token =
            this.storage.getItem("token");
        }

        /**
         * 3. Agregar Authorization
         */
        if (token) {

            config.headers =
            config.headers || {};

            config.headers.Authorization =
            `Bearer ${token}`;
        }

        } catch (error) {

        console.error(
            "Error obteniendo token:",
            error
        );
        }

        return config;
    }

    /**
     * Manejo de errores
     */
    private handleResponseError(error: any) {

        if (error.response?.status === 401) {

        console.log(
            "Sesión expirada"
        );

        /**
         * Limpiar storage
         */
        this.storage.removeItem("token");
        this.storage.removeItem("user");

        /**
         * Redirigir login
         */
        window.location.href =
            "/auth/signin";
        }

        return Promise.reject(error);
    }

    /**
     * Inicializar interceptores
     */
    private initializeInterceptors() {

        this.api.interceptors.request.use(
        this.handleRequest.bind(this),
        (error) => Promise.reject(error)
        );

        this.api.interceptors.response.use(
        (response) => response,
        this.handleResponseError.bind(this)
        );
    }

    /**
     * Exponer instancia axios
     */
    public get instance(): AxiosInstance {
        return this.api;
    }
    }

    /**
     * Instancia global
     */
    export const api =
    new AuthInterceptor().instance;