/* eslint-disable func-names */
/* eslint-disable consistent-return */
const Voiceit2 = require('voiceit2-nodejs');
const AirTable = require('airtable');

function removeSpecialChars(text) {
  return text.replace(/[^0-9a-z]/gi, '');
}

const callerUserId = async (phone, context) => {
  let userId = 0;
  try {
    const base = new AirTable({ apiKey: context.AIRTABLE_API_KEY }).base(
      context.AIRTABLE_BASE_ID,
    );
    const records = await base('Voice Biometric').select().all();
    records.forEach((record) => {
      const recordPhone = record.get('Phone Number');
      if (recordPhone === phone) {
        userId = record.get('Biometric UserId');
        return userId;
      }
    });
  } catch (err) {
    console.log(`error in callerUserId ${err}`);
  }
  return userId;
};

exports.handler = async function (context, event, callback) {
  const myVoiceIt = new Voiceit2(
    context.VOICEIT_API_KEY,
    context.VOICEIT_API_TOKEN,
  );
  // eslint-disable-next-line no-undef
  const response = new Twilio.Response();
  // eslint-disable-next-line no-undef
  const twiml = new Twilio.twiml.VoiceResponse();
  const phone = removeSpecialChars(event.From);

  // @TODO in airtable add a mapping of phonenumber -> userid, fetch it when it comes in - done
  // @TODO helper functions in one place - @Rustam
  // @TODO move URL to environment variables - done
  // @TODO add an option to delete all the enrollments - done
  // @TODO change the phrase
  // @TODO review the list of the languages
  // @TODO Readme - @rustam
  // @TODO store userId or groupId in cookies to not call databases too much

  let userId = await callerUserId(phone, context);

  // Check for user in VoiceIt db
  myVoiceIt.checkUserExists(
    {
      userId,
    },
    async (checkUserExistsResponse) => {
      console.log(`jsonResponse${JSON.stringify(checkUserExistsResponse)}`);
      if (checkUserExistsResponse.exists) {
        // Greet the caller when their account profile is recognized by the VoiceIt API.
        twiml.say('Welcome back to the Voice It Verification Demo, your phone number has been recognized');
        // Let's provide the caller with an opportunity to enroll by typing `1` on
        // their phone's keypad. Use the <Gather> verb to collect user input
        const gather = twiml.gather({
          action: '/voice/registered_user_menu',
          numDigits: 1,
          timeout: 5,
        });
        gather.say('You may now log in, or press one to re enroll or two to delete your account');
        twiml.redirect(
          '/voice/registered_user_menu?digits=TIMEOUT',
        );
        response
          .setBody(twiml.toString())
          .appendHeader('Content-Type', 'text/xml')
          .setCookie('userId', userId);

        callback(null, response);
      } else {
        // Create a new user for new number
        myVoiceIt.createUser(async (createUserResponse) => {
          twiml.say('Welcome to the Voice It Verification Demo, you are a new user and will now be enrolled');
          userId = createUserResponse.userId;
          /* Code for inserting new user into a database */
          const base = new AirTable({ apiKey: context.AIRTABLE_API_KEY }).base(
            context.AIRTABLE_BASE_ID,
          );
          base('Voice Biometric').create(
            [
              {
                fields: {
                  'Phone Number': phone,
                  'Biometric UserId': userId,
                },
              },
            ],
            (err) => {
              if (err) {
                console.error(err);
              }
            },
          );
          /* Code for inserting new user into a database */
          twiml.redirect('/voice/enroll');
          response
            .setBody(twiml.toString())
            .appendHeader('Content-Type', 'text/xml')
            .setCookie('userId', userId);

          callback(null, response);
        });
      }
    },
  );
  // callback(null, twiml);
};
