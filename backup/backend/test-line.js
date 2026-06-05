require('dotenv').config();
const axios = require('axios');
async function test() {
  const token   = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const groupId = process.env.LINE_IT_GROUP_ID;
  console.log('token:', token ? 'ok' : 'MISSING');
  console.log('groupId:', groupId);
  try {
    const r = await axios.post('https://api.line.me/v2/bot/message/push', {
      to: groupId,
      messages: [{ type: 'text', text: 'ทดสอบระบบ IT Helpdesk' }]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      }
    });
    console.log('SUCCESS:', r.status);
  } catch(err) {
    console.log('ERROR:', JSON.stringify(err.response?.data || err.message));
  }
}
test();