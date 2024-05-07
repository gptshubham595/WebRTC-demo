import './style.css'
import javascriptLogo from './javascript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.js'

var urlParams = new URLSearchParams(window.location.search);
var keyFromUrlParams = urlParams.get('key');

import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCzf1KIs7Uj3keyESPL7s9ZjtF2Tmo4_EU",
  authDomain: "webrtc-c7911.firebaseapp.com",
  projectId: "webrtc-c7911",
  storageBucket: "webrtc-c7911.appspot.com",
  messagingSenderId: "301497284647",
  appId: "1:301497284647:web:26340c1c30b001ddc67602",
  measurementId: "G-Y7NMXT8R7E"
};


// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

const firestore = firebase.firestore();//getFirestore(app);


const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302','stun:stun2.l.google.com:19302']
    }
  ],
  iceCandidatePoolSize: 10
}

let pc = new RTCPeerConnection(servers);
let localStream = null
let remoteStream = null

// HTML elements
const webcamButton = document.getElementById('webcamButton');
const webcamVideo = document.getElementById('webcamVideo');
// const callButton = document.getElementById('callButton');
const callInput = document.getElementById('callInput');
const answerButton = document.getElementById('answerButton');
const remoteVideo = document.getElementById('remoteVideo');
const hangupButton = document.getElementById('hangupButton');
const callKey = document.getElementById('callKey');
// 1. Setup media sources

webcamButton.onclick = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  remoteStream = new MediaStream();

  // Push tracks from local stream to peer connection
  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });

  // Pull tracks from remote stream, add to video stream
  pc.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };

  webcamVideo.srcObject = localStream;
  webcamVideo.muted = true;
  remoteVideo.srcObject = remoteStream;

  callButton.disabled = false;
  answerButton.disabled = false;
  webcamButton.disabled = true;
  callButton.click()
};

// 2. Create an offer
callButton.onclick = async () => {
  // Reference Firestore collections for signaling
  const callDoc =  firestore.collection('calls').doc(); // 
  const offerCandidates = callDoc.collection("offerCandidates"); 
  const answerCandidates =  callDoc.collection("answerCandidates"); 

  callInput.value = callDoc.id;
  copyLink(callDoc.id);

  // Get candidates for caller, save to db
  pc.onicecandidate = (event) => {
    event.candidate && offerCandidates.add(event.candidate.toJSON());
  };

  // Create offer
  const offerDescription = await pc.createOffer();
  await pc.setLocalDescription(offerDescription);

  const offer = {
    sdp: offerDescription.sdp,
    type: offerDescription.type,
  };

  await callDoc.set({ offer });

  // Listen for remote answer
  callDoc.onSnapshot((snapshot) => {
    const data = snapshot.data();
    if (!pc.currentRemoteDescription && data?.answer) {
      const answerDescription = new RTCSessionDescription(data.answer);
      pc.setRemoteDescription(answerDescription);
    }
  });

  // When answered, add candidate to peer connection
  answerCandidates.onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const candidate = new RTCIceCandidate(change.doc.data());
        pc.addIceCandidate(candidate);
      } 
    });
  });

  hangupButton.disabled = false;
};

// 3. Answer the call with the unique ID
answerButton.onclick = async () => {
  const callId = callInput.value;
  const callDoc = firestore.collection('calls').doc(callId);
  const answerCandidates = callDoc.collection('answerCandidates');
  const offerCandidates = callDoc.collection('offerCandidates');

  pc.onicecandidate = (event) => {
    event.candidate && answerCandidates.add(event.candidate.toJSON());
  };

  const callData = (await callDoc.get()).data();

  const offerDescription = callData.offer;
  await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

  const answerDescription = await pc.createAnswer();
  await pc.setLocalDescription(answerDescription);

  const answer = {
    type: answerDescription.type,
    sdp: answerDescription.sdp,
  };

  await callDoc.update({ answer });

  offerCandidates.onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      console.log(change);
      if (change.type === 'added') {
        let data = change.doc.data();
        pc.addIceCandidate(new RTCIceCandidate(data));
      }
    });
  });
};

hangupButton.onclick = () => {
  pc.close();
  location.reload();
};

function copyLink(value) {
  const key = value;
  const shareUrl = window.location.href + '?key=' + key;
  alert("Share the link to the other party, " + shareUrl);
}


// import './style.css';

// import firebase from 'firebase/compat/app';
// import 'firebase/compat/firestore';

// var urlParams = new URLSearchParams(window.location.search);
// var keyFromUrlParams = urlParams.get('key');

// const firebaseConfig = {
//   apiKey: "AIzaSyCzf1KIs7Uj3keyESPL7s9ZjtF2Tmo4_EU",
//   authDomain: "webrtc-c7911.firebaseapp.com",
//   projectId: "webrtc-c7911",
//   storageBucket: "webrtc-c7911.appspot.com",
//   messagingSenderId: "301497284647",
//   appId: "1:301497284647:web:26340c1c30b001ddc67602",
//   measurementId: "G-Y7NMXT8R7E"
// };

