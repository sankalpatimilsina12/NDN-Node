const NDN = require("ndn-js");
const Face = NDN.Face;
const Name = NDN.Name;
const Data = NDN.Data;
const Blob = NDN.Blob;
const UnixTransport = NDN.UnixTransport;
const SafeBag = NDN.SafeBag;
const KeyChain = NDN.KeyChain;
const Keys = require("keys");
const DEFAULT_RSA_PUBLIC_KEY_DER = Keys.rsa_pub_key;
const DEFAULT_RSA_PRIVATE_KEY_DER = Keys.rsa_priv_key;
const Bottleneck = require("bottleneck");

const Echo = function Echo(keyChain, face) {
    this.keyChain = keyChain;
    this.face = face;
};

Echo.prototype.onInterest = function (prefix, interest, face, interestFilterId, filter) {
    // Make and sign a Data packet.
    const data = new Data(interest.getName());
    const content = "Echo " + interest.getName().toUri();
    data.setContent(content);
    this.keyChain.sign(data);

    try {
        console.log("Sent content " + content);
        face.putData(data);
    } catch (e) {
        console.log(e.toString());
    }
    this.face.close();
};

Echo.prototype.onRegisterFailed = function (prefix) {
    console.log("Register failed for prefix " + prefix.toUri());
    this.face.close();
};

function main() {
    // Open interface to local NFD
    const face = new Face(new UnixTransport());

    /* Register prefix (name) to local NFD and publish content by signing */
    // 1. Get certificate and sign
    const keyChain = new KeyChain("pib-memory:", "tpm-memory:");
    keyChain.importSafeBag(new SafeBag
    (new Name("/hello/test/KEY/123"),
        new Blob(DEFAULT_RSA_PRIVATE_KEY_DER, false),
        new Blob(DEFAULT_RSA_PUBLIC_KEY_DER, false)));
    face.setCommandSigningInfo(keyChain, keyChain.getDefaultCertificateName());
    const echo = new Echo(keyChain, face);

    // 2. Register prefix
    const prefix = new Name("/hello/test");
    face.registerPrefix
    (prefix, echo.onInterest.bind(echo), echo.onRegisterFailed.bind(echo));
}

/* Todo: Run the producer server as a listener */

// Restrict to 25 requests per second
const limiter = new Bottleneck(25, 1000);
limiter.schedule(() => main());
