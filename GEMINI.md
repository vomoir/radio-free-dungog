# GEMINI.md

## Project Overview

**Radio Free Dungog** is a mobile-first messaging application designed for real-time interaction between a radio audience and a host.

- **Main Technologies:** React (TypeScript), Vite, Firebase (Auth & Firestore), Zustand, Lucide React.
- **Architecture:** 
  - **State Management:** Zustand stores handle authentication, real-time message synchronization, and user blocking.
  - **Real-time Data:** Firestore is used for live messaging and administrative actions.
  - **Persistence:** Interaction logs are persisted in `localStorage`.
  - **Security:** Administrative roles are currently email-based (defined in `src/store/useAuthStore.ts`).

## Building and Running

### Prerequisites
- Node.js and npm installed.
- A Firebase project set up with Authentication (Email/Google) and Firestore.

### Setup
1.  **Clone/Open the project.**
2.  **Environment Variables:** Create a `.env` file in the root based on `.env.example` and fill in your Firebase credentials.
3.  **Install Dependencies:**
    ```bash
    npm install
    ```
4.  **Run Development Server:**
    ```bash
    npm run dev
    ```
5.  **Build for Production:**
    ```bash
    npm run build
    ```

## Development Conventions

- **Mobile First:** All styling in `src/App.css` follows a mobile-first approach with a max-width container for desktop viewing.
- **State stores:** Store logic is separated into `src/store/` (e.g., `useAuthStore.ts`, `useMessageStore.ts`).
- **Icons:** Use `lucide-react` for consistent iconography.

## Firebase Configuration Note
- **Auth:** Enable Google and Email/Password providers in the Firebase Console.
- **Firestore:** Create a `messages` collection (ordered by `createdAt`) and a `blocked_users` collection.
- **Security Rules:** Ensure your Firestore rules allow authenticated users to read/write messages, but restrict delete/block operations to admin users.

### Example Firestore Rules (Preliminary)
```javascript
service cloud.firestore {
  match /databases/{database}/documents {
    match /messages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && !exists(/databases/$(database)/documents/blocked_users/$(request.auth.uid));
      allow delete: if request.auth.token.email == 'admin@radiofreedungog.com';
    }
    match /blocked_users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.email == 'admin@radiofreedungog.com';
    }
  }
}
```
