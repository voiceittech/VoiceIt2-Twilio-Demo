exports.handler = async function (context, event, callback) {
  // eslint-disable-next-line no-undef
  const twiml = new Twilio.twiml.VoiceResponse();
  twiml.say('Please say the following phrase to verify your voice ');
  twiml.say(context.VOICEPRINT_PHRASE);

  twiml.record({
    action: '/voice/process_verification',
    maxLength: '5',
    trim: 'do-not-trim',
  });
  callback(null, twiml);
};
