const config = {
  apiKey : process.env.API_KEY,
  apiToken : process.env.API_TOKEN,
  contentLanguage: process.env.CONTENT_LANGUAGE,
  chosenVoicePrintPhrase: process.env.VOICEPRINT_PHRASE,
  dataBaseURL:  process.env.DATABASE_URL
}

module.exports = config;
