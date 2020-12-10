import * as aws from "@pulumi/aws"
import * as pulumi from "@pulumi/pulumi"

import * as config from "../config"
import * as dedicatedMachines from "../dedicated-machines"
import * as elasticsearch from "../elasticsearch"
import * as keys from "../keys"
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
    s3.assetsBucket.bucket,
    s3.datasetsBucket.bucket,
    s3.inputFilesBucket.bucket,
    s3.publicBucket.bucket,
    s3.resultsBucket.bucket,
    s3.tempBucket.bucket,
    s3.templatesBucket.bucket,
    dedicatedMachines.launchTemplate.id,
    dedicatedMachines.launchTemplate.latestVersion.apply(v => v.toString()),
    config.auth.builtin.reCaptchaApiKey,
    config.auth.google.clientSecret,
    config.auth.systemAPIKey,
    config.services.segment.backend.apiKey,
    config.services.segment.frontend.apiKey,
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
]).apply(([
    accountId_,
    assetsBucketName,
    datasetsBucketName,
    inputfilesBucketName,
    publicBucketName,
    resultsBucketName,
    tempBucketName,
    templatesBucketName,
    dedicatedMachineLaunchTemplateID,
    dedicatedMachineLaunchTemplateVersion,
    reCaptchaApiKey,
    googleClientSecret,
    systemAPIKey,
    segmentBackendApiKey,
    segmentFrontendApiKey,
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
]) => {
    config.aws.accountId = accountId_

    return {
        config,
        buckets: {
            assets: assetsBucketName,
            datasets: datasetsBucketName,
            inputfiles: inputfilesBucketName,
            public: publicBucketName,
            results: resultsBucketName,
            temp: tempBucketName,
            templates: templatesBucketName,
        },
        dedicatedMachineLaunchTemplateID,
        dedicatedMachineLaunchTemplateVersion,
        secrets: {
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

s3.assetsBucket.upload({ cacheControl: "max-age=86400", context })
s3.configBucket.upload({ render: true, context })
s3.templatesBucket.upload({ context })
