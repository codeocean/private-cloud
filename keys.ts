// This file includes Pulumi generated encryption keys and certificates that are used throughout
// the deployment, such as the application encryption key.

import * as tls from "@pulumi/tls"

import * as config from "./config"

export const appKey = new tls.PrivateKey("app-key", {
    algorithm: "RSA",
}, {
    additionalSecretOutputs: [
        "privateKeyPem",
    ],
})

export const samlCert = new tls.SelfSignedCert("saml-cert", {
    allowedUses: [
        "key_encipherment",
        "digital_signature",
        "server_auth",
    ],
    keyAlgorithm: appKey.algorithm,
    privateKeyPem: appKey.privateKeyPem,
    subjects: [{
        commonName: config.domains.app,
    }],
    validityPeriodHours: 87600, // 10 years
}, {
    additionalSecretOutputs: [
        "privateKeyPem",
    ],
})
