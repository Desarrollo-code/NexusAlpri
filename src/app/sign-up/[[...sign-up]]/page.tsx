// This file is the new entry point for the sign-up page,
// but it just re-exports the component from the (auth) group.
// This keeps the URL clean (/sign-up) while using the shared layout.
export { default } from '../../(auth)/sign-up/[[...sign-up]]/page';
