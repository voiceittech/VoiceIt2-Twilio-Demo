/* eslint-disable consistent-return */
const AirTable = require('airtable');
const Voiceit2 = require('voiceit2-nodejs');

function removeSpecialChars(text) {
  return text.replace(/[^0-9a-z]/gi, '');
}

const DELETE_ENROLLMENTS_DIGIT = '1';
const DELETE_ACCOUNT_DIGIT = '2';
const ADD_ANOTHER_USER = '3';

exports.handler = async function (context, event, callback) {
  const myVoiceIt = new Voiceit2(
    context.VOICEIT_API_KEY,
    context.VOICEIT_API_TOKEN,
  );
  // eslint-disable-next-line no-undef
  const twiml = new Twilio.twiml.VoiceResponse();
  const digits = event.Digits;
  const phone = removeSpecialChars(event.From);
  const userId = event.request.cookies.userId || '';
  // When the caller asked to enroll by pressing `1`, provide friendly
  // instructions, otherwise, we always assume their intent is to verify.
  if (digits === DELETE_ENROLLMENTS_DIGIT) {
    // Delete User's voice enrollments and re-enroll
    myVoiceIt.deleteAllEnrollments(
      {
        userId,
      },
      // @TODO: check the response and make sure it was successful,
      // otherwise let the user know something went wrong
      async () => {
        twiml.say('You have chosen to re enroll your voice, you will now be asked to say a phrase three times, then you will be able to log in with that phrase');
        twiml.redirect('/voice/enroll');
        callback(null, twiml);
      },
    );
  } else if (digits === DELETE_ACCOUNT_DIGIT) {
    const base = new AirTable({ apiKey: context.AIRTABLE_API_KEY }).base(
      context.AIRTABLE_BASE_ID,
    );
    base('Voice Biometric').select().all().then((records) => {
      let recordIdToDelete = '';
      records.forEach((record) => {
        const recordPhone = record.get('Phone Number');
        if (recordPhone === phone) {
          recordIdToDelete = record.getId();
        }
      });
      console.log(`the target record id: ${recordIdToDelete}`);
      base('Voice Biometric').destroy([recordIdToDelete], (err, deletedRecords) => {
        console.log(err);
        console.log(`deleted records length ${deletedRecords.length}`);
        myVoiceIt.deleteAllEnrollments(
          {
            userId,
          },
          async () => {
            twiml.say('Account deleted, goodbye!');
            callback(null, twiml);
          },
        );
      });
    });
  } else if (digits === ADD_ANOTHER_USER) {
    // @TODO: cant create a group if the user already created one,
    // in that case just add another user to the group
    // @TODO: consider a case where a new user being added to the group does not finish enrolling?
    // Cancel the group or somehow finish the enrollments?
    // myVoiceIt.createGroup(
    //   'Group Name',
    //   async (createGroupResponse) => {
    //     myVoiceIt.addUserToGroup({ userId, groupId: createGroupResponse.groupId });
    // eslint-disable-next-line max-len
    //     twiml.say('Welcome to the Voice It Verification Demo Test, you are a new user and will now be enrolled');
    //     userId = createUserResponse.userId;
    //     /* Code for inserting new user into a database */
    //     const base = new AirTable({ apiKey: context.AIRTABLE_API_KEY }).base(
    //       context.AIRTABLE_BASE_ID,
    //     );
    //     base('Voice Biometric').create(
    //       [
    //         {
    //           fields: {
    //             'Phone Number': phone,
    //             'Biometric UserId': userId,
    //           },
    //         },
    //       ],
    //       (err) => {
    //         if (err) {
    //           console.error(err);
    //         }
    //       },
    //     );
    //     /* Code for inserting new user into a database */
    //     twiml.redirect(`/voice/enroll`);
    //   },
    // );
  } else {
    // Check for number of enrollments > 2
    myVoiceIt.getAllVoiceEnrollments(
      {
        userId,
      },
      async (jsonResponse) => {
        twiml.say('You have chosen to verify your Voice.');
        const enrollmentsCount = jsonResponse.count;
        if (enrollmentsCount > 2) {
          twiml.redirect('/voice/verify');
          callback(null, twiml);
        } else {
          twiml.say('You do not have enough enrollments and need to re enroll your voice.');
          // Delete User's voice enrollments and re-enroll
          myVoiceIt.deleteAllEnrollments(
            {
              userId,
            },
            // eslint-disable-next-line no-unused-vars
            async (deleteEnrollmentsResponse) => {
              twiml.redirect('/voice/enroll');
              callback(null, twiml);
            },
          );
        }
      },
    );
  }
  // callback(null, twiml);
};
