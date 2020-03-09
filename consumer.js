const NDN = require("ndn-js");
const Face = NDN.Face;
const Name = NDN.Name;
const EncodingUtils = NDN.EncodingUtils;
const UnixTransport = NDN.UnixTransport;

// Open interface to local NFD
const face = new Face(new UnixTransport());

// Interest name
const name = new Name("/hello/test");

const onData = (interest, data) => {
    console.log("Data received in callback.");
    console.log('Name: ' + data.getName().toUri());
    console.log('Content: ' + data.getContent().buf().toString());
    console.log(EncodingUtils.dataToHtml(data).replace(/<br \/>/g, "\n"));

    console.log('Quit script now.');
    face.close();
};

const onTimeout = interest => {
    console.log("Interest time out.");
    console.log('Interest name: ' + interest.getName().toUri());
    console.log('Quit script now.');
    face.close();
};

const Looper = () => {
    for (let i = 0; i < 50; i++) {
        face.expressInterest(name, onData, onTimeout);
    }
}

// Express interest 50 times/sec
setInterval(() => {
    Looper();
}, 1000);
