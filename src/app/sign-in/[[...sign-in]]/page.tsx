// This file is the new entry point for the sign-in page,
// but it just re-exports the component from the (auth) group.
// This keeps the URL clean (/sign-in) while using the shared layout.
export { default } from '../../(auth)/sign-in/[[...sign-in]]/page';
