import * as pulumi from "@pulumi/pulumi"
import * as aws from "@pulumi/aws"
import * as config from "../config"
import * as keys from "../keys"
import * as s3 from "."
import * as dedicatedMachines from "../dedicated-machines"
import * as secrets from "../secrets"

const accountId = pulumi.output(aws.getCallerIdentity()).accountId

// Upload objects
// Warning: Due to the lack of variadic generics in TypeScript, pulumi.all has rather problmatic
// typing, bascially everything here must be a string
pulumi.all([
    accountId,
    s3.assetsBucket.bucket,
    s3.datasetsBucket.bucket,
    s3.licensesBucket.bucket,
    s3.publicBucket.bucket,
    s3.resultsBucket.bucket,
    s3.tempBucket.bucket,
    s3.templatesBucket.bucket,
    dedicatedMachines.launchTemplate.id,
    dedicatedMachines.launchTemplate.latestVersion.apply(v => v.toString()),
    config.auth.builtin.reCaptchaApiKey,
    config.auth.google.clientSecret,
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
]).apply(([
    accountId_,
    assetsBucketName,
    datasetsBucketName,
    licensesBucketName,
    publicBucketName,
    resultsBucketName,
    tempBucketName,
    templatesBucketName,
    dedicatedMachineLaunchTemplateID,
    dedicatedMachineLaunchTemplateVersion,
    reCaptchaApiKey,
    googleClientSecret,
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
]) => {
    config.aws.accountId = accountId_

    const context = {
        config,
        buckets: {
            assets: assetsBucketName,
            datasets: datasetsBucketName,
            licenses: licensesBucketName,
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
            redis: {
                password: redisPassword,
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
            }
        }
    }

    s3.assetsBucket.upload({ cacheControl: "max-age=86400", context })
    s3.configBucket.upload({ render: true, context })
    s3.templatesBucket.upload({ context })
})
