import {
    GoogleAuthProvider,
    GithubAuthProvider,
    OAuthProvider,
    signInWithPopup,
    signOut,
    User,
} from "firebase/auth";

import { auth } from "./config";

class AuthService extends EventTarget {

    private user: User | null;    

    private googleProvider: GoogleAuthProvider;

    private githubProvider: GithubAuthProvider;

    private microsoftProvider: OAuthProvider;

    constructor() {
        super();

        this.user = null;

        this.googleProvider =
        new GoogleAuthProvider();

        this.githubProvider =
        new GithubAuthProvider();

        this.microsoftProvider =
        new OAuthProvider("microsoft.com");
    }

    async signInWithGoogle() {
        try {

        const result = await signInWithPopup(
            auth,
            this.googleProvider
        );

        this.user = result.user;

        this.dispatchEvent(
            new CustomEvent("userChange", {
            detail: this.user,
            })
        );

        return this.user;

        } catch (error) {

        console.error(
            "Google Sign-In Error:",
            error
        );

        throw error;
        }
    }

    async signInWithGithub() {
        try {

        const result = await signInWithPopup(
            auth,
            this.githubProvider
        );

        this.user = result.user;

        this.dispatchEvent(
            new CustomEvent("userChange", {
            detail: this.user,
            })
        );

        return this.user;

        } catch (error) {

        console.error(
            "Github Sign-In Error:",
            error
        );

        throw error;
        }
    }

    async signInWithMicrosoft() {
        try {

        const result = await signInWithPopup(
            auth,
            this.microsoftProvider
        );

        this.user = result.user;

        this.dispatchEvent(
            new CustomEvent("userChange", {
            detail: this.user,
            })
        );

        return this.user;

        } catch (error) {

        console.error(
            "Microsoft Sign-In Error:",
            error
        );

        throw error;
        }
    }

    async getToken() {
        const user = auth.currentUser;

        if (!user) {
            return null;
        }

        return await user.getIdToken();
    }

    async logout() {

        await signOut(auth);

        this.user = null;

        this.dispatchEvent(
        new CustomEvent("userChange", {
            detail: null,
        })
        );
    }

    getUser() {
        return this.user;
    }

    isAuthenticated() {
        return this.user !== null;
    }
}

export default new AuthService();