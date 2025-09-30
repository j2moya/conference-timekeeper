import type { ConferencePlan, UserProfile } from '../types';

// Type definitions for Google Identity Services and GAPI, which are loaded from a script tag.
// This provides type safety and allows for better editor support.
declare namespace google {
  namespace accounts {
    namespace oauth2 {
      function initTokenClient(config: {
        client_id: string;
        scope: string;
        callback: (response: TokenResponse) => void;
      }): TokenClient;
      function revoke(token: string, done: () => void): void;
    }
  }
}

declare namespace gapi {
  function load(api: string, callback: () => void): void;
  namespace client {
    function init(args: { apiKey: string; discoveryDocs: string[] }): Promise<void>;
    function getToken(): TokenResponse | null;
    function setToken(token: '' | TokenResponse): void;
    const drive: {
        files: any; // A more detailed typing is possible but complex for this scope
    };
    function request<T = any>(args: { path: string, method?: string, params?: any, headers?: any, body?: any }): Promise<{ result: T, body: string }>;
  }
}

interface TokenResponse {
  access_token: string;
  error?: any;
}

interface TokenClient {
  requestAccessToken(overrideConfig: { prompt: string }): void;
}

// Fix: Use `declare global` to augment the global `ImportMeta` type within this module. This is necessary because this file is a module (it has exports), and it resolves the TypeScript error "Property 'env' does not exist on type 'ImportMeta'".
declare global {
  interface ImportMeta {
    readonly env: {
      readonly VITE_GOOGLE_CLIENT_ID: string;
    };
  }
}

// Safely access environment variables. In a Vite project, these are on `import.meta.env`.
// Optional chaining (`?.`) is used to prevent a crash if `import.meta.env` is undefined.
const GOOGLE_CLIENT_ID = import.meta.env?.VITE_GOOGLE_CLIENT_ID;

// The `process.env.API_KEY` is a special variable injected by the platform environment.
const API_KEY = process.env.API_KEY;

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile';

let tokenClient: TokenClient;
let gapiInited = false;
let gisInited = false;

const FOLDER_NAME = 'ConferenceTimekeeperPlans';
const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

/**
 * Initializes the Google API client and Google Identity Services.
 * @param onSignIn - Callback function to execute when a user signs in.
 */
export async function initGoogleClient(onSignIn: (profile: UserProfile) => void) {
  if (!GOOGLE_CLIENT_ID) {
    console.error("CRITICAL ERROR: Google Client ID is missing. The VITE_GOOGLE_CLIENT_ID environment variable could not be read. Please ensure it is set correctly in your .env.local file or platform settings and that the application has been restarted/redeployed.");
    return;
  }

  await new Promise<void>((resolve, reject) => {
    try {
      gapi.load('client', () => {
        gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: [DISCOVERY_DOC],
        }).then(() => {
          gapiInited = true;
          resolve();
        }).catch(reject);
      });
    } catch (e) { reject(e); }
  });

  await new Promise<void>((resolve, reject) => {
    try {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: async (resp) => {
          if (resp.error !== undefined) {
            throw (resp);
          }
          const userInfo = await getUserProfile();
          if (userInfo) {
            onSignIn(userInfo);
          }
        },
      });
      gisInited = true;
      resolve();
    } catch (e) { reject(e); }
  });
}

/**
 * Prompts the user to sign in with their Google account.
 */
export function handleSignIn() {
  if (!gisInited || !gapiInited) {
    console.error("Google clients not initialized.");
    alert("Google sign-in is not ready. Please try again in a moment.");
    return;
  }
  if (gapi.client.getToken() === null) {
    // Prompt the user to select an account.
    tokenClient.requestAccessToken({ prompt: 'consent' });
  } else {
    // Skip display of account chooser and grant scope automatically.
    tokenClient.requestAccessToken({ prompt: '' });
  }
}

/**
 * Signs the user out.
 */
export function handleSignOut() {
  const token = gapi.client.getToken();
  if (token !== null) {
    google.accounts.oauth2.revoke(token.access_token, () => {
      gapi.client.setToken('');
    });
  }
}

