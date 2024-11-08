// export const corsOptions = {
//     origin: [
//       "http://dash.affitechbio.com",
//       "https://dash.affitechbio.com",
//       "http://affitechbio.com",
//       "https://affitechbio.com",
//       "http://www.affitechbio.com",
//       "https://www.affitechbio.com",
//       "https://www.affigenbio.com",
//       "https://affigenbio.com",
//       "http://www.affigenbio.com",
//       "http://affigenbio.com",
//     ],
//     credentials: true,
//   };
export const corsOptions = {
    origin: [
      "http://localhost:3000",
    ],
    credentials: true,
    exposedHeaders: ["set-cookie"],

  };
