// This file includes Pulumi generated secrets that are used throughout the deployment,
// as opposed to user supplied secrets, such as OAuth2 client secret.

import * as random from "@pulumi/random"

function randomPassword(name: string): random.RandomPassword {
    return new random.RandomPassword(name, {
        length: 14,
        special: false,
    }, {
        additionalSecretOutputs: [
            "result",
        ],
    })
}

export const couchdb = {
    adminPassword: randomPassword("couchdb-admin-password"),
}

export const gitea = {
    adminPassword: randomPassword("gitea-admin-password"),
    commonPassword: randomPassword("gitea-common-password"),
    auxPassword: randomPassword("gitea-aux-password"),
    readonlyPassword: randomPassword("gitea-readonly-password"),
    secretKey: randomPassword("gitea-secret-key"),
}

export const postgres = {
    passsword: randomPassword("postgres-password"),
}

export const redis = {
    passsword: randomPassword("redis-password"),
}
