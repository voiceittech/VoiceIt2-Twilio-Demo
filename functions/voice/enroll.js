exports.handler = async function (context, event, callback) {
  // eslint-disable-next-line no-undef
  const twiml = new Twilio.twiml.VoiceResponse();
  const enrollmentCount = event.enrollmentCount || 0;

  twiml.say('Please say the following phrase to enroll ');
  twiml.say(context.VOICEPRINT_PHRASE);

  twiml.record({
    action: `/voice/process_enrollment?enrollmentCount=${enrollmentCount}`,
    maxLength: 5,
    trim: 'do-not-trim',
  });

  callback(null, twiml);
};
