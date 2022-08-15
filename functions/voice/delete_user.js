/* eslint-disable */

const Airtable = require('airtable');
const Voiceit2 = require('voiceit2-nodejs');

// exports.handler = async function (context, event, callback) {
//   let myVoiceIt = new voiceit2(
//     context.VOICEIT_API_KEY,
//     context.VOICEIT_API_TOKEN
//   );
//   const phone = "16514283416"
//   const userId = await callerUserId(phone, context);
//   // When the caller asked to enroll by pressing `1`, provide friendly
//   // instructions, otherwise, we always assume their intent is to verify.
//   console.log("In enroll or verify digits " + digits);
//     const deleteProgress = await deleteUserId(phone, context)
//     console.log("in Delete")

// };

const deleteUserId = async (phone, context) => {
  console.log('In deleteUserId from airtable');
  const userId = 0;
  try {
    const base = new Airtable({ apiKey: context.AIRTABLE_API_KEY }).base(
      context.AIRTABLE_BASE_ID,
    );
    let recordIdToDelete = '';
    const records = await base('Voice Biometric').select().all();
    records.forEach((record) => {
      const recordPhone = record.get('Phone Number');
      if (recordPhone === phone) {
        recordIdToDelete = record.getId();
      }
    });
    // @TODO: turn 'Voice Biometric' into an environment variable
    base('Voice Biometric').destroy(['recbKxkEDgw2qivAe'], (err, deletedRecords) => {
      if (err) {
        console.log('error deleting a record');
        console.error(err);
        return;
      }
      console.log('Deleted', deletedRecords.length, 'records');
    });
  } catch (err) {
    console.log(`error in callerUserId ${err}`);
  }
  return userId;
};