/**
 * Fetches the user's profile information.
 * @returns A promise that resolves with the user profile object or null.
 */
async function getUserProfile(): Promise<UserProfile | null> {
    try {
        const res = await gapi.client.request<UserProfile>({
            path: 'https://www.googleapis.com/oauth2/v2/userinfo'
        });
        return res.result;
    } catch (e) {
        console.error("Error fetching user profile", e);
        return null;
    }
}

/**
 * Gets the ID of the app's folder in Google Drive, creating it if it doesn't exist.
 * @returns A promise that resolves with the folder ID.
 */
async function getOrCreateAppFolder(): Promise<string> {
  const response = await gapi.client.drive.files.list({
    q: `mimeType='${FOLDER_MIME_TYPE}' and name='${FOLDER_NAME}' and trashed=false`,
    fields: 'files(id, name)',
  });

  if (response.result.files.length > 0) {
    return response.result.files[0].id;
  } else {
    const folderMetadata = {
      name: FOLDER_NAME,
      mimeType: FOLDER_MIME_TYPE,
    };
    const newFolder = await gapi.client.drive.files.create({
      resource: folderMetadata,
      fields: 'id',
    });
    return newFolder.result.id;
  }
}

/**
 * Saves a conference plan to Google Drive.
 * @param plan - The conference plan object to save.
 */
export async function savePlanToDrive(plan: ConferencePlan) {
    const folderId = await getOrCreateAppFolder();
    const fileName = `${plan.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    const planJson = JSON.stringify(plan, null, 2);
    
    const searchResponse = await gapi.client.drive.files.list({
        q: `'${folderId}' in parents and name='${fileName}' and trashed=false`,
        fields: 'files(id)',
    });

    const metadata = {
        name: fileName,
        mimeType: 'application/json',
    };
    
    if (searchResponse.result.files.length > 0) {
        // File exists, update it by sending a PATCH request to the upload endpoint
        const fileId = searchResponse.result.files[0].id;
        return gapi.client.request({
            path: `/upload/drive/v3/files/${fileId}`,
            method: 'PATCH',
            params: { uploadType: 'media' },
            body: planJson
        });
    } else {
        // File does not exist, create it using a multipart upload request
        const boundary = '-------314159265358979323846';
        const delimiter = `\r\n--${boundary}\r\n`;
        const close_delim = `\r\n--${boundary}--`;

        const multipartRequestBody =
            delimiter +
            'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
            JSON.stringify({ ...metadata, parents: [folderId] }) +
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            planJson +
            close_delim;

        return gapi.client.request({
            path: '/upload/drive/v3/files',
            method: 'POST',
            params: { uploadType: 'multipart' },
            headers: {
                'Content-Type': `multipart/related; boundary="${boundary}"`
            },
            body: multipartRequestBody
        });
    }
}

/**
 * Lists all conference plans saved in the app's Google Drive folder.
 * @returns A promise that resolves with an array of file objects.
 */
export async function listPlansFromDrive(): Promise<{id: string, name: string}[]> {
  const folderId = await getOrCreateAppFolder();
  const response = await gapi.client.drive.files.list({
    q: `'${folderId}' in parents and mimeType='application/json' and trashed=false`,
    fields: 'files(id, name)',
    orderBy: 'name',
  });
  return response.result.files || [];
}

/**
 * Reads the content of a specific plan file from Google Drive.
 * @param fileId - The ID of the file to read.
 * @returns A promise that resolves with the parsed JSON content of the plan.
 */
export async function readPlanFromDrive(fileId: string): Promise<ConferencePlan> {
  const response = await gapi.client.drive.files.get({
    fileId: fileId,
    alt: 'media',
  });
  
  if (typeof response.body === 'string') {
    return JSON.parse(response.body);
  }
  // This case can happen if Google returns an error object instead of file content
  console.error("Expected a string from Drive API, but got:", response.body);
  throw new Error("Failed to read file content from Google Drive.");
}