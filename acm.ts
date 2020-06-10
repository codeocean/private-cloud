import * as aws from "@pulumi/aws"

import * as config from "./config"

export const sslCert = new aws.acm.Certificate("ssl-cert", {
    domainName: config.domains.app,
    subjectAlternativeNames: [
        `*.${config.domains.app}`,
    ],
    tags: {
        deployment: config.deploymentName,
    },
    validationMethod: "DNS",
})