// if (!firebase.apps.length) {
//   firebase.initializeApp(firebaseConfig);
// }
// const firestore = firebase.firestore();

// const servers = {
//   iceServers: [
//     {
//       urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
//     },
//   ],
//   iceCandidatePoolSize: 10,
// };

// // Global State
// const pc = new RTCPeerConnection(servers);
// let localStream = null;
// let remoteStream = null;

// // HTML elements
// const webcamButton = document.getElementById('webcamButton');
// const webcamVideo = document.getElementById('webcamVideo');
// const callInput = document.getElementById('callInput');
// const answerButton = document.getElementById('answerButton');
// const remoteVideo = document.getElementById('remoteVideo');
// const hangupButton = document.getElementById('hangupButton');
// const callKey = document.getElementById('callKey');

// // 1. Setup media sources
// webcamButton.onclick = async () => {
//   await startWebcam();
//   startCall();
// }
// var startWebcam = async () => {
//   localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//   remoteStream = new MediaStream();

//   // Push tracks from local stream to peer connection
//   localStream.getTracks().forEach((track) => {
//     pc.addTrack(track, localStream);
//   });

//   // Pull tracks from remote stream, add to video stream
//   pc.ontrack = (event) => {
//     event.streams[0].getTracks().forEach((track) => {
//       remoteStream.addTrack(track);
//     });
//   };

//   webcamVideo.srcObject = localStream;
//   webcamVideo.muted = true;
//   remoteVideo.srcObject = remoteStream;

//   // answerButton.disabled = false;
//   webcamButton.disabled = true;

// };

// // 2. Create an offer
// var startCall = async () => {
//   // Reference Firestore collections for signaling
//   const callDoc = firestore.collection('calls').doc();
//   const offerCandidates = callDoc.collection('offerCandidates');
//   const answerCandidates = callDoc.collection('answerCandidates');

//   // callInput.value = callDoc.id;
//   callKey.textContent = callDoc.id;
//   copyLink(callDoc.id);

//   // Get candidates for caller, save to db
//   pc.onicecandidate = (event) => {
//     event.candidate && offerCandidates.add(event.candidate.toJSON());
//   };

//   // Create offer
//   const offerDescription = await pc.createOffer();
//   await pc.setLocalDescription(offerDescription);

//   const offer = {
//     sdp: offerDescription.sdp,
//     type: offerDescription.type,
//   };

//   await callDoc.set({ offer });

//   // Listen for remote answer
//   callDoc.onSnapshot((snapshot) => {
//     const data = snapshot.data();
//     if (!pc.currentRemoteDescription && data?.answer) {
//       const answerDescription = new RTCSessionDescription(data.answer);
//       pc.setRemoteDescription(answerDescription);
//     }
//   });

//   // When answered, add candidate to peer connection
//   answerCandidates.onSnapshot((snapshot) => {
//     snapshot.docChanges().forEach((change) => {
//       if (change.type === 'added') {
//         const candidate = new RTCIceCandidate(change.doc.data());
//         pc.addIceCandidate(candidate);
//       }
//     });
//   });

//   hangupButton.disabled = false;
// };

// // 3. Answer the call with the unique ID
// answerButton.onclick = async () => {
//   answerCall();
// };

// function copyLink(value) {
//   const key = value;
//   const shareUrl = window.location.href + '?key=' + key;
//   alert("Share the link to the other party, " + shareUrl);
// }

// var answerCall = async(key = null) => {
//   startWebcam();
//   if(key) {
//     var callId = key;
//   } else {
//     var callId = callInput.value.replace(/ /g, "");
//   }

//   const callDoc = firestore.collection('calls').doc(callId);
//   const answerCandidates = callDoc.collection('answerCandidates');
//   const offerCandidates = callDoc.collection('offerCandidates');

//   pc.onicecandidate = (event) => {
//     event.candidate && answerCandidates.add(event.candidate.toJSON());
//   };

//   const callData = (await callDoc.get()).data();

//   const offerDescription = callData.offer;
//   await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

//   const answerDescription = await pc.createAnswer();
//   await pc.setLocalDescription(answerDescription);

//   const answer = {
//     type: answerDescription.type,
//     sdp: answerDescription.sdp,
//   };

//   await callDoc.update({ answer });

//   offerCandidates.onSnapshot((snapshot) => {
//     snapshot.docChanges().forEach((change) => {
//       // console.log(change);
//       if (change.type === 'added') {
//         let data = change.doc.data();
//         pc.addIceCandidate(new RTCIceCandidate(data));
//       }
//     });
//   });
// }

// hangupButton.onclick = () => {
//   pc.close();
//   location.reload();
// };

// if(keyFromUrlParams) {
//   startWebcam();
//   answerCall(keyFromUrlParams);
// }