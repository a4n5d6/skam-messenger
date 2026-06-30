const db = require('../config/firebase-config');

async function getUserChats(documentID) {
  const collectionReference = db.collection('chats');
  const query = collectionReference.where('members', 'array-contains', documentID);
  const querySnapshot = await query.get();
  const chats = [];
  querySnapshot.forEach(documentSnapshot => {
    chats.push({
        "id": documentSnapshot.id,
        ...documentSnapshot.data()
    });
  });
  return chats;
}

async function getMessages(documentID) {
  const collectionReference = db.collection('chats').doc(documentID).collection("messages")
  const querySnapshot = await collectionReference.get();
  const message = [];
  querySnapshot.forEach(documentSnapshot => {
    message.push({
      "id": documentSnapshot.id,
        ...documentSnapshot.data()
    })
  })
  return message;
}







async function init() {
    // const userChats = await getUserChats("peJ43xRAd4yWPlh4bfVU");
    // console.log(userChats);
    const ffff = await fff("2tf99DEl4qUYiQzTrBby")
    console.log(ffff);
}

init();
