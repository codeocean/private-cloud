import * as aws from "@pulumi/aws"
import * as pulumi from "@pulumi/pulumi"

import * as config from "../config"
import * as dedicatedMachines from "../dedicated-machines"
import * as elasticsearch from "../elasticsearch"
import * as keys from "../keys"
import * as rds from "../rds"
import * as redis from "../redis"
import * as secrets from "../secrets"
import * as slots from "../slots"

import * as s3 from "."

const accountId = pulumi.output(aws.getCallerIdentity()).accountId

// Upload objects
// Warning: Due to the lack of variadic generics in TypeScript, pulumi.all has rather problmatic
// typing, bascially everything here must be a string
const context = pulumi.all([
    accountId,
    s3.datasetsBucket.bucket,
    s3.inputFilesBucket.bucket,
    s3.licensesBucket.bucket,
    s3.publicBucket.bucket,
    s3.resultsBucket.bucket,
    s3.tempBucket.bucket,
    dedicatedMachines.launchTemplate.id,
    dedicatedMachines.launchTemplate.latestVersion.apply(v => v.toString()),
    config.auth.builtin.reCaptchaApiKey,
    config.auth.google.clientSecret,
    config.auth.systemAPIKey,
    config.services.segment.backend.apiKey,
    config.services.segment.frontend.apiKey,
    secrets.analyticsdb.passsword.result,
    secrets.couchdb.adminPassword.result,
    secrets.gitea.adminPassword.result,
    secrets.gitea.commonPassword.result,
    secrets.gitea.auxPassword.result,
    secrets.gitea.readonlyPassword.result,
    secrets.gitea.secretKey.result,
    secrets.postgres.passsword.result,
    secrets.redis.passsword.result,
    keys.appKey.privateKeyPem,
    keys.appKey.publicKeyPem,
    keys.samlCert.certPem,
    redis.replicationGroup?.primaryEndpointAddress,
    elasticsearch.searchDomain?.endpoint,
    rds.analytics.address,
    rds.analytics.port.apply(v => v.toString()),
    rds.analytics.username,
]).apply(([
    accountId_,
    datasetsBucketName,
    inputfilesBucketName,
    licensesBucketName,
    publicBucketName,
    resultsBucketName,
    tempBucketName,
    dedicatedMachineLaunchTemplateID,
    dedicatedMachineLaunchTemplateVersion,
    reCaptchaApiKey,
    googleClientSecret,
    systemAPIKey,
    segmentBackendApiKey,
    segmentFrontendApiKey,
    analyticsDbPassword,
    couchdbAdminPassword,
    giteaAdminPassword,
    giteaCommonPassword,
    giteaAuxPassword,
    giteaReadonlyPassword,
    giteaSecretKey,
    postgresPassword,
    redisPassword,
    appPrivateKey,
    appPublicKey,
    samlCert,
    redisAddress,
    elasticsearchAddress,
    analyticsDbAddress,
    analyticsDbPort,
    analyticsDbUsername,
]) => {
    config.aws.accountId = accountId_

    return {
        config,
        buckets: {
            datasets: datasetsBucketName,
            inputfiles: inputfilesBucketName,
            licenses: licensesBucketName,
            public: publicBucketName,
            results: resultsBucketName,
            temp: tempBucketName,
        },
        dedicatedMachineLaunchTemplateID,
        dedicatedMachineLaunchTemplateVersion,
        secrets: {
            analyticsdb: {
                password: analyticsDbPassword,
            },
            auth: {
                builtin: {
                    reCaptchaApiKey: reCaptchaApiKey,
                },
                google: {
                    clientSecret: googleClientSecret,
                },
                systemAPIKey,
            },
            couchdb: {
                adminPassword: couchdbAdminPassword,
            },
            gitea: {
                adminPassword: giteaAdminPassword,
                commonPassword: giteaCommonPassword,
                auxPassword: giteaAuxPassword,
                readonlyPassword: giteaReadonlyPassword,
                secretKey: giteaSecretKey,
            },
            postgres: {
                password: postgresPassword,
            },
            segment: {
                backendApiKey: segmentBackendApiKey,
                frontendApiKey: segmentFrontendApiKey,
            },
            redis: {
                password: redisPassword,
            },
        },
        services: {
            redis: {
                address: redisAddress,
            },
            elasticsearch: {
                address: elasticsearchAddress,
            },
            analyticsdb: {
                host: analyticsDbAddress,
                port: analyticsDbPort,
                username: analyticsDbUsername,
            },
        },
        keys: {
            app: {
                privateKey: appPrivateKey,
                publicKey: appPublicKey,
            },
            saml: {
                privateKey: appPrivateKey,
                publicCert: samlCert,
            },
        },
        slotsConfig: slots.config,
    }
})

s3.configBucket.upload({ render: true, context })
