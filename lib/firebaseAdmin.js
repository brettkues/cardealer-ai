import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      "type": "service_account",
      "project_id": "cardealer-ai",
      "private_key_id": "f7a0c056139d07e5ecc39b0319366a79c954a4bc",
      "private_key": "-----BEGIN PRIVATE KEY-----\nCx6DS1QPpV+uZIVrkExbb1ddHM0MXl2CRP5gfO6JsupWE1vJU4Lq9CX0EHyZflb3\nbQXVhyCmFOOyGbGCDS38u7W19iuz1cqtWbfRjymHSQKBgQDnPawncDSrjHm1LddR\nxJl8drAfjWVmc/eGyAA9SYBbgc1An9285+Vbuavf4dEaWwogu/SjYCGchKoLFqGa\nftqo61VySC7fWo9qNL9xUG6CypxcGoG86XfA4dR/sLn/gLxda8ewcPyZ60Xwd7bF\nUw7a927lxuUZwiNDDlmTFLfQXwKBgQC6AkjXDaUQ9eWO8KrTDmIhREkOm5whQv58\nJaSzDiZOl6JlAnB5+O5UFX5hwjQOc2n+b6IiIlE7YK+w1ZMXvM6/8CjF1yfgeDSA\nfQ3Tcx5ZXJjdFqMBp3UtNFjmd/FGDk2vzlrEpfknl2u0hSogXoVPq9fNHqTAWrp3\nubcNvgBRwwKBgQDBt2Ke71rQU7Ap3atB7sb+A5fr9tH5kDDOkoHQ1eBXyFegSczC\nUipMOzEHLu+zeozze0GoFAJUUrb47w6WlKqtU+iTAnFx3zXBrUqrrMvHeeCfL/17\nusH9rbIM/onyx3AFeyMgZqbWcsh2eHN+vuP0/8/BYmvOtlo/9KeJlZOfVQKBgQCG\njrqEn4FGWKuckKryjNgd+pji8VyrjxwrUMvpH5ZEilrWuUIGajZ2KypGq8ceoQ0P\nG1BtYufijVnrEUUcCeCCZsgH/lIBhtNsE4rZ6NAOkvaeEQ8QVkRk1BZvelrWc+ht\nAlkVIn+vzVEDwMUtr1K+xLAS2VUTNU7o5zbtwQHYIwKBgGRJZVxU/jRY45bNGEQp\nPg7dN2a4SZv+FZW8Tjhdx6FSDh2H/NTVg2SZPBW7jdYu1IFujm5wOifT2kdU4+Cb\nF0e44OB+0r5XWnHaySpCfVC4H6oKF+bMtX5GSS0oCoMkLYM5uMB7ao9JT3dtoF1t\nkpXLnscf+m9HJEu3CGr0/f/o\n-----END PRIVATE KEY-----\n",
      "client_email": "firebase-adminsdk-fbsvc@cardealer-ai.iam.gserviceaccount.com",
      "client_id": "110513837649625423764",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40cardealer-ai.iam.gserviceaccount.com",
      "universe_domain": "googleapis.com"
    })
  });
}

export const adminDB = admin.firestore();
export const adminAuth = admin.auth();
export const adminStorage = admin.storage();
