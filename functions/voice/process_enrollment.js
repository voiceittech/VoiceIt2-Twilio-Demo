const VoiceIt = require('voiceit2-nodejs');

function handleSuccessfulEnrollment(twiml, enrollmentCount) {
  // VoiceIt requires at least 3 successful enrollments.
  const thereAreEnoughEnrollments = enrollmentCount > 2;
  if (thereAreEnoughEnrollments) {
    twiml.say('Thank you, recording received, you are now enrolled and ready to log in');
    twiml.redirect('/voice/verify');
  } else {
    twiml.say('Thank you, recording received,you will now be asked to record your phrase again');
    twiml.redirect(`/voice/enroll?enrollmentCount=${enrollmentCount}`);
  }
}

exports.handler = async function (context, event, callback) {
  console.log(`Process Enrollment enrollmentCount ${event.enrollmentCount}`);
  const myVoiceIt = new VoiceIt(
    context.VOICEIT_API_KEY,
    context.VOICEIT_API_TOKEN,
  );

  const userId = event.request.cookies.userId || '';
  let { enrollmentCount } = event;

  enrollmentCount = parseInt(enrollmentCount, 10);
  const recordingURL = `${event.RecordingUrl}.wav`;
  // eslint-disable-next-line no-undef
  const twiml = new Twilio.twiml.VoiceResponse();
  // eslint-disable-next-line no-undef
  const response = new Twilio.Response();

  myVoiceIt.createVoiceEnrollmentByUrl(
    {
      userId,
      audioFileURL: recordingURL,
      phrase: context.VOICEPRINT_PHRASE,
      contentLanguage: context.CONTENT_LANGUAGE,
    },
    async (jsonResponse) => {
      console.log('createVoiceEnrollmentByUrl json: ', jsonResponse.message);
      const enrollmentWasSuccessful = jsonResponse.responseCode === 'SUCC';
      if (enrollmentWasSuccessful) {
        enrollmentCount += 1;
        handleSuccessfulEnrollment(twiml, enrollmentCount);
      } else {
        twiml.say('Your recording was not successful, please try again');
        twiml.redirect(`/voice/enroll?enrollmentCount=${enrollmentCount}`);
      }

      response
        .setBody(twiml.toString())
        .appendHeader('Content-Type', 'text/xml');

      callback(null, response);
    },
  );
};
